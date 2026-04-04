'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

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
  is_featured: boolean
  tags: string[]
  expert: { id: number; fullname: string; avatar_url: string | null; email: string } | null
}

const CAT_COLORS: Record<string, string> = {
  academic: '#3B82F6', technical: '#8B5CF6', business: '#10B981',
  government: '#F59E0B', design: '#EC4899', marketing: '#EF4444', legal: '#6B7280',
}

const FEATURES = [
  'Dedicated project manager', 'Real-time status updates', '100% plagiarism-free work',
  'Revision support included', 'NDA & confidentiality assured', '24/7 chat support',
]

function StarRating({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s} className={`text-base ${s <= Math.round(value) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
        ))}
      </div>
      <span className="text-sm font-bold text-navy">{value > 0 ? value.toFixed(1) : 'New'}</span>
      {count > 0 && <span className="text-slate-400 text-sm">({count} orders)</span>}
    </div>
  )
}

function EnquiryModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', budget: '', timeline: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/services/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: service.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setSent(true)
    } catch { setError('Something went wrong') }
    finally { setSending(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {sent ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-navy font-heading mb-2">Enquiry Sent!</h3>
            <p className="text-slate-500 text-sm mb-6">Our team will reach out within 24 hours.</p>
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer"
              style={{ background: '#1B3A6B' }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-navy font-heading text-lg">📩 Send Enquiry</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer text-xl">✕</button>
            </div>
            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2 mb-4 font-medium truncate">{service.title}</p>
            {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-sm mb-4">⚠️ {error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: 'name', label: 'Full Name *', type: 'text', req: true, ph: 'Your full name' },
                { key: 'email', label: 'Email *', type: 'email', req: true, ph: 'you@example.com' },
                { key: 'phone', label: 'Phone', type: 'tel', req: false, ph: '+91 XXXXX XXXXX' },
                { key: 'budget', label: 'Your Budget (₹)', type: 'text', req: false, ph: 'e.g. ₹5,000 – ₹10,000' },
                { key: 'timeline', label: 'Preferred Timeline', type: 'text', req: false, ph: 'e.g. 3 days, 1 week' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.ph} required={f.req}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Project Details</label>
                <textarea rows={3} placeholder="Describe your requirements..."
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy resize-none" />
              </div>
              <button type="submit" disabled={sending}
                className="w-full py-3 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60"
                style={{ background: '#FF6B35' }}>
                {sending ? '⏳ Sending...' : '🚀 Send Enquiry'}
              </button>
              <p className="text-[10px] text-slate-400 text-center">Or WhatsApp us directly for faster response</p>
              <a href={`https://wa.me/918595025753?text=Hi!%20I%27m%20interested%20in%20${encodeURIComponent(service.title)}`}
                target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 rounded-xl text-sm font-bold text-white text-center cursor-pointer"
                style={{ background: '#25D366' }}>
                💬 WhatsApp Us
              </a>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function ServiceDetailPage() {
  const params = useParams()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEnquiry, setShowEnquiry] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

  useEffect(() => {
    fetch(`/api/services/${params.id}`)
      .then(r => r.json())
      .then(d => { setService(d.service); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

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

  if (!service) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-surface pt-24 flex flex-col items-center justify-center">
          <span className="text-5xl mb-4">🔍</span>
          <h2 className="text-2xl font-bold text-navy font-heading mb-2">Service not found</h2>
          <Link href="/services" className="text-accent hover:underline">← Back to Marketplace</Link>
        </div>
        <Footer />
      </>
    )
  }

  const catColor = CAT_COLORS[service.category] || '#6B7280'

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-20">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
          <nav className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/" className="hover:text-navy transition-colors">Home</Link>
            <span>›</span>
            <Link href="/services" className="hover:text-navy transition-colors">Services</Link>
            <span>›</span>
            <span className="text-navy capitalize">{service.category}</span>
            <span>›</span>
            <span className="text-slate-600 truncate max-w-[180px]">{service.title}</span>
          </nav>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                {/* Hero image / placeholder */}
                <div className="h-56 flex items-center justify-center relative"
                  style={{ background: `linear-gradient(135deg, ${catColor}10, ${catColor}05)` }}>
                  {service.featured_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={service.featured_image} alt={service.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <span className="text-7xl opacity-20 block mb-2">
                        {service.category === 'academic' ? '🎓' : service.category === 'technical' ? '💻' : service.category === 'business' ? '💼' : '📁'}
                      </span>
                    </div>
                  )}
                  {service.is_featured && (
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: '#FF6B35' }}>⭐ Featured Service</div>
                  )}
                  <button onClick={() => setWishlisted(v => !v)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-lg hover:scale-110 transition-transform cursor-pointer">
                    {wishlisted ? '❤️' : '🤍'}
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ background: `${catColor}15`, color: catColor }}>
                      {service.category}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 text-xs">🕐 {service.delivery_days} day delivery</span>
                  </div>

                  <h1 className="text-2xl font-bold text-navy font-heading mb-3">{service.title}</h1>
                  <StarRating value={service.rating} count={service.total_orders} />

                  <p className="text-slate-500 mt-4 leading-relaxed">{service.short_description}</p>
                </div>
              </motion.div>

              {/* About */}
              {service.description && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h2 className="text-lg font-bold text-navy font-heading mb-4">About This Service</h2>
                  <div className="text-slate-600 text-sm leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: service.description }} />
                </motion.div>
              )}

              {/* What's included */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-navy font-heading mb-4">✅ What's Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FEATURES.map(feat => (
                    <div key={feat} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[10px] flex-shrink-0">✓</div>
                      {feat}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Tags */}
              {service.tags.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h2 className="text-base font-bold text-navy font-heading mb-3">Related Topics</h2>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map(tag => (
                      <Link key={tag} href={`/services?q=${tag}`}
                        className="px-3 py-1.5 rounded-full text-xs bg-slate-100 text-slate-600 hover:bg-navy hover:text-white transition-all">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sticky sidebar */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              {/* Pricing card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                {/* Price */}
                <div className="mb-4">
                  {service.price_min ? (
                    <>
                      <p className="text-xs text-slate-400 mb-1">Starting from</p>
                      <p className="text-3xl font-extrabold text-navy font-heading">
                        ₹{service.price_min.toLocaleString('en-IN')}
                      </p>
                      {service.price_max && (
                        <p className="text-sm text-slate-400">up to ₹{service.price_max.toLocaleString('en-IN')}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-2xl font-extrabold text-navy font-heading">Custom Quote</p>
                  )}
                </div>

                {/* Quick info */}
                <div className="space-y-2.5 mb-5 py-4 border-t border-b border-slate-100">
                  {[
                    { icon: '🕐', label: 'Delivery', value: `${service.delivery_days} days` },
                    { icon: '🔄', label: 'Revisions', value: 'Included' },
                    { icon: '🔒', label: 'Confidentiality', value: 'NDA Available' },
                    { icon: '💬', label: 'Support', value: '24/7 Chat' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-slate-500">{item.label}</span>
                      <span className="ml-auto font-semibold text-navy text-xs">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="space-y-2.5">
                  <button onClick={() => setShowEnquiry(true)}
                    className="w-full py-3.5 rounded-xl font-bold text-white cursor-pointer transition-all hover:opacity-90"
                    style={{ background: '#FF6B35', boxShadow: '0 4px 20px rgba(255,107,53,0.3)' }}>
                    🚀 Get Free Quote
                  </button>
                  <a href="https://wa.me/918595025753?text=Hi%2C%20I%27m%20interested%20in%20your%20service"
                    target="_blank" rel="noopener noreferrer"
                    className="block w-full py-3 rounded-xl font-bold text-white text-center cursor-pointer text-sm"
                    style={{ background: '#25D366' }}>
                    💬 WhatsApp Now
                  </a>
                  <Link href="/contact"
                    className="block w-full py-3 rounded-xl font-semibold text-navy text-center border border-navy hover:bg-navy hover:text-white transition-all text-sm">
                    📩 Contact Us
                  </Link>
                </div>

                <p className="text-[10px] text-slate-400 text-center mt-3">
                  🔒 100% secure · No payment until you approve
                </p>
              </motion.div>

              {/* Expert card */}
              {service.expert && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-navy font-heading text-sm mb-4">Your Service Expert</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {service.expert.fullname.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-navy">{service.expert.fullname}</p>
                      <p className="text-xs text-slate-400">{service.expert.email}</p>
                      <div className="flex mt-1">
                        {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-xs text-amber-400">★</span>)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Trust badges */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-navy to-navy/90 rounded-2xl p-5">
                <h3 className="font-bold text-white font-heading text-sm mb-3">Why KaryaSaarthi?</h3>
                {['5000+ Projects Delivered', '98% Client Satisfaction', 'Expert Team of 150+', 'Trusted by 3200+ Clients'].map(point => (
                  <div key={point} className="flex items-center gap-2 text-xs text-white/70 mb-2">
                    <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-white text-[9px] flex-shrink-0">✓</div>
                    {point}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEnquiry && <EnquiryModal service={service} onClose={() => setShowEnquiry(false)} />}
      </AnimatePresence>

      <Footer />
    </>
  )
}
