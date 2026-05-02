-- ============================================================
--  SEED — datos de prueba para desarrollo local
-- ============================================================

-- Restaurantes de prueba
-- (en producción los crea el flujo de onboarding; aquí insertamos directo)
insert into public.restaurants
  (id, owner_id, name, slug, description, address, lat, lng,
   earnings_rate, delivery_fee, min_order_amount, estimated_delivery_min,
   is_active, is_open)
values
  (
    'b1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000', -- reemplazar con UUID de auth.users real
    'La Burguesía',
    'la-burgues-ia',
    'Las mejores hamburguesas artesanales de la ciudad',
    'Av. Principal 123, Col. Centro',
    19.4326, -99.1332,
    0.78,   -- retiene 78%, plataforma cobra 22%
    2.50, 8.00, 30,
    true, true
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'Pizza Napoli',
    'pizza-napoli',
    'Pizza artesanal al horno de leña',
    'Calle Italia 45, Col. Roma',
    19.4180, -99.1600,
    0.80,   -- retiene 80%, plataforma cobra 20%
    3.00, 12.00, 40,
    true, true
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'Sushi Zen',
    'sushi-zen',
    'Sushi fresco preparado al momento',
    'Blvd. Japonés 78, Col. Polanco',
    19.4320, -99.1950,
    0.75,   -- retiene 75%, plataforma cobra 25%
    4.00, 20.00, 50,
    true, false
  );

-- Categorías por restaurante
insert into public.categories
  (id, restaurant_id, name, sort_order, is_active)
values
  -- La Burguesía
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Hamburguesas',  1, true),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Papas y extras', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Bebidas',        3, true),
  -- Pizza Napoli
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'Pizzas',         1, true),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 'Pastas',         2, true),
  ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 'Postres',        3, true),
  -- Sushi Zen
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000003', 'Rolls',          1, true),
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000003', 'Nigiris',        2, true);

-- Productos
insert into public.products
  (restaurant_id, category_id, name, description, price, is_available, sort_order)
values
  -- La Burguesía - Hamburguesas
  ('b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',
   'Burger Clásica',  'Res, lechuga, tomate, queso americano',     8.50, true, 1),
  ('b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',
   'Burger BBQ',      'Res, salsa BBQ, cebolla caramelizada, bacon',10.50, true, 2),
  ('b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',
   'Burger Vegana',   'Medallón de garbanzo, aguacate, pico de gallo', 9.00, true, 3),
  -- La Burguesía - Papas
  ('b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002',
   'Papas a la francesa', 'Porción grande con sal y especias',       3.50, true, 1),
  ('b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002',
   'Aros de cebolla',     'Crujientes, con salsa ranch',             4.00, true, 2),
  -- La Burguesía - Bebidas
  ('b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003',
   'Refresco 355ml',  'Coca-Cola, Sprite o Fanta',                   2.00, true, 1),
  ('b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003',
   'Agua mineral',    '500ml',                                        1.50, true, 2),
  -- Pizza Napoli - Pizzas
  ('b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000004',
   'Margherita',      'Tomate San Marzano, mozzarella, albahaca',   12.00, true, 1),
  ('b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000004',
   'Pepperoni',       'Tomate, mozzarella, pepperoni artesanal',     14.00, true, 2),
  ('b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000004',
   'Quattro Stagioni','Jamón, champiñones, alcachofas, aceitunas',   15.00, true, 3),
  -- Pizza Napoli - Postres
  ('b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000006',
   'Tiramisú',        'Receta italiana clásica',                      5.00, true, 1),
  ('b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000006',
   'Panna cotta',     'Con coulis de frutos rojos',                   4.50, true, 2),
  -- Sushi Zen - Rolls
  ('b1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000007',
   'Roll California', 'Cangrejo, aguacate, pepino (8 pzas)',          9.00, true, 1),
  ('b1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000007',
   'Roll Spicy Tuna', 'Atún, chile, mayonesa picante (8 pzas)',      10.50, true, 2),
  -- Sushi Zen - Nigiris
  ('b1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000008',
   'Nigiri Salmón',   '2 piezas con wasabi y jengibre',               6.00, true, 1),
  ('b1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000008',
   'Nigiri Atún',     '2 piezas con wasabi y jengibre',               6.50, true, 2);
