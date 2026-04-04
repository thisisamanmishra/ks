'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Blogs', href: '/blogs' },
  { label: 'Contact', href: '/contact' },
]

interface AuthUser {
  id: number
  fullname: string
  role: string
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let res = await fetch('/api/auth/me')
        if (res.status === 401) {
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' })
          if (refreshRes.ok) res = await fetch('/api/auth/me')
        }
        if (res.ok) {
          const data = await res.json()
          setUser({ id: data.id, fullname: data.fullname, role: data.role })
        }
      } catch {}
      setAuthChecked(true)
    }
    checkAuth()
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/dashboard'
    if (user.role === 'super_admin' || user.role === 'admin') return '/admin'
    if (user.role === 'vendor') return '/vendor'
    return '/dashboard'
  }

  const navBg = scrolled || !isHome
  const textClass = navBg ? 'text-slate-700 hover:text-navy' : 'text-white/90 hover:text-white hover:bg-white/10'
  const logoText = navBg ? 'text-navy' : 'text-white'

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        navBg ? 'bg-white/90 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/images/karyasaarthi.jpeg" alt="KaryaSaarthi" width={36} height={36} className="rounded-lg shadow-md group-hover:scale-105 transition-transform flex-shrink-0" />
            <div className="leading-none">
              <span className={`text-lg font-bold font-heading tracking-tight transition-colors block ${logoText}`}>
                Karya<span className="text-accent">Saarthi</span>
              </span>
              <span className={`text-[10px] font-medium transition-colors ${navBg ? 'text-slate-400' : 'text-white/50'}`}>Your Trusted Work Companion</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? 'bg-accent/10 text-accent font-semibold'
                    : textClass
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {authChecked && user ? (
              <>
                <Link href={getDashboardLink()} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-white hover:bg-accent-dark shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 hover:-translate-y-0.5">
                  📊 Dashboard
                </Link>
                <button onClick={handleLogout} className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${navBg ? 'text-slate-500 hover:text-red-500 hover:bg-red-50' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                  Logout
                </button>
              </>
            ) : authChecked ? (
              <>
                <div className="relative group">
                  <button className={`flex items-center gap-1 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    navBg ? 'text-navy hover:bg-navy/5' : 'text-white hover:bg-white/10'
                  }`}>
                    Sign In <span className="text-[10px]">▼</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-100 divide-y divide-slate-100">
                    <div className="pb-1">
                      <Link href="/login" className="block px-4 py-2 text-sm text-slate-700 hover:bg-accent/10 hover:text-accent font-medium">👤 Customer Login</Link>
                    </div>
                    <div className="py-1">
                      <div className="px-4 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Saarthi Portals</div>
                      <Link href="/login?pillar=campus" className="block px-4 py-2 text-sm text-slate-700 hover:bg-blue-500/10 hover:text-blue-600 font-medium">🎓 Campus Saarthi</Link>
                      <Link href="/login?pillar=digital" className="block px-4 py-2 text-sm text-slate-700 hover:bg-violet-500/10 hover:text-violet-600 font-medium">💻 Digital Saarthi</Link>
                      <Link href="/login?pillar=calling" className="block px-4 py-2 text-sm text-slate-700 hover:bg-orange-500/10 hover:text-orange-600 font-medium">📞 Calling Saarthi</Link>
                      <Link href="/login?pillar=government" className="block px-4 py-2 text-sm text-slate-700 hover:bg-emerald-500/10 hover:text-emerald-600 font-medium">🏛️ Government Saarthi</Link>
                      <Link href="/login?pillar=market" className="block px-4 py-2 text-sm text-slate-700 hover:bg-amber-500/10 hover:text-amber-600 font-medium">🗺️ Market Saarthi</Link>
                    </div>
                  </div>
                </div>
                <Link href="/dashboard" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-white hover:bg-accent-dark shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 hover:-translate-y-0.5">
                  Track Project
                </Link>
              </>
            ) : null}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg" aria-label="Toggle menu">
            <div className="w-6 flex flex-col gap-1.5">
              <span className={`block h-0.5 rounded transition-all duration-300 ${navBg ? 'bg-navy' : 'bg-white'} ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 rounded transition-all duration-300 ${navBg ? 'bg-navy' : 'bg-white'} ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 rounded transition-all duration-300 ${navBg ? 'bg-navy' : 'bg-white'} ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-xl shadow-2xl border-t border-slate-100"
          >
            <div className="px-4 py-6 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-accent/10 text-accent font-semibold'
                      : 'text-slate-700 hover:bg-navy/5 hover:text-navy'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link href={getDashboardLink()} onClick={() => setMobileOpen(false)} className="text-center px-4 py-3 rounded-xl bg-accent text-white font-semibold">📊 Dashboard</Link>
                    <button onClick={() => { handleLogout(); setMobileOpen(false) }} className="text-center px-4 py-3 rounded-xl text-red-500 font-semibold hover:bg-red-50 cursor-pointer">Logout</button>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-center px-4 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-dark">Track Project</Link>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center px-4 py-3 rounded-xl text-navy font-semibold hover:bg-navy/5 border border-slate-200">Customer Login</Link>
                    
                    <div className="border-t border-slate-100 mt-2 pt-2 pb-1 px-4 text-xs font-semibold text-slate-400 uppercase text-center">Saarthi Portals</div>
                    <Link href="/login?pillar=campus" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2 text-sm text-slate-700 font-medium hover:bg-blue-50">🎓 Campus Saarthi</Link>
                    <Link href="/login?pillar=digital" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2 text-sm text-slate-700 font-medium hover:bg-violet-50">💻 Digital Saarthi</Link>
                    <Link href="/login?pillar=calling" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2 text-sm text-slate-700 font-medium hover:bg-orange-50">📞 Calling Saarthi</Link>
                    <Link href="/login?pillar=government" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2 text-sm text-slate-700 font-medium hover:bg-emerald-50">🏛️ Government Saarthi</Link>
                    <Link href="/login?pillar=market" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2 text-sm text-slate-700 font-medium hover:bg-amber-50">🗺️ Market Saarthi</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
