import type { PlayStyle } from '../engine/opponent'

export interface PlayerStyle {
  id: string
  name: string
  rating: number
  /** Which move-selection rule the bot uses. */
  pick: PlayStyle
  blurb: string
}

/**
 * The style library: real players (accurate peak/typical ratings) plus clearly
 * fictional club-persona bots across every rating band — 100 opponents total.
 */
const FAMOUS: [name: string, rating: number, pick: PlayStyle, blurb: string][] = [
  ['Magnus Carlsen', 2882, 'principled', 'Universal champion — squeezes every ending'],
  ['Garry Kasparov', 2851, 'aggressive', 'Ferocious attacking play with the initiative'],
  ['Fabiano Caruana', 2842, 'principled', 'Laser-precise calculation'],
  ['Hikaru Nakamura', 2816, 'principled', 'Bullet specialist, stubborn defender'],
  ['Veselin Topalov', 2816, 'aggressive', 'Fearless edge-seeking attacker'],
  ['Wesley So', 2820, 'principled', 'Rock-solid technique'],
  ['Vladimir Kramnik', 2807, 'solid', 'Deep strategic squeezes'],
  ['Ding Liren', 2801, 'principled', 'Patient, precise, unbreakable'],
  ['Viswanathan Anand', 2801, 'balanced', 'Lightning-fast universal play'],
  ['Levon Aronian', 2800, 'balanced', 'Creative and resourceful'],
  ['Maxime Vachier-Lagrave', 2800, 'balanced', 'Najdorf and Grünfeld genius'],
  ['Anatoly Karpov', 2780, 'solid', 'Positional boa constrictor'],
  ['Bobby Fischer', 2785, 'principled', 'Relentless precision and fighting spirit'],
  ['Sergey Karjakin', 2782, 'solid', 'The Minister of Defence'],
  ['Alexander Grischuk', 2770, 'aggressive', 'Sharp theoretician'],
  ['Anish Giri', 2770, 'principled', 'Top-theory expert'],
  ['Wang Hao', 2763, 'aggressive', 'Dynamic attacker'],
  ['Peter Svidler', 2750, 'balanced', 'Golden feel for structure'],
  ['Richard Rapport', 2760, 'aggressive', 'Wild original ideas'],
  ['Jan-Krzysztof Duda', 2760, 'aggressive', 'World-Cup attacking champion'],
  ['Teimour Radjabov', 2750, 'solid', 'King\u2019s-Indian stalwart'],
  ['Ian Nepomniachtchi', 2795, 'aggressive', 'Blistering speed and tactics'],
  ['Alireza Firouzja', 2795, 'aggressive', 'Fearless young super-GM'],
  ['Mikhail Tal', 2705, 'aggressive', 'Sacrifices on principle — the Magician from Riga'],
  ['Tigran Petrosian', 2700, 'solid', 'Prophylaxis and exchange sacrifices'],
  ['Boris Spassky', 2690, 'balanced', 'Universal champion of both styles'],
  ['Judit Polgár', 2675, 'aggressive', 'The sharpest attacker of her era'],
  ['Hou Yifan', 2658, 'principled', 'Precision and deep preparation'],
  ['José Raúl Capablanca', 2725, 'principled', 'The chess machine — flawless endings'],
  ['Emanuel Lasker', 2720, 'balanced', 'Psychological fighting chess'],
  ['Alexander Alekhine', 2720, 'aggressive', 'Complex, attacking combinations'],
  ['Mikhail Botvinnik', 2770, 'principled', 'Scientific, systematic play'],
  ['Levy Rozman', 2421, 'balanced', 'GothamChess — teacher of the internet'],
  ['Eric Hansen', 2600, 'aggressive', 'CoffeeChess gambits'],
  ['Aman Hambleton', 2500, 'aggressive', 'Chessbrah gambit specialist'],
  ['Anna Cramling', 2150, 'solid', 'System openings and patient play'],
  ['Alexandra Botez', 2072, 'balanced', 'Streamer with sharp tactics'],
  ['Andrea Botez', 1900, 'aggressive', 'Coffee-chess energy'],
  ['David Howell', 2660, 'principled', 'Clean, universal technique'],
  ['Daniel King', 2500, 'principled', 'Power Play author and commentator'],
]

/** Fictional club-persona bots: deterministic names, ratings and styles. */
const CLUB_NAMES = [
  'Mark', 'John', 'Elena', 'Sofia', 'Peter', 'Laura', 'Tom', 'Nina', 'Jack', 'Maya',
  'Oscar', 'Ruby', 'Felix', 'Clara', 'Hugo', 'Iris', 'Leo', 'Ada', 'Max', 'Emma',
  'Sam', 'Zoe', 'Ben', 'Lena', 'Eli', 'Mira', 'Dan', 'Faye', 'Cole', 'June',
  'Ade', 'Tess', 'Rory', 'Wren', 'Blake', 'Isla', 'Reed', 'Nova', 'Finn', 'Lily',
  'Gus', 'Eden', 'Kai', 'Pia', 'Miles', 'Rosa', 'Otto', 'Sana', 'Theo', 'Vera',
  'Axel', 'Ruth', 'Dima', 'Yara', 'Jonas', 'Kira', 'Luca', 'Nora', 'Piotr', 'Quinn',
]
const PICK_CYCLE: PlayStyle[] = ['aggressive', 'balanced', 'solid', 'principled']
const CLUB_BLURBS = [
  'Loves to attack early',
  'Plays it safe and solid',
  'Follows opening theory',
  'Practical and tricky',
  'Blitz-style gambiteer',
  'Endgame grinder',
  'Piece-play enthusiast',
  'Pawn-structure specialist',
  'Calm positional player',
  'Sharp tactical shots',
]

export const STYLES: PlayerStyle[] = [
  ...FAMOUS.map(([name, rating, pick, blurb], index) => ({
    id: `famous-${index}`,
    name,
    rating,
    pick,
    blurb,
  })),
  ...CLUB_NAMES.map((name, index) => {
    // Ratings from 620 to 1480 spread across 60 personas.
    const rating = 620 + Math.round((index / (CLUB_NAMES.length - 1)) * 860)
    return {
      id: `club-${index}`,
      name,
      rating,
      pick: PICK_CYCLE[index % PICK_CYCLE.length],
      blurb: CLUB_BLURBS[index % CLUB_BLURBS.length],
    }
  }),
]

export function findStyle(id: string | undefined): PlayerStyle {
  return STYLES.find((style) => style.id === id) ?? STYLES[0]
}

/** Engine strength for a rating: UCI Skill Level + search depth. */
export function ratingToSkill(rating: number): number {
  return Math.max(0, Math.min(20, Math.round((rating - 600) / 114)))
}

export function ratingToDepth(rating: number): number {
  if (rating < 800) return 1
  if (rating < 1100) return 2
  if (rating < 1400) return 4
  if (rating < 1800) return 6
  if (rating < 2200) return 9
  if (rating < 2600) return 14
  return 20
}

export function ratingBand(rating: number): string {
  if (rating >= 2700) return 'Super-GM'
  if (rating >= 2600) return 'Grandmaster'
  if (rating >= 2400) return 'Master'
  if (rating >= 2000) return 'Expert'
  if (rating >= 1600) return 'Strong club'
  if (rating >= 1200) return 'Club'
  return 'Beginner'
}

/** Initials for the avatar face icon. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
