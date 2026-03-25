import { NextRequest, NextResponse } from 'next/server'
import { createOrder, PLAN_AMOUNTS } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  try {
    const { plan, userId } = await req.json()
    if (!plan || !userId) return NextResponse.json({ error: 'plan and userId required' }, { status: 400 })
    const amount = PLAN_AMOUNTS[plan]
    if (!amount) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    const order = await createOrder(amount, userId, plan)
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (err: any) {
    console.error('Order error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
