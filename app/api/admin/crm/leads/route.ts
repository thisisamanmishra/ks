import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/admin/crm/leads — extended with pillar, source, date, segment filters
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const stage   = searchParams.get('stage')
  const source  = searchParams.get('source')
  const pillar  = searchParams.get('pillar')
  const segment = searchParams.get('segment')
  const search  = searchParams.get('q')
  const from    = searchParams.get('from')
  const to      = searchParams.get('to')
  const leadId  = searchParams.get('id')
  const limit   = parseInt(searchParams.get('limit') || '100')

  const supabase = await createClient()

  // Single lead detail (for drawer)
  if (leadId) {
    const { data: lead } = await supabase
      .from('leads')
      .select('*, assigned:assigned_to(id, fullname, avatar_url)')
      .eq('id', leadId)
      .single()

    const { data: logs } = await supabase
      .from('crm_followup_log')
      .select('*, creator:created_by(fullname)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ lead, followupLogs: logs || [] })
  }

  let query = supabase
    .from('leads')
    .select('*, assigned:assigned_to(id, fullname)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (stage)   query = query.eq('stage', stage)
  if (source)  query = query.eq('source', source)
  if (pillar)  query = query.eq('pillar', pillar)
  if (segment) query = query.eq('segment', segment)
  if (from)    query = query.gte('created_at', from)
  if (to)      query = query.lte('created_at', to)
  if (search)  query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Stage counts
  const { data: allLeads } = await supabase.from('leads').select('stage, source, pillar, created_at, expected_value')
  const counts: Record<string, number> = {}
  ;(allLeads || []).forEach(l => { counts[l.stage] = (counts[l.stage] || 0) + 1 })

  // Source counts
  const bySrc: Record<string, number> = {}
  ;(allLeads || []).forEach(l => { bySrc[l.source] = (bySrc[l.source] || 0) + 1 })

  return NextResponse.json({
    leads: data || [],
    total: count || 0,
    stageCounts: counts,
    bySource: bySrc,
  })
}

// Pillar auto-assign map
const PILLAR_MAP: Record<string, string> = {
  government: 'government', govt: 'government',
  campus: 'campus', calling: 'calling', digital: 'digital',
  market: 'market', social_media: 'digital', social: 'digital',
  email: 'digital', referral: 'calling', cold_call: 'calling',
  whatsapp: 'calling', field: 'market', website: 'digital',
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, email, phone, source, service_interest, budget, stage, priority, segment, assigned_to, score, pillar, notes } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const supabase = await createClient()

    // Duplicate check
    if (email || phone) {
      let dupQuery = supabase.from('leads').select('id, name')
      if (email) dupQuery = dupQuery.eq('email', email)
      else if (phone) dupQuery = dupQuery.eq('phone', phone)
      const { data: dup } = await dupQuery.maybeSingle()
      if (dup) {
        return NextResponse.json({ error: `Duplicate lead: ${dup.name} (ID: ${dup.id})`, duplicate: true, existingId: dup.id }, { status: 409 })
      }
    }

    // Auto-assign pillar from source
    const autoPillar = pillar || (source ? PILLAR_MAP[source.toLowerCase()] : null) || null

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name, email, phone,
        source: source || 'website',
        service_interest, budget,
        stage: stage || 'new',
        priority: priority || 'medium',
        segment: segment || 'student',
        assigned_to: assigned_to || null,
        score: score || 0,
        pillar: autoPillar,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) throw error

    // Log initial note
    if (notes) {
      await supabase.from('crm_followup_log').insert({
        lead_id: data.id,
        note: `Initial note: ${notes}`,
        note_type: 'note',
        created_by: user.userId,
      })
    }

    return NextResponse.json({ lead: data }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, followup_note, followup_type, next_followup, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })

  const supabase = await createClient()

  // Update lead
  const { data, error } = await supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log stage change or follow-up note
  const logNote = followup_note || (updates.stage ? `Stage → ${updates.stage}` : null)
  if (logNote) {
    await supabase.from('crm_followup_log').insert({
      lead_id: id,
      note: logNote,
      note_type: followup_type || (updates.stage ? 'note' : 'call'),
      next_followup: next_followup || null,
      created_by: user.userId,
    })
  }

  // Update next_followup on lead
  if (next_followup) {
    await supabase.from('leads').update({ next_followup }).eq('id', id)
  }

  return NextResponse.json({ lead: data })
}
