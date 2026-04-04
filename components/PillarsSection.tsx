'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const pillars = [
  {
    id: 'campus',
    name: 'Campus Saarthi',
    tagline: 'Empowering Students',
    description: 'Campus ambassadors network connecting students with academic excellence, internships, and college projects.',
    icon: '🎓',
    gradient: 'from-blue-600 to-indigo-700',
    glow: 'rgba(99,102,241,0.3)',
    features: ['College Ambassador Program', 'Academic Project Support', 'Campus Workshops', 'Student Referral Rewards'],
    stat: '200+ Colleges',
  },
  {
    id: 'digital',
    name: 'Digital Saarthi',
    tagline: 'Content & Presence',
    description: 'Full-stack digital solutions — websites, SEO, content creation, social media and brand building.',
    icon: '💻',
    gradient: 'from-violet-600 to-purple-700',
    glow: 'rgba(139,92,246,0.3)',
    features: ['Website Development', 'SEO & Digital Marketing', 'Content Creation', 'Social Media Management'],
    stat: '1000+ Websites',
  },
  {
    id: 'calling',
    name: 'Calling Saarthi',
    tagline: 'Voice-First Outreach',
    description: 'Dedicated calling team for lead generation, customer follow-up, and relationship management.',
    icon: '📞',
    gradient: 'from-orange-500 to-red-600',
    glow: 'rgba(249,115,22,0.3)',
    features: ['Lead Generation Calls', 'Customer Follow-up', 'Survey & Feedback', 'Appointment Setting'],
    stat: '50K+ Calls/yr',
  },
  {
    id: 'government',
    name: 'Government Saarthi',
    tagline: 'Public Sector Excellence',
    description: 'Specialised services for government schemes, tender documentation, and compliance management.',
    icon: '🏛️',
    gradient: 'from-emerald-600 to-teal-700',
    glow: 'rgba(16,185,129,0.3)',
    features: ['Tender Documentation', 'Government Scheme Advisory', 'Compliance Management', 'Policy Research'],
    stat: '500+ Tenders',
  },
  {
    id: 'market',
    name: 'Market Saarthi',
    tagline: 'On-Ground Presence',
    description: 'Field agents network for hyperlocal marketing, offline lead generation, and on-ground business development.',
    icon: '🗺️',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'rgba(245,158,11,0.3)',
    features: ['Field Sales Agents', 'Hyperlocal Marketing', 'Offline Lead Capture', 'Territory Management'],
    stat: '12 States',
  },
]

export default function PillarsSection() {
  return (
    <section className="py-20 bg-[#080d1a] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      {/* Top gradient fade from white */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4"
            style={{ background: 'rgba(255,107,53,0.15)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.3)' }}>
            🏗️ Our 5 Pillars
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white font-heading mb-4">
            The <span style={{ color: '#FF6B35' }}>5 Saarthi</span> Pillars
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            Five specialised verticals working together to deliver comprehensive solutions across every domain of student and business success.
          </p>
        </motion.div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className={`relative rounded-2xl overflow-hidden group cursor-pointer ${i === 4 ? 'md:col-span-2 lg:col-span-1' : ''}`}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Glow on hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 60px ${pillar.glow}` }}
              />

              {/* Top gradient bar */}
              <div className={`h-1 bg-gradient-to-r ${pillar.gradient}`} />

              <div className="p-6">
                {/* Icon + title */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                    {pillar.icon}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white/60"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {pillar.stat}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white font-heading mb-1">{pillar.name}</h3>
                <p className="text-white/40 text-xs mb-3 font-medium uppercase tracking-wider">{pillar.tagline}</p>
                <p className="text-white/50 text-sm mb-5 leading-relaxed">{pillar.description}</p>

                {/* Features list */}
                <ul className="space-y-1.5 mb-5">
                  {pillar.features.map(feat => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-white/40">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${pillar.gradient} flex-shrink-0`} />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={`/contact?pillar=${pillar.id}`}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${pillar.gradient} hover:opacity-90 transition-opacity shadow-lg`}>
                  Connect with {pillar.name.split(' ')[0]} →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-white/30 text-sm mb-4">All pillars work together under one platform — KaryaSaarthi</p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #e0551f)', boxShadow: '0 8px 24px rgba(255,107,53,0.3)' }}>
            Start Your Journey with Us 🚀
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
