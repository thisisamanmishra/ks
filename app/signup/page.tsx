'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

type RegistrationType = 'customer' | 'vendor'
type SignupStep = 'form' | 'otp' | 'complete'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pillar = searchParams.get('pillar')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pwStrength, setPwStrength] = useState(0)
  const [regType, setRegType] = useState<string>(pillar || 'customer')
  const [step, setStep] = useState<SignupStep>('form')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const len = e.target.value.length
    setPwStrength(len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : 3)
  }

  // Step 1: Send OTP for email verification
  const handleSendOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const fd = new FormData(e.currentTarget)
    if (fd.get('password') !== fd.get('confirm_password')) { setError('Passwords do not match'); setLoading(false); return }

    const data: Record<string, string> = {
      fullname: fd.get('fullname') as string,
      phone: fd.get('phone') as string,
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      user_type: (fd.get('user_type') as string) || '',
      department: (fd.get('department') as string) || '',
    }
    setFormData(data)

    try {
      const res = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, fullname: data.fullname }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Failed to send OTP'); setLoading(false); return }
      setStep('otp')
      setCountdown(60)
    } catch { setError('Something went wrong.') }
    setLoading(false)
  }

  // Handle OTP input
  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      const next = document.getElementById(`signup-otp-${index + 1}`)
      next?.focus()
    }
  }, [otp])

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`signup-otp-${index - 1}`)
      prev?.focus()
    }
  }, [otp])

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) setOtp(pasted.split(''))
  }, [])

  // Step 2: Verify OTP and create account
  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpStr = otp.join('')
    if (otpStr.length !== 6) { setError('Please enter the complete 6-digit OTP'); return }
    setLoading(true); setError('')

    try {
      // First verify the OTP
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otpStr, purpose: 'signup_verification' }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) { setError(verifyData.error || 'OTP verification failed'); setLoading(false); return }

      // OTP verified — now create account
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname: formData.fullname,
          phone: formData.phone,
          email: formData.email,
          user_type: formData.user_type || null,
          password: formData.password,
          role: regType,
          department: null,
          email_verified: true,
        }),
      })
      const signupData = await signupRes.json()
      if (!signupRes.ok) { setError(signupData.error || 'Signup failed'); setLoading(false); return }

      router.push('/login?registered=1')
    } catch { setError('Something went wrong.') }
    setLoading(false)
  }

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, fullname: formData.fullname }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      setOtp(['', '', '', '', '', ''])
      setCountdown(60)
    } catch { setError('Something went wrong') }
    setLoading(false)
  }

  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-green-500']
  const strengthWidths = ['w-0', 'w-1/3', 'w-2/3', 'w-full']

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex items-center justify-center p-4 relative overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <motion.div key={i} className="absolute w-64 h-64 rounded-full bg-white/5" style={{ top: `${20 + i * 30}%`, left: `${10 + i * 30}%` }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 120, 240, 360] }}
          transition={{ duration: 20 + i * 5, repeat: Infinity }}
        />
      ))}

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row"
      >
        {/* Left Panel */}
        <div className="lg:w-2/5 bg-gradient-to-br from-navy to-navy-light p-8 lg:p-10 flex flex-col justify-center text-white relative overflow-hidden">
          <motion.div className="absolute inset-0 bg-white/5 rounded-full w-[200%] h-[200%] -top-1/2 -right-1/2" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-4 font-heading">Welcome to Karya Saarthi!</h1>
            <p className="text-white/70 mb-8">Join thousands who trust us for their success</p>
            <ul className="space-y-4">
              {['500+ Happy Clients', 'Expert Assistance 24/7', '100% Secure & Confidential', 'Money Back Guarantee'].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:w-3/5 p-8 lg:p-10">
          <div className="text-center mb-4">
            <Image src="/images/karyasaarthi.png" alt="Logo" width={50} height={50} className="mx-auto rounded-xl shadow-md mb-3" />
            <h2 className="text-xl font-bold text-navy font-heading">
              {step === 'otp' ? 'Verify Your Email' : step === 'complete' ? '🎉 Registration Submitted!' : 'Create Your Account'}
            </h2>
            {step === 'otp' && (
              <p className="text-slate-500 text-sm mt-1">Enter the 6-digit code sent to<br/><strong className="text-navy">{formData.email}</strong></p>
            )}
          </div>

          {step === 'form' && (
            <>
              {/* Account Type Tabs */}
              {!pillar && (
                <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
                  {([
                    { key: 'customer', label: '🎓 Customer' },
                    { key: 'vendor', label: '🏪 Vendor' },
                  ]).map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => { setRegType(tab.key); setError(''); setSuccess('') }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        regType === tab.key
                          ? 'bg-white text-navy shadow-sm font-semibold'
                          : 'text-slate-500 hover:text-navy'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">⚠️ {error}</div>}

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" name="fullname" placeholder="Full Name" required className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 focus:outline-none text-sm transition-all" />
                  <input type="tel" name="phone" placeholder="Phone Number" pattern="[0-9]{10}" required className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 focus:outline-none text-sm transition-all" />
                </div>
                <input type="email" name="email" placeholder="Email Address" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 focus:outline-none text-sm transition-all" />

                {(!pillar && regType === 'customer') && (
                  <select name="user_type" required defaultValue="" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-navy focus:outline-none text-sm text-slate-500">
                    <option value="" disabled>I am a...</option>
                    <option value="student">🎓 Student</option>
                    <option value="business">💼 Business Owner</option>
                    <option value="professional">👔 Professional</option>
                    <option value="freelancer">💻 Freelancer</option>
                  </select>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input type="password" name="password" placeholder="Password" minLength={6} required onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 focus:outline-none text-sm transition-all" />
                    <div className="mt-1.5 h-1 rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all ${strengthColors[pwStrength]} ${strengthWidths[pwStrength]}`} /></div>
                  </div>
                  <input type="password" name="confirm_password" placeholder="Confirm Password" minLength={6} required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 focus:outline-none text-sm transition-all" />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" required className="rounded" /> I agree to the Terms & Privacy Policy</label>

                <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-dark shadow-lg shadow-accent/25 transition-all cursor-pointer disabled:opacity-50">
                  {loading ? '⏳ Sending OTP...' : 'Verify Email & Continue →'}
                </button>
              </form>


            </>
          )}

          {step === 'otp' && (
            <div className="space-y-5">
              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">⚠️ {error}</div>}

              <form onSubmit={handleVerifyAndSignup} className="space-y-5">
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`signup-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none bg-slate-50 transition-all"
                    />
                  ))}
                </div>

                <div className="text-center text-sm text-slate-500">
                  {countdown > 0 ? (
                    <span>Resend in <strong className="text-navy">{countdown}s</strong></span>
                  ) : (
                    <button type="button" onClick={handleResend} disabled={loading}
                      className="text-accent font-semibold hover:underline cursor-pointer disabled:opacity-50">
                      Resend OTP
                    </button>
                  )}
                </div>

                <button type="submit" disabled={loading || otp.join('').length !== 6}
                  className="w-full py-3.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-dark shadow-lg shadow-accent/25 transition-all cursor-pointer disabled:opacity-50">
                  {loading ? '⏳ Creating Account...' : 'Verify & Create Account →'}
                </button>

                <button type="button" onClick={() => { setStep('form'); setOtp(['', '', '', '', '', '']); setError('') }}
                  className="w-full text-sm text-slate-500 hover:text-navy cursor-pointer">
                  ← Back to form
                </button>
              </form>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-4">
              {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">✅ {success}</div>}
              <Link href="/login" className="inline-block px-8 py-3.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-dark shadow-lg shadow-accent/25 transition-all">
                Go to Login →
              </Link>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-6 pt-4 border-t border-slate-100">
            Already have an account? <Link href="/login" className="text-accent font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy flex items-center justify-center p-4">Loading signup...</div>}>
      <SignupContent />
    </Suspense>
  )
}
