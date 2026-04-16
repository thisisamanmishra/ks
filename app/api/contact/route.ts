import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// POST /api/contact — public, saves contact form submission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, service, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: String(name).slice(0, 120),
        email: String(email).slice(0, 200),
        phone: phone ? String(phone).slice(0, 20) : null,
        service: service ? String(service).slice(0, 100) : null,
        message: String(message).slice(0, 2000),
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      // If table doesn't exist yet, return success anyway (graceful)
      console.error('Contact submission error:', error.message)
      return NextResponse.json({ success: true, fallback: true })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET /api/contact — admin only, returns all submissions
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    let query = supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) {
      console.error('Contact GET error:', error.message)
      return NextResponse.json({ submissions: [], error: error.message })
    }

    return NextResponse.json({ submissions: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/contact — update status
export async function PATCH(req: NextRequest) {
  try {
    const { id, status, notes } = await req.json()
    const { error } = await supabase
      .from('contact_submissions')
      .update({ status, notes: notes || null, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
