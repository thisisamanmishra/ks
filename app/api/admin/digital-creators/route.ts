import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, requireDepartment, authErrorResponse } from '@/lib/auth/middleware'

// GET /api/admin/digital-creators?action=list|submissions|calendar|leads|revenue|ad_creatives
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'list'
    const supabase = await createClient()

    if (action === 'list') {
      const { data, error } = await supabase
        .from('digital_creators')
        .select('*')
        .order('created_at', { ascending: false })
      if (error && error.code === '42P01') return NextResponse.json({ creators: [] })
      return NextResponse.json({ creators: data || [] })
    }

    if (action === 'submissions') {
      const status = searchParams.get('status') || null
      let q = supabase
        .from('content_submissions')
        .select('*, creator:creator_id(id,name,platforms)')
        .order('submitted_at', { ascending: false })
      if (status) q = q.eq('status', status)
      const { data, error } = await q
      if (error && error.code === '42P01') return NextResponse.json({ submissions: [] })
      return NextResponse.json({ submissions: data || [] })
    }

    if (action === 'calendar') {
      const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
      const start = `${month}-01`
      const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0).toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from('content_calendar')
        .select('*, creator:creator_id(id,name)')
        .gte('scheduled_date', start)
        .lte('scheduled_date', end)
        .order('scheduled_date')
      if (error && error.code === '42P01') return NextResponse.json({ calendar: [] })
      return NextResponse.json({ calendar: data || [] })
    }

    if (action === 'leads') {
      const { data, error } = await supabase
        .from('digital_leads')
        .select('*')
        .order('date', { ascending: false })
        .limit(200)
      if (error && error.code === '42P01') return NextResponse.json({ leads: [] })
      return NextResponse.json({ leads: data || [] })
    }

    if (action === 'revenue') {
      const { data, error } = await supabase
        .from('digital_revenue')
        .select('*, creator:creator_id(id,name)')
        .order('created_at', { ascending: false })
      if (error && error.code === '42P01') return NextResponse.json({ revenue: [] })
      return NextResponse.json({ revenue: data || [] })
    }

    if (action === 'ad_creatives') {
      const { data, error } = await supabase
        .from('ad_creatives')
        .select('*, uploader:uploaded_by(fullname)')
        .order('created_at', { ascending: false })
      if (error && error.code === '42P01') return NextResponse.json({ ad_creatives: [] })
      return NextResponse.json({ ad_creatives: data || [] })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// POST /api/admin/digital-creators
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { action, ...payload } = body
    const supabase = await createClient()

    if (action === 'create_creator') {
      const { data, error } = await supabase
        .from('digital_creators')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ creator: data }, { status: 201 })
    }

    if (action === 'submit_content') {
      const { data, error } = await supabase
        .from('content_submissions')
        .insert({ ...payload, submitted_at: new Date().toISOString() })
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ submission: data }, { status: 201 })
    }

    if (action === 'log_lead') {
      const { data, error } = await supabase
        .from('digital_leads')
        .insert({ ...payload, created_by: user.userId, created_at: new Date().toISOString() })
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ lead: data }, { status: 201 })
    }

    if (action === 'log_revenue') {
      const { data, error } = await supabase
        .from('digital_revenue')
        .insert({ ...payload, created_by: user.userId, created_at: new Date().toISOString() })
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ record: data }, { status: 201 })
    }

    if (action === 'add_creative') {
      const { data, error } = await supabase
        .from('ad_creatives')
        .insert({ ...payload, uploaded_by: user.userId, created_at: new Date().toISOString() })
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ creative: data }, { status: 201 })
    }

    if (action === 'add_calendar') {
      const { data, error } = await supabase
        .from('content_calendar')
        .insert({ ...payload, assigned_by: user.userId, created_at: new Date().toISOString() })
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ entry: data }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// PATCH /api/admin/digital-creators
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, id, ...updates } = await req.json()
    const supabase = await createClient()

    if (action === 'review_submission') {
      const { data, error } = await supabase
        .from('content_submissions')
        .update({ status: updates.status, reviewer_notes: updates.reviewer_notes, reviewed_by: user.userId, reviewed_at: new Date().toISOString() })
        .eq('id', id)
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ submission: data })
    }

    if (action === 'review_creative') {
      const { data, error } = await supabase
        .from('ad_creatives')
        .update({ status: updates.status, approved_by: updates.status === 'approved' ? user.userId : null })
        .eq('id', id)
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ creative: data })
    }

    if (action === 'update_calendar') {
      const { data, error } = await supabase
        .from('content_calendar')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ entry: data })
    }

    if (action === 'update_creator') {
      const { data, error } = await supabase
        .from('digital_creators')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ creator: data })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// DELETE /api/admin/digital-creators
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, id } = await req.json()
    const supabase = await createClient()

    const tableMap: Record<string, string> = {
      delete_creator: 'digital_creators',
      delete_submission: 'content_submissions',
      delete_creative: 'ad_creatives',
      delete_lead: 'digital_leads',
      delete_revenue: 'digital_revenue',
      delete_calendar: 'content_calendar',
    }
    const table = tableMap[action]
    if (!table) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    await supabase.from(table).delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
