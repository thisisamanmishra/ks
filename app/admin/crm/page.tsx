'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Lead {
  id: number; name: string; email: string; phone: string; source: string; stage: string
  expected_value: number | null; assigned_to: string | null; notes: string | null
  created_at: string; follow_up_date: string | null
}

interface Client {
  id: number; fullname: string; email: string; phone: string; created_at: string
  totalRevenue: number; totalProjects: number; segment: string; lastContact: string | null
}

const TABS = [
  { key: 'leads', label: '🎯 Lead Management' },
  { key: 'clients', label: '👥 Client Management' },
  { key: 'revenue', label: '📊 Revenue Reports' },
] as const
type Tab = typeof TABS[number]['key']

const STAGES = ['new', 'contacted', 'interested', 'proposal', 'won', 'lost']
const STAGE_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  new: { label: 'New', color: '#6B7280', bg: '#F3F4F6', icon: '🆕' },
  contacted: { label: 'Contacted', color: '#3B82F6', bg: '#DBEAFE', icon: '📞' },
  interested: { label: 'Interested', color: '#8B5CF6', bg: '#EDE9FE', icon: '🤝' },
  proposal: { label: 'Proposal Sent', color: '#F59E0B', bg: '#FEF3C7', icon: '📄' },
  won: { label: 'Won ✅', color: '#10B981', bg: '#D1FAE5', icon: '🏆' },
  lost: { label: 'Lost', color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
}

const SOURCES = ['website', 'social_media', 'referral', 'cold_call', 'email', 'walk_in', 'campus', 'digital', 'calling', 'government', 'market', 'other']

