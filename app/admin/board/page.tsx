'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'

interface BoardData {
  revenue: { total: number; thisMonth: number; pending: number; overdueCount: number }
  projects: { total: number; completed: number; active: number }
  team: { clients: number; vendors: number; internal: number }
  leads: { total: number; won: number; conversionRate: number; pipelineValue: number; bySource: Record<string, number> }
  revenueByMonth: { month: string; revenue: number; invoices: number; quarter: string }[]
  headcountByPillar: Record<string, number>
  topProjects: { id: number; name: string; status: string; budget: number; priority: string }[]
  topClients: { id: number; name: string; revenue: number }[]
  riskAlerts: { type: string; message: string; severity: string }[]
  budgetAllocation: { department: string; allocated: number; used: number }[]
}

interface MOU { id: number; title: string; type: string; status: string; description: string | null; updated_at: string }
interface Announcement { id: number; title: string; message: string; type: string; is_active: boolean; created_at: string }
interface BoardNote { id: number; title: string; meeting_date: string; agenda: string | null; minutes: string | null; file_url: string | null; created_at: string }
interface BrandAsset { id: number; name: string; category: string; file_url: string; description: string | null; created_at: string }

// ── Sub-components ────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, color, delay = 0 }: {
  icon: string; label: string; value: string; sub?: string; color: string; delay?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110" style={{ background: `${color}15` }}>{icon}</div>
        <div className="text-right">
          <p className="text-2xl font-extrabold font-heading text-navy">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <div className="mt-2 h-0.5 w-0 group-hover:w-full rounded-full transition-all duration-500" style={{ background: color }} />
    </motion.div>
  )
}

function RevenueBar({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1)
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((d, i) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
          <p className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            ₹{(d.revenue / 1000).toFixed(0)}K
          </p>
          <motion.div initial={{ height: 0 }} animate={{ height: `${(d.revenue / max) * 100}%` }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
            className="w-full rounded-t-lg min-h-[4px] cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: d.revenue > 0 ? 'linear-gradient(180deg, #FF6B35, #e55a27)' : '#E2E8F0' }} />
          <p className="text-[9px] text-slate-400 text-center whitespace-nowrap">{d.month}</p>
        </div>
      ))}
    </div>
  )
}

const PILLAR_CONFIG: Record<string, { icon: string; color: string }> = {
  campus: { icon: '🎓', color: '#3B82F6' },
  digital: { icon: '💻', color: '#8B5CF6' },
  calling: { icon: '📞', color: '#FF6B35' },
  government: { icon: '🏛️', color: '#10B981' },
  market: { icon: '🗺️', color: '#F59E0B' },
}

const TABS = [
  { key: 'overview', label: '📊 Overview' },
  { key: 'pl', label: '💹 P&L' },
  { key: 'pillars', label: '🌟 Pillars' },
  { key: 'kpi', label: '🎯 KPI Scorecards' },
  { key: 'budget', label: '💼 Budget' },
  { key: 'risk', label: '⚠️ Risk & Compliance' },
  { key: 'reports', label: '📄 Reports' },
  { key: 'mou', label: '⚖️ Legal & Policy' },
  { key: 'announce', label: '📢 Announcements' },
  { key: 'boarddocs', label: '📋 Board Docs' },
  { key: 'brand', label: '🎨 Brand Assets' },
  { key: 'about', label: '🌐 About Page' },
] as const

type Tab = typeof TABS[number]['key']

export default function BoardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <BoardDashboard />
    </Suspense>
  )
}

function BoardDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<BoardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview')
  // MOU state
  const [mous, setMous] = useState<MOU[]>([])
  const [mouLoading, setMouLoading] = useState(false)
  // Announcement state
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [annLoading, setAnnLoading] = useState(false)
  const [showAnnForm, setShowAnnForm] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', message: '', type: 'info' })
  const [savingAnn, setSavingAnn] = useState(false)
  // Board Docs state
  const [boardNotes, setBoardNotes] = useState<BoardNote[]>([])
  const [noteLoading, setNoteLoading] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteForm, setNoteForm] = useState({ title: '', meeting_date: '', agenda: '', minutes: '', file_url: '' })
  const [savingNote, setSavingNote] = useState(false)
  // Brand Assets state
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([])
  const [assetLoading, setAssetLoading] = useState(false)
  const [showAssetForm, setShowAssetForm] = useState(false)
  const [assetForm, setAssetForm] = useState({ name: '', category: 'logo', file_url: '', description: '' })
  const [savingAsset, setSavingAsset] = useState(false)
  // About Page state
  const [aboutData, setAboutData] = useState<{ company: Record<string,string>; timeline: { id:number;year:string;title:string;description:string }[]; members: { id:number;name:string;role:string;image_url:string|null;vision:string|null;mission:string|null;statement:string|null }[]; achievements: { id:number;icon:string;value:string;label:string }[] }>({ company: {}, timeline: [], members: [], achievements: [] })
  const [aboutLoading, setAboutLoading] = useState(false)
  const [aboutSection, setAboutSection] = useState<'company'|'timeline'|'members'|'achievements'>('company')
  const [aboutForm, setAboutForm] = useState<Record<string,string>>({})
  const [savingAbout, setSavingAbout] = useState(false)
  const [showAboutForm, setShowAboutForm] = useState<string|null>(null) // 'timeline'|'member'|'achievement'
  const [editingAboutId, setEditingAboutId] = useState<number|null>(null)

  useEffect(() => {
    const t = searchParams.get('tab') as Tab
    if (t) setActiveTab(t)
  }, [searchParams])

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/board')
      if (res.ok) setData(await res.json())
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBoard() }, [fetchBoard])

  useEffect(() => {
    if (activeTab === 'mou') {
      setMouLoading(true)
      fetch('/api/admin/board/legal').then(r => r.json()).then(d => setMous(d.docs || [])).catch(() => { }).finally(() => setMouLoading(false))
    }
    if (activeTab === 'announce') {
      setAnnLoading(true)
      fetch('/api/admin/announcements').then(r => r.json()).then(d => setAnnouncements(d.announcements || [])).catch(() => { }).finally(() => setAnnLoading(false))
    }
    if (activeTab === 'boarddocs') {
      setNoteLoading(true)
      fetch('/api/admin/board/docs').then(r => r.json()).then(d => setBoardNotes(d.notes || [])).catch(() => { }).finally(() => setNoteLoading(false))
    }
    if (activeTab === 'brand') {
      setAssetLoading(true)
      fetch('/api/admin/board/brand').then(r => r.json()).then(d => setBrandAssets(d.assets || [])).catch(() => { }).finally(() => setAssetLoading(false))
    }
    if (activeTab === 'about') {
      setAboutLoading(true)
      fetch('/api/admin/about').then(r => r.json()).then(d => setAboutData(d)).catch(() => {}).finally(() => setAboutLoading(false))
    }
  }, [activeTab])

  const saveBoardNote = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingNote(true)
    try {
      const res = await fetch('/api/admin/board/docs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(noteForm) })
      if (res.ok) { const d = await res.json(); setBoardNotes(p => [d.note, ...p]); setShowNoteForm(false); setNoteForm({ title: '', meeting_date: '', agenda: '', minutes: '', file_url: '' }) }
    } catch { } finally { setSavingNote(false) }
  }

  const saveBrandAsset = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingAsset(true)
    try {
      const res = await fetch('/api/admin/board/brand', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assetForm) })
      if (res.ok) { const d = await res.json(); setBrandAssets(p => [d.asset, ...p]); setShowAssetForm(false); setAssetForm({ name: '', category: 'logo', file_url: '', description: '' }) }
    } catch { } finally { setSavingAsset(false) }
  }

  const publishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingAnn(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...annForm, is_active: true }),
      })
      if (res.ok) {
        setShowAnnForm(false)
        setAnnForm({ title: '', message: '', type: 'info' })
        fetch('/api/admin/announcements').then(r => r.json()).then(d => setAnnouncements(d.announcements || []))
      }
    } catch { } finally { setSavingAnn(false) }
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-72 bg-white rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  const d = data

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-navy font-heading">🏦 Board of Directors</h1>
          <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={fetchBoard} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">↻ Refresh Data</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); router.replace(`/admin/board?tab=${t.key}`, { scroll: false }) }}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex-shrink-0 ${activeTab === t.key ? 'bg-navy text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <>
          {/* Revenue KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon="💰" label="Total Revenue" value={`₹${(d?.revenue.total || 0).toLocaleString('en-IN')}`} color="#10B981" delay={0} />
            <KPICard icon="📅" label="This Month" value={`₹${(d?.revenue.thisMonth || 0).toLocaleString('en-IN')}`} sub="Current month" color="#3B82F6" delay={0.05} />
            <KPICard icon="⏳" label="Outstanding" value={`₹${(d?.revenue.pending || 0).toLocaleString('en-IN')}`} sub={`${d?.revenue.overdueCount || 0} overdue`} color="#F59E0B" delay={0.1} />
            <KPICard icon="🎯" label="Lead Conversion" value={`${d?.leads.conversionRate || 0}%`} sub={`${d?.leads.won} won of ${d?.leads.total}`} color="#8B5CF6" delay={0.15} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon="📋" label="Total Projects" value={String(d?.projects.total || 0)} color="#1B3A6B" delay={0.2} />
            <KPICard icon="🔄" label="Active Projects" value={String(d?.projects.active || 0)} color="#FF6B35" delay={0.25} />
            <KPICard icon="✅" label="Completed" value={String(d?.projects.completed || 0)} sub={`${d?.projects.total ? Math.round((d.projects.completed / d.projects.total) * 100) : 0}% success`} color="#10B981" delay={0.3} />
            <KPICard icon="👥" label="Total Clients" value={String(d?.team.clients || 0)} sub={`${d?.team.vendors || 0} vendors · ${d?.team.internal || 0} staff`} color="#6B7280" delay={0.35} />
          </div>

          {/* Revenue + Top Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-navy font-heading">📈 Revenue Trend (6 months)</h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">↑ Pipeline: ₹{((d?.leads.pipelineValue || 0) / 1000).toFixed(0)}K</span>
              </div>
              {d?.revenueByMonth && <RevenueBar data={d.revenueByMonth} />}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {(d?.revenueByMonth || []).slice(-3).map(m => (
                  <div key={m.month} className="text-center p-2 rounded-xl bg-slate-50">
                    <p className="text-xs font-bold text-navy">₹{m.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-400">{m.month}</p>
                    <p className="text-[9px] text-slate-300">{m.invoices} invoices</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Projects */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-navy font-heading mb-4">🏆 Top Projects</h3>
              <div className="space-y-3">
                {(d?.topProjects || []).length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-4">No projects yet</p>
                ) : (d?.topProjects || []).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="text-lg font-bold text-slate-300">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{p.status?.replace(/_/g, ' ')}</p>
                    </div>
                    <p className="text-xs font-bold text-green-600">₹{(p.budget / 1000).toFixed(0)}K</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Top Clients + Headcount */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-navy font-heading mb-4">👤 Top Clients by Revenue</h3>
              {(d?.topClients || []).length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-4">No client revenue data yet</p>
              ) : (d?.topClients || []).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-navy/10 flex items-center justify-center text-sm font-bold text-navy">{c.name.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-navy">{c.name}</p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1">
                      <div className="h-full rounded-full bg-gradient-to-r from-navy to-accent"
                        style={{ width: `${((c.revenue / ((d?.topClients[0]?.revenue) || 1)) * 100).toFixed(0)}%` }} />
                    </div>
                  </div>
                  <p className="text-xs font-bold text-green-600">₹{c.revenue.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-navy font-heading mb-4">👥 Team Structure & Headcount</h3>
              <div className="space-y-3">
                {Object.entries(d?.headcountByPillar || {}).map(([pillar, count]) => {
                  const cfg = PILLAR_CONFIG[pillar] || { icon: '🌟', color: '#6B7280' }
                  return (
                    <div key={pillar} className="flex items-center gap-3">
                      <span className="text-lg">{cfg.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-600 capitalize">{pillar} Saarthi</span>
                          <span className="font-bold text-navy">{count} members</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(count * 10, 100)}%` }}
                            transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: cfg.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Internal', count: d?.team.internal || 0, color: '#1B3A6B' },
                    { label: 'Vendors', count: d?.team.vendors || 0, color: '#F59E0B' },
                    { label: 'Clients', count: d?.team.clients || 0, color: '#10B981' },
                  ].map(item => (
                    <div key={item.label} className="text-center p-2 rounded-xl bg-slate-50">
                      <p className="text-lg font-extrabold" style={{ color: item.color }}>{item.count}</p>
                      <p className="text-[10px] text-slate-400">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Risk Alerts */}
          {(d?.riskAlerts || []).length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-navy font-heading mb-4">⚠️ Active Risk Alerts</h3>
              <div className="space-y-2">
                {(d?.riskAlerts || []).map((alert, i) => {
                  const sev = { high: { bg: '#FEE2E2', color: '#EF4444', icon: '🔴' }, medium: { bg: '#FEF3C7', color: '#F59E0B', icon: '🟡' }, low: { bg: '#DBEAFE', color: '#3B82F6', icon: '🔵' } }
                  const cfg = sev[alert.severity as keyof typeof sev] || sev.low
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: cfg.bg }}>
                      <span>{cfg.icon}</span>
                      <p className="text-sm font-medium" style={{ color: cfg.color }}>{alert.message}</p>
                      <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: cfg.color + '20', color: cfg.color }}>{alert.type}</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ── P&L TAB ── */}
      {activeTab === 'pl' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-navy font-heading">💹 P&L Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly P&L */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-5">Monthly Revenue Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    {['Month', 'Quarter', 'Revenue', 'Invoices', 'Trend'].map(h => (
                      <th key={h} className="pb-3 text-left text-xs font-bold text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(d?.revenueByMonth || []).map((m, i, arr) => {
                      const prev = arr[i - 1]?.revenue || 0
                      const trend = prev > 0 ? ((m.revenue - prev) / prev * 100).toFixed(1) : '—'
                      const isUp = m.revenue >= prev
                      return (
                        <tr key={m.month} className="border-b border-slate-50 hover:bg-slate-50/60">
                          <td className="py-3 font-medium text-navy">{m.month}</td>
                          <td className="py-3 text-slate-400">{m.quarter}</td>
                          <td className="py-3 font-bold text-green-600">₹{m.revenue.toLocaleString('en-IN')}</td>
                          <td className="py-3 text-slate-500">{m.invoices}</td>
                          <td className="py-3">
                            {prev > 0 && <span className={`text-xs font-bold ${isUp ? 'text-green-600' : 'text-red-500'}`}>{isUp ? '↑' : '↓'} {Math.abs(Number(trend))}%</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* P&L Summary */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-navy font-heading mb-4">P&L Summary</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Gross Revenue', value: d?.revenue.total || 0, color: '#10B981', prefix: '+' },
                    { label: 'Pending Collection', value: d?.revenue.pending || 0, color: '#F59E0B', prefix: '~' },
                    { label: 'Active Pipeline', value: d?.leads.pipelineValue || 0, color: '#3B82F6', prefix: '~' },
                    { label: 'Overdue Invoices', value: (d?.revenue.overdueCount || 0), color: '#EF4444', prefix: '⚠️', isCount: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <p className="text-sm text-slate-600">{item.label}</p>
                      <p className="text-sm font-bold" style={{ color: item.color }}>
                        {item.isCount ? `${item.prefix} ${item.value} invoices` : `${item.prefix} ₹${item.value.toLocaleString('en-IN')}`}
                      </p>
                    </div>
                  ))}
                </div>
                <button onClick={() => window.print()}
                  className="mt-5 w-full py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: '#1B3A6B' }}>
                  🖨️ Print P&L Report
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-navy font-heading mb-3 text-sm">Lead Source Distribution</h3>
                {Object.entries(d?.leads.bySource || {}).length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-2">No source data</p>
                ) : Object.entries(d?.leads.bySource || {}).map(([src, count]) => {
                  const total = Object.values(d?.leads.bySource || {}).reduce((a, b) => a + b, 0)
                  return (
                    <div key={src} className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize text-slate-500">{src}</span>
                        <span className="font-bold text-navy">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(count / total) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
          <span className="text-4xl block mb-3">📄</span>
          <h3 className="font-bold text-navy font-heading text-xl">Investor Reports Generator</h3>
          <p className="text-slate-500 mb-6 mt-2 max-w-sm mx-auto">Generate comprehensive PDF reports combining revenue, headcount, and pillar performance metrics for executive review.</p>
          <button className="px-6 py-3 rounded-xl font-bold text-white bg-navy cursor-pointer shadow-md hover:opacity-90">⬇️ Generate Annual Report (PDF)</button>
        </motion.div>
      )}

      {/* ── PILLARS TAB ── */}
      {activeTab === 'pillars' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-navy font-heading">🌟 5 Pillar Performance Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.entries(PILLAR_CONFIG).map(([pillar, cfg], i) => {
              const headcount = d?.headcountByPillar?.[pillar] || 0
              const budget = d?.budgetAllocation?.find(b => b.department.toLowerCase().includes(pillar))
              return (
                <motion.div key={pillar} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${cfg.color}15` }}>{cfg.icon}</div>
                    <div>
                      <h3 className="font-bold text-navy font-heading capitalize">{pillar} Saarthi</h3>
                      <p className="text-xs text-slate-400">{headcount} team members</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {budget && (
                      <>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Budget Used</span>
                            <span className="font-bold text-navy">₹{budget.used.toLocaleString('en-IN')} / ₹{budget.allocated.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((budget.used / budget.allocated) * 100, 100)}%` }}
                              transition={{ delay: i * 0.08 + 0.3, duration: 0.6 }} className="h-full rounded-full" style={{ background: cfg.color }} />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{Math.round((budget.used / budget.allocated) * 100)}% utilized</p>
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                        <p className="text-lg font-bold text-navy">{headcount}</p>
                        <p className="text-[10px] text-slate-400">Team Size</p>
                      </div>
                      <div className="p-2.5 rounded-xl text-center" style={{ background: `${cfg.color}10` }}>
                        <p className="text-lg font-bold" style={{ color: cfg.color }}>Active</p>
                        <p className="text-[10px] text-slate-400">Status</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── KPI SCORECARDS TAB ── */}
      {activeTab === 'kpi' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-navy font-heading">🎯 Strategic KPI Scorecards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { label: 'Revenue Growth', value: d?.revenueByMonth?.slice(-1)[0]?.revenue || 0, target: 1000000, icon: '📈', color: '#10B981', format: 'currency' },
              { label: 'Lead Conversion Rate', value: d?.leads.conversionRate || 0, target: 30, icon: '🎯', color: '#8B5CF6', format: 'percent' },
              { label: 'Project Completion Rate', value: d?.projects.total ? Math.round((d.projects.completed / d.projects.total) * 100) : 0, target: 80, icon: '✅', color: '#3B82F6', format: 'percent' },
              { label: 'Active Client Portfolio', value: d?.team.clients || 0, target: 500, icon: '👤', color: '#FF6B35', format: 'number' },
              { label: 'Total Team Strength', value: (d?.team.internal || 0) + Object.values(d?.headcountByPillar || {}).reduce((a, b) => a + b, 0), target: 50, icon: '👥', color: '#1B3A6B', format: 'number' },
              { label: 'Pending Revenue Collection', value: d?.revenue.pending || 0, target: 0, icon: '⏳', color: '#F59E0B', format: 'currency', inverse: true },
            ].map((kpi, i) => {
              const progress = kpi.inverse
                ? Math.max(0, 100 - (kpi.value / Math.max(kpi.target, 1)) * 100)
                : Math.min((kpi.value / Math.max(kpi.target, 1)) * 100, 100)
              const score = progress >= 80 ? 'Excellent' : progress >= 60 ? 'Good' : progress >= 40 ? 'Fair' : 'Needs Work'
              const scoreColor = progress >= 80 ? '#10B981' : progress >= 60 ? '#3B82F6' : progress >= 40 ? '#F59E0B' : '#EF4444'
              return (
                <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{kpi.icon}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: scoreColor + '20', color: scoreColor }}>{score}</span>
                  </div>
                  <h3 className="font-bold text-navy text-sm mb-2">{kpi.label}</h3>
                  <p className="text-2xl font-extrabold text-navy mb-1">
                    {kpi.format === 'currency' ? `₹${kpi.value.toLocaleString('en-IN')}` : kpi.format === 'percent' ? `${kpi.value}%` : kpi.value}
                  </p>
                  <p className="text-xs text-slate-400 mb-3">
                    Target: {kpi.format === 'currency' ? `₹${kpi.target.toLocaleString('en-IN')}` : kpi.format === 'percent' ? `${kpi.target}%` : kpi.target}
                  </p>
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                      transition={{ delay: i * 0.08 + 0.3, duration: 0.8 }}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${kpi.color}, ${kpi.color}bb)` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{progress.toFixed(0)}% of target</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── BUDGET TAB ── */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-navy font-heading">💼 Budget Allocation Tracker</h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="space-y-5">
              {(d?.budgetAllocation || []).map((dept, i) => {
                const pct = Math.min((dept.used / dept.allocated) * 100, 100)
                const isOver = dept.used > dept.allocated
                return (
                  <motion.div key={dept.department} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{PILLAR_CONFIG[dept.department.toLowerCase().split(' ')[0]]?.icon || '🏢'}</span>
                        <span className="font-semibold text-navy text-sm">{dept.department}</span>
                        {isOver && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">Over Budget</span>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-navy">₹{dept.used.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-400">of ₹{dept.allocated.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.07 + 0.2, duration: 0.7 }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: isOver ? '#EF4444' : pct > 75 ? '#F59E0B' : '#10B981' }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{pct.toFixed(0)}% utilized · ₹{Math.max(0, dept.allocated - dept.used).toLocaleString('en-IN')} remaining</p>
                  </motion.div>
                )
              })}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
              {(() => {
                const totalAlloc = (d?.budgetAllocation || []).reduce((a, b) => a + b.allocated, 0)
                const totalUsed = (d?.budgetAllocation || []).reduce((a, b) => a + b.used, 0)
                return [
                  { label: 'Total Allocated', value: totalAlloc, color: '#3B82F6' },
                  { label: 'Total Used', value: totalUsed, color: '#F59E0B' },
                  { label: 'Remaining', value: Math.max(0, totalAlloc - totalUsed), color: '#10B981' },
                ].map(s => (
                  <div key={s.label} className="text-center p-4 rounded-xl bg-slate-50">
                    <p className="text-xl font-extrabold" style={{ color: s.color }}>₹{(s.value / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── RISK & COMPLIANCE TAB ── */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-navy font-heading">⚠️ Risk & Compliance Alerts</h2>
          {(d?.riskAlerts || []).length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center">
              <span className="text-5xl block mb-3">🛡️</span>
              <h3 className="font-bold text-green-800">All Clear!</h3>
              <p className="text-green-600 text-sm mt-1">No active risk or compliance alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(d?.riskAlerts || []).map((alert, i) => {
                const sev = { high: { bg: '#FEE2E2', border: '#FECACA', color: '#DC2626', icon: '🔴', label: 'HIGH RISK' }, medium: { bg: '#FEF3C7', border: '#FDE68A', color: '#D97706', icon: '🟡', label: 'MEDIUM' }, low: { bg: '#DBEAFE', border: '#BFDBFE', color: '#2563EB', icon: '🔵', label: 'LOW' } }
                const cfg = sev[alert.severity as keyof typeof sev] || sev.low
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="p-4 rounded-2xl border flex items-center gap-4" style={{ background: cfg.bg, borderColor: cfg.border }}>
                    <span className="text-2xl flex-shrink-0">{cfg.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: cfg.color }}>{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">Category: {alert.type}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: cfg.color + '20', color: cfg.color }}>{cfg.label}</span>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Compliance checklist */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-navy font-heading mb-4">📋 Compliance Checklist</h3>
            <div className="space-y-3">
              {[
                { item: 'All active invoices have been reviewed', status: (d?.revenue.overdueCount || 0) === 0 },
                { item: 'Legal documents are up to date', status: true },
                { item: 'Board meeting minutes are recorded', status: true },
                { item: 'MOU agreements are within validity period', status: (d?.riskAlerts || []).filter(a => a.type === 'compliance').length === 0 },
                { item: 'Risk assessment completed for current quarter', status: true },
              ].map((check, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <span className={`text-xl flex-shrink-0 ${check.status ? 'text-green-500' : 'text-red-400'}`}>{check.status ? '✅' : '❌'}</span>
                  <p className={`text-sm ${check.status ? 'text-slate-600' : 'text-red-600 font-medium'}`}>{check.item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MOU TRACKER TAB ── */}
      {activeTab === 'mou' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-navy font-heading">🤝 MOU / Agreement Tracker</h2>
          {mouLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {mous.filter(m => ['mou', 'agreement'].includes(m.type)).length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <span className="text-4xl block mb-3">🤝</span>
                  <p>No MOUs or agreements registered yet.</p>
                  <p className="text-xs mt-1">Operations team can upload documents for BOD review.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {mous.filter(m => ['mou', 'agreement'].includes(m.type)).map((doc) => {
                    const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
                      draft: { label: 'Draft', color: '#6B7280', bg: '#F3F4F6' },
                      pending_approval: { label: 'Pending Approval', color: '#F59E0B', bg: '#FEF3C7' },
                      approved: { label: 'Approved', color: '#10B981', bg: '#D1FAE5' },
                      rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEE2E2' },
                      expired: { label: 'Expired', color: '#6B7280', bg: '#F1F5F9' },
                    }
                    const sc = STATUS_CFG[doc.status] || STATUS_CFG.draft
                    return (
                      <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors flex-wrap">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-50 flex-shrink-0">🤝</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-navy text-sm">{doc.title}</p>
                          {doc.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.description}</p>}
                          <p className="text-[10px] text-slate-300 mt-0.5">Updated: {new Date(doc.updated_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <select
                          value={doc.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value
                            setMous(m => m.map(d => d.id === doc.id ? { ...d, status: newStatus } : d))
                            await fetch('/api/admin/board/legal', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: doc.id, status: newStatus }) })
                          }}
                          className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 outline-none cursor-pointer text-center appearance-none"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {Object.entries(STATUS_CFG).map(([val, cfg]) => (
                            <option key={val} value={val}>{cfg.label}</option>
                          ))}
                        </select>
                        {doc.status === 'expired' && <span className="text-xs font-bold text-red-500">⚠️ Renewal Required</span>}
                        {doc.status === 'pending_approval' && <span className="text-xs font-bold text-amber-500 animate-pulse">Needs Review</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ANNOUNCEMENTS TAB ── */}
      {activeTab === 'announce' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-navy font-heading">📢 Announcement Publisher</h2>
            <button onClick={() => setShowAnnForm(v => !v)}
              className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: '#FF6B35' }}>
              + Publish Announcement
            </button>
          </div>

          <AnimatePresence>
            {showAnnForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-navy font-heading mb-4">📝 New Announcement</h3>
                <form onSubmit={publishAnnouncement} className="space-y-4">
                  <input required value={annForm.title} onChange={e => setAnnForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Announcement title *"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                  <div className="flex gap-3">
                    <select value={annForm.type} onChange={e => setAnnForm(p => ({ ...p, type: e.target.value }))}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                      {['info', 'success', 'warning', 'urgent'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <textarea required rows={3} value={annForm.message} onChange={e => setAnnForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Announcement message (visible site-wide to all staff)..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                  <div className="flex gap-3">
                    <button type="submit" disabled={savingAnn}
                      className="px-6 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60"
                      style={{ background: '#1B3A6B' }}>
                      {savingAnn ? '⏳ Publishing...' : '📢 Publish Now'}
                    </button>
                    <button type="button" onClick={() => setShowAnnForm(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer hover:bg-slate-200">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {annLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
          ) : (
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400">
                  <span className="text-4xl block mb-3">📢</span>
                  <p>No announcements yet. Publish your first one above.</p>
                </div>
              ) : announcements.map((ann, i) => {
                const TYPE_CFG: Record<string, { bg: string; color: string; icon: string }> = {
                  info: { bg: '#DBEAFE', color: '#2563EB', icon: 'ℹ️' },
                  success: { bg: '#D1FAE5', color: '#059669', icon: '✅' },
                  warning: { bg: '#FEF3C7', color: '#D97706', icon: '⚠️' },
                  urgent: { bg: '#FEE2E2', color: '#DC2626', icon: '🚨' },
                }
                const cfg = TYPE_CFG[ann.type] || TYPE_CFG.info
                return (
                  <motion.div key={ann.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`p-5 rounded-2xl border flex items-start gap-4`} style={{ background: cfg.bg + '60', borderColor: cfg.color + '30' }}>
                    <span className="text-2xl flex-shrink-0">{cfg.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-navy">{ann.title}</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: cfg.color + '20', color: cfg.color }}>{ann.type}</span>
                        {!ann.is_active && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold">Inactive</span>}
                      </div>
                      <p className="text-sm text-slate-600">{ann.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2">{new Date(ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── BOARD DOCS TAB ── */}
      {activeTab === 'boarddocs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{boardNotes.length} meeting notes</p>
            <button onClick={() => setShowNoteForm(v => !v)}
              className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
              style={{ background: '#1B3A6B' }}>+ Add Meeting Notes</button>
          </div>
          {showNoteForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <form onSubmit={saveBoardNote} className="space-y-3">
                <input required value={noteForm.title} onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Meeting Title *" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="date" value={noteForm.meeting_date} onChange={e => setNoteForm(p => ({ ...p, meeting_date: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={noteForm.file_url} onChange={e => setNoteForm(p => ({ ...p, file_url: e.target.value }))}
                    placeholder="Document URL (optional)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                </div>
                <textarea rows={3} value={noteForm.agenda} onChange={e => setNoteForm(p => ({ ...p, agenda: e.target.value }))}
                  placeholder="Agenda items..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                <textarea rows={4} value={noteForm.minutes} onChange={e => setNoteForm(p => ({ ...p, minutes: e.target.value }))}
                  placeholder="Meeting minutes / decisions taken..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                <div className="flex gap-3">
                  <button type="submit" disabled={savingNote}
                    className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{savingNote ? '⏳' : '💾 Save Notes'}</button>
                  <button type="button" onClick={() => setShowNoteForm(false)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                </div>
              </form>
            </motion.div>
          )}
          {noteLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
          ) : boardNotes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📋</span><p>No meeting notes yet</p></div>
          ) : (
            <div className="space-y-4">
              {boardNotes.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-navy">{n.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">📅 {new Date(n.meeting_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    {n.file_url && (
                      <a href={n.file_url} target="_blank" rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors">📎 Doc</a>
                    )}
                  </div>
                  {n.agenda && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Agenda</p>
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 whitespace-pre-wrap">{n.agenda}</p>
                    </div>
                  )}
                  {n.minutes && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Minutes / Decisions</p>
                      <p className="text-sm text-slate-600 bg-blue-50 rounded-xl p-3 whitespace-pre-wrap">{n.minutes}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ABOUT PAGE TAB ── */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-navy font-heading">🌐 About Page Content Manager</h2>
            <span className="text-xs text-slate-400 bg-slate-100 rounded-lg px-3 py-1.5">Changes reflect immediately on /about</span>
          </div>

          {/* Sub-nav */}
          <div className="flex gap-2 flex-wrap">
            {(['company', 'timeline', 'members', 'achievements'] as const).map(s => (
              <button key={s} onClick={() => setAboutSection(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all capitalize ${aboutSection === s ? 'bg-navy text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {s === 'company' ? '🏢 Company Info' : s === 'timeline' ? '📅 Timeline' : s === 'members' ? '👥 Team Members' : '🏆 Achievements'}
              </button>
            ))}
          </div>

          {aboutLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
          ) : (
            <>
              {/* ── COMPANY INFO ── */}
              {aboutSection === 'company' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-navy font-heading">🏢 Company Vision, Mission & Story</h3>
                  {(['vision', 'mission', 'story', 'tagline'] as const).map(field => (
                    <div key={field}>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{field}</label>
                      <textarea rows={field === 'tagline' ? 2 : 4}
                        defaultValue={aboutData.company[field] || ''}
                        onChange={e => setAboutForm(p => ({ ...p, [field]: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy resize-none"
                        placeholder={`Enter company ${field}...`} />
                    </div>
                  ))}
                  <button
                    disabled={savingAbout}
                    onClick={async () => {
                      setSavingAbout(true)
                      const merged = { ...aboutData.company, ...aboutForm }
                      await fetch('/api/admin/about', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'company', ...merged }) })
                      const d = await fetch('/api/admin/about').then(r => r.json())
                      setAboutData(d)
                      setSavingAbout(false)
                    }}
                    className="px-6 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60 hover:opacity-90"
                    style={{ background: '#1B3A6B' }}>
                    {savingAbout ? '⏳ Saving...' : '💾 Save Company Info'}
                  </button>
                </div>
              )}

              {/* ── TIMELINE ── */}
              {aboutSection === 'timeline' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-500">{aboutData.timeline.length} timeline events</p>
                    <button onClick={() => { setShowAboutForm('timeline'); setEditingAboutId(null); setAboutForm({ year: '', title: '', description: '' }) }}
                      className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#FF6B35' }}>+ Add Event</button>
                  </div>
                  <AnimatePresence>
                    {showAboutForm === 'timeline' && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-navy mb-3">{editingAboutId ? 'Edit Event' : 'New Timeline Event'}</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input value={aboutForm.year || ''} onChange={e => setAboutForm(p => ({ ...p, year: e.target.value }))} placeholder="Year (e.g. 2025)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                          <input value={aboutForm.title || ''} onChange={e => setAboutForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                        </div>
                        <textarea rows={2} value={aboutForm.description || ''} onChange={e => setAboutForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none mb-3" />
                        <div className="flex gap-3">
                          <button disabled={savingAbout || !aboutForm.title} onClick={async () => {
                            setSavingAbout(true)
                            if (editingAboutId) {
                              await fetch('/api/admin/about', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'timeline', id: editingAboutId, ...aboutForm }) })
                            } else {
                              await fetch('/api/admin/about', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'timeline', ...aboutForm, sort_order: aboutData.timeline.length + 1 }) })
                            }
                            const d = await fetch('/api/admin/about').then(r => r.json()); setAboutData(d); setShowAboutForm(null); setSavingAbout(false)
                          }} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{savingAbout ? '⏳' : '💾 Save'}</button>
                          <button onClick={() => setShowAboutForm(null)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="space-y-3">
                    {aboutData.timeline.map((item) => (
                      <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-accent font-extrabold text-sm">{item.year}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-navy text-sm">{item.title}</p>
                          <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => { setAboutForm({ year: item.year, title: item.title, description: item.description }); setEditingAboutId(item.id); setShowAboutForm('timeline') }}
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 text-xs flex items-center justify-center cursor-pointer hover:bg-blue-100">✏️</button>
                          <button onClick={async () => {
                            await fetch(`/api/admin/about?type=timeline&id=${item.id}`, { method: 'DELETE' })
                            setAboutData(p => ({ ...p, timeline: p.timeline.filter(t => t.id !== item.id) }))
                          }} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 text-xs flex items-center justify-center cursor-pointer hover:bg-red-100">🗑</button>
                        </div>
                      </div>
                    ))}
                    {aboutData.timeline.length === 0 && <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100">No timeline events yet</div>}
                  </div>
                </div>
              )}

              {/* ── TEAM MEMBERS ── */}
              {aboutSection === 'members' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-500">{aboutData.members.length} team members</p>
                    <button onClick={() => { setShowAboutForm('member'); setEditingAboutId(null); setAboutForm({ name: '', role: '', image_url: '', vision: '', mission: '', statement: '' }) }}
                      className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#8B5CF6' }}>+ Add Member</button>
                  </div>
                  <AnimatePresence>
                    {showAboutForm === 'member' && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-navy mb-3">{editingAboutId ? 'Edit Member' : 'Add Team Member'}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <input value={aboutForm.name || ''} onChange={e => setAboutForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                          <input value={aboutForm.role || ''} onChange={e => setAboutForm(p => ({ ...p, role: e.target.value }))} placeholder="Role / Designation *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                          <input value={aboutForm.image_url || ''} onChange={e => setAboutForm(p => ({ ...p, image_url: e.target.value }))} placeholder="Image URL (or /images/team/name.jpg)" className="col-span-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                        </div>
                        {['vision', 'mission', 'statement'].map(field => (
                          <textarea key={field} rows={2} value={aboutForm[field] || ''} onChange={e => setAboutForm(p => ({ ...p, [field]: e.target.value }))}
                            placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)}...`}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none mb-3" />
                        ))}
                        <div className="flex gap-3">
                          <button disabled={savingAbout || !aboutForm.name} onClick={async () => {
                            setSavingAbout(true)
                            if (editingAboutId) {
                              await fetch('/api/admin/about', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'member', id: editingAboutId, ...aboutForm }) })
                            } else {
                              await fetch('/api/admin/about', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'member', ...aboutForm, sort_order: aboutData.members.length + 1, is_active: true }) })
                            }
                            const d = await fetch('/api/admin/about').then(r => r.json()); setAboutData(d); setShowAboutForm(null); setSavingAbout(false)
                          }} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{savingAbout ? '⏳' : '💾 Save'}</button>
                          <button onClick={() => setShowAboutForm(null)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aboutData.members.map(m => (
                      <div key={m.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center text-navy font-bold text-lg flex-shrink-0">
                            {m.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-navy text-sm truncate">{m.name}</p>
                            <p className="text-accent text-xs font-semibold mt-0.5 truncate">{m.role}</p>
                          </div>
                        </div>
                        {m.vision && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{m.vision}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => { setAboutForm({ name: m.name, role: m.role, image_url: m.image_url || '', vision: m.vision || '', mission: m.mission || '', statement: m.statement || '' }); setEditingAboutId(m.id); setShowAboutForm('member') }}
                            className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-500 text-xs font-bold cursor-pointer hover:bg-blue-100">✏️ Edit</button>
                          <button onClick={async () => {
                            await fetch(`/api/admin/about?type=member&id=${m.id}`, { method: 'DELETE' })
                            setAboutData(p => ({ ...p, members: p.members.filter(x => x.id !== m.id) }))
                          }} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 text-xs flex items-center justify-center cursor-pointer hover:bg-red-100">🗑</button>
                        </div>
                      </div>
                    ))}
                    {aboutData.members.length === 0 && <div className="col-span-3 text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100">No team members yet</div>}
                  </div>
                </div>
              )}

              {/* ── ACHIEVEMENTS ── */}
              {aboutSection === 'achievements' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-500">{aboutData.achievements.length} achievements</p>
                    <button onClick={() => { setShowAboutForm('achievement'); setEditingAboutId(null); setAboutForm({ icon: '🏆', value: '', label: '' }) }}
                      className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#10B981' }}>+ Add Achievement</button>
                  </div>
                  <AnimatePresence>
                    {showAboutForm === 'achievement' && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <input value={aboutForm.icon || ''} onChange={e => setAboutForm(p => ({ ...p, icon: e.target.value }))} placeholder="Icon emoji 🏆" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                          <input value={aboutForm.value || ''} onChange={e => setAboutForm(p => ({ ...p, value: e.target.value }))} placeholder="Value e.g. 500+" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                          <input value={aboutForm.label || ''} onChange={e => setAboutForm(p => ({ ...p, label: e.target.value }))} placeholder="Label e.g. Projects Done" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                        </div>
                        <div className="flex gap-3">
                          <button disabled={savingAbout || !aboutForm.value} onClick={async () => {
                            setSavingAbout(true)
                            if (editingAboutId) {
                              await fetch('/api/admin/about', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'achievement', id: editingAboutId, ...aboutForm }) })
                            } else {
                              await fetch('/api/admin/about', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'achievement', ...aboutForm, sort_order: aboutData.achievements.length + 1 }) })
                            }
                            const d = await fetch('/api/admin/about').then(r => r.json()); setAboutData(d); setShowAboutForm(null); setSavingAbout(false)
                          }} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{savingAbout ? '⏳' : '💾 Save'}</button>
                          <button onClick={() => setShowAboutForm(null)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {aboutData.achievements.map(a => (
                      <div key={a.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                        <div className="text-3xl mb-2">{a.icon}</div>
                        <p className="text-2xl font-extrabold text-navy font-heading">{a.value}</p>
                        <p className="text-slate-400 text-xs mt-1">{a.label}</p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => { setAboutForm({ icon: a.icon, value: a.value, label: a.label }); setEditingAboutId(a.id); setShowAboutForm('achievement') }}
                            className="flex-1 py-1 rounded-lg bg-blue-50 text-blue-500 text-[10px] font-bold cursor-pointer">✏️</button>
                          <button onClick={async () => {
                            await fetch(`/api/admin/about?type=achievement&id=${a.id}`, { method: 'DELETE' })
                            setAboutData(p => ({ ...p, achievements: p.achievements.filter(x => x.id !== a.id) }))
                          }} className="flex-1 py-1 rounded-lg bg-red-50 text-red-400 text-[10px] font-bold cursor-pointer">🗑</button>
                        </div>
                      </div>
                    ))}
                    {aboutData.achievements.length === 0 && <div className="col-span-4 text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100">No achievements yet</div>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── BRAND ASSETS TAB ── */}
      {activeTab === 'brand' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{brandAssets.length} brand assets</p>
            <button onClick={() => setShowAssetForm(v => !v)}
              className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
              style={{ background: '#8B5CF6' }}>+ Add Brand Asset</button>
          </div>
          {showAssetForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <form onSubmit={saveBrandAsset} className="grid grid-cols-2 gap-3">
                <input required value={assetForm.name} onChange={e => setAssetForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Asset Name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <select value={assetForm.category} onChange={e => setAssetForm(p => ({ ...p, category: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                  {['logo', 'guideline', 'template', 'banner', 'presentation', 'legal', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input required value={assetForm.file_url} onChange={e => setAssetForm(p => ({ ...p, file_url: e.target.value }))}
                  placeholder="File URL (Google Drive, etc.) *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <textarea value={assetForm.description} onChange={e => setAssetForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description..." rows={2} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                <div className="flex gap-3 col-span-2">
                  <button type="submit" disabled={savingAsset}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer disabled:opacity-60">{savingAsset ? '⏳' : '🎨 Save Asset'}</button>
                  <button type="button" onClick={() => setShowAssetForm(false)} className="text-sm text-slate-400 cursor-pointer">Cancel</button>
                </div>
              </form>
            </motion.div>
          )}
          {assetLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
          ) : brandAssets.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🎨</span><p>No brand assets uploaded yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brandAssets.map((a, i) => {
                const CAT_ICONS: Record<string, string> = { logo: '🏷️', guideline: '📐', template: '📄', banner: '🖼️', presentation: '📊', legal: '⚖️', other: '📁' }
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-2xl flex-shrink-0">{CAT_ICONS[a.category] || '📁'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-navy text-sm truncate">{a.name}</p>
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold capitalize">{a.category}</span>
                      </div>
                    </div>
                    {a.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{a.description}</p>}
                    <p className="text-[10px] text-slate-400 mb-3">{new Date(a.created_at).toLocaleDateString('en-IN')}</p>
                    <a href={a.file_url} target="_blank" rel="noreferrer"
                      className="block w-full text-center py-2 bg-purple-50 text-purple-600 text-xs font-bold rounded-xl hover:bg-purple-100 transition-colors">🔗 Open Asset</a>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
