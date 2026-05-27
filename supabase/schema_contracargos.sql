-- ============================================================
-- ClearingOps — Módulo Contracargos (KLAP-837/857)
-- Tracking de contracargos enviados a las marcas y sus respuestas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLA: contracargos
-- Cada contracargo enviado a una marca
-- ============================================================
create table if not exists contracargos (
  id                  uuid primary key default uuid_generate_v4(),
  -- Identificación
  numero_caso         text not null unique,  -- Número de caso interno KLAP
  arn                 text,                  -- ARN de la transacción original
  trx_id_original     text,                  -- ID de la TRX que se está disputando
  -- Montos
  monto               bigint not null,        -- En centavos
  moneda              text not null default 'CLP',
  -- Clasificación
  marca               text not null check (marca in ('VISA','MASTERCARD','MAESTRO','AMEX')),
  tipo_contracargo    text not null check (tipo_contracargo in (
                        'FRAUDE',             -- Transacción no reconocida por el titular
                        'NO_RECIBIDO',        -- Bien/servicio no recibido
                        'DUPLICADO',          -- Cargo duplicado
                        'MONTO_INCORRECTO',   -- Monto diferente al autorizado
                        'CANCELACION',        -- Servicio cancelado pero cobrado
                        'OTRO'
                      )),
  codigo_razon        text,                  -- Código de razón de la marca (ej: Visa 83, MC 4853)
  -- Comercio afectado
  cod_comercio        text,
  cod_sucursal        text,
  nombre_comercio     text,
  -- Fechas críticas
  fecha_transaccion   date not null,         -- Fecha de la TRX original disputada
  fecha_envio         timestamptz not null default now(),  -- Cuándo se envió el contracargo
  fecha_limite        date not null,         -- Fecha límite para respuesta de la marca
  fecha_respuesta     timestamptz,           -- Cuándo respondió la marca
  -- Estado
  estado              text not null default 'enviado' check (estado in (
                        'enviado',            -- Enviado a la marca, esperando respuesta
                        'aceptado',           -- Marca aceptó el contracargo — KLAP gana
                        'rechazado',          -- Marca rechazó el contracargo — KLAP pierde
                        'en_disputa',         -- Marca pidió más documentación
                        'vencido',            -- Venció el plazo sin respuesta
                        'retirado'            -- KLAP retiró el contracargo
                      )),
  -- Resultado económico
  monto_recuperado    bigint default 0,       -- Monto efectivamente recuperado
  -- Documentación
  documentos_adjuntos integer default 0,
  notas               text,
  responsable         text,
  -- Metadata
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- TABLA: contracargos_eventos
-- Historial de cada cambio de estado de un contracargo
-- ============================================================
create table if not exists contracargos_eventos (
  id              uuid primary key default uuid_generate_v4(),
  contracargo_id  uuid references contracargos(id) on delete cascade,
  estado_anterior text,
  estado_nuevo    text not null,
  descripcion     text,
  usuario         text default 'Sistema',
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_contracargos_estado   on contracargos(estado);
create index if not exists idx_contracargos_marca    on contracargos(marca);
create index if not exists idx_contracargos_limite   on contracargos(fecha_limite);
create index if not exists idx_contracargos_eventos  on contracargos_eventos(contracargo_id);

-- ============================================================
-- RLS
-- ============================================================
alter table contracargos         enable row level security;
alter table contracargos_eventos enable row level security;

create policy "acceso_total" on contracargos         for all using (true);
create policy "acceso_total" on contracargos_eventos for all using (true);

-- ============================================================
-- DATOS DE PRUEBA — casos reales simulados
-- ============================================================
insert into contracargos (
  numero_caso, arn, trx_id_original, monto, marca,
  tipo_contracargo, codigo_razon, nombre_comercio, cod_sucursal,
  fecha_transaccion, fecha_envio, fecha_limite, fecha_respuesta,
  estado, monto_recuperado, notas
) values
  -- Enviados esperando respuesta (el problema que describe KLAP-837)
  ('CB-2026-0341', '74591046128100256501176', '466135737132267', 89500,  'VISA',
   'FRAUDE', 'VIS-83', 'Supermercado El Trébol', '12453',
   current_date - 15, now() - interval '5 days', current_date + 18, null,
   'enviado', 0, null),

  ('CB-2026-0342', '75196046128100258452535', '346135705192940', 145000, 'MASTERCARD',
   'NO_RECIBIDO', 'MC-4853', 'Ferretería Nacional', '98231',
   current_date - 12, now() - interval '3 days', current_date + 20, null,
   'enviado', 0, null),

  ('CB-2026-0343', null, '556135771234567', 220000, 'VISA',
   'DUPLICADO', 'VIS-12', 'Farmacia Cruz Verde', '44521',
   current_date - 10, now() - interval '2 days', current_date + 22, null,
   'enviado', 0, null),

  -- Próximos a vencer — CRÍTICO
  ('CB-2026-0298', '74591046128100198721045', '466135701122334', 312000, 'MASTERCARD',
   'FRAUDE', 'MC-4863', 'Tienda Paris', '77823',
   current_date - 40, now() - interval '25 days', current_date + 3, null,
   'enviado', 0, 'URGENTE: vence en 3 días'),

  ('CB-2026-0301', '74591046128100201234567', '466135703344556', 98000, 'VISA',
   'MONTO_INCORRECTO', 'VIS-76', 'Copec Estación Central', '23456',
   current_date - 38, now() - interval '22 days', current_date + 5, null,
   'enviado', 0, 'Vence en 5 días'),

  -- Aceptados — KLAP ganó
  ('CB-2026-0256', '74591046128100145678901', '466135688901234', 67000, 'VISA',
   'FRAUDE', 'VIS-83', 'Amazon Chile', '11234',
   current_date - 60, now() - interval '45 days', current_date - 5,
   now() - interval '10 days',
   'aceptado', 67000, 'Marca aceptó — monto recuperado completo'),

  ('CB-2026-0261', null, '346135689012345', 189000, 'MASTERCARD',
   'NO_RECIBIDO', 'MC-4855', 'Lan Airlines', '55678',
   current_date - 55, now() - interval '40 days', current_date - 8,
   now() - interval '12 days',
   'aceptado', 189000, null),

  -- Rechazados — KLAP perdió
  ('CB-2026-0271', '74591046128100167890123', '466135699001122', 450000, 'VISA',
   'FRAUDE', 'VIS-83', 'Ripley.com', '66789',
   current_date - 50, now() - interval '35 days', current_date - 3,
   now() - interval '8 days',
   'rechazado', 0, 'Marca rechazó: comercio presentó evidencia de entrega'),

  -- Vencido sin respuesta — EL PEOR CASO
  ('CB-2026-0234', '74591046128100112345678', '466135677889900', 560000, 'AMEX',
   'FRAUDE', 'AMEX-FR', 'Hotel W Santiago', '33445',
   current_date - 75, now() - interval '60 days', current_date - 15, null,
   'vencido', 0, 'Venció el plazo sin respuesta de AMEX — monto no recuperable'),

  -- En disputa
  ('CB-2026-0312', null, '556135755667788', 178000, 'MASTERCARD',
   'CANCELACION', 'MC-4841', 'Netflix Chile', '90123',
   current_date - 25, now() - interval '15 days', current_date + 10,
   now() - interval '5 days',
   'en_disputa', 0, 'Marca solicitó documentación adicional — carta del titular requerida');
