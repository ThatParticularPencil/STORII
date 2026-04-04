import { Router } from 'express'
import { reactToVote, reactToSeal } from '../services/gemini'

const router = Router()

/**
 * POST /api/ai/vote-reaction
 * Called when a user casts a vote — returns a Gemini reaction to the paragraph.
 */
router.post('/vote-reaction', async (req, res) => {
  const { paragraphText, voteCount } = req.body as {
    paragraphText?: string
    voteCount?: number
  }

  if (!paragraphText) {
    return res.status(400).json({ error: 'paragraphText is required' })
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Gemini not configured (GEMINI_API_KEY missing)' })
  }

  try {
    const reaction = await reactToVote(paragraphText, voteCount ?? 1)
    res.json({ reaction })
  } catch (err: any) {
    console.error('[gemini] vote-reaction error:', err?.message)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

/**
 * POST /api/ai/seal-reaction
 * Called when the winning paragraph is sealed — returns analysis + next-chapter teaser.
 */
router.post('/seal-reaction', async (req, res) => {
  const { winningParagraph, storyContext } = req.body as {
    winningParagraph?: string
    storyContext?: string
  }

  if (!winningParagraph) {
    return res.status(400).json({ error: 'winningParagraph is required' })
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Gemini not configured (GEMINI_API_KEY missing)' })
  }

  try {
    const reaction = await reactToSeal(winningParagraph, storyContext ?? '')
    res.json({ reaction })
  } catch (err: any) {
    console.error('[gemini] seal-reaction error:', err?.message)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

export default router
