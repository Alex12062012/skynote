"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  motion, useScroll, useSpring, useTransform, useMotionValue,
  useMotionTemplate, useInView, useReducedMotion, animate, type Variants,
} from "framer-motion"
import {
  Camera, Zap, BrainCircuit, MessageCircle, GraduationCap,
  CalendarClock, ArrowRight, Check, Sparkles,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

// ---------------------------------------------------------------------------
// Données
// ---------------------------------------------------------------------------

type Testimonial = { text: string; name: string; grade: string }

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { text: "J'avais 20 pages à réviser la veille. Fiches générées en 2 minutes, j'ai tout relu tranquille.", name: "Inès, 3ème",  grade: "17/20" },
  { text: "Les questions du QCM sont vraiment bien faites. Pas juste réciter, ça te force à réfléchir.",       name: "Yanis, 2nde", grade: "15/20" },
  { text: "Je prenais pas de notes avant parce que c'est long. Maintenant je prends une photo, c'est réglé.",  name: "Léa, 4ème",   grade: "16/20" },
]

const EASE = [0.23, 1, 0.32, 1] as const

const CSS = `
  .cta-sheen { position: absolute; inset: 0; pointer-events: none; transform: translateX(-130%);
    background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,.30) 50%, transparent 65%); }
  .group:hover .cta-sheen { transform: translateX(130%); transition: transform .75s cubic-bezier(.33,1,.68,1); }
  .nav-bar { transition: background-color .3s ease, border-color .3s ease, backdrop-filter .3s ease; }
  .nav-bar.scrolled {
    background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.02)), rgba(6,13,26,.55);
    backdrop-filter: blur(18px) saturate(180%); -webkit-backdrop-filter: blur(18px) saturate(180%);
    border-bottom-color: rgba(255,255,255,.12);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 8px 30px rgba(0,0,0,.35);
  }
  @media (prefers-reduced-motion: reduce) { .group:hover .cta-sheen { transform: none; transition: none; } }

  /* Liquid glass — approximation web (aucune API Apple officielle sur le web) */
  .lg {
    position: relative; isolation: isolate;
    border: 1px solid rgba(255,255,255,.18);
    background: linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.04));
    backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.30), inset 0 -1px 0 rgba(255,255,255,.06), 0 16px 50px rgba(0,0,0,.4);
  }
  .lg::before {
    content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
    background: radial-gradient(130% 70% at 28% 0%, rgba(255,255,255,.34), transparent 55%);
  }
  .lg-liquid::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
    background: linear-gradient(115deg, transparent 25%, rgba(255,255,255,.16) 45%, transparent 62%);
    background-size: 250% 250%;
  }
  @media (prefers-reduced-motion: no-preference) { .lg-liquid::after { animation: lg-drift 7s ease-in-out infinite; } }
  @keyframes lg-drift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  @media (prefers-reduced-transparency: reduce) {
    .lg { background: rgba(13,27,46,.94); backdrop-filter: none; -webkit-backdrop-filter: none; }
  }
`

// ---------------------------------------------------------------------------
// Briques d'animation (framer-motion)
// ---------------------------------------------------------------------------

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: i * 0.08 } }),
}

