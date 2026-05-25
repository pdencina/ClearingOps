-- ============================================================
-- ClearingOps — Datos de prueba (seed)
-- Simula 7 días de operación con incidentes reales
-- ============================================================

-- Limpiar datos previos (solo para desarrollo)
truncate alertas, cuadratura_diaria, transacciones, archivos restart identity cascade;

-- ============================================================
-- ARCHIVOS de los últimos 7 días
-- ============================================================
insert into archivos (id, nombre, tipo, marca, fecha_proceso, total_trx, estado, recibido_at) values
  -- Día 1 (hace 6 días) — operación normal
  ('a1000000-0000-0000-0000-000000000001', 'output_file_VISA_20260519.xml.gpg',    'SVXP', 'VISA',       current_date - 6, 1842, 'ok',         now() - interval '6 days'),
  ('a1000000-0000-0000-0000-000000000002', 'MCI.AR.R111.D260519.A001',             'SVXP', 'MASTERCARD', current_date - 6,  934, 'ok',         now() - interval '6 days' + interval '30 min'),
  ('a1000000-0000-0000-0000-000000000003', 'Outgoing_VISA_20260519160000.ctf',     'CTF',  'VISA',       current_date - 6, 1842, 'ok',         now() - interval '6 days' + interval '8 hours'),
  ('a1000000-0000-0000-0000-000000000004', 'MCI.AR.R111.D260519.IPM',             'IPM',  'MASTERCARD', current_date - 6,  934, 'ok',         now() - interval '6 days' + interval '10 hours'),

  -- Día 2 (hace 5 días) — SVXP MC se retrasa
  ('a2000000-0000-0000-0000-000000000001', 'output_file_VISA_20260520.xml.gpg',    'SVXP', 'VISA',       current_date - 5, 2103, 'ok',         now() - interval '5 days'),
  ('a2000000-0000-0000-0000-000000000002', 'MCI.AR.R111.D260520.A001',             'SVXP', 'MASTERCARD', current_date - 5,  756, 'advertencia', now() - interval '5 days' + interval '3 hours'),
  ('a2000000-0000-0000-0000-000000000003', 'Outgoing_VISA_20260520160000.ctf',     'CTF',  'VISA',       current_date - 5, 2103, 'ok',         now() - interval '5 days' + interval '8 hours'),
  ('a2000000-0000-0000-0000-000000000004', 'MCI.AR.R111.D260520.IPM',             'IPM',  'MASTERCARD', current_date - 5,  756, 'ok',         now() - interval '5 days' + interval '11 hours'),

  -- Día 3 (hace 4 días) — Incidente SVXP detenido (como el del log)
  ('a3000000-0000-0000-0000-000000000001', 'output_file_VISA_20260521.xml.gpg',    'SVXP', 'VISA',       current_date - 4, 1117, 'ok',         now() - interval '4 days'),
  ('a3000000-0000-0000-0000-000000000002', 'Outgoing_VISA_20260521175023.ctf',     'CTF',  'VISA',       current_date - 4, 1117, 'ok',         now() - interval '4 days' + interval '10 hours'),

  -- Día 4 (hace 3 días) — Diferencia de cuadratura MC
  ('a4000000-0000-0000-0000-000000000001', 'output_file_VISA_20260522.xml.gpg',    'SVXP', 'VISA',       current_date - 3, 1980, 'ok',         now() - interval '3 days'),
  ('a4000000-0000-0000-0000-000000000002', 'MCI.AR.R111.D260522.A001',             'SVXP', 'MASTERCARD', current_date - 3, 2240, 'ok',         now() - interval '3 days'),
  ('a4000000-0000-0000-0000-000000000003', 'Outgoing_VISA_20260522160000.ctf',     'CTF',  'VISA',       current_date - 3, 1980, 'ok',         now() - interval '3 days' + interval '8 hours'),
  ('a4000000-0000-0000-0000-000000000004', 'Outgoing_MC_20260522160000.ctf',       'CTF',  'MASTERCARD', current_date - 3, 2225, 'error',      now() - interval '3 days' + interval '8 hours'),

  -- Día 5 (hace 2 días) — Normal
  ('a5000000-0000-0000-0000-000000000001', 'output_file_VISA_20260523.xml.gpg',    'SVXP', 'VISA',       current_date - 2, 2341, 'ok',         now() - interval '2 days'),
  ('a5000000-0000-0000-0000-000000000002', 'MCI.AR.R111.D260523.A001',             'SVXP', 'MASTERCARD', current_date - 2, 1102, 'ok',         now() - interval '2 days'),
  ('a5000000-0000-0000-0000-000000000003', 'Outgoing_VISA_20260523160000.ctf',     'CTF',  'VISA',       current_date - 2, 2341, 'ok',         now() - interval '2 days' + interval '8 hours'),
  ('a5000000-0000-0000-0000-000000000004', 'MCI.AR.R111.D260523.IPM',             'IPM',  'MASTERCARD', current_date - 2, 1102, 'ok',         now() - interval '2 days' + interval '10 hours'),

  -- Día 6 (ayer) — Cuotas con OPST0500 (como el incidente real)
  ('a6000000-0000-0000-0000-000000000001', 'output_file_VISA_20260524.xml.gpg',    'SVXP', 'VISA',       current_date - 1, 3108, 'advertencia', now() - interval '1 day'),
  ('a6000000-0000-0000-0000-000000000002', 'MCI.AR.R111.D260524.A001',             'SVXP', 'MASTERCARD', current_date - 1, 1876, 'error',      now() - interval '1 day'),
  ('a6000000-0000-0000-0000-000000000003', 'Outgoing_VISA_20260524160000.ctf',     'CTF',  'VISA',       current_date - 1, 3108, 'ok',         now() - interval '1 day' + interval '8 hours'),
  ('a6000000-0000-0000-0000-000000000004', 'Outgoing_MC_20260524003000.ctf',       'CTF',  'MASTERCARD', current_date - 1,  876, 'error',      now() - interval '1 day' + interval '9 hours'),

  -- Hoy — en proceso
  ('a7000000-0000-0000-0000-000000000001', 'output_file_VISA_20260525.xml.gpg',    'SVXP', 'VISA',       current_date,     1654, 'ok',         now() - interval '2 hours'),
  ('a7000000-0000-0000-0000-000000000002', 'MCI.AR.R111.D260525.A001',             'SVXP', 'MASTERCARD', current_date,      923, 'procesando', now() - interval '1 hour');

