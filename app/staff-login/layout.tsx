import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Staff Login',
  description: 'Karya Saarthi internal staff portal. Login to access your admin, pillar member, or board member dashboard.',
  robots: { index: false, follow: false },
}

export default function StaffLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
