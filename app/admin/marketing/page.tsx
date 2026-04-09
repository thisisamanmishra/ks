'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InterdeptTaskInbox from '@/components/admin/InterdeptTaskInbox'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false, loading: () => <div className="h-64 bg-slate-50 rounded-xl animate-pulse border border-slate-200 flex items-center justify-center text-slate-400 text-sm">Loading editor...</div> })


interface Campaign { id: number; name: string; type: string; channel: string; status: string; budget: number | null; start_date: string | null; end_date: string | null; leads_generated: number | null; created_at: string }

const TABS = [
  { key: 'campaigns', label: '📣 Campaigns' },
  { key: 'blog', label: '📝 Blog' },
  { key: 'podcast', label: '🎙️ Podcasts' },
  { key: 'hackathon', label: '💻 Hackathons' },
  { key: 'schedule', label: '📅 Schedule Event' },
  { key: 'leads', label: '📊 Lead Sources' },
  { key: 'calendar', label: '🗓️ Content Calendar' },
  { key: 'referral', label: '🤝 Referrals' },
  { key: 'events', label: '🎪 All Events' },
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
  // Blogs
  const [blogs, setBlogs] = useState<any[]>([])
  const [blogCategories, setBlogCategories] = useState<{ id: number; name: string }[]>([])
  const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', category_id: '', is_published: false, is_featured: false, featured_image: '' })
  const [savingBlog, setSavingBlog] = useState(false)
  const [showBlogForm, setShowBlogForm] = useState(false)
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null)
  const [deletingBlogId, setDeletingBlogId] = useState<number | null>(null)
  // Podcast (event type=podcast)
  const [podcasts, setPodcasts] = useState<any[]>([])
  const [podForm, setPodForm] = useState({ title: '', short_desc: '', date: '', episode: '', guest: '', audio_url: '', fee: '' })
  const [savingPod, setSavingPod] = useState(false)
  // Hackathon (event type=hackathon)
  const [hackathons, setHackathons] = useState<any[]>([])
  const [hackForm, setHackForm] = useState({ title: '', short_desc: '', date: '', end_date: '', venue: '', capacity: '', fee: '', prize: '', team_size: '', problem: '' })
  const [savingHack, setSavingHack] = useState(false)
  // Scheduled Events (seminar/webinar)
  const [schedEvents, setSchedEvents] = useState<any[]>([])
  const [schedForm, setSchedForm] = useState({ title: '', type: 'seminar', short_desc: '', date: '', venue: '', capacity: '', fee: '' })
  const [savingSched, setSavingSched] = useState(false)

  const loadSubData = useCallback(async () => {
    try {
      const routes = ['calendar', 'referrals', 'events', 'competitor', 'brand']
      const promises = routes.map(r => fetch(`/api/admin/marketing/sub?type=${r}`).then(res => res.json()))
      const globalEventsRes = await fetch('/api/events?limit=50').then(res => res.json())
      const results = await Promise.all(promises)
      setCalItems(results[0].calendar || [])
      setReferrals(results[1].referrals || [])
      setCompNotes(results[2].competitor || [])
      setBrandAssets(results[3].brand || [])
      setEvents(globalEventsRes.events || [])
      // Load filtered event types
      const [podRes, hackRes, schedRes, blogRes, catRes] = await Promise.all([
        fetch('/api/events?type=podcast&limit=50').then(r => r.json()),
        fetch('/api/events?type=hackathon&limit=50').then(r => r.json()),
        fetch('/api/events?type=seminar&limit=50').then(r => r.json()),
        fetch('/api/admin/blogs').then(r => r.json()),
        fetch('/api/blogs/categories').then(r => r.json()),
      ])
      setPodcasts(podRes.events || [])
      setHackathons(hackRes.events || [])
      setSchedEvents(schedRes.events || [])
      setBlogs(blogRes.blogs || [])
      setBlogCategories(catRes.categories || [])
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

  const saveBlog = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingBlog(true)
    try {
      const isEditing = editingBlogId !== null
      const url = isEditing ? `/api/admin/blogs/${editingBlogId}` : '/api/admin/blogs'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blogForm, category_id: blogForm.category_id ? Number(blogForm.category_id) : null })
      })
      if (res.ok) {
        const d = await res.json()
        if (isEditing) {
          setBlogs(p => p.map(b => b.id === editingBlogId ? { ...b, ...d.blog } : b))
        } else {
          setBlogs(p => [d.blog, ...p])
        }
        setBlogForm({ title: '', excerpt: '', content: '', category_id: '', is_published: false, is_featured: false, featured_image: '' })
        setEditingBlogId(null)
        setShowBlogForm(false)
      }
    } catch {} finally { setSavingBlog(false) }
  }

  const startEditBlog = (b: any) => {
    setBlogForm({
      title: b.title || '',
      excerpt: b.excerpt || '',
      content: b.content || '',
      category_id: b.category_id ? String(b.category_id) : '',
      is_published: !!b.is_published,
      is_featured: !!b.is_featured,
      featured_image: b.featured_image || '',
    })
    setEditingBlogId(b.id)
    setShowBlogForm(true)
    setTimeout(() => document.getElementById('blog-form-anchor')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const deleteBlog = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog post? This cannot be undone.')) return
    setDeletingBlogId(id)
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' })
      if (res.ok) setBlogs(p => p.filter(b => b.id !== id))
    } catch {} finally { setDeletingBlogId(null) }
  }

  const savePodcast = async () => {
    if (!podForm.title || !podForm.date) return
    setSavingPod(true)
    const desc = podForm.guest ? `Guest: ${podForm.guest}${podForm.short_desc ? '. ' + podForm.short_desc : ''}` : podForm.short_desc || 'A new episode is now available.'
    const payload = {
      title: podForm.episode ? `EP${podForm.episode}: ${podForm.title}` : podForm.title,
      type: 'podcast', short_description: desc,
      event_date: new Date(podForm.date).toISOString(),
      is_online: true, registration_fee: Number(podForm.fee) || 0,
      audio_url: podForm.audio_url || null,
      guest_name: podForm.guest || null,
      meeting_link: null,
      tags: ['podcast']
    }
    try {
      const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const d = await res.json(); setPodcasts(p => [d.event, ...p]) }
      setPodForm({ title: '', short_desc: '', date: '', episode: '', guest: '', audio_url: '', fee: '' })
    } catch {} finally { setSavingPod(false) }
  }

  const saveHackathon = async () => {
    if (!hackForm.title || !hackForm.date) return
    setSavingHack(true)
    const payload = {
      title: hackForm.title, type: 'hackathon',
      short_description: hackForm.short_desc || 'Join our hackathon and win exciting prizes!',
      event_date: new Date(hackForm.date).toISOString(),
      end_date: hackForm.end_date ? new Date(hackForm.end_date).toISOString() : null,
      venue: hackForm.venue || null, is_online: !hackForm.venue,
      max_participants: Number(hackForm.capacity) || null,
      registration_fee: Number(hackForm.fee) || 0,
      prize_pool: hackForm.prize || null,
      description: hackForm.problem ? `Problem Statement: ${hackForm.problem}${hackForm.team_size ? `\nTeam Size: ${hackForm.team_size}` : ''}` : null,
      tags: ['hackathon', 'coding', 'competition']
    }
    try {
      const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const d = await res.json(); setHackathons(p => [d.event, ...p]) }
      setHackForm({ title: '', short_desc: '', date: '', end_date: '', venue: '', capacity: '', fee: '', prize: '', team_size: '', problem: '' })
    } catch {} finally { setSavingHack(false) }
  }

  const saveScheduledEvent = async () => {
    if (!schedForm.title || !schedForm.date) return
    setSavingSched(true)
    const payload = {
      title: schedForm.title, type: schedForm.type,
      short_description: schedForm.short_desc || `Join us for this ${schedForm.type}.`,
      event_date: new Date(schedForm.date).toISOString(),
      venue: schedForm.venue || null, is_online: !schedForm.venue,
      max_participants: Number(schedForm.capacity) || null,
      registration_fee: Number(schedForm.fee) || 0,
      tags: [schedForm.type]
    }
    try {
      const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const d = await res.json(); setSchedEvents(p => [d.event, ...p]) }
      setSchedForm({ title: '', type: 'seminar', short_desc: '', date: '', venue: '', capacity: '', fee: '' })
    } catch {} finally { setSavingSched(false) }
  }

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

      {/* ── BLOG ── */}
      {activeTab === 'blog' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {[{ label: 'Total', v: blogs.length, c: '#1B3A6B' }, { label: 'Published', v: blogs.filter(b => b.is_published).length, c: '#10B981' }, { label: 'Drafts', v: blogs.filter(b => !b.is_published).length, c: '#F59E0B' }].map(s => (
                <div key={s.label} className="bg-white rounded-xl px-4 py-2.5 border border-slate-100 text-center shadow-sm">
                  <p className="text-xl font-extrabold" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-[10px] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowBlogForm(v => !v)} className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#FF6B35' }}>+ New Blog Post</button>
          </div>
          <div id="blog-form-anchor" />
          <AnimatePresence>
            {showBlogForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy mb-4 text-base flex items-center gap-2">
                  {editingBlogId ? '✏️ Edit Blog Post' : '✍️ Create Blog Post'}
                  <span className="text-xs font-normal text-slate-400 ml-2">Rich Text Editor — headings, tables, images, charts, links, code blocks &amp; more</span>
                </h4>
                <form onSubmit={saveBlog} className="space-y-3">
                  <input required value={blogForm.title} onChange={e => setBlogForm(p => ({ ...p, title: e.target.value }))} placeholder="Blog title *" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy font-semibold" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <select value={blogForm.category_id} onChange={e => setBlogForm(p => ({ ...p, category_id: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                      <option value="">— Category —</option>
                      {blogCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input value={blogForm.featured_image} onChange={e => setBlogForm(p => ({ ...p, featured_image: e.target.value }))} placeholder="Featured image URL (optional)" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  </div>
                  <textarea required value={blogForm.excerpt} onChange={e => setBlogForm(p => ({ ...p, excerpt: e.target.value }))} placeholder="Short excerpt / meta description *" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                  {/* Rich Text Editor */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">Blog Content * <span className="text-slate-400 font-normal">(supports charts 📊, images 🖼, tables ▦, links 🔗, code blocks and more)</span></p>
                    <RichTextEditor
                      content={blogForm.content}
                      onChange={html => setBlogForm(p => ({ ...p, content: html }))}
                      placeholder="Start writing your blog post... Use the toolbar to add headings, bold, images, charts, tables, code blocks and more!"
                    />
                  </div>
                  <div className="flex gap-6 text-sm pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={blogForm.is_published} onChange={e => setBlogForm(p => ({ ...p, is_published: e.target.checked }))} className="w-4 h-4 accent-green-500" /> <span className="text-slate-600">Publish immediately</span></label>
                    <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={blogForm.is_featured} onChange={e => setBlogForm(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4 accent-orange-400" /> <span className="text-slate-600">Mark as featured</span></label>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={savingBlog || !blogForm.content || blogForm.content === '<p></p>'} className="px-6 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-50 transition-all hover:opacity-90" style={{ background: '#1B3A6B' }}>
                      {savingBlog ? '⏳ Saving...' : editingBlogId ? '✏️ Update Blog Post' : '📝 Publish Blog Post'}
                    </button>
                    <button type="button" onClick={() => { setShowBlogForm(false); setEditingBlogId(null); setBlogForm({ title: '', excerpt: '', content: '', category_id: '', is_published: false, is_featured: false, featured_image: '' }) }} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer hover:bg-slate-200">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-100">{['Title', 'Category', 'Status', 'Views', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>)}</tr></thead>
              <tbody>
                {blogs.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400"><span className="text-3xl block mb-2">📝</span>No blog posts yet. Click &ldquo;+ New Blog Post&rdquo; to get started.</td></tr> :
                  blogs.map(b => (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-navy max-w-xs">
                        <div className="truncate">{b.title}</div>
                        {b.is_featured && <span className="text-[9px] text-orange-500 font-bold">⭐ Featured</span>}
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold">{b.category?.name || '—'}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.is_published ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{b.is_published ? 'Published' : 'Draft'}</span></td>
                      <td className="px-4 py-3 text-slate-500">{b.views || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditBlog(b)} className="text-blue-500 hover:text-blue-700 font-bold cursor-pointer transition-colors">✏️ Edit</button>
                          {b.slug && <a href={`/blogs/${b.slug}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-navy font-bold transition-colors">👁</a>}
                          <button onClick={() => deleteBlog(b.id)} disabled={deletingBlogId === b.id} className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PODCAST ── */}
      {activeTab === 'podcast' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">🎙️ Create New Podcast Episode</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <input value={podForm.episode} onChange={e => setPodForm(p => ({ ...p, episode: e.target.value }))} placeholder="Episode # (e.g. 12)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={podForm.guest} onChange={e => setPodForm(p => ({ ...p, guest: e.target.value }))} placeholder="Guest name" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="date" value={podForm.date} onChange={e => setPodForm(p => ({ ...p, date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={podForm.fee} onChange={e => setPodForm(p => ({ ...p, fee: e.target.value }))} placeholder="Fee ₹ (0=free)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <input required value={podForm.title} onChange={e => setPodForm(p => ({ ...p, title: e.target.value }))} placeholder="Episode title *" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none mb-3" />
            <textarea value={podForm.short_desc} onChange={e => setPodForm(p => ({ ...p, short_desc: e.target.value }))} placeholder="Episode description / summary" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none mb-3" />
            <input value={podForm.audio_url} onChange={e => setPodForm(p => ({ ...p, audio_url: e.target.value }))} placeholder="Audio / video URL (optional)" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none mb-3" />
            <button onClick={savePodcast} disabled={savingPod} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer hover:opacity-90 disabled:opacity-60">{savingPod ? '⏳ Saving...' : '🎙️ Publish Episode'}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {podcasts.length === 0 ? <div className="col-span-3 bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">🎙️</span><p>No podcast episodes yet</p></div> :
              podcasts.map((ep, i) => (
                <motion.div key={ep.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">🎙️</div>
                    <div className="flex-1 min-w-0"><p className="font-bold text-navy truncate text-sm">{ep.title}</p><p className="text-[10px] text-slate-400">{new Date(ep.event_date).toLocaleDateString('en-IN')}</p></div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{ep.short_description}</p>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* ── HACKATHON ── */}
      {activeTab === 'hackathon' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">💻 Create Hackathon</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <input value={hackForm.title} onChange={e => setHackForm(p => ({ ...p, title: e.target.value }))} placeholder="Hackathon title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <div><label className="text-[10px] text-slate-400 mb-1 block">Start Date *</label><input type="date" value={hackForm.date} onChange={e => setHackForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" /></div>
              <div><label className="text-[10px] text-slate-400 mb-1 block">End Date</label><input type="date" value={hackForm.end_date} onChange={e => setHackForm(p => ({ ...p, end_date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <input value={hackForm.prize} onChange={e => setHackForm(p => ({ ...p, prize: e.target.value }))} placeholder="Prize pool (e.g. ₹1,00,000)" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={hackForm.capacity} onChange={e => setHackForm(p => ({ ...p, capacity: e.target.value }))} placeholder="Max participants" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={hackForm.fee} onChange={e => setHackForm(p => ({ ...p, fee: e.target.value }))} placeholder="Reg. fee ₹ (0=free)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={hackForm.venue} onChange={e => setHackForm(p => ({ ...p, venue: e.target.value }))} placeholder="Venue (leave blank if online)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={hackForm.team_size} onChange={e => setHackForm(p => ({ ...p, team_size: e.target.value }))} placeholder="Team size (e.g. 1-4 members)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <textarea value={hackForm.short_desc} onChange={e => setHackForm(p => ({ ...p, short_desc: e.target.value }))} placeholder="Short description" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none mb-3" />
            <textarea value={hackForm.problem} onChange={e => setHackForm(p => ({ ...p, problem: e.target.value }))} placeholder="Problem statement (optional)" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none mb-3" />
            <button onClick={saveHackathon} disabled={savingHack} className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer hover:opacity-90 disabled:opacity-60" style={{ background: '#FF6B35' }}>{savingHack ? '⏳ Creating...' : '💻 Launch Hackathon'}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hackathons.length === 0 ? <div className="col-span-2 bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">💻</span><p>No hackathons yet</p></div> :
              hackathons.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-navy">{h.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold">💻 Hackathon</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl bg-slate-50 text-center"><p className="text-xs font-bold text-orange-500">{h.prize_pool || '—'}</p><p className="text-[10px] text-slate-400">Prize</p></div>
                    <div className="p-2 rounded-xl bg-slate-50 text-center"><p className="text-xs font-bold text-navy">{h.max_participants || '∞'}</p><p className="text-[10px] text-slate-400">Seats</p></div>
                    <div className="p-2 rounded-xl bg-slate-50 text-center"><p className="text-xs font-bold text-navy">{new Date(h.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p><p className="text-[10px] text-slate-400">Date</p></div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* ── SCHEDULE EVENT ── */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-navy mb-4">📅 Schedule Event (Seminar / Webinar / Workshop)</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <input value={schedForm.title} onChange={e => setSchedForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title *" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={schedForm.type} onChange={e => setSchedForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {['seminar', 'webinar', 'workshop', 'conference', 'other'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
              <input type="date" value={schedForm.date} onChange={e => setSchedForm(p => ({ ...p, date: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={schedForm.capacity} onChange={e => setSchedForm(p => ({ ...p, capacity: e.target.value }))} placeholder="Capacity" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={schedForm.venue} onChange={e => setSchedForm(p => ({ ...p, venue: e.target.value }))} placeholder="Venue / link (blank=online)" className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input type="number" value={schedForm.fee} onChange={e => setSchedForm(p => ({ ...p, fee: e.target.value }))} placeholder="Fee ₹ (0=free)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <textarea value={schedForm.short_desc} onChange={e => setSchedForm(p => ({ ...p, short_desc: e.target.value }))} placeholder="Short description" rows={2} className="col-span-5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            </div>
            <button onClick={saveScheduledEvent} disabled={savingSched} className="mt-3 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90 disabled:opacity-60">{savingSched ? '⏳ Scheduling...' : '📅 Schedule Event'}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedEvents.length === 0 ? <div className="col-span-3 bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📅</span><p>No scheduled events yet</p></div> :
              schedEvents.map((ev, i) => (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-navy text-sm">{ev.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold capitalize">{ev.type}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{ev.short_description}</p>
                  <div className="flex gap-2 text-[10px] text-slate-400">
                    <span>📅 {new Date(ev.event_date).toLocaleDateString('en-IN')}</span>
                    {ev.venue && <span>📍 {ev.venue}</span>}
                    {!ev.venue && <span className="text-green-500">🌐 Online</span>}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

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

      <div className="mt-8">
        <InterdeptTaskInbox />
      </div>
    </div>
  )
}
