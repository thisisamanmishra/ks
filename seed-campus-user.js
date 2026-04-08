const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) {
    env[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function createCampusUser() {
  console.log('Generating password hash...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Campus@2025', salt);

  console.log('Inserting campus user...');
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      fullname: 'Campus Coordinator',
      email: 'campus@karyasaarthi.com',
      phone: '9999999999',
      password: hashedPassword,
      role: 'pillar_member',
      pillar_role: 'campus',
      status: 'active',
      is_approved: true
    })
    .select()
    .single();

  if (error) {
     if (error.code === '23505') {
        console.log('User already exists! Resetting password...');
        const { error: updErr } = await supabase.from('users').update({
             password: hashedPassword,
             role: 'pillar_member',
             pillar_role: 'campus',
             status: 'active'
        }).eq('email', 'campus@karyasaarthi.com');
        if (updErr) console.error('Update failed:', updErr);
        else console.log('Password reset successful for campus@karyasaarthi.com');
     } else {
        console.error('Error inserting user:', error);
     }
  } else {
     console.log('Successfully created test user:', user.email);
  }
}

createCampusUser();
