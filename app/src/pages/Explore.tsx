import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Lock, ArrowUpRight } from 'lucide-react'
import { DEMO_PIECES_EXPLORE } from '@/utils/demo-data'
import { clsx } from 'clsx'

// First lines for each piece — the hook that makes you want to read
const PIECE_HOOKS: Record<string, string> = {
  'demo-piece-1': 'It was the night before the product launch and everything was about to go wrong…',
  'demo-piece-2': 'The last summer at the observatory began the night Dr. Lena Vasquez found the anomaly she had been told didn\'t exist.',
  'demo-piece-3': 'Protocol Sigma was never supposed to happen. That\'s what they said at the debrief. That\'s what made it worse.',
  'demo-piece-4': 'Dear City, I\'m not sure you remember me. I left in March. You didn\'t seem to notice.',
  'demo-piece-5': 'The first thing you learn when building a company is that everyone is lying to you — including yourself.',
}

const GENRE_STYLES: Record<string, string> = {
  'Literary Fiction': 'text-sky-400/70',
  'Sci-Fi Thriller': 'text-purple-400/70',
  'Personal Essay': 'text-emerald-400/70',
  'Startup Memoir': 'text-amber-400/70',
}

export default function Explore() {
  const activeCount = DEMO_PIECES_EXPLORE.filter(p => p.activeRound).length

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
            {activeCount} rounds open · {DEMO_PIECES_EXPLORE.length} pieces
          </p>
        </motion.div>

        {/* Feed */}
        <div className="divide-y divide-parchment/6">
          {DEMO_PIECES_EXPLORE.map((piece, i) => (
            <PieceRow key={piece.id} piece={piece} index={i} />
          ))}
        </div>

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

function PieceRow({
  piece,
  index,
}: {
  piece: (typeof DEMO_PIECES_EXPLORE)[0]
  index: number
}) {
  const hook = PIECE_HOOKS[piece.id]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
    >
      <Link to={`/piece/${piece.id}`}>
        <div className="group py-7 cursor-pointer">
          {/* Genre + status row */}
          <div className="flex items-center gap-3 mb-3 text-xs">
            <span className={clsx('font-medium', GENRE_STYLES[piece.genre] || 'text-parchment/35')}>
              {piece.genre}
            </span>
            <span className="text-parchment/20">·</span>
            {piece.activeRound ? (
              <span className="flex items-center gap-1.5 text-green-400/80">
                <div className="live-dot scale-75" />
                Round open
              </span>
            ) : piece.status === 'Complete' ? (
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

          {/* Hook line */}
          {hook && (
            <p className="font-serif italic text-parchment/35 text-[15px] leading-relaxed mb-4 line-clamp-2">
              {hook}
            </p>
          )}

          {/* Meta + cta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-parchment/30">
              <span>by {piece.creator}</span>
              <span>{piece.paragraphCount} parts sealed</span>
              <span>{piece.totalVotes.toLocaleString()} votes</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-parchment/25 group-hover:text-gold/60 transition-colors">
              <span>{piece.activeRound ? 'Read & vote' : 'Read'}</span>
              <ArrowUpRight size={12} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
