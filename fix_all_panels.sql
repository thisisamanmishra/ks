-- ============================================================
-- KaryaSaarthi — FULL PANEL FIX MIGRATION v3
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================================

-- ─── 1. PREVIOUS MIGRATIONS (idempotent) ─────────────────────
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS sla_breach BOOLEAN DEFAULT FALSE;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS vendor_price NUMERIC;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS legal_documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'policy',
  status TEXT DEFAULT 'draft',
  description TEXT,
  file_url TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sop_documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  version TEXT DEFAULT '1.0',
  is_published BOOLEAN DEFAULT false,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'other',
  stage TEXT DEFAULT 'new',
  expected_value NUMERIC,
  notes TEXT,
  follow_up_date DATE,
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. PROJECT TASKS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_tasks (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES service_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee TEXT,
  assignee_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deadline DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. PROJECT COMM LOGS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_comm_logs (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES service_requests(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  author TEXT NOT NULL,
  type TEXT DEFAULT 'note' CHECK (type IN ('note','call','email','meeting','escalation')),
  author_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. PROJECT CHECKLISTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS project_checklists (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES service_requests(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. CALLING LOGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calling_logs (
  id BIGSERIAL PRIMARY KEY,
  caller_name TEXT NOT NULL,
  prospect_name TEXT NOT NULL,
  prospect_phone TEXT,
  duration TEXT,
  outcome TEXT DEFAULT 'interested' CHECK (outcome IN ('interested','not_interested','callback','converted','no_answer')),
  notes TEXT,
  lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. CALLING SCRIPTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS calling_scripts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  objection_handling TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. CAMPUS EVENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campus_events (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  college TEXT,
  event_date DATE,
  registrations INT DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','completed','cancelled')),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. CAMPUS AMBASSADORS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS campus_ambassadors (
  id BIGSERIAL PRIMARY KEY,
  fullname TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  college TEXT,
  referral_code TEXT UNIQUE,
  leads INT DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  target INT DEFAULT 50,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. CALLERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS callers (
  id BIGSERIAL PRIMARY KEY,
  fullname TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  shift TEXT DEFAULT 'morning' CHECK (shift IN ('morning','afternoon','evening','night')),
  calls_today INT DEFAULT 0,
  leads_today INT DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  target_calls INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 10. CAMPAIGNS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'digital',
  channel TEXT DEFAULT 'social',
  budget NUMERIC,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','draft')),
  leads_generated INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 11. GOVERNMENT TENDERS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS govt_tenders (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  dept TEXT,
  value TEXT,
  deadline DATE,
  submission_ref TEXT,
  status TEXT DEFAULT 'under_review' CHECK (status IN ('under_review','preparing','submitted','won','lost')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 12. GOVERNMENT CLIENTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS govt_clients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  dept TEXT,
  state TEXT,
  contact_person TEXT,
  contract_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 13. GOVERNMENT PROJECTS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS govt_projects (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  client_name TEXT,
  phase TEXT DEFAULT 'proposal' CHECK (phase IN ('proposal','approval','execution','review','completed')),
  progress INT DEFAULT 0,
  deadline DATE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 14. GOVERNMENT DOCUMENTS ────────────────────────────────
CREATE TABLE IF NOT EXISTS govt_documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  doc_type TEXT DEFAULT 'MOU' CHECK (doc_type IN ('MOU','Contract','Letter of Intent','Quotation','Report','Certificate')),
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid','expired','pending','draft')),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 15. MARKET B2B CLIENTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS market_clients (
  id BIGSERIAL PRIMARY KEY,
  company TEXT NOT NULL,
  industry TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  contract_value TEXT,
  stage TEXT DEFAULT 'prospect',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 16. MARKET DEALS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_deals (
  id BIGSERIAL PRIMARY KEY,
  company TEXT NOT NULL,
  service TEXT,
  value TEXT,
  probability INT DEFAULT 50,
  close_date DATE,
  stage TEXT DEFAULT 'qualifying',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 17. MARKET RESEARCH ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_research (
  id BIGSERIAL PRIMARY KEY,
  sector TEXT NOT NULL,
  insight TEXT NOT NULL,
  source TEXT,
  research_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 18. MARKET PARTNERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_partners (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  partner_type TEXT DEFAULT 'channel',
  benefit TEXT,
  contact_person TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 19. DIGITAL & OPS SUB-TABLES ──────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_calendar (id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, type TEXT, platform TEXT, date DATE, status TEXT DEFAULT 'planned', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS marketing_referrals (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, referrals INT DEFAULT 0, commission NUMERIC DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS marketing_events (id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, type TEXT, venue TEXT, capacity INT DEFAULT 0, registrations INT DEFAULT 0, date DATE, status TEXT DEFAULT 'upcoming', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS marketing_competitors (id BIGSERIAL PRIMARY KEY, competitor TEXT NOT NULL, strength TEXT, weakness TEXT, note TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS marketing_brand_assets (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT, url TEXT, description TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS dm_seo_keywords (id BIGSERIAL PRIMARY KEY, keyword TEXT NOT NULL, position INT DEFAULT 50, volume INT DEFAULT 0, change INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS dm_ad_campaigns (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, platform TEXT, spend NUMERIC DEFAULT 0, clicks INT DEFAULT 0, conversions INT DEFAULT 0, cpc NUMERIC DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS dm_social_posts (id BIGSERIAL PRIMARY KEY, platform TEXT, content TEXT NOT NULL, date TIMESTAMPTZ, likes INT DEFAULT 0, reach INT DEFAULT 0, status TEXT DEFAULT 'scheduled', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS dm_email_campaigns (id BIGSERIAL PRIMARY KEY, subject TEXT NOT NULL, sent INT DEFAULT 0, opens INT DEFAULT 0, clicks INT DEFAULT 0, date DATE, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS dm_content_performance (id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, type TEXT, views INT DEFAULT 0, date DATE, link TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS ops_inventory (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT, cost NUMERIC DEFAULT 0, renewal_date DATE, status TEXT DEFAULT 'active', vendor TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS interdept_tasks (id BIGSERIAL PRIMARY KEY, task TEXT NOT NULL, "from" TEXT, "to" TEXT, due DATE, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW());

-- ─── 20. RLS POLICIES (FULL ACCESS — ADJUST IN PROD) ─────────
DO $$
DECLARE
  tbls TEXT[] := ARRAY[
    'project_tasks','project_comm_logs','project_checklists',
    'calling_logs','calling_scripts','campus_events','campus_ambassadors','callers',
    'campaigns','legal_documents','sop_documents','leads',
    'govt_tenders','govt_clients','govt_projects','govt_documents',
    'market_clients','market_deals','market_research','market_partners',
    'marketing_calendar', 'marketing_referrals', 'marketing_events', 'marketing_competitors', 'marketing_brand_assets',
    'dm_seo_keywords', 'dm_ad_campaigns', 'dm_social_posts', 'dm_email_campaigns', 'dm_content_performance',
    'ops_inventory', 'interdept_tasks'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Full access" ON %I', t);
    EXECUTE format('CREATE POLICY "Full access" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ─── 20. SEED DATA ───────────────────────────────────────────
INSERT INTO sop_documents (title, content, category, version, is_published) VALUES
  ('Client Onboarding Process', E'Step 1: Initial call\nStep 2: Requirements gathering\nStep 3: Proposal sent\nStep 4: Agreement signed\nStep 5: Project kick-off', 'operations', '1.0', true),
  ('Vendor Assignment Guidelines', E'1. Check expertise match\n2. Verify workload < 5 active projects\n3. Get vendor confirmation\n4. Set SLA deadline', 'operations', '1.0', true),
  ('Lead Conversion SOP', E'1. Initial contact within 2 hours\n2. Qualify budget and timeline\n3. Send proposal within 24 hours\n4. Follow up every 2 days', 'calling', '1.0', true)
ON CONFLICT DO NOTHING;

INSERT INTO legal_documents (title, type, status, description) VALUES
  ('Privacy Policy v2.1', 'policy', 'approved', 'Platform privacy policy governing user data collection and usage'),
  ('Vendor Agreement Template', 'agreement', 'approved', 'Standard vendor onboarding agreement template'),
  ('MOU – Campus Saarthi Partnership', 'mou', 'pending_approval', 'Memorandum of Understanding with partner institutions'),
  ('Compliance Checklist FY2025', 'compliance', 'draft', 'Annual regulatory compliance checklist')
ON CONFLICT DO NOTHING;

INSERT INTO calling_scripts (title, content, objection_handling, category) VALUES
  ('Cold Call Opening', E'Hi, am I speaking with [Name]?\nGreat! I''m [Your Name] from KaryaSaarthi.\nWe help students and professionals with career growth.\nDo you have 2 minutes?', 'If they say busy: "I completely understand. When would be a good time to call back?"', 'general'),
  ('Follow-up Call', E'Hi [Name], this is [Your Name] from KaryaSaarthi.\nI''m following up on our previous conversation about [topic].\nHave you had a chance to review what we discussed?', 'If no recall: "We spoke about our [service] program that helps with [benefit]. Let me give you a quick recap."', 'follow_up')
ON CONFLICT DO NOTHING;

SELECT 'Full panel migration v3 complete!' as status;
