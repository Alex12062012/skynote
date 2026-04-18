'use client'

/**
 * SkinDecoration — overlay décoratif à l'intérieur de la PlayerCard.
 * Chaque skin a son propre design SVG + CSS.
 * Doit être placé en absolute inset-0 dans un parent overflow-hidden.
 */

function Aube() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {/* Halo soleil levant en haut à droite */}
      <defs>
        <radialGradient id="aube-sun" cx="90%" cy="0%" r="55%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.45"/>
          <stop offset="50%" stopColor="#f9a8d4" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#f9a8d4" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="aube-glow" cx="10%" cy="100%" r="40%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="64" fill="url(#aube-sun)"/>
      <rect width="320" height="64" fill="url(#aube-glow)"/>
      {/* Rayons fins */}
      {[0,1,2,3,4,5].map(i => (
        <line key={i} x1="290" y1={-10} x2={130 - i*18} y2="74"
          stroke={`rgba(251,${140+i*12},${100+i*8},${0.12 - i*0.015})`} strokeWidth={7 - i}/>
      ))}
      {/* Horizon dégradé */}
      <rect x="0" y="44" width="320" height="20" fill="rgba(251,146,60,0.07)" rx="2"/>
    </svg>
  )
}

function Crepuscule() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="crep-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3"/>
          <stop offset="50%" stopColor="#a855f7" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2"/>
        </linearGradient>
        <radialGradient id="crep-sun" cx="50%" cy="120%" r="70%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.5"/>
          <stop offset="60%" stopColor="#f472b6" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#f472b6" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="64" fill="url(#crep-bg)"/>
      <rect width="320" height="64" fill="url(#crep-sun)"/>
      {/* Bandes horizontales coucher de soleil */}
      <rect x="0" y="40" width="320" height="3" fill="rgba(251,146,60,0.18)" rx="1"/>
      <rect x="0" y="47" width="320" height="2" fill="rgba(168,85,247,0.15)" rx="1"/>
      <rect x="0" y="53" width="320" height="1.5" fill="rgba(236,72,153,0.12)" rx="1"/>
      {/* Soleil à l'horizon */}
      <ellipse cx="160" cy="68" rx="28" ry="10" fill="rgba(251,146,60,0.22)"/>
      <ellipse cx="160" cy="68" rx="16" ry="6" fill="rgba(251,191,36,0.3)"/>
    </svg>
  )
}

function Nuage() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <filter id="cloud-blur"><feGaussianBlur stdDeviation="1.5"/></filter>
      </defs>
      {/* Nuages SVG stylisés */}
      <g fill="rgba(255,255,255,0.55)" filter="url(#cloud-blur)">
        <ellipse cx="240" cy="22" rx="30" ry="14"/>
        <ellipse cx="220" cy="28" rx="22" ry="12"/>
        <ellipse cx="260" cy="28" rx="20" ry="10"/>
      </g>
      <g fill="rgba(255,255,255,0.35)">
        <ellipse cx="70" cy="40" rx="22" ry="10"/>
        <ellipse cx="55" cy="44" rx="16" ry="8"/>
        <ellipse cx="84" cy="44" rx="14" ry="7"/>
      </g>
      <g fill="rgba(186,230,253,0.3)">
        <ellipse cx="160" cy="12" rx="18" ry="8"/>
        <ellipse cx="148" cy="16" rx="12" ry="6"/>
        <ellipse cx="172" cy="16" rx="10" ry="5"/>
      </g>
      {/* Petits points de pluie fine */}
      {[20,60,100,140,180,220,260,300].map((x,i) => (
        <line key={i} x1={x} y1="50" x2={x-2} y2="60"
          stroke="rgba(125,211,252,0.3)" strokeWidth="1" strokeLinecap="round"/>
      ))}
    </svg>
  )
}

