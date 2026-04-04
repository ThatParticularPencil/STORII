/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0d0b10',
          50: '#1c1824',
          100: '#161320',
          900: '#0d0b10',
        },
        parchment: {
          DEFAULT: '#f5f0ff',
          muted: '#c4b8e0',
          dim: '#8878a8',
        },
        gold: {
          DEFAULT: '#c084fc',
          light: '#d8b4fe',
          dark: '#7c3aed',
          glow: 'rgba(192,132,252,0.2)',
        },
        amber: {
          story: '#fb923c',
          glow: 'rgba(251,146,60,0.2)',
        },
        rose: {
          storii: '#f472b6',
          glow: 'rgba(244,114,182,0.2)',
        },
        seal: {
          DEFAULT: '#7c3aed',
          light: '#a855f7',
          glow: 'rgba(124,58,237,0.25)',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'typewriter': 'typewriter 0.05s steps(1) forwards',
        'seal-stamp': 'sealStamp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'vote-fill': 'voteFill 0.8s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(201,168,76,0)' },
        },
        sealStamp: {
          '0%': { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '60%': { transform: 'scale(1.15) rotate(3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        voteFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--vote-width)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
