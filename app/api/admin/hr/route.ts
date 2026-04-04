import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const supabase = await createClient()

  if (action === 'leaves') {
    const { data } = await supabase
      .from('leave_requests')
      .select(`id, leave_type, start_date, end_date, days, reason, status, created_at,
        user:user_id(id, fullname, email, department),
        reviewer:reviewed_by(fullname)`)
      .order('created_at', { ascending: false })
      .limit(100)
    return NextResponse.json({ leaveRequests: data || [] })
  }

  if (action === 'attendance') {
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
    const [year, monthNum] = month.split('-')
    const start = `${year}-${monthNum}-01`
    const end = new Date(Number(year), Number(monthNum), 0).toISOString().slice(0, 10)

    const { data: records } = await supabase
      .from('attendance')
      .select(`user_id, status, user:user_id(fullname, department)`)
      .gte('date', start)
      .lte('date', end)

    // Group by user
    const grouped: Record<number, { user_id: number; fullname: string; department: string | null; present: number; absent: number; half_day: number; on_leave: number; total_days: number }> = {}
    for (const rec of (records || [])) {
      const id = rec.user_id
      const rawUser = rec.user
      const u = Array.isArray(rawUser) ? rawUser[0] as { fullname: string; department: string | null } | null : rawUser as { fullname: string; department: string | null } | null
      if (!grouped[id]) {
        grouped[id] = { user_id: id, fullname: u?.fullname || 'Unknown', department: u?.department || null, present: 0, absent: 0, half_day: 0, on_leave: 0, total_days: 0 }
      }
      grouped[id].total_days++
      if (rec.status === 'present') grouped[id].present++
      else if (rec.status === 'absent') grouped[id].absent++
      else if (rec.status === 'half_day') grouped[id].half_day++
      else if (rec.status === 'on_leave') grouped[id].on_leave++
    }
    return NextResponse.json({ attendance: Object.values(grouped) })
  }

  // Default: staff list
  const { data: staff } = await supabase
    .from('users')
    .select('id, fullname, email, role, department, is_approved, created_at, joining_date, employee_id')
    .in('role', ['admin', 'pillar_member', 'board_member', 'super_admin'])
    .order('created_at', { ascending: false })
  return NextResponse.json({ staff: staff || [] })
}

// PATCH — approve / reject leave
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { leaveId, status } = await request.json()
  if (!leaveId || !status) return NextResponse.json({ error: 'leaveId and status required' }, { status: 400 })

  const supabase = await createClient()
  await supabase.from('leave_requests')
    .update({ status, reviewed_by: user.userId, reviewed_at: new Date().toISOString() })
    .eq('id', leaveId)

  return NextResponse.json({ success: true })
}

// POST — log attendance manually
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { user_id, date, status, check_in, check_out } = await request.json()
  if (!user_id || !date || !status) return NextResponse.json({ error: 'user_id, date and status required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('attendance')
    .upsert({ user_id, date, status, check_in, check_out }, { onConflict: 'user_id,date' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data }, { status: 201 })
}
