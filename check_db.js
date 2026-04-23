const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const supabaseKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['users', 'projects', 'tasks', 'messages'];
  for (const t of tables) {
    const { data: cols } = await supabase.from(t).select('*').limit(1);
    console.log(t, cols ? Object.keys(cols[0] || {}) : 'not found or error');
  }
}
check();
