'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InterdeptTaskInbox from '@/components/admin/InterdeptTaskInbox'

// ─── Types ────────────────────────────────────────────────────
interface Tender { id: number; title: string; dept: string | null; value: string | null; deadline: string | null; submission_ref: string | null; status: string }
interface GovtClient { id: number; name: string; dept: string | null; state: string | null; contact_person: string | null; contract_value: string | null; email?: string; phone?: string }
interface GovtProject { id: number; title: string; client_name: string | null; phase: string; progress: number; deadline: string | null; value: string | null; description?: string }
interface GovtDoc { id: number; title: string; doc_type: string; status: string; file_url: string | null }
interface Bid { id: number; bid_ref?: string; bid_value?: number; submitted_at?: string; status: string; doc_url?: string; notes?: string; project_id?: number; tender_id?: number }
interface GovtRevenue { id: number; project_id?: number; amount: number; invoice_ref?: string; payment_mode?: string; received_date?: string; status: string; notes?: string }
interface Task { id: number; project_id: number; task: string; status: string; priority: string; assignee_id?: string; due_date?: string; notes?: string }
interface Compliance { id: number; project_id: number; item: string; category?: string; is_complete: boolean; completed_at?: string; notes?: string }
interface MOU { id: number; client_id: number; title: string; signed_date?: string; expiry_date?: string; doc_url?: string; status: string; notes?: string; expiring_soon?: boolean }

// ─── Constants ───────────────────────────────────────────────
const TABS = [
  { key: 'overview',    label: '🏛️ Overview' },
  { key: 'tenders',    label: '📋 Tenders & Bids' },
  { key: 'projects',   label: '🏗️ Project Tracker' },
  { key: 'clients',    label: '🤝 Client Directory' },
  { key: 'revenue',    label: '💰 Revenue' },
  { key: 'bids',       label: '📄 Bid Documents' },
  { key: 'compliance', label: '✅ Compliance' },
  { key: 'mous',       label: '📜 MOUs & Agreements' },
  { key: 'chat',       label: '💬 Team Chat' },
  { key: 'map',        label: '🗺️ District Map' },
] as const
type Tab = typeof TABS[number]['key']

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  under_review: { label: 'Under Review', color: '#F59E0B', bg: '#FEF3C7' },
  won:          { label: 'Won ✅', color: '#10B981', bg: '#D1FAE5' },
  lost:         { label: 'Lost', color: '#EF4444', bg: '#FEE2E2' },
  submitted:    { label: 'Submitted', color: '#3B82F6', bg: '#DBEAFE' },
  preparing:    { label: 'Preparing', color: '#8B5CF6', bg: '#EDE9FE' },
  shortlisted:  { label: 'Shortlisted', color: '#06B6D4', bg: '#CFFAFE' },
  draft:        { label: 'Draft', color: '#6B7280', bg: '#F3F4F6' },
  active:       { label: 'Active', color: '#10B981', bg: '#D1FAE5' },
  expired:      { label: 'Expired', color: '#EF4444', bg: '#FEE2E2' },
  terminated:   { label: 'Terminated', color: '#EF4444', bg: '#FEE2E2' },
  renewed:      { label: 'Renewed', color: '#8B5CF6', bg: '#EDE9FE' },
  pending:      { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7' },
  received:     { label: 'Received', color: '#10B981', bg: '#D1FAE5' },
  partial:      { label: 'Partial', color: '#06B6D4', bg: '#CFFAFE' },
  overdue:      { label: 'Overdue', color: '#EF4444', bg: '#FEE2E2' },
}
const TASK_PRIORITY_COLORS: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444', critical: '#8B5CF6' }
const PHASES = ['proposal', 'approval', 'execution', 'review', 'completed']

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' }
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
}

function MetricCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: `${color}18` }}>{icon}</div>
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-300 mt-0.5">{sub}</p>}
    </div>
  )
}

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
      <span className="text-5xl block mb-3">{icon}</span>
      <p className="text-slate-400 text-sm">{label}</p>
    </div>
  )
}

