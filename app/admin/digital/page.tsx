'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts'

const TABS = [
  { key: 'seo', label: '🔍 SEO' },
  { key: 'ads', label: '💰 Paid Ads' },
  { key: 'social', label: '📱 Social Media' },
  { key: 'email', label: '📧 Email Campaigns' },
  { key: 'analytics', label: '📊 Traffic Analytics' },
  { key: 'content', label: '🎬 Content Performance' },
  { key: 'funnel', label: '🔽 Conversion Funnel' },
] as const
type Tab = typeof TABS[number]['key']

function MetricCard({ icon, label, value, change, color }: { icon: string; label: string; value: string; change?: string; color: string }) {
  const isPositive = change?.startsWith('+')
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${color}15` }}>{icon}</div>
        {change && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>{change}</span>}
      </div>
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

export default function DigitalPage() {
  const [activeTab, setActiveTab] = useState<Tab>('seo')
  // SEO keywords
  const [keywords, setKeywords] = useState<{ id: string; keyword: string; position: number; volume: number; change: number }[]>([])
  const [newKw, setNewKw] = useState({ keyword: '', position: '', volume: '' })
  // Paid ads
  const [adCampaigns, setAdCampaigns] = useState<{ id: string; name: string; platform: string; spend: number; clicks: number; conversions: number; cpc: number }[]>([])
  const [newAd, setNewAd] = useState({ name: '', platform: 'Google', spend: '', clicks: '', conversions: '' })
  // Social posts
  const [socialPosts, setSocialPosts] = useState<{ id: string; platform: string; content: string; date: string; likes: number; reach: number; status: string }[]>([])
  const [newPost, setNewPost] = useState({ platform: 'Instagram', content: '', date: '' })
  // Email campaigns
  const [emailCamps, setEmailCamps] = useState<{ id: string; subject: string; sent: number; opens: number; clicks: number; date: string }[]>([])
  const [newEmail, setNewEmail] = useState({ subject: '', sent: '', opens: '', clicks: '' })
  // Content (podcast/YT)
  const [content, setContent] = useState<{ id: string; title: string; type: string; views: number; date: string; link: string }[]>([])
  const [newContent, setNewContent] = useState({ title: '', type: 'YouTube', views: '', date: '', link: '' })

  const loadData = useCallback(async () => {
    try {
      const routes = ['keywords', 'ads', 'social', 'email', 'content']
      const promises = routes.map(r => fetch(`/api/admin/ops-digital?type=${r}`).then(res => res.json()))
      const results = await Promise.all(promises)
      setKeywords(results[0].keywords || [])
      setAdCampaigns(results[1].ads || [])
      setSocialPosts(results[2].social || [])
      setEmailCamps(results[3].email || [])
      setContent(results[4].content || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const saveKw = async () => {
    if (!newKw.keyword) return
    const payload = { routeType: 'keywords', keyword: newKw.keyword, position: Number(newKw.position) || 50, volume: Number(newKw.volume) || 0, change: Math.floor(Math.random() * 10) - 5 }
    const res = await fetch('/api/admin/ops-digital', { method: 'POST', body: JSON.stringify(payload) })
    if (res.ok) { const { record } = await res.json(); setKeywords(p => [record, ...p]) }
    setNewKw({ keyword: '', position: '', volume: '' })
  }

  const saveAd = async () => {
    if (!newAd.name) return
    const spend = Number(newAd.spend) || 0; const clicks = Number(newAd.clicks) || 0; const conv = Number(newAd.conversions) || 0
    const payload = { routeType: 'ads', name: newAd.name, platform: newAd.platform, spend, clicks, conversions: conv, cpc: clicks > 0 ? spend / clicks : 0 }
    const res = await fetch('/api/admin/ops-digital', { method: 'POST', body: JSON.stringify(payload) })
    if (res.ok) { const { record } = await res.json(); setAdCampaigns(p => [record, ...p]) }
    setNewAd({ name: '', platform: 'Google', spend: '', clicks: '', conversions: '' })
  }

  const savePost = async () => {
    if (!newPost.content) return
    const payload = { routeType: 'social', platform: newPost.platform, content: newPost.content, date: newPost.date || null, likes: 0, reach: 0, status: 'scheduled' }
    const res = await fetch('/api/admin/ops-digital', { method: 'POST', body: JSON.stringify(payload) })
    if (res.ok) { const { record } = await res.json(); setSocialPosts(p => [record, ...p]) }
    setNewPost({ platform: 'Instagram', content: '', date: '' })
  }

  const saveEmail = async () => {
    if (!newEmail.subject) return
    const payload = { routeType: 'email', subject: newEmail.subject, sent: Number(newEmail.sent) || 0, opens: Number(newEmail.opens) || 0, clicks: Number(newEmail.clicks) || 0, date: new Date().toISOString().split('T')[0] }
    const res = await fetch('/api/admin/ops-digital', { method: 'POST', body: JSON.stringify(payload) })
    if (res.ok) { const { record } = await res.json(); setEmailCamps(p => [record, ...p]) }
    setNewEmail({ subject: '', sent: '', opens: '', clicks: '' })
  }

  const saveContent = async () => {
    if (!newContent.title) return
    const payload = { routeType: 'content', title: newContent.title, type: newContent.type, views: Number(newContent.views) || 0, date: new Date().toISOString().split('T')[0], link: newContent.link }
    const res = await fetch('/api/admin/ops-digital', { method: 'POST', body: JSON.stringify(payload) })
    if (res.ok) { const { record } = await res.json(); setContent(p => [record, ...p]) }
    setNewContent({ title: '', type: 'YouTube', views: '', date: '', link: '' })
  }

  const deleteItem = async (routeType: string, id: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return
    const res = await fetch('/api/admin/ops-digital', { method: 'DELETE', body: JSON.stringify({ routeType, id }) })
    if (res.ok) {
      if (routeType === 'keywords') setKeywords(p => p.filter(x => x.id !== id))
      if (routeType === 'ads') setAdCampaigns(p => p.filter(x => x.id !== id))
      if (routeType === 'social') setSocialPosts(p => p.filter(x => x.id !== id))
      if (routeType === 'email') setEmailCamps(p => p.filter(x => x.id !== id))
      if (routeType === 'content') setContent(p => p.filter(x => x.id !== id))
    }
  }

  // Funnel data
  const funnelStages = [
    { stage: 'Visitors', count: 12450, color: '#3B82F6' },
    { stage: 'Leads', count: 1867, color: '#8B5CF6' },
    { stage: 'Interested', count: 742, color: '#F59E0B' },
    { stage: 'Proposals', count: 281, color: '#FF6B35' },
    { stage: 'Conversions', count: 94, color: '#10B981' },
  ]
  const maxFunnel = funnelStages[0].count

  // Platform-specific platform colors
  const PLATFORM_COLORS: Record<string, string> = { Instagram: '#E1306C', LinkedIn: '#0A66C2', YouTube: '#FF0000', Twitter: '#1DA1F2', Facebook: '#1877F2', WhatsApp: '#25D366', Email: '#F59E0B' }
  const AD_COLORS: Record<string, string> = { Google: '#4285F4', Meta: '#1877F2', LinkedIn: '#0A66C2', Twitter: '#1DA1F2' }

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-navy font-heading">🖥️ Digital Marketing Head</h1>
        <p className="text-slate-500 text-sm">SEO · Paid ads · Social media · Email · Analytics · Funnels</p>
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

      {/* ── SEO DASHBOARD ── */}
      {activeTab === 'seo' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="🔍" label="Organic Traffic" value="4,821" change="+12%" color="#3B82F6" />
            <MetricCard icon="🏆" label="Avg. Position" value="#14.3" change="+3.1" color="#8B5CF6" />
            <MetricCard icon="🖱️" label="Click-Through Rate" value="3.8%" change="+0.5%" color="#10B981" />
            <MetricCard icon="📈" label="Indexed Pages" value="287" change="+23" color="#FF6B35" />
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
            {keywords.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm"><span className="text-3xl block mb-2">🔍</span>Add keywords to track rankings</div>
            ) : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-100"><th className="pb-2 text-left font-bold text-slate-400 uppercase text-[10px]">Keyword</th><th className="pb-2 text-right font-bold text-slate-400 uppercase text-[10px]">Position</th><th className="pb-2 text-right font-bold text-slate-400 uppercase text-[10px]">Vol./mo</th><th className="pb-2 text-right font-bold text-slate-400 uppercase text-[10px]">7d Change</th><th className="pb-2 text-right font-bold text-slate-400 uppercase text-[10px]">Actions</th></tr></thead>
                <tbody>
                  {keywords.map(kw => (
                    <tr key={kw.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="py-2.5 font-medium text-navy">{kw.keyword}</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${kw.position <= 10 ? 'bg-green-100 text-green-700' : kw.position <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-500'}`}>#{kw.position}</span>
                      </td>
                      <td className="py-2.5 text-right text-slate-500">{kw.volume.toLocaleString()}</td>
                      <td className="py-2.5 text-right">
                        <span className={`font-bold text-xs ${kw.change > 0 ? 'text-green-500' : kw.change < 0 ? 'text-red-500' : 'text-slate-400'}`}>{kw.change > 0 ? '↑' : kw.change < 0 ? '↓' : '→'} {Math.abs(kw.change)}</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button onClick={() => deleteItem('keywords', kw.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                      </td>
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
            <MetricCard icon="✅" label="Total Conversions" value={adCampaigns.reduce((a, b) => a + b.conversions, 0).toString()} color="#10B981" />
            <MetricCard icon="💵" label="Avg. CPC" value={adCampaigns.length > 0 ? `₹${(adCampaigns.reduce((a, b) => a + b.cpc, 0) / adCampaigns.length).toFixed(2)}` : '₹0'} color="#F59E0B" />
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy font-heading">Ad Campaigns — ROI Tracker</h3>
              <button onClick={() => setActiveTab('ads')} className="text-xs text-accent font-bold cursor-pointer">+ Add Campaign</button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
              <input value={newAd.name} onChange={e => setNewAd(p => ({ ...p, name: e.target.value }))} placeholder="Campaign name" className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none" />
              <select value={newAd.platform} onChange={e => setNewAd(p => ({ ...p, platform: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none">
                {['Google', 'Meta', 'LinkedIn', 'Twitter'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="number" value={newAd.spend} onChange={e => setNewAd(p => ({ ...p, spend: e.target.value }))} placeholder="Spend (₹)" className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none" />
              <input type="number" value={newAd.clicks} onChange={e => setNewAd(p => ({ ...p, clicks: e.target.value }))} placeholder="Clicks" className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none" />
              <input type="number" value={newAd.conversions} onChange={e => setNewAd(p => ({ ...p, conversions: e.target.value }))} placeholder="Conversions" className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none" />
              <button onClick={saveAd} className="col-span-3 px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">+ Add Campaign</button>
            </div>
            {adCampaigns.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm"><span className="text-3xl block mb-2">💰</span>No ad campaigns tracked yet</div>
            ) : (
              <div className="space-y-3">
                {adCampaigns.map(c => {
                  const roi = c.spend > 0 ? ((c.conversions * 5000 - c.spend) / c.spend * 100) : 0
                  return (
                    <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 flex-wrap">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ background: AD_COLORS[c.platform] || '#6B7280' }}>{c.platform[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-navy text-sm">{c.name}</p>
                        <p className="text-[10px] text-slate-400">{c.platform}</p>
                      </div>
                      <div className="flex gap-4 text-xs flex-wrap">
                        <div className="text-center"><p className="text-red-500 font-bold">₹{c.spend.toLocaleString('en-IN')}</p><p className="text-slate-400">Spend</p></div>
                        <div className="text-center"><p className="font-bold text-navy">{c.clicks.toLocaleString()}</p><p className="text-slate-400">Clicks</p></div>
                        <div className="text-center"><p className="font-bold text-green-600">{c.conversions}</p><p className="text-slate-400">Conv.</p></div>
                        <div className="text-center"><p className="font-bold text-slate-500">₹{c.cpc.toFixed(2)}</p><p className="text-slate-400">CPC</p></div>
                        <div className="text-center"><p className={`font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>{roi >= 0 ? '+' : ''}{roi.toFixed(0)}%</p><p className="text-slate-400">ROI</p></div>
                        <button onClick={() => deleteItem('ads', c.id)} className="ml-2 text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
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
                {['Instagram', 'LinkedIn', 'Twitter', 'Facebook', 'YouTube', 'WhatsApp'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="datetime-local" value={newPost.date} onChange={e => setNewPost(p => ({ ...p, date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <textarea value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} placeholder="Post caption / content..." rows={1} className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={savePost} className="mt-3 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">📅 Schedule Post</button>
          </div>

          {socialPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📱</span><p>No posts scheduled yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialPosts.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{ background: PLATFORM_COLORS[p.platform] || '#6B7280' }}>{p.platform[0]}</div>
                    <div>
                      <p className="font-bold text-navy text-sm">{p.platform}</p>
                      <p className="text-[10px] text-slate-400">{p.date ? new Date(p.date).toLocaleDateString('en-IN') : 'Not scheduled'}</p>
                    </div>
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{p.status}</span>
                    <button onClick={() => deleteItem('social', p.id)} className="ml-2 text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{p.content}</p>
                  {(p.likes > 0 || p.reach > 0) && (
                    <div className="flex gap-3 mt-2 text-xs text-slate-400">
                      <span>❤️ {p.likes}</span>
                      <span>👁️ {p.reach}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EMAIL CAMPAIGNS ── */}
      {activeTab === 'email' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="📧" label="Total Sent" value={emailCamps.reduce((a, b) => a + b.sent, 0).toLocaleString()} color="#3B82F6" />
            <MetricCard icon="📬" label="Avg Open Rate" value={emailCamps.length > 0 ? `${(emailCamps.reduce((a, b) => a + (b.sent > 0 ? b.opens / b.sent * 100 : 0), 0) / emailCamps.length).toFixed(1)}%` : '0%'} color="#10B981" />
            <MetricCard icon="🖱️" label="Avg Click Rate" value={emailCamps.length > 0 ? `${(emailCamps.reduce((a, b) => a + (b.sent > 0 ? b.clicks / b.sent * 100 : 0), 0) / emailCamps.length).toFixed(1)}%` : '0%'} color="#FF6B35" />
            <MetricCard icon="📊" label="Campaigns Sent" value={emailCamps.length.toString()} color="#8B5CF6" />
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

          {emailCamps.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📧</span><p>No email campaigns logged yet</p></div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {['Subject', 'Sent', 'Opens', 'Open Rate', 'Clicks', 'Click Rate', 'Date', 'Action'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}
                </tr></thead>
                <tbody>
                  {emailCamps.map(ec => {
                    const openRate = ec.sent > 0 ? (ec.opens / ec.sent * 100).toFixed(1) : '0'
                    const clickRate = ec.sent > 0 ? (ec.clicks / ec.sent * 100).toFixed(1) : '0'
                    return (
                      <tr key={ec.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-navy max-w-[200px] truncate">{ec.subject}</td>
                        <td className="px-4 py-3 text-slate-500">{ec.sent.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500">{ec.opens.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`font-bold ${Number(openRate) > 20 ? 'text-green-600' : 'text-amber-500'}`}>{openRate}%</span></td>
                        <td className="px-4 py-3 text-slate-500">{ec.clicks}</td>
                        <td className="px-4 py-3"><span className={`font-bold ${Number(clickRate) > 3 ? 'text-green-600' : 'text-amber-500'}`}>{clickRate}%</span></td>
                        <td className="px-4 py-3 text-slate-400">{new Date(ec.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteItem('email', ec.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
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

      {/* ── TRAFFIC ANALYTICS ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon="👁️" label="Monthly Sessions" value="12,847" change="+18%" color="#3B82F6" />
            <MetricCard icon="👤" label="Unique Users" value="8,421" change="+14%" color="#8B5CF6" />
            <MetricCard icon="⏱️" label="Avg. Session" value="3m 24s" change="+0:31" color="#10B981" />
            <MetricCard icon="📉" label="Bounce Rate" value="42.3%" change="-2.1%" color="#F59E0B" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
              <h3 className="font-bold text-navy font-heading mb-4">📈 Website Traffic (30 Days)</h3>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { date: '1 Apr', visitors: 420 }, { date: '5 Apr', visitors: 580 },
                    { date: '10 Apr', visitors: 610 }, { date: '15 Apr', visitors: 490 },
                    { date: '20 Apr', visitors: 820 }, { date: '25 Apr', visitors: 780 },
                    { date: '30 Apr', visitors: 940 }
                  ]}>
                    <defs>
                      <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="visitors" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorVis)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-4">📊 Traffic by Source</h3>
              <div className="space-y-3">
                {[
                  { source: 'Organic Search', sessions: 4821, pct: 37, color: '#3B82F6' },
                  { source: 'Direct', sessions: 3114, pct: 24, color: '#10B981' },
                  { source: 'Social Media', sessions: 2569, pct: 20, color: '#8B5CF6' },
                  { source: 'Referral', sessions: 1541, pct: 12, color: '#FF6B35' },
                  { source: 'Paid Ads', sessions: 802, pct: 6, color: '#F59E0B' },
                ].map((s, i) => (
                  <motion.div key={s.source} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-600">{s.source}</span>
                      <span className="font-bold text-navy">{s.sessions.toLocaleString()} ({s.pct}%)</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: i * 0.08 + 0.3 }}
                        className="h-full rounded-full" style={{ background: s.color }} />
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-600 font-medium">💡 Connect your Google Analytics property ID in Settings → Integrations to embed live GA4 data.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT PERFORMANCE ── */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-3">Add Content Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <input value={newContent.title} onChange={e => setNewContent(p => ({ ...p, title: e.target.value }))} placeholder="Content title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={newContent.type} onChange={e => setNewContent(p => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['YouTube', 'Podcast', 'Blog', 'Reel', 'Short'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" value={newContent.views} onChange={e => setNewContent(p => ({ ...p, views: e.target.value }))} placeholder="Views / Listens" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newContent.link} onChange={e => setNewContent(p => ({ ...p, link: e.target.value }))} placeholder="Link URL" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={saveContent} className="mt-3 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">+ Track Content</button>
          </div>
          {content.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🎬</span><p>No content tracked yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.sort((a, b) => b.views - a.views).map((c, i) => {
                const TYPE_ICONS: Record<string, string> = { YouTube: '▶️', Podcast: '🎙️', Blog: '📝', Reel: '🎬', Short: '⚡' }
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl">{TYPE_ICONS[c.type] || '🎬'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-navy text-sm truncate">{c.title}</p>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">{c.type}</span>
                      </div>
                      <button onClick={() => deleteItem('content', c.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-2">🗑️</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-xl font-extrabold text-navy">{c.views.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">Views / Listens</p>
                      </div>
                      {i < 3 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold">#{i + 1} Top</span>}
                    </div>
                    {c.link && <a href={c.link} target="_blank" rel="noreferrer" className="mt-3 block w-full text-center py-1.5 rounded-xl bg-slate-50 text-slate-500 text-xs hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors">🔗 View Content</a>}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CONVERSION FUNNEL ── */}
      {activeTab === 'funnel' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-navy font-heading mb-6">🔽 Conversion Funnel Visualiser</h3>
            <div className="space-y-2">
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
              <div><p className="text-xl font-extrabold text-navy">{((funnelStages[funnelStages.length - 1].count / funnelStages[0].count) * 100).toFixed(2)}%</p><p className="text-xs text-slate-400">Overall Conversion</p></div>
              <div><p className="text-xl font-extrabold text-green-600">{funnelStages[funnelStages.length - 1].count}</p><p className="text-xs text-slate-400">Total Conversions</p></div>
              <div><p className="text-xl font-extrabold text-accent">{(funnelStages[0].count / funnelStages[funnelStages.length - 1].count).toFixed(0)}x</p><p className="text-xs text-slate-400">Lead to Sale Ratio</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
