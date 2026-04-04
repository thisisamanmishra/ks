const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://fgfvwtafwvwmmjyjlmqw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZnZ3dGFmd3Z3bW1qeWpsbXF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE3NjMxNSwiZXhwIjoyMDg5NzUyMzE1fQ.mB3hxBdIyHiEIWWJPp3mZ0dmah4UmWVfu2_djO0cEK4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
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

ALTER TABLE campus_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access" ON campus_events;
CREATE POLICY "Full access" ON campus_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE campus_ambassadors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access" ON campus_ambassadors;
CREATE POLICY "Full access" ON campus_ambassadors FOR ALL USING (true) WITH CHECK (true);
  `;
  const { data, error } = await supabase.rpc('execute_sql', { sql });
  if (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } else {
    console.log('Campus tables created successfully!', data);
  }
}

run();
