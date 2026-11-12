import { useMemo, useState } from 'react'
import { STYLES, initialsOf, ratingBand } from '../data/styles'
import { useSettingsStore } from '../store/settingsStore'

const BANDS = ['All', 'Super-GM', 'Grandmaster', 'Master', 'Expert', 'Strong club', 'Club', 'Beginner']

export function StylesTab() {
  const [search, setSearch] = useState('')
  const [band, setBand] = useState('All')
  const botId = useSettingsStore((s) => s.botId)
  const update = useSettingsStore((s) => s.update)

  const list = useMemo(() => {
    const query = search.trim().toLowerCase()
    return STYLES.filter(
      (style) =>
        (band === 'All' || ratingBand(style.rating) === band) &&
        (!query || style.name.toLowerCase().includes(query)),
    )
  }, [search, band])

  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1">
        {BANDS.map((b) => (
          <button
            key={b}
            onClick={() => setBand(b)}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              band === b ? 'border-amber-400 bg-amber-500/10 text-amber-300' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {b}
          </button>
        ))}
      </div>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search players…"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-400"
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((style) => {
          const selected = style.id === botId
          return (
            <button
              key={style.id}
              onClick={() => update({ botId: style.id })}
              title={selected ? 'Currently selected' : 'Play against this opponent'}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                selected
                  ? 'border-amber-400 bg-amber-500/5'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-xs font-bold text-zinc-950">
                {initialsOf(style.name)}
              </span>
              <span className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">{style.name}</p>
                <p className="text-xs text-zinc-400">
                  Elo ~{style.rating} · {ratingBand(style.rating)} · {style.pick}
                </p>
                <p className="truncate text-xs text-zinc-500">{style.blurb}</p>
              </span>
            </button>
          )
        })}
        {list.length === 0 && (
          <p className="col-span-full p-2 text-xs text-zinc-600">No players match.</p>
        )}
      </div>

      <p className="text-xs text-zinc-600">
        {list.length} of {STYLES.length} styles · the selected opponent plays in the Play tab.
      </p>
    </main>
  )
}
