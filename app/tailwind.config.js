/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFBEB',
        paper: '#FFFFFF',
        parchment: '#F5F0E8',
        ink: {
          DEFAULT: '#1A1A17',
          secondary: '#6B6B63',
          tertiary: '#A3A299',
        },
        sage: {
          DEFAULT: '#6B8F71',
          light: '#D4E8D7',
          dark: '#4A6B4F',
        },
        seal: {
          DEFAULT: '#8B6914',
          light: '#F0E6C8',
        },
        straw: '#E5DFD3',
        overlay: 'rgba(26,26,23,0.4)',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['36px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline': ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '1.85', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'label': ['11px', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '400' }],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'seal-stamp': 'sealStamp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'vote-fill': 'voteFill 0.8s ease-out forwards',
        'dot-breathe': 'dotBreathe 4s ease-in-out infinite',
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
        sealStamp: {
          '0%': { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '60%': { transform: 'scale(1.15) rotate(3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        voteFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--vote-width)' },
        },
        dotBreathe: {
          '0%, 100%': { opacity: '0.08' },
          '50%': { opacity: '0.15' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
