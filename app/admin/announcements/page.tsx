'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Announcement {
  id: number
  title: string
  body: string
  type: string
  target_roles: string[]
  is_pinned: boolean
  created_at: string
  author: { id: number; fullname: string } | null
}

const TYPE_CONFIG = {
  info: { label: 'Info', icon: 'ℹ️', color: '#3B82F6', bg: '#DBEAFE' },
  success: { label: 'Success', icon: '✅', color: '#10B981', bg: '#D1FAE5' },
  warning: { label: 'Warning', icon: '⚠️', color: '#F59E0B', bg: '#FEF3C7' },
  urgent: { label: 'Urgent', icon: '🚨', color: '#EF4444', bg: '#FEE2E2' },
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', type: 'info', target_roles: ['all'], is_pinned: false })
  const [saving, setSaving] = useState(false)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/announcements')
      const d = await res.json()
      setAnnouncements(d.announcements || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetch_() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowCreate(false)
    setForm({ title: '', body: '', type: 'info', target_roles: ['all'], is_pinned: false })
    fetch_()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' })
    fetch_()
  }

  const ROLES = ['all', 'super_admin', 'admin', 'board_member', 'pillar_member', 'vendor', 'customer']

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">📣 Announcements</h1>
          <p className="text-slate-500 text-sm mt-0.5">Broadcast messages to staff, vendors, or customers</p>
        </div>
        <button onClick={() => setShowCreate(v => !v)}
          className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer"
          style={{ background: '#FF6B35' }}>
          + New Announcement
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-navy font-heading mb-4">📝 New Announcement</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Announcement title" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Message *</label>
                <textarea required rows={4} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="Write your announcement here..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy">
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Target Role</label>
                  <select value={form.target_roles[0]}
                    onChange={e => setForm(p => ({ ...p, target_roles: [e.target.value] }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy">
                    {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(p => ({ ...p, is_pinned: e.target.checked }))}
                  className="rounded" />
                📌 Pin this announcement (shows at top)
              </label>
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60"
                  style={{ background: '#FF6B35' }}>
                  {saving ? '⏳ Publishing...' : '📣 Publish'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 text-sm cursor-pointer hover:bg-slate-200">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
          <span className="text-4xl block mb-3">📣</span>
          <p className="text-slate-400">No announcements yet. Create the first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a, i) => {
            const cfg = TYPE_CONFIG[a.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: cfg.bg }}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-navy">{a.title}</h3>
                        {a.is_pinned && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">📌 Pinned</span>}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {a.type}
                        </span>
                        {a.target_roles.map(r => (
                          <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{r}</span>
                        ))}
                      </div>
                      <p className="text-sm text-slate-500 whitespace-pre-line">{a.body}</p>
                      <p className="text-[10px] text-slate-400 mt-2">
                        By {a.author?.fullname || 'System'} · {new Date(a.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(a.id)}
                    className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-sm cursor-pointer hover:bg-red-100 flex-shrink-0">
                    ✕
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
