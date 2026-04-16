import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Podcasts',
  description: 'Listen to Karya Saarthi podcasts covering academic success, digital marketing, startup journeys, career tips, and student life in India.',
  openGraph: {
    title: 'Podcasts | Karya Saarthi',
    description: 'Expert conversations on thesis writing, digital marketing, career growth, and life as a student entrepreneur.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function PodcastsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
