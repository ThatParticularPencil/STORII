import { Router } from 'express'
import { uploadContent, contentStore } from '../services/content'
import * as store from '../services/pieceStore'
import { generateScriptFromDirection } from '../services/gemini'

const router = Router()

// ── Serialization ─────────────────────────────────────────────────────────────

function serializeStoredRound(round: store.StoredRound) {
  const subs = Array.from(round.submissions.values()).map(s => ({
    id:              s.id,
    contributor:     s.contributor,
    content:         s.content,
    contentHash:     s.contentHash,
    voteCount:       s.voteCount,
    runoffVoteCount: s.runoffVoteCount,
    submittedAt:     s.submittedAt,
    inRunoff:        round.runoffPool.includes(s.id),
  }))
  return {
    id:                  round.id,
    pieceId:             round.pieceId,
    roundIndex:          round.roundIndex,
    status:              round.status,
    submissionDeadline:  round.submissionDeadline,
    votingDeadline:      round.votingDeadline,
    runoffDeadline:      round.runoffDeadline,
    totalVotes:          round.totalVotes,
    totalRunoffVotes:    round.totalRunoffVotes,
    maxSubmissions:      round.maxSubmissions,
    submissionCount:     round.submissions.size,
    winningSubmissionId: round.winningSubmissionId,
    runoffPool:          round.runoffPool,
    submissions:         subs,
  }
}

