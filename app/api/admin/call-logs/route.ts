import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const callerId = searchParams.get('caller_id')
  const outcome = searchParams.get('outcome')

  const supabase = await createClient()
  
  try {
    let query = supabase
      .from('call_logs')
      .select(`
        id, phone, duration_seconds, outcome, notes, follow_up_date, called_at,
        caller:caller_id(fullname),
        lead:lead_id(name)
      `)
      .order('called_at', { ascending: false })
      .limit(200)

    if (callerId) query = query.eq('caller_id', callerId)
    if (outcome) query = query.eq('outcome', outcome)

    const { data, error } = await query
    
    if (error) {
      // If table doesn't exist, return empty
      if (error.code === '42P01') return NextResponse.json({ logs: [] })
      console.error('Call logs GET error:', error)
      return NextResponse.json({ logs: [] })
    }
    return NextResponse.json({ logs: data || [] })
  } catch (err) {
    console.error('Call logs GET exception:', err)
    return NextResponse.json({ logs: [] })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { phone, lead_id, duration_seconds, outcome, notes, follow_up_date } = body
    if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('call_logs')
      .insert({ 
        caller_id: user.userId, 
        phone, 
        lead_id: lead_id || null, 
        duration_seconds: duration_seconds || 0, 
        outcome: outcome || 'no_answer', 
        notes: notes || null, 
        follow_up_date: follow_up_date || null 
      })
      .select('id').single()

    if (error) {
      console.error('Call log insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ log: data }, { status: 201 })
  } catch (err) {
    console.error('Call log POST exception:', err)
    return NextResponse.json({ error: 'Failed to save call log' }, { status: 500 })
  }
}
