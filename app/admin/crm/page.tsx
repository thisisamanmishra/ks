'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────
interface Lead {
  id: number; name: string; email: string; phone: string; source: string; stage: string
  expected_value: number | null; assigned_to: string | null; notes: string | null
  created_at: string; next_followup: string | null; pillar: string | null; segment: string | null
  service_interest: string | null; assigned?: { id: string; fullname: string }
}
interface FollowupLog { id: number; note: string; note_type: string; next_followup: string | null; created_at: string; creator?: { fullname: string } }
interface Client {
  id: number; fullname: string; email: string; phone: string; created_at: string
  totalRevenue: number; totalProjects: number; segment: string; lastContact: string | null
}
interface Invoice {
  id: number; invoice_number: string; client_name: string; client_email?: string; pillar?: string
  service?: string; amount: number; total_amount: number; status: string
  due_date?: string; paid_date?: string; notes?: string; created_at: string; items?: InvoiceItem[]
}
interface InvoiceItem { description: string; qty: number; rate: number; amount: number }
interface RevSummary { totalRevenue: number; pendingRevenue: number; overdueCount: number; byPillar: Record<string, number>; monthly: Record<string, number> }

// ─── Constants ───────────────────────────────────────────────
const TABS = [
  { key: 'leads',    label: '🎯 Lead Management' },
  { key: 'clients',  label: '👥 Client Management' },
  { key: 'invoices', label: '🧾 Invoices' },
  { key: 'reports',  label: '📊 Reports' },
] as const
type Tab = typeof TABS[number]['key']

const STAGES = ['new', 'contacted', 'interested', 'proposal', 'won', 'lost']
const STAGE_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  new:       { label: 'New',          color: '#6B7280', bg: '#F3F4F6', icon: '🆕' },
  contacted: { label: 'Contacted',    color: '#3B82F6', bg: '#DBEAFE', icon: '📞' },
  interested:{ label: 'Interested',   color: '#8B5CF6', bg: '#EDE9FE', icon: '🤝' },
  proposal:  { label: 'Proposal Sent',color: '#F59E0B', bg: '#FEF3C7', icon: '📄' },
  won:       { label: 'Won ✅',       color: '#10B981', bg: '#D1FAE5', icon: '🏆' },
  lost:      { label: 'Lost',         color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
}
const SOURCES = ['website','social_media','referral','cold_call','email','walk_in','campus','digital','calling','government','market','whatsapp','field','other']
const PILLARS = ['calling','campus','digital','government','market','operations']
const SEGMENTS = ['student','startup','corporate','government','individual']
const INV_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: '#6B7280', bg: '#F3F4F6' },
  sent:      { label: 'Sent',      color: '#3B82F6', bg: '#DBEAFE' },
  paid:      { label: 'Paid ✅',   color: '#10B981', bg: '#D1FAE5' },
  overdue:   { label: 'Overdue ⚠️',color: '#EF4444', bg: '#FEE2E2' },
  cancelled: { label: 'Cancelled', color: '#9CA3AF', bg: '#F9FAFB' },
}

