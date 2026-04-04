'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AdminSidebar from '@/components/admin/AdminSidebar'

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

const INTERNAL_ROLES = ['super_admin', 'board_member', 'admin', 'pillar_member']

function TopBar({ user }: { user: UserData }) {
  const router = useRouter()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showGroupChat, setShowGroupChat] = useState(false)
  const [unread, setUnread] = useState(0)
  const [showDM, setShowDM] = useState(false)
  const [showMeetings, setShowMeetings] = useState(false)
  const [NotifComp, setNotifComp] = useState<React.ComponentType<{ userId: number; onClose: () => void }> | null>(null)
  const [ChatComp, setChatComp] = useState<React.ComponentType<{ currentUserId: number; isAdmin?: boolean; onClose: () => void }> | null>(null)
  const [DMComp, setDMComp] = useState<React.ComponentType<{ currentUserId: number; mode: 'ops' | 'user'; onClose: () => void }> | null>(null)
  const [MeetComp, setMeetComp] = useState<React.ComponentType<{ currentUserId: number; onClose: () => void }> | null>(null)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications?limit=1')
        if (res.ok) { const d = await res.json(); setUnread(d.unread || 0) }
      } catch {}
    }
    fetchUnread()
    const i = setInterval(fetchUnread, 15000)
    return () => clearInterval(i)
  }, [])

  const openNotifs = () => {
    if (!NotifComp) import('@/components/NotificationCenter').then(m => setNotifComp(() => m.default))
    setShowNotifs(v => !v)
  }
  const openChat = () => {
    if (!ChatComp) import('@/components/admin/GroupChatPanel').then(m => setChatComp(() => m.default))
    setShowGroupChat(v => !v)
  }
  const openDM = () => {
    if (!DMComp) import('@/components/admin/DirectChatPanel').then(m => setDMComp(() => m.default))
    setShowDM(v => !v)
  }
  const openMeetings = () => {
    if (!MeetComp) import('@/components/admin/MeetingPanel').then(m => setMeetComp(() => m.default))
    setShowMeetings(v => !v)
  }
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <>
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          <span className="font-medium text-navy">{user.fullname}</span>
          <span className="mx-2 text-slate-300">·</span>
          <span className="capitalize">{user.role.replace('_', ' ')}</span>
          {user.department && <span className="ml-1 text-xs text-accent capitalize">· {user.department}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openMeetings}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-base cursor-pointer transition-all" title="Video Meetings">
            📹
          </button>
          <button onClick={openDM}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-base cursor-pointer transition-all" title="Direct Messages">
            ✉️
          </button>
          <button onClick={openChat}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-base cursor-pointer transition-all" title="Group Chat">
            💬
          </button>
          <button onClick={openNotifs}
            className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-base cursor-pointer transition-all" title="Notifications">
            🔔
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          <button onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 cursor-pointer transition-all">
            Logout
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showNotifs && NotifComp && <NotifComp userId={user.id} onClose={() => setShowNotifs(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showGroupChat && ChatComp && <ChatComp currentUserId={user.id} isAdmin={['super_admin', 'admin'].includes(user.role)} onClose={() => setShowGroupChat(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showDM && DMComp && <DMComp currentUserId={user.id} mode="ops" onClose={() => setShowDM(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showMeetings && MeetComp && <MeetComp currentUserId={user.id} onClose={() => setShowMeetings(false)} />}
      </AnimatePresence>
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let res = await fetch('/api/auth/me')
        if (res.status === 401) {
          const r = await fetch('/api/auth/refresh', { method: 'POST' })
          if (r.ok) res = await fetch('/api/auth/me')
        }
        if (!res.ok) { router.push('/staff-login'); return }
        const data = await res.json()
        if (!INTERNAL_ROLES.includes(data.role)) { router.push('/dashboard'); return }
        if (data.role === 'admin' && !data.is_approved) { router.push('/dashboard?pending=1'); return }
        setUser(data)
      } catch {
        router.push('/staff-login')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080d1a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-white/5 rounded-full" />
            <div className="w-14 h-14 border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-white/30 text-sm">Loading staff portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f8' }}>
      <AdminSidebar user={user} />
      <main className="lg:ml-64 min-h-screen">
        <TopBar user={user} />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 sm:p-6 lg:p-8 pt-2"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
