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
        'rounded-xl border p-4 transition-colors duration-200',
        isVotedFor
          ? 'border-parchment/20 bg-parchment/[0.03]'
          : isWinning
          ? 'border-gold/25 bg-gold/[0.03]'
          : 'border-parchment/8 bg-transparent hover:border-parchment/14'
      )}
    >
      {/* Contributor + vote count */}
      <div className="flex items-start justify-between mb-2.5 gap-3">
        <span className="text-xs text-parchment/40">
          {submission.contributorHandle}
          {isWinning && !hasVoted && (
            <span className="ml-2 text-gold/60 font-medium">· leading</span>
          )}
          {isVotedFor && (
            <span className="ml-2 text-parchment/40">· your vote</span>
          )}
        </span>
        <span className={clsx(
          'text-sm font-mono font-medium tabular-nums flex-shrink-0',
          isWinning ? 'text-gold/80' : 'text-parchment/50'
        )}>
          {submission.voteCount.toLocaleString()}
        </span>
      </div>

      {/* Direction text */}
      <p className="text-parchment/75 leading-relaxed text-sm mb-3">
        {submission.content}
      </p>

      {/* Progress bar */}
      {hasVoted && (
        <div className="mb-3">
          <div className="h-1 bg-parchment/6 rounded-full overflow-hidden">
            <motion.div
              className={clsx(
                'h-full rounded-full',
                isWinning ? 'bg-gold/60' : 'bg-parchment/20'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.9, delay: index * 0.05, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-parchment/25 mt-1">{percentage.toFixed(1)}%</p>
        </div>
      )}

      {/* Vote button */}
      {showVoteButton && !hasVoted && onVote && (
        <button
          onClick={() => onVote(submission.id)}
          className="w-full py-2 rounded-lg border border-parchment/15 text-parchment/50 text-xs font-medium hover:border-gold/30 hover:text-gold/70 hover:bg-gold/[0.04] transition-all duration-200 active:scale-[0.98]"
        >
          Vote for this direction
        </button>
      )}
    </motion.div>
  )
}
