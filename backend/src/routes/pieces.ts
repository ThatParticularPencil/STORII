import { Router } from 'express'
import { uploadContent, contentStore } from '../services/content'
import * as store from '../services/pieceStore'
import { generateScriptFromDirection } from '../services/gemini'

const router = Router()

function resetDemoPiece(pieceId: string): store.StoredPiece | null {
  if (pieceId === 'demo-live-1') {
    store.removePiece(pieceId)
    const piece = store.createPiece({
      id: 'demo-live-1',
      title: 'It Was the Night Before the Product Launch',
      creator: '8HQpXR2k...3xRt',
      openingText: 'It was the night before the product launch and everything was about to go wrong. Sarah stared at the terminal output, the cursor blinking like a nervous heartbeat. Three hours until the presentation. Fourteen minutes of deployment logs. And somewhere in that wall of green text, the reason their entire authentication service had just gone silent.',
      submissionHours: 0.001,
      votingHours: 0.001,
      maxSubmissions: 20,
    })

    ;[
      { contributor: '5pNm...8kLj', content: 'Cut to the whole team watching the dashboard refresh. Nobody speaks. The on-call Slack goes silent. Someone outside — a journalist — is already writing the story of the failed launch.' },
      { contributor: '2wXq...5mRo', content: 'Reveal it was the intern who rotated the deploy keys during the security audit. She didn\'t update the env variables. Her hand is half-raised, voice barely audible. The room temperature drops.' },
      { contributor: '9cYs...3vPt', content: 'VP calls in on speakerphone. He gives them twenty minutes. Cold voice, past anger. In the background before he hangs up the CEO can be heard asking what "rollback" means.' },
      { contributor: 'nR5c...6dLm', content: 'Show the junior dev who flagged this exact line in code review three weeks ago. Closed as "won\'t fix". He hasn\'t said a word since the terminal went red.' },
      { contributor: 'fT8j...0xBu', content: 'The staging environment is fine. It\'s only production that\'s silent. Sarah realises the logs show a config that shouldn\'t exist — one she didn\'t write.' },
      { contributor: 'qZ7m...4tPy', content: 'Sarah\'s phone buzzes: a calendar invite from a blocked number. "Post-mortem" — dated three days ago. Someone knew.' },
    ].forEach((submission) => {
      store.addSubmission({
        pieceId: piece.id,
        roundIndex: 0,
        contributor: submission.contributor,
        content: submission.content,
        contentHash: submission.contributor,
      })
    })

    const round = piece.rounds.get(0)
    if (round) {
      const now = Date.now()
      Array.from(round.submissions.values()).forEach((sub, index) => {
        sub.voteCount = [143, 98, 87, 64, 42, 31][index] ?? 0
        round.totalVotes += sub.voteCount
      })
      const finalists = Array.from(round.submissions.values())
        .sort((a, b) => b.voteCount - a.voteCount)
        .slice(0, 5)
      round.runoffPool = finalists.map((s) => s.id)
      round.status = 'Runoff'
      round.submissionDeadline = now - 2_000
      round.votingDeadline = now - 1_000
      round.runoffDeadline = now + 30_000
      finalists.forEach((sub, index) => {
        sub.runoffVoteCount = [61, 48, 41, 29, 17][index] ?? 0
        round.totalRunoffVotes += sub.runoffVoteCount
      })
    }

    return piece
  }

  if (pieceId === 'demo-live-2') {
    store.removePiece(pieceId)
    const piece = store.createPiece({
      id: 'demo-live-2',
      title: 'The Last Summer at the Observatory',
      creator: '@stargazer_mila',
      openingText: 'The dome had not been opened in eleven years. Mila pressed her palm against the cold steel hatch and felt the old mechanism shudder — not quite stuck, not quite willing. The last person to look through this telescope had gone up one August evening and never come back down. Nobody talked about that. The grant committee certainly hadn\'t.',
      submissionHours: 0.001,
      votingHours: 0.001,
      maxSubmissions: 20,
    })

    ;[
      { contributor: 'nR5c...6dLm', content: 'Show what Mila finds on the telescope\'s notepad. The last observer left coordinates — not for any star in any catalogue. Something hand-calculated, obsessively corrected.' },
      { contributor: 'fT8j...0xBu', content: 'Cut to the grant committee files. One page is redacted. The name of the last observer has been replaced with a case number. Mila recognises the handwriting on the sticky note flagging it.' },
      { contributor: 'qZ7m...4tPy', content: 'The dome motor starts on its own. Not the hatch — the main rotation drive. Something up there is still running on the old schedule.' },
      { contributor: 'hV2k...9wQs', content: 'Show the logbook from eleven years ago. Every entry is meticulous science until the last week, where the handwriting changes — smaller, faster, like something was being hidden inside the margin.' },
      { contributor: '7tKp...2nWz', content: 'The dome opens on a sky that doesn\'t match the date. The stars are wrong. Not by much — by exactly eleven years.' },
    ].forEach((submission) => {
      store.addSubmission({
        pieceId: piece.id,
        roundIndex: 0,
        contributor: submission.contributor,
        content: submission.content,
        contentHash: submission.contributor,
      })
    })

    const round = piece.rounds.get(0)
    if (round) {
      const now = Date.now()
      round.status = 'Submissions'
      round.submissionDeadline = now + 30_000
      round.votingDeadline = now + 60_000
      round.runoffDeadline = 0
    }

    return piece
  }

  return null
}

