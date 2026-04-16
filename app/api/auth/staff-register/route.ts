import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { sendEmail, adminApprovalEmail } from '@/lib/email'

// Maps staff_role to database role + department + pillar_role
const STAFF_ROLE_MAP: Record<string, { role: string; department: string; pillar_role: string | null; title: string }> = {
  digital_marketing_head: { role: 'admin', department: 'digital', pillar_role: null, title: 'Digital Marketing Head' },
  marketing_head:         { role: 'admin', department: 'marketing', pillar_role: null, title: 'Marketing Head' },
  operation_head:         { role: 'admin', department: 'operations', pillar_role: null, title: 'Operation Head' },
  project_manager:        { role: 'admin', department: 'operations', pillar_role: 'project_manager', title: 'Project Manager' },
}

export async function POST(req: Request) {
  try {
    const { fullname, email, password, phone, staff_role, email_verified } = await req.json()

    // Validate required fields
    if (!fullname || !email || !password || !staff_role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate staff_role
    const mapping = STAFF_ROLE_MAP[staff_role]
    if (!mapping) {
      return NextResponse.json({ error: 'Invalid staff role' }, { status: 400 })
    }

    // Require email verification
    if (!email_verified) {
      return NextResponse.json({ error: 'Email verification is required before registration' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check duplicate
    const { data: existing } = await supabase.from('users').select('id').eq('email', email.trim().toLowerCase()).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const insertPayload = {
      fullname: fullname.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'pending_admin',
      department: mapping.department,
      pillar_role: mapping.pillar_role,
      designation: mapping.title,
      phone: phone?.trim() || '0000000000', // phone is NOT NULL in schema
      is_approved: false,
      created_at: new Date().toISOString(),
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert(insertPayload)
      .select('id, email, fullname, role, department, pillar_role, is_approved')
      .single()

    if (error) {
      console.error('Staff register error:', error)
      return NextResponse.json({ error: 'Failed to create account: ' + error.message }, { status: 500 })
    }

    // Double-check the role was set correctly (paranoia check)
    if (newUser.role !== 'pending_admin') {
      console.error('ROLE MISMATCH! Expected pending_admin but got:', newUser.role)
      // Force update the role
      await supabase.from('users').update({ role: 'pending_admin', is_approved: false }).eq('id', newUser.id)
    }

    // Notify super admin(s) about new registration
    try {
      const { data: superAdmins } = await supabase.from('users').select('email').eq('role', 'super_admin')
      if (superAdmins?.length) {
        const emailData = adminApprovalEmail(fullname.trim())
        for (const admin of superAdmins) {
          await sendEmail({ to: admin.email, subject: emailData.subject, html: emailData.html })
        }
      }
    } catch (emailErr) {
      console.error('Admin notification email error:', emailErr)
    }

    return NextResponse.json({
      success: true,
      message: `Registration submitted as ${mapping.title}. Your account is pending Super Admin approval.`,
      user: { id: newUser.id, email: newUser.email, fullname: newUser.fullname },
    })
  } catch (err) {
    console.error('Staff register exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
