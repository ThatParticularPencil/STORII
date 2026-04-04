import { useState, useEffect, useRef } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, AlertCircle, CheckCircle2, Lock, Sparkles,
  Users, Zap, Ban, Loader2, Clock, Trophy,
} from 'lucide-react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { sendSolPayment } from '@/utils/solana'
import { useRole } from '@/context/RoleContext'
import RoundTimer from '@/components/RoundTimer'
import OnChainRecord from '@/components/OnChainRecord'
import { DEMO_CHAIN_RECORD } from '@/utils/demo-data'
import { getRoundLabel } from '@/pages/NewPiece'
import { clsx } from 'clsx'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

// ── API helpers ────────────────────────────────────────────────────────────────


async function apiVoteReaction(directionText: string, voteCount: number): Promise<string> {
  const res = await fetch('/api/ai/vote-reaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directionText, voteCount }),
  })
  if (!res.ok) throw new Error('unavailable')
  return (await res.json()).reaction as string
}

// ── Countdown banner ───────────────────────────────────────────────────────────

function CountdownBanner({ deadline, label, color = 'gold' }: { deadline: number; label: string; color?: 'gold' | 'green' | 'amber' }) {
  const [ms, setMs] = useState(() => Math.max(0, deadline - Date.now()))

  useEffect(() => {
    setMs(Math.max(0, deadline - Date.now()))
  }, [deadline])

  useEffect(() => {
    if (ms <= 0) return
    const id = setInterval(() => {
      const next = Math.max(0, deadline - Date.now())
      setMs(next)
      if (next <= 0) clearInterval(id)
    }, 250)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline])

  const secs     = Math.floor((ms / 1000) % 60)
  const mins     = Math.floor(ms / 1000 / 60)
  const isAlmost = ms > 0 && ms < 10_000  // < 10 s

  const barColor  = isAlmost ? 'bg-red-400' : color === 'green' ? 'bg-green-400' : color === 'amber' ? 'bg-amber-400' : 'bg-gold'
  const textColor = isAlmost ? 'text-red-400' : color === 'green' ? 'text-green-400' : color === 'amber' ? 'text-amber-400' : 'text-gold'

  // When timer hits zero, show a clean "Finished" state
  if (ms <= 0) {
    return (
      <div className="mb-6 px-4 py-3 rounded-xl border border-parchment/8 bg-parchment/[0.01] flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-parchment/20" />
        <span className="text-xs text-parchment/35 uppercase tracking-widest font-medium">Finished</span>
      </div>
    )
  }

  return (
    <div className="mb-6 p-4 rounded-xl border border-parchment/10 bg-parchment/[0.02]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full animate-pulse', barColor)} />
          <span className="text-xs text-parchment/50 uppercase tracking-widest">{label}</span>
        </div>
        <div className={clsx('font-mono text-2xl font-bold tabular-nums tracking-tight', textColor)}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
      </div>
      <div className="h-1.5 bg-parchment/8 rounded-full overflow-hidden">
        <motion.div
          className={clsx('h-full rounded-full transition-colors duration-1000', barColor)}
          animate={{ width: `${Math.max(0.5, (ms / Math.max(ms, 60_000)) * 100)}%` }}
          transition={{ duration: 0.25, ease: 'linear' }}
        />
      </div>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface Submission {
  id: string
  content: string
  contributor: string
  contributorHandle: string
  voteCount: number
  runoffVoteCount: number
  inRunoff: boolean
}

type RoundStatus = 'Submissions' | 'Voting' | 'Runoff' | 'Closed'
type UiPhase = 'live' | 'generating' | 'sealing' | 'done'

// ── Stage progress bar ─────────────────────────────────────────────────────────

function StageBar({ roundStatus, uiPhase }: { roundStatus: RoundStatus; uiPhase: UiPhase }) {
  const steps = [
    { label: 'Submit'   },
    { label: 'Vote'     },
    { label: 'Runoff'   },
    { label: 'AI Scene' },
  ]
  const activeIdx =
    uiPhase === 'generating' || uiPhase === 'sealing' || uiPhase === 'done' ? 3 :
    roundStatus === 'Submissions' ? 0 :
    roundStatus === 'Voting'      ? 1 :
    roundStatus === 'Runoff'      ? 2 : 3

  return (
    <div className="flex items-center gap-0 mb-10 w-full">
      {steps.map((step, i) => {
        const done   = i < activeIdx
        const active = i === activeIdx
        return (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <div className={clsx('flex items-center gap-2 flex-shrink-0 transition-all duration-500', done || active ? 'opacity-100' : 'opacity-30')}>
              <div className="relative flex-shrink-0">
                <div className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center border text-[11px] font-bold transition-all duration-500',
                  done   ? 'bg-gold/20 border-gold/60 text-gold' :
                  active ? 'bg-gold/15 border-gold/50 text-gold' :
                           'border-parchment/15 text-parchment/25'
                )}>
                  {done ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gold animate-ping opacity-75" />
                )}
              </div>
              <span className={clsx(
                'text-xs font-medium whitespace-nowrap hidden sm:block',
                active ? 'text-gold' : done ? 'text-parchment/50' : 'text-parchment/25'
              )}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={clsx('flex-1 h-px mx-3 transition-all duration-700', done ? 'bg-gold/40' : 'bg-parchment/10')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Direction card ─────────────────────────────────────────────────────────────

function DirectionCard({
  sub, totalVotes, rank, isOwn, hasVoted, votedFor, canVote, onVote, index, useRunoffVotes,
}: {
  sub: Submission
  totalVotes: number
  rank: number
  isOwn: boolean
  hasVoted: boolean
  votedFor: string | null
  canVote: boolean
  onVote: (id: string) => void
  index: number
  useRunoffVotes: boolean
}) {
  const votes      = useRunoffVotes ? sub.runoffVoteCount : sub.voteCount
  const pct        = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
  const isVotedFor = votedFor === sub.id
  const isLeading  = rank === 0 && totalVotes > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className={clsx(
        'rounded-xl border p-5 transition-all duration-300',
        isOwn        ? 'border-parchment/20 bg-parchment/3' :
        isLeading && hasVoted ? 'border-gold/40 bg-gold/5' :
        isVotedFor   ? 'border-parchment/20 bg-parchment/5' :
                       'border-parchment/8 bg-white/[0.02]'
      )}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-parchment/35">#{String(index + 1).padStart(2, '0')}</span>
          <span className="text-xs text-parchment/50">
            by <span className="text-parchment/75 font-medium">{sub.contributorHandle}</span>
          </span>
          {isOwn && (
            <span className="text-xs bg-parchment/10 text-parchment/50 border border-parchment/15 rounded-full px-2 py-0.5 flex items-center gap-1">
              <Ban size={9} /> Your idea
            </span>
          )}
          {isLeading && hasVoted && !isOwn && (
            <span className="text-xs bg-gold/20 text-gold border border-gold/30 rounded-full px-2 py-0.5 font-medium">
              <Trophy size={9} className="inline mr-1" />Winner
            </span>
          )}
          {isLeading && canVote && !hasVoted && !isOwn && (
            <span className="text-xs bg-gold/15 text-gold border border-gold/25 rounded-full px-2 py-0.5 font-medium">
              Leading
            </span>
          )}
        </div>
        {hasVoted && (
          <div className="text-right flex-shrink-0">
            <span className={clsx('text-base font-semibold font-mono tabular-nums', isLeading && !isOwn ? 'text-gold' : 'text-parchment/60')}>
              {votes.toLocaleString()}
            </span>
            <span className="text-xs text-parchment/35 ml-1">votes</span>
          </div>
        )}
      </div>

      <p className="text-parchment/82 leading-6 text-[15px] mb-4">{sub.content}</p>

      {hasVoted && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-parchment/35 mb-1.5">
            <span>{pct.toFixed(1)}%</span>
            <span className="font-mono">{votes} / {totalVotes}</span>
          </div>
          <div className="h-1.5 bg-parchment/8 rounded-full overflow-hidden">
            <motion.div
              className={clsx('h-full rounded-full', isLeading && !isOwn ? 'bg-gradient-to-r from-gold to-amber-400' : 'bg-gradient-to-r from-parchment/20 to-parchment/35')}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: index * 0.08 + 0.2, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {canVote && !hasVoted && (
        isOwn ? (
          <div className="w-full h-9 rounded-full border border-parchment/8 text-parchment/20 text-xs text-center flex items-center justify-center gap-1.5">
            <Ban size={10} /> Can't vote for your own idea
          </div>
        ) : (
          <div>
            <button
              onClick={() => onVote(sub.id)}
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

// ── Main ───────────────────────────────────────────────────────────────────────

export default function RoundView() {
  const { pieceId, roundIndex: roundIndexParam } = useParams()
  const roundIndex = Number(roundIndexParam ?? 0)
  const navigate   = useNavigate()
  const wallet     = useWallet()
  const { publicKey } = wallet
  const { connection } = useConnection()
  const { role } = useRole()

  if (role === 'creator') return <Navigate to="/dashboard" replace />

  const isDemo = !pieceId || pieceId.startsWith('demo-')

  // ── Remote data ────────────────────────────────────────────────────────────
  const [loading, setLoading]                     = useState(true)
  const [pieceTitle, setPieceTitle]               = useState('')
  const [paragraphs, setParagraphs]               = useState<{ content: string; index: number }[]>([])
  const [roundStatus, setRoundStatus]             = useState<RoundStatus>('Submissions')
  const [pool, setPool]                           = useState<Submission[]>([])
  const [totalVotes, setTotalVotes]               = useState(0)
  const [totalRunoffVotes, setTotalRunoffVotes]   = useState(0)
  const [submissionDeadline, setSubmissionDeadline] = useState(Date.now() + 60_000)
  const [votingDeadline, setVotingDeadline]       = useState(Date.now() + 120_000)
  const [runoffDeadline, setRunoffDeadline]       = useState(Date.now() + 180_000)
  const [maxSubmissions, setMaxSubmissions]       = useState(20)
  const [runoffPool, setRunoffPool]               = useState<string[]>([])

  // ── Local interaction ──────────────────────────────────────────────────────
  const [draft, setDraft]                         = useState('')
  const [myDraft, setMyDraft]                     = useState('')
  const [mySubmissionId, setMySubmissionId]       = useState<string | null>(null)
  const [submitting, setSubmitting]               = useState(false)
  const [votedFor, setVotedFor]                   = useState<string | null>(() =>
    pieceId ? localStorage.getItem(`vote-${pieceId}-${roundIndex}`) : null
  )
  const [runoffVotedFor, setRunoffVotedFor]       = useState<string | null>(() =>
    pieceId ? localStorage.getItem(`runoff-vote-${pieceId}-${roundIndex}`) : null
  )
  const [payError, setPayError]                   = useState<string | null>(null)
  const [voteReaction, setVoteReaction]           = useState<string | null>(null)
  const [voteReactionLoading, setVoteReactionLoading] = useState(false)

  // ── Post-runoff AI/seal ────────────────────────────────────────────────────
  const [uiPhase, setUiPhase]                     = useState<UiPhase>('live')
  const [generatedScript, setGeneratedScript]     = useState<string | null>(null)
  const [scriptError, setScriptError]             = useState(false)
  const [sealStatus, setSealStatus]               = useState<string | null>(null)
  const [txSig, setTxSig]                         = useState<string | null>(null)
  const generatingRef                             = useRef(false)

  // ── Fetch piece from backend ───────────────────────────────────────────────
  const loadPiece = () => {
    if (!pieceId) return
    fetch(`${BACKEND}/api/pieces/${pieceId}`)
      .then(r => r.json())
      .then(data => {
        setPieceTitle(data.title ?? '')
        setParagraphs((data.paragraphs ?? []).map((p: any) => ({ content: p.content ?? '', index: p.index })))
        const ar = data.activeRound
        if (ar) {
          setRoundStatus(ar.status)
          setTotalVotes(ar.totalVotes ?? 0)
          setTotalRunoffVotes(ar.totalRunoffVotes ?? 0)
          setSubmissionDeadline(ar.submissionDeadline)
          setVotingDeadline(ar.votingDeadline)
          setRunoffDeadline(ar.runoffDeadline ?? Date.now() + 60_000)
          setMaxSubmissions(ar.maxSubmissions ?? 20)
          setRunoffPool(ar.runoffPool ?? [])

          const subs: Submission[] = (ar.submissions ?? []).map((s: any) => ({
            id: s.id,
            content: s.content,
            contributor: s.contributor ?? 'anon',
            contributorHandle: s.contributor ? `@${s.contributor.slice(0, 6)}…` : '@anon',
            voteCount: s.voteCount ?? 0,
            runoffVoteCount: s.runoffVoteCount ?? 0,
            inRunoff: s.inRunoff ?? false,
          }))
          setPool(subs)

          if (publicKey) {
            const mine = subs.find(s => s.contributor === publicKey.toString())
            if (mine) { setMySubmissionId(mine.id); setMyDraft(mine.content) }
          }

          // Transitions are handled server-side via maybeAdvanceRound in getPiece.
        }
      })
      .catch(err => console.warn('[RoundView] fetch error:', err.message))
      .finally(() => setLoading(false))
  }

  // Initial load
  useEffect(() => { loadPiece() }, [pieceId, publicKey])

  // Poll every 2s so status transitions driven by the backend are reflected immediately
  useEffect(() => {
    if (!pieceId || uiPhase !== 'live') return
    const id = setInterval(() => loadPiece(), 2000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieceId, uiPhase])

  // ── Demo fallback (old demo-piece-N IDs) ──────────────────────────────────
  useEffect(() => {
    if (!isDemo || !pieceId) return
    fetch(`${BACKEND}/api/pieces/${pieceId}`)
      .then(r => r.json())
      .then(data => {
        setPieceTitle(data.title ?? '')
        setParagraphs((data.paragraphs ?? []).map((p: any) => ({ content: p.content ?? '', index: p.index })))
        const ar = data.activeRound
        if (ar) {
          setRoundStatus(ar.status); setTotalVotes(ar.totalVotes ?? 0)
          setTotalRunoffVotes(ar.totalRunoffVotes ?? 0)
          setSubmissionDeadline(ar.submissionDeadline); setVotingDeadline(ar.votingDeadline)
          setRunoffDeadline(ar.runoffDeadline ?? Date.now() + 60_000)
          setMaxSubmissions(ar.maxSubmissions ?? 20); setRunoffPool(ar.runoffPool ?? [])
          setPool((ar.submissions ?? []).map((s: any) => ({
            id: s.id, content: s.content, contributor: s.contributor ?? 'anon',
            contributorHandle: s.contributor ? `@${s.contributor.slice(0,6)}…` : '@anon',
            voteCount: s.voteCount ?? 0, runoffVoteCount: s.runoffVoteCount ?? 0,
            inRunoff: s.inRunoff ?? false,
          })))
        }
      })
      .catch(() => {
        setPieceTitle('It Was the Night Before the Product Launch')
        setParagraphs([{ index: 0, content: 'It was the night before the product launch and everything was about to go wrong…' }])
        setRoundStatus('Voting')
        setTotalVotes(408)
        setPool([
          { id: 'pool-7', content: 'Show the junior dev who flagged this in code review three weeks ago.', contributor: 'nR5c...6dLm', contributorHandle: '@quietengineer', voteCount: 143, runoffVoteCount: 0, inRunoff: false },
          { id: 'pool-3', content: 'VP calls in on speakerphone. He gives them twenty minutes.', contributor: '9cYs...3vPt', contributorHandle: '@inkandcode', voteCount: 98, runoffVoteCount: 0, inRunoff: false },
          { id: 'pool-2', content: 'Reveal it was the intern who rotated the deploy keys.', contributor: '2wXq...5mRo', contributorHandle: '@storyhunter_em', voteCount: 87, runoffVoteCount: 0, inRunoff: false },
        ])
        setVotingDeadline(Date.now() + 60_000)
      })
    setLoading(false)
  }, [isDemo, pieceId])

  // ── Trigger Gemini generation when runoff deadline passes ────────────────
  // All other transitions (Submissions→Voting, Voting→Runoff) are driven by
  // the backend's maybeAdvanceRound and picked up by the 2s poll above.
  useEffect(() => {
    if (roundStatus !== 'Runoff' || uiPhase !== 'live' || runoffDeadline <= 0) return
    const remaining = runoffDeadline - Date.now()
    const doGenerate = () => {
      if (generatingRef.current) return
      generatingRef.current = true
      handleAutoGenerate()
    }
    if (remaining <= 0) { doGenerate(); return }
    const t = setTimeout(doGenerate, remaining)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundStatus, runoffDeadline, uiPhase])

  // ── Finalize: call backend which picks winner → Gemini → seal → next round ─
  const handleAutoGenerate = async () => {
    if (!pieceId) return
    setUiPhase('generating')
    setScriptError(false)

    try {
      const res = await fetch(`${BACKEND}/api/pieces/${pieceId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundIndex }),
      })
      const data = await res.json()

      if (!res.ok) {
        console.warn('[finalize] error:', data.error)
        setScriptError(true)
        setUiPhase('live')
        generatingRef.current = false
        return
      }

      setGeneratedScript(data.geminiScript ?? null)
      setUiPhase('sealing')

      // Brief pause so user sees the sealing state
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'
      setTxSig(Array.from({ length: 88 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
      await new Promise(r => setTimeout(r, 1200))

      setUiPhase('done')
      setTimeout(() => navigate(`/piece/${pieceId}`), 2500)
    } catch (e) {
      console.warn('[finalize] fetch error:', e)
      setScriptError(true)
      setUiPhase('live')
    }

    generatingRef.current = false
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmitDirection = async () => {
    if (wordCount < 5 || wordCount > MAX_WORDS || submitting) return
    setSubmitting(true); setPayError(null)
    try {
      await sendSolPayment(connection, wallet, 0.025)
    } catch (err: any) {
      setPayError(err?.message?.includes('rejected') || err?.message?.includes('cancel') ? 'Transaction cancelled.' : 'Transaction failed — check your SOL balance.')
      setSubmitting(false); return
    }

    if (!isDemo && pieceId) {
      try {
        const res = await fetch(`${BACKEND}/api/pieces/${pieceId}/submit`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: draft, contributor: publicKey?.toString() ?? 'anon', roundIndex }),
        })
        const sub = await res.json()
        if (res.ok) {
          setMySubmissionId(sub.id)
          setPool(prev => [...prev, { id: sub.id, content: sub.content, contributor: publicKey?.toString() ?? 'anon', contributorHandle: '@you', voteCount: 0, runoffVoteCount: 0, inRunoff: false }])
        }
      } catch (e) { console.error('[submit]', e) }
    } else {
      const id = `my-${Date.now()}`
      setMySubmissionId(id)
      setPool(prev => [...prev, { id, content: draft, contributor: publicKey?.toString() ?? 'anon', contributorHandle: '@you', voteCount: 0, runoffVoteCount: 0, inRunoff: false }])
    }
    setMyDraft(draft); setSubmitting(false)
  }

  const handleFirstVote = async (id: string) => {
    if (id === mySubmissionId || votedFor) return
    setPayError(null)
    try {
      await sendSolPayment(connection, wallet, 0.025)
    } catch (err: any) {
      setPayError(err?.message?.includes('rejected') || err?.message?.includes('cancel') ? 'Transaction cancelled.' : 'Transaction failed — check your SOL balance.')
      return
    }
    if (!isDemo && pieceId) {
      try {
        const res = await fetch(`${BACKEND}/api/pieces/${pieceId}/vote`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId: id, voter: publicKey?.toString() ?? 'anon', roundIndex }),
        })
        const result = await res.json()
        if (res.ok) { setPool(prev => prev.map(s => s.id === id ? { ...s, voteCount: result.newCount } : s)); setTotalVotes(result.totalVotes) }
      } catch (e) { console.error('[vote]', e) }
    } else {
      setPool(prev => prev.map(s => s.id === id ? { ...s, voteCount: s.voteCount + 1 } : s))
      setTotalVotes(t => t + 1)
    }
    setVotedFor(id)
    if (pieceId) localStorage.setItem(`vote-${pieceId}-${roundIndex}`, id)
    const voted = pool.find(s => s.id === id)
    if (voted?.content) {
      setVoteReactionLoading(true)
      apiVoteReaction(voted.content, totalVotes).then(r => setVoteReaction(r)).catch(() => {}).finally(() => setVoteReactionLoading(false))
    }
  }

  const handleRunoffVote = async (id: string) => {
    if (id === mySubmissionId || runoffVotedFor) return
    setPayError(null)
    try {
      await sendSolPayment(connection, wallet, 0.025)
    } catch (err: any) {
      setPayError(err?.message?.includes('rejected') || err?.message?.includes('cancel') ? 'Transaction cancelled.' : 'Transaction failed — check your SOL balance.')
      return
    }
    if (!isDemo && pieceId) {
      try {
        const res = await fetch(`${BACKEND}/api/pieces/${pieceId}/vote-runoff`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId: id, voter: publicKey?.toString() ?? 'anon', roundIndex }),
        })
        const result = await res.json()
        if (res.ok) { setPool(prev => prev.map(s => s.id === id ? { ...s, runoffVoteCount: result.newCount } : s)); setTotalRunoffVotes(result.totalRunoffVotes) }
      } catch (e) { console.error('[runoff-vote]', e) }
    } else {
      setPool(prev => prev.map(s => s.id === id ? { ...s, runoffVoteCount: s.runoffVoteCount + 1 } : s))
      setTotalRunoffVotes(t => t + 1)
    }
    setRunoffVotedFor(id)
    if (pieceId) localStorage.setItem(`runoff-vote-${pieceId}-${roundIndex}`, id)
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const wordCount     = draft.trim().split(/\s+/).filter(Boolean).length
  const MAX_WORDS     = 50
  const hasSubmitted  = !!mySubmissionId
  const hasVoted      = !!votedFor
  const hasRunoffVoted = !!runoffVotedFor
  const canFirstVote  = roundStatus === 'Voting' && !hasVoted
  const canRunoffVote = roundStatus === 'Runoff' && !hasRunoffVoted

  const firstRoundSorted = [...pool].sort((a, b) => b.voteCount - a.voteCount)
  const runoffSubs       = pool.filter(s => runoffPool.includes(s.id)).sort((a, b) => b.runoffVoteCount - a.runoffVoteCount)
  const lastParagraph    = paragraphs.length > 0 ? paragraphs[paragraphs.length - 1] : null

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen pt-28 pb-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-parchment/30">
          <Loader2 size={20} className="animate-spin" />
          <p className="text-sm">Loading round…</p>
        </div>
      </main>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          {pieceTitle && <div className="text-xs text-parchment/40 uppercase tracking-widest mb-2">{pieceTitle}</div>}
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs text-parchment/35 uppercase tracking-widest mb-1">Round {roundIndex + 1} of 8</p>
              <h1 className="font-serif text-3xl text-parchment mb-1">{getRoundLabel(roundIndex)}</h1>
              <p className="text-parchment/50 text-sm">
                {uiPhase === 'generating' && 'Gemini writing the official scene…'}
                {uiPhase === 'sealing'    && 'Sealing to Solana devnet…'}
                {uiPhase === 'done'       && 'Scene sealed — next round opening…'}
                {uiPhase === 'live' && roundStatus === 'Submissions' && `${pool.length} directions submitted · submissions open`}
                {uiPhase === 'live' && roundStatus === 'Voting'      && `${pool.length} directions · ${totalVotes.toLocaleString()} votes cast`}
                {uiPhase === 'live' && roundStatus === 'Runoff'      && `Top ${runoffSubs.length} finalists · ${totalRunoffVotes.toLocaleString()} runoff votes`}
              </p>
            </div>
            {uiPhase === 'live' && roundStatus === 'Submissions' && (
              <RoundTimer deadline={submissionDeadline} label="Submissions close" className="flex-shrink-0" />
            )}
            {uiPhase === 'live' && roundStatus === 'Voting' && (
              <RoundTimer deadline={votingDeadline} label="Voting closes" className="flex-shrink-0" />
            )}
            {uiPhase === 'live' && roundStatus === 'Runoff' && (
              <RoundTimer deadline={runoffDeadline} label="Runoff closes" className="flex-shrink-0" />
            )}
          </div>
        </motion.div>

        <StageBar roundStatus={uiPhase === 'live' ? roundStatus : 'Runoff'} uiPhase={uiPhase} />

        {/* Story so far */}
        {uiPhase !== 'done' && lastParagraph && (
          <div className="mb-8 p-5 rounded-xl bg-parchment/3 border border-parchment/8">
            <div className="text-xs uppercase tracking-widest text-parchment/35 mb-2">
              {lastParagraph.index === 0 ? "Opening \u2014 creator\u2019s premise" : `Story so far \u2014 Part ${lastParagraph.index}`}
            </div>
            <p className="font-serif text-parchment/75 leading-7 text-[15px] line-clamp-4">{lastParagraph.content}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-parchment/30"><Lock size={10} /><span>sealed on Solana</span></div>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── SUBMISSIONS: form ── */}
          {uiPhase === 'live' && roundStatus === 'Submissions' && !hasSubmitted && (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <CountdownBanner deadline={submissionDeadline} label="Submissions close in" />
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <div className="p-6 rounded-2xl border border-parchment/12 bg-white/[0.02]">
                    {!publicKey ? (
                      <div className="text-center py-10">
                        <p className="text-parchment/40 text-sm mb-4 font-serif">Connect your wallet to participate</p>
                        <WalletMultiButton />
                      </div>
                    ) : (
                      <>
                        <h2 className="font-serif text-xl text-parchment mb-1">Submit your direction</h2>
                        <p className="text-parchment/45 text-sm mb-5">
                          Where should the story go next? Max {MAX_WORDS} words.
                          Top 5 go to a runoff vote, then the winner becomes the next scene.
                        </p>
                        <textarea
                          value={draft}
                          onChange={e => setDraft(e.target.value)}
                          placeholder="e.g. Show the junior dev who flagged this bug three weeks ago. He hasn't said a word."
                          rows={5}
                          className="w-full bg-ink-50/40 border border-parchment/15 rounded-xl p-4 text-parchment text-base leading-7 placeholder:text-parchment/20 focus:outline-none focus:border-gold/40 resize-none transition-colors mb-3"
                        />
                        <div className="flex items-center justify-between mb-5">
                          <span className={clsx('text-xs font-mono tabular-nums', wordCount > MAX_WORDS ? 'text-red-400' : wordCount >= 5 ? 'text-green-400' : 'text-parchment/35')}>
                            {wordCount} / {MAX_WORDS} words
                          </span>
                          <span className="text-xs text-parchment/25">Top 5 → runoff vote → Gemini writes the scene</span>
                        </div>
                        {wordCount > MAX_WORDS && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-400/5 border border-red-400/15 mb-4 text-xs text-red-400/80">
                            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />Over {MAX_WORDS} words — keep it concise.
                          </div>
                        )}
                        {payError && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-400/5 border border-red-400/15 mb-4 text-xs text-red-400/80">
                            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{payError}
                          </div>
                        )}
                        <motion.button
                          onClick={handleSubmitDirection}
                          disabled={wordCount < 5 || wordCount > MAX_WORDS || submitting}
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          className={clsx('w-full flex items-center justify-center gap-2 h-11 rounded-full font-medium text-sm transition-all',
                            wordCount >= 5 && wordCount <= MAX_WORDS ? 'bg-gold text-ink-900 hover:brightness-110' : 'bg-parchment/6 text-parchment/25 cursor-not-allowed')}
                        >
                          {submitting ? <><div className="w-3.5 h-3.5 border-2 border-ink-900/30 border-t-ink-900 rounded-full animate-spin" />Signing…</> : <><Send size={13} />Submit Direction</>}
                        </motion.button>
                        {!submitting && wordCount >= 5 && wordCount <= MAX_WORDS && (
                          <p className="text-center text-xs text-parchment/25 mt-2">0.025 SOL + gas fee</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 rounded-2xl border border-parchment/12 bg-white/[0.02]">
                    <div className="text-xs uppercase tracking-widest text-parchment/35 mb-2">Submissions</div>
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-4xl font-mono font-bold text-parchment">{pool.length}</span>
                      <span className="text-parchment/35 text-sm mb-1">/ {maxSubmissions} max</span>
                    </div>
                    <div className="h-1.5 bg-parchment/8 rounded-full overflow-hidden mt-2">
                      <motion.div className="h-full bg-gradient-to-r from-gold/50 to-gold rounded-full" animate={{ width: `${Math.min((pool.length / maxSubmissions) * 100, 100)}%` }} transition={{ duration: 0.6 }} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-parchment/10 bg-parchment/3 space-y-2">
                    <div className="text-xs uppercase tracking-widest text-parchment/35 mb-2">How it works</div>
                    {[
                      'Submit direction · 0.025 SOL',
                      'All directions go to first vote',
                      'Top 5 advance to runoff · 0.025 SOL',
                      'Runoff winner → Gemini writes scene',
                      'Scene auto-seals & next round opens',
                    ].map((rule, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-parchment/50">
                        <span className="text-gold/60 font-mono mt-0.5 flex-shrink-0">{i + 1}.</span>
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SUBMISSIONS: pool preview (submitted, waiting) ── */}
          {uiPhase === 'live' && roundStatus === 'Submissions' && hasSubmitted && (
            <motion.div key="submitted-wait" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <CountdownBanner deadline={submissionDeadline} label="Voting opens in" />
              <div className="flex items-start gap-3 p-4 rounded-xl border border-green-400/20 bg-green-400/5 mb-6">
                <CheckCircle2 size={15} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-400">Direction submitted</p>
                  <p className="text-parchment/45 text-xs mt-0.5">0.025 SOL paid. Voting opens when submissions close — you'll vote for someone else's idea in the first round, then top 5 go to a runoff.</p>
                  {myDraft && <p className="text-parchment/50 text-xs mt-2 italic">"{myDraft.slice(0, 100)}{myDraft.length > 100 ? '…' : ''}"</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-parchment/30 mb-5"><Clock size={11} /><span>Waiting for submissions to close — voting opens automatically</span></div>
              <div className="space-y-4">
                {pool.map((sub, i) => (
                  <DirectionCard key={sub.id} sub={sub} totalVotes={0} rank={i} isOwn={sub.id === mySubmissionId} hasVoted={false} votedFor={null} canVote={false} onVote={() => {}} index={i} useRunoffVotes={false} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── FIRST VOTE ── */}
          {uiPhase === 'live' && roundStatus === 'Voting' && (
            <motion.div key="voting" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <CountdownBanner deadline={votingDeadline} label="Runoff opens in" color="amber" />
              <div className={clsx('flex items-start gap-3 p-4 rounded-xl border mb-6', hasVoted ? 'border-green-400/20 bg-green-400/5' : 'border-gold/20 bg-gold/5')}>
                {hasVoted ? <CheckCircle2 size={15} className="text-green-400 mt-0.5 flex-shrink-0" /> : <Users size={15} className="text-gold mt-0.5 flex-shrink-0" />}
                <div>
                  <p className={clsx('text-sm font-medium', hasVoted ? 'text-green-400' : 'text-gold')}>
                    {hasVoted ? 'Vote cast — top 5 go to runoff' : 'First vote — pick your favourite direction'}
                  </p>
                  <p className="text-parchment/45 text-xs mt-0.5">
                    {hasVoted ? `${totalVotes.toLocaleString()} votes total · top 5 advance to a runoff vote` : `${pool.length} directions competing · 0.025 SOL · you cannot vote for your own`}
                  </p>
                </div>
              </div>
              {payError && <div className="flex items-start gap-2 p-3 rounded-lg bg-red-400/5 border border-red-400/15 mb-5 text-xs text-red-400/80"><AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{payError}</div>}
              <div className="space-y-4 mb-8">
                {firstRoundSorted.map((sub, i) => (
                  <DirectionCard key={sub.id} sub={sub} totalVotes={totalVotes} rank={i} isOwn={sub.id === mySubmissionId} hasVoted={hasVoted} votedFor={votedFor} canVote={canFirstVote} onVote={handleFirstVote} index={i} useRunoffVotes={false} />
                ))}
              </div>
              <AnimatePresence>
                {(voteReactionLoading || voteReaction) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 rounded-xl border border-gold/20 bg-gold/5">
                    <div className="flex items-center gap-2 mb-2"><Sparkles size={12} className="text-gold" /><span className="text-xs uppercase tracking-widest text-gold/70 font-medium">Gemini reacts</span></div>
                    {voteReactionLoading ? <div className="flex items-center gap-2 text-parchment/40 text-sm"><div className="w-3 h-3 border border-gold/40 border-t-gold rounded-full animate-spin" />Reading…</div>
                      : <p className="text-parchment/80 text-sm leading-relaxed font-serif italic">{voteReaction}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── RUNOFF VOTE (top 5) ── */}
          {uiPhase === 'live' && roundStatus === 'Runoff' && (
            <motion.div key="runoff" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <CountdownBanner deadline={runoffDeadline} label="AI writes scene in" color="amber" />

              {/* Mid-session join banner — shown to users who arrive during runoff */}
              {!hasRunoffVoted && !mySubmissionId && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 rounded-xl border border-amber-400/25 bg-amber-400/5 mb-4"
                >
                  <Zap size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">Runoff is live — cast your vote now</p>
                    <p className="text-parchment/45 text-xs mt-0.5">You're joining mid-round. The top {runoffSubs.length} directions are competing — vote for the one you want Gemini to write.</p>
                  </div>
                </motion.div>
              )}

              <div className={clsx('flex items-start gap-3 p-4 rounded-xl border mb-6', hasRunoffVoted ? 'border-green-400/20 bg-green-400/5' : 'border-gold/20 bg-gold/5')}>
                {hasRunoffVoted ? <CheckCircle2 size={15} className="text-green-400 mt-0.5 flex-shrink-0" /> : <Trophy size={15} className="text-gold mt-0.5 flex-shrink-0" />}
                <div>
                  <p className={clsx('text-sm font-medium', hasRunoffVoted ? 'text-green-400' : 'text-gold')}>
                    {hasRunoffVoted ? 'Runoff vote cast — Gemini writes next' : `Runoff — top ${runoffSubs.length} finalists`}
                  </p>
                  <p className="text-parchment/45 text-xs mt-0.5">
                    {hasRunoffVoted ? `${totalRunoffVotes.toLocaleString()} runoff votes · winner goes to Gemini · scene auto-seals when timer ends` : `The top directions from round 1 face off · 0.025 SOL · winner becomes the next scene`}
                  </p>
                </div>
              </div>
              {payError && <div className="flex items-start gap-2 p-3 rounded-lg bg-red-400/5 border border-red-400/15 mb-5 text-xs text-red-400/80"><AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{payError}</div>}
              <div className="space-y-4 mb-8">
                {runoffSubs.length === 0 && (
                  <p className="text-center py-6 text-parchment/25 text-sm">Calculating top 5 finalists…</p>
                )}
                {runoffSubs.map((sub, i) => (
                  <DirectionCard key={sub.id} sub={sub} totalVotes={totalRunoffVotes} rank={i} isOwn={sub.id === mySubmissionId} hasVoted={hasRunoffVoted} votedFor={runoffVotedFor} canVote={canRunoffVote} onVote={handleRunoffVote} index={i} useRunoffVotes={true} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── GENERATING / SEALING ── */}
          {(uiPhase === 'generating' || uiPhase === 'sealing') && (
            <motion.div key="gen-seal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16">
              <div className="max-w-lg mx-auto text-center">
                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                  {uiPhase === 'generating' ? <Sparkles size={24} className="text-gold animate-pulse" /> : <Zap size={24} className="text-gold animate-pulse" />}
                </div>
                <h2 className="font-serif text-2xl text-parchment mb-3">
                  {uiPhase === 'generating' ? 'Gemini is writing the scene' : 'Sealing to Solana devnet'}
                </h2>
                {uiPhase === 'generating' && (
                  <p className="text-parchment/40 text-sm mb-8">The runoff winner is being turned into a professional scene…</p>
                )}
                {uiPhase === 'sealing' && sealStatus && (
                  <p className="text-parchment/40 text-sm mb-8 font-mono">{sealStatus}</p>
                )}
                {scriptError && uiPhase === 'sealing' && (
                  <p className="text-amber-400/60 text-xs mb-4">Gemini unavailable — sealing winning direction directly</p>
                )}
                {uiPhase === 'generating' && runoffSubs[0] && (
                  <div className="p-4 rounded-xl border border-gold/20 bg-gold/5 mb-8 text-left">
                    <div className="text-xs text-gold/60 uppercase tracking-widest mb-2">Runoff winner</div>
                    <p className="text-parchment/75 text-sm italic">"{runoffSubs[0].content}"</p>
                  </div>
                )}
                <div className="space-y-2.5 text-left">
                  {[75, 90, 65, 85, 70, 80, 60].map((w, i) => (
                    <div key={i} className="h-3 bg-parchment/8 rounded-full animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── DONE / SEALED ── */}
          {uiPhase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16">
              <div className="max-w-lg mx-auto text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="inline-flex w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/40 items-center justify-center mb-6"
                >
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M18 4L22 14L33 15.5L25 23L27 34L18 29L9 34L11 23L3 15.5L14 14L18 4Z" fill="rgba(201,168,76,0.2)" stroke="#c9a84c" strokeWidth="1.5" />
                    <path d="M12 18L16 22L24 14" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
                <h2 className="font-serif text-3xl text-parchment mb-2">Scene sealed.</h2>
                <p className="text-parchment/50 text-sm mb-4">
                  Community direction → runoff → Gemini script → Solana devnet.<br />
                  The next round is opening now…
                </p>
                {txSig && (
                  <div className="px-4 py-2 rounded-lg bg-parchment/5 border border-parchment/10 inline-block mb-6">
                    <span className="text-xs text-parchment/30 mr-2">tx</span>
                    <span className="text-xs font-mono text-parchment/60">{txSig.slice(0, 20)}…{txSig.slice(-8)}</span>
                  </div>
                )}
                {generatedScript && (
                  <div className="p-6 rounded-2xl border border-parchment/12 bg-parchment/3 text-left mb-6">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-parchment/30 mb-4">
                      <Sparkles size={10} className="text-gold/50" />
                      Published scene · {getRoundLabel(roundIndex)}
                    </div>
                    <pre className="font-mono text-parchment/82 text-sm leading-7 whitespace-pre-wrap">{generatedScript}</pre>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-xs text-parchment/25">
                  <Loader2 size={12} className="animate-spin" />
                  Redirecting to story…
                </div>
                <OnChainRecord record={DEMO_CHAIN_RECORD} />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}
