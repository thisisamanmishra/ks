'use client'

import { useEffect, useState, use } from 'react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface Service {
  id: number
  title: string
  slug: string
  category: string
  description: string | null
  short_description: string
  price_min: number | null
  price_max: number | null
  delivery_days: number
  featured_image: string | null
  rating: number
  total_orders: number
  tags: string[]
  expert: { id: number; fullname: string; avatar_url: string | null; email?: string } | null
}

const CAT_COLORS: Record<string, string> = {
  academic: '#3B82F6',
  technical: '#8B5CF6',
  business: '#10B981',
  government: '#F59E0B',
  design: '#EC4899',
  marketing: '#06B6D4',
  legal: '#64748B'
}

export default function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const { slug } = use(params)
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', budget: '', deadline: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    fetch(`/api/services/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.service) setService(d.service)
        else router.push('/services')
      })
      .catch(() => router.push('/services'))
      .finally(() => setLoading(false))
  }, [slug, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await fetch('/api/services/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: service?.id, ...form }),
      })
      setSent(true)
    } catch {} finally { setSending(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-navy border-t-transparent flex-shrink-0 animate-spin rounded-full"></div>
      </div>
      <Footer />
    </div>
  )

  if (!service) return null

  const catColor = CAT_COLORS[service.category] || '#1B3A6B'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-navy pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <Link href="/services" className="text-white/60 text-sm hover:text-white mb-6 inline-flex items-center gap-2">
            ← Back to Services
          </Link>
          <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                  style={{ background: catColor, color: 'white' }}>
                  {service.category}
                </span>
                <span className="text-yellow-400 text-sm font-bold flex items-center gap-1">
                  ⭐ {service.rating.toFixed(1)} <span className="text-white/60 font-normal">({service.total_orders} reviews)</span>
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white font-heading leading-tight mb-4">
                {service.title}
              </h1>
              <p className="text-white/80 text-lg">{service.short_description}</p>
              
              <div className="flex gap-2 flex-wrap mt-6">
                {service.tags.map(t => (
                  <span key={t} className="px-3 py-1 rounded-full border border-white/20 text-white/80 text-xs">{t}</span>
                ))}
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl w-full md:w-80 flex-shrink-0 text-navy">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Starting from</p>
              {service.price_min ? (
                <p className="text-3xl font-extrabold font-heading mb-4 text-navy">
                  ₹{service.price_min.toLocaleString('en-IN')}
                  {service.price_max && <span className="text-lg text-slate-400 font-normal"> - ₹{service.price_max.toLocaleString('en-IN')}</span>}
                </p>
              ) : (
                <p className="text-2xl font-extrabold font-heading mb-4 text-navy">Custom Quote</p>
              )}
              
              <div className="space-y-4 mb-6 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⏱️</span>
                  <div>
                    <p className="font-bold text-navy">{service.delivery_days} Days Delivery</p>
                    <p className="text-xs">Standard turnaround time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🔄</span>
                  <div>
                    <p className="font-bold text-navy">Unlimited Revisions</p>
                    <p className="text-xs">Until you are 100% satisfied</p>
                  </div>
                </div>
              </div>

              <button onClick={() => document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth' })} className="w-full py-4 bg-accent text-white font-bold rounded-2xl hover:bg-accent/90 transition-all shadow-lg shadow-orange-500/30">
                Request a Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-10">
          
          {/* Left Column - Details */}
          <div className="flex-1 space-y-10">
            {/* About Service */}
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold font-heading text-navy mb-6">About this service</h2>
              <div 
                className="prose prose-slate max-w-none text-slate-600 prose-headings:text-navy prose-a:text-accent"
                dangerouslySetInnerHTML={{ __html: service.description || '<p>No detailed description provided.</p>' }} 
              />
            </section>

            {/* Expert Info */}
            {service.expert && (
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold font-heading text-navy mb-6">Meet the Expert</h2>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-navy/5 flex items-center justify-center text-3xl font-bold text-navy border border-slate-100">
                    {service.expert.avatar_url ? (
                      <Image src={service.expert.avatar_url} alt="Expert" width={80} height={80} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      service.expert.fullname.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-xl text-navy">{service.expert.fullname}</p>
                    <p className="text-slate-500">Subject Matter Expert</p>
                    <div className="flex gap-2 mt-2">
                       <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold">✓ Verified</span>
                       <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-bold">★ Top Rated</span>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Enquiry Form */}
          <div className="w-full lg:w-96" id="enquiry-form">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 sticky top-24">
              <h3 className="text-xl font-bold font-heading text-navy mb-2">Project Enquiry</h3>
              <p className="text-sm text-slate-500 mb-6">Fill out the details below and our team will get back to you with a direct proposal within 2 hours.</p>

              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-50 text-green-700 p-6 rounded-2xl text-center border border-green-200">
                  <span className="text-4xl block mb-2">🎉</span>
                  <p className="font-bold text-lg mb-1">Enquiry Sent!</p>
                  <p className="text-sm opacity-90">We have received your requirements. A Saarthi will contact you shortly.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Full Name</label>
                    <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy" placeholder="John Doe" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Email</label>
                      <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy" placeholder="john@company.com" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Phone (WhatsApp)</label>
                      <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy" placeholder="+91..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Estimated Budget</label>
                      <input type="text" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy" placeholder="e.g. ₹5,000" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Deadline</label>
                      <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Project Requirements</label>
                    <textarea required value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy h-28 resize-none" placeholder="Describe what you need help with..." />
                  </div>
                  <button type="submit" disabled={sending} className="w-full py-4 bg-navy text-white font-bold rounded-xl hover:bg-navy/90 disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                    {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full"></div> : 'Submit Enquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
