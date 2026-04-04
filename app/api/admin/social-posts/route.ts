import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/admin/social-posts
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')
  const status = searchParams.get('status')

  const supabase = await createClient()
  let query = supabase
    .from('social_posts')
    .select('*, creator:created_by(fullname)')
    .order('scheduled_at', { ascending: true })

  if (platform && platform !== 'all') query = query.eq('platform', platform)
  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data || [] })
}

// POST /api/admin/social-posts — schedule a post
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { platform, title, content, media_url, hashtags, scheduled_at, campaign_id } = body

  if (!platform || !content) {
    return NextResponse.json({ error: 'Platform and content required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_posts')
    .insert({ platform, title, content, media_url, hashtags, scheduled_at, status: scheduled_at ? 'scheduled' : 'draft', campaign_id, created_by: user.userId })
    .select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data }, { status: 201 })
}

// PATCH /api/admin/social-posts — update/publish post
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // If marking as published, set published_at
  if (updates.status === 'published' && !updates.published_at) {
    updates.published_at = new Date().toISOString()
  }

  const supabase = await createClient()
  const { error } = await supabase.from('social_posts').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/social-posts
export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  const supabase = await createClient()
  const { error } = await supabase.from('social_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
