import { useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Share2, CheckCircle2, BarChart2, Loader2, Copy, Check, Sparkles } from 'lucide-react'
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
  const location = useLocation()
  const [showDetails, setShowDetails] = useState(false)
  const [selectedPara, setSelectedPara] = useState<number | null>(null)

  const { role } = useRole()
  const isCreator = role === 'creator'
  const [copied, setCopied] = useState(false)

  const preserveDemoProgress = location.state?.preserveDemoProgress === true
  const { piece, loading, error } = usePiece(pieceId, {
    resetDemoOnLoad: !preserveDemoProgress,
  })

  const handleCopyScript = () => {
    if (!piece) return
    const fullScript = piece.paragraphs
      .map((p, i) => {
        const label = i === 0 ? 'OPENING' : `SCENE ${i}`
        return `— ${label} —\n\n${(p as any).content ?? ''}`
      })
      .join('\n\n\n')
    navigator.clipboard.writeText(`${piece.title}\n\n${fullScript}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
          id="story-top"
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
            <div className="flex items-center gap-1 flex-shrink-0 mt-1">
              {isCreator && piece && piece.paragraphs.length > 0 && (
                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-parchment/12 text-parchment/40 hover:text-parchment/70 hover:border-parchment/25 transition-all text-xs font-medium"
                  title="Copy full script"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy script'}
                </button>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="p-2 text-parchment/25 hover:text-parchment/55 transition-colors"
                title="Copy link"
              >
                <Share2 size={15} />
              </button>
            </div>
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
          {!isComplete && activeRound && (
            <div className="mt-4 p-3 rounded-xl border border-parchment/10 bg-parchment/[0.02]">
              <div className="flex items-center justify-between">
                {activeRound.status === 'Voting' && <RoundTimer deadline={activeRound.votingDeadline} label="Voting closes" />}
                {activeRound.status === 'Submissions' && <RoundTimer deadline={activeRound.submissionDeadline} label="Submissions close" />}
                {activeRound.status === 'Runoff' && <RoundTimer deadline={activeRound.runoffDeadline} label="Runoff closes" />}
                {activeRound.status !== 'Voting' && activeRound.status !== 'Submissions' && activeRound.status !== 'Runoff' && (
                  <span className="text-xs text-parchment/30">Round {activeRound.roundIndex + 1}</span>
                )}
                <div className="flex items-center gap-2">
                  {isCreator && (
                    <span className="flex items-center gap-1.5 text-xs text-parchment/30">
                      <BarChart2 size={11} />
                      {activeRound.totalVotes.toLocaleString()} votes
                    </span>
                  )}
                  {!isCreator && (
                    <Link to={`/piece/${pieceId}/round/${activeRound.roundIndex}`}>
                      <button className="flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold transition-colors font-medium">
                        {activeRound.status === 'Submissions' ? 'Submit direction' : activeRound.status === 'Runoff' ? 'Vote in runoff' : 'Vote now'}
                        <ArrowRight size={12} />
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Paragraphs */}
        <div className="divide-y divide-parchment/5 mb-12">
          {paragraphs.map((para, i) => {
            const isLatest = i === paragraphs.length - 1 && paragraphs.length > 1
            return (
              <div
                key={para.index}
                onClick={() => setSelectedPara(selectedPara === para.index ? null : para.index)}
                className="py-7 cursor-pointer"
              >
                {isLatest && (
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={11} className="text-gold/60" />
                    <span className="text-[10px] uppercase tracking-widest text-gold/50 font-medium">
                      Latest scene · expanded from the winning choice
                    </span>
                  </div>
                )}
                <SealedParagraphCard
                  paragraph={para}
                  index={i}
                  showChainDetails={selectedPara === para.index}
                />
              </div>
            )
          })}
        </div>

        {/* Next round CTA */}
        {!isComplete && activeRound && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-14 p-6 rounded-2xl border border-gold/15 bg-gold/[0.03]"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                <span className="text-gold text-xs font-bold font-mono">{activeRound.roundIndex + 1}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-parchment/80">Round {activeRound.roundIndex + 1} is live</p>
                <p className="text-xs text-parchment/40 mt-0.5">
                  {activeRound.status === 'Submissions' && `${activeRound.submissionCount} directions submitted · submit yours before time runs out`}
                  {activeRound.status === 'Voting' && `${activeRound.totalVotes.toLocaleString()} votes cast · pick the direction you want`}
                  {activeRound.status === 'Runoff' && `Top ${Math.min(activeRound.submissionCount, 5)} finalists · ${activeRound.totalRunoffVotes.toLocaleString()} runoff votes`}
                  {activeRound.status === 'Closed' && 'Generating next scene…'}
                </p>
              </div>
            </div>

            {isCreator ? (
              <div className="flex items-center gap-4 text-xs text-parchment/30">
                <span className="flex items-center gap-1.5"><BarChart2 size={11} />{activeRound.totalVotes.toLocaleString()} votes</span>
                <span>{activeRound.submissionCount} directions</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to={`/piece/${pieceId}/round/${activeRound.roundIndex}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-2 h-10 rounded-full bg-gold text-ink-900 text-sm font-semibold hover:brightness-110 transition-all">
                    {activeRound.status === 'Submissions' ? 'Submit a direction' : 'Vote now'}
                    <ArrowRight size={13} />
                  </button>
                </Link>
                <a href="#story-top" className="flex items-center gap-1.5 text-xs text-parchment/35 hover:text-parchment/60 transition-colors whitespace-nowrap">
                  Read story
                </a>
              </div>
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
