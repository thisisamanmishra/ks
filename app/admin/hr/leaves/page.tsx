'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface LeaveRequest {
  id: number
  user_id: number
  leave_type: string
  start_date: string
  end_date: string
  days: number
  reason: string | null
  status: string
  created_at: string
  user: { id: number; fullname: string; email: string; department: string | null } | null
  reviewer: { fullname: string } | null
}

const LEAVE_TYPES = ['casual', 'sick', 'earned', 'maternity', 'paternity', 'other']
const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function LeavesPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [actionId, setActionId] = useState<number | null>(null)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/hr?action=leaves')
      const d = await res.json()
      setRequests(d.leaveRequests || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetch_() }, [])

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    setActionId(id)
    await fetch('/api/admin/hr', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaveId: id, status }),
    })
    setActionId(null)
    fetch_()
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">🏖️ Leave Requests</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pendingCount > 0 ? <span className="text-amber-600 font-semibold">{pendingCount} pending approvals</span> : 'All requests processed'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold capitalize cursor-pointer transition-all ${filter === f ? 'bg-navy text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-navy/5'}`}>
            {f} {f === 'all' ? `(${requests.length})` : f === 'pending' ? `(${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-4xl block mb-3">🏖️</span>
            <p>No {filter !== 'all' ? filter : ''} leave requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Employee', 'Type', 'Duration', 'Days', 'Reason', 'Applied', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((req, i) => (
                  <motion.tr key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">{req.user?.fullname || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{req.user?.department || 'General'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-600 capitalize">{req.leave_type}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {new Date(req.start_date).toLocaleDateString('en-IN')} → {new Date(req.end_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-bold text-navy">{req.days}d</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[160px] truncate">{req.reason || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(req.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${STATUS_CLASSES[req.status] || 'bg-slate-100 text-slate-600'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {req.status === 'pending' ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleAction(req.id, 'approved')} disabled={actionId === req.id}
                            className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 cursor-pointer disabled:opacity-50">
                            ✓ Approve
                          </button>
                          <button onClick={() => handleAction(req.id, 'rejected')} disabled={actionId === req.id}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 cursor-pointer disabled:opacity-50">
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {req.reviewer ? `by ${req.reviewer.fullname}` : '—'}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
