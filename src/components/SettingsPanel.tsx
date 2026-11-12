import type { BoardTheme } from '../store/settingsStore'
import { useSettingsStore } from '../store/settingsStore'

const THEMES: { id: BoardTheme; label: string; light: string; dark: string }[] = [
  { id: 'brown', label: 'Brown', light: '#f0d9b5', dark: '#b58863' },
  { id: 'green', label: 'Green', light: '#ebecd0', dark: '#739552' },
  { id: 'blue', label: 'Blue', light: '#dee3e6', dark: '#8ca2ad' },
  { id: 'slate', label: 'Slate', light: '#d7dce2', dark: '#64748b' },
]

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800/60"
    >
      <span>{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-amber-500' : 'bg-zinc-700'}`}>
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? 18 : 2 }}
        />
      </span>
    </button>
  )
}

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettingsStore()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[min(92vw,400px)] rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Game settings</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1">
          <Toggle label="Show legal moves" checked={settings.showDests} onChange={(v) => settings.update({ showDests: v })} />
          <Toggle label="Board coordinates" checked={settings.showCoordinates} onChange={(v) => settings.update({ showCoordinates: v })} />
          <Toggle label="Highlight last move" checked={settings.highlightLastMove} onChange={(v) => settings.update({ highlightLastMove: v })} />
          <Toggle label="Animate moves" checked={settings.animateMoves} onChange={(v) => settings.update({ animateMoves: v })} />
          <Toggle label="Always promote to a queen" checked={settings.autoQueen} onChange={(v) => settings.update({ autoQueen: v })} />
        </div>
        <p className="mb-2 mt-4 text-xs uppercase tracking-wide text-zinc-500">Board theme</p>
        <div className="flex gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              title={theme.label}
              onClick={() => settings.update({ boardTheme: theme.id })}
              className={`h-10 w-10 overflow-hidden rounded-lg border-2 transition-colors ${
                settings.boardTheme === theme.id ? 'border-amber-400' : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{
                background: `repeating-conic-gradient(${theme.dark} 0% 25%, ${theme.light} 0% 50%) 0 0 / 50% 50%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
