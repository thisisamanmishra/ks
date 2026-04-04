'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Event {
  id: number
  title: string
  slug: string
  type: string
  short_description: string
  featured_image: string | null
  event_date: string
  end_date: string | null
  venue: string | null
  is_online: boolean
  max_participants: number | null
  prize_pool: string | null
  registration_fee: number
  status: string
  tags: string[]
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  podcast: { icon: '🎙️', label: 'Podcast', color: '#8B5CF6', bg: '#EDE9FE' },
  hackathon: { icon: '💻', label: 'Hackathon', color: '#FF6B35', bg: '#FFF0EB' },
  seminar: { icon: '🎓', label: 'Seminar', color: '#10B981', bg: '#D1FAE5' },
  webinar: { icon: '🌐', label: 'Webinar', color: '#3B82F6', bg: '#DBEAFE' },
  workshop: { icon: '🔧', label: 'Workshop', color: '#F59E0B', bg: '#FEF3C7' },
  other: { icon: '🎉', label: 'Event', color: '#6B7280', bg: '#F3F4F6' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'Upcoming', color: '#3B82F6', bg: '#DBEAFE' },
  live: { label: '🔴 Live Now', color: '#EF4444', bg: '#FEE2E2' },
  completed: { label: 'Completed', color: '#6B7280', bg: '#F3F4F6' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' },
}

const TYPES = ['all', 'podcast', 'hackathon', 'seminar', 'webinar', 'workshop']

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'long', year: 'numeric'
})
const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', {
  hour: '2-digit', minute: '2-digit'
})

