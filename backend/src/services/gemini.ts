const MODEL = 'gemini-2.5-flash'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`)
  }

  const data: any = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned empty response')
  return text.trim()
}

export async function reactToVote(directionText: string, voteCount: number): Promise<string> {
  const prompt = [
    'You are a literary editor watching a live collaborative story unfold.',
    '',
    `A community member just voted for this story direction, bringing it to ${voteCount} votes. React in 1-2 sharp sentences, in present tense, like a critic watching momentum build in real time. No headers, no bullets, no filler.`,
    '',
    'Direction:',
    `"${directionText.slice(0, 300)}"`,
    '',
    'Return only the reaction.',
  ].join('\n')

  return callGemini(prompt)
}

export async function generateScriptFromDirection(
  winningDirection: string,
  storyContext: string,
  pieceTitle: string
): Promise<string> {
  const prompt = [
    'You are a premium TV drama writer polishing the next sealed scene of an interactive story.',
    '',
    `Story title: "${pieceTitle}"`,
    '',
    'Story so far:',
    storyContext.slice(0, 1600),
    '',
    'Selected community direction:',
    `"${winningDirection}"`,
    '',
    'Write the next scene as the actual story text that should be appended to the piece.',
    '',
    'Requirements:',
    '- 120-180 words',
    '- Rich, cinematic prose',
    '- Present tense',
    '- Include precise physical detail and at least one revealing line of dialogue',
    '- Preserve continuity with the existing story',
    '- Fully execute the chosen direction instead of summarizing it',
    '- No markdown, no title, no labels, no notes',
    '',
    'Return only the final scene text.',
  ].join('\n')

  return callGemini(prompt)
}

export async function reactToSeal(sealedScript: string, pieceTitle: string): Promise<string> {
  const prompt = [
    'You are a literary critic responding to a newly sealed scene from a collaborative story.',
    '',
    `Story: "${pieceTitle}"`,
    '',
    'Sealed scene:',
    `"${sealedScript.slice(0, 700)}"`,
    '',
    'Write exactly two sentences:',
    '1. Identify the craft move that makes the scene land',
    '2. Tease the pressure now building for the next scene',
    '',
    'Under 50 words total. Return only the two sentences.',
  ].join('\n')

  return callGemini(prompt)
}
