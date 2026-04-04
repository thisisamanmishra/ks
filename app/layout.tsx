import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import SilenceWarnings from '@/components/SilenceWarnings'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({ weight: ['400', '600', '700'], subsets: ['latin'], variable: '--font-poppins' })

export const metadata = {
  title: 'KaryaSaarthi | Premium Academic & Professional Services',
  description: 'Your trusted partner for Thesis Writing, Web Development, SEO, and Digital Marketing.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased text-slate-900 bg-white`}>
        <SilenceWarnings />
        {children}
      </body>
    </html>
  )
}
