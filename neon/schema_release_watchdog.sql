-- ============================================================
-- KLAP CORE — Release Watchdog Schema (Neon / Postgres)
-- Persistencia real del proceso de control de releases de BPC.
-- Ejecutar en el SQL Editor de Neon Console (proyecto/base propia,
-- independiente del resto de KLAP CORE que sigue en Supabase).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Releases (un registro por cada Release Note de BPC)
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Ej: "R26.60"
  bpc_version TEXT NOT NULL,             -- Ej: "SmartVista Radar Payments 26.60"
  pap_date DATE NOT NULL,                -- Fecha programada de Paso a Producción
  release_note_received DATE NOT NULL,
  phase TEXT NOT NULL DEFAULT 'intake' CHECK (phase IN ('intake', 'validation', 'pre_pap', 'pap', 'post_pap', 'closed')),
  total_tickets INT NOT NULL DEFAULT 0,
  critical_tickets INT NOT NULL DEFAULT 0,
  klap_dependent_tickets INT NOT NULL DEFAULT 0,
  raw_release_note TEXT,                 -- Texto completo del Release Note (para reanálisis)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gates (checklist obligatorio, uno por control del release)
CREATE TABLE IF NOT EXISTS release_gates (
  id TEXT NOT NULL,                      -- Ej: "G01".."G13" (id fijo de la plantilla)
  release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('intake', 'validation', 'pre_pap', 'pap', 'post_pap', 'closed')),
  is_blocking BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'blocked', 'waived')),
  owner TEXT NOT NULL,
  deadline DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  evidence TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, release_id)
);

-- Alerts (avisos generados por el watchdog para un release)
CREATE TABLE IF NOT EXISTS release_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  gate_id TEXT,                          -- Gate relacionado (opcional)
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log (historial de cambios de estado de gates, para trazabilidad)
CREATE TABLE IF NOT EXISTS release_gate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  gate_id TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_releases_pap_date ON releases(pap_date);
CREATE INDEX IF NOT EXISTS idx_releases_phase ON releases(phase);
CREATE INDEX IF NOT EXISTS idx_release_gates_release ON release_gates(release_id);
CREATE INDEX IF NOT EXISTS idx_release_gates_status ON release_gates(status);
CREATE INDEX IF NOT EXISTS idx_release_alerts_release ON release_alerts(release_id);
CREATE INDEX IF NOT EXISTS idx_release_alerts_ack ON release_alerts(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_release_gate_history_release ON release_gate_history(release_id);

-- Trigger: mantener updated_at de releases al día
CREATE OR REPLACE FUNCTION touch_release_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_release ON releases;
CREATE TRIGGER trg_touch_release
  BEFORE UPDATE ON releases
  FOR EACH ROW
  EXECUTE FUNCTION touch_release_updated_at();
