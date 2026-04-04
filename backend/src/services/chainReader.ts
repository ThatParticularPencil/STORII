/**
 * chainReader.ts
 * Fetches and decodes Anchor program accounts from Solana devnet (or mainnet).
 *
 * Manual Borsh decoder mirrors the Rust account structs in programs/storylock/src/lib.rs.
 * No extra dependencies — just @solana/web3.js (already installed).
 */

import { Connection, PublicKey, GetProgramAccountsFilter, clusterApiUrl } from '@solana/web3.js'

// ── Connection ────────────────────────────────────────────────────────────────

let _connection: Connection | null = null

export function getChainConnection(): Connection {
  if (_connection) return _connection
  const cluster = process.env.SOLANA_CLUSTER || 'devnet'
  const endpoint =
    process.env.SOLANA_RPC ||
    (cluster === 'localnet' ? 'http://127.0.0.1:8899' : clusterApiUrl(cluster as 'devnet' | 'mainnet-beta'))
  _connection = new Connection(endpoint, 'confirmed')
  return _connection
}

export const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || 'ahWw6JRQVTsE5NQoEJC7kXcE5ZYU3KZS6jEU9V7mx15'
)

// ── Discriminators (from IDL) ─────────────────────────────────────────────────

export const DISCRIMINATORS = {
  Piece:           Buffer.from([12,  54, 178,  23,  89, 144, 201,  67]),
  Round:           Buffer.from([45, 123, 201,   8,  66, 177, 234,  99]),
  Submission:      Buffer.from([78, 201,  34, 156,  44, 211,  89, 123]),
  Vote:            Buffer.from([99, 234,  55, 178, 201,  12,  67, 145]),
  SealedParagraph: Buffer.from([123, 56, 201,  89,  34, 177,  12, 234]),
  SubscriberRecord:Buffer.from([201, 89,  34, 123, 177,  56, 234,  12]),
}

// ── Borsh reader ──────────────────────────────────────────────────────────────

class BorshReader {
  private offset: number

  constructor(private buf: Buffer, skipDiscriminator = true) {
    this.offset = skipDiscriminator ? 8 : 0
  }

  u8():  number { return this.buf.readUInt8(this.offset++) }
  u16(): number { const v = this.buf.readUInt16LE(this.offset); this.offset += 2; return v }
  u32(): number { const v = this.buf.readUInt32LE(this.offset); this.offset += 4; return v }
  u64(): bigint {
    const lo = BigInt(this.buf.readUInt32LE(this.offset))
    const hi = BigInt(this.buf.readUInt32LE(this.offset + 4))
    this.offset += 8
    return (hi << 32n) | lo
  }
  i64(): number {
    const lo = this.buf.readUInt32LE(this.offset)
    const hi = this.buf.readInt32LE(this.offset + 4)
    this.offset += 8
    return hi * 0x1_0000_0000 + lo
  }
  bool(): boolean { return this.u8() !== 0 }
  pk(): PublicKey {
    const b = this.buf.slice(this.offset, this.offset + 32)
    this.offset += 32
    return new PublicKey(b)
  }
  str(): string {
    const len = this.u32()
    const s = this.buf.slice(this.offset, this.offset + len).toString('utf8')
    this.offset += len
    return s
  }
  bytes(n: number): Buffer {
    const b = this.buf.slice(this.offset, this.offset + n)
    this.offset += n
    return b
  }
  option<T>(fn: () => T): T | null {
    return this.u8() ? fn() : null
  }
}

// ── Decoded account shapes ────────────────────────────────────────────────────

export interface ChainPiece {
  pubkey:         string
  creator:        string
  title:          string
  status:         'Active' | 'Complete'
  paragraphCount: number
  roundCount:     number
  createdAt:      number   // unix timestamp (seconds)
}

