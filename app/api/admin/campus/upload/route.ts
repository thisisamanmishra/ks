import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, serviceKey)
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'video/mp4',
  'video/webm',
  'image/jpeg',
  'image/png',
  'image/webp',
]

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Max 50MB for training materials
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 50MB' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    const supabase = getStorageClient()
    const ext = file.name.split('.').pop() || 'bin'
    const safeName = `campus/${user.userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()

    // Try campus-training bucket first, fall back to chat-attachments
    let bucketName = 'campus-training'
    let uploadResult = await supabase.storage
      .from(bucketName)
      .upload(safeName, arrayBuffer, { contentType: file.type, upsert: false })

    if (uploadResult.error && uploadResult.error.message.includes('not found')) {
      // Bucket doesn't exist, use chat-attachments as fallback
      bucketName = 'chat-attachments'
      uploadResult = await supabase.storage
        .from(bucketName)
        .upload(safeName, arrayBuffer, { contentType: file.type, upsert: false })
    }

    if (uploadResult.error) {
      console.error('Upload error:', uploadResult.error)
      return NextResponse.json({ error: 'Upload failed: ' + uploadResult.error.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(uploadResult.data.path)

    // Determine file type label
    let fileType = 'pdf'
    if (file.type.startsWith('video/')) fileType = 'video'
    else if (file.type.startsWith('image/')) fileType = 'image'
    else if (file.type.includes('presentation') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) fileType = 'ppt'
    else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) fileType = 'doc'
    else if (file.type.includes('excel') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) fileType = 'xls'

    return NextResponse.json({
      url: urlData.publicUrl,
      file_type: fileType,
      original_name: file.name,
      size: file.size,
    })
  } catch (err) {
    console.error('Campus upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
