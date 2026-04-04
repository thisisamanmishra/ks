import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/services/[id]
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: service, error } = await supabase
    .from('services')
    .select(`
      *,
      expert:expert_id(id, fullname, avatar_url, email)
    `)
    .or(`id.eq.${id},slug.eq.${id}`)
    .eq('is_active', true)
    .single()

  if (error || !service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  return NextResponse.json({ service })
}

// PATCH /api/services/[id] (admin)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data })
}
