-- ─── CAMPUS SAARTHI V2 MIGRATION ────────────────────────────────────────────
-- Run this in Supabase SQL editor

-- ─── 1. TRAINING MATERIALS (DB-backed) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS campus_training_materials (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT DEFAULT 'pdf',
  pillar TEXT DEFAULT 'campus',
  is_published BOOLEAN DEFAULT true,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campus_training_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access campus training" ON campus_training_materials;
CREATE POLICY "Full access campus training" ON campus_training_materials FOR ALL USING (true) WITH CHECK (true);

-- ─── 2. REFERRAL CODE USAGE TRACKING ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campus_referral_uses (
  id BIGSERIAL PRIMARY KEY,
  ambassador_id BIGINT REFERENCES campus_ambassadors(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  lead_name TEXT,
  lead_email TEXT,
  lead_phone TEXT,
  revenue NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campus_referral_uses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access referral uses" ON campus_referral_uses;
CREATE POLICY "Full access referral uses" ON campus_referral_uses FOR ALL USING (true) WITH CHECK (true);

-- ─── 3. AMBASSADOR MONTHLY TARGETS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ambassador_monthly_targets (
  id BIGSERIAL PRIMARY KEY,
  ambassador_id BIGINT REFERENCES campus_ambassadors(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- format: 'YYYY-MM'
  target INT DEFAULT 0,
  achieved INT DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ambassador_id, month)
);

ALTER TABLE ambassador_monthly_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access monthly targets" ON ambassador_monthly_targets;
CREATE POLICY "Full access monthly targets" ON ambassador_monthly_targets FOR ALL USING (true) WITH CHECK (true);

-- ─── 4. ADD MISSING COLUMNS TO campus_ambassadors IF NOT EXISTS ──────────────
ALTER TABLE campus_ambassadors ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE campus_ambassadors ADD COLUMN IF NOT EXISTS city TEXT;

-- ─── 5. CREATE STORAGE BUCKET for campus training materials ──────────────────
-- Run this via Supabase dashboard: Storage > New bucket > campus-training (Public)
-- OR run: INSERT INTO storage.buckets (id, name, public) VALUES ('campus-training', 'campus-training', true) ON CONFLICT DO NOTHING;

SELECT 'Campus Saarthi v2 migration complete!' as status;
