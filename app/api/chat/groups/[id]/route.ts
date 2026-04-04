import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

type Params = { params: Promise<{ id: string }> }

// GET /api/chat/groups/[id] — messages + members
export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const supabase = await createClient()

  // Check membership
  const { data: member } = await supabase
    .from('group_chat_members')
    .select('user_id')
    .eq('group_id', id)
    .eq('user_id', user.userId)
    .single()

  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const [{ data: messages }, { data: members }, { data: group }] = await Promise.all([
    supabase
      .from('group_messages')
      .select(`id, content, attachment_url, file_type, created_at, is_deleted,
        sender:sender_id(id, fullname, role, avatar_url),
        reads:group_message_reads(user_id)`)
      .eq('group_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100),
    supabase
      .from('group_chat_members')
      .select('user_id, role, joined_at, user:user_id(id, fullname, role, avatar_url)')
      .eq('group_id', id),
    supabase
      .from('group_chats')
      .select('id, name, type')
      .eq('id', id)
      .single(),
  ])

  // Mark messages as read (non-critical, wrapped in try/catch)
  try {
    const unread = (messages || []).filter(m =>
      !(m.reads || []).some((r: { user_id: number }) => r.user_id === user.userId)
    )
    if (unread.length > 0) {
      await supabase.from('group_message_reads').insert(
        unread.map(m => ({ group_id: Number(id), message_id: m.id, user_id: user.userId }))
      )
    }
  } catch {
    // Non-critical - ignore read-receipt failures
  }

  return NextResponse.json({ group, messages: messages || [], members: members || [] })
}

// POST /api/chat/groups/[id] — send message
export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const supabase = await createClient()
  const { data: member } = await supabase
    .from('group_chat_members').select('user_id').eq('group_id', id).eq('user_id', user.userId).single()
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const { content, attachment_url, file_type } = await request.json()
  if (!content?.trim() && !attachment_url) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const { data, error } = await supabase
    .from('group_messages')
    .insert({ group_id: Number(id), sender_id: user.userId, content: content || '', attachment_url, file_type })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data }, { status: 201 })
}

// DELETE /api/chat/groups/[id] — three modes: deleteGroup, leaveGroup, delete message
export async function DELETE(request: Request, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()

  const body = await request.json().catch(() => ({}))

  // 1. Delete entire group (admin only)
  if (body.deleteGroup) {
    if (!['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Only admins can delete groups' }, { status: 403 })
    }
    // Delete group (cascade deletes messages and members via FK)
    const { error } = await supabase.from('group_chats').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'group_deleted' })
  }

  // 2. Leave group (current user removes themselves)
  if (body.leaveGroup) {
    const { error } = await supabase
      .from('group_chat_members')
      .delete()
      .eq('group_id', Number(id))
      .eq('user_id', user.userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'left_group' })
  }

  // 3. Soft-delete a message
  const { messageId } = body
  if (!messageId) return NextResponse.json({ error: 'messageId or deleteGroup/leaveGroup required' }, { status: 400 })

  const { data: msg } = await supabase.from('group_messages').select('sender_id').eq('id', messageId).single()
  if (msg?.sender_id !== user.userId && !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Cannot delete others messages' }, { status: 403 })
  }

  await supabase.from('group_messages').update({ is_deleted: true, content: '[deleted]' }).eq('id', messageId)
  return NextResponse.json({ success: true, action: 'message_deleted' })
}

