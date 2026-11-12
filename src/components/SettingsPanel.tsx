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
  hint,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  hint?: string
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-800/60"
    >
      <span className="flex items-center justify-between">
        <span className="text-sm text-zinc-200">{label}</span>
        <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-amber-500' : 'bg-zinc-700'}`}>
          <span
            className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
            style={{ left: checked ? 18 : 2 }}
          />
        </span>
      </span>
      {hint && <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>}
    </button>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
      {children}
    </p>
  )
}

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettingsStore()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="moves-scroll max-h-[92vh] w-[min(92vw,420px)] overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
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
        <SectionTitle>Board &amp; pieces</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((theme) => {
            const selected = settings.boardTheme === theme.id
            return (
              <button
                key={theme.id}
                title={theme.label}
                onClick={() => settings.update({ boardTheme: theme.id })}
                className={`relative h-16 overflow-hidden rounded-lg border-2 transition-colors ${
                  selected ? 'border-amber-400' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                style={{
                  background: `repeating-conic-gradient(${theme.dark} 0% 25%, ${theme.light} 0% 50%) 0 0 / 50% 50%`,
                }}
              >
                <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-[10px] font-medium text-white">
                  {theme.label}
                </span>
                {selected && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold leading-none text-zinc-950">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <SectionTitle>Pieces</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'classic' as const, label: 'Classic', hint: 'SVG pieces (Lichess cburnett)' },
            { id: 'unicode' as const, label: 'Unicode', hint: 'Symbol glyphs, scales with the board' },
          ].map((set) => {
            const selected = settings.pieceSet === set.id
            return (
              <button
                key={set.id}
                onClick={() => settings.update({ pieceSet: set.id })}
                className={`rounded-lg border-2 p-2 text-left transition-colors ${
                  selected ? 'border-amber-400 bg-amber-500/5' : 'border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm text-zinc-100">
                  {set.label}
                  {selected && <span className="text-xs text-amber-300">✓</span>}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">{set.hint}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-2 space-y-1">
          <Toggle
            label="Show board coordinates"
            hint="Rank numbers and file letters around the board"
            checked={settings.showCoordinates}
            onChange={(v) => settings.update({ showCoordinates: v })}
          />
          {settings.showCoordinates && (
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs text-zinc-400">Placement</span>
              <div className="flex overflow-hidden rounded-lg border border-zinc-700 text-xs">
                {(['inside', 'outside'] as const).map((placement) => (
                  <button
                    key={placement}
                    onClick={() => settings.update({ coordPlacement: placement })}
                    className={`px-3 py-1 capitalize transition-colors ${
                      settings.coordPlacement === placement
                        ? 'bg-zinc-700 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {placement}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Toggle
            label="Highlight last move"
            checked={settings.highlightLastMove}
            onChange={(v) => settings.update({ highlightLastMove: v })}
          />
        </div>

        <SectionTitle>Gameplay</SectionTitle>
        <div className="space-y-1">
          <Toggle
            label="Show legal moves"
            hint="Dots on every square your piece can move to"
            checked={settings.showDests}
            onChange={(v) => settings.update({ showDests: v })}
          />
          <Toggle
            label="Animate moves"
            hint="Pieces slide between squares"
            checked={settings.animateMoves}
            onChange={(v) => settings.update({ animateMoves: v })}
          />
          <Toggle
            label="Live coach"
            hint="Analyses your position after every move"
            checked={settings.liveCoach}
            onChange={(v) => settings.update({ liveCoach: v })}
          />
          <Toggle
            label="Always promote to a queen"
            hint="Skips the promotion dialog"
            checked={settings.autoQueen}
            onChange={(v) => settings.update({ autoQueen: v })}
          />
        </div>

        <SectionTitle>Coming in later phases</SectionTitle>
        <p className="px-2 pb-1 text-xs text-zinc-600">
          Piece sets, sounds, light/dark mode, background — Phase 10 polish.
        </p>
      </div>
    </div>
  )
}
