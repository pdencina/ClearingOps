-- ============================================================
-- KLAP CORE — Seed Release Watchdog
-- Carga el release R26.60 con el checklist en el estado real
-- (intake completo, validación en curso, gate KLAP-2024 fallido)
-- Ejecutar DESPUÉS de schema_release_watchdog.sql
-- ============================================================

-- Limpiar datos anteriores del módulo
TRUNCATE release_gate_history, release_alerts, release_gates, releases CASCADE;

-- Release
INSERT INTO releases (id, name, bpc_version, pap_date, release_note_received, phase, total_tickets, critical_tickets, klap_dependent_tickets)
VALUES (
  'c1b2c3d4-0001-4000-8000-000000000001',
  'R26.60',
  'SmartVista Radar Payments 26.60',
  CURRENT_DATE + INTERVAL '6 days',
  CURRENT_DATE - INTERVAL '4 days',
  'validation',
  20, 5, 7
);

-- Gates (checklist completo, 13 controles)
INSERT INTO release_gates (id, release_id, name, description, phase, is_blocking, status, owner, deadline, completed_at, completed_by, evidence, notes) VALUES
('G01', 'c1b2c3d4-0001-4000-8000-000000000001', 'Release Note recibido', 'BPC entregó el Release Note con al menos 10 días hábiles de anticipación.', 'intake', TRUE, 'passed', 'Release Management KLAP', CURRENT_DATE - INTERVAL '4 days', NOW() - INTERVAL '4 days', 'Release Management', 'Release Note recibido vía email de BPC', NULL),
('G02', 'c1b2c3d4-0001-4000-8000-000000000001', 'Contenido del Release Note completo', 'Incluye: versión, funcionalidades, impacto, plan de rollback y fecha de go-live.', 'intake', TRUE, 'passed', 'Release Management KLAP', CURRENT_DATE - INTERVAL '4 days', NOW() - INTERVAL '4 days', 'Pablo Encina', 'Verificado con Release Analyzer de ClearingOps', NULL),
('G03', 'c1b2c3d4-0001-4000-8000-000000000001', 'Tickets KLAP identificados', 'Se identificaron todos los tickets de la sección Klap y los que impactan clearing/liquidación/reportes.', 'intake', TRUE, 'passed', 'Release Management KLAP', CURRENT_DATE - INTERVAL '3 days', NOW() - INTERVAL '3 days', 'Pablo Encina', '5 tickets sección Klap + 7 con dependencia KLAP identificados', NULL),
('G04', 'c1b2c3d4-0001-4000-8000-000000000001', 'Validación técnica QA', 'QA KLAP ejecutó pruebas de integración, regresión y cobertura técnica.', 'validation', TRUE, 'in_progress', 'QA KLAP', CURRENT_DATE + INTERVAL '1 day', NULL, NULL, NULL, 'QA ejecutando regresión en T6'),
('G05', 'c1b2c3d4-0001-4000-8000-000000000001', 'Validación funcional PO', 'Product Owner SmartVista KLAP validó funcionalidad de los cambios.', 'validation', TRUE, 'in_progress', 'PO SmartVista KLAP', CURRENT_DATE + INTERVAL '1 day', NULL, NULL, NULL, 'PO revisando tickets de clearing'),
('G06', 'c1b2c3d4-0001-4000-8000-000000000001', 'Validación impacto operativo', 'Gerencia de Operaciones Adquirentes revisó impacto operativo y alineación estratégica.', 'validation', TRUE, 'pending', 'Gerencia Operaciones', CURRENT_DATE + INTERVAL '1 day', NULL, NULL, NULL, NULL),
('G07', 'c1b2c3d4-0001-4000-8000-000000000001', 'Dependencias KLAP/CLAP confirmadas', 'Todos los tickets que requieren acción de KLAP o CLAP tienen confirmación explícita de que el cambio fue realizado.', 'validation', TRUE, 'failed', 'Release Management KLAP', CURRENT_DATE + INTERVAL '2 days', NULL, NULL, NULL, 'KLAP-2024: cambio requerido por CLAP no confirmado. Ticket atrasado 4 días.'),
('G08', 'c1b2c3d4-0001-4000-8000-000000000001', 'Presentación en Comité de Cambios', 'Cada ticket del release fue presentado al comité con ámbito, pruebas, aprobación bilateral y rollback.', 'pre_pap', TRUE, 'pending', 'Release Management KLAP', CURRENT_DATE + INTERVAL '4 days', NULL, NULL, NULL, NULL),
('G09', 'c1b2c3d4-0001-4000-8000-000000000001', 'Plan de rollback validado', 'El plan de rollback fue revisado y aprobado. BPC confirmó que puede ejecutarlo.', 'pre_pap', TRUE, 'pending', 'BPC / Release Management', CURRENT_DATE + INTERVAL '4 days', NULL, NULL, NULL, NULL),
('G10', 'c1b2c3d4-0001-4000-8000-000000000001', 'Congelamiento confirmado', 'No hay cambios pendientes. Código congelado. Release listo para PaP.', 'pre_pap', TRUE, 'pending', 'BPC', CURRENT_DATE + INTERVAL '5 days', NULL, NULL, NULL, NULL),
('G11', 'c1b2c3d4-0001-4000-8000-000000000001', 'Sanity check post-PaP ejecutado', 'Set de transacciones de verificación ejecutado: operación transaccional normal, reportes y tags correctos.', 'post_pap', TRUE, 'pending', 'QA KLAP / Operaciones', CURRENT_DATE + INTERVAL '7 days', NULL, NULL, NULL, NULL),
('G12', 'c1b2c3d4-0001-4000-8000-000000000001', 'Monitor de gap transaccional OK', 'Verificación de que las trxs enviadas a BPC vía SVXP cuadran con las recibidas vía ClearingOut. Sin faltantes.', 'post_pap', TRUE, 'pending', 'Operaciones Adquirentes', CURRENT_DATE + INTERVAL '7 days', NULL, NULL, NULL, NULL),
('G13', 'c1b2c3d4-0001-4000-8000-000000000001', 'Transparency report activo', 'Confirmación de que BPC no dejó procesos apagados tras la migración (transparency report, clearing out, etc.).', 'post_pap', TRUE, 'pending', 'Operaciones / BPC', CURRENT_DATE + INTERVAL '7 days', NULL, NULL, NULL, NULL);

-- Alertas activas
INSERT INTO release_alerts (release_id, gate_id, severity, title, detail, is_acknowledged) VALUES
('c1b2c3d4-0001-4000-8000-000000000001', 'G07', 'critical', 'Dependencia KLAP-2024 no resuelta',
 'El ticket KLAP-2024 requiere un cambio de CLAP que no ha sido confirmado. Atrasado 4 días. Si no se resuelve antes del PaP, la operación se rompe en producción — mismo tipo de incidente que ocurrió en el release anterior.',
 FALSE),
('c1b2c3d4-0001-4000-8000-000000000001', 'G13', 'warning', 'Verificar transparency report post-migración',
 'En el release anterior, BPC apagó el transparency report durante una migración sin avisarnos. Asegurar que el gate G13 se valide inmediatamente después del PaP.',
 FALSE);
