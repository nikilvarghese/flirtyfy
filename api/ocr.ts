import type {
  VercelRequest,
  VercelResponse,
} from '@vercel/node'

function setCors(res: VercelResponse) {
  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  )

  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS'
  )

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  )
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({
        error: 'Method not allowed',
      })
  }

  try {
    const { image } = req.body

    if (!image) {
      return res
        .status(400)
        .json({
          error: 'No image provided',
        })
    }

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model:
            'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text:
                    'Extract the full chat conversation from this screenshot. Only return the conversation text exactly as shown.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: image,
                  },
                },
              ],
            },
          ],
        }),
      }
    )

    const data = await response.json()

    const text =
      data?.choices?.[0]?.message?.content

    return res.status(200).json({
      success: true,
      text,
    })
  } catch (error: any) {
    console.error(error)

    return res.status(500).json({
      error: error.message,
    })
  }
}