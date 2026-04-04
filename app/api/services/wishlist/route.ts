import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/services/wishlist — get user's wishlist
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('service_wishlist')
    .select('service_id')
    .eq('user_id', user.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ wishlist: data?.map(w => w.service_id) || [] })
}

// POST /api/services/wishlist — toggle wishlist
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { service_id } = await request.json()
  if (!service_id) return NextResponse.json({ error: 'service_id required' }, { status: 400 })

  const supabase = await createClient()

  // Check if already in wishlist
  const { data: existing } = await supabase
    .from('service_wishlist')
    .select('id')
    .eq('user_id', user.userId)
    .eq('service_id', service_id)
    .single()

  if (existing) {
    // Remove from wishlist
    await supabase.from('service_wishlist').delete().eq('id', existing.id)
    return NextResponse.json({ added: false, message: 'Removed from wishlist' })
  } else {
    // Add to wishlist
    await supabase.from('service_wishlist').insert({ user_id: user.userId, service_id })
    return NextResponse.json({ added: true, message: 'Added to wishlist' })
  }
}