function Aurore() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <filter id="aurora-blur"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      {/* Rideaux d'aurore */}
      <g filter="url(#aurora-blur)">
        <path d="M0,8 Q40,40 80,20 Q120,0 160,30 Q200,55 240,25 Q280,0 320,20 L320,64 L0,64 Z"
          fill="rgba(45,212,191,0.18)"/>
        <path d="M0,20 Q60,50 100,30 Q140,10 180,40 Q220,64 260,35 Q290,15 320,35 L320,64 L0,64 Z"
          fill="rgba(167,139,250,0.15)"/>
        <path d="M0,35 Q50,20 90,45 Q130,64 170,40 Q210,18 250,50 Q285,64 320,45 L320,64 L0,64 Z"
          fill="rgba(52,211,153,0.12)"/>
      </g>
      {/* Étoiles */}
      {[[30,8],[80,15],[140,5],[200,12],[270,7],[310,18]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="rgba(255,255,255,0.8)"/>
      ))}
    </svg>
  )
}

function Soleil() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="sol-core" cx="85%" cy="50%" r="30%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6"/>
          <stop offset="40%" stopColor="#fb923c" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="64" fill="url(#sol-core)"/>
      {/* Rayons depuis droite */}
      {Array.from({length: 12}, (_,i) => {
        const angle = (i * 30) * Math.PI / 180
        const x1 = 290, y1 = 32
        const len = 55 + (i%3)*15
        return (
          <line key={i}
            x1={x1} y1={y1}
            x2={x1 + Math.cos(angle)*len}
            y2={y1 + Math.sin(angle)*len}
            stroke={`rgba(251,191,36,${0.22 - i*0.01})`}
            strokeWidth={2.5 - (i%3)*0.5}
            strokeLinecap="round"
          />
        )
      })}
      {/* Disque solaire */}
      <circle cx="290" cy="32" r="12" fill="rgba(251,191,36,0.35)"/>
      <circle cx="290" cy="32" r="7" fill="rgba(253,224,71,0.5)"/>
    </svg>
  )
}

function Lune() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {/* Croissant de lune */}
      <defs>
        <radialGradient id="lune-glow" cx="83%" cy="50%" r="25%">
          <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="64" fill="url(#lune-glow)"/>
      <circle cx="278" cy="32" r="16" fill="rgba(203,213,225,0.35)"/>
      <circle cx="285" cy="27" r="13" fill="rgba(15,23,42,0.55)"/>
      {/* Étoiles dispersées */}
      {[[20,12],[55,8],[95,20],[140,6],[185,14],[225,9],[145,45],[80,50],[30,38]].map(([x,y],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i%3===0?1.5:1} fill={`rgba(203,213,225,${0.6+i*0.04})`}/>
          {i%3===0 && <>
            <line x1={x} y1={y-3} x2={x} y2={y+3} stroke="rgba(203,213,225,0.4)" strokeWidth="0.7"/>
            <line x1={x-3} y1={y} x2={x+3} y2={y} stroke="rgba(203,213,225,0.4)" strokeWidth="0.7"/>
          </>}
        </g>
      ))}
    </svg>
  )
}

function Tempete() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="storm-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.05"/>
        </linearGradient>
        <filter id="storm-glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="320" height="64" fill="url(#storm-bg)"/>
      {/* Pluie */}
      {[15,40,65,90,115,145,175,205,235,265,295].map((x,i) => (
        <line key={i} x1={x+(i%2)*5} y1={0} x2={x+(i%2)*5-4} y2="64"
          stroke="rgba(96,165,250,0.2)" strokeWidth="0.8"/>
      ))}
      {/* Éclairs */}
      <polyline points="200,0 190,25 205,25 192,50 208,50 195,64"
        fill="none" stroke="rgba(250,204,21,0.7)" strokeWidth="2.5" strokeLinejoin="round"
        filter="url(#storm-glow)"/>
      <polyline points="255,5 247,22 258,22 248,42"
        fill="none" stroke="rgba(250,204,21,0.45)" strokeWidth="1.8" strokeLinejoin="round"/>
      {/* Flash lumineux */}
      <radialGradient id="lightning-flash" cx="62%" cy="40%" r="20%">
        <stop offset="0%" stopColor="#fde68a" stopOpacity="0.25"/>
        <stop offset="100%" stopColor="#fde68a" stopOpacity="0"/>
      </radialGradient>
      <rect width="320" height="64" fill="url(#lightning-flash)"/>
    </svg>
  )
}

