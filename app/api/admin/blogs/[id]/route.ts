import { NextResponse } from 'next/server'
import { requireDepartment, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'
import slugify from 'slugify'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('blogs')
      .select(`
        *,
        category:blog_categories(id, name, slug),
        author:users!blogs_author_id_fkey(id, fullname, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    return NextResponse.json({ blog: data })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireDepartment('marketing')
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.title) {
      updates.title = body.title
      updates.slug = slugify(body.title, { lower: true, strict: true })
    }
    if (body.content !== undefined) updates.content = body.content
    if (body.excerpt !== undefined) updates.excerpt = body.excerpt
    if (body.category_id !== undefined) updates.category_id = body.category_id
    if (body.featured_image !== undefined) updates.featured_image = body.featured_image
    if (body.tags !== undefined) updates.tags = body.tags
    if (body.is_published !== undefined) {
      updates.is_published = body.is_published
      if (body.is_published) updates.published_at = new Date().toISOString()
    }
    if (body.is_featured !== undefined) updates.is_featured = body.is_featured
    if (body.meta_title !== undefined) updates.meta_title = body.meta_title
    if (body.meta_description !== undefined) updates.meta_description = body.meta_description

    const { data, error } = await supabase
      .from('blogs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ blog: data })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireDepartment('marketing')
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase.from('blogs').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ message: 'Blog deleted' })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
