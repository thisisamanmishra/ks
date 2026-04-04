import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json({ categories: data || [] })
  } catch (err) {
    console.error('Categories fetch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
