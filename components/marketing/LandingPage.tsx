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
  { icon: "", title: "Photo, texte, vocal, PDF", desc: "Importe ton cours comme tu veux. L'IA s'adapte." },
  { icon: "", title: "Fiches en 15 secondes",   desc: "Pas en 15 minutes. En 15 secondes. Chrono en main." },
  { icon: "", title: "QCM intelligents",         desc: "Des questions qui testent ta comprehension, pas ta memoire." },
  { icon: "", title: "Chatbot par cours",        desc: "Pose tes questions. L'IA connait ton cours par coeur." },
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

  /* ── Mobile ── */
  @media (max-width: 640px) {
    .landing-nav { padding: 14px 16px !important; }
    .landing-nav-login { display: none !important; }
    .landing-nav-cta { font-size: 12px !important; padding: 9px 14px !important; }
    .landing-stats { gap: 20px !important; flex-wrap: wrap !important; justify-content: center !important; }
    .landing-stats > div { min-width: 72px; }
    .landing-hero-section { padding: 44px 16px 60px !important; }
    .landing-section { padding-left: 16px !important; padding-right: 16px !important; }
    .landing-footer { padding-left: 16px !important; padding-right: 16px !important; }
    .product-mock-wrap { padding-left: 12px !important; padding-right: 12px !important; padding-bottom: 48px !important; }
    .mock-nav-links { display: none !important; }
    .mock-courses { grid-template-columns: repeat(2, 1fr) !important; }
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
      { threshold: 0.15 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function ProductMock() {
  const courses = [
    { sub: "Mathématiques", title: "Thales", pct: 45, color: "#2563EB" },
    { sub: "SVT", title: "Eval pt.1", pct: 100, color: "#10B981" },
    { sub: "Français", title: "Les Prépositions", pct: 100, color: "#10B981" },
  ]
  return (
    <div className="product-mock-wrap scroll-reveal" style={{ position: "relative", zIndex: 10, maxWidth: 860, margin: "0 auto", padding: "0 24px 72px" }}>
      {/* Halo glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 40% at 50% 60%, rgba(37,99,235,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
      {/* Browser frame */}
      <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(96,165,250,0.18)", boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)", position: "relative" }}>
        {/* Browser chrome */}
        <div style={{ background: "#111827", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["#EF4444","#F59E0B","#10B981"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
          </div>
          <div style={{ flex: 1, background: "#1F2937", borderRadius: 6, padding: "3px 12px", textAlign: "center" }}>
            <span style={{ fontSize: 10, color: "#6B7280" }}>skynote.fr/dashboard</span>
          </div>
        </div>
        {/* App navbar */}
        <div style={{ background: "#0F172A", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#60A5FA)" }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#F0F6FF" }}>Skynote</span>
          </div>
          <div className="mock-nav-links" style={{ display: "flex", gap: 2 }}>
            {[["Accueil", true],["Classement", false],["Boutique", false]].map(([l, active]) => (
              <div key={String(l)} style={{ padding: "3px 9px", borderRadius: 7, background: active ? "rgba(37,99,235,0.2)" : "transparent", color: active ? "#60A5FA" : "#64748B", fontSize: 10, fontWeight: 500 }}>{String(l)}</div>
            ))}
          </div>
          <div style={{ background: "rgba(37,99,235,0.15)", borderRadius: 20, padding: "3px 9px", display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563EB" }} />
            <span style={{ fontSize: 10, color: "#93C5FD", fontWeight: 600 }}>1 030</span>
          </div>
        </div>
        {/* Dashboard */}
        <div style={{ padding: "16px 20px 20px", background: "#080F1A" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#F0F6FF" }}>Bonjour, Alex</div>
              <div style={{ fontSize: 10, color: "#475569" }}>4 jours de suite !</div>
            </div>
            <div style={{ background: "#2563EB", borderRadius: 7, padding: "5px 12px", fontSize: 10, fontWeight: 600, color: "#fff" }}>+ Nouveau cours</div>
          </div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7, marginBottom: 12 }}>
            {[{n:"8",l:"Cours"},{n:"29",l:"QCM faits"},{n:"4",l:"Jours"},{n:"1 030",l:"Sky Coins"}].map(s => (
              <div key={s.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F0F6FF" }}>{s.n}</div>
                <div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>{s.l}</div>
              </div>
            ))}
          </div>
          {/* Eval banner */}
          <div style={{ background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.25)", borderRadius: 9, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 12 }}>📅</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#FB923C" }}>Préposition — J-2</div>
                <div style={{ fontSize: 9, color: "#78350F" }}>21 avr. · Révision finale</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: "#60A5FA" }}>→</div>
          </div>
          {/* Course cards */}
          <div style={{ fontSize: 10, fontWeight: 600, color: "#64748B", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>Cours récents</div>
          <div className="mock-courses" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
            {courses.map(c => (
              <div key={c.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: "10px 11px" }}>
                <div style={{ fontSize: 8, color: "#60A5FA", fontWeight: 600, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.sub}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#F0F6FF", marginBottom: 7 }}>{c.title}</div>
                <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 3 }}>
                  <div style={{ background: c.color, width: `${c.pct}%`, height: "100%", borderRadius: 3 }} />
                </div>
                {c.pct === 100 && <div style={{ fontSize: 8, color: "#10B981", marginTop: 3 }}>100% maîtrise</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function NavBar() {
  const { t } = useI18n()
  return (
    <nav className="landing-nav" style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
        <Image src="/skycoin.png" alt="" width={28} height={28} />
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: "#F0F6FF" }}>Skynote</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LanguagePicker variant="landing" />
        <Link href="/login" className="landing-nav-login" style={{ fontSize: 13, color: "#64748B", textDecoration: "none", padding: "8px 12px" }}>Connexion</Link>
        <Link href="/signup" className="sky-btn-primary landing-nav-cta" style={{ fontSize: 13, padding: "10px 20px" }}>{t('landing.hero.ctaBeta')}</Link>
      </div>
    </nav>
  )
}

function BackgroundOrbs() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
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
    <div style={{ background: "#060D1A", minHeight: "100vh", color: "#F0F6FF", overflowX: "hidden" }}>
      <style>{CSS}</style>
      <BackgroundOrbs />
      <NavBar />

      {/* ── HERO ── */}
      <section className="landing-hero-section" style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto", padding: "64px 24px 80px", textAlign: "center" }}>
        <div className="fade-up-1">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 100, border: "1px solid rgba(96,165,250,0.2)", background: "rgba(96,165,250,0.08)", padding: "6px 16px", marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", display: "inline-block", animation: "twinkle 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, color: "#93C5FD", fontWeight: 500 }}>
              {isBeta ? "Beta ouverte — 100% gratuit" : "Disponible maintenant"}
            </span>
          </div>
        </div>

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
          </Link>
        </div>

        <div className="fade-up-6 landing-stats" style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 56 }}>
          {[
            { value: '15s', key: 'landing.stats.fiches' },
            { value: '4x', key: 'landing.stats.faster' },
            { value: '100%', key: 'landing.stats.adapted' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#F0F6FF", margin: "0 0 4px" }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "#475569" }}>{t(s.key)}</p>
            </div>
          ))}
        </div>
      </section>

      <ProductMock />

      {/* ── PROBLEME ── */}
      <section className="landing-section" style={{ position: "relative", zIndex: 10, maxWidth: 760, margin: "0 auto", padding: "40px 24px 60px", textAlign: "center" }}>
        <div className="scroll-reveal">
          <p style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>{t('landing.problem.label')}</p>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 700, lineHeight: 1.25, margin: "0 0 20px" }}>
            <span style={{ color: "#F0F6FF" }}>{t('landing.problem.title1')}</span><br />
            <span style={{ color: "#334155" }}>{t('landing.problem.title2')}</span>
          </h2>
          <p style={{ fontSize: 15, color: "#64748B", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
            {t('landing.problem.desc')}
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="landing-section" style={{ position: "relative", zIndex: 10, maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" }}>
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
      <section className="landing-section" style={{ position: "relative", zIndex: 10, maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" }}>
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
      <section className="landing-section" style={{ position: "relative", zIndex: 10, maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px", textAlign: "center" }}>
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
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer" style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto", padding: "0 24px 40px", textAlign: "center" }}>
        <p style={{ color: "#1E293B", fontSize: 13, marginBottom: 20 }}>{t('landing.footer')}</p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 16, alignItems: "center", fontSize: 13, color: "#334155" }}>
          <Link href="/privacy"         style={{ color: "#334155", textDecoration: "none" }}>{t('landing.footer.privacy')}</Link>
          <span>·</span>
          <Link href="/terms"           style={{ color: "#334155", textDecoration: "none" }}>{t('landing.footer.terms')}</Link>
          <span>·</span>
          <Link href="/mentions-legales" style={{ color: "#334155", textDecoration: "none" }}>{t('landing.footer.legal')}</Link>
          <span>·</span>
          <span>© 2026 Skynote</span>
        </div>
      </footer>
    </div>
  )
}
