/**
 * Demo data for hackathon presentations.
 *
 * Two-stage round flow:
 *   Stage 1 — Open submission: community submits 50-word directions
 *   Stage 2 — Top 5 vote: best directions shortlisted, community votes
 *   Generate — Winning direction fed to Gemini → full professional video script
 *   Publish  — Creator seals the AI script as the new paragraph on Solana devnet
 */

export const DEMO_PIECE = {
  id: 'demo-piece-1',
  title: 'It Was the Night Before the Product Launch',
  status: 'Active' as const,
  paragraphCount: 3,
  roundCount: 3,
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  creator: '8HQp...3xRt',
  creatorHandle: '@alexchen_builds',
}

export const DEMO_PARAGRAPHS = [
  {
    index: 0,
    content:
      'It was the night before the product launch and everything was about to go wrong. Sarah stared at the terminal output, the cursor blinking like a nervous heartbeat. Three hours until the presentation. Fourteen minutes of deployment logs. And somewhere in that wall of green text, the reason their entire authentication service had just gone silent.',
    author: '8HQp...3xRt',
    authorHandle: '@alexchen_builds',
    voteCount: 0,
    sealedAt: Date.now() - 1000 * 60 * 60 * 48,
    isOpening: true,
    contentHash: 'a3f9c2e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4f7a2',
    arweaveUri: 'ar://Qm8xR2k4nP7mL9vB3cD5fH1jK6yZ0wE4tN2sU8',
    sealedBlock: '287,441,203',
    aiGenerated: false,
  },
  {
    index: 1,
    content:
      '"Pull request 847," muttered Dev from the corner desk without looking up. He had been there since morning, headphones on, somehow already knowing the root cause. "JWT expiry got pushed to midnight UTC in the staging config but we\'re running on Pacific time in prod." The silence that followed was the kind that makes careers and ends them.',
    author: '3kMn...7pQs',
    authorHandle: '@devsmith_codes',
    voteCount: 142,
    sealedAt: Date.now() - 1000 * 60 * 60 * 24,
    isOpening: false,
    contentHash: 'b4g0d3f9c2e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4',
    arweaveUri: 'ar://Rn9yS3l5oQ8mM0wC4eE6gI2kL7xA1vB3',
    sealedBlock: '287,442,891',
    aiGenerated: true,
    winningDirection: 'Show the quiet engineer who already knew the answer — reveal the root cause through him, make the silence feel like judgment',
  },
  {
    index: 2,
    content:
      'The fix took forty seconds. The deploys took eleven minutes. They watched the health checks in complete silence — eight engineers, one product manager, and a very confused intern who had only started on Monday. When the first green checkmark appeared, nobody celebrated. Not because they weren\'t relieved, but because they all understood what it meant: the launch was still happening.',
    author: '7rTv...2nBw',
    authorHandle: '@maya_writes',
    voteCount: 198,
    sealedAt: Date.now() - 1000 * 60 * 30,
    isOpening: false,
    contentHash: 'c5h1e4g0d3f9c2e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4f7a2c5e8',
    arweaveUri: 'ar://So0zT4m6pR9nN1xD5fF7hJ3lM8yB2wC4',
    sealedBlock: '287,443,901',
    aiGenerated: true,
    winningDirection: 'Fast-forward to the fix — show the team watching health checks in silence, no celebration, just the weight of what comes next',
  },
]

// ── Stage 1: All submitted directions (8 total — community pool) ───────────────
// These are the raw submissions before the top 5 are shortlisted.
export const DEMO_STAGE1_POOL = [
  {
    id: 'pool-1',
    content: 'Cut to the whole team watching the dashboard refresh. Nobody speaks. The on-call Slack goes silent. Someone outside — a journalist — is already writing the story of the failed launch.',
    contributor: '5pNm...8kLj',
    contributorHandle: '@techwriter_ravi',
    voteCount: 0,
  },
  {
    id: 'pool-2',
    content: 'Reveal it was the intern who rotated the deploy keys during the security audit. She didn\'t update the env variables. Her hand is half-raised, voice barely audible. The room temperature drops.',
    contributor: '2wXq...5mRo',
    contributorHandle: '@storyhunter_em',
    voteCount: 0,
  },
  {
    id: 'pool-3',
    content: 'VP calls in on speakerphone. He gives them twenty minutes. Cold voice, past anger. In the background before he hangs up the CEO can be heard asking what "rollback" means.',
    contributor: '9cYs...3vPt',
    contributorHandle: '@inkandcode',
    voteCount: 0,
  },
  {
    id: 'pool-4',
    content: 'Sarah finds the commit. It\'s six months old. The author deleted their GitHub account. Show her opening the git blame and just staring at a ghost.',
    contributor: 'bK3p...1rNx',
    contributorHandle: '@latenight_coder',
    voteCount: 0,
  },
  {
    id: 'pool-5',
    content: 'The CTO walks in. No laptop, no urgency. Pours himself coffee. Asks a single question nobody thought to ask. The whole room pivots in five seconds.',
    contributor: 'qZ7m...4tPy',
    contributorHandle: '@plotdevice',
    voteCount: 0,
  },
  {
    id: 'pool-6',
    content: 'Zoom the timeline — show the exact 47 minutes where everything was fine, then wasn\'t. Three parallel Slack threads. Nobody was watching the same channel.',
    contributor: 'hV2k...9wQs',
    contributorHandle: '@seriallogs',
    voteCount: 0,
  },
  {
    id: 'pool-7',
    content: 'Show the junior dev who flagged this in code review three weeks ago. His comment was dismissed with "out of scope." He\'s still in the room. He hasn\'t said anything.',
    contributor: 'nR5c...6dLm',
    contributorHandle: '@quietengineer',
    voteCount: 0,
  },
  {
    id: 'pool-8',
    content: 'Cut to the investor relations team in a glass conference room upstairs. They can see the engineering floor. They\'re pretending not to watch.',
    contributor: 'fT8j...0xBu',
    contributorHandle: '@glasswalls',
    voteCount: 0,
  },
]

