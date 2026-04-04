import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import CryptoJS from 'crypto-js'

// ── Program IDs ───────────────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID || 'STRYLKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1'
)

// ── Connection ────────────────────────────────────────────────────────────────

export function getConnection(): Connection {
  const network = import.meta.env.VITE_SOLANA_NETWORK || 'localnet'
  const endpoint =
    import.meta.env.VITE_RPC_ENDPOINT ||
    (network === 'localnet' ? 'http://127.0.0.1:8899' : clusterApiUrl('devnet'))
  return new Connection(endpoint, 'confirmed')
}

// ── PDA Derivation ────────────────────────────────────────────────────────────

export function findPiecePDA(creator: PublicKey, title: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('piece'), creator.toBuffer(), Buffer.from(title)],
    PROGRAM_ID
  )
}

export function findRoundPDA(piece: PublicKey, roundIndex: number): [PublicKey, number] {
  const indexBuf = Buffer.allocUnsafe(4)
  indexBuf.writeUInt32LE(roundIndex, 0)
  return PublicKey.findProgramAddressSync(
    [Buffer.from('round'), piece.toBuffer(), indexBuf],
    PROGRAM_ID
  )
}

export function findSubmissionPDA(
  round: PublicKey,
  contributor: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('submission'), round.toBuffer(), contributor.toBuffer()],
    PROGRAM_ID
  )
}

export function findVotePDA(
  round: PublicKey,
  voter: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vote'), round.toBuffer(), voter.toBuffer()],
    PROGRAM_ID
  )
}

export function findSealedParagraphPDA(
  piece: PublicKey,
  index: number
): [PublicKey, number] {
  const indexBuf = Buffer.allocUnsafe(4)
  indexBuf.writeUInt32LE(index, 0)
  return PublicKey.findProgramAddressSync(
    [Buffer.from('paragraph'), piece.toBuffer(), indexBuf],
    PROGRAM_ID
  )
}

export function findSubscriberPDA(
  piece: PublicKey,
  subscriber: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('subscriber'), piece.toBuffer(), subscriber.toBuffer()],
    PROGRAM_ID
  )
}

// ── Content hashing ───────────────────────────────────────────────────────────

/**
 * SHA-256 hash of paragraph text → Uint8Array (32 bytes)
 */
export function hashContent(content: string): Uint8Array {
  const wordArray = CryptoJS.SHA256(content)
  const hex = wordArray.toString(CryptoJS.enc.Hex)
  const bytes = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export function hashToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── Address formatting ────────────────────────────────────────────────────────

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function explorerUrl(
  path: string,
  cluster: string = import.meta.env.VITE_SOLANA_NETWORK || 'localnet'
): string {
  if (cluster === 'localnet') {
    // Solana Explorer supports custom RPC
    return `https://explorer.solana.com/${path}?cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899`
  }
  return `https://explorer.solana.com/${path}?cluster=${cluster}`
}

export function explorerTxUrl(sig: string, cluster = import.meta.env.VITE_SOLANA_NETWORK || 'localnet') {
  return explorerUrl(`tx/${sig}`, cluster)
}

export function explorerAccountUrl(address: string, cluster = import.meta.env.VITE_SOLANA_NETWORK || 'localnet') {
  return explorerUrl(`address/${address}`, cluster)
}

// ── Timestamp utilities ────────────────────────────────────────────────────────

export function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }) + ' UTC'
}

export function timeRemaining(deadline: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = deadline - now
  if (diff <= 0) return 'Closed'
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  if (h > 0) return `${h}h ${m}m remaining`
  if (m > 0) return `${m}m ${s}s remaining`
  return `${s}s remaining`
}
