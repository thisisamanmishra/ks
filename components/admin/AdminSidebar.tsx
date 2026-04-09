'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface UserData {
  id: number
  fullname: string
  email: string
  role: string
  department: string | null
  pillar_role?: string | null
  is_approved: boolean
  avatar_url?: string | null
}

interface NavItem {
  icon: string
  label: string
  href: string
  badge?: number
  subItems?: { icon: string; label: string; href: string }[]
}

interface NavGroup {
  title: string
  items: NavItem[]
  roles?: string[]
  departments?: string[]
}

function buildNavGroups(user: UserData): NavGroup[] {
  const isSuperAdmin = user.role === 'super_admin'
  const isBoard = user.role === 'board_member'
  const isPillar = user.role === 'pillar_member'
  const dept = user.department
  const pillar = user.pillar_role

  const all: NavGroup[] = []

  // ── Super Admin: Overview ──────────────────────────
  if (isSuperAdmin) {
    all.push({
      title: 'Overview',
      items: [
        { icon: '📊', label: 'Dashboard', href: '/admin' },
        { icon: '👑', label: 'Board View', href: '/admin/board' },
        { icon: '📈', label: 'Analytics', href: '/admin/analytics' },
      ],
    })
  }

  // ── Board of Directors ─────────────────────────────
  if (isSuperAdmin || isBoard) {
    all.push({
      title: 'Board of Directors',
      items: [
        { icon: '💰', label: 'Revenue & P&L', href: '/admin/board' },
        { icon: '🎯', label: 'KPI Tracking', href: '/admin/board?tab=kpi' },
        { icon: '📊', label: 'Pillar Performance', href: '/admin/board?tab=pillars' },
        { icon: '📄', label: 'Investor Reports', href: '/admin/board?tab=reports' },
        { icon: '⚖️', label: 'Legal & Policy', href: '/admin/board?tab=mou' },
        { icon: '🗓️', label: 'Board Meetings', href: '/admin/board/meetings' },
      ],
    })
  }


  // ── CRM ────────────────────────────────────────────
  if (isSuperAdmin || dept === 'operations' || dept === 'marketing') {
    all.push({
      title: 'CRM',
      items: [
        { icon: '🎯', label: 'Lead Pipeline', href: '/admin/crm' },
        { icon: '👤', label: 'Clients', href: '/admin/users' },
        { icon: '📞', label: 'Call Logs', href: '/admin/pillars/calling' },
      ],
    })
  }

  // ── Projects ────────────────────────────────────────
  if (isSuperAdmin) {
    all.push({
      title: 'Projects',
      items: [
        { icon: '📋', label: 'Project Board', href: '/admin/projects' },
        { icon: '📩', label: 'New Requests', href: '/admin/requests' },
        { icon: '🏪', label: 'Vendors', href: '/admin/vendors' },
      ],
    })
  } else if (dept === 'operations') {
    all.push({
      title: 'Projects',
      items: [
        { icon: '🏪', label: 'Vendors', href: '/admin/vendors' },
      ],
    })
  }

  // ── Finance ─────────────────────────────────────────
  if (isSuperAdmin || dept === 'finance') {
    all.push({
      title: 'Finance',
      items: [
        { icon: '💵', label: 'Revenue Dashboard', href: '/admin/finance' },
        { icon: '🧾', label: 'Invoices', href: '/admin/finance/invoices' },
        { icon: '⚠️', label: 'Pending Payments', href: '/admin/finance/pending' },
      ],
    })
  }

  // ── Marketing ──────────────────────────────────────
  if (isSuperAdmin || dept === 'marketing') {
    all.push({
      title: 'Marketing',
      items: [
        { icon: '📣', label: 'Campaign Planner', href: '/admin/marketing?tab=campaigns' },
        { icon: '📊', label: 'Lead Source Analytics', href: '/admin/marketing?tab=leads' },
        { icon: '📅', label: 'Content Calendar', href: '/admin/marketing?tab=calendar' },
        { icon: '🤝', label: 'Referral Manager', href: '/admin/marketing?tab=referral' },
        { icon: '🎪', label: 'Event Creation', href: '/admin/marketing?tab=events' },
        { icon: '🔍', label: 'Competitor Intel', href: '/admin/marketing?tab=competitor' },
        { icon: '🎨', label: 'Brand Assets', href: '/admin/marketing?tab=brand' },
        { icon: '📝', label: 'Blog Editor', href: '/admin/blogs' },
      ],
    })
  }

  // ── Digital Saarthi ────────────────────────────────
  if (isSuperAdmin || dept === 'digital' || (user.role === 'admin' && pillar === 'digital')) {
    all.push({
      title: 'Digital Saarthi',
      items: [
        { icon: '📊', label: 'Overview', href: '/admin/digital' },
        { icon: '👥', label: 'Creator Roster', href: '/admin/digital' },
        { icon: '📥', label: 'Submissions', href: '/admin/digital' },
        { icon: '📈', label: 'Creator Analytics', href: '/admin/digital' },
        { icon: '📡', label: 'Lead Generation', href: '/admin/digital' },
        { icon: '💰', label: 'Revenue Attribution', href: '/admin/digital' },
        { icon: '💬', label: 'Creator Chat', href: '/admin/digital' },
        { icon: '🎨', label: 'Ad Creatives', href: '/admin/digital' },
        { icon: '📅', label: 'Content Calendar', href: '/admin/digital' },
        { icon: '🔍', label: 'SEO', href: '/admin/digital' },
        { icon: '📧', label: 'Email Campaigns', href: '/admin/digital' },
      ],
    })
  }

  // ── Staff Management (Super Admin only — replaces HR) ────
  if (isSuperAdmin || isBoard) {
    all.push({
      title: 'Staff Management',
      items: [
        { icon: '👥', label: 'Team Directory', href: '/admin/staff' },
        { icon: '💰', label: 'Payroll', href: '/admin/staff?tab=payroll' },
        { icon: '⭐', label: 'Appraisals', href: '/admin/staff?tab=appraisals' },
        { icon: '🏖️', label: 'Leaves & Attendance', href: '/admin/staff?tab=leaves' },
      ],
    })
  }

  // ── 5 Pillars ──────────────────────────────────────
  if (isSuperAdmin || isPillar) {
    const pillarItems = isSuperAdmin ? [
      { icon: '🎓', label: 'Campus Saarthi', href: '/admin/pillars/campus' },
      { icon: '💻', label: 'Digital Saarthi', href: '/admin/pillars/digital' },
      { icon: '📞', label: 'Calling Saarthi', href: '/admin/pillars/calling' },
      { icon: '🏛️', label: 'Government Saarthi', href: '/admin/pillars/government' },
      { icon: '🗺️', label: 'Market Saarthi', href: '/admin/pillars/market' },
    ] : [
      { icon: '🌟', label: `${pillar?.charAt(0).toUpperCase()}${pillar?.slice(1)} Saarthi`, href: `/admin/pillars/${pillar}` },
    ]

    all.push({ title: '5 Saarthi Pillars', items: pillarItems })
  }

  // ── Operations ──────────────────────────────────────
  const isProjectManager = dept === 'operations' && pillar === 'project_manager'
  if (isSuperAdmin || (dept === 'operations' && !isProjectManager)) {
    all.push({
      title: 'Operations Management',
      items: [
        { icon: '⚙️', label: 'Operations Board', href: '/admin/operations' },
      ],
    })
  }

  // ── My Profile — visible to ALL staff ──────────────
  all.push({
    title: 'My Account',
    items: [
      { icon: '👤', label: 'My Profile & Docs', href: '/admin/profile' },
      { icon: '🏖️', label: 'My Leave', href: '/admin/profile?tab=leaves' },
      { icon: '⭐', label: 'My Appraisals', href: '/admin/profile?tab=appraisals' },
    ],
  })

  // ── Shared Workspace — visible to ALL staff ──────────
  all.push({
    title: 'Shared Tools',
    items: [
      { icon: '📁', label: 'Team Workspace', href: '/admin/workspace' },
    ],
  })

  // ── Super Admin only: Settings & Access ─────────────
  if (isSuperAdmin) {
    all.push({
      title: 'Platform',
      items: [
        { icon: '👤', label: 'All Users', href: '/admin/users' },
        { icon: '📩', label: 'Admin Requests', href: '/admin/requests' },
        { icon: '📢', label: 'Announcements', href: '/admin/announcements' },
        { icon: '⚙️', label: 'Settings', href: '/admin/settings' },
      ],
    })
  }

  return all
}

