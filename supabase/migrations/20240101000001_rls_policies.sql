-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles                enable row level security;
alter table public.subscription_plans      enable row level security;
alter table public.restaurants             enable row level security;
alter table public.restaurant_subscriptions enable row level security;
alter table public.branches                enable row level security;
alter table public.categories              enable row level security;
alter table public.products                enable row level security;
alter table public.customers               enable row level security;
alter table public.customer_addresses      enable row level security;
alter table public.drivers                 enable row level security;
alter table public.delivery_fee_tiers      enable row level security;
alter table public.orders                  enable row level security;
alter table public.order_items             enable row level security;
alter table public.commissions             enable row level security;

-- ============================================================
--  HELPER FUNCTIONS (security definer = corren como superuser)
-- ============================================================

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Devuelve el id del driver del usuario autenticado (o null)
create or replace function public.my_driver_id()
returns uuid language sql security definer stable as $$
  select id from public.drivers where user_id = auth.uid() limit 1;
$$;

-- True si el usuario autenticado es dueño del restaurante dado
create or replace function public.owns_restaurant(p_restaurant_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.restaurants
    where id = p_restaurant_id and owner_id = auth.uid()
  );
$$;

-- True si la sucursal pertenece al restaurante del usuario
create or replace function public.owns_branch(p_branch_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.branches b
    join public.restaurants r on r.id = b.restaurant_id
    where b.id = p_branch_id and r.owner_id = auth.uid()
  );
$$;

-- ============================================================
--  PROFILES
-- ============================================================
create policy "profiles_select"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
--  SUBSCRIPTION PLANS  (lectura pública, escritura solo admin)
-- ============================================================
create policy "plans_public_read"
  on public.subscription_plans for select
  using (is_active = true or public.is_admin());

create policy "plans_admin_write"
  on public.subscription_plans for all
  using (public.is_admin());

-- ============================================================
--  RESTAURANTS
-- ============================================================
create policy "restaurants_select"
  on public.restaurants for select
  using (is_active = true or owner_id = auth.uid() or public.is_admin());

create policy "restaurants_insert_owner"
  on public.restaurants for insert
  with check (owner_id = auth.uid());

create policy "restaurants_update_owner"
  on public.restaurants for update
  using (owner_id = auth.uid() or public.is_admin());

create policy "restaurants_delete_admin"
  on public.restaurants for delete
  using (public.is_admin());

-- ============================================================
--  RESTAURANT SUBSCRIPTIONS
-- ============================================================
create policy "subs_select_owner"
  on public.restaurant_subscriptions for select
  using (public.owns_restaurant(restaurant_id) or public.is_admin());

create policy "subs_admin_write"
  on public.restaurant_subscriptions for all
  using (public.is_admin());

-- ============================================================
--  BRANCHES
-- ============================================================
create policy "branches_select"
  on public.branches for select
  using (
    (is_active = true and exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.is_active = true
    ))
    or public.owns_restaurant(restaurant_id)
    or public.is_admin()
  );

create policy "branches_write_owner"
  on public.branches for all
  using (public.owns_restaurant(restaurant_id) or public.is_admin());

-- ============================================================
--  CATEGORIES
-- ============================================================
create policy "categories_select"
  on public.categories for select
  using (
    (is_active = true and exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.is_active = true
    ))
    or public.owns_restaurant(restaurant_id)
    or public.is_admin()
  );

create policy "categories_write_owner"
  on public.categories for all
  using (public.owns_restaurant(restaurant_id) or public.is_admin());

-- ============================================================
--  PRODUCTS
-- ============================================================
create policy "products_select"
  on public.products for select
  using (
    (is_available = true and exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.is_active = true
    ))
    or public.owns_restaurant(restaurant_id)
    or public.is_admin()
  );

create policy "products_write_owner"
  on public.products for all
  using (public.owns_restaurant(restaurant_id) or public.is_admin());

-- ============================================================
--  CUSTOMERS
-- ============================================================
create policy "customers_select"
  on public.customers for select
  using (auth.uid() = id or public.is_admin());

create policy "customers_update_own"
  on public.customers for update
  using (auth.uid() = id);

-- ============================================================
--  CUSTOMER ADDRESSES
-- ============================================================
create policy "addresses_own"
  on public.customer_addresses for all
  using (customer_id = auth.uid());

-- ============================================================
--  DRIVERS
-- ============================================================
create policy "drivers_select"
  on public.drivers for select
  using (user_id = auth.uid() or public.is_admin());

create policy "drivers_update_own"
  on public.drivers for update
  using (user_id = auth.uid() or public.is_admin());

create policy "drivers_admin_insert"
  on public.drivers for insert
  with check (public.is_admin());

-- ============================================================
--  DELIVERY FEE TIERS  (lectura pública, admin escribe)
-- ============================================================
create policy "tiers_public_read"
  on public.delivery_fee_tiers for select
  using (is_active = true or public.is_admin());

create policy "tiers_admin_write"
  on public.delivery_fee_tiers for all
  using (public.is_admin());

-- ============================================================
--  ORDERS
-- ============================================================
create policy "orders_select"
  on public.orders for select
  using (
    customer_id = auth.uid()
    or public.owns_restaurant(restaurant_id)
    or public.owns_branch(branch_id)
    or driver_id = public.my_driver_id()
    or public.is_admin()
  );

create policy "orders_insert_customer"
  on public.orders for insert
  with check (customer_id = auth.uid());

create policy "orders_update"
  on public.orders for update
  using (
    public.owns_restaurant(restaurant_id)
    or driver_id = public.my_driver_id()
    or public.is_admin()
  );

-- ============================================================
--  ORDER ITEMS
-- ============================================================
create policy "order_items_select"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or public.owns_restaurant(o.restaurant_id)
          or o.driver_id = public.my_driver_id()
          or public.is_admin()
        )
    )
  );

create policy "order_items_insert"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = auth.uid()
    )
  );

-- ============================================================
--  COMMISSIONS
-- ============================================================
create policy "commissions_select"
  on public.commissions for select
  using (
    public.owns_restaurant(restaurant_id)
    or driver_id = public.my_driver_id()
    or public.is_admin()
  );

-- Solo triggers con security definer pueden insertar
create policy "commissions_system_insert"
  on public.commissions for insert
  with check (public.is_admin());

create policy "commissions_admin_update"
  on public.commissions for update
  using (public.is_admin());
