'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DirectChatPanel from '@/components/admin/DirectChatPanel'

// ── Types ──────────────────────────────────────────────────────────────────────
interface ContentSubmission {
  id: number; title: string; platform: string; content_url: string | null; status: string
  submitted_at: string; likes: number; views: number; description: string | null
  creator?: { id: number; user_id: number; user?: { fullname: string } | null } | null
}
interface PillarMember {
  id: number; user_id: number; platform_assignment: string | null; status: string
  total_referrals: number; joined_at: string
  user?: { fullname: string; email: string }
}
interface CalEntry {
  id: number; creator_name: string | null; platform: string; content_type: string
  title: string | null; scheduled_date: string; status: string; notes: string | null
}
interface CampaignRevenue {
  id: number; campaign_name: string; channel: string | null; platform: string | null
  creator_name: string | null; revenue_amount: number; leads_generated: number; conversions: number
  period_start: string | null; period_end: string | null; notes: string | null
}
interface Creative {
  id: number; title: string; asset_url: string; asset_type: string; platform?: string
  campaign?: string; status: string; dimensions?: string; notes?: string
}

// ── Constants ──────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'creators', label: '👤 Creators' },
  { key: 'submissions', label: '📤 Submissions' },
  { key: 'analytics', label: '📊 Analytics' },
  { key: 'leadgen', label: '📡 Lead Gen' },
  { key: 'revenue', label: '💰 Revenue' },
  { key: 'calendar', label: '🗓️ Content Calendar' },
  { key: 'library', label: '🖼️ Ad Library' },
  { key: 'chat', label: '💬 Creator Chat' },
] as const
type Tab = typeof TABS[number]['key']

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: '#F1F5F9' },
  submitted: { label: 'Submitted', color: '#3B82F6', bg: '#EFF6FF' },
  under_review: { label: 'In Review', color: '#F59E0B', bg: '#FFFBEB' },
  approved: { label: 'Approved', color: '#10B981', bg: '#ECFDF5' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEF2F2' },
  published: { label: 'Published', color: '#8B5CF6', bg: '#F5F3FF' },
}
const CAL_STATUS_CFG: Record<string, { color: string; bg: string }> = {
  planned: { bg: '#EFF6FF', color: '#3B82F6' },
  in_progress: { bg: '#FFFBEB', color: '#D97706' },
  published: { bg: '#ECFDF5', color: '#10B981' },
  cancelled: { bg: '#FEF2F2', color: '#EF4444' },
}

const PLATFORM_ICON: Record<string, string> = { instagram: '📸', facebook: '👥', linkedin: '💼', youtube: '▶️', twitter: '🐦', blog: '📝', other: '🌐' }
const PLATFORMS = ['instagram', 'youtube', 'linkedin', 'twitter', 'facebook', 'blog', 'other']
const CHANNEL_COLORS: Record<string, string> = { instagram: '#E1306C', youtube: '#FF0000', linkedin: '#0A66C2', twitter: '#1DA1F2', facebook: '#1877F2', blog: '#6B7280', other: '#94A3B8' }

