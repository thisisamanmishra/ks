const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const supabaseKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('about_members').select('*').limit(1);
  if (error) console.error(error);
  else console.log('Successfully fetched about_members via Service Role.');
  
  // Actually, I can't run RPC without writing a custom postgres function.
  // We can just look at the policies text from the migration file `about_services_migration.sql`
}
check();
