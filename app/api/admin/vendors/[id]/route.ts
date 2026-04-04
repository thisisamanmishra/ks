import { NextResponse } from 'next/server'
import { requireRole, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('super_admin', 'admin')
    const supabase = await createClient()
    const { id } = await params

    // Get vendor with user info (id here is the vendor table row id)
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select(`
        id,
        specialization,
        user:users!vendors_user_id_fkey(id, fullname, email, phone, status, created_at)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Safely extract the user id – Supabase returns it as an array or object depending on the join
    type UserShape = { id: number; fullname: string; email: string; phone: string | null; status: string; created_at: string }
    const userRaw = vendor.user as unknown as UserShape | UserShape[] | null
    const userObj: UserShape | null = Array.isArray(userRaw) ? userRaw[0] ?? null : userRaw
    const userId = userObj?.id
    if (!userId) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    // Get project counts
    const { count: completedProjects } = await supabase
      .from('service_requests')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .eq('status', 'completed')

    const { count: ongoingProjects } = await supabase
      .from('service_requests')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .not('status', 'in', '("completed","cancelled")')

    // Get avg rating
    const { data: ratings } = await supabase
      .from('ratings')
      .select('rating')
      .eq('vendor_id', userId)

    const avgRating = ratings && ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0

    return NextResponse.json({
      vendor: { ...vendor, user: userObj },
      stats: {
        completedProjects: completedProjects || 0,
        ongoingProjects: ongoingProjects || 0,
        totalRatings: ratings?.length || 0,
        avgRating: Math.round(avgRating * 10) / 10,
      },
    })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
