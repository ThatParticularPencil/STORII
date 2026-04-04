import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { uploadContent, verifyContent } from '../services/content'
import { io } from '../index'

const router = Router()
const submissions = new Map<string, any>()

// POST /api/submissions — store paragraph content after on-chain submit_paragraph
router.post('/', async (req, res) => {
  const { content, contributorWallet, roundId, chainSubmissionId } = req.body
  if (!content || !contributorWallet || !roundId) {
    return res.status(400).json({ error: 'content, contributorWallet, roundId required' })
  }

  const { hash, uri } = await uploadContent(content)

  const submission = {
    id: chainSubmissionId || uuidv4(),
    roundId,
    content,
    contributor: contributorWallet,
    contentHash: hash,
    arweaveUri: uri,
    voteCount: 0,
    submittedAt: new Date().toISOString(),
  }

  submissions.set(submission.id, submission)

  // Notify clients that a new submission is available (count only — not content)
  io.to(`round:${roundId}`).emit('submission:new', {
    roundId,
    count: Array.from(submissions.values()).filter(s => s.roundId === roundId).length,
  })

  res.status(201).json({ id: submission.id, hash, uri })
})

// GET /api/submissions/:id
router.get('/:id', (req, res) => {
  const submission = submissions.get(req.params.id)
  if (!submission) return res.status(404).json({ error: 'Submission not found' })
  res.json(submission)
})

// POST /api/submissions/:id/verify — verify content matches on-chain hash
router.post('/:id/verify', (req, res) => {
  const submission = submissions.get(req.params.id)
  if (!submission) return res.status(404).json({ error: 'Submission not found' })
  const { content } = req.body
  const valid = verifyContent(content, submission.contentHash)
  res.json({ valid, expectedHash: submission.contentHash })
})

export default router
