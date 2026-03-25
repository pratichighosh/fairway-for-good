import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase/server'
import { generateDrawNumbers, checkMatch } from '@/lib/draw-engine'

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { mode = 'random', simulate = false } = await req.json()

  const { data: allScores } = await supabaseAdmin.from('scores').select('score, user_id')
  const freq: Record<number, number> = {}
  allScores?.forEach((s: any) => { freq[s.score] = (freq[s.score] || 0) + 1 })

  const numbers = generateDrawNumbers(mode, freq)

  const { data: subs } = await supabaseAdmin.from('profiles').select('id').eq('subscription_status', 'active')
  const activeCount = subs?.length || 0

  if (simulate) {
    const results = []
    for (const sub of (subs || [])) {
      const userScores = allScores?.filter((s: any) => s.user_id === sub.id).map((s: any) => s.score) || []
      const match = checkMatch(userScores.slice(0, 5), numbers)
      if (match.tier) results.push({ userId: sub.id, tier: match.tier, count: match.count })
    }
    return NextResponse.json({ simulation: true, numbers, potentialWinners: results.length })
  }

  // Real draw
  const pool = activeCount * 999 * 0.4
  const { data: lastDraw } = await supabaseAdmin.from('draws').select('jackpot_carried_forward, jackpot_amount').eq('status', 'published').order('draw_date', { ascending: false }).limit(1).single()
  const carried = lastDraw?.jackpot_carried_forward ? (lastDraw.jackpot_amount || 0) : 0

  const { data: draw, error: drawErr } = await supabaseAdmin.from('draws').insert({
    draw_date: new Date().toISOString(),
    winning_numbers: numbers,
    draw_type: mode,
    status: 'published',
    prize_pool_total: pool + carried,
    jackpot_amount: pool * 0.4 + carried,
    jackpot_carried_forward: false,
  }).select().single()

  if (drawErr) return NextResponse.json({ error: drawErr.message }, { status: 500 })

  // Count winners per tier
  const tierCounts: Record<string, number> = {}
  const entries: any[] = []
  for (const sub of (subs || [])) {
    const userScores = allScores?.filter((s: any) => s.user_id === sub.id).map((s: any) => s.score) || []
    const match = checkMatch(userScores.slice(0, 5), numbers)
    if (match.tier) tierCounts[match.tier] = (tierCounts[match.tier] || 0) + 1
    entries.push({ sub, match, userScores: userScores.slice(0, 5) })
  }

  const pools = { '5-match': pool * 0.4 + carried, '4-match': pool * 0.35, '3-match': pool * 0.25 }
  let noFiveMatch = !tierCounts['5-match']

  for (const { sub, match, userScores } of entries) {
    const prize = match.tier ? Math.floor((pools[match.tier as keyof typeof pools] / (tierCounts[match.tier!] || 1)) * 100) / 100 : 0
    await supabaseAdmin.from('draw_entries').insert({
      draw_id: draw.id, user_id: sub.id, numbers: userScores,
      matched_count: match.count, tier: match.tier, prize_amount: prize, payment_status: 'pending',
    })
  }

  if (noFiveMatch) {
    await supabaseAdmin.from('draws').update({ jackpot_carried_forward: true }).eq('id', draw.id)
  }

  return NextResponse.json({ success: true, draw, numbers, winners: tierCounts })
}

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase.from('draws').select('*').eq('status', 'published').order('draw_date', { ascending: false })
  return NextResponse.json({ draws: data || [] })
}
