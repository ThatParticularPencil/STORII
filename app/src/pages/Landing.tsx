import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import DotPattern from '@/components/DotPattern'

// Story titles shown as ambient background texture
const AMBIENT = [
  'It Was the Night Before the Product Launch',
  'The Last Summer at the Observatory',
  'Protocol Sigma — A Mission That Wasn\'t',
  'Twelve Letters to the City',
  'How to Build a Company You\'ll Eventually Regret',
  'The Observatory Notes',
  'Things We Left in the Server Room',
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-canvas flex flex-col overflow-hidden relative">
      <DotPattern />

      {/* Ambient story titles — ghosted texture */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden style={{ zIndex: 1 }}>
        {AMBIENT.map((title, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.06 + (i % 3) * 0.02 }}
            transition={{ delay: 1 + i * 0.12, duration: 1.5 }}
            className="absolute font-serif text-ink whitespace-nowrap"
            style={{
              top:       `${8 + i * 13}%`,
              left:      `${i % 2 === 0 ? -1 : 2}%`,
              fontSize:  `clamp(0.75rem, 1.1vw, 1rem)`,
              transform: `rotate(${-0.2 + (i % 4) * 0.15}deg)`,
              letterSpacing: '0.01em',
            }}
          >
            {title}
          </motion.p>
        ))}
      </div>

      {/* Top wordmark */}
      <header className="relative z-10 px-8 pt-8">
        <div className="flex items-center gap-2">
          <LockQuillIcon />
          <span className="font-mono font-bold text-lg text-ink tracking-tight">Storii</span>
        </div>
      </header>

      {/* Hero — the whole screen */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-label uppercase tracking-[0.2em] text-ink-tertiary mb-10 font-mono"
          >
            Collaborative fiction · Sealed on Solana
          </motion.p>

          {/* Main headline */}
          <h1 className="font-mono font-bold text-[clamp(2.6rem,6vw,4.5rem)] text-ink leading-[1.07] tracking-[-0.02em] mb-8">
            Stories written<br />
            <span className="text-sage">by communities</span>
          </h1>

          {/* Sub */}
          <p className="font-serif text-[1.1rem] text-ink-secondary leading-[1.7] max-w-[42ch] mx-auto mb-12">
            Every paragraph voted on, AI-expanded, and permanently sealed on‑chain.
            No single author controls where it goes.
          </p>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/role')}
            className="group inline-flex items-center gap-2.5 bg-sage text-white font-mono font-bold text-sm px-8 py-3.5 rounded-[8px] hover:bg-sage-dark transition-colors"
          >
            Choose your role
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-150" />
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom strip — live signal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.9 }}
        className="relative z-10 border-t border-straw py-4 px-8"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-6 flex-wrap text-[11px] text-ink-tertiary font-mono">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2">
              <span className="live-dot scale-75" />
              Stories being written right now
            </span>
            <span className="hidden sm:block">·</span>
            <span className="hidden sm:block">Every paragraph sealed forever</span>
          </div>
          <span className="hidden md:block text-seal">
            ahWw6JRQ… · devnet
          </span>
        </div>
      </motion.div>
    </div>
  )
}

function LockQuillIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path
        d="M12 4C13.5 5.5, 14 9, 9 12 L7.5 16 L7 14 C5 15, 4 14.5, 3.5 12.5 C6.5 11.5, 10 6.5, 12 4Z"
        fill="#6B8F71"
        opacity="0.85"
      />
      <rect x="5.5" y="9.5" width="7" height="5.5" rx="1" stroke="#6B8F71" strokeWidth="1.2" fill="none" />
      <path d="M7 9.5 V7 Q9 5 11 7 V9.5" stroke="#6B8F71" strokeWidth="1.2" fill="none" />
    </svg>
  )
}
