import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  try {
    let query = supabase.from('interdept_tasks').select('*').order('created_at', { ascending: false }).limit(200)

    // Filter to tasks assigned to this user's department, unless they are an admin
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      if (!user.department) return NextResponse.json({ interdept_tasks: [] })
      query = query.eq('to_department', user.department)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ interdept_tasks: [] }) // Table missing
      throw error
    }

    return NextResponse.json({ interdept_tasks: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

    const supabase = await createClient()

    // Ensure the task belongs to their department before updating
    if (user.role !== 'super_admin' && user.role !== 'admin') {
       const { data: existingTask } = await supabase.from('interdept_tasks').select('to_department').eq('id', id).single()
       if (!existingTask || existingTask.to_department !== user.department) {
          return NextResponse.json({ error: 'Cannot update tasks from other departments' }, { status: 403 })
       }
    }

    const { data, error } = await supabase
      .from('interdept_tasks')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ record: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
