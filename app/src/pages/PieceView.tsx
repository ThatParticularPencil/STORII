import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Share2, CheckCircle2, BarChart2, Loader2 } from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import SealedParagraphCard from '@/components/SealedParagraphCard'
import OnChainRecord from '@/components/OnChainRecord'
import RoundTimer from '@/components/RoundTimer'
import { usePiece } from '@/hooks/usePiece'
import { DEMO_CHAIN_RECORD } from '@/utils/demo-data'
import { PublicKey } from '@solana/web3.js'
import type { SealedParagraph } from '@/types'

const MAX_PARAGRAPHS = 8

export default function PieceView() {
  const { pieceId } = useParams()
  const [showDetails, setShowDetails] = useState(false)
  const [selectedPara, setSelectedPara] = useState<number | null>(null)

  const { role } = useRole()
  const isCreator = role === 'creator'

  const { piece, loading, error } = usePiece(pieceId)

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen pt-14 pb-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-parchment/30">
          <Loader2 size={20} className="animate-spin" />
          <p className="text-sm">Loading from chain…</p>
        </div>
      </main>
    )
  }

  if (!piece) {
    return (
      <main className="min-h-screen pt-14 pb-24 flex items-center justify-center">
        <p className="text-parchment/30 text-sm">Piece not found on chain.</p>
      </main>
    )
  }

  const isComplete = piece.paragraphCount >= MAX_PARAGRAPHS
  const activeRound = piece.activeRound

  // Convert usePiece paragraphs to the SealedParagraphCard shape
  const paragraphs = piece.paragraphs.map(p => ({
    publicKey: PublicKey.default,
    piece:     PublicKey.default,
    index:     p.index,
    contentHash: new Uint8Array(32),
    arweaveUri:  p.arweaveUri,
    author:      PublicKey.default,
    sealedAt:    p.sealedAt,
    voteCount:   p.voteCount,
    isOpening:   p.isOpening,
    // Off-chain extras
    content:          (p as any).content,
    authorHandle:     (p as any).authorHandle,
    winningDirection: (p as any).winningDirection,
  } as SealedParagraph & { content: string | null; authorHandle?: string; winningDirection?: string }))

  return (
    <main className="min-h-screen pt-14 pb-24">
      <div className="max-w-2xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-12 mb-10 border-b border-parchment/6 pb-8"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              <p className="text-xs text-parchment/30 mb-2">
                by {piece.creatorHandle ?? `${piece.creator.slice(0, 4)}…${piece.creator.slice(-4)}`}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl text-parchment leading-snug">
                {piece.title}
              </h1>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="flex-shrink-0 p-2 text-parchment/25 hover:text-parchment/55 transition-colors mt-1"
              title="Copy link"
            >
              <Share2 size={15} />
            </button>
          </div>

          {/* Part progress bar */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-parchment/30 mb-1.5">
                <span>{piece.paragraphCount} of {MAX_PARAGRAPHS} parts sealed</span>
                {isComplete && <span className="text-gold/70 font-medium">Complete</span>}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: MAX_PARAGRAPHS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < piece.paragraphCount ? 'bg-gold/60' : 'bg-parchment/8'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-parchment/25">
              <span className="flex items-center gap-1">
                <Lock size={9} />
                {piece.roundCount} rounds
              </span>
              {error && (
                <span className="text-amber-400/50">⚠ Chain read error — showing cached data</span>
              )}
            </div>
          </div>

          {/* Complete banner */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2.5 p-3 rounded-xl bg-gold/5 border border-gold/15"
            >
              <CheckCircle2 size={14} className="text-gold/70 flex-shrink-0" />
              <p className="text-xs text-parchment/60">
                All {MAX_PARAGRAPHS} parts sealed on-chain. This story is complete.
              </p>
            </motion.div>
          )}

          {/* Active round banner */}
          {!isComplete && activeRound && activeRound.status === 'Voting' && (
            <div className="mt-4 flex items-center justify-between p-3 rounded-xl border border-parchment/10 bg-parchment/[0.02]">
              <RoundTimer deadline={activeRound.votingDeadline} label="Voting closes" />
              {isCreator ? (
                <span className="flex items-center gap-1.5 text-xs text-parchment/30">
                  <BarChart2 size={11} />
                  {activeRound.totalVotes.toLocaleString()} votes live
                </span>
              ) : (
                <Link to={`/piece/${pieceId}/round/${activeRound.roundIndex}`}>
                  <button className="flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold transition-colors font-medium">
                    Vote now
                    <ArrowRight size={12} />
                  </button>
                </Link>
              )}
            </div>
          )}

          {!isComplete && activeRound && activeRound.status === 'Submissions' && (
            <div className="mt-4 flex items-center justify-between p-3 rounded-xl border border-parchment/10 bg-parchment/[0.02]">
              <RoundTimer deadline={activeRound.submissionDeadline} label="Submissions close" />
              {!isCreator && (
                <Link to={`/piece/${pieceId}/round/${activeRound.roundIndex}`}>
                  <button className="flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold transition-colors font-medium">
                    Submit direction
                    <ArrowRight size={12} />
                  </button>
                </Link>
              )}
            </div>
          )}
        </motion.div>

        {/* Paragraphs */}
        <div className="divide-y divide-parchment/5 mb-12">
          {paragraphs.map((para, i) => (
            <div
              key={para.index}
              onClick={() => setSelectedPara(selectedPara === para.index ? null : para.index)}
              className="py-7 cursor-pointer"
            >
              <SealedParagraphCard
                paragraph={para}
                index={i}
                showChainDetails={selectedPara === para.index}
              />
            </div>
          ))}
        </div>

        {/* Story continues */}
        {!isComplete && activeRound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-14"
          >
            <p className="font-serif italic text-parchment/25 text-lg mb-4">
              {isCreator
                ? 'Your community is deciding what happens next…'
                : 'What happens next is being decided right now…'
              }
            </p>
            {isCreator ? (
              <div className="flex items-center gap-5 text-xs text-parchment/30">
                <span className="flex items-center gap-1.5">
                  <BarChart2 size={11} />
                  {activeRound.totalVotes.toLocaleString()} votes cast
                </span>
                <span>{activeRound.submissionCount} directions submitted</span>
                <span className="text-parchment/20">Round {activeRound.roundIndex + 1} in progress</span>
              </div>
            ) : (
              <Link to={`/piece/${pieceId}/round/${activeRound.roundIndex}`}>
                <button className="flex items-center gap-2 text-sm text-gold/60 hover:text-gold transition-colors">
                  Read & vote on Round {activeRound.roundIndex + 1}
                  <ArrowRight size={13} />
                </button>
              </Link>
            )}
          </motion.div>
        )}

        {/* On-chain record */}
        <div className="border-t border-parchment/6 pt-10">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-left group mb-5"
          >
            <div>
              <p className="text-xs text-parchment/30 mb-1">Blockchain record</p>
              <p className="font-serif text-parchment/70 group-hover:text-parchment transition-colors">
                On-chain proof for Part {piece.paragraphCount}
              </p>
            </div>
            <ArrowRight
              size={14}
              className={`text-parchment/25 transition-transform ${showDetails ? 'rotate-90' : ''}`}
            />
          </button>

          {showDetails && (() => {
            const lastPara = piece.paragraphs[piece.paragraphs.length - 1]
            return (
              <OnChainRecord record={{
                pieceTitle:     piece.title,
                paragraphIndex: piece.paragraphCount,
                totalParagraphs: MAX_PARAGRAPHS,
                authorWallet:   lastPara?.authorHandle ?? DEMO_CHAIN_RECORD.authorWallet,
                votesReceived:  lastPara?.voteCount ?? DEMO_CHAIN_RECORD.votesReceived,
                totalVotesCast: activeRound?.totalVotes ?? DEMO_CHAIN_RECORD.totalVotesCast,
                sealedBlock:    DEMO_CHAIN_RECORD.sealedBlock,
                sealedAt:       DEMO_CHAIN_RECORD.sealedAt,
                contentHash:    lastPara ? `${lastPara.arweaveUri.slice(0, 20)}…` : DEMO_CHAIN_RECORD.contentHash,
                arweaveUri:     lastPara?.arweaveUri ?? DEMO_CHAIN_RECORD.arweaveUri,
                programId:      DEMO_CHAIN_RECORD.programId,
              }} />
            )
          })()}
        </div>
      </div>
    </main>
  )
}
