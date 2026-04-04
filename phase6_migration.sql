-- ============================================================
-- KaryaSaarthi — Phase 6 Migration
-- Safe to run on top of phase5_enterprise_schema.sql
--   AND phase5_complete_schema.sql (whichever you ran)
-- All statements use IF NOT EXISTS / DO $$ blocks
-- Run this entire file in Supabase SQL Editor
-- ============================================================


-- ─── SECTION 1: Extend existing tables safely ────────────────────

-- leads: add consultation/callback type support
ALTER TABLE leads ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'lead'
  CHECK (type IN ('lead', 'consultation', 'callback', 'enquiry'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_date DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_time TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- service_enquiries: add deadline + referral support
ALTER TABLE service_enquiries ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE service_enquiries ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE service_enquiries ADD COLUMN IF NOT EXISTS step_completed INT DEFAULT 3;

-- campaigns: extend with channel + budget tracking
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS channel TEXT
  CHECK (channel IN ('google', 'meta', 'linkedin', 'email', 'organic', 'whatsapp', 'referral', 'other') OR channel IS NULL);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2) DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS spent DECIMAL(12,2) DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS leads_generated INT DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS subject TEXT;

-- pillar_members: add monthly targets + platform assignments
ALTER TABLE pillar_members ADD COLUMN IF NOT EXISTS monthly_target INT DEFAULT 0;
ALTER TABLE pillar_members ADD COLUMN IF NOT EXISTS platform_assignment TEXT;  -- for digital pillar
ALTER TABLE pillar_members ADD COLUMN IF NOT EXISTS shift_schedule TEXT;       -- for calling pillar
ALTER TABLE pillar_members ADD COLUMN IF NOT EXISTS territory_zone TEXT;       -- for market pillar

-- tenders: extend if exists (from phase5_enterprise_schema.sql only, not complete)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenders') THEN
    CREATE TABLE tenders (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      organisation TEXT,
      tender_number TEXT,
      published_date DATE,
      deadline DATE,
      estimated_value DECIMAL(15,2),
      status TEXT DEFAULT 'new' CHECK (status IN ('new','applied','shortlisted','won','lost','withdrawn')),
      category TEXT,
      document_url TEXT,
      notes TEXT,
      compliance_checklist JSONB DEFAULT '[]',
      assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    ALTER TABLE tenders ADD COLUMN IF NOT EXISTS compliance_checklist JSONB DEFAULT '[]';
    ALTER TABLE tenders ADD COLUMN IF NOT EXISTS mou_expiry_date DATE;
    ALTER TABLE tenders ADD COLUMN IF NOT EXISTS contact_name TEXT;
    ALTER TABLE tenders ADD COLUMN IF NOT EXISTS contact_email TEXT;
    ALTER TABLE tenders ADD COLUMN IF NOT EXISTS contact_phone TEXT;
    ALTER TABLE tenders ADD COLUMN IF NOT EXISTS bid_document_url TEXT;
  END IF;
END $$;

-- call_logs: extend if exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_logs') THEN
    CREATE TABLE call_logs (
      id BIGSERIAL PRIMARY KEY,
      caller_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
      phone TEXT NOT NULL,
      duration_seconds INT DEFAULT 0,
      outcome TEXT DEFAULT 'no_answer'
        CHECK (outcome IN ('no_answer','voicemail','interested','not_interested','callback','converted','wrong_number')),
      notes TEXT,
      follow_up_date DATE,
      called_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS follow_up_date DATE;
  END IF;
END $$;


-- ─── SECTION 2: NEW TABLES ────────────────────────────────────────

-- Referral Codes (for ambassadors and campaigns)
CREATE TABLE IF NOT EXISTS referral_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  pillar_member_id BIGINT REFERENCES pillar_members(id) ON DELETE SET NULL,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uses INT DEFAULT 0,
  max_uses INT,                      -- NULL = unlimited
  discount_percent DECIMAL(5,2) DEFAULT 0,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_member ON referral_codes(pillar_member_id);

-- SOP Documents (Operations — shared library)
CREATE TABLE IF NOT EXISTS sop_documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general'
    CHECK (category IN ('general','operations','campus','digital','calling','government','market','hr','finance')),
  version TEXT DEFAULT '1.0',
  is_published BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  file_url TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sop_category ON sop_documents(category);
CREATE INDEX IF NOT EXISTS idx_sop_published ON sop_documents(is_published);

-- Social Media Posts (Digital Marketing scheduling)
CREATE TABLE IF NOT EXISTS social_posts (
  id BIGSERIAL PRIMARY KEY,
  platform TEXT NOT NULL
    CHECK (platform IN ('instagram','facebook','linkedin','twitter','youtube','whatsapp')),
  title TEXT,
  content TEXT NOT NULL,
  media_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','published','failed','cancelled')),
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  reach INT DEFAULT 0,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  campaign_id BIGINT REFERENCES campaigns(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at);

-- Consultation Bookings (Lead magnet / free consultation)
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_interest TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  zoom_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consultation_status ON consultation_bookings(status);
CREATE INDEX IF NOT EXISTS idx_consultation_date ON consultation_bookings(preferred_date);

-- Training Materials (Campus / Pillar training uploads)
CREATE TABLE IF NOT EXISTS training_materials (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT DEFAULT 'pdf'
    CHECK (file_type IN ('pdf','video','doc','slides','link','other')),
  pillar TEXT
    CHECK (pillar IN ('campus','digital','calling','government','market','all')),
  is_published BOOLEAN DEFAULT true,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_training_pillar ON training_materials(pillar);

-- Content Submissions (Digital Saarthi — creator submissions)
CREATE TABLE IF NOT EXISTS content_submissions (
  id BIGSERIAL PRIMARY KEY,
  creator_id BIGINT REFERENCES pillar_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('instagram','facebook','linkedin','youtube','twitter','blog','other')),
  content_url TEXT,
  media_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','under_review','approved','rejected','published')),
  reviewer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  published_at TIMESTAMPTZ,
  likes INT DEFAULT 0,
  views INT DEFAULT 0,
  leads_generated INT DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_submissions_creator ON content_submissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_submissions_status ON content_submissions(status);

-- Ad Creative Library (Digital Saarthi)
CREATE TABLE IF NOT EXISTS ad_creatives (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'image'
    CHECK (type IN ('image','video','carousel','story','banner','other')),
  platform TEXT CHECK (platform IN ('google','meta','linkedin','instagram','other')),
  file_url TEXT,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','archived','rejected')),
  campaign_id BIGINT REFERENCES campaigns(id) ON DELETE SET NULL,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Field Agent Visits (Market Saarthi — geo reports)
CREATE TABLE IF NOT EXISTS field_visits (
  id BIGSERIAL PRIMARY KEY,
  agent_id BIGINT REFERENCES pillar_members(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  visit_type TEXT DEFAULT 'client_visit'
    CHECK (visit_type IN ('client_visit','event','stall','campus_visit','cold_call','other')),
  notes TEXT,
  leads_captured INT DEFAULT 0,
  outcome TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_field_visits_agent ON field_visits(agent_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_date ON field_visits(visited_at);

-- Govt Client Contacts (Government Saarthi directory)
CREATE TABLE IF NOT EXISTS govt_contacts (
  id BIGSERIAL PRIMARY KEY,
  organisation TEXT NOT NULL,
  contact_name TEXT,
  designation TEXT,
  email TEXT,
  phone TEXT,
  department TEXT,
  category TEXT DEFAULT 'central'
    CHECK (category IN ('central','state','psu','municipality','other')),
  notes TEXT,
  tender_id BIGINT REFERENCES tenders(id) ON DELETE SET NULL,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly Targets (Pillar performance tracking)
CREATE TABLE IF NOT EXISTS monthly_targets (
  id BIGSERIAL PRIMARY KEY,
  pillar_member_id BIGINT REFERENCES pillar_members(id) ON DELETE CASCADE,
  month TEXT NOT NULL,       -- format: 'YYYY-MM'
  target_leads INT DEFAULT 0,
  target_revenue DECIMAL(12,2) DEFAULT 0,
  actual_leads INT DEFAULT 0,
  actual_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pillar_member_id, month)
);
CREATE INDEX IF NOT EXISTS idx_monthly_targets_member ON monthly_targets(pillar_member_id);
CREATE INDEX IF NOT EXISTS idx_monthly_targets_month ON monthly_targets(month);

-- Content Calendar (Marketing — blog, social, email schedule)
CREATE TABLE IF NOT EXISTS content_calendar (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content_type TEXT DEFAULT 'blog'
    CHECK (content_type IN ('blog','social','email','video','podcast','event','other')),
  platform TEXT,
  scheduled_date DATE NOT NULL,
  status TEXT DEFAULT 'planned'
    CHECK (status IN ('planned','in_progress','ready','published','cancelled')),
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  campaign_id BIGINT REFERENCES campaigns(id) ON DELETE SET NULL,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);

-- Paid Ads Tracker (Digital Marketing — manual input)
CREATE TABLE IF NOT EXISTS paid_ads (
  id BIGSERIAL PRIMARY KEY,
  platform TEXT NOT NULL
    CHECK (platform IN ('google','meta','linkedin','youtube','twitter','other')),
  campaign_name TEXT,
  month TEXT NOT NULL,     -- format: 'YYYY-MM'
  budget DECIMAL(12,2) DEFAULT 0,
  spent DECIMAL(12,2) DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  leads INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  campaign_id BIGINT REFERENCES campaigns(id) ON DELETE SET NULL,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, month, campaign_name)
);
CREATE INDEX IF NOT EXISTS idx_paid_ads_platform ON paid_ads(platform);
CREATE INDEX IF NOT EXISTS idx_paid_ads_month ON paid_ads(month);


-- ─── SECTION 3: ROW LEVEL SECURITY ───────────────────────────────

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE govt_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate to avoid duplicate policy errors
DO $$ 
DECLARE policies TEXT[] := ARRAY[
  'referral_codes', 'sop_documents', 'social_posts', 'consultation_bookings',
  'training_materials', 'content_submissions', 'ad_creatives', 'field_visits',
  'govt_contacts', 'monthly_targets', 'content_calendar', 'paid_ads',
  'tenders', 'call_logs'
];
p TEXT;
BEGIN
  FOREACH p IN ARRAY policies LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Full access" ON %I', p);
    EXECUTE format('CREATE POLICY "Full access" ON %I FOR ALL USING (true)', p);
  END LOOP;
END $$;

-- Public: consultation booking (no login required)
DROP POLICY IF EXISTS "Public consultation submit" ON consultation_bookings;
CREATE POLICY "Public consultation submit" ON consultation_bookings
  FOR INSERT WITH CHECK (true);

-- Public: training materials read
DROP POLICY IF EXISTS "Public training read" ON training_materials;
CREATE POLICY "Public training read" ON training_materials
  FOR SELECT USING (is_published = true);

-- Public: SOP read (published)
DROP POLICY IF EXISTS "Public sop read" ON sop_documents;
CREATE POLICY "Public sop read" ON sop_documents
  FOR SELECT USING (is_published = true);


-- ─── SECTION 4: SEED DATA ────────────────────────────────────────

-- Default SOP documents
INSERT INTO sop_documents (title, content, category, version, is_published) VALUES
  ('Client Onboarding Process', 'Step 1: Initial call\nStep 2: Requirements gathering\nStep 3: Proposal\nStep 4: Agreement\nStep 5: Project kick-off', 'operations', '1.0', true),
  ('Vendor Assignment Guidelines', 'When assigning vendors:\n1. Check expertise match\n2. Check current workload < 3 active projects\n3. Get vendor confirmation\n4. Set SLA deadline', 'operations', '1.0', true),
  ('Lead Qualification Criteria', 'Score leads: Budget (30pts) + Timeline (20pts) + Decision maker (30pts) + Fit (20pts)\nHigh priority: 70+\nMedium: 40-69\nLow: <40', 'general', '1.0', true)
ON CONFLICT DO NOTHING;

-- Seed referral codes example
INSERT INTO referral_codes (code, discount_percent, is_active) VALUES
  ('KARYA10', 10, true),
  ('CAMPUS20', 20, true),
  ('WELCOME15', 15, true)
ON CONFLICT (code) DO NOTHING;

-- Default content calendar entries for current month
INSERT INTO content_calendar (title, content_type, platform, scheduled_date, status) VALUES
  ('KaryaSaarthi Services Overview Blog', 'blog', 'website', CURRENT_DATE + 2, 'planned'),
  ('LinkedIn Company Update', 'social', 'linkedin', CURRENT_DATE + 3, 'planned'),
  ('Monthly Newsletter', 'email', 'email', CURRENT_DATE + 7, 'planned')
ON CONFLICT DO NOTHING;
