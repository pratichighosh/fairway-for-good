import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (p?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const [users, draws, charities, pending] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('draws').select('*').order('draw_date', { ascending: false }),
    supabaseAdmin.from('charities').select('*').order('total_raised', { ascending: false }),
    supabaseAdmin.from('draw_entries').select('*, profiles(full_name, email), draws(draw_date)').not('tier', 'is', null).eq('payment_status', 'pending'),
  ])

  return NextResponse.json({
    users: users.data || [],
    draws: draws.data || [],
    charities: charities.data || [],
    pendingWinners: pending.data || [],
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (p?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { action, entryId } = await req.json()
  if (action === 'approve') {
    await supabaseAdmin.from('draw_entries').update({ payment_status: 'paid' }).eq('id', entryId)
  } else if (action === 'reject') {
    await supabaseAdmin.from('draw_entries').update({ tier: null, prize_amount: 0 }).eq('id', entryId)
  }
  return NextResponse.json({ success: true })
}
