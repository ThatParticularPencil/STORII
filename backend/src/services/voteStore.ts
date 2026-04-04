/**
 * In-memory vote state store.
 * In production this would be backed by a database,
 * but for the hackathon demo it runs in-memory and is
 * seeded with demo data.
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

    return {
      submissionCount: submission.voteCount,
      totalVotes: round.totalVotes,
    }
  }

  upsertRound(state: RoundState) {
    this.rounds.set(state.roundId, state)
  }

  addSubmission(roundId: string, submission: SubmissionState) {
    const round = this.rounds.get(roundId)
    if (!round) return
    round.submissions.push(submission)
  }

  closeRound(roundId: string, winningSubmissionId: string) {
    const round = this.rounds.get(roundId)
    if (!round) return
    round.status = 'closed'
  }
}