export interface ChainRound {
  pubkey:              string
  piece:               string
  roundIndex:          number
  submissionDeadline:  number
  votingDeadline:      number
  status:              'Submissions' | 'Voting' | 'Closed'
  winningSubmission:   string | null
  totalVotes:          number
  submissionCount:     number
  maxSubmissions:      number
  openedAt:            number
  creatorNote:         string
}

export interface ChainSubmission {
  pubkey:      string
  round:       string
  piece:       string
  contributor: string
  contentHash: string   // hex
  arweaveUri:  string
  voteCount:   number
  submittedAt: number
}

export interface ChainParagraph {
  pubkey:      string
  piece:       string
  index:       number
  contentHash: string   // hex
  arweaveUri:  string
  author:      string
  sealedAt:    number
  voteCount:   number
  isOpening:   boolean
  content?:    string   // fetched from Arweave / backend store
}

// ── Decoders ──────────────────────────────────────────────────────────────────

function decodePiece(pubkey: PublicKey, data: Buffer): ChainPiece {
  const r = new BorshReader(data)
  return {
    pubkey:         pubkey.toString(),
    creator:        r.pk().toString(),
    title:          r.str(),
    status:         r.u8() === 0 ? 'Active' : 'Complete',
    paragraphCount: r.u32(),
    roundCount:     r.u32(),
    createdAt:      r.i64(),
  }
}

function decodeRound(pubkey: PublicKey, data: Buffer): ChainRound {
  const r = new BorshReader(data)
  const piece              = r.pk().toString()
  const roundIndex         = r.u32()
  const submissionDeadline = r.i64()
  const votingDeadline     = r.i64()
  const statusIdx          = r.u8()
  const status             = (['Submissions', 'Voting', 'Closed'] as const)[statusIdx] ?? 'Closed'
  const winningSubmission  = r.option(() => r.pk().toString())
  const totalVotes         = r.u32()
  const submissionCount    = r.u16()
  const maxSubmissions     = r.u16()
  const openedAt           = r.i64()
  const creatorNote        = r.str()
  return {
    pubkey: pubkey.toString(), piece, roundIndex,
    submissionDeadline, votingDeadline, status, winningSubmission,
    totalVotes, submissionCount, maxSubmissions, openedAt, creatorNote,
  }
}

function decodeSubmission(pubkey: PublicKey, data: Buffer): ChainSubmission {
  const r = new BorshReader(data)
  const round       = r.pk().toString()
  const piece       = r.pk().toString()
  const contributor = r.pk().toString()
  const hashBytes   = r.bytes(32)
  const contentHash = Buffer.from(hashBytes).toString('hex')
  const arweaveUri  = r.str()
  const voteCount   = r.u32()
  const submittedAt = r.i64()
  return { pubkey: pubkey.toString(), round, piece, contributor, contentHash, arweaveUri, voteCount, submittedAt }
}

function decodeParagraph(pubkey: PublicKey, data: Buffer): ChainParagraph {
  const r = new BorshReader(data)
  const piece       = r.pk().toString()
  const index       = r.u32()
  const hashBytes   = r.bytes(32)
  const contentHash = Buffer.from(hashBytes).toString('hex')
  const arweaveUri  = r.str()
  const author      = r.pk().toString()
  const sealedAt    = r.i64()
  const voteCount   = r.u32()
  const isOpening   = r.bool()
  return { pubkey: pubkey.toString(), piece, index, contentHash, arweaveUri, author, sealedAt, voteCount, isOpening }
}

// ── Arweave content cache ─────────────────────────────────────────────────────

const arweaveCache = new Map<string, string>()

