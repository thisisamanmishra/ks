'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Project {
  id: number
  title: string
  description: string
  status: string
  budget: number | null
  created_at: string
  customer_name?: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function VendorProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/projects?role=vendor')
      .then(r => r.json())
      .then(d => { setProjects(d.projects || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-navy/20 border-t-accent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy font-heading">📋 My Projects</h1>
        <p className="text-slate-500 text-sm mt-1">All projects assigned to you</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: projects.length },
          { key: 'in_progress', label: 'Active', count: projects.filter(p => p.status === 'in_progress').length },
          { key: 'completed', label: 'Completed', count: projects.filter(p => p.status === 'completed').length },
          { key: 'pending', label: 'Pending', count: projects.filter(p => p.status === 'pending').length },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${filter === t.key ? 'bg-navy text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
          <span className="text-4xl block mb-3">📋</span>
          <p className="text-slate-400">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((project, i) => (
            <motion.div key={project.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-navy truncate">{project.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{project.description}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ml-3 flex-shrink-0 ${statusColors[project.status] || 'bg-slate-100 text-slate-600'}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-50">
                <span>{project.budget ? `₹${Number(project.budget).toLocaleString('en-IN')}` : 'No budget'}</span>
                <span>{new Date(project.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
