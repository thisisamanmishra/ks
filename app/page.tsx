import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import LiveStatsBar from '@/components/LiveStatsBar'
import dynamic from 'next/dynamic'

// Lazy load below-the-fold components to improve initial load performance
const ServiceTiles = dynamic(() => import('@/components/ServiceTiles'), { ssr: true })
const HowItWorks = dynamic(() => import('@/components/HowItWorks'), { ssr: true })
const PillarsSection = dynamic(() => import('@/components/PillarsSection'), { ssr: true })
const StatsSection = dynamic(() => import('@/components/StatsSection'), { ssr: true })
const EventsPreviewSection = dynamic(() => import('@/components/EventsPreviewSection'))
const HackathonsSection = dynamic(() => import('@/components/HackathonsSection'))
const PodcastsSection = dynamic(() => import('@/components/PodcastsSection'))
const TestimonialsSection = dynamic(() => import('@/components/TestimonialsSection'), { ssr: true })
const QuickAccessDashboard = dynamic(() => import('@/components/QuickAccessDashboard'))
const CTABanner = dynamic(() => import('@/components/CTABanner'), { ssr: true })
const NewsletterSection = dynamic(() => import('@/components/NewsletterSection'), { ssr: true })
const Footer = dynamic(() => import('@/components/Footer'), { ssr: true })

// These are client-heavy widgets, definitely lazy load them
const Chatbot = dynamic(() => import('@/components/Chatbot'))
const WhatsAppWidget = dynamic(() => import('@/components/WhatsAppWidget'))

export const metadata = {
  title: 'Karya Saarthi — Hum Hai Aapke Saathi | Academic, Technical & Business Services',
  description: 'Karya Saarthi provides expert academic writing, technical, business, and government services across India. Get free quotes, track your project, and connect with our 5-pillar support system.',
}

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <LiveStatsBar />
      <ServiceTiles />
      <HowItWorks />
      <PillarsSection />
      <StatsSection />
      <EventsPreviewSection />
      <HackathonsSection />
      <PodcastsSection />
      <TestimonialsSection />
      <QuickAccessDashboard />
      <CTABanner />
      <NewsletterSection />
      <Footer />
      <Chatbot />
      <WhatsAppWidget />
    </>
  )
}
