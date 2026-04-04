import { NextResponse } from 'next/server'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Use service role key for storage operations to bypass RLS
function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, serviceKey)
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip', 'application/x-rar-compressed']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    const supabase = getStorageClient()
    const ext = file.name.split('.').pop() || 'bin'
    const safeName = `${user.userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(safeName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(data.path)

    const fileType = file.type.startsWith('image/') ? 'image' : 'file'

    return NextResponse.json({
      url: urlData.publicUrl,
      file_type: fileType,
      original_name: file.name,
    })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// DELETE — delete a file from storage
export async function DELETE(request: Request) {
  try {
    await requireAuth()
    const { path } = await request.json()
    if (!path) return NextResponse.json({ error: 'Path required' }, { status: 400 })

    const supabase = getStorageClient()

    // Extract path after bucket name
    const url = new URL(path)
    const pathParts = url.pathname.split('/chat-attachments/')
    const filePath = pathParts[1]

    if (filePath) {
      await supabase.storage.from('chat-attachments').remove([filePath])
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
