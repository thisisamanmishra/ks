-- =====================================================================
-- blueprint_completion_setup.sql
-- Run this in your Supabase SQL Editor
-- =====================================================================

-- ── Market Saarthi: Field Agents Pillar ──

CREATE TABLE IF NOT EXISTS field_agents (
  id             BIGSERIAL PRIMARY KEY,
  fullname       TEXT NOT NULL,
  phone          TEXT,
  email          TEXT,
  territory      TEXT,
  city           TEXT,
  daily_target   INT DEFAULT 5,
  total_leads    INT DEFAULT 0,
  total_revenue  NUMERIC(10,2) DEFAULT 0,
  status         TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_visits (
  id             BIGSERIAL PRIMARY KEY,
  agent_id       BIGINT REFERENCES field_agents(id) ON DELETE SET NULL,
  agent_name     TEXT,
  area           TEXT NOT NULL,
  city           TEXT,
  contact_name   TEXT,
  contact_phone  TEXT,
  geo_lat        NUMERIC(10,6),
  geo_lng        NUMERIC(10,6),
  outcome        TEXT DEFAULT 'visited' CHECK (outcome IN ('visited','interested','not_home','declined')),
  notes          TEXT,
  visit_date     DATE DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_stalls (
  id              BIGSERIAL PRIMARY KEY,
  agent_id        BIGINT REFERENCES field_agents(id) ON DELETE SET NULL,
  agent_name      TEXT,
  event_name      TEXT NOT NULL,
  location        TEXT,
  city            TEXT,
  stall_date      DATE DEFAULT CURRENT_DATE,
  footfall        INT DEFAULT 0,
  leads_collected INT DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS walk_in_leads (
  id               BIGSERIAL PRIMARY KEY,
  agent_id         BIGINT REFERENCES field_agents(id) ON DELETE SET NULL,
  agent_name       TEXT,
  name             TEXT NOT NULL,
  phone            TEXT NOT NULL,
  email            TEXT,
  service_interest TEXT,
  city             TEXT,
  notes            TEXT,
  status           TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','converted','lost')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Digital Saarthi: Content Calendar ──
CREATE TABLE IF NOT EXISTS content_calendar (
  id             BIGSERIAL PRIMARY KEY,
  creator_id     BIGINT,
  creator_name   TEXT,
  platform       TEXT NOT NULL,
  content_type   TEXT DEFAULT 'post',
  title          TEXT,
  scheduled_date DATE NOT NULL,
  status         TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','published','cancelled')),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Digital: Digital Revenue per campaign ──
CREATE TABLE IF NOT EXISTS digital_campaign_revenue (
  id              BIGSERIAL PRIMARY KEY,
  campaign_name   TEXT NOT NULL,
  channel         TEXT,
  platform        TEXT,
  creator_id      BIGINT,
  creator_name    TEXT,
  revenue_amount  NUMERIC(10,2) DEFAULT 0,
  leads_generated INT DEFAULT 0,
  conversions     INT DEFAULT 0,
  period_start    DATE,
  period_end      DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOD: Board Meeting Notes ──
CREATE TABLE IF NOT EXISTS board_meeting_notes (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  agenda       TEXT,
  minutes      TEXT,
  file_url     TEXT,
  created_by   BIGINT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOD: Brand Assets ──
CREATE TABLE IF NOT EXISTS brand_assets (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT DEFAULT 'logo' CHECK (category IN ('logo','guideline','template','banner','presentation','legal','other')),
  file_url     TEXT NOT NULL,
  description  TEXT,
  uploaded_by  BIGINT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Add guest_name + episode_number + audio_url to events if missing ──
ALTER TABLE events ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS episode_number INT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS speaker_name TEXT;

-- ── Add referral_code to crm_leads if missing ──
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- ── Add lead_score to crm_leads if missing ──
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0;

-- ── Enable RLS (permissive for now) ──
ALTER TABLE field_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_in_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_campaign_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON field_agents;
CREATE POLICY "Allow all for authenticated" ON field_agents FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON field_visits;
CREATE POLICY "Allow all for authenticated" ON field_visits FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON field_stalls;
CREATE POLICY "Allow all for authenticated" ON field_stalls FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON walk_in_leads;
CREATE POLICY "Allow all for authenticated" ON walk_in_leads FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON content_calendar;
CREATE POLICY "Allow all for authenticated" ON content_calendar FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON digital_campaign_revenue;
CREATE POLICY "Allow all for authenticated" ON digital_campaign_revenue FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON board_meeting_notes;
CREATE POLICY "Allow all for authenticated" ON board_meeting_notes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON brand_assets;
CREATE POLICY "Allow all for authenticated" ON brand_assets FOR ALL USING (true);
