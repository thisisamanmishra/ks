import { NextResponse } from 'next/server'
import { requireRole, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('super_admin', 'admin')
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('users')
      .select('id, fullname, email, phone, role, status, created_at')
      .eq('id', id)
      .single()

    if (error) throw error

    const { count: totalProjects } = await supabase
      .from('service_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)

    return NextResponse.json({ user: data, totalProjects: totalProjects || 0 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('super_admin', 'admin')
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    const updates: Record<string, unknown> = {}

    // Admins can only update status (block/unblock)
    if (body.status) updates.status = body.status
    // Only super_admin can change roles and departments
    if (user.role === 'super_admin') {
      if (body.role) updates.role = body.role
      if (body.department !== undefined) updates.department = body.department
      if (body.pillar_role !== undefined) updates.pillar_role = body.pillar_role
      if (body.is_approved !== undefined) updates.is_approved = body.is_approved
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, fullname, email, role, department, is_approved, status')
      .single()

    if (error) throw error

    return NextResponse.json({ user: data })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('super_admin')
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ message: 'User deleted' })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
