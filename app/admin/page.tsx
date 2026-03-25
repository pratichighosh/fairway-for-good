'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { format } from 'date-fns'
import {
  Users, Trophy, Heart, BarChart3, Play, Eye,
  CheckCircle, XCircle, Loader2, Shield,
  Menu, X, Plus, RefreshCw, LogOut, Zap
} from 'lucide-react'

type AdminTab = 'overview' | 'users' | 'draws' | 'charities' | 'winners' | 'analytics'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [sideOpen, setSideOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({ users: [], draws: [], charities: [], pendingWinners: [] })
  const [drawMode, setDrawMode] = useState<'random' | 'algorithmic'>('random')
  const [drawLoading, setDrawLoading] = useState(false)
  const [drawResult, setDrawResult] = useState<any>(null)
  const [newCharity, setNewCharity] = useState({ name: '', description: '', website: '' })
  const [addingCharity, setAddingCharity] = useState(false)
  const [showCharityForm, setShowCharityForm] = useState(false)

  useEffect(() => { checkAdmin() }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (p?.role !== 'admin') { router.replace('/dashboard'); return }
    loadData()
  }

  async function loadData() {
    setLoading(true)
    const res = await fetch('/api/admin')
    if (res.ok) { const d = await res.json(); setData(d) }
    setLoading(false)
  }

  async function runDraw(simulate: boolean) {
    setDrawLoading(true)
    setDrawResult(null)
    const res = await fetch('/api/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: drawMode, simulate }),
    })
    const d = await res.json()
    setDrawResult(d)
    if (!simulate) loadData()
    setDrawLoading(false)
  }

  async function handleVerify(entryId: string, action: 'approve' | 'reject') {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, entryId }),
    })
    loadData()
  }

  async function handleAddCharity(e: React.FormEvent) {
    e.preventDefault()
    setAddingCharity(true)
    await fetch('/api/charities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newCharity, featured: false, total_raised: 0 }),
    })
    setNewCharity({ name: '', description: '', website: '' })
    setShowCharityForm(false)
    setAddingCharity(false)
    loadData()
  }

  async function logout() { await supabase.auth.signOut(); router.replace('/') }

  function switchTab(t: AdminTab) { setTab(t); setSideOpen(false) }

  if (loading) return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <Loader2 className="text-gold animate-spin" size={40} />
    </div>
  )

  const activeUsers = data.users.filter((u: any) => u.subscription_status === 'active').length
  const revenue = activeUsers * 999
  const prizePool = revenue * 0.4
  const charity = revenue * 0.1

  const TABS = [
    { id: 'overview',   label: 'Overview',      icon: Zap,        badge: 0 },
    { id: 'users',      label: 'Users',          icon: Users,      badge: data.users.length },
    { id: 'draws',      label: 'Draw Engine',    icon: Trophy,     badge: 0 },
    { id: 'charities',  label: 'Charities',      icon: Heart,      badge: 0 },
    { id: 'winners',    label: 'Verify Winners', icon: CheckCircle, badge: data.pendingWinners.length },
    { id: 'analytics',  label: 'Analytics',      icon: BarChart3,  badge: 0 },
  ]

  return (
    <div className="min-h-screen bg-void flex">
      {/* Sidebar backdrop */}
      {sideOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSideOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 z-40 flex flex-col transition-transform duration-300
        ${sideOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        bg-void border-r border-gold/10`}>
        <div className="p-4 border-b border-gold/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full btn-gold flex items-center justify-center">
              <span className="font-display font-bold text-void text-xs">F</span>
            </div>
            <span className="font-display text-base text-grad">Fairway Admin</span>
          </Link>
          <button onClick={() => setSideOpen(false)} className="lg:hidden text-muted hover:text-gold">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => switchTab(t.id as AdminTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                tab === t.id ? 'bg-gold/15 text-gold border border-gold/25' : 'text-muted hover:text-cream hover:bg-white/5'
              }`}>
              <t.icon size={16} />
              <span className="flex-1">{t.label}</span>
              {t.badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-gold text-void text-xs font-bold flex items-center justify-center">
                  {t.badge > 9 ? '9+' : t.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gold/10 space-y-1">
          <div className="px-3 py-2 rounded-xl bg-emerald-brand/10 flex items-center gap-2">
            <Shield size={13} className="text-emerald-glow" />
            <span className="text-emerald-glow text-xs">Admin Access</span>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-red-400 hover:bg-red-400/5 transition-all">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-void/90 backdrop-blur border-b border-gold/10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSideOpen(true)} className="lg:hidden text-muted hover:text-gold p-1">
              <Menu size={22} />
            </button>
            <h1 className="font-display text-lg text-cream">Admin Dashboard</h1>
          </div>
          <button onClick={loadData} className="text-muted hover:text-gold transition-colors">
            <RefreshCw size={18} />
          </button>
        </header>

        {/* Mobile tabs */}
        <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-gold/10 lg:hidden">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as AdminTab)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all ${
                tab === t.id ? 'bg-gold text-void font-semibold' : 'border border-gold/25 text-muted'
              }`}>
              <t.icon size={11} /> {t.label}
              {t.badge > 0 && <span className="ml-1 bg-void/40 rounded-full px-1">{t.badge}</span>}
            </button>
          ))}
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-5 max-w-4xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Users', val: data.users.length },
                  { label: 'Active Subscribers', val: activeUsers },
                  { label: 'Monthly Revenue', val: `₹${revenue.toLocaleString()}` },
                  { label: 'Charity Pool', val: `₹${charity.toLocaleString()}` },
                ].map((s, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <div className="font-display text-2xl sm:text-3xl text-gold">{s.val}</div>
                    <div className="text-muted text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { label: 'Run Draw', desc: 'Publish monthly draw', icon: Trophy, action: () => switchTab('draws') },
                  { label: 'Verify Winners', desc: `${data.pendingWinners.length} pending`, icon: CheckCircle, action: () => switchTab('winners') },
                  { label: 'Manage Charities', desc: `${data.charities.length} listed`, icon: Heart, action: () => switchTab('charities') },
                ].map((a, i) => (
                  <button key={i} onClick={a.action}
                    className="glass card-hover rounded-xl p-4 flex items-center gap-4 text-left w-full border border-gold/10">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <a.icon size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-cream font-medium text-sm">{a.label}</p>
                      <p className="text-muted text-xs">{a.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <div className="max-w-5xl">
              <div className="glass rounded-xl p-5">
                <h2 className="font-display text-2xl text-cream mb-5">All Users ({data.users.length})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-gold/10 text-muted text-xs uppercase tracking-wider">
                        <th className="text-left py-3 px-2">Name</th>
                        <th className="text-left py-3 px-2">Email</th>
                        <th className="text-left py-3 px-2">Plan</th>
                        <th className="text-left py-3 px-2">Status</th>
                        <th className="text-left py-3 px-2">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map((u: any) => (
                        <tr key={u.id} className="border-b border-gold/5 hover:bg-gold/3 transition-colors">
                          <td className="py-3 px-2 text-cream font-medium">{u.full_name || '—'}</td>
                          <td className="py-3 px-2 text-muted text-xs">{u.email}</td>
                          <td className="py-3 px-2 text-gold capitalize text-xs">{u.subscription_plan || '—'}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              u.subscription_status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>{u.subscription_status}</span>
                          </td>
                          <td className="py-3 px-2 text-muted text-xs">
                            {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.users.length === 0 && <p className="text-center text-muted py-8 text-sm">No users yet</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── DRAWS ── */}
          {tab === 'draws' && (
            <div className="max-w-2xl space-y-5">
              <div className="glass rounded-xl p-5">
                <h2 className="font-display text-2xl text-cream mb-1">Draw Engine</h2>
                <p className="text-muted text-sm mb-5">Configure and run the monthly prize draw</p>

                <div className="bg-forest/60 rounded-xl p-4 border border-gold/10 mb-4">
                  <p className="text-xs text-muted uppercase tracking-wider mb-3">Draw Mode</p>
                  <div className="flex gap-3 mb-4">
                    {(['random', 'algorithmic'] as const).map(m => (
                      <button key={m} onClick={() => setDrawMode(m)}
                        className={`flex-1 py-2.5 rounded-xl text-sm border capitalize transition-all ${
                          drawMode === m ? 'border-gold bg-gold/15 text-gold' : 'border-gold/20 text-muted hover:border-gold/40'
                        }`}>{m}</button>
                    ))}
                  </div>
                  <p className="text-xs text-muted mb-5">
                    {drawMode === 'random' ? '5 random numbers from 1–45' : 'Weighted by most frequent user scores'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => runDraw(true)} disabled={drawLoading}
                      className="btn-outline flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                      {drawLoading ? <Loader2 size={15} className="animate-spin" /> : <><Eye size={15} /> Simulate</>}
                    </button>
                    <button onClick={() => runDraw(false)} disabled={drawLoading}
                      className="btn-gold flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2 font-body">
                      {drawLoading ? <Loader2 size={15} className="animate-spin" /> : <><Play size={15} /> Publish Draw</>}
                    </button>
                  </div>
                </div>

                {drawResult && (
                  <div className="p-4 rounded-xl bg-emerald-brand/10 border border-emerald-brand/25">
                    <p className="text-emerald-glow text-sm font-medium mb-2">
                      {drawResult.simulation ? 'Simulation Result' : '✓ Draw Published!'}
                    </p>
                    <p className="text-cream text-sm">Numbers: <strong>{drawResult.numbers?.join(', ')}</strong></p>
                    {drawResult.simulation && <p className="text-muted text-xs mt-1">Potential winners: {drawResult.potentialWinners}</p>}
                    {!drawResult.simulation && drawResult.winners && (
                      <div className="mt-2 text-xs text-muted space-y-0.5">
                        {Object.entries(drawResult.winners).map(([tier, count]) => (
                          <p key={tier}>{tier}: {count as number} winner(s)</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Draw history */}
                <h3 className="font-display text-lg text-cream mt-5 mb-3">Draw History</h3>
                <div className="space-y-2">
                  {data.draws.length === 0 ? (
                    <p className="text-muted text-sm">No draws yet</p>
                  ) : data.draws.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border border-gold/10 bg-forest/40">
                      <div>
                        <p className="text-cream text-sm">{format(new Date(d.draw_date), 'MMMM d, yyyy')}</p>
                        <p className="text-muted text-xs">Numbers: {(d.winning_numbers || []).join(', ')} · ₹{Number(d.prize_pool_total).toLocaleString()}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">{d.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CHARITIES ── */}
          {tab === 'charities' && (
            <div className="max-w-3xl space-y-4">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h2 className="font-display text-2xl text-cream">Charities</h2>
                  <button onClick={() => setShowCharityForm(!showCharityForm)}
                    className="btn-gold px-4 py-2 rounded-xl text-sm flex items-center gap-2 font-body">
                    <Plus size={15} /> Add Charity
                  </button>
                </div>

                {showCharityForm && (
                  <form onSubmit={handleAddCharity} className="bg-forest/60 rounded-xl p-4 border border-gold/15 mb-5 space-y-3">
                    <p className="text-xs text-muted uppercase tracking-wider">New Charity</p>
                    <input required value={newCharity.name} onChange={e => setNewCharity(f => ({ ...f, name: e.target.value }))}
                      placeholder="Charity name" className="input-field px-4 py-3 rounded-xl text-sm" />
                    <input required value={newCharity.description} onChange={e => setNewCharity(f => ({ ...f, description: e.target.value }))}
                      placeholder="Description" className="input-field px-4 py-3 rounded-xl text-sm" />
                    <input value={newCharity.website} onChange={e => setNewCharity(f => ({ ...f, website: e.target.value }))}
                      placeholder="Website (optional)" className="input-field px-4 py-3 rounded-xl text-sm" />
                    <div className="flex gap-3">
                      <button type="submit" disabled={addingCharity}
                        className="btn-gold flex-1 py-2.5 rounded-xl text-sm font-body">
                        {addingCharity ? <Loader2 size={15} className="animate-spin mx-auto" /> : 'Save'}
                      </button>
                      <button type="button" onClick={() => setShowCharityForm(false)}
                        className="btn-outline flex-1 py-2.5 rounded-xl text-sm">Cancel</button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {data.charities.map((c: any) => (
                    <div key={c.id} className="p-4 rounded-xl border border-gold/10 bg-forest/40 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-cream font-medium text-sm">{c.name}</p>
                        <p className="text-muted text-xs">{c.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-xl text-gold">₹{Number(c.total_raised || 0).toLocaleString()}</span>
                        {c.featured && <span className="text-xs text-gold bg-gold/10 px-2 py-0.5 rounded-full">Featured</span>}
                      </div>
                    </div>
                  ))}
                  {data.charities.length === 0 && <p className="text-muted text-sm">No charities yet</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── WINNERS ── */}
          {tab === 'winners' && (
            <div className="max-w-3xl space-y-4">
              <div className="glass rounded-xl p-5">
                <h2 className="font-display text-2xl text-cream mb-1">Winner Verification</h2>
                <p className="text-muted text-sm mb-5">Review and approve prize claims</p>
                {data.pendingWinners.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={44} className="mx-auto mb-3 text-gold/20" />
                    <p className="font-display text-xl text-cream mb-1">All clear!</p>
                    <p className="text-muted text-sm">No pending verifications</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.pendingWinners.map((w: any) => (
                      <div key={w.id} className="p-5 rounded-xl border border-gold/20 bg-gold/5">
                        <div className="flex items-start justify-between flex-wrap gap-4 mb-3">
                          <div>
                            <p className="text-cream font-semibold">{w.profiles?.full_name}</p>
                            <p className="text-muted text-xs">{w.profiles?.email}</p>
                            <p className="text-gold text-xs mt-1 capitalize font-medium">{w.tier} — ₹{Number(w.prize_amount).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleVerify(w.id, 'approve')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs hover:bg-green-500/30 transition-all">
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button onClick={() => handleVerify(w.id, 'reject')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/30 transition-all">
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                        </div>
                        <p className="text-muted text-xs">
                          Draw: {w.draws?.draw_date ? format(new Date(w.draws.draw_date), 'MMMM yyyy') : '—'} ·
                          Numbers: {(w.numbers || []).join(', ')} · Matched: {w.matched_count}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {tab === 'analytics' && (
            <div className="max-w-4xl">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Total Users', val: data.users.length, desc: 'All registered accounts' },
                  { label: 'Active Subscribers', val: activeUsers, desc: 'Paying members' },
                  { label: 'Inactive Users', val: data.users.length - activeUsers, desc: 'Not subscribed' },
                  { label: 'Monthly Revenue', val: `₹${revenue.toLocaleString()}`, desc: 'Gross subscriptions' },
                  { label: 'Prize Pool', val: `₹${prizePool.toLocaleString()}`, desc: '40% of revenue' },
                  { label: 'Charity Pool', val: `₹${charity.toLocaleString()}`, desc: '10% of revenue' },
                  { label: 'Draws Published', val: data.draws.filter((d: any) => d.status === 'published').length, desc: 'Total draws run' },
                  { label: 'Charities Listed', val: data.charities.length, desc: 'Active partners' },
                  { label: 'Pending Winners', val: data.pendingWinners.length, desc: 'Awaiting verification' },
                ].map((s, i) => (
                  <div key={i} className="glass rounded-xl p-5 card-hover">
                    <div className="font-display text-3xl text-gold mb-1">{s.val}</div>
                    <div className="text-cream font-medium text-sm">{s.label}</div>
                    <div className="text-muted text-xs mt-0.5">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
