const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fgfvwtafwvwmmjyjlmqw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZnZ3dGFmd3Z3bW1qeWpsbXF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE3NjMxNSwiZXhwIjoyMDg5NzUyMzE1fQ.mB3hxBdIyHiEIWWJPp3mZ0dmah4UmWVfu2_djO0cEK4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS campaigns (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT DEFAULT 'digital', channel TEXT DEFAULT 'social', budget NUMERIC, start_date DATE, end_date DATE, status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','draft')), leads_generated INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS marketing_calendar (id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, type TEXT, platform TEXT, date DATE, status TEXT DEFAULT 'planned', created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS marketing_referrals (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, referrals INT DEFAULT 0, commission NUMERIC DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS marketing_events (id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, type TEXT, venue TEXT, capacity INT DEFAULT 0, registrations INT DEFAULT 0, date DATE, status TEXT DEFAULT 'upcoming', created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS marketing_competitors (id BIGSERIAL PRIMARY KEY, competitor TEXT NOT NULL, strength TEXT, weakness TEXT, note TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS marketing_brand_assets (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT, url TEXT, description TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
      
      ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Full access" ON campaigns; CREATE POLICY "Full access" ON campaigns FOR ALL USING (true) WITH CHECK (true);
      ALTER TABLE marketing_calendar ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Full access" ON marketing_calendar; CREATE POLICY "Full access" ON marketing_calendar FOR ALL USING (true) WITH CHECK (true);
      ALTER TABLE marketing_referrals ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Full access" ON marketing_referrals; CREATE POLICY "Full access" ON marketing_referrals FOR ALL USING (true) WITH CHECK (true);
      ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Full access" ON marketing_events; CREATE POLICY "Full access" ON marketing_events FOR ALL USING (true) WITH CHECK (true);
      ALTER TABLE marketing_competitors ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Full access" ON marketing_competitors; CREATE POLICY "Full access" ON marketing_competitors FOR ALL USING (true) WITH CHECK (true);
      ALTER TABLE marketing_brand_assets ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Full access" ON marketing_brand_assets; CREATE POLICY "Full access" ON marketing_brand_assets FOR ALL USING (true) WITH CHECK (true);
    `
  });
  if (error) console.error('Error:', error);
  else console.log('Tables created successfully!', data);
}
run();
