import { NextResponse } from 'next/server'
import { requireRole, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, approvedEmail, rejectedEmail } from '@/lib/email'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireRole('super_admin')
    const { id } = await params
    const { action, department } = await request.json()

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the request
    const { data: adminReq, error: fetchErr } = await supabase
      .from('admin_requests')
      .select('*, user:users!admin_requests_user_id_fkey(id, fullname, email)')
      .eq('id', id)
      .single()

    if (fetchErr || !adminReq) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (adminReq.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
    }

    const assignedDept = department || adminReq.requested_department

    // Update request
    await supabase
      .from('admin_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: currentUser.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    // Update user
    if (action === 'approve') {
      await supabase
        .from('users')
        .update({
          role: 'admin',
          department: assignedDept,
          is_approved: true,
        })
        .eq('id', adminReq.user.id)

      // Send approval email
      const email = approvedEmail(adminReq.user.fullname, assignedDept)
      await sendEmail({ to: adminReq.user.email, ...email })
    } else {
      await supabase
        .from('users')
        .update({ role: 'customer', is_approved: false, department: null })
        .eq('id', adminReq.user.id)

      // Send rejection email
      const email = rejectedEmail(adminReq.user.fullname)
      await sendEmail({ to: adminReq.user.email, ...email })
    }

    return NextResponse.json({ message: `Request ${action}d successfully` })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
