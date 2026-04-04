import { useCallback, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import {
  findPiecePDA,
  findRoundPDA,
  findSubmissionPDA,
  findVotePDA,
  findSealedParagraphPDA,
  findSubscriberPDA,
  hashContent,
  PROGRAM_ID,
} from '@/utils/solana'

// In production this would use the generated IDL + AnchorProvider.
// For the hackathon demo, we expose the PDA derivation and instruction building
// utilities, and call the program via the Anchor client when available.

export function useStorylock() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPiece = useCallback(
    async (title: string, openingText: string, arweaveUri: string) => {
      if (!publicKey) throw new Error('Wallet not connected')
      setLoading(true)
      setError(null)
      try {
        const [piecePDA] = findPiecePDA(publicKey, title)
        const [openingParagraphPDA] = findSealedParagraphPDA(piecePDA, 0)
        const contentHash = hashContent(openingText)

        // In production: build the Anchor instruction and send it
        // const tx = await program.methods.createPiece(title, Array.from(contentHash), arweaveUri)
        //   .accounts({ piece: piecePDA, openingParagraph: openingParagraphPDA, creator: publicKey, systemProgram: SystemProgram.programId })
        //   .transaction()
        // const sig = await sendTransaction(tx, connection)
        // await connection.confirmTransaction(sig, 'confirmed')
        // return sig

        // Demo: simulate transaction
        await new Promise(r => setTimeout(r, 1500))
        console.log('[DEMO] create_piece', { piecePDA: piecePDA.toString(), title })
        return 'demo-signature-create-piece'
      } finally {
        setLoading(false)
      }
    },
    [publicKey, connection, sendTransaction]
  )

  const openRound = useCallback(
    async (
      piecePDA: PublicKey,
      roundIndex: number,
      submissionDurationSecs: number,
      votingDurationSecs: number,
      maxSubmissions: number
    ) => {
      if (!publicKey) throw new Error('Wallet not connected')
      setLoading(true)
      setError(null)
      try {
        const [roundPDA] = findRoundPDA(piecePDA, roundIndex)
        await new Promise(r => setTimeout(r, 1000))
        console.log('[DEMO] open_round', { roundPDA: roundPDA.toString(), roundIndex })
        return 'demo-signature-open-round'
      } finally {
        setLoading(false)
      }
    },
    [publicKey, connection, sendTransaction]
  )

  const submitParagraph = useCallback(
    async (roundPDA: PublicKey, piecePDA: PublicKey, content: string, arweaveUri: string) => {
      if (!publicKey) throw new Error('Wallet not connected')
      setLoading(true)
      setError(null)
      try {
        const contentHash = hashContent(content)
        const [submissionPDA] = findSubmissionPDA(roundPDA, publicKey)
        await new Promise(r => setTimeout(r, 1800))
        console.log('[DEMO] submit_paragraph', {
          submission: submissionPDA.toString(),
          contentHash: Array.from(contentHash).slice(0, 8),
        })
        return 'demo-signature-submit'
      } finally {
        setLoading(false)
      }
    },
    [publicKey, connection, sendTransaction]
  )

  const castVote = useCallback(
    async (roundPDA: PublicKey, piecePDA: PublicKey, submissionPDA: PublicKey) => {
      if (!publicKey) throw new Error('Wallet not connected')
      setLoading(true)
      setError(null)
      try {
        const [votePDA] = findVotePDA(roundPDA, publicKey)
        await new Promise(r => setTimeout(r, 900))
        console.log('[DEMO] cast_vote', { vote: votePDA.toString(), submission: submissionPDA.toString() })
        return 'demo-signature-vote'
      } finally {
        setLoading(false)
      }
    },
    [publicKey, connection, sendTransaction]
  )

  const closeRound = useCallback(
    async (
      roundPDA: PublicKey,
      piecePDA: PublicKey,
      winningSubmissionKey: PublicKey,
      creatorNote: string
    ) => {
      if (!publicKey) throw new Error('Wallet not connected')
      setLoading(true)
      setError(null)
      try {
        await new Promise(r => setTimeout(r, 1400))
        console.log('[DEMO] close_round', { round: roundPDA.toString(), winner: winningSubmissionKey.toString() })
        return 'demo-signature-close-round'
      } finally {
        setLoading(false)
      }
    },
    [publicKey, connection, sendTransaction]
  )

  const addSubscriber = useCallback(
    async (piecePDA: PublicKey, subscriberWallet: PublicKey, tier: string) => {
      if (!publicKey) throw new Error('Wallet not connected')
      setLoading(true)
      setError(null)
      try {
        const [subPDA] = findSubscriberPDA(piecePDA, subscriberWallet)
        await new Promise(r => setTimeout(r, 700))
        console.log('[DEMO] add_subscriber', { sub: subPDA.toString(), tier })
        return 'demo-signature-add-subscriber'
      } finally {
        setLoading(false)
      }
    },
    [publicKey, connection, sendTransaction]
  )

  return {
    loading,
    error,
    createPiece,
    openRound,
    submitParagraph,
    castVote,
    closeRound,
    addSubscriber,
  }
}
