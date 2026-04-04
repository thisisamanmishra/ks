import { NextResponse } from 'next/server'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

// GET — messages for a project
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    // Verify access to this project
    const { data: project } = await supabase
      .from('service_requests')
      .select('user_id, assigned_to')
      .eq('id', id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    // Admins/super_admins can view all project chats
    if (user.role === 'customer' && project.user_id !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.role === 'vendor' && project.assigned_to !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, fullname, role, avatar_url)
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Mark unread messages as read for this user
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('project_id', id)
      .neq('sender_id', user.userId)

    return NextResponse.json({ messages: messages || [] })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// POST — send a message (with optional attachment)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { content, attachment_url, file_type } = body

    if (!content?.trim() && !attachment_url) {
      return NextResponse.json({ error: 'Message content or attachment is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify access
    const { data: project } = await supabase
      .from('service_requests')
      .select('user_id, assigned_to')
      .eq('id', id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    // Admins/super_admins can send messages to any project
    if (user.role === 'customer' && project.user_id !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.role === 'vendor' && project.assigned_to !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const insertData: Record<string, unknown> = {
      project_id: Number(id),
      sender_id: user.userId,
      content: content?.trim() || (file_type === 'image' ? '📷 Image' : '📎 File'),
    }
    if (attachment_url) insertData.attachment_url = attachment_url
    if (file_type) insertData.file_type = file_type

    const { data, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, fullname, role, avatar_url)
      `)
      .single()

    if (error) throw error

    // Fire email notifications to other participants (non-blocking)
    ;(async () => {
      try {
        const { sendEmail, newProjectMessageEmail } = await import('@/lib/email')
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const projectUrl = `${siteUrl}/dashboard`

        // Fetch all participant details
        const participantIds = [project.user_id, project.assigned_to].filter(Boolean) as number[]
        const { data: participants } = await supabase
          .from('users')
          .select('id, fullname, email, role')
          .in('id', participantIds)

        // Also fetch one ops admin
        const { data: opsAdmins } = await supabase
          .from('users')
          .select('id, fullname, email')
          .eq('role', 'admin')
          .eq('department', 'operations')
          .limit(1)

        const { data: projectDetails } = await supabase
          .from('service_requests')
          .select('service_type')
          .eq('id', id)
          .single()

        const projectName = projectDetails?.service_type || 'Your Project'
        const senderName = data.sender?.fullname || 'Someone'
        const msgPreview = content?.trim() || (attachment_url ? '📎 Sent a file' : '')

        const recipients = [
          ...(participants || []),
          ...(opsAdmins || []),
        ].filter(r => r.id !== user.userId)

        const seen = new Set<number>()
        for (const recipient of recipients) {
          if (seen.has(recipient.id)) continue
          seen.add(recipient.id)
          if (recipient.email && msgPreview) {
            sendEmail({
              to: recipient.email,
              ...newProjectMessageEmail({
                recipientName: recipient.fullname,
                senderName,
                projectName,
                messagePreview: msgPreview,
                projectUrl,
              }),
            })
          }
        }
      } catch { /* silent — don't break the response */ }
    })()

    return NextResponse.json({ message: data }, { status: 201 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// DELETE — delete a message (sender or admin only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { messageId } = await request.json()

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the message to check ownership
    const { data: msg } = await supabase
      .from('messages')
      .select('id, sender_id, attachment_url, project_id')
      .eq('id', messageId)
      .eq('project_id', id)
      .single()

    if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

    // Only the sender or admins can delete
    if (msg.sender_id !== user.userId && !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If the message has an attachment, delete it from storage too
    if (msg.attachment_url) {
      try {
        const url = new URL(msg.attachment_url)
        const pathParts = url.pathname.split('/chat-attachments/')
        if (pathParts[1]) {
          await supabase.storage.from('chat-attachments').remove([pathParts[1]])
        }
      } catch { /* ignore storage cleanup errors */ }
    }

    await supabase.from('messages').delete().eq('id', messageId)

    return NextResponse.json({ success: true })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
