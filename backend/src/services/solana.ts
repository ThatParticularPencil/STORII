import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import type { Server as IOServer } from 'socket.io'
import type { VoteStore } from './voteStore'

const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || 'STRYLKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1'
)

/**
 * Listens to Solana program account changes and emits real-time
 * vote updates via Socket.io.
 *
 * In the hackathon demo this is a stub. In production it would:
 * 1. Subscribe to all accounts owned by the Storylock program
 * 2. Decode account data using the IDL
 * 3. Emit vote updates when Submission.vote_count changes
 * 4. Emit round state changes when Round.status changes
 */
export async function setupSolanaListener(io: IOServer, voteStore: VoteStore) {
  const cluster = process.env.SOLANA_CLUSTER || 'localnet'
  const endpoint =
    process.env.SOLANA_RPC ||
    (cluster === 'localnet' ? 'http://127.0.0.1:8899' : clusterApiUrl(cluster as 'devnet' | 'mainnet-beta'))

  const connection = new Connection(endpoint, 'confirmed')

  console.log(`[solana] connecting to ${cluster} (${endpoint})`)

  // Subscribe to program accounts
  // In production, decode Submission accounts and emit updates
  connection.onProgramAccountChange(
    PROGRAM_ID,
    async (accountInfo, context) => {
      try {
        // Decode the account discriminator to determine account type
        // For hackathon demo, we just log it
        const data = accountInfo.accountInfo.data
        const discriminator = data.slice(0, 8)
        console.log(
          `[solana] account change — slot ${context.slot} — disc: ${discriminator.toString('hex')}`
        )

        // In production:
        // if (isSubmissionAccount(discriminator)) {
        //   const submission = decodeSubmission(data)
        //   voteStore.recordVote(submission.round.toString(), ...)
        //   io.to(`round:${submission.round.toString()}`).emit('vote:update', ...)
        // }
      } catch (err) {
        // Ignore decode errors
      }
    },
    'confirmed'
  )

  console.log('[solana] program account change listener registered')
}