function LeadScore({ lead }: { lead: Lead }) {
  let score = lead.stage === 'won' ? 100 : lead.stage === 'proposal' ? 75 : lead.stage === 'interested' ? 55 : lead.stage === 'contacted' ? 30 : 15
  const days = (Date.now() - new Date(lead.created_at).getTime()) / 86400000
  if (days > 30) score = Math.max(score - 20, 0)
  if (days > 60) score = Math.max(score - 20, 0)
  if (lead.next_followup && new Date(lead.next_followup) < new Date()) score = Math.max(score - 10, 0)
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

function Badge({ status, cfg }: { status: string; cfg: Record<string, { label: string; color: string; bg: string }> }) {
  const c = cfg[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' }
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: c.bg, color: c.color }}>{c.label}</span>
}

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<Tab>('leads')

  // Leads
  const [leads, setLeads] = useState<Lead[]>([])
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({})
  const [bySource, setBySource] = useState<Record<string, number>>({})
  const [stageFilter, setStageFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [pillarFilter, setPillarFilter] = useState('all')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showNewLead, setShowNewLead] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', source: 'website', stage: 'new', expected_value: '', notes: '', next_followup: '', pillar: '', segment: 'student', service_interest: '' })
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leadDetail, setLeadDetail] = useState<{ lead: Lead; followupLogs: FollowupLog[] } | null>(null)
  const [followupNote, setFollowupNote] = useState('')
  const [followupType, setFollowupType] = useState('call')
  const [nextFollowup, setNextFollowup] = useState('')
  const [updatingLead, setUpdatingLead] = useState<number | null>(null)

  // Clients
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [clientSegFilter, setClientSegFilter] = useState('all')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [bulkMsg, setBulkMsg] = useState({ segment: 'all', channel: 'whatsapp', subject: '', message: '' })
  const [showBulkMsg, setShowBulkMsg] = useState(false)

  // Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invSummary, setInvSummary] = useState<RevSummary>({ totalRevenue: 0, pendingRevenue: 0, overdueCount: 0, byPillar: {}, monthly: {} })
  const [invStatusFilter, setInvStatusFilter] = useState('all')
  const [invPillarFilter, setInvPillarFilter] = useState('all')
  const [invDateFrom, setInvDateFrom] = useState('')
  const [invDateTo, setInvDateTo] = useState('')
  const [showInvForm, setShowInvForm] = useState(false)
  const [invForm, setInvForm] = useState({ client_name: '', client_email: '', client_phone: '', lead_id: '', pillar: '', service: '', due_date: '', notes: '', tax_rate: '0' })
  const [invItems, setInvItems] = useState<InvoiceItem[]>([{ description: '', qty: 1, rate: 0, amount: 0 }])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load leads
  const loadLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (stageFilter !== 'all') params.set('stage', stageFilter)
      if (sourceFilter !== 'all') params.set('source', sourceFilter)
      if (pillarFilter !== 'all') params.set('pillar', pillarFilter)
      if (segmentFilter !== 'all') params.set('segment', segmentFilter)
      if (search) params.set('q', search)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      const res = await fetch(`/api/admin/crm/leads?${params}`)
      const d = res.ok ? await res.json() : {}
      setLeads(d.leads || [])
      setStageCounts(d.stageCounts || {})
      setBySource(d.bySource || {})
    } catch {} finally { setLoading(false) }
  }, [stageFilter, sourceFilter, pillarFilter, segmentFilter, search, dateFrom, dateTo])

  const loadClients = useCallback(async () => {
    const res = await fetch('/api/admin/crm/clients')
    const d = res.ok ? await res.json() : {}
    setClients(d.clients || [])
  }, [])

  const loadInvoices = useCallback(async () => {
    const params = new URLSearchParams({ action: 'list' })
    if (invStatusFilter !== 'all') params.set('status', invStatusFilter)
    if (invPillarFilter !== 'all') params.set('pillar', invPillarFilter)
    if (invDateFrom) params.set('from', invDateFrom)
    if (invDateTo) params.set('to', invDateTo)
    const res = await fetch(`/api/admin/crm/invoices?${params}`)
    const d = res.ok ? await res.json() : {}
    setInvoices(d.invoices || [])
    if (d.summary) setInvSummary(d.summary)
  }, [invStatusFilter, invPillarFilter, invDateFrom, invDateTo])

  useEffect(() => {
    if (activeTab === 'leads') loadLeads()
    if (activeTab === 'clients') loadClients()
    if (activeTab === 'invoices' || activeTab === 'reports') loadInvoices()
  }, [activeTab, loadLeads, loadClients, loadInvoices])

  // Load lead detail when selected
  const loadLeadDetail = useCallback(async (id: number) => {
    const res = await fetch(`/api/admin/crm/leads?id=${id}`)
    const d = res.ok ? await res.json() : {}
    setLeadDetail(d)
  }, [])

  useEffect(() => {
    if (selectedLead) loadLeadDetail(selectedLead.id)
  }, [selectedLead, loadLeadDetail])

  const createLead = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/admin/crm/leads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newLead, expected_value: newLead.expected_value ? Number(newLead.expected_value) : null }),
    })
    if (res.status === 409) {
      const d = await res.json()
      alert(`⚠️ ${d.error}`)
    } else if (res.ok) {
      setShowNewLead(false)
      setNewLead({ name: '', email: '', phone: '', source: 'website', stage: 'new', expected_value: '', notes: '', next_followup: '', pillar: '', segment: 'student', service_interest: '' })
      loadLeads()
    }
    setSaving(false)
  }

  const updateLeadStage = async (id: number, stage: string) => {
    setUpdatingLead(id)
    await fetch('/api/admin/crm/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, stage }) })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
    if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, stage } : null)
    setUpdatingLead(null)
  }

  const addFollowupLog = async () => {
    if (!selectedLead || !followupNote) return
    setSaving(true)
    await fetch('/api/admin/crm/leads', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedLead.id, followup_note: followupNote, followup_type: followupType, next_followup: nextFollowup || null }),
    })
    await loadLeadDetail(selectedLead.id)
    setFollowupNote(''); setNextFollowup('')
    setSaving(false)
  }

  // Invoice CRUD
  const calcInvItems = (items: InvoiceItem[]) => items.map(i => ({ ...i, amount: i.qty * i.rate }))

  const createInvoice = async () => {
    if (!invForm.client_name) return
    setSaving(true)
    const items = calcInvItems(invItems).filter(i => i.description)
    const res = await fetch('/api/admin/crm/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...invForm, items, lead_id: invForm.lead_id ? Number(invForm.lead_id) : null, tax_rate: Number(invForm.tax_rate) || 0 }),
    })
    if (res.ok) {
      setShowInvForm(false)
      setInvForm({ client_name: '', client_email: '', client_phone: '', lead_id: '', pillar: '', service: '', due_date: '', notes: '', tax_rate: '0' })
      setInvItems([{ description: '', qty: 1, rate: 0, amount: 0 }])
      loadInvoices()
    }
    setSaving(false)
  }

  const updateInvStatus = async (id: number, status: string) => {
    await fetch('/api/admin/crm/invoices', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    if (selectedInvoice?.id === id) setSelectedInvoice(prev => prev ? { ...prev, status } : null)
    loadInvoices()
  }

  const deleteInvoice = async (id: number) => {
    if (!confirm('Delete this invoice?')) return
    await fetch('/api/admin/crm/invoices', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setInvoices(prev => prev.filter(i => i.id !== id))
    loadInvoices()
  }

  const printInvoice = (inv: Invoice) => {
    const items = inv.items || []
    const html = `
      <html><head><title>Invoice ${inv.invoice_number}</title>
      <style>body{font-family:sans-serif;padding:32px;color:#1B3A6B}h1{font-size:24px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #e5e7eb;padding:8px;text-align:left}th{background:#f1f5f9}.total{font-size:18px;font-weight:bold;color:#10B981}</style>
      </head><body>
      <h1>Invoice ${inv.invoice_number}</h1>
      <p><b>Client:</b> ${inv.client_name} ${inv.client_email ? `&lt;${inv.client_email}&gt;` : ''}</p>
      <p><b>Pillar:</b> ${inv.pillar || '—'} | <b>Service:</b> ${inv.service || '—'}</p>
      <p><b>Status:</b> ${inv.status} | <b>Due:</b> ${inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</p>
      <table><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
      ${items.map(i => `<tr><td>${i.description}</td><td>${i.qty}</td><td>₹${i.rate.toLocaleString('en-IN')}</td><td>₹${i.amount.toLocaleString('en-IN')}</td></tr>`).join('')}
      </table>
      <p class="total">Total: ₹${inv.total_amount.toLocaleString('en-IN')}</p>
      ${inv.notes ? `<p><b>Notes:</b> ${inv.notes}</p>` : ''}
      <script>window.print()</script></body></html>
    `
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  const sendBulkMessage = async () => {
    if (!bulkMsg.message) return
    setSaving(true)
    const targetClients = clients.filter(c => bulkMsg.segment === 'all' || c.segment === bulkMsg.segment)
    await fetch('/api/admin/crm/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...bulkMsg, recipient_count: targetClients.length }) }).catch(() => {})
    alert(`✅ Message logged for ${targetClients.length} client(s). Integration with WhatsApp/Email dispatch needed.`)
    setShowBulkMsg(false)
    setBulkMsg({ segment: 'all', channel: 'whatsapp', subject: '', message: '' })
    setSaving(false)
  }

  // Derived
  const filteredLeads = leads.filter(l =>
    (stageFilter === 'all' || l.stage === stageFilter) &&
    (sourceFilter === 'all' || l.source === sourceFilter) &&
    (pillarFilter === 'all' || l.pillar === pillarFilter) &&
    (search === '' || l.name.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search))
  )
  const todayFollowUps = leads.filter(l => l.next_followup && new Date(l.next_followup).toDateString() === new Date().toDateString())
  const overdueFollowUps = leads.filter(l => l.next_followup && new Date(l.next_followup) < new Date() && !['won','lost'].includes(l.stage))
  const phoneGroups: Record<string, Lead[]> = {}
  leads.forEach(l => { if (l.phone) { if (!phoneGroups[l.phone]) phoneGroups[l.phone] = []; phoneGroups[l.phone].push(l) } })
  const duplicates = Object.values(phoneGroups).filter(g => g.length > 1).flat()
  const overdueInvoices = invoices.filter(i => i.status === 'sent' && i.due_date && new Date(i.due_date) < new Date())

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy font-heading">🔗 CRM — Customer Relations</h1>
        <p className="text-slate-500 text-sm">Leads · Clients · Invoices · Revenue Reports · Segments</p>
      </div>

      {/* Alert strip */}
      {(todayFollowUps.length > 0 || overdueFollowUps.length > 0 || overdueInvoices.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {todayFollowUps.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('leads')}>
              <span className="text-xl">📞</span>
              <div><p className="font-bold text-blue-700 text-sm">{todayFollowUps.length} follow-up(s) today</p><p className="text-xs text-blue-500 truncate">{todayFollowUps.map(l => l.name).join(', ')}</p></div>
            </div>
          )}
          {overdueFollowUps.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('leads')}>
              <span className="text-xl">⚠️</span>
              <div><p className="font-bold text-red-700 text-sm">{overdueFollowUps.length} overdue follow-up(s)</p><p className="text-xs text-red-500 truncate">{overdueFollowUps.map(l => l.name).join(', ')}</p></div>
            </div>
          )}
          {overdueInvoices.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('invoices')}>
              <span className="text-xl">🧾</span>
              <div><p className="font-bold text-amber-700 text-sm">{overdueInvoices.length} invoice(s) overdue</p><p className="text-xs text-amber-500">Click to manage</p></div>
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

      {/* ── LEADS ── */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          {/* Stage stats */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {STAGES.map(s => {
              const count = stageCounts[s] || 0
              const cfg = STAGE_CFG[s]
              return (
                <button key={s} onClick={() => setStageFilter(stageFilter === s ? 'all' : s)}
                  className={`bg-white rounded-xl p-3 border text-center cursor-pointer transition-all hover:shadow-md ${stageFilter === s ? 'border-navy shadow-md' : 'border-slate-100 shadow-sm'}`}>
                  <p className="text-lg font-extrabold" style={{ color: cfg.color }}>{count}</p>
                  <p className="text-[9px] text-slate-400">{cfg.label}</p>
                </button>
              )
            })}
          </div>

          {Object.values(phoneGroups).filter(g => g.length > 1).map((group, idx) => (
            <div key={idx} className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-amber-800">⚠️ Duplicate Leads Detected (Phone: {group[0].phone})</span>
                <button 
                  onClick={async () => {
                    const primary = group[0];
                    const dupes = group.slice(1).map(l => l.id);
                    if (!confirm(`Merge ${dupes.length} duplicates into primary lead "${primary.name}"? This action cannot be undone.`)) return;
                    setSaving(true);
                    await fetch('/api/admin/crm/leads/merge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ primaryId: primary.id, duplicateIds: dupes }) });
                    alert('Leads merged section successfully.');
                    loadLeads();
                    setSaving(false);
                  }}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-amber-700 transition"
                  disabled={saving}
                >
                  {saving ? 'Merging...' : `Merge into "${group[0].name}"`}
                </button>
              </div>
              <ul className="text-xs text-amber-700 list-disc ml-5 mt-1 space-y-1">
                {group.map((l, i) => (
                  <li key={l.id}>
                    {i === 0 ? '👑 Primary: ' : '➖ Duplicate: '} 
                    <strong>{l.name}</strong> ({l.email || 'no email'}) - ID: {l.id} - Source: {l.source} - Created: {new Date(l.created_at).toLocaleDateString('en-IN')}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search lead..." className="flex-1 min-w-40 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-navy" />
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none">
              <option value="all">All Sources</option>
              {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={pillarFilter} onChange={e => setPillarFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none">
              <option value="all">All Pillars</option>
              {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none">
              <option value="all">All Segments</option>
              {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none" />
            <button onClick={loadLeads} className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer hover:bg-slate-200">🔄 Refresh</button>
            <button onClick={() => setShowNewLead(v => !v)} className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#10B981' }}>+ Add Lead</button>
          </div>

          {/* New Lead Form */}
          <AnimatePresence>
            {showNewLead && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-navy font-heading mb-4">+ New Lead</h3>
                <form onSubmit={createLead} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <input required value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} placeholder="Full name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} placeholder="Phone *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <select value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                  <select value={newLead.stage} onChange={e => setNewLead(p => ({ ...p, stage: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_CFG[s].label}</option>)}
                  </select>
                  <select value={newLead.segment} onChange={e => setNewLead(p => ({ ...p, segment: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={newLead.pillar} onChange={e => setNewLead(p => ({ ...p, pillar: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    <option value="">Auto-assign pillar from source</option>
                    {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input value={newLead.service_interest} onChange={e => setNewLead(p => ({ ...p, service_interest: e.target.value }))} placeholder="Service interest" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="number" value={newLead.expected_value} onChange={e => setNewLead(p => ({ ...p, expected_value: e.target.value }))} placeholder="Expected value (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Follow-up date</label>
                    <input type="date" value={newLead.next_followup} onChange={e => setNewLead(p => ({ ...p, next_followup: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  </div>
                  <textarea value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" rows={1} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                  <div className="col-span-3 flex gap-3">
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
                  {['Lead','Contact','Source / Pillar','Stage','Value','Score','Follow-up','Stage Action'].map(h => <th key={h} className="px-3 py-3 text-left font-bold text-slate-400 uppercase text-[10px] whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={8} className="p-3"><div className="h-10 bg-slate-100 rounded animate-pulse" /></td></tr>) :
                    filteredLeads.length === 0 ? <tr><td colSpan={8} className="p-10 text-center text-slate-400">No leads found</td></tr> :
                    filteredLeads.map(lead => {
                      const sc = STAGE_CFG[lead.stage] || STAGE_CFG.new
                      const isDup = duplicates.some(d => d.id === lead.id)
                      const isToday = lead.next_followup && new Date(lead.next_followup).toDateString() === new Date().toDateString()
                      const isOverdue = lead.next_followup && new Date(lead.next_followup) < new Date() && !['won','lost'].includes(lead.stage)
                      return (
                        <tr key={lead.id} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${isDup ? 'bg-amber-50/40' : isToday ? 'bg-blue-50/40' : ''}`}>
                          <td className="px-3 py-3">
                            <button onClick={() => setSelectedLead(lead)} className="text-left group cursor-pointer">
                              <p className="font-bold text-navy group-hover:text-accent transition-colors">{lead.name} {isDup && '⚠️'}</p>
                              <p className="text-[10px] text-slate-400">{new Date(lead.created_at).toLocaleDateString('en-IN')}</p>
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-slate-500">{lead.phone}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{lead.email}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize block w-fit mb-0.5">{lead.source?.replace(/_/g, ' ')}</span>
                            {lead.pillar && <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 capitalize text-[9px] font-bold">{lead.pillar}</span>}
                          </td>
                          <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap" style={{ background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span></td>
                          <td className="px-3 py-3 font-bold text-navy">{lead.expected_value ? `₹${Number(lead.expected_value).toLocaleString('en-IN')}` : '—'}</td>
                          <td className="px-3 py-3"><LeadScore lead={lead} /></td>
                          <td className="px-3 py-3">
                            {lead.next_followup ? (
                              <span className={`font-bold text-[10px] ${isToday ? 'text-blue-600' : isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                {isOverdue && !isToday ? '⚠️ ' : isToday ? '📞 ' : ''}{new Date(lead.next_followup).toLocaleDateString('en-IN')}
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-3">
                            {updatingLead === lead.id ? <div className="w-4 h-4 border-2 border-navy/20 border-t-navy rounded-full animate-spin" /> : (
                              <select value={lead.stage} onChange={e => updateLeadStage(lead.id, e.target.value)} className="text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none cursor-pointer">
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

      {/* ── CLIENTS ── */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['all', ...SEGMENTS].map(seg => {
              const count = seg === 'all' ? clients.length : clients.filter(c => c.segment === seg).length
              const revenue = (seg === 'all' ? clients : clients.filter(c => c.segment === seg)).reduce((a, c) => a + c.totalRevenue, 0)
              return (
                <button key={seg} onClick={() => setClientSegFilter(clientSegFilter === seg ? 'all' : seg)}
                  className={`bg-white rounded-xl p-3 border text-center cursor-pointer transition-all hover:shadow-md ${clientSegFilter === seg ? 'border-navy shadow-md' : 'border-slate-100 shadow-sm'}`}>
                  <p className="text-lg font-extrabold text-navy">{count}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{seg}</p>
                  <p className="text-[9px] text-slate-300">₹{revenue.toLocaleString('en-IN')}</p>
                </button>
              )
            })}
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="🔍 Search clients..." className="flex-1 min-w-40 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none" />
            <button onClick={() => setShowBulkMsg(v => !v)} className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#8B5CF6' }}>📢 Bulk Message</button>
          </div>

          {/* Bulk message form */}
          <AnimatePresence>
            {showBulkMsg && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-4">📢 Send Bulk Message to Clients</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <select value={bulkMsg.segment} onChange={e => setBulkMsg(p => ({ ...p, segment: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    <option value="all">All Clients ({clients.length})</option>
                    {SEGMENTS.map(s => <option key={s} value={s}>{s} ({clients.filter(c => c.segment === s).length})</option>)}
                  </select>
                  <select value={bulkMsg.channel} onChange={e => setBulkMsg(p => ({ ...p, channel: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="email">📧 Email</option>
                  </select>
                  {bulkMsg.channel === 'email' && <input value={bulkMsg.subject} onChange={e => setBulkMsg(p => ({ ...p, subject: e.target.value }))} placeholder="Email subject" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />}
                  <textarea value={bulkMsg.message} onChange={e => setBulkMsg(p => ({ ...p, message: e.target.value }))} placeholder="Message content *" rows={3} className="col-span-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                </div>
                <div className="flex gap-3 mt-3">
                  <button onClick={sendBulkMessage} disabled={saving || !bulkMsg.message} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60" style={{ background: '#8B5CF6' }}>📤 Send to {bulkMsg.segment === 'all' ? clients.length : clients.filter(c => c.segment === bulkMsg.segment).length} client(s)</button>
                  <button onClick={() => setShowBulkMsg(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clients table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {['Client','Contact','Segment','Revenue','Projects','Member Since','Actions'].map(h => <th key={h} className="px-3 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}
                </tr></thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={7} className="p-3"><div className="h-10 bg-slate-100 rounded animate-pulse" /></td></tr>) :
                    clients.filter(c => {
                      const matchSeg = clientSegFilter === 'all' || c.segment === clientSegFilter
                      const matchSearch = !clientSearch || c.fullname.toLowerCase().includes(clientSearch.toLowerCase()) || c.email?.includes(clientSearch) || c.phone?.includes(clientSearch)
                      return matchSeg && matchSearch
                    }).map(client => {
                      const isHighValue = client.totalRevenue > 500000
                      const renewalAlert = new Date(client.created_at).getTime() < Date.now() - 180 * 86400000 && client.totalProjects > 0
                      return (
                        <tr key={client.id} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${renewalAlert ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-3 py-3">
                            <button onClick={() => setSelectedClient(client)} className="flex items-center gap-2 cursor-pointer group">
                              <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center font-bold text-navy text-sm">{client.fullname[0]}</div>
                              <div>
                                <p className="font-bold text-navy group-hover:text-accent">{client.fullname}</p>
                                {renewalAlert && <p className="text-[9px] text-amber-500 font-bold">🔄 Renewal opportunity</p>}
                              </div>
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-slate-500">{client.phone || '—'}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{client.email}</p>
                          </td>
                          <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 capitalize">{client.segment || '—'}</span></td>
                          <td className="px-3 py-3"><span className={`font-bold ${isHighValue ? 'text-green-600' : 'text-navy'}`}>₹{client.totalRevenue.toLocaleString('en-IN')}</span></td>
                          <td className="px-3 py-3 font-bold text-navy text-center">{client.totalProjects}</td>
                          <td className="px-3 py-3 text-slate-400">{new Date(client.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1">
                              <a href={`mailto:${client.email}`} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer">✉️</a>
                              {client.phone && <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="px-2 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer">💬</a>}
                              <button onClick={() => { setInvForm(p => ({ ...p, client_name: client.fullname, client_email: client.email, client_phone: client.phone || '' })); setActiveTab('invoices'); setShowInvForm(true) }}
                                className="px-2 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 cursor-pointer">🧾</button>
                            </div>
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

      {/* ── INVOICES ── */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '💰', label: 'Total Paid', value: `₹${invSummary.totalRevenue.toLocaleString('en-IN')}`, color: '#10B981' },
              { icon: '⏳', label: 'Outstanding', value: `₹${invSummary.pendingRevenue.toLocaleString('en-IN')}`, color: '#F59E0B' },
              { icon: '⚠️', label: 'Overdue', value: invSummary.overdueCount.toString(), color: '#EF4444' },
              { icon: '📋', label: 'Total Invoices', value: invoices.length.toString(), color: '#3B82F6' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <span className="text-2xl block mb-2">{s.icon}</span>
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters + actions */}
          <div className="flex gap-2 flex-wrap items-center">
            <select value={invStatusFilter} onChange={e => setInvStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none">
              <option value="all">All Status</option>
              {Object.entries(INV_STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={invPillarFilter} onChange={e => setInvPillarFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none">
              <option value="all">All Pillars</option>
              {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="date" value={invDateFrom} onChange={e => setInvDateFrom(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none" />
            <input type="date" value={invDateTo} onChange={e => setInvDateTo(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none" />
            <button onClick={loadInvoices} className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer">🔄</button>
            <button onClick={() => setShowInvForm(v => !v)} className="ml-auto px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#1B3A6B' }}>+ Create Invoice</button>
          </div>

          {/* Invoice form */}
          <AnimatePresence>
            {showInvForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md">
                <h3 className="font-bold text-navy font-heading mb-4">🧾 Create Invoice</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <input value={invForm.client_name} onChange={e => setInvForm(p => ({ ...p, client_name: e.target.value }))} placeholder="Client name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={invForm.client_email} onChange={e => setInvForm(p => ({ ...p, client_email: e.target.value }))} placeholder="Client email" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={invForm.client_phone} onChange={e => setInvForm(p => ({ ...p, client_phone: e.target.value }))} placeholder="Client phone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <select value={invForm.pillar} onChange={e => setInvForm(p => ({ ...p, pillar: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    <option value="">— Pillar (optional) —</option>
                    {PILLARS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                  </select>
                  <input value={invForm.service} onChange={e => setInvForm(p => ({ ...p, service: e.target.value }))} placeholder="Service / product" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="date" value={invForm.due_date} onChange={e => setInvForm(p => ({ ...p, due_date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="number" value={invForm.tax_rate} onChange={e => setInvForm(p => ({ ...p, tax_rate: e.target.value }))} placeholder="Tax rate (%)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                </div>

                {/* Line items */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2"><p className="text-xs font-bold text-slate-400 uppercase">Line Items</p><button type="button" onClick={() => setInvItems(p => [...p, { description: '', qty: 1, rate: 0, amount: 0 }])} className="text-xs text-blue-500 font-bold cursor-pointer">+ Add Line</button></div>
                  <div className="space-y-2">
                    {invItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2 items-center">
                        <input value={item.description} onChange={e => { const n = [...invItems]; n[i] = { ...n[i], description: e.target.value }; setInvItems(n) }} placeholder="Description" className="col-span-2 px-2 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none" />
                        <input type="number" value={item.qty} onChange={e => { const n = [...invItems]; n[i] = { ...n[i], qty: Number(e.target.value), amount: Number(e.target.value) * n[i].rate }; setInvItems(n) }} placeholder="Qty" className="px-2 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none" />
                        <input type="number" value={item.rate} onChange={e => { const n = [...invItems]; n[i] = { ...n[i], rate: Number(e.target.value), amount: n[i].qty * Number(e.target.value) }; setInvItems(n) }} placeholder="Rate" className="px-2 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none" />
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-navy">₹{(item.qty * item.rate).toLocaleString('en-IN')}</span>
                          {invItems.length > 1 && <button type="button" onClick={() => setInvItems(p => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 cursor-pointer text-xs ml-auto">✕</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-2 text-sm">
                    <div className="text-right space-y-0.5">
                      <p className="text-slate-500">Subtotal: <span className="font-bold text-navy">₹{invItems.reduce((a, i) => a + i.qty * i.rate, 0).toLocaleString('en-IN')}</span></p>
                      {Number(invForm.tax_rate) > 0 && <p className="text-slate-500">Tax ({invForm.tax_rate}%): <span className="font-bold text-navy">₹{(invItems.reduce((a, i) => a + i.qty * i.rate, 0) * Number(invForm.tax_rate) / 100).toLocaleString('en-IN')}</span></p>}
                      <p className="text-lg font-extrabold text-navy">Total: ₹{(invItems.reduce((a, i) => a + i.qty * i.rate, 0) * (1 + Number(invForm.tax_rate) / 100)).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                <textarea value={invForm.notes} onChange={e => setInvForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes / terms" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none mb-4" />
                <div className="flex gap-3">
                  <button onClick={createInvoice} disabled={saving || !invForm.client_name} className="px-6 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60" style={{ background: '#1B3A6B' }}>{saving ? '⏳' : '🧾 Create Invoice'}</button>
                  <button onClick={() => setShowInvForm(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Invoices table */}
          {invoices.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-slate-100"><span className="text-5xl block mb-3">🧾</span><p className="text-slate-400 text-sm">No invoices yet</p></div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead><tr className="bg-slate-50 border-b border-slate-100">{['Invoice #','Client','Pillar','Total','Status','Due Date','Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
                <tbody>
                  {invoices.map(inv => {
                    const isOverdue = inv.status === 'sent' && inv.due_date && new Date(inv.due_date) < new Date()
                    return (
                      <tr key={inv.id} className={`border-b border-slate-50 hover:bg-slate-50/60 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 font-bold text-navy cursor-pointer hover:text-accent" onClick={() => setSelectedInvoice(inv)}>{inv.invoice_number}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-navy">{inv.client_name}</p>
                          {inv.client_email && <p className="text-[10px] text-slate-400">{inv.client_email}</p>}
                        </td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 capitalize">{inv.pillar || '—'}</span></td>
                        <td className="px-4 py-3 font-bold text-navy">₹{inv.total_amount?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3"><Badge status={inv.status} cfg={INV_STATUS_CFG} /></td>
                        <td className="px-4 py-3"><span className={isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'} {isOverdue && '⚠️'}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {inv.status === 'draft' && <button onClick={() => updateInvStatus(inv.id, 'sent')} className="px-2 py-1 rounded-lg bg-blue-100 text-blue-600 font-bold text-[10px] cursor-pointer">📤 Send</button>}
                            {['draft','sent'].includes(inv.status) && <button onClick={() => updateInvStatus(inv.id, 'paid')} className="px-2 py-1 rounded-lg bg-green-100 text-green-600 font-bold text-[10px] cursor-pointer">✅ Paid</button>}
                            {inv.status === 'sent' && isOverdue && <button onClick={() => updateInvStatus(inv.id, 'overdue')} className="px-2 py-1 rounded-lg bg-red-100 text-red-500 font-bold text-[10px] cursor-pointer">⚠️ Mark Overdue</button>}
                            <button onClick={() => printInvoice(inv)} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 font-bold text-[10px] cursor-pointer">🖨️</button>
                            <button onClick={() => deleteInvoice(inv.id)} className="px-2 py-1 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 font-bold text-[10px] cursor-pointer">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── REPORTS ── */}
      {activeTab === 'reports' && (
        <div className="space-y-5">
          {/* Date range filter */}
          <div className="flex gap-3 items-center flex-wrap bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-sm font-bold text-navy">📊 Custom Report Range</p>
            <input type="date" value={invDateFrom} onChange={e => setInvDateFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            <span className="text-slate-400 text-sm">→</span>
            <input type="date" value={invDateTo} onChange={e => setInvDateTo(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            <button onClick={loadInvoices} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">Apply Filter</button>
            <button onClick={() => { setInvDateFrom(''); setInvDateTo(''); loadInvoices() }} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer">Reset</button>
            <button onClick={() => window.print()} className="ml-auto px-4 py-2 rounded-xl font-bold text-white text-xs cursor-pointer hover:opacity-90" style={{ background: '#FF6B35' }}>🖨️ Export PDF</button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '💰', label: 'Revenue Collected', value: `₹${invSummary.totalRevenue.toLocaleString('en-IN')}`, color: '#10B981' },
              { icon: '⏳', label: 'Pending Collection', value: `₹${invSummary.pendingRevenue.toLocaleString('en-IN')}`, color: '#F59E0B' },
              { icon: '🏆', label: 'Won Leads', value: leads.filter(l => l.stage === 'won').length.toString(), color: '#8B5CF6' },
              { icon: '📈', label: 'Conversion Rate', value: leads.length > 0 ? `${((leads.filter(l => l.stage === 'won').length / leads.length) * 100).toFixed(1)}%` : '0%', color: '#3B82F6' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <span className="text-2xl block mb-2">{s.icon}</span>
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Revenue by Pillar */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-5">💰 Revenue by Pillar</h3>
              {Object.keys(invSummary.byPillar).length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No paid invoices yet</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(invSummary.byPillar).sort((a, b) => b[1] - a[1]).map(([pillar, amount]) => {
                    const total = Object.values(invSummary.byPillar).reduce((a, b) => a + b, 0)
                    const pct = total > 0 ? (amount / total * 100) : 0
                    const colors: Record<string, string> = { calling: '#10B981', campus: '#3B82F6', digital: '#E1306C', government: '#1B3A6B', market: '#F59E0B', operations: '#8B5CF6' }
                    return (
                      <div key={pillar}>
                        <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-600 capitalize">{pillar}</span><span className="font-bold text-navy">₹{amount.toLocaleString('en-IN')} ({pct.toFixed(0)}%)</span></div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full" style={{ background: colors[pillar] || '#6B7280' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Lead Pipeline value */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-5">🎯 Pipeline Value by Stage</h3>
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
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(value / maxValue) * 100}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: cfg.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Lead source breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-5">🎯 Leads by Source</h3>
              {Object.keys(bySource).length === 0 ? <p className="text-slate-400 text-sm text-center py-6">No leads yet</p> : (
                <div className="space-y-3">
                  {Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([src, count]) => {
                    const total = Object.values(bySource).reduce((a, b) => a + b, 0)
                    const pct = total > 0 ? (count / total * 100) : 0
                    return (
                      <div key={src}>
                        <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-600 capitalize">{src.replace(/_/g, ' ')}</span><span className="font-bold text-navy">{count} ({pct.toFixed(0)}%)</span></div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Monthly revenue */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-5">📅 Monthly Revenue Trend</h3>
              {Object.keys(invSummary.monthly).length === 0 ? <p className="text-slate-400 text-sm text-center py-6">No paid invoices yet</p> : (
                <div className="space-y-2">
                  {Object.entries(invSummary.monthly).sort().slice(-6).map(([month, amount]) => {
                    const max = Math.max(...Object.values(invSummary.monthly))
                    const pct = max > 0 ? (amount / max * 100) : 0
                    return (
                      <div key={month} className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 w-14 shrink-0">{month}</span>
                        <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-lg bg-navy flex items-center pl-2">
                            <span className="text-white text-[9px] font-bold whitespace-nowrap">₹{amount.toLocaleString('en-IN')}</span>
                          </motion.div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Conversion analysis */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-4">📈 Conversion Rate Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Leads', value: leads.length, color: '#6B7280' },
                { label: 'Contacted', value: leads.filter(l => ['contacted','interested','proposal','won'].includes(l.stage)).length, color: '#3B82F6' },
                { label: 'Active Pipeline', value: leads.filter(l => ['interested','proposal'].includes(l.stage)).length, color: '#F59E0B' },
                { label: 'Won', value: leads.filter(l => l.stage === 'won').length, color: '#10B981' },
              ].map(s => (
                <div key={s.label} className="text-center p-4 rounded-xl bg-slate-50">
                  <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                  {leads.length > 0 && <p className="text-[10px] font-bold mt-0.5" style={{ color: s.color }}>{((s.value / leads.length) * 100).toFixed(1)}%</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Lead Drawer ── */}
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
                <div className="w-14 h-14 rounded-2xl bg-navy/10 flex items-center justify-center font-bold text-navy text-2xl">{selectedLead.name[0]}</div>
                <div>
                  <p className="font-bold text-navy text-lg">{selectedLead.name}</p>
                  <LeadScore lead={selectedLead} />
                  {selectedLead.pillar && <span className="mt-0.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 text-[9px] font-bold capitalize block w-fit">{selectedLead.pillar} pillar</span>}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-5">
                {[
                  { label: 'Phone', value: selectedLead.phone },
                  { label: 'Email', value: selectedLead.email },
                  { label: 'Source', value: selectedLead.source?.replace(/_/g, ' ') },
                  { label: 'Segment', value: selectedLead.segment },
                  { label: 'Service Interest', value: selectedLead.service_interest },
                  { label: 'Expected Value', value: selectedLead.expected_value ? `₹${Number(selectedLead.expected_value).toLocaleString('en-IN')}` : '—' },
                  { label: 'Next Follow-up', value: selectedLead.next_followup ? new Date(selectedLead.next_followup).toLocaleDateString('en-IN') : '—' },
                  { label: 'Added', value: new Date(selectedLead.created_at).toLocaleDateString('en-IN') },
                ].map(r => (
                  <div key={r.label} className="flex justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-xs text-slate-400">{r.label}</span>
                    <span className="text-xs font-semibold text-navy capitalize">{r.value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Stage update */}
              <div className="mb-5">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Update Stage</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {STAGES.map(s => {
                    const cfg = STAGE_CFG[s]
                    return (
                      <button key={s} onClick={() => updateLeadStage(selectedLead.id, s)}
                        className="flex items-center gap-1.5 px-2 py-2 rounded-xl cursor-pointer border text-xs font-medium transition-all"
                        style={{ borderColor: selectedLead.stage === s ? cfg.color : '#E5E7EB', background: selectedLead.stage === s ? cfg.bg : '#F9FAFB', color: selectedLead.stage === s ? cfg.color : '#374151' }}>
                        <span>{cfg.icon}</span><span>{cfg.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Follow-up log */}
              <div className="mb-5">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Add Follow-up Note</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select value={followupType} onChange={e => setFollowupType(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none">
                      {['call','email','whatsapp','meeting','note'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="date" value={nextFollowup} onChange={e => setNextFollowup(e.target.value)} className="flex-1 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none" placeholder="Next follow-up date" />
                  </div>
                  <textarea value={followupNote} onChange={e => setFollowupNote(e.target.value)} placeholder="Add a note..." rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none resize-none" />
                  <button onClick={addFollowupLog} disabled={saving || !followupNote} className="w-full py-2 rounded-xl font-bold text-white text-xs cursor-pointer disabled:opacity-60" style={{ background: '#1B3A6B' }}>{saving ? '⏳' : '💬 Add Note'}</button>
                </div>
              </div>

              {/* Follow-up history */}
              {leadDetail?.followupLogs && leadDetail.followupLogs.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Follow-up History</p>
                  <div className="space-y-2">
                    {leadDetail.followupLogs.map(log => (
                      <div key={log.id} className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 capitalize">{log.note_type}</span>
                          <span className="text-[9px] text-slate-400">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                          {log.creator && <span className="text-[9px] text-slate-400">by {log.creator.fullname}</span>}
                        </div>
                        <p className="text-xs text-slate-600">{log.note}</p>
                        {log.next_followup && <p className="text-[9px] text-blue-500 mt-1">📅 Next: {new Date(log.next_followup).toLocaleDateString('en-IN')}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Invoice detail drawer ── */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end" onClick={() => setSelectedInvoice(null)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-navy text-lg font-heading">{selectedInvoice.invoice_number}</h2>
                  <Badge status={selectedInvoice.status} cfg={INV_STATUS_CFG} />
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200">✕</button>
              </div>

              <div className="space-y-2 mb-5">
                {[
                  { label: 'Client', value: selectedInvoice.client_name },
                  { label: 'Email', value: selectedInvoice.client_email },
                  { label: 'Pillar', value: selectedInvoice.pillar },
                  { label: 'Service', value: selectedInvoice.service },
                  { label: 'Due Date', value: selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString('en-IN') : '—' },
                  { label: 'Paid Date', value: selectedInvoice.paid_date ? new Date(selectedInvoice.paid_date).toLocaleDateString('en-IN') : '—' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-xs text-slate-400">{r.label}</span>
                    <span className="text-xs font-semibold text-navy capitalize">{r.value || '—'}</span>
                  </div>
                ))}
              </div>

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Line Items</p>
                  <table className="w-full text-xs border border-slate-100 rounded-xl overflow-hidden">
                    <thead><tr className="bg-slate-50">{['Description','Qty','Rate','Amount'].map(h => <th key={h} className="px-2 py-2 text-left text-slate-400 font-bold">{h}</th>)}</tr></thead>
                    <tbody>
                      {selectedInvoice.items.map((item, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-2 py-2 text-navy">{item.description}</td>
                          <td className="px-2 py-2">{item.qty}</td>
                          <td className="px-2 py-2">₹{item.rate?.toLocaleString('en-IN')}</td>
                          <td className="px-2 py-2 font-bold text-navy">₹{item.amount?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end mt-2">
                    <p className="text-lg font-extrabold text-navy">Total: ₹{selectedInvoice.total_amount?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedInvoice.status === 'draft' && <button onClick={() => { updateInvStatus(selectedInvoice.id, 'sent'); setSelectedInvoice(p => p ? { ...p, status: 'sent' } : p) }} className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs cursor-pointer">📤 Mark Sent</button>}
                {['draft','sent','overdue'].includes(selectedInvoice.status) && <button onClick={() => { updateInvStatus(selectedInvoice.id, 'paid'); setSelectedInvoice(p => p ? { ...p, status: 'paid' } : p) }} className="px-4 py-2 rounded-xl bg-green-500 text-white font-bold text-xs cursor-pointer">✅ Mark Paid</button>}
                <button onClick={() => printInvoice(selectedInvoice)} className="px-4 py-2 rounded-xl bg-navy text-white font-bold text-xs cursor-pointer">🖨️ Print</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
