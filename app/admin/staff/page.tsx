'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'

interface StaffMember {
  id: number
  fullname: string
  email: string
  role: string
  department: string | null
  pillar_role: string | null
  designation: string | null
  is_approved: boolean
  created_at: string
  phone?: string | null
}

interface PayrollRecord {
  id: number
  user_id: number
  fullname?: string
  month: string
  year: number
  base_salary: number
  bonuses: number
  deductions: number
  net_salary: number
  status: string
  payment_date: string | null
}

interface AppraisalRecord {
  id: number
  user_id: number
  fullname?: string
  reviewer_id: number | null
  review_period: string
  performance_score: number
  feedback: string
  goals_achieved: string
  areas_of_improvement: string
  salary_increment: number | null
  new_salary: number | null
  status: string
  created_at?: string
}

const TABS = [
  { key: 'directory', label: '👥 Team Directory' },
  { key: 'payroll', label: '💰 Payroll' },
  { key: 'appraisals', label: '⭐ Appraisals' },
  { key: 'leaves', label: '🏖️ Leaves' }
] as const

type TabKey = typeof TABS[number]['key']
const VALID_TABS: TabKey[] = ['directory', 'payroll', 'appraisals', 'leaves']

const ROLE_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  super_admin: { label: 'Super Admin', color: '#FF6B35', bg: '#FFF0EB' },
  board_member: { label: 'Board Member', color: '#8B5CF6', bg: '#EDE9FE' },
  admin: { label: 'Admin', color: '#3B82F6', bg: '#DBEAFE' },
  pillar_member: { label: 'Pillar Member', color: '#10B981', bg: '#D1FAE5' },
}

