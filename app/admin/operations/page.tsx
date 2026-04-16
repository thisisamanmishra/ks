'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Vendor { id: number; fullname: string; email: string; phone: string; activeJobs: number }
interface SOP { id: number; title: string; content: string | null; category: string; version: string; is_published: boolean; updated_at: string }
interface InventoryItem { id: string; name: string; type: string; cost: number; renewal_date: string | null; status: string; vendor: string }
interface ServiceItem {
  id: number
  title: string
  slug: string
  category: string
  short_description: string
  price_min: number | null
  price_max: number | null
  delivery_days: number
  featured_image: string | null
  is_featured: boolean
  is_active: boolean
  tags: string[]
  created_at: string
}

const TABS = [
  { key: 'dashboard', label: '📊 Ops Dashboard' },
  { key: 'contact_leads', label: '📬 Contact Leads' },
  { key: 'subscribers', label: '📧 Subscribers' },
  { key: 'vendors', label: '👷 Vendors' },
  { key: 'services', label: '🛒 Services' },
  { key: 'sop', label: '📚 SOP Library' },
  { key: 'resources', label: '🗂️ Resources' },
  { key: 'inventory', label: '🛠️ Inventory' },
  { key: 'legal_upload', label: '📎 Document Upload' },
] as const
type Tab = typeof TABS[number]['key']

