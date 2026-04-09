'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'
import DirectChatPanel from '@/components/admin/DirectChatPanel'
import { fetchWithAuth } from '@/lib/auth/fetchWithAuth'
import PaymentButton from '@/components/PaymentButton'

interface UserData { id: number; fullname: string; email: string; role: string; department: string | null; is_approved: boolean; user_type: string }
interface Project { id: number; service_type: string; description: string; status: string; progress: number; budget: number | null; created_at: string; vendor: { id: number; fullname: string; avatar_url?: string } | null }
interface Message { id: number; content: string; attachment_url: string | null; file_type: string | null; created_at: string; sender: { id: number; fullname: string; role: string } | null }
interface Notification { id: number; type: string; title: string; message: string; project_id: number | null; is_read: boolean; created_at: string }
interface Notification { id: number; type: string; title: string; message: string; project_id: number | null; is_read: boolean; created_at: string }
interface Invoice { id: number; invoice_number: string; total: number; status: string; due_date: string | null; created_at: string; project: { service_type: string } | null }
interface Task { id: number; title: string; assignee: string | null; deadline: string | null; priority: 'low' | 'medium' | 'high'; status: 'todo' | 'in_progress' | 'review' | 'done'; created_at: string }

function DashboardLoading() { return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full animate-spin" /></div> }
export default function DashboardWrapper() { return <Suspense fallback={<DashboardLoading />}><DashboardPage /></Suspense> }

const trackingSteps = [
  { label: 'Request', key: 'pending', icon: '📝' },
  { label: 'Assigned', key: 'assigned', icon: '👨‍💼' },
  { label: 'Progress', key: 'in_progress', icon: '🔄' },
  { label: 'Review', key: 'review', icon: '🔍' },
  { label: 'Delivered', key: 'delivered', icon: '📦' },
  { label: 'Completed', key: 'completed', icon: '✅' },
]
const SERVICE_TYPES = ['Thesis Writing','Project Report','Research Paper','Presentation','Resume Building','Business Plan','Website Development','Data Analysis','Other']

// ⭐ Star Rating Component
function StarRating({ value, onChange, readOnly = false }: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => onChange?.(star)}
          className={`text-2xl transition-transform ${!readOnly ? 'cursor-pointer hover:scale-125' : ''}`}>
          <span className={`${(hover || value) >= star ? 'opacity-100' : 'opacity-25'}`}>⭐</span>
        </button>
      ))}
    </div>
  )
}

