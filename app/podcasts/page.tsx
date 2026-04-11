'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface PodcastEvent {
  id: number
  title: string
  short_description: string
  event_date: string
  registration_fee: number
  status: string
  tags: string[]
  meeting_link: string | null
  guest_name: string | null
  audio_url: string | null
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; pulse?: boolean }> = {
  upcoming:  { label: 'Upcoming',  color: '#3B82F6', bg: '#DBEAFE' },
  live:      { label: '🔴 Live Now', color: '#EF4444', bg: '#FEE2E2', pulse: true },
  completed: { label: 'Completed', color: '#6B7280', bg: '#F3F4F6' },
}

function daysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

function CountdownBadge({ date }: { date: string }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const calc = () => {
      const diff = new Date(date).getTime() - Date.now()
      if (diff <= 0) return setTime({ d: 0, h: 0, m: 0, s: 0 })
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTime({ d, h, m, s })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [date])

  const dl = daysLeft(date)
  if (dl > 30) return null
  if (dl <= 0) return (
    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">🔴 Today!</span>
  )
  if (dl > 1) return (
    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">⏱ {dl}d left</span>
  )
  return (
    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 tabular-nums">
      ⏰ {String(time.h).padStart(2,'0')}:{String(time.m).padStart(2,'0')}:{String(time.s).padStart(2,'0')}
    </span>
  )
}

