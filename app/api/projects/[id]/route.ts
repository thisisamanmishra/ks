import { NextResponse } from 'next/server'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

// GET — single project with messages count
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        client:users!service_requests_user_id_fkey(id, fullname, email, phone),
        vendor:users!service_requests_assigned_to_fkey(id, fullname, email),
        quotes:project_quotes(*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Access check: customer can only see theirs, vendor only assigned
    if (user.role === 'customer' && data.user_id !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.role === 'vendor' && data.assigned_to !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ project: data })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// PATCH — update project (status, progress, assign vendor)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Get current project state for comparison
    const { data: oldProject } = await supabase
      .from('service_requests')
      .select('status, assigned_to, user_id, service_type')
      .eq('id', id)
      .single()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    // Vendor can update progress and status to certain values
    if (user.role === 'vendor') {
      if (body.progress !== undefined) updates.progress = body.progress
      if (body.status && ['in_progress', 'review', 'delivered'].includes(body.status)) {
        updates.status = body.status
      }
    }

    // Customer can update budget on their own projects
    if (user.role === 'customer') {
      if (body.budget !== undefined) updates.budget = body.budget
    }

    // Admin/super_admin can update everything
    if (['admin', 'super_admin'].includes(user.role)) {
      if (body.status) updates.status = body.status
      if (body.assigned_to !== undefined) {
        updates.assigned_to = body.assigned_to
        if (!body.status) updates.status = 'assigned'
      }
      if (body.progress !== undefined) updates.progress = body.progress
      if (body.budget !== undefined) updates.budget = body.budget
      if (body.status === 'completed') updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('service_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Fire notifications + emails (non-blocking)
    if (oldProject) {
      const { createNotification } = await import('@/lib/notifications')
      const { sendEmail, projectProgressEmail } = await import('@/lib/email')
      const projectName = oldProject.service_type
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const projectUrl = `${siteUrl}/dashboard`

      // Fetch participant emails for email notifications
      const { data: participants } = await supabase
        .from('users')
        .select('id, fullname, email, role')
        .in('id', [
          oldProject.user_id,
          oldProject.assigned_to,
        ].filter(Boolean))

      const customer = participants?.find(p => p.id === oldProject.user_id)
      const vendor = participants?.find(p => p.id === oldProject.assigned_to)

      // Fetch ops team email (first operations admin)
      const { data: opsAdmins } = await supabase
        .from('users')
        .select('id, fullname, email')
        .eq('role', 'admin')
        .eq('department', 'operations')
        .limit(1)
      const opsAdmin = opsAdmins?.[0] || null

      const updaterName = user.role === 'customer' ? (customer?.fullname || 'Customer')
        : user.role === 'vendor' ? (vendor?.fullname || 'Vendor')
        : 'Karya Saarthi Team'

      // Notify on status change
      if (updates.status && updates.status !== oldProject.status) {
        const statusLabel = String(updates.status).replace('_', ' ')
        const emailPayload = (recipientName: string) => projectProgressEmail({
          recipientName,
          projectName,
          newStatus: String(updates.status),
          updatedBy: updaterName,
          projectUrl,
        })

        if (oldProject.user_id && oldProject.user_id !== user.userId) {
          createNotification({ userId: oldProject.user_id, type: 'status_changed', title: 'Project Status Updated', message: `"${projectName}" is now ${statusLabel}`, projectId: Number(id) })
          if (customer?.email) sendEmail({ to: customer.email, ...emailPayload(customer.fullname) })
        }
        if (oldProject.assigned_to && oldProject.assigned_to !== user.userId) {
          createNotification({ userId: oldProject.assigned_to, type: 'status_changed', title: 'Project Status Updated', message: `"${projectName}" is now ${statusLabel}`, projectId: Number(id) })
          if (vendor?.email) sendEmail({ to: vendor.email, ...emailPayload(vendor.fullname) })
        }
        // Notify ops team too
        if (opsAdmin && opsAdmin.id !== user.userId) {
          sendEmail({ to: opsAdmin.email, ...emailPayload(opsAdmin.fullname) })
        }
      }

      // Notify on progress change (email only, no in-app spam)
      if (updates.progress !== undefined && updates.progress !== (oldProject as Record<string, unknown>).progress) {
        const emailPayload = (recipientName: string) => projectProgressEmail({
          recipientName,
          projectName,
          newProgress: Number(updates.progress),
          updatedBy: updaterName,
          projectUrl,
        })
        if (customer && customer.id !== user.userId && customer.email)
          sendEmail({ to: customer.email, ...emailPayload(customer.fullname) })
        if (vendor && vendor.id !== user.userId && vendor.email)
          sendEmail({ to: vendor.email, ...emailPayload(vendor.fullname) })
        if (opsAdmin && opsAdmin.id !== user.userId)
          sendEmail({ to: opsAdmin.email, ...emailPayload(opsAdmin.fullname) })
      }

      // Notify vendor on assignment
      if (updates.assigned_to && updates.assigned_to !== oldProject.assigned_to) {
        createNotification({ userId: Number(updates.assigned_to), type: 'project_assigned', title: 'New Project Assigned', message: `You've been assigned to "${projectName}"`, projectId: Number(id) })
        const { data: newVendor } = await supabase.from('users').select('fullname, email').eq('id', updates.assigned_to).single()
        if (newVendor?.email) {
          sendEmail({
            to: newVendor.email,
            ...projectProgressEmail({ recipientName: newVendor.fullname, projectName, newStatus: 'assigned', updatedBy: 'Karya Saarthi Team', projectUrl: `${siteUrl}/vendor` }),
          })
        }
      }
    }

    return NextResponse.json({ project: data })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
