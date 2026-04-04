'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CTABanner() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-r from-accent via-accent to-accent-dark relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white font-heading">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-white/80 text-lg max-w-2xl mx-auto">
            Join 500+ satisfied clients who trust KaryaSaarthi for their academic
            and professional needs. Get your free quote today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="px-10 py-4 rounded-2xl bg-white text-accent font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Get Free Quote →
            </Link>
            <a
              href="https://wa.me/918595025753"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 rounded-2xl border-2 border-white/40 text-white font-bold text-lg hover:bg-white/10 hover:border-white/60 transition-all duration-300"
            >
              💬 WhatsApp Us
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
