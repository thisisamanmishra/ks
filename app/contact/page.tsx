'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setMsg("Thank you! We'll get back to you within 2 hours. 🎉")
        setForm({ name: '', email: '', phone: '', service: '', message: '' })
      } else {
        const d = await res.json()
        setStatus('error')
        setMsg(d.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMsg('Network error. Please try again.')
    }
  }

  const inp = 'w-full px-4 py-3.5 rounded-xl bg-surface border border-slate-200 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 text-sm transition-all'

  return (
    <>
      <Navbar />
      <main className="pt-20 lg:pt-24 pb-20 bg-surface min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="text-3xl lg:text-5xl font-bold text-navy font-heading">Get In Touch</h1>
            <p className="mt-3 text-slate-500">Have a project in mind? Let&apos;s talk about it. We typically respond within 2 hours.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Form */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <h3 className="font-bold text-navy text-xl mb-6 font-heading">Send Us a Message</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text" placeholder="Your Name" required value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className={inp} />
                  <input
                    type="email" placeholder="Email Address" required value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className={inp} />
                </div>
                <input
                  type="tel" placeholder="Phone Number" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className={`${inp} mb-4`} />
                <select
                  value={form.service}
                  onChange={e => setForm(p => ({ ...p, service: e.target.value }))}
                  className={`${inp} mb-4 text-slate-500`}>
                  <option value="">Select Service Category</option>
                  <option>Programming &amp; Tech</option>
                  <option>Graphics &amp; Design</option>
                  <option>Digital Marketing</option>
                  <option>Writing &amp; Translation</option>
                  <option>Video &amp; Animation</option>
                  <option>AI Services</option>
                  <option>Music &amp; Audio</option>
                  <option>Business</option>
                  <option>Consulting</option>
                  <option>Other</option>
                </select>
                <textarea
                  rows={5} placeholder="Tell us about your project..." required
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  className={`${inp} mb-4 resize-none`} />

                {status === 'success' && (
                  <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                    ✅ {msg}
                  </div>
                )}
                {status === 'error' && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                    ❌ {msg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full py-4 rounded-xl bg-accent text-white font-bold text-base hover:bg-accent-dark shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-300 cursor-pointer disabled:opacity-60">
                  {status === 'loading' ? '⏳ Sending...' : status === 'success' ? '✅ Sent!' : 'Get Free Quote →'}
                </button>
              </form>
            </motion.div>

            {/* Info + Map */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              {/* Contact info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-navy text-xl mb-6 font-heading">Contact Information</h3>
                <div className="space-y-5">
                  {[
                    { icon: '📍', label: 'Address', value: 'Gali No 1, Block A, Uttarakhand Enclave, Nathupura, Burari, North Delhi, Delhi 110084' },
                    { icon: '📱', label: 'Phone', value: '+91 8595025753 / +91 6238521530' },
                    { icon: '✉️', label: 'Email', value: 'support@karyasaarthi.com' },
                    { icon: '🕐', label: 'Hours', value: 'Open 24/7 (Closed only on major festivals)' },
                  ].map(c => (
                    <div key={c.label} className="flex items-start gap-4">
                      <span className="text-2xl">{c.icon}</span>
                      <div>
                        <h5 className="font-semibold text-navy text-sm">{c.label}</h5>
                        <p className="text-slate-500 text-sm">{c.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp CTA */}
              <div className="bg-green-500 rounded-2xl p-8 text-white text-center">
                <h3 className="text-xl font-bold mb-3 font-heading">Quick Response on WhatsApp</h3>
                <p className="text-white/80 text-sm mb-6">Get an instant response — just send us a message!</p>
                <a
                  href="https://wa.me/918595025753"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-3.5 rounded-xl bg-white text-green-600 font-bold hover:bg-green-50 shadow-lg transition-all cursor-pointer">
                  💬 WhatsApp Us Now
                </a>
              </div>

              {/* Google Map */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3498.2!2d77.19!3d28.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDQ1JzAwLjAiTiA3N8KwMTEnMjQuMCJF!5e0!3m2!1sen!2sin!4v1"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Karya Saarthi Location"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
      <Chatbot />
    </>
  )
}