function LeadScore({ lead }: { lead: Lead }) {
  let score = 0
  if (lead.stage === 'won') score = 100
  else if (lead.stage === 'proposal') score = 75
  else if (lead.stage === 'interested') score = 55
  else if (lead.stage === 'contacted') score = 30
  else if (lead.stage === 'new') score = 15
  // Deduct for age
  const daysSince = (Date.now() - new Date(lead.created_at).getTime()) / 86400000
  if (daysSince > 30) score = Math.max(score - 20, 0)
  if (daysSince > 60) score = Math.max(score - 20, 0)
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<Tab>('leads')
  const [leads, setLeads] = useState<Lead[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [revenueData, setRevenueData] = useState<{ total: number; thisMonth: number; bySource: Record<string, number>; pending: number }>({ total: 0, thisMonth: 0, bySource: {}, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showNewLead, setShowNewLead] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', source: 'website', stage: 'new', expected_value: '', notes: '', follow_up_date: '' })
  const [saving, setSaving] = useState(false)
  const [updatingLead, setUpdatingLead] = useState<number | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [segmentFilter, setSegmentFilter] = useState('all')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [lRes, cRes, rRes] = await Promise.all([
        fetch('/api/admin/crm/leads').then(r => r.ok ? r.json() : { leads: [] }),
        fetch('/api/admin/crm/clients').then(r => r.ok ? r.json() : { clients: [] }),
        fetch('/api/admin/board').then(r => r.ok ? r.json() : {}) as Promise<{ revenue?: { total: number; thisMonth: number; pending: number }; leads?: { bySource: Record<string, number> } }>,
      ])
      setLeads(lRes.leads || [])
      setClients(cRes.clients || [])
      if (rRes.revenue) {
        setRevenueData({
          total: rRes.revenue.total || 0,
          thisMonth: rRes.revenue.thisMonth || 0,
          bySource: rRes.leads?.bySource || {},
          pending: rRes.revenue.pending || 0,
        })
      }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const createLead = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/admin/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLead, expected_value: newLead.expected_value ? Number(newLead.expected_value) : null }),
      })
      if (res.ok) {
        setShowNewLead(false)
        setNewLead({ name: '', email: '', phone: '', source: 'website', stage: 'new', expected_value: '', notes: '', follow_up_date: '' })
        loadData()
      }
    } catch {} finally { setSaving(false) }
  }

  const updateLeadStage = async (id: number, stage: string) => {
    setUpdatingLead(id)
    try {
      await fetch(`/api/admin/crm/leads`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, stage }) })
      setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
      if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, stage } : null)
    } catch {} finally { setUpdatingLead(null) }
  }

  const filteredLeads = leads.filter(l =>
    (stageFilter === 'all' || l.stage === stageFilter) &&
    (sourceFilter === 'all' || l.source === sourceFilter) &&
    (search === '' || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search))
  )

  const todayFollowUps = leads.filter(l => l.follow_up_date && new Date(l.follow_up_date).toDateString() === new Date().toDateString())
  const overdueFollowUps = leads.filter(l => l.follow_up_date && new Date(l.follow_up_date) < new Date() && l.stage !== 'won' && l.stage !== 'lost')

  // Check for potential duplicates (same phone)
  const phoneGroups: Record<string, Lead[]> = {}
  leads.forEach(l => { if (l.phone) { if (!phoneGroups[l.phone]) phoneGroups[l.phone] = []; phoneGroups[l.phone].push(l) } })
  const duplicates = Object.values(phoneGroups).filter(g => g.length > 1).flat()

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">🔗 CRM — Customer Relations</h1>
          <p className="text-slate-500 text-sm">Leads · Clients · Revenue · Follow-ups · Segments</p>
        </div>
      </div>

      {/* Alert strip */}
      {(todayFollowUps.length > 0 || overdueFollowUps.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {todayFollowUps.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">📞</span>
              <div>
                <p className="font-bold text-blue-700 text-sm">{todayFollowUps.length} follow-up(s) due today</p>
                <p className="text-xs text-blue-500">{todayFollowUps.map(l => l.name).join(', ')}</p>
              </div>
            </div>
          )}
          {overdueFollowUps.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold text-red-700 text-sm">{overdueFollowUps.length} overdue follow-up(s)</p>
                <p className="text-xs text-red-500">{overdueFollowUps.map(l => l.name).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-bold cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${activeTab === t.key ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── LEADS TAB ── */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {STAGES.filter(s => s !== 'lost').map(s => {
              const count = leads.filter(l => l.stage === s).length
              const cfg = STAGE_CFG[s]
              return (
                <button key={s} onClick={() => setStageFilter(stageFilter === s ? 'all' : s)}
                  className={`bg-white rounded-xl p-3 border text-center cursor-pointer transition-all hover:shadow-md ${stageFilter === s ? 'border-navy shadow-md' : 'border-slate-100 shadow-sm'}`}>
                  <p className="text-xl font-extrabold" style={{ color: cfg.color }}>{count}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{cfg.label}</p>
                </button>
              )
            })}
          </div>

          {/* Duplicates alert */}
          {duplicates.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              ⚠️ <strong>Duplicate leads detected</strong> ({duplicates.length} leads share same phone numbers). Review and merge as needed.
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3 flex-wrap items-center">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search leads..." className="flex-1 min-w-52 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-navy" />
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none">
              <option value="all">All Sources</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => setShowNewLead(v => !v)} className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90 whitespace-nowrap" style={{ background: '#10B981' }}>+ Add Lead</button>
          </div>

          {/* New Lead Form */}
          <AnimatePresence>
            {showNewLead && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-navy font-heading mb-4">+ New Lead</h3>
                <form onSubmit={createLead} className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <input required value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} placeholder="Full name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                    <input type="email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                    <input value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} placeholder="Phone *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                    <select value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                      {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <select value={newLead.stage} onChange={e => setNewLead(p => ({ ...p, stage: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                      {STAGES.map(s => <option key={s} value={s}>{STAGE_CFG[s].label}</option>)}
                    </select>
                    <input type="number" value={newLead.expected_value} onChange={e => setNewLead(p => ({ ...p, expected_value: e.target.value }))} placeholder="Expected value (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Follow-up date</label>
                      <input type="date" value={newLead.follow_up_date} onChange={e => setNewLead(p => ({ ...p, follow_up_date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                    </div>
                    <textarea value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} placeholder="Notes..." rows={1} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60" style={{ background: '#1B3A6B' }}>{saving ? '⏳ Saving...' : '✅ Add Lead'}</button>
                    <button type="button" onClick={() => setShowNewLead(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Leads table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {['Lead', 'Contact', 'Source', 'Stage', 'Value', 'Score', 'Follow-up', 'Actions'].map(h => <th key={h} className="px-3 py-3 text-left font-bold text-slate-400 uppercase text-[10px] whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={8} className="p-3"><div className="h-10 bg-slate-100 rounded animate-pulse" /></td></tr>) :
                    filteredLeads.length === 0 ? <tr><td colSpan={8} className="p-10 text-center text-slate-400">No leads found</td></tr> :
                      filteredLeads.map(lead => {
                        const sc = STAGE_CFG[lead.stage] || STAGE_CFG.new
                        const isDuplicate = duplicates.some(d => d.id === lead.id)
                        const isFollowUpToday = lead.follow_up_date && new Date(lead.follow_up_date).toDateString() === new Date().toDateString()
                        const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date()
                        return (
                          <tr key={lead.id} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${isDuplicate ? 'bg-amber-50/40' : isFollowUpToday ? 'bg-blue-50/40' : ''}`}>
                            <td className="px-3 py-3">
                              <button onClick={() => setSelectedLead(lead)} className="text-left group cursor-pointer">
                                <p className="font-bold text-navy group-hover:text-accent transition-colors">{lead.name} {isDuplicate && '⚠️'}</p>
                                <p className="text-[10px] text-slate-400">{new Date(lead.created_at).toLocaleDateString('en-IN')}</p>
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              <p className="text-slate-500">{lead.phone}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{lead.email}</p>
                            </td>
                            <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{lead.source?.replace(/_/g, ' ')}</span></td>
                            <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap" style={{ background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span></td>
                            <td className="px-3 py-3 font-bold text-navy">{lead.expected_value ? `₹${Number(lead.expected_value).toLocaleString('en-IN')}` : '—'}</td>
                            <td className="px-3 py-3"><LeadScore lead={lead} /></td>
                            <td className="px-3 py-3">
                              {lead.follow_up_date ? (
                                <span className={`font-bold text-[10px] ${isFollowUpToday ? 'text-blue-600' : isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                  {isOverdue && !isFollowUpToday ? '⚠️ ' : isFollowUpToday ? '📞 ' : ''}{new Date(lead.follow_up_date).toLocaleDateString('en-IN')}
                                </span>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-3">
                              {updatingLead === lead.id ? (
                                <div className="w-4 h-4 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
                              ) : (
                                <select value={lead.stage} onChange={e => updateLeadStage(lead.id, e.target.value)}
                                  className="text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none cursor-pointer">
                                  {STAGES.map(s => <option key={s} value={s}>{STAGE_CFG[s].label}</option>)}
                                </select>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CLIENTS TAB ── */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <input placeholder="🔍 Search clients..." className="flex-1 min-w-52 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none" />
            <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none">
              {['all', 'student', 'startup', 'corporate', 'government'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {['Client', 'Contact', 'Segment', 'Revenue', 'Projects', 'Member Since', 'Actions'].map(h => <th key={h} className="px-3 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}
                </tr></thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={7} className="p-3"><div className="h-10 bg-slate-100 rounded animate-pulse" /></td></tr>) :
                    clients.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-slate-400">No clients found</td></tr> :
                      clients.filter(c => segmentFilter === 'all' || c.segment === segmentFilter).map(client => (
                        <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center font-bold text-navy text-sm">{client.fullname.charAt(0)}</div>
                              <p className="font-bold text-navy">{client.fullname}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-slate-500">{client.phone || '—'}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{client.email}</p>
                          </td>
                          <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 capitalize">{client.segment || '—'}</span></td>
                          <td className="px-3 py-3 font-bold text-green-600">₹{client.totalRevenue.toLocaleString('en-IN')}</td>
                          <td className="px-3 py-3 font-bold text-navy text-center">{client.totalProjects}</td>
                          <td className="px-3 py-3 text-slate-400">{new Date(client.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1">
                              <a href={`mailto:${client.email}`} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer transition-colors">✉️</a>
                              {client.phone && <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="px-2 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer transition-colors">💬</a>}
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── REVENUE REPORTS TAB ── */}
      {activeTab === 'revenue' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '💰', label: 'Total Revenue', value: `₹${revenueData.total.toLocaleString('en-IN')}`, color: '#10B981' },
              { icon: '📅', label: 'This Month', value: `₹${revenueData.thisMonth.toLocaleString('en-IN')}`, color: '#3B82F6' },
              { icon: '⏳', label: 'Outstanding', value: `₹${revenueData.pending.toLocaleString('en-IN')}`, color: '#F59E0B' },
              { icon: '🏆', label: 'Won Leads', value: `${leads.filter(l => l.stage === 'won').length}`, color: '#8B5CF6' },
            ].map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <span className="text-2xl block mb-2">{k.icon}</span>
                <p className="text-2xl font-extrabold text-navy">{k.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Pipeline by stage */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-5">📊 Pipeline by Stage</h3>
              <div className="space-y-3">
                {STAGES.filter(s => s !== 'lost').map(stage => {
                  const stageLeads = leads.filter(l => l.stage === stage)
                  const value = stageLeads.reduce((a, l) => a + (l.expected_value || 0), 0)
                  const maxValue = leads.reduce((a, l) => a + (l.expected_value || 0), 1)
                  const cfg = STAGE_CFG[stage]
                  return (
                    <div key={stage}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-600">{cfg.icon} {cfg.label}</span>
                        <span className="font-bold text-navy">{stageLeads.length} leads · ₹{value.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: value > 0 ? `${(value / maxValue) * 100}%` : '0%' }}
                          transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: cfg.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Lead source revenue */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-5">🎯 Leads by Source</h3>
              <div className="space-y-3">
                {Object.entries(revenueData.bySource).length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">No source data yet</p>
                ) : Object.entries(revenueData.bySource).sort((a, b) => b[1] - a[1]).map(([source, count]) => {
                  const total = Object.values(revenueData.bySource).reduce((a, b) => a + b, 0)
                  return (
                    <div key={source}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-600 capitalize">{source.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-navy">{count} ({((count / total) * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(count / total) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Conversion Rate Summary */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-4">📈 Conversion Rate Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Leads', value: leads.length, color: '#6B7280' },
                { label: 'Contacted', value: leads.filter(l => ['contacted', 'interested', 'proposal', 'won'].includes(l.stage)).length, color: '#3B82F6' },
                { label: 'Active Pipeline', value: leads.filter(l => ['interested', 'proposal'].includes(l.stage)).length, color: '#F59E0B' },
                { label: 'Won', value: leads.filter(l => l.stage === 'won').length, color: '#10B981' },
              ].map(s => (
                <div key={s.label} className="text-center p-4 rounded-xl bg-slate-50">
                  <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                  {leads.length > 0 && <p className="text-[10px] font-bold mt-0.5" style={{ color: s.color }}>{((s.value / leads.length) * 100).toFixed(1)}%</p>}
                </div>
              ))}
            </div>
            <button onClick={() => window.print()} className="mt-4 px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#1B3A6B' }}>🖨️ Export CRM Report</button>
          </div>
        </div>
      )}

      {/* Lead Detail Drawer */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end" onClick={() => setSelectedLead(null)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-navy text-lg font-heading">Lead Detail</h2>
                <button onClick={() => setSelectedLead(null)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200">✕</button>
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-navy/10 flex items-center justify-center font-bold text-navy text-2xl">{selectedLead.name.charAt(0)}</div>
                <div>
                  <p className="font-bold text-navy text-lg">{selectedLead.name}</p>
                  <LeadScore lead={selectedLead} />
                </div>
              </div>
              <div className="space-y-2 mb-5">
                {[
                  { label: 'Phone', value: selectedLead.phone },
                  { label: 'Email', value: selectedLead.email },
                  { label: 'Source', value: selectedLead.source?.replace(/_/g, ' ') },
                  { label: 'Expected Value', value: selectedLead.expected_value ? `₹${Number(selectedLead.expected_value).toLocaleString('en-IN')}` : '—' },
                  { label: 'Follow-up', value: selectedLead.follow_up_date ? new Date(selectedLead.follow_up_date).toLocaleDateString('en-IN') : '—' },
                  { label: 'Added', value: new Date(selectedLead.created_at).toLocaleDateString('en-IN') },
                ].map(r => (
                  <div key={r.label} className="flex justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-xs text-slate-400">{r.label}</span>
                    <span className="text-xs font-semibold text-navy capitalize">{r.value || '—'}</span>
                  </div>
                ))}
              </div>
              {selectedLead.notes && (
                <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-xs font-bold text-amber-600 mb-1">📝 Notes</p>
                  <p className="text-xs text-slate-600">{selectedLead.notes}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Update Stage</p>
                <div className="space-y-2">
                  {STAGES.map(s => {
                    const cfg = STAGE_CFG[s]
                    return (
                      <button key={s} onClick={() => updateLeadStage(selectedLead.id, s)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer border transition-all ${selectedLead.stage === s ? 'border-2' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                        style={{ borderColor: selectedLead.stage === s ? cfg.color : undefined, background: selectedLead.stage === s ? cfg.bg : undefined }}>
                        <span className="text-sm">{cfg.icon}</span>
                        <span className="text-sm font-medium" style={{ color: selectedLead.stage === s ? cfg.color : '#374151' }}>{cfg.label}</span>
                        {selectedLead.stage === s && <span className="ml-auto text-xs" style={{ color: cfg.color }}>✓ Current</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
