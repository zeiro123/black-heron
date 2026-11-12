import type { ReactNode } from 'react'

export type Tab = 'play' | 'coach' | 'games' | 'puzzles' | 'openings' | 'styles'

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <rect x="4" y="4" width="7" height="7" rx="1" fill="currentColor" />
      <rect x="13" y="4" width="7" height="7" rx="1" fill="currentColor" opacity="0.45" />
      <rect x="4" y="13" width="7" height="7" rx="1" fill="currentColor" opacity="0.45" />
      <rect x="13" y="13" width="7" height="7" rx="1" fill="currentColor" />
    </svg>
  )
}

function CoachIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
    </svg>
  )
}

function PuzzleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M10 3a2 2 0 0 1 2 2v1h4a1 1 0 0 1 1 1v4h1a2 2 0 1 1 0 4h-1v4a1 1 0 0 1-1 1h-4v-1a2 2 0 1 0-4 0v1H4a1 1 0 0 1-1-1v-4h1a2 2 0 1 0 0-4H3V7a1 1 0 0 1 1-1h4V5a2 2 0 0 1 2-2z" />
    </svg>
  )
}

function OpeningsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function StylesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="16.5" cy="9" r="2.6" />
      <path d="M3 19c0-3.2 2.7-5.3 6-5.3s6 2.1 6 5.3v1H3v-1z" />
      <path d="M15.8 19.9c-.1-2.7 1.8-4.4 4-4.4 2 0 3.7 1.6 3.7 4.4h-7.7z" />
    </svg>
  )
}

function GamesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M3 9h18M8 4v5" />
      <path d="M7 14l2 2 4-4" />
    </svg>
  )
}

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'play', label: 'Play', icon: <PlayIcon /> },
  { id: 'coach', label: 'Coach', icon: <CoachIcon /> },
  { id: 'games', label: 'Games', icon: <GamesIcon /> },
  { id: 'puzzles', label: 'Puzzles', icon: <PuzzleIcon /> },
  { id: 'openings', label: 'Openings', icon: <OpeningsIcon /> },
  { id: 'styles', label: 'Opponents', icon: <StylesIcon /> },
]

export function NavRail({ tab, onTab }: { tab: Tab; onTab: (tab: Tab) => void }) {
  return (
    <nav className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-zinc-800/80 py-6 sm:flex">
      {TABS.map((t) => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => onTab(t.id)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
            tab === t.id ? 'bg-amber-500/15 text-amber-300' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {t.icon}
        </button>
      ))}
    </nav>
  )
}
