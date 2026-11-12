// A realistic opening library (ECO code, name, SAN moves, space-separated).
// Lines follow mainstream theory — enough to browse, learn and drill.

export interface Opening {
  eco: string
  name: string
  moves: string
}

export const OPENINGS: Opening[] = [
  // A — Flank openings
  { eco: 'A00', name: 'Nimzo-Larsen Attack', moves: 'b3' },
  { eco: 'A04', name: 'Zukertort Opening', moves: 'Nf3' },
  { eco: 'A05', name: 'Réti Opening', moves: 'Nf3 d5 c4' },
  { eco: 'A10', name: 'English Opening', moves: 'c4' },
  { eco: 'A20', name: 'English: King\u2019s English', moves: 'c4 e5' },
  { eco: 'A20', name: 'English: Reversed Sicilian', moves: 'c4 e5 Nc3' },
  { eco: 'A45', name: 'Trompowsky Attack', moves: 'd4 Nf6 Bg5' },
  { eco: 'A51', name: 'Budapest Gambit', moves: 'd4 Nf6 c4 e5' },
  { eco: 'A56', name: 'Benoni Defence', moves: 'd4 Nf6 c4 c5' },
  { eco: 'A80', name: 'Dutch Defence', moves: 'd4 f5' },

  // B — Sicilian and half-open
  { eco: 'B01', name: 'Scandinavian Defence', moves: 'e4 d5 exd5 Qxd5' },
  { eco: 'B06', name: 'Modern Defence', moves: 'e4 g6' },
  { eco: 'B07', name: 'Pirc Defence', moves: 'e4 d6 d4 Nf6' },
  { eco: 'B10', name: 'Caro-Kann Defence', moves: 'e4 c6' },
  { eco: 'B12', name: 'Caro-Kann: Advance', moves: 'e4 c6 d4 d5 e5' },
  { eco: 'B18', name: 'Caro-Kann: Classical', moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5' },
  { eco: 'B20', name: 'Sicilian Defence', moves: 'e4 c5' },
  { eco: 'B21', name: 'Sicilian: Smith-Morra Gambit', moves: 'e4 c5 d4' },
  { eco: 'B22', name: 'Sicilian: Alapin', moves: 'e4 c5 c3' },
  { eco: 'B23', name: 'Sicilian: Closed', moves: 'e4 c5 Nc3' },
  { eco: 'B27', name: 'Sicilian: Nf3', moves: 'e4 c5 Nf3' },
  { eco: 'B30', name: 'Sicilian: Rossolimo setup', moves: 'e4 c5 Nf3 Nc6' },
  { eco: 'B33', name: 'Sicilian: Sveshnikov', moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5' },
  { eco: 'B50', name: 'Sicilian: d6 systems', moves: 'e4 c5 Nf3 d6' },
  { eco: 'B54', name: 'Sicilian: Classical', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6' },
  { eco: 'B70', name: 'Sicilian: Dragon', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6' },
  { eco: 'B76', name: 'Sicilian: Dragon, Yugoslav', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3' },
  { eco: 'B80', name: 'Sicilian: Scheveningen', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6' },
  { eco: 'B90', name: 'Sicilian: Najdorf', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6' },
  { eco: 'B97', name: 'Sicilian: Najdorf, Poisoned Pawn', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6' },

  // C — e4 e5 and French
  { eco: 'C00', name: 'French Defence', moves: 'e4 e6' },
  { eco: 'C02', name: 'French: Advance', moves: 'e4 e6 d4 d5 e5' },
  { eco: 'C03', name: 'French: Tarrasch', moves: 'e4 e6 d4 d5 Nd2' },
  { eco: 'C11', name: 'French: Classical', moves: 'e4 e6 d4 d5 Nc3 Nf6' },
  { eco: 'C15', name: 'French: Winawer', moves: 'e4 e6 d4 d5 Nc3 Bb4' },
  { eco: 'C20', name: 'Open Game', moves: 'e4 e5' },
  { eco: 'C25', name: 'Vienna Game', moves: 'e4 e5 Nc3' },
  { eco: 'C30', name: 'King\u2019s Gambit', moves: 'e4 e5 f4' },
  { eco: 'C36', name: 'King\u2019s Gambit Accepted', moves: 'e4 e5 f4 exf4 Nf3' },
  { eco: 'C40', name: 'Petrov\u2019s Defence', moves: 'e4 e5 Nf3 Nf6' },
  { eco: 'C41', name: 'Philidor Defence', moves: 'e4 e5 Nf3 d6' },
  { eco: 'C44', name: 'Ponziani setup', moves: 'e4 e5 Nf3 Nc6 c3' },
  { eco: 'C45', name: 'Scotch Game', moves: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4' },
  { eco: 'C47', name: 'Four Knights Game', moves: 'e4 e5 Nf3 Nc6 Nc3 Nf6' },
  { eco: 'C50', name: 'Italian Game', moves: 'e4 e5 Nf3 Nc6 Bc4' },
  { eco: 'C53', name: 'Italian: Classical', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4' },
  { eco: 'C55', name: 'Italian: Two Knights setup', moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6' },
  { eco: 'C60', name: 'Ruy López', moves: 'e4 e5 Nf3 Nc6 Bb5' },
  { eco: 'C62', name: 'Ruy López: Old Steinitz', moves: 'e4 e5 Nf3 Nc6 Bb5 d6' },
  { eco: 'C65', name: 'Ruy López: Berlin', moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6' },
  { eco: 'C67', name: 'Ruy López: Berlin, endgame line', moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4' },
  { eco: 'C68', name: 'Ruy López: Exchange', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6' },
  { eco: 'C78', name: 'Ruy López: Morphy, main line', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4' },
  { eco: 'C84', name: 'Ruy López: Closed', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7' },
  { eco: 'C89', name: 'Ruy López: Marshall Attack', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5' },

  // D — Queen's pawn
  { eco: 'D00', name: 'Queen\u2019s Pawn Game', moves: 'd4 d5' },
  { eco: 'D02', name: 'London System', moves: 'd4 d5 Nf3 Nf6 Bf4' },
  { eco: 'D02', name: 'Colle System', moves: 'd4 d5 Nf3 Nf6 e3' },
  { eco: 'D06', name: "Queen's Gambit", moves: 'd4 d5 c4' },
  { eco: 'D10', name: 'Slav Defence', moves: 'd4 d5 c4 c6' },
  { eco: 'D20', name: "Queen's Gambit Accepted", moves: 'd4 d5 c4 dxc4' },
  { eco: 'D27', name: 'QGA: main line', moves: 'd4 d5 c4 dxc4 Nf3 Nf6 e3' },
  { eco: 'D30', name: "Queen's Gambit Declined", moves: 'd4 d5 c4 e6' },
  { eco: 'D37', name: 'QGD: main line', moves: 'd4 d5 c4 e6 Nc3 Nf6' },
  { eco: 'D43', name: 'Semi-Slav', moves: 'd4 d5 c4 e6 Nc3 Nf6 Nf3 c6' },
  { eco: 'D55', name: 'QGD: Cambridge Springs setup', moves: 'd4 d5 c4 e6 Nc3 Nf6 Nf3 Be7 Bg5 O-O e3 h6' },
  { eco: 'D80', name: 'Grünfeld Defence', moves: 'd4 Nf6 c4 g6 Nc3 d5' },

  // E — Indian defences
  { eco: 'E00', name: 'Catalan Opening', moves: 'd4 Nf6 c4 e6 g3' },
  { eco: 'E05', name: 'Catalan: Open', moves: 'd4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4' },
  { eco: 'E12', name: 'Queen\u2019s Indian', moves: 'd4 Nf6 c4 e6 Nf3 b6' },
  { eco: 'E20', name: 'Nimzo-Indian Defence', moves: 'd4 Nf6 c4 e6 Nc3 Bb4' },
  { eco: 'E32', name: 'Nimzo-Indian: Classical', moves: 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2' },
  { eco: 'E60', name: "King's Indian Defence", moves: 'd4 Nf6 c4 g6' },
  { eco: 'E70', name: "King's Indian: Classical setup", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6' },
  { eco: 'E76', name: "King's Indian: Four Pawns", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f4' },
  { eco: 'E97', name: "King's Indian: Mar del Plata", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5' },
]
