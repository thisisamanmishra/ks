import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/chat/groups — list group chats the user is a member of
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  const { data: memberships, error } = await supabase
    .from('group_chat_members')
    .select(`
      group:group_id(
        id, name, type, created_at,
        members:group_chat_members(count)
      )
    `)
    .eq('user_id', user.userId)
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('Fetch Groups Error:', error)
  }

  const groups = (memberships || []).map(m => m.group).filter(Boolean)
  return NextResponse.json({ groups, _debugError: error?.message })
}

// POST /api/chat/groups — create group
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { name, description, type = 'general', member_ids = [] } = await request.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  // Use Service Role to bypass RLS since route is protected
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Clean payload. Undefined description won't crash, but empty string on a non-existent column might
  const insertPayload: any = { name, type, created_by: user.userId }
  if (description) insertPayload.description = description

  let { data: group, error } = await supabaseAdmin
    .from('group_chats')
    .insert(insertPayload)
    .select().single()

  if (error) {
    console.error('Group Insert Error:', error)
    // If it crashed due to description column not existing, try without it
    if (error.code === 'PGRST204' || error.message.includes('description') || error.message.includes('column')) {
      const fallbackPayload = { name, type, created_by: user.userId }
      const fallback = await supabaseAdmin.from('group_chats').insert(fallbackPayload).select().single()
      if (fallback.error) {
        console.error('Fallback Insert Error:', fallback.error)
        return NextResponse.json({ error: fallback.error.message }, { status: 500 })
      }
      group = fallback.data
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Add creator + members
  // Ensure array is numbers
  const safeMemberIds = Array.isArray(member_ids) ? member_ids.map(Number).filter(n => !isNaN(n)) : []
  const allMembers = [...new Set([Number(user.userId), ...safeMemberIds])]
  
  const { error: membersError } = await supabaseAdmin.from('group_chat_members').insert(
    allMembers.map(uid => ({ group_id: group.id, user_id: uid, role: uid === Number(user.userId) ? 'admin' : 'member' }))
  )

  if (membersError) {
    console.error('Members Error:', membersError)
    // We don't fail the group creation, since group is already made, but return error to UI
    return NextResponse.json({ error: `Group Created but failed to add members: ${membersError.message}`, group }, { status: 500 })
  }

  return NextResponse.json({ group }, { status: 201 })
}
