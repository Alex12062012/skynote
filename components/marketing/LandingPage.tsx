<<<<<<< HEAD
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useI18n } from "@/lib/i18n/context"
import { LanguagePicker } from "@/components/ui/LanguagePicker"

// ---------------------------------------------------------------------------
// Donnees statiques — pas de generation a la volee
// ---------------------------------------------------------------------------

type Feature  = { icon: string; title: string; desc: string }
type Stat     = { value: string; label: string }
type Testimonial = { text: string; name: string; grade: string }

const FEATURES: Feature[] = [
  { icon: "📸", title: "Photo, texte, vocal, PDF", desc: "Importe ton cours comme tu veux. L'IA s'adapte." },
  { icon: "⚡", title: "Fiches en 15 secondes",   desc: "Pas en 15 minutes. En 15 secondes. Chrono en main." },
  { icon: "🧠", title: "QCM intelligents",         desc: "Des questions qui testent ta comprehension, pas ta memoire." },
  { icon: "💬", title: "Chatbot par cours",        desc: "Pose tes questions. L'IA connait ton cours par coeur." },
]

const STATS: Stat[] = [
  { value: "15s",   label: "pour generer tes fiches" },
  { value: "4x",    label: "plus rapide que reecrire" },
  { value: "100%",  label: "adapte college & lycee" },
]

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { text: "J'ai eu 17 en histoire grace aux fiches Skynote. Ma prof a cru que j'avais revise 3h.", name: "Ines, 3eme",  grade: "17/20" },
  { text: "Le QCM m'a fait comprendre des trucs que j'avais pas capte en cours. C'est ouf.",       name: "Yanis, 2nde", grade: "15/20" },
  { text: "Je prends mon cours en photo et 15 secondes apres j'ai mes fiches. C'est magique.",     name: "Lea, 4eme",   grade: "16/20" },
=======
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
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
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

<<<<<<< HEAD
// ---------------------------------------------------------------------------
// Styles CSS — un bloc, pas de styles inline fragmente
// ---------------------------------------------------------------------------

