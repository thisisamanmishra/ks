import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import LiveStatsBar from '@/components/LiveStatsBar'
import ServiceTiles from '@/components/ServiceTiles'
import HowItWorks from '@/components/HowItWorks'
import PillarsSection from '@/components/PillarsSection'
import StatsSection from '@/components/StatsSection'
import EventsPreviewSection from '@/components/EventsPreviewSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import QuickAccessDashboard from '@/components/QuickAccessDashboard'
import CTABanner from '@/components/CTABanner'
import NewsletterSection from '@/components/NewsletterSection'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'
import WhatsAppWidget from '@/components/WhatsAppWidget'

export const metadata = {
  title: 'KaryaSaarthi — Hum Hai Aapke Saathi | Academic, Technical & Business Services',
  description: 'KaryaSaarthi provides expert academic writing, technical, business, and government services across India. Get free quotes, track your project, and connect with our 5-pillar support system.',
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
