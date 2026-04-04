import { motion } from 'framer-motion'
import { Lock, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { shortenAddress, formatTimestamp, explorerAccountUrl } from '@/utils/solana'
import type { SealedParagraph } from '@/types'

interface SealedParagraphCardProps {
  paragraph: SealedParagraph & {
    content?: string | null
    authorHandle?: string
    winningDirection?: string
  }
  index: number
  showChainDetails?: boolean
}

export default function SealedParagraphCard({
  paragraph,
  index,
  showChainDetails = false,
}: SealedParagraphCardProps) {
  const content = paragraph.content || '[ Loading from Arweave... ]'
  const isOpening = paragraph.isOpening

  // Drop cap: split first letter from rest of opening paragraph
  const firstChar = content.charAt(0)
  const restOfContent = content.slice(1)

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group grid grid-cols-[auto_1fr] gap-x-6 gap-y-3"
    >
      {/* Folio number — old-book style */}
      <div className="pt-2 select-none">
        <span className="font-mono text-[10px] text-ink-tertiary tabular-nums tracking-[0.15em] uppercase">
          {String(paragraph.index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Sealed blockquote with before: accent bar (21st.dev pattern) */}
      <blockquote
        className={clsx(
          'relative pl-6',
          'before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full',
          'before:bg-seal before:transition-all',
          'group-hover:before:bg-seal group-hover:before:w-[4px]',
        )}
      >
        {isOpening ? (
          <p className="font-serif text-ink leading-[1.75] text-[17px] mb-0">
            <span
              className="float-left font-mono font-bold text-[56px] leading-[0.85] mr-2 mt-1.5 text-seal"
              aria-hidden
            >
              {firstChar}
            </span>
            {restOfContent}
          </p>
        ) : (
          <p className="font-serif text-ink leading-[1.75] text-[17px] mb-0">
            {content}
          </p>
        )}
      </blockquote>

      {/* Attribution — aligned under blockquote */}
      <div />
      <footer className="flex items-center gap-3 text-xs text-ink-tertiary flex-wrap font-mono pl-6">
        <cite className="not-italic text-ink-secondary">
          {paragraph.authorHandle || shortenAddress(paragraph.author.toString())}
        </cite>
        <span aria-hidden className="bg-ink-tertiary/30 size-1 rounded-full" />
        {!isOpening && (
          <>
            <span className="tabular-nums">{paragraph.voteCount.toLocaleString()} votes</span>
            <span aria-hidden className="bg-ink-tertiary/30 size-1 rounded-full" />
          </>
        )}
        <span className="flex items-center gap-1 text-seal">
          <Lock size={9} />
          sealed on-chain
        </span>

        {showChainDetails && (
          <a
            href={explorerAccountUrl(paragraph.author.toString())}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sage-dark hover:text-sage transition-colors ml-auto"
          >
            <ExternalLink size={10} />
            View proof
          </a>
        )}
      </footer>

      {/* Expanded details */}
      {showChainDetails && (
        <>
          <div />
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pl-6 space-y-3"
          >
            {paragraph.winningDirection && (
              <div className="p-4 rounded-[8px] bg-seal-light/50 border border-seal/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-label uppercase tracking-[0.08em] text-seal font-bold">Winning direction</span>
                  <span className="text-[10px] text-ink-tertiary">· the prompt before Gemini expanded it</span>
                </div>
                <p className="font-serif italic text-ink-secondary text-sm leading-relaxed">
                  "{paragraph.winningDirection}"
                </p>
                <p className="text-xs text-ink-tertiary mt-2 font-mono">
                  {paragraph.authorHandle} · {paragraph.voteCount.toLocaleString()} votes
                </p>
              </div>
            )}

            <div className="p-4 rounded-[8px] bg-parchment/50 border border-straw font-mono text-xs text-ink-secondary space-y-1.5">
              <div><span className="text-ink-tertiary">author </span>{shortenAddress(paragraph.author.toString(), 6)}</div>
              <div><span className="text-ink-tertiary">votes  </span><span className="tabular-nums">{paragraph.voteCount}</span></div>
              <div><span className="text-ink-tertiary">sealed </span>{formatTimestamp(paragraph.sealedAt)}</div>
              <div><span className="text-ink-tertiary">hash   </span>
                {Array.from(paragraph.contentHash).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')}…
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.article>
  )
}
