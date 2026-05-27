-- ============================================================
-- ClearingOps — Esquema de base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: archivos
-- Registro de cada archivo recibido (SVXP, CTF, IPM)
-- ============================================================
create table if not exists archivos (
  id            uuid primary key default uuid_generate_v4(),
  nombre        text not null,
  tipo          text not null check (tipo in ('SVXP', 'CTF', 'IPM')),
  marca         text not null check (marca in ('VISA', 'MASTERCARD', 'MAESTRO', 'AMEX')),
  fecha_proceso date not null,
  recibido_at   timestamptz not null default now(),
  total_trx     integer not null default 0,
  estado        text not null default 'procesando' check (estado in ('procesando', 'ok', 'error', 'advertencia')),
  ruta          text,
  notas         text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- TABLA: transacciones
-- Cada TRX individual parseada desde los archivos
-- ============================================================
create table if not exists transacciones (
  id              uuid primary key default uuid_generate_v4(),
  archivo_id      uuid references archivos(id) on delete cascade,
  trx_id          text not null,
  tipo_trx        text not null,   -- TC05, TC06, TC25, TC26, etc.
  marca           text not null check (marca in ('VISA', 'MASTERCARD', 'MAESTRO', 'AMEX', 'UNKNOWN')),
  monto           bigint not null, -- en centavos para evitar decimales
  moneda          text not null default 'CLP',
  fecha_trx       timestamptz not null,
  estado          text not null default 'pendiente' check (estado in (
                    'pendiente', 'procesada', 'enviada', 'confirmada',
                    'error', 'frozen', 'excluida'
                  )),
  codigo_op       text,            -- OPST0400, OPST0500, etc.
  arn             text,
  fecha_arn       date,            -- fecha juliana del ARN
  cod_comercio    text,
  cod_sucursal    text,
  nombre_comercio text,
  mcc             text,
  archivo_ctf_id  uuid references archivos(id),
  file_id         text,            -- file_id asignado en outgoing
  es_cuota        boolean default false,
  numero_cuota    integer,
  total_cuotas    integer,
  trx_original_id text,            -- para anulaciones CIT/MIT
  notas           text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- TABLA: cuadratura_diaria
-- Resultado del proceso de cuadratura por día y marca
-- ============================================================
create table if not exists cuadratura_diaria (
  id                  uuid primary key default uuid_generate_v4(),
  fecha               date not null,
  marca               text not null,
  trx_svxp            integer not null default 0,
  trx_ctf             integer not null default 0,
  trx_ipm             integer not null default 0,
  trx_error           integer not null default 0,
  trx_frozen          integer not null default 0,
  trx_excluidas       integer not null default 0,
  diferencia          integer generated always as (trx_svxp - trx_ctf - trx_error - trx_excluidas) stored,
  estado              text not null default 'pendiente' check (estado in ('ok', 'diferencia', 'pendiente', 'error')),
  ejecutado_at        timestamptz,
  notas               text,
  created_at          timestamptz not null default now(),
  unique(fecha, marca)
);

-- ============================================================
-- TABLA: alertas
-- Alertas generadas automáticamente por el motor
-- ============================================================
create table if not exists alertas (
  id            uuid primary key default uuid_generate_v4(),
  tipo          text not null check (tipo in (
                  'svxp_no_llegó', 'diferencia_cuadratura',
                  'trx_opst500', 'arn_incorrecto',
                  'trx_frozen', 'ctf_retrasado', 'ipm_diferencia'
                )),
  severidad     text not null check (severidad in ('critica', 'alta', 'media', 'baja')),
  marca         text,
  fecha_proceso date,
  titulo        text not null,
  detalle       text,
  cantidad_trx  integer default 0,
  estado        text not null default 'activa' check (estado in ('activa', 'en_revision', 'resuelta', 'ignorada')),
  archivo_id    uuid references archivos(id),
  jira_ticket   text,
  resuelto_at   timestamptz,
  resuelto_por  text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- TABLA: configuracion
-- Parámetros del sistema por cliente/marca
-- ============================================================
create table if not exists configuracion (
  id              uuid primary key default uuid_generate_v4(),
  clave           text not null unique,
  valor           text not null,
  descripcion     text,
  updated_at      timestamptz not null default now()
);

-- Valores por defecto
insert into configuracion (clave, valor, descripcion) values
  ('ventana_svxp_minutos', '60', 'Minutos sin SVXP antes de generar alerta'),
  ('hora_cuadratura', '23:30', 'Hora de ejecución del proceso de cuadratura diaria'),
  ('hora_ctf_esperada', '16:00', 'Hora esperada de generación del CTF'),
  ('jira_url', '', 'URL base del Jira para creación automática de tickets'),
  ('email_alertas', '', 'Email para recibir alertas críticas'),
  ('slack_webhook', '', 'Webhook de Slack para alertas')
on conflict (clave) do nothing;

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index if not exists idx_transacciones_fecha    on transacciones(fecha_trx);
create index if not exists idx_transacciones_marca    on transacciones(marca);
create index if not exists idx_transacciones_estado   on transacciones(estado);
create index if not exists idx_transacciones_archivo  on transacciones(archivo_id);
create index if not exists idx_alertas_estado         on alertas(estado);
create index if not exists idx_alertas_severidad      on alertas(severidad);
create index if not exists idx_cuadratura_fecha       on cuadratura_diaria(fecha);
create index if not exists idx_archivos_fecha         on archivos(fecha_proceso);
create index if not exists idx_archivos_tipo          on archivos(tipo);

-- ============================================================
-- ROW LEVEL SECURITY (básico para MVP)
-- ============================================================
alter table archivos           enable row level security;
alter table transacciones      enable row level security;
alter table cuadratura_diaria  enable row level security;
alter table alertas            enable row level security;
alter table configuracion      enable row level security;

-- Política temporal para desarrollo (reemplazar con auth real)
create policy "acceso_total" on archivos           for all using (true);
create policy "acceso_total" on transacciones      for all using (true);
create policy "acceso_total" on cuadratura_diaria  for all using (true);
create policy "acceso_total" on alertas            for all using (true);
create policy "acceso_total" on configuracion      for all using (true);
