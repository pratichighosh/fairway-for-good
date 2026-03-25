import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@/lib/razorpay'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { plan, userId } = body

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    // ── FREE PLAN — no payment, activate directly ──
    if (plan === 'free' || body.free === true) {
      const end = new Date()
      end.setFullYear(end.getFullYear() + 10) // 10-year expiry for testing

      const { error } = await supabaseAdmin.from('profiles').update({
        subscription_status: 'active',
        subscription_plan: 'free',
        subscription_end_date: end.toISOString(),
      }).eq('id', userId)

      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true })
    }

    // ── PAID PLANS — verify Razorpay signature ──
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    const valid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if (!valid) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })

    const end = new Date()
    if (plan === 'yearly') end.setFullYear(end.getFullYear() + 1)
    else end.setMonth(end.getMonth() + 1)

    const { error } = await supabaseAdmin.from('profiles').update({
      subscription_status: 'active',
      subscription_plan: plan,
      razorpay_payment_id,
      razorpay_order_id,
      subscription_end_date: end.toISOString(),
    }).eq('id', userId)

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Verify error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
