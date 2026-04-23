import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EventsClient from '@/components/EventsClient'

// ISR: Revalidate every hour — cached at the edge globally
export const revalidate = 3600

export const metadata = {
  title: 'Events & Programs — Karya Saarthi',
  description: 'Discover upcoming hackathons, podcasts, seminars, webinars & workshops. Learn, compete & grow with Karya Saarthi.',
}

async function getEvents() {
  const supabase = await createClient()

  const fullSelect = 'id, title, slug, type, short_description, featured_image, event_date, end_date, venue, is_online, max_participants, prize_pool, registration_fee, status, tags, created_at'
  const extendedSelect = `${fullSelect}, guest_name, audio_url`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let events: any[] | null = null

  const { data, error } = await supabase
    .from('events')
    .select(extendedSelect)
    .neq('status', 'draft')
    .order('event_date', { ascending: true })
    .limit(100)

  if (!error) {
    events = data
  } else if (error.code === '42703' || error.message?.includes('column')) {
    // Fallback if extended columns don't exist yet
    const fallback = await supabase
      .from('events')
      .select(fullSelect)
      .neq('status', 'draft')
      .order('event_date', { ascending: true })
      .limit(100)
    events = fallback.data
  }

  return events || []
}

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <>
      <Navbar />
      <EventsClient initialEvents={events} />
      <Footer />
    </>
  )
}
