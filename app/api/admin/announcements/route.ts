import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/admin/announcements
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      id, title, body, type, target_roles, is_pinned, created_at,
      author:created_by(id, fullname)
    `)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcements: data || [] })
}

// POST /api/admin/announcements — create
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin', 'board_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await request.json()
  const { title, body: msgBody, type = 'info', target_roles = ['all'], is_pinned = false } = body
  if (!title || !msgBody) return NextResponse.json({ error: 'title and body required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('announcements')
    .insert({ title, body: msgBody, type, target_roles, is_pinned, created_by: user.userId })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcement: data }, { status: 201 })
}

// DELETE /api/admin/announcements?id=X
export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = await createClient()
  await supabase.from('announcements').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