function NuitEtoilee() {
  const stars = Array.from({length: 28}, (_,i) => ({
    x: (i * 73 + 11) % 310 + 5,
    y: (i * 47 + 7) % 56 + 4,
    r: i%5===0 ? 1.8 : i%3===0 ? 1.3 : 0.9,
    op: 0.4 + (i%4)*0.15,
  }))
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="night-bg" cx="30%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#312e81" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#312e81" stopOpacity="0.04"/>
        </radialGradient>
      </defs>
      <rect width="320" height="64" fill="url(#night-bg)"/>
      {/* Voie lactée */}
      <ellipse cx="160" cy="32" rx="140" ry="12" fill="rgba(165,180,252,0.06)" transform="rotate(-8 160 32)"/>
      {/* Étoiles */}
      {stars.map((s,i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={s.r} fill={`rgba(199,210,254,${s.op})`}/>
          {s.r > 1.5 && <>
            <line x1={s.x} y1={s.y-4} x2={s.x} y2={s.y+4} stroke={`rgba(199,210,254,${s.op*0.5})`} strokeWidth="0.6"/>
            <line x1={s.x-4} y1={s.y} x2={s.x+4} y2={s.y} stroke={`rgba(199,210,254,${s.op*0.5})`} strokeWidth="0.6"/>
          </>}
        </g>
      ))}
      {/* Constellation */}
      <polyline points="45,12 70,28 100,18 130,35" fill="none"
        stroke="rgba(165,180,252,0.25)" strokeWidth="0.8" strokeDasharray="2 3"/>
    </svg>
  )
}

function Brume() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <filter id="brume-blur"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      <g filter="url(#brume-blur)">
        <path d="M-20,15 Q80,5 160,20 Q240,35 340,18" fill="none"
          stroke="rgba(196,181,253,0.5)" strokeWidth="18"/>
        <path d="M-20,35 Q60,28 140,38 Q220,48 340,32" fill="none"
          stroke="rgba(216,180,254,0.35)" strokeWidth="14"/>
        <path d="M-20,52 Q90,44 170,55 Q250,64 340,50" fill="none"
          stroke="rgba(167,139,250,0.25)" strokeWidth="10"/>
      </g>
      {/* Petites particules */}
      {[[50,20],[120,10],[200,30],[280,15],[160,45],[90,50]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill={`rgba(196,181,253,${0.2+i*0.03})`}
          style={{filter:'blur(1px)'}}/>
      ))}
    </svg>
  )
}

function Ocean() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="ocean-depth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0e7490" stopOpacity="0.05"/>
          <stop offset="100%" stopColor="#0e7490" stopOpacity="0.22"/>
        </linearGradient>
      </defs>
      <rect width="320" height="64" fill="url(#ocean-depth)"/>
      {/* Vagues */}
      <path d="M-10,42 Q30,34 70,42 Q110,50 150,40 Q190,30 230,40 Q270,50 320,38 L320,64 L-10,64 Z"
        fill="rgba(6,182,212,0.18)"/>
      <path d="M-10,50 Q40,44 80,50 Q120,56 160,48 Q200,40 240,50 Q280,58 320,46 L320,64 L-10,64 Z"
        fill="rgba(14,116,144,0.22)"/>
      <path d="M-10,57 Q50,52 90,57 Q130,62 170,55 Q210,48 250,57 Q290,64 320,55 L320,64 L-10,64 Z"
        fill="rgba(8,145,178,0.28)"/>
      {/* Reflets de surface */}
      <path d="M20,35 Q35,32 50,35" fill="none" stroke="rgba(125,211,252,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M100,30 Q120,27 140,30" fill="none" stroke="rgba(125,211,252,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M200,38 Q215,35 230,38" fill="none" stroke="rgba(125,211,252,0.45)" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M270,32 Q285,29 300,32" fill="none" stroke="rgba(125,211,252,0.35)" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

