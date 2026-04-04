import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen bg-ink-900 flex flex-col overflow-hidden relative">

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-gold/[0.035] blur-[200px]" />
      </div>

      {/* Background story titles — ghosted texture */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden>
        {AMBIENT.map((title, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.028 + (i % 3) * 0.008 }}
            transition={{ delay: 1 + i * 0.12, duration: 1.5 }}
            className="absolute font-serif text-parchment whitespace-nowrap"
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
          <span className="font-serif text-lg font-semibold text-parchment/70 tracking-tight">Storii</span>
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
            className="text-xs tracking-[0.2em] uppercase text-parchment/30 mb-8 font-sans"
          >
            Collaborative fiction · Sealed on Solana
          </motion.p>

          {/* Main headline */}
          <h1 className="font-serif text-[clamp(2.6rem,6vw,4.5rem)] text-parchment leading-[1.07] tracking-tight mb-6">
            Stories written<br />
            <span className="text-parchment/40">by communities</span>
          </h1>

          {/* Sub */}
          <p className="font-serif text-[1.05rem] text-parchment/35 leading-[1.7] max-w-[38ch] mx-auto mb-12">
            Every paragraph voted on, AI-expanded, and permanently sealed on‑chain.
            No single author controls where it goes.
          </p>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/role')}
            className="group inline-flex items-center gap-2.5 bg-parchment text-ink-900 text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-parchment/90 transition-colors"
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
        className="relative z-10 border-t border-parchment/[0.06] py-4 px-8"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-6 flex-wrap text-[11px] text-parchment/20 font-sans">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2">
              <span className="live-dot scale-75" />
              Stories being written right now
            </span>
            <span className="hidden sm:block">·</span>
            <span className="hidden sm:block">Every paragraph sealed forever</span>
          </div>
          <span className="hidden md:block font-mono opacity-60">
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
        fill="#c084fc"
        opacity="0.65"
      />
      <rect x="5.5" y="9.5" width="7" height="5.5" rx="1" stroke="#c084fc" strokeWidth="1.2" fill="none" opacity="0.75" />
      <path d="M7 9.5 V7 Q9 5 11 7 V9.5" stroke="#c084fc" strokeWidth="1.2" fill="none" opacity="0.75" />
    </svg>
  )
}
