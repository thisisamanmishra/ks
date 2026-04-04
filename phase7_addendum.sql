-- ============================================================
-- KaryaSaarthi — Phase 7 Final Migration (Addendum)
-- Run AFTER phase6_migration.sql
-- Safe, idempotent — all statements use IF NOT EXISTS
-- Adds missing columns & tables for new enterprise features
-- ============================================================

-- ─── Fix paid_ads table ────────────────────────────────────────────
-- phase6 created paid_ads with 'month' column but new API uses 'week_start'
-- Add week_start as an alias column while keeping month for compatibility
ALTER TABLE paid_ads ADD COLUMN IF NOT EXISTS week_start DATE;
ALTER TABLE paid_ads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active','paused','completed','draft'));

-- Fill week_start from month where null
UPDATE paid_ads SET week_start = (month || '-01')::DATE WHERE week_start IS NULL AND month IS NOT NULL;

-- Drop the uniqueness constraint that blocks multiple entries per platform+month
ALTER TABLE paid_ads DROP CONSTRAINT IF EXISTS paid_ads_platform_month_campaign_name_key;

-- ─── Social posts: add engagement + clicks columns ─────────────────
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS engagement INT DEFAULT 0;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS clicks INT DEFAULT 0;

-- ─── Content submissions: add submitted_at ────────────────────────
ALTER TABLE content_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Pillar members: add joined_at ────────────────────────────────
ALTER TABLE pillar_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Tenders: add missing columns ─────────────────────────────────
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS mou_expiry_date DATE;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS bid_document_url TEXT;

-- ─── Call logs: add duration column ───────────────────────────────
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 0;

-- ─── NEW: chatbot_sessions (optional — for tracking chatbot usage) ─
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  escalated BOOLEAN DEFAULT false,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NEW: video_call_sessions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_call_sessions (
  id BIGSERIAL PRIMARY KEY,
  meet_link TEXT NOT NULL,
  initiator_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  participant_name TEXT,
  related_project_id BIGINT REFERENCES service_requests(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_paid_ads_week_start ON paid_ads(week_start);
CREATE INDEX IF NOT EXISTS idx_social_posts_creator ON social_posts(created_by);

-- ─── RLS for new tables ───────────────────────────────────────────
ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Full access" ON chatbot_sessions;
CREATE POLICY "Full access" ON chatbot_sessions FOR ALL USING (true);

DROP POLICY IF EXISTS "Full access" ON video_call_sessions;
CREATE POLICY "Full access" ON video_call_sessions FOR ALL USING (true);

-- ─── VERIFY: Check all required tables exist ──────────────────────
DO $$
DECLARE
  required_tables TEXT[] := ARRAY[
    'referral_codes', 'sop_documents', 'social_posts', 'consultation_bookings',
    'training_materials', 'content_submissions', 'ad_creatives', 'field_visits',
    'govt_contacts', 'monthly_targets', 'content_calendar', 'paid_ads',
    'tenders', 'call_logs', 'pillar_members', 'campaigns'
  ];
  t TEXT;
  missing TEXT[] := '{}';
BEGIN
  FOREACH t IN ARRAY required_tables LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      missing := array_append(missing, t);
    END IF;
  END LOOP;
  IF array_length(missing, 1) > 0 THEN
    RAISE WARNING 'Missing tables: %. Run phase6_migration.sql first!', array_to_string(missing, ', ');
  ELSE
    RAISE NOTICE '✅ All required tables verified. Migration complete!';
  END IF;
END $$;
