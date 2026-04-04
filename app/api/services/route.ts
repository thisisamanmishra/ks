import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/services
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('q')
  const sort = searchParams.get('sort') || 'featured'
  const limit = parseInt(searchParams.get('limit') || '12')
  const page = parseInt(searchParams.get('page') || '1')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const offset = (page - 1) * limit

  const supabase = await createClient()
  let query = supabase
    .from('services')
    .select(`
      id, title, slug, category, short_description, price_min, price_max,
      delivery_days, featured_image, rating, total_orders, is_featured, tags,
      expert:expert_id(id, fullname, avatar_url)
    `, { count: 'exact' })
    .eq('is_active', true)
    .range(offset, offset + limit - 1)

  if (category && category !== 'all') query = query.eq('category', category)
  if (search) query = query.ilike('title', `%${search}%`)
  if (minPrice) query = query.gte('price_min', parseFloat(minPrice))
  if (maxPrice) query = query.lte('price_max', parseFloat(maxPrice))

  // Sorting
  switch (sort) {
    case 'price_asc': query = query.order('price_min', { ascending: true }); break
    case 'price_desc': query = query.order('price_max', { ascending: false }); break
    case 'rating': query = query.order('rating', { ascending: false }); break
    case 'delivery': query = query.order('delivery_days', { ascending: true }); break
    case 'popular': query = query.order('total_orders', { ascending: false }); break
    default: query = query.order('is_featured', { ascending: false }).order('total_orders', { ascending: false })
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ services: data || [], total: count || 0, page, limit })
}

// POST /api/services (admin)
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, category, description, short_description, price_min, price_max, delivery_days, tags, expert_id } = body

    if (!title || !category) {
      return NextResponse.json({ error: 'title and category required' }, { status: 400 })
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('services')
      .insert({ title, slug, category, description, short_description, price_min, price_max, delivery_days: delivery_days || 3, tags: tags || [], expert_id: expert_id || null, is_active: true })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ service: data }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
