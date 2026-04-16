import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { safeJson, sanitizeEmail, sanitizeName, sanitizePhone, validatePassword, truncate } from '@/lib/security/sanitize'

export async function POST(request: Request) {
  try {
    // ── Input validation ─────────────────────────────────────────────────────
    const { data: body, error: parseError } = await safeJson(request)
    if (parseError || !body) {
      return NextResponse.json({ error: parseError || 'Invalid request' }, { status: 400 })
    }

    const fullname = sanitizeName(body.fullname)
    if (!fullname) {
      return NextResponse.json({ error: 'Please enter a valid full name' }, { status: 400 })
    }

    const email = sanitizeEmail(body.email)
    if (!email) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    const phone = sanitizePhone(body.phone)
    if (!phone) {
      return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 })
    }

    const pwCheck = validatePassword(body.password)
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.reason }, { status: 400 })
    }
    const password = body.password as string

    // ── Role sanitisation (prevent external role escalation) ──────────────────
    const requestedRole = typeof body.role === 'string' ? body.role : 'customer'
    const allowedPublicRoles = ['customer', 'vendor']
    const pillars = ['campus', 'digital', 'calling', 'government', 'market']
    const isSafeRole = allowedPublicRoles.includes(requestedRole) || pillars.includes(requestedRole)

    const user_type = truncate(body.user_type, 50) || null
    const email_verified = body.email_verified === true

    const supabase = await createClient()

    // ── Duplicate check ───────────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 })
    }

    // ── Hash password (bcrypt rounds=12) ──────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12)

    // ── Determine final role ──────────────────────────────────────────────────
    let role = 'customer'
    let isApproved = true

    if (isSafeRole && requestedRole === 'vendor') {
      role = 'vendor'
      isApproved = false
    }
    // All other public signups → customer

    // ── Insert user ───────────────────────────────────────────────────────────
    const { data: user, error: insertErr } = await supabase
      .from('users')
      .insert({
        fullname,
        email,
        phone,
        user_type,
        password: hashedPassword,
        role,
        department: null,
        is_approved: isApproved,
        status: 'active',
        email_verified,
      })
      .select('id, fullname, email, role')
      .single()

    if (insertErr) {
      console.error('[signup] insert error:', insertErr.message)
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
    }

    if (role === 'vendor' && user) {
      await supabase.from('vendors').insert({ user_id: user.id, is_approved: false })
    }

    const message = role === 'vendor'
      ? 'Vendor account created! You can now login.'
      : 'Account created successfully! Please login.'

    return NextResponse.json({
      message,
      user: { id: user?.id, fullname: user?.fullname, email: user?.email, role: user?.role },
    }, { status: 201 })
  } catch (err) {
    console.error('[signup] exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
