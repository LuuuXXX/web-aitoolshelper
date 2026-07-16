import 'server-only'

const API_KEY = process.env.DEEPSEEK_API_KEY
if (!API_KEY) {
  throw new Error('DEEPSEEK_API_KEY environment variable is required')
}
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro'

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
    thinking?: boolean
  }
): Promise<ChatResult> {
  const model = options?.model || DEFAULT_MODEL
  const temperature = options?.temperature ?? 0.7
  const maxTokens = options?.maxTokens ?? 4096
  const thinking = options?.thinking ?? false

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    stream: false,
  }

  if (thinking) {
    body.thinking = { type: 'enabled' }
    body.reasoning_effort = 'high'
  } else {
    body.thinking = { type: 'disabled' }
    body.temperature = temperature
  }

  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  }).catch((err: unknown) => {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('AI_SERVICE_TIMEOUT')
    }
    throw err
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown')
    console.error(`DeepSeek API error: ${response.status} - ${errorText}`)
    throw new Error('AI_SERVICE_ERROR')
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? ''
  const tokensUsed = data.usage?.total_tokens ?? 0

  return { content, tokensUsed }
}
