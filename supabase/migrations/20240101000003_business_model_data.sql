-- ============================================================
--  DATOS DE CONFIGURACIÓN DEL MODELO DE NEGOCIO
--  (referencia permanente, no datos de prueba)
-- ============================================================

-- ------------------------------------------------------------
--  PLANES DE SUSCRIPCIÓN
-- ------------------------------------------------------------
insert into public.subscription_plans
  (id, name, display_name, price_per_branch_usd, min_branches, max_branches, description, features)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    'starter',
    'Starter',
    49.00,
    1, 1,
    'Ideal para restaurantes con una sola ubicación.',
    '["1 sucursal", "Panel de administración", "App de repartidores", "Soporte por email"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'business',
    'Business',
    39.00,
    1, 10,
    'Para cadenas en expansión con hasta 10 sucursales.',
    '["Hasta 10 sucursales", "Panel multi-sucursal", "App de repartidores", "Analíticas avanzadas", "Soporte prioritario"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'enterprise',
    'Enterprise',
    45.00,
    11, null,
    'Para grandes cadenas con 11 o más sucursales.',
    '["Sucursales ilimitadas", "Panel centralizado", "API dedicada", "Gerente de cuenta", "SLA garantizado", "Integración con sistemas propios"]'::jsonb
  );

-- ------------------------------------------------------------
--  TARIFAS DE ENVÍO POR DISTANCIA (USD)
-- ------------------------------------------------------------
insert into public.delivery_fee_tiers
  (min_km, max_km, fee_usd, label)
values
  (0.00,  2.00,  1.50, '0–2 km'),
  (2.00,  5.00,  2.50, '2–5 km'),
  (5.00,  10.00, 4.00, '5–10 km'),
  (10.00, 15.00, 6.00, '10–15 km'),
  (15.00, null,  8.00, '15 km+');
