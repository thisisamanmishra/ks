import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/admin/board/legal
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'board_member', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  let query = supabase
    .from('legal_documents')
    .select('*, created_by_user:created_by(fullname)')
    .order('created_at', { ascending: false })

  if (type && type !== 'all') query = query.eq('type', type)
  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ docs: [] }) // Table doesn't exist yet
    return NextResponse.json({ docs: [] })
  }
  return NextResponse.json({ docs: data || [] })
}

// POST /api/admin/board/legal — create document
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { title, type, status, description, file_url } = body
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('legal_documents')
    .insert({
      title,
      type: type || 'policy',
      status: status || 'draft',
      description: description || null,
      file_url: file_url || null,
      created_by: user.userId,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ doc: data }, { status: 201 })
}

// PATCH /api/admin/board/legal — update status
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'board_member', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('legal_documents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/board/legal — delete document
export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Only super_admin can delete documents' }, { status: 403 })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.from('legal_documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
