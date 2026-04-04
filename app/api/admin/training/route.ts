import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pillar = searchParams.get('pillar')

  const supabase = await createClient()
  let query = supabase
    .from('training_materials')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (pillar && pillar !== 'all') {
    query = query.or(`pillar.eq.${pillar},pillar.eq.all`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ materials: data || [] })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, file_url, file_type, pillar } = body

  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('training_materials')
    .insert({ title, description, file_url, file_type: file_type || 'pdf', pillar: pillar || 'all', is_published: true, created_by: user.userId })
    .select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data }, { status: 201 })
}
