import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Karya Saarthi. Reach out for project enquiries, academic writing help, digital marketing, web development, and more. We respond within 2 hours.',
  openGraph: {
    title: 'Contact Karya Saarthi | Get a Free Quote',
    description: 'Have a project in mind? Contact us today. Our experts respond within 2 hours.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
