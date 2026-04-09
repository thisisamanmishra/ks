'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PodcastEvent {
  id: number
  title: string
  short_description: string
  event_date: string
  status: string
  registration_fee: number
  prize_pool: string | null
  tags: string[]
}

export default function PodcastsSection() {
  const [podcasts, setPodcasts] = useState<PodcastEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events?type=podcast&limit=6')
      .then(r => r.json())
      .then(d => setPodcasts(d.events || []))
      .catch(() => setPodcasts([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && podcasts.length === 0) return null

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
              style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
              🎤 Podcasts
            </span>
            <Link href="/podcasts" className="group block">
              <h2 className="text-4xl font-extrabold text-navy font-heading group-hover:text-purple-600 transition-colors">
                Listen &amp; <span style={{ color: '#8B5CF6' }}>Learn</span> →
              </h2>
            </Link>
            <p className="text-slate-500 mt-2">Expert conversations, industry insights and inspiring stories</p>
          </div>
          <Link href="/podcasts"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white transition-all whitespace-nowrap">
            All Podcasts →
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-52 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((ep, i) => (
              <motion.div key={ep.id}
                initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-purple-100 hover:shadow-xl transition-all duration-300 group flex flex-col">
                <div className="h-28 flex items-center justify-center relative"
                  style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(27,58,107,0.05))' }}>
                  <span className="text-5xl">🎙️</span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl ml-1">▶</span>
                    </div>
                  </div>
                  {ep.registration_fee === 0 && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-purple-600">FREE</div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs text-purple-500 font-semibold mb-1">
                    📅 {new Date(ep.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <h3 className="font-bold text-navy text-sm font-heading mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors flex-1">{ep.title}</h3>
                  <p className="text-slate-400 text-xs mb-4 line-clamp-2">{ep.short_description}</p>
                  <Link href={`/events/${ep.id}`}
                    className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                    style={{ backgroundColor: '#8B5CF6' }}>
                    🎧 Listen Now
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
