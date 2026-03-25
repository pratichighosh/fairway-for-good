import Razorpay from 'razorpay'
import crypto from 'crypto'

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export const PLAN_AMOUNTS: Record<string, number> = {
   weekly:  100,
  monthly: 99900,  // ₹999 in paise
  yearly: 899900,  // ₹8999 in paise
}

export async function createOrder(amount: number, userId: string, plan: string) {
  return await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
    notes: { userId, plan },
  })
}

export function verifySignature(orderId: string, paymentId: string, signature: string) {
  const body = `${orderId}|${paymentId}`
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')
  return expected === signature
}
