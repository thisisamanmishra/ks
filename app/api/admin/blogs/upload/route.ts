import { NextResponse } from 'next/server'
import { requireDepartment, authErrorResponse } from '@/lib/auth/middleware'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, serviceKey)
}

export async function POST(request: Request) {
  try {
    await requireDepartment('marketing')
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Max 5MB for blog images
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Max 5MB' }, { status: 400 })
    }

    // Only allow images
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only image files are allowed (jpeg, png, gif, webp, svg)' }, { status: 400 })
    }

    const supabase = getStorageClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const safeName = `blog-images/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(safeName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Blog image upload error:', error)
      return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
