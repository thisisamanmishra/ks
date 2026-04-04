import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { fullname, email, phone, user_type, password, role: requestedRole, department, email_verified } = await request.json()

    if (!fullname || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Determine role
    let role = 'customer'
    let isApproved = false
    const pillars = ['campus', 'digital', 'calling', 'government', 'market']

    if (requestedRole === 'vendor') {
      role = 'vendor'
    } else if (pillars.includes(requestedRole)) {
      role = requestedRole
      isApproved = true // Pillar customers are automatically approved
    } else if (requestedRole === 'admin') {
      role = 'pending_admin'
      if (!department || !['hr', 'finance', 'operations', 'marketing', 'digital'].includes(department)) {
        return NextResponse.json({ error: 'Valid department is required for admin registration' }, { status: 400 })
      }
    } else {
      // Default customer
      isApproved = true
    }

    // Insert user
    const { data: user, error: insertErr } = await supabase
      .from('users')
      .insert({
        fullname,
        email,
        phone,
        user_type: user_type || null,
        password: hashedPassword,
        role,
        department: requestedRole === 'admin' ? department : null,
        is_approved: isApproved,
        status: 'active',
        email_verified: email_verified === true,
      })
      .select('id, fullname, email, role, department')
      .single()

    if (insertErr) {
      console.error('Signup insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
    }

    // If admin registration, create admin request
    if (role === 'pending_admin' && user) {
      await supabase.from('admin_requests').insert({
        user_id: user.id,
        requested_department: department,
        message: `${fullname} has requested admin access for the ${department} department.`,
        status: 'pending',
      })
    }

    // If vendor registration, create vendor profile
    if (role === 'vendor' && user) {
      await supabase.from('vendors').insert({
        user_id: user.id,
        is_approved: false,
      })
    }

    const message = role === 'pending_admin'
      ? 'Registration submitted! Your admin request is pending approval by the Super Admin.'
      : role === 'vendor'
        ? 'Vendor account created! You can now login.'
        : 'Account created successfully! Please login.'

    return NextResponse.json({ message, user }, { status: 201 })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
