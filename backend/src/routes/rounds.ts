import { Router } from 'express'

const router = Router()
const rounds = new Map<string, any>()

// GET /api/rounds/:roundId
router.get('/:roundId', (req, res) => {
  const round = rounds.get(req.params.roundId)
  if (!round) return res.status(404).json({ error: 'Round not found' })
  res.json(round)
})

// GET /api/rounds/:roundId/submissions
router.get('/:roundId/submissions', (req, res) => {
  const round = rounds.get(req.params.roundId)
  if (!round) return res.status(404).json({ error: 'Round not found' })

  // Hide submissions until the viewer has submitted their own
  // In production: check the voter's submission status before revealing others
  const { viewerWallet } = req.query
  const hasSubmitted = round.submissions.some(
    (s: any) => s.contributor === viewerWallet
  )

  if (!hasSubmitted && round.status === 'submissions') {
    return res.json({
      submissions: [],
      hiddenCount: round.submissions.length,
      message: 'Submit your paragraph to see others.',
    })
  }

  res.json({ submissions: round.submissions, totalVotes: round.totalVotes })
})

// POST /api/rounds — register a round after on-chain open_round
router.post('/', (req, res) => {
  const { roundId, pieceId, roundIndex, submissionDeadline, votingDeadline } = req.body
  const round = {
    id: roundId,
    pieceId,
    roundIndex,
    submissionDeadline,
    votingDeadline,
    status: 'submissions',
    submissions: [],
    totalVotes: 0,
    createdAt: new Date().toISOString(),
  }
  rounds.set(roundId, round)
  res.status(201).json(round)
})

// PATCH /api/rounds/:roundId/open-voting
router.patch('/:roundId/open-voting', (req, res) => {
  const round = rounds.get(req.params.roundId)
  if (!round) return res.status(404).json({ error: 'Round not found' })
  round.status = 'voting'
  res.json(round)
})

// PATCH /api/rounds/:roundId/close
router.patch('/:roundId/close', (req, res) => {
  const round = rounds.get(req.params.roundId)
  if (!round) return res.status(404).json({ error: 'Round not found' })
  round.status = 'closed'
  round.winningSubmissionId = req.body.winningSubmissionId
  round.creatorNote = req.body.creatorNote || ''
  res.json(round)
})

export default router
