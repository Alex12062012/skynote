/**
 * Filtre SVG de distorsion pour le vrai Liquid Glass web.
 * feTurbulence génère un bruit fluide, feDisplacementMap déforme le contenu
 * derrière le verre (le starfield ondule comme à travers une lentille).
 * Référencé en CSS via `backdrop-filter: url(#lg-distort)`.
 * Rendu une seule fois dans le layout.
 */
export function LiquidGlassFilter() {
  return (
    <svg aria-hidden className="pointer-events-none absolute h-0 w-0" focusable="false">
      <filter id="lg-distort" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.010 0.013" numOctaves={2} seed={7} result="noise" />
        <feGaussianBlur in="noise" stdDeviation="1.4" result="snoise" />
        <feDisplacementMap in="SourceGraphic" in2="snoise" scale={46} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
