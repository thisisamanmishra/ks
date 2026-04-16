'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

interface Stat {
  value: number
  suffix: string
  label: string
  icon: string
}

const stats: Stat[] = [
  { value: 5000, suffix: '+', label: 'Projects Completed', icon: '✅' },
  { value: 3200, suffix: '+', label: 'Happy Clients', icon: '😊' },
  { value: 98, suffix: '%', label: 'Success Rate', icon: '🎯' },
  { value: 150, suffix: '+', label: 'Expert Team', icon: '👥' },
  { value: 12, suffix: '+', label: 'States Served', icon: '🗺️' },
  { value: 24, suffix: '/7', label: 'Support Available', icon: '🎧' },
]

function AnimatedCounter({ target, suffix, duration = 2 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let startTime: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, target, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

export default function LiveStatsBar() {
  return (
    <section className="relative py-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0f2545 50%, #1B3A6B 100%)' }}>
      {/* CSS-only shimmer — no JS overhead */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          animation: 'shimmer 8s linear infinite',
        }}
      />
      <style>{`@keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }`}</style>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-4 md:gap-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-4 py-2 text-white"
            >
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <div className="text-xl font-extrabold font-heading leading-none text-white">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-white/50 text-[10px] mt-0.5">{stat.label}</p>
              </div>
              {i < stats.length - 1 && (
                <div className="hidden md:block w-px h-8 bg-white/15 ml-4" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
