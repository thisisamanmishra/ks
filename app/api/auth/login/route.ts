import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { safeJson, sanitizeEmail, validatePassword } from '@/lib/security/sanitize'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    // ── Input validation ────────────────────────────────────────────────────
    const { data: body, error: parseError } = await safeJson(request)
    if (parseError || !body) {
      return NextResponse.json({ error: parseError || 'Invalid request' }, { status: 400 })
    }

    const email = sanitizeEmail(body.email)
    if (!email) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const passwordCheck = validatePassword(body.password)
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.reason }, { status: 400 })
    }

    const password = body.password as string
    const remember = Boolean(body.remember)

    // ── Database lookup ─────────────────────────────────────────────────────
    const supabase = await createClient()

    const { data: user, error: dbErr } = await supabase
      .from('users')
      .select('id, email, fullname, password, role, department, pillar_role, is_approved, status')
      .eq('email', email)
      .single()

    // Use identical error message regardless of whether user exists (timing attack prevention)
    const invalidMsg = 'Invalid email or password'

    if (dbErr || !user) {
      // Prevent timing attack: run bcrypt anyway
      await bcrypt.compare(password, '$2b$12$invalidhashtopreventtimingattack00000000000000000000000')
      return NextResponse.json({ error: invalidMsg }, { status: 401 })
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Your account is inactive or blocked' }, { status: 403 })
    }

    // ── Password verification ───────────────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: invalidMsg }, { status: 401 })
    }

    // ── Role checks ─────────────────────────────────────────────────────────
    if (user.role === 'pending_admin') {
      return NextResponse.json({
        error: 'Your admin account is pending approval. You will be notified once approved.',
        pending: true,
      }, { status: 403 })
    }

    if (user.role === 'admin' && !user.is_approved) {
      return NextResponse.json({
        error: 'Your admin account has not been approved yet.',
        pending: true,
      }, { status: 403 })
    }

    // ── Token generation ────────────────────────────────────────────────────
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department || null,
      pillarRole: user.pillar_role || null,
      isApproved: user.is_approved || false,
    }

    const accessToken = await signAccessToken(tokenPayload)
    const refreshToken = await signRefreshToken(tokenPayload)

    // Store hashed refresh token
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const expiresAt = new Date(Date.now() + (remember ? 30 : 7) * 24 * 60 * 60 * 1000)

    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })

    // Update last login (non-blocking)
    supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id)

    // ── Set secure cookies ──────────────────────────────────────────────────
    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === 'production'
    const maxAge = remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60

    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge,
      path: '/',
    })

    // ── Response (never expose password hash or sensitive fields) ───────────
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        department: user.department,
        pillar_role: user.pillar_role,
        is_approved: user.is_approved,
      },
    })
  } catch (err) {
    console.error('[login] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
