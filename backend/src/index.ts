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
  const now = Date.now()
  const DEMO_WINDOW = 30_000  // 30-second stage windows

  // ── Demo 1 — RUNOFF stage in Round 1 (Product Launch) ───────────────────
  const p1 = pieceStore.createPiece({
    id: 'demo-live-1',
    title: 'One More Queue: The Creator Challenge',
    creator: '8HQpXR2k...3xRt',
    openingText: 'Create the opening for a gaming creator challenge video. The creator is about to attempt a high-pressure Valorant-style challenge live with their audience watching, clips rolling, and chat suggesting what the rules should be. Set up the creator on stream, the challenge stakes, and the kind of opening tension that makes viewers want to vote on what happens next.',
    submissionHours: 0.001,
    votingHours: 0.001,
    maxSubmissions: 20,
  })
  ;[
    { contributor: '5pNm...8kLj', content: 'Have chat vote on the challenge rule: the creator can only use sheriff and vandal for the whole match.' },
    { contributor: '2wXq...5mRo', content: 'Start with the creator explaining they need to win three ranked rounds in a row or they have to do a brutal forfeit live.' },
    { contributor: '9cYs...3vPt', content: 'A natural viewer idea: open on the stream overlay with chat spamming suggested agents and challenge modifiers.' },
    { contributor: 'nR5c...6dLm', content: 'Make the first twist that the creator’s duo is late, so they have to solo queue the challenge in front of everyone.' },
    { contributor: 'fT8j...0xBu', content: 'Show the creator revealing the punishment wheel for if they lose the opening match.' },
    { contributor: 'qZ7m...4tPy', content: 'Open with the creator asking chat whether they should lock Jett for content or play safe and pick their best agent.' },
  ].forEach(s => pieceStore.addSubmission({ pieceId: p1.id, roundIndex: 0, contributor: s.contributor, content: s.content, contentHash: s.contributor }))

  const r1 = p1.rounds.get(0)!
  Array.from(r1.submissions.values()).forEach((sub, index) => {
    sub.voteCount = [143, 98, 87, 64, 42, 31][index] ?? 0
    r1.totalVotes += sub.voteCount
  })
  const p1Finalists = Array.from(r1.submissions.values()).sort((a, b) => b.voteCount - a.voteCount).slice(0, 5)
  r1.runoffPool = p1Finalists.map(s => s.id)
  r1.status = 'Runoff'
  r1.submissionDeadline = now - 2_000
  r1.votingDeadline = now - 1_000
  r1.runoffDeadline = now + DEMO_WINDOW
  p1Finalists.forEach((sub, index) => {
    sub.runoffVoteCount = [61, 48, 41, 29, 17][index] ?? 0
    r1.totalRunoffVotes += sub.runoffVoteCount
  })

  // ── Demo 2 — SUBMISSIONS stage in Round 1 (Observatory) ──────────────────
  const p2 = pieceStore.createPiece({
    id: 'demo-live-2',
    title: 'Return to the Observatory: A Creator Documentary',
    creator: '@stargazer_mila',
    openingText: 'Create the opening for a documentary-style creator story. Mila is an independent creator returning to an abandoned observatory to film a comeback video for her audience. She wants to uncover what happened there, capture beautiful visuals, and decide what lead to follow first with the help of viewer suggestions. Make it feel like a real creator documentary setup where the audience would naturally comment ideas about where she should go next.',
    submissionHours: 0.001,
    votingHours: 0.001,
    maxSubmissions: 20,
  })
  ;[
    { contributor: 'nR5c...6dLm', content: 'A viewer suggestion: have Mila start by checking the old control room because that is where the best documentary clues would probably still be.' },
    { contributor: 'fT8j...0xBu', content: 'Show Mila finding a box of tapes or memory cards that could completely change what the video is actually about.' },
    { contributor: 'qZ7m...4tPy', content: 'Have her pause and ask the audience whether she should follow the strange sound from upstairs or open the locked storage cabinet first.' },
    { contributor: 'hV2k...9wQs', content: 'Start the next beat with Mila reading from the old logbook on camera like she is pulling the audience deeper into the mystery.' },
    { contributor: '7tKp...2nWz', content: 'Make the visual hook that the dome finally opens and she captures a shot so good she knows the comeback video might actually work.' },
    { contributor: '4sLm...6qAe', content: 'Have Mila discover a note left for whoever filmed here next, making it feel like the previous creator or observer expected an audience someday.' },
    { contributor: '8uNa...4pRx', content: 'Let chat-style audience energy come through by having Mila decide between three possible leads and promise she will follow whichever one feels most important.' },
  ].forEach(s => pieceStore.addSubmission({ pieceId: p2.id, roundIndex: 0, contributor: s.contributor, content: s.content, contentHash: s.contributor }))

  const r2 = p2.rounds.get(0)!
  r2.status = 'Submissions'
  r2.submissionDeadline = now + DEMO_WINDOW
  r2.votingDeadline = now + DEMO_WINDOW * 2

  console.log('[seed] Demo stories seeded:', p1.id, '(Runoff)', p2.id, '(Submissions)')
}

seedDemoData()

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '4000', 10)
httpServer.listen(PORT, () => {
  console.log(`\n🔒 Storylock backend running on http://localhost:${PORT}`)
  console.log(`   WebSocket ready for real-time votes`)
  console.log(`   Solana cluster: ${process.env.SOLANA_CLUSTER || 'devnet'}\n`)
})
