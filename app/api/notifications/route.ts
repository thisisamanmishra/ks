import { NextResponse } from 'next/server'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

// GET — fetch current user's notifications
export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || '50')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    const unread = (data || []).filter(n => !n.is_read).length

    return NextResponse.json({ notifications: data || [], unread })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// PATCH — mark notifications as read
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const supabase = await createClient()

    if (body.markAllRead) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.userId)
        .eq('is_read', false)
    } else if (body.notificationId) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', body.notificationId)
        .eq('user_id', user.userId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// DELETE — clear all notifications for current user
export async function DELETE() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    await supabase.from('notifications').delete().eq('user_id', user.userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
