import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog & Insights',
  description: 'Read the latest articles, tips, and insights on academic writing, digital marketing, career growth, startups, and professional development from Karya Saarthi experts.',
  openGraph: {
    title: 'Blog & Insights | Karya Saarthi',
    description: 'Expert articles on thesis writing, SEO, web development, campus life, and career success — from the Karya Saarthi team.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
