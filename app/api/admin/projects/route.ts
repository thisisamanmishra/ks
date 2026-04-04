import { NextResponse } from 'next/server'
import { requireRole, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/projects
export async function GET(request: Request) {
  try {
    await requireRole('super_admin', 'admin')
    const supabase = await createClient()
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || ''
    const limit = parseInt(url.searchParams.get('limit') || '200')

    // Correct schema: user_id = client, assigned_to = vendor
    let query = supabase
      .from('service_requests')
      .select(`
        id, service_type, description, budget, vendor_price, status, progress, deadline, priority, created_at, updated_at,
        client:users!service_requests_user_id_fkey(id, fullname, email, phone),
        vendor:users!service_requests_assigned_to_fkey(id, fullname, email, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ projects: data || [] })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// POST /api/admin/projects — create a new project request
export async function POST(request: Request) {
  try {
    await requireRole('super_admin', 'admin')
    const supabase = await createClient()
    const body = await request.json()

    const { service_type, description, budget, vendor_price, user_id, assigned_to, deadline, priority } = body
    if (!service_type) return NextResponse.json({ error: 'service_type required' }, { status: 400 })
    if (!user_id) return NextResponse.json({ error: 'user_id (client) required' }, { status: 400 })

    const insertData: Record<string, unknown> = {
      service_type,
      description: description || null,
      budget: budget || null,
      vendor_price: vendor_price || null,
      user_id: Number(user_id),
      status: assigned_to ? 'assigned' : 'pending',
      deadline: deadline || null,
      priority: priority || 'medium',
    }
    if (assigned_to) {
      insertData.assigned_to = Number(assigned_to)
      insertData.status = 'assigned'
    }

    const { data, error } = await supabase
      .from('service_requests')
      .insert(insertData)
      .select(`
        id, service_type, description, budget, vendor_price, status, progress, deadline, priority, created_at,
        client:users!service_requests_user_id_fkey(id, fullname, email, phone),
        vendor:users!service_requests_assigned_to_fkey(id, fullname, email, phone)
      `)
      .single()

    if (error) throw error

    // Notifications
    const notifs = [{
      user_id: insertData.user_id,
      type: 'project_update',
      title: 'Project Initialized',
      message: `Your project for ${service_type} has been created.`,
      project_id: data.id,
    }]
    if (insertData.assigned_to) {
      notifs.push({
        user_id: insertData.assigned_to as number,
        type: 'project_assigned',
        title: 'New Project Assignment',
        message: `You have been assigned to project #${data.id} (${service_type}).`,
        project_id: data.id,
      })
    }
    await supabase.from('notifications').insert(notifs)

    return NextResponse.json({ project: data }, { status: 201 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
