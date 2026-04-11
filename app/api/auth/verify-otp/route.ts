import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const OTP_TEMP_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'karyasaarthi-access-secret-change-me')

export async function POST(request: Request) {
  try {
    const { email, otp, purpose } = await request.json()

    if (!email || !otp || !purpose) {
      return NextResponse.json({ error: 'Email, OTP, and purpose are required' }, { status: 400 })
    }

    if (!['forgot_password', 'signup_verification'].includes(purpose)) {
      return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const supabase = await createClient()

    // Find the latest unused OTP for this email+purpose
    const { data: otpRecord, error: otpError } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('purpose', purpose)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpError) {
      console.error('OTP lookup error:', otpError)
    }

    if (!otpRecord) {
      // Debug: check if ANY records exist for this email
      const { data: allRecords, count } = await supabase
        .from('email_otps')
        .select('id, email, purpose, used, expires_at, created_at', { count: 'exact' })
        .eq('email', normalizedEmail)
        .order('created_at', { ascending: false })
        .limit(5)
      console.error('OTP not found for:', normalizedEmail, 'purpose:', purpose)
      console.error('All records for email:', JSON.stringify(allRecords), 'count:', count)
      return NextResponse.json({ error: 'No valid OTP found. Please request a new one.' }, { status: 400 })
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase.from('email_otps').update({ used: true }).eq('id', otpRecord.id)
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 })
    }

    // Check max attempts (5)
    if (otpRecord.attempts >= 5) {
      await supabase.from('email_otps').update({ used: true }).eq('id', otpRecord.id)
      return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 429 })
    }

    // Increment attempts
    await supabase
      .from('email_otps')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id)

    // Verify OTP
    const isValid = await bcrypt.compare(otp.toString(), otpRecord.otp_hash)
    if (!isValid) {
      const remaining = 5 - (otpRecord.attempts + 1)
      return NextResponse.json({
        error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      }, { status: 400 })
    }

    // Mark OTP as used
    await supabase.from('email_otps').update({ used: true }).eq('id', otpRecord.id)

    // For forgot_password, generate a temp token for reset
    if (purpose === 'forgot_password') {
      const tempToken = await new SignJWT({ email: normalizedEmail, purpose: 'password_reset' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('5m')
        .setIssuedAt()
        .sign(OTP_TEMP_SECRET)

      return NextResponse.json({ verified: true, tempToken })
    }

    // For signup_verification, just confirm
    return NextResponse.json({ verified: true })
  } catch (err) {
    console.error('Verify OTP error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
