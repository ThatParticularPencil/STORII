import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Lock, ArrowUpRight, Loader2 } from 'lucide-react'
import { useExplore } from '@/hooks/usePiece'
import type { ExplorePiece } from '@/hooks/usePiece'
import { clsx } from 'clsx'

export default function Explore() {
  const { pieces, loading } = useExplore()
  const activeCount = pieces.filter(p => p.activeRound?.status === 'Voting').length

  return (
    <main className="min-h-screen pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-6">

        {/* Masthead */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-10 mb-12 border-b border-parchment/8 pb-8"
        >
          <h1 className="font-serif text-4xl text-parchment mb-2">Stories</h1>
          <p className="text-parchment/40 text-sm">
            {loading ? 'Loading…' : `${activeCount} rounds open · ${pieces.length} pieces`}
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-parchment/25">
            <Loader2 size={18} className="animate-spin mr-2" />
            <span className="text-sm">Fetching from chain…</span>
          </div>
        )}

        {/* Feed */}
        {!loading && (
          <div className="divide-y divide-parchment/6">
            {pieces.map((piece, i) => (
              <PieceRow key={piece.id} piece={piece} index={i} />
            ))}
            {pieces.length === 0 && (
              <p className="py-12 text-center text-parchment/25 text-sm">
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
          <p className="text-parchment/30 text-sm mb-4">Have a story to tell?</p>
          <Link
            to="/new"
            className="text-gold/60 hover:text-gold transition-colors font-serif text-lg"
          >
            Start a piece →
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
          <div className="flex items-center gap-3 mb-3 text-xs">
            {isVoting ? (
              <span className="flex items-center gap-1.5 text-green-400/80">
                <div className="live-dot scale-75" />
                Round open
              </span>
            ) : isComplete ? (
              <span className="flex items-center gap-1 text-parchment/25">
                <Lock size={10} />
                Complete
              </span>
            ) : (
              <span className="text-parchment/25">Between rounds</span>
            )}
          </div>

          {/* Title */}
          <h2 className="font-serif text-xl text-parchment/90 group-hover:text-parchment transition-colors mb-2.5 leading-snug">
            {piece.title}
          </h2>

          {/* Meta + cta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-parchment/30">
              <span>by {creatorShort}</span>
              <span>{piece.paragraphCount} parts sealed</span>
              {piece.totalVotes > 0 && (
                <span>{piece.totalVotes.toLocaleString()} votes</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-parchment/25 group-hover:text-gold/60 transition-colors">
              <span>{isVoting ? 'Read & vote' : 'Read'}</span>
              <ArrowUpRight size={12} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
