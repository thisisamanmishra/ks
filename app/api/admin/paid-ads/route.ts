import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')
  const weekStart = searchParams.get('week_start')

  const supabase = await createClient()
  let query = supabase
    .from('paid_ads')
    .select('*')
    .order('week_start', { ascending: false })

  if (platform) query = query.eq('platform', platform)
  if (weekStart) query = query.eq('week_start', weekStart)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ads: data || [] })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.campaign_name) return NextResponse.json({ error: 'campaign_name required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('paid_ads')
    .insert({ ...body, created_by: user.userId })
    .select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ad: data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.from('paid_ads').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