function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [saving, setSaving] = useState(false)
  const [chatProject, setChatProject] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingMsg, setDeletingMsg] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState<'all'|'active'|'completed'|'pending'>('all')
  const [ratingProject, setRatingProject] = useState<Project | null>(null)
  const [ratingValue, setRatingValue] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratedProjects, setRatedProjects] = useState<Set<number>>(new Set())
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [vendorRatings, setVendorRatings] = useState<Record<number, { avg: number; total: number }>>({})
  const isPending = searchParams.get('pending') === '1'
  const [form, setForm] = useState({ service_type: '', description: '', budget: '' })
  const [showDMPanel, setShowDMPanel] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoaded, setInvoicesLoaded] = useState(false)

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects')
    if (res.ok) { const data = await res.json(); setProjects(data.projects || []) }
  }, [])

  const fetchNotifications = useCallback(async () => {
    const res = await fetchWithAuth('/api/notifications')
    if (res.ok) { const data = await res.json(); setNotifications(data.notifications || []); setUnreadCount(data.unread || 0) }
  }, [])

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices/my')
      if (res.ok) { const d = await res.json(); setInvoices(d.invoices || []); setInvoicesLoaded(true) }
    } catch {}
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let res = await fetch('/api/auth/me')
        if (res.status === 401) { const r = await fetch('/api/auth/refresh', { method: 'POST' }); if (r.ok) res = await fetch('/api/auth/me') }
        if (!res.ok) { router.push('/login'); return }
        const data = await res.json()
        if ((data.role === 'super_admin' || (data.role === 'admin' && data.is_approved)) && !isPending) { router.push('/admin'); return }
        if (data.role === 'vendor') { router.push('/vendor'); return }
        setUser(data)
        fetchProjects()
        fetchNotifications()
        fetchInvoices()
      } catch { router.push('/login') }
      finally { setLoading(false) }
    }
    fetchUser()
  }, [router, isPending, fetchProjects, fetchNotifications, fetchInvoices])

  // Poll notifications every 15s
  useEffect(() => { const i = setInterval(fetchNotifications, 15000); return () => clearInterval(i) }, [fetchNotifications])

  // Check which projects are already rated
  useEffect(() => {
    const completedWithVendor = projects.filter(p => p.status === 'completed' && p.vendor)
    completedWithVendor.forEach(async p => {
      const res = await fetch(`/api/ratings?projectId=${p.id}`)
      if (res.ok) { const d = await res.json(); if (d.rating) setRatedProjects(prev => new Set(prev).add(p.id)) }
    })
    // Fetch vendor ratings
    const vendorIds = [...new Set(projects.filter(p => p.vendor).map(p => p.vendor!.id))]
    vendorIds.forEach(async vid => {
      const res = await fetch(`/api/ratings?vendorId=${vid}`)
      if (res.ok) { const d = await res.json(); setVendorRatings(prev => ({ ...prev, [vid]: { avg: d.average, total: d.total } })) }
    })
  }, [projects])

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/') }
  const createProject = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, budget: form.budget ? Number(form.budget) : null }) })
    setSaving(false); setShowNewProject(false); setForm({ service_type: '', description: '', budget: '' }); fetchProjects()
  }

  const openChat = async (projectId: number) => { 
    setChatProject(chatProject === projectId ? null : projectId); 
    if (chatProject !== projectId) {
      const r = await fetch(`/api/projects/${projectId}/messages`); const d = await r.json(); setMessages(d.messages || []);
      const t = await fetch(`/api/admin/projects/tasks?project_id=${projectId}`); const td = await t.json(); setTasks(td.tasks || []);
    }
  }
  const refreshChat = async () => { if (!chatProject) return; const r = await fetch(`/api/projects/${chatProject}/messages`); const d = await r.json(); setMessages(d.messages || []) }
  useEffect(() => { if (!chatProject) return; const i = setInterval(refreshChat, 5000); return () => clearInterval(i) }, [chatProject])

  const sendMessage = async (aUrl?: string, fType?: string) => {
    if (!newMsg.trim() && !aUrl) return; if (!chatProject) return
    await fetch(`/api/projects/${chatProject}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newMsg, attachment_url: aUrl, file_type: fType }) })
    setNewMsg(''); refreshChat()
  }
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !chatProject) return; setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try { const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json(); if (d.url) await sendMessage(d.url, d.file_type) } catch {}
    setUploading(false); if (fileRef.current) fileRef.current.value = ''
  }
  const deleteMessage = async (msgId: number) => { if (!chatProject) return; setDeletingMsg(msgId); await fetch(`/api/projects/${chatProject}/messages`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: msgId }) }); setDeletingMsg(null); refreshChat() }

  const submitRating = async () => {
    if (!ratingProject || !ratingValue) return; setRatingSubmitting(true)
    const res = await fetch('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: ratingProject.id, rating: ratingValue, review: reviewText }) })
    if (res.ok) { setRatedProjects(prev => new Set(prev).add(ratingProject.id)); setRatingProject(null); setRatingValue(0); setReviewText('') }
    setRatingSubmitting(false)
  }

  const markAllRead = async () => { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) }); fetchNotifications() }

  if (loading) return <DashboardLoading />

  const filtered = projects.filter(p => {
    if (filter === 'active') return !['completed', 'cancelled', 'pending'].includes(p.status)
    if (filter === 'completed') return p.status === 'completed'
    if (filter === 'pending') return p.status === 'pending'
    return true
  })
  const completedCount = projects.filter(p => p.status === 'completed').length
  const activeCount = projects.filter(p => !['completed', 'cancelled', 'pending'].includes(p.status)).length
  const currentProject = projects.find(p => !['completed', 'cancelled'].includes(p.status)) || projects[0]
  const currentStepIdx = currentProject ? trackingSteps.findIndex(s => s.key === currentProject.status) : -1

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-20 lg:pt-24">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden lg:flex w-64 min-h-[calc(100vh-6rem)] bg-navy flex-col text-white fixed top-20 left-0">
            <div className="p-6 flex items-center gap-3 border-b border-white/10">
              <Image src="/images/karyasaarthi.png" alt="Logo" width={36} height={36} className="rounded-lg" />
              <span className="font-bold font-heading">Karya<span className="text-accent">Saarthi</span></span>
            </div>
            <nav className="flex-1 py-4">
              {[{ icon: '📊', label: 'Dashboard', href: '/dashboard', active: true },{ icon: '📋', label: 'My Projects', href: '/dashboard' },{ icon: '🧾', label: 'My Invoices', href: '/dashboard/invoices' },{ icon: '👤', label: 'Profile', href: '/dashboard/profile' }].map(item => (
                <Link key={item.label} href={item.href} className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${item.active ? 'bg-white/10 text-white border-r-2 border-accent' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                  <span>{item.icon}</span> {item.label}
                </Link>
              ))}
              <button onClick={() => setShowDMPanel(v => !v)} className="w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors text-white/60 hover:bg-white/5 hover:text-white cursor-pointer">
                <span>💬</span> Chat with Support
              </button>
            </nav>
            <div className="p-4 border-t border-white/10">
              <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors">🌐 View Website</Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer">🚪 Logout</button>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 lg:ml-64 p-6 lg:p-8">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between mb-6">
              <div className="flex items-center gap-3"><Image src="/images/karyasaarthi.png" alt="Logo" width={32} height={32} className="rounded-lg" /><strong className="text-navy font-heading">KaryaSaarthi</strong></div>
              <div className="flex items-center gap-3">
                <button onClick={() => { const opening = !showNotifs; setShowNotifs(opening); if (opening && unreadCount > 0) markAllRead() }} className="relative cursor-pointer">
                  🔔 {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{unreadCount}</span>}
                </button>
                <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-red-50 text-red-500 text-sm font-medium cursor-pointer">Logout</button>
              </div>
            </div>

            {isPending && user?.role === 'pending_admin' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6"><h3 className="font-bold text-amber-800 text-lg">⏳ Admin Access Pending</h3><p className="text-amber-700 text-sm mt-2">Your request is awaiting Super Admin approval.</p></div>
            )}

            {/* Welcome + Notification Bell */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div><h1 className="text-2xl font-bold text-navy font-heading">Welcome, {user?.fullname || 'User'}! 👋</h1><p className="text-slate-500 text-sm mt-1">Here&apos;s your project overview</p></div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button onClick={() => { const opening = !showNotifs; setShowNotifs(opening); if (opening && unreadCount > 0) markAllRead() }} className="hidden lg:flex w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 items-center justify-center hover:bg-slate-100 cursor-pointer relative">
                      🔔 {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{unreadCount}</span>}
                    </button>
                    <AnimatePresence>{showNotifs && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                          <h4 className="font-bold text-navy text-sm">Notifications</h4>
                          {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-accent cursor-pointer">Mark all read</button>}
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.length === 0 ? <p className="p-4 text-sm text-slate-400 text-center">No notifications</p> :
                            notifications.slice(0, 10).map(n => (
                              <div key={n.id} className={`px-4 py-3 border-b border-slate-50 text-sm ${!n.is_read ? 'bg-accent/5' : ''}`}>
                                <p className="font-medium text-navy">{n.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                              </div>
                            ))
                          }
                        </div>
                      </motion.div>
                    )}</AnimatePresence>
                  </div>
                  <button onClick={() => setShowNewProject(!showNewProject)} className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-105 transition-all cursor-pointer">+ New Project</button>
                </div>
              </div>
            </div>

            {/* New Project Form */}
            {showNewProject && (
              <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={createProject} className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-bold text-navy font-heading">📝 New Project Request</h3>
                <select value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy">
                  <option value="">Select Service Type</option>{SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={4} placeholder="Describe your project requirements..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy" />
                <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} min="0" placeholder="Budget (₹) — optional" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy" />
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-accent text-white font-bold text-sm cursor-pointer disabled:opacity-50">{saving ? '⏳ Submitting...' : '🚀 Submit Request'}</button>
                  <button type="button" onClick={() => setShowNewProject(false)} className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium text-sm cursor-pointer">Cancel</button>
                </div>
              </motion.form>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { icon: '📦', label: 'Total', value: projects.length, color: 'from-blue-500 to-blue-600' },
                { icon: '🔄', label: 'Active', value: activeCount, color: 'from-amber-500 to-amber-600' },
                { icon: '✅', label: 'Completed', value: completedCount, color: 'from-green-500 to-green-600' },
                { icon: '🔔', label: 'Unread', value: unreadCount, color: 'from-purple-500 to-purple-600' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-slate-100">
                  <span className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-lg shadow-lg`}>{s.icon}</span>
                  <h3 className="text-2xl font-extrabold text-navy mt-2 font-heading">{s.value}</h3>
                  <p className="text-slate-500 text-xs mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Tracking Timeline */}
            {currentProject && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-navy text-lg font-heading">📍 {currentProject.service_type}</h3>
                  <span className="text-sm text-slate-500">{currentProject.progress}%</span>
                </div>
                {/* Vendor Details */}
                {currentProject.vendor && (
                  <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-slate-50">
                    <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold">{currentProject.vendor.fullname.charAt(0)}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-navy text-sm">{currentProject.vendor.fullname}</p>
                      {vendorRatings[currentProject.vendor.id] && (
                        <p className="text-xs text-slate-500">⭐ {vendorRatings[currentProject.vendor.id].avg.toFixed(1)} ({vendorRatings[currentProject.vendor.id].total} reviews)</p>
                      )}
                    </div>
                    <button onClick={() => openChat(currentProject.id)} className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium cursor-pointer hover:bg-accent/20">💬 Chat</button>
                  </div>
                )}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-0 relative">
                  <div className="hidden md:block absolute top-6 left-[8%] right-[8%] h-0.5 bg-slate-200" />
                  <div className="hidden md:block absolute top-6 left-[8%] h-0.5 bg-accent transition-all" style={{ width: `${Math.max(0, (currentStepIdx / (trackingSteps.length - 1)) * 84)}%` }} />
                  {trackingSteps.map((step, i) => (
                    <div key={step.key} className="flex-1 text-center relative">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                        className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl relative z-10 ${i <= currentStepIdx ? 'bg-accent text-white shadow-lg shadow-accent/25' : 'bg-slate-100 text-slate-400'}`}>{step.icon}</motion.div>
                      <p className={`text-xs font-semibold mt-2 ${i <= currentStepIdx ? 'text-accent' : 'text-slate-400'}`}>{step.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 w-full h-3 bg-slate-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${currentProject.progress}%` }} className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full" /></div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
              {(['all','active','completed','pending'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${filter === f ? 'bg-navy text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-navy/5'}`}>
                  {f === 'all' ? `All (${projects.length})` : f === 'active' ? `Active (${activeCount})` : f === 'completed' ? `Completed (${completedCount})` : `Pending (${projects.filter(p => p.status === 'pending').length})`}
                </button>
              ))}
            </div>

            {/* Projects */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
              <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-navy text-lg font-heading">📋 My Projects</h3></div>
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-slate-400"><span className="text-4xl block mb-3">📭</span><p>No projects found</p></div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filtered.map(p => (
                    <div key={p.id} className="p-5 hover:bg-slate-50/50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-navy">{p.service_type}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{new Date(p.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'cancelled' ? 'bg-red-100 text-red-700' : p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{p.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-slate-500 mb-3">{p.description}</p>

                      {/* Vendor Info Row */}
                      {p.vendor && (
                        <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                          <span className="w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold text-[10px]">{p.vendor.fullname.charAt(0)}</span>
                          <span>{p.vendor.fullname}</span>
                          {vendorRatings[p.vendor.id] && <span className="text-amber-500">⭐ {vendorRatings[p.vendor.id].avg.toFixed(1)}</span>}
                        </div>
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>📊 {p.progress}%</span>
                          <span className="flex items-center gap-1">💰 ₹
                            <input type="number" defaultValue={p.budget ?? ''} min="0" placeholder="Set"
                              onBlur={async e => { const val = e.target.value ? Number(e.target.value) : null; if (val !== p.budget) { await fetch(`/api/projects/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ budget: val }) }); fetchProjects() } }}
                              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                              className="w-20 px-1.5 py-0.5 rounded-md border border-slate-200 text-xs font-semibold text-navy focus:outline-none focus:border-accent" />
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {/* Rate Button */}
                          {p.status === 'completed' && p.vendor && !ratedProjects.has(p.id) && (
                            <button onClick={() => { setRatingProject(p); setRatingValue(0); setReviewText('') }}
                              className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium cursor-pointer hover:bg-amber-100">⭐ Rate Vendor</button>
                          )}
                          {p.status === 'completed' && ratedProjects.has(p.id) && (
                            <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-medium">✓ Rated</span>
                          )}
                          <button onClick={() => openChat(p.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${chatProject === p.id ? 'bg-accent text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>💬 Chat</button>
                        </div>
                      </div>

                      {/* Extra Panel (Tasks & Chat) */}
                      {chatProject === p.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 bg-slate-50 rounded-xl p-4 gap-4 flex flex-col lg:flex-row">
                          {/* Left Column (Tasks & Docs) */}
                          <div className="flex-1 flex flex-col gap-4">
                            {/* Tasks Section */}
                            <div className="flex-1 bg-white p-4 rounded-xl border border-slate-100 min-h-[200px] overflow-y-auto">
                              <h4 className="font-bold text-navy text-sm mb-3">📋 Project Tasks</h4>
                              {tasks.length === 0 && <p className="text-xs text-slate-400">No tasks assigned yet.</p>}
                              <div className="space-y-3">
                                {tasks.map(t => (
                                  <div key={t.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                    <div className="flex items-start justify-between">
                                      <p className="text-sm font-semibold text-navy">{t.title}</p>
                                      <span className="px-2 py-1 text-[10px] uppercase font-bold rounded bg-slate-200 text-slate-600">
                                        {t.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <div className="flex gap-2 mt-2 text-[10px] font-bold">
                                      {t.priority === 'high' && <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded">High Priority</span>}
                                      {t.deadline && <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded">Due: {new Date(t.deadline).toLocaleDateString('en-IN')}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Document Center Section */}
                            <div className="flex-1 bg-white p-4 rounded-xl border border-slate-100 min-h-[170px] overflow-y-auto relative">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-navy text-sm">📁 Document Center</h4>
                                <label className="cursor-pointer text-[10px] bg-accent/10 text-accent font-bold px-2.5 py-1 rounded-lg hover:bg-accent/20 transition-colors">
                                  + Upload Document
                                  <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" />
                                </label>
                              </div>
                              {messages.filter(m => m.attachment_url).length === 0 && <p className="text-xs text-slate-400">No documents uploaded.</p>}
                              <div className="space-y-2">
                                {messages.filter(m => m.attachment_url).map(doc => (
                                  <a key={doc.id} href={doc.attachment_url!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 hover:border-accent hover:shadow-sm rounded-lg transition-all group">
                                    <span className="text-xl">{doc.file_type === 'image' ? '🖼️' : '📎'}</span>
                                    <div className="overflow-hidden">
                                      <p className="text-xs font-semibold text-navy truncate group-hover:text-accent">Document attached by {doc.sender?.fullname}</p>
                                      <p className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString('en-IN')}</p>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                          {/* Chat Section */}
                          <div className="flex-[2] flex flex-col bg-white p-4 rounded-xl border border-slate-100 h-96">
                            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2">
                              {messages.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No messages yet. Start the conversation!</p>}
                            {messages.map(m => (
                              <div key={m.id} className="group relative">
                                <div className={`p-3 rounded-xl text-sm max-w-[80%] ${m.sender?.role === 'customer' ? 'bg-accent/10 text-navy ml-auto' : 'bg-white text-slate-700'}`}>
                                  <p className="text-xs font-bold text-slate-500 mb-1">{m.sender?.fullname} <span className="text-[10px] text-slate-400 ml-2">{new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></p>
                                  <p>{m.content}</p>
                                  {m.attachment_url && <div className="mt-2">{m.file_type === 'image' ? <a href={m.attachment_url} target="_blank" rel="noopener noreferrer"><img src={m.attachment_url} alt="" className="max-w-[180px] rounded-lg border border-slate-200" /></a> : <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-accent">📎 Download</a>}</div>}
                                </div>
                                <button onClick={() => deleteMessage(m.id)} disabled={deletingMsg === m.id} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 cursor-pointer transition-opacity bg-white rounded-full w-5 h-5 flex items-center justify-center shadow">{deletingMsg === m.id ? '·' : '✕'}</button>
                              </div>
                            ))}
                          </div>
                            <div className="flex gap-2 shrink-0">
                              <input type="file" ref={fileRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.zip,.rar" />
                              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer text-lg flex-shrink-0">{uploading ? '⏳' : '📎'}</button>
                              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy" />
                              <button type="button" onClick={() => sendMessage()} disabled={!newMsg.trim()} className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold cursor-pointer disabled:opacity-50">Send</button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices & Payments */}
            {invoicesLoaded && invoices.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-navy text-lg font-heading">🧾 My Invoices</h3>
                  <p className="text-xs text-slate-400">{invoices.length} invoice(s)</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {invoices.map(inv => (
                    <div key={inv.id} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-bold text-navy text-sm font-mono">{inv.invoice_number}</p>
                        <p className="text-xs text-slate-400">{inv.project?.service_type || 'Service'} · {new Date(inv.created_at).toLocaleDateString('en-IN')}</p>
                        {inv.due_date && <p className="text-[10px] text-slate-400">Due: {new Date(inv.due_date).toLocaleDateString('en-IN')}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${inv.status === 'paid' ? 'bg-green-100 text-green-600' : inv.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                          {inv.status === 'paid' ? '✅ Paid' : inv.status === 'overdue' ? '⚠️ Overdue' : '⏳ Pending'}
                        </span>
                        <p className="text-base font-extrabold text-navy">₹{inv.total.toLocaleString('en-IN')}</p>
                        {inv.status !== 'paid' && (
                          <PaymentButton
                            amount={inv.total}
                            invoiceId={inv.id}
                            label={`Pay ₹${inv.total.toLocaleString('en-IN')}`}
                            description={`Invoice ${inv.invoice_number}`}
                            onSuccess={() => fetchInvoices()}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <button onClick={() => setShowNewProject(true)} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center group cursor-pointer"><span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">📝</span><span className="font-semibold text-navy text-sm">New Project</span></button>
              <button onClick={() => setShowDMPanel(v => !v)} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center group cursor-pointer"><span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">🎧</span><span className="font-semibold text-navy text-sm">Chat Support</span></button>
              <a href="https://wa.me/918595025753" target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center group"><span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">💬</span><span className="font-semibold text-navy text-sm">WhatsApp</span></a>
              <Link href="/services" className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center group"><span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">🛍️</span><span className="font-semibold text-navy text-sm">Services</span></Link>
            </div>

            {/* Direct Messages (Support Chat) */}
            <AnimatePresence>
              {showDMPanel && user && (
                <DirectChatPanel
                  currentUserId={user.id}
                  mode="user"
                  onClose={() => setShowDMPanel(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setRatingProject(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold text-navy font-heading mb-1">⭐ Rate Your Vendor</h3>
              <p className="text-sm text-slate-500 mb-4">{ratingProject.service_type} — {ratingProject.vendor?.fullname}</p>
              <div className="flex justify-center mb-4"><StarRating value={ratingValue} onChange={setRatingValue} /></div>
              <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} placeholder="Share your experience (optional)..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy mb-4" />
              <div className="flex gap-3">
                <button onClick={submitRating} disabled={!ratingValue || ratingSubmitting} className="flex-1 px-6 py-2.5 rounded-xl bg-accent text-white font-bold text-sm cursor-pointer disabled:opacity-50 shadow-lg shadow-accent/25">{ratingSubmitting ? '⏳ Submitting...' : '🚀 Submit Rating'}</button>
                <button onClick={() => setRatingProject(null)} className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium text-sm cursor-pointer">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
