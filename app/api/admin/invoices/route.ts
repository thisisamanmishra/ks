import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/admin/invoices
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin', 'board_member'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20')
  const page = parseInt(searchParams.get('page') || '1')
  const offset = (page - 1) * limit

  const supabase = await createClient()
  let query = supabase
    .from('invoices')
    .select(`
      id, invoice_number, subtotal, total, tax_amount, discount, status, due_date, paid_at, created_at,
      client:client_id(id, fullname, email),
      project:project_id(id, service_type)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Summary
  const { data: all } = await supabase.from('invoices').select('total, status')
  const summary = {
    total: (all || []).filter(i => i.status === 'paid').reduce((a, i) => a + i.total, 0),
    pending: (all || []).filter(i => i.status === 'sent').reduce((a, i) => a + i.total, 0),
    overdue: (all || []).filter(i => i.status === 'overdue').reduce((a, i) => a + i.total, 0),
    draft: (all || []).filter(i => i.status === 'draft').length,
  }

  return NextResponse.json({ invoices: data || [], total: count || 0, summary })
}

// POST /api/admin/invoices — create invoice
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { client_id, project_id, items, tax_percent, discount, due_date, notes } = body

    if (!client_id || !items?.length) {
      return NextResponse.json({ error: 'client_id and items required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Generate invoice number
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
    const invoiceNumber = `KS-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

    const subtotal = items.reduce((a: number, i: { quantity: number; unit_price: number }) => a + (i.quantity * i.unit_price), 0)
    const taxAmount = subtotal * ((tax_percent || 18) / 100)
    const discountAmount = discount || 0
    const total = subtotal + taxAmount - discountAmount

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        client_id,
        project_id: project_id || null,
        issued_by: user.userId,
        subtotal,
        tax_percent: tax_percent || 18,
        tax_amount: taxAmount,
        discount: discountAmount,
        total,
        status: 'draft',
        due_date: due_date || null,
        notes,
      })
      .select()
      .single()

    if (invError) throw invError

    // Insert items
    const itemsData = items.map((item: { description: string; quantity: number; unit_price: number }) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity || 1,
      unit_price: item.unit_price,
      total: (item.quantity || 1) * item.unit_price,
    }))

    await supabase.from('invoice_items').insert(itemsData)

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

// PATCH /api/admin/invoices — update status
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { id, status, razorpay_payment_id } = body

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .update({
      status,
      ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}),
      ...(razorpay_payment_id ? { razorpay_payment_id } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data })
}
