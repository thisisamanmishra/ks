'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Campaign { id: number; name: string; type: string; channel: string; status: string; budget: number | null; start_date: string | null; end_date: string | null; leads_generated: number | null; created_at: string }

const TABS = [
  { key: 'campaigns', label: '📣 Campaigns' },
  { key: 'leads', label: '📊 Lead Sources' },
  { key: 'calendar', label: '📅 Content Calendar' },
  { key: 'referral', label: '🤝 Referrals' },
  { key: 'events', label: '🎪 Events' },
  { key: 'competitor', label: '🔍 Competitor Intel' },
  { key: 'brand', label: '🎨 Brand Assets' },
] as const
type Tab = typeof TABS[number]['key']

const CAMPAIGN_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#6B7280', bg: '#F3F4F6' },
  active: { label: 'Active', color: '#10B981', bg: '#D1FAE5' },
  paused: { label: 'Paused', color: '#F59E0B', bg: '#FEF3C7' },
  completed: { label: 'Completed', color: '#3B82F6', bg: '#DBEAFE' },
}

const CONTENT_TYPES = ['Blog Post', 'Social Media', 'Email Newsletter', 'Video', 'Webinar', 'Event', 'Ad Campaign']

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('campaigns')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCamp, setShowNewCamp] = useState(false)
  const [campForm, setCampForm] = useState({ name: '', type: 'digital', channel: 'social', budget: '', start_date: '', end_date: '' })
  const [savingCamp, setSavingCamp] = useState(false)
  // Content calendar
  const [calItems, setCalItems] = useState<{ id: string; title: string; type: string; date: string; status: string; platform: string }[]>([])
  const [newCal, setNewCal] = useState({ title: '', type: 'Blog Post', date: '', platform: 'Instagram', status: 'planned' })
  // Referrals
  const [referrals, setReferrals] = useState<{ id: string; name: string; code: string; referrals: number; commission: number }[]>([])
  const [newRef, setNewRef] = useState({ name: '', code: '' })
  // Events (connected to global events table)
  const [events, setEvents] = useState<any[]>([])
  const [newEvent, setNewEvent] = useState({ title: '', type: 'seminar', date: '', venue: '', capacity: '', short_desc: '', fee: '', prize: '' })
  // Competitor notes
  const [compNotes, setCompNotes] = useState<{ id: string; competitor: string; strength: string; weakness: string; note: string }[]>([])
  const [newComp, setNewComp] = useState({ competitor: '', strength: '', weakness: '', note: '' })
  // Brand assets
  const [brandAssets, setBrandAssets] = useState<{ id: string; name: string; type: string; url: string; description: string }[]>([])
  const [newAsset, setNewAsset] = useState({ name: '', type: 'Logo', url: '', description: '' })

  const loadSubData = useCallback(async () => {
    try {
      const routes = ['calendar', 'referrals', 'events', 'competitor', 'brand']
      const promises = routes.map(r => fetch(`/api/admin/marketing/sub?type=${r}`).then(res => res.json()))
      // Also fetch global events
      const globalEventsRes = await fetch('/api/events?limit=50').then(res => res.json())
      const results = await Promise.all(promises)
      setCalItems(results[0].calendar || [])
      setReferrals(results[1].referrals || [])
      setCompNotes(results[2].competitor || [])
      setBrandAssets(results[3].brand || [])
      setEvents(globalEventsRes.events || [])
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { loadSubData() }, [loadSubData])

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/campaigns')
      if (res.ok) { const d = await res.json(); setCampaigns(d.campaigns || []) }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingCamp(true)
    try {
      await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...campForm, budget: campForm.budget ? Number(campForm.budget) : null }) })
      setShowNewCamp(false); setCampForm({ name: '', type: 'digital', channel: 'social', budget: '', start_date: '', end_date: '' }); fetchCampaigns()
    } catch {} finally { setSavingCamp(false) }
  }

  const saveCalItem = async () => {
    if (!newCal.title) return
    const res = await fetch('/api/admin/marketing/sub', { method: 'POST', body: JSON.stringify({ routeType: 'calendar', title: newCal.title, type: newCal.type, date: newCal.date || null, platform: newCal.platform, status: newCal.status }) })
    if (res.ok) { const { record } = await res.json(); setCalItems(p => [record, ...p]) }
    setNewCal({ title: '', type: 'Blog Post', date: '', platform: 'Instagram', status: 'planned' })
  }

  const saveReferral = async () => {
    if (!newRef.name) return
    const code = newRef.code || `REF${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const res = await fetch('/api/admin/marketing/sub', { method: 'POST', body: JSON.stringify({ routeType: 'referrals', name: newRef.name, code, referrals: 0, commission: 0 }) })
    if (res.ok) { const { record } = await res.json(); setReferrals(p => [record, ...p]) }
    setNewRef({ name: '', code: '' })
  }

  const saveEvent = async () => {
    if (!newEvent.title || !newEvent.date) return
    const payload = {
      title: newEvent.title,
      type: newEvent.type,
      short_description: newEvent.short_desc || 'Join us for this exciting event.',
      event_date: new Date(newEvent.date).toISOString(),
      venue: newEvent.venue,
      max_participants: Number(newEvent.capacity) || null,
      registration_fee: Number(newEvent.fee) || 0,
      prize_pool: newEvent.prize || null
    }
    const res = await fetch('/api/events', { method: 'POST', body: JSON.stringify(payload) })
    if (res.ok) { 
      const { event } = await res.json()
      setEvents(p => [event, ...p]) 
    }
    setNewEvent({ title: '', type: 'seminar', date: '', venue: '', capacity: '', short_desc: '', fee: '', prize: '' })
  }

  const saveCompNote = async () => {
    if (!newComp.competitor) return
    const res = await fetch('/api/admin/marketing/sub', { method: 'POST', body: JSON.stringify({ routeType: 'competitor', ...newComp }) })
    if (res.ok) { const { record } = await res.json(); setCompNotes(p => [record, ...p]) }
    setNewComp({ competitor: '', strength: '', weakness: '', note: '' })
  }

  const saveBrandAsset = async () => {
    if (!newAsset.name || !newAsset.url) return
    const res = await fetch('/api/admin/marketing/sub', { method: 'POST', body: JSON.stringify({ routeType: 'brand', ...newAsset }) })
    if (res.ok) { const { record } = await res.json(); setBrandAssets(p => [record, ...p]) }
    setNewAsset({ name: '', type: 'Logo', url: '', description: '' })
  }

  const deleteItem = async (routeType: string, id: string | number) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    // For global events
    if (routeType === 'events') {
      const res = await fetch('/api/events', { 
        method: 'DELETE',
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setEvents(p => p.filter(x => x.id !== id))
      }
      return
    }
    
    const res = await fetch('/api/admin/marketing/sub', { method: 'DELETE', body: JSON.stringify({ routeType, id }) })
    if (res.ok) {
      if (routeType === 'calendar') setCalItems(p => p.filter(x => x.id !== id))
      if (routeType === 'referrals') setReferrals(p => p.filter(x => x.id !== id))
      if (routeType === 'competitor') setCompNotes(p => p.filter(x => x.id !== id))
      if (routeType === 'brand') setBrandAssets(p => p.filter(x => x.id !== id))
    }
  }

  const deleteCampaign = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    const res = await fetch('/api/admin/campaigns', { method: 'DELETE', body: JSON.stringify({ id }) })
    if (res.ok) setCampaigns(p => p.filter(c => c.id !== id))
  }

  // Dynamic lead source data from campaigns
  const leadSources = useMemo(() => {
    const map = new Map<string, number>()
    let total = 0
    campaigns.forEach(c => {
      const leads = c.leads_generated || 0
      if (leads > 0) {
        map.set(c.channel, (map.get(c.channel) || 0) + leads)
        total += leads
      }
    })
    
    const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#FF6B35', '#F59E0B', '#E1306C', '#1DA1F2']
    let i = 0
    
    const result = Array.from(map.entries()).map(([source, count]) => ({
      source: source || 'unknown',
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
      color: colors[i++ % colors.length]
    })).sort((a, b) => b.count - a.count)
    
    if (result.length === 0) {
      return [{ source: 'No Data', count: 0, pct: 0, color: '#CBD5E1' }]
    }
    return result
  }, [campaigns])

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-navy font-heading">📣 Marketing Head</h1>
        <p className="text-slate-500 text-sm">Campaigns · Lead analytics · Content calendar · Referrals · Events · Brand</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-bold cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${activeTab === t.key ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CAMPAIGNS ── */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {[{ label: 'Total', v: campaigns.length, c: '#1B3A6B' }, { label: 'Active', v: campaigns.filter(c => c.status === 'active').length, c: '#10B981' }, { label: 'Completed', v: campaigns.filter(c => c.status === 'completed').length, c: '#3B82F6' }].map(s => (
                <div key={s.label} className="bg-white rounded-xl px-4 py-2.5 border border-slate-100 text-center shadow-sm">
                  <p className="text-xl font-extrabold" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-[10px] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowNewCamp(v => !v)} className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#FF6B35' }}>+ New Campaign</button>
          </div>

          <AnimatePresence>
            {showNewCamp && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <form onSubmit={createCampaign} className="space-y-3">
                  <input required value={campForm.name} onChange={e => setCampForm(p => ({ ...p, name: e.target.value }))} placeholder="Campaign name *" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                  <div className="grid grid-cols-3 gap-3">
                    <select value={campForm.type} onChange={e => setCampForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                      {['digital', 'offline', 'hybrid', 'referral', 'event'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={campForm.channel} onChange={e => setCampForm(p => ({ ...p, channel: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                      {['social', 'email', 'whatsapp', 'google_ads', 'linkedin', 'field', 'referral'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="number" value={campForm.budget} onChange={e => setCampForm(p => ({ ...p, budget: e.target.value }))} placeholder="Budget (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-slate-400 mb-1 block">Start Date</label><input type="date" value={campForm.start_date} onChange={e => setCampForm(p => ({ ...p, start_date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" /></div>
                    <div><label className="text-xs text-slate-400 mb-1 block">End Date</label><input type="date" value={campForm.end_date} onChange={e => setCampForm(p => ({ ...p, end_date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" /></div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={savingCamp} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60" style={{ background: '#1B3A6B' }}>{savingCamp ? '⏳' : '📣 Launch Campaign'}</button>
                    <button type="button" onClick={() => setShowNewCamp(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse border border-slate-100" />) :
              campaigns.length === 0 ? <div className="col-span-3 bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📣</span><p>No campaigns yet. Create your first campaign above.</p></div> :
                campaigns.map((c, i) => {
                  const sc = CAMPAIGN_STATUS[c.status] || CAMPAIGN_STATUS.draft
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-navy truncate pr-2">{c.name}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                          <button onClick={() => deleteCampaign(c.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                        </div>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium capitalize">{c.type}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium capitalize">{c.channel}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {c.budget && <div className="p-2 rounded-xl bg-slate-50"><p className="text-[10px] text-slate-400">Budget</p><p className="font-bold text-navy">₹{Number(c.budget).toLocaleString('en-IN')}</p></div>}
                        {c.leads_generated !== null && <div className="p-2 rounded-xl bg-green-50"><p className="text-[10px] text-slate-400">Leads</p><p className="font-bold text-green-600">{c.leads_generated}</p></div>}
                      </div>
                      {c.start_date && <p className="text-[10px] text-slate-400 mt-2">📅 {new Date(c.start_date).toLocaleDateString('en-IN')} {c.end_date && `→ ${new Date(c.end_date).toLocaleDateString('en-IN')}`}</p>}
                    </motion.div>
                  )
                })}
          </div>
        </div>
      )}

      {/* ── LEAD SOURCES ── */}
      {activeTab === 'leads' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-5">📊 Lead Source Analytics</h3>
              <div className="space-y-4">
                {leadSources.map((s: { source: string; count: number; pct: number; color: string }, i: number) => (
                  <motion.div key={s.source} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-600">{s.source}</span>
                      <span className="font-bold text-navy">{s.count} leads ({s.pct}%)</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: i * 0.08 + 0.3, duration: 0.6 }}
                        className="h-full rounded-full" style={{ background: s.color }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-5">🏆 Top Performing Channels</h3>
              <div className="space-y-3">
                {leadSources.sort((a, b) => b.count - a.count).map((s: { source: string; count: number; pct: number; color: string }, i: number) => (
                  <div key={s.source} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <span className="text-lg font-bold text-slate-300">#{i + 1}</span>
                    <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    <span className="font-medium text-slate-700 flex-1">{s.source}</span>
                    <span className="font-bold text-navy">{s.count}</span>
                    <span className="text-xs text-slate-400">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT CALENDAR ── */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-3">Add to Calendar</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <input value={newCal.title} onChange={e => setNewCal(p => ({ ...p, title: e.target.value }))} placeholder="Title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={newCal.type} onChange={e => setNewCal(p => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={newCal.platform} onChange={e => setNewCal(p => ({ ...p, platform: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['Instagram', 'LinkedIn', 'YouTube', 'Email', 'Blog', 'WhatsApp', 'Twitter'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="date" value={newCal.date} onChange={e => setNewCal(p => ({ ...p, date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={saveCalItem} className="mt-3 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">+ Add to Calendar</button>
          </div>
          {calItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📅</span><p>No content scheduled yet</p></div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {['Content', 'Type', 'Platform', 'Date', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}
                </tr></thead>
                <tbody>
                  {calItems.sort((a, b) => a.date.localeCompare(b.date)).map(item => {
                    const isPast = item.date && new Date(item.date) < new Date()
                    return (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-navy">{item.title}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold">{item.type}</span></td>
                        <td className="px-4 py-3 text-slate-500">{item.platform}</td>
                        <td className="px-4 py-3 text-slate-500">{item.date ? new Date(item.date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPast ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{isPast ? 'Published' : 'Scheduled'}</span></td>
                        <td className="px-4 py-3"><button onClick={() => deleteItem('calendar', item.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── REFERRALS ── */}
      {activeTab === 'referral' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-3">Add Referral Partner / Affiliate</h4>
            <div className="flex gap-3">
              <input value={newRef.name} onChange={e => setNewRef(p => ({ ...p, name: e.target.value }))} placeholder="Partner name *" className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newRef.code} onChange={e => setNewRef(p => ({ ...p, code: e.target.value }))} placeholder="Referral code (auto-gen if empty)" className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <button onClick={saveReferral} className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer whitespace-nowrap hover:opacity-90">+ Add Partner</button>
            </div>
          </div>
          {referrals.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🤝</span><p>No referral partners yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {referrals.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center font-bold text-purple-600">{r.name.charAt(0)}</div>
                    <div className="flex-1"><p className="font-bold text-navy">{r.name}</p><p className="text-[10px] text-slate-400">Code: <span className="font-mono font-bold text-accent">{r.code}</span></p></div>
                    <button onClick={() => deleteItem('referrals', r.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-slate-50 text-center"><p className="text-lg font-bold text-navy">{r.referrals}</p><p className="text-[10px] text-slate-400">Referrals</p></div>
                    <div className="p-2 rounded-xl bg-green-50 text-center"><p className="text-lg font-bold text-green-600">₹{r.commission.toLocaleString('en-IN')}</p><p className="text-[10px] text-slate-400">Commission</p></div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EVENTS ── */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-3">Create Event / Seminar / Hackathon</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Event title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['seminar', 'workshop', 'hackathon', 'webinar', 'podcast', 'other'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
              <input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={newEvent.capacity} onChange={e => setNewEvent(p => ({ ...p, capacity: e.target.value }))} placeholder="Capacity" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newEvent.venue} onChange={e => setNewEvent(p => ({ ...p, venue: e.target.value }))} placeholder="Venue / Link" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newEvent.short_desc} onChange={e => setNewEvent(p => ({ ...p, short_desc: e.target.value }))} placeholder="Short Description" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={newEvent.fee} onChange={e => setNewEvent(p => ({ ...p, fee: e.target.value }))} placeholder="Reg. Fee (₹)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newEvent.prize} onChange={e => setNewEvent(p => ({ ...p, prize: e.target.value }))} placeholder="Prize Pool (e.g. ₹5,000)" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={saveEvent} className="mt-3 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">🎪 Create Event</button>
          </div>
          {events.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🎪</span><p>No events yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev, i) => (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-navy">{ev.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold">{ev.type}</span>
                      <button onClick={() => deleteItem('events', ev.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-slate-50 text-center"><p className="text-sm font-bold text-navy">{ev.max_participants || 'Unlimited'}</p><p className="text-[10px] text-slate-400">Capacity</p></div>
                    <div className="p-2 rounded-xl bg-slate-50 text-center"><p className="text-sm font-bold text-navy">₹{ev.registration_fee || '0'}</p><p className="text-[10px] text-slate-400">Fee</p></div>
                  </div>
                  {ev.prize_pool && <p className="text-xs text-orange-600 font-bold mb-2">🏆 {ev.prize_pool}</p>}
                  {ev.venue && <p className="text-xs text-slate-500 line-clamp-1">📍 {ev.venue}</p>}
                  {ev.event_date && <p className="text-xs text-slate-500 mt-0.5">📅 {new Date(ev.event_date).toLocaleDateString('en-IN')}</p>}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COMPETITOR ── */}
      {activeTab === 'competitor' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-3">Add Competitor Analysis</h4>
            <div className="grid grid-cols-2 gap-3">
              <input value={newComp.competitor} onChange={e => setNewComp(p => ({ ...p, competitor: e.target.value }))} placeholder="Competitor name *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newComp.strength} onChange={e => setNewComp(p => ({ ...p, strength: e.target.value }))} placeholder="Their strengths" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newComp.weakness} onChange={e => setNewComp(p => ({ ...p, weakness: e.target.value }))} placeholder="Their weaknesses" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <textarea value={newComp.note} onChange={e => setNewComp(p => ({ ...p, note: e.target.value }))} placeholder="Additional notes..." rows={2} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={saveCompNote} className="mt-3 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">+ Add Analysis</button>
          </div>
          {compNotes.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🔍</span><p>No competitor notes yet</p></div> :
            <div className="space-y-3">
              {compNotes.map(c => (
                <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-navy">{c.competitor}</h3>
                    <button onClick={() => deleteItem('competitor', c.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {c.strength && <div className="p-3 rounded-xl bg-green-50"><p className="text-[10px] font-bold text-green-600 mb-1">✅ STRENGTHS</p><p className="text-xs text-slate-600">{c.strength}</p></div>}
                    {c.weakness && <div className="p-3 rounded-xl bg-red-50"><p className="text-[10px] font-bold text-red-500 mb-1">⚠️ WEAKNESSES</p><p className="text-xs text-slate-600">{c.weakness}</p></div>}
                  </div>
                  {c.note && <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">{c.note}</p>}
                </div>
              ))}
            </div>}
        </div>
      )}

      {/* ── BRAND ASSETS ── */}
      {activeTab === 'brand' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-3">Add Brand Asset</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input value={newAsset.name} onChange={e => setNewAsset(p => ({ ...p, name: e.target.value }))} placeholder="Asset name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={newAsset.type} onChange={e => setNewAsset(p => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['Logo', 'Brand Color', 'Font', 'Template', 'Social Media Kit', 'Merchandise', 'Ad Creative', 'Brochure'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={newAsset.url} onChange={e => setNewAsset(p => ({ ...p, url: e.target.value }))} placeholder="Asset URL / Drive link *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newAsset.description} onChange={e => setNewAsset(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="col-span-4 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={saveBrandAsset} className="mt-3 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">🎨 Add Asset</button>
          </div>
          {brandAssets.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🎨</span><p>No brand assets yet</p></div> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brandAssets.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">🎨</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-navy truncate">{a.name}</p>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">{a.type}</span>
                    </div>
                    <button onClick={() => deleteItem('brand', a.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                  </div>
                  {a.description && <p className="text-xs text-slate-400 mb-3">{a.description}</p>}
                  <a href={a.url} target="_blank" rel="noreferrer" className="block w-full text-center py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 cursor-pointer transition-colors">📥 Access Asset</a>
                </motion.div>
              ))}
            </div>}
        </div>
      )}
    </div>
  )
}
