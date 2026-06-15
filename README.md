# KLAP CORE — Payment Operating System

Demo funcional de una plataforma de procesamiento y liquidación de pagos estilo Stripe Dashboard.

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Recharts** (gráficos)
- **Supabase** (Postgres)
- **Lucide Icons**
- Dark mode premium

## Pantallas

1. **Dashboard** — Métricas, gráficos, alertas, actividad reciente, top comercios
2. **Transacciones** — Tabla con filtros por estado, marca, comercio
3. **Clearing** — Batches Visa/Mastercard, estados, generación
4. **Liquidaciones** — Detalle por comercio: bruto, comisión, IVA, retenciones, líquido
5. **Conciliación** — KLAP vs Banco vs Marca, diferencias, alertas de descuadre
6. **Reglas & Fees** — Configuración de comisiones por marca y tipo
7. **Disputas** — Chargebacks, motivos, deadlines, evidencia
8. **Monitor Operacional** — Jobs, errores, warnings, eventos del sistema

## Setup

```bash
npm install
```

Crear archivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### Base de datos

Ejecutar en orden en Supabase SQL Editor:

1. `supabase/schema.sql` — Crea todas las tablas
2. `supabase/seed.sql` — Inserta datos realistas de demo

### Desarrollo

```bash
npm run dev
```

### Deploy

```bash
vercel
```

## Estructura

```
src/
├── app/                  # Pages (App Router)
│   ├── page.tsx          # Dashboard
│   ├── transacciones/
│   ├── clearing/
│   ├── liquidaciones/
│   ├── conciliacion/
│   ├── reglas/
│   ├── disputas/
│   └── monitor/
├── components/           # Client components
│   ├── ui/              # Shared UI primitives
│   ├── sidebar.tsx
│   ├── dashboard-client.tsx
│   └── ...
└── lib/
    ├── supabase.ts      # Queries
    └── utils.ts         # Helpers
```
