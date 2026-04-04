import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import TypewriterText from '@/components/TypewriterText'
import OnChainRecord from '@/components/OnChainRecord'
import { DEMO_CHAIN_RECORD, DEMO_PARAGRAPHS, DEMO_SUBMISSIONS, DEMO_ACTIVE_ROUND } from '@/utils/demo-data'
import VoteBar from '@/components/VoteBar'
import type { DemoSubmission } from '@/types'

export default function Landing() {
  const [showRecord, setShowRecord] = useState(false)
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [votes, setVotes] = useState(DEMO_SUBMISSIONS.map(s => ({ ...s })))
  const [totalVotes, setTotalVotes] = useState(DEMO_ACTIVE_ROUND.totalVotes)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.2])

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
    }, 800)
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
    <main className="pt-14">

      {/* ── Hero ── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 py-28 text-center"
      >
        {/* Warm glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-gold/[0.04] blur-[140px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-3xl"
        >
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 mb-10">
            <div className="live-dot" />
            <span className="text-xs text-parchment/40 tracking-wide">
              Stories being written right now
            </span>
          </div>

          {/* Headline — editorial, not product */}
          <h1 className="font-serif text-5xl md:text-7xl text-parchment leading-[1.08] tracking-tight mb-7">
            Your subscribers write<br />
            <em className="text-gold/80 not-italic">the next chapter.</em>
          </h1>

          <p className="text-[17px] text-parchment/50 leading-[1.75] max-w-xl mx-auto mb-11 font-sans">
            Start a story. Your community submits what happens next.
            Everyone votes. The winner is sealed on Solana — credited to its author, forever.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link to="/explore">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 bg-parchment text-ink-900 font-semibold px-7 py-3 rounded-full text-sm hover:bg-parchment/90 transition-colors"
              >
                Read stories
                <ArrowRight size={15} />
              </motion.button>
            </Link>
            <Link to="/new">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 border border-parchment/20 text-parchment/60 font-medium px-7 py-3 rounded-full text-sm hover:border-parchment/40 hover:text-parchment/80 transition-all"
              >
                Start writing
              </motion.button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-px h-10 bg-gradient-to-b from-parchment/20 to-transparent"
          />
        </motion.div>
      </motion.section>

      {/* ── Story in progress ── */}
      <section className="py-20 px-6 border-t border-parchment/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="mb-12 flex items-end justify-between flex-wrap gap-4"
          >
            <div>
              <p className="text-xs text-parchment/35 mb-2 tracking-wide">A story in progress</p>
              <h2 className="font-serif text-3xl text-parchment">
                It Was the Night Before the Product Launch
              </h2>
              <p className="text-sm text-parchment/40 mt-1.5">by @alexchen_builds</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-400">
              <div className="live-dot" />
              <span>Round 4 voting live</span>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr,380px] gap-12">
            {/* Story so far */}
            <div className="space-y-8">
              {DEMO_PARAGRAPHS.map((para, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {i < DEMO_PARAGRAPHS.length - 1 && (
                    <div className="absolute left-0 top-8 bottom-[-2rem] w-px bg-parchment/8" />
                  )}

                  <div className="flex items-start gap-5">
                    <div className={`relative flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-mono mt-0.5 ${
                      i === DEMO_PARAGRAPHS.length - 1
                        ? 'border-gold/50 bg-gold/8 text-gold'
                        : 'border-parchment/15 bg-ink-900 text-parchment/30'
                    }`}>
                      {i + 1}
                    </div>

                    <div className="flex-1 pb-2">
                      <p className="font-serif text-parchment/80 leading-[1.8] text-[16px]">
                        {i === 0
                          ? <TypewriterText text={para.content} speed={12} showCursor={false} />
                          : para.content
                        }
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-parchment/30">
                        <span>{para.authorHandle}</span>
                        {!para.isOpening && (
                          <>
                            <span>·</span>
                            <span>{para.voteCount} votes</span>
                          </>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Lock size={9} />
                          block {para.sealedBlock}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Next up */}
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-7 h-7 rounded-full border border-dashed border-gold/25 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-gold/40 animate-pulse" />
                </div>
                <p className="font-serif italic text-parchment/25 text-[16px] leading-[1.8] pt-0.5">
                  Round 4 — the community is deciding what happens next…
                </p>
              </div>
            </div>

            {/* Live voting panel */}
            <div className="sticky top-20 self-start">
              <div className="flex items-baseline justify-between mb-5">
                <p className="text-sm font-medium text-parchment/70">Round 4 — Vote</p>
                <p className="text-xs text-parchment/30 font-mono">{totalVotes.toLocaleString()} votes cast</p>
              </div>

              <div className="space-y-3">
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
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-xs text-center text-parchment/30"
                >
                  Your vote is cast. On devnet, this is a real Solana transaction.
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works — simple, editorial ── */}
      <section className="py-20 px-6 border-t border-parchment/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <h2 className="font-serif text-3xl text-parchment mb-3">How a round works</h2>
            <p className="text-parchment/45 leading-relaxed">
              Every paragraph in a Storii piece is written by the community, not the creator.
            </p>
          </motion.div>

          <div className="space-y-0">
            {[
              {
                n: '01',
                title: 'Submit a direction',
                body: 'Subscribers write a short direction — up to 50 words — describing where they want the story to go next.',
              },
              {
                n: '02',
                title: 'Community votes',
                body: 'Everyone gets one vote. You can\'t vote for your own idea. The best direction wins.',
              },
              {
                n: '03',
                title: 'AI writes the paragraph',
                body: 'The winning direction is sent to Gemini, which generates a full professional script in the voice of the story.',
              },
              {
                n: '04',
                title: 'Sealed on Solana',
                body: 'The creator reviews and publishes it. The author\'s wallet, vote count, and timestamp are locked on-chain — permanently.',
              },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-8 py-7 border-b border-parchment/6 last:border-0"
              >
                <div className="font-mono text-xs text-gold/35 pt-1 w-6 flex-shrink-0">{step.n}</div>
                <div>
                  <h3 className="font-serif text-lg text-parchment mb-1.5">{step.title}</h3>
                  <p className="text-parchment/45 text-sm leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── On-chain record ── */}
      <section className="py-20 px-6 border-t border-parchment/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="font-serif text-3xl text-parchment mb-3">
              A record that can't be erased
            </h2>
            <p className="text-parchment/45 leading-relaxed max-w-lg">
              When a paragraph is sealed, the contributor's wallet, the vote count, the timestamp —
              all immutable, all public.
            </p>
          </motion.div>

          <button
            onClick={() => setShowRecord(true)}
            className={`mb-8 font-serif text-gold/60 hover:text-gold transition-colors text-lg ${showRecord ? 'hidden' : ''}`}
          >
            See an on-chain record →
          </button>

          {showRecord && <OnChainRecord record={DEMO_CHAIN_RECORD} />}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 border-t border-parchment/5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto"
        >
          <h2 className="font-serif text-4xl text-parchment mb-4 leading-tight">
            Ready to start your first piece?
          </h2>
          <p className="text-parchment/45 mb-9 leading-relaxed">
            Connect Phantom, write a title, and let your community take it from there.
          </p>
          <Link to="/new">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-gold text-ink-900 font-semibold px-9 py-3.5 rounded-full text-sm hover:bg-gold-light transition-colors"
            >
              Start a piece
              <ArrowRight size={15} />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-parchment/5 py-7 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span className="font-serif text-parchment/25 text-sm">Storii</span>
          <p className="text-xs text-parchment/20">
            Built for Solana Hackathon 2026
          </p>
        </div>
      </footer>
    </main>
  )
}
