import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const supabase = await createClient()

  try {
    if (type === 'stats') {
      // Fetch completed projects
      const { count: completedProjects } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Fetch active projects today
      const { count: activeProjects } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['in_progress', 'payment_pending', 'pending'])

      // Fetch happy clients
      const { count: happyClients } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')

      return NextResponse.json({
        completed_projects: completedProjects || 120,
        active_projects: activeProjects || 15,
        happy_clients: happyClients || 98,
        active_pillars: 5 // Default fixed pillars
      })
    }

    if (type === 'testimonial') {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          rating,
          review,
          customer:users!ratings_customer_id_fkey(fullname, profile_image),
          project:service_requests!ratings_project_id_fkey(service_type)
        `)
        .gte('rating', 4)
        .not('review', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        // Fallback dynamic structure if no ratings in DB
        return NextResponse.json({
          rating: 5,
          review: "Working with Karya Saarthi has been a phenomenal experience. Their multi-pillar setup made operations seamless and highly professional.",
          customer: { fullname: "Priya Sharma", profile_image: null },
          project: { service_type: "Academic Consulting" }
        })
      }

      return NextResponse.json(data)
    }

    if (type === 'podcast') {
      const { data, error } = await supabase
        .from('dm_content_performance')
        .select('*')
        .eq('type', 'Podcast')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data && !error) {
        return NextResponse.json({
          title: data.title,
          guest: data.guest || 'Special Guest', // Optional field if not natively tracked
          date: data.date || data.created_at,
          listen_link: data.link || "https://open.spotify.com",
          subscribe_youtube: "https://youtube.com",
          embed_url: data.link || "https://open.spotify.com/embed/show/4rOoJ6Egrf8K2IrywzwOMk",
        })
      }

      // Fallback if no real podcast has been created inside the database yet
      return NextResponse.json({
        title: "Scaling Modern Startups Beyond Tier-1 Cities",
        guest: "Ritesh Agarwal",
        date: new Date().toISOString(),
        listen_link: "https://open.spotify.com",
        subscribe_youtube: "https://youtube.com",
        embed_url: "https://open.spotify.com/embed/show/4rOoJ6Egrf8K2IrywzwOMk",
      })
    }

    return NextResponse.json({ error: 'Valid type parameter required (stats, testimonial, podcast)' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
