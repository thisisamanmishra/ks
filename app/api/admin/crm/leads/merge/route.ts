import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin' && user.department !== 'marketing' && user.department !== 'operations') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { primaryId, duplicateIds } = await req.json()
    if (!primaryId || !duplicateIds || duplicateIds.length === 0) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Move all follow-up logs from duplicates to the primary lead
    await supabase
      .from('crm_followup_log')
      .update({ lead_id: primaryId })
      .in('lead_id', duplicateIds)

    // 2. Add a merge note to the primary lead
    await supabase.from('crm_followup_log').insert({
      lead_id: primaryId,
      note: `Merged with duplicate leads (IDs: ${duplicateIds.join(', ')})`,
      note_type: 'note',
      created_by: user.userId
    })

    // 3. Delete the duplicate leads
    const { error: delError } = await supabase
      .from('leads')
      .delete()
      .in('id', duplicateIds)

    if (delError) {
      console.error('Lead delete error:', delError)
      return NextResponse.json({ error: 'Merge logic completed but failed to delete duplicates' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Leads merged successfully' })
  } catch (err) {
    console.error('Merge lead POST exception:', err)
    return NextResponse.json({ error: 'Failed to merge leads' }, { status: 500 })
  }
}
