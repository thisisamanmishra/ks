import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('campus_ambassadors')
    .select('*')
    .order('leads', { ascending: false })

  if (error) {
    console.error('Error fetching campus_ambassadors:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ambassadors: data || [] })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const body = await req.json()

  const payload = {
    fullname: body.fullname,
    email: body.email || null,
    phone: body.phone || null,
    college: body.college || null,
    city: body.city || null,
    notes: body.notes || null,
    target: body.target || 50,
    leads: 0,
    revenue: 0,
    commission: 0,
    referral_code: body.referral_code || `CAMPUS${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    status: 'active',
  }

  const { data, error } = await supabase
    .from('campus_ambassadors')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ambassador: data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'Ambassador ID required' }, { status: 400 })

  // Auto-recalculate commission as 5% of revenue if revenue is being updated
  if (updates.revenue !== undefined && updates.commission === undefined) {
    updates.commission = Math.round(updates.revenue * 0.05)
  }

  const { data, error } = await supabase
    .from('campus_ambassadors')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ambassador: data })
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Ambassador ID required' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('campus_ambassadors')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
