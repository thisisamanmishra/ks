import { NextResponse } from 'next/server'
import { requireRole, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireRole('super_admin', 'admin')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('admin_requests')
      .select(`
        id, requested_department, message, status, created_at, reviewed_at,
        user:users!admin_requests_user_id_fkey(id, fullname, email, phone, role)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ requests: data || [] })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
