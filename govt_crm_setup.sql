-- ============================================================
--  Government Saarthi + CRM Enhancement Tables
--  Run this in Supabase SQL Editor
-- ============================================================

-- ── 1. Govt Bid / Proposal Log ───────────────────────────────
CREATE TABLE IF NOT EXISTS govt_bids (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT REFERENCES govt_projects(id) ON DELETE CASCADE,
  tender_id       BIGINT REFERENCES govt_tenders(id) ON DELETE SET NULL,
  bid_ref         TEXT,
  bid_value       NUMERIC(14,2),
  submitted_at    DATE,
  status          TEXT NOT NULL DEFAULT 'submitted'
                    CHECK (status IN ('draft','submitted','shortlisted','won','lost')),
  doc_url         TEXT,
  notes           TEXT,
  created_by      BIGINT REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE govt_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_govt_bids" ON govt_bids USING (true) WITH CHECK (true);

-- ── 2. Govt Revenue ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS govt_revenue (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT REFERENCES govt_projects(id) ON DELETE CASCADE,
  amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  invoice_ref     TEXT,
  payment_mode    TEXT DEFAULT 'bank_transfer',
  received_date   DATE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','received','partial','overdue')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE govt_revenue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_govt_revenue" ON govt_revenue USING (true) WITH CHECK (true);

-- ── 3. Govt Project Coordination Tasks ──────────────────────
CREATE TABLE IF NOT EXISTS govt_project_tasks (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT REFERENCES govt_projects(id) ON DELETE CASCADE,
  task            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'todo'
                    CHECK (status IN ('todo','in_progress','done','blocked')),
  priority        TEXT DEFAULT 'medium'
                    CHECK (priority IN ('low','medium','high','critical')),
  assignee_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
  due_date        DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE govt_project_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_govt_tasks" ON govt_project_tasks USING (true) WITH CHECK (true);

-- ── 4. Govt Compliance Checklist ────────────────────────────
CREATE TABLE IF NOT EXISTS govt_compliance (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT REFERENCES govt_projects(id) ON DELETE CASCADE,
  item            TEXT NOT NULL,
  category        TEXT DEFAULT 'general',
  is_complete     BOOLEAN DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE govt_compliance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_govt_compliance" ON govt_compliance USING (true) WITH CHECK (true);

-- ── 5. MOU / Agreement Tracker ──────────────────────────────
CREATE TABLE IF NOT EXISTS govt_mous (
  id              BIGSERIAL PRIMARY KEY,
  client_id       BIGINT REFERENCES govt_clients(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  signed_date     DATE,
  expiry_date     DATE,
  doc_url         TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('draft','active','expired','terminated','renewed')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE govt_mous ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_govt_mous" ON govt_mous USING (true) WITH CHECK (true);

-- ── 6. CRM Invoices ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_invoices (
  id              BIGSERIAL PRIMARY KEY,
  invoice_number  TEXT UNIQUE,
  lead_id         BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  client_name     TEXT NOT NULL,
  client_email    TEXT,
  client_phone    TEXT,
  pillar          TEXT,
  service         TEXT,
  amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(14,2) DEFAULT 0,
  total_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  due_date        DATE,
  paid_date       DATE,
  notes           TEXT,
  items           JSONB DEFAULT '[]',
  created_by      BIGINT REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE crm_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_crm_invoices" ON crm_invoices USING (true) WITH CHECK (true);

-- ── 7. CRM Follow-up Log ────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_followup_log (
  id              BIGSERIAL PRIMARY KEY,
  lead_id         BIGINT REFERENCES leads(id) ON DELETE CASCADE,
  note            TEXT NOT NULL,
  note_type       TEXT DEFAULT 'call'
                    CHECK (note_type IN ('call','email','whatsapp','meeting','note')),
  next_followup   DATE,
  created_by      BIGINT REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE crm_followup_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_crm_followup" ON crm_followup_log USING (true) WITH CHECK (true);

-- ── 8. CRM Bulk Message Log ─────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_bulk_messages (
  id              BIGSERIAL PRIMARY KEY,
  channel         TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  segment         TEXT,
  subject         TEXT,
  message         TEXT NOT NULL,
  recipient_count INTEGER DEFAULT 0,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  sent_by         BIGINT REFERENCES users(id)
);
ALTER TABLE crm_bulk_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_crm_bulk" ON crm_bulk_messages USING (true) WITH CHECK (true);

-- ── Extend govt_projects if missing columns ─────────────────
ALTER TABLE govt_projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE govt_projects ADD COLUMN IF NOT EXISTS assigned_to BIGINT REFERENCES users(id);
ALTER TABLE govt_projects ADD COLUMN IF NOT EXISTS start_date DATE;

-- ── Extend govt_clients if missing columns ──────────────────
ALTER TABLE govt_clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE govt_clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE govt_clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE govt_clients ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE govt_clients ADD COLUMN IF NOT EXISTS since_date DATE;

-- ── Extend leads for pillar auto-assign ─────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pillar TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'student';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_interest TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER;

-- ── Invoice sequence function ────────────────────────────────
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  seq INTEGER;
  yr  TEXT := TO_CHAR(NOW(), 'YY');
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)), 0) + 1
    INTO seq FROM crm_invoices WHERE invoice_number LIKE 'KS-' || yr || '-%';
  RETURN 'KS-' || yr || '-' || LPAD(seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
