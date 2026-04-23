'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Event {
  id: number
  title: string
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

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string; grad: string }> = {
  podcast:   { icon: '🎙️', label: 'Podcast',   color: '#8B5CF6', bg: '#EDE9FE', grad: 'from-violet-600 to-purple-800' },
  hackathon: { icon: '💻', label: 'Hackathon', color: '#FF6B35', bg: '#FFF0EB', grad: 'from-orange-500 to-red-700' },
  seminar:   { icon: '🎓', label: 'Seminar',   color: '#10B981', bg: '#D1FAE5', grad: 'from-emerald-500 to-teal-700' },
  webinar:   { icon: '🌐', label: 'Webinar',   color: '#3B82F6', bg: '#DBEAFE', grad: 'from-blue-500 to-indigo-700' },
  workshop:  { icon: '🔧', label: 'Workshop',  color: '#F59E0B', bg: '#FEF3C7', grad: 'from-amber-500 to-orange-700' },
  other:     { icon: '🎉', label: 'Event',     color: '#6B7280', bg: '#F3F4F6', grad: 'from-slate-500 to-slate-700' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  upcoming:  { label: 'Upcoming',  color: '#3B82F6', bg: '#DBEAFE' },
  live:      { label: '🔴 Live',   color: '#EF4444', bg: '#FEE2E2' },
  completed: { label: 'Completed', color: '#6B7280', bg: '#F3F4F6' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' },
}

const TYPES = ['all', 'podcast', 'hackathon', 'seminar', 'webinar', 'workshop'] as const
type EventType = typeof TYPES[number]

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)

export default function EventsClient({ initialEvents }: { initialEvents: Event[] }) {
  const [typeFilter, setTypeFilter] = useState<EventType>('all')
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'live' | 'completed' | 'all'>('upcoming')
  const [search, setSearch] = useState('')

  // Read initial type from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = new URLSearchParams(window.location.search).get('type') as EventType
      if (t && TYPES.includes(t)) setTypeFilter(t)
    }
  }, [])

  // Memoize filtered events to prevent re-computing on every render
  const events = useMemo(() => {
    let filtered = initialEvents
    if (typeFilter !== 'all') filtered = filtered.filter(e => e.type === typeFilter)
    if (statusFilter !== 'all') filtered = filtered.filter(e => e.status === statusFilter)
    if (search.trim()) filtered = filtered.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.short_description?.toLowerCase().includes(search.toLowerCase()))
    return filtered
  }, [initialEvents, typeFilter, statusFilter, search])

  const featured = useMemo(() =>
    initialEvents.find(e => e.status === 'upcoming' && e.prize_pool) || initialEvents.find(e => e.status === 'upcoming'),
    [initialEvents]
  )

  const typeCounts = useMemo(() =>
    TYPES.slice(1).map(t => ({ type: t, count: initialEvents.filter(e => e.type === t && e.status === 'upcoming').length })),
    [initialEvents]
  )

  return (
    <div className="min-h-screen bg-slate-50 pt-20">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1B3A6B 60%, #1e3a5f 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FF6B35, transparent)' }} />
        <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-4"
              style={{ background: 'rgba(255,107,53,0.2)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.3)' }}>
              📅 Events &amp; Programs
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white font-heading mb-4">
              Learn, Compete &amp; <span style={{ color: '#FF6B35' }}>Grow</span>
            </h1>
            <p className="text-white/50 max-w-2xl mx-auto text-lg">
              Podcasts, hackathons, seminars, webinars &amp; workshops — curated for your success
            </p>
          </motion.div>

          {/* Category shortcuts */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="grid grid-cols-3 md:grid-cols-5 gap-3 max-w-3xl mx-auto mb-8">
            {typeCounts.map(({ type, count }) => {
              const cfg = TYPE_CONFIG[type]
              return (
                <button key={type} onClick={() => { setTypeFilter(type as EventType); setStatusFilter('upcoming') }}
                  className={`rounded-2xl p-3 text-center cursor-pointer transition-all border-2 ${typeFilter === type ? 'border-white/60 scale-105' : 'border-white/10 hover:border-white/30'}`}
                  style={{ background: typeFilter === type ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)' }}>
                  <div className="text-2xl mb-1">{cfg.icon}</div>
                  <div className="text-white text-xs font-semibold">{cfg.label}</div>
                  <div className="text-white/40 text-[10px]">{count} upcoming</div>
                </button>
              )
            })}
          </motion.div>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="max-w-lg mx-auto relative">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events, hackathons, podcasts..."
              className="w-full px-5 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-white/50 text-sm backdrop-blur-sm" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Featured event */}
        {featured && typeFilter === 'all' && statusFilter === 'upcoming' && !search && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-10 rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0f2545 100%)' }}>
            <div className="p-8 md:flex items-center gap-8">
              <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center text-6xl mb-4 md:mb-0"
                style={{ background: TYPE_CONFIG[featured.type]?.bg || '#F3F4F6' }}>
                {TYPE_CONFIG[featured.type]?.icon || '🎉'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(255,107,53,0.2)', color: '#FF6B35' }}>⭐ Featured Event</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                    style={{ background: TYPE_CONFIG[featured.type]?.bg, color: TYPE_CONFIG[featured.type]?.color }}>
                    {TYPE_CONFIG[featured.type]?.label}
                  </span>
                  {featured.registration_fee === 0 && <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">FREE</span>}
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white font-heading mb-2 line-clamp-2">{featured.title}</h2>
                <p className="text-white/50 text-sm mb-4 line-clamp-2">{featured.short_description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-white/40 mb-5">
                  <span>📅 {fmt(featured.event_date)}</span>
                  {featured.prize_pool && <span>🏆 {featured.prize_pool}</span>}
                  {featured.venue && <span>📍 {featured.venue}</span>}
                  {!featured.venue && <span className="text-green-400">🌐 Online</span>}
                </div>
                <div className="flex gap-3">
                  <Link href={`/events/${featured.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                    style={{ background: '#FF6B35' }}>
                    🚀 Register Now {featured.registration_fee > 0 ? `— ₹${featured.registration_fee}` : '(Free)'}
                  </Link>
                  <Link href={`/events/${featured.id}`}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-white/60 text-sm hover:text-white transition-colors">
                    Learn More →
                  </Link>
                </div>
              </div>
              {daysUntil(featured.event_date) > 0 && (
                <div className="hidden md:flex flex-col items-center flex-shrink-0 text-center">
                  <div className="text-5xl font-extrabold text-white font-heading">{daysUntil(featured.event_date)}</div>
                  <div className="text-white/40 text-xs font-semibold tracking-wide uppercase">Days Left</div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <div className="flex gap-2 flex-wrap">
            {TYPES.map(t => {
              const cfg = t === 'all' ? { icon: '🏷️', label: 'All Types' } : TYPE_CONFIG[t]
              return (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer capitalize ${typeFilter === t ? 'text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-navy'}`}
                  style={typeFilter === t ? { background: t === 'all' ? '#1B3A6B' : TYPE_CONFIG[t]?.color } : {}}>
                  {cfg.icon} {cfg.label}
                </button>
              )
            })}
          </div>
          <div className="ml-auto flex gap-2">
            {(['upcoming', 'live', 'completed', 'all'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${statusFilter === s ? 'bg-navy text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-navy'}`}>
                {s === 'all' ? 'All Status' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        {initialEvents.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {[
              { label: 'Upcoming', n: initialEvents.filter(e => e.status === 'upcoming').length, icon: '📅', c: '#3B82F6' },
              { label: 'Live Now', n: initialEvents.filter(e => e.status === 'live').length, icon: '🔴', c: '#EF4444' },
              { label: 'Free Events', n: initialEvents.filter(e => e.registration_fee === 0 && e.status === 'upcoming').length, icon: '🎁', c: '#10B981' },
              { label: 'Online', n: initialEvents.filter(e => e.is_online && e.status === 'upcoming').length, icon: '🌐', c: '#8B5CF6' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${s.c}15` }}>{s.icon}</div>
                <div>
                  <p className="text-xl font-extrabold" style={{ color: s.c }}>{s.n}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Event Grid */}
        {events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-5xl block mb-4">🗓️</span>
            <p className="text-slate-500 font-semibold mb-1">No events found</p>
            <p className="text-slate-400 text-sm">Try adjusting your filters or search term</p>
            <button onClick={() => { setTypeFilter('all'); setStatusFilter('upcoming'); setSearch('') }}
              className="mt-6 px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer" style={{ background: '#1B3A6B' }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${typeFilter}-${statusFilter}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, i) => {
                const typeCfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other
                const statusCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.upcoming
                const isPast = event.status === 'completed' || event.status === 'cancelled'
                const days = daysUntil(event.event_date)

                return (
                  <motion.div key={event.id} initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">

                    {/* Card header */}
                    <div className={`h-44 flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${typeCfg.grad}`}>
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                      <span className="text-6xl drop-shadow-lg">{typeCfg.icon}</span>

                      {/* Top-left badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white border border-white/20 capitalize">
                          {typeCfg.label}
                        </span>
                        {event.status === 'live' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">🔴 LIVE</span>
                        )}
                      </div>

                      {/* Top-right */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                        {event.prize_pool && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: '#FF6B35' }}>🏆 {event.prize_pool}</span>
                        )}
                        {event.registration_fee === 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500 text-white">FREE</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white border border-white/20">₹{event.registration_fee}</span>
                        )}
                      </div>

                      {/* Countdown ribbon */}
                      {!isPast && days > 0 && days <= 30 && (
                        <div className="absolute bottom-0 left-0 right-0 text-center py-1.5 text-[10px] font-bold text-white/80 bg-black/30 backdrop-blur-sm">
                          ⏰ {days} {days === 1 ? 'day' : 'days'} left
                        </div>
                      )}
                      {!isPast && days === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 text-center py-1.5 text-[10px] font-bold text-white bg-red-500/70 backdrop-blur-sm animate-pulse">
                          🔴 Happening Today!
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      {/* Date + location */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                        <span>📅 {fmt(event.event_date)}</span>
                        <span>🕐 {fmtTime(event.event_date)}</span>
                      </div>
                      {event.venue ? (
                        <p className="text-xs text-slate-400 mb-2">📍 {event.venue}</p>
                      ) : (
                        <p className="text-xs text-green-500 mb-2">🌐 Online Event</p>
                      )}

                      <h3 className="font-bold text-navy text-sm font-heading mb-2 line-clamp-2 group-hover:text-accent transition-colors flex-1">
                        {event.title}
                      </h3>
                      <p className="text-slate-400 text-xs mb-3 line-clamp-2">{event.short_description}</p>

                      {/* Tags */}
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {event.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500">#{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                        <div>
                          {event.max_participants && (
                            <p className="text-[10px] text-slate-400">👥 Max {event.max_participants} seats</p>
                          )}
                          <span className={`text-sm font-bold ${event.registration_fee === 0 ? 'text-green-600' : 'text-navy'}`}>
                            {event.registration_fee === 0 ? 'FREE' : `₹${event.registration_fee}`}
                          </span>
                        </div>
                        {!isPast ? (
                          <Link href={`/events/${event.id}`}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                            style={{ background: typeCfg.color }}>
                            Register →
                          </Link>
                        ) : (
                          <span className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-400">Ended</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Category landing links */}
        {typeFilter === 'all' && !search && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: '/podcasts', icon: '🎙️', label: 'All Podcasts', desc: 'Expert conversations & industry insights', color: '#8B5CF6' },
              { href: '/hackathons', icon: '💻', label: 'All Hackathons', desc: 'Compete, build & win exciting prizes', color: '#FF6B35' },
              { href: '/events?type=seminar', icon: '🎓', label: 'Seminars & Webinars', desc: 'Knowledge sessions with industry leaders', color: '#10B981' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="rounded-2xl p-6 flex items-center gap-4 border-2 border-transparent hover:border-current transition-all group"
                style={{ background: `${item.color}10`, color: item.color }}>
                <span className="text-4xl">{item.icon}</span>
                <div>
                  <p className="font-bold text-navy group-hover:text-current transition-colors">{item.label}</p>
                  <p className="text-slate-400 text-xs">{item.desc}</p>
                </div>
                <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
            ))}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-14 rounded-3xl p-10 text-center"
          style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0f2545 100%)' }}>
          <h2 className="text-3xl font-extrabold text-white font-heading mb-3">🔔 Never Miss an Event</h2>
          <p className="text-white/50 mb-7 max-w-md mx-auto">Subscribe to get notified about upcoming hackathons, seminars &amp; podcasts directly in your inbox</p>
          <Link href="/#newsletter"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-all"
            style={{ background: '#FF6B35', boxShadow: '0 8px 24px rgba(255,107,53,0.35)' }}>
            Get Notified →
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
