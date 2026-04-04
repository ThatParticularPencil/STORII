import { randomUUID } from 'crypto'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StoredSubmission {
  id: string
  roundId: string
  pieceId: string
  contributor: string
  content: string
  contentHash: string
  voteCount: number        // first-round votes
  runoffVoteCount: number  // runoff votes (only set for top-5)
  submittedAt: number
  votes: Set<string>       // wallets that cast first-round vote for this
}

export type RoundStatus = 'Submissions' | 'Voting' | 'Runoff' | 'Closed'

export interface StoredRound {
  id: string
  pieceId: string
  roundIndex: number
  status: RoundStatus
  submissionDeadline: number   // unix ms
  votingDeadline: number       // unix ms
  runoffDeadline: number       // unix ms — set when runoff opens
  totalVotes: number           // first-round total
  totalRunoffVotes: number
  maxSubmissions: number
  winningSubmissionId: string | null
  submissions: Map<string, StoredSubmission>
  voterSet: Set<string>        // first-round voters
  runoffPool: string[]         // top-5 submission IDs
  runoffVoterSet: Set<string>  // runoff voters
}

export interface StoredParagraph {
  index: number
  content: string
  author: string
  sealedAt: number
  voteCount: number
}

export interface StoredPiece {
  id: string
  title: string
  creator: string
  createdAt: number
  status: 'Active' | 'Complete'
  openingText: string
  rounds: Map<number, StoredRound>
  paragraphs: StoredParagraph[]
}

// ── Store ─────────────────────────────────────────────────────────────────────

const pieces = new Map<string, StoredPiece>()

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getActiveRound(piece: StoredPiece): StoredRound | null {
  for (const round of piece.rounds.values()) {
    if (round.status !== 'Closed') return round
  }
  return null
}

function makeRound(pieceId: string, roundIndex: number, subDeadline: number, voteDeadline: number, maxSubmissions: number): StoredRound {
  return {
    id: randomUUID(),
    pieceId,
    roundIndex,
    status: 'Submissions',
    submissionDeadline: subDeadline,
    votingDeadline: voteDeadline,
    runoffDeadline: 0,
    totalVotes: 0,
    totalRunoffVotes: 0,
    maxSubmissions,
    winningSubmissionId: null,
    submissions: new Map(),
    voterSet: new Set(),
    runoffPool: [],
    runoffVoterSet: new Set(),
  }
}

// ── Auto-advance ─────────────────────────────────────────────────────────────

const RUNOFF_MINUTES = 0.5  // 30 seconds

/**
 * Advance a round's status based on elapsed deadlines.
 * Called every time the piece is fetched so the frontend never needs to POST
 * transition endpoints just to unblock itself.
 */
