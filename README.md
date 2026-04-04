# Storylock

> Write together. Sealed forever.

A Solana-powered collaborative writing platform where creators and their subscribers co-author content paragraph by paragraph, with every vote and winning contribution permanently sealed on-chain.

Built for the **Solana Hackathon 2026** — [Best Use of Solana](https://www.mlh.com/partners/solana) track.

---

## What it does

A creator starts a piece — a blog post, script, or story — and opens it to their inner circle. Subscribers submit the next paragraph. The community votes. The winner is locked on Solana forever, with the contributor's wallet address as permanent co-author. Repeat until the piece is complete.

## How a round works

```
Creator opens round
  → Smart contract issues contribution & vote tokens to eligible wallets
    → Inner Circle submits paragraphs (burns contribution token)
      → Voting opens (all eligible subscribers vote, burns vote token)
        → Winning paragraph sealed on Solana forever
          → Creator adds optional note → Next round
```

## Tech stack

| Layer | Tech |
|---|---|
| Blockchain | Solana (devnet / mainnet) |
| Smart contracts | Anchor framework (Rust) |
| Paragraph storage | Arweave (hash on-chain, text off-chain) |
| Backend | Node.js + Express + Socket.io |
| Frontend | React + Vite + TypeScript + Tailwind |
| Wallets | Phantom, Solflare (Solana Wallet Adapter) |
| Real-time | WebSocket (Socket.io) |

## Project structure

```
storylock/
├── programs/storylock/src/lib.rs   Anchor smart contract (all 8 instructions)
├── app/                             React frontend
│   └── src/
│       ├── pages/                   Landing, Explore, PieceView, RoundView, Dashboard, NewPiece
│       ├── components/              VoteBar, OnChainRecord, TypewriterText, RoundTimer, ...
│       ├── hooks/                   useStorylock, useVoting
│       └── utils/                   Solana PDA derivation, content hashing
├── backend/src/                     Express + Socket.io backend
│   ├── routes/                      pieces, rounds, submissions, subscribers
│   └── services/                    content (Arweave), solana listener, voteStore
└── tests/storylock.ts               Anchor integration tests
```

## Getting started

### Prerequisites

- [Rust](https://rustup.rs/) + Cargo
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (`avm install latest`)
- Node.js 20+

### 1. Install dependencies

```bash
npm install
cd app && npm install
cd ../backend && npm install
```

### 2. Configure environment

```bash
cp .env.example .env
cp .env.example app/.env.local
# Edit PROGRAM_ID after deploying
```

### 3. Build & deploy the smart contract

```bash
anchor build
solana config set --url devnet
anchor deploy --provider.cluster devnet
# Update PROGRAM_ID in .env and app/src/idl/storylock.json
```

### 4. Run locally

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd app && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run tests

```bash
anchor test
```

---

## Smart contract design

### PDAs enforce protocol rules at the protocol level

- `[vote, round, voter]` — one vote per wallet per round, guaranteed by Solana. No off-chain enforcement.
- `[submission, round, contributor]` — one submission per contributor per round.
- `[paragraph, piece, index]` — sealed paragraphs addressable forever by piece + position.

### Tokens as access credentials

Contribution and vote tokens are tracked on `SubscriberRecord` accounts. Issued by the creator at round open, burned on submit/vote. No monetary value. No transfer authority.

### Content stored off-chain

Full paragraph text lives on Arweave (permanent). Only the SHA-256 hash is written on-chain. Anyone can verify the text matches the hash.

---

## Hackathon demo script

1. Open the app. Connect a demo wallet (pre-funded devnet).
2. Navigate to "It Was the Night Before the Product Launch"
3. Vote on Round 4 — watch the live bar chart shift in real time
4. Creator closes the round → winning paragraph seals on Solana in ~400ms
5. Show the on-chain record: contributor wallet, timestamp, vote count — immutable and public

**Pitch line:** *"That paragraph will exist on the Solana blockchain forever. The person who wrote it is now a published co-author."*

---

## Revenue model

| Source | Detail |
|---|---|
| Creator plan | $9/month — unlimited pieces and rounds |
| Creator pro | $29/month — analytics, custom rules, branded experience |
| Brand campaigns | $500+ flat — white-label community writing campaigns |

No token economics. No staking. No financial transactions between users.

---

## Out of scope (deliberately excluded)

- NFT minting of the final piece
- Financial rewards to contributors
- Tradeable or monetary tokens
- On-chain storage of full paragraph text (hash only — keeps costs minimal)
