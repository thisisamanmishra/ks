import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('blogs')
      .select(`
        *,
        category:blog_categories(id, name, slug),
        author:users!blogs_author_id_fkey(id, fullname, avatar_url)
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    // Increment views
    await supabase.from('blogs').update({ views: (data.views || 0) + 1 }).eq('id', data.id)

    return NextResponse.json({ blog: data })
  } catch (err) {
    console.error('Blog fetch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
