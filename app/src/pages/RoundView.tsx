import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, AlertCircle, CheckCircle2, Lock, Sparkles,
  FileText, Users, Zap, ChevronRight, Ban,
} from 'lucide-react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { sendSolPayment } from '@/utils/solana'
import { useRole } from '@/context/RoleContext'
import { Navigate } from 'react-router-dom'
import VoteBar from '@/components/VoteBar'
import RoundTimer from '@/components/RoundTimer'
import OnChainRecord from '@/components/OnChainRecord'
import {
  DEMO_STAGE1_POOL,
  DEMO_ACTIVE_ROUND,
  DEMO_PIECE,
  DEMO_CHAIN_RECORD,
  DEMO_PARAGRAPHS,
} from '@/utils/demo-data'
import type { DemoSubmission } from '@/types'
import { clsx } from 'clsx'

// ── API ────────────────────────────────────────────────────────────────────────

async function apiGenerateScript(
  winningDirection: string,
  storyContext: string,
  pieceTitle: string
): Promise<string> {
  const res = await fetch('/api/ai/generate-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winningDirection, storyContext, pieceTitle }),
  })
  if (!res.ok) throw new Error('Gemini unavailable')
  return (await res.json()).script as string
}

async function apiVoteReaction(directionText: string, voteCount: number): Promise<string> {
  const res = await fetch('/api/ai/vote-reaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directionText, voteCount }),
  })
  if (!res.ok) throw new Error('unavailable')
  return (await res.json()).reaction as string
}

async function apiSealReaction(script: string, pieceTitle: string): Promise<string> {
  const res = await fetch('/api/ai/seal-reaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sealedScript: script, pieceTitle }),
  })
  if (!res.ok) throw new Error('unavailable')
  return (await res.json()).reaction as string
}

// ── Stage type ─────────────────────────────────────────────────────────────────

type Stage =
  | 'stage1'      // Submission open: submit your 50-word direction
  | 'stage2'      // All directions go to vote (can't vote for your own)
  | 'generating'  // Gemini writing the professional script from winning direction
  | 'review'      // Creator reviews the AI script
  | 'publishing'  // Broadcasting to Solana devnet
  | 'published'   // Sealed on-chain — new paragraph added

// ── Stage progress bar ─────────────────────────────────────────────────────────

