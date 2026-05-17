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

  console.log('[OCR SERVER]', {
    hasDataPrefix: image.startsWith('data:'),
    length: image.length,
    preview: image.slice(0, 80),
  })

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
                text: `Read this chat screenshot and reconstruct the conversation.

This may be a phone screenshot or a wide desktop/web WhatsApp screenshot.
Desktop screenshots often have incoming bubbles on the far left and outgoing bubbles on the far right.
Do NOT read all left-side messages first and then all right-side messages.
Read the conversation by each message bubble's vertical position from top to bottom across the whole image.
If two bubbles have the same timestamp or are close vertically, use their actual top edge on the screen to decide order.

CRITICAL RULES FOR QUOTED REPLIES:
* Many messages are replies to previous messages. They contain a small "quoted" preview box above the actual new text/emoji.
* You MUST completely ignore the text inside the quoted preview box.
* ONLY extract the primary new text or emoji that the person typed outside/below the quote box.
* Keep the reply bubble at the position of the primary new message, not the quoted preview box.

Other Rules:
* Keep message order exactly as shown from top to bottom.
* Left-side bubbles = Person A
* Right-side bubbles = Person B
* Ignore timestamps (e.g. 9:46 pm)
* Ignore UI elements, headers, navigation bars.
* Do not repeat messages already shown earlier in the conversation.
* Do not ignore emojis. If a message is just an emoji, extract the emoji.
* Keep short Hinglish/romanized Hindi text exactly as written; do not translate or "correct" spelling.

Return ONLY:
Person A: ...
Person B: ...

One message per line.
No explanations.
No markdown.`,
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

    console.log(`[OCR] Successfully extracted text, length: ${text.length}`);

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
