'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

type Step = 'email' | 'otp' | 'reset' | 'success'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [tempToken, setTempToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [pwStrength, setPwStrength] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  const handlePasswordChange = (val: string) => {
    setNewPassword(val)
    const len = val.length
    setPwStrength(len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : 3)
  }

  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-green-500']
  const strengthWidths = ['w-0', 'w-1/3', 'w-2/3', 'w-full']
  const strengthLabels = ['', 'Weak', 'Good', 'Strong']

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      setStep('otp')
      setCountdown(60)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP input
  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    // Auto-focus next
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`)
      next?.focus()
    }
  }, [otp])

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`)
      prev?.focus()
    }
  }, [otp])

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
    }
  }, [])

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpStr = otp.join('')
    if (otpStr.length !== 6) { setError('Please enter the complete 6-digit OTP'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpStr, purpose: 'forgot_password' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      setTempToken(data.tempToken)
      setStep('reset')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tempToken, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      setStep('success')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      setOtp(['', '', '', '', '', ''])
      setCountdown(60)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex items-center justify-center p-4 relative overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <motion.div key={i} className="absolute w-64 h-64 rounded-full bg-white/5" style={{ top: `${20 + i * 30}%`, left: `${10 + i * 30}%` }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 120, 240, 360] }}
          transition={{ duration: 20 + i * 5, repeat: Infinity }}
        />
      ))}

      <Link href="/login" className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-medium hover:bg-white/20 transition-all">
        ← Back to Login
      </Link>

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10"
      >
        <div className="text-center mb-8">
          <Image src="/images/karyasaarthi.jpeg" alt="Logo" width={60} height={60} className="mx-auto rounded-xl shadow-lg mb-4" />

          {step === 'email' && (
            <>
              <h2 className="text-2xl font-bold text-navy font-heading">Forgot Password?</h2>
              <p className="text-slate-500 text-sm mt-1">Enter your email to receive a verification code</p>
            </>
          )}
          {step === 'otp' && (
            <>
              <h2 className="text-2xl font-bold text-navy font-heading">Verify OTP</h2>
              <p className="text-slate-500 text-sm mt-1">Enter the 6-digit code sent to<br/><strong className="text-navy">{email}</strong></p>
            </>
          )}
          {step === 'reset' && (
            <>
              <h2 className="text-2xl font-bold text-navy font-heading">Set New Password</h2>
              <p className="text-slate-500 text-sm mt-1">Choose a strong password for your account</p>
            </>
          )}
          {step === 'success' && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-navy font-heading">Password Reset!</h2>
              <p className="text-slate-500 text-sm mt-1">Your password has been changed successfully</p>
            </>
          )}
        </div>

        {/* Step progress */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {['email', 'otp', 'reset'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? 'bg-accent text-white scale-110' :
                  ['email', 'otp', 'reset'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  {['email', 'otp', 'reset'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-0.5 ${['email', 'otp', 'reset'].indexOf(step) > i ? 'bg-green-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="name@example.com"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 focus:outline-none text-sm transition-all"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl bg-accent text-white font-bold text-base hover:bg-accent-dark shadow-lg shadow-accent/25 transition-all cursor-pointer disabled:opacity-50">
              {loading ? '⏳ Sending OTP...' : 'Send OTP →'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
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
              className="w-full py-4 rounded-xl bg-accent text-white font-bold text-base hover:bg-accent-dark shadow-lg shadow-accent/25 transition-all cursor-pointer disabled:opacity-50">
              {loading ? '⏳ Verifying...' : 'Verify OTP →'}
            </button>
            <button type="button" onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError('') }}
              className="w-full text-sm text-slate-500 hover:text-navy cursor-pointer mt-2">
              ← Change email
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <input type={showPassword ? 'text' : 'password'} value={newPassword}
                onChange={e => handlePasswordChange(e.target.value)}
                required minLength={6} placeholder="Enter new password"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 focus:outline-none text-sm transition-all pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-slate-400 hover:text-navy text-sm cursor-pointer">
                {showPassword ? '🙈' : '👁️'}
              </button>
              <div className="mt-1.5 h-1 rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-all ${strengthColors[pwStrength]} ${strengthWidths[pwStrength]}`} />
              </div>
              {pwStrength > 0 && <p className={`text-xs mt-0.5 ${pwStrength === 1 ? 'text-red-500' : pwStrength === 2 ? 'text-amber-500' : 'text-green-500'}`}>{strengthLabels[pwStrength]}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                required minLength={6} placeholder="Confirm new password"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 focus:outline-none text-sm transition-all"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl bg-accent text-white font-bold text-base hover:bg-accent-dark shadow-lg shadow-accent/25 transition-all cursor-pointer disabled:opacity-50">
              {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
            </button>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="space-y-4">
            <button onClick={() => router.push('/login')}
              className="w-full py-4 rounded-xl bg-accent text-white font-bold text-base hover:bg-accent-dark shadow-lg shadow-accent/25 transition-all cursor-pointer">
              Go to Login →
            </button>
          </div>
        )}

        <p className="text-center text-sm text-slate-500 mt-6 pt-6 border-t border-slate-100">
          Remember your password? <Link href="/login" className="text-accent font-semibold hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  )
}