function Phoenix() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="phoenix-core" cx="75%" cy="80%" r="45%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.6"/>
          <stop offset="50%" stopColor="#ef4444" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
        </radialGradient>
        <filter id="flame-blur"><feGaussianBlur stdDeviation="1.5"/></filter>
      </defs>
      <rect width="320" height="64" fill="url(#phoenix-core)"/>
      {/* Flammes */}
      <g filter="url(#flame-blur)">
        <path d="M220,64 Q225,45 215,30 Q210,15 225,0 Q235,18 228,32 Q240,20 238,5 Q248,22 242,38 Q252,28 255,10 Q262,30 254,46 Q260,38 268,25 Q272,42 260,58 Q245,64 220,64 Z"
          fill="rgba(251,146,60,0.55)"/>
        <path d="M240,64 Q245,50 237,38 Q233,25 244,12 Q252,28 246,42 Q256,32 260,18 Q266,35 258,52 Q252,64 240,64 Z"
          fill="rgba(253,186,116,0.5)"/>
        <path d="M260,64 Q264,54 258,44 Q254,34 262,22 Q268,36 262,50 Q272,42 278,28 Q282,44 272,58 Q267,64 260,64 Z"
          fill="rgba(254,215,170,0.45)"/>
      </g>
      {/* Particules de braise */}
      {[[195,48],[205,35],[230,20],[248,28],[270,15],[285,38]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={1.5-i%2*0.5} fill={`rgba(253,${180+i*10},70,${0.7-i*0.08})`}/>
      ))}
    </svg>
  )
}

function Cristal() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="cristal-shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.4"/>
          <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.3"/>
        </linearGradient>
        <filter id="cristal-glow"><feGaussianBlur stdDeviation="1.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="320" height="64" fill="url(#cristal-shine)"/>
      {/* Cristaux géométriques */}
      <g filter="url(#cristal-glow)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="260,8 272,28 260,48 248,28" stroke="rgba(125,211,252,0.6)" strokeWidth="1.2" fill="rgba(186,230,253,0.12)"/>
        <polygon points="285,15 294,30 285,45 276,30" stroke="rgba(147,197,253,0.5)" strokeWidth="1" fill="rgba(186,230,253,0.08)"/>
        <polygon points="240,20 248,32 240,44 232,32" stroke="rgba(125,211,252,0.45)" strokeWidth="0.9" fill="rgba(186,230,253,0.06)"/>
        <line x1="260" y1="8" x2="260" y2="48" stroke="rgba(186,230,253,0.3)" strokeWidth="0.6"/>
        <line x1="248" y1="28" x2="272" y2="28" stroke="rgba(186,230,253,0.3)" strokeWidth="0.6"/>
        {/* Petit cristal gauche */}
        <polygon points="45,10 52,22 45,34 38,22" stroke="rgba(125,211,252,0.35)" strokeWidth="0.8" fill="rgba(186,230,253,0.05)"/>
      </g>
      {/* Reflets prismatiques */}
      <line x1="200" y1="0" x2="280" y2="64" stroke="rgba(186,230,253,0.2)" strokeWidth="8"/>
      <line x1="170" y1="0" x2="250" y2="64" stroke="rgba(147,197,253,0.12)" strokeWidth="5"/>
    </svg>
  )
}

function Cosmos() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="cosmos-nebula" cx="65%" cy="50%" r="45%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35"/>
          <stop offset="50%" stopColor="#4c1d95" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#2e1065" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="cosmos-nebula2" cx="25%" cy="30%" r="35%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="64" fill="url(#cosmos-nebula)"/>
      <rect width="320" height="64" fill="url(#cosmos-nebula2)"/>
      {/* Étoiles */}
      {Array.from({length: 35}, (_,i) => ({
        x: (i * 67 + 13) % 315 + 2,
        y: (i * 43 + 9) % 60 + 2,
        r: i%6===0 ? 1.8 : 0.8,
        c: i%4===0 ? 'rgba(216,180,254,0.9)' : 'rgba(255,255,255,0.7)',
      })).map((s,i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c}/>)}
      {/* Spirale galaxie */}
      <path d="M208,32 Q220,20 235,28 Q248,36 240,48 Q228,56 215,48 Q205,40 212,30 Q218,22 228,26"
        fill="none" stroke="rgba(167,139,250,0.4)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="220" cy="36" r="4" fill="rgba(167,139,250,0.35)"/>
      <circle cx="220" cy="36" r="2" fill="rgba(216,180,254,0.5)"/>
    </svg>
  )
}

