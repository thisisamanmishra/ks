'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface HackathonEvent {
  id: number
  title: string
  short_description: string
  event_date: string
  end_date: string | null
  registration_fee: number
  prize_pool: string | null
  max_participants: number | null
  status: string
  tags: string[]
  is_online: boolean
  venue: string | null
}

function Countdown({ date, label = 'Starts' }: { date: string; label?: string }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const calc = () => {
      const diff = new Date(date).getTime() - Date.now()
      if (diff <= 0) { setExpired(true); return }
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [date])

  if (expired) return <span className="text-red-400 text-xs font-bold">Event ended</span>

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-white/40 mr-1">{label} in</span>
      {[['d', time.d], ['h', time.h], ['m', time.m], ['s', time.s]].map(([unit, val]) => (
        <div key={unit as string} className="text-center">
          <div className="px-1.5 py-0.5 rounded font-mono font-bold text-xs text-white min-w-[28px] text-center" style={{ background: 'rgba(255,107,53,0.2)', border: '1px solid rgba(255,107,53,0.3)' }}>
            {String(val).padStart(2, '0')}
          </div>
          <div className="text-[8px] text-white/30 mt-0.5">{unit}</div>
        </div>
      ))}
    </div>
  )
}

// Animated code grid background
function CodeGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.04]">
      <div className="absolute inset-0" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(255,107,53,0.5) 30px, rgba(255,107,53,0.5) 31px),
                          repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255,107,53,0.5) 30px, rgba(255,107,53,0.5) 31px)`
      }} />
    </div>
  )
}

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<HackathonEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const fetchHackathons = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/events?type=hackathon&limit=100')
      const data = await res.json()
      setHackathons(data.events || [])
    } catch { setHackathons([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchHackathons() }, [fetchHackathons])

  const filtered = hackathons.filter(h => {
    if (filter === 'upcoming' && (h.status === 'completed' || h.status === 'cancelled')) return false
    if (filter === 'completed' && h.status !== 'completed') return false
    if (search && !h.title.toLowerCase().includes(search.toLowerCase()) &&
        !h.short_description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const featured = hackathons.find(h => h.status === 'upcoming' && h.prize_pool) || hackathons.find(h => h.status === 'upcoming')
  const totalPrize = hackathons.filter(h => h.status === 'upcoming').reduce((acc, h) => {
    if (!h.prize_pool) return acc
    const match = h.prize_pool.match(/[\d,]+/)
    if (match) return acc + parseInt(match[0].replace(/,/g, ''))
    return acc
  }, 0)
  const upcomingCount = hackathons.filter(h => h.status === 'upcoming').length
  const completedCount = hackathons.filter(h => h.status === 'completed').length

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20" style={{ background: '#0a0f1e' }}>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1200 50%, #2d1500 100%)' }}>
          <CodeGrid />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #FF6B35, transparent)' }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #FF9500, transparent)' }} />

          <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6"
                style={{ background: 'rgba(255,107,53,0.15)', color: '#FCA572', border: '1px solid rgba(255,107,53,0.3)' }}>
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                💻 Karya Saarthi Hackathons
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white font-heading mb-5 leading-tight">
                Build, Compete<br />& <span style={{ color: '#FF6B35', textShadow: '0 0 40px rgba(255,107,53,0.4)' }}>Win Big</span>
              </h1>
              <p className="text-white/40 text-xl max-w-2xl mx-auto">
                India&apos;s most challenging hackathons — compete, innovate, and take home exciting prizes
              </p>
            </motion.div>

            {/* Stats bar */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
              {[
                { icon: '💻', n: hackathons.length, label: 'Total Hackathons' },
                { icon: '🚀', n: upcomingCount, label: 'Upcoming' },
                { icon: '✅', n: completedCount, label: 'Completed' },
                { icon: '🏆', n: totalPrize > 0 ? `₹${(totalPrize / 1000).toFixed(0)}K+` : 'TBA', label: 'Prize Pool' },
              ].map(s => (
                <div key={s.label} className="text-center p-4 rounded-2xl" style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.15)' }}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-xl font-extrabold text-white">{s.n}</div>
                  <div className="text-xs text-white/30">{s.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Featured hackathon banner */}
            {featured && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                className="max-w-4xl mx-auto rounded-3xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,149,0,0.08))', border: '1px solid rgba(255,107,53,0.25)' }}>
                <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl flex-shrink-0"
                    style={{ background: 'rgba(255,107,53,0.15)' }}>💻</div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,107,53,0.2)', color: '#FF6B35' }}>⭐ Featured Hackathon</span>
                      {featured.registration_fee === 0 && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400">FREE ENTRY</span>}
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-white font-heading mb-1">{featured.title}</h2>
                    <p className="text-white/40 text-sm mb-3 line-clamp-1">{featured.short_description}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <Countdown date={featured.event_date} />
                      {featured.prize_pool && (
                        <span className="text-xs text-orange-400 font-bold">🏆 {featured.prize_pool}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/events/${featured.id}`}
                    className="flex-shrink-0 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                    style={{ background: '#FF6B35', boxShadow: '0 8px 20px rgba(255,107,53,0.3)' }}>
                    Register Now →
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Filters & View toggle */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search hackathons, themes, problem statements..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
            </div>
            <div className="flex gap-2 items-center">
              {(['all', 'upcoming', 'completed'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize"
                  style={filter === f
                    ? { background: '#FF6B35', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
                  }>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
              <div className="w-px h-8 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <button onClick={() => setView('grid')} title="Grid View"
                className="p-2.5 rounded-xl text-sm transition-all cursor-pointer"
                style={view === 'grid' ? { background: '#FF6B35', color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                ⊞
              </button>
              <button onClick={() => setView('list')} title="List View"
                className="p-2.5 rounded-xl text-sm transition-all cursor-pointer"
                style={view === 'list' ? { background: '#FF6B35', color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                ☰
              </button>
            </div>
          </div>

          {!loading && <p className="text-white/20 text-xs mb-6">{filtered.length} hackathon{filtered.length !== 1 ? 's' : ''} found</p>}

          {loading ? (
            <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <span className="text-6xl block mb-4">💻</span>
              <p className="text-white/40 text-lg font-semibold mb-2">No hackathons found</p>
              <p className="text-white/20 text-sm mb-6">Try adjusting your search or filter</p>
              <button onClick={() => { setFilter('all'); setSearch('') }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer" style={{ background: '#FF6B35' }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={`${filter}-${view}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {filtered.map((h, i) => {
                  const isPast = h.status === 'completed' || h.status === 'cancelled'
                  const isUpcoming = h.status === 'upcoming'
                  const daysLeft = Math.ceil((new Date(h.event_date).getTime() - Date.now()) / 86400000)

                  return (
                    <motion.div key={h.id}
                      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className={`group rounded-2xl overflow-hidden flex transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${view === 'list' ? 'flex-row' : 'flex-col'}`}
                      style={{
                        background: isPast ? 'rgba(255,255,255,0.04)' : 'rgba(255,107,53,0.06)',
                        border: isPast ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,107,53,0.2)',
                      }}>

                      {/* Accent strip */}
                      <div className={`${view === 'list' ? 'w-1 flex-shrink-0' : 'h-1'} rounded-t-2xl`}
                        style={{ background: isPast ? '#64748b' : 'linear-gradient(90deg, #FF6B35, #FF9500)' }} />

                      {/* Card header (grid only) */}
                      {view === 'grid' && (
                        <div className="relative h-40 flex items-center justify-center overflow-hidden"
                          style={{ background: isPast ? 'linear-gradient(135deg, #1a1a1a, #2a2a2a)' : 'linear-gradient(135deg, #1a0800, #2d1500)' }}>
                          <CodeGrid />
                          <span className="text-6xl relative z-10">💻</span>

                          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                            {isPast ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-700/80 text-slate-300">Ended</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,107,53,0.3)', color: '#FF6B35' }}>💻 Hackathon</span>
                            )}
                          </div>
                          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                            {h.prize_pool && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: '#FF6B35' }}>🏆 {h.prize_pool}</span>}
                            {h.registration_fee === 0 && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500 text-white">FREE</span>}
                          </div>
                          {isUpcoming && daysLeft > 0 && daysLeft <= 14 && (
                            <div className="absolute bottom-0 left-0 right-0 text-center py-1.5 text-[10px] font-bold text-white/80" style={{ background: 'rgba(255,107,53,0.5)', backdropFilter: 'blur(4px)' }}>
                              ⏰ {daysLeft} days left
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card body */}
                      <div className="p-6 flex flex-col flex-1">
                        {view === 'list' && (
                          <div className="flex items-center gap-2 mb-2">
                            {isPast ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/80 text-slate-300">Ended</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,107,53,0.2)', color: '#FF6B35' }}>💻 Hackathon</span>
                            )}
                            {h.registration_fee === 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-600">FREE</span>}
                            {h.is_online && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/20 text-blue-400">🌐 Online</span>}
                          </div>
                        )}

                        <h3 className="font-bold text-white text-lg font-heading mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                          {h.title}
                        </h3>
                        <p className="text-white/40 text-sm mb-4 line-clamp-2 flex-1">{h.short_description}</p>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,107,53,0.08)' }}>
                            <p className="text-xs font-bold text-orange-400">{h.prize_pool || 'TBA'}</p>
                            <p className="text-[10px] text-white/30">Prize Pool</p>
                          </div>
                          <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <p className="text-xs font-bold text-white">{h.max_participants ?? '∞'}</p>
                            <p className="text-[10px] text-white/30">Max Seats</p>
                          </div>
                          <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <p className="text-xs font-bold text-white">{h.registration_fee > 0 ? `₹${h.registration_fee}` : 'FREE'}</p>
                            <p className="text-[10px] text-white/30">Entry</p>
                          </div>
                        </div>

                        {/* Date info */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-white/30 mb-4">
                          <span>📅 {formatDate(h.event_date)}</span>
                          {h.end_date && <span>→ {formatDate(h.end_date)}</span>}
                          {h.venue && <span>📍 {h.venue}</span>}
                          {!h.venue && <span className="text-green-400">🌐 Online</span>}
                        </div>

                        {/* Countdown */}
                        {isUpcoming && (
                          <div className="mb-4">
                            <Countdown date={h.event_date} />
                          </div>
                        )}

                        {h.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {h.tags.map(t => (
                              <span key={t} className="px-2 py-0.5 rounded-full text-[10px] text-orange-400" style={{ background: 'rgba(255,107,53,0.1)' }}>#{t}</span>
                            ))}
                          </div>
                        )}

                        {!isPast ? (
                          <Link href={`/events/${h.id}`}
                            className="mt-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                            style={{ background: '#FF6B35', boxShadow: '0 4px 16px rgba(255,107,53,0.3)' }}>
                            Register Now →
                          </Link>
                        ) : (
                          <div className="mt-auto flex gap-2">
                            <Link href={`/events/${h.id}`}
                              className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold border text-white/40 transition-all hover:text-white/60"
                              style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                              View Results
                            </Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Host a hackathon CTA */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl p-8 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #e85520 100%)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-2xl opacity-20" style={{ background: '#fff' }} />
              <div className="relative z-10">
                <div className="text-4xl mb-4">💻</div>
                <h3 className="text-2xl font-extrabold text-white font-heading mb-2">Host a Hackathon</h3>
                <p className="text-white/70 text-sm mb-6">Partner with Karya Saarthi to run your hackathon and reach thousands of developers</p>
                <Link href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-orange-600 transition-all hover:opacity-90"
                  style={{ background: '#fff' }}>
                  Partner with Us →
                </Link>
              </div>
            </div>

            <div className="rounded-3xl p-8 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1a1200, #2d1a00)', border: '1px solid rgba(255,107,53,0.2)' }}>
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full blur-2xl opacity-10" style={{ background: '#FF6B35' }} />
              <div className="relative z-10">
                <div className="text-4xl mb-4">🔔</div>
                <h3 className="text-2xl font-extrabold text-white font-heading mb-2">Stay Updated</h3>
                <p className="text-white/40 text-sm mb-6">Get notified when new hackathons are announced — never miss registration deadlines</p>
                <Link href="/#newsletter"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: '#FF6B35', boxShadow: '0 4px 16px rgba(255,107,53,0.3)' }}>
                  Notify Me →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  )
}
