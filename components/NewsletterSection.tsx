'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage('You\'re subscribed! Welcome to the Karya Saarthi community 🎉')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <section className="py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0f2545 60%, #1B3A6B 100%)' }}>
      {/* Static decorative circles — no infinite JS animation */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
        style={{ background: '#FF6B35' }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-10"
        style={{ background: '#FF6B35' }}
      />

      <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: 'rgba(255,107,53,0.2)', border: '1px solid rgba(255,107,53,0.3)' }}
        >
          ✉️
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-extrabold text-white font-heading mb-3"
        >
          Stay in the <span style={{ color: '#FF6B35' }}>Loop</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-white/50 text-lg mb-8"
        >
          Get updates on new services, events, hackathons, and exclusive offers directly in your inbox.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            disabled={status === 'success'}
            className="flex-1 px-5 py-4 rounded-xl text-sm outline-none border border-white/10 text-white placeholder-white/30 transition-all focus:border-accent/50"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="px-7 py-4 rounded-xl font-bold text-white text-sm transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
            style={{ background: '#FF6B35', boxShadow: '0 4px 20px rgba(255,107,53,0.4)' }}
          >
            {status === 'loading' ? '⏳ Subscribing...' : status === 'success' ? '✅ Subscribed!' : 'Subscribe →'}
          </button>
        </motion.form>

        <AnimatePresence>
          {(status === 'success' || status === 'error') && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-4 text-sm font-medium ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        <p className="text-white/20 text-xs mt-5">
          No spam. Unsubscribe anytime. Your data is safe with us. 🔒
        </p>

        {/* Social pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {[
            { icon: '📱', label: 'WhatsApp', href: 'https://wa.me/918595025753' },
            { icon: '📘', label: 'Facebook', href: '#' },
            { icon: '📸', label: 'Instagram', href: '#' },
            { icon: '💼', label: 'LinkedIn', href: '#' },
            { icon: '🐦', label: 'Twitter', href: '#' },
          ].map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/50 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {s.icon} {s.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
