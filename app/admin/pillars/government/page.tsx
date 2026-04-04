'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

const TABS = ['🏛️ Tenders', '📋 Project Tracker', '🤝 Govt. Clients', '📄 Documents', '🗺️ District Map'] as const
type Tab = typeof TABS[number]

interface Tender { id: number; title: string; dept: string | null; value: string | null; deadline: string | null; submission_ref: string | null; status: string }
interface GovtClient { id: number; name: string; dept: string | null; state: string | null; contact_person: string | null; contract_value: string | null }
interface GovtProject { id: number; title: string; client_name: string | null; phase: string; progress: number; deadline: string | null; value: string | null }
interface GovtDoc { id: number; title: string; doc_type: string; status: string; file_url: string | null }

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  under_review: { label: 'Under Review', color: '#F59E0B', bg: '#FEF3C7' },
  won: { label: 'Won ✅', color: '#10B981', bg: '#D1FAE5' },
  lost: { label: 'Lost', color: '#EF4444', bg: '#FEE2E2' },
  submitted: { label: 'Submitted', color: '#3B82F6', bg: '#DBEAFE' },
  preparing: { label: 'Preparing', color: '#8B5CF6', bg: '#EDE9FE' },
}

function useGovtData<T>(type: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/govt?type=${type}`)
      const d = res.ok ? await res.json() : {}
      setData(d[type] || [])
    } catch {} finally { setLoading(false) }
  }, [type])

  useEffect(() => { load() }, [load])
  return { data, loading, reload: load }
}

async function govtPost(type: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/govt?type=${type}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  })
  return res.ok
}

async function govtPatch(type: string, id: number, updates: Record<string, unknown>) {
  const res = await fetch(`/api/admin/govt?type=${type}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates })
  })
  return res.ok
}

