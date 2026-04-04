import { NextResponse } from 'next/server'
import { requireDepartment, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireDepartment('finance')
    const { id } = await params
    const { status } = await request.json()

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('project_quotes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ quote: data })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
