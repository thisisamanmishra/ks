import { NextResponse } from 'next/server'
import { requireRole, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    await requireRole('super_admin', 'admin')
    const supabase = await createClient()
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''
    const role = url.searchParams.get('role') || ''
    const offset = (page - 1) * limit

    let query = supabase
      .from('users')
      .select('id, fullname, email, phone, role, department, pillar_role, is_approved, status, created_at, last_login', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`fullname.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (role) {
      query = query.eq('role', role)
    }

    const { data, count, error } = await query

    if (error) throw error

    return NextResponse.json({ users: data || [], total: count || 0, page, limit })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
