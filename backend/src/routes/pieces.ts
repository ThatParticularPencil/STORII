import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { uploadContent } from '../services/content'

const router = Router()

// In-memory store (replace with DB in production)
const pieces = new Map<string, any>()

// GET /api/pieces — list all pieces (paginated)
router.get('/', (req, res) => {
  const page = parseInt(req.query.page as string || '1', 10)
  const limit = parseInt(req.query.limit as string || '20', 10)
  const arr = Array.from(pieces.values())
  res.json({
    pieces: arr.slice((page - 1) * limit, page * limit),
    total: arr.length,
    page,
  })
})

// GET /api/pieces/:pieceId — get a single piece with paragraphs
router.get('/:pieceId', (req, res) => {
  const piece = pieces.get(req.params.pieceId)
  if (!piece) return res.status(404).json({ error: 'Piece not found' })
  res.json(piece)
})

// POST /api/pieces — register a new piece (called after on-chain create_piece)
router.post('/', async (req, res) => {
  const { title, openingText, creatorWallet, chainPieceId } = req.body
  if (!title || !openingText || !creatorWallet) {
    return res.status(400).json({ error: 'title, openingText, and creatorWallet are required' })
  }

  const { hash, uri } = await uploadContent(openingText)

  const piece = {
    id: chainPieceId || uuidv4(),
    title,
    creator: creatorWallet,
    status: 'Active',
    paragraphs: [
      {
        index: 0,
        content: openingText,
        hash,
        uri,
        author: creatorWallet,
        isOpening: true,
        sealedAt: new Date().toISOString(),
      },
    ],
    rounds: [],
    createdAt: new Date().toISOString(),
  }

  pieces.set(piece.id, piece)
  res.status(201).json(piece)
})

// PATCH /api/pieces/:pieceId/complete
router.patch('/:pieceId/complete', (req, res) => {
  const piece = pieces.get(req.params.pieceId)
  if (!piece) return res.status(404).json({ error: 'Piece not found' })
  piece.status = 'Complete'
  res.json(piece)
})

export default router
