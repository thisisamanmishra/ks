'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DirectChatPanel from '@/components/admin/DirectChatPanel'
import { fetchWithAuth } from '@/lib/auth/fetchWithAuth'

interface Project { id: number; service_type: string; description: string; status: string; progress: number; budget: number | null; created_at: string; client: { id: number; fullname: string; email: string } | null }
interface Message { id: number; content: string; attachment_url: string | null; file_type: string | null; created_at: string; sender: { id: number; fullname: string; role: string } | null }
interface Rating { id: number; rating: number; review: string | null; created_at: string; customer: { id: number; fullname: string } | null; project: { id: number; service_type: string } | null }
interface Notification { id: number; type: string; title: string; message: string; is_read: boolean; created_at: string }
interface Task { id: number; title: string; assignee: string | null; deadline: string | null; priority: 'low' | 'medium' | 'high'; status: 'todo' | 'in_progress' | 'review' | 'done'; created_at: string }
interface EarningsData {
  totalEarned: number
  totalPayments: number
  pendingAmount: number
  completedProjects: number
}
interface EarningsMonth { month: string; amount: number; count: number }
interface Payment { id: number; amount: number; status: string; created_at: string; razorpay_payment_id: string; description: string }

const statusColors: Record<string, string> = {
  assigned: 'bg-blue-100 text-blue-700', in_progress: 'bg-cyan-100 text-cyan-700',
  review: 'bg-purple-100 text-purple-700', delivered: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700',
}

