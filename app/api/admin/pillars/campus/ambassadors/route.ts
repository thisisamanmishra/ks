import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

let memoryAmbassadors: any[] = []
let idCounter = 1

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase.from('campus_ambassadors').select('*').order('leads', { ascending: false })

  if (error || !data) {
    console.error('Error fetching campus_ambassadors:', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch ambassadors' }, { status: 500 })
  }

  return NextResponse.json({ ambassadors: data || [] })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const body = await req.json()

  const payload = {
    fullname: body.fullname,
    email: body.email,
    phone: body.phone,
    college: body.college,
    target: body.target || 50,
    leads: 0, revenue: 0, commission: 0,
    referral_code: body.referral_code,
    status: 'active',
  }

  const { data, error } = await supabase.from('campus_ambassadors').insert(payload).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ambassador: data }, { status: 201 })
}
