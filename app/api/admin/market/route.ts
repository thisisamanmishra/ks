import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// /api/admin/market?type=clients|deals|research|partners
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'clients'
  const supabase = await createClient()

  const TABLE_MAP: Record<string, string> = {
    clients: 'market_clients', deals: 'market_deals',
    research: 'market_research', partners: 'market_partners'
  }
  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false })
  return NextResponse.json({ [type]: data || [] })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'clients'
  const supabase = await createClient()
  const body = await req.json()

  const TABLE_MAP: Record<string, string> = {
    clients: 'market_clients', deals: 'market_deals',
    research: 'market_research', partners: 'market_partners'
  }
  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  let insertData: Record<string, unknown> = {}
  if (type === 'clients') {
    insertData = { company: body.company, industry: body.industry, contact_person: body.contact, phone: body.phone, email: body.email, contract_value: body.value, stage: body.stage || 'prospect' }
  } else if (type === 'deals') {
    insertData = { company: body.company, service: body.service, value: body.value, probability: Number(body.probability) || 50, close_date: body.closeDate || null, stage: 'qualifying' }
  } else if (type === 'research') {
    insertData = { sector: body.sector, insight: body.insight, source: body.source, research_date: new Date().toISOString().split('T')[0] }
  } else if (type === 'partners') {
    insertData = { name: body.name, partner_type: body.type || 'channel', benefit: body.benefit, contact_person: body.contact }
  }

  const { data, error } = await supabase.from(table).insert(insertData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'clients'
  const TABLE_MAP: Record<string, string> = {
    clients: 'market_clients', deals: 'market_deals',
    research: 'market_research', partners: 'market_partners'
  }
  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  const supabase = await createClient()
  const { id, ...updates } = await req.json()
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}
