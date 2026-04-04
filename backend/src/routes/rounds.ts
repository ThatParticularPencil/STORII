import { Router } from 'express'
import { uploadContent, contentStore, getGeneratedScript } from '../services/content'
import {
  fetchRoundByKey,
  fetchRoundSubmissions,
} from '../services/chainReader'
import { io } from '../index'

const router = Router()

// ── Short-lived cache ─────────────────────────────────────────────────────────

interface CacheEntry { data: any; fetchedAt: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 15_000

function cached(key: string): any | null {
  const e = cache.get(key)
  if (e && Date.now() - e.fetchedAt < CACHE_TTL_MS) return e.data
  return null
}
function setCache(key: string, data: any) { cache.set(key, { data, fetchedAt: Date.now() }) }
function bustCache(key: string) { cache.delete(key) }

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/rounds/:roundId
 * Fetch a round from chain + its submissions from chain.
 * Enriches each submission with text content from the backend store / Arweave.
 */
router.get('/:roundId', async (req, res) => {
  const { roundId } = req.params
  try {
    const cacheKey = `round:${roundId}`
    const hit = cached(cacheKey)
    if (hit) return res.json(hit)

    const [round, submissions] = await Promise.all([
      fetchRoundByKey(roundId),
      fetchRoundSubmissions(roundId),
    ])

    if (!round) return res.status(404).json({ error: 'Round not found on chain' })

    const totalVotes = round.totalVotes

    const enrichedSubs = submissions.map(sub => ({
      id:          sub.pubkey,
      contributor: sub.contributor,
      contentHash: sub.contentHash,
      arweaveUri:  sub.arweaveUri,
      voteCount:   sub.voteCount,
      submittedAt: sub.submittedAt * 1000,
      // Text content from backend store (populated when viewer submits via POST /api/submissions)
      content:     contentStore.get(sub.contentHash) ?? null,
    }))

    const result = {
      id:                  round.pubkey,
      roundIndex:          round.roundIndex,
      piece:               round.piece,
      status:              round.status,
      submissionDeadline:  round.submissionDeadline * 1000,
      votingDeadline:      round.votingDeadline * 1000,
      totalVotes,
      submissionCount:     round.submissionCount,
      maxSubmissions:      round.maxSubmissions,
      winningSubmission:   round.winningSubmission,
      creatorNote:         round.creatorNote,
      submissions:         enrichedSubs,
      // If Gemini has already generated a script for this round, include it
      generatedScript:     getGeneratedScript(round.pubkey),
    }

    setCache(cacheKey, result)
    res.json(result)
  } catch (err: any) {
    console.error('[rounds] fetchRound error:', err?.message)
    res.status(500).json({ error: 'Failed to fetch round from chain' })
  }
})

/**
 * GET /api/rounds/:roundId/submissions
 * Returns submissions for the round, honouring the "submit first to see others" rule.
 * If viewerWallet is passed and hasn't submitted, hides content.
 */
router.get('/:roundId/submissions', async (req, res) => {
  const { roundId } = req.params
  const { viewerWallet } = req.query as { viewerWallet?: string }

  try {
    const submissions = await fetchRoundSubmissions(roundId)
    const round = await fetchRoundByKey(roundId)

    const hasSubmitted = viewerWallet
      ? submissions.some(s => s.contributor === viewerWallet)
      : true  // no wallet = reveal (e.g. voting stage)

    if (!hasSubmitted && round?.status === 'Submissions') {
      return res.json({
        submissions:  [],
        hiddenCount:  submissions.length,
        message:      'Submit your direction to see what others wrote.',
      })
    }

    const enriched = submissions.map(sub => ({
      id:          sub.pubkey,
      contributor: sub.contributor,
      contentHash: sub.contentHash,
      arweaveUri:  sub.arweaveUri,
      voteCount:   sub.voteCount,
      submittedAt: sub.submittedAt * 1000,
      content:     contentStore.get(sub.contentHash) ?? null,
    }))

    res.json({
      submissions: enriched,
      totalVotes:  round?.totalVotes ?? 0,
    })
  } catch (err: any) {
    console.error('[rounds] fetchSubmissions error:', err?.message)
    res.status(500).json({ error: 'Failed to fetch submissions from chain' })
  }
})

/**
 * POST /api/rounds
 * Register a newly opened round (called after on-chain open_round confirms).
 * Busts round cache.
 */
router.post('/', (req, res) => {
  const { roundId } = req.body
  if (roundId) bustCache(`round:${roundId}`)
  res.status(201).json({ ok: true })
})

/**
 * POST /api/rounds/:roundId/submit-content
 * Store the text of a direction submission before or after the on-chain tx.
 * Returns { hash, uri } for use in submit_paragraph instruction.
 */
router.post('/:roundId/submit-content', async (req, res) => {
  const { content, contributor } = req.body
  if (!content) return res.status(400).json({ error: 'content is required' })

  const { hash, uri } = await uploadContent(content)
  bustCache(`round:${req.params.roundId}`)
  res.json({ hash, uri })
})

export default router
