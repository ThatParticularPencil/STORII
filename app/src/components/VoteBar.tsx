import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import type { DemoSubmission } from '@/types'

interface VoteBarProps {
  submission: DemoSubmission
  totalVotes: number
  isWinning?: boolean
  onVote?: (id: string) => void
  hasVoted?: boolean
  userVotedFor?: string
  showVoteButton?: boolean
  index: number
}

export default function VoteBar({
  submission,
  totalVotes,
  isWinning,
  onVote,
  hasVoted,
  userVotedFor,
  showVoteButton = true,
  index,
}: VoteBarProps) {
  const percentage = totalVotes > 0 ? (submission.voteCount / totalVotes) * 100 : 0
  const isVotedFor = userVotedFor === submission.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={clsx(
        'paragraph-card rounded-xl border p-5 transition-all duration-300',
        isWinning
          ? 'border-gold/40 bg-gold/5'
          : isVotedFor
          ? 'border-parchment/20 bg-parchment/5'
          : 'border-parchment/8 bg-white/[0.02]'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-parchment/40">
            #{String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-xs text-parchment/60">
            by{' '}
            <span className="text-parchment/80 font-medium">
              {submission.contributorHandle}
            </span>
          </span>
          {isWinning && (
            <span className="text-xs bg-gold/20 text-gold border border-gold/30 rounded-full px-2 py-0.5 font-medium">
              Leading
            </span>
          )}
        </div>

        {/* Vote count */}
        <div className="text-right flex-shrink-0">
          <span className={clsx(
            'text-lg font-semibold font-mono',
            isWinning ? 'text-gold' : 'text-parchment/70'
          )}>
            {submission.voteCount.toLocaleString()}
          </span>
          <span className="text-xs text-parchment/40 ml-1">votes</span>
        </div>
      </div>

      {/* Paragraph text */}
      <p className="font-serif text-parchment/85 leading-7 text-base mb-4 line-clamp-4">
        {submission.content}
      </p>

      {/* Vote bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-parchment/40 mb-1.5">
          <span>{percentage.toFixed(1)}% of votes</span>
        </div>
        <div className="h-2 bg-parchment/8 rounded-full overflow-hidden">
          <motion.div
            className={clsx(
              'h-full rounded-full',
              isWinning
                ? 'bg-gradient-to-r from-gold to-gold-light'
                : 'bg-gradient-to-r from-parchment/30 to-parchment/50'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: index * 0.1 + 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Vote button */}
      {showVoteButton && !hasVoted && onVote && (
        <button
          onClick={() => onVote(submission.id)}
          className="w-full py-2.5 rounded-lg border border-gold/30 text-gold text-sm font-medium hover:bg-gold/10 hover:border-gold/60 transition-all duration-200 active:scale-98"
        >
          Cast Vote
        </button>
      )}

      {showVoteButton && isVotedFor && (
        <div className="w-full py-2.5 rounded-lg border border-parchment/20 bg-parchment/5 text-parchment/50 text-sm font-medium text-center">
          You voted for this
        </div>
      )}
    </motion.div>
  )
}
