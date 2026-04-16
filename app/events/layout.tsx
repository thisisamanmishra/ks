import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events & Seminars',
  description: 'Discover upcoming events, seminars, workshops, and hackathons organised by Karya Saarthi. Join us to learn, network, and grow.',
  openGraph: {
    title: 'Events & Seminars | Karya Saarthi',
    description: 'Join Karya Saarthi events — workshops, seminars, hackathons, and networking sessions for students and professionals.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
