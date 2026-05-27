-- ============================================================
-- ClearingOps — Módulo SVAP (KLAP-1482)
-- Tracking de archivos SVAP enviados a SmartVista y sus resultados
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLA: svap_archivos
-- Registro de cada archivo SVAP enviado a SmartVista
-- ============================================================
create table if not exists svap_archivos (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  tipo_svap       text not null check (tipo_svap in (
                    'TARIFAS',      -- Carga de tarifas
                    'BINS',         -- Carga de BINs
                    'PARAMETROS',   -- Parámetros de configuración
                    'COMERCIOS',    -- Datos de comercios
                    'SUCURSALES',   -- Datos de sucursales
                    'OTRO'
                  )),
  marca           text check (marca in ('VISA','MASTERCARD','MAESTRO','AMEX','TODOS')),
  fecha_envio     timestamptz not null default now(),
  fecha_proceso   date not null,
  total_registros integer not null default 0,
  estado_envio    text not null default 'enviado' check (estado_envio in (
                    'enviado',      -- Archivo enviado, esperando resultado
                    'procesado_ok', -- SmartVista confirmó proceso exitoso
                    'procesado_parcial', -- Solo algunos registros procesados
                    'error',        -- Error en el procesamiento
                    'sin_respuesta' -- No llegó confirmación en el tiempo esperado
                  )),
  registros_ok    integer default 0,
  registros_error integer default 0,
  registros_omitidos integer default 0,
  codigo_respuesta text,           -- Código de respuesta de SmartVista
  mensaje_respuesta text,          -- Mensaje descriptivo de la respuesta
  tiempo_proceso_seg integer,      -- Segundos que tardó en procesarse
  enviado_por     text,            -- Usuario o proceso que envió el archivo
  notas           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABLA: svap_errores
-- Detalle de errores individuales dentro de un SVAP
-- ============================================================
create table if not exists svap_errores (
  id              uuid primary key default uuid_generate_v4(),
  svap_id         uuid references svap_archivos(id) on delete cascade,
  linea           integer,         -- Número de línea del error en el archivo
  codigo_error    text not null,
  descripcion     text not null,
  dato_afectado   text,            -- El registro específico que falló
  severidad       text not null default 'error' check (severidad in ('critico','error','advertencia')),
  created_at      timestamptz not null default now()
);

-- ============================================================
-- TABLA: svap_respuestas_raw
-- Respuestas raw de SmartVista para auditoría
-- ============================================================
create table if not exists svap_respuestas_raw (
  id              uuid primary key default uuid_generate_v4(),
  svap_id         uuid references svap_archivos(id) on delete cascade,
  contenido       text not null,   -- Respuesta completa de SmartVista
  recibido_at     timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_svap_fecha     on svap_archivos(fecha_proceso);
create index if not exists idx_svap_estado    on svap_archivos(estado_envio);
create index if not exists idx_svap_tipo      on svap_archivos(tipo_svap);
create index if not exists idx_svap_errores   on svap_errores(svap_id);

-- ============================================================
-- RLS
-- ============================================================
alter table svap_archivos       enable row level security;
alter table svap_errores        enable row level security;
alter table svap_respuestas_raw enable row level security;

create policy "acceso_total" on svap_archivos       for all using (true);
create policy "acceso_total" on svap_errores        for all using (true);
create policy "acceso_total" on svap_respuestas_raw for all using (true);

-- ============================================================
-- DATOS DE PRUEBA — simulan el problema real de KLAP-1482
-- ============================================================
insert into svap_archivos (
  nombre, tipo_svap, marca, fecha_proceso, total_registros,
  estado_envio, registros_ok, registros_error, registros_omitidos,
  codigo_respuesta, mensaje_respuesta, tiempo_proceso_seg, enviado_por
) values
  -- Proceso exitoso normal
  ('SVAP_TARIFAS_VISA_20260520.xml',      'TARIFAS',   'VISA',        current_date - 6, 1240, 'procesado_ok',      1240,  0,   0, '200', 'Proceso completado exitosamente', 45, 'BPC-Auto'),
  ('SVAP_BINS_MC_20260520.xml',           'BINS',      'MASTERCARD',  current_date - 6,  890, 'procesado_ok',       890,  0,   0, '200', 'Proceso completado exitosamente', 32, 'BPC-Auto'),
  -- Proceso parcial — el problema que describe KLAP-1482
  ('SVAP_TARIFAS_MC_20260521.xml',        'TARIFAS',   'MASTERCARD',  current_date - 5,  756, 'procesado_parcial',  701, 55,   0, '206', 'Proceso parcial — 55 registros con error de formato', 67, 'BPC-Auto'),
  ('SVAP_COMERCIOS_20260521.xml',         'COMERCIOS', 'TODOS',       current_date - 5, 2340, 'procesado_ok',      2340,  0,   0, '200', 'Proceso completado exitosamente', 120, 'BPC-Auto'),
  -- Sin respuesta — nadie sabe qué pasó
  ('SVAP_PARAMETROS_20260522.xml',        'PARAMETROS','TODOS',       current_date - 4,  145, 'sin_respuesta',        0,  0,   0, null,  'Sin confirmación de SmartVista después de 2 horas', null, 'BPC-Auto'),
  -- Error crítico
  ('SVAP_TARIFAS_VISA_20260523.xml',      'TARIFAS',   'VISA',        current_date - 3, 1380, 'error',                0,  0,1380, '500', 'Error crítico: estructura del archivo no reconocida por SmartVista', 3, 'BPC-Auto'),
  -- Proceso ok reciente
  ('SVAP_BINS_VISA_20260524.xml',         'BINS',      'VISA',        current_date - 2, 2100, 'procesado_ok',      2100,  0,   0, '200', 'Proceso completado exitosamente', 89, 'BPC-Auto'),
  ('SVAP_TARIFAS_MC_20260524.xml',        'TARIFAS',   'MASTERCARD',  current_date - 2,  980, 'procesado_ok',       980,  0,   0, '200', 'Proceso completado exitosamente', 41, 'BPC-Auto'),
  -- Hoy — enviado, esperando resultado
  ('SVAP_TARIFAS_VISA_20260525.xml',      'TARIFAS',   'VISA',        current_date,     1290, 'enviado',              0,  0,   0, null,  null, null, 'BPC-Auto'),
  ('SVAP_BINS_MC_20260525.xml',           'BINS',      'MASTERCARD',  current_date,      845, 'enviado',              0,  0,   0, null,  null, null, 'BPC-Auto');

-- Errores del proceso parcial del día 5
insert into svap_errores (svap_id, linea, codigo_error, descripcion, dato_afectado, severidad)
select id, 145, 'ERR_FORMATO_TARIFA', 'Formato de tasa inválido — se esperaba decimal con 4 decimales', 'MC_BIN_524152_TARIFA_CUOTA', 'error'
from svap_archivos where nombre = 'SVAP_TARIFAS_MC_20260521.xml' limit 1;

insert into svap_errores (svap_id, linea, codigo_error, descripcion, dato_afectado, severidad)
select id, 312, 'ERR_TARIFA_DUPLICADA', 'Tarifa duplicada para el mismo BIN y tipo de comercio', 'MC_BIN_513555_TRADICIONAL', 'advertencia'
from svap_archivos where nombre = 'SVAP_TARIFAS_MC_20260521.xml' limit 1;
