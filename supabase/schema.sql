-- ============================================================
-- KLAP CORE — Schema Principal
-- ============================================================

-- Merchants (comercios)
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rut TEXT UNIQUE NOT NULL,
  mcc TEXT NOT NULL DEFAULT '5411',
  category TEXT NOT NULL DEFAULT 'retail',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Terminals
CREATE TABLE IF NOT EXISTS terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  terminal_code TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL DEFAULT 'Verifone P400',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  terminal_id UUID REFERENCES terminals(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CLP',
  card_brand TEXT NOT NULL CHECK (card_brand IN ('visa', 'mastercard', 'amex', 'redcompra')),
  card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'debit', 'prepaid')),
  card_last_four TEXT,
  auth_code TEXT,
  reference_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'authorized' CHECK (status IN ('authorized', 'captured', 'rejected', 'reversed', 'settled')),
  payment_method TEXT NOT NULL DEFAULT 'card' CHECK (payment_method IN ('card', 'qr', 'contactless', 'ecommerce')),
  installments INT DEFAULT 1,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

-- Clearing Batches
CREATE TABLE IF NOT EXISTS clearing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  card_brand TEXT NOT NULL CHECK (card_brand IN ('visa', 'mastercard')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'generated', 'sent', 'confirmed', 'failed')),
  transaction_count INT NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  file_name TEXT,
  generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settlements (liquidaciones)
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  settlement_date DATE NOT NULL,
  gross_amount NUMERIC(14,2) NOT NULL,
  commission NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva NUMERIC(12,2) NOT NULL DEFAULT 0,
  withholdings NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(14,2) NOT NULL,
  transaction_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Reconciliation Items
CREATE TABLE IF NOT EXISTS reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_date DATE NOT NULL,
  source_klap NUMERIC(14,2) NOT NULL DEFAULT 0,
  source_bank NUMERIC(14,2) NOT NULL DEFAULT 0,
  source_brand NUMERIC(14,2) NOT NULL DEFAULT 0,
  difference_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  transaction_count_klap INT NOT NULL DEFAULT 0,
  transaction_count_bank INT NOT NULL DEFAULT 0,
  transaction_count_brand INT NOT NULL DEFAULT 0,
  card_brand TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('reconciled', 'mismatch', 'pending', 'investigating')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Fee Rules (reglas de comisión)
CREATE TABLE IF NOT EXISTS fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  card_brand TEXT NOT NULL CHECK (card_brand IN ('visa', 'mastercard', 'amex', 'redcompra')),
  card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'debit', 'prepaid')),
  payment_method TEXT NOT NULL DEFAULT 'card',
  percentage NUMERIC(5,4) NOT NULL,
  fixed_fee NUMERIC(8,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disputes (chargebacks)
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CLP',
  reason TEXT NOT NULL,
  reason_code TEXT,
  card_brand TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'representment', 'won', 'lost', 'expired')),
  deadline DATE,
  evidence_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Operational Events
CREATE TABLE IF NOT EXISTS operational_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('job', 'error', 'warning', 'info', 'critical')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'acknowledged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('transaction', 'settlement', 'reconciliation', 'dispute', 'system', 'security')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_transactions_merchant ON transactions(merchant_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_brand ON transactions(card_brand);
CREATE INDEX idx_settlements_merchant ON settlements(merchant_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_disputes_merchant ON disputes(merchant_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_reconciliation_date ON reconciliation_items(reconciliation_date);
CREATE INDEX idx_operational_events_type ON operational_events(event_type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_resolved ON alerts(is_resolved);
