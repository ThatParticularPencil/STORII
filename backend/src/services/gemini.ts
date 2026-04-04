const MODEL = 'gemini-2.5-flash'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned empty response')
  return text.trim()
}

/**
 * Called when a user casts a vote on a direction.
 * Returns a 1–2 sentence literary reaction.
 */
export async function reactToVote(directionText: string, voteCount: number): Promise<string> {
  const prompt = `You are a literary editor watching a live collaborative story unfold.

A community member just voted for this story direction (now at ${voteCount} votes). React in 1–2 sharp sentences — speak like a critic watching something exciting happen. Present tense. No fluff.

Direction the community voted for:
"${directionText.slice(0, 300)}"`

  return callGemini(prompt)
}

/**
 * The core function. Takes the winning 50-word direction + the sealed story so far,
 * generates a full professional TV/film script scene as the next paragraph.
 */
export async function generateScriptFromDirection(
  winningDirection: string,
  storyContext: string,
  pieceTitle: string
): Promise<string> {
  const prompt = `You are a professional TV drama screenwriter (think HBO, Succession, The Bear).

You are writing the next scene for a collaborative story. The community has voted on a direction — your job is to execute it as a polished, publication-ready script scene.

STORY TITLE: "${pieceTitle}"

STORY SO FAR:
${storyContext.slice(0, 1200)}

---

COMMUNITY'S CHOSEN DIRECTION (what they want to happen next):
"${winningDirection}"

---

Write the next scene. Requirements:
- Professional TV drama script format
- 120–180 words
- Use action lines (INT./EXT. slug if needed, then present-tense action)
- Include at least one line of sharp, character-revealing dialogue
- Match the tone and voice of the story so far exactly
- Do NOT add a title, scene number, or any preamble — just the scene
- End at a natural beat — a turn, a revelation, or a held moment

Write only the scene. Nothing else.`

  return callGemini(prompt)
}

/**
 * After the script is sealed, generate a brief literary analysis.
 */
export async function reactToSeal(sealedScript: string, pieceTitle: string): Promise<string> {
  const prompt = `You're a literary critic writing a one-paragraph reaction to a scene that was just permanently sealed on the Solana blockchain by community vote.

Story: "${pieceTitle}"

Sealed scene:
"${sealedScript.slice(0, 600)}"

Write exactly two sentences:
1. What makes this scene work — the craft choice that lands
2. A teaser about what the next scene might demand

Under 50 words. No headers.`

  return callGemini(prompt)
}