// Fallback demo events
const DEMO: Event[] = [
  { id: 1, title: 'KaryaSaarthi Tech Talks — Episode 12', slug: '1', type: 'podcast', short_description: 'Building your startup journey: From idea to product-market fit with industry experts and investors.', featured_image: null, event_date: new Date(Date.now() + 7 * 86400000).toISOString(), end_date: null, venue: null, is_online: true, max_participants: null, prize_pool: null, registration_fee: 0, status: 'upcoming', tags: ['startup', 'tech', 'entrepreneurship'] },
  { id: 2, title: 'National Startup Hackathon 2026', slug: '2', type: 'hackathon', short_description: '48-hour hackathon for students and professionals to build innovative solutions for real-world problems. Open to all!', featured_image: null, event_date: new Date(Date.now() + 14 * 86400000).toISOString(), end_date: new Date(Date.now() + 16 * 86400000).toISOString(), venue: 'Delhi / Online', is_online: true, max_participants: 500, prize_pool: '₹5,00,000', registration_fee: 0, status: 'upcoming', tags: ['hackathon', 'innovation', 'prize'] },
  { id: 3, title: 'Academic Research to Publication Seminar', slug: '3', type: 'seminar', short_description: 'Learn the complete process of academic research, writing, and getting published in top peer-reviewed journals.', featured_image: null, event_date: new Date(Date.now() + 21 * 86400000).toISOString(), end_date: null, venue: null, is_online: true, max_participants: 200, prize_pool: null, registration_fee: 199, status: 'upcoming', tags: ['academic', 'research', 'publishing'] },
  { id: 4, title: 'Digital Marketing Masterclass', slug: '4', type: 'webinar', short_description: 'Master SEO, social media ads, email marketing, and growth hacking strategies used by top marketers.', featured_image: null, event_date: new Date(Date.now() + 4 * 86400000).toISOString(), end_date: null, venue: null, is_online: true, max_participants: 1000, prize_pool: null, registration_fee: 0, status: 'upcoming', tags: ['marketing', 'digital', 'growth'] },
  { id: 5, title: 'GST & Compliance Workshop', slug: '5', type: 'workshop', short_description: 'Hands-on workshop on GST filing, compliance management and budget planning for SMEs and startups.', featured_image: null, event_date: new Date(Date.now() + 10 * 86400000).toISOString(), end_date: null, venue: 'Noida, UP', is_online: false, max_participants: 50, prize_pool: null, registration_fee: 499, status: 'upcoming', tags: ['gst', 'compliance', 'finance'] },
  { id: 6, title: 'AI Tools for Students — Live Demo', slug: '6', type: 'webinar', short_description: 'Discover AI tools that can supercharge your academics, coding, content creation and career growth.', featured_image: null, event_date: new Date(Date.now() - 5 * 86400000).toISOString(), end_date: null, venue: null, is_online: true, max_participants: null, prize_pool: null, registration_fee: 0, status: 'completed', tags: ['AI', 'students', 'productivity'] },
]

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(DEMO)
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('upcoming')

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20', ...(typeFilter !== 'all' ? { type: typeFilter } : {}), ...(statusFilter !== 'all' ? { status: statusFilter } : {}) })
      const res = await fetch(`/api/events?${params}`)
      const data = await res.json()
      if (data.events?.length > 0) setEvents(data.events)
    } catch {} finally { setLoading(false) }
  }, [typeFilter, statusFilter])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const filtered = events.filter(e => {
    const typeMatch = typeFilter === 'all' || e.type === typeFilter
    const statusMatch = statusFilter === 'all' || e.status === statusFilter
    return typeMatch && statusMatch
  })

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-20">
        {/* Hero */}
        <div className="py-16 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0f2545 100%)' }}>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
            <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold mb-4"
              style={{ background: 'rgba(255,107,53,0.2)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.3)' }}>
              📅 Events & Programs
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white font-heading mb-3">
              Learn, Compete &amp; <span style={{ color: '#FF6B35' }}>Grow</span>
            </h1>
            <p className="text-white/50 max-w-xl mx-auto">
              Podcasts, hackathons, seminars, webinars and workshops — all curated for your success
            </p>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            {/* Type filter */}
            <div className="flex gap-2 flex-wrap">
              {TYPES.map(t => {
                const cfg = t === 'all' ? { icon: '🏷️', label: 'All Types' } : TYPE_CONFIG[t]
                return (
                  <button key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer capitalize ${
                      typeFilter === t ? 'bg-navy text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-navy'
                    }`}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                )
              })}
            </div>
            <div className="ml-auto flex gap-2">
              {(['upcoming', 'live', 'completed', 'all'] as const).map(s => (
                <button key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
                    statusFilter === s ? 'bg-accent text-white' : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {s === 'all' ? 'All Status' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <span className="text-5xl block mb-4">🗓️</span>
              <p className="text-slate-400">No events found for the selected filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((event, i) => {
                const typeCfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other
                const statusCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.upcoming
                const isPast = event.status === 'completed' || event.status === 'cancelled'

                return (
                  <motion.div key={event.id}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
                    style={{ opacity: isPast ? 0.7 : 1 }}
                  >
                    {/* Top */}
                    <div className="h-40 flex items-center justify-center relative"
                      style={{ background: `linear-gradient(135deg, ${typeCfg.bg}, white)` }}>
                      <span className="text-5xl">{typeCfg.icon}</span>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: typeCfg.bg, color: typeCfg.color }}>
                          {typeCfg.icon} {typeCfg.label}
                        </span>
                        {event.status === 'live' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600 animate-pulse">
                            🔴 LIVE
                          </span>
                        )}
                      </div>

                      {event.prize_pool && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                          style={{ background: '#FF6B35' }}>
                          🏆 {event.prize_pool}
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      {/* Date + location */}
                      <div className="flex items-center gap-3 mb-2 text-xs text-slate-400">
                        <span>📅 {formatDate(event.event_date)}</span>
                        <span>🕐 {formatTime(event.event_date)}</span>
                      </div>
                      {event.venue && <p className="text-xs text-slate-400 mb-2">📍 {event.venue}</p>}
                      {event.is_online && !event.venue && <p className="text-xs text-green-500 mb-2">🌐 Online Event</p>}

                      <h3 className="font-bold text-navy text-sm font-heading mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-slate-400 text-xs mb-4 flex-1 line-clamp-2">{event.short_description}</p>

                      {/* Tags */}
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {event.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div>
                          {event.registration_fee > 0 ? (
                            <span className="text-sm font-bold text-navy">₹{event.registration_fee}</span>
                          ) : (
                            <span className="text-sm font-bold text-green-600">FREE</span>
                          )}
                          {event.max_participants && (
                            <p className="text-[10px] text-slate-400">Max {event.max_participants} seats</p>
                          )}
                        </div>
                        {!isPast ? (
                          <Link href={`/events/${event.id}`}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                            style={{ background: '#1B3A6B' }}>
                            Register →
                          </Link>
                        ) : (
                          <span className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-400">
                            Ended
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Newsletter CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 rounded-2xl p-8 text-center"
            style={{ background: 'linear-gradient(135deg, #1B3A6B, #0f2545)' }}>
            <h2 className="text-2xl font-bold text-white font-heading mb-2">Never Miss an Event 🔔</h2>
            <p className="text-white/50 mb-6">Subscribe to get notified about upcoming hackathons, seminars & podcasts</p>
            <Link href="/#newsletter"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white"
              style={{ background: '#FF6B35' }}>
              Get Notified →
            </Link>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  )
}
