'use client'

import { useEffect } from 'react'

export default function SilenceWarnings() {
  useEffect(() => {
    const originalWarn = console.warn
    const originalError = console.error

    // Silence non-critical library warnings
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && (
        args[0].includes('THREE.Clock: This module has been deprecated') ||
        args[0].includes('THREE.WebGLRenderer: WEBGL_lose_context') ||
        // Next.js scroll-behavior warning (handled via data-scroll-behavior attr)
        args[0].includes('scroll-behavior: smooth') ||
        // React router double-invoke in StrictMode
        args[0].includes('double invoke')
      )) {
        return
      }
      originalWarn(...args)
    }

    // Silence non-critical error-level messages
    console.error = (...args) => {
      if (typeof args[0] === 'string' && (
        // WebGL context loss is a browser resource management event — not a real error
        args[0].includes('THREE.WebGLRenderer: Context Lost') ||
        args[0].includes('WebGL context') ||
        // Supabase real-time channel errors (transient reconnections)
        args[0].includes('RealtimeChannel') ||
        // Next.js HMR reconnection noise
        args[0].includes('[Fast Refresh]')
      )) {
        return
      }
      originalError(...args)
    }

    return () => {
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  return null
}
