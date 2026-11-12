import { useEffect, useRef, useState } from 'react'
import { speak } from '../engine/ai'
import { useCoachStore } from '../store/coachStore'
import { useGameStore } from '../store/gameStore'
import { useAiStore } from '../store/aiStore'
import { useSettingsStore } from '../store/settingsStore'

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

export function CoachPanel() {
  const status = useCoachStore((s) => s.status)
  const report = useCoachStore((s) => s.report)
  const key = useCoachStore((s) => s.key)
  const log = useCoachStore((s) => s.log)
  const appendLog = useCoachStore((s) => s.appendLog)
  const chatBusy = useCoachStore((s) => s.chatBusy)
  const setChatBusy = useCoachStore((s) => s.setChatBusy)
  const showLine = useCoachStore((s) => s.showLine)
  const setShowLine = useCoachStore((s) => s.setShowLine)
  const analyse = useCoachStore((s) => s.analyse)

  const history = useGameStore((s) => s.history)
  const gameId = useGameStore((s) => s.gameId)
  const display = useGameStore((s) => (s.history.length ? s.history : null))
  const liveCoach = useSettingsStore((s) => s.liveCoach)
  const apiKey = useAiStore((s) => s.apiKey)
  const chat = useAiStore((s) => s.chat)
  const say = useAiStore((s) => s.say)

  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const loggedKey = useRef<string | null>(null)
  const spokenIds = useRef<Set<number>>(new Set())
  const logBoxRef = useRef<HTMLDivElement | null>(null)

  void display

  // Live live: analyse whenever it is the player's turn and nothing is pending.
  useEffect(() => {
    if (!liveCoach || thinking0()) return
    void analyse()
    function thinking0() {
      return false
    }
  }, [gameId, history.length, liveCoach, analyse])

  // Dialogue: when a fresh analysis lands, the coach speaks once per position.
  useEffect(() => {
    if (status !== 'ready' || !report || !key || loggedKey.current === key) return
    loggedKey.current = key
    const bits: string[] = [report.evalPhrase]
    if (report.best) bits.push(`I would play ${report.best.san} — ${report.best.phrase}`)
    appendLog('coach', bits.join(' '), 'template')
  }, [status, key, report, appendLog])

  // Auto-speak new coach messages when the voice is on.
  useEffect(() => {
    if (!ttsOn()) return
    for (const entry of log) {
      if (entry.role === 'coach' && !spokenIds.current.has(entry.id)) {
        spokenIds.current.add(entry.id)
        speak(entry.text, useAiStore.getState().voiceUri)
      }
    }
    function ttsOn() {
      return useAiStore.getState().ttsEnabled
    }
  }, [log])

  useEffect(() => {
    logBoxRef.current?.scrollTo({ top: logBoxRef.current.scrollHeight })
  }, [log])

  const facts = (): string => {
    if (!report) return 'No analysis yet.'
    const lines = [
      `Position FEN: ${useGameStore.getState().fen}`,
      `Evaluation: ${report.cpWhite > 0 ? '+' : ''}${(report.cpWhite / 100).toFixed(2)} (positive favours White)`,
    ]
    if (report.best) lines.push(`Best move: ${report.best.san}`)
    if (report.threats.ourHanging.length)
      lines.push(`My hanging pieces: ${report.threats.ourHanging.map((h) => `${h.piece} on ${h.square} (${h.reason})`).join(', ')}`)
    if (report.threats.theirHanging.length)
      lines.push(`Their hanging pieces: ${report.threats.theirHanging.map((h) => `${h.piece} on ${h.square}`).join(', ')}`)
    if (report.threats.ourPins.length)
      lines.push(`My pins: ${report.threats.ourPins.map((p) => `${p.piece} on ${p.piece && p.square} pinned by ${p.byPiece} on ${p.bySquare}`).join(', ')}`)
    if (report.threats.mateIn !== null) lines.push(`Mate line: ${report.threats.mateIn} (positive = I deliver mate)`)
    if (report.lastMove) lines.push(`Last move: ${report.lastMove.san} — quality: ${report.lastMove.label}`)
    return lines.join('\n')
  }

  const systemPrompt =
    'You are "Coach", a warm, encouraging chess coach inside a learning app. The player knows the rules and is learning tactics. ' +
    'Explain in 2-3 short sentences of plain language — no heavy notation dumps. ' +
    'You MUST only use the facts provided; never suggest a move that is not listed as the best move. ' +
    'If the facts do not answer the question, say what you would look at instead.'

  async function explainWithAi(): Promise<void> {
    if (!apiKey) {
      appendLog('coach', 'Add an AI key in the AI tab and I will explain positions like this one.', 'template')
      return
    }
    if (chatBusy) return
    setChatBusy(true)
    try {
      const reply = await chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Position facts:\n${facts()}\n\nExplain what is going on and what I should do.` },
      ])
      appendLog('coach', reply, 'ai')
      say(reply)
    } catch (error) {
      appendLog('coach', error instanceof Error ? error.message : String(error), 'ai')
    } finally {
      setChatBusy(false)
    }
  }

  async function sendQuestion(question: string): Promise<void> {
    const trimmed = question.trim()
    if (!trimmed) return
    appendLog('you', trimmed, 'question')
    setInput('')
    if (!apiKey) {
      appendLog('coach', 'Add an AI key in the AI tab and I can answer questions about the position.', 'template')
      return
    }
    if (chatBusy) return
    setChatBusy(true)
    try {
      const reply = await chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Position facts:\n${facts()}\n\nMy question: ${trimmed}` },
      ])
      appendLog('coach', reply, 'ai')
      say(reply)
    } catch (error) {
      appendLog('coach', error instanceof Error ? error.message : String(error), 'ai')
    } finally {
      setChatBusy(false)
    }
  }

  function toggleMic(): void {
    const Ctor = (
      window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike
        webkitSpeechRecognition?: new () => SpeechRecognitionLike
      }
    ).SpeechRecognition ?? (
      window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }
    ).webkitSpeechRecognition
    if (!Ctor) {
      appendLog('coach', 'Voice input needs a Chromium browser (Chrome, Edge, Brave).', 'template')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new Ctor()
    recognition.lang = 'en'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0]?.transcript ?? ''
      }
      if (transcript.trim()) void sendQuestion(transcript)
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  const analysing = status === 'analysing'

  return (
    <div className="space-y-3">
      <p className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-zinc-500">
        <span>Coach</span>
        {analysing && <span className="font-normal normal-case text-amber-300">analysing…</span>}
      </p>

      {!liveCoach && (
        <p className="text-xs text-zinc-600">Live coach is off — enable it in the settings.</p>
      )}

      {report && (
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm">
          <p className="text-zinc-300">{report.evalPhrase}</p>

          {report.best && (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-zinc-100">Try {report.best.san}</p>
                <p className="text-xs text-zinc-400">{report.best.phrase}</p>
              </div>
              <button
                onClick={() => setShowLine(!showLine)}
                className={`shrink-0 rounded-md border px-2 py-1 text-xs transition-colors ${
                  showLine
                    ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                    : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {showLine ? 'Hide line' : 'Show line'}
              </button>
            </div>
          )}

          {report.continuation.length > 0 && showLine && (
            <p className="text-xs text-sky-300">
              Expected line drawn on the board: {report.continuation.slice(0, 4).join(' → ')}
            </p>
          )}

          {(report.threats.ourHanging.length > 0 ||
            report.threats.ourPins.length > 0 ||
            report.threats.inCheck ||
            (report.threats.mateIn !== null && report.threats.mateIn < 0)) && (
            <div className="rounded-md border border-red-500/40 bg-red-500/5 p-2">
              <p className="text-xs font-semibold font-semibold uppercase tracking-wide text-red-300">Watch out</p>
              <ul className="mt-1 space-y-0.5 text-xs text-zinc-300">
                {report.threats.inCheck && <li>Your king is in check.</li>}
                {report.threats.mateIn !== null && report.threats.mateIn < 0 && (
                  <li>You get mated in {Math.abs(report.threats.mateIn)} moves — find the defence.</li>
                )}
                {report.threats.ourHanging.map((h) => (
                  <li key={h.square}>
                    Your {h.piece} on {h.square} is {h.reason}.
                  </li>
                ))}
                {report.threats.ourPins.map((p) => (
                  <li key={p.square}>
                    Your {p.piece} on {p.square} is pinned by the {p.byPiece} on {p.bySquare}.
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.threats.theirHanging.length > 0 && (
            <div className="rounded-md rounded-md border border-emerald-500/40 bg-emerald-500/5 p-2">
              <p className="text-xs text-xs font-semibold uppercase tracking-wide text-emerald-300">Opportunities</p>
              <ul className="mt-1 space-y-0.5 text-xs text-zinc-300">
                {report.threats.theirHanging.map((h) => (
                  <li key={h.square}>
                    Their {h.piece} on {h.square} is {h.reason} — win it.
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Dialogue with the coach */}
      <div>
        <p className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-zinc-500">
          <span>Dialogue</span>
          <button
            onClick={() => void explainWithAi()}
            disabled={chatBusy || !report}
            className="font-normal normal-case text-sky-300 hover:text-sky-200 disabled:opacity-40"
            title="AI explanation of the current position"
          >
            ✨ Explain with AI
          </button>
        </p>
        <div ref={logBoxRef} className="moves-scroll flex max-h-64 flex-col gap-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          {log.length === 0 && (
            <p className="text-xs text-zinc-500">
              Play a move and I will comment. You can also ask me anything about the position.
            </p>
          )}
          {log.map((entry) => (
            <div
              key={entry.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                entry.role === 'coach'
                  ? 'self-start rounded-bl-sm border border-amber-400/30 bg-amber-400/10 text-zinc-100'
                  : 'self-end rounded-br-sm border border-zinc-600 bg-zinc-700/40 text-zinc-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="min-w-0 flex-1">{entry.text}</span>
                {entry.role === 'coach' && (
                  <button
                    onClick={() => speak(entry.text, useAiStore.getState().voiceUri)}
                    title="Read aloud"
                    className="shrink-0 text-zinc-400 hover:text-amber-300"
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
          ))}
          {chatBusy && <div className="self-start text-xs text-zinc-500">Coach is thinking…</div>}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void sendQuestion(input)
            }}
            placeholder="Ask the coach about the position…"
            className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400"
          />
          <button
            onClick={toggleMic}
            title={listening ? 'Listening — speak now' : 'Ask by voice'}
            className={`shrink-0 rounded-lg border px-3 text-sm transition-colors ${
              listening
                ? 'border-red-500 bg-red-500/10 text-red-300'
                : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            🎤
          </button>
          <button
            onClick={() => void sendQuestion(input)}
            disabled={chatBusy}
            className="shrink-0 rounded-lg bg-amber-500 px-4 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
