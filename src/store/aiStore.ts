import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { askAi, providerInfo, speak, type AiMessage, type AiProvider } from '../engine/ai'

export type AiStatus = 'idle' | 'thinking' | 'ok' | 'error'

interface AiState {
  provider: AiProvider
  apiKey: string
  model: string
  baseUrl: string
  ttsEnabled: boolean
  voiceUri: string
  testResult: string | null
  status: AiStatus

  setProvider: (provider: AiProvider) => void
  update: (patch: Partial<Pick<AiState, 'apiKey' | 'model' | 'baseUrl' | 'ttsEnabled' | 'voiceUri'>>) => void
  testConnection: () => Promise<void>
  chat: (messages: AiMessage[]) => Promise<string>
  say: (text: string) => void
}

export const useAiStore = create<AiState>()(
  persist(
    (set, get) => ({
      provider: 'caimex',
      apiKey: '',
      model: providerInfo('caimex').defaultModel,
      baseUrl: providerInfo('caimex').baseUrl,
      ttsEnabled: false,
      voiceUri: '',
      testResult: null,
      status: 'idle',

      setProvider: (provider) => {
        const info = providerInfo(provider)
        set({ provider, baseUrl: info.baseUrl, model: info.defaultModel, testResult: null })
      },

      update: (patch) => set(patch),

      testConnection: async () => {
        const { provider, apiKey, model, baseUrl } = get()
        set({ status: 'thinking', testResult: null })
        try {
          const reply = await askAi(
            { provider, apiKey, model, baseUrl },
            [{ role: 'user', content: 'Reply with exactly: Coach online.' }],
          )
          set({ status: 'ok', testResult: reply })
        } catch (error) {
          set({ status: 'error', testResult: error instanceof Error ? error.message : String(error) })
        }
      },

      chat: async (messages) => {
        const { provider, apiKey, model, baseUrl } = get()
        return askAi({ provider, apiKey, model, baseUrl }, messages)
      },

      say: (text) => {
        const { voiceUri, ttsEnabled } = get()
        if (ttsEnabled) speak(text, voiceUri)
      },
    }),
    {
      name: 'chess-coach-ai',
      // The API key is the user's own, stored only in this browser.
      partialize: (state) => ({
        provider: state.provider,
        apiKey: state.apiKey,
        model: state.model,
        baseUrl: state.baseUrl,
        ttsEnabled: state.ttsEnabled,
        voiceUri: state.voiceUri,
      }),
    },
  ),
)
