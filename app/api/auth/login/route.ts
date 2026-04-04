import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { email, password, remember } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Look up user by email
    const { data: user, error: dbErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (dbErr || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Your account is inactive or blocked' }, { status: 403 })
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Check pending admin
    if (user.role === 'pending_admin') {
      return NextResponse.json({
        error: 'Your admin account is pending approval. You will be notified once approved.',
        pending: true,
      }, { status: 403 })
    }

    // Check unapproved admin
    if (user.role === 'admin' && !user.is_approved) {
      return NextResponse.json({
        error: 'Your admin account has not been approved yet.',
        pending: true,
      }, { status: 403 })
    }

    // Generate JWT tokens
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

    // Store refresh token hash in DB
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const expiresAt = new Date(Date.now() + (remember ? 30 : 7) * 24 * 60 * 60 * 1000)

    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })

    // Update last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Set cookies
    const cookieStore = await cookies()
    const maxAge = remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60

    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    })

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
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
