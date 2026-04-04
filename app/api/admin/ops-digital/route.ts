import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

const ALLOWED = ['super_admin', 'admin', 'board_member']

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const routeType = searchParams.get('type') || searchParams.get('routeType') || 'keywords'

  const tableMap: Record<string, string> = {
    keywords: 'dm_seo_keywords',
    ads: 'dm_ad_campaigns',
    social: 'dm_social_posts',
    email: 'dm_email_campaigns',
    content: 'dm_content_performance',
    inventory: 'ops_inventory',
    interdept: 'interdept_tasks',
  }
  const table = tableMap[routeType]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  try {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(500)
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ [routeType]: [] })
      throw error
    }
    return NextResponse.json({ [routeType]: data || [] })
  } catch {
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
  if (type) payload.type = type // Put type back into payload if it was destructured out

  const supabase = await createClient()
  const tableMap: Record<string, string> = {
    keywords: 'dm_seo_keywords',
    ads: 'dm_ad_campaigns',
    social: 'dm_social_posts',
    email: 'dm_email_campaigns',
    content: 'dm_content_performance',
    inventory: 'ops_inventory',
    interdept: 'interdept_tasks',
  }
  const table = tableMap[_type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const { data, error } = await supabase.from(table).insert(payload).select().single()
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ error: 'Run fix_all_panels.sql first' }, { status: 503 })
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
  if (type) updates.type = type // Put type back into updates if it was destructured out

  const supabase = await createClient()
  const tableMap: Record<string, string> = {
    keywords: 'dm_seo_keywords',
    ads: 'dm_ad_campaigns',
    social: 'dm_social_posts',
    email: 'dm_email_campaigns',
    content: 'dm_content_performance',
    inventory: 'ops_inventory',
    interdept: 'interdept_tasks',
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
    keywords: 'dm_seo_keywords',
    ads: 'dm_ad_campaigns',
    social: 'dm_social_posts',
    email: 'dm_email_campaigns',
    content: 'dm_content_performance',
    inventory: 'ops_inventory',
    interdept: 'interdept_tasks',
  }
  const table = tableMap[_type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  await supabase.from(table).delete().eq('id', id)
  return NextResponse.json({ success: true })
}
