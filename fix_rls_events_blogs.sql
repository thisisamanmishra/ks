-- ============================================================
-- Events table column additions (safe to re-run)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='guest_name') THEN
    ALTER TABLE events ADD COLUMN guest_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='audio_url') THEN
    ALTER TABLE events ADD COLUMN audio_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='slug') THEN
    ALTER TABLE events ADD COLUMN slug TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='short_description') THEN
    ALTER TABLE events ADD COLUMN short_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='featured_image') THEN
    ALTER TABLE events ADD COLUMN featured_image TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='max_participants') THEN
    ALTER TABLE events ADD COLUMN max_participants INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='prize_pool') THEN
    ALTER TABLE events ADD COLUMN prize_pool DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='registration_fee') THEN
    ALTER TABLE events ADD COLUMN registration_fee DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='tags') THEN
    ALTER TABLE events ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='is_online') THEN
    ALTER TABLE events ADD COLUMN is_online BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- ============================================================
-- About tables: Fix RLS to allow server-side (anon) reads
-- ============================================================

-- about_company
ALTER TABLE about_company ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "about_company_public_read" ON about_company;
CREATE POLICY "about_company_public_read" ON about_company FOR SELECT USING (true);
DROP POLICY IF EXISTS "about_company_admin_write" ON about_company;
CREATE POLICY "about_company_admin_write" ON about_company FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE email = auth.jwt()->>'email' AND role IN ('super_admin', 'board_member')));

-- about_timeline
ALTER TABLE about_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "about_timeline_public_read" ON about_timeline;
CREATE POLICY "about_timeline_public_read" ON about_timeline FOR SELECT USING (true);
DROP POLICY IF EXISTS "about_timeline_admin_write" ON about_timeline;
CREATE POLICY "about_timeline_admin_write" ON about_timeline FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE email = auth.jwt()->>'email' AND role IN ('super_admin', 'board_member')));

-- about_achievements
ALTER TABLE about_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "about_achievements_public_read" ON about_achievements;
CREATE POLICY "about_achievements_public_read" ON about_achievements FOR SELECT USING (true);
DROP POLICY IF EXISTS "about_achievements_admin_write" ON about_achievements;
CREATE POLICY "about_achievements_admin_write" ON about_achievements FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE email = auth.jwt()->>'email' AND role IN ('super_admin', 'board_member')));

-- about_members
ALTER TABLE about_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "about_members_public_read" ON about_members;
CREATE POLICY "about_members_public_read" ON about_members FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "about_members_admin_write" ON about_members;
CREATE POLICY "about_members_admin_write" ON about_members FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE email = auth.jwt()->>'email' AND role IN ('super_admin', 'board_member')));

-- ============================================================
-- Blogs: Allow public reads for published blogs (anon role)
-- ============================================================
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blogs_public_read" ON blogs;
CREATE POLICY "blogs_public_read" ON blogs FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "blogs_authenticated_read" ON blogs;
CREATE POLICY "blogs_authenticated_read" ON blogs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "blogs_admin_write" ON blogs;
CREATE POLICY "blogs_admin_write" ON blogs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt()->>'email'
        AND (role IN ('super_admin') OR (department = 'marketing'))
    )
  );

-- ============================================================
-- Events: Allow public reads
-- ============================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_public_read" ON events;
CREATE POLICY "events_public_read" ON events FOR SELECT
  USING (status != 'draft');

DROP POLICY IF EXISTS "events_admin_write" ON events;
CREATE POLICY "events_admin_write" ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt()->>'email'
        AND role IN ('super_admin', 'admin')
    )
  );
