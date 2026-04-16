import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/events — list events (public)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '10')
  const page = parseInt(searchParams.get('page') || '1')
  const offset = (page - 1) * limit

  const supabase = await createClient()

  // Full column select - gracefully handles missing optional columns
  const fullSelect = 'id, title, slug, type, short_description, featured_image, event_date, end_date, venue, is_online, max_participants, prize_pool, registration_fee, status, tags, created_at'
  const extendedSelect = `${fullSelect}, guest_name, audio_url`

  const buildQuery = (selectStr: string) => {
    let query = supabase
      .from('events')
      .select(selectStr, { count: 'exact' })
      .order('event_date', { ascending: true })
      .range(offset, offset + limit - 1)
    if (type) query = query.eq('type', type)
    if (status) query = query.eq('status', status)
    else query = query.neq('status', 'draft')
    return query
  }

  // Try with extended columns first, fall back to base columns
  let { data, error, count } = await buildQuery(extendedSelect)

  if (error && (error.code === '42703' || error.message?.includes('column'))) {
    // Column doesn't exist yet - fall back to base columns
    const fallback = await buildQuery(fullSelect)
    data = fallback.data
    error = fallback.error
    count = fallback.count
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ events: data || [], total: count || 0, page, limit })
}

// POST /api/events — create event (admin only)
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, type, description, short_description, event_date, end_date, venue, is_online, meeting_link, max_participants, prize_pool, registration_fee, tags, audio_url, guest_name } = body

    if (!title || !type || !event_date) {
      return NextResponse.json({ error: 'title, type, event_date required' }, { status: 400 })
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('events')
      .insert({
        title, slug, type, description, short_description, event_date, end_date,
        venue, is_online: is_online ?? true, meeting_link, max_participants,
        prize_pool, registration_fee: registration_fee || 0,
        tags: tags || [], status: 'upcoming', created_by: user.userId,
        audio_url: audio_url || null, guest_name: guest_name || null
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ event: data }, { status: 201 })
  } catch (err) {
    console.error('Create event error:', err)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

// DELETE /api/events — delete event (admin only)
export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin', 'board_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const supabase = await createClient()
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete event error:', err)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
