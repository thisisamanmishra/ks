import { NextResponse } from 'next/server'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

// GET /api/direct-messages?userId=X  → fetch DM thread between current user and user X
// GET /api/direct-messages?contacts=1 → fetch contact list with latest message & unread count
export async function GET(request: Request) {
  try {
    const me = await requireAuth()
    const myId = me.userId   // ← correct field (JWT stores userId, not id)
    const supabase = await createClient()
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const contacts = url.searchParams.get('contacts')

    if (contacts) {
      // Build contacts list from the users table
      let query = supabase
        .from('users')
        .select('id, fullname, email, phone, role')
        .neq('id', myId)

      // Admins / super_admins see all customers + vendors
      if (me.role === 'super_admin' || me.role === 'admin') {
        query = query.in('role', ['customer', 'vendor'])
      } else {
        // Customers and vendors only see admins/ops team
        query = query.in('role', ['super_admin', 'admin'])
      }

      const { data, error } = await query.order('fullname', { ascending: true })
      if (error) throw error

      // Build base contact list — always succeeds even without DM table
      let contactsWithMeta = (data || []).map(c => ({
        ...c,
        lastMessage: null as null | { content: string; created_at: string; sender_id: number },
        unreadCount: 0,
      }))

      // Try to enrich with last-message metadata.
      // Silently skip if direct_messages table doesn't exist yet.
      try {
        const enriched = await Promise.all(contactsWithMeta.map(async (contact) => {
          const { data: msgs } = await supabase
            .from('direct_messages')
            .select('content, created_at, sender_id, is_read')
            .or(`and(sender_id.eq.${myId},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${myId})`)
            .order('created_at', { ascending: false })
            .limit(1)

          const { count: unread } = await supabase
            .from('direct_messages')
            .select('id', { count: 'exact', head: true })
            .eq('sender_id', contact.id)
            .eq('receiver_id', myId)
            .eq('is_read', false)

          return {
            ...contact,
            lastMessage: msgs?.[0] || null,
            unreadCount: unread || 0,
          }
        }))
        contactsWithMeta = enriched
      } catch {
        // direct_messages table may not exist yet — return contacts without metadata
      }

      // Sort: contacts with messages first (by date), then alphabetically
      contactsWithMeta.sort((a, b) => {
        if (a.lastMessage && !b.lastMessage) return -1
        if (!a.lastMessage && b.lastMessage) return 1
        if (a.lastMessage && b.lastMessage) {
          return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
        }
        return a.fullname.localeCompare(b.fullname)
      })

      return NextResponse.json({ contacts: contactsWithMeta })
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Fetch messages in this conversation
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select(`
        id, content, attachment_url, file_type, is_read, created_at,
        sender:users!direct_messages_sender_id_fkey(id, fullname, role)
      `)
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true })

    if (error) {
      // If table doesn't exist yet, return empty messages
      if (error.code === '42P01') {
        return NextResponse.json({ messages: [] })
      }
      throw error
    }

    // Mark messages from the other user as read
    await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('sender_id', userId)
      .eq('receiver_id', myId)
      .eq('is_read', false)

    return NextResponse.json({ messages: messages || [] })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// POST /api/direct-messages  → send a DM
export async function POST(request: Request) {
  try {
    const me = await requireAuth()
    const myId = me.userId   // ← correct field
    const supabase = await createClient()
    const body = await request.json()
    const { receiver_id, content, attachment_url, file_type } = body

    if (!receiver_id) {
      return NextResponse.json({ error: 'receiver_id required' }, { status: 400 })
    }
    if (!content?.trim() && !attachment_url) {
      return NextResponse.json({ error: 'content or attachment required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: myId,
        receiver_id,
        content: content?.trim() || '',
        attachment_url: attachment_url || null,
        file_type: file_type || null,
        is_read: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: data })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
