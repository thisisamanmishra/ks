'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

// ─── Shared Wrapper for Widgets ────────────────────────────────────────────────
const WidgetWrapper = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow flex flex-col relative overflow-hidden"
  >
    {children}
  </motion.div>
)

// ─── 1. Podcast Widget ─────────────────────────────────────────────────────────
const PodcastWidget = () => {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    fetch('/api/widgets/frontend?type=podcast').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <WidgetWrapper><div className="animate-pulse h-48 bg-slate-100 rounded-xl" /></WidgetWrapper>

  return (
    <WidgetWrapper delay={0}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm">🎙️</span>
        <h3 className="font-bold text-navy">Latest Podcast</h3>
      </div>
      <div className="flex-1">
        <p className="text-xl font-bold text-navy font-heading leading-tight">{data.title}</p>
        <p className="text-sm text-slate-500 mt-2">Guest: <span className="font-semibold">{data.guest}</span></p>
        <p className="text-xs text-slate-400 mt-1">{new Date(data.date).toLocaleDateString('en-IN')}</p>
        {/* Mock Audio Visualizer UI since actual iframe might break hydration if not careful, but we can embed safely if needed. A stylized block is nice. */}
        <div className="my-4 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 gap-1 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
             <div key={i} className="w-1.5 bg-purple-200 rounded-full animate-pulse" style={{ height: `${Math.max(20, Math.random() * 100)}%`, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
      <div className="mt-auto pt-4 flex gap-2 border-t border-slate-50">
        <a href={data.listen_link} target="_blank" rel="noreferrer" className="flex-1 text-center py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy/90 transition-colors">Listen Full</a>
        <a href={data.subscribe_youtube} target="_blank" rel="noreferrer" className="flex-1 text-center py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">📺 Subscribe</a>
      </div>
    </WidgetWrapper>
  )
}

// ─── 2. Hackathon Widget ───────────────────────────────────────────────────────
const HackathonWidget = () => {
  const [event, setEvent] = useState<any>(null)
  // For countdown timer
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null)

  useEffect(() => {
    fetch('/api/events?type=hackathon&status=upcoming&limit=1')
      .then(r => r.json())
      .then(d => {
        if (d.events && d.events.length > 0) setEvent(d.events[0])
      })
  }, [])

  useEffect(() => {
    if (!event?.event_date) return
    const target = new Date(event.event_date).getTime()
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const diff = target - now
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); clearInterval(timer); return }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000)
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [event])

  if (!event) return <WidgetWrapper delay={0.1}><div className="animate-pulse h-48 bg-slate-100 rounded-xl" /></WidgetWrapper>

  return (
    <WidgetWrapper delay={0.1}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full opacity-5 -mr-10 -mt-10 blur-xl" />
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm">💻</span>
          <h3 className="font-bold text-navy">Hackathon</h3>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> LIVE
        </span>
      </div>
      <div className="flex-1 relative z-10">
        <h4 className="font-bold text-lg text-navy leading-tight">{event.title}</h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.short_description}</p>
        <div className="my-4 bg-orange-50 rounded-xl p-3 border border-orange-100 text-center">
          <p className="text-[10px] text-orange-600 font-bold uppercase">Prize Pool</p>
          <p className="text-lg font-extrabold text-orange-700">₹{event.prize_pool || '25,000'}</p>
        </div>
        {timeLeft && (
          <div className="flex items-center justify-center gap-2 text-center my-3">
            {[ { v: timeLeft.d, l: 'Days' }, { v: timeLeft.h, l: 'Hrs' }, { v: timeLeft.m, l: 'Min' }, { v: timeLeft.s, l: 'Sec' } ].map((t, i) => (
              <div key={i} className="flex flex-col">
                <span className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-lg font-bold text-navy border border-slate-100">{t.v.toString().padStart(2, '0')}</span>
                <span className="text-[9px] text-slate-400 mt-1 uppercase font-bold">{t.l}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Link href={`/events/${event.slug || event.id}`} className="block w-full text-center py-2.5 mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors relative z-10 shadow-lg shadow-orange-500/20">
        Register Now
      </Link>
    </WidgetWrapper>
  )
}

// ─── 3. Seminar / Events Widget ────────────────────────────────────────────────
const SeminarWidget = () => {
  const [event, setEvent] = useState<any>(null)

  useEffect(() => {
    fetch('/api/events?type=seminar&status=upcoming&limit=1')
      .then(r => r.json())
      .then(d => {
        if (d.events && d.events.length > 0) setEvent(d.events[0])
      })
  }, [])

  if (!event) return <WidgetWrapper delay={0.2}><div className="animate-pulse h-48 bg-slate-100 rounded-xl" /></WidgetWrapper>

  return (
    <WidgetWrapper delay={0.2}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-sm">🎓</span>
          <h3 className="font-bold text-navy">Upcoming Seminar</h3>
        </div>
        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">Webinar</span>
      </div>
      <div className="flex-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{new Date(event.event_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <h4 className="font-bold text-xl text-navy mt-1 leading-tight">{event.title}</h4>
        <p className="text-sm text-slate-500 mt-2">Speaker: <span className="font-semibold text-slate-700">Dr. Industry Expert</span></p>
        <div className="mt-5 space-y-2">
          <a href="#" className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 font-semibold p-2 rounded-lg bg-slate-50 border border-slate-100 transition-colors">
            📅 Add to Google Calendar
          </a>
          <a href="#" className="flex items-center gap-2 text-xs text-slate-500 hover:text-teal-600 font-semibold p-2 rounded-lg bg-slate-50 border border-slate-100 transition-colors">
            📼 View Past Recordings
          </a>
        </div>
      </div>
      <Link href={`/events/${event.slug || event.id}`} className="mt-4 block w-full text-center py-2.5 border-2 border-navy text-navy hover:bg-navy hover:text-white text-xs font-bold rounded-xl transition-all">
        RSVP / Register
      </Link>
    </WidgetWrapper>
  )
}

// ─── 4. Project Enquiry Widget ─────────────────────────────────────────────────
const ProjectEnquiryWidget = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service_interest: 'Academic Services' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/leads/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) setSuccess(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <WidgetWrapper delay={0.3}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">📩</span>
        <h3 className="font-bold text-navy">Quick Project Enquiry</h3>
      </div>
      {success ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 bg-green-50 rounded-xl p-4 border border-green-100">
          <span className="text-3xl">✅</span>
          <p className="font-bold text-green-800 text-sm">Enquiry Submitted!</p>
          <p className="text-xs text-green-600">Avg. response time: ~2 hours</p>
          <a href={`https://wa.me/919999999999?text=Hi! I just submitted an enquiry for ${form.service_interest}. Name: ${form.name}`} target="_blank" rel="noreferrer" className="inline-block mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors w-full">
             💬 Follow up on WhatsApp
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-3">
          <input required type="text" placeholder="Your Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent" />
          <input required type="email" placeholder="Email Address (Needed for CRM)" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent" />
          <input required type="tel" placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent" />
          <select value={form.service_interest} onChange={e => setForm({...form, service_interest: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent text-slate-600">
            {['Academic Services', 'Technical Services', 'Business Services', 'Government Deals', 'Campus Ambassador'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="mt-auto pt-2">
            <button disabled={submitting} type="submit" className="w-full py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-accent/20 disabled:opacity-70">
              {submitting ? 'Submitting...' : 'Request Quote / Callback'}
            </button>
            <p className="text-center text-[9px] text-slate-400 mt-2 font-semibold">⚡ Est. Response: ~2 Hrs</p>
          </div>
        </form>
      )}
    </WidgetWrapper>
  )
}

// ─── 5. Live Stats Widget ──────────────────────────────────────────────────────
const AnimatedCounter = ({ value, label, icon }: { value: number, label: string, icon: string }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let start = 0
    const duration = 1500
    const increment = value / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-extrabold text-xl text-navy leading-none">{count.toLocaleString()} <span className="text-accent text-sm">+</span></p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">{label}</p>
      </div>
    </div>
  )
}

const LiveStatsWidget = () => {
  const [stats, setStats] = useState<any>(null)
  useEffect(() => { fetch('/api/widgets/frontend?type=stats').then(r => r.json()).then(setStats) }, [])

  return (
    <WidgetWrapper delay={0.4}>
      <div className="flex items-center gap-2 mb-5">
        <span className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 text-sm">📊</span>
        <h3 className="font-bold text-navy">Live Platform Stats</h3>
      </div>
      <div className="flex-1 flex flex-col justify-center space-y-3">
        {stats ? (
          <>
            <AnimatedCounter value={stats.completed_projects} label="Projects Completed" icon="🚀" />
            <AnimatedCounter value={stats.happy_clients} label="Happy Clients" icon="🌟" />
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-navy to-[#1a2e4c] text-white">
               <div>
                 <p className="font-extrabold text-lg">{stats.active_projects}</p>
                 <p className="text-[10px] text-white/70 font-bold uppercase">Active Projects Today</p>
               </div>
               <div className="flex gap-1" title={`${stats.active_pillars} Pillars Active`}>
                 {Array.from({ length: 5 }).map((_, i) => (
                   <span key={i} className={`w-2 h-2 rounded-full ${i < stats.active_pillars ? 'bg-accent animate-pulse' : 'bg-white/20'}`} style={{ animationDelay: `${i * 0.2}s` }} />
                 ))}
               </div>
            </div>
          </>
        ) : (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-slate-100 rounded-xl" />
            <div className="h-16 bg-slate-100 rounded-xl" />
            <div className="h-16 bg-slate-100 rounded-xl" />
          </div>
        )}
      </div>
    </WidgetWrapper>
  )
}

// ─── 6. Social Proof Widget ────────────────────────────────────────────────────
const SocialProofWidget = () => {
  const [data, setData] = useState<any>(null)
  useEffect(() => { fetch('/api/widgets/frontend?type=testimonial').then(r => r.json()).then(setData) }, [])

  if (!data) return <WidgetWrapper delay={0.5}><div className="animate-pulse h-48 bg-slate-100 rounded-xl" /></WidgetWrapper>

  return (
    <WidgetWrapper delay={0.5}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-sm">⭐</span>
        <h3 className="font-bold text-navy">Latest Story</h3>
      </div>
      <div className="flex-1 flex flex-col relative">
        <span className="text-4xl text-slate-200 absolute -top-2 -left-2 leading-none font-serif">"</span>
        <p className="text-sm font-medium text-slate-600 italic relative z-10 pl-4">{data.review}</p>
        <div className="mt-auto pt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden border-2 border-white shadow-sm">
            {data.customer?.profile_image ? (
              <img src={data.customer.profile_image} alt="User" className="w-full h-full object-cover" />
            ) : (data.customer?.fullname?.charAt(0) || 'U')}
          </div>
          <div>
            <p className="text-sm font-bold text-navy leading-tight">{data.customer?.fullname || 'Anonymous Client'}</p>
            <p className="text-[10px] text-slate-400 font-semibold">{data.project?.service_type}</p>
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-[10px] ${i < data.rating ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Link href="/about#testimonials" className="mt-4 block w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors">
        View All Reviews
      </Link>
    </WidgetWrapper>
  )
}

// ─── Main Section Export ───────────────────────────────────────────────────────
export default function QuickAccessDashboard() {
  return (
    <section className="py-20 bg-surface/50 border-t border-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 bg-blue-50 text-blue-600 border border-blue-100">
            ⚡ Quick Access
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-navy font-heading">
            Live <span className="text-accent">Updates & Dashboard</span>
          </h2>
          <p className="text-slate-500 mt-3 text-sm md:text-base">
            Stay connected with the latest from KaryaSaarthi – jump into ongoing hackathons, catch our newest podcast episode, or instantly book a technical consultation right here.
          </p>
        </div>

        {/* CSS Grid ensures responsive layouts: 1 col on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PodcastWidget />
          <HackathonWidget />
          <SeminarWidget />
          <LiveStatsWidget />
          <SocialProofWidget />
          <ProjectEnquiryWidget />
        </div>
        
      </div>
    </section>
  )
}
