import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const supabase = await createClient()
  let query = supabase
    .from('content_submissions')
    .select(`
      id, title, platform, content_url, status, submitted_at, likes, views, description,
      creator:creator_id(id, user_id, user:user_id(fullname))
    `)
    .order('submitted_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ submissions: data || [] })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, reviewer_notes } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await createClient()
  const updates: Record<string, unknown> = { status, reviewer_notes, reviewer_id: user.userId }
  if (status === 'published') updates.published_at = new Date().toISOString()

  const { error } = await supabase.from('content_submissions').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
