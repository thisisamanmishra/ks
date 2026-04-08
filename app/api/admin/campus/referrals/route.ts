import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET: List all referral uses (optionally filter by ambassador_id or referral_code)
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ambassadorId = searchParams.get('ambassador_id')
  const referralCode = searchParams.get('code')

  const supabase = await createClient()
  let query = supabase
    .from('campus_referral_uses')
    .select('*, ambassador:ambassador_id(fullname, college, referral_code)')
    .order('created_at', { ascending: false })

  if (ambassadorId) query = query.eq('ambassador_id', parseInt(ambassadorId))
  if (referralCode) query = query.eq('referral_code', referralCode)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ referrals: data || [] })
}

// POST: Record a new referral use
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { ambassador_id, referral_code, lead_name, lead_email, lead_phone, revenue, status } = body

  if (!ambassador_id || !referral_code) {
    return NextResponse.json({ error: 'ambassador_id and referral_code required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('campus_referral_uses')
    .insert({
      ambassador_id,
      referral_code,
      lead_name: lead_name || null,
      lead_email: lead_email || null,
      lead_phone: lead_phone || null,
      revenue: revenue || 0,
      status: status || 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update ambassador's lead count and revenue
  const { data: referrals } = await supabase
    .from('campus_referral_uses')
    .select('revenue, status')
    .eq('ambassador_id', ambassador_id)

  const totalLeads = referrals?.length || 0
  const totalRevenue = referrals?.reduce((sum, r) => sum + (r.revenue || 0), 0) || 0
  const commission = Math.round(totalRevenue * 0.05)

  await supabase
    .from('campus_ambassadors')
    .update({ leads: totalLeads, revenue: totalRevenue, commission })
    .eq('id', ambassador_id)

  return NextResponse.json({ referral: data }, { status: 201 })
}

// PATCH: Update referral status (converted/lost)
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, status, revenue } = body

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const supabase = await createClient()
  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (revenue !== undefined) updates.revenue = revenue

  const { data, error } = await supabase
    .from('campus_referral_uses')
    .update(updates)
    .eq('id', id)
    .select('ambassador_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalculate ambassador totals
  if (data?.ambassador_id) {
    const { data: referrals } = await supabase
      .from('campus_referral_uses')
      .select('revenue, status')
      .eq('ambassador_id', data.ambassador_id)

    const totalLeads = referrals?.length || 0
    const totalRevenue = referrals?.reduce((sum, r) => sum + (r.revenue || 0), 0) || 0
    const commission = Math.round(totalRevenue * 0.05)

    await supabase
      .from('campus_ambassadors')
      .update({ leads: totalLeads, revenue: totalRevenue, commission })
      .eq('id', data.ambassador_id)
  }

  return NextResponse.json({ success: true })
}
