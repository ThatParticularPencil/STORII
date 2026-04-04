import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as IOServer } from 'socket.io'

import piecesRouter from './routes/pieces'
import * as pieceStore from './services/pieceStore'
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
const solanaListenerEnabled = process.env.SOLANA_LISTENER_ENABLED === 'true'

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

if (solanaListenerEnabled) {
  setupSolanaListener(io, voteStore).catch(err => {
    console.error('[solana] listener error:', err)
  })
} else {
  console.log('[solana] listener disabled; running in demo mode')
}

// ── Seed demo stories ─────────────────────────────────────────────────────────

function seedDemoData() {
  const MIN = 0.5 / 60  // 30 seconds expressed as hours

  // Demo 1 — open for viewers to submit (1 min submission window, 1 min voting)
  const p1 = pieceStore.createPiece({
    id: 'demo-live-1',
    title: 'It Was the Night Before the Product Launch',
    creator: '8HQpXR2k...3xRt',
    openingText: 'It was the night before the product launch and everything was about to go wrong. Sarah stared at the terminal output, the cursor blinking like a nervous heartbeat. Three hours until the presentation. Fourteen minutes of deployment logs. And somewhere in that wall of green text, the reason their entire authentication service had just gone silent.',
    submissionHours: MIN,
    votingHours: MIN,
    maxSubmissions: 20,
  })
  // Pre-seed some directions so the pool isn't empty
  ;[
    { contributor: '5pNm...8kLj', content: 'Cut to the whole team watching the dashboard refresh. Nobody speaks. The on-call Slack goes silent. Someone outside — a journalist — is already writing the story of the failed launch.' },
    { contributor: '2wXq...5mRo', content: 'Reveal it was the intern who rotated the deploy keys during the security audit. She didn\'t update the env variables. Her hand is half-raised, voice barely audible. The room temperature drops.' },
    { contributor: '9cYs...3vPt', content: 'VP calls in on speakerphone. He gives them twenty minutes. Cold voice, past anger. In the background before he hangs up the CEO can be heard asking what "rollback" means.' },
  ].forEach(s => pieceStore.addSubmission({ pieceId: p1.id, roundIndex: 0, contributor: s.contributor, content: s.content, contentHash: s.contributor }))

  // Demo 2 — voting open, further along in the story (1 min voting window)
  const p2 = pieceStore.createPiece({
    id: 'demo-live-2',
    title: 'The Last Summer at the Observatory',
    creator: '@stargazer_mila',
    openingText: 'The dome had not been opened in eleven years. Mila pressed her palm against the cold steel hatch and felt the old mechanism shudder — not quite stuck, not quite willing. The last person to look through this telescope had gone up one August evening and never come back down. Nobody talked about that. The grant committee certainly hadn\'t.',
    submissionHours: MIN,
    votingHours: MIN,
    maxSubmissions: 20,
  })
  // Move to voting stage with submissions already in
  ;[
    { contributor: 'nR5c...6dLm', content: 'Show what Mila finds on the telescope\'s notepad. The last observer left coordinates — not for any star in any catalogue. Something hand-calculated, obsessively corrected.' },
    { contributor: 'fT8j...0xBu', content: 'Cut to the grant committee files. One page is redacted. The name of the last observer has been replaced with a case number. Mila recognises the handwriting on the sticky note flagging it.', },
    { contributor: 'qZ7m...4tPy', content: 'The dome motor starts on its own. Not the hatch — the main rotation drive. Something up there is still running on the old schedule.' },
    { contributor: 'hV2k...9wQs', content: 'Show the logbook from eleven years ago. Every entry is meticulous science until the last week, where the handwriting changes — smaller, faster, like something was being hidden inside the margin.' },
  ].forEach(s => pieceStore.addSubmission({ pieceId: p2.id, roundIndex: 0, contributor: s.contributor, content: s.content, contentHash: s.contributor }))
  pieceStore.moveRoundToVoting(p2.id, 0)

  console.log('[seed] Demo stories seeded:', p1.id, p2.id)
}

seedDemoData()

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '4000', 10)
httpServer.listen(PORT, () => {
  console.log(`\n🔒 Storylock backend running on http://localhost:${PORT}`)
  console.log(`   WebSocket ready for real-time votes`)
  console.log(`   Solana cluster: ${process.env.SOLANA_CLUSTER || 'devnet'}\n`)
})
