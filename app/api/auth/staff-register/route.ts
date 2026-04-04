import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { fullname, email, password, role, department, pillar_role, phone } = await req.json()

    const ALLOWED_ROLES = ['admin', 'pillar_member']
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role for staff registration' }, { status: 400 })
    }
    if (!fullname || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check duplicate
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        fullname: fullname.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
        department: role === 'admin' ? department : null,
        pillar_role: role === 'pillar_member' ? pillar_role : null,
        phone: phone?.trim() || null,
        is_approved: false, // Must be approved by Super Admin
        is_active: false,   // Inactive until approved
        created_at: new Date().toISOString(),
      })
      .select('id, email, fullname')
      .single()

    if (error) {
      console.error('Staff register error:', error)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Registration submitted. Your account is pending Super Admin approval.',
      user: { id: newUser.id, email: newUser.email, fullname: newUser.fullname },
    })
  } catch (err) {
    console.error('Staff register exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