function StarDisplay({ value }: { value: number }) {
  return <span className="text-sm">{Array.from({ length: 5 }, (_, i) => <span key={i} className={i < value ? 'opacity-100' : 'opacity-25'}>⭐</span>)}</span>
}

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<'projects' | 'earnings' | 'reviews'>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [chatProject, setChatProject] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingMsg, setDeletingMsg] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingProject, setUploadingProject] = useState<number | null>(null)
  const projectFileRef = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState<'all'|'active'|'completed'>('all')
  const [ratings, setRatings] = useState<Rating[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showDMPanel, setShowDMPanel] = useState(false)
  const [currentVendorUserId, setCurrentVendorUserId] = useState<number>(0)
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [earningsMonthly, setEarningsMonthly] = useState<EarningsMonth[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const fetchProjects = async () => { const r = await fetch('/api/projects'); const d = await r.json(); setProjects(d.projects || []); setLoading(false) }
  const fetchNotifications = useCallback(async () => { const r = await fetchWithAuth('/api/notifications'); if (r.ok) { const d = await r.json(); setNotifications(d.notifications || []); setUnreadCount(d.unread || 0) } }, [])

  const fetchRatings = async () => {
    // Get current user ID first
    const meRes = await fetch('/api/auth/me')
    if (!meRes.ok) return
    const me = await meRes.json()
    const r = await fetch(`/api/ratings?vendorId=${me.id}`)
    if (r.ok) { const d = await r.json(); setRatings(d.ratings || []); setAvgRating(d.average || 0); setTotalReviews(d.total || 0) }
  }

  const fetchEarnings = useCallback(async () => {
    try {
      const r = await fetch('/api/vendor/earnings')
      if (r.ok) { const d = await r.json(); setEarnings(d.earnings); setEarningsMonthly(d.monthly || []); setPayments(d.payments || []) }
    } catch {}
  }, [])

  useEffect(() => { fetchProjects(); fetchRatings(); fetchNotifications(); fetchEarnings() }, [fetchEarnings])
  useEffect(() => { const i = setInterval(fetchNotifications, 15000); return () => clearInterval(i) }, [fetchNotifications])

  // Get current user id
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setCurrentVendorUserId(d.id || 0))
  }, [])

  const updateProject = async (id: number, updates: Record<string, unknown>) => {
    setActionId(id); await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    setActionId(null); fetchProjects()
  }

  // Chat
  const openChat = async (pid: number) => { 
    setChatProject(chatProject === pid ? null : pid); 
    if (chatProject !== pid) {
      const r = await fetch(`/api/projects/${pid}/messages`); const d = await r.json(); setMessages(d.messages || []);
      const t = await fetch(`/api/admin/projects/tasks?project_id=${pid}`); const td = await t.json(); setTasks(td.tasks || []);
    }
  }
  const updateTaskStatus = async (id: number, status: Task['status']) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, status } : t))
    await fetch('/api/admin/projects/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
  }
  const refreshChat = async () => { if (!chatProject) return; const r = await fetch(`/api/projects/${chatProject}/messages`); const d = await r.json(); setMessages(d.messages || []) }
  useEffect(() => { if (!chatProject) return; const i = setInterval(refreshChat, 5000); return () => clearInterval(i) }, [chatProject])
  const sendMessage = async (aUrl?: string, fType?: string) => { if (!newMsg.trim() && !aUrl) return; if (!chatProject) return; await fetch(`/api/projects/${chatProject}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newMsg, attachment_url: aUrl, file_type: fType }) }); setNewMsg(''); refreshChat() }
  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !chatProject) return; setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try { const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json(); if (d.url) await sendMessage(d.url, d.file_type) } catch {}
    setUploading(false); if (fileRef.current) fileRef.current.value = ''
  }
  const deleteMessage = async (msgId: number) => { if (!chatProject) return; setDeletingMsg(msgId); await fetch(`/api/projects/${chatProject}/messages`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: msgId }) }); setDeletingMsg(null); refreshChat() }

  // File upload for project delivery
  const handleProjectFile = async (e: React.ChangeEvent<HTMLInputElement>, projectId: number) => {
    const file = e.target.files?.[0]; if (!file) return; setUploadingProject(projectId)
    const fd = new FormData(); fd.append('file', file)
    try {
      const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json()
      if (d.url) { await fetch(`/api/projects/${projectId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `📁 File uploaded: ${file.name}`, attachment_url: d.url, file_type: d.file_type }) }) }
    } catch {}
    setUploadingProject(null); if (projectFileRef.current) projectFileRef.current.value = ''
  }

  const markAllRead = async () => { await fetchWithAuth('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) }); fetchNotifications() }

  const filtered = projects.filter(p => {
    if (filter === 'active') return !['completed', 'cancelled'].includes(p.status)
    if (filter === 'completed') return p.status === 'completed'
    return true
  })
  const active = projects.filter(p => !['completed', 'cancelled'].includes(p.status))
  const completed = projects.filter(p => p.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">🏪 Vendor Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Your assigned projects & ratings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => { const opening = !showNotifs; setShowNotifs(opening); if (opening && unreadCount > 0) markAllRead() }} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer relative">
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
          <button
            onClick={() => setShowDMPanel(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all shadow-sm ${
              showDMPanel ? 'bg-navy text-white' : 'bg-white border border-slate-200 text-navy hover:bg-navy/5'
            }`}
          >
            💬 Chat Support
          </button>
        </div>
      </div>

      {/* Stats + Rating Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '📋', label: 'Total', value: projects.length, color: 'from-blue-500 to-blue-600' },
          { icon: '🔄', label: 'Active', value: active.length, color: 'from-cyan-500 to-cyan-600' },
          { icon: '✅', label: 'Completed', value: completed.length, color: 'from-green-500 to-green-600' },
          { icon: '⭐', label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '—', color: 'from-amber-500 to-amber-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-lg shadow-lg`}>{s.icon}</span>
            <h3 className="text-2xl font-extrabold text-navy mt-2 font-heading">{s.value}</h3>
            <p className="text-slate-500 text-xs mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {(['projects', 'earnings', 'reviews'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-bold capitalize cursor-pointer transition-all border-b-2 -mb-px ${
              activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'
            }`}>
            {tab === 'projects' ? '📋' : tab === 'earnings' ? '💰' : '⭐'} {tab}
          </button>
        ))}
      </div>

      {/* Projects Tab Filter */}
      {activeTab === 'projects' && (
        <div className="flex gap-2">
          {(['all','active','completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${filter === f ? 'bg-navy text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-navy/5'}`}>
              {f === 'all' ? `All (${projects.length})` : f === 'active' ? `Active (${active.length})` : `Completed (${completed.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Projects */}
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100"><span className="text-4xl block mb-3">📋</span><p className="text-slate-500">No projects found</p></div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-navy text-lg">{p.service_type}</h3>
                  <p className="text-sm text-slate-500 mt-1">{p.description}</p>
                  <p className="text-xs text-slate-400 mt-1">Client: {p.client?.fullname || 'N/A'} · {new Date(p.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[p.status] || 'bg-slate-100 text-slate-600'}`}>{p.status.replace('_', ' ')}</span>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-500">Progress</span><span className="font-bold text-navy">{p.progress}%</span></div>
                <input type="range" min="0" max="100" value={p.progress} onChange={e => updateProject(p.id, { progress: Number(e.target.value) })} className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-accent" />
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {p.status === 'assigned' && <button onClick={() => updateProject(p.id, { status: 'in_progress', progress: 10 })} disabled={actionId === p.id} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 cursor-pointer">🚀 Start</button>}
                {p.status === 'in_progress' && <button onClick={() => updateProject(p.id, { status: 'review' })} disabled={actionId === p.id} className="px-4 py-2 rounded-xl bg-purple-50 text-purple-600 text-sm font-medium hover:bg-purple-100 cursor-pointer">🔍 Review</button>}
                {p.status === 'review' && <button onClick={() => updateProject(p.id, { status: 'delivered', progress: 100 })} disabled={actionId === p.id} className="px-4 py-2 rounded-xl bg-teal-50 text-teal-600 text-sm font-medium hover:bg-teal-100 cursor-pointer">📦 Deliver</button>}

                {/* Project File Upload */}
                <input type="file" ref={projectFileRef} onChange={e => handleProjectFile(e, p.id)} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.zip,.rar" />
                <button onClick={() => projectFileRef.current?.click()} disabled={uploadingProject === p.id}
                  className="px-4 py-2 rounded-xl bg-amber-50 text-amber-600 text-sm font-medium hover:bg-amber-100 cursor-pointer">
                  {uploadingProject === p.id ? '⏳ Uploading...' : '📁 Upload File'}
                </button>

                <button onClick={() => openChat(p.id)} className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer ${chatProject === p.id ? 'bg-accent text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>💬 Chat</button>
              </div>

              {/* Extra Panel (Tasks & Chat) */}
              {chatProject === p.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 bg-slate-50 rounded-xl p-4 gap-4 flex flex-col lg:flex-row">
                  {/* Tasks Section */}
                  <div className="flex-1 bg-white p-4 rounded-xl border border-slate-100 h-96 overflow-y-auto">
                    <h4 className="font-bold text-navy text-sm mb-3">📋 Project Tasks</h4>
                    {tasks.length === 0 && <p className="text-xs text-slate-400">No tasks assigned yet.</p>}
                    <div className="space-y-3">
                      {tasks.map(t => (
                        <div key={t.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-semibold text-navy">{t.title}</p>
                            <select value={t.status} onChange={e => updateTaskStatus(t.id, e.target.value as Task['status'])} className="px-2 py-1 text-[10px] uppercase font-bold rounded bg-white border border-slate-200 outline-none cursor-pointer">
                              <option value="todo">To-Do</option><option value="in_progress">In Progress</option><option value="review">Review</option><option value="done">Done</option>
                            </select>
                          </div>
                          <div className="flex gap-2 mt-2 text-[10px] font-bold">
                            {t.priority === 'high' && <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded">High Priority</span>}
                            {t.deadline && <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded">Due: {new Date(t.deadline).toLocaleDateString('en-IN')}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Chat Section */}
                  <div className="flex-[2] flex flex-col bg-white p-4 rounded-xl border border-slate-100 h-96">
                    <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2">
                      {messages.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No messages yet</p>}
                    {messages.map(m => (
                      <div key={m.id} className="group relative">
                        <div className={`p-3 rounded-xl text-sm max-w-[80%] ${m.sender?.role === 'vendor' ? 'bg-accent/10 text-navy ml-auto' : 'bg-white text-slate-700'}`}>
                          <p className="text-xs font-bold text-slate-500 mb-1">{m.sender?.fullname} <span className="text-[10px] text-slate-400 ml-2">{new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></p>
                          <p>{m.content}</p>
                          {m.attachment_url && <div className="mt-2">{m.file_type === 'image' ? <a href={m.attachment_url} target="_blank" rel="noopener noreferrer"><img src={m.attachment_url} alt="" className="max-w-[180px] rounded-lg border border-slate-200" /></a> : <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-accent hover:bg-slate-50">📎 Download</a>}</div>}
                        </div>
                        <button onClick={() => deleteMessage(m.id)} disabled={deletingMsg === m.id} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 cursor-pointer transition-opacity bg-white rounded-full w-5 h-5 flex items-center justify-center shadow">{deletingMsg === m.id ? '·' : '✕'}</button>
                      </div>
                    ))}
                  </div>
                    <div className="flex gap-2 shrink-0">
                      <input type="file" ref={fileRef} onChange={handleChatFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.zip,.rar" />
                      <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer text-lg flex-shrink-0">{uploading ? '⏳' : '📎'}</button>
                      <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy" />
                      <button onClick={() => sendMessage()} disabled={!newMsg.trim() && !uploading} className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold cursor-pointer hover:bg-accent-dark disabled:opacity-50">Send</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Earned', value: `₹${(earnings?.totalEarned || 0).toLocaleString('en-IN')}`, icon: '💰', color: '#10B981' },
              { label: 'Released', value: `₹${(earnings?.totalPayments || 0).toLocaleString('en-IN')}`, icon: '✅', color: '#3B82F6' },
              { label: 'Pending', value: `₹${(earnings?.pendingAmount || 0).toLocaleString('en-IN')}`, icon: '⏳', color: '#F59E0B' },
              { label: 'Completed', value: earnings?.completedProjects || 0, icon: '📋', color: '#8B5CF6' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <span className="text-xl">{k.icon}</span>
                <p className="text-2xl font-extrabold font-heading mt-2" style={{ color: k.color }}>{k.value}</p>
                <p className="text-xs text-slate-400">{k.label}</p>
              </div>
            ))}
          </div>
          {/* Monthly */}
          {earningsMonthly.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-navy font-heading mb-5">📊 Monthly Earnings</h3>
              <div className="flex items-end gap-3 h-28">
                {earningsMonthly.map((m, i) => {
                  const maxAmt = Math.max(...earningsMonthly.map(x => x.amount), 1)
                  const pct = (m.amount / maxAmt) * 100
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-[9px] text-slate-400 font-bold">₹{m.amount > 0 ? m.amount.toLocaleString('en-IN') : 0}</p>
                      <div className="w-full rounded-t-lg" style={{ height: `${Math.max(pct, 4)}%`, background: i % 2 === 0 ? '#1B3A6B' : '#FF6B35', minHeight: '4px' }} />
                      <span className="text-[9px] text-slate-400">{m.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {/* Payment History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-navy font-heading">💳 Payment History</h3></div>
            {payments.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">No payments received yet</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {payments.map(p => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-navy">{p.description || 'Project Payment'}</p>
                      <p className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleDateString('en-IN')} · {p.razorpay_payment_id || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{(p.amount || 0).toLocaleString('en-IN')}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600">captured</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {ratings.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
              <span className="text-4xl block mb-3">⭐</span>
              <p className="text-slate-400">No reviews yet. Complete projects to receive feedback!</p>
            </div>
          ) : (
            ratings.map(r => (
              <div key={r.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StarDisplay value={r.rating} />
                    <span className="text-xs text-slate-500">by {r.customer?.fullname || 'Customer'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                {r.review && <p className="text-sm text-slate-600">{r.review}</p>}
                <p className="text-xs text-slate-400 mt-2">📋 {r.project?.service_type || 'Project'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Direct Messages (Support Chat) */}
      <AnimatePresence>
        {showDMPanel && currentVendorUserId > 0 && (
          <DirectChatPanel
            currentUserId={currentVendorUserId}
            mode="user"
            onClose={() => setShowDMPanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
