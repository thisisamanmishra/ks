'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface DashboardData {
  stats: {
    totalUsers: number
    totalAdmins: number
    totalVendors: number
    totalProjects: number
    pendingRequests: number
    totalBlogs: number
    totalRevenue: number
  }
  projectStats: {
    pending: number
    in_progress: number
    completed: number
    cancelled: number
  }
  recentActivity: Array<{
    id: number
    action: string
    details: string
    created_at: string
  }>
  userRole: string
  userDepartment: string | null
}

const statCards = [
  { key: 'totalUsers', icon: '👥', label: 'Total Users', color: 'from-blue-500 to-blue-600' },
  { key: 'totalAdmins', icon: '🛡️', label: 'Admins', color: 'from-purple-500 to-purple-600' },
  { key: 'totalVendors', icon: '🏪', label: 'Vendors', color: 'from-cyan-500 to-cyan-600' },
  { key: 'totalProjects', icon: '📋', label: 'Projects', color: 'from-amber-500 to-amber-600' },
  { key: 'pendingRequests', icon: '📩', label: 'Pending Requests', color: 'from-red-500 to-red-600' },
  { key: 'totalBlogs', icon: '📝', label: 'Blogs', color: 'from-green-500 to-green-600' },
]

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <p className="text-red-500">Failed to load dashboard data.</p>

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-navy font-heading">
            {data.userRole === 'super_admin' ? '👑 Super Admin' : '📊'} Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">Overview of your platform performance</p>
        </div>
        <div className="text-sm text-slate-400">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white text-lg shadow-lg`}>
                {card.icon}
              </span>
              {card.key === 'pendingRequests' && data.stats.pendingRequests > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold animate-pulse">
                  NEW
                </span>
              )}
            </div>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-navy font-heading">
              {data.stats[card.key as keyof typeof data.stats]}
            </h3>
            <p className="text-slate-500 text-xs mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-navy to-navy-dark rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Total Revenue</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold font-heading mt-1">
              ₹{data.stats.totalRevenue.toLocaleString('en-IN')}
            </h2>
          </div>
          <span className="text-5xl opacity-30">💰</span>
        </div>
      </motion.div>

      {/* Project Status + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-navy text-lg mb-4 font-heading">Project Status</h3>
          <div className="space-y-4">
            {[
              { label: 'Pending', value: data.projectStats.pending, color: 'bg-amber-500', total: data.stats.totalProjects },
              { label: 'In Progress', value: data.projectStats.in_progress, color: 'bg-blue-500', total: data.stats.totalProjects },
              { label: 'Completed', value: data.projectStats.completed, color: 'bg-green-500', total: data.stats.totalProjects },
              { label: 'Cancelled', value: data.projectStats.cancelled, color: 'bg-red-400', total: data.stats.totalProjects },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-bold text-navy">{item.value}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-navy text-lg mb-4 font-heading">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📩', label: 'Staff Requests', href: '/admin/staff-requests', count: data.stats.pendingRequests },
              { icon: '👥', label: 'Manage Users', href: '/admin/users' },
              { icon: '📝', label: 'New Blog Post', href: '/admin/blogs/new' },
              { icon: '📋', label: 'All Projects', href: '/admin/projects' },
              { icon: '🏪', label: 'Vendors', href: '/admin/vendors' },
              { icon: '📈', label: 'Analytics', href: '/admin/analytics' },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-accent/5 hover:shadow-md transition-all duration-200 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                <div>
                  <span className="text-sm font-medium text-navy">{action.label}</span>
                  {action.count !== undefined && action.count > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                      {action.count}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-navy text-lg mb-4 font-heading">Recent Activity</h3>
        {data.recentActivity.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <span className="text-4xl block mb-2">📭</span>
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-2 h-2 mt-2 rounded-full bg-accent flex-shrink-0" />
                <div>
                  <p className="text-sm text-navy font-medium">{activity.action}</p>
                  <p className="text-xs text-slate-400">{activity.details}</p>
                  <p className="text-xs text-slate-300 mt-1">
                    {new Date(activity.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
