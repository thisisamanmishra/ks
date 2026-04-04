'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => Math.round(v))
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const unsub = rounded.on('change', v => setDisplay(v))
    return unsub
  }, [rounded])

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          animate(count, target, { duration: 2, ease: 'easeOut' })
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [count, target])

  return (
    <span ref={ref}>
      {display}{suffix}
    </span>
  )
}

const stats = [
  { icon: '🏆', value: 500, suffix: '+', label: 'Projects Completed' },
  { icon: '⭐', value: 98, suffix: '%', label: 'Client Satisfaction' },
  { icon: '🔄', value: 80, suffix: '%', label: 'Repeat Clients' },
  { icon: '🎓', value: 50, suffix: '+', label: 'Service Categories' },
]

export default function StatsSection() {
  return (
    <section className="py-20 lg:py-24 bg-navy relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-accent/5 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-accent/5 translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-white font-heading">
            Numbers That Speak
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            Our growing community of satisfied clients and successful projects.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="text-4xl lg:text-5xl font-extrabold text-white font-heading">
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-white/50 text-sm mt-2">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
