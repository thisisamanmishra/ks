import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, authErrorResponse } from '@/lib/auth/middleware'

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'docs'
    const supabase = await createClient()

    if (action === 'docs') {
      // Each user sees only their own docs; super_admin/admins can see all via user_id param
      const targetUserId = (user.role === 'super_admin' || user.role === 'admin') && searchParams.get('user_id')
        ? Number(searchParams.get('user_id'))
        : user.userId

      const { data, error } = await supabase
        .from('staff_documents')
        .select('*, uploader:uploaded_by(fullname)')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error && error.code === '42P01') return NextResponse.json({ docs: [] })
      return NextResponse.json({ docs: data || [] })
    }

    if (action === 'appraisals') {
      const targetUserId = (user.role === 'super_admin' || user.role === 'admin') && searchParams.get('user_id')
        ? Number(searchParams.get('user_id'))
        : user.userId

      const { data, error } = await supabase
        .from('staff_appraisals')
        .select('*, reviewer:reviewed_by(fullname)')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error && error.code === '42P01') return NextResponse.json({ appraisals: [] })
      return NextResponse.json({ appraisals: data || [] })
    }

    if (action === 'leaves') {
      const targetUserId = user.userId

      const { data, error } = await supabase
        .from('leave_requests')
        .select('id, leave_type, start_date, end_date, days, reason, status, created_at')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error && error.code === '42P01') return NextResponse.json({ leaves: [] })
      return NextResponse.json({ leaves: data || [] })
    }

    if (action === 'scorecard') {
      // Fetch all staff + their appraisals for HR/admin
      if (!['super_admin', 'admin'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const { data: staff } = await supabase
        .from('users')
        .select('id, fullname, department, role')
        .in('role', ['admin', 'pillar_member', 'board_member'])
        .order('fullname')

      const { data: appraisals } = await supabase
        .from('staff_appraisals')
        .select('user_id, period, rating, performance_score, goals_met')
        .order('created_at', { ascending: false })

      return NextResponse.json({ staff: staff || [], appraisals: appraisals || [] })
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
    const { action, ...payload } = body
    const supabase = await createClient()

    if (action === 'upload_doc') {
      // Only admins/super_admin can upload docs for others; staff can upload for themselves
      const targetUserId = (['super_admin', 'admin'].includes(user.role) && payload.user_id)
        ? payload.user_id : user.userId
      const { data, error } = await supabase
        .from('staff_documents')
        .insert({ ...payload, user_id: targetUserId, uploaded_by: user.userId, created_at: new Date().toISOString() })
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ doc: data }, { status: 201 })
    }

    if (action === 'add_appraisal') {
      if (!['super_admin', 'admin'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const { data, error } = await supabase
        .from('staff_appraisals')
        .insert({ ...payload, reviewed_by: user.userId, reviewed_at: new Date().toISOString(), created_at: new Date().toISOString() })
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ appraisal: data }, { status: 201 })
    }

    if (action === 'apply_leave') {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({ user_id: user.userId, ...payload, status: 'pending', created_at: new Date().toISOString() })
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ leave: data }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, id } = await req.json()
    const supabase = await createClient()

    if (action === 'delete_doc') {
      // Only allow if super_admin/admin or own doc
      const { data: doc } = await supabase.from('staff_documents').select('user_id').eq('id', id).single()
      if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (doc.user_id !== user.userId && !['super_admin', 'admin'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      await supabase.from('staff_documents').delete().eq('id', id)
      return NextResponse.json({ success: true })
    }

    if (action === 'delete_appraisal') {
      if (!['super_admin', 'admin'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      await supabase.from('staff_appraisals').delete().eq('id', id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
