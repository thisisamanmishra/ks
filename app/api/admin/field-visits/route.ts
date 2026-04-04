import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('field_visits')
    .select(`
      id, location, visit_type, notes, leads_captured, outcome, visited_at,
      agent:agent_id(id, user_id, user:user_id(fullname))
    `)
    .order('visited_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ visits: data || [] })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.location) return NextResponse.json({ error: 'Location required' }, { status: 400 })

  const supabase = await createClient()
  
  // Find the pillar_member record for this user
  const { data: member } = await supabase
    .from('pillar_members')
    .select('id')
    .eq('user_id', user.userId)
    .eq('pillar', 'market')
    .single()

  const { data, error } = await supabase
    .from('field_visits')
    .insert({ ...body, agent_id: member?.id })
    .select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ visit: data }, { status: 201 })
}
