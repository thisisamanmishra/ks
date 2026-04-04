import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, otpEmail } from '@/lib/email'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export async function POST(request: Request) {
  try {
    const { email, fullname } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const supabase = await createClient()

    // Check if email already registered
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'This email is already registered. Please login instead.' }, { status: 409 })
    }

    // Rate limit: max 3 OTPs per email per 15 minutes
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('email_otps')
      .select('id', { count: 'exact', head: true })
      .eq('email', normalizedEmail)
      .eq('purpose', 'signup_verification')
      .gte('created_at', fifteenMinAgo)

    if (count && count >= 3) {
      return NextResponse.json({ error: 'Too many OTP requests. Please wait 15 minutes.' }, { status: 429 })
    }

    // Invalidate previous unused OTPs
    await supabase
      .from('email_otps')
      .update({ used: true })
      .eq('email', normalizedEmail)
      .eq('purpose', 'signup_verification')
      .eq('used', false)

    // Generate and store OTP
    const otp = generateOTP()
    const otpHash = await bcrypt.hash(otp, 10)

    await supabase.from('email_otps').insert({
      email: normalizedEmail,
      otp_hash: otpHash,
      purpose: 'signup_verification',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })

    // Send email
    const emailContent = otpEmail(otp, 'signup_verification', fullname || 'User')
    await sendEmail({
      to: normalizedEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    return NextResponse.json({ message: 'Verification OTP sent to your email.' })
  } catch (err) {
    console.error('Send signup OTP error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
