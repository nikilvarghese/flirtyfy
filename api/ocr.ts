import type { VercelRequest, VercelResponse } from '@vercel/node'

const REQUEST_TIMEOUT_MS = 45000

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function safeBody(req: VercelRequest) {
  if (!req.body) return {}

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }

  return req.body
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Guard: API key must be present ───────────────────────────────────────
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error('[OCR] OPENROUTER_API_KEY is not set')
    return res.status(500).json({ error: 'OCR service is not configured (missing API key)' })
  }

  // ── Guard: image must be present ─────────────────────────────────────────
  const { image } = safeBody(req)
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'No image provided' })
  }

  // ── Guard: image must be a data URL ──────────────────────────────────────
  if (!image.startsWith('data:')) {
    return res.status(400).json({ error: 'Image must be a base64 data URL (data:image/...)' })
  }

  // ── Call OpenRouter with timeout ──────────────────────────────────────────
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_APP_URL ?? 'https://flirtyfy.vercel.app',
        'X-Title': 'Flirtyfy OCR',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract ONLY the visible chat messages from this screenshot.

Rules:
- Ignore timestamps
- Ignore usernames
- Preserve message order
- Return plain text only
- Format each line as: Them: ... or Me: ...

Do not explain anything. Do not use markdown.`,
              },
              {
                type: 'image_url',
                image_url: { url: image },
              },
            ],
          },
        ],
        max_tokens: 600,
        temperature: 0.1,
      }),
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => `HTTP ${response.status}`)
      console.error('[OCR] OpenRouter error:', response.status, errorText)
      return res.status(502).json({ error: `OCR upstream error: ${response.status}`, detail: errorText })
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content?.trim() ?? ''

    if (!text) {
      return res.status(200).json({ success: true, text: '' })
    }

    return res.status(200).json({ success: true, text })
  } catch (error: any) {
    clearTimeout(timeout)

    if (error?.name === 'AbortError') {
      console.error('[OCR] Request timed out after', REQUEST_TIMEOUT_MS, 'ms')
      return res.status(504).json({ error: 'OCR request timed out. Try a smaller image.' })
    }

    console.error('[OCR] Unhandled error:', error?.message ?? error)
    return res.status(500).json({ error: error?.message ?? 'Unknown OCR error' })
  }
}
