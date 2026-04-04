-- ============================================================
-- KaryaSaarthi Enterprise Schema — Phase 5
-- Run in Supabase SQL Editor
-- ============================================================

-- -------------------------------------------------------
-- STEP 0: Expand role + add new columns to users
-- -------------------------------------------------------

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin','board_member','admin','vendor','customer','pending_admin','pillar_member'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS pillar_role VARCHAR(20)
  CHECK (pillar_role IN ('campus','digital','calling','government','market') OR pillar_role IS NULL);

ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS joining_date DATE;

-- -------------------------------------------------------
-- STEP 1: Services (marketplace)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('academic','technical','business','government','design','marketing','legal','other')),
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  delivery_days INT DEFAULT 3,
  featured_image TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  expert_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

-- -------------------------------------------------------
-- STEP 2: Service Wishlist
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_wishlist (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON service_wishlist(user_id);

-- -------------------------------------------------------
-- STEP 3: Service Enquiries
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_enquiries (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT REFERENCES services(id) ON DELETE SET NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(15),
  message TEXT,
  budget VARCHAR(50),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','contacted','converted','closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- STEP 4: CRM Leads
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(15),
  source VARCHAR(30) DEFAULT 'website' CHECK (source IN ('website','whatsapp','call','social','referral','walk_in','other')),
  service_interest VARCHAR(100),
  budget VARCHAR(50),
  stage VARCHAR(20) DEFAULT 'new' CHECK (stage IN ('new','contacted','interested','proposal','won','lost')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  score INT DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  segment VARCHAR(20) DEFAULT 'student' CHECK (segment IN ('student','startup','corporate','government','freelancer','other')),
  next_followup TIMESTAMPTZ,
  lost_reason TEXT,
  converted_to_user BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- -------------------------------------------------------
-- STEP 5: Lead Notes (follow-up timeline)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_notes (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_type VARCHAR(20) DEFAULT 'note' CHECK (note_type IN ('note','call','email','whatsapp','meeting')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);

-- -------------------------------------------------------
-- STEP 6: Invoices
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  project_id BIGINT REFERENCES service_requests(id) ON DELETE SET NULL,
  client_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 18,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);

-- -------------------------------------------------------
-- STEP 7: Invoice Items
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- -------------------------------------------------------
-- STEP 8: Events (Podcast / Hackathon / Seminar)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('podcast','hackathon','seminar','webinar','workshop','other')),
  description TEXT,
  short_description TEXT,
  featured_image TEXT,
  event_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  venue TEXT,
  is_online BOOLEAN DEFAULT TRUE,
  meeting_link TEXT,
  max_participants INT,
  prize_pool TEXT,
  registration_fee DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('draft','upcoming','live','completed','cancelled')),
  tags TEXT[] DEFAULT '{}',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- -------------------------------------------------------
-- STEP 9: Event Registrations
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_registrations (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  team_name VARCHAR(100),
  team_members TEXT,
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered','confirmed','attended','no_show','waitlisted')),
  payment_status VARCHAR(20) DEFAULT 'free' CHECK (payment_status IN ('free','pending','paid')),
  razorpay_order_id VARCHAR(100),
  registered_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_reg_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_user ON event_registrations(user_id);

-- -------------------------------------------------------
-- STEP 10: Marketing Campaigns
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(20) DEFAULT 'email' CHECK (type IN ('email','whatsapp','social','sms','event','referral')),
  target_segment VARCHAR(20) CHECK (target_segment IN ('all','student','startup','corporate','government')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','scheduled','active','paused','completed')),
  send_at TIMESTAMPTZ,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  total_sent INT DEFAULT 0,
  total_opened INT DEFAULT 0,
  total_clicked INT DEFAULT 0,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- STEP 11: Pillar Members
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS pillar_members (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pillar VARCHAR(20) NOT NULL CHECK (pillar IN ('campus','digital','calling','government','market')),
  college_name VARCHAR(200),
  territory VARCHAR(100),
  commission_rate DECIMAL(5,2) DEFAULT 10,
  total_referrals INT DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  joined_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pillar_members_pillar ON pillar_members(pillar);
CREATE INDEX IF NOT EXISTS idx_pillar_members_user ON pillar_members(user_id);

-- -------------------------------------------------------
-- STEP 12: Commissions / Referrals
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user BIGINT REFERENCES users(id) ON DELETE SET NULL,
  project_id BIGINT REFERENCES service_requests(id) ON DELETE SET NULL,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- STEP 13: Call Logs (Calling Saarthi)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS call_logs (
  id BIGSERIAL PRIMARY KEY,
  caller_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  phone VARCHAR(15) NOT NULL,
  duration_seconds INT DEFAULT 0,
  outcome VARCHAR(20) DEFAULT 'no_answer' CHECK (outcome IN ('no_answer','voicemail','interested','not_interested','callback','converted','wrong_number')),
  notes TEXT,
  called_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller ON call_logs(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead ON call_logs(lead_id);

-- -------------------------------------------------------
-- STEP 14: Tenders (Government Saarthi)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenders (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  organisation VARCHAR(200),
  tender_number VARCHAR(100),
  published_date DATE,
  deadline DATE,
  estimated_value DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','applied','shortlisted','won','lost','withdrawn')),
  category VARCHAR(50),
  document_url TEXT,
  notes TEXT,
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- STEP 15: Announcements (Internal)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  target_roles TEXT[] DEFAULT '{}',
  is_urgent BOOLEAN DEFAULT FALSE,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- STEP 16: Leave Requests (HR)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR(20) DEFAULT 'casual' CHECK (leave_type IN ('casual','sick','earned','maternity','paternity','other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT DEFAULT 1,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leave_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);

-- -------------------------------------------------------
-- STEP 17: Attendance
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present','absent','half_day','late','on_leave')),
  notes TEXT,
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- -------------------------------------------------------
-- STEP 18: Newsletter Subscriptions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- STEP 19: Project files (expand messages table)
-- -------------------------------------------------------
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent'));
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- -------------------------------------------------------
-- STEP 20: Seed sample services
-- -------------------------------------------------------
INSERT INTO services (title, slug, description, short_description, category, price_min, price_max, delivery_days, is_active, is_featured) VALUES
  ('Thesis & Research Paper Writing', 'thesis-research-paper', 'Professional academic writing services for thesis, dissertations, and research papers with proper citations and formatting.', 'Expert academic writing with plagiarism-free content', 'academic', 1500, 15000, 7, true, true),
  ('MBA / BBA Project Report', 'mba-project-report', 'Complete project reports for MBA, BBA and other management students including data analysis and presentations.', 'Complete project reports with analysis', 'academic', 2000, 8000, 5, true, true),
  ('Website Development', 'website-development', 'Custom website development using modern frameworks. From landing pages to full-featured web applications.', 'Modern websites built for your business', 'technical', 5000, 80000, 14, true, true),
  ('Business Plan Writing', 'business-plan', 'Comprehensive business plans for startups, investor pitches, and bank loan applications.', 'Investor-ready business plans', 'business', 3000, 20000, 7, true, true),
  ('Government Tender Documentation', 'govt-tender-docs', 'End-to-end support for government tender documentation, bid preparation and compliance review.', 'Professional tender document preparation', 'government', 5000, 50000, 10, true, false),
  ('Resume & LinkedIn Profile', 'resume-linkedin', 'ATS-optimized resumes and LinkedIn profile optimization to boost your career prospects.', 'Job-winning resumes and profiles', 'business', 500, 3000, 2, true, false),
  ('Data Analysis & Reports', 'data-analysis', 'Statistical analysis, data visualisation and research reports using SPSS, Excel, Python.', 'Professional data analysis services', 'technical', 1000, 12000, 5, true, false),
  ('App Development', 'app-development', 'Mobile app development for Android and iOS using React Native and Flutter.', 'Cross-platform mobile apps', 'technical', 15000, 200000, 30, true, false)
ON CONFLICT (slug) DO NOTHING;

-- -------------------------------------------------------
-- STEP 21: RLS Policies for new tables
-- -------------------------------------------------------
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pillar_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Service role full access for all new tables
CREATE POLICY "Service role full access" ON services FOR ALL USING (true);
CREATE POLICY "Service role full access" ON service_wishlist FOR ALL USING (true);
CREATE POLICY "Service role full access" ON service_enquiries FOR ALL USING (true);
CREATE POLICY "Service role full access" ON leads FOR ALL USING (true);
CREATE POLICY "Service role full access" ON lead_notes FOR ALL USING (true);
CREATE POLICY "Service role full access" ON invoices FOR ALL USING (true);
CREATE POLICY "Service role full access" ON invoice_items FOR ALL USING (true);
CREATE POLICY "Service role full access" ON events FOR ALL USING (true);
CREATE POLICY "Service role full access" ON event_registrations FOR ALL USING (true);
CREATE POLICY "Service role full access" ON campaigns FOR ALL USING (true);
CREATE POLICY "Service role full access" ON pillar_members FOR ALL USING (true);
CREATE POLICY "Service role full access" ON referrals FOR ALL USING (true);
CREATE POLICY "Service role full access" ON call_logs FOR ALL USING (true);
CREATE POLICY "Service role full access" ON tenders FOR ALL USING (true);
CREATE POLICY "Service role full access" ON announcements FOR ALL USING (true);
CREATE POLICY "Service role full access" ON leave_requests FOR ALL USING (true);
CREATE POLICY "Service role full access" ON attendance FOR ALL USING (true);
CREATE POLICY "Service role full access" ON newsletter_subscribers FOR ALL USING (true);
