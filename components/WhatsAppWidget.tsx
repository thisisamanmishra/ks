'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function WhatsAppWidget() {
  const [showTooltip, setShowTooltip] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show after slight delay so it doesn't flash immediately
    const t = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
        >
          {/* Tooltip popup */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl p-4 max-w-[220px] border border-slate-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">KS</div>
                  <div>
                    <p className="text-xs font-bold text-navy">Karya Saarthi</p>
                    <p className="text-[10px] text-green-500 font-medium">● Online — typically replies in minutes</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mb-3">👋 Hi! How can we help you today? Chat with us on WhatsApp.</p>
                <a
                  href="https://wa.me/918595025753?text=Hi%20Karya%20Saarthi%2C%20I%20need%20help%20with..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: '#25D366' }}
                >
                  Start Chat →
                </a>
                {/* Triangle */}
                <div className="absolute bottom-[-6px] right-8 w-3 h-3 bg-white rotate-45 border-b border-r border-slate-100" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* WhatsApp button */}
          <motion.button
            onClick={() => setShowTooltip(v => !v)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-2xl cursor-pointer relative"
            style={{ background: '#25D366', boxShadow: '0 8px 24px rgba(37,211,102,0.4)' }}
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: '2px solid rgba(37,211,102,0.5)' }}
              animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            💬
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
