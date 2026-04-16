-- ============================================================
-- About Page Dynamic Content Tables
-- ============================================================

-- Company vision & mission (singleton)
CREATE TABLE IF NOT EXISTS about_company (
  id SERIAL PRIMARY KEY,
  vision TEXT,
  mission TEXT,
  story TEXT,
  tagline TEXT DEFAULT 'From a small idea to India''s most trusted work companion — powered by passion, driven by purpose.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row if none exists
INSERT INTO about_company (vision, mission, story)
SELECT
  'To create a global platform where knowledge meets opportunity, making quality education and professional services accessible to every student and business across India and beyond.',
  'To empower 10 million students and 1 million businesses by 2030 through collaborative learning and affordable professional services.',
  'Karya Saarthi was founded with a vision to bridge the gap between what education teaches and what the industry demands.'
WHERE NOT EXISTS (SELECT 1 FROM about_company);

-- Timeline entries
CREATE TABLE IF NOT EXISTS about_timeline (
  id SERIAL PRIMARY KEY,
  year VARCHAR(10) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default timeline
INSERT INTO about_timeline (year, title, description, sort_order) VALUES
  ('2024', 'Karya Saarthi Founded', 'Started with a vision to make professional services accessible to every student and business.', 1),
  ('2024', 'First 100 Clients', 'Crossed 100 happy clients within 6 months of launch.', 2),
  ('2025', '500+ Projects Done', 'Expanded to 50+ service categories across academic, tech, and design.', 3),
  ('2025', 'Going Digital', 'Launched online platform with AI-powered service matching and project tracking.', 4)
ON CONFLICT DO NOTHING;

-- Achievement stats
CREATE TABLE IF NOT EXISTS about_achievements (
  id SERIAL PRIMARY KEY,
  icon VARCHAR(20) DEFAULT '🏆',
  value VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default achievements
INSERT INTO about_achievements (icon, value, label, sort_order) VALUES
  ('🏆', '500+', 'Projects Delivered', 1),
  ('⭐', '4.9/5', 'Average Rating', 2),
  ('🎓', '50+', 'Service Categories', 3),
  ('🌐', '10+', 'Cities Served', 4),
  ('👨‍💼', '100+', 'Verified Experts', 5),
  ('🔄', '80%', 'Repeat Rate', 6)
ON CONFLICT DO NOTHING;

-- Team members / Board of Directors
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

-- Seed default members
INSERT INTO about_members (name, role, image_url, vision, mission, statement, sort_order) VALUES
  ('Adv. Saloni Kumari', 'Founder & Director', '/images/team/Saloni.jpg',
   'To create a global platform where knowledge meets opportunity, making quality education and professional services accessible to every student and business across India and beyond.',
   'To empower 10 million students and 1 million businesses by 2030 through collaborative learning and affordable professional services.',
   'As a legal professional turned entrepreneur, I''ve witnessed the gap between what education teaches and what the industry demands. Karya Saarthi bridges that gap. We are not service providers; we are growth partners.',
   1),
  ('Pawandeep Kaur', 'Co-Founder & Project Manager Head', '/images/team/Pawandeep.jpg',
   'To build the most efficient and customer-centric project delivery system in India.',
   'To ensure 100% on-time delivery with 98%+ customer satisfaction through transparent communication and quality control.',
   'Project management is not about deadlines alone - it''s about people. Every project has a student behind it with dreams. My role is to ensure they sleep peacefully knowing their project is in safe hands.',
   2),
  ('Bhawna', 'HR Executive', '/images/team/Bhawna.jpeg',
   'To build the strongest network of verified experts where talent meets opportunity.',
   'To recruit, train, and retain the best talent with 1000+ verified experts across 100+ specializations by 2027.',
   'People are our biggest asset. Every vendor we hire, every intern we train - they all contribute to the Karya Saarthi family.',
   3),
  ('Rakhi Bhatt', 'Operations Manager', '/images/team/Rakhi.jpeg',
   'To create the most streamlined operational framework where every customer query is resolved within hours.',
   'To maintain 99% operational efficiency through daily monitoring, customer feedback integration, and continuous improvement.',
   'Operations is the backbone of any business. I monitor, I improve, I optimize - daily.',
   4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Services: ensure featured_image, is_active, is_featured columns exist
-- (safe to run even if columns already exist)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='featured_image') THEN
    ALTER TABLE services ADD COLUMN featured_image TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='is_active') THEN
    ALTER TABLE services ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='is_featured') THEN
    ALTER TABLE services ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='rating') THEN
    ALTER TABLE services ADD COLUMN rating NUMERIC(3,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='total_orders') THEN
    ALTER TABLE services ADD COLUMN total_orders INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='tags') THEN
    ALTER TABLE services ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- RLS: allow public reads for about tables
ALTER TABLE about_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "about_company_public_read" ON about_company FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "about_timeline_public_read" ON about_timeline FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "about_achievements_public_read" ON about_achievements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "about_members_public_read" ON about_members FOR SELECT USING (is_active = true);
