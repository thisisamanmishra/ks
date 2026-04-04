'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface AdminRequest {
  id: number
  requested_department: string
  message: string
  status: string
  created_at: string
  user: {
    id: number
    fullname: string
    email: string
    phone: string
    role: string
  }
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchRequests = async () => {
    const res = await fetch('/api/admin/requests')
    const data = await res.json()
    setRequests(data.requests || [])
    setLoading(false)
  }

  useEffect(() => { fetchRequests() }, [])

  const handleAction = async (id: number, action: string, department?: string) => {
    setActionLoading(id)
    await fetch(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, department }),
    })
    await fetchRequests()
    setActionLoading(null)
  }

  const pending = requests.filter(r => r.status === 'pending')
  const processed = requests.filter(r => r.status !== 'pending')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy font-heading">📩 Admin Requests</h1>
        <p className="text-slate-500 text-sm mt-1">{pending.length} pending request(s)</p>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pending.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg">
                    {req.user.fullname.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">{req.user.fullname}</h3>
                    <p className="text-xs text-slate-400">{req.user.email}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold animate-pulse">
                  PENDING
                </span>
              </div>

              <div className="mb-4 p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Requested Department</p>
                <p className="font-semibold text-navy capitalize">{req.requested_department}</p>
              </div>

              <p className="text-sm text-slate-500 mb-4">{req.message}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(req.id, 'approve', req.requested_department)}
                  disabled={actionLoading === req.id}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === req.id ? '...' : '✓ Approve'}
                </button>
                <button
                  onClick={() => handleAction(req.id, 'reject')}
                  disabled={actionLoading === req.id}
                  className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  ✕ Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
          <span className="text-4xl block mb-3">✅</span>
          <p className="text-slate-500">No pending admin requests</p>
        </div>
      )}

      {/* Processed */}
      {processed.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-navy mb-4 font-heading">History</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left p-4 font-semibold text-slate-600">User</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Department</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {processed.map(req => (
                  <tr key={req.id} className="border-b border-slate-50">
                    <td className="p-4 font-medium text-navy">{req.user.fullname}</td>
                    <td className="p-4 capitalize text-slate-500">{req.requested_department}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(req.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
