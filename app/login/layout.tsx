import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your Karya Saarthi account to track your projects, manage orders, and connect with our expert team.',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
