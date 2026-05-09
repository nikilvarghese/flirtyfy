import type { VercelRequest, VercelResponse } from '@vercel/node'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const REQUEST_TIMEOUT_MS = 15000
const MAX_CONVERSATION_CHARS = 4500

const DEFAULT_MODELS = [
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.1-70b-instruct',
]

function setCors(res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Max-Age', '86400')
}

function makeRequestId() {
    return `charm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function parseModels(): string[] {
    const configured = process.env.OPENROUTER_MODELS

    if (!configured) {
        return DEFAULT_MODELS
    }

    const models = configured
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)

    return models.length ? models : DEFAULT_MODELS
}

function cleanReplies(text: string): string[] {
    const seen = new Set<string>()

    return String(text || '')
        .split('\n')
        .map((line) =>
            line
                .replace(/^\s*[-*]\s*/, '')
                .replace(/^\s*\d+[\).\:-]\s*/, '')
                .replace(/^reply\s*\d*:\s*/i, '')
                .replace(/^assistant:\s*/i, '')
                .replace(/^["'`]+|["'`]+$/g, '')
                .replace(/as an ai/gi, '')
                .replace(/here'?s a reply:/gi, '')
                .trim()
        )
        .filter(Boolean)
        .filter((line) => {
            if (line.length > 220) return false

            const normalized = line.toLowerCase()

            if (seen.has(normalized)) {
                return false
            }

            seen.add(normalized)

            return true
        })
        .slice(0, 3)
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

interface PromptOptions {
    conversation: string
    tone: string
    refinement?: string
    previousReplies?: string[]
}

function buildPrompt({
    conversation,
    tone,
    refinement,
    previousReplies,
}: PromptOptions) {
    const tones: Record<string, string> = {
        flirty: `
You are smooth, attractive, playful, and emotionally intelligent.

STYLE:
- subtle teasing
- magnetic confidence
- effortless attraction
- playful tension
- modern dating vibe

RULES:
- avoid desperation
- avoid cringe pickup lines
- avoid overcomplimenting
- avoid sounding scripted
- smooth natural texting only
`,

        funny: `
You are witty, teasing, chaotic, and naturally funny.

STYLE:
- clever humor
- playful roasting
- unserious energy
- meme-like confidence
- spontaneous reactions

RULES:
- avoid dad jokes
- avoid cringe slang
- avoid trying too hard
- keep replies punchy
`,

        romantic: `
You are emotionally warm, soft, caring, and intimate.

STYLE:
- affectionate
- emotionally genuine
- comforting
- sincere connection
- gentle vulnerability

RULES:
- avoid poetic cringe
- avoid dramatic romance
- sound emotionally real
`,

        savage: `
You are cold, dominant, ruthless, and socially sharp.

STYLE:
- calm brutality
- detached confidence
- intimidating energy
- sharp delivery
- effortless superiority

RULES:
- never sound angry
- never become toxic
- short devastating replies only
`,

        confident: `
You are composed, charismatic, smooth, and self-assured.

STYLE:
- calm confidence
- social dominance
- attractive composure
- effortless energy
- relaxed leadership

RULES:
- avoid arrogance
- avoid insecurity
- avoid try-hard flirting
`,

        sweet: `
You are wholesome, caring, supportive, and emotionally safe.

STYLE:
- warm
- comforting
- soft energy
- emotionally kind
- genuine care

RULES:
- avoid excessive flirting
- avoid cheesy romance
- sound sincere
`,

        dry: `
You are detached, blunt, emotionally unavailable, and minimal.

STYLE:
- low effort
- cold
- short
- indifferent
- dry energy

RULES:
- maximum 3-7 words
- no excitement
- no emojis
- minimal punctuation
`,

        sarcastic: `
You are sarcastic, witty, clever, and lightly disrespectful.

STYLE:
- fake seriousness
- playful mockery
- dry humor
- teasing sarcasm
- clever reactions

RULES:
- avoid sounding hateful
- avoid cringe sarcasm
- keep replies natural
`,

        bold: `
You are daring, fearless, direct, and exciting.

STYLE:
- fearless flirting
- high tension
- confident attraction
- addictive energy
- direct confidence

RULES:
- avoid creepiness
- avoid desperation
- avoid explicit sexual lines
`,
    }

    const modifier = refinement
        ? `
SPECIAL INSTRUCTION:
${refinement}
`
        : ''

    const avoid =
        Array.isArray(previousReplies) && previousReplies.length
            ? `
AVOID SIMILAR REPLIES:
${previousReplies.join('\n')}
`
            : ''

    return `
You are CharmAI.

You generate highly realistic dating/chat replies.

GLOBAL RULES:
- sound human
- modern texting style
- natural Gen Z vibe
- no AI phrasing
- no cheesy pickup lines
- no cringe flirting
- avoid repetition
- avoid generic compliments
- avoid sounding scripted
- avoid overexplaining
- no quotation marks
- no numbering
- no bullet points
- no labels
- no essays
- preserve emotional realism
- never explain reasoning

TONE:
${tones[tone.toLowerCase()] || tones.flirty}

${modifier}

${avoid}

CONVERSATION:
${conversation}

TASK:
Generate exactly 3 UNIQUE replies.

OUTPUT RULES:
- each reply on its own line
- realistic texting energy
- varied sentence structure
- short-medium length only
`
}

interface CallResult {
    ok: boolean
    replies?: string[]
    model?: string
    fallback?: boolean
    usage?: any
    retryable?: boolean
    status?: number
    message?: string
}

async function callOpenRouter({
    model,
    prompt,
    requestId,
    apiKey,
}: {
    model: string
    prompt: string
    requestId: string
    apiKey: string
}): Promise<CallResult> {
    const controller = new AbortController()

    const timeout = setTimeout(() => {
        controller.abort()
    }, REQUEST_TIMEOUT_MS)

    try {
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer':
                    process.env.OPENROUTER_APP_URL ||
                    'https://charmai.app',
                'X-Title':
                    process.env.OPENROUTER_APP_NAME ||
                    'CharmAI',
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are CharmAI. You write ultra-realistic text replies only.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.95,
                top_p: 0.9,
                frequency_penalty: 0.4,
                presence_penalty: 0.5,
                max_tokens: 180,
            }),
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
            return {
                ok: false,
                retryable:
                    response.status === 408 ||
                    response.status === 429 ||
                    response.status >= 500,
                status: response.status,
                message:
                    payload?.error?.message ||
                    `OpenRouter ${response.status}`,
            }
        }

        const content =
            payload?.choices?.[0]?.message?.content || ''

        const replies = cleanReplies(content)

        if (!replies.length) {
            return {
                ok: true,
                replies: [],
                fallback: false,
                model,
            }
        }

        return {
            ok: true,
            replies,
            model: payload?.model || model,
            usage: payload?.usage,
        }
    } catch (error: any) {
        return {
            ok: false,
            retryable: true,
            status:
                error?.name === 'AbortError'
                    ? 408
                    : 500,
            message:
                error?.name === 'AbortError'
                    ? 'Request timed out'
                    : 'Request failed',
        }
    } finally {
        clearTimeout(timeout)
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCors(res)

    if (req.method === 'OPTIONS') {
        return res.status(204).end()
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            ok: true,
            service: 'CharmAI API',
            models: parseModels(),
        })
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
        })
    }

    const requestId = makeRequestId()
    const startedAt = Date.now()

    try {
        const apiKey = process.env.OPENROUTER_API_KEY

        if (!apiKey) {
            return res.status(500).json({
                error: 'Missing OpenRouter API key',
                requestId,
            })
        }

        const body = safeBody(req)

        const conversation = String(
            body.conversation || ''
        ).trim()

        const tone = String(
            body.tone || 'flirty'
        ).trim()

        const refinement = body.refinement
            ? String(body.refinement).trim()
            : ''

        const previousReplies = Array.isArray(
            body.previousReplies
        )
            ? body.previousReplies
            : []

        if (!conversation) {
            return res.status(400).json({
                error: 'Conversation is required',
                requestId,
            })
        }

        if (
            conversation.length >
            MAX_CONVERSATION_CHARS
        ) {
            return res.status(413).json({
                error: `Conversation must be under ${MAX_CONVERSATION_CHARS} characters`,
                requestId,
            })
        }

        const prompt = buildPrompt({
            conversation,
            tone,
            refinement,
            previousReplies,
        })

        const models = parseModels()
        const errors = []

        for (const model of models) {
            for (let attempt = 1; attempt <= 2; attempt++) {
                console.log(
                    `[CharmAI] ${requestId} model=${model} attempt=${attempt}`
                )

                const result =
                    await callOpenRouter({
                        model,
                        prompt,
                        requestId,
                        apiKey,
                    })

                if (result.ok) {
                    console.log(
                        `[CharmAI] ${requestId} success model=${result.model} latency=${Date.now() - startedAt}ms`
                    )

                    return res.status(200).json({
                        replies: result.replies,
                        model: result.model,
                        requestId,
                        fallback:
                            result.fallback || false,
                        degraded:
                            errors.length > 0,
                    })
                }

                errors.push({
                    model,
                    attempt,
                    status: result.status,
                    message: result.message,
                })

                console.error(
                    `[CharmAI] failure`,
                    result
                )

                if (!result.retryable) {
                    break
                }
            }
        }

        console.error(
            `[CharmAI] exhausted models`,
            errors
        )

        return res.status(503).json({
            error: 'AI service exhausted or currently unavailable',
            degraded: true,
            requestId,
        })
    } catch (error) {
        console.error(
            `[CharmAI] unhandled error`,
            error
        )

        return res.status(500).json({
            error: 'Failed to generate replies',
            requestId: makeRequestId(),
        })
    }
}
