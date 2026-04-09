import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// Handles: tenders, clients, projects, docs, bids, revenue, tasks, compliance, mous
const TABLE_MAP: Record<string, string> = {
  tenders:    'govt_tenders',
  clients:    'govt_clients',
  projects:   'govt_projects',
  docs:       'govt_documents',
  bids:       'govt_bids',
  revenue:    'govt_revenue',
  tasks:      'govt_project_tasks',
  compliance: 'govt_compliance',
  mous:       'govt_mous',
}

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type      = searchParams.get('type') || 'tenders'
  const projectId = searchParams.get('project_id')
  const clientId  = searchParams.get('client_id')

  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const supabase = await createClient()

  let query = supabase.from(table).select('*').order('created_at', { ascending: false }).limit(100)

  // Project-scoped
  if (projectId && ['bids','tasks','compliance','revenue'].includes(type)) {
    query = query.eq('project_id', projectId)
  }
  // Client-scoped
  if (clientId && type === 'mous') {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // For revenue: also return summary totals
  if (type === 'revenue') {
    const total = (data || []).reduce((a, r) => a + (r.amount || 0), 0)
    const received = (data || []).filter(r => r.status === 'received').reduce((a, r) => a + (r.amount || 0), 0)
    const pending = (data || []).filter(r => r.status === 'pending').reduce((a, r) => a + (r.amount || 0), 0)
    return NextResponse.json({ [type]: data || [], summary: { total, received, pending } })
  }

  // For mous: flag expiring soon (within 30 days)
  if (type === 'mous') {
    const thirtyDays = new Date(Date.now() + 30 * 86400000)
    const enriched = (data || []).map(m => ({
      ...m,
      expiring_soon: m.expiry_date && new Date(m.expiry_date) <= thirtyDays && m.status === 'active',
    }))
    return NextResponse.json({ [type]: enriched })
  }

  return NextResponse.json({ [type]: data || [] })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'tenders'
  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const supabase = await createClient()
  const body = await req.json()

  let insertData: Record<string, unknown> = {}

  if (type === 'tenders') {
    insertData = {
      title: body.title, dept: body.dept, value: body.value,
      deadline: body.deadline || null, submission_ref: body.submission,
      status: body.status || 'under_review',
    }
  } else if (type === 'clients') {
    insertData = {
      name: body.name, dept: body.dept, state: body.state,
      contact_person: body.contact, contract_value: body.value,
      email: body.email || null, phone: body.phone || null,
      address: body.address || null, website: body.website || null,
    }
  } else if (type === 'projects') {
    insertData = {
      title: body.title, client_name: body.client, phase: body.phase || 'proposal',
      progress: Number(body.progress) || 0, deadline: body.deadline || null,
      value: body.value, description: body.description || null,
      start_date: body.start_date || null,
    }
  } else if (type === 'docs') {
    insertData = {
      title: body.title, doc_type: body.type || 'MOU',
      status: body.status || 'valid', file_url: body.url,
    }
  } else if (type === 'bids') {
    insertData = {
      project_id: body.project_id || null, tender_id: body.tender_id || null,
      bid_ref: body.bid_ref, bid_value: Number(body.bid_value) || 0,
      submitted_at: body.submitted_at || new Date().toISOString().split('T')[0],
      status: body.status || 'submitted', doc_url: body.doc_url || null,
      notes: body.notes || null, created_by: user.userId,
    }
  } else if (type === 'revenue') {
    insertData = {
      project_id: body.project_id || null, amount: Number(body.amount) || 0,
      invoice_ref: body.invoice_ref || null, payment_mode: body.payment_mode || 'bank_transfer',
      received_date: body.received_date || null, status: body.status || 'pending',
      notes: body.notes || null,
    }
  } else if (type === 'tasks') {
    insertData = {
      project_id: body.project_id, task: body.task,
      status: body.status || 'todo', priority: body.priority || 'medium',
      assignee_id: body.assignee_id || null, due_date: body.due_date || null,
      notes: body.notes || null,
    }
  } else if (type === 'compliance') {
    insertData = {
      project_id: body.project_id, item: body.item,
      category: body.category || 'general', is_complete: body.is_complete || false,
      notes: body.notes || null,
    }
  } else if (type === 'mous') {
    insertData = {
      client_id: body.client_id, title: body.title,
      signed_date: body.signed_date || null, expiry_date: body.expiry_date || null,
      doc_url: body.doc_url || null, status: body.status || 'active',
      notes: body.notes || null,
    }
  }

  const { data, error } = await supabase.from(table).insert(insertData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'tenders'
  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const supabase = await createClient()
  const { id, ...updates } = await req.json()

  // Mark compliance complete timestamp
  if (type === 'compliance' && updates.is_complete === true) {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'tenders'
  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const supabase = await createClient()
  const { id } = await req.json()
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