export async function fetchArweaveContent(uri: string): Promise<string | null> {
  if (!uri || !uri.startsWith('ar://')) return null
  const txId = uri.slice(5)
  if (!txId) return null

  if (arweaveCache.has(txId)) return arweaveCache.get(txId)!

  try {
    const res = await fetch(`https://arweave.net/${txId}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const text = await res.text()
    arweaveCache.set(txId, text)
    return text
  } catch {
    return null
  }
}

// ── Program account fetchers ──────────────────────────────────────────────────

function discFilter(disc: Buffer): GetProgramAccountsFilter {
  return { memcmp: { offset: 0, bytes: disc.toString('base64') } }
}

export async function fetchAllPieces(): Promise<ChainPiece[]> {
  const connection = getChainConnection()
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [discFilter(DISCRIMINATORS.Piece)],
  })
  return accounts.flatMap(({ pubkey, account }) => {
    try { return [decodePiece(pubkey, account.data as Buffer)] } catch { return [] }
  })
}

export async function fetchPieceParagraphs(pieceKey: string): Promise<ChainParagraph[]> {
  const connection = getChainConnection()
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      discFilter(DISCRIMINATORS.SealedParagraph),
      { memcmp: { offset: 8, bytes: new PublicKey(pieceKey).toBase58() } },
    ],
  })
  const paras = accounts.flatMap(({ pubkey, account }) => {
    try { return [decodeParagraph(pubkey, account.data as Buffer)] } catch { return [] }
  })
  paras.sort((a, b) => a.index - b.index)
  return paras
}

export async function fetchRoundForPiece(pieceKey: string): Promise<ChainRound[]> {
  const connection = getChainConnection()
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      discFilter(DISCRIMINATORS.Round),
      { memcmp: { offset: 8, bytes: new PublicKey(pieceKey).toBase58() } },
    ],
  })
  const rounds = accounts.flatMap(({ pubkey, account }) => {
    try { return [decodeRound(pubkey, account.data as Buffer)] } catch { return [] }
  })
  rounds.sort((a, b) => a.roundIndex - b.roundIndex)
  return rounds
}

export async function fetchRoundSubmissions(roundKey: string): Promise<ChainSubmission[]> {
  const connection = getChainConnection()
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      discFilter(DISCRIMINATORS.Submission),
      { memcmp: { offset: 8, bytes: new PublicKey(roundKey).toBase58() } },
    ],
  })
  return accounts.flatMap(({ pubkey, account }) => {
    try { return [decodeSubmission(pubkey, account.data as Buffer)] } catch { return [] }
  })
}

export async function fetchRoundByKey(roundKey: string): Promise<ChainRound | null> {
  const connection = getChainConnection()
  const info = await connection.getAccountInfo(new PublicKey(roundKey))
  if (!info || !info.data) return null
  try { return decodeRound(new PublicKey(roundKey), info.data as Buffer) } catch { return null }
}

// ── Full piece builder (with content) ────────────────────────────────────────

export interface FullPiece extends ChainPiece {
  paragraphs: ChainParagraph[]
  activeRound: ChainRound | null
}

export async function buildFullPiece(
  pieceKey: string,
  contentStore: Map<string, string>  // hash → content text
): Promise<FullPiece | null> {
  const connection = getChainConnection()

  let piece: ChainPiece | null = null
  try {
    const info = await connection.getAccountInfo(new PublicKey(pieceKey))
    if (!info) return null
    piece = decodePiece(new PublicKey(pieceKey), info.data as Buffer)
  } catch { return null }

  const [paragraphs, rounds] = await Promise.all([
    fetchPieceParagraphs(pieceKey),
    fetchRoundForPiece(pieceKey),
  ])

  // Enrich paragraphs with text content
  for (const para of paragraphs) {
    // Check backend content store first (keyed by hash)
    if (contentStore.has(para.contentHash)) {
      para.content = contentStore.get(para.contentHash)!
    } else {
      // Try Arweave
      const text = await fetchArweaveContent(para.arweaveUri)
      if (text) {
        para.content = text
        contentStore.set(para.contentHash, text)
      }
    }
  }

  // Active round = the latest non-Closed round, or last round
  const activeRound = rounds.find(r => r.status !== 'Closed') ?? rounds[rounds.length - 1] ?? null

  return { ...piece, paragraphs, activeRound }
}
