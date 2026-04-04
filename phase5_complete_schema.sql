-- =================================================================
-- KaryaSaarthi Enterprise — COMPLETE Phase 5 SQL Schema
-- Run this entire file in your Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / DO $$ blocks)
-- =================================================================

-- ─── CORE TABLES ────────────────────────────────────────────────

-- Users (extensions to existing table)
ALTER TABLE users ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pillar_role TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;

-- ─── SERVICES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT NOT NULL DEFAULT 'academic',
  description TEXT,
  short_description TEXT NOT NULL DEFAULT '',
  price_min DECIMAL(12,2),
  price_max DECIMAL(12,2),
  delivery_days INTEGER DEFAULT 7,
  featured_image TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  expert_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_wishlist (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service_id)
);

CREATE TABLE IF NOT EXISTS service_enquiries (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT REFERENCES services(id) ON DELETE SET NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  budget TEXT,
  timeline TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EVENTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  type TEXT NOT NULL DEFAULT 'webinar' CHECK (type IN ('podcast', 'hackathon', 'seminar', 'webinar', 'workshop', 'other')),
  description TEXT,
  short_description TEXT DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  is_online BOOLEAN DEFAULT true,
  meeting_link TEXT,
  max_participants INTEGER,
  registration_count INTEGER DEFAULT 0,
  banner_image TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  team_name TEXT,
  team_members TEXT,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled', 'no_show')),
  payment_status TEXT DEFAULT 'free' CHECK (payment_status IN ('free', 'pending', 'paid', 'refunded')),
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, email)
);

-- ─── NEWSLETTER ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CRM / LEADS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'website' CHECK (source IN ('website', 'whatsapp', 'call', 'social', 'referral', 'walk_in', 'other')),
  service_interest TEXT,
  budget TEXT,
  stage TEXT DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'interested', 'proposal', 'won', 'lost')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  segment TEXT DEFAULT 'student' CHECK (segment IN ('student', 'startup', 'corporate', 'government', 'freelancer', 'other')),
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  next_followup TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_notes (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'note' CHECK (note_type IN ('note', 'call', 'email', 'meeting', 'stage_change')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FINANCE / INVOICES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  project_id BIGINT,
  issued_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 18,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  razorpay_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYMENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
  service_id BIGINT REFERENCES services(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'captured', 'paid', 'failed', 'refunded')),
  description TEXT,
  captured_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HR ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('casual', 'sick', 'earned', 'maternity', 'paternity', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'on_leave')),
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ─── PILLAR MEMBERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pillar_members (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pillar TEXT NOT NULL CHECK (pillar IN ('campus', 'digital', 'calling', 'government', 'market')),
  college_name TEXT,
  territory TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 5,
  total_referrals INTEGER DEFAULT 0,
  total_commission DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pillar)
);

-- ─── ANNOUNCEMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'urgent')),
  target_roles TEXT[] DEFAULT '{all}',
  is_pinned BOOLEAN DEFAULT false,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GROUP CHAT ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_chats (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'team', 'project', 'announcement')),
  avatar TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_chat_members (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL DEFAULT '',
  attachment_url TEXT,
  file_type TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_message_reads (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  message_id BIGINT NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- ─── SLA TRACKING ───────────────────────────────────────────────
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS sla_breach BOOLEAN DEFAULT false;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- ─── INDEXES ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned, created_at);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pillar_members ENABLE ROW LEVEL SECURITY;

-- Public read policies
DROP POLICY IF EXISTS "Services public read" ON services;
CREATE POLICY "Services public read" ON services FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Events public read" ON events;
CREATE POLICY "Events public read" ON events FOR SELECT USING (status != 'cancelled');

DROP POLICY IF EXISTS "Announcements public read" ON announcements;
CREATE POLICY "Announcements public read" ON announcements FOR SELECT USING (true);

-- Insert policies (open for forms)
DROP POLICY IF EXISTS "Newsletter subscribe" ON newsletter_subscribers;
CREATE POLICY "Newsletter subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enquiry submit" ON service_enquiries;
CREATE POLICY "Enquiry submit" ON service_enquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Event registration" ON event_registrations;
CREATE POLICY "Event registration" ON event_registrations FOR INSERT WITH CHECK (true);

-- ─── SEED: Default group chats ──────────────────────────────────
INSERT INTO group_chats (name, description, type)
VALUES
  ('🏢 General', 'Company-wide announcements and discussions', 'general'),
  ('⚙️ Operations', 'Operations team chat', 'team'),
  ('🎯 Sales & CRM', 'Lead discussions and sales strategy', 'team'),
  ('💻 Tech Team', 'Development and technical discussions', 'team')
ON CONFLICT DO NOTHING;

-- ─── SEED: Sample announcements ─────────────────────────────────
INSERT INTO announcements (title, body, type, target_roles, is_pinned)
VALUES
  ('🎉 Welcome to KaryaSaarthi Enterprise', 'This is the new enterprise platform. All team members should update their profiles and explore the new dashboards.', 'info', '{all}', true),
  ('📋 New SLA Policy Effective Immediately', 'All service requests must be completed within 48 hours or escalated to operations manager.', 'warning', '{admin, pillar_member}', false)
ON CONFLICT DO NOTHING;
