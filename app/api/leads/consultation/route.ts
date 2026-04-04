import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// POST /api/leads/consultation — book a free consultation slot
export async function POST(request: Request) {
  const body = await request.json()
  const { name, email, phone, service_interest, preferred_date, preferred_time, message } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consultation_bookings')
    .insert({
      name, email, phone, service_interest,
      preferred_date, preferred_time, message,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also create a CRM lead record
  await supabase.from('leads').insert({
    name, email, phone,
    source: 'website',
    service_interest,
    stage: 'new',
    priority: 'medium',
    type: 'consultation',
    preferred_date,
    preferred_time,
  })

  return NextResponse.json({ success: true, id: data.id }, { status: 201 })
}

// GET /api/leads/consultation — admin: list all bookings
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const supabase = await createClient()
  let query = supabase
    .from('consultation_bookings')
    .select('*')
    .order('preferred_date', { ascending: true })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookings: data || [] })
}

// PATCH /api/leads/consultation — update booking status
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, zoom_link, notes, assigned_to } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('consultation_bookings')
    .update({ status, zoom_link, notes, assigned_to })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
