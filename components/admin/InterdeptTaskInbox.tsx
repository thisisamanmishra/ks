'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface Task {
  id: string
  title: string
  description: string
  from_user_id: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

export default function InterdeptTaskInbox() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/interdept-tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.interdept_tasks || [])
      } else {
        setError('Failed to fetch tasks')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/interdept-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (res.ok) {
        setTasks(prev => prev.map(t => (t.id === id ? { ...t, status: newStatus as any } : t)))
      } else {
        const data = await res.json()
        alert('Failed to update status: ' + data.error)
      }
    } catch (err) {
      alert('Network error')
    }
  }

  if (loading) return <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center min-h-[300px]">Loading incoming tasks...</div>

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-navy font-heading">Incoming Department Tasks</h2>
          <p className="text-sm text-slate-500 mt-1">Manage tasks assigned to your department by operations</p>
        </div>
        <span className="bg-coral/10 text-coral px-3 py-1 rounded-full text-sm font-semibold">
          {tasks.filter(t => t.status !== 'completed').length} pending
        </span>
      </div>

      {error ? (
        <div className="p-6 text-red-500 text-center">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          <p>No tasks assigned to your department yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Task</th>
                <th className="p-4 font-medium">Date Assigned</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-navy">{task.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-2 max-w-sm mt-1">{task.description}</div>
                  </td>
                  <td className="p-4 text-slate-600 whitespace-nowrap">
                    {new Date(task.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={\`px-2 py-1 rounded-full text-xs font-semibold \${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }\`}>
                      {task.priority || 'medium'}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className={\`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-coral/20 \${
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }\`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Done</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
