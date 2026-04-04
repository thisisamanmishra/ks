'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface AttendanceRow {
  user_id: number
  fullname: string
  department: string | null
  present: number
  absent: number
  half_day: number
  on_leave: number
  total_days: number
}

export default function AttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/hr?action=attendance&month=${month}`)
      .then(r => r.json())
      .then(d => { setRows(d.attendance || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month])

  const monthLabel = new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">📅 Attendance</h1>
          <p className="text-slate-500 text-sm mt-0.5">{monthLabel} overview</p>
        </div>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-navy" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-4xl block mb-3">📅</span>
            <p>No attendance data for {monthLabel}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Employee', 'Dept', 'Present', 'Absent', 'Half Day', 'On Leave', 'Rate'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row, i) => {
                  const rate = row.total_days > 0 ? Math.round((row.present / row.total_days) * 100) : 0
                  return (
                    <motion.tr key={row.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-navy">{row.fullname}</td>
                      <td className="px-4 py-3 text-slate-500 capitalize text-xs">{row.department || 'General'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">{row.present}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">{row.absent}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{row.half_day}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{row.on_leave}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                            <div className="h-full rounded-full" style={{ width: `${rate}%`, background: rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444' }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444' }}>{rate}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
