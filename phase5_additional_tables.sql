-- ========================================================
-- KaryaSaarthi Phase 5 — Additional Tables
-- Run AFTER phase5_enterprise_schema.sql
-- ========================================================

-- Payments table (Razorpay)
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
  service_id BIGINT REFERENCES services(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'captured', 'paid', 'failed', 'refunded')),
  description TEXT,
  captured_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service wishlist
CREATE TABLE IF NOT EXISTS service_wishlist (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service_id)
);

-- Service enquiries
CREATE TABLE IF NOT EXISTS service_enquiries (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT REFERENCES services(id) ON DELETE SET NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  budget TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event registrations (if not already in phase5 schema)
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice items (if not already created)
CREATE TABLE IF NOT EXISTS invoice_items (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead notes (activity log)
CREATE TABLE IF NOT EXISTS lead_notes (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'note' CHECK (note_type IN ('note', 'call', 'email', 'meeting', 'stage_change')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing tables (safe with IF NOT EXISTS equivalent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pillar_role TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS sla_breach BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(id);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- RLS Policies for new tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payments own" ON payments FOR SELECT USING (user_id IN (SELECT id FROM users WHERE id = user_id));
CREATE POLICY "Wishlist own" ON service_wishlist FOR ALL USING (true);
CREATE POLICY "Enquiries insert" ON service_enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Event reg insert" ON event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Newsletter insert" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
