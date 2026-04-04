import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('callers')
    .select('*')
    .order('calls_today', { ascending: false })

  if (error || !data) {
    // Fallback: from pillar_members
    const { data: members } = await supabase
      .from('pillar_members')
      .select(`*, user:users(fullname, email, phone)`)
      .eq('pillar', 'calling')
    return NextResponse.json({ callers: (members || []).map(m => ({ id: m.id, fullname: m.user?.fullname || '', email: m.user?.email || '', phone: m.user?.phone || '', shift: 'morning', calls_today: 0, leads_today: 0, conversion_rate: 0, revenue: 0, target_calls: 50 })) })
  }

  return NextResponse.json({ callers: data })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase.from('callers').insert({
    fullname: body.fullname,
    email: body.email,
    phone: body.phone,
    shift: body.shift || 'morning',
    target_calls: body.target_calls || 50,
    calls_today: 0, leads_today: 0, conversion_rate: 0, revenue: 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ caller: data })
}
