import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('scores').select('*').eq('user_id', user.id).order('date_played', { ascending: false }).limit(5)
  return NextResponse.json({ scores: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { score, date_played } = await req.json()
  const s = parseInt(score)
  if (isNaN(s) || s < 1 || s > 45) return NextResponse.json({ error: 'Score must be 1–45' }, { status: 400 })
  if (!date_played) return NextResponse.json({ error: 'Date required' }, { status: 400 })

  // Delete oldest if 5 exist
  const { data: existing } = await supabase.from('scores').select('id').eq('user_id', user.id).order('date_played', { ascending: true })
  if (existing && existing.length >= 5) {
    await supabaseAdmin.from('scores').delete().eq('id', existing[0].id)
  }

  const { data, error } = await supabaseAdmin.from('scores').insert({ user_id: user.id, score: s, date_played }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ score: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await supabaseAdmin.from('scores').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
