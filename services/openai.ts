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
  count?: number
}

const fallbackCopy: Record<GenerationKind, string[]> = {
  reply: [
    'Careful, that almost sounded like you were trying to make me smile.',
    'I was going to play it cool, but that message made it harder.',
    'That depends. Are you always this charming or am I getting the premium version?',
  ],
  opener: [
    'Mini golf and espresso martinis is a suspiciously strong personality combo. What is the origin story?',
    'You seem like the type to have one excellent hidden-gem movie rec. I am listening.',
    'Late night drives plus indie movies feels like a main-character weekend. When are we filming it?',
  ],
  bio: [
    'Equal parts soft launch and plot twist. Good taste in coffee, questionable confidence at mini golf.',
    'Looking for chemistry, good lighting, and someone who can pick a dinner spot without forming a committee.',
    'Calm energy, sharp jokes, strong opinions on playlists. Bonus points if you flirt like an adult.',
  ],
  ocr: [
    'Them: so am I boring?\nMe: Not yet. You still have time to surprise me.',
  ],
}

function buildPrompt({ kind, input, tone, persona, count = 6 }: GenerateArgs) {
  return [
    'You are Flirtyfy, a premium AI dating message assistant.',
    'Write human, emotionally intelligent dating-app copy. Avoid cringe, robotic wording, therapy-speak, and long paragraphs.',
    `Task: ${kind}. Tone: ${tone}. Persona: ${persona}.`,
    `Return JSON only: [{"tone":"${tone.toLowerCase()}","reply":"short message","reason":"why it works"}].`,
    `Generate ${count} options. Each reply should be copy-ready, confident, short-form texting style, and never manipulative or explicit.`,
    `Input:\n${input}`,
  ].join('\n\n')
}

function normalizeSuggestions(raw: unknown, kind: GenerationKind, tone: Tone): Suggestion[] {
  if (Array.isArray(raw)) {
    return raw.slice(0, 10).map((item: any, index) => ({
      id: `${Date.now()}-${index}`,
      tone: String(item?.tone ?? tone),
      reply: String(item?.reply ?? item?.text ?? fallbackCopy[kind][index % fallbackCopy[kind].length]),
      reason: item?.reason ? String(item.reason) : undefined,
    }))
  }

  return fallbackCopy[kind].map((reply, index) => ({
    id: `${Date.now()}-${index}`,
    tone,
    reply,
    reason: 'Demo-safe fallback while backend is not configured.',
  }))
}

export async function generateDatingCopy(args: GenerateArgs): Promise<Generation> {
  track('generation_started' as any, { kind: args.kind, tone: args.tone, persona: args.persona })

  let suggestions: Suggestion[]
  try {
    if (!BACKEND_URL) {
      console.warn('[AI] EXPO_PUBLIC_BACKEND_URL not set - using fallbacks.')
      suggestions = normalizeSuggestions(null, args.kind, args.tone)
    } else {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'Return a JSON object with an "items" array only.' },
            { role: 'user', content: buildPrompt(args) },
          ],
        }),
      })

      if (!response.ok) throw new Error(`Backend request failed: ${response.status}`)
      const json = await response.json()
      const content = json.choices?.[0]?.message?.content ?? '{"items":[]}'
      const parsed = JSON.parse(content)
      suggestions = normalizeSuggestions(parsed.items ?? parsed, args.kind, args.tone)
    }
  } catch (error) {
    Sentry.captureException(error)
    track('generation_failed' as any, { kind: args.kind })
    suggestions = normalizeSuggestions(null, args.kind, args.tone)
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
  track('ocr_started' as any)
  if (!BACKEND_URL) {
    return "Them: you are kind of hard to read\nMe: maybe you need better lighting\nThem: or maybe coffee?"
  }

  try {
    const response = await fetch(uri)
    const blob = await response.blob()
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onerror = reject
      reader.onloadend = () => resolve(String(reader.result))
      reader.readAsDataURL(blob)
    })

    const result = await fetch(`${BACKEND_URL}/api/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Extract dating chat text in order. Clean timestamps and UI chrome. Return plain text only.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        }],
      }),
    })
    if (!result.ok) throw new Error(`OCR request failed: ${result.status}`)
    const json = await result.json()
    track('ocr_completed' as any)
    return json.choices?.[0]?.message?.content?.trim() ?? ''
  } catch (error) {
    Sentry.captureException(error)
    track('ocr_failed' as any)
    return ''
  }
}
