-- ============================================================
-- KLAP CORE — Limpieza de datos de prueba del Release Watchdog
-- ============================================================
-- Borra TODO el contenido del módulo de releases para dejar el
-- sistema listo para operar en limpio con Release Notes reales.
--
-- Elimina el release de demo R26.60 (UUID c1b2c3d4-...0001), sus
-- gates, alertas (incluidas las duplicadas de pruebas) y el
-- historial. El ON DELETE CASCADE de las FKs limpia los hijos,
-- pero se listan todas por claridad.
--
-- DESTRUCTIVO E IRREVERSIBLE. Ejecutado una vez al dejar el
-- sistema operativo. No afecta ningún otro módulo de KLAP CORE.
-- ============================================================

DELETE FROM release_gate_history;
DELETE FROM release_alerts;
DELETE FROM release_gates;
DELETE FROM releases;