export function maybeAdvanceRound(piece: StoredPiece): void {
  const round = getActiveRound(piece)
  if (!round) return
  const now = Date.now()

  if (round.status === 'Submissions' && round.submissionDeadline < now) {
    if (round.submissions.size <= 5) {
      // Skip first-vote — go straight to runoff
      startRunoff(piece.id, round.roundIndex, RUNOFF_MINUTES)
    } else {
      moveRoundToVoting(piece.id, round.roundIndex)
    }
    return
  }

  if (round.status === 'Voting' && round.votingDeadline < now) {
    startRunoff(piece.id, round.roundIndex, RUNOFF_MINUTES)
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function getPiece(id: string): StoredPiece | undefined {
  const piece = pieces.get(id)
  if (piece) maybeAdvanceRound(piece)
  return piece
}

export function getAllPieces(): StoredPiece[] {
  const all = Array.from(pieces.values())
  all.forEach(maybeAdvanceRound)
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export function getRound(pieceId: string, roundIndex: number): StoredRound | undefined {
  return pieces.get(pieceId)?.rounds.get(roundIndex)
}

export function getRoundById(roundId: string): { piece: StoredPiece; round: StoredRound } | null {
  for (const piece of pieces.values()) {
    for (const round of piece.rounds.values()) {
      if (round.id === roundId) return { piece, round }
    }
  }
  return null
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function createPiece(opts: {
  id?: string
  title: string
  creator: string
  openingText: string
  submissionHours: number
  votingHours: number
  maxSubmissions: number
}): StoredPiece {
  const id = opts.id ?? randomUUID()
  const now = Date.now()
  const subDeadline  = now + opts.submissionHours * 3_600_000
  const voteDeadline = subDeadline + opts.votingHours * 3_600_000

  const round0 = makeRound(id, 0, subDeadline, voteDeadline, opts.maxSubmissions)

  const piece: StoredPiece = {
    id,
    title: opts.title,
    creator: opts.creator,
    createdAt: now,
    status: 'Active',
    openingText: opts.openingText,
    rounds: new Map([[0, round0]]),
    paragraphs: [{ index: 0, content: opts.openingText, author: opts.creator, sealedAt: now, voteCount: 0 }],
  }

  pieces.set(id, piece)
  console.log(`[pieceStore] Created "${opts.title}" id=${id}`)
  return piece
}

export function addSubmission(opts: {
  pieceId: string
  roundIndex: number
  contributor: string
  content: string
  contentHash: string
}): StoredSubmission | { error: string } {
  const piece = pieces.get(opts.pieceId)
  if (!piece) return { error: 'Piece not found' }
  const round = piece.rounds.get(opts.roundIndex)
  if (!round) return { error: 'Round not found' }
  if (round.status !== 'Submissions') return { error: 'Submissions are closed' }
  if (round.submissions.size >= round.maxSubmissions) return { error: 'Round is full' }
  for (const s of round.submissions.values()) {
    if (s.contributor === opts.contributor) return { error: 'Already submitted this round' }
  }

  const sub: StoredSubmission = {
    id: randomUUID(),
    roundId: round.id,
    pieceId: opts.pieceId,
    contributor: opts.contributor,
    content: opts.content,
    contentHash: opts.contentHash,
    voteCount: 0,
    runoffVoteCount: 0,
    submittedAt: Date.now(),
    votes: new Set(),
  }
  round.submissions.set(sub.id, sub)
  return sub
}

/** Close submissions → open first-round voting on all directions. */
export function moveRoundToVoting(pieceId: string, roundIndex: number): boolean {
  const round = pieces.get(pieceId)?.rounds.get(roundIndex)
  if (!round || round.status !== 'Submissions') return false
  round.status = 'Voting'
  return true
}

/** First-round vote on any submission. */
export function castVote(opts: {
  pieceId: string
  roundIndex: number
  submissionId: string
  voter: string
}): { ok: true; newCount: number; totalVotes: number } | { error: string } {
  const piece = pieces.get(opts.pieceId)
  if (!piece) return { error: 'Piece not found' }
  const round = piece.rounds.get(opts.roundIndex)
  if (!round) return { error: 'Round not found' }
  if (round.status !== 'Voting') return { error: 'Voting is not open' }
  if (round.voterSet.has(opts.voter)) return { error: 'Already voted' }
  const sub = round.submissions.get(opts.submissionId)
  if (!sub) return { error: 'Submission not found' }
  if (sub.contributor === opts.voter) return { error: 'Cannot vote for your own direction' }

  sub.voteCount++
  sub.votes.add(opts.voter)
  round.totalVotes++
  round.voterSet.add(opts.voter)
  return { ok: true, newCount: sub.voteCount, totalVotes: round.totalVotes }
}

/**
 * First-round voting closes → pick top 5 → open runoff.
 * Returns the 5 finalists (already sorted desc by voteCount).
 */
export function startRunoff(pieceId: string, roundIndex: number, runoffMinutes: number): StoredSubmission[] | { error: string } {
  const piece = pieces.get(pieceId)
  if (!piece) return { error: 'Piece not found' }
  const round = piece.rounds.get(roundIndex)
  if (!round) return { error: 'Round not found' }
  if (round.status !== 'Voting' && round.status !== 'Submissions') return { error: 'Not in a stage that can start runoff' }

  const sorted = Array.from(round.submissions.values())
    .sort((a, b) => b.voteCount - a.voteCount)

  const top5 = sorted.slice(0, 5)
  round.runoffPool = top5.map(s => s.id)
  round.runoffDeadline = Date.now() + runoffMinutes * 60_000
  round.status = 'Runoff'
  return top5
}

/** Runoff vote — separate voter set, only allowed on runoffPool submissions. */
export function castRunoffVote(opts: {
  pieceId: string
  roundIndex: number
  submissionId: string
  voter: string
}): { ok: true; newCount: number; totalRunoffVotes: number } | { error: string } {
  const piece = pieces.get(opts.pieceId)
  if (!piece) return { error: 'Piece not found' }
  const round = piece.rounds.get(opts.roundIndex)
  if (!round) return { error: 'Round not found' }
  if (round.status !== 'Runoff') return { error: 'Runoff is not open' }
  if (!round.runoffPool.includes(opts.submissionId)) return { error: 'Not in runoff' }
  if (round.runoffVoterSet.has(opts.voter)) return { error: 'Already voted in runoff' }
  const sub = round.submissions.get(opts.submissionId)
  if (!sub) return { error: 'Submission not found' }
  if (sub.contributor === opts.voter) return { error: 'Cannot vote for your own direction' }

  sub.runoffVoteCount++
  round.totalRunoffVotes++
  round.runoffVoterSet.add(opts.voter)
  return { ok: true, newCount: sub.runoffVoteCount, totalRunoffVotes: round.totalRunoffVotes }
}

/**
 * Seal the round: close it, store the Gemini script as the new paragraph,
 * and automatically open the next round.
 */
export function sealRound(opts: {
  pieceId: string
  roundIndex: number
  winningSubmissionId: string
  geminiScript: string
}): StoredPiece | { error: string } {
  const piece = pieces.get(opts.pieceId)
  if (!piece) return { error: 'Piece not found' }
  const round = piece.rounds.get(opts.roundIndex)
  if (!round) return { error: 'Round not found' }
  if (round.status === 'Closed') return piece  // already sealed — return piece without re-processing

  round.status = 'Closed'
  round.winningSubmissionId = opts.winningSubmissionId

  const winningSub = round.submissions.get(opts.winningSubmissionId)
  piece.paragraphs.push({
    index: piece.paragraphs.length,
    content: opts.geminiScript || winningSub?.content || '',
    author: 'gemini',
    sealedAt: Date.now(),
    voteCount: winningSub?.runoffVoteCount ?? winningSub?.voteCount ?? 0,
  })

  const nextIndex = opts.roundIndex + 1
  const MAX_ROUNDS = 8
  if (nextIndex < MAX_ROUNDS) {
    const now = Date.now()
    const minHours = 0.5 / 60  // 30 seconds
    const next = makeRound(opts.pieceId, nextIndex, now + minHours * 3_600_000, now + 2 * minHours * 3_600_000, round.maxSubmissions)
    piece.rounds.set(nextIndex, next)
    console.log(`[pieceStore] Round ${nextIndex} opened for "${piece.title}"`)
  } else {
    piece.status = 'Complete'
    console.log(`[pieceStore] Story "${piece.title}" is complete!`)
  }

  return piece
}
