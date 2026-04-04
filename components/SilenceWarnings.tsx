'use client'

import { useEffect } from 'react'

export default function SilenceWarnings() {
  useEffect(() => {
    const originalWarn = console.warn
    console.warn = (...args) => {
      // Silence specific non-critical library warnings
      if (typeof args[0] === 'string' && (
        args[0].includes('THREE.Clock: This module has been deprecated') ||
        args[0].includes('THREE.WebGLRenderer: WEBGL_lose_context')
      )) {
        return
      }
      originalWarn(...args)
    }

    return () => {
      console.warn = originalWarn
    }
  }, [])

  return null
}