const CSS = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% center; }
    50%       { background-position: 200% center; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-12px); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0.08; }
    50%       { opacity: 0.5; }
  }
  @keyframes orb-drift {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(28px, -18px) scale(1.08); }
    66%       { transform: translate(-18px, 14px) scale(0.94); }
  }

  .sky-gradient-text {
    background: linear-gradient(135deg, #60A5FA 0%, #2563EB 50%, #60A5FA 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient-shift 4s ease-in-out infinite;
  }

  .sky-glow {
    text-shadow:
      0 0 20px rgba(37, 99, 235, 0.6),
      0 0 60px rgba(37, 99, 235, 0.3),
      0 0 100px rgba(37, 99, 235, 0.15);
    transition: text-shadow 2s ease-in-out;
  }
  .sky-glow-pulse {
    text-shadow:
      0 0 30px rgba(96, 165, 250, 0.8),
      0 0 80px rgba(96, 165, 250, 0.4),
      0 0 120px rgba(96, 165, 250, 0.2);
  }

  .sky-btn-primary {
    background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
    box-shadow: 0 4px 24px rgba(37, 99, 235, 0.4);
    color: #fff;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
  }
  .sky-btn-primary:hover {
    box-shadow: 0 6px 30px rgba(37, 99, 235, 0.55);
  }

  .sky-card {
    background: linear-gradient(145deg, rgba(30, 58, 95, 0.6) 0%, rgba(13, 27, 46, 0.9) 100%);
    border: 1px solid rgba(96, 165, 250, 0.2);
    border-radius: 16px;
  }
  .sky-card-soft {
    background: linear-gradient(145deg, rgba(30, 58, 95, 0.4) 0%, rgba(13, 27, 46, 0.7) 100%);
    border: 1px solid rgba(96, 165, 250, 0.15);
    border-radius: 16px;
  }

  .fade-up-1 { animation: fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both; }
  .fade-up-2 { animation: fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both; }
  .fade-up-3 { animation: fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both; }
  .fade-up-4 { animation: fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both; }
  .fade-up-5 { animation: fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both; }
  .fade-up-6 { animation: fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.6s both; }

  .scroll-reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
  .scroll-reveal.visible { opacity: 1; transform: translateY(0); }

  .sky-star {
    position: absolute;
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: #fff;
  }
`

// ---------------------------------------------------------------------------
// Hook scroll-reveal
// ---------------------------------------------------------------------------

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".scroll-reveal")
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible") }),
=======
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
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
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
<<<<<<< HEAD
    <div style={{ background: "#060D1A", minHeight: "100vh", color: "#F0F6FF" }}>
      <style>{CSS}</style>
      <BackgroundOrbs />
      <NavBar />

      {/* ── HERO ── */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto", padding: "64px 24px 80px", textAlign: "center" }}>
        <div className="fade-up-1">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 100, border: "1px solid rgba(96,165,250,0.2)", background: "rgba(96,165,250,0.08)", padding: "6px 16px", marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", display: "inline-block", animation: "twinkle 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, color: "#93C5FD", fontWeight: 500 }}>
              {isBeta ? "Beta ouverte — 100% gratuit" : "Disponible maintenant"}
=======
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
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
            </span>
          </div>
        </div>

<<<<<<< HEAD
        <h1 className="fade-up-2" style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 24px" }}>
          <span style={{ color: "#F0F6FF" }}>{t('landing.hero.title1')} {t('landing.hero.title2')}</span><br />
          <span className="sky-gradient-text">{t('landing.hero.title3')}</span>
        </h1>

        <p className="fade-up-3" style={{ fontSize: 17, color: "#94A3B8", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.65 }}>
          {t('landing.hero.subtitle')}
        </p>

        <div className="fade-up-4" style={{ animation: "float 4s ease-in-out infinite", marginBottom: 40 }}>
          <span className={`sky-glow ${glowPulse ? "sky-glow-pulse" : ""}`} style={{ fontSize: "clamp(72px, 12vw, 120px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#60A5FA", fontFamily: "inherit" }}>
            18/20
          </span>
          <p style={{ color: "#334155", fontSize: 13, marginTop: 6 }}>{t('landing.hero.avgGrade')}</p>
        </div>

        <div className="fade-up-5">
          <Link href="/signup" className="sky-btn-primary" style={{ fontSize: 15, padding: "14px 32px" }}>
            {isBeta ? t('landing.hero.ctaBeta') : t('landing.hero.cta')}
=======
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
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
          </Link>
          <p className="text-[12px] text-slate-600">Sans carte bancaire</p>
        </div>

<<<<<<< HEAD
        <div className="fade-up-6" style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 56 }}>
          {[
            { value: '15s', key: 'landing.stats.fiches' },
            { value: '4x', key: 'landing.stats.faster' },
            { value: '100%', key: 'landing.stats.adapted' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#F0F6FF", margin: "0 0 4px" }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "#475569" }}>{t(s.key)}</p>
=======
        {/* Stats */}
        <div className="animate-fade-up delay-5 grid grid-cols-3 gap-3 sm:gap-8 mt-12 max-w-sm sm:max-w-lg mx-auto">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-display text-[22px] sm:text-[28px] font-bold text-[#F0F6FF]">{s.value}</p>
              <p className="text-[11px] sm:text-[12px] text-slate-500 mt-1 leading-tight">{s.label}</p>
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
            </div>
          ))}
        </div>
      </section>

<<<<<<< HEAD
      {/* ── PROBLEME ── */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 760, margin: "0 auto", padding: "40px 24px 60px", textAlign: "center" }}>
        <div className="scroll-reveal">
          <p style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>{t('landing.problem.label')}</p>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 700, lineHeight: 1.25, margin: "0 0 20px" }}>
            <span style={{ color: "#F0F6FF" }}>{t('landing.problem.title1')}</span><br />
            <span style={{ color: "#334155" }}>{t('landing.problem.title2')}</span>
          </h2>
          <p style={{ fontSize: 15, color: "#64748B", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
            {t('landing.problem.desc')}
          </p>
=======
      {/* ── PAIN ── */}
      <section id="pain" data-animate className={isVisible('pain') ? 'section-visible' : ''}>
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="animate-on-scroll">
            <p className="text-[12px] text-blue-400 font-semibold tracking-widest uppercase mb-4">Le problème</p>
            <h2
              className="font-display text-[#F0F6FF]"
              style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 700, lineHeight: 1.25 }}
            >
              Tu passes 2h à recopier tes cours
              <br />
              <span className="text-slate-500">pour 15 minutes de vraie révision.</span>
            </h2>
            <p className="text-[15px] sm:text-[16px] text-slate-400 mt-6 leading-relaxed">
              Réécrire, ce n'est pas réviser. Ton cerveau retient quand il est actif — pas quand il recopie.
              Skynote fait le travail de mise en forme pour que toi, tu te concentres sur ce qui compte.
            </p>
          </div>
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
        </div>
      </section>

      {/* ── FEATURES ── */}
<<<<<<< HEAD
      <section style={{ position: "relative", zIndex: 10, maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {[
            { icon: "\uD83D\uDCF8", titleKey: 'landing.features.photo', descKey: 'landing.features.photoDesc' },
            { icon: "\u26A1", titleKey: 'landing.features.fiches', descKey: 'landing.features.fichesDesc' },
            { icon: "\uD83E\uDDE0", titleKey: 'landing.features.qcm', descKey: 'landing.features.qcmDesc' },
            { icon: "\uD83D\uDCAC", titleKey: 'landing.features.chatbot', descKey: 'landing.features.chatbotDesc' },
          ].map((f, i) => (
            <div key={i} className="sky-card scroll-reveal" style={{ padding: 24, transitionDelay: `${i * 0.08}s` }}>
              <span style={{ fontSize: 28, display: "block", marginBottom: 12 }}>{f.icon}</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F0F6FF", margin: "0 0 8px" }}>{t(f.titleKey)}</h3>
              <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.55, margin: 0 }}>{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TEMOIGNAGES ── */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" }}>
        <div className="scroll-reveal" style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>{t('landing.testimonials.label')}</p>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 700, color: "#F0F6FF", margin: 0 }}>{t('landing.testimonials.title')}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="sky-card-soft scroll-reveal" style={{ padding: 24, transitionDelay: `${i * 0.08}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 500 }}>{t.name}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#60A5FA" }}>{t.grade}</span>
              </div>
              <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>"{t.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px", textAlign: "center" }}>
        <div className="scroll-reveal">
          {isBeta ? (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>{t('landing.beta.label')}</p>
              <h2 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 800, color: "#F0F6FF", margin: "0 0 12px" }}>{t('landing.beta.title')}</h2>
              <p style={{ fontSize: 15, color: "#64748B", maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.6 }}>
                {t('landing.beta.desc')}
              </p>
              <Link href="/signup" className="sky-btn-primary" style={{ fontSize: 15, padding: "14px 40px" }}>
                {t('landing.beta.cta')}
              </Link>
            </>
          ) : (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>{t('landing.pricing.label')}</p>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: "#F0F6FF", margin: "0 0 8px" }}>{t('landing.pricing.title')}</h2>
              <p style={{ fontSize: 14, color: "#64748B", maxWidth: 380, margin: "0 auto 40px" }}>{t('landing.pricing.subtitle')}</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, textAlign: "left" }}>
                {/* Gratuit */}
                <div className="sky-card" style={{ padding: 24 }}>
                  <p style={{ fontSize: 13, color: "#64748B", fontWeight: 500, margin: "0 0 4px" }}>{t('landing.pricing.free')}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: "#F0F6FF", margin: "0 0 20px" }}>0\u20AC</p>
                  <div style={{ fontSize: 13, color: "#94A3B8", display: "flex", flexDirection: "column", gap: 8 }}>
                    <span>{t('landing.pricing.free1')}</span>
                    <span>{t('landing.pricing.free2')}</span>
                    <span>{t('landing.pricing.free3')}</span>
                  </div>
                  <PricingFree />
                </div>

                {/* Plus */}
                <div style={{ background: "linear-gradient(145deg, rgba(30,58,95,0.6), rgba(13,27,46,0.9))", border: "2px solid rgba(96,165,250,0.5)", borderRadius: 16, padding: 24, position: "relative" }}>
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #2563EB, #1D4ED8)", padding: "4px 14px", borderRadius: 100, fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{t('landing.pricing.popular')}</div>
                  <p style={{ fontSize: 13, color: "#60A5FA", fontWeight: 500, margin: "0 0 4px" }}>Plus</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: "#F0F6FF", margin: "0 0 2px" }}>4,99\u20AC<span style={{ fontSize: 14, fontWeight: 400, color: "#64748B" }}>{t('landing.pricing.perMonth')}</span></p>
                  <p style={{ fontSize: 12, color: "#475569", margin: "0 0 20px" }}>ou 3,99\u20AC{t('landing.pricing.perMonth')} {t('landing.pricing.yearly')}</p>
                  <div style={{ fontSize: 13, color: "#94A3B8", display: "flex", flexDirection: "column", gap: 8 }}>
                    <span>{t('landing.pricing.plus1')}</span>
                    <span>{t('landing.pricing.plus2')}</span>
                    <span>{t('landing.pricing.plus3')}</span>
                    <span>{t('landing.pricing.plus4')}</span>
                  </div>
                  <PricingPlus />
                </div>

                {/* Famille */}
                <div style={{ background: "linear-gradient(145deg, rgba(30,58,95,0.5), rgba(13,27,46,0.85))", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 16, padding: 24 }}>
                  <p style={{ fontSize: 13, color: "#C4B5FD", fontWeight: 500, margin: "0 0 4px" }}>{t('landing.pricing.famille')}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: "#F0F6FF", margin: "0 0 2px" }}>11,99\u20AC<span style={{ fontSize: 14, fontWeight: 400, color: "#64748B" }}>{t('landing.pricing.perMonth')}</span></p>
                  <p style={{ fontSize: 12, color: "#475569", margin: "0 0 20px" }}>ou 10,99\u20AC{t('landing.pricing.perMonth')} {t('landing.pricing.yearly')}</p>
                  <div style={{ fontSize: 13, color: "#94A3B8", display: "flex", flexDirection: "column", gap: 8 }}>
                    <span>{t('landing.pricing.fam1')}</span>
                    <span>{t('landing.pricing.fam2')}</span>
                    <span>{t('landing.pricing.fam3')}</span>
                    <span>{t('landing.pricing.fam4')}</span>
                  </div>
                  <PricingFamily />
                </div>
