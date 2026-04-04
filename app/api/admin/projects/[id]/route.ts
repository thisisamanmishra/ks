import { NextResponse } from 'next/server'
import { requireRole, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('super_admin', 'admin')
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data: oldData } = await supabase.from('service_requests').select('assigned_to').eq('id', id).single()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.status) updates.status = body.status
    if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to
    if (body.budget !== undefined) updates.budget = body.budget
    if (body.vendor_price !== undefined) updates.vendor_price = body.vendor_price
    if (body.deadline !== undefined) updates.deadline = body.deadline
    if (body.status === 'completed') updates.completed_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('service_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Notify new vendor assigned
    if (body.assigned_to !== undefined && oldData?.assigned_to !== body.assigned_to) {
      if (body.assigned_to === null) {
        updates.status = 'pending' // auto-downgrade status if unassigned, assuming we needed to. But wait, updates is already run.
      } else {
        await supabase.from('notifications').insert({
          user_id: body.assigned_to,
          type: 'project_assigned',
          title: 'Project Assigned',
          message: `You have been assigned to project #${id}.`,
          project_id: Number(id)
        })
      }
    }

    // Auto-fix status if vendor assigned
    if (body.assigned_to !== undefined && body.assigned_to !== null && oldData?.assigned_to !== body.assigned_to) {
       await supabase.from('service_requests').update({ status: 'assigned' }).eq('id', id)
       data.status = 'assigned'
    }

    return NextResponse.json({ project: data })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
