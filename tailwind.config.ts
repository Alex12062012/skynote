import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'sky-bg': '#EFF6FF', 'sky-surface': '#FFFFFF', 'sky-surface-2': '#F8FAFF',
        'sky-border': '#E2EEFF', 'sky-border-strong': '#BFDBFE', 'sky-cloud': '#DBEAFE',
        'night-bg': '#060D1A', 'night-surface': '#0D1B2E', 'night-surface-2': '#111F35',
        'night-border': '#1E3A5F', 'night-border-strong': '#2563EB', 'night-cloud': '#1E3A5F',
        'brand': '#2563EB', 'brand-hover': '#1D4ED8', 'brand-soft': '#DBEAFE',
        'brand-dark': '#60A5FA', 'brand-dark-hover': '#93C5FD', 'brand-dark-soft': '#1E3A5F',
        'text-main': '#0F172A', 'text-secondary': '#475569', 'text-tertiary': '#94A3B8',
        'text-dark-main': '#F0F6FF', 'text-dark-secondary': '#94A3B8', 'text-dark-tertiary': '#475569',
        'success': '#059669', 'success-soft': '#D1FAE5', 'success-dark': '#34D399',
        'warning': '#D97706', 'error': '#DC2626',
      },
      fontFamily: {
        display: ['var(--font-bricolage)', 'system-ui', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { 'input': '12px', 'card': '18px', 'card-sm': '14px', 'card-login': '22px', 'pill': '999px' },
      boxShadow: {
        'card': '0 1px 3px rgba(15,23,42,0.04), 0 4px 14px rgba(37,99,235,0.06)',
        'card-dark': '0 2px 16px rgba(0,0,0,0.4), 0 0 1px rgba(96,165,250,0.1)',
        'card-hover': '0 4px 20px rgba(37,99,235,0.12), 0 1px 3px rgba(15,23,42,0.06)',
        'btn': '0 2px 8px rgba(37,99,235,0.35), 0 1px 2px rgba(37,99,235,0.2)',
        'btn-hover': '0 4px 16px rgba(37,99,235,0.4)',
        'coin': '0 8px 24px rgba(37,99,235,0.45)',
        'coin-dark': '0 8px 32px rgba(96,165,250,0.6)',
        'focus': '0 0 0 3px rgba(37,99,235,0.15)',
        'glow': '0 0 20px rgba(37,99,235,0.15)',
        'glow-dark': '0 0 30px rgba(96,165,250,0.12)',
      },
      keyframes: {
        'cloud-drift': { '0%,100%': { transform: 'translateX(0px)' }, '50%': { transform: 'translateX(20px)' } },
        'star-twinkle': { '0%,100%': { opacity: '0.3' }, '50%': { opacity: '0.9' } },
        'coin-pulse': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.3)' } },
        'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '60%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'float-up': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-80px)', opacity: '0' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'cloud-drift': 'cloud-drift 30s ease-in-out infinite',
        'cloud-drift-slow': 'cloud-drift 40s ease-in-out infinite reverse',
        'star-twinkle': 'star-twinkle 3s ease-in-out infinite',
        'coin-pulse': 'coin-pulse 0.4s ease-in-out',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fade-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'float-up': 'float-up 1s ease-out forwards',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