function serializeStoredPiece(piece: store.StoredPiece, includeSubmissions = false) {
  const activeRound = store.getActiveRound(piece)
  return {
    id:             piece.id,
    title:          piece.title,
    creator:        piece.creator,
    createdAt:      piece.createdAt,
    status:         piece.status,
    paragraphCount: piece.paragraphs.length,
    roundCount:     piece.rounds.size,
    paragraphs:     piece.paragraphs.map(p => ({
      index:      p.index,
      content:    p.content,
      author:     p.author,
      sealedAt:   p.sealedAt,
      voteCount:  p.voteCount,
      isOpening:  p.index === 0,
    })),
    activeRound: activeRound ? {
      pubkey:             activeRound.id,
      roundIndex:         activeRound.roundIndex,
      status:             activeRound.status,
      submissionDeadline: activeRound.submissionDeadline,
      votingDeadline:     activeRound.votingDeadline,
      runoffDeadline:     activeRound.runoffDeadline,
      totalVotes:         activeRound.totalVotes,
      totalRunoffVotes:   activeRound.totalRunoffVotes,
      submissionCount:    activeRound.submissions.size,
      maxSubmissions:     activeRound.maxSubmissions,
      winningSubmission:  activeRound.winningSubmissionId,
      runoffPool:         activeRound.runoffPool,
      ...(includeSubmissions ? { submissions: Array.from(activeRound.submissions.values()).map(s => ({
        id:              s.id,
        contributor:     s.contributor,
        content:         s.content,
        contentHash:     s.contentHash,
        voteCount:       s.voteCount,
        runoffVoteCount: s.runoffVoteCount,
        submittedAt:     s.submittedAt,
        inRunoff:        activeRound.runoffPool.includes(s.id),
      })) } : {}),
    } : null,
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/pieces
 * Returns all stored pieces (sorted newest first).
 */
router.get('/', (_req, res) => {
  const pieces = store.getAllPieces()
  const serialized = pieces.map(p => serializeStoredPiece(p, false))
  res.json({ pieces: serialized, total: serialized.length })
})

/**
 * GET /api/pieces/:pieceId
 * Returns full piece with all paragraphs and active round (including submissions).
 */
router.get('/:pieceId', (req, res) => {
  const piece = store.getPiece(req.params.pieceId)
  if (!piece) return res.status(404).json({ error: 'Piece not found' })
  res.json(serializeStoredPiece(piece, true))
})

/**
 * POST /api/pieces/create
 * Creates a new piece and opens Round 0 (Intro) immediately.
 * Called by NewPiece.tsx after the 0.1 SOL payment is confirmed.
 */
router.post('/create', async (req, res) => {
  const {
    title,
    openingText,
    creatorWallet,
    submissionHours = 0.5 / 60,
    votingHours = 0.5 / 60,
    maxSubmissions = 20,
  } = req.body

  if (!title || !openingText || !creatorWallet) {
    return res.status(400).json({ error: 'title, openingText, and creatorWallet are required' })
  }

  // Store the opening text in the content store for consistency
  await uploadContent(openingText)

  const piece = store.createPiece({
    title,
    openingText,
    creator: creatorWallet,
    submissionHours: Number(submissionHours),
    votingHours: Number(votingHours),
    maxSubmissions: Number(maxSubmissions),
  })

  res.status(201).json(serializeStoredPiece(piece, true))
})

/**
 * POST /api/pieces/:pieceId/submit
 * Submit a direction to the active round.
 */
router.post('/:pieceId/submit', async (req, res) => {
  const { content, contributor, roundIndex = 0 } = req.body
  if (!content || !contributor) {
    return res.status(400).json({ error: 'content and contributor are required' })
  }

  const { hash: contentHash } = await uploadContent(content)
  const result = store.addSubmission({
    pieceId: req.params.pieceId,
    roundIndex: Number(roundIndex),
    contributor,
    content,
    contentHash,
  })

  if ('error' in result) return res.status(400).json(result)
  res.status(201).json({
    id:          result.id,
    contributor: result.contributor,
    content:     result.content,
    contentHash: result.contentHash,
    voteCount:   result.voteCount,
    submittedAt: result.submittedAt,
  })
})

/**
 * POST /api/pieces/:pieceId/vote
 * Cast a vote for a submission.
 */
router.post('/:pieceId/vote', (req, res) => {
  const { submissionId, voter, roundIndex = 0 } = req.body
  if (!submissionId || !voter) {
    return res.status(400).json({ error: 'submissionId and voter are required' })
  }

  const result = store.castVote({
    pieceId: req.params.pieceId,
    roundIndex: Number(roundIndex),
    submissionId,
    voter,
  })

  if ('error' in result) return res.status(400).json(result)
  res.json(result)
})

/**
 * POST /api/pieces/:pieceId/close-submissions
 * If ≤ 5 submissions: skip the first vote and go straight to Runoff.
 * If > 5 submissions: open first-round Voting as normal.
 */
router.post('/:pieceId/close-submissions', (req, res) => {
  const { roundIndex = 0, runoffMinutes = 0.5} = req.body
  const piece = store.getPiece(req.params.pieceId)
  if (!piece) return res.status(404).json({ error: 'Piece not found' })
  const round = piece.rounds.get(Number(roundIndex))
  if (!round) return res.status(404).json({ error: 'Round not found' })

  const count = round.submissions.size

  if (count <= 5) {
    // All submissions are the finalists — skip straight to Runoff
    const result = store.startRunoff(req.params.pieceId, Number(roundIndex), Number(runoffMinutes))
    if ('error' in result) return res.status(400).json(result)
    return res.json({
      ok: true,
      skippedToRunoff: true,
      finalists: result.map(s => ({ id: s.id, contributor: s.contributor, content: s.content, voteCount: s.voteCount })),
    })
  }

  const ok = store.moveRoundToVoting(req.params.pieceId, Number(roundIndex))
  if (!ok) return res.status(400).json({ error: 'Cannot move round to voting' })
  res.json({ ok: true, skippedToRunoff: false })
})

/**
 * POST /api/pieces/:pieceId/seal
 * Close voting, store the winning direction, and seal the paragraph.
 * The frontend passes the Gemini-generated script.
 */
router.post('/:pieceId/seal', async (req, res) => {
  const { roundIndex = 0, winningSubmissionId, geminiScript } = req.body
  if (!winningSubmissionId || !geminiScript) {
    return res.status(400).json({ error: 'winningSubmissionId and geminiScript are required' })
  }

  const result = store.sealRound({
    pieceId: req.params.pieceId,
    roundIndex: Number(roundIndex),
    winningSubmissionId,
    geminiScript,
  })

  if ('error' in result) return res.status(400).json(result)
  res.json(serializeStoredPiece(result, false))
})

/**
 * POST /api/pieces/:pieceId/start-runoff
 * First-round voting closes → pick top 5 → open runoff.
 */
router.post('/:pieceId/start-runoff', (req, res) => {
  const { roundIndex = 0, runoffMinutes = 0.5} = req.body
  const result = store.startRunoff(req.params.pieceId, Number(roundIndex), Number(runoffMinutes))
  if ('error' in result) return res.status(400).json(result)
  res.json({ ok: true, finalists: result.map(s => ({
    id: s.id, contributor: s.contributor, content: s.content,
    voteCount: s.voteCount, runoffVoteCount: s.runoffVoteCount,
  })) })
})

/**
 * POST /api/pieces/:pieceId/vote-runoff
 * Cast a vote in the runoff (top-5) round.
 */
router.post('/:pieceId/vote-runoff', (req, res) => {
  const { submissionId, voter, roundIndex = 0 } = req.body
  if (!submissionId || !voter) {
    return res.status(400).json({ error: 'submissionId and voter are required' })
  }
  const result = store.castRunoffVote({
    pieceId: req.params.pieceId,
    roundIndex: Number(roundIndex),
    submissionId,
    voter,
  })
  if ('error' in result) return res.status(400).json(result)
  res.json(result)
})

/**
 * POST /api/pieces/:pieceId/finalize
 * Called when the runoff deadline passes.
 * Picks the runoff winner, calls Gemini to write the scene,
 * seals the round, and opens the next one automatically.
 */
router.post('/:pieceId/finalize', async (req, res) => {
  const { roundIndex = 0 } = req.body
  const piece = store.getPiece(req.params.pieceId)
  if (!piece) return res.status(404).json({ error: 'Piece not found' })
  const round = piece.rounds.get(Number(roundIndex))
  if (!round) return res.status(404).json({ error: 'Round not found' })

  // Pick winner: highest runoff votes among runoffPool, fall back to highest first-round votes
  const runoffSubs = Array.from(round.submissions.values())
    .filter(s => round.runoffPool.includes(s.id))
    .sort((a, b) => b.runoffVoteCount - a.runoffVoteCount)
  const winner = runoffSubs[0]
    ?? Array.from(round.submissions.values()).sort((a, b) => b.voteCount - a.voteCount)[0]

  if (!winner) return res.status(400).json({ error: 'No submissions to finalize' })

  // Build story context from sealed paragraphs
  const storyContext = piece.paragraphs.map(p => p.content).join('\n\n')

  // Call Gemini — fall back to winner's direction if unavailable
  let geminiScript = winner.content
  try {
    geminiScript = await generateScriptFromDirection(winner.content, storyContext, piece.title)
    console.log(`[finalize] Gemini wrote scene for "${piece.title}" round ${roundIndex}`)
  } catch (err: any) {
    console.warn(`[finalize] Gemini failed, using winner direction: ${err?.message}`)
  }

  const result = store.sealRound({
    pieceId: req.params.pieceId,
    roundIndex: Number(roundIndex),
    winningSubmissionId: winner.id,
    geminiScript,
  })

  if ('error' in result) return res.status(400).json(result)
  res.json({
    ok: true,
    winnerContent: winner.content,
    geminiScript,
    piece: serializeStoredPiece(result, false),
  })
})

export default router
