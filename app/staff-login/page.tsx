'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const ROLE_ROUTES: Record<string, string> = {
  super_admin: '/admin',
  board_member: '/admin/board',
  'admin-hr': '/admin/hr',
  'admin-finance': '/admin/finance',
  'admin-operations': '/admin/operations',
  'admin-marketing': '/admin/marketing',
  'admin-digital': '/admin/digital',
  'pillar-campus': '/admin/pillars/campus',
  'pillar-digital': '/admin/pillars/digital',
  'pillar-calling': '/admin/pillars/calling',
  'pillar-government': '/admin/pillars/government',
  'pillar-market': '/admin/pillars/market',
}

const STAFF_ROLES = [
  { value: 'digital_marketing_head', label: '💻 Digital Marketing Head' },
  { value: 'marketing_head', label: '📢 Marketing Head' },
  { value: 'operation_head', label: '⚙️ Operation Head' },
  { value: 'project_manager', label: '📋 Project Manager' },
]

type RegisterStep = 'form' | 'otp' | 'success'

function RegisterForm() {
  const [form, setForm] = useState({ fullname: '', email: '', password: '', phone: '', staff_role: '' })
  const [step, setStep] = useState<RegisterStep>('form')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.staff_role) { setError('Please select a role'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setSaving(true); setError('')

    try {
      const res = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, fullname: form.fullname }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Failed to send OTP'); setSaving(false); return }
      setStep('otp')
      setCountdown(60)
    } catch { setError('Something went wrong') }
    setSaving(false)
  }

  // OTP input handlers
  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      const next = document.getElementById(`staff-otp-${index + 1}`)
      next?.focus()
    }
  }, [otp])

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`staff-otp-${index - 1}`)
      prev?.focus()
    }
  }, [otp])

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) setOtp(pasted.split(''))
  }, [])

  // Step 2: Verify OTP then register
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpStr = otp.join('')
    if (otpStr.length !== 6) { setError('Please enter the complete 6-digit OTP'); return }
    setSaving(true); setError('')

    try {
      // Verify OTP first
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: otpStr, purpose: 'signup_verification' }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) { setError(verifyData.error || 'OTP verification failed'); setSaving(false); return }

      // OTP verified — now register
      const res = await fetch('/api/auth/staff-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email_verified: true }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Registration failed'); setSaving(false); return }
      setStep('success')
    } catch { setError('Something went wrong') }
    setSaving(false)
  }

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, fullname: form.fullname }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error); setSaving(false); return }
      setOtp(['', '', '', '', '', ''])
      setCountdown(60)
    } catch { setError('Something went wrong') }
    setSaving(false)
  }

  if (step === 'success') return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
      <span className="text-4xl block mb-3">🎉</span>
      <p className="text-green-400 font-bold text-lg">Registration Submitted!</p>
      <p className="text-green-400/70 text-sm mt-2">
        Your email has been verified and your account is pending <strong>Super Admin approval</strong>.
        You&apos;ll receive an email once your account is approved.
      </p>
      <div className="mt-4 bg-green-500/10 rounded-lg px-4 py-2 text-green-400/60 text-xs">
        💡 After approval, log in using the Login tab with your registered email and password.
      </div>
    </motion.div>
  )

  if (step === 'otp') return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <div className="text-center mb-2">
        <span className="text-3xl block mb-2">✉️</span>
        <p className="text-white/80 text-sm">Enter the 6-digit code sent to</p>
        <p className="text-accent font-bold text-sm">{form.email}</p>
      </div>

      {error && <div className="bg-red-500/10 text-red-400 px-3 py-2.5 rounded-xl text-xs border border-red-500/20">⚠️ {error}</div>}

      <form onSubmit={handleVerifyAndRegister} className="space-y-4">
        <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`staff-otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(i, e)}
              autoFocus={i === 0}
              className="w-11 h-13 text-center text-lg font-bold rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
            />
          ))}
        </div>

        <div className="text-center text-sm text-white/40">
          {countdown > 0 ? (
            <span>Resend in <strong className="text-accent">{countdown}s</strong></span>
          ) : (
            <button type="button" onClick={handleResend} disabled={saving}
              className="text-accent font-semibold hover:underline cursor-pointer disabled:opacity-50">
              Resend OTP
            </button>
          )}
        </div>

        <button type="submit" disabled={saving || otp.join('').length !== 6}
          className="w-full py-3.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #e55a27)' }}>
          {saving ? '⏳ Verifying & Registering...' : '✅ Verify & Create Account'}
        </button>

        <button type="button" onClick={() => { setStep('form'); setOtp(['', '', '', '', '', '']); setError('') }}
          className="w-full text-sm text-white/40 hover:text-white/70 cursor-pointer">
          ← Back to form
        </button>
      </form>
    </motion.div>
  )

  return (
    <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      onSubmit={handleSendOTP} className="space-y-3">
      {error && <div className="bg-red-500/10 text-red-400 px-3 py-2.5 rounded-xl text-xs border border-red-500/20">⚠️ {error}</div>}

      <input required value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))}
        placeholder="Full name *" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent/50" />

      <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
        placeholder="Work email *" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent/50" />

      <input required type="password" minLength={8} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
        placeholder="Password (min 8 chars) *" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent/50" />

      <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
        placeholder="Phone number" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent/50" />

      {/* Role Selection */}
      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5">Select Your Role *</label>
        <select required value={form.staff_role} onChange={e => setForm(p => ({ ...p, staff_role: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50 appearance-none cursor-pointer">
          <option value="" className="bg-slate-900 text-white/50">Choose a role…</option>
          {STAFF_ROLES.map(r => (
            <option key={r.value} value={r.value} className="bg-slate-900">{r.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-400/80">
        ℹ️ After email verification, your account will be reviewed by the Super Admin before you can log in.
      </div>

      <button type="submit" disabled={saving}
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity"
        style={{ background: 'linear-gradient(135deg, #FF6B35, #e55a27)' }}>
        {saving ? '⏳ Sending OTP...' : '📧 Verify Email & Register'}
      </button>
    </motion.form>
  )
}

export default function StaffLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  // Particles: client-only to avoid SSR/hydration mismatch from Math.random()
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([])
  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 10 + 8,
      }))
    )
  }, [])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setPending(false)
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          remember: true,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.pending) {
          setPending(true)
        } else if (data.error?.includes('customer') || data.error?.includes('vendor')) {
          setError('This portal is for staff only. Please use the main login page.')
        } else {
          setError(data.error || 'Login failed')
        }
        setLoading(false)
        return
      }

      const role = data.user?.role
      const dept = data.user?.department
      const pillarRole = data.user?.pillar_role

      // Block non-staff from this portal
      if (['customer', 'vendor', 'campus', 'digital', 'calling', 'government', 'market'].includes(role)) {
        setError('This portal is for internal team only. Please use your respective login link.')
        await fetch('/api/auth/logout', { method: 'POST' })
        setLoading(false)
        return
      }

      // Redirect based on role
      if (role === 'super_admin') {
        router.push('/admin')
      } else if (role === 'board_member') {
        router.push('/admin/board')
      } else if (role === 'pillar_member' && pillarRole) {
        router.push(`/admin/pillars/${pillarRole}`)
      } else if (role === 'admin' && pillarRole === 'digital') {
        router.push('/admin/digital')
      } else if (role === 'admin' && pillarRole === 'project_manager') {
        router.push('/admin/projects')
      } else if (role === 'admin' && dept) {
        router.push(`/admin/${dept}`)
      } else if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/admin')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(#1B3A6B 1px, transparent 1px), linear-gradient(90deg, #1B3A6B 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Glowing orbs */}
      <motion.div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(27,58,107,0.4) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} />

      {/* Floating particles */}
      {particles.slice(0, 12).map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full bg-accent/30"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.id * 0.5 }}
        />
      ))}

      {/* Back to website */}
      <Link href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md text-white/70 text-sm hover:bg-white/10 hover:text-white transition-all border border-white/10">
        ← Public Website
      </Link>

      {/* Customer login hint */}
      <Link href="/login"
        className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 backdrop-blur-md text-accent text-sm hover:bg-accent/20 transition-all border border-accent/20">
        Customer Login →
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Header stripe */}
          <div className="h-1 bg-gradient-to-r from-navy via-accent to-navy" />

          <div className="p-8 lg:p-10">
            {/* Logo + title */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="inline-block mb-4 relative"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-accent/20 mx-auto ring-2 ring-accent/30">
                  <Image src="/images/karyasaarthi.png" alt="Karya Saarthi" width={64} height={64} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-[#0a0f1e] flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </motion.div>

              <h1 className="text-2xl font-bold text-white font-heading">Staff Portal</h1>
              <p className="text-white/40 text-sm mt-1">Karya Saarthi Internal Access</p>

              {/* Tabs */}
              <div className="flex bg-white/5 p-1 rounded-xl mt-6">
                <button onClick={() => { setActiveTab('login'); setError(''); setPending(false) }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'login' ? 'bg-accent text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                  Login
                </button>
                <button onClick={() => { setActiveTab('register'); setError(''); setPending(false) }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'register' ? 'bg-accent text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                  Register
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'login' ? (
                <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {/* Error / Pending alerts */}
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-sm mb-5 flex items-start gap-2 border border-red-500/20">
                        <span className="text-base mt-0.5">⚠️</span>
                        <span>{error}</span>
                      </motion.div>
                    )}
                    {pending && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-amber-500/10 text-amber-400 px-4 py-3 rounded-xl text-sm mb-5 border border-amber-500/20">
                        ⏳ Your account is pending approval by the administrator.
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login Form */}
                  <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-1.5">Staff Email</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">✉</span>
                        <input
                          type="email"
                          name="email"
                          required
                          autoFocus
                          placeholder="yourname@karyasaarthi.in"
                          className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 focus:outline-none text-sm transition-all"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-1.5">Password</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔒</span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 focus:outline-none text-sm transition-all"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors cursor-pointer text-lg">
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    {/* Forgot password */}
                    <div className="flex justify-end">
                      <Link href="/forgot-password" className="text-xs text-accent/70 hover:text-accent transition-colors">
                        Forgot password?
                      </Link>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-xl text-white font-bold text-base transition-all cursor-pointer disabled:opacity-50 relative overflow-hidden group"
                      style={{ background: 'linear-gradient(135deg, #1B3A6B, #254d8a)' }}
                    >
                      <span className="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 transition-colors" />
                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Authenticating...
                          </>
                        ) : (
                          <>🔐 Access Staff Portal</>
                        )}
                      </span>
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <RegisterForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-white/20 text-xs">
              🛡️ Secured access · Role-based permissions · Enterprise login
            </p>
          </div>
        </div>

        {/* Security badge */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-white/20 text-xs mt-4"
        >
          Not a staff member?{' '}
          <Link href="/login" className="text-accent/60 hover:text-accent transition-colors">
            Go to customer login
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
