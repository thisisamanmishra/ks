import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PodcastsClient from '@/components/PodcastsClient'

// ISR: Revalidate every hour
export const revalidate = 3600

export const metadata = {
  title: 'Podcasts — Listen, Learn & Grow',
  description: 'Expert conversations, industry insights, and inspiring stories — curated by Karya Saarthi for ambitious professionals.',
}

async function getPodcasts() {
  const supabase = await createClient()

  const baseSelect = 'id, title, short_description, event_date, registration_fee, status, tags, meeting_link'
  const extendedSelect = `${baseSelect}, guest_name, audio_url`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let podcasts: any[] | null = null

  const { data, error } = await supabase
    .from('events')
    .select(extendedSelect)
    .eq('type', 'podcast')
    .neq('status', 'draft')
    .order('event_date', { ascending: true })
    .limit(100)

  if (!error) {
    podcasts = data
  } else if (error.code === '42703' || error.message?.includes('column')) {
    // Fallback if extended columns don't exist
    const fallback = await supabase
      .from('events')
      .select(baseSelect)
      .eq('type', 'podcast')
      .neq('status', 'draft')
      .order('event_date', { ascending: true })
      .limit(100)
    podcasts = fallback.data
  }

  return podcasts || []
}

export default async function PodcastsPage() {
  const podcasts = await getPodcasts()

  return (
    <>
      <Navbar />
      <PodcastsClient initialPodcasts={podcasts} />
      <Footer />
    </>
  )
}
