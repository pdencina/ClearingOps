-- ============================================================
-- KLAP CORE — Notificaciones por correo (Neon / Postgres)
-- ============================================================
-- Sistema de avisos del proceso de releases de BPC:
--  - notification_recipients: a quién le llegan los correos
--    (lista administrable desde la pantalla Notificaciones).
--  - notification_log: registro de cada notificación disparada
--    (asunto, cuerpo, destinatarios, estado de envío). En "modo
--    registro" (sin proveedor configurado) el envío se anota aquí
--    con status='logged'; con Resend/SMTP activo pasa a 'sent'/'failed'.
-- Ejecutar en el SQL Editor de Neon Console.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Destinatarios de las notificaciones
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT,                              -- Ej: "Gerente de Operaciones", "QA KLAP"
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Registro de notificaciones disparadas
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,              -- 'critical_alert' | 'blocking_gate_failed' | 'pap_at_risk'
  release_id UUID,                       -- release relacionado (opcional)
  release_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipients TEXT[] NOT NULL DEFAULT '{}',   -- correos a los que se dirigió
  provider TEXT NOT NULL DEFAULT 'log',  -- 'log' | 'resend' | 'smtp'
  status TEXT NOT NULL DEFAULT 'logged' CHECK (status IN ('logged', 'sent', 'failed', 'skipped')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipients_active ON notification_recipients(is_active);
CREATE INDEX IF NOT EXISTS idx_notif_log_created ON notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_log_release ON notification_log(release_id);
