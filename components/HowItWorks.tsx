'use client'

import { motion } from 'framer-motion'

const steps = [
  { num: '01', icon: '📝', title: 'Request', desc: 'Submit your project requirements through our simple form or WhatsApp.' },
  { num: '02', icon: '👨‍💼', title: 'Assign', desc: 'We match you with the best expert for your specific project needs.' },
  { num: '03', icon: '🔄', title: 'Deliver', desc: 'Track progress in real-time and receive quality-checked deliverables.' },
  { num: '04', icon: '⭐', title: 'Review', desc: 'Approve the work, request revisions, and leave your feedback.' },
]

export default function HowItWorks() {
  return (
    <section className="py-20 lg:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold text-navy font-heading">
            How It Works
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connector line (desktop) — runs through the center of icon boxes */}
          <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-accent/40 via-navy/30 to-accent/40" />

          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center group"
            >
              {/* Number circle */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center justify-center text-2xl mb-5 group-hover:bg-accent group-hover:shadow-accent/20 transition-all duration-300 relative z-10">
                <span className="group-hover:scale-110 transition-transform">{s.icon}</span>
              </div>
              <div className="text-xs font-bold text-accent mb-2">{s.num}</div>
              <h3 className="font-bold text-navy text-lg mb-2 font-heading">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
