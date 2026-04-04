import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// POST /api/events/register
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event_id, name, email, phone, team_name, team_members } = body

    if (!event_id || !name || !email) {
      return NextResponse.json({ error: 'event_id, name, email required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check event exists + not full
    const { data: event } = await supabase
      .from('events')
      .select('id, title, max_participants, registration_fee, status')
      .eq('id', event_id)
      .single()

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (event.status === 'cancelled' || event.status === 'completed') {
      return NextResponse.json({ error: 'Registration closed for this event' }, { status: 400 })
    }

    // Check capacity
    if (event.max_participants) {
      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .in('status', ['registered', 'confirmed'])

      if (count && count >= event.max_participants) {
        return NextResponse.json({ error: 'Event is full' }, { status: 400 })
      }
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', event_id)
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You have already registered for this event' }, { status: 409 })
    }

    // Get current user if logged in
    const currentUser = await getCurrentUser()

    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id,
        user_id: currentUser?.userId || null,
        name,
        email: email.toLowerCase(),
        phone,
        team_name,
        team_members,
        status: 'registered',
        payment_status: event.registration_fee > 0 ? 'pending' : 'free',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ registration: data, event: { title: event.title, fee: event.registration_fee } }, { status: 201 })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}
