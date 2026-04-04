import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Users, BarChart2, Share2 } from 'lucide-react'
import SealedParagraphCard from '@/components/SealedParagraphCard'
import OnChainRecord from '@/components/OnChainRecord'
import RoundTimer from '@/components/RoundTimer'
import { DEMO_PARAGRAPHS, DEMO_ACTIVE_ROUND, DEMO_CHAIN_RECORD, DEMO_PIECE } from '@/utils/demo-data'
import { PublicKey } from '@solana/web3.js'
import type { SealedParagraph } from '@/types'

// Convert demo data to typed SealedParagraph
const TYPED_PARAGRAPHS: (SealedParagraph & { content: string; authorHandle: string })[] =
  DEMO_PARAGRAPHS.map((p) => ({
    publicKey: PublicKey.default,
    piece: PublicKey.default,
    index: p.index,
    contentHash: new Uint8Array(32),
    arweaveUri: p.arweaveUri,
    author: PublicKey.default,
    sealedAt: Math.floor(p.sealedAt / 1000),
    voteCount: p.voteCount,
    isOpening: p.isOpening,
    content: p.content,
    authorHandle: p.authorHandle,
  }))

export default function PieceView() {
  const { pieceId } = useParams()
  const [showDetails, setShowDetails] = useState(false)
  const [selectedPara, setSelectedPara] = useState<number | null>(null)
  const isDemo = !pieceId || pieceId.startsWith('demo-')

  const piece = DEMO_PIECE
  const paragraphs = TYPED_PARAGRAPHS
  const activeRound = DEMO_ACTIVE_ROUND

  return (
    <main className="min-h-screen pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-xs text-parchment/40 uppercase tracking-widest mb-2">
                Collaborative piece
              </div>
              <h1 className="font-serif text-4xl md:text-5xl text-parchment leading-tight">
                {piece.title}
              </h1>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="flex-shrink-0 p-2.5 rounded-lg border border-parchment/15 text-parchment/40 hover:text-parchment/70 hover:border-parchment/30 transition-all"
            >
              <Share2 size={16} />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-5 flex-wrap text-sm text-parchment/50">
            <span>by {piece.creatorHandle}</span>
            <span className="flex items-center gap-1.5">
              <Lock size={12} />
              {piece.paragraphCount} sealed paragraphs
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart2 size={12} />
              {piece.roundCount} rounds completed
            </span>
          </div>

          {/* Active round timer */}
          {activeRound && activeRound.status === 'Voting' && (
            <div className="mt-5 flex items-center justify-between p-4 rounded-xl bg-green-400/5 border border-green-400/15">
              <RoundTimer
                deadline={activeRound.votingDeadline}
                label="Voting closes"
              />
              <Link to={`/piece/${pieceId}/round/${activeRound.roundIndex}`}>
                <button className="flex items-center gap-2 text-sm bg-green-400/10 border border-green-400/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-400/20 transition-all">
                  Vote now
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Paragraphs */}
        <div className="space-y-8 mb-12">
          {paragraphs.map((para, i) => (
            <div
              key={para.index}
              onClick={() => setSelectedPara(selectedPara === para.index ? null : para.index)}
              className="cursor-pointer"
            >
              <SealedParagraphCard
                paragraph={para}
                index={i}
                showChainDetails={selectedPara === para.index}
              />
            </div>
          ))}
        </div>

        {/* "Story continues…" prompt if active round */}
        {activeRound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="relative pl-10 border-l border-dashed border-gold/20 pb-8"
          >
            <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full border border-gold/40 bg-ink-900">
              <div className="absolute inset-0.5 rounded-full bg-gold/40 animate-pulse" />
            </div>
            <div className="text-xs text-gold/50 uppercase tracking-widest mb-2">Round {activeRound.roundIndex + 1}</div>
            <p className="font-serif italic text-parchment/40 text-lg mb-4">
              What happens next is being decided right now…
            </p>
            <Link to={`/piece/${pieceId}/round/${activeRound.roundIndex}`}>
              <button className="flex items-center gap-2 bg-gold/10 border border-gold/25 text-gold px-5 py-2.5 rounded-lg font-medium hover:bg-gold/20 transition-all text-sm">
                Read & Vote on Round {activeRound.roundIndex + 1}
                <ArrowRight size={14} />
              </button>
            </Link>
          </motion.div>
        )}

        {/* Full chain record section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mt-16 pt-12 border-t border-parchment/8"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-left mb-6 group"
          >
            <div>
              <div className="text-xs uppercase tracking-widest text-gold/50 mb-1">Blockchain record</div>
              <div className="font-serif text-xl text-parchment group-hover:text-gold transition-colors">
                View paragraph proof — Paragraph 3
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full border border-parchment/15 flex items-center justify-center text-parchment/40 transition-transform ${showDetails ? 'rotate-90' : ''}`}>
              <ArrowRight size={14} />
            </div>
          </button>

          {showDetails && (
            <OnChainRecord record={DEMO_CHAIN_RECORD} />
          )}
        </motion.div>
      </div>
    </main>
  )
}
