import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { service_id, name, email, phone, message, budget } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const user = await getCurrentUser()

    const { data, error } = await supabase
      .from('service_enquiries')
      .insert({
        service_id: service_id || null,
        user_id: user?.userId || null,
        name,
        email: email.toLowerCase(),
        phone,
        message,
        budget,
        status: 'new',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ enquiry: data }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to send enquiry' }, { status: 500 })
  }
}
