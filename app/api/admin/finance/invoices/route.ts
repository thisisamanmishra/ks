import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// GET /api/admin/finance/invoices
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const supabase = await createClient()

  let query = supabase
    .from('invoices')
    .select(`
      id, invoice_number, subtotal, tax_amount, discount, total, status, due_date, paid_at, created_at, notes,
      client:client_id(id, fullname, email, phone),
      issuer:issued_by(id, fullname)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoices: data || [] })
}

// POST /api/admin/finance/invoices — create invoice
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { client_id, items = [], tax_percent = 18, discount = 0, due_date, notes } = body

  if (!client_id || items.length === 0) {
    return NextResponse.json({ error: 'client_id and items required' }, { status: 400 })
  }

  const subtotal = items.reduce((a: number, i: { quantity: number; unit_price: number }) => a + (i.quantity * i.unit_price), 0)
  const tax_amount = (subtotal * tax_percent) / 100
  const total = subtotal + tax_amount - discount

  const supabase = await createClient()

  // Generate invoice number
  const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
  const invoice_number = `KS-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({ client_id, issued_by: user.userId, invoice_number, subtotal, tax_percent, tax_amount, discount, total, status: 'draft', due_date, notes })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert line items
  if (items.length > 0) {
    await supabase.from('invoice_items').insert(
      items.map((item: { description: string; quantity: number; unit_price: number }) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }))
    )
  }

  return NextResponse.json({ invoice }, { status: 201 })
}

// PATCH /api/admin/finance/invoices?id=X — update status/send
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await request.json()
  const supabase = await createClient()
  const { data, error } = await supabase.from('invoices').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data })
}
