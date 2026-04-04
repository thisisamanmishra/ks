'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Service {
  id: number; title: string; category: string; price: number; delivery_days: number
  rating: number; description: string; features: string[]; long_description: string | null
  vendor?: { fullname: string; bio: string | null; avatar_url: string | null } | null
}

const CATEGORY_ICON: Record<string, string> = { academic: '🎓', technical: '💻', business: '💼', government: '🏛️' }

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idsParam = searchParams.get('ids') || ''
  const ids = idsParam.split(',').filter(Boolean).slice(0, 3).map(Number)

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); return }
    Promise.all(ids.map(id => fetch(`/api/services/${id}`).then(r => r.json())))
      .then(results => {
        setServices(results.map(r => r.service).filter(Boolean))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam])

  const removeService = (id: number) => {
    const newIds = ids.filter(i => i !== id)
    if (newIds.length === 0) router.push('/services')
    else router.push(`/services/compare?ids=${newIds.join(',')}`)
  }

  const allFeatures = Array.from(new Set(services.flatMap(s => s.features || [])))

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    )
  }

  if (ids.length === 0 || services.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <span className="text-6xl">📊</span>
        <h1 className="text-2xl font-bold text-navy font-heading">No Services to Compare</h1>
        <p className="text-slate-500">Select services from the marketplace to compare them side-by-side.</p>
        <Link href="/services" className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: '#1B3A6B' }}>Browse Services →</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-navy font-heading">📊 Compare Services</h1>
              <p className="text-slate-400 text-xs mt-0.5">Side-by-side comparison of {services.length} service{services.length > 1 ? 's' : ''}</p>
            </div>
            <Link href="/services" className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 font-medium">
              ← Back to Marketplace
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Service cards side-by-side */}
        <div className={`grid gap-6 mb-8 ${services.length === 2 ? 'grid-cols-2' : services.length === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {services.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative">
              <button onClick={() => removeService(s.id)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center text-sm cursor-pointer">
                ✕
              </button>
              <span className="text-2xl mb-2 block">{CATEGORY_ICON[s.category] || '🛍️'}</span>
              <h3 className="font-bold text-navy font-heading text-base leading-snug mb-1 pr-6">{s.title}</h3>
              <p className="text-xs text-slate-400 mb-3 capitalize">{s.category}</p>
              <div className="flex items-center gap-1 mb-3">
                {'⭐'.repeat(Math.round(s.rating || 0))}
                <span className="text-xs text-slate-400 ml-1">{(s.rating || 0).toFixed(1)}</span>
              </div>
              <div className="text-2xl font-extrabold text-navy font-heading mb-4">₹{s.price.toLocaleString('en-IN')}</div>
              <Link href={`/services/${s.id}`}
                className="w-full py-2.5 rounded-xl font-bold text-white text-sm text-center block cursor-pointer"
                style={{ background: '#FF6B35' }}>
                View Details →
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase w-36">Feature</th>
                  {services.map(s => (
                    <th key={s.id} className="px-5 py-4 text-center text-sm font-bold text-navy border-l border-slate-100">{s.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price */}
                <CompareRow label="💰 Price" values={services.map(s => `₹${s.price.toLocaleString('en-IN')}`)} highlight="lowest" rawValues={services.map(s => s.price)} />
                {/* Rating */}
                <CompareRow label="⭐ Rating" values={services.map(s => `${(s.rating || 0).toFixed(1)} / 5`)} highlight="highest" rawValues={services.map(s => s.rating || 0)} />
                {/* Delivery */}
                <CompareRow label="📅 Delivery" values={services.map(s => `${s.delivery_days || '?'} day${s.delivery_days !== 1 ? 's' : ''}`)} highlight="lowest" rawValues={services.map(s => s.delivery_days || 999)} />
                {/* Category */}
                <CompareRow label="📂 Category" values={services.map(s => s.category)} />
                {/* Expert */}
                <CompareRow label="👤 Expert" values={services.map(s => s.vendor?.fullname || '—')} />
                {/* Description */}
                <CompareRow label="📝 About" values={services.map(s => s.description || '—')} isLong />
                {/* Features */}
                {allFeatures.map(feat => (
                  <CompareRow key={feat} label={feat}
                    values={services.map(s => (s.features || []).includes(feat) ? '✅ Included' : '—')}
                    isFeatureCheck
                    rawValues={services.map(s => (s.features || []).includes(feat) ? 1 : 0)}
                  />
                ))}
                {/* CTA row */}
                <tr className="border-t border-slate-100 bg-slate-50/30">
                  <td className="px-5 py-4 text-xs font-bold text-slate-400 uppercase">Action</td>
                  {services.map(s => (
                    <td key={s.id} className="px-5 py-4 border-l border-slate-100 text-center">
                      <Link href={`/services/${s.id}`}
                        className="inline-block px-4 py-2 rounded-xl font-bold text-white text-xs cursor-pointer"
                        style={{ background: '#1B3A6B' }}>
                        Enquire / Book
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Add more CTA */}
        {services.length < 3 && (
          <div className="mt-6 text-center">
            <Link href="/services" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-navy hover:text-navy font-medium text-sm transition-all cursor-pointer">
              + Add Another Service to Compare
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function CompareRow({
  label, values, highlight, rawValues, isLong, isFeatureCheck,
}: {
  label: string
  values: string[]
  highlight?: 'highest' | 'lowest'
  rawValues?: number[]
  isLong?: boolean
  isFeatureCheck?: boolean
}) {
  let best: number | null = null
  if (highlight && rawValues) {
    const valid = rawValues.filter(v => v !== 0 && v !== 999)
    if (valid.length > 0) {
      best = highlight === 'highest' ? Math.max(...rawValues) : Math.min(...rawValues)
    }
  }
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
      <td className="px-5 py-3.5 text-xs font-bold text-slate-500">{label}</td>
      {values.map((val, i) => {
        const isBest = best !== null && rawValues && rawValues[i] === best
        const isNA = val === '—'
        return (
          <td key={i} className={`px-5 py-3.5 border-l border-slate-50 text-center ${isLong ? 'align-top' : 'align-middle'}`}>
            <span className={`text-sm ${
              isFeatureCheck ? (val === '✅ Included' ? 'text-green-600 font-bold' : 'text-slate-300') :
              isBest ? 'font-extrabold text-navy bg-accent/10 px-2 py-0.5 rounded-lg' :
              isNA ? 'text-slate-300' : 'text-slate-600'
            } ${isLong ? 'text-xs text-left block leading-relaxed' : ''}`}>
              {val}
            </span>
          </td>
        )
      })}
    </tr>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full animate-spin" /></div>}>
      <CompareContent />
    </Suspense>
  )
}
