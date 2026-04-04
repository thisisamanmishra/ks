import { NextResponse } from 'next/server'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: dbUser, error: fetchErr } = await supabase
      .from('users')
      .select('id, password')
      .eq('id', user.userId)
      .single()

    if (fetchErr || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const match = await bcrypt.compare(currentPassword, dbUser.password)
    if (!match) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password: hashed })
      .eq('id', user.userId)

    if (updateErr) throw updateErr

    return NextResponse.json({ message: 'Password changed successfully' })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