function seedDemoVotingRound(piece: store.StoredPiece, roundIndex: number) {
  const round = piece.rounds.get(roundIndex)
  if (!round || round.submissions.size > 0) return

  const now = Date.now()
  const candidates = piece.id === 'demo-live-2'
    ? [
        {
          contributor: '3mKa...8rTy',
          content: 'Mila checks the coordinates against the observatory archive and finds a matching entry filed under an event that officially never happened.',
        },
        {
          contributor: '7tYu...1nQa',
          content: 'The grant committee chair calls just as the dome opens and asks whether Mila has seen anything she cannot explain yet.',
        },
        {
          contributor: '2pEx...7mLo',
          content: 'A maintenance hatch slides open above the catwalk, dropping a sealed envelope with the missing observer’s name on it.',
        },
        {
          contributor: '8vQr...3cWe',
          content: 'The stars shift again by a fraction, enough for Mila to realize the telescope is not pointing at space but at a repeating moment in time.',
        },
        {
          contributor: '5nHg...5bUi',
          content: 'Her assistant arrives breathless with the archived weather logs. The cloud cover says tonight should be impossible.',
        },
      ]
    : [
        {
          contributor: '4kLm...8rTy',
          content: 'The first green check appears, but the dashboard still shows one shadow service timing out in a region nobody remembered to monitor.',
        },
        {
          contributor: '8tYp...1nQa',
          content: 'Sarah hears applause start in the presentation room next door and realizes nobody out there knows how close this launch came to collapsing.',
        },
        {
          contributor: '2pDx...7mLo',
          content: 'The intern quietly slides a printed checklist onto the desk. One item is circled twice: "rotate every shared secret before sunrise."',
        },
        {
          contributor: '9vQr...3cWe',
          content: 'A customer success lead runs in with screenshots from the beta users. The product is live, but the story they are telling about it is already drifting out of the team’s control.',
        },
        {
          contributor: '6nHg...5bUi',
          content: 'The CEO finally arrives in person, takes in the room, and asks the one question nobody has planned for: "If this works, what exactly are we launching people into?"',
        },
      ]

  candidates.forEach((candidate, index) => {
    const added = store.addSubmission({
      pieceId: piece.id,
      roundIndex,
      contributor: candidate.contributor,
      content: candidate.content,
      contentHash: `demo-${roundIndex}-${index}`,
    })

    if (!('error' in added)) {
      added.voteCount = [126, 103, 89, 74, 51][index] ?? 0
      round.totalVotes += added.voteCount
    }
  })

  round.status = 'Voting'
  round.submissionDeadline = now - 1_000
  round.votingDeadline = now + 10 * 60_000
}

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
      winningDirection: p.winningDirection ?? null,
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
  const shouldResetDemo = req.query.resetDemo === '1' && req.params.pieceId.startsWith('demo-live-')
  const piece = shouldResetDemo ? resetDemoPiece(req.params.pieceId) : store.getPiece(req.params.pieceId)
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

  // Demo pieces: use pre-written scenes so the demo never blocks on Gemini latency
  const DEMO_SCRIPTS: Record<string, string> = {
    'demo-live-2': `INT. OBSERVATORY DOME — NIGHT

The ancient motor groans to life beneath Mila's feet. She grabs the railing.

MILA
(barely audible)
It's still running.

The great dome pivots on its axis — slow, deliberate, as if obeying a command left eleven years ago. Through the slit, the sky appears. Mila knows this sky. She has memorised it.

What she sees is the sky of November 2013.

She checks her phone. Tonight's date blinks back.

The telescope still tracking. Still patient. Still waiting for whoever was supposed to be here.

She steps toward the eyepiece.`,
    'demo-live-1': `INT. OPEN-PLAN OFFICE — NIGHT

Sarah's cursor blinks in the silence. Somewhere a standing fan hums.

JUNIOR DEV
(from across the room, not looking up)
I flagged that line. Three weeks ago.

Nobody moves. The timestamp on his Slack message hangs in the air between them — 11:47 PM, "Won't fix," Sarah's own response. She can feel the room calculating whether to look at her or the floor.

CEO (V.O.)
(through speakerphone)
Someone needs to explain what rollback means. In English.

Sarah's hand finds the keyboard. Her fingers are already moving before she's made the decision. She already knows they're not rolling back. You can't unlaunch a launch.

She starts typing anyway.`,
  }

  let geminiScript = DEMO_SCRIPTS[req.params.pieceId] ?? winner.content

  if (!req.params.pieceId.startsWith('demo-')) {
    // Real piece — call Gemini, fall back to winner's direction if unavailable
    try {
      geminiScript = await generateScriptFromDirection(winner.content, storyContext, piece.title)
      console.log(`[finalize] Gemini wrote scene for "${piece.title}" round ${roundIndex}`)
    } catch (err: any) {
      console.warn(`[finalize] Gemini failed, using winner direction: ${err?.message}`)
      geminiScript = winner.content
    }
  } else {
    console.log(`[finalize] Demo piece — using pre-written scene for "${piece.title}"`)
  }

  const result = store.sealRound({
    pieceId: req.params.pieceId,
    roundIndex: Number(roundIndex),
    winningSubmissionId: winner.id,
    geminiScript,
  })

  if ('error' in result) return res.status(400).json(result)

  if (req.params.pieceId.startsWith('demo-live-')) {
    seedDemoVotingRound(result, Number(roundIndex) + 1)
  }

  res.json({
    ok: true,
    winnerContent: winner.content,
    geminiScript,
    piece: serializeStoredPiece(result, false),
  })
})

export default router