function Reveal({ children, className, i = 0 }: { children: React.ReactNode; className?: string; i?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      custom={i}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

// Carte 3D-tilt + spotlight qui suit le curseur + lift au survol
function Tilt({ children, className, strength = 9, lift = -6 }: { children: React.ReactNode; className?: string; strength?: number; lift?: number }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const mx = useMotionValue(50)
  const my = useMotionValue(50)
  const srx = useSpring(rx, { stiffness: 150, damping: 18, mass: 0.4 })
  const sry = useSpring(ry, { stiffness: 150, damping: 18, mass: 0.4 })
  const spotlight = useMotionTemplate`radial-gradient(240px circle at ${mx}% ${my}%, rgba(96,165,250,.18), transparent 70%)`

  function move(e: React.MouseEvent) {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * strength)
    rx.set(-(py - 0.5) * strength)
    mx.set(px * 100)
    my.set(py * 100)
  }
  function leave() { rx.set(0); ry.set(0) }

  return (
    <motion.div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={leave}
      whileHover={reduce ? undefined : { y: lift }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      style={reduce ? undefined : { rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={className}
    >
      {!reduce && <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: spotlight }} />}
      {children}
    </motion.div>
  )
}

// Bouton magnétique (suit le curseur avec ressort)
function Magnetic({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 14, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 200, damping: 14, mass: 0.4 })
  function move(e: React.MouseEvent) {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * 0.4)
    y.set((e.clientY - (r.top + r.height / 2)) * 0.4)
  }
  return (
    <motion.div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      style={reduce ? undefined : { x: sx, y: sy }}
      className={`inline-block ${className || ""}`}
    >
      {children}
    </motion.div>
  )
}

// Compteur animé qui démarre à l'entrée dans le viewport
function Counter({ to, suffix = "", decimals = 0, className }: { to: number; suffix?: string; decimals?: number; className?: string }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const [v, setV] = useState(reduce ? to : 0)
  useEffect(() => {
    if (reduce || !inView) return
    const controls = animate(0, to, { duration: 1.4, ease: EASE, onUpdate: x => setV(x) })
    return () => controls.stop()
  }, [inView, reduce, to])
  const txt = decimals > 0 ? v.toFixed(decimals).replace(".", ",") : Math.round(v).toString()
  return <span ref={ref} className={className}>{txt}{suffix}</span>
}

// Titre révélé mot par mot
function WordsReveal({ text, accent = false }: { text: string; accent?: boolean }) {
  const reduce = useReducedMotion()
  const words = text.split(" ")
  return (
    <span className={accent ? "text-brand-dark" : undefined}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: "110%" }}
            animate={reduce ? undefined : { y: 0 }}
            transition={{ duration: 0.65, ease: EASE, delay: (accent ? 0.35 : 0.1) + i * 0.06 }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Fond animé + barre de progression
// ---------------------------------------------------------------------------

function Aurora() {
  const reduce = useReducedMotion()
  const blobs = [
    { c: "#2563EB", s: 540, x: "-12%", y: "-14%", d: 0 },
    { c: "#60A5FA", s: 440, x: "72%",  y: "6%",   d: 2 },
    { c: "#1D4ED8", s: 380, x: "28%",  y: "58%",  d: 4 },
  ]
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[90px]"
          style={{ width: b.s, height: b.s, left: b.x, top: b.y, background: b.c, opacity: 0.16 }}
          animate={reduce ? undefined : { x: [0, 40, -24, 0], y: [0, -30, 22, 0], scale: [1, 1.12, 0.95, 1] }}
          transition={reduce ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut", delay: b.d }}
        />
      ))}
    </div>
  )
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })
  return <motion.div className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-brand to-brand-dark" style={{ scaleX }} />
}

// ---------------------------------------------------------------------------
// CTA primaire (magnétique + sheen)
// ---------------------------------------------------------------------------

