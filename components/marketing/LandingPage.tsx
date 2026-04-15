'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Camera, Zap, Brain, MessageCircle, ArrowRight } from 'lucide-react'

const FEATURES = [
  {
    icon: Camera,
    title: 'Photo, texte, vocal, PDF',
    desc: "Importe ton cours comme tu veux. L'IA s'adapte.",
  },
  {
    icon: Zap,
    title: 'Fiches en 15 secondes',
    desc: 'Pas en 15 minutes. En 15 secondes. Chrono en main.',
  },
  {
    icon: Brain,
    title: 'QCM intelligents',
    desc: "Des questions qui testent ta compréhension, pas ta mémoire.",
  },
  {
    icon: MessageCircle,
    title: 'Chatbot par cours',
    desc: "Pose tes questions. L'IA connaît ton cours par cœur.",
  },
]

const STATS = [
  { value: '15s', label: 'pour générer tes fiches' },
  { value: '4x', label: 'plus rapide que réécrire' },
  { value: '100%', label: 'adapté collège & lycée' },
]

const TESTIMONIALS = [
  {
    text: "J'ai eu 17 en histoire grâce aux fiches Skynote. Ma prof a cru que j'avais révisé 3h.",
    name: 'Inès, 3ème',
    grade: '17/20',
    initials: 'I',
    color: '#7C3AED',
  },
  {
    text: "Le QCM m'a fait comprendre des trucs que j'avais pas captés en cours. C'est ouf.",
    name: 'Yanis, 2nde',
    grade: '15/20',
    initials: 'Y',
    color: '#2563EB',
  },
  {
    text: 'Je prends mon cours en photo et 15 secondes après j\'ai mes fiches. C\'est magique.',
    name: 'Léa, 4ème',
    grade: '16/20',
    initials: 'L',
    color: '#059669',
  },
]

// Positions fixes des etoiles — generees une seule fois, pas dans le render
const STAR_POSITIONS = [
  { left: "7%",   top: "11%", delay: "0s",    dur: "3s" },
  { left: "18%",  top: "54%", delay: "0.7s",  dur: "4s" },
  { left: "29%",  top: "23%", delay: "1.4s",  dur: "2s" },
  { left: "41%",  top: "78%", delay: "2.1s",  dur: "5s" },
  { left: "53%",  top: "9%",  delay: "2.8s",  dur: "3s" },
  { left: "64%",  top: "45%", delay: "0.3s",  dur: "4s" },
  { left: "75%",  top: "67%", delay: "1.1s",  dur: "2s" },
  { left: "87%",  top: "31%", delay: "1.8s",  dur: "5s" },
  { left: "93%",  top: "88%", delay: "2.5s",  dur: "3s" },
  { left: "12%",  top: "92%", delay: "0.6s",  dur: "4s" },
  { left: "36%",  top: "61%", delay: "3.2s",  dur: "2s" },
  { left: "58%",  top: "37%", delay: "1.5s",  dur: "5s" },
  { left: "80%",  top: "14%", delay: "0.9s",  dur: "3s" },
  { left: "22%",  top: "42%", delay: "2.3s",  dur: "4s" },
  { left: "47%",  top: "85%", delay: "3.7s",  dur: "2s" },
  { left: "69%",  top: "58%", delay: "1.2s",  dur: "5s" },
  { left: "3%",   top: "33%", delay: "4.1s",  dur: "3s" },
  { left: "90%",  top: "72%", delay: "0.4s",  dur: "4s" },
  { left: "44%",  top: "19%", delay: "2.9s",  dur: "2s" },
  { left: "76%",  top: "96%", delay: "1.6s",  dur: "5s" },
]

export function LandingPage({ isBeta = true }: { isBeta?: boolean }) {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.15 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function NavBar() {
  const { t } = useI18n()
  return (
    <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <Image src="/skycoin.png" alt="" width={28} height={28} />
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: "#F0F6FF" }}>Skynote</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LanguagePicker variant="landing" />
        <Link href="/login"  style={{ fontSize: 13, color: "#64748B", textDecoration: "none", padding: "8px 12px" }}>Connexion</Link>
        <Link href="/signup" className="sky-btn-primary" style={{ fontSize: 13, padding: "10px 20px" }}>{t('landing.hero.ctaBeta')}</Link>
      </div>
    </nav>
  )
}

function BackgroundOrbs() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <div style={{ position: "absolute", width: 500, height: 500, background: "#2563EB", top: "-10%", left: "-10%", filter: "blur(80px)", opacity: 0.12, borderRadius: "50%", animation: "orb-drift 20s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: 400, height: 400, background: "#60A5FA", bottom: "10%", right: "-5%",  filter: "blur(80px)", opacity: 0.12, borderRadius: "50%", animation: "orb-drift 20s ease-in-out infinite", animationDelay: "-7s" }} />
      <div style={{ position: "absolute", width: 300, height: 300, background: "#1D4ED8", top: "50%",  left: "30%",    filter: "blur(80px)", opacity: 0.12, borderRadius: "50%", animation: "orb-drift 20s ease-in-out infinite", animationDelay: "-13s" }} />
      {STAR_POSITIONS.map((s, i) => (
        <div key={i} className="sky-star" style={{ left: s.left, top: s.top, animation: `twinkle ${s.dur} ease-in-out ${s.delay} infinite` }} />
      ))}
    </div>
  )
}

