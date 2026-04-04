import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin', 'pillar_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const pillar = searchParams.get('pillar') || user.pillarRole

  if (!pillar) return NextResponse.json({ error: 'pillar required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pillar_members')
    .select(`
      *,
      user:user_id(id, fullname, email, phone)
    `)
    .eq('pillar', pillar)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pillar, members: data || [] })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = await createClient()
  const { data, error } = await supabase.from('pillar_members').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ member: data }, { status: 201 })
}
