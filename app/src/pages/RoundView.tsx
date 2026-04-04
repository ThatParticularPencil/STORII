import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, AlertCircle, CheckCircle2, Lock, Sparkles } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import VoteBar from '@/components/VoteBar'
import RoundTimer from '@/components/RoundTimer'
import OnChainRecord from '@/components/OnChainRecord'
import {
  DEMO_SUBMISSIONS,
  DEMO_ACTIVE_ROUND,
  DEMO_PIECE,
  DEMO_CHAIN_RECORD,
  DEMO_PARAGRAPHS,
} from '@/utils/demo-data'
import type { DemoSubmission } from '@/types'
import { clsx } from 'clsx'

async function fetchGeminiVoteReaction(paragraphText: string, voteCount: number): Promise<string> {
  const res = await fetch('/api/ai/vote-reaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paragraphText, voteCount }),
  })
  if (!res.ok) throw new Error('Gemini unavailable')
  const data = await res.json()
  return data.reaction as string
}

async function fetchGeminiSealReaction(winningParagraph: string, storyContext: string): Promise<string> {
  const res = await fetch('/api/ai/seal-reaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winningParagraph, storyContext }),
  })
  if (!res.ok) throw new Error('Gemini unavailable')
  const data = await res.json()
  return data.reaction as string
}

type ViewMode = 'submit' | 'vote' | 'sealed'

