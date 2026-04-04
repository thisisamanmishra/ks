'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import DirectChatPanel from '@/components/admin/DirectChatPanel'

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

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: '#F1F5F9' },
  submitted: { label: 'Submitted', color: '#3B82F6', bg: '#EFF6FF' },
  under_review: { label: 'In Review', color: '#F59E0B', bg: '#FFFBEB' },
  approved: { label: 'Approved', color: '#10B981', bg: '#ECFDF5' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEF2F2' },
  published: { label: 'Published', color: '#8B5CF6', bg: '#F5F3FF' },
}
const PLATFORM_ICON: Record<string, string> = { instagram: '📸', facebook: '👥', linkedin: '💼', youtube: '▶️', twitter: '🐦', blog: '📝', other: '🌐' }

export default function DigitalSaarthiPage() {
  const [activeTab, setActiveTab] = useState<'creators' | 'submissions' | 'library'>('creators')
  const [members, setMembers] = useState<PillarMember[]>([])
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [chatUserId, setChatUserId] = useState<number | null>(null)
  const [meId, setMeId] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')

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

  useEffect(() => { load(); fetch('/api/auth/me').then(r => r.json()).then(d => setMeId(d.id || 0)) }, [load])

  const updateStatus = async (id: number, status: string) => {
    await fetch('/api/admin/content-submissions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    load()
  }

  const filteredSubs = statusFilter === 'all' ? submissions : submissions.filter(s => s.status === statusFilter)
  const totalViews = submissions.reduce((a, s) => a + s.views, 0)
  const totalLikes = submissions.reduce((a, s) => a + s.likes, 0)

  const TABS = [{ key: 'creators', label: '👤 Creators' }, { key: 'submissions', label: '📤 Submissions' }, { key: 'library', label: '🖼️ Ad Library' }] as const

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl">💻</div>
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">Digital Saarthi</h1>
          <p className="text-slate-500 text-sm">Content creators · Approval workflow · Ad library</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Creators', value: members.length, icon: '👤', color: '#8B5CF6' },
          { label: 'Total Submissions', value: submissions.length, icon: '📤', color: '#3B82F6' },
          { label: 'Total Views', value: totalViews.toLocaleString('en-IN'), icon: '👁️', color: '#F59E0B' },
          { label: 'Total Likes', value: totalLikes.toLocaleString('en-IN'), icon: '❤️', color: '#EF4444' },
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
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-bold cursor-pointer transition-all border-b-2 -mb-px ${activeTab === t.key ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Creators Tab */}
      {activeTab === 'creators' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}</div>
            : members.length === 0 ? <div className="p-12 text-center text-slate-400"><span className="text-4xl block mb-3">💻</span><p>No digital team members yet</p></div> : (
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">{['Creator', 'Platform', 'Posts', 'Status', 'Joined', 'Chat'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">{h}</th>)}</tr></thead>
                <tbody>
                  {members.map(m => {
                    const mySubs = submissions.filter(s => s.creator?.user_id === m.user_id)
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
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${m.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{m.status}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-400">{new Date(m.joined_at).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3"><button onClick={() => setChatUserId(m.user_id === chatUserId ? null : m.user_id)} className="px-2.5 py-1.5 rounded-lg bg-navy/5 text-navy text-xs font-bold hover:bg-navy/10 cursor-pointer">💬</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
        </div>
      )}

      {/* Submissions Tab */}
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

      {/* Ad Library Tab */}
      {activeTab === 'library' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center py-10">
          <span className="text-4xl block mb-3">🖼️</span>
          <p className="text-slate-500 text-sm">Ad creative library coming soon.</p>
          <p className="text-slate-400 text-xs mt-1">Upload and manage ad creatives for Google, Meta, and LinkedIn campaigns.</p>
        </div>
      )}

      {chatUserId && meId > 0 && <DirectChatPanel currentUserId={meId} mode="ops" onClose={() => setChatUserId(null)} />}
    </div>
  )
}
