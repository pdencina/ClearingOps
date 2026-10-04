-- ============================================================
-- KLAP CORE — Migración incremental: gates G14/G15/G16
-- Agrega al checklist los 3 controles acordados con BPC
-- (Alejandro San Martín, Service Delivery Manager BPC):
--   G14 — Reunión técnica conjunta KLAP-BPC
--   G15 — Certificación BPC completada
--   G16 — Validación de archivos Outgoing post-PaP (condicional)
--
-- A diferencia de seed_release_watchdog.sql, esta migración NO
-- borra nada: agrega los gates nuevos a los releases que ya
-- existen en la base y que todavía no los tienen, preservando
-- el progreso ya registrado en los demás gates.
--
-- Ejecutar una sola vez en el SQL Editor de Neon Console.
-- ============================================================

INSERT INTO release_gates (id, release_id, name, description, phase, is_blocking, status, owner, deadline, notes)
SELECT
  'G14',
  r.id,
  'Reunión técnica conjunta KLAP-BPC',
  'Se realizó la reunión con los equipos técnicos de KLAP y BPC para revisar el release. Evidencia obligatoria: acta/minuta con fecha y asistentes.',
  'validation',
  TRUE,
  'pending',
  'Release Management KLAP / BPC',
  r.pap_date - INTERVAL '6 days',
  'Agendar con Alejandro San Martín (BPC) y equipo técnico KLAP.'
FROM releases r
WHERE r.phase != 'closed'
  AND NOT EXISTS (SELECT 1 FROM release_gates g WHERE g.release_id = r.id AND g.id = 'G14');

INSERT INTO release_gates (id, release_id, name, description, phase, is_blocking, status, owner, deadline, notes)
SELECT
  'G15',
  r.id,
  'Certificación BPC completada',
  'BPC certificó el release en su propio ambiente (certificación obligatoria del lado BPC, acordado con Alejandro San Martín — Service Delivery Manager BPC). Evidencia: reporte o constancia de certificación.',
  'validation',
  TRUE,
  'pending',
  'BPC',
  r.pap_date - INTERVAL '3 days',
  'Certificación BPC pendiente de confirmación.'
FROM releases r
WHERE r.phase != 'closed'
  AND NOT EXISTS (SELECT 1 FROM release_gates g WHERE g.release_id = r.id AND g.id = 'G15');

-- G16 es condicional: solo se agrega a releases que ya tienen al menos
-- un gate marcado como relacionado a clearing (heurística simple: se
-- agrega siempre aquí porque este backfill es para releases ya en
-- curso; para releases NUEVOS la decisión la toma el Release Analyzer
-- vía include_outgoing_validation al crear el release).
INSERT INTO release_gates (id, release_id, name, description, phase, is_blocking, status, owner, deadline, notes)
SELECT
  'G16',
  r.id,
  'Validación de archivos Outgoing post-PaP',
  'Se generaron y validaron archivos Outgoing hacia las marcas con un lote reducido de trx tras el PaP. Obligatorio en releases de marca (Visa/Mastercard, 2x año) o cuando el release tiene riesgo de no generar archivos a las marcas (clearing/SVXP). Acordado con BPC (Alejandro San Martín).',
  'post_pap',
  TRUE,
  'pending',
  'BPC / Operaciones Adquirentes',
  r.pap_date + INTERVAL '1 day',
  'Release toca clearing/SVXP — outgoing con lote reducido post-PaP.'
FROM releases r
WHERE r.phase != 'closed'
  AND NOT EXISTS (SELECT 1 FROM release_gates g WHERE g.release_id = r.id AND g.id = 'G16');

-- Alerta informativa para dejar trazabilidad del cambio de proceso
INSERT INTO release_alerts (release_id, severity, title, detail)
SELECT
  r.id,
  'info',
  'Checklist actualizado: 3 controles nuevos acordados con BPC',
  'Se agregaron G14 (reunión técnica conjunta), G15 (certificación BPC) y G16 (validación Outgoing post-PaP) tras el acuerdo con Alejandro San Martín (Service Delivery Manager BPC).'
FROM releases r
WHERE r.phase != 'closed';
