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
  max_participants: number | null
  is_online: boolean
  venue: string | null
  tags: string[]
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; grad: string }> = {
  podcast:   { icon: '🎙️', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',  grad: 'from-violet-500 to-purple-700' },
  hackathon: { icon: '💻', color: '#FF6B35', bg: 'rgba(255,107,53,0.1)',  grad: 'from-orange-500 to-red-600' },
  seminar:   { icon: '🎓', color: '#10B981', bg: 'rgba(16,185,129,0.1)',  grad: 'from-emerald-500 to-teal-700' },
  webinar:   { icon: '🌐', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  grad: 'from-blue-500 to-indigo-700' },
  workshop:  { icon: '🔧', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  grad: 'from-amber-500 to-orange-600' },
  other:     { icon: '🎉', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', grad: 'from-slate-400 to-slate-600' },
}

const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)

export default function EventsPreviewSection() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events?limit=3&status=upcoming')
      .then(r => r.json())
      .then(d => setEvents(d.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && events.length === 0) return null

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #FF6B35, transparent)' }} />

      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
              style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)' }}>
              📅 Events &amp; Programs
            </span>
            <Link href="/events" className="group block">
              <h2 className="text-4xl font-extrabold text-navy font-heading group-hover:text-accent transition-colors">
                Upcoming <span style={{ color: '#FF6B35' }}>Events</span> →
              </h2>
            </Link>
            <p className="text-slate-500 mt-2">Podcasts, hackathons, seminars — all in one place</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/podcasts" className="px-4 py-2 rounded-xl text-xs font-bold border-2 text-purple-600 border-purple-200 hover:bg-purple-600 hover:text-white transition-all">🎙️ Podcasts</Link>
            <Link href="/hackathons" className="px-4 py-2 rounded-xl text-xs font-bold border-2 text-orange-500 border-orange-200 hover:bg-orange-500 hover:text-white transition-all">💻 Hackathons</Link>
            <Link href="/events" className="px-4 py-2 rounded-xl text-xs font-bold border-2 border-navy text-navy hover:bg-navy hover:text-white transition-all">All Events →</Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[380px] bg-white rounded-2xl animate-pulse shadow-sm border border-slate-100" />
            ))
          ) : (
            events.map((event, i) => {
              const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.other
              const isPast = event.status === 'completed' || event.status === 'cancelled'
              const days = daysLeft(event.event_date)
              const typeHref = event.type === 'podcast' ? '/podcasts' : event.type === 'hackathon' ? '/hackathons' : '/events'

              return (
                <motion.div key={event.id}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }} whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-300 group flex flex-col">

                  {/* Clickable header area */}
                  <Link href={`/events/${event.id}`} className="block">
                    <div className={`h-44 flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${config.grad}`}>
                      <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
                      <span className="text-6xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{config.icon}</span>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold capitalize bg-white/20 backdrop-blur-sm text-white border border-white/20">
                          {config.icon} {event.type}
                        </span>
                        {event.status === 'live' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">🔴 LIVE</span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                        {event.prize_pool && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: '#FF6B35' }}>🏆 {event.prize_pool}</span>
                        )}
                        {event.registration_fee === 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500 text-white">FREE</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white border border-white/20">₹{event.registration_fee}</span>
                        )}
                      </div>

                      {!isPast && days > 0 && days <= 14 && (
                        <div className="absolute bottom-0 inset-x-0 text-center py-1.5 text-[10px] font-bold text-white bg-black/30 backdrop-blur-sm">
                          ⏰ {days} {days === 1 ? 'day' : 'days'} left
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                      <span>📅 {formatDate(event.event_date)}</span>
                      {event.is_online && !event.venue && <span className="text-green-500 ml-auto">🌐 Online</span>}
                      {event.venue && <span className="text-slate-400 ml-auto truncate max-w-[120px]">📍 {event.venue}</span>}
                    </div>

                    <Link href={`/events/${event.id}`}>
                      <h3 className="font-bold text-navy text-base font-heading mb-2 line-clamp-2 group-hover:text-accent transition-colors cursor-pointer">
                        {event.title}
                      </h3>
                    </Link>
                    <p className="text-slate-500 text-sm mb-4 flex-1 line-clamp-2">{event.short_description}</p>

                    {event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {event.tags.slice(0, 3).map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full text-[10px] text-slate-500" style={{ background: config.bg }}>#{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-auto">
                      <Link href={`/events/${event.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: config.color }}>
                        {isPast ? 'View Details' : 'Register Now →'}
                      </Link>
                      <Link href={typeHref}
                        className="px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-all hover:opacity-80"
                        style={{ borderColor: config.color, color: config.color }}
                        title={`More ${event.type}s`}>
                        More
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
