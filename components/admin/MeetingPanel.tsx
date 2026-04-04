'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Meeting {
  id: number
  title: string
  description: string | null
  jitsi_room: string
  scheduled_at: string | null
  duration_min: number
  created_by: number
  created_at: string
  creator?: { fullname: string } | null
  participants?: { user_id: number; status: string; user?: { fullname: string } }[]
}

interface Props {
  currentUserId: number
  onClose: () => void
}

function generateRoomName(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const rand = Math.random().toString(36).substring(2, 7)
  return `karyasaarthi-${slug}-${rand}`
}

export default function MeetingPanel({ currentUserId, onClose }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'create'>('upcoming')
  const [saving, setSaving] = useState(false)
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_min: 60,
  })
  const jitsiRef = useRef<HTMLIFrameElement>(null)

  const fetchMeetings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/meetings')
      if (res.ok) {
        const d = await res.json()
        setMeetings(d.meetings || [])
      }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMeetings() }, [fetchMeetings])

  const createMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const jitsi_room = generateRoomName(form.title)
      const res = await fetch('/api/admin/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, jitsi_room }),
      })
      if (res.ok) {
        const d = await res.json()
        setMeetings(prev => [d.meeting, ...prev])
        setActiveTab('upcoming')
        setForm({ title: '', description: '', scheduled_at: '', duration_min: 60 })
      }
    } catch {} finally { setSaving(false) }
  }

  const deleteMeeting = async (id: number) => {
    await fetch('/api/admin/meetings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMeetings(prev => prev.filter(m => m.id !== id))
  }

  const joinMeeting = (meeting: Meeting) => {
    setActiveMeeting(meeting)
  }

  const now = new Date()
  const upcomingMeetings = meetings.filter(m => !m.scheduled_at || new Date(m.scheduled_at) >= now)
  const pastMeetings = meetings.filter(m => m.scheduled_at && new Date(m.scheduled_at) < now)

  const TABS = [
    { key: 'upcoming', label: '📅 Upcoming', count: upcomingMeetings.length },
    { key: 'past', label: '🕐 Past', count: pastMeetings.length },
    { key: 'create', label: '+ New Meeting', count: null },
  ] as const

  // ── Jitsi iframe modal ─────────────────────────────────────
  if (activeMeeting) {
    const jitsiUrl = `https://meet.jit.si/${activeMeeting.jitsi_room}#userInfo.displayName=${encodeURIComponent('KaryaSaarthi Member')}`
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/80 flex flex-col"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-900 flex-shrink-0">
          <div>
            <h3 className="font-bold text-white font-heading text-sm">{activeMeeting.title}</h3>
            <p className="text-white/40 text-xs">Room: {activeMeeting.jitsi_room}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://meet.jit.si/${activeMeeting.jitsi_room}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
            >
              🔗 Open in New Tab
            </a>
            <button
              onClick={() => setActiveMeeting(null)}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
            >
              ✕ End / Leave
            </button>
          </div>
        </div>

        {/* Jitsi iframe */}
        <iframe
          ref={jitsiRef}
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="flex-1 w-full border-0"
          title={`Video Meeting: ${activeMeeting.title}`}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0d1829 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">📹</div>
            <div>
              <h2 className="font-bold text-white font-heading">Video Meetings</h2>
              <p className="text-white/40 text-xs">Schedule & join team meetings</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm cursor-pointer">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === t.key
                  ? 'text-navy border-b-2 border-navy bg-blue-50/50'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Upcoming */}
          {activeTab === 'upcoming' && (
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
                ))
              ) : upcomingMeetings.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-5xl block mb-3">📅</span>
                  <p className="text-slate-500 font-semibold">No upcoming meetings</p>
                  <p className="text-slate-400 text-sm mt-1">Create one to get started</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer"
                    style={{ background: '#1B3A6B' }}
                  >
                    + Schedule Meeting
                  </button>
                </div>
              ) : (
                upcomingMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    currentUserId={currentUserId}
                    onJoin={() => joinMeeting(meeting)}
                    onDelete={() => deleteMeeting(meeting.id)}
                  />
                ))
              )}
            </div>
          )}

          {/* Past */}
          {activeTab === 'past' && (
            <div className="space-y-3">
              {pastMeetings.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <span className="text-4xl block mb-3">🕐</span>
                  <p>No past meetings</p>
                </div>
              ) : (
                pastMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    currentUserId={currentUserId}
                    onJoin={() => joinMeeting(meeting)}
                    onDelete={() => deleteMeeting(meeting.id)}
                    isPast
                  />
                ))
              )}
            </div>
          )}

          {/* Create */}
          {activeTab === 'create' && (
            <form onSubmit={createMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Meeting Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Weekly Team Sync"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Agenda, topics to discuss..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy focus:bg-white transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Duration (minutes)</label>
                  <select
                    value={form.duration_min}
                    onChange={e => setForm(p => ({ ...p, duration_min: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy focus:bg-white transition-colors"
                  >
                    {[15, 30, 45, 60, 90, 120].map(d => (
                      <option key={d} value={d}>{d} min{d >= 60 ? ` (${d / 60}h)` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview */}
              {form.title && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-600 font-semibold mb-1">📋 Meeting Room Preview</p>
                  <p className="text-sm text-navy font-mono truncate">
                    meet.jit.si/{generateRoomName(form.title)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">A unique room will be generated when you create the meeting</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || !form.title}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm cursor-pointer disabled:opacity-50 shadow-lg transition-all hover:shadow-xl"
                  style={{ background: '#1B3A6B' }}
                >
                  {saving ? '⏳ Creating...' : '🚀 Create Meeting'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upcoming')}
                  className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-medium text-sm cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function MeetingCard({
  meeting, currentUserId, onJoin, onDelete, isPast
}: {
  meeting: Meeting
  currentUserId: number
  onJoin: () => void
  onDelete: () => void
  isPast?: boolean
}) {
  const isCreator = meeting.created_by === currentUserId
  const scheduledDate = meeting.scheduled_at ? new Date(meeting.scheduled_at) : null

  return (
    <div className={`rounded-2xl border p-5 transition-all ${isPast ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isPast ? 'bg-slate-200' : 'bg-blue-100'}`}>
            📹
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-navy text-sm truncate">{meeting.title}</h4>
            {meeting.description && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">{meeting.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 flex-wrap">
              {scheduledDate && (
                <span>📅 {scheduledDate.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              )}
              <span>⏱ {meeting.duration_min} min</span>
              <span className="font-mono truncate max-w-[140px]">🔗 {meeting.jitsi_room}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onJoin}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              isPast
                ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                : 'text-white hover:opacity-90 shadow-md'
            }`}
            style={isPast ? {} : { background: '#10B981' }}
          >
            {isPast ? '▶ Replay Room' : '▶ Join'}
          </button>
          {isCreator && (
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs cursor-pointer"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
