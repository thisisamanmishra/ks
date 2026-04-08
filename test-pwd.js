const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function fixUser() {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) {
      env[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  });

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('aman1234', salt);

  const { data, error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('email', 'amanmishra121502@gmail.com')
    .select();

  if (error) console.error('Error:', error);
  else console.log('Successfully updated password for amanmishra121502@gmail.com!');
}
fixUser();
