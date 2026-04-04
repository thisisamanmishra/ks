'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VideoCallButtonProps {
  label?: string
  participantName?: string
  className?: string
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function VideoCallButton({
  label = 'Start Video Call',
  participantName,
  className,
  style,
  size = 'md',
}: VideoCallButtonProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const generateMeetId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz'
    const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `${seg(3)}-${seg(4)}-${seg(3)}`
  }

  const [meetId] = useState(generateMeetId)
  const meetLink = `https://meet.google.com/${meetId}`

  const openMeet = () => {
    window.open(meetLink, '_blank', 'noopener,noreferrer')
    setShowOptions(false)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch {}
  }

  const shareWhatsApp = () => {
    const msg = participantName
      ? `Hi ${participantName}, join our video call: ${meetLink}`
      : `Join our video call: ${meetLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    setShowOptions(false)
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowOptions(v => !v)}
        className={`flex items-center gap-2 rounded-xl font-bold text-white cursor-pointer transition-all hover:opacity-90 ${SIZES[size]} ${className || ''}`}
        style={style || { background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
        📹 {label}
      </button>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 w-64 z-50">
            <p className="text-xs font-bold text-navy mb-2 font-heading">📹 Video Call Options</p>
            <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3">
              <p className="text-[9px] text-slate-400 mb-1">Generated meet link:</p>
              <p className="text-[10px] font-mono text-accent truncate">{meetLink}</p>
            </div>
            <div className="space-y-1.5">
              <button onClick={openMeet}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 cursor-pointer transition-all">
                🚀 Open Google Meet
              </button>
              <button onClick={copyLink}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer transition-all">
                {linkCopied ? '✅ Link Copied!' : '📋 Copy Link'}
              </button>
              <button onClick={shareWhatsApp}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 cursor-pointer transition-all">
                💬 Share via WhatsApp
              </button>
            </div>
            <button onClick={() => setShowOptions(false)}
              className="mt-2 w-full text-center text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer">
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
