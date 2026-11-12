import { Board } from './Board'
import { Controls } from './Controls'
import { EvalBar } from './EvalBar'
import { MoveList } from './MoveList'
import { MoveNav } from './MoveNav'
import { PlayerBar } from './PlayerBar'
import { ReviewPanel } from './ReviewPanel'
import { StatusBar } from './StatusBar'
import { findStyle, initialsOf } from '../data/styles'
import { capturedFromFen } from '../game/captured'
import { positionAtPly } from '../game/chessGame'
import { useCoachStore } from '../store/coachStore'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'

export function PlayTab() {
  const playerColor = useGameStore((s) => s.playerColor)
  const history = useGameStore((s) => s.history)
  const viewPly = useGameStore((s) => s.viewPly)
  const thinking = useGameStore((s) => s.thinking)
  const playerName = useSettingsStore((s) => s.playerName)
  const updateSettings = useSettingsStore((s) => s.update)
  const botId = useSettingsStore((s) => s.botId)
  const evalBarOn = useSettingsStore((s) => s.evalBar)
  const coachCp = useCoachStore((s) => s.report?.cpWhite ?? null)

  const bot = findStyle(botId)
  const display = positionAtPly(history, viewPly)
  const captured = capturedFromFen(display.fen)
  const playerIsWhite = playerColor === 'w'
  const playerCaptured = playerIsWhite ? captured.byWhite : captured.byBlack
  const opponentCaptured = playerIsWhite ? captured.byBlack : captured.byWhite
  const playerDiff = playerIsWhite ? captured.materialDiff : -captured.materialDiff
  const opponentDiff = -playerDiff

  const opponentColor = playerIsWhite ? 'b' : 'w'

  return (
    <main className="flex flex-col items-start gap-6 md:flex-row">
      <div className="flex w-full max-w-[560px] shrink-0 flex-col gap-2">
        <PlayerBar
          color={opponentColor}
          name={bot.name}
          subtitle={`Elo ~${bot.rating} · ${bot.blurb}`}
          captured={opponentCaptured}
          materialDiff={opponentDiff}
          thinking={thinking}
          avatar={initialsOf(bot.name)}
        />
        <div className="flex gap-2">
          {evalBarOn && coachCp !== null && <EvalBar cpWhite={coachCp} orientation={playerColor} />}
          <div className="min-w-0 flex-1">
            <Board />
          </div>
        </div>
        <PlayerBar
          color={playerColor}
          name={playerName}
          nameEditable
          onNameChange={(name) => updateSettings({ playerName: name })}
          captured={playerCaptured}
          materialDiff={playerDiff}
        />
      </div>
      <aside className="w-full space-y-4 lg:w-80">
        <StatusBar />
        <Controls />
        <MoveNav />
        <MoveList />
        <ReviewPanel />
        <p className="text-xs text-zinc-600">
          {history.length} {history.length === 1 ? 'half-move' : 'half-moves'} played ·
          right-click drag draws arrows (knight arrows bend) and circles · ← → keys step moves
        </p>
      </aside>
    </main>
  )
}
