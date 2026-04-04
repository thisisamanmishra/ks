-- KaryaSaarthi PostgreSQL Schema for Supabase
-- Run this in Supabase SQL Editor

-- 1. Users Table (Extended with RBAC)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'vendor', 'customer', 'pending_admin')),
    department VARCHAR(20) CHECK (department IN ('hr', 'finance', 'operations', 'marketing') OR department IS NULL),
    is_approved BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    user_type VARCHAR(20) CHECK (user_type IN ('student', 'business', 'professional', 'freelancer') OR user_type IS NULL),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Refresh Tokens Table (JWT)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- 3. Admin Requests Table
CREATE TABLE IF NOT EXISTS admin_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_department VARCHAR(20) NOT NULL CHECK (requested_department IN ('hr', 'finance', 'operations', 'marketing')),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_user ON admin_requests(user_id);

-- 4. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(150),
    specialization VARCHAR(100),
    bio TEXT,
    portfolio_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    total_projects INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vendors_user ON vendors(user_id);

-- 5. Blog Categories Table
CREATE TABLE IF NOT EXISTS blog_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default blog categories
INSERT INTO blog_categories (name, slug, description) VALUES
    ('Educational', 'educational', 'Academic tips, study guides, and learning resources'),
    ('Project', 'project', 'Project management, case studies, and success stories'),
    ('Tech', 'tech', 'Technology trends, web development, and digital tools'),
    ('Business', 'business', 'Business strategies, entrepreneurship, and market insights')
ON CONFLICT (slug) DO NOTHING;

-- 6. Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category_id BIGINT REFERENCES blog_categories(id) ON DELETE SET NULL,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    featured_image TEXT,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    views INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category_id);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(is_published);

-- 7. Service Requests Table (6-step project lifecycle)
CREATE TABLE IF NOT EXISTS service_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    description TEXT,
    budget DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'review', 'delivered', 'completed', 'cancelled')),
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_service_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_user ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_assigned ON service_requests(assigned_to);

-- 7b. Project Messages Table (per-project chat)
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- 8. Project Quotes Table
CREATE TABLE IF NOT EXISTS project_quotes (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    quoted_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quotes_request ON project_quotes(service_request_id);

-- 9. Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_reset_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_reset_email ON password_resets(email);

-- 10. Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_logs(action);

-- 11. Contact Form Submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    service VARCHAR(100),
    message TEXT,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies: Allow service role full access
DROP POLICY IF EXISTS "Service role full access" ON users;
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON service_requests;
CREATE POLICY "Service role full access" ON service_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON contact_submissions;
CREATE POLICY "Service role full access" ON contact_submissions FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON blogs;
CREATE POLICY "Service role full access" ON blogs FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON blog_categories;
CREATE POLICY "Service role full access" ON blog_categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON admin_requests;
CREATE POLICY "Service role full access" ON admin_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON vendors;
CREATE POLICY "Service role full access" ON vendors FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON project_quotes;
CREATE POLICY "Service role full access" ON project_quotes FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON refresh_tokens;
CREATE POLICY "Service role full access" ON refresh_tokens FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON messages;
CREATE POLICY "Service role full access" ON messages FOR ALL USING (true);
