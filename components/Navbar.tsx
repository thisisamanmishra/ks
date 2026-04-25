'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Blogs', href: '/blogs' },
  { label: 'Contact', href: '/contact' },
]

const saarthiPortals = [
  { icon: '🎓', label: 'Campus Saarthi', href: '/login?pillar=campus', color: 'hover:bg-blue-500/10 hover:text-blue-600' },
  { icon: '💻', label: 'Digital Saarthi', href: '/login?pillar=digital', color: 'hover:bg-violet-500/10 hover:text-violet-600' },
  { icon: '📞', label: 'Calling Saarthi', href: '/login?pillar=calling', color: 'hover:bg-orange-500/10 hover:text-orange-600' },
  { icon: '🏛️', label: 'Government Saarthi', href: '/login?pillar=government', color: 'hover:bg-emerald-500/10 hover:text-emerald-600' },
  { icon: '🗺️', label: 'Market Saarthi', href: '/login?pillar=market', color: 'hover:bg-amber-500/10 hover:text-amber-600' },
]

interface AuthUser {
  id: number
  fullname: string
  role: string
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [saarthiOpen, setSaarthiOpen] = useState(false)
  const [mobileSaarthiOpen, setMobileSaarthiOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/'
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSaarthiOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setMobileSaarthiOpen(false)
    setSaarthiOpen(false)
  }, [pathname])

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
            <Image src="/images/karyasaarthi.png" alt="Karya Saarthi" width={36} height={36} className="rounded-lg shadow-md group-hover:scale-105 transition-transform flex-shrink-0" style={{ width: 36, height: 'auto' }} />
            <div className="leading-none">
              <span className={`text-lg font-bold font-heading tracking-tight transition-colors block ${logoText}`}>
                Karya <span className="text-accent">Saarthi</span>
              </span>
              <span className={`text-[10px] font-medium transition-colors ${navBg ? 'text-slate-400' : 'text-white/50'}`}>Your Trusted Work Companion</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
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

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2">
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
                {/* Customer / Vendor Login — Direct button */}
                <Link
                  href="/login"
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                    navBg
                      ? 'text-navy border-navy/20 hover:bg-navy/5'
                      : 'text-white border-white/20 hover:bg-white/10'
                  }`}
                >
                  👤 Customer / Vendor
                </Link>

                {/* Saarthi Login Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setSaarthiOpen(v => !v)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      navBg ? 'text-accent hover:bg-accent/5' : 'text-accent-light hover:bg-white/10'
                    }`}
                  >
                    🌟 Saarthi Login
                    <svg className={`w-3 h-3 transition-transform duration-200 ${saarthiOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {saarthiOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl py-2 border border-slate-100 overflow-hidden"
                      >
                        {/* Saarthi pillar header */}
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Saarthi Portals</p>
                        </div>
                        {saarthiPortals.map(portal => (
                          <Link
                            key={portal.label}
                            href={portal.href}
                            onClick={() => setSaarthiOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 font-medium transition-all ${portal.color}`}
                          >
                            <span className="text-lg">{portal.icon}</span>
                            {portal.label}
                          </Link>
                        ))}
                        {/* Staff / Admin Portal */}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <Link
                            href="/staff-login"
                            onClick={() => setSaarthiOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 font-medium hover:bg-navy/5 hover:text-navy transition-all"
                          >
                            <span className="text-lg">🔐</span>
                            Staff / Admin Portal
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Track Project CTA */}
                <Link href="/dashboard" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-white hover:bg-accent-dark shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 hover:-translate-y-0.5">
                  Track Project
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg" aria-label="Toggle menu">
            <div className="w-6 flex flex-col gap-1.5">
              <span className={`block h-0.5 rounded transition-all duration-300 ${navBg ? 'bg-navy' : 'bg-white'} ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 rounded transition-all duration-300 ${navBg ? 'bg-navy' : 'bg-white'} ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 rounded transition-all duration-300 ${navBg ? 'bg-navy' : 'bg-white'} ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-xl shadow-2xl border-t border-slate-100"
          >
            <div className="px-4 py-6 space-y-1 max-h-[80vh] overflow-y-auto">
              {/* Navigation Links */}
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
                    {/* Customer / Vendor Login — Top priority */}
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center px-4 py-3.5 rounded-xl bg-navy text-white font-semibold hover:bg-navy-dark transition-colors">
                      👤 Customer / Vendor Login
                    </Link>

                    {/* Track Project */}
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-center px-4 py-3.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-dark transition-colors">
                      Track Project
                    </Link>

                    {/* Collapsible Saarthi Portals */}
                    <div className="mt-2">
                      <button
                        onClick={() => setMobileSaarthiOpen(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-navy font-semibold hover:bg-navy/5 transition-colors cursor-pointer"
                      >
                        <span>🌟 Saarthi Login</span>
                        <svg className={`w-4 h-4 transition-transform duration-200 ${mobileSaarthiOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {mobileSaarthiOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-2 pl-3 border-l-2 border-accent/20 space-y-0.5 py-1">
                              {saarthiPortals.map(portal => (
                                <Link
                                  key={portal.label}
                                  href={portal.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                  <span>{portal.icon}</span>
                                  {portal.label}
                                </Link>
                              ))}
                              <Link
                                href="/staff-login"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 font-medium hover:bg-slate-50 rounded-lg transition-colors border-t border-slate-100 mt-1 pt-2.5"
                              >
                                <span>🔐</span>
                                Staff / Admin Portal
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
