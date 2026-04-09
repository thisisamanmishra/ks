import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// /api/admin/digital-saarthi?type=calendar|revenue
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'calendar'
  const supabase = await createClient()

  if (type === 'calendar') {
    const { data } = await supabase.from('content_calendar').select('*').order('scheduled_date', { ascending: true })
    return NextResponse.json({ calendar: data || [] })
  }

  if (type === 'revenue') {
    const { data } = await supabase.from('digital_campaign_revenue').select('*').order('created_at', { ascending: false })
    return NextResponse.json({ revenue: data || [] })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'calendar'
  const supabase = await createClient()
  const body = await req.json()

  if (type === 'calendar') {
    const { data, error } = await supabase.from('content_calendar').insert({
      creator_name: body.creator_name || null,
      platform: body.platform,
      content_type: body.content_type || 'post',
      title: body.title || null,
      scheduled_date: body.scheduled_date,
      status: body.status || 'planned',
      notes: body.notes || null,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  }

  if (type === 'revenue') {
    const { data, error } = await supabase.from('digital_campaign_revenue').insert({
      campaign_name: body.campaign_name,
      channel: body.channel || null,
      platform: body.platform || null,
      creator_name: body.creator_name || null,
      revenue_amount: body.revenue_amount || 0,
      leads_generated: body.leads_generated || 0,
      conversions: body.conversions || 0,
      period_start: body.period_start || null,
      period_end: body.period_end || null,
      notes: body.notes || null,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'calendar'
  const supabase = await createClient()
  const { id, ...updates } = await req.json()

  const table = type === 'calendar' ? 'content_calendar' : type === 'revenue' ? 'digital_campaign_revenue' : null
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}
