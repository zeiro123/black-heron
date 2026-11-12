import { useEffect, useState } from 'react'
import { PROVIDERS, providerInfo, speak, type AiProvider } from '../engine/ai'
import { useAiStore } from '../store/aiStore'

export function AiTab() {
  const provider = useAiStore((s) => s.provider)
  const apiKey = useAiStore((s) => s.apiKey)
  const model = useAiStore((s) => s.model)
  const baseUrl = useAiStore((s) => s.baseUrl)
  const ttsEnabled = useAiStore((s) => s.ttsEnabled)
  const testResult = useAiStore((s) => s.testResult)
  const status = useAiStore((s) => s.status)
  const setProvider = useAiStore((s) => s.setProvider)
  const update = useAiStore((s) => s.update)
  const testConnection = useAiStore((s) => s.testConnection)
  const info = providerInfo(provider)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const load = () => setVoices(window.speechSynthesis.getVoices())
      load()
      window.speechSynthesis.addEventListener('voiceschanged', load)
      return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
    }
  }, [])

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-zinc-400">
        Paste an API key and pick your provider — the coach then uses that model to explain
        positions in plain language. Everything is stored only in this browser.
      </p>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Provider</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id as AiProvider)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                provider === p.id
                  ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                  : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">API key</p>
        <input
          type="password"
          value={apiKey}
          onChange={(event) => update({ apiKey: event.target.value })}
          placeholder={info.keyHint}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400"
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Model</p>
          <input
            value={model}
            onChange={(event) => update({ model: event.target.value })}
            placeholder={info.defaultModel}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none outline-none transition-colors focus:border-amber-400"
          />
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">
            Base URL {provider === 'custom' ? '(required)' : ''}
          </p>
          <input
            value={baseUrl}
            onChange={(event) => update({ baseUrl: event.target.value })}
            placeholder="https://…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => void testConnection()}
          disabled={status === 'thinking'}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {status === 'thinking' ? 'Testing…' : 'Test connection'}
        </button>
        {info.docs && (
          <a href={info.docs} target="_blank" rel="noreferrer" className="text-xs text-zinc-400 underline hover:text-zinc-200">
            {provider === 'custom' ? 'OpenAI-compatible docs' : 'API reference'} ↗
          </a>
        )}
      </div>

      {testResult && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            status === 'ok'
              ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-200'
              : 'border-red-500/40 bg-red-500/5 text-red-200'
          }`}
        >
          {testResult}
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Coach voice</p>
        <label className="mt-2 flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={ttsEnabled}
            onChange={(event) => update({ ttsEnabled: event.target.checked })}
          />
          Speak the coach's messages out loud
        </label>
        {voices.length > 0 && (
          <select
            value={useAiStore.getState().voiceUri}
            onChange={(event) => update({ voiceUri: event.target.value })}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none"
          >
            <option value="">Browser default voice</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => speak('Coach online. Let us play some chess.', useAiStore.getState().voiceUri)}
          className="mt-2 rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          🔊 Test voice
        </button>
      </div>

      <p className="text-xs text-zinc-600">
        Security: the key is stored in this browser's localStorage and calls go straight from
        your machine to the provider. Perfect for a personal app — if you deploy the app
        publicly, move the key to a server instead.
      </p>
    </div>
  )
}
