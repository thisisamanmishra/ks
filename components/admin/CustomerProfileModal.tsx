'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CustomerProfile {
  id: number
  fullname: string
  email: string
  phone: string | null
  role: string
  status: string
  created_at: string
}

interface Props {
  userId: number | null
  onClose: () => void
}

export default function CustomerProfileModal({ userId, onClose }: Props) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [totalProjects, setTotalProjects] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetch(`/api/admin/users/${userId}`)
      .then(r => r.json())
      .then(d => { setProfile(d.user); setTotalProjects(d.totalProjects || 0) })
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <AnimatePresence>
      {userId && (
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
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white relative">
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
              ) : profile ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shadow-lg">
                    {profile.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-heading">{profile.fullname}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                      profile.status === 'active' ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'
                    }`}>
                      {profile.status || 'active'}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
              ) : profile ? (
                <>
                  {[
                    { icon: '📧', label: 'Email', value: profile.email },
                    { icon: '📱', label: 'Phone', value: profile.phone || 'Not provided' },
                    { icon: '📅', label: 'Member Since', value: new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
                    { icon: '📋', label: 'Total Projects', value: `${totalProjects} request${totalProjects !== 1 ? 's' : ''}` },
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
                <p className="text-center text-slate-400 py-4">Failed to load profile</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
