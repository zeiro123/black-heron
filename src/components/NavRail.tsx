// Placeholder navigation tabs — only Play works for now; the rest light up in later phases.
function BoardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <rect x="4" y="4" width="7" height="7" rx="1" fill="currentColor" />
      <rect x="13" y="4" width="7" height="7" rx="1" fill="currentColor" opacity="0.45" />
      <rect x="4" y="13" width="7" height="7" rx="1" fill="currentColor" opacity="0.45" />
      <rect x="13" y="13" width="7" height="7" rx="1" fill="currentColor" />
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

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function BulbIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  )
}

const TABS = [
  { id: 'play', label: 'Play', icon: <BoardIcon />, active: true },
  { id: 'review', label: 'Game review — Phase 4', icon: <ChartIcon /> },
  { id: 'coach', label: 'Coach — Phase 6', icon: <BulbIcon /> },
  { id: 'puzzles', label: 'Puzzles — Phase 7', icon: <PuzzleIcon /> },
  { id: 'learn', label: 'Opening trainer — Phase 8', icon: <BookIcon /> },
]

export function NavRail() {
  return (
    <nav className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-zinc-800/80 py-6 sm:flex">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          title={tab.active ? 'Play' : `${tab.label} (not built yet)`}
          disabled={!tab.active}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
            tab.active
              ? 'bg-amber-500/15 text-amber-300'
              : 'cursor-not-allowed text-zinc-600 hover:text-zinc-500'
          }`}
        >
          {tab.icon}
        </button>
      ))}
    </nav>
  )
}
