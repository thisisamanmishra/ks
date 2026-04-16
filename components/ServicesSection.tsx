'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const ServiceIcon3D = dynamic(() => import('./ThreeElements').then(m => m.ServiceIcon3D), { ssr: false })

const serviceCategories = [
  { key: 'all', label: 'All', icon: '🔥' },
  { key: 'academic', label: 'Academic', icon: '📚' },
  { key: 'tech', label: 'Web & Tech', icon: '💻' },
  { key: 'design', label: 'Design', icon: '🎨' },
  { key: 'marketing', label: 'Marketing', icon: '📈' },
  { key: 'writing', label: 'Writing', icon: '✍️' },
]

const serviceCards = [
  { category: 'academic', icon3d: 'thesis', title: 'Thesis Writing & Research', desc: 'Complete thesis support from topic selection to final submission with expert guidance.', badge: 'BESTSELLER' },
  { category: 'tech', icon3d: 'website', title: 'Professional Website', desc: 'Responsive, modern business websites built with the latest technologies.', badge: 'HOT' },
  { category: 'design', icon3d: 'logo', title: 'Logo & Brand Design', desc: 'Unique, professional logo design with unlimited revisions.', badge: '' },
  { category: 'academic', icon3d: 'assignment', title: 'Assignment Help', desc: 'Subject-wise assignment help with detailed explanations and learning.', badge: 'POPULAR' },
  { category: 'marketing', icon3d: 'seo', title: 'SEO & Digital Marketing', desc: 'Improve your website ranking and online presence with proven strategies.', badge: '' },
  { category: 'writing', icon3d: 'blog', title: 'Blog & Article Writing', desc: 'SEO-optimized content that engages readers and drives traffic.', badge: '' },
  { category: 'design', icon3d: 'video', title: 'Professional Video Editing', desc: 'YouTube videos, reels, and promotional videos with cinematic quality.', badge: 'NEW' },
  { category: 'writing', icon3d: 'resume', title: 'Resume & Cover Letter', desc: 'ATS-friendly professional resumes that get you noticed.', badge: '' },
]

const badgeColors: Record<string, string> = {
  BESTSELLER: 'bg-green-500',
  HOT: 'bg-red-500',
  POPULAR: 'bg-blue-500',
  NEW: 'bg-cyan-500',
}

export default function ServicesSection() {
  const [active, setActive] = useState('all')
  const filtered = active === 'all' ? serviceCards : serviceCards.filter(s => s.category === active)

  return (
    <section id="services" className="py-20 lg:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-navy/5 text-navy text-sm font-semibold mb-4">Our Services</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-navy font-heading">Popular Services</h2>
          <p className="mt-4 text-slate-500 max-w-2xl mx-auto">Choose from our most requested professional services — no hidden fees, no surprises.</p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {serviceCategories.map(c => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer ${active === c.key
                  ? 'bg-navy text-white shadow-lg shadow-navy/20'
                  : 'bg-white text-slate-600 hover:bg-navy/5 hover:text-navy border border-slate-200'
                }`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 transition-shadow duration-300 group"
            >
              <div className="p-6">
                {s.badge && (
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold text-white mb-2 ${badgeColors[s.badge] || 'bg-slate-500'}`}>
                    {s.badge}
                  </span>
                )}
                {/* 3D Isometric Icon */}
                <ServiceIcon3D type={s.icon3d} />
                <h3 className="font-bold text-navy text-lg mb-2 font-heading">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{s.desc}</p>
                <button className="w-full py-3 rounded-xl bg-navy/5 text-navy font-semibold text-sm hover:bg-accent hover:text-white transition-all duration-300 cursor-pointer group-hover:bg-accent group-hover:text-white">
                  Request Pricing
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
