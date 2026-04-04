/**
 * usePiece — fetches a single piece with all paragraphs from the backend,
 * which in turn reads from the Solana program on devnet/mainnet.
 *
 * Falls back to demo data if the backend returns nothing (for local dev without
 * a deployed program).
 */

import { useState, useEffect } from 'react'
import { DEMO_PIECE, DEMO_PARAGRAPHS, DEMO_ACTIVE_ROUND, DEMO_PIECES_EXPLORE } from '@/utils/demo-data'
import { PublicKey } from '@solana/web3.js'
import type { SealedParagraph } from '@/types'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

// ── Shared paragraph shape used inside the app ────────────────────────────────

export type LiveParagraph = SealedParagraph & {
  content:       string | null
  authorHandle?: string
  winningDirection?: string
  sealedBlock?:  string
}

export interface LiveActiveRound {
  pubkey:             string
  roundIndex:         number
  status:             'Submissions' | 'Voting' | 'Closed'
  submissionDeadline: number  // ms
  votingDeadline:     number  // ms
  totalVotes:         number
  submissionCount:    number
  maxSubmissions:     number
  winningSubmission:  string | null
  creatorNote:        string
}

export interface LivePiece {
  id:             string
  title:          string
  status:         'Active' | 'Complete'
  paragraphCount: number
  roundCount:     number
  createdAt:      number
  creator:        string
  creatorHandle?: string
  paragraphs:     LiveParagraph[]
  activeRound:    LiveActiveRound | null
}

// ── Demo data adapter ─────────────────────────────────────────────────────────

function buildDemoPiece(): LivePiece {
  const paragraphs: LiveParagraph[] = DEMO_PARAGRAPHS.map(p => ({
    publicKey:   PublicKey.default,
    piece:       PublicKey.default,
    index:       p.index,
    contentHash: new Uint8Array(32),
    arweaveUri:  p.arweaveUri,
    author:      PublicKey.default,
    sealedAt:    Math.floor(p.sealedAt / 1000),
    voteCount:   p.voteCount,
    isOpening:   p.isOpening,
    content:     p.content,
    authorHandle: (p as any).authorHandle,
    winningDirection: (p as any).winningDirection,
    sealedBlock: (p as any).sealedBlock,
  }))

  return {
    id:             DEMO_PIECE.id,
    title:          DEMO_PIECE.title,
    status:         DEMO_PIECE.status,
    paragraphCount: DEMO_PIECE.paragraphCount,
    roundCount:     DEMO_PIECE.roundCount,
    createdAt:      DEMO_PIECE.createdAt,
    creator:        DEMO_PIECE.creator,
    creatorHandle:  DEMO_PIECE.creatorHandle,
    paragraphs,
    activeRound: {
      pubkey:             'demo-round-3',
      roundIndex:         DEMO_ACTIVE_ROUND.roundIndex,
      status:             DEMO_ACTIVE_ROUND.status as 'Voting',
      submissionDeadline: DEMO_ACTIVE_ROUND.submissionDeadline,
      votingDeadline:     DEMO_ACTIVE_ROUND.votingDeadline,
      totalVotes:         DEMO_ACTIVE_ROUND.totalVotes,
      submissionCount:    DEMO_ACTIVE_ROUND.submissionCount,
      maxSubmissions:     50,
      winningSubmission:  null,
      creatorNote:        '',
    },
  }
}

// ── API adapter ───────────────────────────────────────────────────────────────

