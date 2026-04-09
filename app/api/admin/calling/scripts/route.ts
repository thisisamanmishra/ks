import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin' && user.pillar_role !== 'calling' && user.department !== 'marketing' && user.department !== 'operations') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('call_scripts')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scripts: data })
} 

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin' && user.department !== 'marketing' && user.department !== 'operations') {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('call_scripts')
    .insert({
      title: body.title,
      content: body.content,
      objection_handling: body.objection_handling,
      author_id: user.userId
    })
    .select('*')
    .single()
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ script: data })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin' && user.department !== 'marketing' && user.department !== 'operations') {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = await createClient()

  const { error } = await supabase
    .from('call_scripts')
    .update({
      title: body.title,
      content: body.content,
      objection_handling: body.objection_handling,
    })
    .eq('id', body.id)
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin' && user.department !== 'marketing' && user.department !== 'operations') {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = await createClient()

  const { error } = await supabase
    .from('call_scripts')
    .delete()
    .eq('id', body.id)
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
