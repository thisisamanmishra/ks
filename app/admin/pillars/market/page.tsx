'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DirectChatPanel from '@/components/admin/DirectChatPanel'

// ── Types ──────────────────────────────────────────────────────────────────────
interface FieldAgent {
  id: number; fullname: string; phone: string | null; email: string | null
  territory: string | null; city: string | null; daily_target: number
  total_leads: number; total_revenue: number; status: string; created_at: string
}
interface FieldVisit {
  id: number; agent_id: number; agent_name: string | null; area: string; city: string | null
  contact_name: string | null; contact_phone: string | null; notes: string | null
  outcome: string; visit_date: string; created_at: string
}
interface FieldStall {
  id: number; agent_id: number; agent_name: string | null; event_name: string
  location: string | null; city: string | null; stall_date: string
  footfall: number; leads_collected: number; notes: string | null
}
interface WalkInLead {
  id: number; agent_id: number | null; agent_name: string | null; name: string
  phone: string; email: string | null; service_interest: string | null
  city: string | null; notes: string | null; status: string; created_at: string
}
interface Stats {
  totalAgents: number; activeAgents: number; totalRevenue: number
  totalLeads: number; totalVisits: number; stallLeads: number; walkInLeads: number
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'agents',   label: '🧑‍💼 Field Agents' },
  { key: 'walkin',   label: '🚶 Walk-in Leads' },
  { key: 'visits',   label: '📍 Visit Reports' },
  { key: 'stalls',   label: '🎪 Stalls & Events' },
  { key: 'coverage', label: '📊 Coverage Map' },
  { key: 'chat',     label: '💬 Team Chat' },
] as const
type Tab = typeof TABS[number]['key']

const OUTCOME_COLORS: Record<string, { bg: string; text: string }> = {
  visited:    { bg: '#EFF6FF', text: '#3B82F6' },
  interested: { bg: '#ECFDF5', text: '#10B981' },
  not_home:   { bg: '#FEF3C7', text: '#D97706' },
  declined:   { bg: '#FEF2F2', text: '#EF4444' },
}

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
      <span className="text-5xl block mb-3">{icon}</span>
      <p className="text-slate-400 text-sm">{label}</p>
    </div>
  )
}

function KPI({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: `${color}15` }}>{icon}</div>
      <p className="text-2xl font-extrabold text-navy font-heading">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

