import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { jwtVerify } from 'jose'

const OTP_TEMP_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'karyasaarthi-access-secret-change-me')

export async function POST(request: Request) {
  try {
    const { email, tempToken, newPassword } = await request.json()

    if (!email || !tempToken || !newPassword) {
      return NextResponse.json({ error: 'Email, token, and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Verify temp token
    let payload
    try {
      const result = await jwtVerify(tempToken, OTP_TEMP_SECRET)
      payload = result.payload as { email: string; purpose: string }
    } catch {
      return NextResponse.json({ error: 'Invalid or expired reset token. Please start over.' }, { status: 401 })
    }

    if (payload.email !== normalizedEmail || payload.purpose !== 'password_reset') {
      return NextResponse.json({ error: 'Token mismatch. Please start over.' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id)

    if (updateErr) throw updateErr

    // Revoke all refresh tokens for security
    await supabase
      .from('refresh_tokens')
      .update({ revoked: true })
      .eq('user_id', user.id)

    return NextResponse.json({ message: 'Password reset successfully. Please login with your new password.' })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
