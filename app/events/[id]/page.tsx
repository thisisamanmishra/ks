'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Event {
  id: number
  title: string
  type: string
  description: string
  short_description: string
  featured_image: string | null
  event_date: string
  end_date: string | null
  venue: string | null
  is_online: boolean
  meeting_link: string | null
  max_participants: number | null
  prize_pool: string | null
  registration_fee: number
  status: string
  tags: string[]
  registrationCount: number
  creator: { fullname: string } | null
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  podcast: { icon: '🎙️', color: '#8B5CF6', bg: '#EDE9FE' },
  hackathon: { icon: '💻', color: '#FF6B35', bg: '#FFF0EB' },
  seminar: { icon: '🎓', color: '#10B981', bg: '#D1FAE5' },
  webinar: { icon: '🌐', color: '#3B82F6', bg: '#DBEAFE' },
  workshop: { icon: '🔧', color: '#F59E0B', bg: '#FEF3C7' },
  other: { icon: '🎉', color: '#6B7280', bg: '#F3F4F6' },
}

export default function EventDetailPage() {
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', team_name: '', team_members: '' })
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then(r => r.json())
      .then(d => { setEvent(d.event); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegistering(true)
    setError('')
    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event?.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      setRegistered(true)
    } catch { setError('Something went wrong') }
    finally { setRegistering(false) }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-surface pt-24 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
        <Footer />
      </>
    )
  }

  if (!event) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-surface pt-24 flex flex-col items-center justify-center">
          <span className="text-5xl mb-4">🔍</span>
          <h2 className="text-2xl font-bold text-navy font-heading mb-2">Event not found</h2>
          <Link href="/events" className="text-accent hover:underline">← Back to Events</Link>
        </div>
        <Footer />
      </>
    )
  }

  const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other
  const isPast = event.status === 'completed' || event.status === 'cancelled'
  const spotsLeft = event.max_participants ? event.max_participants - event.registrationCount : null
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-20">
        {/* Hero */}
        <div className="py-16 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0f2545 100%)' }}>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <Link href="/events" className="inline-flex items-center gap-1 text-white/40 text-sm hover:text-white/70 transition-colors mb-6">
              ← Back to Events
            </Link>
            <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl mb-5 shadow-2xl"
              style={{ background: cfg.bg }}>
              {cfg.icon}
            </div>
            <div className="flex justify-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                style={{ background: `${cfg.bg}`, color: cfg.color }}>
                {cfg.icon} {event.type}
              </span>
              {event.status === 'live' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 animate-pulse">🔴 LIVE NOW</span>
              )}
              {isPast && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Completed</span>
              )}
              {event.registration_fee === 0 && !isPast && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">FREE</span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white font-heading mb-4">{event.title}</h1>
            <p className="text-white/60 max-w-2xl mx-auto">{event.short_description}</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="font-bold text-navy text-xl font-heading mb-4">About This Event</h2>
                {event.description ? (
                  <div className="text-slate-600 text-sm leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.description }} />
                ) : (
                  <p className="text-slate-500 text-sm">{event.short_description}</p>
                )}
              </div>

              {/* Prize pool (hackathon) */}
              {event.prize_pool && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                  <h2 className="font-bold text-navy text-lg font-heading mb-3">🏆 Prize Pool</h2>
                  <p className="text-3xl font-extrabold text-accent font-heading">{event.prize_pool}</p>
                  <p className="text-slate-500 text-sm mt-1">Multiple prizes across different categories</p>
                </div>
              )}

              {/* Tags */}
              {event.tags.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h2 className="font-bold text-navy text-base font-heading mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Event details card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-sm flex-shrink-0">📅</div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Date</p>
                      <p className="text-sm font-semibold text-navy">{formatDate(event.event_date)}</p>
                      <p className="text-xs text-slate-500">{formatTime(event.event_date)}{event.end_date && ` – ${formatTime(event.end_date)}`}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-sm flex-shrink-0">
                      {event.is_online ? '🌐' : '📍'}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">{event.is_online ? 'Platform' : 'Venue'}</p>
                      <p className="text-sm font-semibold text-navy">
                        {event.venue || (event.is_online ? 'Online / Virtual' : 'TBD')}
                      </p>
                    </div>
                  </div>

                  {event.max_participants && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-sm flex-shrink-0">👥</div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Capacity</p>
                        <p className="text-sm font-semibold text-navy">{event.registrationCount} / {event.max_participants} registered</p>
                        {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 30 && (
                          <p className="text-xs text-red-500 font-medium">⚡ Only {spotsLeft} spots left!</p>
                        )}
                        {spotsLeft !== null && spotsLeft <= 0 && (
                          <p className="text-xs text-red-600 font-bold">🔴 Event Full</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-sm flex-shrink-0">💰</div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Registration Fee</p>
                      <p className="text-sm font-bold text-navy">
                        {event.registration_fee > 0 ? `₹${event.registration_fee}` : 'FREE'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {event.max_participants && (
                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Registrations</span>
                      <span>{Math.round((event.registrationCount / event.max_participants) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((event.registrationCount / event.max_participants) * 100, 100)}%` }}
                        className="h-full rounded-full"
                        style={{ background: '#FF6B35' }}
                      />
                    </div>
                  </div>
                )}

                {/* CTA */}
                {!isPast && (spotsLeft === null || spotsLeft > 0) ? (
                  <button
                    onClick={() => setShowRegister(true)}
                    className="w-full py-4 rounded-xl font-bold text-white text-sm cursor-pointer"
                    style={{ background: '#FF6B35', boxShadow: '0 4px 20px rgba(255,107,53,0.3)' }}
                  >
                    🚀 Register Now {event.registration_fee > 0 ? `— ₹${event.registration_fee}` : '(Free)'}
                  </button>
                ) : isPast ? (
                  <button disabled className="w-full py-4 rounded-xl font-bold text-slate-400 bg-slate-100 text-sm">
                    Event Ended
                  </button>
                ) : (
                  <button disabled className="w-full py-4 rounded-xl font-bold text-white text-sm bg-slate-400">
                    🔴 Event Full
                  </button>
                )}

                <p className="text-center text-xs text-slate-400 mt-3">
                  🔒 Secure registration · Registered by {event.registrationCount}+ people
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegister && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !registered && setShowRegister(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              {registered ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-navy font-heading mb-2">You&apos;re Registered!</h3>
                  <p className="text-slate-500 text-sm mb-2">Confirmation sent to <strong>{form.email}</strong></p>
                  <p className="text-slate-400 text-xs mb-6">We&apos;ll send you event details closer to the date.</p>
                  <button onClick={() => setShowRegister(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer"
                    style={{ background: '#1B3A6B' }}>
                    Done ✓
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-navy font-heading text-lg">📝 Register for Event</h3>
                    <button onClick={() => setShowRegister(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-xl">✕</button>
                  </div>
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2 mb-5 font-medium">{event.title}</p>

                  {error && (
                    <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-xl text-sm mb-4">⚠️ {error}</div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-3">
                    {[
                      { key: 'name', label: 'Full Name *', type: 'text', req: true, placeholder: 'Your full name' },
                      { key: 'email', label: 'Email *', type: 'email', req: true, placeholder: 'you@example.com' },
                      { key: 'phone', label: 'Phone', type: 'tel', req: false, placeholder: '+91 XXXXX XXXXX' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder} required={f.req}
                          value={form[f.key as keyof typeof form]}
                          onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy" />
                      </div>
                    ))}

                    {/* Team fields for hackathon */}
                    {event.type === 'hackathon' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Team Name</label>
                          <input type="text" placeholder="Your team name"
                            value={form.team_name}
                            onChange={e => setForm(p => ({ ...p, team_name: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Team Members (names)</label>
                          <textarea placeholder="Member 1, Member 2..."
                            value={form.team_members}
                            onChange={e => setForm(p => ({ ...p, team_members: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy resize-none" />
                        </div>
                      </>
                    )}

                    <button type="submit" disabled={registering}
                      className="w-full py-3 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60 mt-2"
                      style={{ background: '#FF6B35' }}>
                      {registering ? '⏳ Registering...' : `🚀 Confirm Registration${event.registration_fee > 0 ? ` — ₹${event.registration_fee}` : ''}`}
                    </button>
                    {event.registration_fee > 0 && (
                      <p className="text-xs text-slate-400 text-center">Payment link will be sent to your email after registration</p>
                    )}
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  )
}
