'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Invoice {
  id: number
  invoice_number: string
  subtotal: number
  total: number
  status: string
  due_date: string | null
  paid_at: string | null
  created_at: string
  client: { id: number; fullname: string; email: string } | null
  project: { id: number; service_type: string } | null
}

interface Summary {
  total: number
  pending: number
  overdue: number
  draft: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#6B7280', bg: '#F3F4F6' },
  sent: { label: 'Sent', color: '#3B82F6', bg: '#DBEAFE' },
  paid: { label: 'Paid', color: '#10B981', bg: '#D1FAE5' },
  overdue: { label: 'Overdue', color: '#EF4444', bg: '#FEE2E2' },
  cancelled: { label: 'Cancelled', color: '#9CA3AF', bg: '#F3F4F6' },
}

function CreateInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [clientId, setClientId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }])
  const [saving, setSaving] = useState(false)

  const subtotal = items.reduce((a, i) => a + (i.quantity * i.unit_price), 0)
  const tax = subtotal * 0.18
  const total = subtotal + tax

  const addItem = () => setItems(p => [...p, { description: '', quantity: 1, unit_price: 0 }])
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, val: string | number) =>
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, items, due_date: dueDate || null, notes }),
    })
    onCreated()
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-navy font-heading text-lg">🧾 Create Invoice</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Client User ID *</label>
              <input required value={clientId} onChange={e => setClientId(e.target.value)}
                placeholder="Client user ID" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Line Items</label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                    placeholder="Description" className="col-span-6 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-navy" />
                  <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value))}
                    min="1" placeholder="Qty" className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-navy text-center" />
                  <input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value))}
                    min="0" placeholder="Rate ₹" className="col-span-3 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-navy" />
                  <button type="button" onClick={() => removeItem(i)}
                    className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-600 cursor-pointer text-lg">✕</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem}
              className="mt-2 text-xs text-accent hover:underline cursor-pointer">+ Add item</button>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-slate-500"><span>GST (18%)</span><span>₹{tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-navy text-sm pt-1 border-t border-slate-200"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Payment terms, notes..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy resize-none" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60"
            style={{ background: '#FF6B35' }}>
            {saving ? '⏳ Creating...' : '🧾 Create Invoice (Draft)'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, pending: 0, overdue: 0, draft: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  const fetchInvoices = async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '30', ...(statusFilter !== 'all' ? { status: statusFilter } : {}) })
    try {
      const res = await fetch(`/api/admin/invoices?${params}`)
      const data = await res.json()
      setInvoices(data.invoices || [])
      if (data.summary) setSummary(data.summary)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchInvoices() }, [statusFilter])

  const updateStatus = async (id: number, status: string) => {
    await fetch('/api/admin/invoices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchInvoices()
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">💵 Finance Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Invoice management & revenue tracking</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer shadow-lg"
          style={{ background: '#FF6B35' }}>
          + New Invoice
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: `₹${summary.total.toLocaleString('en-IN')}`, icon: '✅', color: '#10B981' },
          { label: 'Pending', value: `₹${summary.pending.toLocaleString('en-IN')}`, icon: '⏳', color: '#F59E0B' },
          { label: 'Overdue', value: `₹${summary.overdue.toLocaleString('en-IN')}`, icon: '⚠️', color: '#EF4444' },
          { label: 'Drafts', value: String(summary.draft), icon: '📄', color: '#6B7280' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <p className="text-xl font-extrabold font-heading" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter + table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-bold text-navy font-heading">Invoice List</h3>
          <div className="flex gap-2">
            {['all', 'draft', 'sent', 'paid', 'overdue'].map(s => (
              <button key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize cursor-pointer transition-all ${
                  statusFilter === s ? 'bg-navy text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <span className="text-4xl block mb-3">🧾</span>
            <p>No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Invoice #', 'Client', 'Project', 'Amount', 'Status', 'Due Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft
                  const isOverdue = inv.status !== 'paid' && inv.due_date && new Date(inv.due_date) < new Date()
                  return (
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-navy font-mono">{inv.invoice_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-navy truncate max-w-[120px]">{inv.client?.fullname || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{inv.client?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500 truncate max-w-[120px]">{inv.project?.service_type || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-navy">₹{inv.total.toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: isOverdue ? '#FEE2E2' : cfg.bg, color: isOverdue ? '#EF4444' : cfg.color }}>
                          {isOverdue ? '⚠️ Overdue' : cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {inv.status === 'draft' && (
                            <button onClick={() => updateStatus(inv.id, 'sent')}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-blue-500 cursor-pointer">
                              Send
                            </button>
                          )}
                          {inv.status === 'sent' && (
                            <button onClick={() => updateStatus(inv.id, 'paid')}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-green-500 cursor-pointer">
                              Mark Paid
                            </button>
                          )}
                          <button onClick={() => window.print()}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 bg-slate-100 cursor-pointer">
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} onCreated={fetchInvoices} />}
      </AnimatePresence>
    </div>
  )
}
