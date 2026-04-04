import { Router } from 'express'
import { reactToVote, generateScriptFromDirection, reactToSeal } from '../services/gemini'
import { storeGeneratedScript } from '../services/content'

const router = Router()

function requireGemini(res: any): boolean {
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: 'Gemini not configured — add GEMINI_API_KEY to backend/.env' })
    return false
  }
  return true
}

/**
 * POST /api/ai/vote-reaction
 * Called when a user votes for a direction — returns a 1-2 sentence literary reaction.
 */
router.post('/vote-reaction', async (req, res) => {
  const { directionText, voteCount } = req.body as { directionText?: string; voteCount?: number }
  if (!directionText) return res.status(400).json({ error: 'directionText is required' })
  if (!requireGemini(res)) return

  try {
    const reaction = await reactToVote(directionText, voteCount ?? 1)
    res.json({ reaction })
  } catch (err: any) {
    console.error('[gemini] vote-reaction error:', err?.message)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

/**
 * POST /api/ai/generate-script
 * Winning direction chosen — Gemini writes the full TV script scene.
 *
 * After generation, the script is stored in the backend content store
 * (keyed by roundId) so the creator can reference the hash/URI when
 * calling close_round on-chain.
 *
 * Returns: { script, hash, uri }
 * - hash: SHA-256 of the script text (same as what goes on-chain in content_hash)
 * - uri:  ar:// URI (fake hash-based until Arweave wallet is configured)
 */
router.post('/generate-script', async (req, res) => {
  const { winningDirection, storyContext, pieceTitle, roundId } = req.body as {
    winningDirection?: string
    storyContext?: string
    pieceTitle?: string
    roundId?: string
  }
  if (!winningDirection) return res.status(400).json({ error: 'winningDirection is required' })
  if (!requireGemini(res)) return

  try {
    const script = await generateScriptFromDirection(
      winningDirection,
      storyContext ?? '',
      pieceTitle ?? 'Untitled'
    )

    // Store in backend so the on-chain close_round can reference hash + URI
    let hash: string | undefined
    let uri: string | undefined
    if (roundId) {
      const stored = await storeGeneratedScript(roundId, script, pieceTitle ?? 'Untitled', winningDirection)
      hash = stored.hash
      uri  = stored.uri
    }

    res.json({ script, hash, uri })
  } catch (err: any) {
    console.error('[gemini] generate-script error:', err?.message)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

/**
 * POST /api/ai/seal-reaction
 * After creator publishes on-chain — returns brief literary analysis.
 */
router.post('/seal-reaction', async (req, res) => {
  const { sealedScript, pieceTitle } = req.body as { sealedScript?: string; pieceTitle?: string }
  if (!sealedScript) return res.status(400).json({ error: 'sealedScript is required' })
  if (!requireGemini(res)) return

  try {
    const reaction = await reactToSeal(sealedScript, pieceTitle ?? 'Untitled')
    res.json({ reaction })
  } catch (err: any) {
    console.error('[gemini] seal-reaction error:', err?.message)
    res.status(500).json({ error: 'Gemini request failed' })
  }
})

/**
 * GET /api/ai/script/:roundId
 * Retrieve the stored Gemini script for a round (used by PieceView to show AI content).
 */
router.get('/script/:roundId', (req, res) => {
  const { getGeneratedScript } = require('../services/content')
  const entry = getGeneratedScript(req.params.roundId)
  if (!entry) return res.status(404).json({ error: 'No script generated for this round yet' })
  res.json(entry)
})

export default router
