'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pillar = searchParams.get('pillar')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  // Pillar specific configurations
  let title = "Welcome Back!"
  let subtitle = "Sign in to your account"
  let bgClass = "from-navy-dark via-navy to-navy-light"
  let icon = null
  let themeColor = "text-navy"
  let focusRing = "focus:ring-navy/10 focus:border-navy"

  switch(pillar) {
    case 'campus':
      title = "Campus Saarthi"
      subtitle = "Empowering Students"
      bgClass = "from-blue-900 via-indigo-900 to-blue-800"
      icon = "🎓"
      themeColor = "text-blue-600"
      focusRing = "focus:ring-blue-500/20 focus:border-blue-500"
      break;
    case 'digital':
      title = "Digital Saarthi"
      subtitle = "Content & Presence"
      bgClass = "from-violet-900 via-purple-900 to-violet-800"
      icon = "💻"
      themeColor = "text-violet-600"
      focusRing = "focus:ring-violet-500/20 focus:border-violet-500"
      break;
    case 'calling':
      title = "Calling Saarthi"
      subtitle = "Voice-First Outreach"
      bgClass = "from-orange-900 via-red-900 to-orange-800"
      icon = "📞"
      themeColor = "text-orange-600"
      focusRing = "focus:ring-orange-500/20 focus:border-orange-500"
      break;
    case 'government':
      title = "Govt Saarthi"
      subtitle = "Public Sector Excellence"
      bgClass = "from-emerald-900 via-teal-900 to-emerald-800"
      icon = "🏛️"
      themeColor = "text-emerald-600"
      focusRing = "focus:ring-emerald-500/20 focus:border-emerald-500"
      break;
    case 'market':
      title = "Market Saarthi"
      subtitle = "On-Ground Presence"
      bgClass = "from-amber-900 via-orange-900 to-amber-800"
      icon = "🗺️"
      themeColor = "text-amber-600"
      focusRing = "focus:ring-amber-500/20 focus:border-amber-500"
      break;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
          remember: formData.get('remember') === 'on',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.pending) {
          setPending(true)
        } else {
          setError(data.error || 'Login failed')
        }
        setLoading(false)
        return
      }
      // Redirect based on role
      const role = data.user?.role
      const dept = data.user?.department

      // Enforce portal login restrictions
      if (['super_admin', 'board_member', 'admin', 'pillar_member'].includes(role)) {
        setError('Internal staff must use the Staff Portal to log in.')
        await fetch('/api/auth/logout', { method: 'POST' })
        setLoading(false)
        return
      }

      if (['customer', 'vendor'].includes(role) && pillar) {
        setError('This portal is for Saarthi members. Please use the main customer login.')
        await fetch('/api/auth/logout', { method: 'POST' })
        setLoading(false)
        return
      }

      if (['campus', 'digital', 'calling', 'government', 'market'].includes(role)) {
        if (role !== pillar) {
          setError(`Please log in through the ${role.charAt(0).toUpperCase() + role.slice(1)} Saarthi portal.`)
          await fetch('/api/auth/logout', { method: 'POST' })
          setLoading(false)
          return
        }
      }

      if (role === 'vendor') {
        router.push('/vendor')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgClass} flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500`}>
      {/* Background shapes */}
      {[...Array(3)].map((_, i) => (
        <motion.div key={i} className="absolute w-64 h-64 rounded-full bg-white/5" style={{ top: `${20 + i * 30}%`, left: `${10 + i * 30}%` }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 120, 240, 360] }}
          transition={{ duration: 20 + i * 5, repeat: Infinity }}
        />
      ))}

      <Link href="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-medium hover:bg-white/20 transition-all">
        ← Back to Home
      </Link>

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 min-h-[60px] items-center">
            {icon ? (
              <div className="text-6xl drop-shadow-lg filter">{icon}</div>
            ) : (
              <Image src="/images/karyasaarthi.png" alt="Logo" width={60} height={60} className="rounded-xl shadow-lg" />
            )}
          </div>
          <h2 className={`text-2xl font-bold font-heading ${themeColor}`}>{title}</h2>
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {pending && (
          <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-sm mb-4">
            ⏳ Your admin registration is pending approval. You will be notified via email once approved.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" name="email" required autoFocus placeholder="name@example.com"
              className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-sm transition-all ${focusRing}`}
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input type={showPassword ? 'text' : 'password'} name="password" required placeholder="Enter your password"
              className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-sm transition-all pr-12 ${focusRing}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-9 text-slate-400 hover:${themeColor} text-sm cursor-pointer`}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input type="checkbox" name="remember" className={`rounded text-accent focus:ring-accent`} /> Remember me
            </label>
            <Link href="/forgot-password" className="text-accent font-medium hover:underline">Forgot?</Link>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl bg-accent text-white font-bold text-base hover:bg-accent-dark shadow-lg shadow-accent/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3"><div className="flex-1 h-px bg-slate-200" /><span className="text-slate-400 text-xs">or</span><div className="flex-1 h-px bg-slate-200" /></div>

        <div className="flex gap-3">
          <a href="https://wa.me/918595025753" target="_blank" rel="noopener noreferrer" className="flex-1 py-3 rounded-xl border border-slate-200 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">💬 WhatsApp</a>
          <a href="tel:+918595025753" className="flex-1 py-3 rounded-xl border border-slate-200 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">📞 Call</a>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6 pt-6 border-t border-slate-100">
          Don&apos;t have an account? <Link href={`/signup${pillar ? `?pillar=${pillar}` : ''}`} className="text-accent font-semibold hover:underline">Create Account</Link>
        </p>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy flex items-center justify-center p-4">Loading login...</div>}>
      <LoginContent />
    </Suspense>
  )
}