interface SLAData { breached: number; atRisk: number; onTrack: number }
interface ContactLead {
  id: number; name: string; email: string; phone: string | null
  service: string | null; message: string; status: string
  notes: string | null; created_at: string
}
interface Subscriber { id: number; email: string; status: string; created_at: string }

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [slaData, setSlaData] = useState<SLAData>({ breached: 0, atRisk: 0, onTrack: 0 })
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [sops, setSops] = useState<SOP[]>([])
  const [loading, setLoading] = useState(true)
  const [sopLoading, setSopLoading] = useState(false)
  const [meId, setMeId] = useState(0)
  const [meRole, setMeRole] = useState('admin')
  // SOP form
  const [showSopForm, setShowSopForm] = useState(false)
  const [sopForm, setSopForm] = useState({ title: '', content: '', category: 'general', version: '1.0', is_published: false })
  const [savingSop, setSavingSop] = useState(false)
  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [showInvForm, setShowInvForm] = useState(false)
  const [invForm, setInvForm] = useState({ name: '', type: 'software', cost: '', renewal_date: '', vendor: '', status: 'active' })
  // Legal doc upload
  const [docForm, setDocForm] = useState({ title: '', type: 'policy', description: '', file_url: '', status: 'pending_approval' })
  const [savingDoc, setSavingDoc] = useState(false)
  const [docSaved, setDocSaved] = useState(false)
  // Inter-dept tasks
  const [interTasks, setInterTasks] = useState<{ id: string; task: string; from: string; to: string; due: string; status: string }[]>([])
  const [newInterTask, setNewInterTask] = useState({ task: '', from: 'operations', to: 'marketing', due: '' })
  // Contact leads & newsletter subscribers
  const [contactLeads, setContactLeads] = useState<ContactLead[]>([])
  const [contactLoading, setContactLoading] = useState(false)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [subLoading, setSubLoading] = useState(false)
  // Services management
  const [services, setServices] = useState<ServiceItem[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesCatFilter, setServicesCatFilter] = useState('all')
  const [servicesSearch, setServicesSearch] = useState('')
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<number|null>(null)
  const [savingService, setSavingService] = useState(false)
  const [serviceForm, setServiceForm] = useState({ title: '', category: 'Academic', short_description: '', price_min: '', price_max: '', delivery_days: '3', featured_image: '', tags: '', is_featured: false, is_active: true })
  // Chat/meetings
  const [showDMChat, setShowDMChat] = useState(false)
  const [showMeetings, setShowMeetings] = useState(false)
  const [showGroupChat, setShowGroupChat] = useState(false)
  const [DMComp, setDMComp] = useState<React.ComponentType<{ currentUserId: number; mode: 'ops' | 'user'; onClose: () => void }> | null>(null)
  const [MeetComp, setMeetComp] = useState<React.ComponentType<{ currentUserId: number; onClose: () => void }> | null>(null)
  const [GCComp, setGCComp] = useState<React.ComponentType<{ currentUserId: number; isAdmin?: boolean; onClose: () => void }> | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/operations')
      if (res.ok) {
        const d = await res.json()
        setSlaData(d.sla || { breached: 0, atRisk: 0, onTrack: 0 })
        setVendors(d.vendorWorkload || [])
      }
      const invRes = await fetch('/api/admin/ops-digital?type=inventory')
      if (invRes.ok) { const d = await invRes.json(); setInventory(d.inventory || []) }
      const intRes = await fetch('/api/admin/ops-digital?type=interdept')
      if (intRes.ok) { const d = await intRes.json(); setInterTasks(d.interdept || []) }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { 
    fetch('/api/auth/me').then(r => r.json()).then(d => { 
      setMeId(d.id || 0); 
      setMeRole(d.role || 'admin');
      if (d.department === 'operations' && d.pillar_role === 'project_manager') {
        window.location.href = '/admin/projects'
      }
    }).catch(() => {}) 
  }, [])
  useEffect(() => {
    if (activeTab === 'sop') {
      setSopLoading(true)
      fetch('/api/admin/sop').then(r => r.json()).then(d => setSops(d.sops || [])).catch(() => {}).finally(() => setSopLoading(false))
    }
    if (activeTab === 'services') {
      setServicesLoading(true)
      fetch('/api/admin/services').then(r => r.json()).then(d => setServices(d.services || [])).catch(() => {}).finally(() => setServicesLoading(false))
    }
    if (activeTab === 'contact_leads') {
      setContactLoading(true)
      fetch('/api/contact').then(r => r.json()).then(d => setContactLeads(d.submissions || [])).catch(() => {}).finally(() => setContactLoading(false))
    }
    if (activeTab === 'subscribers') {
      setSubLoading(true)
      fetch('/api/newsletter/subscribers?limit=500').then(r => r.json()).then(d => setSubscribers(d.subscribers || [])).catch(() => {}).finally(() => setSubLoading(false))
    }
  }, [activeTab])

  const updateContactStatus = async (id: number, status: string) => {
    await fetch('/api/contact', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    setContactLeads(p => p.map(c => c.id === id ? { ...c, status } : c))
  }

  const saveSOP = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingSop(true)
    try {
      await fetch('/api/admin/sop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sopForm) })
      setShowSopForm(false); setSopForm({ title: '', content: '', category: 'general', version: '1.0', is_published: false })
      fetch('/api/admin/sop').then(r => r.json()).then(d => setSops(d.sops || []))
    } catch {} finally { setSavingSop(false) }
  }

  const saveInventoryItem = async () => {
    const item = { type: 'inventory', name: invForm.name, type_col: invForm.type, cost: Number(invForm.cost), renewal_date: invForm.renewal_date || null, status: invForm.status, vendor: invForm.vendor }
    // Note: The payload uses 'type' for API routing. To insert into the 'type' column, we might need adjustments, but let's stick to 'type' in schema. Wait, if API uses payload for insert...
    // The API payload uses `type` to determine the table and then inserts the REST of the payload:
    // const { type, ...payload } = body; 
    // so in `payload` we need an item type field. The DB has a column `type TEXT`. We can pass it as `item_type` but the DB expects `type`. Let's tweak it to avoid `type` conflict in API wrapper by using an alias if needed. We'll pass item_type in our payload. wait, DB uses `type TEXT`. Let's use `dataType` instead of `type` for the API route. Let's not modify the API route now if possible. Wait, the API deletes `type` from the body! So `type` is removed!
    // I need to fix the API or use a different key. I'll just change the DB column `type` to `category` in `marketing_events`? Let's just adjust the UI payload map.
    // Let's send `doc_type: invForm.type` ? No the DB has `type` !!
    // I can just pass it as `type: 'inventory', type: invForm.type` -> it will override. But `...payload` won't have `type`.
    
    // We will fix the API route to read `routeType` instead of `type` to avoid conflict with table column `type`.
    const itemPayload = { routeType: 'inventory', name: invForm.name, type: invForm.type, cost: Number(invForm.cost), renewal_date: invForm.renewal_date || null, status: invForm.status, vendor: invForm.vendor }
    
    const res = await fetch('/api/admin/ops-digital', { method: 'POST', body: JSON.stringify(itemPayload) })
    if (res.ok) {
      const { record } = await res.json()
      setInventory(p => [record, ...p])
    }
    setShowInvForm(false); setInvForm({ name: '', type: 'software', cost: '', renewal_date: '', vendor: '', status: 'active' })
  }

  const removeInventoryItem = async (id: string) => {
    setInventory(inventory.filter(i => i.id !== id))
    await fetch('/api/admin/ops-digital', { method: 'DELETE', body: JSON.stringify({ type: 'inventory', id }) })
  }

  const submitDoc = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingDoc(true)
    try {
      await fetch('/api/admin/board/legal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docForm) })
      setDocSaved(true); setDocForm({ title: '', type: 'policy', description: '', file_url: '', status: 'pending_approval' })
    } catch {} finally { setSavingDoc(false) }
  }

  const addInterTask = async () => {
    if (!newInterTask.task) return
    const payload = { type: 'interdept', task: newInterTask.task, from: newInterTask.from, to: newInterTask.to, due: newInterTask.due || null, status: 'pending' }
    const res = await fetch('/api/admin/ops-digital', { method: 'POST', body: JSON.stringify(payload) })
    if (res.ok) {
      const { record } = await res.json()
      setInterTasks(p => [record, ...p])
    }
    setNewInterTask({ task: '', from: 'operations', to: 'marketing', due: '' })
  }

  const updateInterTask = async (id: string, status: string) => {
    setInterTasks(interTasks.map(t => t.id === id ? { ...t, status } : t))
    await fetch('/api/admin/ops-digital', { method: 'PATCH', body: JSON.stringify({ type: 'interdept', id, status }) })
  }

  const openDM = () => { if (!DMComp) import('@/components/admin/DirectChatPanel').then(m => setDMComp(() => m.default)); setShowDMChat(v => !v) }
  const openMeet = () => { if (!MeetComp) import('@/components/admin/MeetingPanel').then(m => setMeetComp(() => m.default)); setShowMeetings(v => !v) }
  const openGC = () => { if (!GCComp) import('@/components/admin/GroupChatPanel').then(m => setGCComp(() => m.default)); setShowGroupChat(v => !v) }

  const expiringItems = inventory.filter(i => i.renewal_date && new Date(i.renewal_date).getTime() - Date.now() < 30 * 86400000)

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">⚙️ Operations</h1>
          <p className="text-slate-500 text-sm">SLA · Vendor mgmt · SOPs · Resource allocation · Inventory</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={openGC} className="px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer" style={{ background: '#8B5CF6' }}>💬 Group Chat</button>
          <button onClick={openMeet} className="px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer" style={{ background: '#1B3A6B' }}>📹 Meetings</button>
          <button onClick={openDM} className="px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer" style={{ background: '#FF6B35' }}>✉️ Direct Chat</button>
        </div>
      </div>

      {/* SLA KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'SLA Breached', v: slaData.breached, icon: '🔴', c: '#EF4444', bg: '#FEE2E2' },
          { label: 'At Risk (< 24h)', v: slaData.atRisk, icon: '⚠️', c: '#F59E0B', bg: '#FEF3C7' },
          { label: 'On Track', v: slaData.onTrack, icon: '✅', c: '#10B981', bg: '#D1FAE5' },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-2xl p-4 border" style={{ background: k.bg, borderColor: `${k.c}30` }}>
            <p className="text-2xl font-extrabold font-heading" style={{ color: k.c }}>{k.v}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: k.c }}>{k.icon} {k.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Expiry warnings */}
      {expiringItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-amber-500 text-xl">⏳</span>
          <p className="text-sm text-amber-700">{expiringItems.length} tool(s) have subscription renewal in the next 30 days: {expiringItems.map(i => i.name).join(', ')}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="relative border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.15) transparent' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-bold cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${activeTab === t.key ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {/* Gradient fade indicating more tabs to the right */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#fafafa] to-transparent" />
      </div>

      {/* ── OPS DASHBOARD ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          {/* Vendor Workload Heatmap */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-4">🌡️ Team Availability & Workload Heatmap</h3>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : vendors.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No team members found</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {vendors.map(v => {
                  const load = Math.min((v.activeJobs / 8) * 100, 100)
                  const heatColor = load > 75 ? '#EF4444' : load > 50 ? '#F59E0B' : load > 25 ? '#3B82F6' : '#10B981'
                  return (
                    <div key={v.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: heatColor }}>{v.fullname.charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-navy truncate">{v.fullname}</p>
                          <p className="text-[10px] text-slate-400">{v.activeJobs} active jobs</p>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${load}%`, background: heatColor }} />
                      </div>
                      <p className="text-[9px] mt-1 font-bold" style={{ color: heatColor }}>
                        {load > 75 ? '🔴 Overloaded' : load > 50 ? '🟡 High load' : load > 25 ? '🔵 Moderate' : '🟢 Available'}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Inter-Dept Task Coordination */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-4">🔗 Inter-Department Task Coordination</h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-4">
              <div className="grid grid-cols-3 gap-3">
                <input value={newInterTask.task} onChange={e => setNewInterTask(p => ({ ...p, task: e.target.value }))}
                  placeholder="Task description..." className="col-span-3 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none" />
                <select value={newInterTask.from} onChange={e => setNewInterTask(p => ({ ...p, from: e.target.value }))}
                  className="px-2 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none">
                  {['operations', 'marketing', 'digital', 'hr', 'finance'].map(d => <option key={d} value={d}>From: {d}</option>)}
                </select>
                <select value={newInterTask.to} onChange={e => setNewInterTask(p => ({ ...p, to: e.target.value }))}
                  className="px-2 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none">
                  {['marketing', 'operations', 'digital', 'hr', 'finance', 'campus', 'calling'].map(d => <option key={d} value={d}>To: {d}</option>)}
                </select>
                <input type="date" value={newInterTask.due} onChange={e => setNewInterTask(p => ({ ...p, due: e.target.value }))}
                  className="px-2 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none" />
              </div>
              <button onClick={addInterTask} className="px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">+ Assign Task</button>
            </div>
            <div className="space-y-2">
              {interTasks.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-4">No inter-department tasks yet</p>
              ) : interTasks.map(t => (
                <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border ${t.status === 'done' ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-slate-400' : 'text-navy'}`}>{t.task}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.from} → {t.to} {t.due && `· Due: ${new Date(t.due).toLocaleDateString('en-IN')}`}</p>
                  </div>
                  <select value={t.status} onChange={e => updateInterTask(t.id, e.target.value)}
                    className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none cursor-pointer">
                    {['pending', 'in_progress', 'done'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── VENDORS TAB ── */}
      {activeTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl animate-pulse border border-slate-100" />) :
            vendors.length === 0 ? <div className="col-span-3 text-center py-12 text-slate-400"><span className="text-4xl block mb-3">👷</span><p>No vendors found</p></div> :
              vendors.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center font-bold text-navy">{v.fullname.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-navy text-sm">{v.fullname}</p>
                      <p className="text-[10px] text-slate-400">{v.email}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Active Jobs</span><span className="font-bold" style={{ color: v.activeJobs > 5 ? '#EF4444' : v.activeJobs > 3 ? '#F59E0B' : '#10B981' }}>{v.activeJobs}</span></div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min((v.activeJobs / 8) * 100, 100)}%`, background: v.activeJobs > 5 ? '#EF4444' : v.activeJobs > 3 ? '#F59E0B' : '#10B981' }} /></div>
                  <div className="flex gap-2 mt-3">
                    <a href={`mailto:${v.email}`} className="flex-1 text-center py-1.5 rounded-lg bg-slate-50 text-xs text-slate-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors">✉️ Email</a>
                    {v.phone && <a href={`https://wa.me/${v.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 text-center py-1.5 rounded-lg bg-green-50 text-xs text-green-600 font-bold cursor-pointer hover:bg-green-100 transition-colors">💬 WhatsApp</a>}
                  </div>
                </motion.div>
              ))}
        </div>
      )}

      {/* ── SOP LIBRARY ── */}
      {activeTab === 'sop' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{sops.length} SOP documents</p>
            <button onClick={() => setShowSopForm(v => !v)} className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#FF6B35' }}>+ Create SOP</button>
          </div>
          <AnimatePresence>
            {showSopForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <form onSubmit={saveSOP} className="space-y-3">
                  <input required value={sopForm.title} onChange={e => setSopForm(p => ({ ...p, title: e.target.value }))} placeholder="SOP Title *" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={sopForm.category} onChange={e => setSopForm(p => ({ ...p, category: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                      {['general', 'operations', 'calling', 'campus', 'digital', 'hr', 'finance'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input value={sopForm.version} onChange={e => setSopForm(p => ({ ...p, version: e.target.value }))} placeholder="Version (1.0)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  </div>
                  <textarea rows={4} value={sopForm.content} onChange={e => setSopForm(p => ({ ...p, content: e.target.value }))} placeholder="Step-by-step content..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={sopForm.is_published} onChange={e => setSopForm(p => ({ ...p, is_published: e.target.checked }))} className="rounded" /> Publish now</label>
                    <button type="submit" disabled={savingSop} className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60" style={{ background: '#1B3A6B' }}>{savingSop ? '⏳' : '💾 Save'}</button>
                    <button type="button" onClick={() => setShowSopForm(false)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="space-y-3">
            {sopLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />) :
              sops.length === 0 ? <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📚</span><p>No SOP documents yet</p></div> :
                sops.map(sop => (
                  <div key={sop.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📋</span>
                        <div>
                          <h3 className="font-bold text-navy">{sop.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 capitalize">{sop.category}</span>
                            <span className="text-[10px] text-slate-400">v{sop.version}</span>
                            {sop.is_published ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-600">Published</span> : <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-400 text-[10px]">Draft</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    {sop.content && <p className="text-sm text-slate-500 whitespace-pre-wrap bg-slate-50 rounded-xl p-3 mt-2 leading-relaxed">{sop.content}</p>}
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* ── RESOURCES TAB ── */}
      {activeTab === 'resources' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-4">🗂️ Resource Allocation Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {vendors.slice(0, 6).map(v => {
                const utilization = Math.min((v.activeJobs / 6) * 100, 100)
                return (
                  <div key={v.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center font-bold text-navy text-xs">{v.fullname.charAt(0)}</div>
                      <div>
                        <p className="text-xs font-bold text-navy">{v.fullname}</p>
                        <p className="text-[10px] text-slate-400">{v.activeJobs} / 6 projects</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${utilization}%`, background: utilization > 80 ? '#EF4444' : utilization > 60 ? '#F59E0B' : '#10B981' }} />
                    </div>
                    <p className="text-[10px] mt-1 font-medium" style={{ color: utilization > 80 ? '#EF4444' : utilization > 60 ? '#F59E0B' : '#10B981' }}>{utilization.toFixed(0)}% utilized</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── INVENTORY TAB ── */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500">{inventory.length} tools / subscriptions tracked</p>
              {expiringItems.length > 0 && <p className="text-xs text-amber-600 font-bold">⚠️ {expiringItems.length} expiring soon</p>}
            </div>
            <button onClick={() => setShowInvForm(v => !v)} className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#1B3A6B' }}>+ Add Item</button>
          </div>
          <AnimatePresence>
            {showInvForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-3">Add Tool / Subscription</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input value={invForm.name} onChange={e => setInvForm(p => ({ ...p, name: e.target.value }))} placeholder="Tool / Software name *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <select value={invForm.type} onChange={e => setInvForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {['software', 'hardware', 'subscription', 'license', 'service'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="number" value={invForm.cost} onChange={e => setInvForm(p => ({ ...p, cost: e.target.value }))} placeholder="Annual cost (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={invForm.vendor} onChange={e => setInvForm(p => ({ ...p, vendor: e.target.value }))} placeholder="Vendor / Provider" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="date" value={invForm.renewal_date} onChange={e => setInvForm(p => ({ ...p, renewal_date: e.target.value }))} placeholder="Renewal date" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                </div>
                <div className="flex gap-3 mt-3">
                  <button onClick={saveInventoryItem} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">💾 Save</button>
                  <button onClick={() => setShowInvForm(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs cursor-pointer">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {inventory.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🛠️</span><p>No tools tracked yet</p></div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-100 bg-slate-50">
                  {['Tool / Software', 'Type', 'Vendor', 'Annual Cost', 'Renewal', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-bold text-slate-400 uppercase text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {inventory.map(item => {
                    const isExpiringSoon = item.renewal_date && new Date(item.renewal_date).getTime() - Date.now() < 30 * 86400000
                    return (
                      <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50/60 ${isExpiringSoon ? 'bg-amber-50/40' : ''}`}>
                        <td className="px-3 py-3 font-semibold text-navy">{item.name} {isExpiringSoon && '⚠️'}</td>
                        <td className="px-3 py-3 capitalize text-slate-500">{item.type}</td>
                        <td className="px-3 py-3 text-slate-500">{item.vendor || '—'}</td>
                        <td className="px-3 py-3 font-bold text-navy">{item.cost ? `₹${item.cost.toLocaleString('en-IN')}` : '—'}</td>
                        <td className="px-3 py-3 text-slate-500">{item.renewal_date ? new Date(item.renewal_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>{item.status}</span>
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => removeInventoryItem(item.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center cursor-pointer text-xs">🗑</button>
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

      {/* ── LEGAL DOC UPLOAD ── */}
      {activeTab === 'legal_upload' && (
        <div className="space-y-5 max-w-2xl">
          <div>
            <h2 className="text-xl font-bold text-navy font-heading">📎 Submit Document for BOD Approval</h2>
            <p className="text-slate-500 text-sm mt-1">Upload policies, SOPs, MOUs, or legal documents. They will be assigned pending_approval status and reviewed by the Board of Directors.</p>
          </div>
          {docSaved && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold text-green-800">Document submitted successfully!</p>
                <p className="text-xs text-green-600">It's now pending BOD approval. You'll be notified once reviewed.</p>
              </div>
              <button onClick={() => setDocSaved(false)} className="ml-auto text-green-500 cursor-pointer">✕</button>
            </motion.div>
          )}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <form onSubmit={submitDoc} className="space-y-4">
              <input required value={docForm.title} onChange={e => setDocForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Document title *" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
              <div className="grid grid-cols-2 gap-3">
                <select value={docForm.type} onChange={e => setDocForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                  {['policy', 'sop', 'legal', 'mou', 'agreement', 'compliance', 'other'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
                <input value={docForm.file_url} onChange={e => setDocForm(p => ({ ...p, file_url: e.target.value }))}
                  placeholder="File URL (Google Drive, etc.)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              </div>
              <textarea rows={3} value={docForm.description} onChange={e => setDocForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of the document..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                ℹ️ This document will be submitted with <strong>Pending Approval</strong> status and must be reviewed and approved by the Board of Directors before taking effect.
              </div>
              <button type="submit" disabled={savingDoc}
                className="px-6 py-3 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60 hover:opacity-90"
                style={{ background: '#1B3A6B' }}>
                {savingDoc ? '⏳ Submitting...' : '📤 Submit for BOD Approval'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* ── SERVICES TAB ── */}
      {activeTab === 'services' && (() => {
        const SERVICE_CATEGORIES = ['Academic', 'Technical', 'Business', 'Government', 'Design', 'Marketing', 'Legal', 'Other']
        const filteredServices = services.filter(s => {
          const catMatch = servicesCatFilter === 'all' || s.category === servicesCatFilter
          const searchMatch = !servicesSearch.trim() || s.title.toLowerCase().includes(servicesSearch.toLowerCase())
          return catMatch && searchMatch
        })
        const CAT_COLORS: Record<string,string> = { Academic:'#8B5CF6', Technical:'#3B82F6', Business:'#10B981', Government:'#F59E0B', Design:'#EC4899', Marketing:'#EF4444', Legal:'#6B7280', Other:'#FF6B35' }

        const saveService = async () => {
          setSavingService(true)
          const method = editingServiceId ? 'PATCH' : 'POST'
          const body = editingServiceId ? { id: editingServiceId, ...serviceForm } : serviceForm
          await fetch('/api/admin/services', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          const d = await fetch('/api/admin/services').then(r => r.json())
          setServices(d.services || [])
          setShowServiceForm(false); setEditingServiceId(null)
          setServiceForm({ title: '', category: 'Academic', short_description: '', price_min: '', price_max: '', delivery_days: '3', featured_image: '', tags: '', is_featured: false, is_active: true })
          setSavingService(false)
        }

        return (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-navy font-heading">🛒 Services Manager</h2>
                <p className="text-slate-400 text-sm mt-0.5">{services.length} services · {services.filter(s=>s.is_active).length} active</p>
              </div>
              <button onClick={() => { setShowServiceForm(true); setEditingServiceId(null); setServiceForm({ title: '', category: 'Academic', short_description: '', price_min: '', price_max: '', delivery_days: '3', featured_image: '', tags: '', is_featured: false, is_active: true }) }}
                className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90 flex items-center gap-2 self-start sm:self-auto"
                style={{ background: '#FF6B35' }}>
                <span>+</span> Add New Service
              </button>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={servicesSearch} onChange={e => setServicesSearch(e.target.value)} placeholder="Search services..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-navy" />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setServicesCatFilter('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${servicesCatFilter === 'all' ? 'bg-navy text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>All</button>
                {SERVICE_CATEGORIES.map(c => (
                  <button key={c} onClick={() => setServicesCatFilter(c)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${servicesCatFilter === c ? 'text-white' : 'bg-white border border-slate-200 text-slate-500'}`}
                    style={servicesCatFilter === c ? { background: CAT_COLORS[c] } : {}}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Add/Edit form */}
            <AnimatePresence>
              {showServiceForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-navy mb-4 font-heading">{editingServiceId ? '✏️ Edit Service' : '+ Add New Service'}</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={serviceForm.title} onChange={e => setServiceForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Service title *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                      <select value={serviceForm.category} onChange={e => setServiceForm(p => ({ ...p, category: e.target.value }))}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                        {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <textarea rows={2} value={serviceForm.short_description} onChange={e => setServiceForm(p => ({ ...p, short_description: e.target.value }))}
                      placeholder="Short description..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                    <div className="grid grid-cols-3 gap-3">
                      <input value={serviceForm.price_min} onChange={e => setServiceForm(p => ({ ...p, price_min: e.target.value }))}
                        placeholder="Min price (₹)" type="number" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                      <input value={serviceForm.price_max} onChange={e => setServiceForm(p => ({ ...p, price_max: e.target.value }))}
                        placeholder="Max price (₹)" type="number" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                      <input value={serviceForm.delivery_days} onChange={e => setServiceForm(p => ({ ...p, delivery_days: e.target.value }))}
                        placeholder="Delivery days" type="number" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={serviceForm.featured_image} onChange={e => setServiceForm(p => ({ ...p, featured_image: e.target.value }))}
                        placeholder="Image URL (https://... or /images/...)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                      <input value={serviceForm.tags} onChange={e => setServiceForm(p => ({ ...p, tags: e.target.value }))}
                        placeholder="Tags (comma-separated)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={serviceForm.is_featured} onChange={e => setServiceForm(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4 rounded" />
                        Mark as Featured
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={serviceForm.is_active} onChange={e => setServiceForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded" />
                        Active / Published
                      </label>
                    </div>
                    {serviceForm.featured_image && (
                      <div className="mt-1">
                        <p className="text-xs text-slate-400 mb-1">Image preview:</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={serviceForm.featured_image} alt="preview" className="h-24 rounded-xl object-cover border border-slate-200" onError={e => (e.currentTarget.style.display='none')} />
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button disabled={savingService || !serviceForm.title} onClick={saveService}
                        className="px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold cursor-pointer disabled:opacity-60">
                        {savingService ? '⏳ Saving...' : editingServiceId ? '💾 Update Service' : '✅ Create Service'}
                      </button>
                      <button onClick={() => { setShowServiceForm(false); setEditingServiceId(null) }} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Services list */}
            {servicesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">
                <span className="text-4xl block mb-3">🛒</span>
                <p>No services found. Add your first service above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map(s => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${!s.is_active ? 'opacity-60' : ''} ${s.is_featured ? 'border-accent/30' : 'border-slate-100'}`}>
                    {/* Image */}
                    <div className="h-32 relative overflow-hidden flex-shrink-0"
                      style={{ background: `${CAT_COLORS[s.category] || '#1B3A6B'}15` }}>
                      {s.featured_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.featured_image} alt={s.title} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl opacity-30">🛒</span>
                        </div>
                      )}
                      {s.is_featured && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent text-white text-[9px] font-bold">⭐ Featured</span>}
                      {!s.is_active && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[9px] font-bold">Inactive</span>}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-navy text-sm line-clamp-1 font-heading">{s.title}</h4>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: CAT_COLORS[s.category] || '#1B3A6B' }}>{s.category}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {s.price_min ? <p className="text-xs font-bold text-navy">₹{s.price_min.toLocaleString('en-IN')}{s.price_max ? ` – ₹${s.price_max.toLocaleString('en-IN')}` : '+'}</p> : <p className="text-xs text-slate-400">Custom</p>}
                          <p className="text-[10px] text-slate-400 mt-0.5">{s.delivery_days}d delivery</p>
                        </div>
                      </div>
                      {s.short_description && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{s.short_description}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setServiceForm({ title: s.title, category: s.category, short_description: s.short_description || '', price_min: s.price_min?.toString() || '', price_max: s.price_max?.toString() || '', delivery_days: s.delivery_days.toString(), featured_image: s.featured_image || '', tags: (s.tags || []).join(', '), is_featured: s.is_featured, is_active: s.is_active })
                          setEditingServiceId(s.id); setShowServiceForm(true)
                        }} className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-500 text-xs font-bold cursor-pointer hover:bg-blue-100">✏️ Edit</button>
                        <button onClick={async () => {
                          await fetch(`/api/admin/services?id=${s.id}`, { method: 'DELETE' })
                          setServices(p => p.filter(x => x.id !== s.id))
                        }} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 text-xs flex items-center justify-center cursor-pointer hover:bg-red-100">🗑</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── CONTACT LEADS ── */}
      {activeTab === 'contact_leads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-navy font-heading">📬 Contact Form Leads</h3>
              <p className="text-xs text-slate-400 mt-0.5">{contactLeads.length} submissions from the public contact page</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-1">
                {['all','new','contacted','converted','closed'].map(s => (
                  <button key={s} onClick={() => { setContactLoading(true); fetch(`/api/contact${s !== 'all' ? `?status=${s}` : ''}`).then(r => r.json()).then(d => setContactLeads(d.submissions || [])).finally(() => setContactLoading(false)) }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize cursor-pointer bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">{s}</button>
                ))}
              </div>
              <button onClick={() => { setContactLoading(true); fetch('/api/contact').then(r => r.json()).then(d => setContactLeads(d.submissions || [])).finally(() => setContactLoading(false)) }}
                className="px-3 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">🔄 Refresh</button>
            </div>
          </div>
          {contactLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
          ) : contactLeads.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <span className="text-5xl block mb-3">📬</span>
              <p className="text-slate-400 text-sm font-medium">No contact form submissions yet.</p>
              <p className="text-slate-300 text-xs mt-1">They appear here when users fill the "Get In Touch" form.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 bg-slate-50">
                    {['Name','Email','Phone','Service','Message','Status','Date','Actions'].map(h => (
                      <th key={h} className="px-3 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {contactLeads.map(lead => {
                      const statusCfg: Record<string,{bg:string;color:string}> = {
                        new: { bg: '#DBEAFE', color: '#1D4ED8' },
                        contacted: { bg: '#FEF3C7', color: '#92400E' },
                        converted: { bg: '#D1FAE5', color: '#065F46' },
                        closed: { bg: '#F3F4F6', color: '#6B7280' },
                      }
                      const cfg = statusCfg[lead.status] || statusCfg.new
                      return (
                        <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                          <td className="px-3 py-3 font-semibold text-navy whitespace-nowrap">{lead.name}</td>
                          <td className="px-3 py-3 text-blue-600"><a href={`mailto:${lead.email}`}>{lead.email}</a></td>
                          <td className="px-3 py-3 text-slate-500">{lead.phone ? <a href={`tel:${lead.phone}`} className="text-green-600 font-medium">{lead.phone}</a> : '—'}</td>
                          <td className="px-3 py-3 text-slate-500 max-w-[100px] truncate">{lead.service || '—'}</td>
                          <td className="px-3 py-3 text-slate-500 max-w-[200px]"><p className="truncate" title={lead.message}>{lead.message}</p></td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold capitalize" style={{ background: cfg.bg, color: cfg.color }}>{lead.status}</span>
                          </td>
                          <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{new Date(lead.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {lead.status === 'new' && <button onClick={() => updateContactStatus(lead.id, 'contacted')} className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold cursor-pointer hover:bg-amber-100">📞 Contacted</button>}
                              {lead.status === 'contacted' && <button onClick={() => updateContactStatus(lead.id, 'converted')} className="px-2 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-bold cursor-pointer hover:bg-green-100">✅ Converted</button>}
                              {lead.status !== 'closed' && <button onClick={() => updateContactStatus(lead.id, 'closed')} className="px-2 py-1 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold cursor-pointer hover:bg-slate-100">✕ Close</button>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NEWSLETTER SUBSCRIBERS ── */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-navy font-heading">📧 Newsletter Subscribers</h3>
              <p className="text-xs text-slate-400 mt-0.5">{subscribers.length} people subscribed via the homepage "Stay in the Loop" form</p>
            </div>
            <button onClick={() => { setSubLoading(true); fetch('/api/newsletter/subscribers?limit=500').then(r => r.json()).then(d => setSubscribers(d.subscribers || [])).finally(() => setSubLoading(false)) }}
              className="px-3 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">🔄 Refresh</button>
          </div>
          {subLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
          ) : subscribers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <span className="text-5xl block mb-3">📧</span>
              <p className="text-slate-400 text-sm">No subscribers yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 bg-slate-50">
                    {['#','Email','Status','Subscribed On'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {subscribers.map((s, i) => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-navy">{s.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {s.status === 'active' ? '● Active' : '○ Unsubscribed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panels */}
      <AnimatePresence>
        {showGroupChat && GCComp && meId > 0 && <GCComp currentUserId={meId} isAdmin={['super_admin', 'admin'].includes(meRole)} onClose={() => setShowGroupChat(false)} />}
        {showDMChat && DMComp && meId > 0 && <DMComp currentUserId={meId} mode="ops" onClose={() => setShowDMChat(false)} />}
        {showMeetings && MeetComp && meId > 0 && <MeetComp currentUserId={meId} onClose={() => setShowMeetings(false)} />}
      </AnimatePresence>
    </div>
  )

}
