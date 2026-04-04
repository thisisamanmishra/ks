'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TeamMember {
  id: number
  fullname: string
  email: string
  phone: string
  role: string
  department: string | null
  pillar_role: string | null
  status: string
  created_at: string
  avatar_url: string | null
  employee_id: string | null
  joining_date: string | null
}

interface LeaveRequest {
  id: number
  leave_type: string
  start_date: string
  end_date: string
  days: number
  reason: string | null
  status: string
  created_at: string
  user: { id: number; fullname: string; department: string | null } | null
}

interface HRData {
  team: TeamMember[]
  pendingLeaves: LeaveRequest[]
  attendance: { present: number; total: number; absent: number }
}

const ROLE_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  super_admin: { label: 'Super Admin', color: '#FF6B35', bg: '#FFF0EB' },
  board_member: { label: 'Board Member', color: '#8B5CF6', bg: '#EDE9FE' },
  admin: { label: 'Admin', color: '#3B82F6', bg: '#DBEAFE' },
  pillar_member: { label: 'Pillar Member', color: '#10B981', bg: '#D1FAE5' },
}

const LEAVE_TYPES: Record<string, string> = {
  casual: '🏖️ Casual',
  sick: '🤒 Sick',
  earned: '📅 Earned',
  maternity: '👶 Maternity',
  paternity: '👨‍👶 Paternity',
  other: '📋 Other',
}

export default function HRPage() {
  const [data, setData] = useState<HRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'team' | 'leaves' | 'attendance'>('team')
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/hr')
      const d = await res.json()
      setData(d)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const approveLeave = async (id: number, status: 'approved' | 'rejected') => {
    await fetch('/api/admin/hr', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchData()
  }

  const filteredTeam = (data?.team || []).filter(m =>
    m.fullname.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.department || '').toLowerCase().includes(search.toLowerCase())
  )

  const deptCounts: Record<string, number> = {}
  ;(data?.team || []).forEach(m => {
    const key = m.department || m.role
    deptCounts[key] = (deptCounts[key] || 0) + 1
  })

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">👥 HR & People</h1>
          <p className="text-slate-500 text-sm mt-0.5">{data?.team.length || 0} team members · {data?.pendingLeaves.length || 0} pending leaves</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Team', value: data?.team.length || 0, icon: '👥', color: '#1B3A6B' },
          { label: 'Present Today', value: data?.attendance.present || 0, icon: '✅', color: '#10B981' },
          { label: 'Absent Today', value: data?.attendance.absent || 0, icon: '❌', color: '#EF4444' },
          { label: 'Pending Leaves', value: data?.pendingLeaves.length || 0, icon: '🏖️', color: '#F59E0B' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <span className="text-2xl">{kpi.icon}</span>
            <p className="text-2xl font-extrabold font-heading mt-2" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-xs text-slate-400">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['team', 'leaves', 'attendance'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              activeTab === tab ? 'bg-navy text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {tab === 'team' ? `👥 Team (${data?.team.length || 0})` :
             tab === 'leaves' ? `🏖️ Leaves (${data?.pendingLeaves.length || 0})` :
             '📅 Attendance'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
        </div>
      ) : (
        <>
          {/* Team Directory */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-navy" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeam.map((member, i) => {
                  const roleCfg = ROLE_COLORS[member.role] || ROLE_COLORS.admin
                  return (
                    <motion.div key={member.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                          style={{ background: roleCfg.color }}>
                          {member.fullname.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-navy text-sm truncate">{member.fullname}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: roleCfg.bg, color: roleCfg.color }}>
                            {member.department ? member.department.toUpperCase() : roleCfg.label}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-slate-400">
                        <p className="truncate">✉ {member.email}</p>
                        {member.phone && <p>📞 {member.phone}</p>}
                        {member.employee_id && <p>🆔 {member.employee_id}</p>}
                        {member.joining_date && <p>📅 Joined {new Date(member.joining_date).toLocaleDateString('en-IN')}</p>}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${member.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {member.status === 'active' ? '● Active' : '○ Inactive'}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Leave Requests */}
          {activeTab === 'leaves' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {data?.pendingLeaves.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <span className="text-4xl block mb-3">🎉</span>
                  <p>No pending leave requests</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {data?.pendingLeaves.map(leave => (
                    <div key={leave.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center text-navy font-bold text-sm">
                          {leave.user?.fullname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-navy text-sm">{leave.user?.fullname}</p>
                          <p className="text-xs text-slate-400">{leave.user?.department || 'No dept'}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-navy">{LEAVE_TYPES[leave.leave_type]}</p>
                        <p className="text-xs text-slate-400">{new Date(leave.start_date).toLocaleDateString('en-IN')} – {new Date(leave.end_date).toLocaleDateString('en-IN')}</p>
                        <p className="text-xs font-bold text-accent">{leave.days} day(s)</p>
                      </div>
                      {leave.reason && <p className="text-xs text-slate-500 max-w-[180px] truncate">{leave.reason}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => approveLeave(leave.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-green-500 cursor-pointer hover:bg-green-600">
                          ✓ Approve
                        </button>
                        <button onClick={() => approveLeave(leave.id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-red-500 cursor-pointer hover:bg-red-600">
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attendance */}
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
              <span className="text-5xl block mb-4">📅</span>
              <h3 className="text-xl font-bold text-navy font-heading mb-2">Attendance Module</h3>
              <p className="text-slate-400 text-sm mb-2">Today: <strong className="text-green-600">{data?.attendance.present} Present</strong> · <strong className="text-red-500">{data?.attendance.absent} Absent</strong></p>
              <p className="text-xs text-slate-400">Full attendance tracking module — check-in/out coming in next update</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
