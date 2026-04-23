import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HackathonsClient from '@/components/HackathonsClient'

// ISR: Revalidate every hour
export const revalidate = 3600

export const metadata = {
  title: 'Hackathons — Build, Compete & Win Big',
  description: 'India\'s most challenging hackathons by Karya Saarthi. Compete, innovate, and take home exciting prizes.',
}

async function getHackathons() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('id, title, short_description, event_date, end_date, registration_fee, prize_pool, max_participants, status, tags, is_online, venue')
    .eq('type', 'hackathon')
    .neq('status', 'draft')
    .order('event_date', { ascending: true })
    .limit(100)

  return data || []
}

export default async function HackathonsPage() {
  const hackathons = await getHackathons()

  return (
    <>
      <Navbar />
      <HackathonsClient initialHackathons={hackathons} />
      <Footer />
    </>
  )
}
