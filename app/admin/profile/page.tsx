'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'

interface Doc { id: number; doc_type: string; title: string; doc_url?: string; month?: string; notes?: string; created_at: string; uploader?: { fullname: string } }
interface Appraisal { id: number; period: string; rating: number; performance_score?: number; goals_met?: number; feedback?: string; strengths?: string; areas_to_improve?: string; reviewed_at?: string; reviewer?: { fullname: string } }
interface Leave { id: number; leave_type: string; start_date: string; end_date: string; days: number; reason: string; status: string; created_at: string }

const DOC_TYPE_ICONS: Record<string, string> = { joining_letter:'📜', offer_letter:'📋', payslip:'💰', appraisal:'⭐', id_card:'🪪', nda:'🔒', other:'📄' }
const DOC_TYPE_COLORS: Record<string, string> = { joining_letter:'#8B5CF6', offer_letter:'#3B82F6', payslip:'#10B981', appraisal:'#F59E0B', id_card:'#06B6D4', nda:'#EF4444', other:'#6B7280' }

const LEAVE_TYPES = ['casual','sick','earned','maternity','paternity','unpaid','comp_off']
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg:'#FEF3C7', text:'#92400E' },
  approved: { bg:'#D1FAE5', text:'#065F46' },
  rejected: { bg:'#FEE2E2', text:'#991B1B' },
}

type TabKey = 'docs' | 'appraisals' | 'leaves'
const TABS = [
  { key: 'docs' as TabKey, label: '📁 My Documents' },
  { key: 'appraisals' as TabKey, label: '⭐ Appraisals' },
  { key: 'leaves' as TabKey, label: '🏖️ Leave History' },
]
const VALID_TABS: TabKey[] = ['docs', 'appraisals', 'leaves']

function ProfileContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabKey | null
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'docs'
  )
  const [docs, setDocs] = useState<Doc[]>([])
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(false)
  const [showDocForm, setShowDocForm] = useState(false)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [docForm, setDocForm] = useState({ doc_type: 'joining_letter', title: '', doc_url: '', month: '', notes: '' })
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'casual', start_date: '', end_date: '', days: '', reason: '' })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // Sync URL tab param
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) setActiveTab(tabParam)
  }, [tabParam])

  const loadDocs = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/profile?action=docs')
    const d = await res.json()
    setDocs(d.docs || [])
    setLoading(false)
  }, [])

  const loadAppraisals = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/profile?action=appraisals')
    const d = await res.json()
    setAppraisals(d.appraisals || [])
    setLoading(false)
  }, [])

  const loadLeaves = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/profile?action=leaves')
    const d = await res.json()
    setLeaves(d.leaves || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'docs') loadDocs()
    if (activeTab === 'appraisals') loadAppraisals()
    if (activeTab === 'leaves') loadLeaves()
  }, [activeTab, loadDocs, loadAppraisals, loadLeaves])

  const uploadDoc = async () => {
    if (!docForm.title) return
    const res = await fetch('/api/admin/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'upload_doc', ...docForm }) })
    if (res.ok) {
      const d = await res.json()
      setDocs(p => [d.doc, ...p])
      setDocForm({ doc_type: 'joining_letter', title: '', doc_url: '', month: '', notes: '' })
      setShowDocForm(false)
      showToast('✅ Document uploaded successfully!')
    } else {
      showToast('❌ Failed to upload document')
    }
  }

  const applyLeave = async () => {
    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason) return
    const res = await fetch('/api/admin/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'apply_leave', ...leaveForm, days: Number(leaveForm.days) || 1 }) })
    if (res.ok) {
      loadLeaves()
      setLeaveForm({ leave_type: 'casual', start_date: '', end_date: '', days: '', reason: '' })
      setShowLeaveForm(false)
      showToast('✅ Leave request submitted!')
    } else {
      showToast('❌ Failed to submit leave request')
    }
  }

  const deleteDoc = async (id: number) => {
    if (!confirm('Remove this document?')) return
    const res = await fetch('/api/admin/profile', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_doc', id }) })
    if (res.ok) {
      setDocs(p => p.filter(d => d.id !== id))
      showToast('🗑️ Document removed')
    }
  }

  const payslips = docs.filter(d => d.doc_type === 'payslip')
  const joiningDocs = docs.filter(d => ['joining_letter','offer_letter','nda','id_card'].includes(d.doc_type))
  const otherDocs = docs.filter(d => !['joining_letter','offer_letter','nda','id_card','payslip','appraisal'].includes(d.doc_type))

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-bold"
            style={{ background: toast.startsWith('✅') ? '#10B981' : '#EF4444' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">👤 My Profile &amp; Documents</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your joining documents, payslips, appraisals and leave history</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2.5 text-sm font-bold cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${activeTab === t.key ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-navy rounded-full animate-spin" />
        </div>
      )}

      {/* MY DOCUMENTS */}
      {activeTab === 'docs' && !loading && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button onClick={() => setShowDocForm(v => !v)}
              className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)' }}>
              + Upload Document
            </button>
          </div>

          <AnimatePresence>
            {showDocForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy font-heading mb-4">📎 Upload Your Document</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <select value={docForm.doc_type} onChange={e => setDocForm(p => ({ ...p, doc_type: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {Object.keys(DOC_TYPE_ICONS).map(t => <option key={t} value={t}>{DOC_TYPE_ICONS[t]} {t.replace(/_/g,' ')}</option>)}
                  </select>
                  <input value={docForm.title} onChange={e => setDocForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Document title *"
                    className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input value={docForm.doc_url} onChange={e => setDocForm(p => ({ ...p, doc_url: e.target.value }))}
                    placeholder="Document URL or Google Drive link"
                    className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  {docForm.doc_type === 'payslip' && (
                    <input type="month" value={docForm.month} onChange={e => setDocForm(p => ({ ...p, month: e.target.value }))}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  )}
                  <textarea value={docForm.notes} onChange={e => setDocForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Notes (optional)" rows={1}
                    className="col-span-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={uploadDoc}
                    className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
                    style={{ background: '#1B3A6B' }}>Upload</button>
                  <button onClick={() => setShowDocForm(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payslips */}
          {payslips.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-600 text-sm mb-3">💰 Payslips</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {payslips.map(d => <DocCard key={d.id} doc={d} onDelete={deleteDoc} />)}
              </div>
            </div>
          )}

          {/* Joining Docs */}
          {joiningDocs.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-600 text-sm mb-3">📋 Joining &amp; HR Documents</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {joiningDocs.map(d => <DocCard key={d.id} doc={d} onDelete={deleteDoc} />)}
              </div>
            </div>
          )}

          {/* Other docs */}
          {otherDocs.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-600 text-sm mb-3">📁 Other Documents</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {otherDocs.map(d => <DocCard key={d.id} doc={d} onDelete={deleteDoc} />)}
              </div>
            </div>
          )}

          {docs.length === 0 && !showDocForm && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <span className="text-5xl block mb-3">📁</span>
              <p className="text-slate-400 text-sm mb-4">No documents yet. Upload your joining letter, payslips, or other documents.</p>
              <button onClick={() => setShowDocForm(true)}
                className="px-4 py-2 rounded-xl font-bold text-white text-xs cursor-pointer hover:opacity-90"
                style={{ background: '#1B3A6B' }}>+ Upload Document</button>
            </div>
          )}
        </div>
      )}

      {/* APPRAISALS */}
      {activeTab === 'appraisals' && !loading && (
        <div className="space-y-4">
          {appraisals.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <span className="text-5xl block mb-3">⭐</span>
              <p className="text-slate-400 text-sm">No appraisals yet. Your manager or HR will add appraisal records here.</p>
            </div>
          ) : (
            appraisals.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-navy text-lg font-heading">{a.period}</p>
                    {a.reviewer && <p className="text-xs text-slate-400 mt-0.5">Reviewed by {a.reviewer.fullname}{a.reviewed_at ? ` · ${new Date(a.reviewed_at).toLocaleDateString('en-IN')}` : ''}</p>}
                  </div>
                  {a.rating && (
                    <div className="text-right">
                      <p className="text-amber-400 text-lg font-bold">{'★'.repeat(Math.floor(a.rating))}{'☆'.repeat(5 - Math.floor(a.rating))}</p>
                      <p className="text-xs text-slate-400">{a.rating}/5 Rating</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {a.performance_score !== undefined && a.performance_score !== null && (
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-extrabold text-navy">{a.performance_score}</p>
                      <p className="text-[10px] text-slate-400">Performance Score</p>
                      <div className="h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${a.performance_score}%` }} />
                      </div>
                    </div>
                  )}
                  {a.goals_met !== undefined && a.goals_met !== null && (
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-extrabold text-green-600">{a.goals_met}/10</p>
                      <p className="text-[10px] text-slate-400">Goals Met</p>
                    </div>
                  )}
                  {a.rating && (
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-extrabold text-amber-600">{a.rating}</p>
                      <p className="text-[10px] text-slate-400">Overall Rating</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {a.feedback && <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs font-bold text-blue-600 mb-1">💬 Manager Feedback</p><p className="text-sm text-slate-700">{a.feedback}</p></div>}
                  {a.strengths && <div className="bg-green-50 rounded-xl p-4"><p className="text-xs font-bold text-green-600 mb-1">✅ Strengths</p><p className="text-sm text-slate-700">{a.strengths}</p></div>}
                  {a.areas_to_improve && <div className="bg-amber-50 rounded-xl p-4"><p className="text-xs font-bold text-amber-600 mb-1">📈 Areas to Improve</p><p className="text-sm text-slate-700">{a.areas_to_improve}</p></div>}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* LEAVES */}
      {activeTab === 'leaves' && !loading && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowLeaveForm(v => !v)}
              className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              + Apply for Leave
            </button>
          </div>

          <AnimatePresence>
            {showLeaveForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-navy font-heading mb-4">🏖️ Apply for Leave</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <select value={leaveForm.leave_type} onChange={e => setLeaveForm(p => ({ ...p, leave_type: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                  <input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm(p => ({ ...p, start_date: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm(p => ({ ...p, end_date: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <input type="number" min={1} value={leaveForm.days} onChange={e => setLeaveForm(p => ({ ...p, days: e.target.value }))}
                    placeholder="No. of days"
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                  <textarea value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                    placeholder="Reason for leave *" rows={1}
                    className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={applyLeave}
                    className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90"
                    style={{ background: '#10B981' }}>Submit Request</button>
                  <button onClick={() => setShowLeaveForm(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Requests', count: leaves.length, color: '#3B82F6', bg: '#EFF6FF' },
              { label: 'Pending', count: leaves.filter(l => l.status === 'pending').length, color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'Approved', count: leaves.filter(l => l.status === 'approved').length, color: '#10B981', bg: '#ECFDF5' },
              { label: 'Total Days (Approved)', count: leaves.filter(l => l.status === 'approved').reduce((a, b) => a + b.days, 0), color: '#8B5CF6', bg: '#F5F3FF' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center border" style={{ background: s.bg, borderColor: `${s.color}20` }}>
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.count}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {leaves.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <span className="text-5xl block mb-3">🏖️</span>
              <p className="text-slate-400 text-sm">No leave requests yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Type','From','To','Days','Reason','Status','Applied On'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map(l => {
                      const s = STATUS_STYLES[l.status] || { bg: '#F3F4F6', text: '#6B7280' }
                      return (
                        <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-semibold text-navy capitalize">{l.leave_type.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(l.start_date).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(l.end_date).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3 font-bold text-navy">{l.days}</td>
                          <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{l.reason}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ background: s.bg, color: s.text }}>{l.status}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DocCard({ doc, onDelete }: { doc: Doc; onDelete: (id: number) => void }) {
  const color = DOC_TYPE_COLORS[doc.doc_type] || '#6B7280'
  const icon = DOC_TYPE_ICONS[doc.doc_type] || '📄'

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${color}15` }}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-navy text-xs truncate">{doc.title}</p>
          <p className="text-[10px] text-slate-400 capitalize">{doc.doc_type.replace(/_/g,' ')}{doc.month ? ` · ${doc.month}` : ''}</p>
        </div>
      </div>
      {doc.notes && <p className="text-[10px] text-slate-400 mb-2 truncate">{doc.notes}</p>}
      <div className="flex gap-2">
        {doc.doc_url && (
          <a href={doc.doc_url} target="_blank" rel="noreferrer"
            className="flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors">
            🔗 Open
          </a>
        )}
        <button onClick={() => onDelete(doc.id)}
          className="px-2 py-1.5 rounded-lg text-[10px] bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 cursor-pointer transition-colors">
          🗑
        </button>
      </div>
    </div>
  )
}

export default function MyProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-navy rounded-full animate-spin" style={{ borderWidth: 3 }} />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}
