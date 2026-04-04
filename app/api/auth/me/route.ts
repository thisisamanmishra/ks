import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const tokenUser = await getCurrentUser()

  if (!tokenUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Fetch fresh user data from DB
  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('id, fullname, email, phone, role, department, pillar_role, is_approved, avatar_url, user_type, status, created_at')
    .eq('id', tokenUser.userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}
