'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'

/* ─── Types ─── */
interface Ambassador {
  id: number; fullname: string; email: string; phone: string; college: string
  city: string; leads: number; revenue: number; commission: number
  referral_code: string; target: number; status: string; notes: string
}
interface TrainingMaterial {
  id: number; title: string; description: string; file_url: string
  file_type: string; created_at: string
}
interface CampusEvent {
  id: number; title: string; college: string | null; event_date: string | null
  registrations: number; status: string
}
interface ReferralUse {
  id: number; ambassador_id: number; referral_code: string; lead_name: string
  lead_email: string; revenue: number; status: string; created_at: string
  ambassador?: { fullname: string; college: string }
}

const TABS = ['🎓 Roster', '📊 Performance', '📅 Events', '📖 Training', '💰 Commission', '🔗 Referrals'] as const
type Tab = typeof TABS[number]

const fileIcon = (t: string) => ({ pdf: '📄', doc: '📝', ppt: '📊', xls: '📈', video: '🎬', image: '🖼️' }[t] ?? '📁')

/* ─── Main Component ─── */
export default function CampusSaarthiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('🎓 Roster')
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([])
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [materials, setMaterials] = useState<TrainingMaterial[]>([])
  const [referrals, setReferrals] = useState<ReferralUse[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [materialsLoading, setMaterialsLoading] = useState(true)
  const [referralsLoading, setReferralsLoading] = useState(true)

  /* Add Ambassador */
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ fullname: '', email: '', phone: '', college: '', city: '', target: '50', notes: '' })
  const [saving, setSaving] = useState(false)

  /* Edit Ambassador */
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Ambassador>>({})

  /* Events */
  const [newEvent, setNewEvent] = useState({ title: '', college: '', date: '', registrations: '' })
  const [eventSaving, setEventSaving] = useState(false)

  /* Chat */
  const [chatUser, setChatUser] = useState<Ambassador | null>(null)
  const [chatMsgs, setChatMsgs] = useState<{ sender: string; text: string }[]>([])
  const [newMsg, setNewMsg] = useState('')

  /* Training Upload */
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')

  /* Add Referral */
  const [showNewRef, setShowNewRef] = useState(false)
  const [refForm, setRefForm] = useState({ ambassador_id: '', lead_name: '', lead_email: '', lead_phone: '', revenue: '' })
  const [refSaving, setRefSaving] = useState(false)

  /* ─── Load Data ─── */
  const loadAmbassadors = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/pillars/campus/ambassadors')
      const d = r.ok ? await r.json() : {}
      setAmbassadors(d.ambassadors || [])
    } catch { setAmbassadors([]) } finally { setLoading(false) }
  }, [])

  const loadEvents = useCallback(async () => {
    setEventsLoading(true)
    try {
      const r = await fetch('/api/admin/campus/events')
      const d = r.ok ? await r.json() : {}
      setEvents(d.events || [])
    } catch { setEvents([]) } finally { setEventsLoading(false) }
  }, [])

  const loadMaterials = useCallback(async () => {
    setMaterialsLoading(true)
    try {
      const r = await fetch('/api/admin/campus/training')
      const d = r.ok ? await r.json() : {}
      setMaterials(d.materials || [])
    } catch { setMaterials([]) } finally { setMaterialsLoading(false) }
  }, [])

  const loadReferrals = useCallback(async () => {
    setReferralsLoading(true)
    try {
      const r = await fetch('/api/admin/campus/referrals')
      const d = r.ok ? await r.json() : {}
      setReferrals(d.referrals || [])
    } catch { setReferrals([]) } finally { setReferralsLoading(false) }
  }, [])

  useEffect(() => { loadAmbassadors(); loadEvents(); loadMaterials(); loadReferrals() }, [loadAmbassadors, loadEvents, loadMaterials, loadReferrals])

  /* ─── Actions ─── */
  const createAmbassador = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const code = `CAMPUS${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const r = await fetch('/api/admin/pillars/campus/ambassadors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, target: Number(form.target), referral_code: code })
      })
      if (r.ok) { setShowNew(false); setForm({ fullname: '', email: '', phone: '', college: '', city: '', target: '50', notes: '' }); loadAmbassadors() }
      else { const d = await r.json(); alert(d.error || 'Failed') }
    } catch { alert('Network error') } finally { setSaving(false) }
  }

  const updateAmbassador = async (id: number) => {
    try {
      const r = await fetch('/api/admin/pillars/campus/ambassadors', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm })
      })
      if (r.ok) { setEditId(null); setEditForm({}); loadAmbassadors() }
      else { const d = await r.json(); alert(d.error || 'Failed') }
    } catch { alert('Network error') }
  }

  const deleteAmbassador = async (id: number, name: string) => {
    if (!confirm(`Delete ambassador "${name}"? This cannot be undone.`)) return
    try {
      const r = await fetch(`/api/admin/pillars/campus/ambassadors?id=${id}`, { method: 'DELETE' })
      if (r.ok) loadAmbassadors()
      else { const d = await r.json(); alert(d.error || 'Failed') }
    } catch { alert('Network error') }
  }

  const saveEvent = async () => {
    if (!newEvent.title) return
    setEventSaving(true)
    try {
      const r = await fetch('/api/admin/campus/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newEvent.title, college: newEvent.college, date: newEvent.date, registrations: Number(newEvent.registrations) || 0 })
      })
      if (r.ok) { setNewEvent({ title: '', college: '', date: '', registrations: '' }); loadEvents() }
    } catch { } finally { setEventSaving(false) }
  }

  const updateEventStatus = async (id: number, status: string) => {
    await fetch('/api/admin/campus/events', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
    loadEvents()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!uploadTitle.trim()) { alert('Please enter a title first'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await fetch('/api/admin/campus/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) { const d = await uploadRes.json(); alert(d.error || 'Upload failed'); return }
      const { url, file_type } = await uploadRes.json()
      const saveRes = await fetch('/api/admin/campus/training', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: uploadTitle, description: uploadDesc, file_url: url, file_type })
      })
      if (saveRes.ok) { setUploadTitle(''); setUploadDesc(''); loadMaterials() }
      else { const d = await saveRes.json(); alert(d.error || 'Save failed') }
    } catch { alert('Upload failed') } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const deleteMaterial = async (id: number) => {
    if (!confirm('Delete this material?')) return
    await fetch(`/api/admin/campus/training?id=${id}`, { method: 'DELETE' })
    loadMaterials()
  }

  const sendChat = () => {
    if (!newMsg.trim() || !chatUser) return
    setChatMsgs(p => [...p, { sender: 'me', text: newMsg }])
    setNewMsg('')
    setTimeout(() => setChatMsgs(p => [...p, { sender: 'them', text: `Got your message! I'll update you on my progress soon.` }]), 1000)
  }

  const createReferral = async (e: React.FormEvent) => {
    e.preventDefault(); setRefSaving(true)
    try {
      const amb = ambassadors.find(a => a.id === Number(refForm.ambassador_id))
      if (!amb) { alert('Select an ambassador'); return }
      const r = await fetch('/api/admin/campus/referrals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambassador_id: Number(refForm.ambassador_id),
          referral_code: amb.referral_code,
          lead_name: refForm.lead_name, lead_email: refForm.lead_email,
          lead_phone: refForm.lead_phone, revenue: Number(refForm.revenue) || 0
        })
      })
      if (r.ok) { setShowNewRef(false); setRefForm({ ambassador_id: '', lead_name: '', lead_email: '', lead_phone: '', revenue: '' }); loadReferrals(); loadAmbassadors() }
      else { const d = await r.json(); alert(d.error || 'Failed') }
    } catch { alert('Network error') } finally { setRefSaving(false) }
  }

  /* ─── Computed ─── */
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

  /* ─── Render ─── */
  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy font-heading">🎓 Campus Saarthi</h1>
        <p className="text-slate-500 text-sm">Ambassador network · Campus events · Leads · Training · Commission · Referrals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: '👤', label: 'Ambassadors', value: String(ambassadors.length) },
          { icon: '🎯', label: 'Total Leads', value: String(totalLeads) },
          { icon: '💰', label: 'Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}K` },
          { icon: '💵', label: 'Commission Paid', value: `₹${totalCommission.toLocaleString('en-IN')}` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <span className="text-2xl block mb-2">{s.icon}</span>
            <p className="text-2xl font-extrabold text-navy">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-bold cursor-pointer border-b-2 -mb-px whitespace-nowrap transition-all ${activeTab === t ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ═══ TAB: ROSTER ═══ */}
      {activeTab === '🎓 Roster' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{ambassadors.length} ambassadors enrolled</p>
            <button onClick={() => setShowNew(v => !v)}
              className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer bg-blue-600 hover:bg-blue-700">
              + Add Ambassador
            </button>
          </div>

          {/* Add Form */}
          {showNew && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-bold text-navy text-sm">New Ambassador</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <input required value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))} placeholder="Full name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                <input value={form.college} onChange={e => setForm(p => ({ ...p, college: e.target.value }))} placeholder="College / University" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="City" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                <input type="number" value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))} placeholder="Monthly lead target" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" rows={2} className="col-span-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400 resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={createAmbassador} disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer bg-navy disabled:opacity-60">
                  {saving ? '⏳ Enrolling…' : '✅ Enroll Ambassador'}
                </button>
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
              </div>
            </div>
          )}

          {/* Ambassador Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
            </div>
          ) : ambassadors.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400">
              <span className="text-4xl block mb-3">🎓</span>
              <p>No ambassadors yet. Add your first campus ambassador.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ambassadors.map((a, i) => {
                const pct = a.target > 0 ? Math.min((a.leads / a.target) * 100, 100) : 0
                const isEditing = editId === a.id
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-lg shrink-0">
                          {a.fullname.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-navy truncate text-sm">{a.fullname}</p>
                          <p className="text-[10px] text-slate-400 truncate">🏛️ {a.college || 'College not set'}</p>
                          {a.city && <p className="text-[10px] text-slate-400">📍 {a.city}</p>}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${a.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        {a.status}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 mb-3">
                        <input type="number" value={editForm.leads ?? a.leads} onChange={e => setEditForm(p => ({ ...p, leads: Number(e.target.value) }))} placeholder="Leads" className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none" />
                        <input type="number" value={editForm.revenue ?? a.revenue} onChange={e => setEditForm(p => ({ ...p, revenue: Number(e.target.value) }))} placeholder="Revenue ₹" className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none" />
                        <input type="number" value={editForm.target ?? a.target} onChange={e => setEditForm(p => ({ ...p, target: Number(e.target.value) }))} placeholder="Monthly Target" className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none" />
                        <select value={editForm.status ?? a.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => updateAmbassador(a.id)} className="flex-1 py-1.5 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer">Save</button>
                          <button onClick={() => { setEditId(null); setEditForm({}) }} className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs cursor-pointer">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5 mb-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Target Progress</span>
                            <span className="font-bold text-navy">{a.leads}/{a.target} leads</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="p-2 rounded-xl bg-green-50 text-center">
                            <p className="text-sm font-bold text-green-600">₹{a.revenue.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-slate-400">Revenue</p>
                          </div>
                          <div className="p-2 rounded-xl bg-purple-50 text-center">
                            <p className="text-sm font-bold text-purple-600">₹{a.commission.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-slate-400">Commission</p>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between">
                      <code className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-100"
                        title="Referral Code" onClick={() => navigator.clipboard.writeText(a.referral_code)}>
                        {a.referral_code}
                      </code>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setChatUser(a); setChatMsgs([]) }}
                          className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer">💬</button>
                        <button onClick={() => { setEditId(a.id); setEditForm({}) }}
                          className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 cursor-pointer">✏️</button>
                        <button onClick={() => deleteAmbassador(a.id, a.fullname)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 cursor-pointer">🗑️</button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: PERFORMANCE ═══ */}
      {activeTab === '📊 Performance' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-5">📈 Monthly Target vs Achievement</h3>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #F1F5F9' }} cursor={{ fill: '#F8FAFC' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="Target" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="Achieved" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-slate-400">No ambassador data</div>}
              </div>
            </div>

            {/* College Mapping */}
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

          {/* Leaderboard */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-5">🏆 Ambassador Leaderboard</h3>
            {ambassadors.length === 0 ? <p className="text-slate-400 text-center py-8">No ambassadors yet</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['#', 'Ambassador', 'College', 'Leads', 'Revenue', 'Commission', 'Achievement %'].map(h => (
                        <th key={h} className="pb-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...ambassadors].sort((a, b) => b.leads - a.leads).map((a, i) => (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="py-3 font-bold text-slate-300">#{i + 1}</td>
                        <td className="py-3 font-semibold text-navy">{a.fullname} {i === 0 ? '🏆' : ''}</td>
                        <td className="py-3 text-slate-400 text-xs">{a.college || '—'}</td>
                        <td className="py-3 font-bold text-navy">{a.leads}</td>
                        <td className="py-3 text-green-600 font-bold">₹{a.revenue.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-purple-600 font-bold">₹{a.commission.toLocaleString('en-IN')}</td>
                        <td className="py-3">
                          <span className={`font-bold ${(a.leads / Math.max(a.target, 1)) >= 1 ? 'text-green-600' : (a.leads / Math.max(a.target, 1)) >= 0.7 ? 'text-amber-500' : 'text-red-500'}`}>
                            {a.target > 0 ? `${((a.leads / a.target) * 100).toFixed(0)}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: EVENTS ═══ */}
      {activeTab === '📅 Events' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Create Campus Event</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Event title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newEvent.college} onChange={e => setNewEvent(p => ({ ...p, college: e.target.value }))} placeholder="College" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={newEvent.registrations} onChange={e => setNewEvent(p => ({ ...p, registrations: e.target.value }))} placeholder="Expected registrations" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={saveEvent} disabled={eventSaving || !newEvent.title} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer disabled:opacity-60">
              {eventSaving ? '⏳ Creating…' : '+ Create Event'}
            </button>
          </div>

          {eventsLoading ? <div className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            events.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400">
                <span className="text-4xl block mb-3">📅</span><p>No campus events yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((ev, i) => (
                  <motion.div key={ev.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-navy">{ev.title}</h3>
                        {ev.college && <p className="text-xs text-slate-400 mt-1">🏛️ {ev.college}</p>}
                        {ev.event_date && <p className="text-xs text-slate-400">📅 {new Date(ev.event_date).toLocaleDateString('en-IN')}</p>}
                      </div>
                      <div className="text-right space-y-2">
                        <select value={ev.status} onChange={e => updateEventStatus(ev.id, e.target.value)}
                          className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer block ml-auto">
                          {['upcoming', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${ev.registrations > 0 ? 'text-white bg-blue-600' : 'text-slate-400 bg-slate-50'}`}>
                          👥 {ev.registrations} Registrations
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* ═══ TAB: TRAINING ═══ */}
      {activeTab === '📖 Training' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-3">
            <h3 className="font-bold text-navy">Upload Training Material</h3>
            <p className="text-xs text-slate-400">Upload PDFs, presentations, documents, or videos for campus ambassadors (max 50MB).</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Material title *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Description (optional)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <div className="flex items-center gap-3">
              <input type="file" ref={fileRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp4,.webm,.jpg,.jpeg,.png" />
              <button onClick={() => { if (!uploadTitle.trim()) { alert('Enter a title first'); return }; fileRef.current?.click() }}
                disabled={uploading} className="px-4 py-2 bg-navy text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-navy/90 disabled:opacity-60 flex items-center gap-2">
                {uploading ? <><span className="animate-spin">⏳</span> Uploading…</> : '+ Select & Upload File'}
              </button>
              {uploading && <p className="text-xs text-slate-400 animate-pulse">Uploading to storage…</p>}
            </div>
          </div>

          {materialsLoading ? <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" /> : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['File', 'Type', 'Description', 'Uploaded', 'Actions'].map(h => (
                      <th key={h} className="p-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">No training materials yet. Upload your first file.</td></tr>
                  ) : materials.map(m => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-navy flex items-center gap-2">
                        {fileIcon(m.file_type)} {m.title}
                      </td>
                      <td className="p-3"><span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{m.file_type}</span></td>
                      <td className="p-3 text-slate-500 text-xs max-w-xs truncate">{m.description || '—'}</td>
                      <td className="p-3 text-slate-500 text-xs">{new Date(m.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 flex gap-2">
                        {m.file_url ? (
                          <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer">📥 Download</a>
                        ) : <span className="text-slate-400 text-xs">No file</span>}
                        <button onClick={() => deleteMaterial(m.id)}
                          className="text-red-400 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg text-xs cursor-pointer">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: COMMISSION ═══ */}
      {activeTab === '💰 Commission' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-navy font-heading mb-5">💵 Commission &amp; Incentive Tracker</h3>
          <p className="text-xs text-slate-400 mb-4">Commission is auto-calculated at 5% of revenue. Update leads/revenue from the Roster tab.</p>
          {ambassadors.length === 0 ? <p className="text-slate-400 text-center py-8">No ambassadors yet</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Ambassador', 'College', 'Status', 'Leads', 'Revenue', 'Commission (5%)', 'Referral Code', 'Achievement'].map(h => (
                      <th key={h} className="pb-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ambassadors.map(a => (
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="py-3 font-semibold text-navy">{a.fullname}</td>
                      <td className="py-3 text-slate-400 text-xs">{a.college || '—'}</td>
                      <td className="py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${a.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 text-navy text-right">{a.leads}</td>
                      <td className="py-3 text-right text-green-600 font-bold">₹{a.revenue.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right font-bold text-purple-600">₹{a.commission.toLocaleString('en-IN')}</td>
                      <td className="py-3">
                        <code className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
                          title="Click to copy" onClick={() => navigator.clipboard.writeText(a.referral_code)}>{a.referral_code}</code>
                      </td>
                      <td className="py-3">
                        <span className={`font-bold text-sm ${(a.leads / Math.max(a.target, 1)) >= 1 ? 'text-green-600' : (a.leads / Math.max(a.target, 1)) >= 0.7 ? 'text-amber-500' : 'text-red-500'}`}>
                          {a.target > 0 ? `${((a.leads / a.target) * 100).toFixed(0)}%` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 font-bold bg-slate-50">
                    <td className="py-3 text-navy" colSpan={3}>TOTAL</td>
                    <td className="py-3 text-right text-navy">{totalLeads}</td>
                    <td className="py-3 text-right text-green-600">₹{totalRevenue.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right text-purple-600">₹{totalCommission.toLocaleString('en-IN')}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: REFERRALS ═══ */}
      {activeTab === '🔗 Referrals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-navy">Referral Code Issuance &amp; Tracking</h3>
              <p className="text-sm text-slate-500">{referrals.length} referrals recorded</p>
            </div>
            <button onClick={() => setShowNewRef(v => !v)}
              className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer bg-blue-600 hover:bg-blue-700">
              + Log Referral
            </button>
          </div>

          {/* Referral Summary Cards */}
          {ambassadors.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ambassadors.slice(0, 4).map(a => (
                <div key={a.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <p className="font-bold text-navy text-sm truncate">{a.fullname}</p>
                  <code className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded block mt-1 mb-2">{a.referral_code}</code>
                  <p className="text-xs text-slate-400">{a.leads} referrals · ₹{a.revenue.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Referral Form */}
          {showNewRef && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-bold text-navy text-sm">Log New Referral</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <select required value={refForm.ambassador_id} onChange={e => setRefForm(p => ({ ...p, ambassador_id: e.target.value }))}
                  className="col-span-2 md:col-span-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                  <option value="">Select Ambassador *</option>
                  {ambassadors.map(a => <option key={a.id} value={a.id}>{a.fullname} ({a.referral_code})</option>)}
                </select>
                <input value={refForm.lead_name} onChange={e => setRefForm(p => ({ ...p, lead_name: e.target.value }))} placeholder="Lead name" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <input value={refForm.lead_email} onChange={e => setRefForm(p => ({ ...p, lead_email: e.target.value }))} placeholder="Lead email" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <input value={refForm.lead_phone} onChange={e => setRefForm(p => ({ ...p, lead_phone: e.target.value }))} placeholder="Lead phone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <input type="number" value={refForm.revenue} onChange={e => setRefForm(p => ({ ...p, revenue: e.target.value }))} placeholder="Revenue ₹ (if converted)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={createReferral} disabled={refSaving} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer bg-navy disabled:opacity-60">
                  {refSaving ? '⏳' : '✅ Log Referral'}
                </button>
                <button type="button" onClick={() => setShowNewRef(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
              </div>
            </div>
          )}

          {/* Referrals Table */}
          {referralsLoading ? <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" /> : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Ambassador', 'Code', 'Lead Name', 'Lead Email', 'Revenue', 'Status', 'Date'].map(h => (
                      <th key={h} className="p-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrals.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-400">No referrals logged yet. Click &quot;Log Referral&quot; to add one.</td></tr>
                  ) : referrals.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-navy text-xs">{r.ambassador?.fullname || '—'}</td>
                      <td className="p-3"><code className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{r.referral_code}</code></td>
                      <td className="p-3 text-slate-600 text-xs">{r.lead_name || '—'}</td>
                      <td className="p-3 text-slate-400 text-xs">{r.lead_email || '—'}</td>
                      <td className="p-3 text-green-600 font-bold">₹{(r.revenue || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.status === 'converted' ? 'bg-green-100 text-green-600' : r.status === 'lost' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ DIRECT CHAT OVERLAY ═══ */}
      <AnimatePresence>
        {chatUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '520px' }}>
              <div className="bg-navy text-white px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">
                  {chatUser.fullname.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{chatUser.fullname}</h3>
                  <p className="text-xs text-white/60 truncate">🏛️ {chatUser.college || 'Campus Ambassador'} · {chatUser.referral_code}</p>
                </div>
                <button onClick={() => setChatUser(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
                <div className="text-center text-xs text-slate-400 my-2">Direct message with {chatUser.fullname}</div>
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 text-sm ${m.sender === 'me' ? 'bg-blue-600 text-white rounded-l-2xl rounded-tr-2xl' : 'bg-white border border-slate-200 text-slate-700 rounded-r-2xl rounded-tl-2xl shadow-sm'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {chatMsgs.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-8">
                    <p className="text-2xl mb-2">💬</p>
                    <p>Start a conversation with {chatUser.fullname}</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder={`Message ${chatUser.fullname}…`}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy" />
                <button onClick={sendChat} disabled={!newMsg.trim()}
                  className="px-5 py-2 rounded-xl bg-navy text-white font-bold text-sm disabled:opacity-50 hover:bg-navy/90 cursor-pointer">
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
