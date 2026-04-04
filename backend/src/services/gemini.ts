import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || ''

let genAI: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * Called when a user casts a vote on a submission.
 * Returns a 1–2 sentence literary reaction to the paragraph being voted on.
 */
export async function reactToVote(paragraphText: string, voteCount: number): Promise<string> {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `You are a literary editor watching a live collaborative story being written by the internet.

A paragraph just received a vote (now at ${voteCount} votes total). React in 1–2 sentences — sharp, literary, present tense. Speak like a critic watching something exciting unfold. No fluff.

Paragraph:
"${paragraphText.slice(0, 600)}"`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

/**
 * Called when the winning paragraph is sealed on-chain.
 * Returns a short literary commentary + a one-sentence "what could happen next" teaser.
 */
export async function reactToSeal(winningParagraph: string, storyContext: string): Promise<string> {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `You are a literary editor for a collaborative story being permanently sealed on the Solana blockchain.

The community just voted and this paragraph won. Write a short response in exactly this format:
1. One sentence of literary analysis — what makes this paragraph work
2. One sentence teaser — what might happen next (provocative, not a spoiler)

Keep it under 60 words total. No headers. No lists. Just two flowing sentences separated by a line break.

Story so far:
"${storyContext.slice(0, 400)}"

Winning paragraph:
"${winningParagraph.slice(0, 600)}"`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
