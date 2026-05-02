-- ============================================================
--  FUNCIÓN: calculate_delivery_fee
--  Calcula el cargo de envío según la distancia entre dos puntos.
--  Requiere la extensión postgis y la tabla delivery_fee_tiers.
-- ============================================================
create or replace function public.calculate_delivery_fee(
  origin_lat double precision,
  origin_lng double precision,
  dest_lat   double precision,
  dest_lng   double precision
)
returns numeric(10,2) language sql stable security definer as $$
  with distance as (
    select round(
      (st_distance(
        st_point(origin_lng, origin_lat)::geography,
        st_point(dest_lng,   dest_lat  )::geography
      ) / 1000.0)::numeric, 3
    ) as km
  )
  select t.fee_usd
  from   public.delivery_fee_tiers t, distance d
  where  t.is_active = true
    and  d.km >= t.min_km
    and  (t.max_km is null or d.km < t.max_km)
  order  by t.min_km desc
  limit  1;
$$;

-- ============================================================
--  FUNCIÓN: updated_at automático
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.handle_updated_at();

create trigger restaurant_subs_updated_at
  before update on public.restaurant_subscriptions
  for each row execute function public.handle_updated_at();

create trigger branches_updated_at
  before update on public.branches
  for each row execute function public.handle_updated_at();

create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create trigger drivers_updated_at
  before update on public.drivers
  for each row execute function public.handle_updated_at();

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

-- ============================================================
--  FUNCIÓN: crear perfil al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  FUNCIÓN: registrar timestamps al cambiar estado del pedido
-- ============================================================
create or replace function public.handle_order_status_change()
returns trigger language plpgsql as $$
begin
  if new.status = old.status then
    return new;
  end if;
  case new.status
    when 'confirmed'  then new.confirmed_at  = now();
    when 'preparing'  then new.preparing_at  = now();
    when 'ready'      then new.ready_at      = now();
    when 'picked_up'  then new.picked_up_at  = now();
    when 'delivered'  then new.delivered_at  = now();
    when 'cancelled'  then new.cancelled_at  = now();
    else null;
  end case;
  return new;
end;
$$;

create trigger orders_status_timestamps
  before update on public.orders
  for each row execute function public.handle_order_status_change();

-- ============================================================
--  FUNCIÓN: gestionar estado del repartidor por asignación
-- ============================================================
create or replace function public.handle_driver_assignment()
returns trigger language plpgsql security definer as $$
begin
  -- Nuevo repartidor asignado → busy
  if new.driver_id is not null and new.driver_id is distinct from old.driver_id then
    update public.drivers set status = 'busy' where id = new.driver_id;
    -- Liberar al repartidor anterior si existía
    if old.driver_id is not null then
      update public.drivers set status = 'available' where id = old.driver_id;
    end if;
  end if;
  -- Pedido finalizado → liberar repartidor
  if new.status in ('delivered', 'cancelled')
     and old.status not in ('delivered', 'cancelled')
     and new.driver_id is not null
  then
    update public.drivers set status = 'available' where id = new.driver_id;
  end if;
  return new;
end;
$$;

create trigger orders_driver_status
  after update on public.orders
  for each row execute function public.handle_driver_assignment();

-- ============================================================
--  FUNCIÓN: calcular y registrar comisiones al entregar
--
--  Modelo definitivo:
--    restaurant_earnings  = subtotal × 1.00  (sin comisión por pedido)
--    platform_commission  = delivery_fee × 0.15
--    driver_earnings      = delivery_fee × driver.earnings_rate (0.85 default)
-- ============================================================
create or replace function public.handle_commission_on_delivery()
returns trigger language plpgsql security definer as $$
declare
  v_driver              public.drivers%rowtype;
  v_platform_rate       numeric(5,4) := 0.15;
  v_platform_commission numeric(10,2);
  v_driver_earn         numeric(10,2);
begin
  -- Solo actuar al transicionar a 'delivered'
  if new.status != 'delivered' or old.status = 'delivered' then
    return new;
  end if;

  -- Evitar duplicados
  if exists (select 1 from public.commissions where order_id = new.id) then
    return new;
  end if;

  -- Comisión de plataforma: 15% del cargo de envío
  v_platform_commission := round(new.delivery_fee * v_platform_rate, 2);

  -- Ganancia del repartidor
  if new.driver_id is not null then
    select * into v_driver from public.drivers where id = new.driver_id;
    v_driver_earn := round(new.delivery_fee * v_driver.earnings_rate, 2);
  else
    v_driver_earn := 0;
    -- Sin repartidor, la plataforma toma el 100% del delivery_fee
    v_platform_commission := new.delivery_fee;
  end if;

  insert into public.commissions (
    order_id,
    restaurant_id,
    restaurant_earnings,
    driver_id,
    driver_earnings_rate,
    driver_earnings,
    platform_commission_rate,
    platform_commission,
    order_subtotal,
    delivery_fee,
    total_platform_earnings
  ) values (
    new.id,
    new.restaurant_id,
    new.subtotal,                         -- restaurante cobra 100% del subtotal
    new.driver_id,
    case when new.driver_id is not null then v_driver.earnings_rate else null end,
    v_driver_earn,
    v_platform_rate,
    v_platform_commission,
    new.subtotal,
    new.delivery_fee,
    v_platform_commission                 -- plataforma gana solo del delivery
  );

  return new;
end;
$$;

create trigger orders_auto_commission
  after update on public.orders
  for each row execute function public.handle_commission_on_delivery();

-- ============================================================
--  FUNCIÓN: garantizar una sola dirección predeterminada
-- ============================================================
create or replace function public.handle_default_address()
returns trigger language plpgsql as $$
begin
  if new.is_default = true then
    update public.customer_addresses
    set    is_default = false
    where  customer_id = new.customer_id and id != new.id;
  end if;
  return new;
end;
$$;

create trigger addresses_single_default
  after insert or update of is_default on public.customer_addresses
  for each row when (new.is_default = true)
  execute function public.handle_default_address();

-- ============================================================
--  FUNCIÓN: validar que branch_count esté dentro del rango del plan
-- ============================================================
create or replace function public.validate_subscription_branch_count()
returns trigger language plpgsql as $$
declare
  v_plan public.subscription_plans%rowtype;
begin
  select * into v_plan from public.subscription_plans where id = new.plan_id;

  if new.branch_count < v_plan.min_branches then
    raise exception 'El plan % requiere al menos % sucursal(es).',
      v_plan.display_name, v_plan.min_branches;
  end if;

  if v_plan.max_branches is not null and new.branch_count > v_plan.max_branches then
    raise exception 'El plan % permite máximo % sucursal(es).',
      v_plan.display_name, v_plan.max_branches;
  end if;

  -- Recalcular el total mensual automáticamente
  new.monthly_total_usd := round(v_plan.price_per_branch_usd * new.branch_count, 2);

  return new;
end;
$$;

create trigger restaurant_subs_validate
  before insert or update on public.restaurant_subscriptions
  for each row execute function public.validate_subscription_branch_count();
