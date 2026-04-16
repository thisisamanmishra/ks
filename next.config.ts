import type { NextConfig } from 'next'

const securityHeaders = [
  // Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Block iframe embedding (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Legacy XSS filter for old browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Strict referrer for privacy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features we don't use
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  // Force HTTPS for 2 years (only apply in production — set via env or hardcode for Vercel)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + inline needed for Next.js hydration + Razorpay + Google Fonts
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com",
      // Styles: self + inline (Tailwind CSS-in-JS) + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: self + data URIs + Supabase storage + common image hosts
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://images.unsplash.com https://picsum.photos https://placehold.co https://i.pravatar.cc https://via.placeholder.com",
      // API connections: self + Supabase + Razorpay
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.razorpay.com https://lumberjack.razorpay.com wss://*.supabase.co https://www.google-analytics.com",
      // Iframes: Razorpay checkout
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
      // Workers: only self
      "worker-src 'self' blob:",
      // Objects: block Flash and plugins
      "object-src 'none'",
      // Base URI: restrict to self
      "base-uri 'self'",
      // Form actions: only self
      "form-action 'self'",
      // Upgrade HTTP to HTTPS
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // ── React ──────────────────────────────────────────────────────────────────
  reactStrictMode: true,

  // ── Security headers on all routes ────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // ── Image domains (Vercel Image Optimization) ──────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
    // Vercel free plan: minimize transforms to save bandwidth
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },

  // ── Server Actions ─────────────────────────────────────────────────────────
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        'karyasaarthi.vercel.app',
        // Add your custom domain here when you have it
      ],
    },
  },

  // ── Compiler ───────────────────────────────────────────────────────────────
  // Remove console.log in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn', 'info'] }
      : false,
  },

  // ── Build ──────────────────────────────────────────────────────────────────
  typescript: { ignoreBuildErrors: false },

  // ── Power Vercel-specific env ──────────────────────────────────────────────
  // @ts-ignore — allowedDevOrigins is a Next.js 16 extension
  allowedDevOrigins: ['10.131.29.105', '10.212.154.105'],
}

export default nextConfig
