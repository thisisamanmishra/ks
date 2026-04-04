import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  // Get all clients (customers)
  const { data: clientsRaw } = await supabase
    .from('users')
    .select('id, fullname, email, phone, created_at')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  if (!clientsRaw || clientsRaw.length === 0) return NextResponse.json({ clients: [] })

  // Get their invoices
  const clientIds = clientsRaw.map(c => c.id)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('user_id, total, status')
    .in('user_id', clientIds)
    .eq('status', 'paid')

  // Get their projects
  const { data: projects } = await supabase
    .from('service_requests')
    .select('user_id, status')
    .in('user_id', clientIds)

  const clients = clientsRaw.map(c => {
    const clientInvoices = (invoices || []).filter(inv => inv.user_id === c.id)
    const clientProjects = (projects || []).filter(p => p.user_id === c.id)
    const totalRevenue = clientInvoices.reduce((a, inv) => a + (inv.total || 0), 0)

    return {
      id: c.id,
      fullname: c.fullname,
      email: c.email,
      phone: c.phone,
      created_at: c.created_at,
      totalRevenue,
      totalProjects: clientProjects.length,
      segment: totalRevenue > 500000 ? 'corporate' : totalRevenue > 100000 ? 'startup' : 'student',
      lastContact: null,
    }
  })

  return NextResponse.json({ clients })
}
