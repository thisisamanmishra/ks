import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { sendEmail, approvedEmail, rejectedEmail } from '@/lib/email'

// GET /api/admin/staff-requests — list pending staff registrations
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = await createClient()

  // Pending admins (role = 'pending_admin')
  const { data: pendingAdmins } = await supabase
    .from('users')
    .select('id, fullname, email, phone, department, pillar_role, role, created_at')
    .eq('role', 'pending_admin')
    .order('created_at', { ascending: false })

  // Pending pillar members (role = 'pillar_member', is_approved = false)
  const { data: pendingPillar } = await supabase
    .from('users')
    .select('id, fullname, email, phone, department, pillar_role, role, created_at')
    .eq('role', 'pillar_member')
    .eq('is_approved', false)
    .order('created_at', { ascending: false })

  // admin_requests table (if exists)
  const { data: adminRequests } = await supabase
    .from('admin_requests')
    .select('id, user_id, requested_department, message, status, created_at, user:user_id(fullname, email, phone)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return NextResponse.json({
    pendingAdmins: pendingAdmins || [],
    pendingPillar: pendingPillar || [],
    adminRequests: adminRequests || [],
  })
}

// PATCH /api/admin/staff-requests — approve or reject a pending staff member
export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId, action, department, role } = await req.json()
  if (!userId || !action) return NextResponse.json({ error: 'userId and action required' }, { status: 400 })

  const supabase = await createClient()

  // Fetch the target user
  const { data: target } = await supabase
    .from('users')
    .select('id, fullname, email, role, department')
    .eq('id', userId)
    .single()

  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (action === 'approve') {
    const newRole = role || (target.role === 'pending_admin' ? 'admin' : target.role)
    await supabase
      .from('users')
      .update({ role: newRole, is_approved: true, department: department || target.department })
      .eq('id', userId)

    // Update admin_requests if exists
    await supabase
      .from('admin_requests')
      .update({ status: 'approved' })
      .eq('user_id', userId)

    // Send approval email
    try {
      const emailData = approvedEmail(target.fullname, department || target.department || newRole)
      await sendEmail({ to: target.email, subject: emailData.subject, html: emailData.html })
    } catch (e) {
      console.error('Email send error:', e)
    }

    return NextResponse.json({ success: true, action: 'approved' })
  }

  if (action === 'reject') {
    // For rejected: set role back to 'customer' or delete the account
    await supabase
      .from('users')
      .update({ role: 'customer', is_approved: false })
      .eq('id', userId)

    await supabase.from('admin_requests').update({ status: 'rejected' }).eq('user_id', userId)

    // Send rejection email
    try {
      const emailData = rejectedEmail(target.fullname)
      await sendEmail({ to: target.email, subject: emailData.subject, html: emailData.html })
    } catch (e) {
      console.error('Email send error:', e)
    }

    return NextResponse.json({ success: true, action: 'rejected' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
