import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import SilenceWarnings from '@/components/SilenceWarnings'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://karyasaarthi.vercel.app'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1B3A6B',
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Karya Saarthi | Academic & Professional Services',
    template: '%s | Karya Saarthi',
  },
  description:
    'Karya Saarthi is your trusted partner for Thesis Writing, Research Papers, Web Development, Digital Marketing, SEO, and Campus Ambassador programs. Expert support for students and businesses.',
  keywords: [
    'thesis writing',
    'research paper help',
    'web development services',
    'digital marketing',
    'SEO services',
    'academic writing',
    'campus ambassador',
    'karya saarthi',
    'professional services India',
    'dissertation help',
  ],
  authors: [{ name: 'Karya Saarthi', url: BASE_URL }],
  creator: 'Karya Saarthi',
  publisher: 'Karya Saarthi',
  category: 'Education & Professional Services',

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: BASE_URL,
    siteName: 'Karya Saarthi',
    title: 'Karya Saarthi | Academic & Professional Services',
    description:
      'Expert thesis writing, web development, digital marketing, and campus programs. Trusted by 10,000+ students and businesses.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Karya Saarthi — Premium Academic & Professional Services',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Karya Saarthi | Academic & Professional Services',
    description:
      'Expert thesis writing, web development, digital marketing, and campus programs.',
    images: ['/og-image.png'],
    creator: '@karyasaarthi',
    site: '@karyasaarthi',
  },

  // Canonical & alternate
  alternates: {
    canonical: BASE_URL,
  },

  // Icons — multi-format for all browsers
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  // Crawling
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification (add your Google Search Console code here)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Favicons — explicit tags for maximum browser compatibility */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/icon-16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* JSON-LD: Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Karya Saarthi',
              url: BASE_URL,
              logo: `${BASE_URL}/logo.png`,
              sameAs: [
                'https://www.linkedin.com/company/karyasaarthi',
                'https://twitter.com/karyasaarthi',
                'https://www.instagram.com/karyasaarthi',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+91-8595025753',
                contactType: 'customer support',
                areaServed: 'IN',
                availableLanguage: ['English', 'Hindi'],
              },
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'IN',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased text-slate-900 bg-white`}
      >
        <SilenceWarnings />
        {children}
      </body>
    </html>
  )
}
