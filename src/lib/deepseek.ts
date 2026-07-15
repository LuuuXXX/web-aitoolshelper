import 'server-only'

const API_KEY = process.env.DEEPSEEK_API_KEY
if (!API_KEY) {
  throw new Error('DEEPSEEK_API_KEY environment variable is required')
}
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatResult {
  content: string
  tokensUsed: number
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<ChatResult> {
  const model = options?.model || 'deepseek-chat'
  const temperature = options?.temperature ?? 0.7
  const maxTokens = options?.maxTokens ?? 4096

  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ''
  const tokensUsed = data.usage?.total_tokens || 0

  return { content, tokensUsed }
}
