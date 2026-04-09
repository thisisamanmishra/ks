'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HackathonEvent {
  id: number
  title: string
  short_description: string
  event_date: string
  end_date: string | null
  status: string
  registration_fee: number
  prize_pool: string | null
  max_participants: number | null
  tags: string[]
  is_online: boolean
  venue: string | null
}

export default function HackathonsSection() {
  const [hackathons, setHackathons] = useState<HackathonEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events?type=hackathon&limit=4')
      .then(r => r.json())
      .then(d => setHackathons(d.events || []))
      .catch(() => setHackathons([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && hackathons.length === 0) return null

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)' }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #FF6B35, transparent)' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
              style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)' }}>
              💻 Hackathons
            </span>
            <Link href="/hackathons" className="group block">
              <h2 className="text-4xl font-extrabold text-navy font-heading group-hover:text-orange-500 transition-colors">
                Build &amp; <span style={{ color: '#FF6B35' }}>Win</span> →
              </h2>
            </Link>
            <p className="text-slate-500 mt-2">Compete, innovate and win exciting prizes</p>
          </div>
          <Link href="/hackathons"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 text-white transition-all whitespace-nowrap"
            style={{ background: '#FF6B35', borderColor: '#FF6B35' }}>
            All Hackathons →
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1,2].map(i => <div key={i} className="h-56 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hackathons.map((h, i) => (
              <motion.div key={h.id}
                initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-orange-100 hover:shadow-xl transition-all duration-300 flex">
                <div className="w-3 flex-shrink-0" style={{ background: 'linear-gradient(180deg, #FF6B35, #e85520)' }} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35' }}>💻 Hackathon</span>
                        {h.registration_fee === 0 && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-600">FREE Entry</span>}
                        {h.is_online && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-600">🌐 Online</span>}
                      </div>
                      <h3 className="font-bold text-navy text-base font-heading line-clamp-2">{h.title}</h3>
                    </div>
                    <span className="text-3xl flex-shrink-0">💻</span>
                  </div>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{h.short_description}</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,107,53,0.06)' }}>
                      <p className="text-xs font-bold text-orange-500">{h.prize_pool || '—'}</p>
                      <p className="text-[10px] text-slate-400">Prize Pool</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 text-center">
                      <p className="text-xs font-bold text-navy">{h.max_participants ? `${h.max_participants}` : '∞'}</p>
                      <p className="text-[10px] text-slate-400">Max Teams</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 text-center">
                      <p className="text-xs font-bold text-navy">{formatDate(h.event_date)}</p>
                      <p className="text-[10px] text-slate-400">Starts</p>
                    </div>
                  </div>
                  <Link href={`/events/${h.id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                    style={{ backgroundColor: '#FF6B35' }}>
                    Register Now →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