// Animated soundwave bars
function SoundWave({ active = true, color = '#ffffff' }: { active?: boolean; color?: string }) {
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 32 }}>
      {[4, 7, 12, 18, 14, 10, 16, 8, 13, 6, 15, 11, 9, 17, 7].map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: color, height: h, opacity: active ? 1 : 0.3 }}
          animate={active ? { height: [h, h * 1.8, h * 0.5, h * 1.4, h] } : {}}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<PodcastEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all')
  const [search, setSearch] = useState('')
  const [playingId, setPlayingId] = useState<number | null>(null)

  const fetchPodcasts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/events?type=podcast&limit=100')
      const data = await res.json()
      setPodcasts(data.events || [])
    } catch { setPodcasts([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPodcasts() }, [fetchPodcasts])

  const filtered = podcasts.filter(ep => {
    if (filter !== 'all' && ep.status !== filter) return false
    if (search && !ep.title.toLowerCase().includes(search.toLowerCase()) &&
        !ep.short_description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const featured = podcasts.find(ep => ep.status === 'live') || podcasts.find(ep => ep.status === 'upcoming')
  const liveCount = podcasts.filter(ep => ep.status === 'live').length
  const upcomingCount = podcasts.filter(ep => ep.status === 'upcoming').length
  const totalEpisodes = podcasts.length

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20" style={{ background: '#0f0a1e' }}>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden py-20" style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a38 40%, #2D1B69 100%)' }}>
          {/* Animated gradient orbs */}
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, #FF6B35, transparent)' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />

          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="flex-1 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6"
                  style={{ background: 'rgba(139,92,246,0.2)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  🎙️ Karya Saarthi Podcasts
                </span>
                <h1 className="text-5xl md:text-6xl font-extrabold text-white font-heading mb-4 leading-tight">
                  Listen, Learn<br />& <span style={{ color: '#A78BFA' }}>Grow</span>
                </h1>
                <p className="text-white/50 text-lg max-w-lg mb-8">
                  Expert conversations, industry insights, and inspiring stories — curated for ambitious professionals
                </p>

                {/* Stats */}
                <div className="flex gap-6 justify-center lg:justify-start mb-8">
                  {[
                    { n: totalEpisodes, label: 'Total Episodes' },
                    { n: upcomingCount, label: 'Upcoming' },
                    { n: liveCount, label: 'Live Now' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-2xl font-extrabold text-white">{s.n}</p>
                      <p className="text-white/40 text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Soundwave animation */}
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <SoundWave active={liveCount > 0} color="#A78BFA" />
                  <span className="text-purple-300 text-xs font-medium">
                    {liveCount > 0 ? '🔴 Live right now!' : 'Stay tuned for upcoming episodes'}
                  </span>
                </div>
              </motion.div>

              {/* Featured episode */}
              {featured && (
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="w-full lg:w-96 rounded-3xl p-6 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(45,27,105,0.4))', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-2xl opacity-20" style={{ background: '#8B5CF6' }} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      {featured.status === 'live' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">🔴 LIVE NOW</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-300">⭐ Featured</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">{featured.title}</h3>
                    <p className="text-white/50 text-sm mb-4 line-clamp-2">{featured.short_description}</p>
                    <p className="text-purple-300 text-xs mb-5">📅 {new Date(featured.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <SoundWave active={featured.status === 'live'} color="#C4B5FD" />

                    <div className="flex gap-2 mt-5">
                      {featured.meeting_link && (
                        <a href={featured.meeting_link} target="_blank" rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer hover:opacity-90 transition-all"
                          style={{ background: '#8B5CF6' }}>
                          🎧 {featured.status === 'live' ? 'Join Live' : 'Listen Now'}
                        </a>
                      )}
                      <Link href={`/events/${featured.id}`}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-all">
                        Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Search + Filter bar */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search episodes, guests, topics..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'upcoming', 'live', 'completed'] as const).map(s => {
                const cfg = s === 'all' ? { label: 'All Episodes', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' }
                  : s === 'live' ? { label: '🔴 Live', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' }
                  : s === 'upcoming' ? { label: 'Upcoming', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' }
                  : { label: 'Completed', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' }
                return (
                  <button key={s} onClick={() => setFilter(s)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    style={filter === s
                      ? { background: cfg.color, color: '#fff' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                    }>
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Results count */}
          {!loading && (
            <p className="text-white/30 text-xs mb-5">{filtered.length} episode{filtered.length !== 1 ? 's' : ''} found</p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <span className="text-6xl block mb-4">🎙️</span>
              <p className="text-white/40 text-lg font-semibold mb-2">No episodes found</p>
              <p className="text-white/20 text-sm mb-6">Try adjusting your search or filter</p>
              <button onClick={() => { setFilter('all'); setSearch('') }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer"
                style={{ background: '#8B5CF6' }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={filter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((ep, i) => {
                  const sc = STATUS_CFG[ep.status] || STATUS_CFG.upcoming
                  const isLive = ep.status === 'live'
                  const isUpcoming = ep.status === 'upcoming'
                  const isPlaying = playingId === ep.id

                  return (
                    <motion.div key={ep.id}
                      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                      style={{ background: 'rgba(255,255,255,0.05)', border: isLive ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>

                      {/* Card visual header */}
                      <div className="relative h-40 flex items-center justify-center overflow-hidden"
                        style={{ background: isLive ? 'linear-gradient(135deg, #3B0E1E, #7C1D3A)' : 'linear-gradient(135deg, #1a0a38, #2D1B69)' }}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                        {/* Play overlay */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          style={{ background: 'rgba(0,0,0,0.3)' }}>
                          <button type="button" onClick={() => setPlayingId(isPlaying ? null : ep.id)}
                            className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-transform hover:scale-110"
                            style={{ background: '#8B5CF6' }}>
                            {isPlaying ? (
                              <span className="text-white text-lg">⏸</span>
                            ) : (
                              <span className="text-white text-xl ml-1">▶</span>
                            )}
                          </button>
                        </div>

                        {/* Soundwave (visible when playing or live) */}
                        <div className={`transition-opacity ${isPlaying || isLive ? 'opacity-100' : 'opacity-100 group-hover:opacity-0'}`}>
                          <SoundWave active={isPlaying || isLive} color={isLive ? '#FCA5A5' : '#A78BFA'} />
                        </div>

                        {/* Top badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                            style={{ background: sc.bg + '33', color: sc.color, border: `1px solid ${sc.color}44` }}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                          {ep.registration_fee === 0 && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-600 text-white">FREE</span>
                          )}
                          {isUpcoming && <CountdownBadge date={ep.event_date} />}
                        </div>

                        {/* Episode number (from title if present) */}
                        {ep.title.match(/^EP\d+/i) && (
                          <div className="absolute bottom-3 left-3 text-white/40 text-xs font-bold tracking-widest">
                            {ep.title.match(/^(EP\d+)/i)?.[1]}
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-5 flex flex-col flex-1">
                        <p className="text-purple-400 text-xs font-semibold mb-1.5">
                          📅 {new Date(ep.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <h3 className="font-bold text-white text-sm font-heading mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors flex-1">
                          {ep.title}
                        </h3>
                        {ep.guest_name && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold">{ep.guest_name.charAt(0)}</span>
                            <span className="text-purple-300 text-xs font-medium">{ep.guest_name}</span>
                          </div>
                        )}
                        <p className="text-white/40 text-xs mb-4 line-clamp-2">{ep.short_description}</p>

                        {ep.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {ep.tags.slice(0, 3).map(t => (
                              <span key={t} className="px-2 py-0.5 rounded-full text-[10px] text-purple-400" style={{ background: 'rgba(139,92,246,0.15)' }}>#{t}</span>
                            ))}
                          </div>
                        )}

                        {isPlaying && ep.audio_url && (
                          <div className="mt-auto mb-4">
                            <audio controls autoPlay src={ep.audio_url} className="w-full h-10 rounded shadow-md" style={{ background: '#f1f3f4' }} />
                          </div>
                        )}

                        <div className="flex gap-2 mt-auto">
                          {ep.meeting_link && !ep.audio_url ? (
                            <a href={ep.meeting_link} target="_blank" rel="noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:opacity-90"
                              style={{ background: '#8B5CF6' }}>
                              🎧 {isLive ? 'Join Live' : 'Listen'}
                            </a>
                          ) : ep.audio_url ? (
                             <button type="button" onClick={() => setPlayingId(isPlaying ? null : ep.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                              style={{ background: isPlaying ? '#EF4444' : '#8B5CF6' }}>
                              {isPlaying ? '⏸ Stop' : '▶ Play Episode'}
                             </button>
                          ) : (
                            <Link href={`/events/${ep.id}`}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                              style={{ background: '#8B5CF6' }}>
                              View Episode
                            </Link>
                          )}
                          <Link href={`/events/${ep.id}`}
                            className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                            style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA' }}>
                            Info
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Subscribe CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-16 rounded-3xl p-10 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2D1B69 0%, #1a0a38 100%)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full blur-3xl opacity-20" style={{ background: '#8B5CF6' }} />
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <SoundWave active color="#A78BFA" />
              </div>
              <h2 className="text-3xl font-extrabold text-white font-heading mb-3">🔔 Never Miss an Episode</h2>
              <p className="text-white/40 mb-7 max-w-md mx-auto">Subscribe to get notified about new podcast episodes, live sessions, and exclusive content</p>
              <Link href="/#newsletter"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-all"
                style={{ background: '#8B5CF6', boxShadow: '0 8px 24px rgba(139,92,246,0.4)' }}>
                Subscribe Now →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  )
}
