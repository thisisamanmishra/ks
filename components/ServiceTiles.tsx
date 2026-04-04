'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

const categories = [
  {
    title: 'Programming & Tech',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: 'Graphics & Design',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.476-1.125-.29-.289-.48-.7-.48-1.187 0-.926.71-1.687 1.648-1.687H16c2.757 0 5-2.104 5-4.702C21 6.376 16.973 2 12 2z" />
      </svg>
    ),
  },
  {
    title: 'Digital Marketing',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
  {
    title: 'Writing & Translation',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    title: 'Video & Animation',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    title: 'AI Services',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
      </svg>
    ),
  },
]

function CategoryCard({ cat, index }: { cat: typeof categories[0]; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="flex-1"
    >
      <Link
        href="/services"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl border border-slate-200 cursor-pointer w-full"
        style={{
          background: hovered
            ? `radial-gradient(ellipse 70% 55% at 42% 38%, rgba(255,107,53,0.38) 0%, rgba(255,107,53,0.18) 52%, transparent 72%),
               radial-gradient(ellipse 40% 35% at 72% 68%, rgba(255,107,53,0.22) 0%, transparent 65%),
               #ffffff`
            : '#ffffff',
          borderColor: hovered ? 'rgba(255,107,53,0.45)' : '#e2e8f0',
          transition: 'background 0.35s ease, border-color 0.35s ease',
        }}
      >
        {/* Icon stays same color always */}
        <div className="text-slate-500 mb-4">
          {cat.icon}
        </div>

        {/* Text stays same color always */}
        <span className="text-[13px] font-semibold text-slate-700 text-center leading-snug">
          {cat.title}
        </span>
      </Link>
    </motion.div>
  )
}

export default function ServiceTiles() {
  return (
    <section className="py-14 lg:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-navy/5 text-navy text-sm font-semibold mb-4">
            Popular Categories
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy font-heading">
            Explore Our Services
          </h2>
        </motion.div>

        {/* 6 equal cards in one row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.title} cat={cat} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Link
            href="/services"
            className="inline-block px-8 py-3 rounded-xl bg-navy text-white font-semibold text-sm shadow-lg shadow-navy/20 hover:bg-[#1B3A6B]/80 transition-all duration-300"
          >
            View More →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
