'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface Meeting { id: number; title: string; description: string | null; jitsi_room: string; scheduled_at: string | null; duration_min: number; created_at: string }

export default function BoardMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', scheduled_at: '', duration_min: '60' })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/meetings')
      const d = res.ok ? await res.json() : { meetings: [] }
      setMeetings(d.meetings || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const createMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const roomId = `ks-${Math.random().toString(36).substr(2, 10)}`
      const res = await fetch('/api/admin/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description, jitsi_room: roomId, scheduled_at: form.scheduled_at || null, duration_min: Number(form.duration_min) || 60 })
      })
      if (res.ok) { setShowForm(false); setForm({ title: '', description: '', scheduled_at: '', duration_min: '60' }); load() }
    } catch {} finally { setSaving(false) }
  }

  const upcoming = meetings.filter(m => m.scheduled_at && new Date(m.scheduled_at) > new Date())
  const past = meetings.filter(m => !m.scheduled_at || new Date(m.scheduled_at) <= new Date())

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">🗓️ Board Meetings</h1>
          <p className="text-slate-500 text-sm">Schedule &amp; join board meetings via Jitsi Meet</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer" style={{ background: '#1B3A6B' }}>+ Schedule Meeting</button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={createMeeting} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-navy font-heading">New Board Meeting</h3>
          <div className="grid grid-cols-2 gap-3">
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Meeting title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            <input type="number" value={form.duration_min} onChange={e => setForm(p => ({ ...p, duration_min: e.target.value }))} placeholder="Duration (minutes)" min="15" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Meeting agenda / notes..." className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60" style={{ background: '#1B3A6B' }}>{saving ? '⏳ Creating...' : '🗓️ Schedule Meeting'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
          </div>
        </motion.form>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-navy uppercase tracking-wider">📅 Upcoming</h2>
              {upcoming.map((m, i) => (
                <MeetingCard key={m.id} meeting={m} delay={i * 0.05} />
              ))}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">🕐 Past Meetings</h2>
              {past.map((m, i) => (
                <MeetingCard key={m.id} meeting={m} delay={i * 0.05} isPast />
              ))}
            </div>
          )}
          {meetings.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400">
              <span className="text-4xl block mb-3">🗓️</span>
              <p>No meetings scheduled. Create one above.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MeetingCard({ meeting, delay, isPast }: { meeting: Meeting; delay: number; isPast?: boolean }) {
  const joinUrl = `https://meet.jit.si/${meeting.jitsi_room}`
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={`bg-white rounded-2xl p-5 shadow-sm border ${isPast ? 'border-slate-100 opacity-70' : 'border-blue-100'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-navy">{meeting.title}</h3>
          {meeting.description && <p className="text-xs text-slate-400 mt-1 truncate">{meeting.description}</p>}
          <div className="flex gap-4 mt-2 text-xs text-slate-400 flex-wrap">
            {meeting.scheduled_at && <span>📅 {new Date(meeting.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
            <span>⏱️ {meeting.duration_min} min</span>
            <span className="font-mono text-blue-400">🔗 {meeting.jitsi_room}</span>
          </div>
        </div>
        {!isPast && (
          <a href={joinUrl} target="_blank" rel="noreferrer" className="ml-4 flex-shrink-0 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer">
            📹 Join Now
          </a>
        )}
      </div>
    </motion.div>
  )
}
