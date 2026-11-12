// Tiny WebAudio synth for game sounds — no audio assets needed (open-license rule).

let ctx: AudioContext | null = null

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, duration: number, type: OscillatorType, gain: number, delay = 0): void {
  const audio = context()
  if (!audio) return
  const start = audio.currentTime + delay
  const osc = audio.createOscillator()
  const amp = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  amp.gain.setValueAtTime(gain, start)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp).connect(audio.destination)
  osc.start(start)
  osc.stop(start + duration)
}

export function playMove(): void {
  tone(420, 0.06, 'triangle', 0.12)
}

export function playCapture(): void {
  tone(210, 0.09, 'square', 0.14)
}

export function playCheck(): void {
  tone(660, 0.08, 'triangle', 0.12)
  tone(880, 0.1, 'triangle', 0.12, 0.09)
}

export function playGameEnd(): void {
  tone(392, 0.16, 'triangle', 0.12)
  tone(494, 0.16, 'triangle', 0.12, 0.14)
  tone(587, 0.24, 'triangle', 0.12, 0.28)
}
