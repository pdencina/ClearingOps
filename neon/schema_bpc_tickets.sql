-- ============================================================
-- KLAP CORE — Seguimiento de tickets derivados a BPC (Neon / Postgres)
-- Registra los issues de KLAP (Jira) que fueron derivados a BPC para
-- que los corrijan, y cruza cada Release Note contra ese backlog para
-- saber qué quedó cubierto y qué sigue pendiente.
-- Ejecutar en el SQL Editor de Neon Console, en la misma base que
-- schema_release_watchdog.sql.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tickets de Jira derivados a BPC (sincronizados via API o agregados a mano)
CREATE TABLE IF NOT EXISTS bpc_derived_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_key TEXT NOT NULL UNIQUE,          -- Ej: "KLAP-2041", "ESV2-1054"
  jira_id TEXT,                           -- ID interno de Jira (para deep-link estable)
  summary TEXT NOT NULL,
  description TEXT,
  project_key TEXT NOT NULL,              -- Ej: "KLAP", "ESV2", "BYSF"
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'covered', 'resolved', 'rejected', 'stale')),
  priority TEXT,                          -- Highest/High/Medium/Low de Jira
  derived_at DATE NOT NULL DEFAULT CURRENT_DATE,
  derived_by TEXT,
  jira_url TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'jira_sync')),
  raw_labels TEXT[],                      -- labels de Jira tal como vinieron
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cobertura: qué release cubrió (o no) cada ticket derivado a BPC,
-- y con qué ticket del Release Note de BPC (B_PSGB-XXXXX) se hizo el match.
CREATE TABLE IF NOT EXISTS bpc_ticket_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bpc_ticket_id UUID NOT NULL REFERENCES bpc_derived_tickets(id) ON DELETE CASCADE,
  release_id UUID REFERENCES releases(id) ON DELETE CASCADE,  -- release del Watchdog (si se creó)
  release_name TEXT NOT NULL,             -- Ej: "R26.60" (por si no hay release_id aun)
  matched_bpc_ticket_id TEXT,             -- Ej: "B_PSGB-107436" (ticket del Release Note que lo cubre)
  matched_bpc_ticket_title TEXT,
  match_confidence NUMERIC(4,3),          -- 0 a 1, score del matching automatico
  match_method TEXT NOT NULL DEFAULT 'automatic' CHECK (match_method IN ('automatic', 'manual')),
  covered BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bpc_tickets_status ON bpc_derived_tickets(status);
CREATE INDEX IF NOT EXISTS idx_bpc_tickets_project ON bpc_derived_tickets(project_key);
CREATE INDEX IF NOT EXISTS idx_bpc_coverage_ticket ON bpc_ticket_coverage(bpc_ticket_id);
CREATE INDEX IF NOT EXISTS idx_bpc_coverage_release ON bpc_ticket_coverage(release_name);

CREATE OR REPLACE FUNCTION touch_bpc_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_bpc_ticket ON bpc_derived_tickets;
CREATE TRIGGER trg_touch_bpc_ticket
  BEFORE UPDATE ON bpc_derived_tickets
  FOR EACH ROW
  EXECUTE FUNCTION touch_bpc_ticket_updated_at();
