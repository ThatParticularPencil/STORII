import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Sun, Moon, Lock, Sparkles } from 'lucide-react'
import { DottedSurface } from '@/components/ui/dotted-surface'
import { useTheme } from '@/context/ThemeContext'

export default function Landing() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()

  return (
    <div className="app-shell landing-shell min-h-screen bg-ink-900 flex flex-col overflow-hidden relative">
      <DottedSurface className="opacity-70" />
      <div className="ambient-dots" aria-hidden />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[16%] left-1/2 -translate-x-1/2 w-[1100px] h-[680px] rounded-full bg-gold/[0.045] blur-[220px]" />
        <div className="absolute -top-20 right-[12%] w-[340px] h-[340px] rounded-full bg-gold-light/[0.06] blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[12%] w-[520px] h-[320px] rounded-full bg-gold/[0.05] blur-[170px]" />
        <div className="absolute bottom-[2%] right-[10%] w-[420px] h-[260px] rounded-full bg-orange-400/[0.06] blur-[160px]" />
      </div>

      {/* Top wordmark + theme toggle */}
      <header className="relative z-10 px-8 pt-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center -translate-y-[2px]">
            <LockQuillIcon />
          </div>
          <span className="font-serif text-lg leading-none font-semibold text-parchment/70 tracking-tight">Storii</span>
        </Link>
        <button
          onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-parchment/10 hover:border-parchment/25 text-parchment/40 hover:text-parchment/70 transition-all duration-200"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </header>

      {/* Hero — the whole screen */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pt-10 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl"
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
          <p className="font-serif text-[1.05rem] text-parchment/35 leading-[1.7] max-w-[38ch] mx-auto mb-10">
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

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.9 }}
            className="mt-14 max-w-4xl mx-auto"
          >
            <div className="relative rounded-[28px] border border-parchment/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] shadow-[0_30px_80px_rgba(0,0,0,0.12)] backdrop-blur-xl overflow-hidden">
              <div className="grid lg:grid-cols-[1.2fr_0.9fr] gap-0">
                <div className="p-6 sm:p-8 text-left border-b lg:border-b-0 lg:border-r border-parchment/8">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.24em] text-gold/60 font-medium mb-1">Live paragraph chain</div>
                      <div className="font-serif text-2xl text-parchment">Community direction becomes canon</div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-[11px] text-parchment/35 font-mono">
                      <span className="live-dot scale-75" />
                      devnet
                    </div>
                  </div>

                  <div className="space-y-4 perspective-[1200px]">
                    <DemoParagraph
                      title="Round 1 · Submitted"
                      body="The observatory loses power just as the summer sky opens. Four strangers decide whether to stay and map what appears next."
                      meta="12 directions · community vote"
                      tone="soft"
                    />
                    <DemoParagraph
                      title="Round 2 · Expanded by AI"
                      body="Gemini picks the leading direction and turns it into a sealed scene, preserving the voice while pushing the narrative forward."
                      meta="winning vote editorialized"
                      tone="strong"
                    />
                    <DemoParagraph
                      title="Round 3 · Locked on-chain"
                      body="Each paragraph is appended to the story ledger, giving the piece a public trail of how the community shaped it."
                      meta="signature appended to Solana"
                      tone="soft"
                    />
                  </div>
                </div>

                <div className="p-6 sm:p-8 text-left">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-full bg-gold/12 border border-gold/20 flex items-center justify-center">
                      <Lock size={13} className="text-gold/80" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-gold/55 font-medium">Solana seal</div>
                      <div className="text-sm text-parchment/55">Canonical record preview</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-parchment/10 bg-ink-900/20 p-4 mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] uppercase tracking-[0.18em] text-parchment/30">Paragraph hash</span>
                      <span className="text-[11px] text-gold/70 font-mono">confirmed</span>
                    </div>
                    <div className="space-y-3">
                      <LedgerRow label="Round" value="03 / 08" />
                      <LedgerRow label="Direction" value="Vote winner" />
                      <LedgerRow label="Model" value="Gemini" />
                      <LedgerRow label="Program" value="Storii devnet" />
                      <LedgerRow label="Signature" value="8m3Q...x2Pa" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-parchment/10 bg-parchment/[0.04] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={13} className="text-gold/70" />
                      <span className="text-sm text-parchment/70">Every round leaves a visible trail</span>
                    </div>
                    <div className="space-y-3">
                      <ProgressLane label="Submissions" width="84%" />
                      <ProgressLane label="Voting" width="63%" />
                      <ProgressLane label="Sealed" width="92%" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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

function DemoParagraph({
  title,
  body,
  meta,
  tone,
}: {
  title: string
  body: string
  meta: string
  tone: 'soft' | 'strong'
}) {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] ${
        tone === 'strong'
          ? 'border-gold/20 bg-[linear-gradient(180deg,rgba(74,222,128,0.12),rgba(255,255,255,0.04))] -rotate-[1deg] translate-x-2'
          : 'border-parchment/10 bg-parchment/[0.035]'
      }`}
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="text-sm font-medium text-parchment/78">{title}</div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-parchment/35">{meta}</div>
      </div>
      <p className="font-serif text-base leading-7 text-parchment/62">{body}</p>
    </div>
  )
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs font-mono">
      <span className="text-parchment/38">{label}</span>
      <span className="text-parchment/70">{value}</span>
    </div>
  )
}

function ProgressLane({ label, width }: { label: string; width: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-parchment/35 mb-1.5">
        <span>{label}</span>
        <span>{width}</span>
      </div>
      <div className="h-2 rounded-full bg-parchment/8 overflow-hidden">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,197,94,0.55),rgba(74,222,128,0.95))]" style={{ width }} />
      </div>
    </div>
  )
}

function LockQuillIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="storii-book-gradient-landing" x1="4.5" y1="3.25" x2="15.5" y2="17.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(249,115,22,0.95)" />
          <stop offset="45%" stopColor="rgba(74,222,128,0.95)" />
          <stop offset="100%" stopColor="rgba(21,128,61,0.95)" />
        </linearGradient>
        <linearGradient id="storii-book-fill-landing" x1="5" y1="3.25" x2="15.25" y2="15.75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(249,115,22,0.18)" />
          <stop offset="55%" stopColor="rgba(74,222,128,0.16)" />
          <stop offset="100%" stopColor="rgba(21,128,61,0.16)" />
        </linearGradient>
      </defs>
      <path
        d="M4.5 4.75C4.5 3.92157 5.17157 3.25 6 3.25H15.5V15.75H6.25C5.2835 15.75 4.5 16.5335 4.5 17.5V4.75Z"
        fill="url(#storii-book-fill-landing)"
      />
      <path
        d="M4.5 4.75C4.5 3.92157 5.17157 3.25 6 3.25H15.5V15.75H6.25C5.2835 15.75 4.5 16.5335 4.5 17.5M4.5 4.75V17.5M4.5 17.5H13.75"
        stroke="url(#storii-book-gradient-landing)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.5 6.5H12.75" stroke="url(#storii-book-gradient-landing)" strokeWidth="1.2" strokeLinecap="round" opacity="0.92" />
      <path d="M7.5 9H12.75" stroke="url(#storii-book-gradient-landing)" strokeWidth="1.2" strokeLinecap="round" opacity="0.74" />
      <path d="M7.5 11.5H11" stroke="url(#storii-book-gradient-landing)" strokeWidth="1.2" strokeLinecap="round" opacity="0.58" />
    </svg>
  )
}
