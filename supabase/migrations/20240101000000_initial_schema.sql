-- ============================================================
--  EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ============================================================
--  ENUMS
-- ============================================================
create type public.order_status as enum (
  'pending',    -- esperando confirmación del restaurante
  'confirmed',  -- restaurante aceptó
  'preparing',  -- en cocina
  'ready',      -- listo para recogida
  'picked_up',  -- repartidor recogió
  'in_transit', -- en camino
  'delivered',  -- entregado
  'cancelled'
);

create type public.driver_status      as enum ('available', 'busy', 'offline');
create type public.vehicle_type       as enum ('bicycle', 'motorcycle', 'car');
create type public.commission_status  as enum ('pending', 'paid');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled');

-- ============================================================
--  PROFILES  (extiende auth.users)
-- ============================================================
create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text        not null,
  phone       text,
  avatar_url  text,
  role        text        not null default 'customer'
              check (role in ('admin', 'restaurant_owner', 'driver', 'customer')),
  created_at  timestamptz not null default now()
);

-- ============================================================
--  SUBSCRIPTION PLANS
--  Starter $49/mes · 1 sucursal
--  Business $39/sucursal · hasta 10
--  Enterprise $45/sucursal · 11+
-- ============================================================
create table public.subscription_plans (
  id                   uuid          primary key default uuid_generate_v4(),
  name                 text          not null unique,  -- 'starter'|'business'|'enterprise'
  display_name         text          not null,
  price_per_branch_usd numeric(10,2) not null check (price_per_branch_usd > 0),
  min_branches         integer       not null default 1 check (min_branches >= 1),
  -- null = sin límite superior
  max_branches         integer       check (max_branches is null or max_branches >= min_branches),
  description          text,
  features             jsonb,
  is_active            boolean       not null default true,
  created_at           timestamptz   not null default now()
);

