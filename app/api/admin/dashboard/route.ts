import { NextResponse } from 'next/server'
import { requireRole, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await requireRole('super_admin', 'admin')
    const supabase = await createClient()

    // Get counts - use Promise.allSettled to handle missing tables gracefully
    const [usersRes, adminsRes, vendorsRes, projectsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).in('role', ['admin', 'super_admin', 'board_member', 'pillar_member']),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'vendor'),
      supabase.from('service_requests').select('id', { count: 'exact', head: true }),
    ])
    const pendingRes = await Promise.resolve(supabase.from('admin_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')).then(r => ({ count: r.count })).catch(() => ({ count: 0 }))
    const blogsRes = await Promise.resolve(supabase.from('blogs').select('id', { count: 'exact', head: true })).then(r => ({ count: r.count })).catch(() => ({ count: 0 }))

    // Revenue from completed projects (sum of budgets)
    let totalRevenue = 0
    try {
      const { data: revenueData } = await supabase
        .from('service_requests')
        .select('budget')
        .eq('status', 'completed')
        .not('budget', 'is', null)
      totalRevenue = revenueData?.reduce((sum, p) => sum + Number(p.budget || 0), 0) || 0
    } catch {}

    // Recent activity - gracefully handle missing table
    let recentActivity: Array<{ id: number; action: string; details: string; created_at: string }> = []
    try {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      recentActivity = data || []
    } catch {
      // activity_logs table may not exist - construct from recent service requests
      try {
        const { data: recentProjects } = await supabase
          .from('service_requests')
          .select('id, service_type, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
        recentActivity = (recentProjects || []).map(p => ({
          id: p.id,
          action: `New ${p.service_type} request`,
          details: `Status: ${p.status}`,
          created_at: p.created_at,
        }))
      } catch {}
    }

    // Project breakdown by status
    let projectStats = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 }
    try {
      const { data: projectsByStatus } = await supabase
        .from('service_requests')
        .select('status')
      projectsByStatus?.forEach(p => {
        if (p.status in projectStats) projectStats[p.status as keyof typeof projectStats]++
      })
    } catch {}

    return NextResponse.json({
      stats: {
        totalUsers: usersRes.count || 0,
        totalAdmins: adminsRes.count || 0,
        totalVendors: vendorsRes.count || 0,
        totalProjects: projectsRes.count || 0,
        pendingRequests: pendingRes.count || 0,
        totalBlogs: blogsRes.count || 0,
        totalRevenue,
      },
      projectStats,
      recentActivity,
      userRole: user.role,
      userDepartment: user.department,
    })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
