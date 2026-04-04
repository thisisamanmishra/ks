'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import PaymentButton from '@/components/PaymentButton'

interface Invoice {
  id: number
  invoice_number: string
  total: number
  status: string
  due_date: string | null
  paid_at: string | null
  created_at: string
  project: { id: number; service_type: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: 'Pending',  color: '#F59E0B', bg: '#FEF3C7', icon: '⏳' },
  paid:     { label: 'Paid',     color: '#10B981', bg: '#D1FAE5', icon: '✅' },
  overdue:  { label: 'Overdue',  color: '#EF4444', bg: '#FEE2E2', icon: '⚠️' },
  cancelled:{ label: 'Cancelled',color: '#6B7280', bg: '#F3F4F6', icon: '✕'  },
}

function handlePrint(inv: Invoice) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${inv.invoice_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
        h1 { color: #1B3A6B; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .label { color: #64748b; font-size: 14px; }
        .value { font-weight: bold; }
        .total { font-size: 24px; color: #1B3A6B; margin-top: 20px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;
          background: ${STATUS_CONFIG[inv.status]?.bg || '#f1f5f9'};
          color: ${STATUS_CONFIG[inv.status]?.color || '#64748b'}; }
        .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <h1>KaryaSaarthi</h1>
      <p style="color:#64748b">Enterprise Services · karyasaarthi.com</p>
      <hr style="margin:20px 0;border:1px solid #e2e8f0" />
      <h2>Invoice #${inv.invoice_number}</h2>
      <div class="row"><span class="label">Service</span><span class="value">${inv.project?.service_type || 'Service'}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
      ${inv.due_date ? `<div class="row"><span class="label">Due Date</span><span class="value">${new Date(inv.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>` : ''}
      ${inv.paid_at ? `<div class="row"><span class="label">Paid On</span><span class="value">${new Date(inv.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>` : ''}
      <div class="row"><span class="label">Status</span><span class="badge">${STATUS_CONFIG[inv.status]?.icon} ${STATUS_CONFIG[inv.status]?.label || inv.status}</span></div>
      <div class="total">Total: ₹${inv.total.toLocaleString('en-IN')}</div>
      <div class="footer">
        <p>KaryaSaarthi Enterprise · Delhi, India</p>
        <p>This is a computer-generated invoice. For queries, contact support@karyasaarthi.com</p>
      </div>
    </body>
    </html>
  `)
  w.document.close()
  w.print()
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices/my')
      if (res.status === 401) { router.push('/login'); return }
      if (res.ok) {
        const d = await res.json()
        setInvoices(d.invoices || [])
      }
    } catch {} finally { setLoading(false) }
  }, [router])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const filtered = invoices.filter(inv => filter === 'all' || inv.status === filter)

  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.total, 0)
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-20 lg:pt-24">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden lg:flex w-64 min-h-[calc(100vh-6rem)] bg-navy flex-col text-white fixed top-20 left-0">
            <div className="p-6 flex items-center gap-3 border-b border-white/10">
              <span className="font-bold font-heading">Karya<span className="text-accent">Saarthi</span></span>
            </div>
            <nav className="flex-1 py-4">
              {[
                { icon: '📊', label: 'Dashboard', href: '/dashboard' },
                { icon: '🧾', label: 'My Invoices', href: '/dashboard/invoices', active: true },
                { icon: '👤', label: 'Profile', href: '/dashboard/profile' },
              ].map(item => (
                <Link key={item.label} href={item.href}
                  className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${item.active ? 'bg-white/10 text-white border-r-2 border-accent' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                  <span>{item.icon}</span> {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <div className="flex-1 lg:ml-64 p-6 lg:p-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-5">
              <Link href="/dashboard" className="hover:text-navy transition-colors">Dashboard</Link>
              <span>›</span>
              <span className="text-navy font-semibold">My Invoices</span>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-navy font-heading">🧾 My Invoices</h1>
              <p className="text-slate-500 text-sm mt-1">View, pay, and download your invoices</p>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Invoices', value: invoices.length, icon: '🧾', color: '#3B82F6' },
                { label: 'Amount Paid',   value: `₹${totalPaid.toLocaleString('en-IN')}`,    icon: '✅', color: '#10B981' },
                { label: 'Pending',       value: `₹${totalPending.toLocaleString('en-IN')}`, icon: '⏳', color: '#F59E0B' },
                { label: 'Overdue',       value: `₹${totalOverdue.toLocaleString('en-IN')}`, icon: '⚠️', color: '#EF4444' },
              ].map((k, i) => (
                <motion.div key={k.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <span className="text-2xl">{k.icon}</span>
                  <p className="text-2xl font-extrabold font-heading mt-2" style={{ color: k.color }}>{k.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {(['all', 'pending', 'paid', 'overdue'] as const).map(f => {
                const count = f === 'all' ? invoices.length : invoices.filter(i => i.status === f).length
                return (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                      filter === f ? 'bg-navy text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-navy/5'
                    }`}>
                    {STATUS_CONFIG[f]?.icon || '📋'} {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label} ({count})
                  </button>
                )
              })}
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {loading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-5xl block mb-4">🧾</span>
                  <h3 className="font-bold text-navy font-heading mb-2">
                    {filter === 'all' ? 'No invoices yet' : `No ${filter} invoices`}
                  </h3>
                  <p className="text-slate-400 text-sm mb-5">
                    {filter === 'all'
                      ? 'Your invoices will appear here once a project is created.'
                      : `You have no ${filter} invoices at this time.`}
                  </p>
                  {filter !== 'all' && (
                    <button onClick={() => setFilter('all')} className="px-5 py-2.5 rounded-xl text-sm font-bold text-navy border border-navy hover:bg-navy hover:text-white transition-all cursor-pointer">
                      View All Invoices
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filtered.map((inv, i) => {
                    const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending
                    const isOverdue = inv.status === 'overdue'
                    const isPending = inv.status === 'pending'
                    return (
                      <motion.div key={inv.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={`px-5 py-5 hover:bg-slate-50/50 transition-colors ${isOverdue ? 'border-l-4 border-red-400' : ''}`}>
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-navy font-mono text-sm">{inv.invoice_number}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: cfg.bg, color: cfg.color }}>
                                {cfg.icon} {cfg.label}
                              </span>
                              {isOverdue && (
                                <span className="text-[10px] font-bold text-red-500">
                                  · Due {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : 'N/A'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{inv.project?.service_type || 'Service'}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 flex-wrap">
                              <span>🗓 Created {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              {inv.due_date && inv.status !== 'paid' && (
                                <span>📅 Due {new Date(inv.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              )}
                              {inv.paid_at && (
                                <span className="text-green-500 font-medium">✅ Paid {new Date(inv.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <p className="text-xl font-extrabold text-navy font-heading">
                              ₹{inv.total.toLocaleString('en-IN')}
                            </p>
                            <button
                              onClick={() => handlePrint(inv)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-100 cursor-pointer transition-all"
                              title="Download Invoice">
                              📥 PDF
                            </button>
                            {(isPending || isOverdue) && (
                              <PaymentButton
                                amount={inv.total}
                                invoiceId={inv.id}
                                label={`Pay ₹${inv.total.toLocaleString('en-IN')}`}
                                description={`Invoice ${inv.invoice_number} — ${inv.project?.service_type || 'Service'}`}
                                onSuccess={() => fetchInvoices()}
                              />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer note */}
            {!loading && invoices.length > 0 && (
              <p className="text-xs text-slate-400 text-center mt-5">
                🔒 All payments are secured by Razorpay. For disputes, contact{' '}
                <a href="mailto:support@karyasaarthi.com" className="text-accent hover:underline">support@karyasaarthi.com</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
