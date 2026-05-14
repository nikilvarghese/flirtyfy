import * as Sentry from '@sentry/react-native'
import * as FileSystem from 'expo-file-system/legacy'
import { Platform } from 'react-native'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'
import { track } from '@/lib/analytics'
import type { Generation, GenerationKind, Persona, Suggestion, Tone } from '@/types/flirtyfy'

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? ''

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

    console.log('[AI] Fetching from backend:', `${BACKEND_URL}/api/chat`)

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  track('generation_completed' as any, { kind: args.kind, count: suggestions.length })
  return generation
}

function mimeFromUri(uri: string, fallback = 'image/jpeg') {
  const withoutQuery = uri.split('?')[0]
  const ext = withoutQuery.split('.').pop()?.toLowerCase()

  if (ext === 'png') return 'image/png'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'heic') return 'image/heic'
  if (ext === 'heif') return 'image/heif'

  return fallback
}

function base64ToDataUrl(base64: string, mime = 'image/jpeg') {
  const cleanBase64 = base64.trim()
  if (!cleanBase64) {
    throw new Error('Image picker returned an empty base64 payload')
  }

  return `data:${mime};base64,${cleanBase64}`
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read image blob'))
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result === 'string' && result.startsWith('data:')) {
        resolve(result)
        return
      }

      reject(new Error('Image blob did not produce a data URL'))
    }
    reader.readAsDataURL(blob)
  })
}

async function fetchUriAsDataUrl(uri: string, fallbackMime: string) {
  const response = await fetch(uri)
  if (!response.ok) {
    throw new Error(`Image fetch failed with HTTP ${response.status}`)
  }

  const blob = await response.blob()
  const dataUrl = await blobToDataUrl(blob)

  if (dataUrl.startsWith('data:application/octet-stream')) {
    return dataUrl.replace('data:application/octet-stream', `data:${fallbackMime}`)
  }

  return dataUrl
}

/**
 * Converts image URIs to base64 data URLs across native and web.
 *
 * Picker uploads should pass a data URL directly. This fallback supports:
 * 1. file:// and content:// URIs on native devices
 * 2. http:// and https:// bundled assets
 * 3. blob: URIs on Expo web
 */
async function uriToDataUrl(uri: string): Promise<string> {
  // Already a data URL
  if (uri.startsWith('data:')) {
    return uri
  }

  const mime = mimeFromUri(uri)

  if (Platform.OS === 'web' && (uri.startsWith('blob:') || uri.startsWith('http://') || uri.startsWith('https://'))) {
    console.log('[OCR] Reading web image URI via fetch/FileReader:', uri.slice(0, 60))
    return fetchUriAsDataUrl(uri, mime)
  }

  try {
    // Attempt 1: Direct FileSystem read (works for file:// and content://)
    console.log('[OCR] Attempting direct FileSystem read for:', uri.slice(0, 60))
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    })
    console.log('[OCR] Direct read OK, length:', base64.length)
    return base64ToDataUrl(base64, mime)
  } catch (directErr: any) {
    console.warn('[OCR] Direct read failed (likely remote URI). Attempting download strategy...', directErr?.message)
    
    // Attempt 2: Download remote URI to cache, then read (works for http:// dev assets)
    try {
      if (!FileSystem.cacheDirectory) {
        throw new Error('FileSystem cache directory is unavailable')
      }

      const tempPath = FileSystem.cacheDirectory + `temp_ocr_${Date.now()}.img`
      console.log('[OCR] Downloading remote URI to:', tempPath)
      
      const { uri: localUri } = await FileSystem.downloadAsync(uri, tempPath)
      
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: 'base64',
      })
      console.log('[OCR] Download + read OK, length:', base64.length)
      
      // Cleanup
      await FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {})
      
      return base64ToDataUrl(base64, mime)
    } catch (downloadErr: any) {
      console.warn('[OCR] Download strategy failed. Attempting fetch fallback...', downloadErr?.message)

      try {
        return await fetchUriAsDataUrl(uri, mime)
      } catch (fetchErr: any) {
        console.error('[OCR] Fetch fallback failed:', fetchErr?.message)
        throw new Error(`Could not convert image to base64: ${fetchErr?.message ?? downloadErr?.message ?? 'unknown error'}`)
      }
    }
  }
}


export async function extractChatTextFromImage(uri: string): Promise<string> {
  console.log('[AI] Starting OCR extraction for URI:', uri.slice(0, 60))
  track('ocr_started' as any)

  if (!BACKEND_URL) {
    throw new Error('Backend URL is not configured (EXPO_PUBLIC_BACKEND_URL)')
  }

  try {
    // Convert to base64 data URL using native FileSystem (not FileReader)
    const dataUrl = await uriToDataUrl(uri)

    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'unknown';
    console.log(`[AI] Image converted to data URL: length=${dataUrl.length}, mime=${mimeType}`);

    if (!dataUrl.startsWith('data:')) {
      throw new Error(`Image conversion produced an invalid result (not a data URL): ${dataUrl.slice(0, 30)}`)
    }

    console.log('[AI] Sending OCR request to:', `${BACKEND_URL}/api/ocr`)
    const result = await fetch(`${BACKEND_URL}/api/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    })

    if (!result.ok) {
      const errorText = await result.text()
      console.error('[AI] OCR backend error:', result.status, errorText)
      throw new Error(`OCR backend returned ${result.status}: ${errorText}`)
    }

    const json = await result.json()
    console.log('[AI] OCR response received, text length:', json.text?.length ?? 0)

    const extractedText = json.text?.trim() ?? ''
    const sanitizedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    
    track('ocr_completed' as any)
    return sanitizedText
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[AI] OCR Failure:', errorMsg)
    Sentry.captureException(error)
    track('ocr_failed' as any)
    throw error
  }
}
