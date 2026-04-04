'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
}

interface Invoice {
  id: number
  invoice_number: string
  subtotal: number
  tax_amount: number
  discount: number
  total: number
  status: string
  due_date: string | null
  paid_at: string | null
  created_at: string
  notes: string | null
  client: { id: number; fullname: string; email: string; phone: string | null } | null
  issuer: { id: number; fullname: string } | null
}

interface Customer {
  id: number
  fullname: string
  email: string
}

const STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-400',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])

  // Create form
  const [clientId, setClientId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unit_price: 0 }])
  const [saving, setSaving] = useState(false)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const [invoiceRes, userRes] = await Promise.all([
        fetch('/api/admin/finance/invoices'),
        fetch('/api/admin/users?role=customer'),
      ])
      const d1 = await invoiceRes.json()
      const d2 = await userRes.json()
      setInvoices(d1.invoices || [])
      setCustomers(d2.users || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetch_() }, [])

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/finance/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: Number(clientId), items, due_date: dueDate || undefined, notes }),
    })
    setSaving(false)
    setShowCreate(false)
    setItems([{ description: '', quantity: 1, unit_price: 0 }])
    setClientId(''); setDueDate(''); setNotes('')
    fetch_()
  }

  const changeStatus = async (id: number, status: string) => {
    setActionId(id)
    const extra = status === 'paid' ? { paid_at: new Date().toISOString() } : {}
    await fetch(`/api/admin/finance/invoices?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    })
    setActionId(null)
    fetch_()
  }

  const addItem = () => setItems(p => [...p, { description: '', quantity: 1, unit_price: 0 }])
  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) =>
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: field === 'description' ? value : Number(value) } : item))
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i))

  const subtotal = items.reduce((a, i) => a + i.quantity * i.unit_price, 0)
  const tax = (subtotal * 18) / 100
  const total = subtotal + tax

  const filtered = filter === 'all' ? invoices : invoices.filter(v => v.status === filter)
  const totalPaid = invoices.filter(v => v.status === 'paid').reduce((a, v) => a + v.total, 0)
  const totalPending = invoices.filter(v => ['sent', 'overdue'].includes(v.status)).reduce((a, v) => a + v.total, 0)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">🧾 Invoices</h1>
          <p className="text-slate-500 text-sm mt-0.5">{invoices.length} total invoices</p>
        </div>
        <button onClick={() => setShowCreate(v => !v)}
          className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer"
          style={{ background: '#FF6B35' }}>
          + Create Invoice
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: `₹${invoices.reduce((a, v) => a + v.total, 0).toLocaleString('en-IN')}`, icon: '🧾', color: '#6B7280' },
          { label: 'Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: '✅', color: '#10B981' },
          { label: 'Outstanding', value: `₹${totalPending.toLocaleString('en-IN')}`, icon: '⏳', color: '#F59E0B' },
          { label: 'Overdue', value: invoices.filter(v => v.status === 'overdue').length, icon: '⚠️', color: '#EF4444' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <span className="text-xl">{k.icon}</span>
            <p className="text-2xl font-extrabold font-heading mt-2" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-slate-400">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-navy font-heading mb-5">📝 New Invoice</h3>
            <form onSubmit={createInvoice} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Client *</label>
                  <select required value={clientId} onChange={e => setClientId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy">
                    <option value="">Select client...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.fullname} ({c.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600">Line Items *</label>
                  <button type="button" onClick={addItem}
                    className="text-xs text-accent hover:underline cursor-pointer">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                        placeholder="Description..." required
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                      <input type="number" value={item.quantity} min={1} onChange={e => updateItem(i, 'quantity', e.target.value)}
                        className="w-16 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-center focus:outline-none focus:border-navy" />
                      <input type="number" value={item.unit_price} min={0} onChange={e => updateItem(i, 'unit_price', e.target.value)}
                        placeholder="₹ Price"
                        className="w-28 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                      <div className="w-24 px-3 py-2.5 rounded-xl bg-slate-100 text-sm text-slate-600 text-right">
                        ₹{(item.quantity * item.unit_price).toLocaleString('en-IN')}
                      </div>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)}
                          className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 cursor-pointer text-xs">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-sm space-y-1 text-right">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">GST (18%)</span><span className="font-medium">₹{tax.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-1"><span className="font-bold text-navy">Total</span><span className="font-bold text-navy text-base">₹{total.toLocaleString('en-IN')}</span></div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment instructions..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy resize-none" />
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60"
                  style={{ background: '#FF6B35' }}>
                  {saving ? '⏳ Creating...' : '🧾 Create Invoice'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 text-sm cursor-pointer hover:bg-slate-200">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold capitalize cursor-pointer transition-all ${filter === f ? 'bg-navy text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-navy/5'}`}>
            {f} {f !== 'all' ? `(${invoices.filter(v => v.status === f).length})` : `(${invoices.length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-4xl block mb-3">🧾</span>
            <p>No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Invoice #', 'Client', 'Amount', 'Status', 'Due Date', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((inv, i) => (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-navy font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">{inv.client?.fullname || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-400">{inv.client?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-navy">₹{inv.total.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${STATUS_CLASSES[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {inv.status === 'draft' && (
                          <button onClick={() => changeStatus(inv.id, 'sent')} disabled={actionId === inv.id}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 cursor-pointer disabled:opacity-50">
                            Send
                          </button>
                        )}
                        {['draft', 'sent', 'overdue'].includes(inv.status) && (
                          <button onClick={() => changeStatus(inv.id, 'paid')} disabled={actionId === inv.id}
                            className="px-2.5 py-1 rounded-lg bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 cursor-pointer disabled:opacity-50">
                            Mark Paid
                          </button>
                        )}
                        {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                          <button onClick={() => changeStatus(inv.id, 'cancelled')} disabled={actionId === inv.id}
                            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 cursor-pointer disabled:opacity-50">
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
