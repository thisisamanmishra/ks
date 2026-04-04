'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'

interface Ambassador { id: number; fullname: string; email: string; phone: string; college: string; leads: number; revenue: number; commission: number; referral_code: string; target: number; status: string }
interface TrainingMaterial { id: number; title: string; filename: string; uploaded_at: string; url: string }
interface CampusEvent { id: number; title: string; college: string | null; event_date: string | null; registrations: number; status: string }

const TABS = ['🎓 Roster', '📊 Performance', '📅 Events', '📖 Training', '💰 Commission'] as const
type Tab = typeof TABS[number]

export default function CampusSaarthiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('🎓 Roster')
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([])
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ fullname: '', email: '', phone: '', college: '', target: '50' })
  const [saving, setSaving] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', college: '', date: '', registrations: '' })
  const [eventSaving, setEventSaving] = useState(false)
  const [chatUser, setChatUser] = useState<Ambassador | null>(null)
  const [chatMsgs, setChatMsgs] = useState<{sender: string, text: string}[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [materials, setMaterials] = useState<TrainingMaterial[]>([
    { id: 1, title: 'Ambassador Onboarding Guide', filename: 'onboarding.pdf', uploaded_at: new Date().toISOString(), url: '#' }
  ])
  const fileRef = useRef<HTMLInputElement>(null)

  const loadAmbassadors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pillars/campus/ambassadors')
      const d = res.ok ? await res.json() : { ambassadors: [] }
      setAmbassadors(d.ambassadors || [])
    } catch {} finally { setLoading(false) }
  }, [])

  const loadEvents = useCallback(async () => {
    setEventsLoading(true)
    try {
      const res = await fetch('/api/admin/campus/events')
      const d = res.ok ? await res.json() : { events: [] }
      setEvents(d.events || [])
    } catch {} finally { setEventsLoading(false) }
  }, [])

  useEffect(() => { loadAmbassadors(); loadEvents() }, [loadAmbassadors, loadEvents])

  const createAmbassador = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/admin/pillars/campus/ambassadors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, target: Number(form.target), referral_code: `CAMPUS${Math.random().toString(36).substr(2, 6).toUpperCase()}` })
      })
      if (res.ok) { setShowNew(false); setForm({ fullname: '', email: '', phone: '', college: '', target: '50' }); loadAmbassadors() }
    } catch {} finally { setSaving(false) }
  }

  const saveEvent = async () => {
    if (!newEvent.title) return
    setEventSaving(true)
    try {
      const res = await fetch('/api/admin/campus/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newEvent.title, college: newEvent.college, date: newEvent.date, registrations: Number(newEvent.registrations) || 0 })
      })
      if (res.ok) { setNewEvent({ title: '', college: '', date: '', registrations: '' }); loadEvents() }
    } catch {} finally { setEventSaving(false) }
  }

  const updateEventStatus = async (id: number, status: string) => {
    await fetch('/api/admin/campus/events', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
    loadEvents()
  }

  const totalLeads = ambassadors.reduce((a, b) => a + b.leads, 0)
  const totalRevenue = ambassadors.reduce((a, b) => a + b.revenue, 0)
  const totalCommission = ambassadors.reduce((a, b) => a + b.commission, 0)

  const collegeMapping = useMemo(() => {
    const map = new Map<string, number>()
    ambassadors.forEach(a => map.set(a.college || 'Unknown', (map.get(a.college || 'Unknown') || 0) + 1))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [ambassadors])

  const chartData = useMemo(() => ambassadors.map(a => ({
    name: a.fullname.split(' ')[0], Target: a.target, Achieved: a.leads
  })), [ambassadors])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMaterials(p => [{ id: Date.now(), title: file.name, filename: file.name, uploaded_at: new Date().toISOString(), url: '#' }, ...p])
    if (fileRef.current) fileRef.current.value = ''
  }

  const sendChat = () => {
    if (!newMsg.trim() || !chatUser) return
    setChatMsgs(p => [...p, { sender: 'me', text: newMsg }])
    setNewMsg('')
    setTimeout(() => {
      setChatMsgs(p => [...p, { sender: 'them', text: `Thanks for the message! I'm currently working on my target.` }])
    }, 1000)
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-navy font-heading">🎓 Campus Saarthi</h1>
        <p className="text-slate-500 text-sm">Ambassador network · Campus events · Leads · Training · Commission</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ icon: '👤', label: 'Ambassadors', value: String(ambassadors.length) }, { icon: '🎯', label: 'Total Leads', value: String(totalLeads) }, { icon: '💰', label: 'Revenue', value: `₹${(totalRevenue / 1000).toFixed(0)}K` }, { icon: '💵', label: 'Commission Paid', value: `₹${totalCommission.toLocaleString('en-IN')}` }].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"><span className="text-2xl block mb-2">{s.icon}</span><p className="text-2xl font-extrabold text-navy">{s.value}</p><p className="text-xs text-slate-400">{s.label}</p></div>
        ))}
      </div>
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-sm font-bold cursor-pointer border-b-2 -mb-px whitespace-nowrap transition-all ${activeTab === t ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>{t}</button>)}
      </div>

      {activeTab === '🎓 Roster' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{ambassadors.length} ambassadors enrolled</p>
            <button onClick={() => setShowNew(v => !v)} className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer" style={{ background: '#3B82F6' }}>+ Add Ambassador</button>
          </div>
          {showNew && (
            <form onSubmit={createAmbassador} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <input required value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))} placeholder="Full name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <input value={form.college} onChange={e => setForm(p => ({ ...p, college: e.target.value }))} placeholder="College / University" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <input type="number" value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))} placeholder="Monthly lead target" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60" style={{ background: '#1B3A6B' }}>{saving ? '⏳' : '✅ Enroll'}</button>
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
              </div>
            </form>
          )}
          {loading ? <div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div> :
            ambassadors.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🎓</span><p>No ambassadors yet. Add your first campus ambassador.</p></div> :
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ambassadors.map((a, i) => {
                  const pct = a.target > 0 ? Math.min((a.leads / a.target) * 100, 100) : 0
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-600">{a.fullname.charAt(0)}</div>
                        <div className="min-w-0"><p className="font-bold text-navy truncate">{a.fullname}</p><p className="text-[10px] text-slate-400 truncate">🏛️ {a.college || 'College not set'}</p></div>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs"><span className="text-slate-400">Target Progress</span><span className="font-bold text-navy">{a.leads}/{a.target} leads</span></div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-xl bg-green-50 text-center"><p className="text-sm font-bold text-green-600">₹{a.revenue.toLocaleString('en-IN')}</p><p className="text-[10px] text-slate-400">Revenue</p></div>
                        <div className="p-2 rounded-xl bg-purple-50 text-center"><p className="text-sm font-bold text-purple-600">₹{a.commission.toLocaleString('en-IN')}</p><p className="text-[10px] text-slate-400">Commission</p></div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <code className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded" title="Referral Code Issuance">{a.referral_code}</code>
                        <div className="flex gap-2">
                          <button onClick={() => { setChatUser(a); setChatMsgs([]) }} className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer flex items-center">💬 Chat</button>
                          {a.email && <a href={`mailto:${a.email}`} className="text-xs px-2 py-1 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 cursor-pointer">✉️</a>}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>}
        </div>
      )}

      {activeTab === '📊 Performance' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-5">📈 Monthly Target vs Achievement</h3>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#F8FAFC' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="Target" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="Achieved" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-slate-400">No data available</div>}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
              <h3 className="font-bold text-navy font-heading mb-4">🏛️ Ambassador College Mapping</h3>
              <div className="flex-1 overflow-y-auto space-y-2">
                {collegeMapping.map(([college, count]) => (
                  <div key={college} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-navy text-sm">{college}</span>
                    <span className="font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full text-xs">{count} Ambassador{count > 1 ? 's' : ''}</span>
                  </div>
                ))}
                {collegeMapping.length === 0 && <p className="text-slate-400 text-sm text-center py-5">No colleges mapped</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-5">🏆 Ambassador Leaderboard</h3>
          {ambassadors.length === 0 ? <p className="text-slate-400 text-center py-8">No ambassadors yet</p> :
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100">{['#', 'Ambassador', 'College', 'Leads', 'Revenue', 'Target %'].map(h => <th key={h} className="pb-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
                <tbody>
                  {[...ambassadors].sort((a, b) => b.leads - a.leads).map((a, i) => (
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="py-3 font-bold text-slate-300">#{i + 1}</td>
                      <td className="py-3 font-semibold text-navy">{a.fullname} {i === 0 && '🏆'}</td>
                      <td className="py-3 text-slate-400 text-xs">{a.college || '—'}</td>
                      <td className="py-3 font-bold text-navy">{a.leads}</td>
                      <td className="py-3 text-green-600 font-bold">₹{a.revenue.toLocaleString('en-IN')}</td>
                      <td className="py-3"><span className={`font-bold ${(a.leads / Math.max(a.target, 1)) >= 1 ? 'text-green-600' : (a.leads / Math.max(a.target, 1)) >= 0.7 ? 'text-amber-500' : 'text-red-500'}`}>{a.target > 0 ? `${((a.leads / a.target) * 100).toFixed(0)}%` : '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
        </div>
        </div>
      )}

      {activeTab === '📅 Events' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Create Campus Event</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Event title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newEvent.college} onChange={e => setNewEvent(p => ({ ...p, college: e.target.value }))} placeholder="College" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={saveEvent} disabled={eventSaving} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer disabled:opacity-60">{eventSaving ? '⏳' : '+ Create Event'}</button>
          </div>
          {eventsLoading ? <div className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            events.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📅</span><p>No campus events yet</p></div> :
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((ev, i) => (
                  <motion.div key={ev.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between">
                      <div><h3 className="font-bold text-navy">{ev.title}</h3>
                        {ev.college && <p className="text-xs text-slate-400 mt-1">🏛️ {ev.college}</p>}
                        {ev.event_date && <p className="text-xs text-slate-400">📅 {new Date(ev.event_date).toLocaleDateString('en-IN')}</p>}
                      </div>
                      <div className="text-right">
                        <select value={ev.status} onChange={e => updateEventStatus(ev.id, e.target.value)} className="text-[10px] px-2 py-1 mb-2 rounded-lg border border-slate-200 bg-white cursor-pointer block ml-auto">
                          {['upcoming', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {ev.registrations > 0 ? (
                          <span className="text-xs text-white bg-blue-600 px-2.5 py-1 rounded-lg shadow-sm font-bold flex items-center gap-1 cursor-pointer">
                            <span>👥</span> {ev.registrations} Registrations
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">0 Registrations</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>}
        </div>
      )}

      {activeTab === '📖 Training' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-navy">Upload Training Material</h3>
              <p className="text-xs text-slate-400">Upload guides, scripts, and documents for your campus ambassadors.</p>
            </div>
            <input type="file" ref={fileRef} onChange={handleUpload} className="hidden" accept=".pdf,.doc,.docx,.ppt,.mp4" />
            <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-navy text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-navy/90 shadow">
              + Select File
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100">{['File Name', 'Uploaded Date', 'Action'].map(h => <th key={h} className="p-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id} className="border-b border-slate-50">
                    <td className="p-3 font-semibold text-navy flex items-center gap-2">📄 {m.title}</td>
                    <td className="p-3 text-slate-500 text-xs">{new Date(m.uploaded_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-3"><button className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer">Download / View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === '💰 Commission' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-navy font-heading mb-5">💵 Commission & Incentive Tracker</h3>
          {ambassadors.length === 0 ? <p className="text-slate-400 text-center py-8">No ambassadors yet</p> :
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100">{['Ambassador', 'College', 'Leads', 'Revenue', 'Commission (5%)', 'Referral Code'].map(h => <th key={h} className="pb-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
                <tbody>
                  {ambassadors.map(a => (
                    <tr key={a.id} className="border-b border-slate-50">
                      <td className="py-3 font-semibold text-navy">{a.fullname}</td>
                      <td className="py-3 text-slate-400 text-xs">{a.college || '—'}</td>
                      <td className="py-3 text-right text-navy">{a.leads}</td>
                      <td className="py-3 text-right text-green-600 font-bold">₹{a.revenue.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right font-bold text-purple-600">₹{a.commission.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right"><code className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{a.referral_code}</code></td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 font-bold">
                    <td className="py-3 text-navy" colSpan={2}>TOTAL</td>
                    <td className="py-3 text-right text-navy">{totalLeads}</td>
                    <td className="py-3 text-right text-green-600">₹{totalRevenue.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right text-purple-600">₹{totalCommission.toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>}
        </div>
      )}

      {/* Direct Chat Overlay */}
      <AnimatePresence>
        {chatUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '500px' }}>
              <div className="bg-navy text-white px-5 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Direct Message</h3>
                  <p className="text-xs text-white/70">Chatting with {chatUser.fullname}</p>
                </div>
                <button onClick={() => setChatUser(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
                <div className="text-center text-xs text-slate-400 my-4">Connection to {chatUser.fullname} established.</div>
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 ${m.sender === 'me' ? 'bg-blue-600 text-white rounded-l-2xl rounded-tr-2xl' : 'bg-white border border-slate-200 text-slate-700 rounded-r-2xl rounded-tl-2xl shadow-sm'} text-sm`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Type a message..." className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy" />
                <button onClick={sendChat} disabled={!newMsg.trim()} className="px-5 py-2 rounded-xl bg-navy text-white font-bold text-sm disabled:opacity-50 hover:bg-navy/90">Send</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
