'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConsultationBookingProps {
  triggerLabel?: string
  serviceInterest?: string
}

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']

function getNextDays(n: number) {
  const days = []
  const d = new Date()
  for (let i = 1; i <= n; i++) {
    const date = new Date(d)
    date.setDate(d.getDate() + i)
    const day = date.getDay()
    if (day !== 0) { // Skip Sundays
      days.push({
        date: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        isToday: false,
      })
    }
    if (days.length >= 6) break
    i++
  }
  return days
}

const AVAILABLE_DAYS = getNextDays(14)

export default function ConsultationBooking({ triggerLabel = '📞 Book Free Consultation', serviceInterest }: ConsultationBookingProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', service_interest: serviceInterest || '', message: '' })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const reset = () => { setStep(1); setSelectedDate(''); setSelectedTime(''); setForm({ name: '', email: '', phone: '', service_interest: serviceInterest || '', message: '' }); setDone(false) }

  const submit = async () => {
    setSending(true)
    try {
      await fetch('/api/leads/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, preferred_date: selectedDate, preferred_time: selectedTime }),
      })
      setDone(true)
    } catch {} finally { setSending(false) }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => { setOpen(true); reset() }}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white text-sm cursor-pointer hover:opacity-90 transition-all shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1B3A6B, #0f2545)' }}>
        {triggerLabel}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #1B3A6B0A, #1B3A6B04)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-navy font-heading text-lg">📞 Free Consultation</h2>
                    <p className="text-slate-400 text-xs mt-0.5">30-min call with our expert • Zero cost</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-slate-500 cursor-pointer text-xl">✕</button>
                </div>
                {/* Step indicator */}
                {!done && (
                  <div className="flex items-center gap-2 mt-4">
                    {[1, 2, 3].map(s => (
                      <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${step >= s ? 'bg-navy text-white' : 'bg-slate-200 text-slate-400'}`}>{s}</div>
                        <div className={`h-0.5 flex-1 transition-all ${s < 3 ? (step > s ? 'bg-navy' : 'bg-slate-200') : 'hidden'}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {done ? (
                  <div className="text-center py-6">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="font-bold text-navy font-heading text-xl mb-2">Consultation Booked!</h3>
                    <p className="text-slate-500 text-sm mb-1">We'll confirm your slot within 2 hours.</p>
                    <p className="text-slate-400 text-xs">📅 {selectedDate} at {selectedTime}</p>
                    <p className="text-slate-400 text-xs mt-0.5">📧 Check your email for confirmation</p>
                    <button onClick={() => setOpen(false)}
                      className="mt-6 px-6 py-2.5 rounded-xl bg-navy text-white font-bold text-sm cursor-pointer">
                      Done
                    </button>
                  </div>
                ) : step === 1 ? (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-navy">📅 Pick a date</p>
                    <div className="grid grid-cols-3 gap-2">
                      {AVAILABLE_DAYS.map(d => (
                        <button key={d.date} onClick={() => setSelectedDate(d.date)}
                          className={`p-2 rounded-xl text-center text-xs font-medium cursor-pointer transition-all border ${selectedDate === d.date ? 'bg-navy text-white border-navy' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-navy'}`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                    {selectedDate && (
                      <>
                        <p className="text-sm font-bold text-navy mt-4">🕐 Pick a time</p>
                        <div className="grid grid-cols-4 gap-2">
                          {TIME_SLOTS.map(t => (
                            <button key={t} onClick={() => setSelectedTime(t)}
                              className={`py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border ${selectedTime === t ? 'bg-navy text-white border-navy' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-navy'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    <button disabled={!selectedDate || !selectedTime} onClick={() => setStep(2)}
                      className="w-full py-3 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-40 mt-2 transition-all"
                      style={{ background: '#FF6B35' }}>
                      Continue →
                    </button>
                  </div>
                ) : step === 2 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-navy">👤 Your details</p>
                    {[
                      { key: 'name', label: 'Full Name *', type: 'text', placeholder: 'Your full name' },
                      { key: 'email', label: 'Email *', type: 'email', placeholder: 'you@example.com' },
                      { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 XXXXX XXXXX' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder}
                          value={form[f.key as keyof typeof form]}
                          onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">What do you need help with?</label>
                      <input placeholder="e.g. Business plan, website, thesis..."
                        value={form.service_interest}
                        onChange={e => setForm(p => ({ ...p, service_interest: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-50">← Back</button>
                      <button disabled={!form.name || !form.email} onClick={() => setStep(3)}
                        className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-40"
                        style={{ background: '#FF6B35' }}>
                        Next →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-navy">✅ Confirm your booking</p>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Date</span><span className="font-medium text-navy">{selectedDate}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Time</span><span className="font-medium text-navy">{selectedTime}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="font-medium text-navy">{form.name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="font-medium text-navy truncate max-w-[160px]">{form.email}</span></div>
                      {form.service_interest && <div className="flex justify-between"><span className="text-slate-400">Interest</span><span className="font-medium text-navy truncate max-w-[160px]">{form.service_interest}</span></div>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Any additional message?</label>
                      <textarea rows={2} placeholder="Optional..."
                        value={form.message}
                        onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy resize-none" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-50">← Back</button>
                      <button onClick={submit} disabled={sending}
                        className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60"
                        style={{ background: '#1B3A6B' }}>
                        {sending ? '⏳ Booking...' : '📅 Confirm Booking'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
