import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase.from('charities').select('*').order('featured', { ascending: false }).order('total_raised', { ascending: false })
  return NextResponse.json({ charities: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (p?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('charities').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ charity: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (p?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  const { id } = await req.json()
  await supabaseAdmin.from('charities').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
