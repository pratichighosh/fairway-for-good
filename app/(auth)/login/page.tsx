'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }

    // Check role
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    if (profile?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-void grid-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div className="orb w-80 h-80 bg-emerald-brand top-0 left-0" />
      <div className="orb w-64 h-64 bg-gold bottom-0 right-0" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-full btn-gold flex items-center justify-center">
              <span className="font-display font-bold text-void">F</span>
            </div>
            <span className="font-display text-2xl text-grad">Fairway for Good</span>
          </Link>
          <h1 className="font-display text-4xl text-cream">Welcome back</h1>
          <p className="text-muted text-sm mt-2">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs text-muted uppercase tracking-wider mb-2">Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field px-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="input-field px-4 py-3 pr-11 rounded-xl text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-body mt-2">
              {loading ? <Loader2 size={17} className="animate-spin" /> : <>Sign In <ArrowRight size={17} /></>}
            </button>
          </form>
          <p className="text-center text-muted text-sm mt-5">
            No account?{' '}
            <Link href="/signup" className="text-gold hover:text-gold-light transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
