'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface UserData {
  id: number
  fullname: string
  email: string
  role: string
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let res = await fetch('/api/auth/me')
        if (res.status === 401) {
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' })
          if (refreshRes.ok) res = await fetch('/api/auth/me')
        }
        if (!res.ok) { router.push('/login'); return }
        const data = await res.json()
        if (data.role !== 'vendor' && data.role !== 'super_admin') { router.push('/dashboard'); return }
        setUser(data)
      } catch { router.push('/login') }
      finally { setLoading(false) }
    }
    fetchUser()
  }, [router])

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/') }

  if (loading || !user) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-12 h-12 border-4 border-navy/20 border-t-accent rounded-full animate-spin" /></div>
  }

  const sidebarContent = (
    <>
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <Image src="/images/karyasaarthi.png" alt="Logo" width={36} height={36} className="rounded-lg" />
        <span className="font-bold font-heading text-lg">Karya<span className="text-accent">Saarthi</span></span>
      </div>
      <div className="px-5 py-3 border-b border-white/10">
        <span className="inline-block px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-bold">🏪 Vendor</span>
      </div>
      <nav className="flex-1 py-4">
        {[
          { icon: '📊', label: 'Dashboard', href: '/vendor' },
          { icon: '📋', label: 'My Projects', href: '/vendor/projects' },
          { icon: '⚙️', label: 'Settings', href: '/vendor/settings' },
        ].map(item => (
          <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-5 py-3.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors">
            <span className="text-lg">{item.icon}</span><span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 space-y-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">{user.fullname.charAt(0)}</div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{user.fullname}</p><p className="text-xs text-white/40 truncate">{user.email}</p></div>
        </div>
        <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors">🌐 View Website</Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer">🚪 Logout</button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer"
        aria-label="Open menu">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay active lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-navy flex-col text-white z-50">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 h-screen w-72 bg-navy flex flex-col text-white z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white cursor-pointer">✕</button>
        {sidebarContent}
      </aside>

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen pt-16 lg:pt-6">{children}</main>
    </div>
  )
}
