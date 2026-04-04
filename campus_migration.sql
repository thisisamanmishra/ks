-- ─── 1. CAMPUS EVENTS ────────────────────────────────────────
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

-- ─── 2. CAMPUS AMBASSADORS ───────────────────────────────────
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

-- ─── 3. RLS POLICIES (FULL ACCESS) ─────────
ALTER TABLE campus_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access" ON campus_events;
CREATE POLICY "Full access" ON campus_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE campus_ambassadors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access" ON campus_ambassadors;
CREATE POLICY "Full access" ON campus_ambassadors FOR ALL USING (true) WITH CHECK (true);

SELECT 'Campus migration complete!' as status;
