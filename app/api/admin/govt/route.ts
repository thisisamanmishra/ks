import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

// /api/admin/govt?type=tenders|clients|projects|docs
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'tenders'
  const supabase = await createClient()

  const TABLE_MAP: Record<string, string> = {
    tenders: 'govt_tenders', clients: 'govt_clients',
    projects: 'govt_projects', docs: 'govt_documents'
  }
  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false })
  return NextResponse.json({ [type]: data || [] })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'tenders'
  const supabase = await createClient()
  const body = await req.json()

  const TABLE_MAP: Record<string, string> = {
    tenders: 'govt_tenders', clients: 'govt_clients',
    projects: 'govt_projects', docs: 'govt_documents'
  }
  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  // Map body fields to table columns
  let insertData: Record<string, unknown> = {}
  if (type === 'tenders') {
    insertData = { title: body.title, dept: body.dept, value: body.value, deadline: body.deadline || null, submission_ref: body.submission, status: 'under_review' }
  } else if (type === 'clients') {
    insertData = { name: body.name, dept: body.dept, state: body.state, contact_person: body.contact, contract_value: body.value }
  } else if (type === 'projects') {
    insertData = { title: body.title, client_name: body.client, phase: body.phase || 'proposal', progress: Number(body.progress) || 0, deadline: body.deadline || null, value: body.value }
  } else if (type === 'docs') {
    insertData = { title: body.title, doc_type: body.type || 'MOU', status: body.status || 'valid', file_url: body.url }
  }

  const { data, error } = await supabase.from(table).insert(insertData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'tenders'
  const TABLE_MAP: Record<string, string> = {
    tenders: 'govt_tenders', clients: 'govt_clients',
    projects: 'govt_projects', docs: 'govt_documents'
  }
  const table = TABLE_MAP[type]
  if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  const supabase = await createClient()
  const { id, ...updates } = await req.json()
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}
