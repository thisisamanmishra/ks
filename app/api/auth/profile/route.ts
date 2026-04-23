import { NextResponse } from 'next/server'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

// GET current user profile
export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, fullname, email, phone, role, department, user_type, avatar_url, created_at, slack_connected')
      .eq('id', user.userId)
      .single()

    if (error) throw error
    return NextResponse.json({ profile: data })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// PATCH — update profile fields
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const supabase = await createClient()

    const updates: Record<string, unknown> = {}
    if (body.fullname?.trim()) updates.fullname = body.fullname.trim()
    if (body.phone?.trim()) updates.phone = body.phone.trim()
    if (body.user_type) updates.user_type = body.user_type

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.userId)
      .select('id, fullname, email, phone, role, department, user_type, avatar_url, slack_connected')
      .single()

    if (error) throw error
    return NextResponse.json({ profile: data })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