function PrimaryCTA({ children, className = "", href = "/signup" }: { children: React.ReactNode; className?: string; href?: string }) {
  return (
    <Magnetic className={className}>
      <Link
        href={href}
        className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand px-7 py-3.5 text-[15px] font-semibold text-white
          shadow-[0_8px_28px_-8px_rgba(37,99,235,0.7)] transition-all duration-200
          hover:bg-brand-hover hover:shadow-[0_16px_44px_-10px_rgba(37,99,235,0.95)] active:scale-[0.98]"
      >
        <span className="cta-sheen" />
        {children}
        <ArrowRight size={17} strokeWidth={2.2} className="transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </Magnetic>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-dark">{children}</p>
}

// ---------------------------------------------------------------------------
// Mock produit (parallax scroll + tilt + barres animées)
// ---------------------------------------------------------------------------

function ProductMock() {
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] })
  const yRaw = useTransform(scrollYProgress, [0, 1], [70, -70])
  const y = useSpring(yRaw, { stiffness: 80, damping: 20 })

  const courses = [
    { sub: "Mathématiques", title: "Théorème de Thalès", pct: 45,  color: "#2563EB" },
    { sub: "SVT",           title: "Évaluation pt.1",     pct: 100, color: "#10B981" },
    { sub: "Français",      title: "Les Prépositions",    pct: 100, color: "#10B981" },
  ]
  const stats = [{ n: "8", l: "Cours" }, { n: "29", l: "QCM faits" }, { n: "4", l: "Jours" }, { n: "1 030", l: "Sky Coins" }]

  return (
    <div ref={sectionRef} className="relative z-10 mx-auto -mt-2 max-w-5xl px-4 pb-24 sm:px-6">
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 h-[60%] bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(37,99,235,0.18),transparent_70%)]"
        animate={reduce ? undefined : { opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
        transition={reduce ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 40 }}
        whileInView={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: EASE }}
        style={reduce ? undefined : { y }}
      >
        <Tilt strength={6} lift={0} className="relative overflow-hidden rounded-2xl border border-night-border/70 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)]">
          {/* Chrome */}
          <div className="flex items-center gap-2.5 bg-[#0b1422] px-4 py-2.5">
            <div className="flex gap-1.5">
              {["#EF4444", "#F59E0B", "#10B981"].map(c => <span key={c} className="h-2.5 w-2.5 rounded-full opacity-70" style={{ background: c }} />)}
            </div>
            <div className="mx-auto rounded-md bg-white/5 px-3 py-0.5 text-[10px] text-text-dark-tertiary">skynote.fr/dashboard</div>
          </div>
          {/* Navbar app */}
          <div className="flex items-center justify-between border-b border-white/5 bg-night-surface px-5 py-2.5">
            <div className="flex items-center gap-2">
              <Image src="/skycoin.png" alt="" width={20} height={20} />
              <span className="font-display text-[13px] font-bold text-text-dark-main">Skynote</span>
            </div>
            <div className="hidden gap-1 sm:flex">
              {[["Accueil", true], ["Classement", false], ["Boutique", false]].map(([l, active]) => (
                <span key={String(l)} className={`rounded-md px-2.5 py-1 text-[10px] font-medium ${active ? "bg-brand/20 text-brand-dark" : "text-text-dark-tertiary"}`}>{String(l)}</span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-1">
              <Image src="/skycoin.png" alt="" width={12} height={12} />
              <span className="text-[10px] font-semibold text-brand-dark-hover">1 030</span>
            </div>
          </div>
          {/* Dashboard */}
          <div className="bg-[#080f1a] px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-display text-[15px] font-bold text-text-dark-main">Bonjour, Alex</div>
                <div className="text-[10px] text-text-dark-tertiary">4 jours de suite</div>
              </div>
              <span className="rounded-lg bg-brand px-3 py-1.5 text-[10px] font-semibold text-white">+ Nouveau cours</span>
            </div>
            <div className="mb-3 grid grid-cols-4 gap-1.5">
              {stats.map(s => (
                <div key={s.l} className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-2">
                  <div className="font-display text-[14px] font-bold text-text-dark-main">{s.n}</div>
                  <div className="mt-0.5 text-[9px] text-text-dark-tertiary">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="mb-3 flex items-center justify-between rounded-lg border border-warning/25 bg-warning/10 px-3 py-2">
              <div className="flex items-center gap-2.5">
                <CalendarClock size={14} className="text-warning" />
                <div>
                  <div className="text-[10px] font-semibold text-[#FB923C]">Prépositions, J-2</div>
                  <div className="text-[9px] text-[#9a6b3a]">21 avr. · Révision finale</div>
                </div>
              </div>
              <ArrowRight size={12} className="text-brand-dark" />
            </div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-text-dark-tertiary">Cours récents</div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {courses.map(c => (
                <div key={c.title} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
                  <div className="mb-1 text-[8px] font-semibold uppercase tracking-[0.05em] text-brand-dark">{c.sub}</div>
                  <div className="mb-2 text-[11px] font-semibold text-text-dark-main">{c.title}</div>
                  <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: c.color }}
                      initial={reduce ? false : { width: 0 }}
                      whileInView={{ width: `${c.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: EASE, delay: 0.3 }}
                    />
                  </div>
                  {c.pct === 100 && <div className="mt-1 text-[8px] text-success-dark">100% maîtrise</div>}
                </div>
              ))}
            </div>
          </div>
        </Tilt>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------

function NavBar({ t }: { t: (k: string) => string }) {
  const sentinel = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    if (!sentinel.current) return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { rootMargin: "-12px 0px 0px 0px" })
    io.observe(sentinel.current)
    return () => io.disconnect()
  }, [])
  return (
    <>
      <div ref={sentinel} className="absolute left-0 top-0 h-1 w-full" aria-hidden />
      <nav className={`nav-bar sticky top-0 z-30 border-b border-transparent ${scrolled ? "scrolled" : ""}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <motion.div whileHover={{ rotate: 12, scale: 1.1 }} transition={{ type: "spring", stiffness: 300, damping: 12 }}>
              <Image src="/skycoin.png" alt="" width={28} height={28} />
            </motion.div>
            <span className="font-display text-lg font-bold tracking-tight text-text-dark-main">Skynote</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden px-3 py-2 text-[13px] text-text-dark-secondary transition-colors hover:text-text-dark-main sm:block">Connexion</Link>
            <Magnetic>
              <Link href="/signup" className="block rounded-xl bg-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_20px_-8px_rgba(37,99,235,0.8)] transition-all hover:bg-brand-hover active:scale-95">
                {t("landing.hero.ctaBeta")}
              </Link>
            </Magnetic>
          </div>
        </div>
      </nav>
    </>
  )
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero({ t, isBeta }: { t: (k: string) => string; isBeta: boolean }) {
  const reduce = useReducedMotion()
  return (
    <section className="relative z-10 mx-auto max-w-3xl px-4 pb-14 pt-10 text-center sm:px-6 sm:pt-16">
      <motion.div
        className="lg lg-liquid mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <motion.span
          className="h-2 w-2 rounded-full bg-success-dark"
          animate={reduce ? undefined : { boxShadow: ["0 0 0 0 rgba(52,211,153,.5)", "0 0 0 7px rgba(52,211,153,0)"] }}
          transition={reduce ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
        <span className="text-xs font-medium text-brand-dark-hover">{isBeta ? "Bêta ouverte · 100% gratuit" : "Disponible maintenant"}</span>
      </motion.div>

      <h1 className="font-display text-[clamp(38px,7vw,68px)] font-extrabold leading-[1.04] tracking-[-0.03em] text-text-dark-main">
        <WordsReveal text={`${t("landing.hero.title1")} ${t("landing.hero.title2")}`} />
        <br />
        <WordsReveal text={t("landing.hero.title3")} accent />
      </h1>

      <motion.p
        className="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-text-dark-secondary"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.7 }}
      >
        {t("landing.hero.subtitle2")}
        <br />
        <span className="text-[15px] text-text-dark-tertiary">{t("landing.hero.subtitle")}</span>
      </motion.p>

      <motion.div
        className="mt-9 flex justify-center"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.85 }}
      >
        <PrimaryCTA>{t("landing.hero.ctaBeta")}</PrimaryCTA>
      </motion.div>

      <motion.div
        className="mx-auto mt-12 flex max-w-md flex-wrap items-center justify-center gap-x-12 gap-y-5"
        initial={reduce ? false : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        {[
          { to: 15,  suffix: "s",  key: "landing.stats.fiches" },
          { to: 4,   suffix: "x",  key: "landing.stats.faster" },
          { to: 100, suffix: "%",  key: "landing.stats.adapted" },
        ].map(s => (
          <div key={s.key} className="text-center">
            <p className="font-display text-2xl font-bold text-text-dark-main"><Counter to={s.to} suffix={s.suffix} /></p>
            <p className="mt-1 text-xs text-text-dark-tertiary">{t(s.key)}</p>
          </div>
        ))}
      </motion.div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function Problem({ t }: { t: (k: string) => string }) {
  return (
    <section className="relative z-10 mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <Reveal>
        <h2 className="font-display text-[clamp(24px,4vw,36px)] font-bold leading-[1.2] tracking-tight">
          <span className="text-text-dark-main">{t("landing.problem.title1")}</span>{" "}
          <span className="text-text-dark-tertiary">{t("landing.problem.title2")}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-text-dark-secondary">{t("landing.problem.desc")}</p>
      </Reveal>
    </section>
  )
}

function Features({ t }: { t: (k: string) => string }) {
  const tiles = [
    { icon: Zap,           tk: "landing.features.fiches",  dk: "landing.features.fichesDesc",  span: "lg:col-span-7", big: true },
    { icon: Camera,        tk: "landing.features.photo",   dk: "landing.features.photoDesc",   span: "lg:col-span-5", big: false },
    { icon: BrainCircuit,  tk: "landing.features.qcm",     dk: "landing.features.qcmDesc",     span: "lg:col-span-5", big: false },
    { icon: MessageCircle, tk: "landing.features.chatbot", dk: "landing.features.chatbotDesc", span: "lg:col-span-7", big: false },
  ]
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {tiles.map((f, i) => {
          const Icon = f.icon
          return (
            <Reveal key={i} i={i} className={f.span}>
              <Tilt className={`group relative h-full overflow-hidden rounded-card p-7 ${f.big ? "border border-brand-dark/25 bg-gradient-to-br from-brand/20 via-night-surface to-night-surface" : "border border-night-border bg-night-surface"}`}>
                {f.big && <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-brand/20 blur-3xl transition-transform duration-500 group-hover:scale-125" />}
                <div className="relative">
                  <motion.span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.big ? "bg-brand/20" : "bg-white/5"} text-brand-dark`}
                    whileHover={{ rotate: -8, scale: 1.12 }}
                    transition={{ type: "spring", stiffness: 300, damping: 12 }}
                  >
                    <Icon size={22} strokeWidth={2} />
                  </motion.span>
                  <h3 className={`mt-5 font-display font-bold text-text-dark-main ${f.big ? "text-xl" : "text-lg"}`}>{t(f.tk)}</h3>
                  <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-text-dark-secondary">{t(f.dk)}</p>
                  {f.big && (
                    <div className="mt-6 inline-flex items-baseline gap-2 rounded-xl border border-night-border bg-night-bg/60 px-4 py-2.5">
                      <span className="font-display text-2xl font-extrabold text-brand-dark">~<Counter to={15} suffix="s" /></span>
                      <span className="text-xs text-text-dark-tertiary">par cours importé</span>
                    </div>
                  )}
                </div>
              </Tilt>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

function Brevet({ t }: { t: (k: string) => string }) {
  const reduce = useReducedMotion()
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      <Reveal>
        <div className="overflow-hidden rounded-card border border-night-border bg-night-surface">
          <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <Eyebrow>{t("landing.brevet.label")}</Eyebrow>
              <h2 className="font-display text-[clamp(24px,3.5vw,34px)] font-extrabold leading-[1.15] text-text-dark-main">{t("landing.brevet.title")}</h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-text-dark-secondary">{t("landing.brevet.desc")}</p>
              <PrimaryCTA className="mt-7">{t("landing.hero.ctaBeta")}</PrimaryCTA>
            </div>
            <div className="relative">
              <motion.div
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_60%_40%,rgba(37,99,235,0.22),transparent_70%)]"
                animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }}
                transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="mx-auto max-w-xs"
                initial={reduce ? false : { opacity: 0, scale: 0.8, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ type: "spring", stiffness: 160, damping: 16 }}
              >
                <Tilt className="relative overflow-hidden rounded-2xl border border-night-border bg-night-bg/70 p-6 text-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/20 text-brand-dark">
                    <GraduationCap size={26} />
                  </span>
                  <div className="mt-4 font-display text-5xl font-extrabold tracking-tight text-text-dark-main">
                    <Counter to={14.5} decimals={1} /><span className="text-2xl text-text-dark-tertiary">/20</span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-dark/15 px-3 py-1 text-[12px] font-semibold text-success-dark">
                    <Check size={13} strokeWidth={3} /> Mention Bien
                  </div>
                  <p className="mt-4 text-[12px] text-text-dark-tertiary">Simulation · 20 questions</p>
                </Tilt>
              </motion.div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function Testimonials({ t, items }: { t: (k: string) => string; items: Testimonial[] }) {
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      <Reveal className="mb-10 text-center">
        <h2 className="font-display text-[clamp(24px,4vw,36px)] font-bold text-text-dark-main">{t("landing.testimonials.title")}</h2>
        <p className="mt-3 text-[14px] text-text-dark-tertiary">{t("landing.testimonials.label")}</p>
      </Reveal>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((it, i) => (
          <Reveal key={i} i={i}>
            <Tilt className="relative flex h-full flex-col overflow-hidden rounded-card border border-night-border bg-night-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <figcaption className="text-[13px] font-semibold text-text-dark-secondary">{it.name}</figcaption>
                <span className="font-display text-lg font-bold text-brand-dark">{it.grade}</span>
              </div>
              <blockquote className="text-[14px] leading-relaxed text-text-dark-secondary">{it.text}</blockquote>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Pricing({ t, isBeta }: { t: (k: string) => string; isBeta: boolean }) {
  const reduce = useReducedMotion()
  if (isBeta) {
    return (
      <section className="relative z-10 mx-auto max-w-2xl px-4 pb-24 text-center sm:px-6">
        <Reveal>
          <Tilt strength={5} lift={0} className="relative overflow-hidden rounded-card border border-brand-dark/25 bg-gradient-to-b from-brand/15 to-night-surface px-8 py-14">
            <motion.span
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/20 text-brand-dark"
              animate={reduce ? undefined : { rotate: [0, 8, -8, 0] }}
              transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={24} />
            </motion.span>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-dark">{t("landing.beta.label")}</p>
            <h2 className="mt-2 font-display text-[clamp(40px,7vw,60px)] font-extrabold text-text-dark-main">{t("landing.beta.title")}</h2>
            <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-text-dark-tertiary">{t("landing.beta.desc")}</p>
            <div className="mt-8 flex justify-center"><PrimaryCTA>{t("landing.beta.cta")}</PrimaryCTA></div>
          </Tilt>
        </Reveal>
      </section>
    )
  }

  const plans = [
    { name: t("landing.pricing.free"), price: "0€", note: null, featured: false, feats: ["landing.pricing.free1", "landing.pricing.free2", "landing.pricing.free3", "landing.pricing.free4"], cta: t("landing.pricing.start") },
    { name: "Starter", price: "4,99€", per: t("landing.pricing.perMonth"), note: `ou 3,99€${t("landing.pricing.perMonth")} ${t("landing.pricing.yearly")}`, featured: true, feats: ["landing.pricing.starter1", "landing.pricing.starter2", "landing.pricing.starter3", "landing.pricing.starter4", "landing.pricing.starter5"], cta: t("landing.pricing.subscribe") },
    { name: t("landing.pricing.pro"), price: "6,90€", per: t("landing.pricing.perMonth"), note: `ou 5,49€${t("landing.pricing.perMonth")} ${t("landing.pricing.yearly")}`, featured: false, feats: ["landing.pricing.pro1", "landing.pricing.pro2", "landing.pricing.pro3", "landing.pricing.pro4", "landing.pricing.pro5"], cta: t("landing.pricing.subscribe") },
  ]

  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      <Reveal className="mb-10 text-center">
        <h2 className="font-display text-[clamp(26px,4vw,38px)] font-extrabold text-text-dark-main">{t("landing.pricing.title")}</h2>
        <p className="mt-3 text-[14px] text-text-dark-tertiary">{t("landing.pricing.subtitle")}</p>
      </Reveal>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((p, i) => (
          <Reveal key={p.name} i={i}>
            <Tilt className={`relative flex h-full flex-col rounded-card p-6 ${p.featured ? "border-2 border-brand-dark/60 bg-gradient-to-b from-brand/15 to-night-surface" : "border border-night-border bg-night-surface"}`}>
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3.5 py-1 text-[11px] font-bold text-white">{t("landing.pricing.popular")}</span>
              )}
              <p className={`text-[13px] font-semibold ${p.featured ? "text-brand-dark" : "text-text-dark-tertiary"}`}>{p.name}</p>
              <p className="mt-1 font-display text-[32px] font-extrabold text-text-dark-main">
                {p.price}{p.per && <span className="text-sm font-normal text-text-dark-tertiary">{p.per}</span>}
              </p>
              <p className="mb-5 mt-0.5 h-4 text-[12px] text-text-dark-tertiary">{p.note || ""}</p>
              <ul className="flex flex-col gap-2.5">
                {p.feats.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-text-dark-secondary">
                    <Check size={15} strokeWidth={2.4} className="mt-0.5 shrink-0 text-brand-dark" />
                    {t(f)}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-6 rounded-xl py-2.5 text-center text-[13px] font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                  p.featured ? "bg-brand text-white hover:bg-brand-hover" : "border border-night-border text-text-dark-secondary hover:border-brand-dark/40 hover:text-text-dark-main"
                }`}
              >
                {p.cta}
              </Link>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Footer({ t }: { t: (k: string) => string }) {
  return (
    <footer className="relative z-10 mx-auto max-w-5xl border-t border-night-border/60 px-4 py-10 text-center sm:px-6">
      <p className="mb-5 text-[13px] text-text-dark-tertiary">{t("landing.footer")}</p>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-text-dark-tertiary">
        <Link href="/privacy" className="transition-colors hover:text-text-dark-secondary">{t("landing.footer.privacy")}</Link>
        <span className="text-night-border">·</span>
        <Link href="/terms" className="transition-colors hover:text-text-dark-secondary">{t("landing.footer.terms")}</Link>
        <span className="text-night-border">·</span>
        <Link href="/mentions-legales" className="transition-colors hover:text-text-dark-secondary">{t("landing.footer.legal")}</Link>
        <span className="text-night-border">·</span>
        <span>© 2026 Skynote</span>
      </div>
    </footer>
  )
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function LandingPage({ isBeta = true, testimonials }: { isBeta?: boolean; testimonials?: Testimonial[] }) {
  const TESTIMONIALS = (testimonials && testimonials.length >= 3) ? testimonials : FALLBACK_TESTIMONIALS
  const { t } = useI18n()

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-night-bg font-body text-text-dark-main">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <ScrollProgress />
      <Aurora />

      <NavBar t={t} />
      <Hero t={t} isBeta={isBeta} />
      <ProductMock />
      <Problem t={t} />
      <Features t={t} />
      <Brevet t={t} />
      <Testimonials t={t} items={TESTIMONIALS} />
      <Pricing t={t} isBeta={isBeta} />
      <Footer t={t} />
    </div>
  )
}
