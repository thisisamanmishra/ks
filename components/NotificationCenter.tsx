'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { fetchWithAuth } from '@/lib/auth/fetchWithAuth'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  link: string | null
  project_id: number | null
  is_read: boolean
  created_at: string
}

interface NotificationCenterProps {
  userId: number
  onClose: () => void
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  project_update: { icon: '📋', color: '#3B82F6', bg: '#DBEAFE' },
  payment: { icon: '💰', color: '#10B981', bg: '#D1FAE5' },
  message: { icon: '💬', color: '#8B5CF6', bg: '#EDE9FE' },
  system: { icon: '🔔', color: '#6B7280', bg: '#F3F4F6' },
  lead: { icon: '🎯', color: '#FF6B35', bg: '#FFF0EB' },
  announcement: { icon: '📣', color: '#F59E0B', bg: '#FEF3C7' },
}

export default function NotificationCenter({ userId, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/notifications?limit=50')
      if (res.ok) { const d = await res.json(); setNotifications(d.notifications || []) }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const markRead = async (id: number) => {
    await fetchWithAuth('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await fetchWithAuth('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const clearAll = async () => {
    await fetchWithAuth('/api/notifications', { method: 'DELETE' })
    setNotifications([])
  }

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications
  const unreadCount = notifications.filter(n => !n.is_read).length

  const timeAgo = (iso: string) => {
    const seconds = (Date.now() - new Date(iso).getTime()) / 1000
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`
    return `${Math.round(seconds / 86400)}d ago`
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-end p-4"
      onClick={onClose}>
      <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-[85vh] flex flex-col overflow-hidden mt-16">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-navy font-heading">🔔 Notifications</h3>
            {unreadCount > 0 && <p className="text-xs text-accent mt-0.5">{unreadCount} unread</p>}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-accent hover:underline cursor-pointer">
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 cursor-pointer text-sm">
              ✕
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-5 py-2.5 border-b border-slate-100 flex gap-2">
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize cursor-pointer transition-all ${
                filter === f ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {f} {f === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
          ))}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="ml-auto text-xs text-red-400 hover:text-red-600 cursor-pointer">
              Clear all
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
              <span className="text-5xl mb-3">🎉</span>
              <p className="text-sm font-medium">{filter === 'unread' ? 'No unread notifications' : 'All caught up!'}</p>
            </div>
          ) : (
            <div>
              {filtered.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
                return (
                  <div key={notif.id}
                    className={`flex gap-3 px-5 py-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-accent/3' : ''}`}
                    onClick={() => !notif.is_read && markRead(notif.id)}>
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                      style={{ background: cfg.bg }}>
                      {cfg.icon}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${notif.is_read ? 'text-slate-600' : 'text-navy'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-slate-300">{timeAgo(notif.created_at)}</span>
                        {notif.link && (
                          <Link href={notif.link} className="text-[10px] text-accent hover:underline" onClick={e => e.stopPropagation()}>
                            View →
                          </Link>
                        )}
                        {notif.project_id && (
                          <Link href={`/admin/projects/${notif.project_id}`} className="text-[10px] text-accent hover:underline" onClick={e => e.stopPropagation()}>
                            Project →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
