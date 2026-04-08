import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) {
    env[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '')
  }
})

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'])

async function run() {
  console.log('--- TESTING AMBASSADORS ---')
  const { data, error } = await supabase
    .from('campus_ambassadors')
    .insert({
       user_id: 2,
       college_id: 1,
       referral_code: 'TEST1234'
    })
    .select()

  if (error) console.error('Error inserting campus_ambassadors:', error)
  else console.log('Successfully inserted:', !!data)
}

run()
