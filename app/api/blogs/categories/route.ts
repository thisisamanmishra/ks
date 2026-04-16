import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name')

    // If table doesn't exist yet, return empty array instead of 500
    if (error) {
      if (error.code === '42P01') { // undefined_table
        return NextResponse.json({ categories: [] })
      }
      console.error('Categories fetch error:', error.message)
      return NextResponse.json({ categories: [] })
    }

    return NextResponse.json({ categories: data || [] })
  } catch (err) {
    console.error('Categories fetch error:', err)
    return NextResponse.json({ categories: [] })
  }
}