export default function GovernmentSaarthiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('🏛️ Tenders')
  const { data: tenders, loading: tendersLoading, reload: reloadTenders } = useGovtData<Tender>('tenders')
  const { data: clients, loading: clientsLoading, reload: reloadClients } = useGovtData<GovtClient>('clients')
  const { data: projects, loading: projectsLoading, reload: reloadProjects } = useGovtData<GovtProject>('projects')
  const { data: docs, loading: docsLoading, reload: reloadDocs } = useGovtData<GovtDoc>('docs')
  const [saving, setSaving] = useState(false)

  const [newTender, setNewTender] = useState({ title: '', dept: '', value: '', deadline: '', submission: '' })
  const [newClient, setNewClient] = useState({ name: '', dept: '', state: '', contact: '', value: '' })
  const [newProject, setNewProject] = useState({ title: '', client: '', phase: 'proposal', progress: '0', deadline: '', value: '' })
  const [newDoc, setNewDoc] = useState({ title: '', type: 'MOU', url: '', status: 'valid' })

  const save = async (type: string, body: Record<string, unknown>, reset: () => void, reload: () => void) => {
    setSaving(true)
    const ok = await govtPost(type, body)
    if (ok) { reset(); reload() }
    setSaving(false)
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div><h1 className="text-2xl font-bold text-navy font-heading">🏛️ Government Saarthi</h1><p className="text-slate-500 text-sm">Tenders · Govt. clients · Project tracker · Documents · Districts</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ icon: '📋', label: 'Open Tenders', v: tenders.filter(t => !['won', 'lost'].includes(t.status)).length }, { icon: '🤝', label: 'Govt. Clients', v: clients.length }, { icon: '🏗️', label: 'Active Projects', v: projects.filter(p => p.phase !== 'completed').length }, { icon: '📄', label: 'Documents', v: docs.length }].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"><span className="text-2xl block mb-2">{s.icon}</span><p className="text-2xl font-extrabold text-navy">{s.v}</p><p className="text-xs text-slate-400">{s.label}</p></div>
        ))}
      </div>
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-sm font-bold cursor-pointer border-b-2 -mb-px whitespace-nowrap transition-all ${activeTab === t ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>{t}</button>)}
      </div>

      {/* TENDERS */}
      {activeTab === '🏛️ Tenders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Add Tender</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={newTender.title} onChange={e => setNewTender(p => ({ ...p, title: e.target.value }))} placeholder="Tender title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newTender.dept} onChange={e => setNewTender(p => ({ ...p, dept: e.target.value }))} placeholder="Government dept / ministry" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newTender.value} onChange={e => setNewTender(p => ({ ...p, value: e.target.value }))} placeholder="Tender value (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newTender.submission} onChange={e => setNewTender(p => ({ ...p, submission: e.target.value }))} placeholder="Submission reference / ID" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="date" value={newTender.deadline} onChange={e => setNewTender(p => ({ ...p, deadline: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={() => save('tenders', newTender, () => setNewTender({ title: '', dept: '', value: '', deadline: '', submission: '' }), reloadTenders)} disabled={saving || !newTender.title} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{saving ? '⏳' : '+ Add Tender'}</button>
          </div>
          {tendersLoading ? <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            tenders.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📋</span><p>No tenders tracked yet</p></div> :
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenders.map((t, i) => {
                  const sc = STATUS_CFG[t.status] || STATUS_CFG.under_review
                  const isExpiring = t.deadline && new Date(t.deadline) < new Date(Date.now() + 7 * 86400000)
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`bg-white rounded-2xl p-5 shadow-sm border ${isExpiring ? 'border-red-200' : 'border-slate-100'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-navy pr-2">{t.title}</h3>
                        <select value={t.status} onChange={async e => { await govtPatch('tenders', t.id, { status: e.target.value }); reloadTenders() }} className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer">
                          {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                        </select>
                      </div>
                      {t.dept && <p className="text-xs text-slate-400 mb-2">🏛️ {t.dept}</p>}
                      <div className="flex gap-3 flex-wrap text-xs">
                        {t.value && <span className="font-bold text-green-600">₹{t.value}</span>}
                        {t.deadline && <span className={isExpiring ? 'text-red-500 font-bold' : 'text-slate-400'}>📅 {new Date(t.deadline).toLocaleDateString('en-IN')} {isExpiring && '⚠️'}</span>}
                        {t.submission_ref && <span className="text-slate-400">Ref: {t.submission_ref}</span>}
                      </div>
                      <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </motion.div>
                  )
                })}
              </div>}
        </div>
      )}

      {/* GOVT CLIENTS */}
      {activeTab === '🤝 Govt. Clients' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Add Government Client / Department</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="Entity name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newClient.dept} onChange={e => setNewClient(p => ({ ...p, dept: e.target.value }))} placeholder="Ministry / Department" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newClient.state} onChange={e => setNewClient(p => ({ ...p, state: e.target.value }))} placeholder="State" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newClient.contact} onChange={e => setNewClient(p => ({ ...p, contact: e.target.value }))} placeholder="Officer name / contact" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newClient.value} onChange={e => setNewClient(p => ({ ...p, value: e.target.value }))} placeholder="Contract value (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={() => save('clients', newClient, () => setNewClient({ name: '', dept: '', state: '', contact: '', value: '' }), reloadClients)} disabled={saving || !newClient.name} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{saving ? '⏳' : '+ Add Client'}</button>
          </div>
          {clientsLoading ? <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            clients.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🤝</span><p>No government clients yet</p></div> :
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 border-b border-slate-100">{['Entity', 'Department', 'State', 'Contact', 'Contract Value'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-bold text-navy">{c.name}</td>
                        <td className="px-4 py-3 text-slate-500">{c.dept || '—'}</td>
                        <td className="px-4 py-3 text-slate-500">{c.state || '—'}</td>
                        <td className="px-4 py-3 text-slate-500">{c.contact_person || '—'}</td>
                        <td className="px-4 py-3 font-bold text-green-600">{c.contract_value ? `₹${c.contract_value}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </div>
      )}

      {/* PROJECT TRACKER */}
      {activeTab === '📋 Project Tracker' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Add Government Project</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} placeholder="Project title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newProject.client} onChange={e => setNewProject(p => ({ ...p, client: e.target.value }))} placeholder="Government client" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={newProject.phase} onChange={e => setNewProject(p => ({ ...p, phase: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['proposal', 'approval', 'execution', 'review', 'completed'].map(ph => <option key={ph} value={ph}>{ph}</option>)}
              </select>
              <input type="number" min="0" max="100" value={newProject.progress} onChange={e => setNewProject(p => ({ ...p, progress: e.target.value }))} placeholder="Progress %" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newProject.value} onChange={e => setNewProject(p => ({ ...p, value: e.target.value }))} placeholder="Project value (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="date" value={newProject.deadline} onChange={e => setNewProject(p => ({ ...p, deadline: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={() => save('projects', newProject, () => setNewProject({ title: '', client: '', phase: 'proposal', progress: '0', deadline: '', value: '' }), reloadProjects)} disabled={saving || !newProject.title} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{saving ? '⏳' : '+ Add Project'}</button>
          </div>
          {projectsLoading ? <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            projects.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🏗️</span><p>No projects yet</p></div> :
              <div className="space-y-3">
                {projects.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between mb-2">
                      <div><h3 className="font-bold text-navy">{p.title}</h3>{p.client_name && <p className="text-xs text-slate-400">{p.client_name}</p>}</div>
                      <div className="text-right">{p.value && <p className="font-bold text-green-600 text-sm">₹{p.value}</p>}{p.deadline && <p className="text-[10px] text-slate-400">Due: {new Date(p.deadline).toLocaleDateString('en-IN')}</p>}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select value={p.phase} onChange={async e => { await govtPatch('projects', p.id, { phase: e.target.value }); reloadProjects() }} className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white capitalize cursor-pointer">
                        {['proposal', 'approval', 'execution', 'review', 'completed'].map(ph => <option key={ph} value={ph}>{ph}</option>)}
                      </select>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${p.progress}%` }} /></div>
                      <span className="text-xs font-bold text-navy">{p.progress}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>}
        </div>
      )}

      {/* DOCUMENTS */}
      {activeTab === '📄 Documents' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Add Official Document / MOU</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input value={newDoc.title} onChange={e => setNewDoc(p => ({ ...p, title: e.target.value }))} placeholder="Document title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={newDoc.type} onChange={e => setNewDoc(p => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['MOU', 'Contract', 'Letter of Intent', 'Quotation', 'Report', 'Certificate'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={newDoc.status} onChange={e => setNewDoc(p => ({ ...p, status: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['valid', 'expired', 'pending', 'draft'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={newDoc.url} onChange={e => setNewDoc(p => ({ ...p, url: e.target.value }))} placeholder="Drive / document URL" className="col-span-4 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={() => save('docs', { title: newDoc.title, type: newDoc.type, url: newDoc.url, status: newDoc.status }, () => setNewDoc({ title: '', type: 'MOU', url: '', status: 'valid' }), reloadDocs)} disabled={saving || !newDoc.title} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{saving ? '⏳' : '+ Add Document'}</button>
          </div>
          {docsLoading ? <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            docs.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📄</span><p>No documents yet</p></div> :
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((d, i) => {
                  const STATUS_COLORS: Record<string, string> = { valid: '#10B981', expired: '#EF4444', pending: '#F59E0B', draft: '#6B7280' }
                  const c = STATUS_COLORS[d.status] || '#6B7280'
                  return (
                    <motion.div key={d.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">📄</div>
                        <div className="flex-1 min-w-0"><p className="font-bold text-navy truncate">{d.title}</p><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">{d.doc_type}</span></div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${c}20`, color: c }}>{d.status}</span>
                      </div>
                      {d.file_url ? <a href={d.file_url} target="_blank" rel="noreferrer" className="block w-full text-center py-1.5 rounded-xl bg-slate-50 text-slate-500 text-xs hover:bg-blue-50 hover:text-blue-600 cursor-pointer">🔗 Open Document</a>
                        : <p className="text-[10px] text-slate-300 text-center mt-2">No file URL provided</p>}
                    </motion.div>
                  )
                })}
              </div>}
        </div>
      )}

      {/* DISTRICT MAP */}
      {activeTab === '🗺️ District Map' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-navy font-heading mb-2">State / District Coverage Map</h3>
          <p className="text-sm text-slate-500 mb-4">States where Government Saarthi has active government clients.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Bihar', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Maharashtra', 'Delhi', 'Gujarat', 'Jharkhand', 'West Bengal', 'Odisha', 'Chhattisgarh', 'Haryana'].map(state => {
              const hasClient = clients.some(c => c.state?.toLowerCase().includes(state.toLowerCase()))
              return (
                <div key={state} className={`rounded-xl p-4 border text-center cursor-default transition-colors ${hasClient ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                  <p className="font-bold text-navy text-sm">{state}</p>
                  <p className={`text-[10px] mt-1 font-bold ${hasClient ? 'text-green-600' : 'text-slate-300'}`}>{hasClient ? '✅ Active' : '○ No presence'}</p>
                  {hasClient && <p className="text-[10px] text-green-500">{clients.filter(c => c.state?.toLowerCase().includes(state.toLowerCase())).length} client(s)</p>}
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-4">Add government clients above with their state to automatically highlight on this map.</p>
        </div>
      )}
    </div>
  )
}
