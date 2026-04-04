'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Subscriber {
  id: number
  email: string
  subscribed_at: string
  is_active: boolean
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Subscriber | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const LIMIT = 50

  const fetchSubscribers = useCallback(async (q = search, p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), q })
      const res = await fetch(`/api/newsletter/subscribers?${params}`)
      if (res.ok) {
        const d = await res.json()
        setSubscribers(d.subscribers || [])
        setTotal(d.total || 0)
      }
    } catch {} finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { fetchSubscribers(search, page) }, [page])

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => fetchSubscribers(val, 1), 400)
  }

  const toggleStatus = async (sub: Subscriber) => {
    setTogglingId(sub.id)
    await fetch('/api/newsletter/subscribers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sub.id, is_active: !sub.is_active }),
    })
    setTogglingId(null)
    fetchSubscribers(search, page)
  }

  const deleteSubscriber = async (sub: Subscriber) => {
    setDeletingId(sub.id)
    await fetch('/api/newsletter/subscribers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sub.id }),
    })
    setDeletingId(null)
    setConfirmDelete(null)
    fetchSubscribers(search, page)
  }

  const exportCSV = async () => {
    setExportLoading(true)
    try {
      // Fetch all active subscribers for export
      const res = await fetch('/api/newsletter/subscribers?limit=10000&q=')
      const d = await res.json()
      const all: Subscriber[] = d.subscribers || []
      const active = all.filter(s => s.is_active)
      const csv = ['Email,Subscribed At,Status', ...active.map(s =>
        `${s.email},${new Date(s.subscribed_at).toLocaleDateString('en-IN')},Active`
      )].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {} finally { setExportLoading(false) }
  }

  const displayed = subscribers.filter(s => {
    if (filterActive === 'active') return s.is_active
    if (filterActive === 'inactive') return !s.is_active
    return true
  })

  const activeCount   = subscribers.filter(s => s.is_active).length
  const inactiveCount = subscribers.filter(s => !s.is_active).length
  const totalPages    = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">📧 Newsletter Subscribers</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total.toLocaleString()} total subscribers</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={exportLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-60 transition-all"
          style={{ background: '#10B981', color: 'white' }}>
          {exportLoading ? '⏳ Exporting...' : '📥 Export CSV'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: total, icon: '📧', color: '#3B82F6' },
          { label: 'Active', value: activeCount, icon: '✅', color: '#10B981' },
          { label: 'Unsubscribed', value: inactiveCount, icon: '🔕', color: '#EF4444' },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <span className="text-2xl">{k.icon}</span>
            <p className="text-2xl font-extrabold font-heading mt-2" style={{ color: k.color }}>{k.value.toLocaleString()}</p>
            <p className="text-xs text-slate-400">{k.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-navy"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize cursor-pointer transition-all ${
                filterActive === f ? 'bg-navy text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <p className="font-bold text-navy font-heading text-sm">
            {displayed.length} subscriber{displayed.length !== 1 ? 's' : ''}
            {filterActive !== 'all' ? ` (${filterActive})` : ''}
          </p>
          <button onClick={() => fetchSubscribers(search, page)} className="text-xs text-slate-400 hover:text-navy cursor-pointer">
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-4xl block mb-3">📭</span>
            <p>{search ? `No subscribers matching "${search}"` : 'No subscribers yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['#', 'Email', 'Subscribed At', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((sub, idx) => (
                  <tr key={sub.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {(page - 1) * LIMIT + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${sub.email}`} className="text-sm font-medium text-navy hover:text-accent transition-colors">
                        {sub.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(sub.subscribed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        sub.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {sub.is_active ? '● Active' : '○ Unsubscribed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStatus(sub)}
                          disabled={togglingId === sub.id}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-60 ${
                            sub.is_active
                              ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}>
                          {togglingId === sub.id ? '⏳' : sub.is_active ? '🔕 Unsub' : '✅ Resub'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(sub)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer">
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 cursor-pointer">
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 cursor-pointer">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="font-bold text-navy font-heading text-lg mb-2">🗑 Delete Subscriber?</h3>
              <p className="text-sm text-slate-500 mb-4">
                Permanently remove <strong className="text-navy">{confirmDelete.email}</strong> from the subscriber list?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => deleteSubscriber(confirmDelete)}
                  disabled={deletingId === confirmDelete.id}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60"
                  style={{ background: '#EF4444' }}>
                  {deletingId === confirmDelete.id ? '⏳ Deleting...' : '🗑 Delete'}
                </button>
                <button onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 text-sm cursor-pointer hover:bg-slate-200">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
