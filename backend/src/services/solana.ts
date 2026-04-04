import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import type { Server as IOServer } from 'socket.io'
import type { VoteStore } from './voteStore'
import {
  PROGRAM_ID,
  DISCRIMINATORS,
  getChainConnection,
  fetchRoundSubmissions,
  type ChainSubmission,
} from './chainReader'

/**
 * Subscribes to all Storylock program account changes on devnet.
 * Decodes Submission accounts when their vote_count changes and emits
 * real-time updates via Socket.io.
 */
export async function setupSolanaListener(io: IOServer, voteStore: VoteStore) {
  const connection = getChainConnection()
  const cluster = process.env.SOLANA_CLUSTER || 'devnet'
  const endpoint = process.env.SOLANA_RPC || cluster

  console.log(`[solana] connecting to ${cluster} (${endpoint})`)

  connection.onProgramAccountChange(
    PROGRAM_ID,
    async (accountInfo, context) => {
      const data = accountInfo.accountInfo.data as Buffer
      if (data.length < 8) return

      const disc = data.slice(0, 8)

      // ── Submission account changed → vote_count updated ──────────────────
      if (disc.equals(DISCRIMINATORS.Submission)) {
        try {
          // Decode the vote_count field (offset: 8 disc + 32 round + 32 piece + 32 contributor + 32 hash + 4 uri_len + uri_len = variable)
          // Instead of re-decoding the full account, re-fetch submissions for the round
          // Extract round pubkey from bytes 8..40
          const roundKey = new PublicKey(data.slice(8, 40)).toString()
          const submissionKey = accountInfo.accountId.toString()

          // Decode vote_count from the raw account (it's after arweave_uri)
          // Layout: disc(8) + round(32) + piece(32) + contributor(32) + hash(32) + arweave_uri(4+len) + vote_count(4) + submitted_at(8)
          let offset = 8 + 32 + 32 + 32 + 32 // disc + round + piece + contributor + hash
          const uriLen = data.readUInt32LE(offset)
          offset += 4 + uriLen
          const voteCount = data.readUInt32LE(offset)

          // Update voteStore
          const updated = voteStore.setVoteCount(roundKey, submissionKey, voteCount)
          if (updated) {
            io.to(`round:${roundKey}`).emit('vote:update', {
              submissionId: submissionKey,
              newCount: voteCount,
              totalVotes: updated.totalVotes,
            })
            console.log(`[solana] vote update — round ${roundKey.slice(0, 8)}… sub ${submissionKey.slice(0, 8)}… → ${voteCount} votes`)
          }
        } catch (err) {
          // Decode error — skip
        }
        return
      }

      // ── Round account changed → status updated ───────────────────────────
      if (disc.equals(DISCRIMINATORS.Round)) {
        try {
          const roundKey = accountInfo.accountId.toString()
          // Status is at offset: disc(8) + piece(32) + roundIndex(4) + submissionDeadline(8) + votingDeadline(8) = 60
          const statusByte = data.readUInt8(60)
          const status = (['Submissions', 'Voting', 'Closed'] as const)[statusByte] ?? 'Closed'

          io.to(`round:${roundKey}`).emit('round:status', { roundId: roundKey, status })
          console.log(`[solana] round status change — ${roundKey.slice(0, 8)}… → ${status}`)

          // When round closes, fetch all submissions for final tally
          if (status === 'Closed') {
            const subs = await fetchRoundSubmissions(roundKey)
            const totalVotes = subs.reduce((t, s) => t + s.voteCount, 0)
            io.to(`round:${roundKey}`).emit('round:closed', {
              roundId: roundKey,
              totalVotes,
              submissions: subs.map(s => ({
                id: s.pubkey,
                contributor: s.contributor,
                contentHash: s.contentHash,
                arweaveUri: s.arweaveUri,
                voteCount: s.voteCount,
              })),
            })
          }
        } catch (err) {
          // Decode error — skip
        }
        return
      }
    },
    'confirmed'
  )

  console.log('[solana] real-time program account listener registered')
}
