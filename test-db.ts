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
  console.log('--- TESTING GROUP CHATS ---')
  const { data: groups, error: groupsError } = await supabase
    .from('group_chats')
    .select('*')
    .limit(5)
  
  if (groupsError) console.error('Groups Error:', groupsError)
  else console.log('Groups Data:', groups)

  console.log('\n--- TESTING GROUP CHAT MEMBERS ---')
  const { data: members, error: membersError } = await supabase
    .from('group_chat_members')
    .select('*, group:group_id(*)')
    .limit(5)

  if (membersError) console.error('Members Error:', membersError)
  else console.log('Members Data:', members)
}

run()
