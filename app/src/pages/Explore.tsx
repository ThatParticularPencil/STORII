import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Lock, ArrowUpRight, Loader2 } from 'lucide-react'
import { useExplore } from '@/hooks/usePiece'
import type { ExplorePiece } from '@/hooks/usePiece'
import DotPattern from '@/components/DotPattern'

export default function Explore() {
  const { pieces, loading } = useExplore()
  const activeCount = pieces.filter(p => p.activeRound?.status === 'Voting').length

  return (
    <main className="min-h-screen pt-20 pb-24 relative">
      <DotPattern />
      <div className="max-w-3xl mx-auto px-6 relative z-10">

        {/* Masthead */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-10 mb-12 border-b border-straw pb-8"
        >
          <p className="text-label uppercase tracking-[0.08em] text-ink-tertiary mb-1.5">The feed</p>
          <h1 className="font-mono font-bold text-display-md text-ink mb-3">Stories</h1>
          <p className="font-mono text-ink-secondary text-sm">
            {loading ? 'Loading…' : (
              <>
                <span className="text-sage font-bold">{activeCount}</span> rounds open
                <span className="text-straw mx-2">·</span>
                <span className="text-ink">{pieces.length}</span> pieces
              </>
            )}
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-ink-tertiary font-mono">
            <Loader2 size={18} className="animate-spin mr-2" />
            <span className="text-sm">Fetching from chain…</span>
          </div>
        )}

        {/* Feed */}
        {!loading && (
          <div className="divide-y divide-straw">
            {pieces.map((piece, i) => (
              <PieceRow key={piece.id} piece={piece} index={i} />
            ))}
            {pieces.length === 0 && (
              <p className="py-12 text-center text-ink-tertiary text-sm font-mono">
                No pieces on-chain yet. Be the first to start a story.
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-14 pb-4 text-center"
        >
          <p className="text-ink-tertiary text-sm mb-4 font-mono">Have a story to tell?</p>
          <Link
            to="/new"
            className="inline-flex items-center gap-2 text-sage hover:text-sage-dark transition-colors font-mono font-bold text-sm border border-sage hover:border-sage-dark px-6 py-3 rounded-[8px]"
          >
            Start a piece
            <ArrowUpRight size={14} />
          </Link>
        </motion.div>
      </div>
    </main>
  )
}

function PieceRow({ piece, index }: { piece: ExplorePiece; index: number }) {
  const isVoting   = piece.activeRound?.status === 'Voting'
  const isComplete = piece.status === 'Complete'
  const creatorShort = piece.creator
    ? `${piece.creator.slice(0, 4)}…${piece.creator.slice(-4)}`
    : 'unknown'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
    >
      <Link to={`/piece/${piece.id}`}>
        <div className="group py-7 cursor-pointer">
          {/* Status row */}
          <div className="flex items-center gap-3 mb-3 text-xs font-mono">
            {isVoting ? (
              <span className="flex items-center gap-1.5 text-sage font-bold">
                <div className="live-dot scale-75" />
                Round open
              </span>
            ) : isComplete ? (
              <span className="flex items-center gap-1 text-seal font-bold">
                <Lock size={10} />
                Complete
              </span>
            ) : (
              <span className="text-ink-tertiary">Between rounds</span>
            )}
          </div>

          {/* Title */}
          <h2 className="font-mono font-bold text-xl text-ink group-hover:text-sage transition-colors mb-2.5 leading-snug tracking-[-0.01em]">
            {piece.title}
          </h2>

          {/* Meta + cta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-ink-tertiary font-mono">
              <span>by {creatorShort}</span>
              <span className="text-straw">·</span>
              <span>{piece.paragraphCount} parts sealed</span>
              {piece.totalVotes > 0 && (
                <>
                  <span className="text-straw">·</span>
                  <span>{piece.totalVotes.toLocaleString()} votes</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-ink-tertiary group-hover:text-sage transition-colors font-mono font-bold">
              <span>{isVoting ? 'Read & vote' : 'Read'}</span>
              <ArrowUpRight size={12} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
