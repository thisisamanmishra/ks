import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

const ALLOWED = ['super_admin', 'admin', 'board_member']

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const routeType = searchParams.get('type') || searchParams.get('routeType') || 'calendar'

  try {
    const tableMap: Record<string, string> = {
      calendar: 'marketing_calendar',
      referrals: 'marketing_referrals',
      events: 'marketing_events',
      competitor: 'marketing_competitors',
      brand: 'marketing_brand_assets',
    }
    const table = tableMap[routeType]
    if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(200)
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ [routeType]: [] })
      throw error
    }
    return NextResponse.json({ [routeType]: data || [] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ [routeType]: [] })
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user || !ALLOWED.includes(user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const { type, routeType, ...payload } = body
  const _type = routeType || type
  if (!_type) return NextResponse.json({ error: 'type required' }, { status: 400 })
  if (type) payload.type = type

  const supabase = await createClient()

  const tableMap: Record<string, string> = {
    calendar: 'marketing_calendar',
    referrals: 'marketing_referrals',
    events: 'marketing_events',
    competitor: 'marketing_competitors',
    brand: 'marketing_brand_assets',
  }
  const table = tableMap[_type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const { data, error } = await supabase.from(table).insert(payload).select().single()
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ error: 'Table not created yet — run fix_all_panels.sql' }, { status: 503 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ record: data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user || !ALLOWED.includes(user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const { type, routeType, id, ...updates } = body
  const _type = routeType || type
  if (!_type || !id) return NextResponse.json({ error: 'type and id required' }, { status: 400 })
  if (type) updates.type = type

  const supabase = await createClient()
  const tableMap: Record<string, string> = {
    calendar: 'marketing_calendar',
    referrals: 'marketing_referrals',
    events: 'marketing_events',
    competitor: 'marketing_competitors',
    brand: 'marketing_brand_assets',
  }
  const table = tableMap[_type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data })
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user || !ALLOWED.includes(user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { type, routeType, id } = await req.json()
  const _type = routeType || type
  if (!_type || !id) return NextResponse.json({ error: 'type and id required' }, { status: 400 })

  const supabase = await createClient()
  const tableMap: Record<string, string> = {
    calendar: 'marketing_calendar',
    referrals: 'marketing_referrals',
    events: 'marketing_events',
    competitor: 'marketing_competitors',
    brand: 'marketing_brand_assets',
  }
  const table = tableMap[_type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  await supabase.from(table).delete().eq('id', id)
  return NextResponse.json({ success: true })
}
