import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

const ALLOWED_ROLES = ['super_admin', 'board_member']

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'super_admin' && user.role !== 'board_member' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  const supabase = await createClient()

  if (type === 'directory') {
    const { data, error } = await supabase
      .from('users')
      .select('id, fullname, email, role, department, pillar_role, designation, phone, is_approved, created_at')
      .neq('role', 'customer')
      .order('created_at', { ascending: false })
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ staff: data })
  } 

  if (type === 'payroll') {
    const { data, error } = await supabase
      .from('payroll')
      .select(`
        id, month, year, base_salary, bonuses, deductions, net_salary, status, payment_date,
        users:user_id ( id, fullname )
      `)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('id', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    const formatted = data.map((d: any) => ({
      ...d,
      fullname: d.users?.fullname,
      user_id: d.users?.id
    }))
    return NextResponse.json({ payrolls: formatted })
  }

  if (type === 'appraisals') {
    const { data, error } = await supabase
      .from('appraisals')
      .select(`
        id, review_period, performance_score, feedback, goals_achieved, areas_of_improvement, salary_increment, new_salary, status, created_at,
        users:user_id ( id, fullname )
      `)
      .order('id', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    const formatted = data.map((d: any) => ({
      ...d,
      fullname: d.users?.fullname,
      user_id: d.users?.id
    }))
    return NextResponse.json({ appraisals: formatted })
  }

  if (type === 'leaves') {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        id, leave_type, start_date, end_date, days, reason, status, created_at,
        users:user_id ( id, fullname )
      `)
      .order('created_at', { ascending: false })

    if (error && error.code === '42P01') return NextResponse.json({ leaves: [] })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const formatted = (data || []).map((d: any) => ({
      ...d,
      fullname: d.users?.fullname,
      user_id: d.users?.id
    }))
    return NextResponse.json({ leaves: formatted })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized. Super Admin or Board Member access required.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const body = await request.json()
  const supabase = await createClient()

  if (type === 'payroll') {
    const { data, error } = await supabase
      .from('payroll')
      .insert({
        user_id: body.user_id,
        month: body.month,
        year: body.year,
        base_salary: body.base_salary,
        bonuses: body.bonuses,
        deductions: body.deductions,
        net_salary: body.net_salary,
        status: body.status || 'unpaid'
      })
      .select('*, users:user_id(id, fullname)')
      .single()
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ record: { ...data, fullname: data.users?.fullname, user_id: data.users?.id } })
  }

  if (type === 'appraisals') {
    const insertData: Record<string, any> = {
      user_id: body.user_id,
      reviewer_id: user.userId,
      review_period: body.review_period,
      performance_score: body.performance_score,
      feedback: body.feedback,
      goals_achieved: body.goals_achieved,
      areas_of_improvement: body.areas_of_improvement,
      status: body.status || 'draft'
    }
    // Add salary fields if provided
    if (body.salary_increment) insertData.salary_increment = body.salary_increment
    if (body.new_salary) insertData.new_salary = body.new_salary

    const { data, error } = await supabase
      .from('appraisals')
      .insert(insertData)
      .select('*, users:user_id(id, fullname)')
      .single()
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ record: { ...data, fullname: data.users?.fullname, user_id: data.users?.id } })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized. Super Admin or Board Member access required.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const body = await request.json()
  const supabase = await createClient()

  if (type === 'payroll') {
    const { id, status } = body
    if (!id || !status) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

    const { error } = await supabase
      .from('payroll')
      .update({ status, payment_date: status === 'paid' ? new Date().toISOString() : null })
      .eq('id', id)
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (type === 'leaves') {
    const { id, status } = body
    if (!id || !status) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

    const { error } = await supabase
      .from('leave_requests')
      .update({ status, approved_by: user.userId, approved_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
