'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PendingUser {
  id: number
  fullname: string
  email: string
  phone: string | null
  department: string | null
  pillar_role: string | null
  role: string
  designation: string | null
  created_at: string
}

interface AdminRequest {
  id: number
  user_id: number
  requested_department: string
  message: string
  status: string
  created_at: string
  user: { fullname: string; email: string; phone: string | null } | null
}

const DEPT_COLORS: Record<string, { color: string; bg: string }> = {
  hr: { color: '#8B5CF6', bg: '#EDE9FE' },
  finance: { color: '#10B981', bg: '#D1FAE5' },
  operations: { color: '#3B82F6', bg: '#DBEAFE' },
  marketing: { color: '#F59E0B', bg: '#FEF3C7' },
  digital: { color: '#EC4899', bg: '#FCE7F3' },
  campus: { color: '#3B82F6', bg: '#DBEAFE' },
  calling: { color: '#FF6B35', bg: '#FFF0EB' },
  government: { color: '#10B981', bg: '#D1FAE5' },
  market: { color: '#F59E0B', bg: '#FEF3C7' },
}

const ROLE_TITLES: Record<string, string> = {
  digital: 'Digital Marketing Head',
  marketing: 'Marketing Head',
  operations: 'Operation Head',
}

function getDesignation(u: PendingUser): string {
  if (u.designation) return u.designation
  if (u.pillar_role === 'project_manager') return 'Project Manager'
  if (u.department && ROLE_TITLES[u.department]) return ROLE_TITLES[u.department]
  return u.department || u.role || 'Staff'
}