=======
      <section id="features" data-animate className={isVisible('features') ? 'section-visible' : ''}>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="feature-card animate-on-scroll rounded-2xl p-4 sm:p-6"
                  style={{
                    background: 'linear-gradient(145deg, rgba(30,58,95,0.6) 0%, rgba(13,27,46,0.9) 100%)',
                    border: '1px solid rgba(96,165,250,0.18)',
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-display text-[15px] sm:text-[16px] font-bold text-[#F0F6FF] mb-2">{f.title}</h3>
                  <p className="text-[13px] sm:text-[14px] text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="proof" data-animate className={isVisible('proof') ? 'section-visible' : ''}>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-10 sm:mb-12 animate-on-scroll">
            <p className="text-[12px] text-blue-400 font-semibold tracking-widest uppercase mb-4">Ils révisent avec Skynote</p>
            <h2
              className="font-display text-[#F0F6FF]"
              style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 700 }}
            >
              Les notes parlent d'elles-mêmes.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="animate-on-scroll rounded-2xl p-5 sm:p-6"
                style={{
                  background: 'linear-gradient(145deg, rgba(30,58,95,0.4) 0%, rgba(13,27,46,0.7) 100%)',
                  border: '1px solid rgba(96,165,250,0.12)',
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar initiale */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                      style={{ background: t.color }}
                    >
                      {t.initials}
                    </div>
                    <span className="text-[13px] text-slate-300 font-medium">{t.name}</span>
                  </div>
                  <span className="font-display text-[18px] font-bold text-blue-400">{t.grade}</span>
                </div>
                <p className="text-[13px] sm:text-[14px] text-slate-300 leading-relaxed">
                  "{t.text}"
                </p>
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
              </div>
            </>
          )}
        </div>
      </section>

<<<<<<< HEAD
      {/* ── FOOTER ── */}
      <footer style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto", padding: "0 24px 40px", textAlign: "center" }}>
        <p style={{ color: "#1E293B", fontSize: 13, marginBottom: 20 }}>{t('landing.footer')}</p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 16, alignItems: "center", fontSize: 13, color: "#334155" }}>
          <Link href="/privacy"         style={{ color: "#334155", textDecoration: "none" }}>{t('landing.footer.privacy')}</Link>
