import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createClient()
  const { data } = await supabase.from('calling_scripts').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ scripts: data || [] })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase.from('calling_scripts').insert({
    title: body.title, content: body.content || null,
    objection_handling: body.objection || null, category: body.category || 'general'
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ script: data })
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const supabase = await createClient()
  await supabase.from('calling_scripts').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
