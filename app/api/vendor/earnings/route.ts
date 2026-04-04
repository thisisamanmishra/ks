import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/vendor/earnings
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = await createClient()

  // Fetch completed projects
  const { data: projects } = await supabase
    .from('service_requests')
    .select('id, service_type, budget, status, created_at, completed_at, client:client_id(fullname, email)')
    .eq('vendor_id', user.userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  // Fetch payments linked to vendor's invoices
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, status, created_at, razorpay_payment_id, description')
    .eq('user_id', user.userId)
    .eq('status', 'captured')
    .order('created_at', { ascending: false })

  // Monthly breakdown (last 6 months)
  const monthly: { month: string; amount: number; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()
    const monthLabel = date.toLocaleDateString('en-IN', { month: 'short' })

    const monthProjects = (projects || []).filter(p => {
      const d = p.completed_at || p.created_at
      return d >= monthStart && d <= monthEnd
    })

    monthly.push({
      month: monthLabel,
      amount: monthProjects.reduce((a, p) => a + (p.budget || 0), 0),
      count: monthProjects.length,
    })
  }

  const totalEarned = (projects || []).reduce((a, p) => a + (p.budget || 0), 0)
  const totalPayments = (payments || []).reduce((a, p) => a + (p.amount || 0), 0)
  const pendingAmount = Math.max(0, totalEarned - totalPayments)

  return NextResponse.json({
    earnings: {
      totalEarned,
      totalPayments,
      pendingAmount,
      completedProjects: (projects || []).length,
    },
    projects: projects || [],
    payments: payments || [],
    monthly,
  })
}
