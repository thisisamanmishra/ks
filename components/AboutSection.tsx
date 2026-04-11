'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

const TimelineNode3D = dynamic(() => import('./ThreeElements').then(m => m.TimelineNode3D), { ssr: false })

const timeline = [
  { year: '2023', title: 'Karya Saarthi Founded', desc: 'Started with a vision to make professional services accessible to all.' },
  { year: '2023', title: 'First 100 Clients', desc: 'Crossed 100 happy clients within 6 months of launch.' },
  { year: '2024', title: '500+ Projects Done', desc: 'Expanded to 50+ service categories across academic, tech, and design.' },
  { year: '2025', title: 'Going Digital', desc: 'Launched online platform with AI-powered service matching.' },
]

export default function AboutSection() {
  return (
    <section id="about" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">Our Story</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-navy font-heading">About Karya Saarthi</h2>
        </motion.div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 lg:p-10">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-navy mb-4 font-heading">Our Vision</h3>
            <p className="text-slate-600 leading-relaxed">To become India&apos;s most trusted work companion platform where every student, professional, and business owner finds not just a service provider — but a mentor, guide, and Saarthi for their success journey.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 lg:p-10">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-navy mb-4 font-heading">Our Mission</h3>
            <p className="text-slate-600 leading-relaxed">To empower people with affordable, high-quality professional services while teaching and building skills. We believe in collaborative growth — we don&apos;t just do the work, we help you learn and grow.</p>
          </motion.div>
        </div>

        {/* 3D Timeline */}
        <div className="relative">
          <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-navy via-accent to-navy-light hidden lg:block" />
          <div className="space-y-8 lg:space-y-16">
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`flex flex-col lg:flex-row items-center gap-6 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
              >
                <div className={`flex-1 ${i % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-xl transition-shadow hover:-translate-y-1 duration-300">
                    <span className="text-accent font-bold text-sm">{item.year}</span>
                    <h4 className="text-lg font-bold text-navy mt-1 font-heading">{item.title}</h4>
                    <p className="text-slate-500 text-sm mt-2">{item.desc}</p>
                  </div>
                </div>
                {/* 3D Timeline Node */}
                <div className="hidden lg:flex flex-shrink-0 z-10">
                  <TimelineNode3D index={i} />
                </div>
                <div className="flex-1" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '🏆', value: '500+', label: 'Happy Clients' },
            { icon: '📦', value: '1000+', label: 'Projects Delivered' },
            { icon: '⭐', value: '4.9/5', label: 'Average Rating' },
            { icon: '🔄', value: '80%', label: 'Repeat Rate' },
          ].map(a => (
            <div key={a.label} className="text-center p-6 rounded-2xl bg-navy/5 hover:bg-navy hover:text-white transition-all duration-300 group cursor-pointer">
              <div className="text-3xl mb-2">{a.icon}</div>
              <div className="text-3xl font-extrabold text-navy group-hover:text-white font-heading">{a.value}</div>
              <div className="text-sm text-slate-500 group-hover:text-white/70 mt-1">{a.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
