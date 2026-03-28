'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const FEATURES = [
  { icon: '📸', title: 'Photo, texte, vocal, PDF', desc: 'Importe ton cours comme tu veux. L\'IA s\'adapte.' },
  { icon: '⚡', title: 'Fiches en 15 secondes', desc: 'Pas en 15 minutes. En 15 secondes. Chrono en main.' },
  { icon: '🧠', title: 'QCM intelligents', desc: 'Des questions qui testent ta comprehension, pas ta memoire.' },
  { icon: '💬', title: 'Chatbot par cours', desc: 'Pose tes questions. L\'IA connait ton cours par coeur.' },
]

const STATS = [
  { value: '15s', label: 'pour generer tes fiches' },
  { value: '4x', label: 'plus rapide que reecrire' },
  { value: '100%', label: 'adapte college & lycee' },
]

const TESTIMONIALS = [
  { text: 'J\'ai eu 17 en histoire grace aux fiches Skynote. Ma prof a cru que j\'avais revise 3h.', name: 'Ines, 3eme', grade: '17/20' },
  { text: 'Le QCM m\'a fait comprendre des trucs que j\'avais pas capte en cours. C\'est ouf.', name: 'Yanis, 2nde', grade: '15/20' },
  { text: 'Je prends mon cours en photo et 15 secondes apres j\'ai mes fiches. C\'est magique.', name: 'Lea, 4eme', grade: '16/20' },
]

const STARS = Array.from({ length: 20 }, (_, i) => ({
  left: (7 + i * 47 + (i * 13) % 37) % 100,
  top: (11 + i * 31 + (i * 19) % 43) % 100,
  delay: (i * 0.7) % 5,
  duration: 2 + (i * 0.3) % 4,
}))

