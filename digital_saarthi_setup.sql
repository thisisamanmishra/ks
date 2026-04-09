-- =====================================================
-- Digital Saarthi + Internal Team Setup
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Content Creators Roster
CREATE TABLE IF NOT EXISTS digital_creators (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  platforms   TEXT[] DEFAULT '{}',   -- ['YouTube','Instagram','LinkedIn']
  categories  TEXT[] DEFAULT '{}',   -- ['Tech','Finance','Lifestyle']
  status      TEXT DEFAULT 'active', -- active | inactive | paused
  rate_per_post NUMERIC(10,2) DEFAULT 0,
  notes       TEXT,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Content Submissions (creator → digital team)
CREATE TABLE IF NOT EXISTS content_submissions (
  id              BIGSERIAL PRIMARY KEY,
  creator_id      BIGINT REFERENCES digital_creators(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  platform        TEXT NOT NULL,
  content_url     TEXT,
  content_type    TEXT DEFAULT 'post', -- post | video | reel | story | podcast
  status          TEXT DEFAULT 'pending', -- pending | approved | rejected | revision
  reviewer_notes  TEXT,
  reviewed_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Digital Lead Generation per Channel
CREATE TABLE IF NOT EXISTS digital_leads (
  id          BIGSERIAL PRIMARY KEY,
  channel     TEXT NOT NULL,           -- organic | paid_ads | social | email | referral | direct
  platform    TEXT,                    -- Instagram, Google, LinkedIn, etc.
  lead_count  INTEGER DEFAULT 0,
  date        DATE DEFAULT CURRENT_DATE,
  campaign_id TEXT,
  notes       TEXT,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Revenue attributed to digital campaigns
CREATE TABLE IF NOT EXISTS digital_revenue (
  id              BIGSERIAL PRIMARY KEY,
  campaign_name   TEXT NOT NULL,
  channel         TEXT,
  creator_id      BIGINT REFERENCES digital_creators(id) ON DELETE SET NULL,
  revenue_amount  NUMERIC(12,2) DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversions     INTEGER DEFAULT 0,
  period_start    DATE,
  period_end      DATE,
  notes           TEXT,
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ad Creative Library
CREATE TABLE IF NOT EXISTS ad_creatives (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  asset_url   TEXT NOT NULL,
  asset_type  TEXT DEFAULT 'image',   -- image | video | gif | carousel
  platform    TEXT,                   -- Google | Meta | LinkedIn | All
  campaign    TEXT,
  status      TEXT DEFAULT 'pending', -- pending | approved | rejected | archived
  dimensions  TEXT,                   -- e.g. "1080x1080"
  file_size   TEXT,
  notes       TEXT,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Content Calendar Entries
CREATE TABLE IF NOT EXISTS content_calendar (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  creator_id  BIGINT REFERENCES digital_creators(id) ON DELETE SET NULL,
  platform    TEXT NOT NULL,
  content_type TEXT DEFAULT 'post',
  scheduled_date DATE NOT NULL,
  status      TEXT DEFAULT 'planned', -- planned | in_progress | submitted | published | cancelled
  notes       TEXT,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Shared Document Workspace
CREATE TABLE IF NOT EXISTS workspace_documents (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  doc_type    TEXT DEFAULT 'document', -- document | wiki | sop | template | resource
  content     TEXT,                    -- rich text or URL
  doc_url     TEXT,                    -- external link / google docs / file URL
  tags        TEXT[] DEFAULT '{}',
  department  TEXT,                    -- NULL = visible to all
  is_pinned   BOOLEAN DEFAULT FALSE,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Staff Personal Documents (Joining docs, payslips, appraisals)
CREATE TABLE IF NOT EXISTS staff_documents (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type    TEXT NOT NULL,  -- joining_letter | offer_letter | payslip | appraisal | id_card | nda | other
  title       TEXT NOT NULL,
  doc_url     TEXT,           -- Supabase Storage URL or external
  month       TEXT,           -- YYYY-MM for payslips
  notes       TEXT,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Staff Appraisals
CREATE TABLE IF NOT EXISTS staff_appraisals (
  id              BIGSERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period          TEXT NOT NULL,   -- e.g. "Q1 2025", "FY 2024-25"
  rating          NUMERIC(3,1),    -- 1.0 to 5.0
  performance_score INTEGER,       -- 0-100
  goals_met       INTEGER,         -- out of 10
  feedback        TEXT,
  strengths       TEXT,
  areas_to_improve TEXT,
  reviewed_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Personal Leave (also visible to staff themselves)
-- (Already exists as leave_requests — skip if present)

-- Enable RLS & basic policies
ALTER TABLE digital_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_appraisals ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (API uses service role)
CREATE POLICY "service_role_all_digital_creators" ON digital_creators FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_content_submissions" ON content_submissions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_digital_leads" ON digital_leads FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_digital_revenue" ON digital_revenue FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_ad_creatives" ON ad_creatives FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_content_calendar" ON content_calendar FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_workspace_documents" ON workspace_documents FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_staff_documents" ON staff_documents FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_staff_appraisals" ON staff_appraisals FOR ALL TO service_role USING (true);
