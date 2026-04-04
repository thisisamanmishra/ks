'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

const TABS = ['🏢 B2B Clients', '💼 Sales Pipeline', '📊 Market Research', '🤝 Partnerships', '🎯 Targets'] as const
type Tab = typeof TABS[number]

interface MarketClient { id: number; company: string; industry: string | null; contact_person: string | null; phone: string | null; email: string | null; contract_value: string | null; stage: string }
interface Deal { id: number; company: string; service: string | null; value: string | null; probability: number; close_date: string | null; stage: string }
interface Research { id: number; sector: string; insight: string; source: string | null; research_date: string }
interface Partner { id: number; name: string; partner_type: string; benefit: string | null; contact_person: string | null }

const STAGE_CFG: Record<string, { color: string; bg: string }> = {
  prospect: { color: '#6B7280', bg: '#F3F4F6' }, qualifying: { color: '#3B82F6', bg: '#DBEAFE' },
  proposal: { color: '#F59E0B', bg: '#FEF3C7' }, negotiation: { color: '#8B5CF6', bg: '#EDE9FE' },
  won: { color: '#10B981', bg: '#D1FAE5' }, lost: { color: '#EF4444', bg: '#FEE2E2' },
}

function useMarketData<T>(type: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/market?type=${type}`)
      const d = res.ok ? await res.json() : {}
      setData(d[type] || [])
    } catch {} finally { setLoading(false) }
  }, [type])
  useEffect(() => { load() }, [load])
  return { data, loading, reload: load }
}

async function marketPost(type: string, body: Record<string, unknown>) {
  return fetch(`/api/admin/market?type=${type}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

async function marketPatch(type: string, id: number, updates: Record<string, unknown>) {
  return fetch(`/api/admin/market?type=${type}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
}

export default function MarketSaarthiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('🏢 B2B Clients')
  const { data: clients, loading: cLoading, reload: reloadClients } = useMarketData<MarketClient>('clients')
  const { data: deals, loading: dLoading, reload: reloadDeals } = useMarketData<Deal>('deals')
  const { data: research, loading: rLoading, reload: reloadResearch } = useMarketData<Research>('research')
  const { data: partners, loading: pLoading, reload: reloadPartners } = useMarketData<Partner>('partners')
  const [saving, setSaving] = useState(false)

  const [newClient, setNewClient] = useState({ company: '', industry: '', contact: '', phone: '', email: '', value: '', stage: 'prospect' })
  const [newDeal, setNewDeal] = useState({ company: '', service: '', value: '', probability: '50', closeDate: '' })
  const [newResearch, setNewResearch] = useState({ sector: '', insight: '', source: '' })
  const [newPartner, setNewPartner] = useState({ name: '', type: 'channel', benefit: '', contact: '' })

  const save = async (type: string, body: Record<string, unknown>, reset: () => void, reload: () => void) => {
    setSaving(true)
    const res = await marketPost(type, body)
    if (res.ok) { reset(); reload() }
    setSaving(false)
  }

  const totalPipeline = deals.reduce((a, d) => a + (Number(d.value) || 0), 0)
  const weightedPipeline = deals.reduce((a, d) => a + ((Number(d.value) || 0) * d.probability / 100), 0)

  const targets = [
    { label: 'B2B Clients', current: clients.length, target: 20, color: '#3B82F6' },
    { label: 'Pipeline Value', current: totalPipeline, target: 5000000, color: '#10B981', isRevenue: true },
    { label: 'Deals Won', current: deals.filter(d => d.stage === 'won').length, target: 10, color: '#FF6B35' },
    { label: 'Partnerships', current: partners.length, target: 5, color: '#8B5CF6' },
  ]

  return (
    <div className="space-y-5 max-w-7xl">
      <div><h1 className="text-2xl font-bold text-navy font-heading">🏪 Market Saarthi</h1><p className="text-slate-500 text-sm">B2B clients · Sales pipeline · Market research · Partnerships · Targets</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ icon: '🏢', label: 'B2B Clients', v: clients.length }, { icon: '💼', label: 'Active Deals', v: deals.filter(d => !['won', 'lost'].includes(d.stage)).length }, { icon: '💰', label: 'Pipeline Value', v: `₹${(totalPipeline / 100000).toFixed(1)}L` }, { icon: '📈', label: 'Weighted Pipeline', v: `₹${(weightedPipeline / 100000).toFixed(1)}L` }].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"><span className="text-2xl block mb-2">{s.icon}</span><p className="text-2xl font-extrabold text-navy">{s.v}</p><p className="text-xs text-slate-400">{s.label}</p></div>
        ))}
      </div>
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-sm font-bold cursor-pointer border-b-2 -mb-px whitespace-nowrap transition-all ${activeTab === t ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>{t}</button>)}
      </div>

      {/* B2B CLIENTS */}
      {activeTab === '🏢 B2B Clients' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Add B2B Client</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={newClient.company} onChange={e => setNewClient(p => ({ ...p, company: e.target.value }))} placeholder="Company name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newClient.industry} onChange={e => setNewClient(p => ({ ...p, industry: e.target.value }))} placeholder="Industry" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newClient.contact} onChange={e => setNewClient(p => ({ ...p, contact: e.target.value }))} placeholder="Key contact person" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newClient.value} onChange={e => setNewClient(p => ({ ...p, value: e.target.value }))} placeholder="Contract value (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={() => save('clients', newClient, () => setNewClient({ company: '', industry: '', contact: '', phone: '', email: '', value: '', stage: 'prospect' }), reloadClients)} disabled={saving || !newClient.company} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{saving ? '⏳' : '+ Add Client'}</button>
          </div>
          {cLoading ? <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            clients.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🏢</span><p>No B2B clients yet</p></div> :
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 border-b border-slate-100">{['Company', 'Industry', 'Contact', 'Phone', 'Contract Value', 'Stage'].map(h => <th key={h} className="px-3 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-3 py-3 font-bold text-navy">{c.company}</td>
                        <td className="px-3 py-3 text-slate-400">{c.industry || '—'}</td>
                        <td className="px-3 py-3 text-slate-500">{c.contact_person || '—'}</td>
                        <td className="px-3 py-3">{c.phone ? <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-600 hover:underline">{c.phone}</a> : '—'}</td>
                        <td className="px-3 py-3 font-bold text-green-600">{c.contract_value ? `₹${c.contract_value}` : '—'}</td>
                        <td className="px-3 py-3">
                          <select value={c.stage} onChange={async e => { await marketPatch('clients', c.id, { stage: e.target.value }); reloadClients() }} className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer">
                            {Object.keys(STAGE_CFG).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </div>
      )}

      {/* SALES PIPELINE */}
      {activeTab === '💼 Sales Pipeline' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Add Deal to Pipeline</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={newDeal.company} onChange={e => setNewDeal(p => ({ ...p, company: e.target.value }))} placeholder="Company / prospect *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newDeal.service} onChange={e => setNewDeal(p => ({ ...p, service: e.target.value }))} placeholder="Service / product" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newDeal.value} onChange={e => setNewDeal(p => ({ ...p, value: e.target.value }))} placeholder="Deal value (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <div className="col-span-2 space-y-1">
                <input type="range" min="0" max="100" value={newDeal.probability} onChange={e => setNewDeal(p => ({ ...p, probability: e.target.value }))} className="w-full cursor-pointer" />
                <p className="text-xs text-slate-500">{newDeal.probability}% probability of closing</p>
              </div>
              <input type="date" value={newDeal.closeDate} onChange={e => setNewDeal(p => ({ ...p, closeDate: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={() => save('deals', newDeal, () => setNewDeal({ company: '', service: '', value: '', probability: '50', closeDate: '' }), reloadDeals)} disabled={saving || !newDeal.company} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{saving ? '⏳' : '+ Add Deal'}</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 border border-slate-100 text-center shadow-sm"><p className="text-xl font-extrabold text-navy">₹{(totalPipeline / 100000).toFixed(1)}L</p><p className="text-xs text-slate-400">Total Pipeline</p></div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 text-center shadow-sm"><p className="text-xl font-extrabold text-green-600">₹{(weightedPipeline / 100000).toFixed(1)}L</p><p className="text-xs text-slate-400">Weighted Forecast</p></div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 text-center shadow-sm"><p className="text-xl font-extrabold text-purple-600">{deals.filter(d => d.stage === 'won').length}</p><p className="text-xs text-slate-400">Deals Won</p></div>
          </div>
          {dLoading ? <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            deals.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">💼</span><p>No deals in pipeline yet</p></div> :
              <div className="space-y-3">
                {deals.map((d, i) => {
                  const sc = STAGE_CFG[d.stage] || STAGE_CFG.qualifying
                  return (
                    <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-start justify-between mb-3">
                        <div><h3 className="font-bold text-navy">{d.company}</h3>{d.service && <p className="text-xs text-slate-400">{d.service}</p>}</div>
                        <div className="text-right"><p className="font-bold text-green-600">{d.value ? `₹${Number(d.value).toLocaleString('en-IN')}` : '—'}</p>{d.close_date && <p className="text-[10px] text-slate-400">{new Date(d.close_date).toLocaleDateString('en-IN')}</p>}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select value={d.stage} onChange={async e => { await marketPatch('deals', d.id, { stage: e.target.value }); reloadDeals() }} className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer capitalize">
                          {Object.keys(STAGE_CFG).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-400" style={{ width: `${d.probability}%` }} /></div>
                        <span className="text-xs font-bold text-navy">{d.probability}%</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>}
        </div>
      )}

      {/* MARKET RESEARCH */}
      {activeTab === '📊 Market Research' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Add Market Insight</h4>
            <div className="grid grid-cols-2 gap-3">
              <input value={newResearch.sector} onChange={e => setNewResearch(p => ({ ...p, sector: e.target.value }))} placeholder="Sector / industry *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newResearch.source} onChange={e => setNewResearch(p => ({ ...p, source: e.target.value }))} placeholder="Source (field research, etc.)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <textarea rows={3} value={newResearch.insight} onChange={e => setNewResearch(p => ({ ...p, insight: e.target.value }))} placeholder="Market insight / finding *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={() => save('research', newResearch, () => setNewResearch({ sector: '', insight: '', source: '' }), reloadResearch)} disabled={saving || !newResearch.sector || !newResearch.insight} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{saving ? '⏳' : '+ Add Insight'}</button>
          </div>
          {rLoading ? <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            research.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📊</span><p>No market research yet</p></div> :
              <div className="space-y-3">
                {research.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">{r.sector}</span>
                      <span className="text-[10px] text-slate-400">{r.research_date}</span>
                      {r.source && <span className="text-[10px] text-slate-400">· {r.source}</span>}
                    </div>
                    <p className="text-sm text-slate-600">{r.insight}</p>
                  </div>
                ))}
              </div>}
        </div>
      )}

      {/* PARTNERSHIPS */}
      {activeTab === '🤝 Partnerships' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Add Business Partner</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input value={newPartner.name} onChange={e => setNewPartner(p => ({ ...p, name: e.target.value }))} placeholder="Partner name *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={newPartner.type} onChange={e => setNewPartner(p => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['channel', 'reseller', 'co-marketing', 'technology', 'referral'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={newPartner.contact} onChange={e => setNewPartner(p => ({ ...p, contact: e.target.value }))} placeholder="Contact person" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newPartner.benefit} onChange={e => setNewPartner(p => ({ ...p, benefit: e.target.value }))} placeholder="Key benefit / offering" className="col-span-4 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={() => save('partners', newPartner, () => setNewPartner({ name: '', type: 'channel', benefit: '', contact: '' }), reloadPartners)} disabled={saving || !newPartner.name} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{saving ? '⏳' : '+ Add Partner'}</button>
          </div>
          {pLoading ? <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            partners.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🤝</span><p>No partnerships yet</p></div> :
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partners.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center font-bold text-purple-600">{p.name.charAt(0)}</div>
                      <div><p className="font-bold text-navy">{p.name}</p><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] capitalize">{p.partner_type}</span></div>
                    </div>
                    {p.benefit && <p className="text-xs text-slate-500 mb-1">{p.benefit}</p>}
                    {p.contact_person && <p className="text-[10px] text-slate-400">Contact: {p.contact_person}</p>}
                  </motion.div>
                ))}
              </div>}
        </div>
      )}

      {/* TARGETS */}
      {activeTab === '🎯 Targets' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-navy font-heading mb-6">Monthly Sales Targets</h3>
          <div className="space-y-5">
            {targets.map((t, i) => {
              const pct = Math.min((t.current / t.target) * 100, 100)
              return (
                <motion.div key={t.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-slate-700">{t.label}</span>
                    <span className="font-bold text-navy">{t.isRevenue ? `₹${(t.current / 100000).toFixed(1)}L / ₹${(t.target / 100000).toFixed(1)}L` : `${t.current} / ${t.target}`}
                      <span className={`ml-2 text-xs ${pct >= 100 ? 'text-green-600' : pct >= 70 ? 'text-amber-500' : 'text-red-500'}`}>({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.1 + 0.3, duration: 0.7 }} className="h-full rounded-full" style={{ background: t.color }} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
