import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as IOServer } from 'socket.io'

import piecesRouter from './routes/pieces'
import roundsRouter from './routes/rounds'
import submissionsRouter from './routes/submissions'
import subscribersRouter from './routes/subscribers'
import aiRouter from './routes/ai'
import { setupSolanaListener } from './services/solana'
import { VoteStore } from './services/voteStore'

// ── Express app ───────────────────────────────────────────────────────────────

const app = express()
const httpServer = createServer(app)

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/pieces', piecesRouter)
app.use('/api/rounds', roundsRouter)
app.use('/api/submissions', submissionsRouter)
app.use('/api/subscribers', subscribersRouter)
app.use('/api/ai', aiRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Socket.io — real-time voting ──────────────────────────────────────────────

export const io = new IOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

const voteStore = new VoteStore()

io.on('connection', (socket) => {
  console.log('[ws] client connected:', socket.id)

  socket.on('join:round', (roundId: string) => {
    socket.join(`round:${roundId}`)
    console.log(`[ws] ${socket.id} joined round:${roundId}`)

    // Send current vote tally on join
    const state = voteStore.getRoundState(roundId)
    if (state) {
      socket.emit('round:submissions', state)
    }
  })

  socket.on('leave:round', (roundId: string) => {
    socket.leave(`round:${roundId}`)
  })

  // Demo: accept direct vote events from the frontend (in prod, these come from on-chain listener)
  socket.on('vote:cast', async (payload: { roundId: string; submissionId: string }) => {
    const { roundId, submissionId } = payload

    const updated = voteStore.recordVote(roundId, submissionId)
    if (updated) {
      io.to(`round:${roundId}`).emit('vote:update', {
        submissionId,
        newCount: updated.submissionCount,
        totalVotes: updated.totalVotes,
      })
    }
  })

  socket.on('disconnect', () => {
    console.log('[ws] client disconnected:', socket.id)
  })
})

// ── Solana on-chain listener ──────────────────────────────────────────────────

setupSolanaListener(io, voteStore).catch(err => {
  console.error('[solana] listener error:', err)
})

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '4000', 10)
httpServer.listen(PORT, () => {
  console.log(`\n🔒 Storylock backend running on http://localhost:${PORT}`)
  console.log(`   WebSocket ready for real-time votes`)
  console.log(`   Solana cluster: ${process.env.SOLANA_CLUSTER || 'devnet'}\n`)
})
