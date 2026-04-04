import { NextResponse } from 'next/server'
import { requireDepartment, authErrorResponse, getCurrentUser } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'
import slugify from 'slugify'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const isPublic = url.searchParams.get('public') === 'true'

    const supabase = await createClient()

    let query = supabase
      .from('blogs')
      .select(`
        *,
        category:blog_categories(id, name, slug),
        author:users!blogs_author_id_fkey(id, fullname, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (isPublic) {
      query = query.eq('is_published', true)
    } else {
      // Admin access
      await requireDepartment('marketing')
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ blogs: data || [] })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireDepartment('marketing')
    const body = await request.json()
    const supabase = await createClient()

    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const slug = slugify(body.title, { lower: true, strict: true })

    // Check for duplicate slug
    const { data: existing } = await supabase.from('blogs').select('id').eq('slug', slug).single()
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug

    const { data, error } = await supabase
      .from('blogs')
      .insert({
        title: body.title,
        slug: finalSlug,
        content: body.content,
        excerpt: body.excerpt || body.content.replace(/<[^>]+>/g, '').substring(0, 200),
        category_id: body.category_id || null,
        author_id: user.userId,
        featured_image: body.featured_image || null,
        tags: body.tags || [],
        is_published: body.is_published || false,
        is_featured: body.is_featured || false,
        meta_title: body.meta_title || body.title,
        meta_description: body.meta_description || body.content.replace(/<[^>]+>/g, '').substring(0, 160),
        published_at: body.is_published ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ blog: data }, { status: 201 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
