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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className={clsx(
        'rounded-[8px] border p-4 transition-colors duration-200',
        isVotedFor
          ? 'border-sage bg-sage-light/30'
          : isWinning
          ? 'border-sage/40 bg-sage-light/10'
          : 'border-straw bg-paper hover:border-ink-tertiary/30'
      )}
    >
      {/* Contributor + vote count */}
      <div className="flex items-start justify-between mb-2.5 gap-3">
        <span className="text-xs text-ink-tertiary">
          {submission.contributorHandle}
          {isWinning && !hasVoted && (
            <span className="ml-2 text-sage-dark font-medium">· leading</span>
          )}
          {isVotedFor && (
            <span className="ml-2 text-sage">· your vote</span>
          )}
        </span>
        <span className={clsx(
          'text-sm font-mono font-bold tabular-nums flex-shrink-0',
          isWinning ? 'text-sage-dark' : 'text-ink-secondary'
        )}>
          {submission.voteCount.toLocaleString()}
        </span>
      </div>

      {/* Direction text */}
      <p className="text-ink-secondary leading-relaxed text-sm font-serif mb-3">
        {submission.content}
      </p>

      {/* Progress bar */}
      {hasVoted && (
        <div className="mb-3">
          <div className="h-1 bg-parchment rounded-full overflow-hidden">
            <motion.div
              className={clsx(
                'h-full rounded-full',
                isWinning ? 'bg-sage' : 'bg-ink-tertiary/30'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.9, delay: index * 0.05, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-ink-tertiary mt-1">{percentage.toFixed(1)}%</p>
        </div>
      )}

      {/* Vote button */}
      {showVoteButton && !hasVoted && onVote && (
        <button
          onClick={() => onVote(submission.id)}
          className="w-full py-2 rounded-[8px] border border-straw text-ink-secondary text-xs font-mono font-medium hover:border-sage hover:text-sage hover:bg-sage-light/20 transition-all duration-200 active:scale-[0.98]"
        >
          Vote for this direction
        </button>
      )}
    </motion.div>
  )
}
