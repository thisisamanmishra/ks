'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const Scene3D = dynamic(() => import('./Scene3D'), { ssr: false })

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 17 + 7) % 100}%`,
  top: `${(i * 23 + 11) % 100}%`,
  size: 4 + (i % 7),
  delay: i * 0.2,
}))

export default function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-navy via-navy-dark to-navy">
      {/* 3D Background (desktop) */}
      <div className="absolute inset-0 opacity-[0.12] hidden md:block">
        <Scene3D />
      </div>

      {/* Mobile particles (no 3D) */}
      <div className="absolute inset-0 md:hidden">
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-accent/50"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
            animate={{ y: [0, -30, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: p.delay }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-28 pb-28 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-semibold mb-6"
            >
              ✅ Trusted by 500+ Clients
            </motion.span>

            <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] xl:text-[5.5rem] font-extrabold text-white leading-[1.1] font-heading">
              <span className="whitespace-nowrap">Karya <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-light">Saarthi</span></span>
            </h1>

            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold text-white/90 leading-tight">
              Your Trusted Work Companion
            </h2>

            <p className="mt-5 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
              We don&apos;t just complete your work — we guide, teach, and empower
              you. From thesis writing to website development, get expert help
              with a personal touch.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="px-8 py-4 rounded-2xl bg-accent text-white font-bold text-base shadow-xl shadow-accent/30 hover:shadow-accent/50 hover:scale-105 transition-all duration-300"
              >
                Get Free Quote →
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-2xl border-2 border-white/30 text-white font-bold text-base hover:bg-white/10 hover:border-white/50 transition-all duration-300"
              >
                Track Project
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap gap-8">
              {[
                { value: '500+', label: 'Projects' },
                { value: '98%', label: 'Satisfaction' },
                { value: '80%', label: 'Repeat Clients' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                >
                  <div className="text-2xl lg:text-3xl font-extrabold text-white font-heading">{s.value}</div>
                  <div className="text-white/50 text-sm">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — decorative */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="hidden lg:flex justify-center"
          >
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 to-navy-light/20 blur-3xl" />
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-accent/30 to-transparent border border-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-6xl">🤝</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-accent rounded-full" />
        </div>
      </motion.div>
    </section>
  )
}
