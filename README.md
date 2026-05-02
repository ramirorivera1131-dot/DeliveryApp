# Delivery App

Monorepo con panel web (Next.js), app móvil (Expo) y base de datos (Supabase).

## Estructura

```
delivery-app/
├── apps/
│   ├── web/          # Panel de administración — Next.js 15 + Tailwind
│   └── mobile/       # App del repartidor — Expo (React Native)
├── packages/
│   ├── shared/       # Tipos TypeScript y tipos de base de datos compartidos
│   └── ui/           # Componentes UI reutilizables (futuro)
├── supabase/
│   ├── migrations/   # Migraciones SQL
│   └── seeds/        # Datos de prueba
└── docs/
```

## Requisitos

- Node.js 20+
- Yarn 1.x
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

## Inicio rápido

### 1. Instalar dependencias

```bash
yarn install
```

### 2. Configurar Supabase local

```bash
supabase start
```

### 3. Aplicar migraciones y seed

```bash
supabase db reset
```

### 4. Configurar variables de entorno

```bash
# Web
cp apps/web/.env.local.example apps/web/.env.local

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
```

Edita los archivos `.env` con las URLs y claves de tu proyecto Supabase.

### 5. Generar tipos TypeScript desde la base de datos

```bash
yarn db:types
```

### 6. Levantar el panel web

```bash
yarn dev:web
```

### 7. Levantar la app móvil

```bash
yarn dev:mobile
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Panel web | Next.js 15, Tailwind CSS, Recharts |
| App móvil | Expo 52, Expo Router, React Native Maps |
| Base de datos | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth |
| Tiempo real | Supabase Realtime |
| Tipado compartido | TypeScript monorepo |

## Base de datos

### Tablas principales

- `profiles` — usuarios (extiende `auth.users`)
- `categories` — categorías de productos
- `products` — productos del menú
- `drivers` — repartidores y su ubicación
- `orders` — pedidos con estado y asignación
- `order_items` — líneas de cada pedido

### Estados de un pedido

`pending` → `confirmed` → `preparing` → `ready` → `picked_up` → `in_transit` → `delivered`