export default function StaffRequestsPage() {
  const [data, setData] = useState<{
    pendingAdmins: PendingUser[]
    pendingPillar: PendingUser[]
    adminRequests: AdminRequest[]
  }>({ pendingAdmins: [], pendingPillar: [], adminRequests: [] })

  const [loading, setLoading] = useState(true)
  const [actionStates, setActionStates] = useState<Record<number, 'approving' | 'rejecting' | null>>({})
  const [deptOverride, setDeptOverride] = useState<Record<number, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/staff-requests')
      const d = res.ok ? await res.json() : {}
      setData(d)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleAction = async (userId: number, action: 'approve' | 'reject', dept?: string, role?: string) => {
    setActionStates(prev => ({ ...prev, [userId]: action === 'approve' ? 'approving' : 'rejecting' }))
    try {
      const res = await fetch('/api/admin/staff-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, department: dept, role }),
      })
      const d = await res.json()
      if (res.ok) {
        showToast(action === 'approve' ? '✅ Staff member approved! Email sent.' : '❌ Registration rejected. Email sent.', 'success')
        load()
      } else {
        showToast(d.error || 'Action failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setActionStates(prev => ({ ...prev, [userId]: null }))
    }
  }

  const totalPending = data.pendingAdmins.length + data.pendingPillar.length

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">🔐 Staff Registration Queue</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review and approve pending staff & admin registrations</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 cursor-pointer">🔄 Refresh</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '⏳', label: 'Pending Admins', v: data.pendingAdmins.length, color: '#F59E0B' },
          { icon: '🌟', label: 'Pending Pillar Members', v: data.pendingPillar.length, color: '#8B5CF6' },
          { icon: '📋', label: 'Total Pending', v: totalPending, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <span className="text-2xl block mb-2">{s.icon}</span>
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.v}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
      ) : totalPending === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm">
          <span className="text-5xl block mb-4">🎉</span>
          <h3 className="text-xl font-bold text-navy font-heading">All Clear!</h3>
          <p className="text-slate-400 mt-2 text-sm">No pending staff registration requests.</p>
        </div>
      ) : (
        <>
          {/* Pending Admins */}
          {data.pendingAdmins.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
                Pending Admin Requests ({data.pendingAdmins.length})
              </h2>
              <div className="space-y-3">
                {data.pendingAdmins.map((u, i) => {
                  const deptKey = deptOverride[u.id] || u.department || ''
                  const deptCfg = DEPT_COLORS[deptKey] || { color: '#6B7280', bg: '#F3F4F6' }
                  const actionState = actionStates[u.id]
                  return (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl font-bold text-white flex items-center justify-center text-base" style={{ background: deptCfg.color }}>
                            {u.fullname.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-navy">{u.fullname}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                            {u.phone && <p className="text-xs text-slate-400">📞 {u.phone}</p>}
                            <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: deptCfg.bg, color: deptCfg.color }}>
                              🏷️ {getDesignation(u)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <div>
                            <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Role</p>
                            <select value={deptOverride[u.id] || (u.pillar_role === 'project_manager' ? 'project_manager' : u.department === 'digital' ? 'digital_marketing_head' : u.department === 'marketing' ? 'marketing_head' : u.department === 'operations' ? 'operation_head' : '')}
                              onChange={e => setDeptOverride(p => ({ ...p, [u.id]: e.target.value }))}
                              className="px-2 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold cursor-pointer focus:outline-none">
                              <option value="">Select role…</option>
                              <option value="digital_marketing_head">💻 Digital Marketing Head</option>
                              <option value="marketing_head">📢 Marketing Head</option>
                              <option value="operation_head">⚙️ Operation Head</option>
                              <option value="project_manager">📋 Project Manager</option>
                            </select>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => {
                              const selected = deptOverride[u.id] || (u.pillar_role === 'project_manager' ? 'project_manager' : u.department === 'digital' ? 'digital_marketing_head' : u.department === 'marketing' ? 'marketing_head' : u.department === 'operations' ? 'operation_head' : '')
                              const roleMap: Record<string, { dept: string; pillar?: string }> = {
                                digital_marketing_head: { dept: 'digital' },
                                marketing_head: { dept: 'marketing' },
                                operation_head: { dept: 'operations' },
                                project_manager: { dept: 'operations', pillar: 'project_manager' },
                              }
                              const mapping = roleMap[selected]
                              if (mapping) {
                                handleAction(u.id, 'approve', mapping.dept, 'admin')
                              } else {
                                handleAction(u.id, 'approve', u.department || undefined, 'admin')
                              }
                            }}
                              disabled={!!actionState}
                              className="px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold cursor-pointer hover:bg-green-600 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                              {actionState === 'approving' ? '⏳' : '✅'} Approve
                            </button>
                            <button onClick={() => handleAction(u.id, 'reject')}
                              disabled={!!actionState}
                              className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold cursor-pointer hover:bg-red-100 transition-colors disabled:opacity-60">
                              {actionState === 'rejecting' ? '⏳' : '✕'} Reject
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-400">
                        <span>Requested: {new Date(u.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                        {u.department && <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: deptCfg.bg, color: deptCfg.color }}>Applied for: {getDesignation(u)}</span>}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Pending Pillar Members */}
          {data.pendingPillar.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                Pending Pillar Members ({data.pendingPillar.length})
              </h2>
              <div className="space-y-3">
                {data.pendingPillar.map((u, i) => {
                  const pillarKey = u.pillar_role || ''
                  const deptCfg = DEPT_COLORS[pillarKey] || { color: '#10B981', bg: '#D1FAE5' }
                  const actionState = actionStates[u.id]
                  return (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl font-bold text-white flex items-center justify-center" style={{ background: deptCfg.color }}>
                            {u.fullname.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-navy">{u.fullname}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                            {u.pillar_role && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize" style={{ background: deptCfg.bg, color: deptCfg.color }}>
                                🌟 {u.pillar_role} Saarthi
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => handleAction(u.id, 'approve', undefined, 'pillar_member')}
                            disabled={!!actionState}
                            className="px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold cursor-pointer hover:bg-green-600 disabled:opacity-60">
                            {actionState === 'approving' ? '⏳' : '✅'} Approve
                          </button>
                          <button onClick={() => handleAction(u.id, 'reject')}
                            disabled={!!actionState}
                            className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold cursor-pointer hover:bg-red-100 disabled:opacity-60">
                            {actionState === 'rejecting' ? '⏳' : '✕'} Reject
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">
                        Registered: {new Date(u.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        {u.phone && ` · ${u.phone}`}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Info box */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700">
        <p className="font-bold mb-1">📧 Email Notifications</p>
        <p>Approving or rejecting a staff member automatically sends them a branded email notification from Karya Saarthi.</p>
        <p className="mt-1">Approved staff can log in immediately at <code className="bg-blue-100 px-1 rounded">/staff-login</code></p>
      </div>
    </div>
  )
}
