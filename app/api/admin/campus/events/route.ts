import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

let memoryEvents: any[] = []
let idCounter = 1

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createClient()
  const { data, error } = await supabase.from('campus_events').select('*').order('event_date', { ascending: true })

  if (error) {
    console.error('Error fetching campus_events:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: data || [] })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createClient()
  const body = await req.json()

  const payload = {
    title: body.title, college: body.college || null,
    event_date: body.date || null, registrations: body.registrations || 0,
    status: 'upcoming', created_by: user.userId
  }

  const { data, error } = await supabase.from('campus_events').insert(payload).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createClient()
  const { id, ...updates } = await req.json()
  
  const { data, error } = await supabase.from('campus_events').update(updates).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data })
}
