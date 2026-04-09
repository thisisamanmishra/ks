import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

const ALLOWED = ['super_admin', 'admin', 'board_member', 'operations', 'finance']

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || 'list'
  const status = searchParams.get('status')
  const pillar = searchParams.get('pillar')
  const dateFrom = searchParams.get('from')
  const dateTo   = searchParams.get('to')
  const supabase = await createClient()

  if (action === 'list') {
    let q = supabase
      .from('crm_invoices')
      .select('*, creator:created_by(fullname)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100)

    if (status) q = q.eq('status', status)
    if (pillar) q = q.eq('pillar', pillar)
    if (dateFrom) q = q.gte('created_at', dateFrom)
    if (dateTo) q = q.lte('created_at', dateTo)

    const { data, error, count } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Revenue summary
    const { data: allInv } = await supabase
      .from('crm_invoices')
      .select('total_amount, status, pillar, created_at')

    const all = allInv || []
    const totalRevenue = all.filter(i => i.status === 'paid').reduce((a, i) => a + (i.total_amount || 0), 0)
    const pendingRevenue = all.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((a, i) => a + (i.total_amount || 0), 0)
    const overdueCount = all.filter(i => i.status === 'overdue').length

    // By pillar
    const byPillar: Record<string, number> = {}
    all.filter(i => i.status === 'paid').forEach(i => {
      const p = i.pillar || 'other'
      byPillar[p] = (byPillar[p] || 0) + (i.total_amount || 0)
    })

    // Monthly (last 6 months)
    const monthly: Record<string, number> = {}
    all.filter(i => i.status === 'paid').forEach(i => {
      const m = i.created_at?.slice(0, 7) || ''
      if (m) monthly[m] = (monthly[m] || 0) + (i.total_amount || 0)
    })

    return NextResponse.json({
      invoices: data || [],
      total: count || 0,
      summary: { totalRevenue, pendingRevenue, overdueCount, byPillar, monthly },
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { client_name, client_email, client_phone, lead_id, pillar, service, items, notes, due_date, tax_rate } = body

  if (!client_name) return NextResponse.json({ error: 'client_name required' }, { status: 400 })

  const lineItems: { description: string; qty: number; rate: number; amount: number }[] = items || []
  const amount = lineItems.reduce((a, item) => a + (item.amount || item.qty * item.rate || 0), 0)
  const taxAmount = amount * ((tax_rate || 0) / 100)
  const totalAmount = amount + taxAmount

  const supabase = await createClient()

  // Generate invoice number
  const { data: seqData } = await supabase.rpc('generate_invoice_number').single()
  const invoiceNumber = (seqData as string | null) || `KS-${new Date().getFullYear().toString().slice(-2)}-${Date.now().toString().slice(-4)}`

  const { data, error } = await supabase
    .from('crm_invoices')
    .insert({
      invoice_number: invoiceNumber,
      client_name, client_email, client_phone,
      lead_id: lead_id || null,
      pillar: pillar || null,
      service: service || null,
      items: lineItems,
      amount, tax_amount: taxAmount, total_amount: totalAmount,
      status: 'draft',
      due_date: due_date || null,
      notes: notes || null,
      created_by: user.userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  if (updates.status === 'paid' && !updates.paid_date) {
    updates.paid_date = new Date().toISOString().split('T')[0]
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('crm_invoices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data })
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.from('crm_invoices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
