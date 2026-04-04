const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fgfvwtafwvwmmjyjlmqw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZnZ3dGFmd3Z3bW1qeWpsbXF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE3NjMxNSwiZXhwIjoyMDg5NzUyMzE1fQ.mB3hxBdIyHiEIWWJPp3mZ0dmah4UmWVfu2_djO0cEK4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('campaigns').select('*').limit(1);
  if (error) {
    console.error('Error fetching campaigns:', error.message, error.code);
  } else {
    console.log('Campaigns table exists!');
  }
}
check();
