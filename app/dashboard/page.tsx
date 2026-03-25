'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { format } from 'date-fns'
import {
  Trophy, Heart, TrendingUp, Target, Plus,
  Calendar, Loader2, AlertCircle, LogOut, Zap,
  Menu, X, CreditCard, ChevronRight, Upload, ImageIcon, ExternalLink
} from 'lucide-react'

type Tab = 'overview' | 'scores' | 'draws' | 'charity' | 'winnings'

// ── Winning Card with proof upload ──────────────────────────
function WinningCard({ w, onUploaded }: { w: any; onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('entryId', w.id)
    const res = await fetch('/api/proof', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (res.ok) { onUploaded() }
    else { setError(data.error || 'Upload failed') }
  }

  return (
    <div className="p-4 rounded-xl bg-gold/5 border border-gold/20 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} className="text-gold" />
            <span className="text-cream font-medium text-sm capitalize">{w.tier}</span>
          </div>
          <p className="text-muted text-xs">
            {w.draws?.draw_date ? format(new Date(w.draws.draw_date), 'MMMM yyyy') : ''} Draw
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-gold">
            ₹{Number(w.prize_amount || 0).toLocaleString()}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            w.payment_status === 'paid'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {w.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending verification'}
          </span>
        </div>
      </div>

      {w.payment_status !== 'paid' && (
        <div className="border-t border-gold/10 pt-3">
          {w.proof_url ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-green-400 text-xs flex items-center gap-1">
                <ImageIcon size={12} /> Screenshot submitted — awaiting admin review
              </span>
              <a href={w.proof_url} target="_blank" rel="noopener noreferrer"
                className="text-gold text-xs flex items-center gap-1 hover:underline">
                <ExternalLink size={11} /> View proof
              </a>
            </div>
          ) : (
            <div>
              <p className="text-muted text-xs mb-2">Upload your score screenshot to claim this prize</p>
              {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
              <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gold/30 text-gold text-xs cursor-pointer hover:border-gold/60 hover:bg-gold/5 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading ? 'Uploading...' : 'Upload Screenshot (JPG/PNG max 5MB)'}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile]   = useState<any>(null)
  const [scores, setScores]     = useState<any[]>([])
  const [draws, setDraws]       = useState<any[]>([])
  const [winnings, setWinnings] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<Tab>('overview')
  const [sideOpen, setSideOpen] = useState(false)
  const [newScore, setNewScore] = useState('')
  const [newDate, setNewDate]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [scoreError, setScoreError] = useState('')

  // Upgrade modal state
  const [showUpgrade, setShowUpgrade]   = useState(false)
  const [upgradePlan, setUpgradePlan]   = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const [upgrading, setUpgrading]       = useState(false)
  const [upgradeError, setUpgradeError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const [p, sc, dr, wi] = await Promise.all([
      supabase.from('profiles').select('*, charities(name, description)').eq('id', user.id).single(),
      supabase.from('scores').select('*').eq('user_id', user.id).order('date_played', { ascending: false }).limit(5),
      supabase.from('draws').select('*').eq('status', 'published').order('draw_date', { ascending: false }).limit(5),
      supabase.from('draw_entries').select('*, draws(draw_date)').eq('user_id', user.id).not('tier', 'is', null).order('created_at', { ascending: false }),
    ])
    setProfile(p.data)
    setScores(sc.data || [])
    setDraws(dr.data || [])
    setWinnings(wi.data || [])
    setLoading(false)
  }

  async function addScore(e: React.FormEvent) {
    e.preventDefault()
    setScoreError('')
    const s = parseInt(newScore)
    if (isNaN(s) || s < 1 || s > 45) { setScoreError('Score must be between 1 and 45'); return }
    if (!newDate) { setScoreError('Please select a date'); return }
    setSaving(true)
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: s, date_played: newDate }),
    })
    setSaving(false)
    if (res.ok) { setNewScore(''); setNewDate(''); load() }
    else { const d = await res.json(); setScoreError(d.error || 'Failed') }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  function switchTab(t: Tab) { setTab(t); setSideOpen(false) }

  // Load Razorpay script dynamically
  function loadRazorpay(): Promise<boolean> {
    return new Promise(resolve => {
      if ((window as any).Razorpay) { resolve(true); return }
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload = () => resolve(true)
      s.onerror = () => resolve(false)
      document.body.appendChild(s)
    })
  }

  // Handle subscription / upgrade for existing users
  async function handleUpgrade() {
    setUpgradeError('')
    setUpgrading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: upgradePlan, userId: user.id }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error || 'Order creation failed')

      const loaded = await loadRazorpay()
      if (!loaded) throw new Error('Could not load payment gateway')

      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Fairway for Good',
        description: `${upgradePlan.charAt(0).toUpperCase() + upgradePlan.slice(1)} Membership`,
        order_id: order.orderId,
        prefill: { name: profile?.full_name || '', email: profile?.email || '' },
        theme: { color: '#c9a84c' },
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              plan: upgradePlan,
              userId: user.id,
            }),
          })
          if (verifyRes.ok) {
            setShowUpgrade(false)
            setUpgrading(false)
            load()
          } else {
            const d = await verifyRes.json()
            setUpgradeError(d.error || 'Verification failed')
            setUpgrading(false)
          }
        },
        modal: { ondismiss: () => { setUpgrading(false) } },
      })
      rzp.open()
    } catch (err: any) {
      setUpgradeError(err.message)
      setUpgrading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <Loader2 className="text-gold animate-spin" size={40} />
    </div>
  )

  const isActive = profile?.subscription_status === 'active'
  const userNums = scores.map((s: any) => s.score)
  const totalWon = winnings.reduce((s: number, w: any) => s + (w.prize_amount || 0), 0)

  const TABS = [
    { id: 'overview',  label: 'Overview',  icon: Zap },
    { id: 'scores',    label: 'My Scores', icon: TrendingUp },
    { id: 'draws',     label: 'Draws',     icon: Target },
    { id: 'charity',   label: 'Charity',   icon: Heart },
    { id: 'winnings',  label: 'Winnings',  icon: Trophy },
  ]

  const UPGRADE_PLANS = [
    { id: 'weekly',  label: 'Weekly',  price: '₹1',     sub: 'per week · perfect for testing' },
    { id: 'monthly', label: 'Monthly', price: '₹999',   sub: 'per month · cancel anytime' },
    { id: 'yearly',  label: 'Yearly',  price: '₹8,999', sub: 'per year · save 25%' },
  ]

  return (
    <div className="min-h-screen bg-void flex">

      {/* Sidebar backdrop mobile */}
      {sideOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSideOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed top-0 left-0 h-full w-60 z-40 flex flex-col transition-transform duration-300 ease-in-out
        ${sideOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        bg-void border-r border-gold/10`}>
        <div className="p-4 border-b border-gold/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full btn-gold flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-void text-xs">F</span>
            </div>
            <span className="font-display text-base text-grad">Fairway for Good</span>
          </Link>
          <button onClick={() => setSideOpen(false)} className="lg:hidden text-muted hover:text-gold">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => switchTab(t.id as Tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                tab === t.id ? 'bg-gold/15 text-gold border border-gold/25' : 'text-muted hover:text-cream hover:bg-white/5'
              }`}>
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gold/10 space-y-0.5">
          <div className="px-3 py-2 rounded-xl bg-forest/60">
            <p className="text-cream text-xs font-medium truncate">{profile?.full_name}</p>
            <p className="text-muted text-xs truncate">{profile?.email}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
              isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isActive ? `Active · ${profile?.subscription_plan}` : 'Inactive'}
            </span>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-red-400 hover:bg-red-400/5 transition-all">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3
          bg-void/90 backdrop-blur border-b border-gold/10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSideOpen(true)} className="lg:hidden text-muted hover:text-gold p-1">
              <Menu size={22} />
            </button>
            <div>
              <p className="text-muted text-xs">Good day,</p>
              <h1 className="font-display text-lg text-cream leading-tight">{profile?.full_name || 'Golfer'}</h1>
            </div>
          </div>
          {!isActive && (
            <button onClick={() => setShowUpgrade(true)}
              className="btn-gold px-3 py-1.5 rounded-full text-xs flex items-center gap-1">
              <CreditCard size={12} /> Subscribe
            </button>
          )}
        </header>

        {/* Mobile tab strip */}
        <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-gold/10 lg:hidden">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all ${
                tab === t.id ? 'bg-gold text-void font-semibold' : 'border border-gold/25 text-muted'
              }`}>
              <t.icon size={11} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-5 max-w-4xl">

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Draws Entered', val: draws.length },
                  { label: 'My Numbers',    val: `${userNums.length}/5` },
                  { label: 'Charity %',     val: `${profile?.charity_percentage || 10}%` },
                  { label: 'Total Won',     val: `₹${totalWon.toLocaleString()}` },
                ].map((s, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <div className="font-display text-2xl sm:text-3xl text-gold">{s.val}</div>
                    <div className="text-muted text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Subscription card */}
              <div className="glass rounded-xl p-5">
                <h2 className="font-display text-xl text-cream mb-3">Subscription</h2>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                      <span className="text-cream font-medium text-sm capitalize">
                        {profile?.subscription_status || 'Inactive'}
                      </span>
                    </div>
                    <p className="text-muted text-xs capitalize">
                      {profile?.subscription_plan ? `${profile.subscription_plan} plan` : 'No active plan'}
                      {profile?.subscription_end_date &&
                        ` · Expires ${format(new Date(profile.subscription_end_date), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                  <button onClick={() => setShowUpgrade(true)}
                    className="btn-gold px-5 py-2.5 rounded-xl text-void text-sm font-body font-semibold flex items-center gap-2">
                    <CreditCard size={15} />
                    {isActive ? 'Upgrade Plan' : 'Subscribe Now'}
                  </button>
                </div>
              </div>

              {/* Draw numbers */}
              <div className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="font-display text-xl text-cream">My Draw Numbers</h2>
                  <span className="text-xs text-muted">From your last 5 Stableford scores</span>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {userNums.map((n: number, i: number) => (
                    <div key={i} className="draw-ball">{n}</div>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - userNums.length) }).map((_, i) => (
                    <div key={i} className="w-[52px] h-[52px] rounded-full border-2 border-dashed border-gold/20 flex items-center justify-center">
                      <Plus size={14} className="text-gold/30" />
                    </div>
                  ))}
                </div>
                {userNums.length < 5 && (
                  <p className="text-xs text-gold/60 mt-3 flex items-center gap-1">
                    <AlertCircle size={11} />
                    Add {5 - userNums.length} more score{5 - userNums.length !== 1 ? 's' : ''} to complete your entry
                  </p>
                )}
              </div>

              {/* Latest draw */}
              {draws[0] && (
                <div className="glass rounded-xl p-5">
                  <h2 className="font-display text-xl text-cream mb-1">Latest Draw</h2>
                  <p className="text-muted text-xs mb-4">
                    {format(new Date(draws[0].draw_date), 'MMMM yyyy')} · Pool: ₹{Number(draws[0].prize_pool_total || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted mb-2">Winning Numbers</p>
                  <div className="flex gap-2 flex-wrap">
                    {(draws[0].winning_numbers || []).map((n: number, i: number) => (
                      <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-display font-semibold transition-all ${
                        userNums.includes(n)
                          ? 'bg-gold text-void shadow-lg shadow-gold/30'
                          : 'border border-gold/20 text-muted bg-forest/60'
                      }`}>{n}</div>
                    ))}
                  </div>
                  {userNums.some((n: number) => draws[0].winning_numbers?.includes(n)) && (
                    <p className="text-green-400 text-xs mt-3 font-medium">
                      ✓ You matched {userNums.filter((n: number) => draws[0].winning_numbers?.includes(n)).length} number(s)!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SCORES ── */}
          {tab === 'scores' && (
            <div className="max-w-2xl space-y-5">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="font-display text-2xl text-cream">Golf Scores</h2>
                    <p className="text-muted text-xs mt-0.5">Stableford format · 1–45 · Last 5 kept</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full border border-gold/25 text-gold">{scores.length}/5</span>
                </div>

                <form onSubmit={addScore} className="bg-forest/60 rounded-xl p-4 mb-5 border border-gold/10">
                  <p className="text-xs text-muted uppercase tracking-wider mb-3">Add New Score</p>
                  {scoreError && (
                    <p className="text-red-400 text-xs mb-2 flex items-center gap-1">
                      <AlertCircle size={11} /> {scoreError}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="number" min={1} max={45} value={newScore}
                      onChange={e => setNewScore(e.target.value)}
                      placeholder="Score (1–45)"
                      className="input-field px-4 py-3 rounded-xl text-sm flex-1" />
                    <input type="date" value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="input-field px-4 py-3 rounded-xl text-sm flex-1" />
                    <button type="submit" disabled={saving || !newScore || !newDate}
                      className="btn-gold px-5 py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Add</>}
                    </button>
                  </div>
                  {scores.length >= 5 && (
                    <p className="text-xs text-gold/60 mt-2 flex items-center gap-1">
                      <AlertCircle size={11} /> Adding removes your oldest score automatically
                    </p>
                  )}
                </form>

                <div className="space-y-2">
                  {scores.length === 0 ? (
                    <div className="text-center py-10 text-muted">
                      <TrendingUp size={36} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No scores yet. Add your first score above.</p>
                    </div>
                  ) : scores.map((sc: any, i: number) => (
                    <div key={sc.id} className="flex items-center justify-between p-3 rounded-xl border border-gold/10 bg-forest/40 hover:border-gold/25 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-gold/30 bg-gold/10 flex items-center justify-center font-display text-gold font-semibold">
                          {sc.score}
                        </div>
                        <div>
                          <p className="text-cream text-sm font-medium">{sc.score} pts (Stableford)</p>
                          <p className="text-muted text-xs flex items-center gap-1">
                            <Calendar size={10} />
                            {format(new Date(sc.date_played), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-gold/15 text-gold">Latest</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DRAWS ── */}
          {tab === 'draws' && (
            <div className="max-w-2xl space-y-4">
              <div className="glass rounded-xl p-5">
                <h2 className="font-display text-2xl text-cream mb-1">Monthly Draws</h2>
                <p className="text-muted text-sm mb-5">Match 3, 4, or 5 of the winning numbers to win</p>

                {userNums.length > 0 && (
                  <div className="p-4 rounded-xl bg-gold/5 border border-gold/20 mb-5">
                    <p className="text-xs text-muted uppercase tracking-wider mb-3">Your Numbers This Draw</p>
                    <div className="flex gap-2 flex-wrap">
                      {userNums.map((n: number, i: number) => (
                        <div key={i} className="draw-ball">{n}</div>
                      ))}
                    </div>
                  </div>
                )}

                {draws.length === 0 ? (
                  <div className="text-center py-10 text-muted">
                    <Target size={36} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No draws published yet. Check back at month end.</p>
                  </div>
                ) : draws.map((draw: any) => (
                  <div key={draw.id} className="p-4 rounded-xl border border-gold/15 bg-forest/40 mb-3">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <p className="text-cream font-medium text-sm">{format(new Date(draw.draw_date), 'MMMM yyyy')} Draw</p>
                        <p className="text-muted text-xs">Prize pool: ₹{Number(draw.prize_pool_total || 0).toLocaleString()}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/15 border border-green-500/25 text-green-400">Published</span>
                    </div>
                    <p className="text-xs text-muted mb-2">Winning Numbers</p>
                    <div className="flex gap-2 flex-wrap">
                      {(draw.winning_numbers || []).map((n: number, j: number) => (
                        <div key={j} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-display font-semibold ${
                          userNums.includes(n) ? 'bg-gold text-void shadow-md' : 'border border-gold/20 text-muted bg-forest/60'
                        }`}>{n}</div>
                      ))}
                    </div>
                    {userNums.some((n: number) => draw.winning_numbers?.includes(n)) && (
                      <p className="text-green-400 text-xs mt-2">
                        ✓ You matched {userNums.filter((n: number) => draw.winning_numbers?.includes(n)).length} number(s)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CHARITY ── */}
          {tab === 'charity' && (
            <div className="max-w-2xl space-y-4">
              <div className="glass rounded-xl p-5">
                <h2 className="font-display text-2xl text-cream mb-5">Your Charity</h2>
                {profile?.charities ? (
                  <div className="p-5 rounded-xl bg-gold/5 border border-gold/20 mb-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-emerald-brand/30 flex items-center justify-center flex-shrink-0">
                        <Heart size={22} className="text-gold" />
                      </div>
                      <div>
                        <h3 className="text-cream font-semibold">{profile.charities.name}</h3>
                        <p className="text-muted text-xs">{profile.charities.description}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Your contribution rate</span>
                        <span className="text-cream font-medium">{profile?.charity_percentage || 10}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gold/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold"
                          style={{ width: `${profile?.charity_percentage || 10}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted text-sm mb-4">No charity selected.</p>
                )}
                <Link href="/charities">
                  <button className="btn-outline w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
                    Browse All Charities <ChevronRight size={15} />
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* ── WINNINGS ── */}
          {tab === 'winnings' && (
            <div className="max-w-2xl space-y-4">
              <div className="glass rounded-xl p-5">
                <h2 className="font-display text-2xl text-cream mb-1">Winnings</h2>
                <p className="text-muted text-sm mb-5">Upload a screenshot to claim your prize</p>
                {winnings.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy size={44} className="mx-auto mb-3 text-gold/20" />
                    <p className="font-display text-xl text-cream mb-1">No wins yet</p>
                    <p className="text-muted text-sm">Keep playing — your numbers could win next month!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {winnings.map((w: any) => (
                      <WinningCard key={w.id} w={w} onUploaded={load} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── UPGRADE / SUBSCRIBE MODAL ── */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md border border-gold/25">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-2xl text-cream">
                  {isActive ? 'Upgrade Plan' : 'Subscribe Now'}
                </h2>
                <p className="text-muted text-xs mt-0.5">Secure payment via Razorpay</p>
              </div>
              <button
                onClick={() => { setShowUpgrade(false); setUpgradeError('') }}
                className="text-muted hover:text-gold transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {UPGRADE_PLANS.map(p => (
                <button key={p.id} onClick={() => setUpgradePlan(p.id as any)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                    upgradePlan === p.id ? 'border-gold bg-gold/10' : 'border-gold/20 hover:border-gold/40'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      upgradePlan === p.id ? 'border-gold bg-gold' : 'border-muted'
                    }`}>
                      {upgradePlan === p.id && <div className="w-2 h-2 rounded-full bg-void" />}
                    </div>
                    <div>
                      <div className="text-cream font-medium text-sm">{p.label}</div>
                      <div className="text-muted text-xs">{p.sub}</div>
                    </div>
                  </div>
                  <div className="font-display text-xl text-cream">{p.price}</div>
                </button>
              ))}
            </div>

            {upgradeError && (
              <p className="text-red-400 text-xs mb-3 flex items-center gap-1">
                <AlertCircle size={12} /> {upgradeError}
              </p>
            )}

            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="btn-gold w-full py-3.5 rounded-xl text-void font-body font-semibold flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              {upgrading
                ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                : <>Pay with Razorpay 🔒</>
              }
            </button>

            <p className="text-center text-muted text-xs mt-3">Cancel anytime · No hidden fees</p>
          </div>
        </div>
      )}

    </div>
  )
}