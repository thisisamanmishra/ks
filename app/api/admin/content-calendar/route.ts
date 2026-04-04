import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // YYYY-MM format

  const supabase = await createClient()
  let query = supabase
    .from('content_calendar')
    .select('*')
    .order('scheduled_date', { ascending: true })

  if (month) {
    query = query
      .gte('scheduled_date', `${month}-01`)
      .lt('scheduled_date', `${month}-31`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data || [] })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.title || !body.scheduled_date) {
    return NextResponse.json({ error: 'Title and scheduled_date required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_calendar')
    .insert({ ...body, created_by: user.userId, status: body.status || 'planned' })
    .select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.from('content_calendar').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
