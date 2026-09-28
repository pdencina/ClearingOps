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

# Release Watchdog + Seguimiento BPC (módulos aparte, usan Neon en vez de Supabase)
DATABASE_URL=postgresql://usuario:password@ep-xxxx.neon.tech/neondb?sslmode=require

# Seguimiento BPC — sincronización con Jira Cloud (opcional; sin esto, el
# módulo solo permite agregar tickets manualmente, sin sync automático)
JIRA_BASE_URL=https://tuempresa.atlassian.net
JIRA_EMAIL=tu-email@tuempresa.com
JIRA_API_TOKEN=generado-en-id.atlassian.com/manage-profile/security/api-tokens
JIRA_DERIVED_JQL=project in (KLAP, ESV2) AND labels = derivado-bpc AND statusCategory != Done
```

### Base de datos

**KLAP CORE (Supabase)** — ejecutar en orden en el SQL Editor de Supabase:

1. `supabase/schema.sql` — Crea todas las tablas
2. `supabase/seed.sql` — Inserta datos realistas de demo

**Release Watchdog + Seguimiento BPC (Neon)** — ejecutar en orden en el SQL Editor de Neon Console:

1. `neon/schema_release_watchdog.sql` — Crea las tablas del watchdog
2. `neon/seed_release_watchdog.sql` — Carga el release R26.60 de ejemplo
3. `neon/schema_bpc_tickets.sql` — Crea las tablas de seguimiento de tickets derivados a BPC

Sin `DATABASE_URL` configurada, el módulo Release Watchdog opera en modo demo (datos en memoria, no persisten) y lo indica en la UI. Sin `JIRA_*`, el Seguimiento BPC sigue funcionando con tickets agregados manualmente, solo se deshabilita la sincronización automática.

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
