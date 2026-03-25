'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Search, Globe, Loader2, ArrowLeft } from 'lucide-react'

export default function CharitiesPage() {
  const [charities, setCharities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/charities').then(r => r.json()).then(d => {
      setCharities(d.charities || [])
      setLoading(false)
    })
  }, [])

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-void">
      {/* Nav */}
      <nav className="glass-nav sticky top-0 z-50 px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full btn-gold flex items-center justify-center">
            <span className="font-display font-bold text-void text-sm">F</span>
          </div>
          <span className="font-display text-xl text-grad">Fairway for Good</span>
        </Link>
        <Link href="/" className="flex items-center gap-1 text-muted hover:text-gold text-sm transition-colors">
          <ArrowLeft size={15} /> Back
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Make a Difference</p>
          <h1 className="font-display text-4xl sm:text-6xl text-cream mb-3">
            Charity <span className="text-grad italic">Directory</span>
          </h1>
          <p className="text-muted max-w-md mx-auto text-sm sm:text-base">
            10% of every subscription goes directly to your chosen charity.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8 sm:mb-12">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search charities..."
            className="input-field w-full pl-11 pr-4 py-3 rounded-xl text-sm" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={36} className="text-gold animate-spin" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c, i) => (
              <div key={c.id}
                className="glass card-hover rounded-2xl p-6 flex flex-col border border-gold/10 relative overflow-hidden">
                {c.featured && (
                  <span className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                    ★ Featured
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-emerald-brand/20 flex items-center justify-center mb-4">
                  <Heart size={22} className="text-gold" />
                </div>
                <h3 className="font-display text-xl text-cream mb-2">{c.name}</h3>
                <p className="text-muted text-sm leading-relaxed flex-1 mb-4">{c.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gold/10">
                  <div>
                    <div className="font-display text-2xl text-gold">₹{Number(c.total_raised || 0).toLocaleString()}</div>
                    <div className="text-muted text-xs">raised total</div>
                  </div>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted hover:text-gold transition-colors">
                      <Globe size={13} /> Website
                    </a>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted">
                <Heart size={40} className="mx-auto mb-3 opacity-20" />
                <p>No charities found for &ldquo;{search}&rdquo;</p>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/signup">
            <button className="btn-gold px-10 py-4 rounded-full text-void font-body font-semibold">
              Subscribe & Give Back
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}
