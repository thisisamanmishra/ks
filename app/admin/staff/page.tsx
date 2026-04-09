'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'

interface StaffMember {
  id: number
  fullname: string
  email: string
  role: string
  department: string | null
  pillar_role: string | null
  is_approved: boolean
  created_at: string
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
  status: string
}

const TABS = [
  { key: 'directory', label: '👥 Team Directory' },
  { key: 'payroll', label: '💰 Payroll' },
  { key: 'appraisals', label: '⭐ Appraisals' },
  { key: 'leaves', label: '🏖️ Leaves' }
] as const

export default function StaffManagementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as string
  const validTabs = ['directory', 'payroll', 'appraisals', 'leaves']
  const [activeTab, setActiveTab] = useState(validTabs.includes(tabParam) ? tabParam : 'directory')
  
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [appraisals, setAppraisals] = useState<AppraisalRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Forms
  const [showPayrollForm, setShowPayrollForm] = useState(false)
  const [payForm, setPayForm] = useState({ user_id: '', month: 'January', year: new Date().getFullYear(), base: '0', bonus: '0', ded: '0' })
  const [savingPay, setSavingPay] = useState(false)

  const [showApprForm, setShowApprForm] = useState(false)
  const [apprForm, setApprForm] = useState({ user_id: '', period: 'Q1 ' + new Date().getFullYear(), score: '8', feedback: '', goals: '', areas: '' })
  const [savingAppr, setSavingAppr] = useState(false)

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
  
  useEffect(() => {
    if (validTabs.includes(tabParam)) setActiveTab(tabParam)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam])

  const setTab = (t: string) => {
    setActiveTab(t)
    router.push(`/admin/staff?tab=${t}`)
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
      if (res.ok) { const { record } = await res.json(); setPayrolls(p => [record, ...p]) }
      setShowPayrollForm(false)
    } catch {} finally { setSavingPay(false) }
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
      status: 'finalized'
    }
    try {
      const res = await fetch('/api/admin/staff?type=appraisals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const { record } = await res.json(); setAppraisals(p => [record, ...p]) }
      setShowApprForm(false)
    } catch {} finally { setSavingAppr(false) }
  }

  const markPaid = async (id: number) => {
    const res = await fetch('/api/admin/staff?type=payroll', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'paid' }) })
    if (res.ok) { setPayrolls(p => p.map(r => r.id === id ? { ...r, status: 'paid', payment_date: new Date().toISOString() } : r)) }
  }

  if (loading) return <div className="p-8 text-center animate-pulse text-slate-400">Loading Staff Management...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">Staff & HR Management</h1>
          <p className="text-slate-500 text-sm">Manage team, payroll, appraisals, and leaves.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setTab(tab.key)} className={`flex-1 min-w-[150px] py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${activeTab === tab.key ? 'bg-navy text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 hover:text-navy'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          
          {/* DIRECTORY TAB */}
          {activeTab === 'directory' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-navy">Team Directory ({staff.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Department / Pillar</th><th className="p-4">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staff.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <p className="font-bold text-navy">{s.fullname}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 capitalize">{s.role.replace('_', ' ')}</span>
                        </td>
                        <td className="p-4 text-slate-600 capitalize">
                          {s.department || s.pillar_role || '-'}
                        </td>
                        <td className="p-4">
                          {s.is_approved ? <span className="text-green-600 font-bold text-xs">✓ Active</span> : <span className="text-amber-500 font-bold text-xs">⏳ Pending</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAYROLL TAB */}
          {activeTab === 'payroll' && (
            <div className="space-y-6">
               <div className="flex justify-end">
                 <button onClick={() => setShowPayrollForm(!showPayrollForm)} className="px-5 py-2.5 bg-accent text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer">
                   + Generate Salary Slip
                 </button>
               </div>

               {showPayrollForm && (
                 <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                   <h3 className="font-bold text-navy mb-4">💰 Generate Salary Slip</h3>
                   <form onSubmit={savePayroll} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <select required value={payForm.user_id} onChange={e=>setPayForm(p=>({...p, user_id: e.target.value}))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                         <option value="">Select Employee</option>
                         {staff.map(s => <option key={s.id} value={s.id}>{s.fullname} ({s.role})</option>)}
                       </select>
                       <div className="flex gap-2">
                         <select required value={payForm.month} onChange={e=>setPayForm(p=>({...p, month: e.target.value}))} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                           {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
                         </select>
                         <input type="number" required value={payForm.year} onChange={e=>setPayForm(p=>({...p, year: Number(e.target.value)}))} className="w-24 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" />
                       </div>
                       <input type="number" required placeholder="Base Salary (₹)" value={payForm.base} onChange={e=>setPayForm(p=>({...p, base: e.target.value}))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" />
                       <div className="flex gap-2">
                         <input type="number" placeholder="Bonuses (₹)" value={payForm.bonus} onChange={e=>setPayForm(p=>({...p, bonus: e.target.value}))} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" />
                         <input type="number" placeholder="Deductions (₹)" value={payForm.ded} onChange={e=>setPayForm(p=>({...p, ded: e.target.value}))} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" />
                       </div>
                     </div>
                     <div className="flex justify-end gap-3 pt-2">
                       <button type="button" onClick={() => setShowPayrollForm(false)} className="px-5 py-2 hover:bg-slate-100 rounded-xl font-bold text-slate-500 cursor-pointer">Cancel</button>
                       <button type="submit" disabled={savingPay} className="px-5 py-2 bg-navy text-white font-bold rounded-xl cursor-pointer">Generate Slip</button>
                     </div>
                   </form>
                 </div>
               )}

               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-500">
                       <tr><th className="p-4">Employee</th><th className="p-4">Period</th><th className="p-4">Base Salary</th><th className="p-4">Bonus / Ded.</th><th className="p-4">Net Salary</th><th className="p-4">Status</th><th className="p-4">Action</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {payrolls.map(p => (
                         <tr key={p.id}>
                           <td className="p-4 font-semibold text-navy">{p.fullname}</td>
                           <td className="p-4">{p.month} {p.year}</td>
                           <td className="p-4">₹{p.base_salary.toLocaleString('en-IN')}</td>
                           <td className="p-4 text-xs">
                             <span className="text-green-600">+₹{p.bonuses}</span> / <span className="text-red-500">-₹{p.deductions}</span>
                           </td>
                           <td className="p-4 font-bold text-navy text-base">₹{p.net_salary.toLocaleString('en-IN')}</td>
                           <td className="p-4">
                             {p.status === 'paid' ? <span className="px-2 py-0.5 rounded textxs bg-green-100 text-green-700 font-bold">Paid</span> : <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 font-bold">Unpaid</span>}
                           </td>
                           <td className="p-4">
                             {p.status === 'unpaid' && (
                               <button onClick={() => markPaid(p.id)} className="text-xs bg-accent/10 text-accent font-bold px-3 py-1.5 rounded-lg hover:bg-accent hover:text-white transition-colors cursor-pointer">
                                  Mark Paid
                               </button>
                             )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}

          {/* APPRAISALS TAB */}
          {activeTab === 'appraisals' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={() => setShowApprForm(!showApprForm)} className="px-5 py-2.5 bg-accent text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer">
                  + New Appraisal Review
                </button>
              </div>

              {showApprForm && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-navy mb-4">⭐ Complete Performance Appraisal</h3>
                  <form onSubmit={saveAppraisal} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <select required value={apprForm.user_id} onChange={e=>setApprForm(p=>({...p, user_id: e.target.value}))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 md:col-span-1">
                         <option value="">Select Employee</option>
                         {staff.map(s => <option key={s.id} value={s.id}>{s.fullname}</option>)}
                       </select>
                       <input type="text" placeholder="Period (e.g., Q1 2026)" required value={apprForm.period} onChange={e=>setApprForm(p=>({...p, period: e.target.value}))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 md:col-span-1" />
                       <input type="number" min="1" max="10" placeholder="Rating out of 10" required value={apprForm.score} onChange={e=>setApprForm(p=>({...p, score: e.target.value}))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 md:col-span-1" />
                     </div>
                     <textarea required rows={2} placeholder="General Feedback" value={apprForm.feedback} onChange={e=>setApprForm(p=>({...p, feedback: e.target.value}))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" />
                     <textarea required rows={2} placeholder="Key Goals Achieved" value={apprForm.goals} onChange={e=>setApprForm(p=>({...p, goals: e.target.value}))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" />
                     <textarea required rows={2} placeholder="Areas of Improvement" value={apprForm.areas} onChange={e=>setApprForm(p=>({...p, areas: e.target.value}))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" />
                     
                     <div className="flex justify-end gap-3 pt-2">
                       <button type="button" onClick={() => setShowApprForm(false)} className="px-5 py-2 hover:bg-slate-100 rounded-xl font-bold text-slate-500 cursor-pointer">Cancel</button>
                       <button type="submit" disabled={savingAppr} className="px-5 py-2 bg-navy text-white font-bold rounded-xl cursor-pointer">Submit Appraisal</button>
                     </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appraisals.length === 0 && <p className="text-slate-400 p-4">No appraisals submitted yet.</p>}
                {appraisals.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-navy text-lg">{a.fullname}</h4>
                        <p className="text-xs text-slate-500">{a.review_period}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl font-bold text-amber-500">
                        {a.performance_score}<span className="text-[10px] text-amber-300">/10</span>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4 text-sm mt-4">
                      <div><strong className="text-navy text-xs">Feedback:</strong> <p className="text-slate-600 line-clamp-2">{a.feedback}</p></div>
                      <div><strong className="text-green-600 text-xs">Wins:</strong> <p className="text-slate-600 line-clamp-1">{a.goals_achieved}</p></div>
                      <div><strong className="text-red-500 text-xs">Needs Focus:</strong> <p className="text-slate-600 line-clamp-1">{a.areas_of_improvement}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LEAVES TAB */}
          {activeTab === 'leaves' && (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
              <span className="text-5xl block mb-4">🏖️</span>
              <h3 className="text-lg font-bold text-navy mb-2">Leave Management Module</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">This module is part of the final employee self-service package. Currently, internal tracking is done manually.</p>
            </div>
          )}
          
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
