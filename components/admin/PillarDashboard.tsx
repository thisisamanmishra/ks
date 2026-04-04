'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

const PILLAR_CONFIGS = {
  digital: {
    name: 'Digital Saarthi',
    icon: '💻',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    description: 'Content creation, web development, SEO, and social media management',
    kpis: [
      { label: 'Active Websites', icon: '🌐', key: 'sites' },
      { label: 'SEO Campaigns', icon: '🔍', key: 'seo' },
      { label: 'Social Accounts', icon: '📱', key: 'social' },
    ],
  },
  calling: {
    name: 'Calling Saarthi',
    icon: '📞',
    color: '#FF6B35',
    bg: '#FFF0EB',
    description: 'Outbound calls, lead generation, customer follow-ups, and appointment setting',
    kpis: [
      { label: 'Calls Today', icon: '📞', key: 'calls' },
      { label: 'Leads Generated', icon: '🎯', key: 'leads' },
      { label: 'Conversions', icon: '✅', key: 'conversions' },
    ],
  },
  government: {
    name: 'Government Saarthi',
    icon: '🏛️',
    color: '#10B981',
    bg: '#D1FAE5',
    description: 'Government scheme advisory, tender documentation, and compliance management',
    kpis: [
      { label: 'Active Tenders', icon: '📋', key: 'tenders' },
      { label: 'Schemes Advised', icon: '📜', key: 'schemes' },
      { label: 'Success Rate', icon: '🎯', key: 'rate' },
    ],
  },
  market: {
    name: 'Market Saarthi',
    icon: '🗺️',
    color: '#F59E0B',
    bg: '#FEF3C7',
    description: 'Field agents, hyperlocal marketing, territory management, and offline lead capture',
    kpis: [
      { label: 'Field Agents', icon: '🚶', key: 'agents' },
      { label: 'States Active', icon: '🗺️', key: 'states' },
      { label: 'Leads Captured', icon: '📋', key: 'leads' },
    ],
  },
}

type PillarKey = keyof typeof PILLAR_CONFIGS

export default function PillarDashboard({ pillar }: { pillar: PillarKey }) {
  const [members, setMembers] = useState<{ id: number; user?: { fullname: string; email: string } }[]>([])
  const [loading, setLoading] = useState(true)
  const cfg = PILLAR_CONFIGS[pillar]

  useEffect(() => {
    fetch(`/api/admin/pillars?pillar=${pillar}`)
      .then(r => r.json())
      .then(d => { setMembers(d.members || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [pillar])

  if (!cfg) return <div className="text-slate-400">Unknown pillar</div>

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg" style={{ background: cfg.bg }}>
            {cfg.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy font-heading">{cfg.name}</h1>
            <p className="text-slate-500 text-sm">{cfg.description}</p>
          </div>
        </div>
        <button className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer"
          style={{ background: cfg.color }}>
          + Add Member
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {cfg.kpis.map((kpi, i) => (
          <motion.div key={kpi.key} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <span className="text-2xl">{kpi.icon}</span>
            <p className="text-2xl font-extrabold font-heading mt-2" style={{ color: cfg.color }}>—</p>
            <p className="text-xs text-slate-400">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Team */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-navy font-heading">{cfg.name} Team</h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
            {members.length} members
          </span>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}</div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <span className="text-4xl block mb-3">{cfg.icon}</span>
            <p>No {cfg.name} members yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {members.map(m => (
              <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: cfg.color }}>
                  {m.user?.fullname.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">{m.user?.fullname || `Member #${m.id}`}</p>
                  <p className="text-[10px] text-slate-400">{m.user?.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