export default function RoundView() {
  const { pieceId, roundIndex } = useParams()
  const { publicKey } = useWallet()
  const [mode, setMode] = useState<ViewMode>('vote') // default to vote for demo
  const [submissions, setSubmissions] = useState<DemoSubmission[]>(
    DEMO_SUBMISSIONS.map(s => ({ ...s }))
  )
  const [totalVotes, setTotalVotes] = useState(DEMO_ACTIVE_ROUND.totalVotes)
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sealAnimation, setSealAnimation] = useState(false)
  const [showSealRecord, setShowSealRecord] = useState(false)
  const [geminiVoteReaction, setGeminiVoteReaction] = useState<string | null>(null)
  const [geminiSealReaction, setGeminiSealReaction] = useState<string | null>(null)
  const [geminiLoading, setGeminiLoading] = useState(false)
  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length
  const MIN_WORDS = 30
  const MAX_WORDS = 200

  // Simulate live votes coming in
  useEffect(() => {
    if (mode !== 'vote' || votedFor) return
    const interval = setInterval(() => {
      setSubmissions(prev => {
        const idx = Math.floor(Math.random() * prev.length)
        const next = [...prev]
        next[idx] = { ...next[idx], voteCount: next[idx].voteCount + 1 }
        return next
      })
      setTotalVotes(t => t + 1)
    }, 2400)
    return () => clearInterval(interval)
  }, [mode, votedFor])

  const handleVote = async (id: string) => {
    const voted = submissions.find(s => s.id === id)
    setVotedFor(id)
    const newCount = (voted?.voteCount ?? 0) + 1
    setSubmissions(prev =>
      prev.map(s => (s.id === id ? { ...s, voteCount: s.voteCount + 1 } : s))
    )
    setTotalVotes(t => t + 1)

    // Ask Gemini to react to this vote
    if (voted?.content) {
      setGeminiLoading(true)
      setGeminiVoteReaction(null)
      fetchGeminiVoteReaction(voted.content, newCount)
        .then(r => setGeminiVoteReaction(r))
        .catch(() => setGeminiVoteReaction(null))
        .finally(() => setGeminiLoading(false))
    }
  }

  const handleSubmit = async () => {
    if (wordCount < MIN_WORDS || wordCount > MAX_WORDS) return
    setSubmitting(true)
    // Simulate tx
    await new Promise(r => setTimeout(r, 1800))
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => setMode('vote'), 1200)
  }

  const handleSealRound = async () => {
    setSealAnimation(true)
    await new Promise(r => setTimeout(r, 1200))
    setShowSealRecord(true)

    // Ask Gemini to react to the winning paragraph being sealed
    const storyContext = DEMO_PARAGRAPHS.map(p => p.content).join('\n\n')
    if (winningSubmission?.content) {
      fetchGeminiSealReaction(winningSubmission.content, storyContext)
        .then(r => setGeminiSealReaction(r))
        .catch(() => setGeminiSealReaction(null))
    }
  }

  const winningSubmission = [...submissions].sort((a, b) => b.voteCount - a.voteCount)[0]

  return (
    <main className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-xs text-parchment/40 uppercase tracking-widest mb-2">
            {DEMO_PIECE.title}
          </div>
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="font-serif text-3xl text-parchment mb-1">
                Round {Number(roundIndex) + 1}
              </h1>
              <p className="text-parchment/50 text-sm">
                Continue the story — {submissions.length} submissions, {totalVotes.toLocaleString()} votes cast
              </p>
            </div>
            {DEMO_ACTIVE_ROUND.status === 'Voting' && (
              <RoundTimer
                deadline={DEMO_ACTIVE_ROUND.votingDeadline}
                label="Voting closes"
                className="flex-shrink-0"
              />
            )}
          </div>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 mb-8 p-1 bg-ink-50 rounded-xl w-fit">
          {(['submit', 'vote'] as ViewMode[]).map(tab => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={clsx(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                mode === tab
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : 'text-parchment/50 hover:text-parchment/70'
              )}
            >
              {tab === 'submit' ? 'Submit Paragraph' : `Vote (${submissions.length})`}
            </button>
          ))}
        </div>

        {/* Context: last sealed paragraph */}
        <div className="mb-8 p-5 rounded-xl bg-parchment/3 border border-parchment/8">
          <div className="text-xs uppercase tracking-widest text-parchment/35 mb-2">
            Last sealed — Paragraph {DEMO_PARAGRAPHS.length - 1}
          </div>
          <p className="font-serif text-parchment/75 leading-7 text-[15px] line-clamp-3">
            {DEMO_PARAGRAPHS[DEMO_PARAGRAPHS.length - 1].content}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-parchment/30">
            <Lock size={10} />
            <span>by {DEMO_PARAGRAPHS[DEMO_PARAGRAPHS.length - 1].authorHandle}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Submit mode ── */}
          {mode === 'submit' && (
            <motion.div
              key="submit"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
            >
              {!publicKey ? (
                <div className="text-center py-12">
                  <div className="text-parchment/40 mb-4 font-serif">
                    Connect your wallet to submit a paragraph
                  </div>
                  <WalletMultiButton />
                </div>
              ) : submitted ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={28} className="text-green-400" />
                  </div>
                  <h3 className="font-serif text-2xl text-parchment mb-2">Paragraph submitted!</h3>
                  <p className="text-parchment/50 text-sm">
                    Your contribution token has been burned. Switching to voting view…
                  </p>
                </motion.div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label className="block text-xs uppercase tracking-widest text-parchment/50 mb-3">
                      Your paragraph
                    </label>
                    <textarea
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      placeholder="Continue the story in your own words… Pick up exactly where it left off. Match the tone. Make it compelling."
                      rows={8}
                      className="w-full bg-ink-50/50 border border-parchment/15 rounded-xl p-5 text-parchment font-serif text-lg leading-8 placeholder:text-parchment/25 focus:outline-none focus:border-gold/40 resize-none transition-colors"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span
                        className={clsx(
                          'text-xs',
                          wordCount < MIN_WORDS
                            ? 'text-parchment/40'
                            : wordCount > MAX_WORDS
                            ? 'text-red-400'
                            : 'text-green-400'
                        )}
                      >
                        {wordCount} / {MAX_WORDS} words
                        {wordCount < MIN_WORDS && ` (min ${MIN_WORDS})`}
                      </span>
                      <span className="text-xs text-parchment/30">
                        Hash will be stored on Solana · Text stored on Arweave
                      </span>
                    </div>
                  </div>

                  {wordCount < MIN_WORDS && wordCount > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-400/5 border border-amber-400/15 mb-4">
                      <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-400/80">
                        Minimum {MIN_WORDS} words required. Current: {wordCount}.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-parchment/3 border border-parchment/8 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold/60" />
                    <p className="text-xs text-parchment/50">
                      Submitting burns your contribution token for this round. You cannot resubmit.
                      Your text is stored on Arweave; only the SHA-256 hash is written on-chain.
                    </p>
                  </div>

                  <motion.button
                    onClick={handleSubmit}
                    disabled={wordCount < MIN_WORDS || wordCount > MAX_WORDS || submitting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={clsx(
                      'w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all',
                      wordCount >= MIN_WORDS && wordCount <= MAX_WORDS
                        ? 'bg-gold text-ink-900 hover:bg-gold-light'
                        : 'bg-parchment/8 text-parchment/30 cursor-not-allowed'
                    )}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-ink-900/30 border-t-ink-900 rounded-full animate-spin" />
                        Signing transaction…
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Paragraph
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Vote mode ── */}
          {mode === 'vote' && !showSealRecord && (
            <motion.div
              key="vote"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-medium text-parchment/60 uppercase tracking-wider">
                  {votedFor ? 'Votes — Live tally' : 'Choose the next paragraph'}
                </h2>
                <div className="text-xs font-mono text-parchment/40">
                  {totalVotes.toLocaleString()} votes · updating live
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {[...submissions]
                  .sort((a, b) => b.voteCount - a.voteCount)
                  .map((sub, i) => (
                    <VoteBar
                      key={sub.id}
                      submission={sub}
                      totalVotes={totalVotes}
                      isWinning={i === 0}
                      onVote={handleVote}
                      hasVoted={!!votedFor}
                      userVotedFor={votedFor || undefined}
                      showVoteButton
                      index={i}
                    />
                  ))}
              </div>

              {/* Gemini vote reaction */}
              <AnimatePresence>
                {(geminiLoading || geminiVoteReaction) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-6 p-4 rounded-xl border border-gold/20 bg-gold/5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={13} className="text-gold" />
                      <span className="text-xs uppercase tracking-widest text-gold/70 font-medium">
                        Gemini reacts
                      </span>
                    </div>
                    {geminiLoading ? (
                      <div className="flex items-center gap-2 text-parchment/40 text-sm">
                        <div className="w-3 h-3 border border-gold/40 border-t-gold rounded-full animate-spin" />
                        Generating literary reaction…
                      </div>
                    ) : (
                      <p className="text-parchment/80 text-sm leading-relaxed font-serif italic">
                        {geminiVoteReaction}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Creator: close round */}
              {!votedFor && (
                <div className="p-4 rounded-xl bg-parchment/3 border border-parchment/8 text-center">
                  <p className="text-xs text-parchment/40 mb-3">
                    Creator only: close the round once voting deadline passes
                  </p>
                  <motion.button
                    onClick={handleSealRound}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 border border-gold/30 text-gold text-sm px-6 py-2.5 rounded-lg hover:bg-gold/10 transition-all"
                  >
                    <Lock size={14} />
                    Seal Winning Paragraph (Demo)
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Seal animation / Record ── */}
          {showSealRecord && (
            <motion.div
              key="sealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-center py-10 mb-8"
              >
                <div className="inline-flex w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/40 items-center justify-center mb-4 animate-seal-stamp">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M18 4L22 14L33 15.5L25 23L27 34L18 29L9 34L11 23L3 15.5L14 14L18 4Z"
                      fill="rgba(201,168,76,0.2)" stroke="#c9a84c" strokeWidth="1.5" />
                    <path d="M12 18L16 22L24 14" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="font-serif text-3xl text-parchment mb-2">Paragraph sealed.</h2>
                <p className="text-parchment/50 max-w-sm mx-auto text-sm">
                  The winning paragraph has been written to Solana. The author is now a
                  permanent co-author of this piece.
                </p>
                <div className="text-xs font-mono text-gold/50 mt-3">
                  Block {DEMO_CHAIN_RECORD.sealedBlock} · {DEMO_CHAIN_RECORD.sealedAt}
                </div>
              </motion.div>

              {/* Gemini seal reaction */}
              <AnimatePresence>
                {geminiSealReaction && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6 p-5 rounded-xl border border-gold/25 bg-gold/5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-gold" />
                      <span className="text-xs uppercase tracking-widest text-gold/70 font-medium">
                        Gemini — Literary Analysis
                      </span>
                    </div>
                    <p className="text-parchment/85 text-sm leading-relaxed font-serif italic whitespace-pre-line">
                      {geminiSealReaction}
                    </p>
                  </motion.div>
                )}
                {!geminiSealReaction && showSealRecord && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 p-4 rounded-xl border border-gold/15 bg-gold/3 flex items-center gap-3"
                  >
                    <div className="w-4 h-4 border border-gold/40 border-t-gold rounded-full animate-spin flex-shrink-0" />
                    <span className="text-parchment/40 text-xs">Gemini is reading the winning paragraph…</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <OnChainRecord record={DEMO_CHAIN_RECORD} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
