'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Heart, Trophy, TrendingUp, Target, Star, Menu, X, Shield, Users, Gift } from 'lucide-react'

const TESTS = [
  { name: 'James C.', loc: 'Edinburgh', text: 'Won ₹42,000 last month and 40% went to the Children\'s Foundation. Incredible feeling.' },
  { name: 'Sarah M.', loc: 'Mumbai', text: 'The draw system is totally transparent. My golf scores actually matter now!' },
  { name: 'Robert K.', loc: 'London', text: 'Best decision I made this year. Playing with purpose changes everything.' },
]

// ── Animation hook using IntersectionObserver ────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

// ── Animated wrapper components ──────────────────────────────
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(40px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

function SlideLeft({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(-60px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

function SlideRight({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(60px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

function ScaleIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.88)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [testIdx, setTestIdx] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    const t = setInterval(() => setTestIdx(i => (i + 1) % TESTS.length), 4000)
    return () => { window.removeEventListener('scroll', onScroll); clearInterval(t) }
  }, [])

  return (
    <main className="min-h-screen bg-void overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav py-3' : 'py-5'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full btn-gold flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-void text-sm">F</span>
            </div>
            <span className="font-display text-xl text-grad">Fairway for Good</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[['#how', 'How it Works'], ['#prizes', 'Prizes'], ['#charities', 'Charities'], ['#pricing', 'Pricing']].map(([href, label]) => (
              <a key={href} href={href} className="text-muted hover:text-cream text-sm transition-colors">{label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"><button className="text-muted hover:text-cream text-sm transition-colors px-3 py-2">Sign In</button></Link>
            <Link href="/signup"><button className="btn-gold px-5 py-2.5 rounded-full text-void text-sm font-body">Get Started</button></Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-muted hover:text-gold p-1">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden glass-nav border-t border-gold/10 px-4 py-4 space-y-3">
            {[['#how', 'How it Works'], ['#prizes', 'Prizes'], ['#charities', 'Charities'], ['#pricing', 'Pricing']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block text-cream py-2 border-b border-gold/10 text-sm">{label}</a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="flex-1"><button className="w-full btn-outline py-3 rounded-xl text-sm">Sign In</button></Link>
              <Link href="/signup" className="flex-1"><button className="w-full btn-gold py-3 rounded-xl text-void text-sm font-body">Get Started</button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen grid-bg flex items-center justify-center px-4 pt-20 relative overflow-hidden">
        <div className="orb w-96 h-96 bg-emerald-brand top-0 left-0" />
        <div className="orb w-80 h-80 bg-gold top-1/4 right-0" />
        <div className="orb w-64 h-64 bg-emerald-brand bottom-0 left-1/3" />

        {[200, 400, 600, 800].map(s => (
          <div key={s} className="absolute rounded-full border border-gold/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: s, height: s }} />
        ))}

        <div className="relative z-10 text-center max-w-4xl mx-auto py-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-surface/60 text-gold text-xs uppercase tracking-wider mb-8 fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: 'pulse-dot 2s infinite' }} />
            Monthly Prize Draws · Live Now
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-[0.9] mb-6 fade-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-cream block">Golf with</span>
            <span className="text-grad italic block">purpose.</span>
          </h1>

          <p className="text-muted text-base sm:text-xl max-w-xl mx-auto mb-8 leading-relaxed fade-up" style={{ animationDelay: '0.2s' }}>
            Track your Stableford scores, enter monthly prize draws,
            and support the charity you love. One subscription. Three ways to win.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 fade-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/signup">
              <button className="btn-gold px-8 sm:px-10 py-4 rounded-full text-void font-body font-semibold flex items-center gap-2 group w-full sm:w-auto justify-center">
                Start Playing
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <a href="#how">
              <button className="btn-outline px-8 sm:px-10 py-4 rounded-full text-sm font-body w-full sm:w-auto">
                How it Works
              </button>
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 fade-up" style={{ animationDelay: '0.5s' }}>
            {[
              { val: '₹43L+', label: 'Prize Pool' },
              { val: '2,840', label: 'Members' },
              { val: '₹12L+', label: 'For Charity' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl text-gold">{s.val}</div>
                <div className="text-muted text-xs uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 float">
          <div className="w-5 h-9 rounded-full border border-gold/30 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2.5 rounded-full bg-gold/60" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12 sm:mb-16">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">The Process</p>
            <h2 className="font-display text-4xl sm:text-5xl text-cream">
              Simple. Transparent. <span className="text-grad italic">Rewarding.</span>
            </h2>
          </FadeUp>

          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
            {[
              { n: '01', icon: TrendingUp, title: 'Track Your Game', desc: 'Enter your last 5 Stableford scores (1–45). Your golf history becomes your draw numbers.' },
              { n: '02', icon: Target, title: 'Monthly Draw', desc: 'Every month, 5 numbers are drawn. Match 3, 4, or all 5 to win your share of the prize pool.' },
              { n: '03', icon: Heart, title: 'Give Back', desc: '10%+ of your subscription goes to your chosen charity. Play golf and fund what matters.' },
            ].map((s, i) => {
              // alternate: left, up, right
              const Wrapper = i === 0 ? SlideLeft : i === 1 ? FadeUp : SlideRight
              return (
                <Wrapper key={i} delay={i * 120}>
                  <div className="glass card-hover rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-gold/10 h-full">
                    <div className="absolute top-0 right-0 font-display text-[7rem] leading-none font-light text-gold/5 select-none pointer-events-none pr-2">{s.n}</div>
                    <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5">
                      <s.icon size={22} className="text-gold" />
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl text-cream mb-2">{s.title}</h3>
                    <p className="text-muted text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </Wrapper>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PRIZES ── */}
      <section id="prizes" className="py-20 sm:py-28 px-4 sm:px-6" style={{ background: 'rgba(10,20,16,0.5)' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12 sm:mb-16">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Prize Distribution</p>
            <h2 className="font-display text-4xl sm:text-5xl text-cream">
              Win big. <span className="text-grad italic">Give more.</span>
            </h2>
            <p className="text-muted mt-3 max-w-md mx-auto text-sm">40% of every subscription builds the prize pool. Distributed automatically.</p>
          </FadeUp>

          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            {[
              { pct: '40%', label: '5-Number Match', tag: 'JACKPOT', featured: true },
              { pct: '35%', label: '4-Number Match', tag: 'PRIZE',   featured: false },
              { pct: '25%', label: '3-Number Match', tag: 'REWARD',  featured: false },
            ].map((p, i) => (
              <ScaleIn key={i} delay={i * 130}>
                <div className={`glass card-hover rounded-2xl p-6 sm:p-8 text-center relative border ${p.featured ? 'border-gold/40 bg-gold/5' : 'border-gold/10'}`}>
                  {p.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-void"
                      style={{ background: 'linear-gradient(135deg, #c9a84c, #9b7c30)' }}>
                      Jackpot
                    </div>
                  )}
                  <div className="font-display text-6xl sm:text-7xl text-gold mt-2">{p.pct}</div>
                  <div className="text-gold text-xs tracking-[0.2em] uppercase my-2">{p.tag}</div>
                  <div className="text-cream text-base sm:text-lg">{p.label}</div>
                  <div className="mt-4 h-1.5 rounded-full bg-gold/10">
                    <div className="h-full rounded-full" style={{ width: p.pct, background: 'linear-gradient(90deg, #9b7c30, #c9a84c)' }} />
                  </div>
                </div>
              </ScaleIn>
            ))}
          </div>

          <FadeUp delay={300}>
            <div className="glass rounded-xl p-4 flex flex-wrap gap-4 justify-center text-xs text-muted border border-gold/10">
              <span className="flex items-center gap-1.5"><Shield size={13} className="text-gold" /> Jackpot rolls over if no 5-match</span>
              <span className="hidden sm:block text-gold/20">|</span>
              <span className="flex items-center gap-1.5"><Users size={13} className="text-gold" /> Multiple winners split equally</span>
              <span className="hidden sm:block text-gold/20">|</span>
              <span className="flex items-center gap-1.5"><Check size={13} className="text-gold" /> Screenshot proof required</span>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CHARITIES ── */}
      <section id="charities" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Make an Impact</p>
            <h2 className="font-display text-4xl sm:text-5xl text-cream">
              Choose your <span className="text-grad italic">cause.</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { name: "Children's Golf Foundation", raised: '₹12.4L' },
              { name: 'Green Earth Initiative',     raised: '₹8.7L' },
              { name: 'Veterans Sports Fund',       raised: '₹15.2L' },
              { name: 'Youth Development Trust',    raised: '₹6.9L' },
            ].map((c, i) => (
              // alternating slide directions
              <SlideLeft key={i} delay={i * 100}>
                <div className="glass card-hover rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gold/10 relative overflow-hidden h-full">
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent scale-x-0 hover:scale-x-100 transition-transform duration-500" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-emerald-brand/20 flex items-center justify-center mb-3">
                    <Heart size={16} className="text-gold" />
                  </div>
                  <p className="text-cream text-xs sm:text-sm font-medium mb-1 leading-tight">{c.name}</p>
                  <p className="font-display text-lg sm:text-2xl text-gold">{c.raised}</p>
                  <p className="text-muted text-xs">raised</p>
                </div>
              </SlideLeft>
            ))}
          </div>

          <FadeUp delay={200} className="text-center">
            <Link href="/charities">
              <button className="btn-outline px-8 py-3 rounded-full text-sm">View All Charities →</button>
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6" style={{ background: 'rgba(10,20,16,0.5)' }}>
        <div className="max-w-3xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Membership</p>
            <h2 className="font-display text-4xl sm:text-5xl text-cream">
              One price. <span className="text-grad italic">Unlimited draws.</span>
            </h2>
          </FadeUp>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                plan: 'Monthly', price: '₹999', period: '/mo', tag: null,
                features: ['Monthly prize draw entry', 'Score tracking (5 scores)', 'Charity contribution (10%+)', 'Winner verification', 'Dashboard access'],
                highlight: false,
              },
              {
                plan: 'Yearly', price: '₹8,999', period: '/yr', tag: 'SAVE 25%',
                features: ['All monthly features', '12 draw entries', 'Priority draw position', 'Yearly report', 'Founding member badge'],
                highlight: true,
              },
            ].map((p, i) => {
              const Wrapper = i === 0 ? SlideLeft : SlideRight
              return (
                <Wrapper key={i} delay={i * 150}>
                  <div className={`glass card-hover rounded-2xl p-6 sm:p-8 relative border h-full ${p.highlight ? 'border-gold/40 bg-gold/5' : 'border-gold/10'}`}>
                    {p.tag && (
                      <div className="absolute -top-3 right-5 px-4 py-1 rounded-full text-xs font-bold text-void"
                        style={{ background: 'linear-gradient(135deg, #c9a84c, #9b7c30)' }}>
                        {p.tag}
                      </div>
                    )}
                    <p className="text-muted text-xs uppercase tracking-widest mb-1">{p.plan}</p>
                    <div className="flex items-end gap-1 mb-5">
                      <span className="font-display text-4xl sm:text-5xl text-cream">{p.price}</span>
                      <span className="text-muted pb-2 text-sm font-body">{p.period}</span>
                    </div>
                    <ul className="space-y-2.5 mb-6">
                      {p.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-3 text-sm text-cream/80">
                          <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                            <Check size={10} className="text-gold" />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup">
                      <button className={`w-full py-3.5 rounded-xl text-sm font-body font-semibold transition-all ${p.highlight ? 'btn-gold text-void' : 'btn-outline'}`}>
                        Get Started
                      </button>
                    </Link>
                  </div>
                </Wrapper>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <FadeUp>
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-8">Member Stories</p>
          </FadeUp>

          <ScaleIn delay={100}>
            <div className="min-h-[140px] flex flex-col items-center justify-center">
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-gold text-gold" />)}
              </div>
              <p className="font-display text-xl sm:text-2xl lg:text-3xl text-cream italic leading-relaxed mb-6 transition-all duration-500">
                &ldquo;{TESTS[testIdx].text}&rdquo;
              </p>
              <p className="text-muted text-sm">
                <span className="text-cream font-medium">{TESTS[testIdx].name}</span> · {TESTS[testIdx].loc}
              </p>
            </div>
          </ScaleIn>

          <div className="flex justify-center gap-2 mt-6">
            {TESTS.map((_, i) => (
              <button key={i} onClick={() => setTestIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === testIdx ? 'bg-gold w-6' : 'bg-gold/30 w-2'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="orb w-96 h-96 bg-emerald-brand opacity-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <ScaleIn>
            <div className="glass border border-gold/25 rounded-2xl sm:rounded-3xl p-8 sm:p-12">
              <div className="w-14 h-14 rounded-full btn-gold flex items-center justify-center mx-auto mb-5"
                style={{ animation: 'pulse-dot 3s infinite' }}>
                <Trophy size={24} className="text-void" />
              </div>
              <h2 className="font-display text-3xl sm:text-5xl text-cream mb-3">
                Your game.<br />
                <span className="text-grad italic">Your legacy.</span>
              </h2>
              <p className="text-muted mb-7 text-sm sm:text-base">
                Join 2,840 golfers playing with purpose. Subscribe and enter next month&apos;s draw.
              </p>
              <Link href="/signup">
                <button className="btn-gold px-10 sm:px-14 py-4 rounded-full text-void font-body font-semibold flex items-center justify-center gap-3 mx-auto">
                  <Gift size={18} />
                  Claim Your Spot
                  <ArrowRight size={18} />
                </button>
              </Link>
              <p className="text-muted text-xs mt-4">Cancel anytime · No hidden fees · Razorpay secure checkout</p>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gold/10 py-8 sm:py-10 px-4 sm:px-6">
        <FadeUp>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <div className="font-display text-xl text-grad">Fairway for Good</div>
              <p className="text-muted text-xs mt-0.5">Golf. Win. Give.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-5 text-sm text-muted">
              {[['/', 'Home'], ['/charities', 'Charities'], ['/login', 'Sign In'], ['/signup', 'Join']].map(([href, label]) => (
                <Link key={href} href={href} className="hover:text-gold transition-colors">{label}</Link>
              ))}
            </div>
            <p className="text-muted/40 text-xs">© 2025 Fairway for Good</p>
          </div>
        </FadeUp>
      </footer>
    </main>
  )
}