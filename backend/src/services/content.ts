import crypto from 'crypto'

/**
 * Content storage service.
 *
 * In production:
 * - Uploads paragraph text to Arweave
 * - Returns the Arweave TX ID (ar://...)
 *
 * For hackathon demo:
 * - Stores content in memory
 * - Returns a fake Arweave URI
 */

const contentStore = new Map<string, { content: string; hash: string; uri: string }>()

export function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

export async function uploadContent(text: string): Promise<{ hash: string; uri: string }> {
  const hash = hashContent(text)

  // Check cache
  if (contentStore.has(hash)) {
    return { hash, uri: contentStore.get(hash)!.uri }
  }

  // In production: upload to Arweave
  // const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' })
  // const wallet = JSON.parse(process.env.ARWEAVE_WALLET_JSON!)
  // const transaction = await arweave.createTransaction({ data: text }, wallet)
  // transaction.addTag('Content-Type', 'text/plain')
  // transaction.addTag('App-Name', 'Storylock')
  // await arweave.transactions.sign(transaction, wallet)
  // await arweave.transactions.post(transaction)
  // const uri = `ar://${transaction.id}`

  // Demo: generate a fake but consistent Arweave-format URI
  const uri = `ar://${hash.slice(0, 43)}`

  contentStore.set(hash, { content: text, hash, uri })

  return { hash, uri }
}

export function getContent(hash: string): string | null {
  return contentStore.get(hash)?.content ?? null
}

export function verifyContent(text: string, expectedHash: string): boolean {
  return hashContent(text) === expectedHash
}
