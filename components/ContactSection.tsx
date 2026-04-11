'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

const ContactMapPin = dynamic(() => import('./ThreeElements').then(m => m.ContactMapPin), { ssr: false })

export default function ContactSection() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Thank you! We\'ll get back to you soon.')
  }

  return (
    <section id="contact" className="py-20 lg:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-navy/5 text-navy text-sm font-semibold mb-4">Contact</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-navy font-heading">Get In Touch</h2>
          <p className="mt-4 text-slate-500">Have a project in mind? Let&apos;s talk about it.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input type="text" placeholder="Your Name" required className="px-4 py-3.5 rounded-xl bg-surface border border-slate-200 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 text-sm transition-all" />
                <input type="email" placeholder="Email Address" required className="px-4 py-3.5 rounded-xl bg-surface border border-slate-200 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 text-sm transition-all" />
              </div>
              <input type="tel" placeholder="Phone Number" required className="w-full px-4 py-3.5 rounded-xl bg-surface border border-slate-200 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 text-sm mb-4 transition-all" />
              <select defaultValue="" required className="w-full px-4 py-3.5 rounded-xl bg-surface border border-slate-200 focus:outline-none focus:border-navy text-sm text-slate-500 mb-4">
                <option value="" disabled>Select Service</option>
                <option>Thesis Writing</option>
                <option>Website Development</option>
                <option>Logo Design</option>
                <option>Digital Marketing</option>
                <option>Other</option>
              </select>
              <textarea rows={4} placeholder="Tell us about your project..." required className="w-full px-4 py-3.5 rounded-xl bg-surface border border-slate-200 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 text-sm mb-4 resize-none transition-all" />
              <button type="submit" className="w-full py-4 rounded-xl bg-accent text-white font-bold text-base hover:bg-accent-dark shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-300 cursor-pointer">
                Get Free Quote →
              </button>
            </form>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              {/* 3D Map Pin */}
              <div className="flex items-center justify-center mb-2">
                <ContactMapPin />
              </div>
              <h4 className="font-bold text-navy text-lg mb-4 font-heading text-center">Find Us</h4>
              <div className="space-y-4">
                {[
                  { icon: '📍', label: 'Address', value: 'Gali No 1, Block A, Uttarakhand Enclave, Delhi' },
                  { icon: '📱', label: 'Phone', value: '+91 8595025753 / +91 6238521530' },
                  { icon: '✉️', label: 'Email', value: 'support@karyasaarthi.com' },
                  { icon: '🕐', label: 'Hours', value: 'Available 24/7 (Closed only on major festivals)' },
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

            {/* CTA Card */}
            <div className="bg-navy rounded-2xl p-8 text-white text-center">
              <h3 className="text-xl font-bold mb-3 font-heading">Ready to Transform Your Work?</h3>
              <p className="text-white/70 text-sm mb-6">Join 500+ satisfied clients who trust Karya Saarthi</p>
              <a href="https://wa.me/918595025753" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-3.5 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all cursor-pointer">
                💬 WhatsApp Us Now
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
