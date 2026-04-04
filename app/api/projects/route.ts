import { NextResponse } from 'next/server'
import { getCurrentUser, requireAuth, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

// GET — list projects for current user (customer sees theirs, admin/super_admin sees all)
export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    let query = supabase
      .from('service_requests')
      .select(`
        *,
        client:users!service_requests_user_id_fkey(id, fullname, email, phone),
        vendor:users!service_requests_assigned_to_fkey(id, fullname, email)
      `)
      .order('created_at', { ascending: false })

    // Customers only see their own projects
    if (user.role === 'customer') {
      query = query.eq('user_id', user.userId)
    }
    // Vendors only see assigned projects
    if (user.role === 'vendor') {
      query = query.eq('assigned_to', user.userId)
    }

    const { data, error } = await query
    if (error) throw error

    const safeData = (data || []).map(p => {
      if (user.role === 'vendor') {
        const { budget, ...rest } = p
        return rest
      }
      return p
    })

    return NextResponse.json({ projects: safeData })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// POST — create a new project (customer only)
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    if (!body.service_type || !body.description) {
      return NextResponse.json({ error: 'Service type and description are required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        user_id: user.userId,
        service_type: body.service_type,
        description: body.description,
        budget: body.budget || null,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.userId,
      action: 'Project Created',
      details: `New project request: ${body.service_type}`,
    })

    return NextResponse.json({ project: data }, { status: 201 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
