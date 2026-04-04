import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  const supabase = await createClient()
  const { data } = await supabase.from('project_comm_logs').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
  return NextResponse.json({ logs: data || [] })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase.from('project_comm_logs').insert({
    project_id: body.project_id, note: body.note, author: body.author || user.fullname || 'Admin',
    type: body.type || 'note', author_id: user.userId
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}
