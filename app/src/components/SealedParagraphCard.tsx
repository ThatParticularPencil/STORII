import { motion } from 'framer-motion'
import { Lock, ExternalLink } from 'lucide-react'
import { shortenAddress, formatTimestamp, explorerAccountUrl } from '@/utils/solana'
import type { SealedParagraph } from '@/types'

interface SealedParagraphCardProps {
  paragraph: SealedParagraph & { content?: string; authorHandle?: string }
  index: number
  showChainDetails?: boolean
}

export default function SealedParagraphCard({
  paragraph,
  index,
  showChainDetails = false,
}: SealedParagraphCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group"
    >
      <div className="flex gap-6 items-start">
        {/* Part number */}
        <div className="flex-shrink-0 mt-1">
          <span className="font-mono text-xs text-parchment/20 tabular-nums">
            {String(paragraph.index + 1).padStart(2, '0')}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Paragraph text */}
          <p className="font-serif text-parchment/85 leading-[1.85] text-[17px] mb-4">
            {paragraph.content || '[ Loading from Arweave… ]'}
          </p>

          {/* Attribution */}
          <div className="flex items-center gap-4 text-xs text-parchment/30 flex-wrap">
            <span className="text-parchment/45">
              {paragraph.authorHandle || shortenAddress(paragraph.author.toString())}
            </span>

            {!paragraph.isOpening && (
              <>
                <span>·</span>
                <span>{paragraph.voteCount.toLocaleString()} votes</span>
              </>
            )}

            <span>·</span>
            <span className="flex items-center gap-1">
              <Lock size={9} />
              sealed on-chain
            </span>

            {showChainDetails && (
              <a
                href={explorerAccountUrl(paragraph.author.toString())}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-gold/40 hover:text-gold/70 transition-colors ml-auto"
              >
                <ExternalLink size={10} />
                View proof
              </a>
            )}
          </div>

          {/* Expanded details */}
          {showChainDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-3"
            >
              {/* Winning direction — the original community prompt */}
              {paragraph.winningDirection && (
                <div className="p-4 rounded-xl bg-gold/[0.06] border border-gold/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-gold/60 font-medium">Winning direction</span>
                    <span className="text-[10px] text-parchment/25">· the prompt before Gemini expanded it</span>
                  </div>
                  <p className="font-serif italic text-parchment/70 text-sm leading-relaxed">
                    "{paragraph.winningDirection}"
                  </p>
                  <p className="text-xs text-parchment/30 mt-2">
                    {paragraph.authorHandle} · {paragraph.voteCount.toLocaleString()} votes
                  </p>
                </div>
              )}

              {/* Chain record */}
              <div className="p-4 rounded-xl bg-parchment/[0.02] border border-parchment/8 font-mono text-xs text-parchment/50 space-y-1.5">
                <div><span className="text-parchment/30">author </span>{shortenAddress(paragraph.author.toString(), 6)}</div>
                <div><span className="text-parchment/30">votes  </span>{paragraph.voteCount}</div>
                <div><span className="text-parchment/30">sealed </span>{formatTimestamp(paragraph.sealedAt)}</div>
                <div><span className="text-parchment/30">hash   </span>
                  {Array.from(paragraph.contentHash).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')}…
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
