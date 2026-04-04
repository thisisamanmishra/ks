import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/marketing/events — public + admin
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const status = searchParams.get('status')
  const type = searchParams.get('type')

  if (id) {
    const { data, error } = await supabase
      .from('events')
      .select(`*, registrations:event_registrations(id, name, email, status, created_at)`)
      .eq('id', id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ event: data })
  }

  let query = supabase.from('events').select('*').order('event_date', { ascending: true }).limit(50)
  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ events: data || [] })
}

// POST /api/marketing/events — create event (admin only)
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin', 'board_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = await createClient()

  // Auto slug
  const slug = body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

  const { data, error } = await supabase
    .from('events')
    .insert({ ...body, slug, created_by: user.userId, status: 'upcoming' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data }, { status: 201 })
}

// PATCH /api/marketing/events?id=X — update status etc
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin', 'board_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await request.json()
  const supabase = await createClient()
  const { data, error } = await supabase.from('events').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data })
}

// DELETE /api/marketing/events?id=X
export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  await supabase.from('events').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
