import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email: email.toLowerCase().trim(), name: name || null }, { onConflict: 'email' })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already subscribed!' })
      }
      throw error
    }

    return NextResponse.json({ message: 'Subscribed successfully!' })
  } catch (err) {
    console.error('Newsletter error:', err)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
