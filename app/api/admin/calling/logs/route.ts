import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') || '100')
  const { data } = await supabase.from('calling_logs').select('*').order('created_at', { ascending: false }).limit(limit)
  return NextResponse.json({ logs: data || [] })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase.from('calling_logs').insert({
    caller_name: body.caller_name || body.caller,
    prospect_name: body.prospect_name || body.prospect,
    prospect_phone: body.phone || null,
    duration: body.duration || null,
    outcome: body.outcome || 'interested',
    notes: body.notes || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}