// ── Inner component that uses useSearchParams ──
function StaffContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabKey | null
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'directory'
  )

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [appraisals, setAppraisals] = useState<AppraisalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Forms
  const [showPayrollForm, setShowPayrollForm] = useState(false)
  const [payForm, setPayForm] = useState({ user_id: '', month: 'January', year: new Date().getFullYear(), base: '0', bonus: '0', ded: '0' })
  const [savingPay, setSavingPay] = useState(false)

  const [showApprForm, setShowApprForm] = useState(false)
  const [apprForm, setApprForm] = useState({ user_id: '', period: 'Q1 ' + new Date().getFullYear(), score: '8', feedback: '', goals: '', areas: '', salary_increment: '0', new_salary: '0' })
  const [savingAppr, setSavingAppr] = useState(false)

  // Upraisal modal
  const [upraisalTarget, setUpraisalTarget] = useState<StaffMember | null>(null)
  const [upraisalForm, setUpraisalForm] = useState({ current_salary: '0', increment_pct: '10', new_salary: '0', reason: '', effective_from: '' })
  const [savingUpraisal, setSavingUpraisal] = useState(false)

  // Sync tab from URL on initial load and direct URL entry
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    } else if (!tabParam) {
      setActiveTab('directory')
    }
  }, [tabParam])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [stRes, payRes, appRes] = await Promise.all([
        fetch('/api/admin/staff?type=directory'),
        fetch('/api/admin/staff?type=payroll'),
        fetch('/api/admin/staff?type=appraisals')
      ])
      if (stRes.ok) { const d = await stRes.json(); setStaff(d.staff || []) }
      if (payRes.ok) { const d = await payRes.json(); setPayrolls(d.payrolls || []) }
      if (appRes.ok) { const d = await appRes.json(); setAppraisals(d.appraisals || []) }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const setTab = (t: TabKey) => {
    setActiveTab(t)
    window.history.pushState({}, '', `/admin/staff?tab=${t}`)
  }

  const savePayroll = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPay(true)
    const base = Number(payForm.base)
    const bonus = Number(payForm.bonus)
    const ded = Number(payForm.ded)
    const net = base + bonus - ded
    const payload = {
      user_id: Number(payForm.user_id),
      month: payForm.month,
      year: payForm.year,
      base_salary: base, bonuses: bonus, deductions: ded, net_salary: net,
      status: 'unpaid'
    }
    try {
      const res = await fetch('/api/admin/staff?type=payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        const { record } = await res.json()
        setPayrolls(p => [record, ...p])
        setShowPayrollForm(false)
        setPayForm({ user_id: '', month: 'January', year: new Date().getFullYear(), base: '0', bonus: '0', ded: '0' })
        showToast('✅ Salary slip generated successfully!')
      } else {
        const { error } = await res.json()
        showToast(`❌ Error: ${error}`)
      }
    } catch { showToast('❌ Failed to save payroll') } finally { setSavingPay(false) }
  }

  const saveAppraisal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAppr(true)
    const payload = {
      user_id: Number(apprForm.user_id),
      review_period: apprForm.period,
      performance_score: Number(apprForm.score),
      feedback: apprForm.feedback,
      goals_achieved: apprForm.goals,
      areas_of_improvement: apprForm.areas,
      salary_increment: Number(apprForm.salary_increment) || 0,
      new_salary: Number(apprForm.new_salary) || 0,
      status: 'finalized'
    }
    try {
      const res = await fetch('/api/admin/staff?type=appraisals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        const { record } = await res.json()
        setAppraisals(p => [record, ...p])
        setShowApprForm(false)
        setApprForm({ user_id: '', period: 'Q1 ' + new Date().getFullYear(), score: '8', feedback: '', goals: '', areas: '', salary_increment: '0', new_salary: '0' })
        showToast('✅ Appraisal submitted!')
      } else {
        showToast('❌ Failed to submit appraisal')
      }
    } catch { showToast('❌ Error occurred') } finally { setSavingAppr(false) }
  }

  const markPaid = async (id: number) => {
    const res = await fetch('/api/admin/staff?type=payroll', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'paid' }) })
    if (res.ok) {
      setPayrolls(p => p.map(r => r.id === id ? { ...r, status: 'paid', payment_date: new Date().toISOString() } : r))
      showToast('✅ Marked as paid')
    }
  }

  // Upraisal
  const openUpraisal = (member: StaffMember) => {
    // Find latest payroll for this member to get current salary
    const latestPayroll = payrolls.find(p => p.user_id === member.id)
    const currentSalary = latestPayroll ? latestPayroll.base_salary : 0
    setUpraisalTarget(member)
    setUpraisalForm({
      current_salary: String(currentSalary),
      increment_pct: '10',
      new_salary: String(Math.round(currentSalary * 1.1)),
      reason: '',
      effective_from: new Date().toISOString().split('T')[0]
    })
  }

  const handleIncrementChange = (pct: string) => {
    const p = Number(pct) || 0
    const current = Number(upraisalForm.current_salary) || 0
    setUpraisalForm(f => ({
      ...f,
      increment_pct: pct,
      new_salary: String(Math.round(current * (1 + p / 100)))
    }))
  }

  const saveUpraisal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!upraisalTarget) return
    setSavingUpraisal(true)
    const incrementAmt = Number(upraisalForm.new_salary) - Number(upraisalForm.current_salary)
    const payload = {
      user_id: upraisalTarget.id,
      review_period: `Upraisal - ${upraisalForm.effective_from}`,
      performance_score: 10,
      feedback: `Salary upraisal: ₹${Number(upraisalForm.current_salary).toLocaleString('en-IN')} → ₹${Number(upraisalForm.new_salary).toLocaleString('en-IN')} (${upraisalForm.increment_pct}% increment)`,
      goals_achieved: upraisalForm.reason || 'Salary revision based on performance',
      areas_of_improvement: '',
      salary_increment: incrementAmt,
      new_salary: Number(upraisalForm.new_salary),
      status: 'finalized'
    }
    try {
      const res = await fetch('/api/admin/staff?type=appraisals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        const { record } = await res.json()
        setAppraisals(p => [record, ...p])
        setUpraisalTarget(null)
        showToast('✅ Upraisal submitted successfully!')
      } else {
        showToast('❌ Failed to submit upraisal')
      }
    } catch { showToast('❌ Error submitting upraisal') } finally { setSavingUpraisal(false) }
  }

  const filteredStaff = staff.filter(s =>
    s.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group payrolls by staff member for salary overview
  const latestPayrollByUser = staff.map(s => {
    const userPayrolls = payrolls.filter(p => p.user_id === s.id)
    const latest = userPayrolls[0] || null
    return { ...s, latestPayroll: latest }
  })

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-navy rounded-full animate-spin" style={{ borderWidth: 3 }} />
        <p className="text-slate-400 text-sm">Loading Staff Management...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
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

      {/* Upraisal Modal */}
      <AnimatePresence>
        {upraisalTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setUpraisalTarget(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 w-full max-w-lg"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                  {upraisalTarget.fullname.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-navy font-heading">📈 Salary Upraisal</h3>
                  <p className="text-sm text-slate-500">{upraisalTarget.fullname} · {upraisalTarget.role.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <form onSubmit={saveUpraisal} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Current Salary (₹)</label>
                    <input type="number" value={upraisalForm.current_salary}
                      onChange={e => {
                        const v = e.target.value
                        setUpraisalForm(f => ({ ...f, current_salary: v, new_salary: String(Math.round(Number(v) * (1 + Number(f.increment_pct) / 100))) }))
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-navy text-lg font-bold text-navy" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Increment (%)</label>
                    <input type="number" min="0" max="100" value={upraisalForm.increment_pct}
                      onChange={e => handleIncrementChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-green-500 text-lg font-bold text-green-600" />
                  </div>
                </div>
                <div className="rounded-2xl p-5 border-2 border-green-200" style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-green-600 uppercase tracking-wider">New Salary</p>
                      <p className="text-3xl font-extrabold text-green-700 mt-1">₹{Number(upraisalForm.new_salary).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600">Increment Amount</p>
                      <p className="text-lg font-bold text-green-600">+₹{(Number(upraisalForm.new_salary) - Number(upraisalForm.current_salary)).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">New Salary (₹) — manual override</label>
                  <input type="number" value={upraisalForm.new_salary}
                    onChange={e => setUpraisalForm(f => ({ ...f, new_salary: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Effective From</label>
                  <input type="date" required value={upraisalForm.effective_from}
                    onChange={e => setUpraisalForm(f => ({ ...f, effective_from: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Reason for Upraisal</label>
                  <textarea rows={2} required value={upraisalForm.reason}
                    onChange={e => setUpraisalForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="e.g., Excellent performance in Q1, leadership contributions..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setUpraisalTarget(null)}
                    className="px-5 py-2.5 hover:bg-slate-100 rounded-xl font-bold text-slate-500 cursor-pointer">Cancel</button>
                  <button type="submit" disabled={savingUpraisal}
                    className="px-6 py-2.5 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                    {savingUpraisal ? '⏳ Processing...' : '📈 Approve Upraisal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">Staff &amp; HR Management</h1>
          <p className="text-slate-500 text-sm">Manage team, payroll, appraisals and leaves • {staff.length} staff members</p>
        </div>
        <button onClick={loadData} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">↻ Refresh</button>
      </div>

      {/* Tab Strip */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setTab(tab.key)}
            className={`flex-1 min-w-[140px] py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${activeTab === tab.key ? 'bg-navy text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 hover:text-navy'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

          {/* DIRECTORY TAB */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search team members..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-navy" />
              </div>

              {/* Team Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStaff.map((s, i) => {
                  const roleCfg = ROLE_COLORS[s.role] || ROLE_COLORS.admin
                  return (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md"
                          style={{ background: `linear-gradient(135deg, ${roleCfg.color}, ${roleCfg.color}cc)` }}>
                          {s.fullname?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-navy truncate">{s.fullname}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: roleCfg.bg, color: roleCfg.color }}>
                            {s.role.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        {s.is_approved
                          ? <span className="w-3 h-3 rounded-full bg-green-400 shadow-sm flex-shrink-0" title="Active" />
                          : <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm flex-shrink-0" title="Pending" />}
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-500">
                        <p className="flex items-center gap-2 truncate">✉️ {s.email}</p>
                        {s.phone && <p className="flex items-center gap-2">📞 {s.phone}</p>}
                        <p className="flex items-center gap-2 capitalize">🏢 {s.department || s.pillar_role || 'General'}</p>
                        {s.designation && <p className="flex items-center gap-2">🎖️ {s.designation}</p>}
                        <p className="flex items-center gap-2">📅 Joined {new Date(s.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.is_approved ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                          {s.is_approved ? '● Active' : '○ Pending'}
                        </span>
                        <button onClick={() => openUpraisal(s)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 cursor-pointer transition-colors opacity-0 group-hover:opacity-100">
                          📈 Upraisal
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              {filteredStaff.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                  <span className="text-5xl block mb-3">👥</span>
                  <p className="text-slate-400 text-sm">No staff records found</p>
                </div>
              )}
            </div>
          )}

          {/* PAYROLL TAB */}
          {activeTab === 'payroll' && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Slips', v: payrolls.length, color: '#3B82F6', bg: '#EFF6FF' },
                  { label: 'Paid', v: payrolls.filter(p => p.status === 'paid').length, color: '#10B981', bg: '#ECFDF5' },
                  { label: 'Pending', v: payrolls.filter(p => p.status === 'unpaid').length, color: '#F59E0B', bg: '#FFFBEB' },
                  { label: 'Total Payout', v: `₹${payrolls.filter(p => p.status === 'paid').reduce((a, b) => a + b.net_salary, 0).toLocaleString('en-IN')}`, color: '#8B5CF6', bg: '#F5F3FF' },
                ].map(k => (
                  <div key={k.label} className="rounded-2xl p-4 border" style={{ background: k.bg, borderColor: `${k.color}20` }}>
                    <p className="text-2xl font-extrabold" style={{ color: k.color }}>{k.v}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button onClick={() => setShowPayrollForm(!showPayrollForm)}
                  className="px-5 py-2.5 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)' }}>
                  + Generate Salary Slip
                </button>
              </div>

              {showPayrollForm && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-navy font-heading mb-4">💰 Generate Salary Slip</h3>
                  <form onSubmit={savePayroll} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select required value={payForm.user_id} onChange={e => setPayForm(p => ({ ...p, user_id: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-navy">
                        <option value="">Select Employee</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.fullname} ({s.role.replace(/_/g,' ')})</option>)}
                      </select>
                      <div className="flex gap-2">
                        <select required value={payForm.month} onChange={e => setPayForm(p => ({ ...p, month: e.target.value }))}
                          className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none">
                          {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
                        </select>
                        <input type="number" required value={payForm.year}
                          onChange={e => setPayForm(p => ({ ...p, year: Number(e.target.value) }))}
                          className="w-24 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                      </div>
                      <input type="number" required placeholder="Base Salary (₹)" value={payForm.base}
                        onChange={e => setPayForm(p => ({ ...p, base: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                      <div className="flex gap-2">
                        <input type="number" placeholder="Bonuses (₹)" value={payForm.bonus}
                          onChange={e => setPayForm(p => ({ ...p, bonus: e.target.value }))}
                          className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                        <input type="number" placeholder="Deductions (₹)" value={payForm.ded}
                          onChange={e => setPayForm(p => ({ ...p, ded: e.target.value }))}
                          className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                      </div>
                    </div>
                    {payForm.base && (
                      <div className="rounded-xl bg-navy/5 border border-navy/10 p-4">
                        <p className="text-sm text-slate-600">Net Salary Preview: <span className="text-2xl font-extrabold text-navy">₹{(Number(payForm.base) + Number(payForm.bonus) - Number(payForm.ded)).toLocaleString('en-IN')}</span></p>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={() => setShowPayrollForm(false)} className="px-5 py-2 hover:bg-slate-100 rounded-xl font-bold text-slate-500 cursor-pointer">Cancel</button>
                      <button type="submit" disabled={savingPay} className="px-5 py-2 bg-navy text-white font-bold rounded-xl cursor-pointer disabled:opacity-50">
                        {savingPay ? 'Generating...' : 'Generate Slip'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Salary Overview by Team Member */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-bold text-navy font-heading">👥 Team Salary Overview</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Latest salary details for each team member</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-4">Employee</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Latest Salary</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {latestPayrollByUser.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                                style={{ background: (ROLE_COLORS[s.role] || ROLE_COLORS.admin).color }}>
                                {s.fullname?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-bold text-navy">{s.fullname}</p>
                                <p className="text-xs text-slate-400">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                              style={{ background: (ROLE_COLORS[s.role] || ROLE_COLORS.admin).bg, color: (ROLE_COLORS[s.role] || ROLE_COLORS.admin).color }}>
                              {s.role.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 capitalize">{s.department || s.pillar_role || '—'}</td>
                          <td className="p-4">
                            {s.latestPayroll ? (
                              <div>
                                <p className="font-bold text-navy text-base">₹{Number(s.latestPayroll.net_salary).toLocaleString('en-IN')}</p>
                                <p className="text-[10px] text-slate-400">{s.latestPayroll.month} {s.latestPayroll.year}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">No record</span>
                            )}
                          </td>
                          <td className="p-4">
                            {s.latestPayroll?.status === 'paid'
                              ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-bold">Paid</span>
                              : s.latestPayroll
                                ? <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-bold">Unpaid</span>
                                : <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-400 font-bold">N/A</span>}
                          </td>
                          <td className="p-4">
                            <button onClick={() => openUpraisal(s)}
                              className="text-xs bg-green-500/10 text-green-700 font-bold px-3 py-1.5 rounded-lg hover:bg-green-500 hover:text-white transition-colors cursor-pointer">
                              📈 Upraisal
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payroll History */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-bold text-navy font-heading">📋 Payroll History</h3>
                </div>
                {payrolls.length === 0 ? (
                  <div className="text-center py-16">
                    <span className="text-5xl block mb-3">💰</span>
                    <p className="text-slate-400 text-sm mb-3">No payroll records yet</p>
                    <button onClick={() => setShowPayrollForm(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-navy cursor-pointer">
                      Generate First Slip
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="p-4">Employee</th>
                          <th className="p-4">Period</th>
                          <th className="p-4">Base</th>
                          <th className="p-4">Bonus / Ded.</th>
                          <th className="p-4">Net Salary</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payrolls.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/60">
                            <td className="p-4 font-semibold text-navy">{p.fullname}</td>
                            <td className="p-4 text-slate-500">{p.month} {p.year}</td>
                            <td className="p-4">₹{Number(p.base_salary).toLocaleString('en-IN')}</td>
                            <td className="p-4 text-xs">
                              <span className="text-green-600">+₹{Number(p.bonuses).toLocaleString('en-IN')}</span>
                              {' / '}
                              <span className="text-red-500">-₹{Number(p.deductions).toLocaleString('en-IN')}</span>
                            </td>
                            <td className="p-4 font-bold text-navy text-base">₹{Number(p.net_salary).toLocaleString('en-IN')}</td>
                            <td className="p-4">
                              {p.status === 'paid'
                                ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-bold">Paid{p.payment_date ? ` · ${new Date(p.payment_date).toLocaleDateString('en-IN')}` : ''}</span>
                                : <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-bold">Unpaid</span>}
                            </td>
                            <td className="p-4">
                              {p.status === 'unpaid' && (
                                <button onClick={() => markPaid(p.id)}
                                  className="text-xs bg-green-500/10 text-green-700 font-bold px-3 py-1.5 rounded-lg hover:bg-green-500 hover:text-white transition-colors cursor-pointer">
                                  Mark Paid
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* APPRAISALS TAB */}
          {activeTab === 'appraisals' && (
            <div className="space-y-6">
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowApprForm(!showApprForm)}
                  className="px-5 py-2.5 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
                  + New Appraisal Review
                </button>
              </div>

              {showApprForm && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-navy font-heading mb-4">⭐ Performance Appraisal</h3>
                  <form onSubmit={saveAppraisal} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select required value={apprForm.user_id} onChange={e => setApprForm(p => ({ ...p, user_id: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none">
                        <option value="">Select Employee</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.fullname}</option>)}
                      </select>
                      <input type="text" placeholder="Period (e.g., Q1 2026)" required value={apprForm.period}
                        onChange={e => setApprForm(p => ({ ...p, period: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                      <div className="relative">
                        <input type="number" min="1" max="10" placeholder="Rating (1–10)" required value={apprForm.score}
                          onChange={e => setApprForm(p => ({ ...p, score: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                        {apprForm.score && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-sm">{'⭐'.repeat(Math.min(Number(apprForm.score), 10))}</span>}
                      </div>
                    </div>
                    <textarea required rows={2} placeholder="General Feedback" value={apprForm.feedback}
                      onChange={e => setApprForm(p => ({ ...p, feedback: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none resize-none" />
                    <textarea required rows={2} placeholder="Key Goals Achieved" value={apprForm.goals}
                      onChange={e => setApprForm(p => ({ ...p, goals: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none resize-none" />
                    <textarea required rows={2} placeholder="Areas of Improvement" value={apprForm.areas}
                      onChange={e => setApprForm(p => ({ ...p, areas: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none resize-none" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">💰 Salary Increment (₹) — optional</label>
                        <input type="number" placeholder="e.g., 5000" value={apprForm.salary_increment}
                          onChange={e => setApprForm(p => ({ ...p, salary_increment: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">📈 New Salary (₹) — optional</label>
                        <input type="number" placeholder="e.g., 55000" value={apprForm.new_salary}
                          onChange={e => setApprForm(p => ({ ...p, new_salary: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={() => setShowApprForm(false)} className="px-5 py-2 hover:bg-slate-100 rounded-xl font-bold text-slate-500 cursor-pointer">Cancel</button>
                      <button type="submit" disabled={savingAppr} className="px-5 py-2 bg-amber-500 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50">
                        {savingAppr ? 'Submitting...' : 'Submit Appraisal'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Quick Upraisal for team members */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-navy font-heading">📈 Quick Upraisal</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Select a team member to process salary upraisal</p>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {staff.map(s => {
                    const latestPay = payrolls.find(p => p.user_id === s.id)
                    return (
                      <button key={s.id} onClick={() => openUpraisal(s)}
                        className="p-3 rounded-xl border border-slate-100 hover:border-green-300 hover:bg-green-50/50 transition-all cursor-pointer text-left group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: (ROLE_COLORS[s.role] || ROLE_COLORS.admin).color }}>
                            {s.fullname.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-navy truncate">{s.fullname}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{s.role.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                        {latestPay && <p className="text-[10px] text-slate-500">Current: ₹{Number(latestPay.base_salary).toLocaleString('en-IN')}</p>}
                        <p className="text-[10px] text-green-600 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">📈 Click to upraise</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {appraisals.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                  <span className="text-5xl block mb-3">⭐</span>
                  <p className="text-slate-400 text-sm mb-3">No appraisals submitted yet</p>
                  <button onClick={() => setShowApprForm(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 cursor-pointer">+ Create First Appraisal</button>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Appraisal History ({appraisals.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appraisals.map(a => (
                      <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-navy text-lg">{a.fullname}</h4>
                            <p className="text-xs text-slate-500">{a.review_period}</p>
                          </div>
                          <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center flex-col">
                            <span className="text-2xl font-extrabold text-amber-500">{a.performance_score}</span>
                            <span className="text-[9px] text-amber-400">/10</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                          <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${a.performance_score * 10}%` }} />
                        </div>
                        {/* Salary change info */}
                        {(a.salary_increment || a.new_salary) ? (
                          <div className="mb-3 p-3 rounded-xl border border-green-200" style={{ background: '#ECFDF5' }}>
                            <div className="flex items-center justify-between">
                              {a.salary_increment ? (
                                <span className="text-xs font-bold text-green-700">📈 Increment: +₹{Number(a.salary_increment).toLocaleString('en-IN')}</span>
                              ) : null}
                              {a.new_salary ? (
                                <span className="text-xs font-bold text-green-800">New: ₹{Number(a.new_salary).toLocaleString('en-IN')}</span>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                        <div className="space-y-2 text-sm">
                          {a.feedback && <div><strong className="text-xs text-navy">Feedback:</strong><p className="text-slate-600 line-clamp-2">{a.feedback}</p></div>}
                          {a.goals_achieved && <div><strong className="text-xs text-green-600">✓ Goals:</strong><p className="text-slate-600 line-clamp-1">{a.goals_achieved}</p></div>}
                          {a.areas_of_improvement && <div><strong className="text-xs text-red-500">↑ Improve:</strong><p className="text-slate-600 line-clamp-1">{a.areas_of_improvement}</p></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LEAVES TAB */}
          {activeTab === 'leaves' && <LeavesAdminTab />}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Leave admin sub-component ──
function LeavesAdminTab() {
  const [leaves, setLeaves] = useState<{ id: number; fullname: string; leave_type: string; start_date: string; end_date: string; days: number; reason: string; status: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/staff?type=leaves')
      .then(r => r.json())
      .then(d => setLeaves(d.leaves || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateLeave = async (id: number, status: 'approved' | 'rejected') => {
    const res = await fetch('/api/admin/staff?type=leaves', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
    if (res.ok) setLeaves(l => l.map(r => r.id === id ? { ...r, status } : r))
  }

  const pending = leaves.filter(l => l.status === 'pending')
  const processed = leaves.filter(l => l.status !== 'pending')

  if (loading) return <div className="text-center py-12 text-slate-400">Loading leaves...</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', v: leaves.length, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Pending', v: pending.length, color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Approved', v: leaves.filter(l => l.status === 'approved').length, color: '#10B981', bg: '#ECFDF5' },
          { label: 'Rejected', v: leaves.filter(l => l.status === 'rejected').length, color: '#EF4444', bg: '#FEF2F2' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-4 border" style={{ background: k.bg, borderColor: `${k.color}20` }}>
            <p className="text-2xl font-extrabold" style={{ color: k.color }}>{k.v}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {leaves.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <span className="text-5xl block mb-3">🏖️</span>
          <p className="text-slate-400 text-sm">No leave requests submitted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">🕐 Pending Approval ({pending.length})</h3>
              <div className="space-y-3">
                {pending.map(l => (
                  <div key={l.id} className="bg-white rounded-2xl p-5 border border-amber-200/60 shadow-sm flex flex-wrap gap-4 items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-navy">{l.fullname}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 capitalize">{l.leave_type.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-slate-600">{new Date(l.start_date).toLocaleDateString('en-IN')} → {new Date(l.end_date).toLocaleDateString('en-IN')} · <strong>{l.days} day{l.days !== 1 ? 's' : ''}</strong></p>
                      <p className="text-xs text-slate-400 mt-1">{l.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateLeave(l.id, 'approved')}
                        className="px-4 py-2 text-xs font-bold bg-green-500 text-white rounded-xl hover:bg-green-600 cursor-pointer transition-colors">
                        ✓ Approve
                      </button>
                      <button onClick={() => updateLeave(l.id, 'rejected')}
                        className="px-4 py-2 text-xs font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 cursor-pointer transition-colors">
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {processed.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">History ({processed.length})</h3>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-slate-50 border-b border-slate-100">
                      {['Employee', 'Type', 'From', 'To', 'Days', 'Reason', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[10px]">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {processed.map(l => {
                        const styles: Record<string, { bg: string; text: string }> = {
                          approved: { bg: '#D1FAE5', text: '#065F46' },
                          rejected: { bg: '#FEE2E2', text: '#991B1B' },
                        }
                        const s = styles[l.status] || { bg: '#F3F4F6', text: '#6B7280' }
                        return (
                          <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-semibold text-navy">{l.fullname}</td>
                            <td className="px-4 py-3 capitalize">{l.leave_type.replace('_', ' ')}</td>
                            <td className="px-4 py-3 text-slate-500">{new Date(l.start_date).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-3 text-slate-500">{new Date(l.end_date).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-3 font-bold">{l.days}</td>
                            <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{l.reason}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ background: s.bg, color: s.text }}>{l.status}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Default export with Suspense boundary ──
export default function StaffManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-slate-200 border-t-navy rounded-full animate-spin" style={{ borderWidth: 3 }} /></div>}>
      <StaffContent />
    </Suspense>
  )
}
