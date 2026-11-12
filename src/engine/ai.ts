// Phase 9 — AI providers. One adapter per API family; everything the coach says can be
// phrased by the configured model. The user pastes a key, picks a provider, done.

export type AiProvider = 'openai' | 'anthropic' | 'gemini' | 'caimex' | 'custom'

export interface ProviderInfo {
  id: AiProvider
  label: string
  baseUrl: string
  defaultModel: string
  keyHint: string
  docs: string
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'openai',
    label: 'OpenAI (ChatGPT)',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    keyHint: 'sk-…  from platform.openai.com/api-keys',
    docs: 'https://platform.openai.com/docs/api-reference/chat',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-haiku-latest',
    keyHint: 'sk-ant-…  from console.anthropic.com',
    docs: 'https://docs.anthropic.com/en/api/messages',
  },
  {
    id: 'gemini',
    label: 'Google (Gemini)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-1.5-flash',
    keyHint: 'AIza…  from aistudio.google.com/apikey',
    docs: 'https://ai.google.dev/gemini-api/docs',
  },
  {
    id: 'caimex',
    label: 'Caimex (caimex/auto routes for you)',
    baseUrl: 'https://api.caimex.ai/v1',
    defaultModel: 'caimex/auto',
    keyHint: 'from caimex.ai/api-keys — you see it once',
    docs: 'https://caimex.ai',
  },
  {
    id: 'custom',
    label: 'Custom (any OpenAI-compatible URL)',
    baseUrl: '',
    defaultModel: '',
    keyHint: 'key + base URL of your provider',
    docs: '',
  },
]

export function providerInfo(id: AiProvider): ProviderInfo {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiConfig {
  provider: AiProvider
  apiKey: string
  model: string
  baseUrl: string
}

/** Throws with a readable message on any failure. Returns the assistant text. */
export async function askAi(config: AiConfig, messages: AiMessage[]): Promise<string> {
  const family = config.provider === 'anthropic' ? 'anthropic' : config.provider === 'gemini' ? 'gemini' : 'openai'
  if (!config.apiKey) throw new Error('No API key set — add one in the AI tab.')
  if (family === 'anthropic') return askAnthropic(config, messages)
  if (family === 'gemini') return askGemini(config, messages)
  return askOpenAiCompatible(config, messages)
}

async function askOpenAiCompatible(config: AiConfig, messages: AiMessage[]): Promise<string> {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: config.model, messages, max_tokens: 300 }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`AI request failed (${response.status}): ${detail.slice(0, 200)}`)
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return data.choices?.[0]?.message?.content?.trim() ?? '(empty reply)'
}

async function askAnthropic(config: AiConfig, messages: AiMessage[]): Promise<string> {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
  const rest = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      // Anthropic requires this header for direct browser calls.
      'anthropic-dangerous-direct-browser-access': 'true',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: config.model, max_tokens: 300, system, messages: rest }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Claude request failed (${response.status}): ${detail.slice(0, 200)}`)
  }
  const data = (await response.json()) as { content?: { text?: string }[] }
  return data.content?.map((c) => c.text ?? '').join('').trim() || '(empty reply)'
}

async function askGemini(config: AiConfig, messages: AiMessage[]): Promise<string> {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const response = await fetch(
    `${config.baseUrl.replace(/\/$/, '')}/models/${config.model}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        generationConfig: { maxOutputTokens: 300 },
      }),
    },
  )
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 200)}`)
  }
  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() || '(empty reply)'
}

/** Browser text-to-speech — no cloud, no assets. */
export function speak(text: string, voiceUri?: string, rate = 1): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  if (voiceUri) {
    const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceUri)
    if (voice) utterance.voice = voice
  }
  window.speechSynthesis.speak(utterance)
}
