import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

const ALLOWED_ROLES = ['super_admin', 'admin', 'board_member']

// GET /api/admin/crm — leads list
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage')
  const source = searchParams.get('source')
  const assignedTo = searchParams.get('assignedTo')
  const search = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '50')

  const supabase = await createClient()
  let query = supabase
    .from('leads')
    .select(`
      id, name, email, phone, source, service_interest, budget, stage, priority,
      score, segment, next_followup, created_at, updated_at,
      assigned:assigned_to(id, fullname, avatar_url)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (stage) query = query.eq('stage', stage)
  if (source) query = query.eq('source', source)
  if (assignedTo) query = query.eq('assigned_to', assignedTo)
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Stage counts
  const { data: stageCounts } = await supabase
    .from('leads')
    .select('stage')

  const counts: Record<string, number> = {}
  ;(stageCounts || []).forEach(l => { counts[l.stage] = (counts[l.stage] || 0) + 1 })

  return NextResponse.json({ leads: data || [], total: count || 0, stageCounts: counts })
}

// POST /api/admin/crm — create lead
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, email, phone, source, service_interest, budget, stage, priority, segment, assigned_to, score } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    // Duplicate check
    if (email || phone) {
      const supabase = await createClient()
      let dupQuery = supabase.from('leads').select('id, name')
      if (email) dupQuery = dupQuery.eq('email', email)
      else if (phone) dupQuery = dupQuery.eq('phone', phone)
      const { data: dup } = await dupQuery.single()
      if (dup) {
        return NextResponse.json({ error: `Duplicate lead — existing record: ${dup.name} (ID: ${dup.id})`, duplicate: true }, { status: 409 })
      }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name, email, phone, source: source || 'website',
        service_interest, budget, stage: stage || 'new',
        priority: priority || 'medium', segment: segment || 'student',
        assigned_to: assigned_to || null, score: score || 0,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ lead: data }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

// PATCH /api/admin/crm — update lead stage (quick update)
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log note on stage change
  if (updates.stage) {
    await supabase.from('lead_notes').insert({
      lead_id: id,
      user_id: user.userId,
      note: `Stage updated to: ${updates.stage}`,
      note_type: 'note',
    })
  }

  return NextResponse.json({ lead: data })
}
