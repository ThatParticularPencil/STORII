import { Router } from 'express'
import { uploadContent, contentStore, fetchArweaveContent } from '../services/content'
import {
  fetchAllPieces,
  fetchPieceParagraphs,
  fetchRoundForPiece,
  buildFullPiece,
  type FullPiece,
} from '../services/chainReader'

const router = Router()

// ── Short-lived cache so we don't hammer devnet on every page load ────────────

interface CacheEntry { data: any; fetchedAt: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 30_000  // 30 seconds

function cached(key: string): any | null {
  const e = cache.get(key)
  if (e && Date.now() - e.fetchedAt < CACHE_TTL_MS) return e.data
  return null
}
function setCache(key: string, data: any) {
  cache.set(key, { data, fetchedAt: Date.now() })
}
function bustCache(key?: string) {
  if (key) cache.delete(key)
  else cache.clear()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Converts a ChainParagraph + content into the shape the frontend expects */
function serializeParagraph(p: any) {
  return {
    index:       p.index,
    contentHash: p.contentHash,
    arweaveUri:  p.arweaveUri,
    author:      p.author,
    sealedAt:    p.sealedAt * 1000,   // → ms for frontend
    voteCount:   p.voteCount,
    isOpening:   p.isOpening,
    content:     p.content ?? null,
    pubkey:      p.pubkey,
  }
}

function serializePiece(full: FullPiece) {
  const activeRound = full.activeRound
  return {
    id:             full.pubkey,
    title:          full.title,
    status:         full.status,
    paragraphCount: full.paragraphCount,
    roundCount:     full.roundCount,
    createdAt:      full.createdAt * 1000,
    creator:        full.creator,
    paragraphs:     full.paragraphs.map(serializeParagraph),
    activeRound: activeRound ? {
      pubkey:             activeRound.pubkey,
      roundIndex:         activeRound.roundIndex,
      status:             activeRound.status,
      submissionDeadline: activeRound.submissionDeadline * 1000,
      votingDeadline:     activeRound.votingDeadline * 1000,
      totalVotes:         activeRound.totalVotes,
      submissionCount:    activeRound.submissionCount,
      maxSubmissions:     activeRound.maxSubmissions,
      winningSubmission:  activeRound.winningSubmission,
      creatorNote:        activeRound.creatorNote,
    } : null,
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/pieces
 * Returns all pieces on-chain, with basic metadata (no paragraphs).
 */
router.get('/', async (_req, res) => {
  try {
    const cacheKey = '__all_pieces__'
    const hit = cached(cacheKey)
    if (hit) return res.json(hit)

    const pieces = await fetchAllPieces()

    // Enrich with round data for the active round indicator
    const enriched = await Promise.all(
      pieces.map(async (piece) => {
        const rounds = await fetchRoundForPiece(piece.pubkey)
        const activeRound = rounds.find(r => r.status !== 'Closed') ?? rounds[rounds.length - 1] ?? null
        return {
          id:             piece.pubkey,
          title:          piece.title,
          status:         piece.status,
          paragraphCount: piece.paragraphCount,
          roundCount:     piece.roundCount,
          createdAt:      piece.createdAt * 1000,
          creator:        piece.creator,
          activeRound:    activeRound ? {
            pubkey:      activeRound.pubkey,
            roundIndex:  activeRound.roundIndex,
            status:      activeRound.status,
            totalVotes:  activeRound.totalVotes,
            votingDeadline: activeRound.votingDeadline * 1000,
          } : null,
        }
      })
    )

    const result = { pieces: enriched, total: enriched.length }
    setCache(cacheKey, result)
    res.json(result)
  } catch (err: any) {
    console.error('[pieces] fetchAllPieces error:', err?.message)
    res.status(500).json({ error: 'Failed to fetch pieces from chain', pieces: [], total: 0 })
  }
})

/**
 * GET /api/pieces/:pieceId
 * Returns full piece with all paragraphs and their content (fetched from Arweave / backend store).
 */
router.get('/:pieceId', async (req, res) => {
  const { pieceId } = req.params
  try {
    const cacheKey = `piece:${pieceId}`
    const hit = cached(cacheKey)
    if (hit) return res.json(hit)

    const full = await buildFullPiece(pieceId, contentStore)
    if (!full) return res.status(404).json({ error: 'Piece not found on chain' })

    const result = serializePiece(full)
    setCache(cacheKey, result)
    res.json(result)
  } catch (err: any) {
    console.error('[pieces] buildFullPiece error:', err?.message)
    res.status(500).json({ error: 'Failed to fetch piece from chain' })
  }
})

/**
 * POST /api/pieces
 * Called by the frontend after create_piece transaction is confirmed.
 * Stores the opening text in the backend content store (hash → text)
 * and busts the piece cache so the next GET sees fresh data.
 */
router.post('/', async (req, res) => {
  const { openingText, contentHash, pieceId } = req.body
  if (!openingText) return res.status(400).json({ error: 'openingText is required' })

  const { hash, uri } = await uploadContent(openingText)
  bustCache(`piece:${pieceId}`)
  bustCache('__all_pieces__')

  res.status(201).json({ hash, uri })
})

/**
 * POST /api/pieces/:pieceId/content
 * Store text content for an existing paragraph (e.g. after Gemini generates it).
 * The on-chain record is authoritative; this just fills in the text for display.
 */
router.post('/:pieceId/content', async (req, res) => {
  const { contentHash, text } = req.body
  if (!contentHash || !text) return res.status(400).json({ error: 'contentHash and text required' })
  contentStore.set(contentHash, text)
  bustCache(`piece:${req.params.pieceId}`)
  res.json({ ok: true })
})

export default router