function apiToPiece(data: any): LivePiece {
  const paragraphs: LiveParagraph[] = (data.paragraphs ?? []).map((p: any) => ({
    publicKey:   PublicKey.default,
    piece:       PublicKey.default,
    index:       p.index,
    contentHash: new Uint8Array(32),
    arweaveUri:  p.arweaveUri ?? '',
    author:      PublicKey.default,
    sealedAt:    Math.floor((p.sealedAt ?? 0) / 1000),
    voteCount:   p.voteCount ?? 0,
    isOpening:   p.isOpening ?? false,
    content:     p.content ?? null,
    authorHandle: p.author ? `${p.author.slice(0, 4)}…${p.author.slice(-4)}` : undefined,
  }))

  const ar = data.activeRound
  const activeRound: LiveActiveRound | null = ar ? {
    pubkey:             ar.pubkey,
    roundIndex:         ar.roundIndex,
    status:             ar.status,
    submissionDeadline: ar.submissionDeadline,
    votingDeadline:     ar.votingDeadline,
    totalVotes:         ar.totalVotes,
    submissionCount:    ar.submissionCount,
    maxSubmissions:     ar.maxSubmissions ?? 50,
    winningSubmission:  ar.winningSubmission ?? null,
    creatorNote:        ar.creatorNote ?? '',
  } : null

  return {
    id:             data.id,
    title:          data.title,
    status:         data.status,
    paragraphCount: data.paragraphCount,
    roundCount:     data.roundCount,
    createdAt:      data.createdAt,
    creator:        data.creator,
    creatorHandle:  data.creator ? `${data.creator.slice(0, 4)}…${data.creator.slice(-4)}` : undefined,
    paragraphs,
    activeRound,
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePiece(pieceId: string | undefined) {
  const [piece, setPiece]   = useState<LivePiece | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const isDemo = !pieceId || pieceId.startsWith('demo-')

  useEffect(() => {
    if (!pieceId) { setLoading(false); return }

    // Demo IDs: use hardcoded demo data instantly
    if (isDemo) {
      setPiece(buildDemoPiece())
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`${BACKEND}/api/pieces/${pieceId}`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setPiece(apiToPiece(data))
      })
      .catch(err => {
        console.warn('[usePiece] fetch failed, falling back to demo:', err.message)
        setError(err.message)
        // If it's the demo piece ID, show demo data; otherwise show null
        if (pieceId === DEMO_PIECE.id) setPiece(buildDemoPiece())
      })
      .finally(() => setLoading(false))
  }, [pieceId])

  return { piece, loading, error }
}

// ── useExplore hook ───────────────────────────────────────────────────────────

export interface ExplorePiece {
  id:             string
  title:          string
  status:         'Active' | 'Complete'
  paragraphCount: number
  roundCount:     number
  creator:        string
  activeRound:    { pubkey: string; status: string; totalVotes: number; votingDeadline: number } | null
  totalVotes:     number
}

export function useExplore() {
  const [pieces, setPieces]  = useState<ExplorePiece[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]    = useState<string | null>(null)

  useEffect(() => {
    fetch(`${BACKEND}/api/pieces`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        const items: ExplorePiece[] = (data.pieces ?? []).map((p: any) => ({
          id:             p.id,
          title:          p.title,
          status:         p.status,
          paragraphCount: p.paragraphCount,
          roundCount:     p.roundCount,
          creator:        p.creator,
          activeRound:    p.activeRound ?? null,
          totalVotes:     p.activeRound?.totalVotes ?? 0,
        }))
        setPieces(items.length > 0 ? items : buildDemoExplore())
      })
      .catch(err => {
        console.warn('[useExplore] fetch failed, using demo:', err.message)
        setError(err.message)
        setPieces(buildDemoExplore())
      })
      .finally(() => setLoading(false))
  }, [])

  return { pieces, loading, error }
}

function buildDemoExplore(): ExplorePiece[] {
  return (DEMO_PIECES_EXPLORE as any[]).map(p => ({
    id:             p.id,
    title:          p.title,
    status:         p.status,
    paragraphCount: p.paragraphCount,
    roundCount:     p.roundCount ?? 0,
    creator:        p.creator,
    activeRound:    p.activeRound ? { pubkey: 'demo', status: 'Voting', totalVotes: p.totalVotes, votingDeadline: Date.now() + 1000 * 60 * 5 } : null,
    totalVotes:     p.totalVotes ?? 0,
  }))
}
