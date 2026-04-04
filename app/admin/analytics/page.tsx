'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Stats {
  totalRevenue: number
  totalProjects: number
  totalUsers: number
  totalVendors: number
  completedProjects: number
  pendingProjects: number
  activeProjects: number
  totalLeads: number
  wonLeads: number
  totalServices: number
  totalEvents: number
  totalBlogViews: number
}

interface MonthlyData {
  month: string
  revenue: number
  projects: number
}

const BAR_COLORS = ['#1B3A6B', '#2d5baa', '#3d7adf', '#FF6B35', '#ff8c5f', '#ffad8a']

function BarChart({ data, valueKey, color = '#FF6B35' }: { data: MonthlyData[]; valueKey: 'revenue' | 'projects'; color?: string }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full flex items-end justify-center" style={{ height: '100px' }}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d[valueKey] / max) * 100}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="w-full rounded-t-lg cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: BAR_COLORS[i % BAR_COLORS.length], minHeight: '4px' }}
            />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-navy text-white text-[9px] px-1.5 py-0.5 rounded-md whitespace-nowrap z-10">
              {valueKey === 'revenue' ? `₹${d.revenue.toLocaleString('en-IN')}` : d.projects}
            </div>
          </div>
          <span className="text-[9px] text-slate-400 font-medium">{d.month}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [monthly, setMonthly] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetch(`/api/admin/analytics?range=${range}`)
      .then(r => r.json())
      .then(d => { setStats(d.stats); setMonthly(d.monthly || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range])

  const kpis = stats ? [
    { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: '💰', color: '#10B981', change: '+12%' },
    { label: 'Total Projects', value: stats.totalProjects, icon: '📋', color: '#3B82F6', change: `${stats.activeProjects} active` },
    { label: 'Total Clients', value: stats.totalUsers, icon: '👥', color: '#8B5CF6', change: `+${Math.round(stats.totalUsers * 0.1)} this month` },
    { label: 'Vendors', value: stats.totalVendors, icon: '🏪', color: '#F59E0B', change: 'Approved' },
    { label: 'Total Leads', value: stats.totalLeads, icon: '🎯', color: '#FF6B35', change: `${stats.wonLeads} won` },
    { label: 'Completion Rate', value: `${stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}%`, icon: '✅', color: '#06B6D4', change: `${stats.completedProjects} done` },
    { label: 'Blog Views', value: (stats.totalBlogViews || 0).toLocaleString(), icon: '👁️', color: '#EC4899', change: 'All time' },
    { label: 'Events', value: stats.totalEvents, icon: '📅', color: '#6B7280', change: 'Total hosted' },
  ] : []

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">📈 Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Platform-wide performance metrics</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${range === r ? 'bg-navy text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{k.icon}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{k.change}</span>
                </div>
                <p className="text-2xl font-extrabold font-heading" style={{ color: k.color }}>{k.value}</p>
                <p className="text-xs text-slate-400 mt-1">{k.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          {monthly.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-navy font-heading mb-6">💰 Monthly Revenue</h3>
                <BarChart data={monthly} valueKey="revenue" />
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-navy font-heading mb-6">📋 Monthly Projects</h3>
                <BarChart data={monthly} valueKey="projects" color="#1B3A6B" />
              </div>
            </div>
          )}

          {/* Funnel */}
          {stats && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-navy font-heading mb-5">🔄 Project Pipeline</h3>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'Pending', value: stats.pendingProjects, color: '#F59E0B' },
                  { label: 'Active', value: stats.activeProjects, color: '#3B82F6' },
                  { label: 'Completed', value: stats.completedProjects, color: '#10B981' },
                ].map(item => {
                  const total = stats.totalProjects || 1
                  const pct = Math.round((item.value / total) * 100)
                  return (
                    <div key={item.label} className="flex-1 min-w-[120px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-600">{item.label}</span>
                        <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          className="h-full rounded-full" style={{ background: item.color }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{pct}%</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lead conversion */}
          {stats && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-navy font-heading mb-5">🎯 Lead Conversion Rate</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-navy font-heading">
                    {stats.totalLeads > 0 ? Math.round((stats.wonLeads / stats.totalLeads) * 100) : 0}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Conversion</p>
                </div>
                <div className="flex-1 space-y-3">
                  {[
                    { label: 'Total Leads', value: stats.totalLeads, color: '#6B7280' },
                    { label: 'Won', value: stats.wonLeads, color: '#10B981' },
                    { label: 'Lost', value: Math.max(0, stats.totalLeads - stats.wonLeads), color: '#EF4444' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs w-20 text-slate-500">{item.label}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${stats.totalLeads > 0 ? (item.value / stats.totalLeads) * 100 : 0}%` }}
                          className="h-full rounded-full" style={{ background: item.color }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
