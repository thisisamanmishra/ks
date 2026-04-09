import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// /api/admin/market?type=agents|visits|stalls|walkin|coverage|stats
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'agents'
  const supabase = await createClient()

  const TABLE_MAP: Record<string, string> = {
    agents: 'field_agents',
    visits: 'field_visits',
    stalls: 'field_stalls',
    walkin: 'walk_in_leads',
  }

  if (type === 'coverage') {
    // Aggregate city-level visit counts
    const { data: visits } = await supabase.from('field_visits').select('city, area')
    const coverage: Record<string, number> = {}
    for (const v of visits || []) {
      const key = v.city || 'Unknown'
      coverage[key] = (coverage[key] || 0) + 1
    }
    return NextResponse.json({ coverage })
  }

  if (type === 'stats') {
    const [agRes, visitRes, stallRes, leadRes] = await Promise.all([
      supabase.from('field_agents').select('id, total_leads, total_revenue, status'),
      supabase.from('field_visits').select('id'),
      supabase.from('field_stalls').select('id, leads_collected'),
      supabase.from('walk_in_leads').select('id, status'),
    ])
    const agents = agRes.data || []
    return NextResponse.json({
      totalAgents: agents.length,
      activeAgents: agents.filter((a: any) => a.status === 'active').length,
      totalRevenue: agents.reduce((s: number, a: any) => s + (a.total_revenue || 0), 0),
      totalLeads: agents.reduce((s: number, a: any) => s + (a.total_leads || 0), 0),
      totalVisits: (visitRes.data || []).length,
      stallLeads: (stallRes.data || []).reduce((s: number, st: any) => s + (st.leads_collected || 0), 0),
      walkInLeads: (leadRes.data || []).length,
    })
  }

  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  let query = supabase.from(table).select('*').order('created_at', { ascending: false })
  const agentId = searchParams.get('agent_id')
  if (agentId && type !== 'agents') query = query.eq('agent_id', agentId)

  const { data } = await query
  return NextResponse.json({ [type]: data || [] })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'agents'
  const supabase = await createClient()
  const body = await req.json()

  const TABLE_MAP: Record<string, string> = {
    agents: 'field_agents',
    visits: 'field_visits',
    stalls: 'field_stalls',
    walkin: 'walk_in_leads',
  }

  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  let insertData: Record<string, unknown> = {}

  if (type === 'agents') {
    insertData = {
      fullname: body.fullname,
      phone: body.phone || null,
      email: body.email || null,
      territory: body.territory || null,
      city: body.city || null,
      daily_target: Number(body.daily_target) || 5,
      status: body.status || 'active',
      total_leads: 0,
      total_revenue: 0,
    }
  } else if (type === 'visits') {
    insertData = {
      agent_id: body.agent_id || null,
      agent_name: body.agent_name || null,
      area: body.area,
      city: body.city || null,
      contact_name: body.contact_name || null,
      contact_phone: body.contact_phone || null,
      geo_lat: body.geo_lat || null,
      geo_lng: body.geo_lng || null,
      notes: body.notes || null,
      outcome: body.outcome || 'visited',
      visit_date: body.visit_date || new Date().toISOString().split('T')[0],
    }
  } else if (type === 'stalls') {
    insertData = {
      agent_id: body.agent_id || null,
      agent_name: body.agent_name || null,
      event_name: body.event_name,
      location: body.location || null,
      city: body.city || null,
      stall_date: body.stall_date || new Date().toISOString().split('T')[0],
      footfall: Number(body.footfall) || 0,
      leads_collected: Number(body.leads_collected) || 0,
      notes: body.notes || null,
    }
  } else if (type === 'walkin') {
    insertData = {
      agent_id: body.agent_id || null,
      agent_name: body.agent_name || null,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      service_interest: body.service_interest || null,
      city: body.city || null,
      notes: body.notes || null,
      status: 'new',
    }
    // Also auto-create CRM lead
    await supabase.from('crm_leads').insert({
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      source: 'field',
      assigned_pillar: 'market',
      status: 'new',
      notes: `Walk-in lead captured by ${body.agent_name || 'field agent'}. Interested in: ${body.service_interest || 'General'}`,
    })
  }

  const { data, error } = await supabase.from(table).insert(insertData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'agents'
  const TABLE_MAP: Record<string, string> = {
    agents: 'field_agents',
    visits: 'field_visits',
    stalls: 'field_stalls',
    walkin: 'walk_in_leads',
  }
  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  const supabase = await createClient()
  const { id, ...updates } = await req.json()
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'agents'
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const TABLE_MAP: Record<string, string> = {
    agents: 'field_agents', visits: 'field_visits', stalls: 'field_stalls', walkin: 'walk_in_leads',
  }
  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  const supabase = await createClient()
  await supabase.from(table).delete().eq('id', id)
  return NextResponse.json({ success: true })
}