// ── Stage 2: Top 5 shortlist with vote counts (populated by system) ────────────
export const DEMO_STAGE2_SHORTLIST = [
  {
    id: 'pool-7',
    content: 'Show the junior dev who flagged this in code review three weeks ago. His comment was dismissed with "out of scope." He\'s still in the room. He hasn\'t said anything.',
    contributor: 'nR5c...6dLm',
    contributorHandle: '@quietengineer',
    voteCount: 143,
    percentage: 35,
  },
  {
    id: 'pool-3',
    content: 'VP calls in on speakerphone. He gives them twenty minutes. Cold voice, past anger. In the background before he hangs up the CEO can be heard asking what "rollback" means.',
    contributor: '9cYs...3vPt',
    contributorHandle: '@inkandcode',
    voteCount: 98,
    percentage: 24,
  },
  {
    id: 'pool-2',
    content: 'Reveal it was the intern who rotated the deploy keys during the security audit. She didn\'t update the env variables. Her hand is half-raised, voice barely audible. The room temperature drops.',
    contributor: '2wXq...5mRo',
    contributorHandle: '@storyhunter_em',
    voteCount: 87,
    percentage: 21,
  },
  {
    id: 'pool-5',
    content: 'The CTO walks in. No laptop, no urgency. Pours himself coffee. Asks a single question nobody thought to ask. The whole room pivots in five seconds.',
    contributor: 'qZ7m...4tPy',
    contributorHandle: '@plotdevice',
    voteCount: 64,
    percentage: 16,
  },
  {
    id: 'pool-1',
    content: 'Cut to the whole team watching the dashboard refresh. Nobody speaks. The on-call Slack goes silent. Someone outside — a journalist — is already writing the story of the failed launch.',
    contributor: '5pNm...8kLj',
    contributorHandle: '@techwriter_ravi',
    voteCount: 16,
    percentage: 4,
  },
]

// Legacy alias (used in some pages)
export const DEMO_SUBMISSIONS = DEMO_STAGE2_SHORTLIST

export const DEMO_ACTIVE_ROUND = {
  roundIndex: 3,
  status: 'Voting' as const,
  submissionDeadline: Date.now() - 1000 * 60 * 2,
  votingDeadline: Date.now() + 1000 * 60 * 3, // 3 minutes from now — short for demo
  totalVotes: 408,
  submissionCount: 8,
  maxSubmissions: 20,
}

export const DEMO_CHAIN_RECORD = {
  pieceTitle: 'It Was the Night Before the Product Launch',
  paragraphIndex: 3,
  totalParagraphs: 12,
  authorWallet: 'nR5c...6dLm',
  votesReceived: 143,
  totalVotesCast: 408,
  sealedBlock: '287,443,901',
  sealedAt: 'Block 287,443,901 — April 4, 2026, 14:32 UTC',
  contentHash: 'e7f2a1...d9c4b8',
  arweaveUri: 'ar://Tv1wU5n7qS0oO3xE6gG8iK4mN9zA2vC5',
  programId: 'ahWw6JRQVTsE5NQoEJC7kXcE5ZYU3KZS6jEU9V7mx15',
}

export const DEMO_PIECES_EXPLORE = [
  {
    id: 'demo-piece-2',
    title: 'The Last Summer at the Observatory',
    paragraphCount: 7,
    roundCount: 7,
    status: 'Active' as const,
    creator: '@stargazer_mila',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    totalVotes: 1240,
    genre: 'Literary Fiction',
    activeRound: true,
  },
  {
    id: 'demo-piece-3',
    title: 'Protocol Sigma — A Mission That Wasn\'t',
    paragraphCount: 12,
    roundCount: 12,
    status: 'Complete' as const,
    creator: '@thriller_vance',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    totalVotes: 4310,
    genre: 'Sci-Fi Thriller',
    activeRound: false,
  },
  {
    id: 'demo-piece-4',
    title: 'Twelve Letters to the City',
    paragraphCount: 4,
    roundCount: 4,
    status: 'Active' as const,
    creator: '@urbanpoet_jin',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    totalVotes: 567,
    genre: 'Personal Essay',
    activeRound: true,
  },
  {
    id: 'demo-piece-5',
    title: 'How to Build a Company You\'ll Eventually Regret',
    paragraphCount: 9,
    roundCount: 9,
    status: 'Active' as const,
    creator: '@hacker_founder_k',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    totalVotes: 2890,
    genre: 'Startup Memoir',
    activeRound: false,
  },
]
