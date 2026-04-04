import { useCallback, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
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
import STORYLOCK_IDL from '@/idl/storylock.json'

// ── Anchor program builder ────────────────────────────────────────────────────

function getProgram(connection: anchor.web3.Connection, wallet: any) {
  const provider = new anchor.AnchorProvider(connection, wallet as anchor.Wallet, { commitment: 'confirmed' })
  return new anchor.Program(STORYLOCK_IDL as anchor.Idl, provider)
}

// Adapt wallet-adapter wallet to Anchor wallet interface
function toAnchorWallet(wallet: ReturnType<typeof useWallet>): any | null {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) return null
  return {
    publicKey:           wallet.publicKey,
    signTransaction:     wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStorylock() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const { publicKey, sendTransaction } = wallet
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── createPiece ─────────────────────────────────────────────────────────────

  const createPiece = useCallback(
    async (title: string, openingText: string, arweaveUri: string) => {
      if (!publicKey) throw new Error('Wallet not connected')
      const anchorWallet = toAnchorWallet(wallet)
      if (!anchorWallet) throw new Error('Wallet does not support signing')
      setLoading(true); setError(null)
      try {
        const [piecePDA]    = findPiecePDA(publicKey, title)
        const [paragraphPDA] = findSealedParagraphPDA(piecePDA, 0)
        const openingHash   = Array.from(hashContent(openingText))

        const program = getProgram(connection, anchorWallet)
        const tx = await program.methods
          .createPiece(title, openingHash, arweaveUri)
          .accounts({
            piece:           piecePDA,
            openingParagraph: paragraphPDA,
            creator:         publicKey,
            systemProgram:   SystemProgram.programId,
          })
          .transaction()

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer        = publicKey

        const sig = await sendTransaction(tx, connection)
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
        console.log('[chain] create_piece confirmed:', sig)
        return sig
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [publicKey, wallet, connection, sendTransaction]
  )

  // ── openRound ───────────────────────────────────────────────────────────────

  const openRound = useCallback(
    async (
      piecePDA: PublicKey,
      roundIndex: number,
      submissionDurationSecs: number,
      votingDurationSecs: number,
      maxSubmissions: number
    ) => {
      if (!publicKey) throw new Error('Wallet not connected')
      const anchorWallet = toAnchorWallet(wallet)
      if (!anchorWallet) throw new Error('Wallet does not support signing')
      setLoading(true); setError(null)
      try {
        const [roundPDA] = findRoundPDA(piecePDA, roundIndex)

        const program = getProgram(connection, anchorWallet)
        const tx = await program.methods
          .openRound(
            new anchor.BN(submissionDurationSecs),
            new anchor.BN(votingDurationSecs),
            maxSubmissions
          )
          .accounts({
            round:         roundPDA,
            piece:         piecePDA,
            creator:       publicKey,
            systemProgram: SystemProgram.programId,
          })
          .transaction()

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer        = publicKey

        const sig = await sendTransaction(tx, connection)
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
        console.log('[chain] open_round confirmed:', sig)
        return sig
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [publicKey, wallet, connection, sendTransaction]
  )

  // ── submitParagraph ─────────────────────────────────────────────────────────

  const submitParagraph = useCallback(
    async (roundPDA: PublicKey, piecePDA: PublicKey, content: string, arweaveUri: string) => {
      if (!publicKey) throw new Error('Wallet not connected')
      const anchorWallet = toAnchorWallet(wallet)
      if (!anchorWallet) throw new Error('Wallet does not support signing')
      setLoading(true); setError(null)
      try {
        const contentHash    = Array.from(hashContent(content))
        const [submissionPDA] = findSubmissionPDA(roundPDA, publicKey)
        const [subscriberPDA] = findSubscriberPDA(piecePDA, publicKey)

        const program = getProgram(connection, anchorWallet)
        const tx = await program.methods
          .submitParagraph(contentHash, arweaveUri)
          .accounts({
            submission:       submissionPDA,
            round:            roundPDA,
            subscriberRecord: subscriberPDA,
            piece:            piecePDA,
            contributor:      publicKey,
            systemProgram:    SystemProgram.programId,
          })
          .transaction()

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer        = publicKey

        const sig = await sendTransaction(tx, connection)
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
        console.log('[chain] submit_paragraph confirmed:', sig)
        return sig
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [publicKey, wallet, connection, sendTransaction]
  )

  // ── castVote ────────────────────────────────────────────────────────────────

  const castVote = useCallback(
    async (roundPDA: PublicKey, piecePDA: PublicKey, submissionPDA: PublicKey) => {
      if (!publicKey) throw new Error('Wallet not connected')
      const anchorWallet = toAnchorWallet(wallet)
      if (!anchorWallet) throw new Error('Wallet does not support signing')
      setLoading(true); setError(null)
      try {
        const [votePDA]       = findVotePDA(roundPDA, publicKey)
        const [subscriberPDA] = findSubscriberPDA(piecePDA, publicKey)

        const program = getProgram(connection, anchorWallet)
        const tx = await program.methods
          .castVote()
          .accounts({
            vote:             votePDA,
            round:            roundPDA,
            submission:       submissionPDA,
            subscriberRecord: subscriberPDA,
            piece:            piecePDA,
            voter:            publicKey,
            systemProgram:    SystemProgram.programId,
          })
          .transaction()

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer        = publicKey

        const sig = await sendTransaction(tx, connection)
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
        console.log('[chain] cast_vote confirmed:', sig)
        return sig
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [publicKey, wallet, connection, sendTransaction]
  )

  // ── closeRound ──────────────────────────────────────────────────────────────

  const closeRound = useCallback(
    async (
      roundPDA: PublicKey,
      piecePDA: PublicKey,
      winningSubmissionKey: PublicKey,
      creatorNote: string,
      paragraphIndex: number
    ) => {
      if (!publicKey) throw new Error('Wallet not connected')
      const anchorWallet = toAnchorWallet(wallet)
      if (!anchorWallet) throw new Error('Wallet does not support signing')
      setLoading(true); setError(null)
      try {
        const [sealedParagraphPDA] = findSealedParagraphPDA(piecePDA, paragraphIndex)

        const program = getProgram(connection, anchorWallet)
        const tx = await program.methods
          .closeRound(winningSubmissionKey, creatorNote)
          .accounts({
            sealedParagraph:    sealedParagraphPDA,
            round:              roundPDA,
            winningSubmission:  winningSubmissionKey,
            piece:              piecePDA,
            creator:            publicKey,
            systemProgram:      SystemProgram.programId,
          })
          .transaction()

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer        = publicKey

        const sig = await sendTransaction(tx, connection)
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
        console.log('[chain] close_round confirmed:', sig)
        return sig
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [publicKey, wallet, connection, sendTransaction]
  )

  // ── addSubscriber ───────────────────────────────────────────────────────────

  const addSubscriber = useCallback(
    async (piecePDA: PublicKey, subscriberWallet: PublicKey, tier: 'InnerCircle' | 'Community' | 'Reader') => {
      if (!publicKey) throw new Error('Wallet not connected')
      const anchorWallet = toAnchorWallet(wallet)
      if (!anchorWallet) throw new Error('Wallet does not support signing')
      setLoading(true); setError(null)
      try {
        const [subscriberPDA] = findSubscriberPDA(piecePDA, subscriberWallet)
        const tierArg = tier === 'InnerCircle' ? { innerCircle: {} } :
                        tier === 'Community'   ? { community: {} } :
                        { reader: {} }

        const program = getProgram(connection, anchorWallet)
        const tx = await program.methods
          .addSubscriber(tierArg as any)
          .accounts({
            subscriberRecord: subscriberPDA,
            piece:            piecePDA,
            creator:          publicKey,
            subscriber:       subscriberWallet,
            systemProgram:    SystemProgram.programId,
          })
          .transaction()

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer        = publicKey

        const sig = await sendTransaction(tx, connection)
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
        console.log('[chain] add_subscriber confirmed:', sig)
        return sig
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [publicKey, wallet, connection, sendTransaction]
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
