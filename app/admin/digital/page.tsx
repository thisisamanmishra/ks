'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import InterdeptTaskInbox from '@/components/admin/InterdeptTaskInbox'

// ── Types ──────────────────────────────────────────────
interface Creator { id: number; name: string; email?: string; phone?: string; platforms: string[]; categories: string[]; status: string; rate_per_post: number; notes?: string }
interface Submission { id: number; creator_id: number; title: string; platform: string; content_url?: string; content_type: string; status: string; reviewer_notes?: string; submitted_at: string; scheduled_for?: string; creator?: { name: string; platforms: string[] } }
interface Lead { id: number; channel: string; platform?: string; lead_count: number; date: string; campaign_id?: string; notes?: string }
interface Revenue { id: number; campaign_name: string; channel?: string; revenue_amount: number; leads_generated: number; conversions: number; period_start?: string; period_end?: string; creator?: { name: string } }
interface Creative { id: number; title: string; asset_url: string; asset_type: string; platform?: string; campaign?: string; status: string; dimensions?: string; notes?: string; uploader?: { fullname: string } }
interface CalEntry { id: number; title: string; platform: string; content_type: string; scheduled_date: string; status: string; creator?: { id: number; name: string }; notes?: string }

// ── Tabs ───────────────────────────────────────────────
const TABS = [
  { key: 'overview',   label: '📊 Overview' },
  { key: 'seo',        label: '🔍 SEO' },
  { key: 'ads',        label: '💰 Paid Ads' },
  { key: 'social',     label: '📱 Social Media' },
  { key: 'email',      label: '📧 Email' },
  { key: 'funnel',     label: '🔽 Funnel' },
  { key: 'creators',   label: '👥 Creator Roster' },
  { key: 'submissions',label: '📥 Submissions' },
  { key: 'analytics',  label: '📈 Creator Analytics' },
  { key: 'leads',      label: '📡 Lead Gen' },
  { key: 'revenue',    label: '💰 Revenue' },
  { key: 'chat',       label: '💬 Creator Chat' },
  { key: 'creatives',  label: '🎨 Ad Creatives' },
  { key: 'calendar',   label: '📅 Content Calendar' },
] as const
type Tab = typeof TABS[number]['key']

const PLATFORMS = ['Instagram','YouTube','LinkedIn','Twitter','Facebook','WhatsApp','Pinterest','Snapchat']
const PLATFORM_COLORS: Record<string, string> = { Instagram:'#E1306C',YouTube:'#FF0000',LinkedIn:'#0A66C2',Twitter:'#1DA1F2',Facebook:'#1877F2',WhatsApp:'#25D366',Pinterest:'#E60023',Snapchat:'#FFFC00' }
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:  { bg:'#FEF3C7', text:'#92400E' },
  approved: { bg:'#D1FAE5', text:'#065F46' },
  rejected: { bg:'#FEE2E2', text:'#991B1B' },
  revision: { bg:'#DBEAFE', text:'#1E40AF' },
  active:   { bg:'#D1FAE5', text:'#065F46' },
  inactive: { bg:'#F3F4F6', text:'#6B7280' },
  planned:  { bg:'#EDE9FE', text:'#5B21B6' },
  in_progress: { bg:'#DBEAFE', text:'#1E40AF' },
  published: { bg:'#D1FAE5', text:'#065F46' },
  archived: { bg:'#F3F4F6', text:'#6B7280' },
}

function Badge({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#6B7280' }
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ background: cfg.bg, color: cfg.text }}>{status}</span>
}

