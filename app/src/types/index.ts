import { PublicKey } from '@solana/web3.js'

// ── Enums (mirror Anchor program) ─────────────────────────────────────────────

export type PieceStatus = 'Active' | 'Complete'
export type RoundStatus = 'Submissions' | 'Voting' | 'Closed'
export type SubscriberTier = 'InnerCircle' | 'Community' | 'Reader'

// ── On-chain account shapes ───────────────────────────────────────────────────

export interface Piece {
  publicKey: PublicKey
  creator: PublicKey
  title: string
  status: PieceStatus
  paragraphCount: number
  roundCount: number
  createdAt: number
}

export interface Round {
  publicKey: PublicKey
  piece: PublicKey
  roundIndex: number
  submissionDeadline: number
  votingDeadline: number
  status: RoundStatus
  winningSubmission: PublicKey | null
  totalVotes: number
  submissionCount: number
  maxSubmissions: number
  openedAt: number
  creatorNote: string
}

export interface Submission {
  publicKey: PublicKey
  round: PublicKey
  piece: PublicKey
  contributor: PublicKey
  contentHash: Uint8Array
  arweaveUri: string
  voteCount: number
  submittedAt: number
  // Off-chain enriched
  content?: string
}

export interface SealedParagraph {
  publicKey: PublicKey
  piece: PublicKey
  index: number
  contentHash: Uint8Array
  arweaveUri: string
  author: PublicKey
  sealedAt: number
  voteCount: number
  isOpening: boolean
  // Off-chain enriched
  content?: string
  authorHandle?: string
}

export interface SubscriberRecord {
  publicKey: PublicKey
  creator: PublicKey
  piece: PublicKey
  subscriber: PublicKey
  tier: SubscriberTier
  contributionTokens: number
  voteTokens: number
  addedAt: number
}

// ── UI / App types ────────────────────────────────────────────────────────────

export interface PieceWithParagraphs extends Piece {
  paragraphs: SealedParagraph[]
  activeRound?: Round
  submissions?: Submission[]
}

export interface DemoSubmission {
  id: string
  content: string
  contributor: string
  contributorHandle: string
  voteCount: number
  percentage: number
}

export interface ChainRecord {
  pieceTitle: string
  paragraphIndex: number
  totalParagraphs: number
  authorWallet: string
  votesReceived: number
  totalVotesCast: number
  sealedBlock: string
  sealedAt: string
  contentHash: string
  arweaveUri: string
  programId: string
}
