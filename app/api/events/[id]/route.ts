import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/events/[id]
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      creator:created_by(id, fullname, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (error || !event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const { count: registrationCount } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)
    .in('status', ['registered', 'confirmed', 'attended'])

  return NextResponse.json({ event: { ...event, registrationCount: registrationCount || 0 } })
}

// PATCH /api/events/[id] (admin)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data })
}

// DELETE /api/events/[id] (admin)
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
