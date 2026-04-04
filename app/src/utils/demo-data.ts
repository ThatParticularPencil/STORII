/**
 * Demo data for hackathon presentations.
 * Used when in demo mode (no real wallet / devnet transactions needed).
 */

export const DEMO_PIECE = {
  id: 'demo-piece-1',
  title: 'It Was the Night Before the Product Launch',
  status: 'Active' as const,
  paragraphCount: 3,
  roundCount: 3,
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
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
  },
  {
    index: 1,
    content:
      '"Pull request 847," muttered Dev from the corner desk without looking up. He had been there since morning, headphones on, somehow already knowing the root cause. "JWT expiry got pushed to midnight UTC in the staging config but we\'re running on Pacific time in prod." The silence that followed was the kind that makes careers and ends them. Sarah looked at the diff. Twelve characters. Twelve characters that had been quietly sleeping for six months, waiting for this exact moment.',
    author: '3kMn...7pQs',
    authorHandle: '@devsmith_codes',
    voteCount: 142,
    sealedAt: Date.now() - 1000 * 60 * 60 * 24,
    isOpening: false,
    contentHash: 'b4g0d3f9c2e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4',
    arweaveUri: 'ar://Rn9yS3l5oQ8mM0wC4eE6gI2kL7xA1vB3',
    sealedBlock: '287,442,891',
  },
  {
    index: 2,
    content:
      'The fix took forty seconds. The deploys took eleven minutes. They watched the health checks in complete silence — eight engineers, one product manager, and a very confused intern who had only started on Monday. When the first green checkmark appeared, nobody celebrated. Not because they weren\'t relieved, but because they all understood what it meant: the launch was still happening, and now they had to go explain to the VP of Sales why they\'d been "running security tests" for the last two hours.',
    author: '7rTv...2nBw',
    authorHandle: '@maya_writes',
    voteCount: 198,
    sealedAt: Date.now() - 1000 * 60 * 30,
    isOpening: false,
    contentHash: 'c5h1e4g0d3f9c2e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4f7a2c5e8b1d4f7a2c5e8',
    arweaveUri: 'ar://So0zT4m6pR9nN1xD5fF7hJ3lM8yB2wC4',
    sealedBlock: '287,443,901',
  },
]

export const DEMO_SUBMISSIONS = [
  {
    id: 'sub-1',
    content:
      'She refreshed the dashboard again. Still red. The on-call Slack channel had twenty-three unread messages and the CTO had sent a calendar invite titled "Post-mortem — Launch Night" forty minutes ago. Outside the office window, San Francisco glittered indifferently. Somewhere in that city, journalists were waiting for the press release. Investors were refreshing their portfolios. And here in this fluorescent-lit room, eight humans were debugging a timezone offset.',
    contributor: '5pNm...8kLj',
    contributorHandle: '@techwriter_ravi',
    voteCount: 89,
    percentage: 28,
  },
  {
    id: 'sub-2',
    content:
      'Marcus, the lead engineer, had seen this exact face before — the face of someone realizing that a problem isn\'t technical at all, it\'s political. "Who has the deploy key?" he asked, already knowing the answer. Three hands went up. Then one came down. Then another. The intern\'s hand stayed raised, trembling slightly. "I rotated them last week," she said quietly. "During the security audit. I thought I updated the environment variables." The room temperature dropped four degrees.',
    contributor: '2wXq...5mRo',
    contributorHandle: '@storyhunter_em',
    voteCount: 127,
    percentage: 40,
  },
  {
    id: 'sub-3',
    content:
      '"How long?" asked the VP on speakerphone. His voice had the special flatness of someone who had moved past anger into something colder and more permanent. Sarah typed without looking up. "Twelve minutes to rollback, eight minutes to re-deploy the hotfix, then we need fifteen for smoke tests." The speakerphone breathed. "You have twenty," it said, and went silent. In the background of the call, before it cut off, someone — possibly the CEO — could be heard asking what "rollback" meant.',
    contributor: '9cYs...3vPt',
    contributorHandle: '@inkandcode',
    voteCount: 100,
    percentage: 32,
  },
]

export const DEMO_ACTIVE_ROUND = {
  roundIndex: 3,
  status: 'Voting' as const,
  submissionDeadline: Date.now() - 1000 * 60 * 30, // 30 min ago
  votingDeadline: Date.now() + 1000 * 60 * 60 * 2, // 2 hours from now
  totalVotes: 316,
  submissionCount: 3,
  maxSubmissions: 20,
}

export const DEMO_CHAIN_RECORD = {
  pieceTitle: 'It Was the Night Before the Product Launch',
  paragraphIndex: 3,
  totalParagraphs: 12,
  authorWallet: '7rTv...2nBw',
  votesReceived: 198,
  totalVotesCast: 310,
  sealedBlock: '287,443,901',
  sealedAt: 'Block 287,443,901 — April 3, 2026, 14:32 UTC',
  contentHash: 'c5h1e4...b1d4f7',
  arweaveUri: 'ar://So0zT4m6pR9nN1xD5fF7hJ3lM8yB2wC4',
  programId: 'STRYLKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1',
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
