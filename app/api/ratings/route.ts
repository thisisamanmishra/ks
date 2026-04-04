import { NextResponse } from 'next/server'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

// POST — submit rating (customers only, completed projects only, one per project)
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    if (user.role !== 'customer') {
      return NextResponse.json({ error: 'Only customers can submit ratings' }, { status: 403 })
    }

    const body = await request.json()
    const { project_id, rating, review } = body

    if (!project_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Valid project_id and rating (1-5) required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify: project exists, belongs to customer, and is completed
    const { data: project, error: projErr } = await supabase
      .from('service_requests')
      .select('id, user_id, assigned_to, status, service_type')
      .eq('id', project_id)
      .single()

    if (projErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    if (project.user_id !== user.userId) {
      return NextResponse.json({ error: 'You can only rate your own projects' }, { status: 403 })
    }
    if (project.status !== 'completed') {
      return NextResponse.json({ error: 'Can only rate completed projects' }, { status: 400 })
    }
    if (!project.assigned_to) {
      return NextResponse.json({ error: 'No vendor assigned to this project' }, { status: 400 })
    }

    // Check for existing rating
    const { data: existing } = await supabase
      .from('ratings')
      .select('id')
      .eq('project_id', project_id)
      .eq('customer_id', user.userId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You have already rated this project' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('ratings')
      .insert({
        project_id,
        customer_id: user.userId,
        vendor_id: project.assigned_to,
        rating,
        review: review?.trim() || null,
      })
      .select()
      .single()

    if (error) throw error

    // Update vendor's average rating in the vendors table
    const { data: avgData } = await supabase
      .from('ratings')
      .select('rating')
      .eq('vendor_id', project.assigned_to)

    if (avgData && avgData.length > 0) {
      const avg = avgData.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / avgData.length
      await supabase
        .from('vendors')
        .update({ rating: Math.round(avg * 100) / 100, total_projects: avgData.length })
        .eq('user_id', project.assigned_to)
    }

    // Notify vendor
    await createNotification({
      userId: project.assigned_to,
      type: 'new_rating',
      title: 'New Rating Received',
      message: `You received a ${rating}⭐ rating for "${project.service_type}"`,
      projectId: project_id,
    })

    return NextResponse.json({ rating: data }, { status: 201 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// GET — fetch ratings (by vendor_id query param, or for current user's projects)
export async function GET(request: Request) {
  try {
    await requireAuth()
    const url = new URL(request.url)
    const vendorId = url.searchParams.get('vendorId')
    const projectId = url.searchParams.get('projectId')

    const supabase = await createClient()

    if (projectId) {
      // Single project rating
      const { data } = await supabase
        .from('ratings')
        .select('*, customer:users!ratings_customer_id_fkey(id, fullname)')
        .eq('project_id', projectId)
        .single()
      return NextResponse.json({ rating: data })
    }

    if (vendorId) {
      // All ratings for a vendor
      const { data: ratings } = await supabase
        .from('ratings')
        .select(`
          *,
          customer:users!ratings_customer_id_fkey(id, fullname),
          project:service_requests!ratings_project_id_fkey(id, service_type)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })

      const rList = ratings || []
      const avg = rList.length > 0 ? rList.reduce((s, r) => s + r.rating, 0) / rList.length : 0

      return NextResponse.json({
        ratings: rList,
        average: Math.round(avg * 10) / 10,
        total: rList.length,
      })
    }

    return NextResponse.json({ error: 'vendorId or projectId required' }, { status: 400 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
