'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Service {
  id: number
  title: string
  slug: string
  category: string
  short_description: string
  price_min: number | null
  price_max: number | null
  delivery_days: number
  featured_image: string | null
  rating: number
  total_orders: number
  is_featured: boolean
  tags: string[]
  expert: { id: number; fullname: string; avatar_url: string | null } | null
}

const CATEGORIES = [
  { key: 'all', label: 'All Services', icon: '🏷️' },
  { key: 'academic', label: 'Academic', icon: '🎓' },
  { key: 'technical', label: 'Technical', icon: '💻' },
  { key: 'business', label: 'Business', icon: '💼' },
  { key: 'government', label: 'Government', icon: '🏛️' },
  { key: 'design', label: 'Design', icon: '🎨' },
  { key: 'marketing', label: 'Marketing', icon: '📣' },
  { key: 'legal', label: 'Legal', icon: '⚖️' },
  { key: 'other', label: 'Other', icon: '📁' },
]

const SORT_OPTIONS = [
  { key: 'featured', label: 'Featured' },
  { key: 'popular', label: 'Most Popular' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'delivery', label: 'Fastest Delivery' },
]

const CAT_COLORS: Record<string, string> = {
  academic: '#3B82F6',
  technical: '#8B5CF6',
  business: '#10B981',
  government: '#F59E0B',
  design: '#EC4899',
  marketing: '#EF4444',
  legal: '#6B7280',
  other: '#64748B',
}

// Normalize category for comparison (handles both 'Academic' and 'academic')
function normCat(cat: string) { return cat.toLowerCase() }

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={`text-xs ${s <= Math.round(value) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
      ))}
      <span className="text-xs text-slate-400 ml-1">({value > 0 ? value.toFixed(1) : 'New'})</span>
    </div>
  )
}

function ServiceCard({ service, wishlisted, onWishlist, onEnquire, onCompare, compareSelected }: {
  service: Service
  wishlisted: boolean
  onWishlist: (id: number) => void
  onEnquire: (s: Service) => void
  onCompare: (id: number) => void
  compareSelected: boolean
}) {
  const catColor = CAT_COLORS[normCat(service.category)] || CAT_COLORS.other

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
    >
      {/* Image / Placeholder */}
      <div className="h-44 relative overflow-hidden flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${catColor}15, ${catColor}05)` }}>
        {service.featured_image ? (
          <Image src={service.featured_image} alt={service.title} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
        ) : (
          <span className="text-5xl opacity-30">
            {CATEGORIES.find(c => c.key === normCat(service.category))?.icon || '📁'}
          </span>
        )}

        {service.is_featured && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
            style={{ background: '#FF6B35' }}>
            ⭐ Featured
          </div>
        )}

        {/* Wishlist btn */}
        <button
          onClick={() => onWishlist(service.id)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-sm hover:scale-110 transition-transform cursor-pointer shadow-sm"
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Category + delivery */}
        <div className="flex items-center justify-between mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize"
            style={{ background: `${catColor}15`, color: catColor }}>
            {service.category}
          </span>
          <span className="text-[10px] text-slate-400">🕐 {service.delivery_days} days</span>
        </div>

        <h3 className="font-bold text-navy text-sm font-heading mb-1 line-clamp-2 group-hover:text-accent transition-colors">
          {service.title}
        </h3>
        <p className="text-slate-400 text-xs mb-3 flex-1 line-clamp-2">{service.short_description}</p>

        {/* Rating */}
        <StarRating value={service.rating} />

        {/* Expert */}
        {service.expert && (
          <div className="flex items-center gap-2 mt-3 py-2 border-t border-slate-50">
            <div className="w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center text-navy text-[10px] font-bold flex-shrink-0">
              {service.expert.fullname.charAt(0)}
            </div>
            <span className="text-xs text-slate-500 truncate">{service.expert.fullname}</span>
          </div>
        )}

        {/* Price + Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <div>
            {service.price_min ? (
              <p className="text-sm font-bold text-navy">
                ₹{service.price_min.toLocaleString('en-IN')}
                {service.price_max && <span className="text-slate-400 font-normal text-xs"> – ₹{service.price_max.toLocaleString('en-IN')}</span>}
              </p>
            ) : (
              <p className="text-sm font-bold text-navy">Custom Quote</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEnquire(service)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-navy text-navy hover:bg-navy hover:text-white transition-all cursor-pointer"
            >
              Enquire
            </button>
            <Link href={`/services/${service.slug}`}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
              style={{ background: '#FF6B35' }}>
              View →
            </Link>
          </div>
        </div>

        {/* Compare toggle */}
        <button
          onClick={() => onCompare(service.id)}
          className={`mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
            compareSelected
              ? 'bg-navy/10 text-navy border-navy'
              : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-navy hover:text-navy'
          }`}>
          {compareSelected ? '✓ Added to Compare' : '⊕ Add to Compare'}
        </button>
      </div>
    </motion.div>
  )
}


function EnquiryModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', budget: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await fetch('/api/services/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: service.id, ...form }),
      })
      setSent(true)
    } catch {} finally { setSending(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        {sent ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-navy font-heading mb-2">Enquiry Sent!</h3>
            <p className="text-slate-500 text-sm mb-6">We'll get back to you within 24 hours.</p>
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-navy text-white font-bold text-sm cursor-pointer">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-navy font-heading text-lg">📩 Send Enquiry</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer text-xl">✕</button>
            </div>
            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2 mb-4">{service.title}</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your name', required: true },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
                { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 XXXXX XXXXX', required: false },
                { key: 'budget', label: 'Budget (₹)', type: 'text', placeholder: 'e.g. 5000 - 10000', required: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} required={f.required}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Message</label>
                <textarea rows={3} placeholder="Describe your requirements..."
                  value={form.message}
                  onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy resize-none" />
              </div>
              <button type="submit" disabled={sending}
                className="w-full py-3 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60"
                style={{ background: '#FF6B35' }}>
                {sending ? '⏳ Sending...' : '🚀 Send Enquiry'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('featured')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())
  const [enquireService, setEnquireService] = useState<Service | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [compareIds, setCompareIds] = useState<number[]>([])

  const toggleCompare = (id: number) => {
    setCompareIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : prev.length >= 3
          ? prev   // max 3
          : [...prev, id]
    )
  }

  const fetchServices = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      category, sort, page: page.toString(), limit: '12',
      ...(search ? { q: search } : {}),
    })
    try {
      const res = await fetch(`/api/services?${params}`)
      const data = await res.json()
      setServices(data.services || [])
      setTotal(data.total || 0)
    } catch {} finally { setLoading(false) }
  }, [category, sort, search, page])

  useEffect(() => { fetchServices() }, [fetchServices])

  // Load wishlist
  useEffect(() => {
    fetch('/api/services/wishlist')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.wishlist) setWishlist(new Set(d.wishlist)) })
      .catch(() => {})
  }, [])

  const toggleWishlist = async (serviceId: number) => {
    const res = await fetch('/api/services/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: serviceId }),
    })
    if (res.ok) {
      const data = await res.json()
      setWishlist(prev => {
        const next = new Set(prev)
        data.added ? next.add(serviceId) : next.delete(serviceId)
        return next
      })
    }
  }

  const totalPages = Math.ceil(total / 12)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-20">
        {/* Hero */}
        <div className="py-12 text-center"
          style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0f2545 100%)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold text-accent mb-4"
              style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)' }}>
              🛍️ Service Marketplace
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white font-heading mb-3">
              Find the Perfect <span style={{ color: '#FF6B35' }}>Service</span>
            </h1>
            <p className="text-white/50 max-w-lg mx-auto text-lg">
              Academic, Technical, Business & Government — all under one platform
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-8 max-w-xl mx-auto px-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
              <input
                type="text"
                placeholder="Search services — thesis, website, business plan..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm outline-none text-white placeholder-white/30"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
            </div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters sidebar */}
            <div className={`lg:w-52 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 sticky top-24">
                <h3 className="font-bold text-navy text-sm mb-4 font-heading">Categories</h3>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button key={cat.key}
                      onClick={() => { setCategory(cat.key); setPage(1) }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        category === cat.key
                          ? 'bg-navy text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="mt-6">
                  <h3 className="font-bold text-navy text-sm mb-3 font-heading">Sort By</h3>
                  <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-navy bg-slate-50">
                    {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                </div>

                {/* Express CTA */}
                <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.15)' }}>
                  <p className="text-xs font-bold text-accent mb-2">Need a Custom Quote?</p>
                  <Link href="/contact?type=quote"
                    className="block px-3 py-2 rounded-lg text-xs font-bold text-white cursor-pointer"
                    style={{ background: '#FF6B35' }}>
                    Get Free Quote →
                  </Link>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <span className="text-sm font-bold text-navy">{total.toLocaleString()} Services</span>
                  {search && <span className="text-slate-400 text-sm ml-2">for &quot;{search}&quot;</span>}
                </div>
                <button onClick={() => setShowFilters(v => !v)}
                  className="lg:hidden px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-navy cursor-pointer">
                  🔧 Filters
                </button>
              </div>

              {/* Category pills (mobile/desktop scrollable) */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
                {CATEGORIES.map(cat => (
                  <button key={cat.key}
                    onClick={() => { setCategory(cat.key); setPage(1) }}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      category === cat.key
                        ? 'bg-navy text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-navy'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-72 bg-white rounded-2xl animate-pulse border border-slate-100" />
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                  <span className="text-5xl block mb-4">🔍</span>
                  <h3 className="font-bold text-navy text-lg font-heading mb-2">No services found</h3>
                  <p className="text-slate-400 text-sm mb-6">Try a different category or search term</p>
                  <button onClick={() => { setCategory('all'); setSearch(''); setPage(1) }}
                    className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer"
                    style={{ background: '#1B3A6B' }}>
                    View All Services
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {services.map(service => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        wishlisted={wishlist.has(service.id)}
                        onWishlist={toggleWishlist}
                        onEnquire={setEnquireService}
                        onCompare={toggleCompare}
                        compareSelected={compareIds.includes(service.id)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-10">
                      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">
                        ← Prev
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                        const pg = i + 1
                        return (
                          <button key={pg} onClick={() => setPage(pg)}
                            className={`w-10 h-10 rounded-xl text-sm font-bold cursor-pointer ${
                              page === pg ? 'bg-navy text-white' : 'bg-white text-navy border border-slate-200 hover:bg-slate-50'
                            }`}>
                            {pg}
                          </button>
                        )
                      })}
                      <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Compare Bar */}
      <AnimatePresence>
        {compareIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-navy rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 border border-white/10">
            <span className="text-white font-bold text-sm">{compareIds.length}/3 selected</span>
            <div className="flex gap-2">
              {compareIds.map(id => {
                const s = services.find(sv => sv.id === id)
                return s ? (
                  <span key={id} className="px-2.5 py-1 bg-white/10 text-white text-xs rounded-lg flex items-center gap-1">
                    {s.title.slice(0, 12)}…
                    <button onClick={() => toggleCompare(id)} className="ml-1 text-white/60 hover:text-white cursor-pointer">×</button>
                  </span>
                ) : null
              })}
            </div>
            <Link
              href={`/services/compare?ids=${compareIds.join(',')}`}
              className="px-4 py-2 rounded-xl font-bold text-navy text-sm cursor-pointer whitespace-nowrap"
              style={{ background: '#FF6B35', color: 'white' }}>
              Compare Now →
            </Link>
            <button onClick={() => setCompareIds([])} className="text-white/40 hover:text-white text-sm cursor-pointer">× Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enquiry Modal */}
      <AnimatePresence>
        {enquireService && (
          <EnquiryModal service={enquireService} onClose={() => setEnquireService(null)} />
        )}
      </AnimatePresence>

      <Footer />
    </>
  )
}
