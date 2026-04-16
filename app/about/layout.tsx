import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Karya Saarthi — our mission, vision, leadership team, and the journey of building India\'s most trusted academic and professional services platform.',
  openGraph: {
    title: 'About Karya Saarthi | Our Mission & Team',
    description: 'Meet the team behind Karya Saarthi. Discover our story, values, and commitment to empowering students and businesses across India.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
