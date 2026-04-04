import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// POST /api/services/referral — validate and apply a referral code
export async function POST(request: Request) {
  const { code, service_id } = await request.json()
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const supabase = await createClient()
  const { data: ref } = await supabase
    .from('referral_codes')
    .select('*, pillar_member:pillar_member_id(id, user_id, pillar, total_commission)')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (!ref) return NextResponse.json({ valid: false, error: 'Invalid or expired referral code' })

  // Check expiry
  if (ref.expires_at && new Date(ref.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Referral code has expired' })
  }

  // Check max uses
  if (ref.max_uses && ref.uses >= ref.max_uses) {
    return NextResponse.json({ valid: false, error: 'Referral code usage limit reached' })
  }

  return NextResponse.json({
    valid: true,
    code: ref.code,
    discount_percent: ref.discount_percent,
    bonus_amount: ref.bonus_amount,
    message: `${ref.discount_percent}% discount applied!`,
  })
}

// PATCH /api/services/referral — increment usage after conversion
export async function PATCH(request: Request) {
  const { code } = await request.json()
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const supabase = await createClient()
  // Try RPC first, fall back to manual update
  const { error: rpcError } = await supabase.rpc('increment_referral_code_uses', { p_code: code })
  if (rpcError) {
    // Fallback: manual increment
    const { data } = await supabase.from('referral_codes').select('id, uses').eq('code', code).single()
    if (data) await supabase.from('referral_codes').update({ uses: data.uses + 1 }).eq('id', data.id)
  }

  return NextResponse.json({ success: true })
}

// GET /api/services/referral — admin: list all codes
export async function GET() {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin', 'board_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('referral_codes')
    .select('*, pillar_member:pillar_member_id(user_id, pillar, total_commission, user:user_id(fullname))')
    .order('created_at', { ascending: false })

  return NextResponse.json({ codes: data || [] })
}
