import { NextResponse } from 'next/server'
import { requireDepartment, requireRole, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

// GET — list all quotes (Finance admin + super admin)
export async function GET() {
  try {
    await requireDepartment('finance')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('project_quotes')
      .select(`
        *,
        project:service_requests!project_quotes_service_request_id_fkey(id, service_type, status, user_id,
          client:users!service_requests_user_id_fkey(id, fullname, email)
        ),
        quoter:users!project_quotes_quoted_by_fkey(id, fullname)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ quotes: data || [] })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// POST — create a quote for a project
export async function POST(request: Request) {
  try {
    const user = await requireDepartment('finance')
    const body = await request.json()

    if (!body.service_request_id || !body.amount) {
      return NextResponse.json({ error: 'Project ID and amount are required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('project_quotes')
      .insert({
        service_request_id: body.service_request_id,
        quoted_by: user.userId,
        amount: body.amount,
        notes: body.notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ quote: data }, { status: 201 })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
