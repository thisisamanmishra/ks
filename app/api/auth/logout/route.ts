import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyRefreshToken } from '@/lib/auth/jwt'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST() {
  const cookieStore = await cookies()

  const refreshToken = cookieStore.get('refresh_token')?.value
  if (refreshToken) {
    // Invalidate refresh token in DB
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const payload = await verifyRefreshToken(refreshToken)

    if (payload) {
      const supabase = await createClient()
      await supabase
        .from('refresh_tokens')
        .update({ revoked: true })
        .eq('token_hash', tokenHash)
    }
  }

  // Clear all auth cookies
  cookieStore.set('access_token', '', { maxAge: 0, path: '/' })
  cookieStore.set('refresh_token', '', { maxAge: 0, path: '/' })

  return NextResponse.json({ message: 'Logged out' })
}