export default function DigitalSaarthiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('creators')
  const [members, setMembers] = useState<PillarMember[]>([])
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([])
  const [calEntries, setCalEntries] = useState<CalEntry[]>([])
  const [revenues, setRevenues] = useState<CampaignRevenue[]>([])
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [loading, setLoading] = useState(true)
  const [chatUserId, setChatUserId] = useState<number | null>(null)
  const [meId, setMeId] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')

  // Calendar form
  const [showCalForm, setShowCalForm] = useState(false)
  const [calForm, setCalForm] = useState({ creator_name: '', platform: 'instagram', content_type: 'post', title: '', scheduled_date: '', status: 'planned', notes: '' })
  const [savingCal, setSavingCal] = useState(false)

  // Revenue form
  const [showRevForm, setShowRevForm] = useState(false)
  const [revForm, setRevForm] = useState({ campaign_name: '', channel: 'instagram', platform: '', creator_name: '', revenue_amount: '', leads_generated: '', conversions: '', period_start: '', period_end: '', notes: '' })
  const [savingRev, setSavingRev] = useState(false)

  // Creative form
  const [showCreativeForm, setShowCreativeForm] = useState(false)
  const [creativeForm, setCreativeForm] = useState({ title: '', asset_url: '', asset_type: 'image', platform: 'instagram', campaign: '', status: 'active', dimensions: '', notes: '' })
  const [savingCreative, setSavingCreative] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [membersRes, subsRes] = await Promise.all([
      fetch('/api/admin/pillars?pillar=digital').then(r => r.json()),
      fetch('/api/admin/content-submissions').then(r => r.json()),
    ])
    setMembers(membersRes.members || [])
    setSubmissions(subsRes.submissions || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    fetch('/api/auth/me').then(r => r.json()).then(d => setMeId(d.id || 0))
  }, [load])

  useEffect(() => {
    if (activeTab === 'calendar') fetch('/api/admin/digital-saarthi?type=calendar').then(r => r.json()).then(d => setCalEntries(d.calendar || []))
    if (activeTab === 'revenue') fetch('/api/admin/digital-saarthi?type=revenue').then(r => r.json()).then(d => setRevenues(d.revenue || []))
    if (activeTab === 'library') fetch('/api/admin/digital?type=creatives').then(r => r.json()).then(d => setCreatives(d.creatives || []))
  }, [activeTab])

  const updateStatus = async (id: number, status: string) => {
    await fetch('/api/admin/content-submissions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    load()
  }

  const saveCalEntry = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingCal(true)
    try {
      const res = await fetch('/api/admin/digital-saarthi?type=calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(calForm) })
      if (res.ok) { const d = await res.json(); setCalEntries(p => [d.item, ...p]) }
      setShowCalForm(false)
    } catch { } finally { setSavingCal(false) }
  }

  const saveRevenue = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingRev(true)
    try {
      const res = await fetch('/api/admin/digital-saarthi?type=revenue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...revForm, revenue_amount: Number(revForm.revenue_amount), leads_generated: Number(revForm.leads_generated), conversions: Number(revForm.conversions) }) })
      if (res.ok) { const d = await res.json(); setRevenues(p => [d.item, ...p]) }
      setShowRevForm(false)
    } catch { } finally { setSavingRev(false) }
  }

  const saveCreative = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingCreative(true)
    try {
      const res = await fetch('/api/admin/digital?type=creatives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creativeForm) })
      if (res.ok) { const d = await res.json(); setCreatives(p => [d.record, ...p]) }
      setShowCreativeForm(false)
    } catch { } finally { setSavingCreative(false) }
  }

  const filteredSubs = statusFilter === 'all' ? submissions : submissions.filter(s => s.status === statusFilter)
  const totalViews = submissions.reduce((a, s) => a + s.views, 0)
  const totalLikes = submissions.reduce((a, s) => a + s.likes, 0)
  const totalRevenue = revenues.reduce((s, r) => s + r.revenue_amount, 0)
  const totalCampaignLeads = revenues.reduce((s, r) => s + r.leads_generated, 0)

  // Analytics: per creator
  const creatorStats = members.map(m => {
    const mySubs = submissions.filter(s => s.creator?.user_id === m.user_id)
    return {
      id: m.id, name: m.user?.fullname || '—', email: m.user?.email || '',
      platforms: (m.platform_assignment || '').split(',').filter(Boolean),
      posts: mySubs.length,
      views: mySubs.reduce((s, sub) => s + sub.views, 0),
      likes: mySubs.reduce((s, sub) => s + sub.likes, 0),
      approved: mySubs.filter(s => s.status === 'approved' || s.status === 'published').length,
    }
  }).sort((a, b) => b.views - a.views)

  // Lead gen by platform (from submissions data)
  const leadsByPlatform: Record<string, number> = {}
  submissions.forEach(s => {
    const p = s.platform || 'other'
    leadsByPlatform[p] = (leadsByPlatform[p] || 0) + Math.floor(s.views / 100) // estimate 1% of views as leads
  })
  const leadEntries = Object.entries(leadsByPlatform).sort((a, b) => b[1] - a[1])
  const maxLeads = leadEntries[0]?.[1] || 1

  // Calendar view grouping by date
  const today = new Date().toISOString().split('T')[0]
  const upcoming = calEntries.filter(e => e.scheduled_date >= today).slice(0, 20)
  const past = calEntries.filter(e => e.scheduled_date < today).slice(0, 10)

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl">💻</div>
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">Digital Saarthi</h1>
          <p className="text-slate-500 text-sm">Content creators · Analytics · Revenue · Ad library · Content calendar</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Creators', value: members.length, icon: '👤', color: '#8B5CF6' },
          { label: 'Total Posts', value: submissions.length, icon: '📤', color: '#3B82F6' },
          { label: 'Total Views', value: totalViews.toLocaleString('en-IN'), icon: '👁️', color: '#F59E0B' },
          { label: 'Campaign Revenue', value: `₹${(totalRevenue / 1000).toFixed(0)}K`, icon: '💰', color: '#10B981' },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <span className="text-2xl">{k.icon}</span>
            <p className="text-2xl font-extrabold font-heading mt-2" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-slate-400">{k.label}</p>
          </motion.div>
        ))}
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

      {/* ── CREATORS ── */}
      {activeTab === 'creators' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}</div>
            : members.length === 0 ? <div className="p-12 text-center text-slate-400"><span className="text-4xl block mb-3">💻</span><p>No digital team members yet</p></div> : (
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">{['Creator', 'Platforms', 'Posts', 'Views', 'Likes', 'Status', 'Chat'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">{h}</th>)}</tr></thead>
                <tbody>
                  {members.map(m => {
                    const mySubs = submissions.filter(s => s.creator?.user_id === m.user_id)
                    const views = mySubs.reduce((s, sub) => s + sub.views, 0)
                    const likes = mySubs.reduce((s, sub) => s + sub.likes, 0)
                    return (
                      <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3"><p className="text-sm font-semibold text-navy">{m.user?.fullname}</p><p className="text-[10px] text-slate-400">{m.user?.email}</p></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {(m.platform_assignment || 'Not assigned').split(',').map(p => (
                              <span key={p} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold">{PLATFORM_ICON[p.trim()] || '🌐'} {p.trim()}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-navy">{mySubs.length}</td>
                        <td className="px-4 py-3 text-sm font-bold text-amber-600">{views.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-bold text-red-500">❤️ {likes.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${m.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{m.status}</span></td>
                        <td className="px-4 py-3"><button onClick={() => setChatUserId(m.user_id === chatUserId ? null : m.user_id)} className="px-2.5 py-1.5 rounded-lg bg-navy/5 text-navy text-xs font-bold hover:bg-navy/10 cursor-pointer">💬</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
        </div>
      )}

      {/* ── SUBMISSIONS ── */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['all', ...Object.keys(STATUS_CFG)].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize cursor-pointer transition-all ${statusFilter === s ? 'bg-navy text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {STATUS_CFG[s]?.label || 'All'} {s !== 'all' && `(${submissions.filter(sub => sub.status === s).length})`}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {filteredSubs.length === 0 ? <p className="p-10 text-center text-slate-400 text-sm">No submissions {statusFilter !== 'all' ? `in status: ${statusFilter}` : 'yet'}</p> : (
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">{['Content', 'Creator', 'Platform', 'Views', 'Likes', 'Status', 'Action'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredSubs.map(s => {
                    const cfg = STATUS_CFG[s.status] || STATUS_CFG.draft
                    return (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3"><p className="text-sm font-semibold text-navy max-w-[150px] truncate">{s.title}</p><p className="text-[10px] text-slate-400">{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('en-IN') : '—'}</p></td>
                        <td className="px-4 py-3 text-xs text-slate-500">{s.creator?.user?.fullname || '—'}</td>
                        <td className="px-4 py-3"><span className="text-base">{PLATFORM_ICON[s.platform || 'other'] || '🌐'}</span></td>
                        <td className="px-4 py-3 text-sm font-bold text-navy">{s.views.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-bold text-red-500">❤️ {s.likes.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span></td>
                        <td className="px-4 py-3">
                          {s.status === 'submitted' && (
                            <div className="flex gap-1">
                              <button onClick={() => updateStatus(s.id, 'approved')} className="px-2.5 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-bold hover:bg-green-100 cursor-pointer">✓ Approve</button>
                              <button onClick={() => updateStatus(s.id, 'rejected')} className="px-2.5 py-1 rounded-lg bg-red-50 text-red-500 text-[10px] font-bold hover:bg-red-100 cursor-pointer">✕ Reject</button>
                            </div>
                          )}
                          {s.status === 'approved' && (
                            <button onClick={() => updateStatus(s.id, 'published')} className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 text-[10px] font-bold hover:bg-purple-100 cursor-pointer">📤 Publish</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-navy font-heading mb-5">📊 Post Performance Per Creator</h3>
            {creatorStats.length === 0 ? <p className="text-center text-slate-400 py-8">No creator data yet.</p> : (
              <div className="space-y-4">
                {creatorStats.map((c, i) => (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center font-bold text-purple-600">{c.name.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="font-bold text-navy text-sm">{c.name}</p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {c.platforms.map(p => <span key={p} className="px-1.5 py-0.5 text-[9px] rounded-full bg-purple-50 text-purple-600 font-bold">{PLATFORM_ICON[p.trim()] || '🌐'} {p.trim()}</span>)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">#{i + 1}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Posts', val: c.posts, color: '#8B5CF6' },
                        { label: 'Views', val: c.views.toLocaleString(), color: '#F59E0B' },
                        { label: 'Likes', val: c.likes.toLocaleString(), color: '#EF4444' },
                        { label: 'Approved', val: c.approved, color: '#10B981' },
                      ].map(m => (
                        <div key={m.label} className="text-center p-2 rounded-lg bg-slate-50">
                          <p className="font-extrabold text-sm" style={{ color: m.color }}>{m.val}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LEAD GEN ── */}
      {activeTab === 'leadgen' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-navy font-heading mb-2">📡 Lead Generation by Digital Channel</h3>
            <p className="text-xs text-slate-400 mb-5">Estimated leads based on post performance (1% of views per platform). Connect CRM for accurate tracking.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100">
                <p className="text-2xl font-extrabold text-purple-700">{totalCampaignLeads}</p>
                <p className="text-xs text-purple-500 font-bold mt-1">TOTAL LEADS FROM CAMPAIGNS</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 border border-green-100">
                <p className="text-2xl font-extrabold text-green-700">{leadEntries.reduce((s, [, n]) => s + n, 0)}</p>
                <p className="text-xs text-green-500 font-bold mt-1">ESTIMATED LEADS FROM CONTENT</p>
              </div>
            </div>
            {leadEntries.length === 0 ? <p className="text-center text-slate-400 py-8">No data yet. Create content submissions to see estimates.</p> : (
              <div className="space-y-3">
                {leadEntries.map(([platform, count]) => {
                  const color = CHANNEL_COLORS[platform] || '#94A3B8'
                  const pct = Math.round((count / maxLeads) * 100)
                  return (
                    <div key={platform}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-navy capitalize">{PLATFORM_ICON[platform] || '🌐'} {platform}</span>
                        <span className="text-xs font-bold" style={{ color }}>~{count} leads</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: color }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REVENUE ── */}
      {activeTab === 'revenue' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500">{revenues.length} campaigns tracked</p>
              <p className="text-xs text-green-600 font-bold">Total Revenue: ₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <button onClick={() => setShowRevForm(v => !v)}
              className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
              style={{ background: '#10B981' }}>+ Log Campaign Revenue</button>
          </div>

          <AnimatePresence>
            {showRevForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-3">💰 Log Campaign Revenue</h4>
                <form onSubmit={saveRevenue} className="grid grid-cols-2 gap-3">
                  <input required value={revForm.campaign_name} onChange={e => setRevForm(p => ({ ...p, campaign_name: e.target.value }))}
                    placeholder="Campaign Name *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <select value={revForm.channel} onChange={e => setRevForm(p => ({ ...p, channel: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_ICON[p]} {p}</option>)}
                  </select>
                  <input value={revForm.creator_name} onChange={e => setRevForm(p => ({ ...p, creator_name: e.target.value }))}
                    placeholder="Creator Name" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="number" value={revForm.revenue_amount} onChange={e => setRevForm(p => ({ ...p, revenue_amount: e.target.value }))}
                    placeholder="Revenue ₹ *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="number" value={revForm.leads_generated} onChange={e => setRevForm(p => ({ ...p, leads_generated: e.target.value }))}
                    placeholder="Leads Generated" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="date" value={revForm.period_start} onChange={e => setRevForm(p => ({ ...p, period_start: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="date" value={revForm.period_end} onChange={e => setRevForm(p => ({ ...p, period_end: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <div className="flex gap-3 col-span-2">
                    <button type="submit" disabled={savingRev}
                      className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-bold cursor-pointer disabled:opacity-60">{savingRev ? '⏳' : '💾 Save'}</button>
                    <button type="button" onClick={() => setShowRevForm(false)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {revenues.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100"><span className="text-4xl block mb-3">💰</span><p className="text-slate-400 text-sm">No campaign revenue logged yet.</p></div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-100 bg-slate-50">
                  {['Campaign', 'Channel', 'Creator', 'Revenue', 'Leads', 'Conversions', 'Period'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {revenues.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-3 py-3 font-semibold text-navy">{r.campaign_name}</td>
                      <td className="px-3 py-3"><span className="capitalize">{PLATFORM_ICON[r.channel || 'other']} {r.channel || '—'}</span></td>
                      <td className="px-3 py-3 text-slate-500">{r.creator_name || '—'}</td>
                      <td className="px-3 py-3 font-bold text-green-700">₹{r.revenue_amount.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-3 font-bold text-blue-600">{r.leads_generated}</td>
                      <td className="px-3 py-3 font-bold text-purple-600">{r.conversions}</td>
                      <td className="px-3 py-3 text-slate-400">{r.period_start ? new Date(r.period_start).toLocaleDateString('en-IN') : '—'}{r.period_end ? ` → ${new Date(r.period_end).toLocaleDateString('en-IN')}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CONTENT CALENDAR ── */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{calEntries.length} calendar entries</p>
            <button onClick={() => setShowCalForm(v => !v)}
              className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
              style={{ background: '#8B5CF6' }}>+ Schedule Content</button>
          </div>

          <AnimatePresence>
            {showCalForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-3">🗓️ Schedule Content</h4>
                <form onSubmit={saveCalEntry} className="grid grid-cols-2 gap-3">
                  <input value={calForm.title} onChange={e => setCalForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Content Title" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={calForm.creator_name} onChange={e => setCalForm(p => ({ ...p, creator_name: e.target.value }))}
                    placeholder="Creator Name" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <select value={calForm.platform} onChange={e => setCalForm(p => ({ ...p, platform: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_ICON[p]} {p}</option>)}
                  </select>
                  <select value={calForm.content_type} onChange={e => setCalForm(p => ({ ...p, content_type: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {['post', 'reel', 'story', 'video', 'blog', 'newsletter', 'ad'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input required type="date" value={calForm.scheduled_date} onChange={e => setCalForm(p => ({ ...p, scheduled_date: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <select value={calForm.status} onChange={e => setCalForm(p => ({ ...p, status: e.target.value }))}
                    className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {['planned', 'in_progress', 'published', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="flex gap-3 col-span-2">
                    <button type="submit" disabled={savingCal}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer disabled:opacity-60">{savingCal ? '⏳' : '📅 Schedule'}</button>
                    <button type="button" onClick={() => setShowCalForm(false)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {calEntries.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100"><span className="text-4xl block mb-3">🗓️</span><p className="text-slate-400 text-sm">No content scheduled yet.</p></div>
          ) : (
            <div className="space-y-5">
              {upcoming.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">📅 Upcoming ({upcoming.length})</h3>
                  <div className="space-y-2">
                    {upcoming.map((e, i) => {
                      const cfg = CAL_STATUS_CFG[e.status] || { bg: '#F3F4F6', color: '#6B7280' }
                      return (
                        <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-3 hover:shadow-sm transition-shadow">
                          <div className="w-10 h-10 rounded-lg text-center flex flex-col items-center justify-center text-xs bg-slate-50 border border-slate-100 flex-shrink-0">
                            <span className="font-extrabold text-navy text-sm">{new Date(e.scheduled_date).getDate()}</span>
                            <span className="text-[9px] text-slate-400">{new Date(e.scheduled_date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-navy truncate">{e.title || 'Untitled content'}</p>
                            <p className="text-[10px] text-slate-400">{e.creator_name || '—'} · {PLATFORM_ICON[e.platform] || '🌐'} {e.platform} · {e.content_type}</p>
                          </div>
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold capitalize flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                            {e.status.replace('_', ' ')}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">📂 Past ({past.length})</h3>
                  <div className="space-y-2 opacity-60">
                    {past.map(e => {
                      const cfg = CAL_STATUS_CFG[e.status] || { bg: '#F3F4F6', color: '#6B7280' }
                      return (
                        <div key={e.id} className="bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg text-center flex flex-col items-center justify-center text-[10px] bg-slate-50 border border-slate-100 flex-shrink-0">
                            <span className="font-extrabold text-navy">{new Date(e.scheduled_date).getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-navy truncate">{e.title || 'Untitled'}</p>
                            <p className="text-[10px] text-slate-400">{e.creator_name || '—'} · {e.platform}</p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: cfg.bg, color: cfg.color }}>{e.status}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── AD LIBRARY ── */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{creatives.length} ad creatives</p>
            <button onClick={() => setShowCreativeForm(v => !v)}
              className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
              style={{ background: '#1B3A6B' }}>+ Upload Creative</button>
          </div>

          <AnimatePresence>
            {showCreativeForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-3">🖼️ Add Ad Creative</h4>
                <form onSubmit={saveCreative} className="grid grid-cols-2 gap-3">
                  <input required value={creativeForm.title} onChange={e => setCreativeForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Creative Title *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <select value={creativeForm.asset_type} onChange={e => setCreativeForm(p => ({ ...p, asset_type: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {['image', 'video', 'gif', 'pdf', 'banner'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input required value={creativeForm.asset_url} onChange={e => setCreativeForm(p => ({ ...p, asset_url: e.target.value }))}
                    placeholder="Asset URL (Google Drive, etc.) *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <select value={creativeForm.platform} onChange={e => setCreativeForm(p => ({ ...p, platform: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_ICON[p]} {p}</option>)}
                  </select>
                  <input value={creativeForm.dimensions} onChange={e => setCreativeForm(p => ({ ...p, dimensions: e.target.value }))}
                    placeholder="Dimensions e.g. 1080x1080" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={creativeForm.campaign} onChange={e => setCreativeForm(p => ({ ...p, campaign: e.target.value }))}
                    placeholder="Campaign Name" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <div className="flex gap-3 col-span-2">
                    <button type="submit" disabled={savingCreative}
                      className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{savingCreative ? '⏳' : '📤 Upload'}</button>
                    <button type="button" onClick={() => setShowCreativeForm(false)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {creatives.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100"><span className="text-4xl block mb-3">🖼️</span><p className="text-slate-400 text-sm">No ad creatives uploaded yet.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatives.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-navy text-sm">{c.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{c.asset_type?.toUpperCase()} · {PLATFORM_ICON[c.platform || 'other']} {c.platform || '—'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                  </div>
                  {c.campaign && <p className="text-xs text-slate-500 mb-2">Campaign: {c.campaign}</p>}
                  {c.dimensions && <p className="text-xs text-slate-400 mb-2">📐 {c.dimensions}</p>}
                  {c.notes && <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-2 py-1 mb-3">{c.notes}</p>}
                  <a href={c.asset_url} target="_blank" rel="noreferrer"
                    className="block w-full text-center py-2 bg-navy/5 text-navy text-xs font-bold rounded-xl hover:bg-navy/10 transition-colors">
                    🔗 Open Creative
                  </a>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATOR CHAT ── */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center py-16">
          <span className="text-5xl block mb-3">💬</span>
          <p className="font-bold text-navy mb-2">Direct Chat with Creators</p>
          <p className="text-slate-400 text-sm mb-4">Open messages to chat with any content creator or team member.</p>
          <button onClick={() => setChatUserId(-1)}
            className="px-6 py-3 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
            style={{ background: '#8B5CF6' }}>Open Messages</button>
        </div>
      )}

      {chatUserId !== null && chatUserId !== -1 && meId > 0 && (
        <DirectChatPanel currentUserId={meId} mode="ops" onClose={() => setChatUserId(null)} />
      )}
      {chatUserId === -1 && meId > 0 && (
        <DirectChatPanel currentUserId={meId} mode="ops" onClose={() => setChatUserId(null)} />
      )}
    </div>
  )
}
