-- ============================================================
-- MASTER FIX MIGRATION v2
-- Run this in Supabase SQL Editor — safe to run multiple times
-- NOTE: This app uses custom JWT auth, NOT Supabase Auth.
--       RLS policies only restrict anonymous (public) reads.
--       All admin writes go through service role key (bypasses RLS).
-- ============================================================

-- ── 1. ABOUT PAGE TABLES ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS about_company (
  id SERIAL PRIMARY KEY,
  vision TEXT,
  mission TEXT,
  story TEXT,
  tagline TEXT DEFAULT 'From a small idea to India''s most trusted work companion — powered by passion, driven by purpose.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO about_company (vision, mission, story, tagline)
SELECT
  'To create a global platform where knowledge meets opportunity, making quality education and professional services accessible to every student and business across India and beyond.',
  'To empower 10 million students and 1 million businesses by 2030 through collaborative learning and affordable professional services.',
  'Karya Saarthi was founded with a vision to bridge the gap between what education teaches and what the industry demands.',
  'From a small idea to India''s most trusted work companion — powered by passion, driven by purpose.'
WHERE NOT EXISTS (SELECT 1 FROM about_company);

CREATE TABLE IF NOT EXISTS about_timeline (
  id SERIAL PRIMARY KEY,
  year VARCHAR(10) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO about_timeline (year, title, description, sort_order)
SELECT year, title, description, sort_order FROM (VALUES
  ('2024', 'Karya Saarthi Founded', 'Started with a vision to make professional services accessible to every student and business.', 1),
  ('2024', 'First 100 Clients', 'Crossed 100 happy clients within 6 months of launch.', 2),
  ('2025', '500+ Projects Done', 'Expanded to 50+ service categories across academic, tech, and design.', 3),
  ('2025', 'Going Digital', 'Launched online platform with AI-powered service matching and project tracking.', 4)
) AS v(year, title, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM about_timeline);

CREATE TABLE IF NOT EXISTS about_achievements (
  id SERIAL PRIMARY KEY,
  icon VARCHAR(20) DEFAULT '🏆',
  value VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO about_achievements (icon, value, label, sort_order)
SELECT icon, value, label, sort_order FROM (VALUES
  ('🏆', '500+', 'Projects Delivered', 1),
  ('⭐', '4.9/5', 'Average Rating', 2),
  ('🎓', '50+', 'Service Categories', 3),
  ('🌐', '10+', 'Cities Served', 4),
  ('👨‍💼', '100+', 'Verified Experts', 5),
  ('🔄', '80%', 'Repeat Rate', 6)
) AS v(icon, value, label, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM about_achievements);

CREATE TABLE IF NOT EXISTS about_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(200) NOT NULL,
  image_url TEXT,
  vision TEXT,
  mission TEXT,
  statement TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO about_members (name, role, image_url, vision, mission, statement, sort_order)
SELECT name, role, image_url, vision, mission, statement, sort_order FROM (VALUES
  ('Adv. Saloni Kumari', 'Founder & Director', '/images/team/Saloni.jpg',
   'To create a global platform where knowledge meets opportunity.',
   'To empower 10 million students and 1 million businesses by 2030.',
   'As a legal professional turned entrepreneur, I''ve witnessed the gap between what education teaches and what the industry demands. Karya Saarthi bridges that gap.', 1),
  ('Pawandeep Kaur', 'Co-Founder & Project Manager Head', '/images/team/Pawandeep.jpg',
   'To build the most efficient and customer-centric project delivery system in India.',
   'To ensure 100% on-time delivery with 98%+ customer satisfaction.',
   'Project management is not about deadlines alone - it''s about people.', 2),
  ('Bhawna', 'HR Executive', '/images/team/Bhawna.jpeg',
   'To build the strongest network of verified experts where talent meets opportunity.',
   'To recruit, train, and retain the best talent with 1000+ verified experts by 2027.',
   'People are our biggest asset.', 3),
  ('Rakhi Bhatt', 'Operations Manager', '/images/team/Rakhi.jpeg',
   'To create the most streamlined operational framework where every customer query is resolved within hours.',
   'To maintain 99% operational efficiency through daily monitoring and continuous improvement.',
   'Operations is the backbone of any business. I monitor, I improve, I optimize - daily.', 4)
) AS v(name, role, image_url, vision, mission, statement, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM about_members);

-- RLS: only public SELECT policies needed (writes use service role key)
ALTER TABLE about_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "about_company_public_read" ON about_company;
CREATE POLICY "about_company_public_read" ON about_company FOR SELECT USING (true);

DROP POLICY IF EXISTS "about_timeline_public_read" ON about_timeline;
CREATE POLICY "about_timeline_public_read" ON about_timeline FOR SELECT USING (true);

DROP POLICY IF EXISTS "about_achievements_public_read" ON about_achievements;
CREATE POLICY "about_achievements_public_read" ON about_achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "about_members_public_read" ON about_members;
CREATE POLICY "about_members_public_read" ON about_members FOR SELECT USING (is_active = true);


-- ── 2. BLOGS TABLES ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blog_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO blog_categories (name, slug)
SELECT name, slug FROM (VALUES
  ('Technology', 'technology'),
  ('Business', 'business'),
  ('Design', 'design'),
  ('Marketing', 'marketing'),
  ('Academic', 'academic'),
  ('Career', 'career'),
  ('Government', 'government'),
  ('Legal', 'legal')
) AS v(name, slug)
WHERE NOT EXISTS (SELECT 1 FROM blog_categories);

CREATE TABLE IF NOT EXISTS blogs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  category_id INT REFERENCES blog_categories(id) ON DELETE SET NULL,
  author_id INT REFERENCES users(id) ON DELETE SET NULL,
  featured_image TEXT,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0,
  meta_title VARCHAR(500),
  meta_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for blogs
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blogs_public_read" ON blogs;
CREATE POLICY "blogs_public_read" ON blogs FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "blog_categories_public_read" ON blog_categories;
CREATE POLICY "blog_categories_public_read" ON blog_categories FOR SELECT USING (true);


-- ── 3. EVENTS TABLE FIXES ───────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='guest_name') THEN
    ALTER TABLE events ADD COLUMN guest_name VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='audio_url') THEN
    ALTER TABLE events ADD COLUMN audio_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='status') THEN
    ALTER TABLE events ADD COLUMN status VARCHAR(50) DEFAULT 'upcoming';
  END IF;
END $$;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_public_read" ON events;
CREATE POLICY "events_public_read" ON events FOR SELECT USING (true);


-- ── 4. CONTACT SUBMISSIONS ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(300) NOT NULL,
  email VARCHAR(300) NOT NULL,
  phone VARCHAR(30),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  source VARCHAR(50) DEFAULT 'contact_form',
  status VARCHAR(50) DEFAULT 'new',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_public_insert" ON contact_submissions;
CREATE POLICY "contact_public_insert" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Admins read/update via service role key (bypasses RLS) — no extra policy needed


-- ── 5. VERIFY — Run this to confirm row counts ──────────────────
SELECT 'about_company' AS tbl, COUNT(*) AS rows FROM about_company
UNION ALL SELECT 'about_timeline', COUNT(*) FROM about_timeline
UNION ALL SELECT 'about_achievements', COUNT(*) FROM about_achievements
UNION ALL SELECT 'about_members', COUNT(*) FROM about_members
UNION ALL SELECT 'blog_categories', COUNT(*) FROM blog_categories
UNION ALL SELECT 'blogs', COUNT(*) FROM blogs
UNION ALL SELECT 'contact_submissions', COUNT(*) FROM contact_submissions;
