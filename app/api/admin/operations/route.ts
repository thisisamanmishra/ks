import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = await createClient()

  // Correct FK columns: user_id = client, assigned_to = vendor
  const { data: projects, error: projError } = await supabase
    .from('service_requests')
    .select(`
      id, service_type, description, budget, vendor_price, status, deadline, priority, progress, created_at,
      client:user_id(id, fullname, email, phone),
      vendor:assigned_to(id, fullname, email, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (projError) {
    console.error('Operations projects error:', projError)
    // Fallback: fetch without joins
    const { data: basicProjects } = await supabase
      .from('service_requests')
      .select('id, service_type, description, budget, vendor_price, status, progress, created_at, user_id, assigned_to')
      .order('created_at', { ascending: false })
      .limit(200)

    return NextResponse.json({
      projects: (basicProjects || []).map(p => ({ ...p, client: null, vendor: null, priority: 'medium' })),
      sla: { breached: 0, atRisk: 0, onTrack: basicProjects?.length || 0 },
      statusCounts: (basicProjects || []).reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc }, {} as Record<string, number>),
      vendorWorkload: [],
    })
  }

  const now = new Date()
  const safeProjects = (projects || []).map(p => ({
    ...p,
    priority: (p as { priority?: string }).priority || 'medium',
  }))

  const slaBreached = safeProjects.filter(p =>
    p.deadline && new Date(p.deadline) < now && !['completed', 'cancelled'].includes(p.status)
  ).length

  const atRisk = safeProjects.filter(p => {
    if (!p.deadline || ['completed', 'cancelled'].includes(p.status)) return false
    const hoursLeft = (new Date(p.deadline).getTime() - now.getTime()) / 3600000
    return hoursLeft > 0 && hoursLeft < 24
  }).length

  const statusCounts: Record<string, number> = {}
  safeProjects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1 })

  // Vendors from users table (role = 'vendor')
  const { data: vendors } = await supabase
    .from('users')
    .select('id, fullname, email, phone')
    .eq('role', 'vendor')
    .limit(100)

  // Count active jobs per vendor
  const vendorWorkload = await Promise.all((vendors || []).map(async (v) => {
    const { count } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', v.id)
      .in('status', ['assigned', 'in_progress', 'review'])
    return { ...v, activeJobs: count || 0 }
  }))

  return NextResponse.json({
    projects: safeProjects,
    sla: { breached: slaBreached, atRisk, onTrack: safeProjects.length - slaBreached - atRisk },
    statusCounts,
    vendorWorkload: vendorWorkload.sort((a, b) => b.activeJobs - a.activeJobs),
    // Also pass vendor list for assignment dropdown
    vendors: (vendors || []).map(v => ({ id: v.id, fullname: v.fullname })),
  })
}

// PATCH — update project status / assign vendor
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()

  // Build safe update - allow status, assigned_to, priority, deadline
  const safeUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.status !== undefined) safeUpdate.status = updates.status
  if (updates.assigned_to !== undefined) {
    safeUpdate.assigned_to = updates.assigned_to
    // Auto-update status to 'assigned' if vendor is being set and status is pending
    if (updates.assigned_to && !updates.status) {
      const { data: existing } = await supabase.from('service_requests').select('status').eq('id', id).single()
      if (existing?.status === 'pending') safeUpdate.status = 'assigned'
    }
  }
  if (updates.priority !== undefined) safeUpdate.priority = updates.priority
  if (updates.deadline !== undefined) safeUpdate.deadline = updates.deadline

  const { data, error } = await supabase
    .from('service_requests')
    .update(safeUpdate)
    .eq('id', id)
    .select(`
      id, service_type, description, budget, status, deadline, priority, progress, created_at,
      client:user_id(id, fullname, email, phone),
      vendor:assigned_to(id, fullname, email, phone)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data })
}
