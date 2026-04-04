import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/services/search-suggestions?q=thesis
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ suggestions: [] })

  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('id, title, category, slug, price_min, rating')
    .eq('is_active', true)
    .ilike('title', `%${q}%`)
    .order('is_featured', { ascending: false })
    .order('total_orders', { ascending: false })
    .limit(6)

  return NextResponse.json({ suggestions: data || [] })
}
