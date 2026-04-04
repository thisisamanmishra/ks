import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/admin/sop — list SOP documents
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const published = searchParams.get('published')

  const supabase = await createClient()
  
  try {
    let query = supabase
      .from('sop_documents')
      .select('*, created_by_user:created_by(fullname)')
      .order('updated_at', { ascending: false })

    if (category && category !== 'all') query = query.eq('category', category)
    if (published === 'true') query = query.eq('is_published', true)

    const { data, error } = await query
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ sops: [] })
      console.error('SOP fetch error:', error)
      return NextResponse.json({ sops: [] })
    }
    return NextResponse.json({ sops: data || [] })
  } catch {
    return NextResponse.json({ sops: [] })
  }
}

// POST /api/admin/sop — create SOP
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, content, category, version, is_published } = body

  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const supabase = await createClient()
  
  const insertData: Record<string, unknown> = {
    title,
    content: content || null,
    category: category || 'general',
    version: version || '1.0',
    is_published: is_published || false,
    created_by: user.userId,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('sop_documents')
    .insert(insertData)
    .select('id').single()

  if (error) {
    console.error('SOP insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ sop: data }, { status: 201 })
}

// PATCH /api/admin/sop — update SOP
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('sop_documents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/sop — delete SOP (super_admin only)
export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.from('sop_documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
