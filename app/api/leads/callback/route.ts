import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/leads/callback — request a callback
export async function POST(request: Request) {
  const { name, phone, preferred_time, message } = await request.json()

  if (!name || !phone) {
    return NextResponse.json({ error: 'Name and phone required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('leads').insert({
    name, phone,
    source: 'call',
    stage: 'new',
    priority: 'high',
    type: 'callback',
    preferred_time,
    budget: null,
    service_interest: message || 'Callback request',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 201 })
}

// GET /api/leads/callback — admin: list callback requests
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('type', 'callback')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ callbacks: data || [] })
}
