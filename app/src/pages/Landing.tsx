import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, Zap, Users } from 'lucide-react'
import TypewriterText from '@/components/TypewriterText'
import OnChainRecord from '@/components/OnChainRecord'
import { DEMO_CHAIN_RECORD, DEMO_PARAGRAPHS, DEMO_SUBMISSIONS, DEMO_ACTIVE_ROUND } from '@/utils/demo-data'
import VoteBar from '@/components/VoteBar'
import type { DemoSubmission } from '@/types'

const OPENING_LINE =
  "It was the night before the product launch and everything was about to go wrong…"

export default function Landing() {
  const [showRecord, setShowRecord] = useState(false)
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [votes, setVotes] = useState(DEMO_SUBMISSIONS.map(s => ({ ...s })))
  const [totalVotes, setTotalVotes] = useState(DEMO_ACTIVE_ROUND.totalVotes)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, -80])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3])

  // Simulate live voting in the demo
  useEffect(() => {
    if (votedFor) return
    const interval = setInterval(() => {
      setVotes(prev => {
        const idx = Math.floor(Math.random() * prev.length)
        const next = [...prev]
        next[idx] = { ...next[idx], voteCount: next[idx].voteCount + 1 }
        return next
      })
      setTotalVotes(t => t + 1)
    }, 2800)
    return () => clearInterval(interval)
  }, [votedFor])

  const handleVote = (id: string) => {
    setVotedFor(id)
    setVotes(prev =>
      prev.map(s => s.id === id ? { ...s, voteCount: s.voteCount + 1 } : s)
    )
    setTotalVotes(t => t + 1)
  }

  return (
    <main className="pt-16">
      {/* ── Hero ── */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/4 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-seal/5 blur-[100px]" />
          {/* Faint ruled lines */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-parchment/[0.02]"
              style={{ top: `${8 + i * 7}%` }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative max-w-4xl"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/8 px-4 py-1.5 mb-8">
            <div className="live-dot" />
            <span className="text-xs text-gold font-medium tracking-wide">
              Built for Solana · Hackathon 2026
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold text-parchment leading-none tracking-tight mb-6">
            Write together.
            <br />
            <span className="gradient-text">Sealed forever.</span>
          </h1>

          <p className="text-xl text-parchment/60 leading-relaxed max-w-2xl mx-auto mb-12 font-serif italic">
            A creator starts the story. Their subscribers write the next paragraph.
            The community votes. The winner is locked on Solana — permanently, immutably, yours.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/explore">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-gold text-ink-900 font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-gold-light transition-colors"
              >
                Explore Pieces
                <ArrowRight size={18} />
              </motion.button>
            </Link>
            <Link to="/new">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 border border-parchment/20 text-parchment font-medium px-8 py-3.5 rounded-xl text-base hover:border-parchment/40 hover:bg-parchment/5 transition-all"
              >
                Start a Piece
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-parchment/30">Scroll to see the demo</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-8 bg-gradient-to-b from-parchment/20 to-transparent"
          />
        </motion.div>
      </motion.section>

      {/* ── Live Demo Section ── */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="text-xs uppercase tracking-widest text-gold/60 mb-4">Live Demo</div>
            <h2 className="font-serif text-4xl text-parchment mb-4">
              Watch a round in progress
            </h2>
            <p className="text-parchment/50 max-w-lg mx-auto">
              The story below is actively being voted on. Every vote you see is simulated —
              but on devnet, it's a real Solana transaction.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr,420px] gap-10">
            {/* Left: The story so far */}
            <div>
              <div className="glass rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-serif text-xl text-parchment">
                      It Was the Night Before the Product Launch
                    </h3>
                    <p className="text-xs text-parchment/40 mt-1">by @alexchen_builds · Round 4 of ?</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="live-dot" />
                    <span>Voting live</span>
                  </div>
                </div>

                {/* Sealed paragraphs */}
                <div className="space-y-6">
                  {DEMO_PARAGRAPHS.map((para, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15, duration: 0.5 }}
                      className={`relative pl-5 ${i < DEMO_PARAGRAPHS.length - 1 ? 'border-l border-parchment/10' : 'border-l border-gold/20'}`}
                    >
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border bg-ink-900 flex items-center justify-center"
                        style={{ borderColor: i < DEMO_PARAGRAPHS.length - 1 ? 'rgba(240,234,216,0.15)' : 'rgba(201,168,76,0.4)' }}
                      >
                        {i === DEMO_PARAGRAPHS.length - 1 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                        )}
                      </div>
                      <p className="font-serif text-parchment/85 leading-8 text-[15px]">
                        {i === 0 ? (
                          <TypewriterText
                            text={para.content}
                            speed={15}
                            showCursor={false}
                          />
                        ) : para.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-parchment/35">— {para.authorHandle}</span>
                        {!para.isOpening && (
                          <>
                            <span className="text-parchment/20">·</span>
                            <span className="text-xs text-parchment/30">{para.voteCount} votes</span>
                          </>
                        )}
                        <span className="text-parchment/20">·</span>
                        <div className="flex items-center gap-1 text-xs text-parchment/25">
                          <Lock size={9} />
                          <span>Block {para.sealedBlock}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Next paragraph indicator */}
                <div className="mt-6 pl-5 border-l border-dashed border-gold/30">
                  <div className="text-xs text-gold/50 italic font-serif">
                    Round 4 submissions are being voted on now…
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live voting */}
            <div>
              <div className="sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-parchment/70 uppercase tracking-wider">
                    Round 4 — Voting
                  </h3>
                  <div className="text-xs font-mono text-parchment/40">
                    {totalVotes.toLocaleString()} total votes
                  </div>
                </div>

                <div className="space-y-4">
                  {votes
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((sub, i) => (
                      <VoteBar
                        key={sub.id}
                        submission={sub as DemoSubmission}
                        totalVotes={totalVotes}
                        isWinning={i === 0}
                        onVote={handleVote}
                        hasVoted={!!votedFor}
                        userVotedFor={votedFor || undefined}
                        index={i}
                      />
                    ))}
                </div>

                {votedFor && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-green-400/5 border border-green-400/20 text-center"
                  >
                    <p className="text-xs text-green-400">
                      Vote cast! In production, this burns a vote token on Solana.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── On-chain Record Section ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-gold/[0.02]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="text-xs uppercase tracking-widest text-gold/60 mb-4">Permanent Proof</div>
            <h2 className="font-serif text-4xl text-parchment mb-4">
              The record that can't be erased
            </h2>
            <p className="text-parchment/50 max-w-lg mx-auto">
              When a paragraph wins, it's sealed on Solana. The contributor's wallet,
              the vote count, the timestamp — all immutable, all public.
            </p>
          </motion.div>

          <motion.button
            onClick={() => setShowRecord(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full mb-8 py-4 rounded-xl border font-serif text-lg transition-all duration-300 ${
              showRecord
                ? 'hidden'
                : 'border-gold/30 bg-gold/5 text-gold hover:bg-gold/10'
            }`}
          >
            Reveal On-Chain Record →
          </motion.button>

          {showRecord && (
            <OnChainRecord record={DEMO_CHAIN_RECORD} />
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-4xl text-parchment mb-4">
              Designed for story, built on Solana
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass rounded-2xl p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 text-gold">
                  {feat.icon}
                </div>
                <h3 className="font-serif text-lg text-parchment mb-2">{feat.title}</h3>
                <p className="text-sm text-parchment/50 leading-relaxed">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 border-t border-parchment/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-parchment">How a round works</h2>
          </div>
          <div className="grid md:grid-cols-5 gap-4 items-start">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-ink-100 border border-parchment/15 text-parchment/60 font-mono text-sm mb-3">
                  {i + 1}
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute left-full top-1/2 w-full border-t border-dashed border-parchment/15" />
                  )}
                </div>
                <div className="text-sm font-medium text-parchment/80 mb-1">{step.title}</div>
                <div className="text-xs text-parchment/40 leading-relaxed">{step.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto"
        >
          <h2 className="font-serif text-4xl text-parchment mb-4">
            Start your first piece tonight.
          </h2>
          <p className="text-parchment/50 mb-8">
            Connect your Phantom wallet. Write the opening line. Let the world write the rest.
          </p>
          <Link to="/new">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 bg-gold text-ink-900 font-semibold px-10 py-4 rounded-xl text-lg hover:bg-gold-light transition-colors animate-pulse-gold"
            >
              Create a Piece
              <ArrowRight size={20} />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-parchment/5 py-8 px-6 text-center">
        <p className="text-xs text-parchment/25">
          Built for the Solana Hackathon 2026 — Best Use of Solana track ·{' '}
          <a href="https://solana.com" className="hover:text-parchment/50 transition-colors" target="_blank" rel="noopener noreferrer">
            solana.com
          </a>
        </p>
      </footer>
    </main>
  )
}

const FEATURES = [
  {
    icon: <Lock size={18} />,
    title: 'Immutable authorship',
    description:
      'Every winning paragraph is sealed on-chain with the contributor\'s wallet, vote count, and timestamp. No server can alter or delete it.',
  },
  {
    icon: <Zap size={18} />,
    title: '400ms finality',
    description:
      'Votes confirm in under a second on Solana. Live vote tallies update in real time as the community weighs in.',
  },
  {
    icon: <Users size={18} />,
    title: 'Tiered participation',
    description:
      'Creators control who submits and who votes. Inner Circle writes. Community votes. Readers follow the story unfold.',
  },
]

const STEPS = [
  { title: 'Creator opens round', description: 'Sets submission window, eligible tiers, and optional guidance note.' },
  { title: 'Tokens airdropped', description: 'Smart contract issues contribution & vote tokens to eligible wallets.' },
  { title: 'Subscribers submit', description: 'Tier 1 submits their paragraph. Burns a contribution token.' },
  { title: 'Community votes', description: 'All eligible subscribers vote. Live tally shifts in real time.' },
  { title: 'Winner sealed', description: 'Winning paragraph written to Solana forever. Author credited on-chain.' },
]