-- ============================================================
-- CUADRATURA DIARIA (7 días)
-- ============================================================
insert into cuadratura_diaria (fecha, marca, trx_svxp, trx_ctf, trx_ipm, trx_error, trx_frozen, trx_excluidas, estado, ejecutado_at) values
  (current_date - 6, 'VISA',       1842, 1842,    0, 0, 0, 0, 'ok',        now() - interval '6 days' + interval '23 hours'),
  (current_date - 6, 'MASTERCARD',  934,    0,  934, 0, 0, 0, 'ok',        now() - interval '6 days' + interval '23 hours'),
  (current_date - 5, 'VISA',       2103, 2103,    0, 0, 0, 0, 'ok',        now() - interval '5 days' + interval '23 hours'),
  (current_date - 5, 'MASTERCARD',  756,    0,  756, 0, 0, 0, 'ok',        now() - interval '5 days' + interval '23 hours'),
  (current_date - 4, 'VISA',       1117, 1117,    0, 0, 0, 0, 'ok',        now() - interval '4 days' + interval '23 hours'),
  (current_date - 4, 'MASTERCARD',    0,    0,    0, 0, 0, 0, 'pendiente', null),
  (current_date - 3, 'VISA',       1980, 1980,    0, 0, 0, 0, 'ok',        now() - interval '3 days' + interval '23 hours'),
  (current_date - 3, 'MASTERCARD', 2240, 2225,    0,15, 0, 0, 'diferencia',now() - interval '3 days' + interval '23 hours'),
  (current_date - 2, 'VISA',       2341, 2341,    0, 0, 0, 0, 'ok',        now() - interval '2 days' + interval '23 hours'),
  (current_date - 2, 'MASTERCARD', 1102,    0, 1102, 0, 0, 0, 'ok',        now() - interval '2 days' + interval '23 hours'),
  (current_date - 1, 'VISA',       3108, 3108,    0, 0, 0, 0, 'ok',        now() - interval '1 day'  + interval '23 hours'),
  (current_date - 1, 'MASTERCARD', 1876,  876,    0,15,85, 900,'diferencia',now() - interval '1 day' + interval '23 hours'),
  (current_date,     'VISA',       1654,    0,    0, 0, 0, 0, 'pendiente', null),
  (current_date,     'MASTERCARD',  923,    0,    0, 0, 0, 0, 'pendiente', null);

-- ============================================================
-- ALERTAS activas e históricas
-- ============================================================
insert into alertas (tipo, severidad, marca, fecha_proceso, titulo, detalle, cantidad_trx, estado, jira_ticket, created_at) values
  ('diferencia_cuadratura', 'critica', 'MASTERCARD', current_date - 1,
   'Diferencia de cuadratura MC — 1.000 TRX sin enviar a la marca',
   '1.876 TRX en SVXP vs 876 en CTF. 85 en estado Frozen, 15 con error OPST0500, 900 cuotas comercio no incluidas.',
   1000, 'activa', 'KLAP-1712', now() - interval '1 day' + interval '9 hours'),

  ('trx_opst500', 'alta', 'MASTERCARD', current_date - 1,
   '15 TRX en estado OPST0500 — tarifa no encontrada',
   'TRX con fecha futura o sin Rate configurada quedaron en error antes del cierre. No se enviaron a la marca.',
   15, 'en_revision', 'KLAP-1671', now() - interval '1 day' + interval '9 hours'),

  ('trx_frozen', 'alta', 'MASTERCARD', current_date - 1,
   '85 TRX cuotas comercio en estado Frozen',
   'Cuotas comercio mayores a 1 no encontraron tarifa asociada. Requieren revisión manual antes de reenvío.',
   85, 'en_revision', 'KLAP-1628', now() - interval '1 day' + interval '10 hours'),

  ('diferencia_cuadratura', 'alta', 'MASTERCARD', current_date - 3,
   'Diferencia de 15 TRX en cuadratura MC',
   '2.240 TRX en SVXP vs 2.225 en CTF. Diferencia de 15 TRX sin justificación identificada.',
   15, 'resuelta', 'KLAP-1684', now() - interval '3 days' + interval '23 hours'),

  ('svxp_no_llegó', 'media', 'MASTERCARD', current_date - 4,
   'SVXP Mastercard no recibido en ventana esperada',
   'No se recibió archivo SVXP de Mastercard en la ventana de 60 minutos. BPC realizaba mantención programada.',
   0, 'resuelta', null, now() - interval '4 days' + interval '2 hours'),

  ('arn_incorrecto', 'alta', 'MASTERCARD', current_date - 5,
   'ARN incorrecto en TRX TC06 y TC26',
   'Las anulaciones tienen fecha juliana de la venta en lugar de la fecha de la anulación. Afecta el proceso de matching en la marca.',
   234, 'en_revision', 'KLAP-1663', now() - interval '5 days');