function StageBar({ current }: { current: Stage }) {
  const steps = [
    { label: '1  Submit Direction' },
    { label: '2  Vote'            },
    { label: '3  AI Script'       },
    { label: '4  On-Chain'        },
  ]
  const activeIdx = (
    current === 'stage1'     ? 0 :
    current === 'stage2'     ? 1 :
    current === 'generating' || current === 'review' ? 2 :
    3
  )
  return (
    <div className="flex items-center gap-0 mb-10 w-full">
      {steps.map((step, i) => {
        const done = i < activeIdx
        const active = i === activeIdx
        return (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <div className={clsx(
              'flex items-center gap-2 flex-shrink-0 transition-all duration-500',
              done ? 'opacity-100' : active ? 'opacity-100' : 'opacity-30'
            )}>
              <div className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center border text-[11px] font-bold transition-all duration-500',
                done  ? 'bg-gold/20 border-gold/60 text-gold' :
                active ? 'bg-gold/15 border-gold/50 text-gold ring-2 ring-gold/20' :
                         'border-parchment/15 text-parchment/25'
              )}>
                {done ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span className={clsx(
                'text-xs font-medium whitespace-nowrap hidden sm:block',
                active ? 'text-gold' : done ? 'text-parchment/50' : 'text-parchment/25'
              )}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={clsx(
                'flex-1 h-px mx-3 transition-all duration-700',
                done ? 'bg-gold/40' : 'bg-parchment/10'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── VoteBar extended — handles "your own idea" blocking ───────────────────────

function DirectionCard({
  submission,
  totalVotes,
  isWinning,
  isOwn,
  hasVoted,
  votedFor,
  onVote,
  index,
}: {
  submission: DemoSubmission
  totalVotes: number
  isWinning: boolean
  isOwn: boolean
  hasVoted: boolean
  votedFor: string | null
  onVote: (id: string) => void
  index: number
}) {
  const percentage = totalVotes > 0 ? (submission.voteCount / totalVotes) * 100 : 0
  const isVotedFor = votedFor === submission.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className={clsx(
        'rounded-xl border p-5 transition-all duration-300',
        isOwn        ? 'border-parchment/20 bg-parchment/3' :
        isWinning    ? 'border-gold/40 bg-gold/5'            :
        isVotedFor   ? 'border-parchment/20 bg-parchment/5'  :
                       'border-parchment/8 bg-white/[0.02]'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-parchment/35">
            #{String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-xs text-parchment/50">
            by <span className="text-parchment/75 font-medium">{submission.contributorHandle}</span>
          </span>

          {/* Badges */}
          {isOwn && (
            <span className="text-xs bg-parchment/10 text-parchment/50 border border-parchment/15 rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
              <Ban size={9} /> Your idea
            </span>
          )}
          {isWinning && !isOwn && hasVoted && (
            <span className="text-xs bg-gold/20 text-gold border border-gold/30 rounded-full px-2 py-0.5 font-medium animate-pulse">
              Winner
            </span>
          )}
          {isWinning && !isOwn && !hasVoted && (
            <span className="text-xs bg-gold/15 text-gold border border-gold/25 rounded-full px-2 py-0.5 font-medium">
              Leading
            </span>
          )}
        </div>

        {/* Vote count — only visible once voting starts */}
        {(hasVoted || submission.voteCount > 0) && (
          <div className="text-right flex-shrink-0">
            <span className={clsx(
              'text-base font-semibold font-mono tabular-nums',
              isWinning && !isOwn ? 'text-gold' : 'text-parchment/60'
            )}>
              {submission.voteCount.toLocaleString()}
            </span>
            <span className="text-xs text-parchment/35 ml-1">votes</span>
          </div>
        )}
      </div>

      {/* Direction text */}
      <p className="text-parchment/82 leading-6 text-[15px] mb-4">{submission.content}</p>

      {/* Vote bar — shown after user has voted */}
      {hasVoted && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-parchment/35 mb-1.5">
            <span>{percentage.toFixed(1)}%</span>
            <span className="font-mono">{submission.voteCount} / {totalVotes}</span>
          </div>
          <div className="h-1.5 bg-parchment/8 rounded-full overflow-hidden">
            <motion.div
              className={clsx(
                'h-full rounded-full',
                isWinning && !isOwn
                  ? 'bg-gradient-to-r from-gold to-amber-400'
                  : 'bg-gradient-to-r from-parchment/20 to-parchment/35'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, delay: index * 0.08 + 0.2, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Vote button area */}
      {!hasVoted && (
        isOwn ? (
          <div className="w-full h-9 rounded-full border border-parchment/8 text-parchment/20 text-xs text-center flex items-center justify-center gap-1.5">
            <Ban size={10} />
            Can't vote for your own idea
          </div>
        ) : (
          <div>
            <button
              onClick={() => onVote(submission.id)}
              className="w-full h-9 rounded-full border border-gold/35 text-gold text-sm font-medium hover:bg-gold/10 hover:border-gold/60 transition-all duration-200 active:scale-[0.98]"
            >
              Vote for this direction
            </button>
            <p className="text-center text-xs text-parchment/25 mt-1.5">0.025 SOL</p>
          </div>
        )
      )}

      {isVotedFor && (
        <div className="w-full h-9 rounded-full border border-parchment/12 text-parchment/35 text-xs text-center flex items-center justify-center gap-1.5">
          <CheckCircle2 size={11} /> Voted · 0.025 SOL paid
        </div>
      )}
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RoundView() {
  const { roundIndex } = useParams()
  const wallet = useWallet()
  const { publicKey } = wallet
  const { connection } = useConnection()
  // Creators cannot vote — this route is already blocked in App.tsx for creators
  // but guard here too in case of direct URL access
  const { role } = useRole()

  const [stage, setStage] = useState<Stage>('stage1')

  // Stage 1
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mySubmissionId, setMySubmissionId] = useState<string | null>(null)
  const [pool, setPool] = useState([...DEMO_STAGE1_POOL])

  // Stage 2
  const [totalVotes, setTotalVotes] = useState(DEMO_ACTIVE_ROUND.totalVotes)
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [voteReaction, setVoteReaction] = useState<string | null>(null)
  const [voteReactionLoading, setVoteReactionLoading] = useState(false)
  // Voting deadline — creator can only reduce it, never force-close
  const [votingDeadline, setVotingDeadline] = useState(DEMO_ACTIVE_ROUND.votingDeadline)
  const [timeReducing, setTimeReducing] = useState(false)

  // Generation
  const [generatedScript, setGeneratedScript] = useState<string | null>(null)
  const [scriptError, setScriptError] = useState(false)
  const [sealReaction, setSealReaction] = useState<string | null>(null)

  // Publishing
  const [txSig, setTxSig] = useState<string | null>(null)
  const [publishStep, setPublishStep] = useState<string | null>(null)

  // Payment errors
  const [payError, setPayError] = useState<string | null>(null)

  // Hard guard — creators cannot access voting rounds
  if (role === 'creator') {
    return <Navigate to="/dashboard" replace />
  }

  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length
  const MAX_WORDS = 50

  const sortedPool = [...pool].sort((a, b) => b.voteCount - a.voteCount)
  const winningSubmission = sortedPool[0]

  // Auto-resolve voting when the deadline passes — creator cannot force-close, only reduce time
  useEffect(() => {
    if (stage !== 'stage2') return
    const remaining = votingDeadline - Date.now()
    if (remaining <= 0) {
      handleGenerateScript()
      return
    }
    const timer = setTimeout(() => {
      handleGenerateScript()
    }, remaining)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, votingDeadline])

  // Live vote simulation during Stage 2 (only for other people's submissions)
  useEffect(() => {
    if (stage !== 'stage2' || votedFor) return
    const interval = setInterval(() => {
      setPool(prev => {
        const others = prev.filter(s => s.id !== mySubmissionId)
        if (!others.length) return prev
        const target = others[Math.floor(Math.random() * others.length)]
        return prev.map(s => s.id === target.id ? { ...s, voteCount: s.voteCount + 1 } : s)
      })
      setTotalVotes(t => t + 1)
    }, 700)
    return () => clearInterval(interval)
  }, [stage, votedFor, mySubmissionId])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSubmitDirection = async () => {
    if (wordCount < 5 || wordCount > MAX_WORDS || submitting) return
    setSubmitting(true)
    setPayError(null)

    try {
      // Triggers Phantom popup — 0.025 SOL submission fee
      await sendSolPayment(connection, wallet, 0.025)
    } catch (err: any) {
      setPayError(err?.message?.includes('rejected') || err?.message?.includes('cancel')
        ? 'Transaction cancelled.'
        : 'Transaction failed — check your SOL balance and try again.')
      setSubmitting(false)
      return
    }

    const newId = `my-${Date.now()}`
    const newEntry: DemoSubmission = {
      id: newId,
      content: draft,
      contributor: publicKey?.toString().slice(0, 4) + '...' + publicKey?.toString().slice(-4) || 'anon',
      contributorHandle: '@you',
      voteCount: 0,
      percentage: 0,
    }
    setPool(prev => [...prev, newEntry])
    setMySubmissionId(newId)
    setSubmitting(false)
  }

  const handleCloseSubmissions = () => {
    // All directions go straight to vote — no shortlisting
    setStage('stage2')
  }

  const handleVote = async (id: string) => {
    if (id === mySubmissionId) return
    setPayError(null)

    try {
      // Triggers Phantom popup — 0.025 SOL vote fee
      await sendSolPayment(connection, wallet, 0.025)
    } catch (err: any) {
      setPayError(err?.message?.includes('rejected') || err?.message?.includes('cancel')
        ? 'Transaction cancelled.'
        : 'Transaction failed — check your SOL balance and try again.')
      return
    }

    const voted = pool.find(s => s.id === id)
    const newCount = (voted?.voteCount ?? 0) + 1
    setVotedFor(id)
    setPool(prev => prev.map(s => s.id === id ? { ...s, voteCount: newCount } : s))
    setTotalVotes(t => t + 1)

    if (voted?.content) {
      setVoteReactionLoading(true)
      apiVoteReaction(voted.content, newCount)
        .then(r => setVoteReaction(r))
        .catch(() => {})
        .finally(() => setVoteReactionLoading(false))
    }
  }

  const handleGenerateScript = async () => {
    setStage('generating')
    setScriptError(false)
    const storyContext = DEMO_PARAGRAPHS.map(p => p.content).join('\n\n')
    try {
      const script = await apiGenerateScript(
        winningSubmission.content,
        storyContext,
        DEMO_PIECE.title
      )
      setGeneratedScript(script)
      setStage('review')
    } catch {
      setScriptError(true)
      setStage('review')
    }
  }

  const PUBLISH_STEPS = [
    'Hashing script content (SHA-256)…',
    'Uploading to Arweave permanent storage…',
    'Building Solana transaction…',
    'Broadcasting to Solana devnet…',
    'Confirming block…',
  ]

  const handlePublish = async () => {
    setStage('publishing')
    for (const step of PUBLISH_STEPS) {
      setPublishStep(step)
      await new Promise(r => setTimeout(r, 700 + Math.random() * 600))
    }
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'
    setTxSig(Array.from({ length: 88 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
    setPublishStep(null)
    setStage('published')

    if (generatedScript) {
      apiSealReaction(generatedScript, DEMO_PIECE.title)
        .then(r => setSealReaction(r))
        .catch(() => {})
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="text-xs text-parchment/40 uppercase tracking-widest mb-2">{DEMO_PIECE.title}</div>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="font-serif text-3xl text-parchment mb-1">
                Round {Number(roundIndex ?? 3) + 1}
              </h1>
              <p className="text-parchment/50 text-sm">
                {stage === 'stage1'     && `${pool.length} directions submitted · submissions open`}
                {stage === 'stage2'     && `${pool.length} directions · ${totalVotes.toLocaleString()} votes cast · 1 vote per person`}
                {stage === 'generating' && 'Gemini writing the official scene…'}
                {stage === 'review'     && 'Script ready — creator review'}
                {stage === 'publishing' && 'Broadcasting to Solana devnet…'}
                {stage === 'published'  && 'Scene sealed on Solana devnet'}
              </p>
            </div>
            {stage === 'stage2' && !votedFor && (
              <RoundTimer deadline={votingDeadline} label="Voting closes" className="flex-shrink-0" />
            )}
          </div>
        </motion.div>

        <StageBar current={stage} />

        {/* Story context strip */}
        {stage !== 'published' && (
          <div className="mb-8 p-5 rounded-xl bg-parchment/3 border border-parchment/8">
            <div className="text-xs uppercase tracking-widest text-parchment/35 mb-2">
              Story so far — Paragraph {DEMO_PARAGRAPHS.length - 1}
            </div>
            <p className="font-serif text-parchment/75 leading-7 text-[15px] line-clamp-3">
              {DEMO_PARAGRAPHS[DEMO_PARAGRAPHS.length - 1].content}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-parchment/30">
              <Lock size={10} />
              <span>sealed on Solana</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ════════════════════════════════════════════
              STAGE 1 — Submit a direction
          ════════════════════════════════════════════ */}
          {stage === 'stage1' && (
            <motion.div
              key="stage1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Left: submission form */}
                <div className="lg:col-span-3">
                  <div className="p-6 rounded-2xl border border-parchment/12 bg-white/[0.02]">
                    {mySubmissionId ? (
                      // ── Already submitted ──
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-10"
                      >
                        <div className="w-14 h-14 rounded-full bg-green-400/10 border border-green-400/25 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 size={24} className="text-green-400" />
                        </div>
                        <h3 className="font-serif text-xl text-parchment mb-2">Direction submitted</h3>
                        <p className="text-parchment/45 text-sm mb-5 max-w-xs mx-auto">
                          0.025 SOL paid · your direction is on-chain. Once submissions close,
                          you'll vote for someone else's idea (0.025 SOL) — not your own.
                        </p>
                        {/* Show their submitted direction */}
                        <div className="p-4 rounded-xl bg-parchment/5 border border-parchment/10 text-left">
                          <div className="text-xs text-parchment/30 mb-1.5 uppercase tracking-widest">Your direction</div>
                          <p className="text-parchment/65 text-sm italic leading-6">"{draft}"</p>
                        </div>
                      </motion.div>
                    ) : !publicKey ? (
                      <div className="text-center py-10">
                        <p className="text-parchment/40 text-sm mb-4 font-serif">
                          Connect Phantom or Solflare to participate
                        </p>
                        <WalletMultiButton />
                      </div>
                    ) : (
                      <>
                        <h2 className="font-serif text-xl text-parchment mb-1">Submit your direction</h2>
                        <p className="text-parchment/45 text-sm mb-5">
                          In plain language, tell the community where the story should go next.
                          Max {MAX_WORDS} words. You'll get <strong className="text-parchment/70">one vote</strong> to cast on
                          someone else's direction — not your own.
                        </p>

                        <textarea
                          value={draft}
                          onChange={e => setDraft(e.target.value)}
                          placeholder="e.g. Show the junior dev who flagged this bug three weeks ago. His code review comment was dismissed as out of scope. He's still in the room. He hasn't said a word."
                          rows={5}
                          className="w-full bg-ink-50/40 border border-parchment/15 rounded-xl p-4 text-parchment text-base leading-7 placeholder:text-parchment/20 focus:outline-none focus:border-gold/40 resize-none transition-colors mb-3"
                        />

                        <div className="flex items-center justify-between mb-5">
                          <span className={clsx(
                            'text-xs font-mono tabular-nums',
                            wordCount > MAX_WORDS ? 'text-red-400' : wordCount >= 5 ? 'text-green-400' : 'text-parchment/35'
                          )}>
                            {wordCount} / {MAX_WORDS} words
                          </span>
                          <span className="text-xs text-parchment/25">
                            Hash → Solana · Gemini writes the winning scene
                          </span>
                        </div>

                        {wordCount > MAX_WORDS && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-400/5 border border-red-400/15 mb-4 text-xs text-red-400/80">
                            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                            Over {MAX_WORDS} words — keep it concise.
                          </div>
                        )}

                        {payError && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-400/5 border border-red-400/15 mb-4 text-xs text-red-400/80">
                            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                            {payError}
                          </div>
                        )}

                        <div>
                          <motion.button
                            onClick={handleSubmitDirection}
                            disabled={wordCount < 5 || wordCount > MAX_WORDS || submitting}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={clsx(
                              'w-full flex items-center justify-center gap-2 h-11 rounded-full font-medium text-sm transition-all',
                              wordCount >= 5 && wordCount <= MAX_WORDS
                                ? 'bg-gold text-ink-900 hover:brightness-110'
                                : 'bg-parchment/6 text-parchment/25 cursor-not-allowed'
                            )}
                          >
                            {submitting ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-ink-900/30 border-t-ink-900 rounded-full animate-spin" />
                                Signing…
                              </>
                            ) : (
                              <>
                                <Send size={13} />
                                Submit Direction
                              </>
                            )}
                          </motion.button>
                          {!submitting && wordCount >= 5 && wordCount <= MAX_WORDS && (
                            <p className="text-center text-xs text-parchment/25 mt-2">0.025 SOL + gas fee</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: pool info + creator close button */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Counter */}
                  <div className="p-5 rounded-2xl border border-parchment/12 bg-white/[0.02]">
                    <div className="text-xs uppercase tracking-widest text-parchment/35 mb-2">Submissions</div>
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-4xl font-mono font-bold text-parchment">{pool.length}</span>
                      <span className="text-parchment/35 text-sm mb-1">/ {DEMO_ACTIVE_ROUND.maxSubmissions} max</span>
                    </div>
                    <div className="h-1.5 bg-parchment/8 rounded-full overflow-hidden mt-2">
                      <motion.div
                        className="h-full bg-gradient-to-r from-gold/50 to-gold rounded-full"
                        animate={{ width: `${Math.min((pool.length / DEMO_ACTIVE_ROUND.maxSubmissions) * 100, 100)}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>

                  {/* Rule callout */}
                  <div className="p-4 rounded-xl border border-parchment/10 bg-parchment/3 space-y-2">
                    <div className="text-xs uppercase tracking-widest text-parchment/35 mb-2">How it works</div>
                    {[
                      'Submit your direction · 0.025 SOL + gas',
                      'Submissions close → all directions go to vote',
                      'You get 1 vote (0.025 SOL) — for someone else\'s idea only',
                      'Winner → Gemini writes the full scene',
                      'Creator publishes to Solana devnet',
                    ].map((rule, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-parchment/50">
                        <span className="text-gold/60 font-mono mt-0.5 flex-shrink-0">{i + 1}.</span>
                        {rule}
                      </div>
                    ))}
                  </div>

                  {/* Submission info — no creator close */}
                  <div className="p-4 rounded-xl border border-parchment/10 bg-parchment/[0.02] text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Lock size={11} className="text-parchment/25" />
                      <p className="text-xs text-parchment/30">Submissions close automatically</p>
                    </div>
                    <p className="text-xs text-parchment/20 leading-5">
                      The window is set on-chain. Once it closes, voting opens for everyone.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════
              STAGE 2 — Community votes (no own-idea voting)
          ════════════════════════════════════════════ */}
          {stage === 'stage2' && (
            <motion.div
              key="stage2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {/* Rule banner */}
              <div className={clsx(
                'flex items-start gap-3 p-4 rounded-xl border mb-6 transition-all',
                votedFor
                  ? 'border-green-400/20 bg-green-400/5'
                  : 'border-gold/20 bg-gold/5'
              )}>
                {votedFor
                  ? <CheckCircle2 size={15} className="text-green-400 mt-0.5 flex-shrink-0" />
                  : <Users size={15} className="text-gold mt-0.5 flex-shrink-0" />
                }
                <div>
                  <p className={clsx('text-sm font-medium', votedFor ? 'text-green-400' : 'text-gold')}>
                    {votedFor ? 'Vote cast' : 'You have 1 vote — cast it for someone else\'s idea'}
                  </p>
                  <p className="text-parchment/45 text-xs mt-0.5">
                    {votedFor
                      ? `You voted. ${totalVotes.toLocaleString()} votes total.`
                      : `${pool.length} directions competing · you cannot vote for your own`
                    }
                  </p>
                </div>
              </div>

              {/* Payment error */}
              {payError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-400/5 border border-red-400/15 mb-5 text-xs text-red-400/80">
                  <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                  {payError}
                </div>
              )}

              {/* Direction cards */}
              <div className="space-y-4 mb-8">
                {sortedPool.map((sub, i) => (
                  <DirectionCard
                    key={sub.id}
                    submission={sub}
                    totalVotes={totalVotes}
                    isWinning={i === 0}
                    isOwn={sub.id === mySubmissionId}
                    hasVoted={!!votedFor}
                    votedFor={votedFor}
                    onVote={handleVote}
                    index={i}
                  />
                ))}
              </div>

              {/* Gemini vote reaction */}
              <AnimatePresence>
                {(voteReactionLoading || voteReaction) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-6 p-4 rounded-xl border border-gold/20 bg-gold/5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-gold" />
                      <span className="text-xs uppercase tracking-widest text-gold/70 font-medium">Gemini reacts</span>
                    </div>
                    {voteReactionLoading
                      ? <div className="flex items-center gap-2 text-parchment/40 text-sm">
                          <div className="w-3 h-3 border border-gold/40 border-t-gold rounded-full animate-spin" />
                          Reading the direction…
                        </div>
                      : <p className="text-parchment/80 text-sm leading-relaxed font-serif italic">{voteReaction}</p>
                    }
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Creator panel — reduce time only, cannot force-close */}
              <div className="p-5 rounded-xl border border-parchment/10 bg-parchment/[0.02]">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={12} className="text-parchment/30" />
                  <p className="text-xs font-medium text-parchment/50">Creator controls</p>
                </div>
                <p className="text-xs text-parchment/30 mb-4 leading-5">
                  Voting cannot be force-closed once live. You can only shorten the remaining time.
                  The vote auto-resolves when the timer hits zero.
                </p>

                {winningSubmission && (
                  <div className="mb-4 p-3 rounded-lg bg-parchment/3 border border-parchment/8">
                    <span className="text-xs text-parchment/30">Currently leading</span>
                    <p className="text-parchment/55 text-xs mt-1 italic line-clamp-2">
                      "{winningSubmission.content}"
                    </p>
                    <span className="text-xs text-parchment/25 mt-1 block">{winningSubmission.voteCount} votes</span>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-parchment/35 flex-shrink-0">Reduce time by:</span>
                  {[
                    { label: '−5 min',  ms: 5  * 60 * 1000 },
                    { label: '−30 min', ms: 30 * 60 * 1000 },
                    { label: '−1 hr',   ms: 60 * 60 * 1000 },
                    { label: '−6 hr',   ms: 6  * 60 * 60 * 1000 },
                  ].map(({ label, ms }) => (
                    <button
                      key={label}
                      disabled={timeReducing}
                      onClick={() => {
                        setVotingDeadline(prev => Math.max(Date.now() + 60_000, prev - ms))
                      }}
                      className="h-7 px-3 rounded-full text-xs border border-parchment/15 text-parchment/45 hover:border-parchment/30 hover:text-parchment/70 transition-all"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════
              GENERATING
          ════════════════════════════════════════════ */}
          {stage === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16"
            >
              <div className="max-w-lg mx-auto text-center">
                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={24} className="text-gold animate-pulse" />
                </div>
                <h2 className="font-serif text-2xl text-parchment mb-3">Gemini is writing the scene</h2>
                <p className="text-parchment/40 text-sm mb-8">
                  The community's winning direction is being turned into a professional TV drama scene.
                </p>
                <div className="p-4 rounded-xl border border-gold/20 bg-gold/5 mb-8 text-left">
                  <div className="text-xs text-gold/60 uppercase tracking-widest mb-2">Winning direction</div>
                  <p className="text-parchment/75 text-sm italic">"{winningSubmission?.content}"</p>
                </div>
                <div className="space-y-2.5 text-left">
                  {[75, 90, 65, 85, 70, 80, 60].map((w, i) => (
                    <div key={i} className="h-3 bg-parchment/8 rounded-full animate-pulse"
                      style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════
              REVIEW — Creator approves script
          ════════════════════════════════════════════ */}
          {stage === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <div className="mb-5 p-4 rounded-xl border border-gold/20 bg-gold/5 flex items-start gap-3">
                <CheckCircle2 size={14} className="text-gold mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gold/60 uppercase tracking-widest mb-1">Vote winner</div>
                  <p className="text-parchment/75 text-sm italic">"{winningSubmission?.content}"</p>
                  <p className="text-parchment/30 text-xs mt-1">{winningSubmission?.contributorHandle} · {winningSubmission?.voteCount} votes</p>
                </div>
              </div>

              <div className="rounded-2xl border border-parchment/12 overflow-hidden mb-6">
                <div className="flex items-center gap-3 px-5 py-4 bg-parchment/5 border-b border-parchment/8">
                  <Sparkles size={14} className="text-gold" />
                  <span className="text-sm font-medium text-parchment/80">AI Generated Scene</span>
                  {generatedScript && <span className="text-xs bg-green-400/15 text-green-400 border border-green-400/25 rounded-full px-2 py-0.5 ml-auto">Ready</span>}
                </div>
                <div className="p-6">
                  {scriptError ? (
                    <div className="text-center py-8">
                      <p className="text-parchment/40 text-sm mb-3">Add GEMINI_API_KEY to backend/.env to enable script generation.</p>
                      <button onClick={handleGenerateScript} className="text-gold text-sm border border-gold/35 h-9 px-5 rounded-full hover:bg-gold/10 transition-all">Retry</button>
                    </div>
                  ) : (
                    <pre className="font-mono text-parchment/85 text-sm leading-7 whitespace-pre-wrap">{generatedScript}</pre>
                  )}
                </div>
              </div>

              {generatedScript && (
                <>
                  <div className="p-4 rounded-xl border border-parchment/10 bg-parchment/3 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={13} className="text-parchment/40" />
                      <span className="text-xs uppercase tracking-widest text-parchment/35">What gets published</span>
                    </div>
                    <ul className="space-y-1.5">
                      {[
                        'SHA-256 of this script → written to Solana devnet',
                        'Full script → Arweave permanent storage',
                        'Winning direction contributor → on-chain co-author credit',
                        'Vote tally → sealed alongside the paragraph',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-parchment/45">
                          <ChevronRight size={10} className="mt-0.5 text-gold/50 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <motion.button
                    onClick={handlePublish}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-full bg-gold text-ink-900 font-medium text-sm hover:brightness-110 transition-all"
                  >
                    <Zap size={14} />
                    Publish to Solana Devnet
                  </motion.button>
                </>
              )}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════
              PUBLISHING
          ════════════════════════════════════════════ */}
          {stage === 'publishing' && (
            <motion.div
              key="publishing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16"
            >
              <div className="max-w-sm mx-auto text-center">
                <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center mx-auto mb-6">
                  <Zap size={24} className="text-gold" />
                </div>
                <h2 className="font-serif text-2xl text-parchment mb-8">Publishing to devnet</h2>
                <div className="space-y-3 text-left">
                  {PUBLISH_STEPS.map((step, i) => {
                    const currentIdx = PUBLISH_STEPS.indexOf(publishStep ?? '')
                    const isDone = currentIdx > i
                    const isCurrent = currentIdx === i
                    return (
                      <div key={i} className={clsx(
                        'flex items-center gap-3 text-sm transition-all duration-300',
                        isDone ? 'text-parchment/45' : isCurrent ? 'text-parchment/90' : 'text-parchment/20'
                      )}>
                        {isDone
                          ? <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                          : isCurrent
                          ? <div className="w-3.5 h-3.5 border border-gold/60 border-t-gold rounded-full animate-spin flex-shrink-0" />
                          : <div className="w-3.5 h-3.5 rounded-full border border-parchment/15 flex-shrink-0" />
                        }
                        {step}
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════
              PUBLISHED
          ════════════════════════════════════════════ */}
          {stage === 'published' && (
            <motion.div key="published" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
                <h2 className="font-serif text-3xl text-parchment mb-2">Scene published.</h2>
                <p className="text-parchment/50 max-w-sm mx-auto text-sm">
                  Community direction → Gemini script → Solana devnet. The winning contributor
                  is permanently credited as co-author.
                </p>
                {txSig && (
                  <div className="mt-4 px-4 py-2 rounded-lg bg-parchment/5 border border-parchment/10 inline-block">
                    <span className="text-xs text-parchment/30 mr-2">tx</span>
                    <span className="text-xs font-mono text-parchment/60">{txSig.slice(0, 20)}…{txSig.slice(-8)}</span>
                  </div>
                )}
              </motion.div>

              <AnimatePresence>
                {sealReaction ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-5 rounded-xl border border-gold/25 bg-gold/5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={13} className="text-gold" />
                      <span className="text-xs uppercase tracking-widest text-gold/70 font-medium">Gemini — Editorial Note</span>
                    </div>
                    <p className="text-parchment/80 text-sm leading-relaxed font-serif italic">{sealReaction}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 p-4 rounded-xl border border-gold/10 flex items-center gap-3"
                  >
                    <div className="w-4 h-4 border border-gold/40 border-t-gold rounded-full animate-spin flex-shrink-0" />
                    <span className="text-parchment/30 text-xs">Gemini writing editorial note…</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {generatedScript && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 p-6 rounded-2xl border border-parchment/12 bg-parchment/3"
                >
                  <div className="text-xs uppercase tracking-widest text-parchment/30 mb-4 flex items-center gap-2">
                    <Sparkles size={10} className="text-gold/50" />
                    Published scene · Paragraph {DEMO_PARAGRAPHS.length}
                  </div>
                  <pre className="font-mono text-parchment/82 text-sm leading-7 whitespace-pre-wrap">{generatedScript}</pre>
                </motion.div>
              )}

              <OnChainRecord record={DEMO_CHAIN_RECORD} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}
