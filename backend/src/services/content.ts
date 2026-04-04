import crypto from 'crypto'

/**
 * Content storage service.
 *
 * contentStore: hash → text (filled from Arweave fetch or direct backend submit)
 * geminiStore:  roundId → { script, hash, uri } (filled after Gemini generation)
 *
 * In production, replace contentStore with a real DB and
 * replace the stub uploadContent() with real Arweave uploads.
 */

// ── In-memory stores ──────────────────────────────────────────────────────────

/** hash (hex) → plain text content */
export const contentStore = new Map<string, string>()

interface GeminiEntry {
  script:  string
  hash:    string
  uri:     string
  pieceTitle: string
  winningDirection: string
  generatedAt: string
}
/** roundId → generated script metadata */
const geminiStore = new Map<string, GeminiEntry>()

// ── Hashing ───────────────────────────────────────────────────────────────────

export function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

// ── Content upload (backend store + optional Arweave) ────────────────────────

export async function uploadContent(text: string): Promise<{ hash: string; uri: string }> {
  const hash = hashContent(text)

  if (!contentStore.has(hash)) {
    contentStore.set(hash, text)
  }

  // In production: upload to Arweave
  // const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' })
  // const wallet  = JSON.parse(process.env.ARWEAVE_WALLET_JSON!)
  // const tx      = await arweave.createTransaction({ data: text }, wallet)
  // tx.addTag('Content-Type', 'text/plain')
  // tx.addTag('App-Name', 'Storylock')
  // await arweave.transactions.sign(tx, wallet)
  // await arweave.transactions.post(tx)
  // const uri = `ar://${tx.id}`

  // Use hash-based fake URI so it's consistent and reproducible
  const uri = `ar://${hash.slice(0, 43)}`
  return { hash, uri }
}

// ── Arweave content fetch ─────────────────────────────────────────────────────

/**
 * Fetches paragraph text from Arweave given an `ar://` URI.
 * Results are cached so repeated reads are instant.
 * Falls back to the local contentStore if the URI is a fake hash-based one.
 */
export async function fetchArweaveContent(uri: string): Promise<string | null> {
  if (!uri) return null

  // Hash-based fake URIs (ar://<43-char-hex-prefix>): check content store
  if (uri.startsWith('ar://') && uri.length === 48) {
    const prefix = uri.slice(5)
    for (const [hash, text] of contentStore) {
      if (hash.startsWith(prefix)) return text
    }
    return null
  }

  if (!uri.startsWith('ar://')) return null
  const txId = uri.slice(5)
  if (!txId) return null

  // Check content store by a best-effort lookup — real Arweave TXs won't collide with hashes
  try {
    const res = await fetch(`https://arweave.net/${txId}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const text = await res.text()
    // Cache in contentStore under the txId as key too
    contentStore.set(txId, text)
    return text
  } catch {
    return null
  }
}

// ── Gemini script cache ───────────────────────────────────────────────────────

/**
 * Called from ai.ts after Gemini generates a script.
 * Stores the script and its content hash so the creator can
 * reference it when calling close_round on-chain.
 */
export async function storeGeneratedScript(
  roundId: string,
  script: string,
  pieceTitle: string,
  winningDirection: string
): Promise<{ hash: string; uri: string }> {
  const { hash, uri } = await uploadContent(script)
  geminiStore.set(roundId, { script, hash, uri, pieceTitle, winningDirection, generatedAt: new Date().toISOString() })
  return { hash, uri }
}

export function getGeneratedScript(roundId: string): GeminiEntry | null {
  return geminiStore.get(roundId) ?? null
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

export function getContent(hash: string): string | null {
  return contentStore.get(hash) ?? null
}

export function verifyContent(text: string, expectedHash: string): boolean {
  return hashContent(text) === expectedHash
}
