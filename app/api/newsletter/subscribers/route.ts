import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/newsletter/subscribers — Admin only: list all newsletter subscribers
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['super_admin', 'admin', 'board_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page   = parseInt(searchParams.get('page') || '1')
  const limit  = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('q') || ''
  const offset = (page - 1) * limit

  const supabase = await createClient()

  let query = supabase
    .from('newsletter_subscribers')
    .select('id, email, subscribed_at, is_active', { count: 'exact' })
    .order('subscribed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.ilike('email', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subscribers: data || [], total: count || 0, page, limit })
}

// PATCH /api/newsletter/subscribers — update subscriber status (unsubscribe)
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['super_admin', 'admin', 'board_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, is_active } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ is_active })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/newsletter/subscribers — hard delete a subscriber
export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
