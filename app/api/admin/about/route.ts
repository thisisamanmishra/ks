import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/admin/about — public, fetches all about page content
export async function GET() {
  const supabase = await createClient()

  const [companyRes, timelineRes, achievementsRes, membersRes] = await Promise.all([
    supabase.from('about_company').select('*').limit(1).single(),
    supabase.from('about_timeline').select('*').order('sort_order', { ascending: true }),
    supabase.from('about_achievements').select('*').order('sort_order', { ascending: true }),
    supabase.from('about_members').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
  ])

  return NextResponse.json({
    company: companyRes.data || {},
    timeline: timelineRes.data || [],
    achievements: achievementsRes.data || [],
    members: membersRes.data || [],
  })
}

// POST /api/admin/about — create items
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'board_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { type, ...data } = body
  const supabase = await createClient()

  if (type === 'company') {
    const { data: existing } = await supabase.from('about_company').select('id').limit(1).single()
    if (existing) {
      const { data: updated, error } = await supabase
        .from('about_company')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ record: updated })
    } else {
      const { data: created, error } = await supabase
        .from('about_company')
        .insert(data)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ record: created }, { status: 201 })
    }
  }

  const tableMap: Record<string, string> = {
    timeline: 'about_timeline',
    achievement: 'about_achievements',
    member: 'about_members',
  }

  const table = tableMap[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const { data: created, error } = await supabase.from(table).insert(data).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: created }, { status: 201 })
}

// PATCH /api/admin/about — update items
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'board_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { type, id, ...data } = body
  const supabase = await createClient()

  const tableMap: Record<string, string> = {
    company: 'about_company',
    timeline: 'about_timeline',
    achievement: 'about_achievements',
    member: 'about_members',
  }

  const table = tableMap[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const updateData = type === 'company' ? { ...data, updated_at: new Date().toISOString() } : data

  const { data: updated, error } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: updated })
}

// DELETE /api/admin/about
export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'board_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!type || !id) return NextResponse.json({ error: 'type and id required' }, { status: 400 })

  const supabase = await createClient()

  const tableMap: Record<string, string> = {
    timeline: 'about_timeline',
    achievement: 'about_achievements',
    member: 'about_members',
  }

  const table = tableMap[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const { error } = await supabase.from(table).delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