=======
      {/* ── PRICING ── */}
      <section id="pricing" data-animate className={isVisible('pricing') ? 'section-visible' : ''}>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="animate-on-scroll">
            {isBeta ? (
              <>
                <p className="text-[12px] text-blue-400 font-semibold tracking-widest uppercase mb-4">Pendant la bêta</p>
                <h2
                  className="font-display text-[#F0F6FF] mb-4"
                  style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 800 }}
                >
                  Gratuit.
                </h2>
                <p className="text-[15px] sm:text-[16px] text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                  Toutes les fonctionnalités. Aucune carte bancaire.
                  Tu révises, tu progresses, c'est tout.
                </p>
                <Link
                  href="/signup"
                  className="cta-btn inline-flex items-center gap-2 text-[15px] font-semibold px-8 sm:px-10 py-4 rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}
                >
                  Créer mon compte gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <p className="text-[12px] text-blue-400 font-semibold tracking-widest uppercase mb-4">Nos forfaits</p>
                <h2
                  className="font-display text-[#F0F6FF] mb-3"
                  style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800 }}
                >
                  Choisis ton plan
                </h2>
                <p className="text-[14px] sm:text-[15px] text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
                  Commence gratuitement, évolue quand tu veux.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 text-left">
                  {/* Gratuit */}
                  <div
                    className="rounded-2xl p-5 sm:p-6"
                    style={{
                      background: 'linear-gradient(145deg, rgba(30,58,95,0.5) 0%, rgba(13,27,46,0.85) 100%)',
                      border: '1px solid rgba(96,165,250,0.15)',
                    }}
                  >
                    <p className="text-[13px] text-slate-400 font-medium mb-1">Gratuit</p>
                    <p className="font-display text-[30px] font-extrabold text-[#F0F6FF] mb-4">0€</p>
                    <div className="text-[13px] text-slate-400 space-y-2">
                      <p>1 cours par semaine</p>
                      <p>Fiches IA + QCM</p>
                      <p>Sky Coins & objectifs</p>
                    </div>
                    <Link
                      href="/signup"
                      className="block mt-5 text-center text-[13px] font-semibold py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 transition-colors"
                    >
                      Commencer
                    </Link>
                  </div>

                  {/* Plus — card mise en avant */}
                  <div
                    className="rounded-2xl p-5 sm:p-6 relative"
                    style={{
                      background: 'linear-gradient(145deg, rgba(37,99,235,0.15) 0%, rgba(13,27,46,0.9) 100%)',
                      border: '2px solid rgba(96,165,250,0.45)',
                      boxShadow: '0 0 40px rgba(37,99,235,0.15)',
                    }}
                  >
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
                    >
                      Populaire
                    </div>
                    <p className="text-[13px] text-blue-400 font-medium mb-1">Plus</p>
                    <p className="font-display text-[30px] font-extrabold text-[#F0F6FF] mb-0">
                      4,99€<span className="text-[13px] font-normal text-slate-400">/mois</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mb-4">ou 3,99€/mois en annuel</p>
                    <div className="text-[13px] text-slate-300 space-y-2">
                      <p>Cours illimités</p>
                      <p>Dictée vocale</p>
                      <p>Chatbot IA par cours</p>
                      <p>Tout le plan Gratuit</p>
                    </div>
                    <Link
                      href="/signup"
                      className="cta-btn block mt-5 text-center text-[13px] font-semibold py-2.5 rounded-xl text-white"
                      style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
                    >
                      S'abonner
                    </Link>
                  </div>

                  {/* Famille */}
                  <div
                    className="rounded-2xl p-5 sm:p-6"
                    style={{
                      background: 'linear-gradient(145deg, rgba(30,58,95,0.5) 0%, rgba(13,27,46,0.85) 100%)',
                      border: '1px solid rgba(167,139,250,0.2)',
                    }}
                  >
                    <p className="text-[13px] text-purple-400 font-medium mb-1">Famille</p>
                    <p className="font-display text-[30px] font-extrabold text-[#F0F6FF] mb-0">
                      11,99€<span className="text-[13px] font-normal text-slate-400">/mois</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mb-4">ou 10,99€/mois en annuel</p>
                    <div className="text-[13px] text-slate-400 space-y-2">
                      <p>Tout le plan Plus</p>
                      <p>Jusqu'à 6 enfants</p>
                      <p>Dashboard parent</p>
                      <p>Support prioritaire</p>
                    </div>
                    <Link
                      href="/signup"
                      className="block mt-5 text-center text-[13px] font-semibold py-2.5 rounded-xl border border-purple-500/30 text-purple-300 hover:border-purple-400 transition-colors"
                    >
                      S'abonner
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 text-center border-t border-white/5">
        <div className="flex items-center justify-center gap-4 text-[13px] text-slate-600 flex-wrap">
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">Confidentialité</Link>
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
          <span>·</span>
          <Link href="/terms"           style={{ color: "#334155", textDecoration: "none" }}>{t('landing.footer.terms')}</Link>
          <span>·</span>
<<<<<<< HEAD
          <Link href="/mentions-legales" style={{ color: "#334155", textDecoration: "none" }}>{t('landing.footer.legal')}</Link>
=======
          <Link href="/mentions-legales" className="hover:text-slate-400 transition-colors">Mentions légales</Link>
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
          <span>·</span>
          <span>© 2026 Skynote</span>
        </div>
      </footer>
    </div>
  )
}

