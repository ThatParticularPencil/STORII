import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart2, ArrowLeft, Sparkles, Lock, Users, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import RoundTimer from '@/components/RoundTimer'
import {
  DEMO_STAGE1_POOL,
  DEMO_ACTIVE_ROUND,
  DEMO_PIECE,
} from '@/utils/demo-data'
import type { DemoSubmission } from '@/types'

export default function CreatorRoundWatch() {
  const { pieceId, roundIndex } = useParams()

  const [pool, setPool] = useState<DemoSubmission[]>(
    DEMO_STAGE1_POOL.map(s => ({ ...s, voteCount: Math.floor(Math.random() * 40) + 5 }))
  )
  const [totalVotes, setTotalVotes] = useState(DEMO_ACTIVE_ROUND.totalVotes)
  const [votingDeadline] = useState(DEMO_ACTIVE_ROUND.votingDeadline)

  // Live simulation — read-only, just shows activity
  useEffect(() => {
    const interval = setInterval(() => {
      setPool(prev => {
        const idx = Math.floor(Math.random() * prev.length)
        const next = [...prev]
        next[idx] = { ...next[idx], voteCount: next[idx].voteCount + 1 }
        return next
      })
      setTotalVotes(t => t + 1)
    }, 700)
    return () => clearInterval(interval)
  }, [])

  const sorted = [...pool].sort((a, b) => b.voteCount - a.voteCount)
  const leader = sorted[0]

  return (
    <main className="min-h-screen pt-14 pb-24">
      <div className="max-w-2xl mx-auto px-6">
        <div className="pt-10 mb-8">
          <Link
            to={`/piece/${pieceId}`}
            className="flex items-center gap-1.5 text-xs text-parchment/30 hover:text-parchment/60 transition-colors mb-6"
          >
            <ArrowLeft size={12} />
            Back to piece
          </Link>

          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="text-xs text-parchment/30 mb-1">{DEMO_PIECE.title}</p>
              <h1 className="font-serif text-2xl text-parchment">
                Round {Number(roundIndex ?? 3) + 1} — Live votes
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-parchment/25 bg-parchment/[0.03] border border-parchment/10 rounded-full h-7 px-3 flex-shrink-0">
              <Lock size={10} />
              View only
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-parchment/30 mt-3">
            <span className="flex items-center gap-1.5">
              <BarChart2 size={11} />
              {totalVotes.toLocaleString()} votes cast
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={11} />
              {pool.length} directions
            </span>
            <RoundTimer deadline={votingDeadline} label="closes" />
          </div>
        </div>

        {/* Leader callout */}
        {leader && (
          <motion.div
            layout
            className="mb-6 p-4 rounded-xl border border-gold/20 bg-gold/[0.04]"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-gold/60" />
              <span className="text-xs text-gold/60 uppercase tracking-widest">Leading direction</span>
            </div>
            <p className="text-parchment/75 text-sm leading-relaxed font-serif italic mb-2">
              "{leader.content}"
            </p>
            <div className="flex items-center gap-3 text-xs text-parchment/30">
              <span>{leader.contributorHandle}</span>
              <span>·</span>
              <span className="font-mono text-gold/60">{leader.voteCount} votes</span>
              <span>·</span>
              <span>{totalVotes > 0 ? ((leader.voteCount / totalVotes) * 100).toFixed(1) : 0}%</span>
            </div>
          </motion.div>
        )}

        {/* All directions with live bars */}
        <div className="space-y-3">
          {sorted.map((sub, i) => {
            const pct = totalVotes > 0 ? (sub.voteCount / totalVotes) * 100 : 0
            const isLeading = i === 0
            return (
              <motion.div
                key={sub.id}
                layout
                className={clsx(
                  'p-4 rounded-xl border transition-colors',
                  isLeading ? 'border-gold/20 bg-gold/[0.03]' : 'border-parchment/8 bg-transparent'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 text-xs text-parchment/35">
                    <span className="font-mono">#{String(i + 1).padStart(2, '0')}</span>
                    <span>{sub.contributorHandle}</span>
                  </div>
                  <span className={clsx(
                    'text-sm font-mono font-medium tabular-nums flex-shrink-0',
                    isLeading ? 'text-gold/80' : 'text-parchment/50'
                  )}>
                    {sub.voteCount}
                  </span>
                </div>

                <p className="text-parchment/65 text-sm leading-relaxed mb-3">
                  {sub.content}
                </p>

                <div>
                  <div className="flex justify-between text-xs text-parchment/25 mb-1">
                    <span>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1 bg-parchment/6 rounded-full overflow-hidden">
                    <motion.div
                      className={clsx(
                        'h-full rounded-full',
                        isLeading ? 'bg-gold/50' : 'bg-parchment/20'
                      )}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Note to creator */}
        <div className="mt-10 pt-6 border-t border-parchment/6 flex items-start gap-2.5">
          <Clock size={13} className="text-parchment/20 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-parchment/25 leading-relaxed">
            Voting closes when the timer hits zero. You can reduce the time from the dashboard.
            The winning direction will then go to Gemini to generate the full scene.
          </p>
        </div>
      </div>
    </main>
  )
}
