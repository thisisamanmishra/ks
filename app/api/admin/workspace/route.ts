import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, authErrorResponse } from '@/lib/auth/middleware'

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'list'
    const supabase = await createClient()

    if (action === 'list') {
      const dept = searchParams.get('department') || null
      let q = supabase.from('workspace_documents').select('*, author:created_by(fullname)').order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
      if (dept) q = q.or(`department.is.null,department.eq.${dept}`)
      const { data, error } = await q
      if (error && error.code === '42P01') return NextResponse.json({ documents: [] })
      return NextResponse.json({ documents: data || [] })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workspace_documents')
      .insert({ ...body, created_by: user.userId, updated_by: user.userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ document: data }, { status: 201 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('workspace_documents')
      .update({ ...updates, updated_by: user.userId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ document: data })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    const supabase = await createClient()
    await supabase.from('workspace_documents').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