function PricingFree() {
  return (
    <Link href="/signup" style={{ display: "block", marginTop: 20, textAlign: "center", fontSize: 13, fontWeight: 600, padding: "11px", borderRadius: 10, border: "1px solid #1E3A5F", color: "#94A3B8", textDecoration: "none" }}>
      Commencer
    </Link>
  )
}

function PricingPlus() {
  return (
    <Link href="/signup" className="sky-btn-primary" style={{ display: "block", marginTop: 20, textAlign: "center", fontSize: 13, padding: "11px", borderRadius: 10 }}>
      S'abonner
    </Link>
  )
}

function PricingFamily() {
  return (
    <Link href="/signup" style={{ display: "block", marginTop: 20, textAlign: "center", fontSize: 13, fontWeight: 600, padding: "11px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.3)", color: "#C4B5FD", textDecoration: "none" }}>
      S'abonner
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function LandingPage({ isBeta = true, testimonials }: { isBeta?: boolean; testimonials?: Testimonial[] }) {
  const TESTIMONIALS = (testimonials && testimonials.length >= 3) ? testimonials : FALLBACK_TESTIMONIALS
  const [glowPulse, setGlowPulse] = useState(false)
  const { t } = useI18n()
  useScrollReveal()

  useEffect(() => {
    const id = setInterval(() => setGlowPulse(p => !p), 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ background: '#060D1A', minHeight: '100vh', color: '#F0F6FF' }} className="font-body">
      <style>{`
        .gradient-text {
          background: linear-gradient(135deg, #60A5FA 0%, #2563EB 50%, #60A5FA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% auto;
          animation: gradient-shift 4s ease-in-out infinite;
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 200% center; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.5; }
        }
        @keyframes orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.97); }
        }
        .animate-fade-up {
          animation: fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }
        .section-visible .animate-on-scroll {
          animation: fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }
        .feature-card {
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(96, 165, 250, 0.35) !important;
        }
        .cta-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(37, 99, 235, 0.55) !important;
        }
        .cta-btn:active {
          transform: scale(0.97);
        }
      `}</style>

      {/* Background orbs + étoiles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 500, height: 500, background: '#2563EB', top: '-10%', left: '-10%', filter: 'blur(90px)', opacity: 0.1, animation: 'orb-drift 20s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, background: '#60A5FA', bottom: '10%', right: '-5%', filter: 'blur(90px)', opacity: 0.1, animation: 'orb-drift 20s ease-in-out infinite', animationDelay: '-7s' }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, background: '#1D4ED8', top: '50%', left: '30%', filter: 'blur(90px)', opacity: 0.08, animation: 'orb-drift 20s ease-in-out infinite', animationDelay: '-13s' }} />
        {STARS.map((star, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{ width: 2, height: 2, left: `${star.left}%`, top: `${star.top}%`, animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite` }} />
        ))}
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/skycoin.png" alt="Skynote logo" width={28} height={28} />
          <span className="font-display text-[18px] font-bold tracking-tight text-[#F0F6FF]">Skynote</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="text-[13px] text-slate-400 hover:text-white transition-colors px-3 py-2 hidden sm:block"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="cta-btn text-[13px] font-semibold px-4 sm:px-5 py-2.5 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}
          >
            <span className="hidden sm:inline">Commencer gratuitement</span>
            <span className="sm:hidden">Commencer</span>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-20 text-center">

        {/* Badge */}
        <div className="animate-fade-up delay-1 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[12px] text-blue-300 font-medium">
              {isBeta ? 'Bêta ouverte — 100% gratuit' : 'Disponible maintenant'}
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1
          className="font-display animate-fade-up delay-2"
          style={{ fontSize: 'clamp(32px, 6vw, 60px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }}
        >
          <span className="text-[#F0F6FF]">Tes cours deviennent</span>
          <br />
          <span className="gradient-text">des fiches de révision</span>
        </h1>

        {/* Sous-titre */}
        <p className="animate-fade-up delay-3 text-[15px] sm:text-[17px] text-slate-400 max-w-md mx-auto mt-5 leading-relaxed">
          Ce n'est pas un complément qui fait perdre du temps.
          <br className="hidden sm:block" />
          C'est un nouveau moyen de travailler.
        </p>

        {/* CTA principal */}
        <div className="animate-fade-up delay-4 flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/signup"
            className="cta-btn w-full sm:w-auto text-[15px] font-semibold px-8 py-3.5 rounded-xl text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}
          >
            {isBeta ? 'Commencer gratuitement' : 'Créer mon compte'}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[12px] text-slate-600">Sans carte bancaire</p>
        </div>

        {/* Stats */}
        <div className="animate-fade-up delay-5 grid grid-cols-3 gap-3 sm:gap-8 mt-12 max-w-sm sm:max-w-lg mx-auto">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-display text-[22px] sm:text-[28px] font-bold text-[#F0F6FF]">{s.value}</p>
              <p className="text-[11px] sm:text-[12px] text-slate-500 mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
