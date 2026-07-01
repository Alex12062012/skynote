"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Baloo_2, Nunito } from "next/font/google"
import {
  Camera, Zap, BrainCircuit, MessageCircle, GraduationCap,
  ArrowRight, Check, Star, Sparkles,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

// Police du skill ui-ux-pro-max : Baloo 2 (display rond/jeune) + Nunito (body lisible)
const baloo  = Baloo_2({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-baloo" })
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-nunito" })

// ---------------------------------------------------------------------------

type Testimonial = { text: string; name: string; grade: string }

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { text: "J'avais 20 pages à réviser la veille. Fiches générées en 2 minutes, j'ai tout relu tranquille.", name: "Inès, 3ème",  grade: "17/20" },
  { text: "Les questions du QCM sont vraiment bien faites. Pas juste réciter, ça te force à réfléchir.",       name: "Yanis, 2nde", grade: "15/20" },
  { text: "Je prenais pas de notes avant parce que c'est long. Maintenant je prends une photo, c'est réglé.",  name: "Léa, 4ème",   grade: "16/20" },
]

// Palette ui-ux-pro-max
const C = {
  primary: "#4F46E5", secondary: "#818CF8", accent: "#16A34A",
  bg: "#EEF2FF", fg: "#312E81", border: "#C7D2FE",
}

const CSS = `
  .pmx { --font-baloo: ${baloo.style.fontFamily}; }
  .reveal2 { opacity: 0; transform: translateY(24px); transition: opacity .55s cubic-bezier(.22,1,.36,1), transform .55s cubic-bezier(.22,1,.36,1); }
  .reveal2.in { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) {
    .reveal2 { opacity: 1 !important; transform: none !important; transition: none !important; }
    .pmx * { animation: none !important; }
  }
`

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal2")
    const io = new IntersectionObserver(
      e => e.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target) } }),
      { threshold: 0.15 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function CTA({ children, href = "/signup", variant = "primary", className = "" }: { children: React.ReactNode; href?: string; variant?: "primary" | "ghost"; className?: string }) {
  const base = "group inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-[16px] font-extrabold transition-all duration-200 active:translate-y-0.5"
  const styles = variant === "primary"
    ? "text-white shadow-[0_10px_0_-2px_#3730A3] hover:shadow-[0_6px_0_-2px_#3730A3] hover:translate-y-0.5"
    : "border-2 bg-white hover:bg-[#F5F7FF]"
  return (
    <Link href={href} className={`${base} ${styles} ${className}`} style={variant === "primary" ? { background: C.primary } : { color: C.primary, borderColor: C.border }}>
      {children}
      <ArrowRight size={18} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-1" />
    </Link>
  )
}

function Stars({ size = 16 }: { size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map(i => <Star key={i} size={size} className="fill-amber-400 text-amber-400" />)}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mock produit — version claire (light dashboard)
// ---------------------------------------------------------------------------

function ProductMock() {
  const courses = [
    { sub: "Maths",    title: "Théorème de Thalès", pct: 45,  c: C.primary },
    { sub: "SVT",      title: "Évaluation pt.1",     pct: 100, c: C.accent },
    { sub: "Français", title: "Les Prépositions",    pct: 100, c: C.accent },
  ]
  return (
    <div className="rounded-[26px] border-2 bg-white p-3 shadow-[0_24px_60px_-20px_rgba(79,70,229,0.45)]" style={{ borderColor: C.border }}>
      <div className="overflow-hidden rounded-[18px]" style={{ background: "#F8FAFF" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <Image src="/skycoin.png" alt="" width={20} height={20} />
            <span className="text-[14px] font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: C.fg }}>Skynote</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "#EEF2FF" }}>
            <Image src="/skycoin.png" alt="" width={12} height={12} />
            <span className="text-[11px] font-bold" style={{ color: C.primary }}>1 030</span>
          </div>
        </div>
        {/* Body */}
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[15px] font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: C.fg }}>Bonjour, Alex</div>
              <div className="text-[11px] font-semibold" style={{ color: C.secondary }}>4 jours de suite</div>
            </div>
            <span className="rounded-xl px-3 py-1.5 text-[11px] font-bold text-white" style={{ background: C.primary }}>+ Nouveau cours</span>
          </div>
          <div className="mb-3 grid grid-cols-4 gap-2">
            {[{ n: "8", l: "Cours" }, { n: "29", l: "QCM" }, { n: "4", l: "Jours" }, { n: "1 030", l: "Coins" }].map(s => (
              <div key={s.l} className="rounded-xl border bg-white px-2 py-2 text-center" style={{ borderColor: C.border }}>
                <div className="text-[15px] font-extrabold" style={{ color: C.fg }}>{s.n}</div>
                <div className="text-[9px] font-semibold" style={{ color: C.secondary }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {courses.map(c => (
              <div key={c.title} className="rounded-xl border bg-white p-2.5" style={{ borderColor: C.border }}>
                <div className="mb-1 text-[8px] font-extrabold uppercase tracking-wide" style={{ color: c.c }}>{c.sub}</div>
                <div className="mb-2 text-[11px] font-bold leading-tight" style={{ color: C.fg }}>{c.title}</div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "#E5E9FB" }}>
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.c }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function NavBar({ t }: { t: (k: string) => string }) {
  return (
    <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5">
        <Image src="/skycoin.png" alt="" width={30} height={30} />
        <span className="text-xl font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: C.fg }}>Skynote</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/login" className="hidden rounded-xl px-4 py-2.5 text-[14px] font-bold sm:block" style={{ color: C.primary }}>Connexion</Link>
        <Link href="/signup" className="rounded-xl px-5 py-2.5 text-[14px] font-extrabold text-white transition-transform active:translate-y-0.5" style={{ background: C.primary }}>
          {t("landing.hero.ctaBeta")}
        </Link>
      </div>
    </nav>
  )
}

function Hero({ t, isBeta }: { t: (k: string) => string; isBeta: boolean }) {
  return (
    <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:pt-12">
      {/* Texte */}
      <div className="reveal2 in text-center lg:text-left">
        <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-extrabold text-white" style={{ background: C.accent }}>
          <Sparkles size={15} /> {isBeta ? "Bêta ouverte · 100% gratuit" : "Disponible maintenant"}
        </span>
        <h1 className="mt-6 text-[clamp(40px,6.5vw,68px)] font-extrabold leading-[0.98]" style={{ fontFamily: "var(--font-baloo)", color: C.fg }}>
          {t("landing.hero.title1")} {t("landing.hero.title2")}{" "}
          <span style={{ color: C.primary }}>{t("landing.hero.title3")}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[18px] font-semibold leading-relaxed lg:mx-0" style={{ color: "#6366A8" }}>
          {t("landing.hero.subtitle2")} {t("landing.hero.subtitle")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:items-center lg:justify-start lg:gap-5">
          <CTA>{t("landing.hero.ctaBeta")}</CTA>
          <div className="flex items-center gap-2.5">
            <Stars />
            <span className="text-[13px] font-bold" style={{ color: C.fg }}>Adoré par les élèves en bêta</span>
          </div>
        </div>
      </div>
      {/* Mock */}
      <div className="reveal2 in relative">
        <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px]" style={{ background: "radial-gradient(circle at 70% 30%, rgba(129,140,248,0.35), transparent 65%)" }} />
        <ProductMock />
      </div>
    </section>
  )
}

function Stats({ t }: { t: (k: string) => string }) {
  const blocks = [
    { v: "15s",  k: "landing.stats.fiches", bg: C.primary,   fg: "#fff" },
    { v: "4x",   k: "landing.stats.faster", bg: "#fff",      fg: C.fg },
    { v: "100%", k: "landing.stats.adapted", bg: C.accent,   fg: "#fff" },
  ]
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {blocks.map((b, i) => (
          <div key={i} className="reveal2 rounded-3xl border-2 p-7 text-center sm:text-left" style={{ background: b.bg, borderColor: b.bg === "#fff" ? C.border : b.bg }}>
            <div className="text-[44px] font-extrabold leading-none" style={{ fontFamily: "var(--font-baloo)", color: b.fg }}>{b.v}</div>
            <div className="mt-2 text-[14px] font-bold" style={{ color: b.bg === "#fff" ? "#6366A8" : "rgba(255,255,255,0.9)" }}>{t(b.k)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Problem({ t }: { t: (k: string) => string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 text-center sm:px-6">
      <div className="reveal2 rounded-[32px] border-2 bg-white p-8 sm:p-12" style={{ borderColor: C.border }}>
        <h2 className="text-[clamp(26px,4.2vw,40px)] font-extrabold leading-[1.1]" style={{ fontFamily: "var(--font-baloo)", color: C.fg }}>
          {t("landing.problem.title1")}{" "}
          <span style={{ color: C.secondary }}>{t("landing.problem.title2")}</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[16px] font-semibold leading-relaxed" style={{ color: "#6366A8" }}>{t("landing.problem.desc")}</p>
      </div>
    </section>
  )
}

function Features({ t }: { t: (k: string) => string }) {
  const items = [
    { icon: Zap,          tk: "landing.features.fiches",  dk: "landing.features.fichesDesc",  tint: C.primary,   big: true },
    { icon: Camera,       tk: "landing.features.photo",   dk: "landing.features.photoDesc",   tint: C.accent,    big: false },
    { icon: BrainCircuit, tk: "landing.features.qcm",     dk: "landing.features.qcmDesc",     tint: C.secondary, big: false },
    { icon: MessageCircle,tk: "landing.features.chatbot", dk: "landing.features.chatbotDesc", tint: C.primary,   big: false },
  ]
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <h2 className="reveal2 mb-10 text-center text-[clamp(28px,4.5vw,42px)] font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: C.fg }}>
        Tout pour réviser plus vite
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {items.map((f, i) => {
          const Icon = f.icon
          return (
            <div
              key={i}
              className={`reveal2 group rounded-[28px] border-2 p-7 transition-transform duration-200 hover:-translate-y-1 ${f.big ? "md:col-span-2" : ""}`}
              style={{ background: f.big ? C.primary : "#fff", borderColor: f.big ? C.primary : C.border }}
            >
              <div className="flex items-start gap-5">
                <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: f.big ? "rgba(255,255,255,0.18)" : `${f.tint}1A`, color: f.big ? "#fff" : f.tint }}>
                  <Icon size={26} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-[20px] font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: f.big ? "#fff" : C.fg }}>{t(f.tk)}</h3>
                  <p className="mt-2 text-[15px] font-semibold leading-relaxed" style={{ color: f.big ? "rgba(255,255,255,0.92)" : "#6366A8" }}>{t(f.dk)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Brevet({ t }: { t: (k: string) => string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="reveal2 grid items-center gap-8 rounded-[32px] border-2 p-8 sm:p-12 lg:grid-cols-2" style={{ background: C.fg, borderColor: C.fg }}>
        <div>
          <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold text-white" style={{ background: "rgba(255,255,255,0.15)" }}>
            <GraduationCap size={15} /> {t("landing.brevet.label")}
          </span>
          <h2 className="mt-5 text-[clamp(26px,3.8vw,38px)] font-extrabold leading-[1.1] text-white" style={{ fontFamily: "var(--font-baloo)" }}>{t("landing.brevet.title")}</h2>
          <p className="mt-4 max-w-md text-[16px] font-semibold leading-relaxed" style={{ color: "#C7D2FE" }}>{t("landing.brevet.desc")}</p>
          <CTA className="mt-7">{t("landing.hero.ctaBeta")}</CTA>
        </div>
        <div className="mx-auto w-full max-w-xs rounded-[26px] bg-white p-7 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `${C.accent}1A`, color: C.accent }}>
            <GraduationCap size={28} />
          </span>
          <div className="mt-4 text-[56px] font-extrabold leading-none" style={{ fontFamily: "var(--font-baloo)", color: C.fg }}>14,5<span className="text-[26px]" style={{ color: C.secondary }}>/20</span></div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-extrabold text-white" style={{ background: C.accent }}>
            <Check size={14} strokeWidth={3} /> Mention Bien
          </div>
          <p className="mt-4 text-[13px] font-bold" style={{ color: C.secondary }}>Simulation · 20 questions</p>
        </div>
      </div>
    </section>
  )
}

function Reviews({ t, items }: { t: (k: string) => string; items: Testimonial[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="reveal2 mb-10 text-center">
        <Stars size={22} />
        <h2 className="mt-3 text-[clamp(28px,4.5vw,42px)] font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: C.fg }}>{t("landing.testimonials.title")}</h2>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {items.map((it, i) => (
          <figure key={i} className="reveal2 flex flex-col rounded-[26px] border-2 bg-white p-6" style={{ borderColor: C.border }}>
            <Stars size={15} />
            <blockquote className="mt-4 flex-1 text-[15px] font-semibold leading-relaxed" style={{ color: C.fg }}>{it.text}</blockquote>
            <figcaption className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: C.border }}>
              <span className="text-[14px] font-extrabold" style={{ color: C.fg }}>{it.name}</span>
              <span className="rounded-lg px-2.5 py-1 text-[13px] font-extrabold text-white" style={{ background: C.accent }}>{it.grade}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function Pricing({ t, isBeta }: { t: (k: string) => string; isBeta: boolean }) {
  if (isBeta) {
    return (
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="reveal2 rounded-[36px] border-2 p-10 text-center sm:p-14" style={{ background: C.primary, borderColor: C.primary }}>
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
            <Sparkles size={30} />
          </span>
          <p className="mt-5 text-[13px] font-extrabold uppercase tracking-widest" style={{ color: "#C7D2FE" }}>{t("landing.beta.label")}</p>
          <h2 className="mt-2 text-[clamp(48px,8vw,72px)] font-extrabold leading-none text-white" style={{ fontFamily: "var(--font-baloo)" }}>{t("landing.beta.title")}</h2>
          <p className="mx-auto mt-4 max-w-sm text-[16px] font-semibold leading-relaxed" style={{ color: "#DBE0FF" }}>{t("landing.beta.desc")}</p>
          <CTA variant="ghost" className="mt-8 !text-white !border-white/40 !bg-white/10 hover:!bg-white/20">{t("landing.beta.cta")}</CTA>
        </div>
      </section>
    )
  }
  const plans = [
    { name: t("landing.pricing.free"), price: "0€", note: "", featured: false, feats: ["landing.pricing.free1", "landing.pricing.free2", "landing.pricing.free3", "landing.pricing.free4"], cta: t("landing.pricing.start") },
    { name: "Starter", price: "4,90€", per: t("landing.pricing.perMonth"), note: `ou 3,90€${t("landing.pricing.perMonth")} ${t("landing.pricing.yearly")}`, featured: true, feats: ["landing.pricing.starter1", "landing.pricing.starter2", "landing.pricing.starter3", "landing.pricing.starter4", "landing.pricing.starter5"], cta: t("landing.pricing.subscribe") },
    { name: t("landing.pricing.pro"), price: "6,90€", per: t("landing.pricing.perMonth"), note: `ou 5,90€${t("landing.pricing.perMonth")} ${t("landing.pricing.yearly")}`, featured: false, feats: ["landing.pricing.pro1", "landing.pricing.pro2", "landing.pricing.pro3", "landing.pricing.pro4", "landing.pricing.pro5"], cta: t("landing.pricing.subscribe") },
  ]
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <h2 className="reveal2 mb-10 text-center text-[clamp(28px,4.5vw,42px)] font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: C.fg }}>{t("landing.pricing.title")}</h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map(p => (
          <div key={p.name} className="reveal2 relative flex flex-col rounded-[28px] border-2 p-7" style={{ background: p.featured ? C.fg : "#fff", borderColor: p.featured ? C.fg : C.border }}>
            {p.featured && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-[12px] font-extrabold text-white" style={{ background: C.accent }}>{t("landing.pricing.popular")}</span>
            )}
            <p className="text-[14px] font-extrabold" style={{ color: p.featured ? "#C7D2FE" : C.secondary }}>{p.name}</p>
            <p className="mt-1 text-[38px] font-extrabold" style={{ fontFamily: "var(--font-baloo)", color: p.featured ? "#fff" : C.fg }}>
              {p.price}{p.per && <span className="text-[16px] font-bold" style={{ color: p.featured ? "#C7D2FE" : C.secondary }}>{p.per}</span>}
            </p>
            <p className="mb-5 mt-0.5 h-4 text-[12px] font-semibold" style={{ color: p.featured ? "#A5B4FC" : C.secondary }}>{p.note}</p>
            <ul className="flex flex-col gap-3">
              {p.feats.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] font-semibold" style={{ color: p.featured ? "#DBE0FF" : "#6366A8" }}>
                  <Check size={17} strokeWidth={2.6} className="mt-0.5 shrink-0" style={{ color: C.accent }} />
                  {t(f)}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-7 rounded-2xl py-3.5 text-center text-[14px] font-extrabold transition-transform active:translate-y-0.5"
              style={p.featured ? { background: "#fff", color: C.fg } : { background: C.primary, color: "#fff" }}>
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

function Footer({ t }: { t: (k: string) => string }) {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6">
      <p className="mb-5 text-[14px] font-bold" style={{ color: C.secondary }}>{t("landing.footer")}</p>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[14px] font-semibold" style={{ color: C.secondary }}>
        <Link href="/privacy" className="hover:underline">{t("landing.footer.privacy")}</Link>
        <span>·</span>
        <Link href="/terms" className="hover:underline">{t("landing.footer.terms")}</Link>
        <span>·</span>
        <Link href="/mentions-legales" className="hover:underline">{t("landing.footer.legal")}</Link>
        <span>·</span>
        <span>© 2026 Skynote</span>
      </div>
    </footer>
  )
}

// ---------------------------------------------------------------------------

export function LandingPageProMax({ isBeta = true, testimonials }: { isBeta?: boolean; testimonials?: Testimonial[] }) {
  const TESTIMONIALS = (testimonials && testimonials.length >= 3) ? testimonials : FALLBACK_TESTIMONIALS
  const { t } = useI18n()
  useScrollReveal()

  return (
    <div className={`pmx min-h-[100dvh] overflow-x-hidden ${baloo.variable} ${nunito.variable}`} style={{ background: C.bg, fontFamily: nunito.style.fontFamily }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <NavBar t={t} />
      <Hero t={t} isBeta={isBeta} />
      <Stats t={t} />
      <Problem t={t} />
      <Features t={t} />
      <Brevet t={t} />
      <Reviews t={t} items={TESTIMONIALS} />
      <Pricing t={t} isBeta={isBeta} />
      <Footer t={t} />
    </div>
  )
}
