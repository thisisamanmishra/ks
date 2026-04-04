import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyRefreshToken, signAccessToken } from '@/lib/auth/jwt'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 })
    }

    // Check if refresh token exists and not revoked in DB
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const supabase = await createClient()

    const { data: storedToken } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('revoked', false)
      .single()

    if (!storedToken) {
      return NextResponse.json({ error: 'Refresh token revoked' }, { status: 401 })
    }

    // Fetch fresh user data for new access token
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role, department, pillar_role, is_approved')
      .eq('id', payload.userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Sign new access token with fresh data
    const newAccessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department || null,
      pillarRole: user.pillar_role || null,
      isApproved: user.is_approved || false,
    })

    cookieStore.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour (matches JWT expiry)
      path: '/',
    })

    return NextResponse.json({ message: 'Token refreshed' })
  } catch (err) {
    console.error('Refresh error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
