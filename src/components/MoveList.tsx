import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

export function MoveList() {
  const history = useGameStore((s) => s.history)
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight })
  }, [history])

  const rows: { no: number; white?: string; black?: string }[] = []
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ no: i / 2 + 1, white: history[i], black: history[i + 1] })
  }

  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Moves</p>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No moves yet — drag a piece to start.</p>
      ) : (
        <div
          ref={boxRef}
          className="moves-scroll max-h-56 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60"
        >
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.no} className="border-b border-zinc-800/60 last:border-b-0">
                  <td className="w-10 px-2 py-1 text-right text-zinc-500">{row.no}.</td>
                  <td className="px-2 py-1 font-medium text-zinc-100">{row.white}</td>
                  <td className="px-2 py-1 text-zinc-300">{row.black ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
