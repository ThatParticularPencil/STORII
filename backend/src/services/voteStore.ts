/**
 * In-memory vote state store.
 *
 * In demo mode this is seeded with fake data.
 * In production, it is populated by the Solana on-chain listener in solana.ts,
 * which decodes real Submission account changes and calls setVoteCount().
 */

interface SubmissionState {
  id: string
  content: string
  contributor: string
  contributorHandle: string
  voteCount: number
}

interface RoundState {
  roundId: string
  pieceId: string
  status: 'submissions' | 'voting' | 'closed'
  totalVotes: number
  submissions: SubmissionState[]
}

export class VoteStore {
  private rounds = new Map<string, RoundState>()

  constructor() {
    this.seedDemoData()
  }

  private seedDemoData() {
    this.rounds.set('demo-round-3', {
      roundId: 'demo-round-3',
      pieceId: 'demo-piece-1',
      status: 'voting',
      totalVotes: 316,
      submissions: [
        {
          id: 'sub-1',
          content: 'She refreshed the dashboard again. Still red…',
          contributor: '5pNm...8kLj',
          contributorHandle: '@techwriter_ravi',
          voteCount: 89,
        },
        {
          id: 'sub-2',
          content: 'Marcus, the lead engineer, had seen this exact face before…',
          contributor: '2wXq...5mRo',
          contributorHandle: '@storyhunter_em',
          voteCount: 127,
        },
        {
          id: 'sub-3',
          content: '"How long?" asked the VP on speakerphone…',
          contributor: '9cYs...3vPt',
          contributorHandle: '@inkandcode',
          voteCount: 100,
        },
      ],
    })
  }

  getRoundState(roundId: string): RoundState | undefined {
    return this.rounds.get(roundId)
  }

  // ── Called by the Socket.io vote:cast event (demo frontend path) ─────────────

  recordVote(
    roundId: string,
    submissionId: string
  ): { submissionCount: number; totalVotes: number } | null {
    const round = this.rounds.get(roundId)
    if (!round || round.status !== 'voting') return null

    const submission = round.submissions.find(s => s.id === submissionId)
    if (!submission) return null

    submission.voteCount++
    round.totalVotes++

    return { submissionCount: submission.voteCount, totalVotes: round.totalVotes }
  }

  // ── Called by the real Solana on-chain listener (production path) ────────────

  /**
   * Directly sets a submission's vote count (decoded from chain data).
   * Recalculates round.totalVotes from the sum of all submission counts.
   */
  setVoteCount(
    roundId: string,
    submissionId: string,
    count: number
  ): { submissionCount: number; totalVotes: number } | null {
    let round = this.rounds.get(roundId)

    // Auto-create a round entry if the listener sees it for the first time
    if (!round) {
      round = {
        roundId,
        pieceId: '',
        status: 'voting',
        totalVotes: 0,
        submissions: [],
      }
      this.rounds.set(roundId, round)
    }

    let sub = round.submissions.find(s => s.id === submissionId)
    if (!sub) {
      sub = { id: submissionId, content: '', contributor: '', contributorHandle: '', voteCount: 0 }
      round.submissions.push(sub)
    }

    sub.voteCount = count
    round.totalVotes = round.submissions.reduce((t, s) => t + s.voteCount, 0)

    return { submissionCount: sub.voteCount, totalVotes: round.totalVotes }
  }

  upsertRound(state: RoundState) {
    this.rounds.set(state.roundId, state)
  }

  addSubmission(roundId: string, submission: SubmissionState) {
    const round = this.rounds.get(roundId)
    if (!round) return
    round.submissions.push(submission)
  }

  closeRound(roundId: string) {
    const round = this.rounds.get(roundId)
    if (!round) return
    round.status = 'closed'
  }
}
