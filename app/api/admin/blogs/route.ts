import { NextResponse } from 'next/server'
import { requireDepartment, authErrorResponse, getCurrentUser } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'
import slugify from 'slugify'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const isPublic = url.searchParams.get('public') === 'true'

    const supabase = await createClient()

    // Admin access check (for non-public requests)
    if (!isPublic) {
      try {
        await requireDepartment('marketing')
      } catch {
        const user = await getCurrentUser()
        if (!user || !['super_admin', 'board_member', 'admin'].includes(user.role)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
      }
    }

    // Try query with FK join first
    let query = supabase
      .from('blogs')
      .select(`
        id, title, slug, excerpt, is_featured, is_published, views, created_at, published_at,
        category:blog_categories(id, name, slug),
        author:users!blogs_author_id_fkey(id, fullname)
      `)
      .order('created_at', { ascending: false })

    if (isPublic) {
      query = query.eq('is_published', true)
    }

    let { data, error } = await query

    // If join fails (wrong FK name, missing table, etc.) fall back to plain query
    if (error) {
      console.warn('[blogs] Full join failed, trying plain query:', error.message)

      // ⚠️ IMPORTANT: Must assign the result of .eq() back — it's immutable chain
      let fallbackQuery = supabase
        .from('blogs')
        .select('id, title, slug, excerpt, is_featured, is_published, views, created_at, published_at, category_id, author_id')
        .order('created_at', { ascending: false })

      if (isPublic) {
        fallbackQuery = fallbackQuery.eq('is_published', true)
      }

      const fallbackResult = await fallbackQuery

      if (fallbackResult.error) {
        if (fallbackResult.error.code === '42P01') {
          // Table doesn't exist yet
          return NextResponse.json({ blogs: [], debug: 'Table missing' })
        }
        console.error('[blogs] Fallback query also failed:', fallbackResult.error.message)
        return NextResponse.json({ blogs: [], debug: 'fallback failed', error: fallbackResult.error.message })
      }

      // Map raw data to expected shape (cast to any to avoid join type mismatch)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data = (fallbackResult.data || []).map(b => ({
        ...b,
        category: null,
        author: null,
      })) as any
      error = null
    }

    return NextResponse.json({ blogs: data || [], debug: { originalError: (error as any)?.message, fallbackUsed: !!error } })
  } catch (err: any) {
    console.error('[blogs GET] Unhandled error:', err)
    return NextResponse.json({ blogs: [], debug: 'catch block', error: String(err) })
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