export default function MarketSaarthiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('agents')
  const [agents, setAgents] = useState<FieldAgent[]>([])
  const [visits, setVisits] = useState<FieldVisit[]>([])
  const [stalls, setStalls] = useState<FieldStall[]>([])
  const [walkins, setWalkins] = useState<WalkInLead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [coverage, setCoverage] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState(0)
  const [showChat, setShowChat] = useState(false)

  // Agent form
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [agentForm, setAgentForm] = useState({ fullname: '', phone: '', email: '', territory: '', city: '', daily_target: '5' })
  const [savingAgent, setSavingAgent] = useState(false)

  // Visit form
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [visitForm, setVisitForm] = useState({ agent_id: '', agent_name: '', area: '', city: '', contact_name: '', contact_phone: '', outcome: 'visited', notes: '', visit_date: new Date().toISOString().split('T')[0] })
  const [savingVisit, setSavingVisit] = useState(false)

  // Stall form
  const [showStallForm, setShowStallForm] = useState(false)
  const [stallForm, setStallForm] = useState({ agent_id: '', agent_name: '', event_name: '', location: '', city: '', stall_date: new Date().toISOString().split('T')[0], footfall: '', leads_collected: '', notes: '' })
  const [savingStall, setSavingStall] = useState(false)

  // Walk-in form
  const [showWalkinForm, setShowWalkinForm] = useState(false)
  const [walkinForm, setWalkinForm] = useState({ agent_id: '', agent_name: '', name: '', phone: '', email: '', service_interest: '', city: '', notes: '' })
  const [savingWalkin, setSavingWalkin] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [agRes, statsRes] = await Promise.all([
        fetch('/api/admin/market?type=agents').then(r => r.json()),
        fetch('/api/admin/market?type=stats').then(r => r.json()),
      ])
      setAgents(agRes.agents || [])
      setStats(statsRes)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    fetch('/api/auth/me').then(r => r.json()).then(d => setMeId(d.id || 0))
  }, [load])

  useEffect(() => {
    if (activeTab === 'visits')   fetch('/api/admin/market?type=visits').then(r => r.json()).then(d => setVisits(d.visits || []))
    if (activeTab === 'stalls')   fetch('/api/admin/market?type=stalls').then(r => r.json()).then(d => setStalls(d.stalls || []))
    if (activeTab === 'walkin')   fetch('/api/admin/market?type=walkin').then(r => r.json()).then(d => setWalkins(d.walkin || []))
    if (activeTab === 'coverage') fetch('/api/admin/market?type=coverage').then(r => r.json()).then(d => setCoverage(d.coverage || {}))
  }, [activeTab])

  const saveAgent = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingAgent(true)
    try {
      const res = await fetch('/api/admin/market?type=agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(agentForm) })
      if (res.ok) { const { item } = await res.json(); setAgents(p => [item, ...p]); setStats(s => s ? { ...s, totalAgents: s.totalAgents + 1, activeAgents: s.activeAgents + 1 } : s) }
      setShowAgentForm(false); setAgentForm({ fullname: '', phone: '', email: '', territory: '', city: '', daily_target: '5' })
    } catch {} finally { setSavingAgent(false) }
  }

  const saveVisit = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingVisit(true)
    try {
      const res = await fetch('/api/admin/market?type=visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(visitForm) })
      if (res.ok) { const { item } = await res.json(); setVisits(p => [item, ...p]) }
      setShowVisitForm(false)
    } catch {} finally { setSavingVisit(false) }
  }

  const saveStall = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingStall(true)
    try {
      const res = await fetch('/api/admin/market?type=stalls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stallForm) })
      if (res.ok) { const { item } = await res.json(); setStalls(p => [item, ...p]) }
      setShowStallForm(false)
    } catch {} finally { setSavingStall(false) }
  }

  const saveWalkin = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingWalkin(true)
    try {
      const res = await fetch('/api/admin/market?type=walkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(walkinForm) })
      if (res.ok) { const { item } = await res.json(); setWalkins(p => [item, ...p]) }
      setShowWalkinForm(false); setWalkinForm({ agent_id: '', agent_name: '', name: '', phone: '', email: '', service_interest: '', city: '', notes: '' })
    } catch {} finally { setSavingWalkin(false) }
  }

  const deleteAgent = async (id: number) => {
    if (!confirm('Delete this agent?')) return
    await fetch(`/api/admin/market?type=agents&id=${id}`, { method: 'DELETE' })
    setAgents(p => p.filter(a => a.id !== id))
  }

  const coverageEntries = Object.entries(coverage).sort((a, b) => b[1] - a[1])
  const maxCoverage = coverageEntries[0]?.[1] || 1

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">🛒 Market Saarthi</h1>
          <p className="text-slate-500 text-sm">Field agents · Walk-in leads · Visit reports · On-ground events</p>
        </div>
        <button onClick={() => setShowChat(v => !v)}
          className="px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
          style={{ background: '#FF6B35' }}>💬 Team Chat</button>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KPI icon="🧑‍💼" label="Total Agents" value={stats.totalAgents} color="#3B82F6" />
          <KPI icon="✅" label="Active Agents" value={stats.activeAgents} color="#10B981" />
          <KPI icon="📞" label="Total Leads" value={stats.totalLeads} color="#8B5CF6" />
          <KPI icon="🚶" label="Walk-in Leads" value={stats.walkInLeads} color="#F59E0B" />
          <KPI icon="📍" label="Field Visits" value={stats.totalVisits} color="#0EA5E9" />
          <KPI icon="🎪" label="Stall Leads" value={stats.stallLeads} color="#EC4899" />
          <KPI icon="💰" label="Revenue ₹" value={`₹${(stats.totalRevenue / 1000).toFixed(0)}K`} color="#10B981" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-bold cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${activeTab === t.key ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── FIELD AGENTS TAB ── */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{agents.length} field agents registered</p>
            <button onClick={() => setShowAgentForm(v => !v)}
              className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
              style={{ background: '#1B3A6B' }}>+ Add Agent</button>
          </div>

          <AnimatePresence>
            {showAgentForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-3">📋 Register Field Agent</h4>
                <form onSubmit={saveAgent} className="grid grid-cols-2 gap-3">
                  <input required value={agentForm.fullname} onChange={e => setAgentForm(p => ({ ...p, fullname: e.target.value }))}
                    placeholder="Full Name *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                  <input value={agentForm.phone} onChange={e => setAgentForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="email" value={agentForm.email} onChange={e => setAgentForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="Email" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={agentForm.territory} onChange={e => setAgentForm(p => ({ ...p, territory: e.target.value }))}
                    placeholder="Territory / Zone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={agentForm.city} onChange={e => setAgentForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="City" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="number" value={agentForm.daily_target} onChange={e => setAgentForm(p => ({ ...p, daily_target: e.target.value }))}
                    placeholder="Daily Lead Target" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <div className="flex gap-3 col-span-2">
                    <button type="submit" disabled={savingAgent}
                      className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60 hover:opacity-90">
                      {savingAgent ? '⏳ Saving...' : '💾 Register Agent'}
                    </button>
                    <button type="button" onClick={() => setShowAgentForm(false)} className="px-3 py-2 text-sm text-slate-400 cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
            </div>
          ) : agents.length === 0 ? (
            <EmptyState icon="🧑‍💼" label="No field agents registered yet. Add your first agent above." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((a, i) => {
                const progress = Math.min((a.total_leads / (a.daily_target || 5)) * 100, 100)
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-lg">
                          {a.fullname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-navy text-sm">{a.fullname}</p>
                          <p className="text-[10px] text-slate-400">{a.territory || '—'} · {a.city || '—'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-blue-50 text-center">
                        <p className="font-extrabold text-blue-700 text-sm">{a.total_leads}</p>
                        <p className="text-[9px] text-blue-500 font-bold">LEADS</p>
                      </div>
                      <div className="p-2 rounded-lg bg-green-50 text-center">
                        <p className="font-extrabold text-green-700 text-sm">₹{(a.total_revenue / 1000).toFixed(0)}K</p>
                        <p className="text-[9px] text-green-500 font-bold">REVENUE</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Daily Target Progress</span>
                        <span>{a.total_leads} / {a.daily_target}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progress >= 100 ? '#10B981' : '#3B82F6' }} />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {a.phone && (
                        <a href={`https://wa.me/${a.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                          className="flex-1 text-center py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors">
                          💬 WhatsApp
                        </a>
                      )}
                      <button onClick={() => deleteAgent(a.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center cursor-pointer text-xs flex-shrink-0">
                        🗑
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── WALK-IN LEADS TAB ── */}
      {activeTab === 'walkin' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{walkins.length} walk-in leads captured</p>
            <button onClick={() => setShowWalkinForm(v => !v)}
              className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
              style={{ background: '#FF6B35' }}>+ Capture Walk-in Lead</button>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            📱 Walk-in leads are <strong>automatically added to the CRM</strong> with source = "field" and assigned to Market Saarthi pillar.
          </div>

          <AnimatePresence>
            {showWalkinForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-3">🚶 Capture Walk-in Lead</h4>
                <form onSubmit={saveWalkin} className="grid grid-cols-2 gap-3">
                  <select value={walkinForm.agent_id} onChange={e => {
                    const ag = agents.find(a => String(a.id) === e.target.value)
                    setWalkinForm(p => ({ ...p, agent_id: e.target.value, agent_name: ag?.fullname || '' }))
                  }} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    <option value="">Select Agent (optional)</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.fullname} — {a.city}</option>)}
                  </select>
                  <input required value={walkinForm.name} onChange={e => setWalkinForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Lead Name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input required value={walkinForm.phone} onChange={e => setWalkinForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="email" value={walkinForm.email} onChange={e => setWalkinForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="Email (optional)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={walkinForm.city} onChange={e => setWalkinForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="City" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <select value={walkinForm.service_interest} onChange={e => setWalkinForm(p => ({ ...p, service_interest: e.target.value }))}
                    className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    <option value="">Service Interest</option>
                    {['Academic Services', 'Technical Services', 'Business Services', 'Government Services', 'Campus Ambassador', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <textarea value={walkinForm.notes} onChange={e => setWalkinForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Notes..." rows={2} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                  <div className="flex gap-3 col-span-2">
                    <button type="submit" disabled={savingWalkin}
                      className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold cursor-pointer disabled:opacity-60 hover:opacity-90">
                      {savingWalkin ? '⏳' : '📝 Capture Lead → CRM'}
                    </button>
                    <button type="button" onClick={() => setShowWalkinForm(false)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {walkins.length === 0 ? (
            <EmptyState icon="🚶" label="No walk-in leads captured yet." />
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-100 bg-slate-50">
                  {['Name', 'Phone', 'Service', 'Agent', 'City', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {walkins.map(w => (
                    <tr key={w.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-3 py-3 font-semibold text-navy">{w.name}</td>
                      <td className="px-3 py-3 text-slate-500">{w.phone}</td>
                      <td className="px-3 py-3 text-slate-500">{w.service_interest || '—'}</td>
                      <td className="px-3 py-3 text-slate-500">{w.agent_name || '—'}</td>
                      <td className="px-3 py-3 text-slate-500">{w.city || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.status === 'new' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-400">{new Date(w.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── VISIT REPORTS TAB ── */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{visits.length} field visits logged</p>
            <button onClick={() => setShowVisitForm(v => !v)}
              className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
              style={{ background: '#1B3A6B' }}>+ Log Visit</button>
          </div>

          <AnimatePresence>
            {showVisitForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-3">📍 Log Field Visit</h4>
                <form onSubmit={saveVisit} className="grid grid-cols-2 gap-3">
                  <select value={visitForm.agent_id} onChange={e => {
                    const ag = agents.find(a => String(a.id) === e.target.value)
                    setVisitForm(p => ({ ...p, agent_id: e.target.value, agent_name: ag?.fullname || '' }))
                  }} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    <option value="">Select Agent</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.fullname}</option>)}
                  </select>
                  <input required value={visitForm.area} onChange={e => setVisitForm(p => ({ ...p, area: e.target.value }))}
                    placeholder="Area / Locality *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={visitForm.city} onChange={e => setVisitForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="City" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={visitForm.contact_name} onChange={e => setVisitForm(p => ({ ...p, contact_name: e.target.value }))}
                    placeholder="Contact Person Met" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={visitForm.contact_phone} onChange={e => setVisitForm(p => ({ ...p, contact_phone: e.target.value }))}
                    placeholder="Contact Phone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <select value={visitForm.outcome} onChange={e => setVisitForm(p => ({ ...p, outcome: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {['visited', 'interested', 'not_home', 'declined'].map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                  </select>
                  <input type="date" value={visitForm.visit_date} onChange={e => setVisitForm(p => ({ ...p, visit_date: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <textarea value={visitForm.notes} onChange={e => setVisitForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Visit notes..." rows={2} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                  <div className="flex gap-3 col-span-2">
                    <button type="submit" disabled={savingVisit}
                      className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{savingVisit ? '⏳' : '📍 Save Visit'}</button>
                    <button type="button" onClick={() => setShowVisitForm(false)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {visits.length === 0 ? <EmptyState icon="📍" label="No visit reports yet." /> : (
            <div className="space-y-3">
              {visits.map((v, i) => {
                const cfg = OUTCOME_COLORS[v.outcome] || { bg: '#F3F4F6', text: '#6B7280' }
                return (
                  <motion.div key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: cfg.bg }}>📍</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-navy">{v.area}{v.city ? `, ${v.city}` : ''}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Agent: {v.agent_name || '—'} · {new Date(v.visit_date).toLocaleDateString('en-IN')}</p>
                          {v.contact_name && <p className="text-xs text-slate-400 mt-0.5">Met: {v.contact_name} {v.contact_phone ? `(${v.contact_phone})` : ''}</p>}
                          {v.notes && <p className="text-xs text-slate-500 mt-1 bg-slate-50 rounded-lg px-2 py-1">{v.notes}</p>}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold capitalize flex-shrink-0" style={{ background: cfg.bg, color: cfg.text }}>
                        {v.outcome.replace('_', ' ')}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STALLS & EVENTS TAB ── */}
      {activeTab === 'stalls' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{stalls.length} stall activities logged</p>
            <button onClick={() => setShowStallForm(v => !v)}
              className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
              style={{ background: '#8B5CF6' }}>+ Log Stall Activity</button>
          </div>

          <AnimatePresence>
            {showStallForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-3">🎪 Log Stall / Event Activity</h4>
                <form onSubmit={saveStall} className="grid grid-cols-2 gap-3">
                  <select value={stallForm.agent_id} onChange={e => {
                    const ag = agents.find(a => String(a.id) === e.target.value)
                    setStallForm(p => ({ ...p, agent_id: e.target.value, agent_name: ag?.fullname || '' }))
                  }} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    <option value="">Select Agent</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.fullname}</option>)}
                  </select>
                  <input required value={stallForm.event_name} onChange={e => setStallForm(p => ({ ...p, event_name: e.target.value }))}
                    placeholder="Event / Stall Name *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={stallForm.location} onChange={e => setStallForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="Location / Venue" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={stallForm.city} onChange={e => setStallForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="City" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="date" value={stallForm.stall_date} onChange={e => setStallForm(p => ({ ...p, stall_date: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="number" value={stallForm.footfall} onChange={e => setStallForm(p => ({ ...p, footfall: e.target.value }))}
                    placeholder="Footfall (visitors)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="number" value={stallForm.leads_collected} onChange={e => setStallForm(p => ({ ...p, leads_collected: e.target.value }))}
                    placeholder="Leads Collected" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <textarea value={stallForm.notes} onChange={e => setStallForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Notes..." rows={2} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                  <div className="flex gap-3 col-span-2">
                    <button type="submit" disabled={savingStall}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer disabled:opacity-60">{savingStall ? '⏳' : '🎪 Save Activity'}</button>
                    <button type="button" onClick={() => setShowStallForm(false)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {stalls.length === 0 ? <EmptyState icon="🎪" label="No stall activities logged yet." /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stalls.map((st, i) => (
                <motion.div key={st.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl">🎪</div>
                    <div>
                      <p className="font-bold text-navy text-sm">{st.event_name}</p>
                      <p className="text-[10px] text-slate-400">{st.location || '—'} · {st.city || '—'}</p>
                      <p className="text-[10px] text-slate-400">{new Date(st.stall_date).toLocaleDateString('en-IN')} · Agent: {st.agent_name || '—'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-blue-50 text-center">
                      <p className="font-extrabold text-blue-700 text-sm">{st.footfall}</p>
                      <p className="text-[9px] text-blue-500 font-bold">FOOTFALL</p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-50 text-center">
                      <p className="font-extrabold text-green-700 text-sm">{st.leads_collected}</p>
                      <p className="text-[9px] text-green-500 font-bold">LEADS</p>
                    </div>
                  </div>
                  {st.notes && <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg px-2 py-1">{st.notes}</p>}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COVERAGE MAP TAB ── */}
      {activeTab === 'coverage' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-navy font-heading mb-5">📊 Market Coverage by City</h3>
            {coverageEntries.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No visit data yet. Log visits to see coverage.</p>
            ) : (
              <div className="space-y-3">
                {coverageEntries.map(([city, count], i) => {
                  const pct = Math.round((count / maxCoverage) * 100)
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#0EA5E9']
                  const color = colors[i % colors.length]
                  return (
                    <motion.div key={city} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-navy">{city}</span>
                        <span className="text-xs font-bold" style={{ color }}>{count} visit{count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: color }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.06 + 0.2, duration: 0.6, ease: 'easeOut' }} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-extrabold text-navy">{coverageEntries.length}</p>
              <p className="text-xs text-slate-400 mt-1">Cities Covered</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-extrabold text-blue-600">{coverageEntries.reduce((s, [, c]) => s + c, 0)}</p>
              <p className="text-xs text-slate-400 mt-1">Total Visits</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-extrabold text-orange-600">{coverageEntries[0]?.[0] || '—'}</p>
              <p className="text-xs text-slate-400 mt-1">Top City</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-extrabold text-green-600">{agents.filter(a => a.status === 'active').length}</p>
              <p className="text-xs text-slate-400 mt-1">Active Agents</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TEAM CHAT TAB ── */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center py-16">
          <span className="text-5xl block mb-3">💬</span>
          <p className="font-bold text-navy mb-2">Direct Chat with Field Team</p>
          <p className="text-slate-400 text-sm mb-4">Open the direct message panel to chat with any field agent or team member.</p>
          <button onClick={() => setShowChat(true)}
            className="px-6 py-3 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
            style={{ background: '#FF6B35' }}>Open Messages</button>
        </div>
      )}

      {/* DM Chat */}
      {showChat && meId > 0 && (
        <DirectChatPanel currentUserId={meId} mode="ops" onClose={() => setShowChat(false)} />
      )}
    </div>
  )
}
