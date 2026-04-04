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
  const isOpening = paragraph.isOpening

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group relative"
    >
      {/* Paragraph number */}
      <div className="flex items-start gap-5">
        <div className="flex-shrink-0 mt-1.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono ${
            isOpening
              ? 'bg-gold/20 border border-gold/40 text-gold'
              : 'bg-parchment/5 border border-parchment/15 text-parchment/40'
          }`}>
            {paragraph.index}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Opening tag */}
          {isOpening && (
            <div className="text-xs text-gold/60 uppercase tracking-widest mb-2 font-sans">
              Opening — by creator
            </div>
          )}

          {/* Paragraph text */}
          <div className="sealed-paragraph">
            <p className="font-serif text-parchment/90 leading-8 text-lg">
              {paragraph.content || '[ Content loading from Arweave... ]'}
            </p>
          </div>

          {/* Attribution row */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-parchment/10 border border-parchment/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-parchment/40" />
              </div>
              <span className="text-xs text-parchment/50">
                {paragraph.authorHandle || shortenAddress(paragraph.author.toString())}
              </span>
            </div>

            {!isOpening && (
              <div className="flex items-center gap-1 text-xs text-parchment/40">
                <span>{paragraph.voteCount.toLocaleString()} votes</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-xs text-parchment/30">
              <Lock size={10} />
              <span>Sealed on-chain</span>
            </div>

            {showChainDetails && (
              <a
                href={explorerAccountUrl(paragraph.author.toString())}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-gold/50 hover:text-gold transition-colors ml-auto"
              >
                <ExternalLink size={10} />
                View proof
              </a>
            )}
          </div>

          {/* Chain details expanded */}
          {showChainDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 rounded-lg bg-ink-100/50 border border-parchment/8"
            >
              <div className="grid grid-cols-2 gap-2 chain-record">
                <RecordField label="Author" value={shortenAddress(paragraph.author.toString(), 6)} />
                <RecordField label="Votes" value={`${paragraph.voteCount} cast`} />
                <RecordField label="Sealed" value={formatTimestamp(paragraph.sealedAt)} />
                <RecordField label="Hash" value={`${Array.from(paragraph.contentHash).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')}…`} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function RecordField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="key">{label}: </span>
      <span className="value">{value}</span>
    </div>
  )
}
