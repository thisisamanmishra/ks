import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/about/status — diagnostic for about page tables
export async function GET() {
  const supabase = await createClient()

  const results: Record<string, unknown> = {}

  for (const table of ['about_company', 'about_timeline', 'about_achievements', 'about_members', 'blogs', 'events']) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: false })
      .limit(1)

    results[table] = {
      exists: !error || error.code !== '42P01',
      error: error ? { code: error.code, message: error.message } : null,
      rowCount: count ?? (data?.length ?? 0),
      sample: data?.[0] ? Object.keys(data[0]) : [],
    }
  }

  return NextResponse.json({ tables: results, timestamp: new Date().toISOString() })
}
