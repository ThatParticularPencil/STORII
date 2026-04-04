import { motion } from 'framer-motion'
import { ExternalLink, Lock, Hash, Clock, User, BarChart2 } from 'lucide-react'
import type { ChainRecord } from '@/types'
import { explorerAccountUrl } from '@/utils/solana'

interface OnChainRecordProps {
  record: ChainRecord
  className?: string
}

export default function OnChainRecord({ record, className = '' }: OnChainRecordProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`rounded-2xl border border-gold/20 bg-gold/[0.03] overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gold/10 bg-gold/5">
        <div className="animate-seal-stamp">
          <SealIcon />
        </div>
        <div>
          <div className="text-xs text-gold/60 uppercase tracking-widest font-sans">
            Permanently Sealed on Solana
          </div>
          <div className="text-sm text-parchment font-medium font-serif mt-0.5">
            {record.pieceTitle}
          </div>
        </div>
        <div className="ml-auto">
          <div className="text-xs font-mono text-parchment/40 text-right">
            Paragraph {record.paragraphIndex}
          </div>
          <div className="text-xs text-parchment/30 text-right">
            of {record.totalParagraphs} sealed
          </div>
        </div>
      </div>

      {/* Chain data */}
      <div className="p-5 grid grid-cols-1 gap-3">
        <RecordRow
          icon={<User size={13} />}
          label="Author"
          value={record.authorWallet}
          mono
          link={explorerAccountUrl(record.authorWallet)}
        />
        <RecordRow
          icon={<BarChart2 size={13} />}
          label="Votes received"
          value={`${record.votesReceived.toLocaleString()} of ${record.totalVotesCast.toLocaleString()} cast (${((record.votesReceived / record.totalVotesCast) * 100).toFixed(1)}%)`}
        />
        <RecordRow
          icon={<Clock size={13} />}
          label="Sealed"
          value={record.sealedAt}
        />
        <RecordRow
          icon={<Hash size={13} />}
          label="Content hash"
          value={record.contentHash}
          mono
        />
        <RecordRow
          icon={<Lock size={13} />}
          label="Arweave URI"
          value={record.arweaveUri}
          mono
          link={`https://viewblock.io/arweave/tx/${record.arweaveUri.replace('ar://', '')}`}
        />
        <RecordRow
          icon={<Lock size={13} />}
          label="Program ID"
          value={record.programId}
          mono
          link={explorerAccountUrl(record.programId)}
        />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gold/10 flex items-center justify-between">
        <span className="text-xs text-parchment/30 font-sans">
          This record cannot be edited, deleted, or disputed.
        </span>
        <a
          href={explorerAccountUrl(record.programId)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-gold/60 hover:text-gold transition-colors"
        >
          <ExternalLink size={11} />
          View on Explorer
        </a>
      </div>
    </motion.div>
  )
}

function RecordRow({
  icon,
  label,
  value,
  mono = false,
  link,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
  link?: string
}) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-gold/50 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-parchment/40 mb-0.5">{label}</div>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm text-parchment/80 hover:text-parchment break-all transition-colors flex items-center gap-1 ${
              mono ? 'font-mono text-xs' : ''
            }`}
          >
            {value}
            <ExternalLink size={10} className="flex-shrink-0 text-parchment/40" />
          </a>
        ) : (
          <div
            className={`text-sm text-parchment/80 break-all ${
              mono ? 'font-mono text-xs' : ''
            }`}
          >
            {value}
          </div>
        )}
      </div>
    </div>
  )
}

function SealIcon() {
  return (
    <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2L12.5 7L18 8L14 12L15 18L10 15.5L5 18L6 12L2 8L7.5 7L10 2Z"
          fill="#c9a84c"
          opacity="0.2"
          stroke="#c9a84c"
          strokeWidth="1.2"
        />
        <path d="M7 10L9 12L13 8" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}
