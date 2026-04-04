'use client'

import { useEffect, useState } from 'react'
import VendorProfileModal from '@/components/admin/VendorProfileModal'

interface VendorData {
  id: number
  company_name: string | null
  specialization: string | null
  is_approved: boolean
  rating: number
  total_projects: number
  user: { id: number; fullname: string; email: string; phone: string; status: string } | null
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorData[]>([])
  const [loading, setLoading] = useState(true)
  const [profileVendorId, setProfileVendorId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/vendors')
      .then(r => r.json())
      .then(d => { setVendors(d.vendors || []); setLoading(false) })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy font-heading">🏪 Vendor Management</h1>
        <p className="text-slate-500 text-sm mt-1">{vendors.length} vendors registered</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
          <span className="text-4xl block mb-2">🏪</span>
          <p className="text-slate-500">No vendors yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map(v => (
            <div key={v.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-lg">
                    {v.user?.fullname.charAt(0) || 'V'}
                  </div>
                  <div>
                    {/* Clickable vendor name */}
                    <button
                      onClick={() => setProfileVendorId(v.id)}
                      className="font-semibold text-navy hover:text-accent hover:underline cursor-pointer transition-colors text-left"
                      title="View vendor profile"
                    >
                      {v.user?.fullname}
                    </button>
                    <p className="text-xs text-slate-400">{v.user?.email}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${v.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {v.is_approved ? 'Approved' : 'Pending'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-navy">{v.total_projects}</p>
                  <p className="text-xs text-slate-400">Projects</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-navy">⭐ {v.rating}</p>
                  <p className="text-xs text-slate-400">Rating</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-navy capitalize">{v.user?.status}</p>
                  <p className="text-xs text-slate-400">Status</p>
                </div>
              </div>
              {v.specialization && <p className="text-sm text-slate-500 mt-3">🎯 {v.specialization}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Vendor Profile Modal */}
      <VendorProfileModal vendorId={profileVendorId} onClose={() => setProfileVendorId(null)} />
    </div>
  )
}