export default function AdminSidebar({ user }: { user: UserData }) {
  const pathname = usePathname()
  const router = useRouter()
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Overview', 'CRM', 'Projects']))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState(0)

  const navGroups = buildNavGroups(user)

  useEffect(() => {
    // Auto-expand group containing current path
    navGroups.forEach(group => {
      if (group.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))) {
        setExpanded(prev => new Set([...prev, group.title]))
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleGroup = (title: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(title) ? next.delete(title) : next.add(title)
      return next
    })
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/staff-login')
  }

  const getRoleBadge = () => {
    if (user.role === 'super_admin') return { label: '👑 Super Admin', color: '#FF6B35' }
    if (user.role === 'board_member') return { label: '🏦 Board Member', color: '#8B5CF6' }
    if (user.role === 'pillar_member') return { label: `🌟 ${user.pillar_role} Saarthi`, color: '#10B981' }
    if (user.role === 'admin') return { label: `⚙️ ${user.department?.toUpperCase()} Admin`, color: '#3B82F6' }
    return { label: user.role, color: '#6B7280' }
  }

  const roleBadge = getRoleBadge()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/8 flex-shrink-0">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg ring-2 ring-accent/30 flex-shrink-0">
            <Image src="/images/karyasaarthi.png" alt="Logo" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-bold text-white font-heading text-sm">Karya<span className="text-accent">Saarthi</span></span>
            <p className="text-white/30 text-[10px]">Enterprise Platform</p>
          </div>
        </Link>
      </div>

      {/* User card */}
      <div className="m-3 p-3 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: roleBadge.color }}>
            {user.fullname.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user.fullname}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${roleBadge.color}25`, color: roleBadge.color }}>
              {roleBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {navGroups.map(group => (
          <div key={group.title} className="mb-1">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.title)}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-wider hover:text-white/50 transition-colors cursor-pointer"
            >
              <span>{group.title}</span>
              <span className="text-white/20 transition-transform duration-200"
                style={{ transform: expanded.has(group.title) ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
            </button>

            <AnimatePresence>
              {expanded.has(group.title) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {group.items.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all mb-0.5 group relative ${
                        isActive(item.href)
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                      }`}
                    >
                      {/* Active indicator */}
                      {isActive(item.href) && (
                        <motion.div layoutId="activeNav"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                          style={{ background: '#FF6B35' }} />
                      )}
                      <span className="text-base">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-red-500">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/8 flex-shrink-0 space-y-1">
        <Link href="/" target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors">
          <span>🌐</span> View Website
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer">
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen fixed top-0 left-0 z-30 flex-col"
        style={{ background: '#0d1829', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl cursor-pointer"
        style={{ background: '#1B3A6B' }}
        onClick={() => setMobileOpen(v => !v)}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 z-50 flex flex-col"
              style={{ background: '#0d1829' }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
