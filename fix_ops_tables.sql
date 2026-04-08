-- Fix Operations & Digital Marketing Tables

CREATE TABLE IF NOT EXISTS ops_inventory (
  id BIGSERIAL PRIMARY KEY,
  item_name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  quantity INT DEFAULT 0,
  min_threshold INT DEFAULT 10,
  unit_price DECIMAL(10,2),
  supplier_id BIGINT,
  status VARCHAR(20) DEFAULT 'in_stock',
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interdept_tasks (
  id BIGSERIAL PRIMARY KEY,
  from_user_id BIGINT,
  to_department VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  completed_by BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_seo_keywords (
  id BIGSERIAL PRIMARY KEY,
  keyword VARCHAR(200) NOT NULL,
  search_volume INT,
  difficulty INT,
  current_rank INT,
  target_url TEXT,
  status VARCHAR(20) DEFAULT 'tracking',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_ad_campaigns (
  id BIGSERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  campaign_name VARCHAR(200) NOT NULL,
  budget DECIMAL(10,2),
  spent DECIMAL(10,2) DEFAULT 0,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  conversions INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_social_posts (
  id BIGSERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  post_content TEXT NOT NULL,
  media_url TEXT,
  scheduled_for TIMESTAMPTZ,
  likes INT DEFAULT 0,
  shares INT DEFAULT 0,
  comments INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_email_campaigns (
  id BIGSERIAL PRIMARY KEY,
  subject VARCHAR(200) NOT NULL,
  audience_segment VARCHAR(100),
  sent_count INT DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0.00,
  click_rate DECIMAL(5,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_content_performance (
  id BIGSERIAL PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  url TEXT,
  views INT DEFAULT 0,
  engagement_time INT DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
