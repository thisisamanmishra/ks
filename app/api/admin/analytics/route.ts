import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/admin/analytics
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'board_member', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '30d'

  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
  const days = daysMap[range] || 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { count: totalVendors },
    { count: totalProjects },
    { count: completedProjects },
    { count: pendingProjects },
    { count: activeProjects },
    { count: totalLeads },
    { count: wonLeads },
    { count: totalServices },
    { count: totalEvents },
    { data: invoiceSum },
    { data: blogs },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'vendor').eq('is_approved', true),
    supabase.from('service_requests').select('*', { count: 'exact', head: true }),
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).in('status', ['in_progress', 'assigned', 'review', 'delivered']),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('stage', 'won'),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('total').eq('status', 'paid'),
    supabase.from('blogs').select('views').eq('is_published', true),
  ])

  const totalRevenue = (invoiceSum || []).reduce((a, b) => a + (b.total || 0), 0)
  const totalBlogViews = (blogs || []).reduce((a: number, b: { views?: number }) => a + (b.views || 0), 0)

  // Monthly breakdown (last 6 months)
  const monthly: { month: string; revenue: number; projects: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()
    const monthLabel = date.toLocaleDateString('en-IN', { month: 'short' })

    const [{ data: monthInvoices }, { count: monthProjects }] = await Promise.all([
      supabase.from('invoices').select('total').eq('status', 'paid').gte('paid_at', monthStart).lte('paid_at', monthEnd),
      supabase.from('service_requests').select('*', { count: 'exact', head: true }).gte('created_at', monthStart).lte('created_at', monthEnd),
    ])
    monthly.push({
      month: monthLabel,
      revenue: (monthInvoices || []).reduce((a: number, b: { total?: number }) => a + (b.total || 0), 0),
      projects: monthProjects || 0,
    })
  }

  return NextResponse.json({
    stats: {
      totalRevenue, totalUsers: totalUsers || 0, totalVendors: totalVendors || 0,
      totalProjects: totalProjects || 0, completedProjects: completedProjects || 0,
      pendingProjects: pendingProjects || 0, activeProjects: activeProjects || 0,
      totalLeads: totalLeads || 0, wonLeads: wonLeads || 0,
      totalServices: totalServices || 0, totalEvents: totalEvents || 0,
      totalBlogViews,
    },
    monthly,
  })
}
