'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Event {
  id: number
  title: string
  type: string
  short_description: string
  event_date: string
  featured_image: string | null
  status: string
  prize_pool: string | null
  registration_fee: number
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  podcast: { icon: '🎙️', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  hackathon: { icon: '💻', color: '#FF6B35', bg: 'rgba(255,107,53,0.1)' },
  seminar: { icon: '🎓', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  webinar: { icon: '🌐', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  workshop: { icon: '🔧', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  other: { icon: '🎉', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
}

// Removed static fallback events

export default function EventsPreviewSection() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events?limit=3&status=upcoming')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []) })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && events.length === 0) {
    return null // Hide section if no upcoming events
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <section className="py-20 bg-surface relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #FF6B35, transparent)' }} />

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4"
        >
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
              style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)' }}>
              📅 Events & Programs
            </span>
            <h2 className="text-4xl font-extrabold text-navy font-heading">
              Upcoming <span className="text-accent">Events</span>
            </h2>
            <p className="text-slate-500 mt-2">Podcasts, hackathons, seminars — all in one place</p>
          </div>
          <Link href="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-navy text-navy hover:bg-navy hover:text-white transition-all">
            View All Events →
          </Link>
        </motion.div>

        {/* Event cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[350px] bg-white rounded-2xl animate-pulse shadow-sm border border-slate-100" />
            ))
          ) : (
            events.map((event, i) => {
            const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.other
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group flex flex-col"
              >
                {/* Image / Placeholder */}
                <div className="h-40 flex items-center justify-center relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${config.bg}, rgba(27,58,107,0.05))` }}>
                  <span className="text-6xl">{config.icon}</span>
                  {event.prize_pool && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: '#FF6B35' }}>
                      🏆 {event.prize_pool}
                    </div>
                  )}
                  {event.registration_fee > 0 && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-navy">
                      ₹{event.registration_fee}
                    </div>
                  )}
                  {event.registration_fee === 0 && !event.prize_pool && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-green-500">
                      FREE
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  {/* Type badge + date */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ background: config.bg, color: config.color }}>
                      {config.icon} {event.type}
                    </span>
                    <span className="text-slate-400 text-xs ml-auto">📅 {formatDate(event.event_date)}</span>
                  </div>

                  <h3 className="font-bold text-navy text-base font-heading mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4 flex-1 line-clamp-2">{event.short_description}</p>

                  <Link href={`/events/${event.id}`}
                    className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ backgroundColor: '#1B3A6B' }}>
                    Register Now →
                  </Link>
                </div>
              </motion.div>
            )
          }))}
        </div>
      </div>
    </section>
  )
}
