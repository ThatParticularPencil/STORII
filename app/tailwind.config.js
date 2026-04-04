/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a0907',
          50: '#1a1815',
          100: '#141210',
          900: '#0a0907',
        },
        parchment: {
          DEFAULT: '#f0ead8',
          muted: '#b8ad97',
          dim: '#7a7060',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e0c878',
          dark: '#8a6f2c',
          glow: 'rgba(201,168,76,0.15)',
        },
        seal: {
          DEFAULT: '#8b1a1a',
          light: '#b52222',
          glow: 'rgba(139,26,26,0.2)',
        },
        emerald: {
          story: '#1a4a3a',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
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