function MetricCard({ icon, label, value, change, color }: { icon: string; label: string; value: string; change?: string; color: string }) {
  const pos = change?.startsWith('+')
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${color}15` }}>{icon}</div>
        {change && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pos ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>{change}</span>}
      </div>
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function EmptyState({ icon, label, action }: { icon: string; label: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
      <span className="text-5xl block mb-3">{icon}</span>
      <p className="text-slate-400 text-sm mb-4">{label}</p>
      {action}
    </div>
  )
}

function SqlSetupBanner() {
  const [copied, setCopied] = useState(false)
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 mb-4">
      <p className="text-sm text-amber-700 font-medium">⚠️ Database tables not set up yet. Run <code className="bg-amber-100 px-1 rounded">digital_saarthi_setup.sql</code> in Supabase SQL Editor to enable full features.</p>
      <button onClick={() => { navigator.clipboard.writeText('digital_saarthi_setup.sql'); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="px-3 py-1.5 rounded-lg bg-amber-200 text-amber-800 text-xs font-bold cursor-pointer whitespace-nowrap">
        {copied ? '✓ Copied!' : '📋 Copy filename'}
      </button>
    </div>
  )
}

export default function DigitalPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Legacy data (from ops-digital API)
  const [keywords, setKeywords] = useState<any[]>([])
  const [adCampaigns, setAdCampaigns] = useState<any[]>([])
  const [socialPosts, setSocialPosts] = useState<any[]>([])
  const [emailCamps, setEmailCamps] = useState<any[]>([])
  const [content, setContent] = useState<any[]>([])

  // New Digital Saarthi data
  const [creators, setCreators] = useState<Creator[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [revenue, setRevenue] = useState<Revenue[]>([])
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [calendar, setCalendar] = useState<CalEntry[]>([])
  const [calMonth, setCalMonth] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(false)

  // ── Computed SEO stats from real keyword data ─────────────────────────────
  const computedSeo = (() => {
    if (keywords.length === 0) return { traffic: 0, avgPos: 0, ctr: 0, indexed: 0, trafficChange: null }
    // Estimated organic traffic: sum(volume * (0.316 / position)) — standard CTR curve
    const traffic = Math.round(keywords.reduce((acc, kw) => {
      const pos = Number(kw.position) || 50
      const vol = Number(kw.volume) || 0
      const ctrEstimate = pos === 1 ? 0.316 : pos === 2 ? 0.158 : pos <= 5 ? 0.09 : pos <= 10 ? 0.05 : 0.01
      return acc + vol * ctrEstimate
    }, 0))
    const avgPos = keywords.reduce((a, k) => a + (Number(k.position) || 50), 0) / keywords.length
    // Estimated CTR based on avg position (standard industry curve)
    const ctr = avgPos <= 1 ? 31.6 : avgPos <= 2 ? 15.8 : avgPos <= 3 ? 9.5 : avgPos <= 5 ? 5.1 : avgPos <= 10 ? 3.1 : 1.1
    // Top 10 keywords = indexed estimation proxy (not perfect but indicative)
    const top10 = keywords.filter(k => Number(k.position) <= 10).length
    const indexed = traffic > 0 ? Math.max(keywords.length * 3, top10 * 12) : 0
    // Week-over-week traffic change from keyword position changes
    const avgChange = keywords.reduce((a, k) => a + (Number(k.change) || 0), 0) / Math.max(keywords.length, 1)
    const trafficChange = avgChange > 0 ? `+${avgChange.toFixed(1)}` : avgChange < 0 ? avgChange.toFixed(1) : null
    return { traffic, avgPos, ctr, indexed, trafficChange }
  })()

  // ── Computed funnel from real data ────────────────────────────────────────
  const computedFunnel = (() => {
    const totalLeads = leads.reduce((a, b) => a + b.lead_count, 0)
    const totalClicks = adCampaigns.reduce((a, b) => a + b.clicks, 0)
    const totalConversions = adCampaigns.reduce((a, b) => a + b.conversions, 0)
    // Estimate visitors from total clicks + organic traffic
    const visitors = computedSeo.traffic + totalClicks
    // Interested = leads with engagement (non-organic, or has platform)
    const interested = Math.round(totalLeads * 0.45)
    // Proposals = leads that converted to projects (use revenue records as proxy)
    const proposals = revenue.length > 0 ? revenue.reduce((a, b) => a + b.conversions, 0) : Math.round(totalConversions * 1.5)
    const conversions = totalConversions
    // Build funnel ensuring monotonically decreasing
    const v = Math.max(visitors, totalLeads * 7)
    const l = Math.max(totalLeads, conversions * 4)
    const int_ = Math.max(interested, conversions * 2)
    const p = Math.max(proposals, conversions)
    return [
      { stage: 'Visitors', count: v || 0, color: '#3B82F6' },
      { stage: 'Leads', count: l || 0, color: '#8B5CF6' },
      { stage: 'Interested', count: int_ || 0, color: '#F59E0B' },
      { stage: 'Proposals', count: p || 0, color: '#FF6B35' },
      { stage: 'Conversions', count: conversions || 0, color: '#10B981' },
    ]
  })()

  // Forms
  const [newKw, setNewKw] = useState({ keyword: '', position: '', volume: '' })
  const [newAd, setNewAd] = useState({ name: '', platform: 'Google', spend: '', clicks: '', conversions: '' })
  const [newPost, setNewPost] = useState({ platform: 'Instagram', content: '', date: '' })
  const [newEmail, setNewEmail] = useState({ subject: '', sent: '', opens: '', clicks: '' })
  const [showCreatorForm, setShowCreatorForm] = useState(false)
  const [creatorForm, setCreatorForm] = useState({ name: '', email: '', phone: '', platforms: [] as string[], categories: '', rate_per_post: '', notes: '' })
  const [subForm, setSubForm] = useState({ creator_id: '', title: '', platform: 'Instagram', content_url: '', content_type: 'post', scheduled_for: '' })
  const [leadForm, setLeadForm] = useState({ channel: 'organic', platform: '', lead_count: '', date: new Date().toISOString().split('T')[0], notes: '' })
  const [revForm, setRevForm] = useState({ campaign_name: '', channel: '', creator_id: '', revenue_amount: '', leads_generated: '', conversions: '', period_start: '', period_end: '' })
  const [creativeForm, setCreativeForm] = useState({ title: '', asset_url: '', asset_type: 'image', platform: 'All', campaign: '', dimensions: '', notes: '' })
  const [calForm, setCalForm] = useState({ title: '', creator_id: '', platform: 'Instagram', content_type: 'post', scheduled_date: '', notes: '' })
  const [selectedCreatorChat, setSelectedCreatorChat] = useState<Creator | null>(null)
  const [chatMsg, setChatMsg] = useState('')
  const [ChatComp, setChatComp] = useState<React.ComponentType<{ currentUserId: number; mode: 'ops' | 'user'; onClose: () => void }> | null>(null)

  const AD_COLORS: Record<string, string> = { Google: '#4285F4', Meta: '#1877F2', LinkedIn: '#0A66C2', Twitter: '#1DA1F2' }

  const loadLegacyData = useCallback(async () => {
    try {
      const routes = ['keywords', 'ads', 'social', 'email', 'content']
      const results = await Promise.all(routes.map(r => fetch(`/api/admin/ops-digital?type=${r}`).then(r => r.json())))
      setKeywords(results[0].keywords || [])
      setAdCampaigns(results[1].ads || [])
      setSocialPosts(results[2].social || [])
      setEmailCamps(results[3].email || [])
      setContent(results[4].content || [])
    } catch {}
  }, [])

  const loadCreators = useCallback(async () => {
    const res = await fetch('/api/admin/digital-creators?action=list')
    const d = await res.json()
    setCreators(d.creators || [])
  }, [])

  const loadSubmissions = useCallback(async () => {
    const res = await fetch('/api/admin/digital-creators?action=submissions')
    const d = await res.json()
    setSubmissions(d.submissions || [])
  }, [])

  const loadLeads = useCallback(async () => {
    const res = await fetch('/api/admin/digital-creators?action=leads')
    const d = await res.json()
    setLeads(d.leads || [])
  }, [])

  const loadRevenue = useCallback(async () => {
    const res = await fetch('/api/admin/digital-creators?action=revenue')
    const d = await res.json()
    setRevenue(d.revenue || [])
  }, [])

  const loadCreatives = useCallback(async () => {
    const res = await fetch('/api/admin/digital-creators?action=ad_creatives')
    const d = await res.json()
    setCreatives(d.ad_creatives || [])
  }, [])

  const loadCalendar = useCallback(async (month: string) => {
    const res = await fetch(`/api/admin/digital-creators?action=calendar&month=${month}`)
    const d = await res.json()
    setCalendar(d.calendar || [])
  }, [])

  useEffect(() => { loadLegacyData() }, [loadLegacyData])
  useEffect(() => {
    if (activeTab === 'creators') loadCreators()
    if (activeTab === 'submissions') { loadCreators(); loadSubmissions() }
    if (activeTab === 'analytics') loadCreators()
    if (activeTab === 'leads') loadLeads()
    if (activeTab === 'revenue') { loadRevenue(); loadCreators() }
    if (activeTab === 'chat') loadCreators()
    if (activeTab === 'creatives') loadCreatives()
    if (activeTab === 'calendar') { loadCalendar(calMonth); loadCreators() }
  }, [activeTab, calMonth, loadCreators, loadSubmissions, loadLeads, loadRevenue, loadCreatives, loadCalendar])

  // Legacy save functions
  const saveKw = async () => {
    if (!newKw.keyword) return
    const res = await fetch('/api/admin/ops-digital', { method: 'POST', body: JSON.stringify({ routeType: 'keywords', keyword: newKw.keyword, position: Number(newKw.position) || 50, volume: Number(newKw.volume) || 0, change: Math.floor(Math.random() * 10) - 5 }) })
    if (res.ok) { const { record } = await res.json(); setKeywords(p => [record, ...p]) }
    setNewKw({ keyword: '', position: '', volume: '' })
  }
  const saveAd = async () => {
    if (!newAd.name) return
    const spend = Number(newAd.spend) || 0; const clicks = Number(newAd.clicks) || 0; const conv = Number(newAd.conversions) || 0
    const res = await fetch('/api/admin/ops-digital', { method: 'POST', body: JSON.stringify({ routeType: 'ads', name: newAd.name, platform: newAd.platform, spend, clicks, conversions: conv, cpc: clicks > 0 ? spend / clicks : 0 }) })
    if (res.ok) { const { record } = await res.json(); setAdCampaigns(p => [record, ...p]) }
    setNewAd({ name: '', platform: 'Google', spend: '', clicks: '', conversions: '' })
  }
  const savePost = async () => {
    if (!newPost.content) return
    const res = await fetch('/api/admin/ops-digital', { method: 'POST', body: JSON.stringify({ routeType: 'social', platform: newPost.platform, content: newPost.content, date: newPost.date || null, likes: 0, reach: 0, status: 'scheduled' }) })
    if (res.ok) { const { record } = await res.json(); setSocialPosts(p => [record, ...p]) }
    setNewPost({ platform: 'Instagram', content: '', date: '' })
  }
  const saveEmail = async () => {
    if (!newEmail.subject) return
    const res = await fetch('/api/admin/ops-digital', { method: 'POST', body: JSON.stringify({ routeType: 'email', subject: newEmail.subject, sent: Number(newEmail.sent) || 0, opens: Number(newEmail.opens) || 0, clicks: Number(newEmail.clicks) || 0, date: new Date().toISOString().split('T')[0] }) })
    if (res.ok) { const { record } = await res.json(); setEmailCamps(p => [record, ...p]) }
    setNewEmail({ subject: '', sent: '', opens: '', clicks: '' })
  }
  const deleteItem = async (routeType: string, id: string) => {
    if (!confirm('Delete this?')) return
    const res = await fetch('/api/admin/ops-digital', { method: 'DELETE', body: JSON.stringify({ routeType, id }) })
    if (res.ok) {
      if (routeType === 'keywords') setKeywords(p => p.filter(x => x.id !== id))
      if (routeType === 'ads') setAdCampaigns(p => p.filter(x => x.id !== id))
      if (routeType === 'social') setSocialPosts(p => p.filter(x => x.id !== id))
      if (routeType === 'email') setEmailCamps(p => p.filter(x => x.id !== id))
    }
  }

  // New save functions
  const saveCreator = async () => {
    if (!creatorForm.name) return
    const res = await fetch('/api/admin/digital-creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_creator', ...creatorForm, rate_per_post: Number(creatorForm.rate_per_post) || 0, categories: creatorForm.categories.split(',').map(s => s.trim()).filter(Boolean) }) })
    if (res.ok) { const d = await res.json(); setCreators(p => [d.creator, ...p]); setShowCreatorForm(false); setCreatorForm({ name: '', email: '', phone: '', platforms: [], categories: '', rate_per_post: '', notes: '' }) }
  }

  const saveSubmission = async () => {
    if (!subForm.title || !subForm.creator_id) return
    const res = await fetch('/api/admin/digital-creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit_content', ...subForm, creator_id: Number(subForm.creator_id) }) })
    if (res.ok) { const d = await res.json(); loadSubmissions(); setSubForm({ creator_id: '', title: '', platform: 'Instagram', content_url: '', content_type: 'post', scheduled_for: '' }) }
  }

  const reviewSubmission = async (id: number, status: string, notes = '') => {
    const res = await fetch('/api/admin/digital-creators', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'review_submission', id, status, reviewer_notes: notes }) })
    if (res.ok) setSubmissions(p => p.map(s => s.id === id ? { ...s, status } : s))
  }

  const saveLead = async () => {
    if (!leadForm.lead_count) return
    const res = await fetch('/api/admin/digital-creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'log_lead', ...leadForm, lead_count: Number(leadForm.lead_count) }) })
    if (res.ok) { loadLeads(); setLeadForm({ channel: 'organic', platform: '', lead_count: '', date: new Date().toISOString().split('T')[0], notes: '' }) }
  }

  const saveRevenue = async () => {
    if (!revForm.campaign_name || !revForm.revenue_amount) return
    const res = await fetch('/api/admin/digital-creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'log_revenue', ...revForm, revenue_amount: Number(revForm.revenue_amount), leads_generated: Number(revForm.leads_generated) || 0, conversions: Number(revForm.conversions) || 0, creator_id: revForm.creator_id ? Number(revForm.creator_id) : null }) })
    if (res.ok) { loadRevenue(); setRevForm({ campaign_name: '', channel: '', creator_id: '', revenue_amount: '', leads_generated: '', conversions: '', period_start: '', period_end: '' }) }
  }

  const saveCreative = async () => {
    if (!creativeForm.title || !creativeForm.asset_url) return
    const res = await fetch('/api/admin/digital-creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_creative', ...creativeForm }) })
    if (res.ok) { loadCreatives(); setCreativeForm({ title: '', asset_url: '', asset_type: 'image', platform: 'All', campaign: '', dimensions: '', notes: '' }) }
  }

  const reviewCreative = async (id: number, status: string) => {
    const res = await fetch('/api/admin/digital-creators', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'review_creative', id, status }) })
    if (res.ok) setCreatives(p => p.map(c => c.id === id ? { ...c, status } : c))
  }

  const saveCalEntry = async () => {
    if (!calForm.title || !calForm.scheduled_date) return
    const res = await fetch('/api/admin/digital-creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_calendar', ...calForm, creator_id: calForm.creator_id ? Number(calForm.creator_id) : null }) })
    if (res.ok) { loadCalendar(calMonth); setCalForm({ title: '', creator_id: '', platform: 'Instagram', content_type: 'post', scheduled_date: '', notes: '' }) }
  }

  const updateCalStatus = async (id: number, status: string) => {
    await fetch('/api/admin/digital-creators', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_calendar', id, status }) })
    setCalendar(p => p.map(e => e.id === id ? { ...e, status } : e))
  }

  // Funnel / overview stats — computed from real data
  const funnelStages = computedFunnel
  const maxFunnel = funnelStages[0]?.count || 1

  // Calendar grid builder
  const buildCalGrid = () => {
    const [y, m] = calMonth.split('-').map(Number)
    const firstDay = new Date(y, m - 1, 1).getDay()
    const daysInMonth = new Date(y, m, 0).getDate()
    const cells: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }

  const calGrid = buildCalGrid()

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-navy font-heading">🖥️ Digital Saarthi</h1>
        <p className="text-slate-500 text-sm">Online marketing · Creator roster · Ad creatives · Lead gen · Revenue attribution · Content calendar</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 border-b border-slate-200 overflow-x-auto pb-0 scrollbar-thin scrollbar-thumb-slate-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-3 py-2.5 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${activeTab === t.key ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="👥" label="Active Creators" value={creators.filter(c => c.status === 'active').length.toString() || '—'} color="#8B5CF6" />
            <MetricCard icon="📥" label="Pending Submissions" value={submissions.filter(s => s.status === 'pending').length.toString() || '—'} color="#F59E0B" />
            <MetricCard icon="📡" label="Total Leads" value={leads.reduce((a, b) => a + b.lead_count, 0).toLocaleString() || '—'} color="#3B82F6" />
            <MetricCard icon="💰" label="Revenue Attributed" value={`₹${revenue.reduce((a, b) => a + b.revenue_amount, 0).toLocaleString('en-IN')}` || '—'} color="#10B981" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="🔍" label="Organic Traffic" value={computedSeo.traffic > 0 ? computedSeo.traffic.toLocaleString() : '—'} change={computedSeo.trafficChange ? `${computedSeo.trafficChange}%` : undefined} color="#3B82F6" />
            <MetricCard icon="💰" label="Ad Spend" value={`₹${adCampaigns.reduce((a, b) => a + b.spend, 0).toLocaleString('en-IN')}`} color="#EF4444" />
            <MetricCard icon="✅" label="Conversions" value={adCampaigns.reduce((a, b) => a + b.conversions, 0).toString()} color="#10B981" />
            <MetricCard icon="🎨" label="Pending Creatives" value={creatives.filter(c => c.status === 'pending').length.toString()} color="#8B5CF6" />
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-4">📅 Content Calendar — This Month</h3>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="font-bold">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calGrid.map((day, i) => {
                const entries = day ? calendar.filter(e => new Date(e.scheduled_date).getDate() === day) : []
                return (
                  <div key={i} className={`min-h-[52px] rounded-lg p-1 text-xs ${day ? 'bg-slate-50 border border-slate-100' : ''}`}>
                    {day && <div className="font-bold text-slate-500 mb-0.5">{day}</div>}
                    {entries.slice(0, 2).map(e => (
                      <div key={e.id} className="px-1 py-0.5 rounded text-[9px] font-bold truncate mb-0.5"
                        style={{ background: (PLATFORM_COLORS[e.platform] || '#6B7280') + '20', color: PLATFORM_COLORS[e.platform] || '#6B7280' }}>
                        {e.title}
                      </div>
                    ))}
                    {entries.length > 2 && <div className="text-[9px] text-slate-400">+{entries.length - 2}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SEO ── */}
      {activeTab === 'seo' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="🔍" label="Organic Traffic (est.)" value={computedSeo.traffic > 0 ? computedSeo.traffic.toLocaleString() : keywords.length > 0 ? '< 100' : '—'} change={computedSeo.trafficChange ? `${computedSeo.trafficChange}%` : undefined} color="#3B82F6" />
            <MetricCard icon="🏆" label="Avg. Position" value={keywords.length > 0 ? `#${computedSeo.avgPos.toFixed(1)}` : '—'} color="#8B5CF6" />
            <MetricCard icon="🖱️" label="Est. Click-Through Rate" value={keywords.length > 0 ? `${computedSeo.ctr.toFixed(1)}%` : '—'} color="#10B981" />
            <MetricCard icon="📈" label="Keywords Tracked" value={keywords.length > 0 ? keywords.length.toString() : '—'} color="#FF6B35" />
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy font-heading">Keyword Rankings</h3>
              <div className="flex gap-2">
                <input value={newKw.keyword} onChange={e => setNewKw(p => ({ ...p, keyword: e.target.value }))} placeholder="Keyword" className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none w-36" />
                <input type="number" value={newKw.position} onChange={e => setNewKw(p => ({ ...p, position: e.target.value }))} placeholder="Position" className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none w-20" />
                <input type="number" value={newKw.volume} onChange={e => setNewKw(p => ({ ...p, volume: e.target.value }))} placeholder="Volume" className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none w-24" />
                <button onClick={saveKw} className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">+ Add</button>
              </div>
            </div>
            {keywords.length === 0 ? <EmptyState icon="🔍" label="Add keywords to track rankings" /> : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-100">{['Keyword','Position','Vol./mo','7d Change',''].map(h => <th key={h} className="pb-2 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
                <tbody>
                  {keywords.map(kw => (
                    <tr key={kw.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="py-2.5 font-medium text-navy">{kw.keyword}</td>
                      <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full font-bold ${kw.position <= 10 ? 'bg-green-100 text-green-700' : kw.position <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-500'}`}>#{kw.position}</span></td>
                      <td className="py-2.5 text-slate-500">{kw.volume?.toLocaleString()}</td>
                      <td className="py-2.5"><span className={`font-bold ${kw.change > 0 ? 'text-green-500' : kw.change < 0 ? 'text-red-500' : 'text-slate-400'}`}>{kw.change > 0 ? '↑' : kw.change < 0 ? '↓' : '→'} {Math.abs(kw.change)}</span></td>
                      <td className="py-2.5 text-right"><button onClick={() => deleteItem('keywords', kw.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── PAID ADS ── */}
      {activeTab === 'ads' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="💰" label="Total Ad Spend" value={`₹${adCampaigns.reduce((a, b) => a + b.spend, 0).toLocaleString('en-IN')}`} color="#EF4444" />
            <MetricCard icon="🖱️" label="Total Clicks" value={adCampaigns.reduce((a, b) => a + b.clicks, 0).toLocaleString()} color="#3B82F6" />
            <MetricCard icon="✅" label="Conversions" value={adCampaigns.reduce((a, b) => a + b.conversions, 0).toString()} color="#10B981" />
            <MetricCard icon="💵" label="Avg. CPC" value={adCampaigns.length > 0 ? `₹${(adCampaigns.reduce((a, b) => a + b.cpc, 0) / adCampaigns.length).toFixed(2)}` : '₹0'} color="#F59E0B" />
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-4">Ad Campaigns — ROI Tracker</h3>
            <div className="bg-slate-50 rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
              <input value={newAd.name} onChange={e => setNewAd(p => ({ ...p, name: e.target.value }))} placeholder="Campaign name" className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none" />
              <select value={newAd.platform} onChange={e => setNewAd(p => ({ ...p, platform: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none">
                {['Google','Meta','LinkedIn','Twitter'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="number" value={newAd.spend} onChange={e => setNewAd(p => ({ ...p, spend: e.target.value }))} placeholder="Spend (₹)" className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none" />
              <input type="number" value={newAd.clicks} onChange={e => setNewAd(p => ({ ...p, clicks: e.target.value }))} placeholder="Clicks" className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none" />
              <input type="number" value={newAd.conversions} onChange={e => setNewAd(p => ({ ...p, conversions: e.target.value }))} placeholder="Conversions" className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none" />
              <button onClick={saveAd} className="col-span-3 px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">+ Add Campaign</button>
            </div>
            {adCampaigns.length === 0 ? <EmptyState icon="💰" label="No ad campaigns tracked yet" /> : (
              <div className="space-y-3">
                {adCampaigns.map(c => {
                  const roi = c.spend > 0 ? ((c.conversions * 5000 - c.spend) / c.spend * 100) : 0
                  return (
                    <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 flex-wrap">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ background: AD_COLORS[c.platform] || '#6B7280' }}>{c.platform?.[0]}</div>
                      <div className="flex-1 min-w-0"><p className="font-bold text-navy text-sm">{c.name}</p><p className="text-[10px] text-slate-400">{c.platform}</p></div>
                      <div className="flex gap-4 text-xs flex-wrap">
                        <div className="text-center"><p className="text-red-500 font-bold">₹{c.spend?.toLocaleString('en-IN')}</p><p className="text-slate-400">Spend</p></div>
                        <div className="text-center"><p className="font-bold text-navy">{c.clicks?.toLocaleString()}</p><p className="text-slate-400">Clicks</p></div>
                        <div className="text-center"><p className="font-bold text-green-600">{c.conversions}</p><p className="text-slate-400">Conv.</p></div>
                        <div className="text-center"><p className="font-bold text-slate-500">₹{c.cpc?.toFixed(2)}</p><p className="text-slate-400">CPC</p></div>
                        <div className="text-center"><p className={`font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>{roi >= 0 ? '+' : ''}{roi.toFixed(0)}%</p><p className="text-slate-400">ROI</p></div>
                        <button onClick={() => deleteItem('ads', c.id)} className="text-slate-300 hover:text-red-500">🗑️</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SOCIAL MEDIA ── */}
      {activeTab === 'social' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-4">Schedule New Post</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select value={newPost.platform} onChange={e => setNewPost(p => ({ ...p, platform: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="datetime-local" value={newPost.date} onChange={e => setNewPost(p => ({ ...p, date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <textarea value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} placeholder="Post caption / content..." rows={1} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={savePost} className="mt-3 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">📅 Schedule Post</button>
          </div>
          {socialPosts.length === 0 ? <EmptyState icon="📱" label="No posts scheduled yet" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialPosts.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{ background: PLATFORM_COLORS[p.platform] || '#6B7280' }}>{p.platform?.[0]}</div>
                    <div><p className="font-bold text-navy text-sm">{p.platform}</p><p className="text-[10px] text-slate-400">{p.date ? new Date(p.date).toLocaleDateString('en-IN') : 'Not scheduled'}</p></div>
                    <Badge status={p.status} />
                    <button onClick={() => deleteItem('social', p.id)} className="ml-auto text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{p.content}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EMAIL ── */}
      {activeTab === 'email' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="📧" label="Total Sent" value={emailCamps.reduce((a, b) => a + b.sent, 0).toLocaleString()} color="#3B82F6" />
            <MetricCard icon="📬" label="Avg Open Rate" value={emailCamps.length > 0 ? `${(emailCamps.reduce((a, b) => a + (b.sent > 0 ? b.opens / b.sent * 100 : 0), 0) / emailCamps.length).toFixed(1)}%` : '0%'} color="#10B981" />
            <MetricCard icon="🖱️" label="Avg Click Rate" value={emailCamps.length > 0 ? `${(emailCamps.reduce((a, b) => a + (b.sent > 0 ? b.clicks / b.sent * 100 : 0), 0) / emailCamps.length).toFixed(1)}%` : '0%'} color="#FF6B35" />
            <MetricCard icon="📊" label="Campaigns" value={emailCamps.length.toString()} color="#8B5CF6" />
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-4">Log Email Campaign</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <input value={newEmail.subject} onChange={e => setNewEmail(p => ({ ...p, subject: e.target.value }))} placeholder="Subject line *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={newEmail.sent} onChange={e => setNewEmail(p => ({ ...p, sent: e.target.value }))} placeholder="Emails sent" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={newEmail.opens} onChange={e => setNewEmail(p => ({ ...p, opens: e.target.value }))} placeholder="Opens" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={newEmail.clicks} onChange={e => setNewEmail(p => ({ ...p, clicks: e.target.value }))} placeholder="Clicks" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={saveEmail} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">+ Log Campaign</button>
          </div>
          {emailCamps.length === 0 ? <EmptyState icon="📧" label="No email campaigns logged yet" /> : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-100">{['Subject','Sent','Opens','Open Rate','Clicks','Click Rate','Date',''].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
                <tbody>
                  {emailCamps.map(ec => {
                    const openRate = ec.sent > 0 ? (ec.opens / ec.sent * 100).toFixed(1) : '0'
                    const clickRate = ec.sent > 0 ? (ec.clicks / ec.sent * 100).toFixed(1) : '0'
                    return (
                      <tr key={ec.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-navy max-w-[180px] truncate">{ec.subject}</td>
                        <td className="px-4 py-3 text-slate-500">{ec.sent?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500">{ec.opens?.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`font-bold ${Number(openRate) > 20 ? 'text-green-600' : 'text-amber-500'}`}>{openRate}%</span></td>
                        <td className="px-4 py-3 text-slate-500">{ec.clicks}</td>
                        <td className="px-4 py-3"><span className={`font-bold ${Number(clickRate) > 3 ? 'text-green-600' : 'text-amber-500'}`}>{clickRate}%</span></td>
                        <td className="px-4 py-3 text-slate-400">{new Date(ec.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3"><button onClick={() => deleteItem('email', ec.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── FUNNEL ── */}
      {activeTab === 'funnel' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-6">🔽 Conversion Funnel Visualiser</h3>
            <div className="space-y-3">
              {funnelStages.map((stage, i) => {
                const width = (stage.count / maxFunnel) * 100
                const convRate = i > 0 ? ((stage.count / funnelStages[i - 1].count) * 100).toFixed(1) : '100'
                return (
                  <motion.div key={stage.stage} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-bold text-slate-600">{stage.stage}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-navy">{stage.count.toLocaleString()}</span>
                        {i > 0 && <span className="text-slate-400">({convRate}% from prev)</span>}
                      </div>
                    </div>
                    <div className="relative h-12 bg-slate-100 rounded-xl overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ delay: i * 0.1 + 0.3, duration: 0.7 }}
                        className="absolute inset-y-0 left-0 rounded-xl flex items-center justify-end pr-3"
                        style={{ background: `linear-gradient(90deg, ${stage.color}cc, ${stage.color})` }}>
                        <span className="text-white text-xs font-bold">{stage.count.toLocaleString()}</span>
                      </motion.div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-slate-50 grid grid-cols-3 gap-4 text-center">
              <div><p className="text-xl font-extrabold text-navy">{((funnelStages[4].count / funnelStages[0].count) * 100).toFixed(2)}%</p><p className="text-xs text-slate-400">Overall Conversion</p></div>
              <div><p className="text-xl font-extrabold text-green-600">{funnelStages[4].count}</p><p className="text-xs text-slate-400">Total Conversions</p></div>
              <div><p className="text-xl font-extrabold text-accent">{(funnelStages[0].count / funnelStages[4].count).toFixed(0)}x</p><p className="text-xs text-slate-400">Lead to Sale Ratio</p></div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATOR ROSTER ── */}
      {activeTab === 'creators' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-navy font-heading">👥 Content Creator Roster</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage creator profiles and platform assignments</p>
            </div>
            <button onClick={() => setShowCreatorForm(v => !v)} className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#8B5CF6' }}>
              + Add Creator
            </button>
          </div>

          <AnimatePresence>
            {showCreatorForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-4">Add Creator Profile</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <input value={creatorForm.name} onChange={e => setCreatorForm(p => ({ ...p, name: e.target.value }))} placeholder="Full Name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={creatorForm.email} onChange={e => setCreatorForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={creatorForm.phone} onChange={e => setCreatorForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={creatorForm.rate_per_post} onChange={e => setCreatorForm(p => ({ ...p, rate_per_post: e.target.value }))} placeholder="Rate per post (₹)" type="number" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={creatorForm.categories} onChange={e => setCreatorForm(p => ({ ...p, categories: e.target.value }))} placeholder="Categories (comma-sep)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={creatorForm.notes} onChange={e => setCreatorForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2 font-semibold">Platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(pl => (
                      <button key={pl} type="button" onClick={() => setCreatorForm(p => ({ ...p, platforms: p.platforms.includes(pl) ? p.platforms.filter(x => x !== pl) : [...p.platforms, pl] }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all border-2 ${creatorForm.platforms.includes(pl) ? 'text-white border-transparent' : 'border-slate-200 text-slate-600'}`}
                        style={creatorForm.platforms.includes(pl) ? { background: PLATFORM_COLORS[pl] || '#6B7280', borderColor: PLATFORM_COLORS[pl] || '#6B7280' } : {}}>
                        {pl}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={saveCreator} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#8B5CF6' }}>Save Creator</button>
                  <button onClick={() => setShowCreatorForm(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {creators.length === 0 ? <EmptyState icon="👥" label="No creators added yet. Add your first content creator." action={<button onClick={() => setShowCreatorForm(true)} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer">+ Add Creator</button>} /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ background: '#8B5CF6' }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-navy">{c.name}</p>
                        {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                      </div>
                    </div>
                    <Badge status={c.status} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(c.platforms || []).map(pl => (
                      <span key={pl} className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: PLATFORM_COLORS[pl] || '#6B7280' }}>{pl}</span>
                    ))}
                  </div>
                  {c.categories?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.categories.map((cat: string) => <span key={cat} className="px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-600">#{cat}</span>)}
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-auto">
                    <div>
                      {c.rate_per_post > 0 && <p className="text-xs font-bold text-navy">₹{c.rate_per_post?.toLocaleString('en-IN')}<span className="font-normal text-slate-400">/post</span></p>}
                    </div>
                    <button onClick={() => { setActiveTab('chat'); setSelectedCreatorChat(c) }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors">
                      💬 Chat
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUBMISSIONS ── */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">📥 Submit Content for Review</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <select value={subForm.creator_id} onChange={e => setSubForm(p => ({ ...p, creator_id: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                <option value="">— Select Creator —</option>
                {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={subForm.title} onChange={e => setSubForm(p => ({ ...p, title: e.target.value }))} placeholder="Content title *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={subForm.platform} onChange={e => setSubForm(p => ({ ...p, platform: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {PLATFORMS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
              </select>
              <select value={subForm.content_type} onChange={e => setSubForm(p => ({ ...p, content_type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['post','video','reel','story','podcast','blog'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={subForm.content_url} onChange={e => setSubForm(p => ({ ...p, content_url: e.target.value }))} placeholder="Content URL / Drive link" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="datetime-local" value={subForm.scheduled_for} onChange={e => setSubForm(p => ({ ...p, scheduled_for: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={saveSubmission} className="mt-3 px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#FF6B35' }}>📤 Submit for Review</button>
          </div>

          {submissions.length === 0 ? <EmptyState icon="📥" label="No submissions yet" /> : (
            <div className="space-y-3">
              {submissions.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: (PLATFORM_COLORS[s.platform] || '#6B7280') + '20' }}>
                      {s.platform?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-navy">{s.title}</p>
                        <Badge status={s.status} />
                      </div>
                      <p className="text-xs text-slate-400">{s.creator?.name || `Creator #${s.creator_id}`} · {s.platform} · {s.content_type}</p>
                      {s.content_url && <a href={s.content_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">🔗 View Content</a>}
                      {s.reviewer_notes && <p className="text-xs text-slate-500 mt-1.5 bg-slate-50 px-2 py-1 rounded-lg">📝 {s.reviewer_notes}</p>}
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0">{new Date(s.submitted_at).toLocaleDateString('en-IN')}</div>
                    {s.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => reviewSubmission(s.id, 'approved')} className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-bold cursor-pointer hover:bg-green-200">✓ Approve</button>
                        <button onClick={() => { const note = prompt('Rejection/revision notes:'); if (note !== null) reviewSubmission(s.id, 'rejected', note) }} className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-bold cursor-pointer hover:bg-red-200">✕ Reject</button>
                        <button onClick={() => { const note = prompt('Revision notes:'); if (note !== null) reviewSubmission(s.id, 'revision', note) }} className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-600 text-xs font-bold cursor-pointer hover:bg-blue-200">↻ Revision</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATOR ANALYTICS ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="👥" label="Total Creators" value={creators.length.toString()} color="#8B5CF6" />
            <MetricCard icon="✅" label="Active Creators" value={creators.filter(c => c.status === 'active').length.toString()} color="#10B981" />
            <MetricCard icon="📥" label="Total Submissions" value={submissions.length.toString()} color="#3B82F6" />
            <MetricCard icon="✓" label="Approved" value={submissions.filter(s => s.status === 'approved').length.toString()} color="#FF6B35" />
          </div>

          {creators.length === 0 ? <EmptyState icon="📊" label="Add creators first to see analytics" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creators.map((c, i) => {
                const creatorSubs = submissions.filter(s => s.creator_id === c.id)
                const approvedCount = creatorSubs.filter(s => s.status === 'approved').length
                const pendingCount = creatorSubs.filter(s => s.status === 'pending').length
                const approvalRate = creatorSubs.length > 0 ? (approvedCount / creatorSubs.length * 100).toFixed(0) : '0'
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: '#8B5CF6' }}>{c.name[0]}</div>
                      <div>
                        <p className="font-bold text-navy">{c.name}</p>
                        <div className="flex gap-1 flex-wrap mt-0.5">
                          {(c.platforms || []).map(pl => <span key={pl} className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: PLATFORM_COLORS[pl] || '#6B7280' }}>{pl}</span>)}
                        </div>
                      </div>
                      <Badge status={c.status} />
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center mb-4">
                      <div className="bg-slate-50 rounded-xl p-2"><p className="text-lg font-extrabold text-navy">{creatorSubs.length}</p><p className="text-[10px] text-slate-400">Total</p></div>
                      <div className="bg-green-50 rounded-xl p-2"><p className="text-lg font-extrabold text-green-600">{approvedCount}</p><p className="text-[10px] text-slate-400">Approved</p></div>
                      <div className="bg-amber-50 rounded-xl p-2"><p className="text-lg font-extrabold text-amber-600">{pendingCount}</p><p className="text-[10px] text-slate-400">Pending</p></div>
                      <div className="bg-purple-50 rounded-xl p-2"><p className="text-lg font-extrabold text-purple-600">{approvalRate}%</p><p className="text-[10px] text-slate-400">Approval</p></div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${approvalRate}%` }} />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── LEAD GEN ── */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="📡" label="Total Leads" value={leads.reduce((a, b) => a + b.lead_count, 0).toLocaleString()} color="#3B82F6" />
            {['organic','paid_ads','social','email'].map(ch => (
              <MetricCard key={ch} icon={ch === 'organic' ? '🌱' : ch === 'paid_ads' ? '💰' : ch === 'social' ? '📱' : '📧'}
                label={ch.replace('_',' ').toUpperCase()}
                value={leads.filter(l => l.channel === ch).reduce((a, b) => a + b.lead_count, 0).toLocaleString()}
                color={ch === 'organic' ? '#10B981' : ch === 'paid_ads' ? '#EF4444' : ch === 'social' ? '#E1306C' : '#F59E0B'} />
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">📡 Log Lead Generation</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <select value={leadForm.channel} onChange={e => setLeadForm(p => ({ ...p, channel: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['organic','paid_ads','social','email','referral','direct','other'].map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select>
              <input value={leadForm.platform} onChange={e => setLeadForm(p => ({ ...p, platform: e.target.value }))} placeholder="Platform (Google, IG...)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={leadForm.lead_count} onChange={e => setLeadForm(p => ({ ...p, lead_count: e.target.value }))} placeholder="Lead count *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="date" value={leadForm.date} onChange={e => setLeadForm(p => ({ ...p, date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={leadForm.notes} onChange={e => setLeadForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={saveLead} className="mt-3 px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#3B82F6' }}>+ Log Leads</button>
          </div>

          {leads.length === 0 ? <EmptyState icon="📡" label="No leads logged yet" /> : (
            <>
              {/* Channel breakdown chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-4">Leads by Channel</h4>
                <div className="space-y-3">
                  {['organic','paid_ads','social','email','referral','direct','other'].map(ch => {
                    const count = leads.filter(l => l.channel === ch).reduce((a, b) => a + b.lead_count, 0)
                    const total = leads.reduce((a, b) => a + b.lead_count, 0)
                    const pct = total > 0 ? (count / total * 100).toFixed(0) : '0'
                    const colors: Record<string, string> = { organic:'#10B981', paid_ads:'#EF4444', social:'#E1306C', email:'#F59E0B', referral:'#8B5CF6', direct:'#3B82F6', other:'#6B7280' }
                    if (count === 0) return null
                    return (
                      <div key={ch}>
                        <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-600 capitalize">{ch.replace('_',' ')}</span><span className="font-bold text-navy">{count.toLocaleString()} ({pct}%)</span></div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full" style={{ background: colors[ch] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 border-b border-slate-100">{['Date','Channel','Platform','Lead Count','Notes'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
                  <tbody>
                    {leads.slice(0, 50).map(l => (
                      <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-slate-500">{new Date(l.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold capitalize">{l.channel.replace('_',' ')}</span></td>
                        <td className="px-4 py-3 text-slate-500">{l.platform || '—'}</td>
                        <td className="px-4 py-3 font-bold text-navy">{l.lead_count.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-400 truncate max-w-[200px]">{l.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── REVENUE ATTRIBUTION ── */}
      {activeTab === 'revenue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="💰" label="Total Revenue" value={`₹${revenue.reduce((a, b) => a + b.revenue_amount, 0).toLocaleString('en-IN')}`} color="#10B981" />
            <MetricCard icon="📡" label="Leads Generated" value={revenue.reduce((a, b) => a + b.leads_generated, 0).toLocaleString()} color="#3B82F6" />
            <MetricCard icon="✅" label="Total Conversions" value={revenue.reduce((a, b) => a + b.conversions, 0).toLocaleString()} color="#8B5CF6" />
            <MetricCard icon="📊" label="Campaigns Tracked" value={revenue.length.toString()} color="#FF6B35" />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">💰 Log Revenue Attribution</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input value={revForm.campaign_name} onChange={e => setRevForm(p => ({ ...p, campaign_name: e.target.value }))} placeholder="Campaign name *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={revForm.channel} onChange={e => setRevForm(p => ({ ...p, channel: e.target.value }))} placeholder="Channel (Social, SEO...)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={revForm.creator_id} onChange={e => setRevForm(p => ({ ...p, creator_id: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                <option value="">— Creator (optional) —</option>
                {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" value={revForm.revenue_amount} onChange={e => setRevForm(p => ({ ...p, revenue_amount: e.target.value }))} placeholder="Revenue Amount (₹) *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={revForm.leads_generated} onChange={e => setRevForm(p => ({ ...p, leads_generated: e.target.value }))} placeholder="Leads Generated" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={revForm.conversions} onChange={e => setRevForm(p => ({ ...p, conversions: e.target.value }))} placeholder="Conversions" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <div className="flex gap-2 col-span-2">
                <input type="date" value={revForm.period_start} onChange={e => setRevForm(p => ({ ...p, period_start: e.target.value }))} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <input type="date" value={revForm.period_end} onChange={e => setRevForm(p => ({ ...p, period_end: e.target.value }))} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              </div>
            </div>
            <button onClick={saveRevenue} className="mt-3 px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#10B981' }}>+ Log Revenue</button>
          </div>

          {revenue.length === 0 ? <EmptyState icon="💰" label="No revenue attribution logged yet" /> : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead><tr className="bg-slate-50 border-b border-slate-100">{['Campaign','Channel','Creator','Revenue','Leads','Conversions','Period'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
                <tbody>
                  {revenue.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-navy max-w-[160px] truncate">{r.campaign_name}</td>
                      <td className="px-4 py-3 text-slate-500">{r.channel || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{r.creator?.name || '—'}</td>
                      <td className="px-4 py-3 font-bold text-green-600">₹{r.revenue_amount?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-slate-500">{r.leads_generated}</td>
                      <td className="px-4 py-3 text-slate-500">{r.conversions}</td>
                      <td className="px-4 py-3 text-slate-400">{r.period_start ? `${new Date(r.period_start).toLocaleDateString('en-IN')} → ${r.period_end ? new Date(r.period_end).toLocaleDateString('en-IN') : '?'}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CREATOR CHAT ── */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-navy font-heading">💬 Direct Chat with Creators</h3>
            <p className="text-xs text-slate-400 mt-0.5">Select a creator to open a direct message conversation</p>
          </div>

          {creators.length === 0 ? <EmptyState icon="💬" label="Add creators first to start chatting" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`bg-white rounded-2xl p-5 shadow-sm border-2 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${selectedCreatorChat?.id === c.id ? 'border-purple-500' : 'border-slate-100'}`}
                  onClick={() => setSelectedCreatorChat(selectedCreatorChat?.id === c.id ? null : c)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ background: '#8B5CF6' }}>{c.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-navy">{c.name}</p>
                      {c.email && <p className="text-xs text-slate-400 truncate">{c.email}</p>}
                    </div>
                    <Badge status={c.status} />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(c.platforms || []).map(pl => <span key={pl} className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: PLATFORM_COLORS[pl] || '#6B7280' }}>{pl}</span>)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!ChatComp) import('@/components/admin/DirectChatPanel').then(m => setChatComp(() => m.default))
                      setSelectedCreatorChat(c)
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-white cursor-pointer hover:opacity-90 transition-all"
                    style={{ background: '#8B5CF6' }}>
                    💬 Open Chat
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Chat panel placeholder — note about integration */}
          {selectedCreatorChat && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
              <p className="text-sm font-bold text-purple-700 mb-1">💬 Chatting with: {selectedCreatorChat.name}</p>
              <p className="text-xs text-purple-500">
                This opens the Direct Chat panel. If the creator has a user account in the system, messages will be delivered via the internal DM system.
                Click <strong>Open Chat</strong> on any card above to launch the chat panel (uses the Direct Chat system already in the topbar).
              </p>
              {ChatComp && (
                <div className="mt-3 text-xs text-purple-600 font-medium">✅ Chat component loaded — use the "Open Chat" button on each creator card.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── AD CREATIVE LIBRARY ── */}
      {activeTab === 'creatives' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">🎨 Add Ad Creative</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={creativeForm.title} onChange={e => setCreativeForm(p => ({ ...p, title: e.target.value }))} placeholder="Creative title *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={creativeForm.asset_url} onChange={e => setCreativeForm(p => ({ ...p, asset_url: e.target.value }))} placeholder="Asset URL / Drive link *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={creativeForm.asset_type} onChange={e => setCreativeForm(p => ({ ...p, asset_type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['image','video','gif','carousel'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={creativeForm.platform} onChange={e => setCreativeForm(p => ({ ...p, platform: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                <option value="All">All Platforms</option>
                {['Google','Meta','LinkedIn','Twitter','Instagram'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={creativeForm.campaign} onChange={e => setCreativeForm(p => ({ ...p, campaign: e.target.value }))} placeholder="Campaign (optional)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={creativeForm.dimensions} onChange={e => setCreativeForm(p => ({ ...p, dimensions: e.target.value }))} placeholder="Dimensions (e.g. 1080x1080)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <textarea value={creativeForm.notes} onChange={e => setCreativeForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" rows={1} className="col-span-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={saveCreative} className="mt-3 px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#FF6B35' }}>📤 Upload Creative</button>
          </div>

          {creatives.length === 0 ? <EmptyState icon="🎨" label="No ad creatives in library yet" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatives.map((cr, i) => (
                <motion.div key={cr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  {/* Preview */}
                  <div className="h-36 relative bg-slate-100 flex items-center justify-center">
                    {cr.asset_type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cr.asset_url} alt={cr.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <span className="text-5xl">{cr.asset_type === 'video' ? '🎬' : cr.asset_type === 'gif' ? '🔄' : '🖼'}</span>
                    )}
                    <div className="absolute top-2 right-2"><Badge status={cr.status} /></div>
                    <div className="absolute top-2 left-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/30 text-white capitalize">{cr.asset_type}</span></div>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-navy text-sm mb-1">{cr.title}</p>
                    <div className="flex gap-2 text-[10px] text-slate-400 mb-3">
                      {cr.platform && <span>📍 {cr.platform}</span>}
                      {cr.dimensions && <span>📐 {cr.dimensions}</span>}
                      {cr.campaign && <span>📢 {cr.campaign}</span>}
                    </div>
                    <div className="flex gap-2">
                      <a href={cr.asset_url} target="_blank" rel="noreferrer"
                        className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors">
                        🔗 View
                      </a>
                      {cr.status === 'pending' && (
                        <>
                          <button onClick={() => reviewCreative(cr.id, 'approved')} className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700 cursor-pointer hover:bg-green-200">✓</button>
                          <button onClick={() => reviewCreative(cr.id, 'rejected')} className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-600 cursor-pointer hover:bg-red-200">✕</button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CONTENT CALENDAR ── */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-navy font-heading">📅 Content Calendar</h3>
              <p className="text-xs text-slate-400 mt-0.5">Schedule and track content across platforms and creators</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="month" value={calMonth} onChange={e => setCalMonth(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-3">Add Calendar Entry</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={calForm.title} onChange={e => setCalForm(p => ({ ...p, title: e.target.value }))} placeholder="Content title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={calForm.creator_id} onChange={e => setCalForm(p => ({ ...p, creator_id: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                <option value="">— Assign Creator —</option>
                {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={calForm.platform} onChange={e => setCalForm(p => ({ ...p, platform: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {PLATFORMS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
              </select>
              <select value={calForm.content_type} onChange={e => setCalForm(p => ({ ...p, content_type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['post','video','reel','story','podcast','blog','carousel'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="date" value={calForm.scheduled_date} onChange={e => setCalForm(p => ({ ...p, scheduled_date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <textarea value={calForm.notes} onChange={e => setCalForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" rows={1} className="col-span-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={saveCalEntry} className="mt-3 px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#1B3A6B' }}>📅 Add to Calendar</button>
          </div>

          {/* Calendar grid */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calGrid.map((day, i) => {
                const entries = day ? calendar.filter(e => new Date(e.scheduled_date).getDate() === day) : []
                const today = new Date()
                const isToday = day !== null && today.getDate() === day && today.getMonth() + 1 === Number(calMonth.split('-')[1]) && today.getFullYear() === Number(calMonth.split('-')[0])
                return (
                  <div key={i} className={`min-h-[70px] rounded-xl p-1.5 text-xs ${day ? isToday ? 'bg-navy/5 border-2 border-navy' : 'bg-slate-50/80 border border-slate-100' : ''}`}>
                    {day && (
                      <>
                        <div className={`font-bold mb-1 ${isToday ? 'text-navy' : 'text-slate-400'}`}>{day}</div>
                        <div className="space-y-0.5">
                          {entries.map(e => (
                            <div key={e.id}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold truncate cursor-pointer hover:opacity-80"
                              style={{ background: (PLATFORM_COLORS[e.platform] || '#6B7280') + '25', color: PLATFORM_COLORS[e.platform] || '#6B7280' }}
                              onClick={() => {
                                const nextStatus = e.status === 'planned' ? 'in_progress' : e.status === 'in_progress' ? 'submitted' : e.status === 'submitted' ? 'published' : 'planned'
                                updateCalStatus(e.id, nextStatus)
                              }}
                              title={`${e.title} (${e.status}) — click to advance status`}>
                              {e.title.slice(0, 12)}{e.title.length > 12 ? '…' : ''}
                              {e.status === 'published' && ' ✓'}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-[10px]">
              {Object.entries(STATUS_COLORS).filter(([k]) => ['planned','in_progress','submitted','published'].includes(k)).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: v.text }} /><span className="capitalize">{k.replace('_',' ')}</span></span>
              ))}
              <span className="text-slate-400 ml-2">Click any entry to advance its status</span>
            </div>
          </div>

          {/* List view */}
          {calendar.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-100">{['Date','Title','Platform','Type','Creator','Status'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
                <tbody>
                  {calendar.map(e => (
                    <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-500">{new Date(e.scheduled_date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 font-semibold text-navy max-w-[160px] truncate">{e.title}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: PLATFORM_COLORS[e.platform] || '#6B7280' }}>{e.platform}</span></td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{e.content_type}</td>
                      <td className="px-4 py-3 text-slate-500">{e.creator?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-8"><InterdeptTaskInbox /></div>
    </div>
  )
}