-- ============================================================
--  RESTAURANTS  (marca / empresa)
--  El modelo de ingresos es por suscripción, no comisión por pedido.
-- ============================================================
create table public.restaurants (
  id               uuid          primary key default uuid_generate_v4(),
  owner_id         uuid          not null references auth.users(id),
  name             text          not null,
  slug             text          not null unique,
  description      text,
  logo_url         text,
  cover_url        text,
  phone            text,
  email            text,
  address          text          not null,   -- dirección fiscal / HQ
  lat              double precision,
  lng              double precision,
  min_order_amount numeric(10,2) not null default 0.00 check (min_order_amount >= 0),
  is_active        boolean       not null default true,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

-- ============================================================
--  RESTAURANT SUBSCRIPTIONS
-- ============================================================
create table public.restaurant_subscriptions (
  id                   uuid                 primary key default uuid_generate_v4(),
  restaurant_id        uuid                 not null unique
                       references public.restaurants(id) on delete cascade,
  plan_id              uuid                 not null
                       references public.subscription_plans(id),
  branch_count         integer              not null default 1 check (branch_count >= 1),
  -- snapshot del precio calculado: price_per_branch * branch_count
  monthly_total_usd    numeric(10,2)        not null check (monthly_total_usd > 0),
  status               subscription_status  not null default 'trialing',
  trial_ends_at        timestamptz,
  current_period_start timestamptz          not null default now(),
  current_period_end   timestamptz          not null,
  cancelled_at         timestamptz,
  created_at           timestamptz          not null default now(),
  updated_at           timestamptz          not null default now()
);

-- ============================================================
--  BRANCHES  (sucursales / ubicaciones físicas)
-- ============================================================
create table public.branches (
  id                     uuid        primary key default uuid_generate_v4(),
  restaurant_id          uuid        not null references public.restaurants(id) on delete cascade,
  name                   text        not null,   -- "Sucursal Centro", "Sucursal Norte"
  address                text        not null,
  lat                    double precision,
  lng                    double precision,
  phone                  text,
  estimated_delivery_min integer     not null default 30,
  is_active              boolean     not null default true,
  is_open                boolean     not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ============================================================
--  CATEGORIES  (por restaurante)
-- ============================================================
create table public.categories (
  id            uuid        primary key default uuid_generate_v4(),
  restaurant_id uuid        not null references public.restaurants(id) on delete cascade,
  name          text        not null,
  description   text,
  image_url     text,
  sort_order    integer     not null default 0,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now()
);

-- ============================================================
--  PRODUCTS
-- ============================================================
create table public.products (
  id            uuid          primary key default uuid_generate_v4(),
  restaurant_id uuid          not null references public.restaurants(id) on delete cascade,
  category_id   uuid          references public.categories(id) on delete set null,
  name          text          not null,
  description   text,
  price         numeric(10,2) not null check (price >= 0),
  image_url     text,
  is_available  boolean       not null default true,
  sort_order    integer       not null default 0,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

-- ============================================================
--  CUSTOMERS
-- ============================================================
create table public.customers (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text        not null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table public.customer_addresses (
  id          uuid        primary key default uuid_generate_v4(),
  customer_id uuid        not null references public.customers(id) on delete cascade,
  label       text        not null default 'Casa',
  address     text        not null,
  lat         double precision,
  lng         double precision,
  is_default  boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
--  DRIVERS  (socios repartidores)
--  Modelo: plataforma retiene 15% del cargo de envío,
--          repartidor cobra el 85% restante (earnings_rate = 0.85)
-- ============================================================
create table public.drivers (
  id            uuid          primary key default uuid_generate_v4(),
  user_id       uuid          not null unique references auth.users(id) on delete cascade,
  full_name     text          not null,
  phone         text          not null,
  avatar_url    text,
  vehicle_type  vehicle_type  not null default 'motorcycle',
  -- porcentaje que retiene el repartidor del cargo de envío
  earnings_rate numeric(5,4)  not null default 0.85
                check (earnings_rate > 0 and earnings_rate <= 1),
  status        driver_status not null default 'offline',
  current_lat   double precision,
  current_lng   double precision,
  is_active     boolean       not null default true,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

-- ============================================================
--  DELIVERY FEE TIERS  (tarifas de envío por distancia en USD)
--  0–2 km    $1.50
--  2–5 km    $2.50
--  5–10 km   $4.00
--  10–15 km  $6.00
--  15 km+    $8.00
-- ============================================================
create table public.delivery_fee_tiers (
  id        uuid          primary key default uuid_generate_v4(),
  min_km    numeric(6,2)  not null check (min_km >= 0),
  -- null = sin límite superior (último tramo)
  max_km    numeric(6,2)  check (max_km is null or max_km > min_km),
  fee_usd   numeric(10,2) not null check (fee_usd >= 0),
  label     text          not null,   -- "0–2 km", "15 km+"
  is_active boolean       not null default true,
  created_at timestamptz  not null default now(),
  unique (min_km)
);

-- ============================================================
--  ORDERS
-- ============================================================
create table public.orders (
  id               uuid          primary key default uuid_generate_v4(),
  customer_id      uuid          not null references public.customers(id),
  restaurant_id    uuid          not null references public.restaurants(id),
  branch_id        uuid          references public.branches(id),
  driver_id        uuid          references public.drivers(id),
  status           order_status  not null default 'pending',
  -- Montos
  subtotal         numeric(10,2) not null check (subtotal >= 0),
  -- delivery_fee calculado con calculate_delivery_fee() al crear el pedido
  delivery_fee     numeric(10,2) not null default 0 check (delivery_fee >= 0),
  discount_amount  numeric(10,2) not null default 0 check (discount_amount >= 0),
  total_amount     numeric(10,2) generated always as
                   (subtotal + delivery_fee - discount_amount) stored,
  -- Entrega
  delivery_address text          not null,
  delivery_lat     double precision,
  delivery_lng     double precision,
  notes            text,
  -- Timestamps por estado (llenados automáticamente por trigger)
  confirmed_at     timestamptz,
  preparing_at     timestamptz,
  ready_at         timestamptz,
  picked_up_at     timestamptz,
  delivered_at     timestamptz,
  cancelled_at     timestamptz,
  cancellation_reason text,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

-- ============================================================
--  ORDER ITEMS  (snapshot inmutable al momento de ordenar)
-- ============================================================
create table public.order_items (
  id                uuid          primary key default uuid_generate_v4(),
  order_id          uuid          not null references public.orders(id) on delete cascade,
  product_id        uuid          references public.products(id) on delete set null,
  -- snapshot
  product_name      text          not null,
  product_image_url text,
  unit_price        numeric(10,2) not null check (unit_price >= 0),
  quantity          integer       not null check (quantity > 0),
  subtotal          numeric(10,2) generated always as (unit_price * quantity) stored,
  notes             text
);

-- ============================================================
--  COMMISSIONS
--  Modelo definitivo:
--    · Restaurante cobra 100% del subtotal (sin comisión por pedido,
--      paga mediante suscripción mensual).
--    · Plataforma retiene 15% del cargo de envío.
--    · Repartidor cobra earnings_rate × delivery_fee (85% por defecto).
-- ============================================================
create table public.commissions (
  id           uuid              primary key default uuid_generate_v4(),
  order_id     uuid              not null unique references public.orders(id),

  -- Restaurante
  restaurant_id      uuid          not null references public.restaurants(id),
  restaurant_earnings numeric(10,2) not null,  -- = order_subtotal (100%)

  -- Repartidor + plataforma
  driver_id                  uuid         references public.drivers(id),
  driver_earnings_rate       numeric(5,4),           -- snapshot al momento de entrega
  driver_earnings            numeric(10,2),           -- delivery_fee × driver_earnings_rate
  platform_commission_rate   numeric(5,4) not null default 0.15,
  platform_commission        numeric(10,2) not null,  -- delivery_fee × 0.15

  -- Snapshot del pedido
  order_subtotal          numeric(10,2) not null,
  delivery_fee            numeric(10,2) not null,
  -- total_platform_earnings = platform_commission (restaurantes pagan vía suscripción)
  total_platform_earnings numeric(10,2) not null,

  -- Pago
  status              commission_status not null default 'pending',
  restaurant_paid_at  timestamptz,
  driver_paid_at      timestamptz,
  created_at          timestamptz       not null default now()
);

-- ============================================================
--  INDEXES
-- ============================================================
create index profiles_role_idx               on public.profiles(role);
create index restaurants_owner_idx           on public.restaurants(owner_id);
create index restaurants_slug_idx            on public.restaurants(slug);
create index restaurant_subs_restaurant_idx  on public.restaurant_subscriptions(restaurant_id);
create index restaurant_subs_status_idx      on public.restaurant_subscriptions(status);
create index branches_restaurant_idx         on public.branches(restaurant_id);
create index categories_restaurant_idx       on public.categories(restaurant_id);
create index products_restaurant_idx         on public.products(restaurant_id);
create index products_category_idx           on public.products(category_id);
create index customer_addresses_customer_idx on public.customer_addresses(customer_id);
create index orders_customer_idx             on public.orders(customer_id);
create index orders_restaurant_idx           on public.orders(restaurant_id);
create index orders_branch_idx               on public.orders(branch_id);
create index orders_driver_idx               on public.orders(driver_id);
create index orders_status_idx               on public.orders(status);
create index orders_created_at_idx           on public.orders(created_at desc);
create index commissions_restaurant_idx      on public.commissions(restaurant_id);
create index commissions_driver_idx          on public.commissions(driver_id);
create index commissions_status_idx          on public.commissions(status);
create index delivery_fee_tiers_min_km_idx   on public.delivery_fee_tiers(min_km);
