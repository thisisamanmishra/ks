import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Services',
  description: 'Explore Karya Saarthi\'s full range of professional services — academic writing, thesis & dissertation help, web development, digital marketing, graphic design, AI services, and more.',
  openGraph: {
    title: 'Services | Karya Saarthi',
    description: 'From thesis writing to full-stack development and digital marketing — explore all services offered by Karya Saarthi.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