async function govtFetch(type: string, extra = '') {
  const res = await fetch(`/api/admin/govt?type=${type}${extra}`)
  if (!res.ok) return null
  return res.json()
}
async function govtPost(type: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/govt?type=${type}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return res.ok ? res.json() : null
}
async function govtPatch(type: string, id: number, updates: Record<string, unknown>) {
  const res = await fetch(`/api/admin/govt?type=${type}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
  return res.ok
}
async function govtDelete(type: string, id: number) {
  const res = await fetch(`/api/admin/govt?type=${type}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  return res.ok
}

export default function GovernmentSaarthiPage() {
  const [tab, setTab] = useState<Tab>('overview')

  // Data
  const [tenders, setTenders] = useState<Tender[]>([])
  const [clients, setClients] = useState<GovtClient[]>([])
  const [projects, setProjects] = useState<GovtProject[]>([])
  const [docs, setDocs] = useState<GovtDoc[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [revenue, setRevenue] = useState<GovtRevenue[]>([])
  const [revSummary, setRevSummary] = useState({ total: 0, received: 0, pending: 0 })
  const [tasks, setTasks] = useState<Task[]>([])
  const [compliance, setCompliance] = useState<Compliance[]>([])
  const [mous, setMous] = useState<MOU[]>([])
  const [loading, setLoading] = useState(false)

  // Forms
  const [tenderForm, setTenderForm] = useState({ title: '', dept: '', value: '', deadline: '', submission: '', status: 'under_review' })
  const [clientForm, setClientForm] = useState({ name: '', dept: '', state: '', contact: '', value: '', email: '', phone: '', address: '' })
  const [projectForm, setProjectForm] = useState({ title: '', client: '', phase: 'proposal', progress: '0', deadline: '', value: '', description: '', start_date: '' })
  const [docForm, setDocForm] = useState({ title: '', type: 'MOU', url: '', status: 'valid' })
  const [bidForm, setBidForm] = useState({ project_id: '', tender_id: '', bid_ref: '', bid_value: '', submitted_at: '', status: 'submitted', doc_url: '', notes: '' })
  const [revForm, setRevForm] = useState({ project_id: '', amount: '', invoice_ref: '', payment_mode: 'bank_transfer', received_date: '', status: 'pending', notes: '' })
  const [taskForm, setTaskForm] = useState({ project_id: '', task: '', priority: 'medium', due_date: '', notes: '' })
  const [complianceForm, setComplianceForm] = useState({ project_id: '', item: '', category: 'general', notes: '' })
  const [mouForm, setMouForm] = useState({ client_id: '', title: '', signed_date: '', expiry_date: '', doc_url: '', status: 'active', notes: '' })
  const [selectedProject, setSelectedProject] = useState<GovtProject | null>(null)
  const [saving, setSaving] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [t, c, p, d] = await Promise.all([
      govtFetch('tenders'), govtFetch('clients'), govtFetch('projects'), govtFetch('docs'),
    ])
    setTenders(t?.tenders || [])
    setClients(c?.clients || [])
    setProjects(p?.projects || [])
    setDocs(d?.docs || [])
    setLoading(false)
  }, [])

  const loadTab = useCallback(async (t: Tab) => {
    if (t === 'bids') { const d = await govtFetch('bids'); setBids(d?.bids || []) }
    if (t === 'revenue') { const d = await govtFetch('revenue'); setRevenue(d?.revenue || []); setRevSummary(d?.summary || { total: 0, received: 0, pending: 0 }) }
    if (t === 'compliance') { const d = await govtFetch('compliance'); setCompliance(d?.compliance || []) }
    if (t === 'mous') { const d = await govtFetch('mous'); setMous(d?.mous || []) }
    if (t === 'projects') { const d = await govtFetch('tasks'); setTasks(d?.tasks || []) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { loadTab(tab) }, [tab, loadTab])

  const save = async (type: string, body: Record<string, unknown>, afterSave: () => void) => {
    setSaving(true)
    const result = await govtPost(type, body)
    if (result) afterSave()
    setSaving(false)
    return result
  }

  // Alerts
  const expiringMOUs = mous.filter(m => m.expiring_soon)
  const upcomingDeadlines = tenders.filter(t => t.deadline && new Date(t.deadline) < new Date(Date.now() + 7 * 86400000) && !['won','lost'].includes(t.status))
  const overdueProjects = projects.filter(p => p.deadline && new Date(p.deadline) < new Date() && p.phase !== 'completed')

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy font-heading">🏛️ Government Saarthi</h1>
        <p className="text-slate-500 text-sm">Tenders · Projects · Revenue · Compliance · MOUs · Client Directory</p>
      </div>

      {/* Alert Banner */}
      {(expiringMOUs.length > 0 || upcomingDeadlines.length > 0 || overdueProjects.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {expiringMOUs.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => setTab('mous')}>
              <span className="text-xl">📜</span>
              <div><p className="text-xs font-bold text-amber-700">{expiringMOUs.length} MOU(s) expiring soon</p><p className="text-[10px] text-amber-500">{expiringMOUs.map(m => m.title).join(', ')}</p></div>
            </div>
          )}
          {upcomingDeadlines.length > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setTab('tenders')}>
              <span className="text-xl">⚠️</span>
              <div><p className="text-xs font-bold text-red-700">{upcomingDeadlines.length} tender deadline(s) this week</p><p className="text-[10px] text-red-500">{upcomingDeadlines.map(t => t.title).join(', ')}</p></div>
            </div>
          )}
          {overdueProjects.length > 0 && (
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3 cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => setTab('projects')}>
              <span className="text-xl">🏗️</span>
              <div><p className="text-xs font-bold text-orange-700">{overdueProjects.length} project(s) past deadline</p><p className="text-[10px] text-orange-500">{overdueProjects.map(p => p.title).join(', ')}</p></div>
            </div>
          )}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-0.5 border-b border-slate-200 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2.5 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${tab === t.key ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="📋" label="Open Tenders" value={tenders.filter(t => !['won','lost'].includes(t.status)).length.toString()} color="#3B82F6" />
            <MetricCard icon="🤝" label="Govt. Clients" value={clients.length.toString()} color="#8B5CF6" />
            <MetricCard icon="🏗️" label="Active Projects" value={projects.filter(p => p.phase !== 'completed').length.toString()} color="#FF6B35" />
            <MetricCard icon="💰" label="Revenue Received" value={`₹${revSummary.received.toLocaleString('en-IN')}`} color="#10B981" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="🏆" label="Tenders Won" value={tenders.filter(t => t.status === 'won').length.toString()} color="#10B981" />
            <MetricCard icon="📜" label="Active MOUs" value={mous.filter(m => m.status === 'active').length.toString()} color="#06B6D4" />
            <MetricCard icon="✅" label="Compliance Items" value={compliance.length.toString()} sub={`${compliance.filter(c => c.is_complete).length} complete`} color="#F59E0B" />
            <MetricCard icon="📄" label="Bid Documents" value={bids.length.toString()} color="#6B7280" />
          </div>

          {/* Project phases */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-4">🏗️ Projects by Phase</h3>
            <div className="space-y-3">
              {PHASES.map(phase => {
                const count = projects.filter(p => p.phase === phase).length
                const pct = projects.length > 0 ? (count / projects.length * 100) : 0
                const colors: Record<string, string> = { proposal: '#8B5CF6', approval: '#F59E0B', execution: '#3B82F6', review: '#FF6B35', completed: '#10B981' }
                return (
                  <div key={phase}>
                    <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-600 capitalize">{phase}</span><span className="font-bold text-navy">{count}</span></div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: colors[phase] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TENDERS & BIDS ── */}
      {tab === 'tenders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">Add Tender / RFP</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={tenderForm.title} onChange={e => setTenderForm(p => ({ ...p, title: e.target.value }))} placeholder="Tender title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={tenderForm.dept} onChange={e => setTenderForm(p => ({ ...p, dept: e.target.value }))} placeholder="Ministry / Department" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={tenderForm.value} onChange={e => setTenderForm(p => ({ ...p, value: e.target.value }))} placeholder="Value (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={tenderForm.submission} onChange={e => setTenderForm(p => ({ ...p, submission: e.target.value }))} placeholder="Submission Ref / ID" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="date" value={tenderForm.deadline} onChange={e => setTenderForm(p => ({ ...p, deadline: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={tenderForm.status} onChange={e => setTenderForm(p => ({ ...p, status: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['under_review','preparing','submitted','shortlisted','won','lost'].map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
              </select>
            </div>
            <button onClick={async () => {
              setSaving(true)
              const ok = await govtPost('tenders', tenderForm)
              if (ok) { const d = await govtFetch('tenders'); setTenders(d?.tenders || []); setTenderForm({ title: '', dept: '', value: '', deadline: '', submission: '', status: 'under_review' }) }
              setSaving(false)
            }} disabled={saving || !tenderForm.title} className="mt-3 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold cursor-pointer disabled:opacity-60">
              {saving ? '⏳' : '+ Add Tender'}
            </button>
          </div>

          {tenders.length === 0 ? <EmptyState icon="📋" label="No tenders tracked yet" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenders.map((t, i) => {
                const isExpiring = t.deadline && new Date(t.deadline) < new Date(Date.now() + 7 * 86400000) && !['won','lost'].includes(t.status)
                return (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className={`bg-white rounded-2xl p-5 shadow-sm border ${isExpiring ? 'border-red-300' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <h3 className="font-bold text-navy flex-1">{t.title}</h3>
                      <Badge status={t.status} />
                    </div>
                    {t.dept && <p className="text-xs text-slate-400 mb-2">🏛️ {t.dept}</p>}
                    <div className="flex flex-wrap gap-3 text-xs mb-3">
                      {t.value && <span className="font-bold text-green-600">₹{t.value}</span>}
                      {t.deadline && <span className={isExpiring ? 'text-red-500 font-bold' : 'text-slate-400'}>📅 {new Date(t.deadline).toLocaleDateString('en-IN')} {isExpiring && '⚠️'}</span>}
                      {t.submission_ref && <span className="text-slate-400">Ref: {t.submission_ref}</span>}
                    </div>
                    <div className="flex gap-2 items-center">
                      <select value={t.status} onChange={async e => { await govtPatch('tenders', t.id, { status: e.target.value }); const d = await govtFetch('tenders'); setTenders(d?.tenders || []) }}
                        className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer">
                        {['under_review','preparing','submitted','shortlisted','won','lost'].map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
                      </select>
                      <button onClick={async () => { if (confirm('Delete?')) { await govtDelete('tenders', t.id); setTenders(p => p.filter(x => x.id !== t.id)) } }} className="ml-auto text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PROJECT TRACKER ── */}
      {tab === 'projects' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">Add Government Project</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={projectForm.title} onChange={e => setProjectForm(p => ({ ...p, title: e.target.value }))} placeholder="Project title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={projectForm.client} onChange={e => setProjectForm(p => ({ ...p, client: e.target.value }))} placeholder="Government client" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={projectForm.phase} onChange={e => setProjectForm(p => ({ ...p, phase: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {PHASES.map(ph => <option key={ph} value={ph}>{ph}</option>)}
              </select>
              <input value={projectForm.value} onChange={e => setProjectForm(p => ({ ...p, value: e.target.value }))} placeholder="Project value (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="date" value={projectForm.start_date} onChange={e => setProjectForm(p => ({ ...p, start_date: e.target.value }))} placeholder="Start date" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="date" value={projectForm.deadline} onChange={e => setProjectForm(p => ({ ...p, deadline: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" min={0} max={100} value={projectForm.progress} onChange={e => setProjectForm(p => ({ ...p, progress: e.target.value }))} placeholder="Progress %" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <textarea value={projectForm.description} onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" rows={1} className="col-span-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={async () => {
              setSaving(true)
              const ok = await govtPost('projects', { ...projectForm, progress: Number(projectForm.progress) || 0 })
              if (ok) { const d = await govtFetch('projects'); setProjects(d?.projects || []); setProjectForm({ title: '', client: '', phase: 'proposal', progress: '0', deadline: '', value: '', description: '', start_date: '' }) }
              setSaving(false)
            }} disabled={saving || !projectForm.title} className="mt-3 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold cursor-pointer disabled:opacity-60">
              {saving ? '⏳' : '+ Add Project'}
            </button>
          </div>

          {projects.length === 0 ? <EmptyState icon="🏗️" label="No projects yet" /> : (
            <div className="space-y-3">
              {projects.map((p, i) => {
                const isOverdue = p.deadline && new Date(p.deadline) < new Date() && p.phase !== 'completed'
                const projTasks = tasks.filter(t => t.project_id === p.id)
                const done = projTasks.filter(t => t.status === 'done').length
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className={`bg-white rounded-2xl p-5 shadow-sm border ${isOverdue ? 'border-orange-200' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <h3 className="font-bold text-navy">{p.title}</h3>
                        {p.client_name && <p className="text-xs text-slate-400">🤝 {p.client_name}</p>}
                        {p.description && <p className="text-xs text-slate-500 mt-1">{p.description}</p>}
                      </div>
                      <div className="text-right">
                        {p.value && <p className="font-bold text-green-600 text-sm">₹{p.value}</p>}
                        {p.deadline && <p className={`text-[10px] ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'}`}>Due: {new Date(p.deadline).toLocaleDateString('en-IN')} {isOverdue && '⚠️'}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <select value={p.phase} onChange={async e => { await govtPatch('projects', p.id, { phase: e.target.value }); setProjects(prev => prev.map(x => x.id === p.id ? { ...x, phase: e.target.value } : x)) }}
                        className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white capitalize cursor-pointer">
                        {PHASES.map(ph => <option key={ph} value={ph}>{ph}</option>)}
                      </select>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-navy">{p.progress}%</span>
                    </div>

                    {/* Coordination Board — Tasks for this project */}
                    <div className="border-t border-slate-50 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Coordination Tasks {projTasks.length > 0 && `— ${done}/${projTasks.length}`}</p>
                        <button onClick={() => setSelectedProject(p)} className="text-[10px] text-blue-500 font-bold cursor-pointer hover:underline">+ Manage Tasks</button>
                      </div>
                      {projTasks.length > 0 && (
                        <div className="grid grid-cols-4 gap-1">
                          {['todo','in_progress','done','blocked'].map(s => (
                            <div key={s} className="text-center">
                              <p className="text-xs font-extrabold text-navy">{projTasks.filter(t => t.status === s).length}</p>
                              <p className="text-[9px] text-slate-400 capitalize">{s.replace('_',' ')}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CLIENT DIRECTORY ── */}
      {tab === 'clients' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">Add Government Client / Body</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={clientForm.name} onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))} placeholder="Entity name *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={clientForm.dept} onChange={e => setClientForm(p => ({ ...p, dept: e.target.value }))} placeholder="Ministry / Department" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={clientForm.state} onChange={e => setClientForm(p => ({ ...p, state: e.target.value }))} placeholder="State" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={clientForm.contact} onChange={e => setClientForm(p => ({ ...p, contact: e.target.value }))} placeholder="Officer / Contact Person" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={clientForm.email} onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" type="email" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={clientForm.phone} onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={clientForm.value} onChange={e => setClientForm(p => ({ ...p, value: e.target.value }))} placeholder="Contract value (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={clientForm.address} onChange={e => setClientForm(p => ({ ...p, address: e.target.value }))} placeholder="Address" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={async () => {
              setSaving(true)
              const ok = await govtPost('clients', { ...clientForm, contact: clientForm.contact, value: clientForm.value })
              if (ok) { const d = await govtFetch('clients'); setClients(d?.clients || []); setClientForm({ name: '', dept: '', state: '', contact: '', value: '', email: '', phone: '', address: '' }) }
              setSaving(false)
            }} disabled={saving || !clientForm.name} className="mt-3 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold cursor-pointer disabled:opacity-60">
              {saving ? '⏳' : '+ Add Client'}
            </button>
          </div>

          {clients.length === 0 ? <EmptyState icon="🤝" label="No government clients yet" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center font-bold text-navy text-lg">{c.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-navy truncate">{c.name}</p>
                      {c.dept && <p className="text-xs text-slate-400">{c.dept}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    {c.state && <p>📍 {c.state}</p>}
                    {c.contact_person && <p>👤 {c.contact_person}</p>}
                    {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-blue-500 hover:underline">✉️ {c.email}</a>}
                    {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-green-500 hover:underline">📞 {c.phone}</a>}
                    {c.contract_value && <p className="font-bold text-green-600">💰 ₹{c.contract_value}</p>}
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                    <button onClick={() => { setMouForm(p => ({ ...p, client_id: c.id.toString() })); setTab('mous') }} className="flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100">📜 Add MOU</button>
                    <button onClick={async () => { if (confirm('Delete?')) { await govtDelete('clients', c.id); setClients(prev => prev.filter(x => x.id !== c.id)) } }} className="px-2 py-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 cursor-pointer">🗑️</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REVENUE DASHBOARD ── */}
      {tab === 'revenue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard icon="💰" label="Total Revenue" value={`₹${revSummary.total.toLocaleString('en-IN')}`} color="#10B981" />
            <MetricCard icon="✅" label="Received" value={`₹${revSummary.received.toLocaleString('en-IN')}`} color="#3B82F6" />
            <MetricCard icon="⏳" label="Pending" value={`₹${revSummary.pending.toLocaleString('en-IN')}`} color="#F59E0B" />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">Log Revenue Payment</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <select value={revForm.project_id} onChange={e => setRevForm(p => ({ ...p, project_id: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                <option value="">— Select Project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <input type="number" value={revForm.amount} onChange={e => setRevForm(p => ({ ...p, amount: e.target.value }))} placeholder="Amount (₹) *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={revForm.invoice_ref} onChange={e => setRevForm(p => ({ ...p, invoice_ref: e.target.value }))} placeholder="Invoice Ref / No." className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={revForm.payment_mode} onChange={e => setRevForm(p => ({ ...p, payment_mode: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['bank_transfer','cheque','rtgs','neft','online','other'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
              </select>
              <input type="date" value={revForm.received_date} onChange={e => setRevForm(p => ({ ...p, received_date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={revForm.status} onChange={e => setRevForm(p => ({ ...p, status: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['pending','received','partial','overdue'].map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
              </select>
              <textarea value={revForm.notes} onChange={e => setRevForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" rows={1} className="col-span-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={async () => {
              if (!revForm.amount) return
              setSaving(true)
              const ok = await govtPost('revenue', { ...revForm, project_id: revForm.project_id ? Number(revForm.project_id) : null, amount: Number(revForm.amount) })
              if (ok) {
                const d = await govtFetch('revenue')
                setRevenue(d?.revenue || [])
                setRevSummary(d?.summary || { total: 0, received: 0, pending: 0 })
                setRevForm({ project_id: '', amount: '', invoice_ref: '', payment_mode: 'bank_transfer', received_date: '', status: 'pending', notes: '' })
              }
              setSaving(false)
            }} disabled={saving || !revForm.amount} className="mt-3 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold cursor-pointer disabled:opacity-60">
              {saving ? '⏳' : '+ Log Payment'}
            </button>
          </div>

          {revenue.length === 0 ? <EmptyState icon="💰" label="No revenue logged yet" /> : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-auto">
              <table className="w-full text-xs min-w-[600px]">
                <thead><tr className="bg-slate-50 border-b border-slate-100">{['Project','Amount','Invoice Ref','Mode','Received Date','Status'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
                <tbody>
                  {revenue.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-navy font-medium">{projects.find(p => p.id === r.project_id)?.title || '—'}</td>
                      <td className="px-4 py-3 font-bold text-green-600">₹{r.amount?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-slate-500">{r.invoice_ref || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{r.payment_mode?.replace('_',' ')}</td>
                      <td className="px-4 py-3 text-slate-400">{r.received_date ? new Date(r.received_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3"><Badge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── BID DOCUMENTS ── */}
      {tab === 'bids' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">📄 Log Bid / Proposal Submission</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <select value={bidForm.project_id} onChange={e => setBidForm(p => ({ ...p, project_id: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                <option value="">— Link to Project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <select value={bidForm.tender_id} onChange={e => setBidForm(p => ({ ...p, tender_id: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                <option value="">— Link to Tender —</option>
                {tenders.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <input value={bidForm.bid_ref} onChange={e => setBidForm(p => ({ ...p, bid_ref: e.target.value }))} placeholder="Bid Ref / ID" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={bidForm.bid_value} onChange={e => setBidForm(p => ({ ...p, bid_value: e.target.value }))} placeholder="Bid Value (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="date" value={bidForm.submitted_at} onChange={e => setBidForm(p => ({ ...p, submitted_at: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={bidForm.status} onChange={e => setBidForm(p => ({ ...p, status: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['draft','submitted','shortlisted','won','lost'].map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
              </select>
              <input value={bidForm.doc_url} onChange={e => setBidForm(p => ({ ...p, doc_url: e.target.value }))} placeholder="Document URL / Drive link" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <textarea value={bidForm.notes} onChange={e => setBidForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" rows={1} className="col-span-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={async () => {
              setSaving(true)
              const ok = await govtPost('bids', { ...bidForm, project_id: bidForm.project_id ? Number(bidForm.project_id) : null, tender_id: bidForm.tender_id ? Number(bidForm.tender_id) : null, bid_value: Number(bidForm.bid_value) || 0 })
              if (ok) { const d = await govtFetch('bids'); setBids(d?.bids || []); setBidForm({ project_id: '', tender_id: '', bid_ref: '', bid_value: '', submitted_at: '', status: 'submitted', doc_url: '', notes: '' }) }
              setSaving(false)
            }} disabled={saving} className="mt-3 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold cursor-pointer disabled:opacity-60">
              {saving ? '⏳' : '+ Log Bid'}
            </button>
          </div>

          {bids.length === 0 ? <EmptyState icon="📄" label="No bid submissions logged yet" /> : (
            <div className="space-y-3">
              {bids.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy text-sm">Bid: {b.bid_ref || `#${b.id}`}</p>
                    <p className="text-xs text-slate-400">{b.submitted_at ? new Date(b.submitted_at).toLocaleDateString('en-IN') : 'Date not set'}</p>
                  </div>
                  {b.bid_value !== undefined && <p className="font-bold text-green-600 text-sm">₹{Number(b.bid_value).toLocaleString('en-IN')}</p>}
                  <Badge status={b.status} />
                  {b.doc_url && <a href={b.doc_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-blue-50 hover:text-blue-600">🔗 View Doc</a>}
                  <div className="flex gap-2 flex-shrink-0">
                    {(['submitted','shortlisted','won','lost'] as const).map(s => (
                      <button key={s} onClick={async () => { await govtPatch('bids', b.id, { status: s }); setBids(prev => prev.map(x => x.id === b.id ? { ...x, status: s } : x)) }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${b.status === s ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{s}</button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COMPLIANCE ── */}
      {tab === 'compliance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">✅ Add Compliance Item</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <select value={complianceForm.project_id} onChange={e => setComplianceForm(p => ({ ...p, project_id: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                <option value="">— Select Project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <input value={complianceForm.item} onChange={e => setComplianceForm(p => ({ ...p, item: e.target.value }))} placeholder="Compliance item *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={complianceForm.category} onChange={e => setComplianceForm(p => ({ ...p, category: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['general','legal','financial','technical','environmental','safety'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea value={complianceForm.notes} onChange={e => setComplianceForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" rows={1} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={async () => {
              if (!complianceForm.item) return
              setSaving(true)
              const ok = await govtPost('compliance', { ...complianceForm, project_id: complianceForm.project_id ? Number(complianceForm.project_id) : null })
              if (ok) { const d = await govtFetch('compliance'); setCompliance(d?.compliance || []); setComplianceForm({ project_id: '', item: '', category: 'general', notes: '' }) }
              setSaving(false)
            }} disabled={saving || !complianceForm.item} className="mt-3 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold cursor-pointer disabled:opacity-60">
              {saving ? '⏳' : '+ Add Item'}
            </button>
          </div>

          {/* Group by project */}
          {compliance.length === 0 ? <EmptyState icon="✅" label="No compliance items yet" /> : (
            <div className="space-y-5">
              {projects.map(proj => {
                const items = compliance.filter(c => c.project_id === proj.id)
                if (items.length === 0) return null
                const complete = items.filter(c => c.is_complete).length
                return (
                  <div key={proj.id}>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-navy text-sm">{proj.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${complete === items.length ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{complete}/{items.length} complete</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${items.length > 0 ? (complete / items.length * 100) : 0}%` }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {items.map(item => (
                        <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${item.is_complete ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
                          <button onClick={async () => {
                            const ok = await govtPatch('compliance', item.id, { is_complete: !item.is_complete })
                            if (ok) setCompliance(prev => prev.map(c => c.id === item.id ? { ...c, is_complete: !c.is_complete } : c))
                          }} className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer border-2 transition-colors ${item.is_complete ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}>
                            {item.is_complete && '✓'}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${item.is_complete ? 'line-through text-slate-400' : 'text-navy'}`}>{item.item}</p>
                            <div className="flex gap-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-slate-400 capitalize">{item.category}</span>
                              {item.completed_at && <span className="text-[10px] text-green-500">✓ {new Date(item.completed_at).toLocaleDateString('en-IN')}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {/* Unlinked items */}
              {compliance.filter(c => !c.project_id).length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-400 text-sm mb-2">General Compliance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {compliance.filter(c => !c.project_id).map(item => (
                      <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border ${item.is_complete ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
                        <button onClick={async () => {
                          await govtPatch('compliance', item.id, { is_complete: !item.is_complete })
                          setCompliance(prev => prev.map(c => c.id === item.id ? { ...c, is_complete: !c.is_complete } : c))
                        }} className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer border-2 ${item.is_complete ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}>
                          {item.is_complete && '✓'}
                        </button>
                        <p className={`text-sm font-medium flex-1 ${item.is_complete ? 'line-through text-slate-400' : 'text-navy'}`}>{item.item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MOU TRACKER ── */}
      {tab === 'mous' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">📜 Add MOU / Agreement</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <select value={mouForm.client_id} onChange={e => setMouForm(p => ({ ...p, client_id: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                <option value="">— Link to Client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={mouForm.title} onChange={e => setMouForm(p => ({ ...p, title: e.target.value }))} placeholder="MOU / Agreement title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Signed Date</label>
                <input type="date" value={mouForm.signed_date} onChange={e => setMouForm(p => ({ ...p, signed_date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Expiry Date</label>
                <input type="date" value={mouForm.expiry_date} onChange={e => setMouForm(p => ({ ...p, expiry_date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              </div>
              <select value={mouForm.status} onChange={e => setMouForm(p => ({ ...p, status: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['draft','active','expired','terminated','renewed'].map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
              </select>
              <input value={mouForm.doc_url} onChange={e => setMouForm(p => ({ ...p, doc_url: e.target.value }))} placeholder="Document URL" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <textarea value={mouForm.notes} onChange={e => setMouForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" rows={1} className="col-span-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={async () => {
              if (!mouForm.title) return
              setSaving(true)
              const ok = await govtPost('mous', { ...mouForm, client_id: mouForm.client_id ? Number(mouForm.client_id) : null })
              if (ok) { const d = await govtFetch('mous'); setMous(d?.mous || []); setMouForm({ client_id: '', title: '', signed_date: '', expiry_date: '', doc_url: '', status: 'active', notes: '' }) }
              setSaving(false)
            }} disabled={saving || !mouForm.title} className="mt-3 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold cursor-pointer disabled:opacity-60">
              {saving ? '⏳' : '+ Add MOU'}
            </button>
          </div>

          {mous.length === 0 ? <EmptyState icon="📜" label="No MOUs or agreements tracked yet" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mous.map((m, i) => {
                const daysToExpiry = m.expiry_date ? Math.floor((new Date(m.expiry_date).getTime() - Date.now()) / 86400000) : null
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className={`bg-white rounded-2xl p-5 shadow-sm border ${m.expiring_soon ? 'border-amber-300 shadow-amber-50' : m.status === 'expired' ? 'border-red-200' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div>
                        <p className="font-bold text-navy">{m.title}</p>
                        <p className="text-xs text-slate-400">{clients.find(c => c.id === m.client_id)?.name || `Client #${m.client_id}`}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge status={m.status} />
                        {m.expiring_soon && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">⚠️ Expiring in {daysToExpiry}d</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                      {m.signed_date && <span>📝 Signed: {new Date(m.signed_date).toLocaleDateString('en-IN')}</span>}
                      {m.expiry_date && <span className={`${m.expiring_soon ? 'text-amber-500 font-bold' : m.status === 'expired' ? 'text-red-500 font-bold' : ''}`}>📅 Expires: {new Date(m.expiry_date).toLocaleDateString('en-IN')}</span>}
                    </div>
                    <div className="flex gap-2">
                      {m.doc_url && <a href={m.doc_url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-blue-50 hover:text-blue-600">🔗 View Document</a>}
                      <select value={m.status} onChange={async e => { await govtPatch('mous', m.id, { status: e.target.value }); setMous(prev => prev.map(x => x.id === m.id ? { ...x, status: e.target.value } : x)) }}
                        className="text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer">
                        {['draft','active','expired','terminated','renewed'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={async () => { if (confirm('Delete?')) { await govtDelete('mous', m.id); setMous(prev => prev.filter(x => x.id !== m.id)) } }} className="px-2 py-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 cursor-pointer">🗑️</button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TEAM CHAT ── */}
      {tab === 'chat' && (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
          <span className="text-5xl block mb-4">💬</span>
          <h3 className="font-bold text-navy font-heading text-lg mb-2">Direct Chat — Govt Saarthi Team</h3>
          <p className="text-slate-500 text-sm mb-4">Connect directly with members of the Government Saarthi pillar through the internal messaging system.</p>
          <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3">Use the 💬 chat icon in the top navigation bar to open the Direct Chat panel and message any team member from the Govt Saarthi pillar directly.</p>
        </div>
      )}

      {/* ── DISTRICT MAP ── */}
      {tab === 'map' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-navy font-heading mb-2">State / District Coverage Map</h3>
          <p className="text-sm text-slate-500 mb-4">States where Government Saarthi has active clients or projects.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Bihar', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Maharashtra', 'Delhi', 'Gujarat', 'Jharkhand', 'West Bengal', 'Odisha', 'Chhattisgarh', 'Haryana', 'Punjab', 'Assam', 'Telangana', 'Karnataka'].map(state => {
              const clientCount = clients.filter(c => c.state?.toLowerCase().includes(state.toLowerCase())).length
              const projectCount = projects.filter(p => p.client_name?.toLowerCase().includes(state.toLowerCase())).length
              const hasPresence = clientCount > 0 || projectCount > 0
              return (
                <div key={state} className={`rounded-xl p-4 border text-center transition-colors ${hasPresence ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                  <p className="font-bold text-navy text-sm">{state}</p>
                  {hasPresence ? (
                    <div className="mt-1">
                      {clientCount > 0 && <p className="text-[10px] text-green-600 font-bold">✅ {clientCount} client(s)</p>}
                      {projectCount > 0 && <p className="text-[10px] text-blue-500">🏗️ {projectCount} project(s)</p>}
                    </div>
                  ) : <p className="text-[10px] text-slate-300 mt-1">○ No presence</p>}
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-4">Add clients with state names to populate this map automatically.</p>
        </div>
      )}

      {/* ── Project Task Manager drawer ── */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end" onClick={() => setSelectedProject(null)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-lg h-full bg-white overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-navy font-heading">🏗️ {selectedProject.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Coordination Board</p>
                </div>
                <button onClick={() => setSelectedProject(null)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200">✕</button>
              </div>

              {/* Add task */}
              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-3">
                <input value={taskForm.task} onChange={e => setTaskForm(p => ({ ...p, task: e.target.value }))} placeholder="New task..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none">
                    {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none" />
                </div>
                <button onClick={async () => {
                  if (!taskForm.task) return
                  setSaving(true)
                  const ok = await govtPost('tasks', { ...taskForm, project_id: selectedProject.id })
                  if (ok) { const d = await govtFetch(`tasks&project_id=${selectedProject.id}`); setTasks(d?.tasks || []) }
                  setSaving(false)
                  setTaskForm(p => ({ ...p, task: '', due_date: '' }))
                }} disabled={saving || !taskForm.task} className="w-full px-3 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">
                  {saving ? '⏳' : '+ Add Task'}
                </button>
              </div>

              {/* Task kanban */}
              {(['todo','in_progress','done','blocked'] as const).map(status => {
                const statusTasks = tasks.filter(t => t.project_id === selectedProject.id && t.status === status)
                const statusLabels: Record<string, string> = { todo: '📋 To Do', in_progress: '🔄 In Progress', done: '✅ Done', blocked: '🚫 Blocked' }
                return (
                  <div key={status} className="mb-5">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">{statusLabels[status]} ({statusTasks.length})</p>
                    {statusTasks.length === 0 ? <p className="text-[10px] text-slate-300 mb-3">No tasks in this status</p> : (
                      <div className="space-y-2">
                        {statusTasks.map(t => (
                          <div key={t.id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: TASK_PRIORITY_COLORS[t.priority] }} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${status === 'done' ? 'line-through text-slate-400' : 'text-navy'}`}>{t.task}</p>
                              {t.due_date && <p className="text-[10px] text-slate-400 mt-0.5">Due: {new Date(t.due_date).toLocaleDateString('en-IN')}</p>}
                            </div>
                            <select value={t.status} onChange={async e => {
                              await govtPatch('tasks', t.id, { status: e.target.value })
                              setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: e.target.value } : x))
                            }} className="text-[9px] px-1.5 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer flex-shrink-0">
                              {['todo','in_progress','done','blocked'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8"><InterdeptTaskInbox /></div>
    </div>
  )
}