function Dragon() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="dragon-glow" cx="80%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#059669" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="64" fill="url(#dragon-glow)"/>
      {/* Écailles hexagonales */}
      {[
        [230,8],[252,8],[274,8],[296,8],
        [241,22],[263,22],[285,22],[307,22],
        [230,36],[252,36],[274,36],[296,36],
        [241,50],[263,50],[285,50],[307,50],
      ].map(([cx,cy],i) => (
        <polygon key={i}
          points={`${cx},${cy-8} ${cx+7},${cy-4} ${cx+7},${cy+4} ${cx},${cy+8} ${cx-7},${cy+4} ${cx-7},${cy-4}`}
          fill={`rgba(${i%2?52:16},${i%2?211:185},${i%2?153:129},${0.15+i%3*0.04})`}
          stroke="rgba(52,211,153,0.3)" strokeWidth="0.7"
        />
      ))}
      {/* Pierre gemme */}
      <polygon points="38,32 48,20 58,32 48,44" fill="rgba(52,211,153,0.45)" stroke="rgba(16,185,129,0.6)" strokeWidth="1.2"/>
      <polygon points="38,32 48,20 58,32" fill="rgba(110,231,183,0.35)"/>
      <line x1="48" y1="20" x2="48" y2="44" stroke="rgba(167,243,208,0.5)" strokeWidth="0.8"/>
    </svg>
  )
}

function Prismatique() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 64" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <filter id="prism-blur"><feGaussianBlur stdDeviation="0.8"/></filter>
      </defs>
      {/* Faisceaux de lumière prismatique diagonaux */}
      {[
        { x1:180, x2:320, color:'rgba(239,68,68,0.22)',   w:12 },
        { x1:160, x2:300, color:'rgba(249,115,22,0.2)',   w:10 },
        { x1:140, x2:280, color:'rgba(234,179,8,0.22)',   w:10 },
        { x1:120, x2:260, color:'rgba(34,197,94,0.2)',    w:10 },
        { x1:100, x2:240, color:'rgba(6,182,212,0.22)',   w:10 },
        { x1: 80, x2:220, color:'rgba(99,102,241,0.2)',   w:9  },
        { x1: 60, x2:200, color:'rgba(168,85,247,0.22)',  w:9  },
        { x1: 40, x2:180, color:'rgba(236,72,153,0.2)',   w:8  },
      ].map((b,i) => (
        <polygon key={i}
          points={`${b.x1},0 ${b.x1+b.w},0 ${b.x2+b.w},64 ${b.x2},64`}
          fill={b.color}
          filter="url(#prism-blur)"
        />
      ))}
      {/* Prisme triangulaire */}
      <polygon points="30,5 55,5 42,30" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
      <line x1="42" y1="30" x2="15" y2="64" stroke="rgba(239,68,68,0.5)" strokeWidth="2"/>
      <line x1="42" y1="30" x2="42" y2="64" stroke="rgba(34,197,94,0.5)" strokeWidth="2"/>
      <line x1="42" y1="30" x2="68" y2="64" stroke="rgba(99,102,241,0.5)" strokeWidth="2"/>
      {/* Éclats de lumière */}
      {[[240,15],[270,35],[200,48]].map(([x,y],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" fill="rgba(255,255,255,0.6)"/>
          <line x1={x} y1={y-6} x2={x} y2={y+6} stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
          <line x1={x-6} y1={y} x2={x+6} y2={y} stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
        </g>
      ))}
    </svg>
  )
}

const DECORATIONS: Record<string, React.FC> = {
  skin_aube:              Aube,
  skin_crepuscule:        Crepuscule,
  skin_nuage:             Nuage,
  skin_aurore:            Aurore,
  skin_soleil:            Soleil,
  skin_lune:              Lune,
  skin_tempete:           Tempete,
  skin_nuit_etoilee:      NuitEtoilee,
  skin_brume:             Brume,
  skin_ocean:             Ocean,
  skin_secret_phoenix:    Phoenix,
  skin_secret_cristal:    Cristal,
  skin_secret_cosmos:     Cosmos,
  skin_secret_dragon:     Dragon,
  skin_secret_prismatique: Prismatique,
  // rétrocompat
  frame_etoile_rare:      Soleil,
  skin_soleil_alias:      Soleil,
}

interface SkinDecorationProps {
  skinId: string | null | undefined
}

export function SkinDecoration({ skinId }: SkinDecorationProps) {
  if (!skinId) return null
  const Decor = DECORATIONS[skinId]
  if (!Decor) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-card" aria-hidden>
      <Decor />
    </div>
  )
}
