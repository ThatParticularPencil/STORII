import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Lock, Users, BookOpen, ArrowRight, Zap } from 'lucide-react'
import { DEMO_PIECES_EXPLORE } from '@/utils/demo-data'
import { formatTimestamp } from '@/utils/solana'
import { clsx } from 'clsx'

const GENRE_COLORS: Record<string, string> = {
  'Literary Fiction': 'text-sky-400 border-sky-400/30 bg-sky-400/5',
  'Sci-Fi Thriller': 'text-purple-400 border-purple-400/30 bg-purple-400/5',
  'Personal Essay': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  'Startup Memoir': 'text-amber-400 border-amber-400/30 bg-amber-400/5',
}

export default function Explore() {
  return (
    <main className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="text-xs uppercase tracking-widest text-gold/60 mb-3">Community</div>
          <h1 className="font-serif text-5xl text-parchment mb-3">Explore Pieces</h1>
          <p className="text-parchment/50 text-lg">
            Stories being written together, one paragraph at a time.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-10 p-4 rounded-2xl glass"
        >
          <StatItem value="24" label="Active pieces" />
          <StatItem value="12,840" label="Total votes cast" />
          <StatItem value="143" label="Sealed paragraphs" />
        </motion.div>

        {/* Pieces grid */}
        <div className="space-y-4">
          {DEMO_PIECES_EXPLORE.map((piece, i) => (
            <PieceCard key={piece.id} piece={piece} index={i} />
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-parchment/40 mb-4 text-sm">Want to start your own collaborative story?</p>
          <Link to="/new">
            <button className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold px-6 py-3 rounded-xl font-medium hover:bg-gold/20 transition-all">
              Start a New Piece
              <ArrowRight size={16} />
            </button>
          </Link>
        </motion.div>
      </div>
    </main>
  )
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center py-2">
      <div className="text-2xl font-mono font-semibold text-parchment">{value}</div>
      <div className="text-xs text-parchment/40 mt-1">{label}</div>
    </div>
  )
}

function PieceCard({
  piece,
  index,
}: {
  piece: (typeof DEMO_PIECES_EXPLORE)[0]
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link to={`/piece/${piece.id}`}>
        <div className="group glass rounded-2xl p-6 hover:border-parchment/15 transition-all duration-300 cursor-pointer">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Genre + Status */}
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span
                  className={clsx(
                    'text-xs border rounded-full px-2.5 py-0.5',
                    GENRE_COLORS[piece.genre] || 'text-parchment/40 border-parchment/20 bg-parchment/5'
                  )}
                >
                  {piece.genre}
                </span>
                {piece.activeRound && (
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <div className="live-dot scale-75" />
                    Round open
                  </span>
                )}
                {piece.status === 'Complete' && (
                  <span className="flex items-center gap-1 text-xs text-parchment/40">
                    <Lock size={10} />
                    Complete
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl text-parchment group-hover:text-gold transition-colors mb-1.5">
                {piece.title}
              </h3>

              <div className="flex items-center gap-4 text-xs text-parchment/40 flex-wrap">
                <span>by {piece.creator}</span>
                <span className="flex items-center gap-1">
                  <BookOpen size={11} />
                  {piece.paragraphCount} sealed paragraphs
                </span>
                <span className="flex items-center gap-1">
                  <Zap size={11} />
                  {piece.totalVotes.toLocaleString()} total votes
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <div className="w-10 h-10 rounded-full bg-parchment/5 border border-parchment/10 flex items-center justify-center group-hover:border-gold/30 group-hover:bg-gold/5 transition-all">
                <ArrowRight size={16} className="text-parchment/30 group-hover:text-gold transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
