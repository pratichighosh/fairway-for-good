'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ArrowRight, Check, Heart, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'

declare global { interface Window { Razorpay: any } }

const CHARITIES = [
  { id: '1', name: "Children's Golf Foundation", desc: 'Free coaching for underprivileged youth' },
  { id: '2', name: 'Green Earth Initiative', desc: 'Sustainable golf & carbon offset' },
  { id: '3', name: 'Veterans Sports Fund', desc: 'Sport therapy for veterans' },
  { id: '4', name: 'Youth Development Trust', desc: 'Mentorship for at-risk youth' },
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [plan, setPlan] = useState<'free' | 'weekly' | 'monthly' | 'yearly'>('free')
  const [charityName, setCharityName] = useState('')
  const [charityPct, setCharityPct] = useState(10)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function loadRazorpay(): Promise<boolean> {
    return new Promise(resolve => {
      if (window.Razorpay) { resolve(true); return }
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload = () => resolve(true)
      s.onerror = () => resolve(false)
      document.body.appendChild(s)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const supabase = createClient()

    try {
      // 1. Create Supabase account
      const { data, error: signErr } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, charity_name: charityName, charity_percentage: charityPct } },
      })
      if (signErr) throw new Error(signErr.message)
      if (!data.user) throw new Error('Signup failed — please try again')

      // FREE PLAN — skip payment, activate directly
      if (plan === 'free') {
        const res = await fetch('/api/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'free', userId: data.user.id, free: true }),
        })
        if (res.ok) {
          router.push('/dashboard')
          router.refresh()
        } else {
          setError('Account created but activation failed. Try logging in.')
          setLoading(false)
        }
        return
      }

      // 2. Create Razorpay order (paid plans only)
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: data.user.id }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error || 'Payment setup failed')

      // 3. Open Razorpay
      const loaded = await loadRazorpay()
      if (!loaded) throw new Error('Could not load payment gateway')

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Fairway for Good',
        description: `${plan === 'monthly' ? 'Monthly' : 'Yearly'} Membership`,
        order_id: order.orderId,
        prefill: { name, email },
        theme: { color: '#c9a84c' },
       handler: async (response: any) => {
  const verifyRes = await fetch('/api/razorpay/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id:   response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature:  response.razorpay_signature,
      plan: plan,                // ← correct — uses signup plan state
      userId: data.user!.id,     // ← correct — uses signup data
    }),
  })
  if (verifyRes.ok) {
    router.push('/dashboard')
    router.refresh()
  } else {
    setError('Payment verified but activation failed. Try logging in.')
    setLoading(false)
  }
},
        modal: {
          ondismiss: () => { setError('Payment cancelled'); setLoading(false) },
        },
      })
      rzp.open()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-void grid-bg flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="orb w-72 h-72 bg-gold top-0 right-0" />
      <div className="orb w-60 h-60 bg-emerald-brand bottom-0 left-0" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-full btn-gold flex items-center justify-center">
              <span className="font-display font-bold text-void text-sm">F</span>
            </div>
            <span className="font-display text-xl text-grad">Fairway for Good</span>
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                step > s ? 'btn-gold' : step === s ? 'border-2 border-gold text-gold' : 'border border-gold/30 text-muted'
              }`}>
                {step > s ? <Check size={12} /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-gold' : 'bg-gold/20'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Plan */}
        {step === 1 && (
          <div className="glass rounded-2xl p-5 sm:p-6">
            <h1 className="font-display text-2xl sm:text-3xl text-cream mb-1">Choose your plan</h1>
            <p className="text-muted text-sm mb-5">Monthly draws · Charity giving · Score tracking</p>
            <div className="space-y-3 mb-5">
             {[
  { id: 'free',    label: 'Free (Testing)', price: '₹0',     sub: 'full access · no payment needed', badge: 'TEST' },
  { id: 'weekly',  label: 'Weekly',         price: '₹1',     sub: 'per week · perfect for testing',  badge: '🧪 ₹1 ONLY' },
  { id: 'monthly', label: 'Monthly',        price: '₹999',   sub: 'per month · cancel anytime',      badge: null },
  { id: 'yearly',  label: 'Yearly',         price: '₹8,999', sub: 'per year · save 25%',             badge: 'BEST VALUE' },
].map(p => (
                <button key={p.id} onClick={() => setPlan(p.id as any)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left relative ${
                    plan === p.id ? 'border-gold bg-gold/10' : 'border-gold/20 hover:border-gold/40'
                  }`}>
                  {p.badge && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-void text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg,#c9a84c,#9b7c30)' }}>
                      {p.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      plan === p.id ? 'border-gold bg-gold' : 'border-muted'
                    }`}>
                      {plan === p.id && <div className="w-2 h-2 rounded-full bg-void" />}
                    </div>
                    <div>
                      <div className="text-cream font-medium text-sm">{p.label}</div>
                      <div className="text-muted text-xs">{p.sub}</div>
                    </div>
                  </div>
                  <div className={`font-display text-xl ${p.id === 'free' ? 'text-emerald-glow' : 'text-cream'}`}>
                    {p.price}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)}
              className="btn-gold w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-body">
              Continue <ArrowRight size={16} />
            </button>
            <p className="text-center text-muted text-xs mt-4">
              Already have an account? <Link href="/login" className="text-gold">Sign in</Link>
            </p>
          </div>
        )}

        {/* Step 2 — Charity */}
        {step === 2 && (
          <div className="glass rounded-2xl p-5 sm:p-6">
            <h1 className="font-display text-2xl sm:text-3xl text-cream mb-1">Choose your cause</h1>
            <p className="text-muted text-sm mb-5">Min 10% of your subscription goes here</p>
            <div className="space-y-2 mb-4">
              {CHARITIES.map(c => (
                <button key={c.id} onClick={() => setCharityName(c.name)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    charityName === c.name ? 'border-gold bg-gold/10' : 'border-gold/20 hover:border-gold/40'
                  }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    charityName === c.name ? 'bg-gold/30' : 'bg-gold/10'
                  }`}>
                    <Heart size={14} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-cream text-sm font-medium truncate">{c.name}</div>
                    <div className="text-muted text-xs">{c.desc}</div>
                  </div>
                  {charityName === c.name && <Check size={14} className="text-gold flex-shrink-0" />}
                </button>
              ))}
            </div>
            {charityName && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Contribution</span>
                  <span className="text-gold font-semibold">{charityPct}%</span>
                </div>
                <input type="range" min={10} max={50} step={5} value={charityPct}
                  onChange={e => setCharityPct(+e.target.value)} className="w-full accent-gold" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="btn-outline px-4 py-3 rounded-xl flex items-center gap-1 text-sm">
                <ChevronLeft size={15} /> Back
              </button>
              <button onClick={() => setStep(3)} disabled={!charityName}
                className="btn-gold flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-body disabled:opacity-50">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Account */}
        {step === 3 && (
          <div className="glass rounded-2xl p-5 sm:p-6">
            <h1 className="font-display text-2xl sm:text-3xl text-cream mb-1">Create account</h1>
            <p className="text-muted text-sm mb-5">Then pay securely via Razorpay</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs text-muted uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  placeholder="John Smith" className="input-field px-4 py-3 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted uppercase tracking-wider mb-2">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className="input-field px-4 py-3 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                    className="input-field px-4 py-3 pr-11 rounded-xl text-sm" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gold">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {/* Summary */}
              <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-muted">Plan</span>
                  <span className="text-cream font-medium capitalize">
                    {plan === 'free' ? 'Free (Testing) — ₹0' : plan === 'weekly' ? 'Weekly — ₹1/wk' : plan === 'monthly' ? 'Monthly — ₹999/mo' : 'Yearly — ₹8,999/yr'}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-muted">Charity</span><span className="text-cream font-medium">{charityName} ({charityPct}%)</span></div>
                <div className="flex justify-between"><span className="text-muted">Payment</span>
                  <span className={`font-medium ${plan === 'free' ? 'text-emerald-glow' : 'text-gold'}`}>
                    {plan === 'free' ? 'No payment required ✓' : 'Razorpay 🔒'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="btn-outline px-4 py-3 rounded-xl flex items-center gap-1 text-sm">
                  <ChevronLeft size={15} /> Back
                </button>
                <button type="submit" disabled={loading}
                  className="btn-gold flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-body">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : plan === 'free' ? <>Create Free Account <ArrowRight size={16} /></> : <>Pay & Start <ArrowRight size={16} /></>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
