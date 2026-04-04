'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VendorStats {
  completedProjects: number
  ongoingProjects: number
  totalRatings: number
  avgRating: number
}

interface VendorUser {
  id: number
  fullname: string
  email: string
  phone: string | null
  status: string
  created_at: string
}

interface VendorDetail {
  id: number
  specialization: string | null
  user: VendorUser | null
}

interface Props {
  vendorId: number | null   // vendor TABLE id (not user id)
  onClose: () => void
}

export default function VendorProfileModal({ vendorId, onClose }: Props) {
  const [vendor, setVendor] = useState<VendorDetail | null>(null)
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!vendorId) return
    setLoading(true)
    fetch(`/api/admin/vendors/${vendorId}`)
      .then(r => r.json())
      .then(d => { setVendor(d.vendor); setStats(d.stats) })
      .finally(() => setLoading(false))
  }, [vendorId])

  const user = vendor?.user

  return (
    <AnimatePresence>
      {vendorId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-6 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
              {loading ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-white/20 rounded animate-pulse" />
                  </div>
                </div>
              ) : user ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shadow-lg">
                    {user.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-heading">{user.fullname}</h2>
                    {vendor?.specialization && (
                      <p className="text-xs text-white/70 mt-0.5">{vendor.specialization}</p>
                    )}
                    {stats && stats.avgRating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm">⭐</span>
                        <span className="text-sm font-semibold">{stats.avgRating.toFixed(1)}</span>
                        <span className="text-xs text-white/60">({stats.totalRatings} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Stats bar */}
            {!loading && stats && (
              <div className="bg-slate-50 border-b border-slate-100 grid grid-cols-2 divide-x divide-slate-200">
                <div className="p-4 text-center">
                  <p className="text-2xl font-extrabold text-green-600">{stats.completedProjects}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Completed</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-2xl font-extrabold text-blue-600">{stats.ongoingProjects}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Ongoing</p>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="p-6 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
              ) : user ? (
                <>
                  {[
                    { icon: '📧', label: 'Email', value: user.email },
                    { icon: '📱', label: 'Phone', value: user.phone || 'Not provided' },
                    { icon: '📅', label: 'Joined', value: new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                        <p className="text-sm font-semibold text-navy mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-center text-slate-400 py-4">Failed to load vendor profile</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