export function LandingPage({ isBeta = true }: { isBeta?: boolean }) {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [glowPulse, setGlowPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setGlowPulse(p => !p), 2000)
    return () => clearInterval(interval)
  }, [])

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
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const isVisible = (id: string) => visibleSections.has(id)

  return (
    <div style={{ background: '#060D1A', minHeight: '100vh', color: '#F0F6FF' }} className="font-body">
      <style>{`
        .glow-grade {
          text-shadow: 0 0 20px rgba(37,99,235,0.6), 0 0 60px rgba(37,99,235,0.3), 0 0 100px rgba(37,99,235,0.15);
          transition: text-shadow 2s ease-in-out;
        }
        .glow-grade-pulse {
          text-shadow: 0 0 30px rgba(96,165,250,0.8), 0 0 80px rgba(96,165,250,0.4), 0 0 120px rgba(96,165,250,0.2);
        }
        .gradient-text {
          background: linear-gradient(135deg, #60A5FA 0%, #2563EB 50%, #60A5FA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% auto;
          animation: gradient-shift 4s ease-in-out infinite;
        }
        @keyframes gradient-shift { 0%, 100% { background-position: 0% center; } 50% { background-position: 200% center; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes twinkle { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.6; } }
        @keyframes orb-drift { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-20px) scale(1.1); } 66% { transform: translate(-20px,15px) scale(0.95); } }
        .animate-fade-up { animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.1s; } .delay-2 { animation-delay: 0.2s; } .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; } .delay-5 { animation-delay: 0.5s; } .delay-6 { animation-delay: 0.6s; }
        .section-visible .animate-on-scroll { animation: fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 500, height: 500, background: '#2563EB', top: '-10%', left: '-10%', filter: 'blur(80px)', opacity: 0.12, animation: 'orb-drift 20s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, background: '#60A5FA', bottom: '10%', right: '-5%', filter: 'blur(80px)', opacity: 0.12, animation: 'orb-drift 20s ease-in-out infinite', animationDelay: '-7s' }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, background: '#1D4ED8', top: '50%', left: '30%', filter: 'blur(80px)', opacity: 0.12, animation: 'orb-drift 20s ease-in-out infinite', animationDelay: '-13s' }} />
        {STARS.map((star, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{ width: 2, height: 2, left: `${star.left}%`, top: `${star.top}%`, animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite` }} />
        ))}
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/skycoin.png" alt="" width={28} height={28} />
          <span className="font-display text-[18px] font-bold tracking-tight text-[#F0F6FF]">Skynote</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[13px] text-slate-400 hover:text-white transition-colors px-3 py-2">Connexion</Link>
          <Link href="/signup" className="text-[13px] font-semibold px-5 py-2.5 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}>
            Commencer gratuitement
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="animate-fade-up delay-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ animation: 'twinkle 2s ease-in-out infinite' }} />
            <span className="text-[12px] text-blue-300 font-medium">
              {isBeta ? 'Beta ouverte — 100% gratuit' : 'Disponible maintenant'}
            </span>
          </div>
        </div>

        <h1 className="font-display animate-fade-up delay-2" style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
          <span className="text-[#F0F6FF]">Tes cours deviennent</span><br />
          <span className="gradient-text">des fiches de revision</span>
        </h1>

        <p className="animate-fade-up delay-3 text-[17px] text-slate-300 max-w-lg mx-auto mt-6 leading-relaxed">
          C'est pas un complement qui fait perdre du temps.<br />C'est un nouveau moyen de travailler.
        </p>

        <div className="animate-fade-up delay-4 mt-10 mb-10" style={{ animation: 'float 4s ease-in-out infinite' }}>
          <span className={`font-display glow-grade ${glowPulse ? 'glow-grade-pulse' : ''}`} style={{ fontSize: 'clamp(72px, 12vw, 120px)', fontWeight: 800, letterSpacing: '-0.04em', color: '#60A5FA' }}>
            18/20
          </span>
          <p className="text-slate-500 text-[14px] mt-2">La note moyenne de ceux qui revisent avec Skynote</p>
        </div>

        <div className="animate-fade-up delay-5 flex flex-col items-center gap-3">
          <Link href="/signup" className="text-[15px] font-semibold px-8 py-3.5 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}>
            {isBeta ? 'Commencer gratuitement' : 'Creer mon compte'}
          </Link>
        </div>

        <div className="animate-fade-up delay-6 flex justify-center gap-12 mt-14">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-display text-[28px] font-bold text-[#F0F6FF]">{s.value}</p>
              <p className="text-[12px] text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PAIN */}
      <section id="pain" data-animate className={isVisible('pain') ? 'section-visible' : ''}>
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="animate-on-scroll">
            <p className="text-[13px] text-blue-400 font-semibold tracking-widest uppercase mb-4">Le probleme</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, lineHeight: 1.2 }}>
              <span className="text-[#F0F6FF]">Tu passes 2h a recopier tes cours</span><br />
              <span className="text-slate-500">pour 15 minutes de vraie revision.</span>
            </h2>
            <p className="text-[16px] text-slate-400 mt-6 max-w-xl mx-auto leading-relaxed">
              Reecrire c'est pas reviser. Ton cerveau retient quand il est actif — pas quand il recopie. Skynote fait le travail de mise en forme pour que toi, tu te concentres sur ce qui compte.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" data-animate className={isVisible('features') ? 'section-visible' : ''}>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="animate-on-scroll rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1" style={{ background: 'linear-gradient(145deg, rgba(30,58,95,0.6) 0%, rgba(13,27,46,0.9) 100%)', border: '1px solid rgba(96,165,250,0.2)', animationDelay: `${i * 0.1}s` }}>
                <span className="text-[28px] block mb-3">{f.icon}</span>
                <h3 className="font-display text-[16px] font-bold text-[#F0F6FF] mb-2">{f.title}</h3>
                <p className="text-[14px] text-slate-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="proof" data-animate className={isVisible('proof') ? 'section-visible' : ''}>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-12 animate-on-scroll">
            <p className="text-[13px] text-blue-400 font-semibold tracking-widest uppercase mb-4">Ils revisent avec Skynote</p>
            <h2 className="font-display text-[#F0F6FF]" style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700 }}>Les notes parlent d'elles-memes.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="animate-on-scroll rounded-2xl p-6" style={{ background: 'linear-gradient(145deg, rgba(30,58,95,0.4) 0%, rgba(13,27,46,0.7) 100%)', border: '1px solid rgba(96,165,250,0.15)', animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[13px] text-slate-200 font-medium">{t.name}</span>
                  <span className="font-display text-[18px] font-bold text-blue-400">{t.grade}</span>
                </div>
                <p className="text-[14px] text-slate-200 leading-relaxed italic">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" data-animate className={isVisible('pricing') ? 'section-visible' : ''}>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="animate-on-scroll">
            {isBeta ? (
              <>
                <p className="text-[13px] text-blue-400 font-semibold tracking-widest uppercase mb-4">Pendant la beta</p>
                <h2 className="font-display text-[#F0F6FF] mb-4" style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 800 }}>Gratuit.</h2>
                <p className="text-[16px] text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">Toutes les fonctionnalites. Aucune carte bancaire. Tu revises, tu progresses, c'est tout.</p>
                <Link href="/signup" className="inline-block text-[15px] font-semibold px-10 py-4 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}>
                  Creer mon compte gratuitement
                </Link>
              </>
            ) : (
              <>
                <p className="text-[13px] text-blue-400 font-semibold tracking-widest uppercase mb-4">Nos forfaits</p>
                <h2 className="font-display text-[#F0F6FF] mb-3" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800 }}>Choisis ton plan</h2>
                <p className="text-[15px] text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">Commence gratuitement, evolue quand tu veux.</p>

                <div className="grid sm:grid-cols-3 gap-4 text-left">
                  {/* Gratuit */}
                  <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(145deg, rgba(30,58,95,0.5) 0%, rgba(13,27,46,0.85) 100%)', border: '1px solid rgba(96,165,250,0.15)' }}>
                    <p className="text-[14px] text-slate-400 font-medium mb-1">Gratuit</p>
                    <p className="font-display text-[32px] font-extrabold text-[#F0F6FF] mb-4">0€</p>
                    <div className="text-[13px] text-slate-300 space-y-2">
                      <p>1 cours par semaine</p><p>Fiches IA + QCM</p><p>Sky Coins & objectifs</p>
                    </div>
                    <Link href="/signup" className="block mt-5 text-center text-[13px] font-semibold py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:border-slate-400 transition-colors">Commencer</Link>
                  </div>

                  {/* Plus */}
                  <div className="rounded-2xl p-6 relative" style={{ background: 'linear-gradient(145deg, rgba(30,58,95,0.5) 0%, rgba(13,27,46,0.85) 100%)', border: '2px solid rgba(96,165,250,0.5)' }}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand px-4 py-1 rounded-full text-[11px] font-semibold text-white">Populaire</div>
                    <p className="text-[14px] text-blue-400 font-medium mb-1">Plus</p>
                    <p className="font-display text-[32px] font-extrabold text-[#F0F6FF] mb-0">4,99€<span className="text-[14px] font-normal text-slate-400">/mois</span></p>
                    <p className="text-[12px] text-slate-500 mb-4">ou 3,99€/mois en annuel</p>
                    <div className="text-[13px] text-slate-300 space-y-2">
                      <p>Cours illimites</p><p>Dictee vocale</p><p>Chatbot IA par cours</p><p>Tout le plan Gratuit</p>
                    </div>
                    <Link href="/signup" className="block mt-5 text-center text-[13px] font-semibold py-2.5 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>S'abonner</Link>
                  </div>

                  {/* Famille */}
                  <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(145deg, rgba(30,58,95,0.5) 0%, rgba(13,27,46,0.85) 100%)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <p className="text-[14px] text-purple-400 font-medium mb-1">Famille</p>
                    <p className="font-display text-[32px] font-extrabold text-[#F0F6FF] mb-0">11,99€<span className="text-[14px] font-normal text-slate-400">/mois</span></p>
                    <p className="text-[12px] text-slate-500 mb-4">ou 10,99€/mois en annuel</p>
                    <div className="text-[13px] text-slate-300 space-y-2">
                      <p>Tout le plan Plus</p><p>Jusqu'a 6 enfants</p><p>Dashboard parent</p><p>Support prioritaire</p>
                    </div>
                    <Link href="/signup" className="block mt-5 text-center text-[13px] font-semibold py-2.5 rounded-xl border border-purple-500/30 text-purple-300 hover:border-purple-400 transition-colors">S'abonner</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 max-w-4xl mx-auto px-6 py-10 text-center">
        <p className="text-slate-600 text-[13px] mb-6">Tu perds rien a essayer. Tu perds du temps a ne pas le faire.</p>
        <div className="flex items-center justify-center gap-4 text-[13px] text-slate-600 flex-wrap">
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">Confidentialite</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-slate-400 transition-colors">CGU</Link>
          <span>·</span>
          <Link href="/mentions-legales" className="hover:text-slate-400 transition-colors">Mentions legales</Link>
          <span>·</span>
          <span>© 2026 Skynote</span>
        </div>
      </footer>
    </div>
  )
}
