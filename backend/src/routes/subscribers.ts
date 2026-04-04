import { Router } from 'express'

const router = Router()

// In-memory subscriber registry
// Key: `${pieceId}:${subscriberWallet}`
const registry = new Map<string, any>()

// GET /api/subscribers/:pieceId — list subscribers for a piece
router.get('/:pieceId', (req, res) => {
  const { pieceId } = req.params
  const subs = Array.from(registry.values()).filter(s => s.pieceId === pieceId)
  res.json({ subscribers: subs, count: subs.length })
})

// POST /api/subscribers — register subscriber after on-chain add_subscriber
router.post('/', (req, res) => {
  const { pieceId, subscriberWallet, tier, creatorWallet } = req.body
  if (!pieceId || !subscriberWallet || !tier) {
    return res.status(400).json({ error: 'pieceId, subscriberWallet, tier required' })
  }

  const key = `${pieceId}:${subscriberWallet}`
  const record = {
    pieceId,
    subscriber: subscriberWallet,
    creator: creatorWallet,
    tier,
    addedAt: new Date().toISOString(),
  }
  registry.set(key, record)
  res.status(201).json(record)
})

// DELETE /api/subscribers/:pieceId/:wallet
router.delete('/:pieceId/:wallet', (req, res) => {
  const key = `${req.params.pieceId}:${req.params.wallet}`
  if (!registry.has(key)) return res.status(404).json({ error: 'Subscriber not found' })
  registry.delete(key)
  res.json({ deleted: true })
})

// GET /api/subscribers/:pieceId/:wallet — check tier for a wallet
router.get('/:pieceId/:wallet', (req, res) => {
  const key = `${req.params.pieceId}:${req.params.wallet}`
  const record = registry.get(key)
  if (!record) return res.status(404).json({ tier: 'Reader', subscribed: false })
  res.json({ ...record, subscribed: true })
})

export default router
