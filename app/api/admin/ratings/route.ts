import { NextResponse } from 'next/server'
import { requireRole, authErrorResponse } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

// GET — list all ratings (admin moderation)
export async function GET() {
  try {
    await requireRole('super_admin', 'admin')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        customer:users!ratings_customer_id_fkey(id, fullname, email),
        vendor:users!ratings_vendor_id_fkey(id, fullname, email),
        project:service_requests!ratings_project_id_fkey(id, service_type)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ ratings: data || [] })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}

// DELETE — remove a rating (admin moderation)
export async function DELETE(request: Request) {
  try {
    await requireRole('super_admin', 'admin')
    const { ratingId } = await request.json()
    if (!ratingId) return NextResponse.json({ error: 'ratingId required' }, { status: 400 })

    const supabase = await createClient()

    // Get rating to recalculate vendor avg afterwards
    const { data: rating } = await supabase
      .from('ratings')
      .select('vendor_id')
      .eq('id', ratingId)
      .single()

    await supabase.from('ratings').delete().eq('id', ratingId)

    // Recalculate vendor average
    if (rating) {
      const { data: remaining } = await supabase
        .from('ratings')
        .select('rating')
        .eq('vendor_id', rating.vendor_id)

      const rList = remaining || []
      const avg = rList.length > 0 ? rList.reduce((s, r) => s + r.rating, 0) / rList.length : 0
      await supabase
        .from('vendors')
        .update({ rating: Math.round(avg * 100) / 100, total_projects: rList.length })
        .eq('user_id', rating.vendor_id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const { error, status } = authErrorResponse(err)
    return NextResponse.json({ error }, { status })
  }
}
