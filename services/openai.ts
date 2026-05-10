import * as Sentry from '@sentry/react-native'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'
import { track } from '@/lib/analytics'
import type { Generation, GenerationKind, Persona, Suggestion, Tone } from '@/types/flirtyfy'

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? ''
const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL ?? 'google/gemini-2.0-flash-001'

type GenerateArgs = {
  kind: GenerationKind
  input: string
  tone: Tone
  persona: Persona
  previousReplies?: string[]
}

function normalizeSuggestions(replies: string[], tone: Tone): Suggestion[] {
  if (!Array.isArray(replies)) return []

  return replies.map((reply, index) => ({
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 5)}`,
    tone,
    reply: reply.trim(),
  }))
}

export async function generateDatingCopy(args: GenerateArgs): Promise<Generation> {
  console.log(`[AI] Starting generation: kind=${args.kind}, tone=${args.tone}, persona=${args.persona}`)
  track('generation_started' as any, { kind: args.kind, tone: args.tone, persona: args.persona })

  if (!BACKEND_URL) {
    throw new Error('Backend URL is not configured (EXPO_PUBLIC_BACKEND_URL)')
  }

  let suggestions: Suggestion[]
  try {
    const payload = {
      conversation: args.input,
      tone: args.tone.toLowerCase(),
      previousReplies: args.previousReplies,
      refinement: args.persona ? `Persona: ${args.persona}` : undefined
    }

    console.log('[AI] Fetching from backend:', `${BACKEND_URL}/api/chat`, JSON.stringify(payload, null, 2))

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI] Backend error:', response.status, errorText)
      throw new Error(`Backend request failed: ${response.status} - ${errorText}`)
    }

    const json = await response.json()
    console.log('[AI] Backend response received:', JSON.stringify(json, null, 2))

    if (!json.replies || !Array.isArray(json.replies)) {
      console.error('[AI] Invalid response format:', json)
      throw new Error('Invalid response format from backend: "replies" array expected')
    }

    suggestions = normalizeSuggestions(json.replies, args.tone)
  } catch (error: any) {
    console.error('[AI] Generation failed:', error.message)
    Sentry.captureException(error)
    track('generation_failed' as any, { kind: args.kind, error: error.message })
    throw error
  }

  const generation: Generation = {
    id: `${args.kind}-${Date.now()}`,
    kind: args.kind,
    title: args.kind === 'reply' ? 'Reply ideas' : args.kind === 'opener' ? 'Openers' : args.kind === 'bio' ? 'Bio rewrites' : 'OCR extraction',
    input: args.input,
    persona: args.persona,
    tone: args.tone,
    suggestions,
    createdAt: new Date().toISOString(),
  }

  // Supabase inserts removed to favor local-only as requested (login removed)
  /*
  if (isSupabaseEnabled) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('generations').insert({
          id: generation.id,
          user_id: user.id,
          type: generation.kind,
          input_text: generation.input,
          persona: generation.persona,
          tone: generation.tone,
          output: generation.suggestions,
        })
      }
    } catch (error) {
      Sentry.captureException(error)
    }
  }
  */

  track('generation_completed' as any, { kind: args.kind, count: suggestions.length })
  return generation
}

export async function extractChatTextFromImage(uri: string): Promise<string> {
  console.log('[AI] Starting OCR extraction for image:', uri.slice(0, 50) + '...')
  track('ocr_started' as any)

  if (!BACKEND_URL) {
    throw new Error('Backend URL is not configured (EXPO_PUBLIC_BACKEND_URL)')
  }

  try {
    let dataUrl: string = uri

    // If it's not already a data URL, we need to fetch it and convert it
    if (!uri.startsWith('data:')) {
      console.log('[AI] Fetching image from URI...')
      const response = await fetch(uri)
      const blob = await response.blob()

      console.log('[AI] Converting image blob to dataURL...')
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = reject
        reader.onloadend = () => resolve(String(reader.result))
        reader.readAsDataURL(blob)
      })
    }

    console.log('[AI] Sending OCR request to backend:', `${BACKEND_URL}/api/ocr`)
    const result = await fetch(`${BACKEND_URL}/api/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: dataUrl,
      }),
    })

    if (!result.ok) {
      const errorText = await result.text()
      console.error('[AI] OCR Backend Error:', result.status, errorText)
      throw new Error(`OCR backend returned ${result.status}: ${errorText}`)
    }

    const json = await result.json()
    console.log('[AI] OCR response received')

    const extractedText = json.text?.trim() ?? ''
    track('ocr_completed' as any)
    return extractedText
  } catch (error: any) {
    console.error('[AI] OCR Failure Details:', error.message)
    Sentry.captureException(error)
    track('ocr_failed' as any)
    throw error // Re-throw to allow the UI to catch the specific message
  }
}
