/**
 * Rubik's Cube Algorithm Library
 * Hierarchical structure: Method -> Phase -> Case
 * Each Case specifies:
 * - id: unique identifier string
 * - name: human-readable case name
 * - setup: move sequence to scramble a solved cube into the exact target state
 * - algorithm: move sequence that solves this specific case
 */

export const ALGORITHM_LIBRARY = {
  CFOP: {
    id: 'cfop',
    name: 'CFOP (Fridrich Method)',
    description: 'The world-standard speedcubing method: Cross, F2L, OLL, and PLL.',
    phases: {
      PLL: {
        id: 'pll',
        name: 'PLL (Permute Last Layer)',
        description: 'Permute all last-layer pieces to complete the cube.',
        cases: [
          {
            id: 't-perm',
            name: 'T-Perm',
            description: 'Swaps two adjacent corners (URB, URF) and two opposite edges (UR, UL).',
            setup: "R U R' U' R' F R2 U' R' U' R U R' F'",
            algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
          },
          {
            id: 'ua-perm',
            name: 'Ua-Perm',
            description: 'Cycles three edges clockwise (UB -> UL -> UR).',
            setup: "R U' R U R U R U' R' U' R2",
            algorithm: "R2 U' R' U' R U R U R U' R",
          },
          {
            id: 'ub-perm',
            name: 'Ub-Perm',
            description: 'Cycles three edges counter-clockwise (UR -> UL -> UB).',
            setup: "R2 U' R' U' R U R U R U' R",
            algorithm: "R U' R U R U R U' R' U' R2",
          },
          {
            id: 'y-perm',
            name: 'Y-Perm',
            description: 'Swaps two diagonal corners and two adjacent edges.',
            setup: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
          },
          {
            id: 'h-perm',
            name: 'H-Perm',
            description: 'Swaps opposite edge pairs (UF <-> UB, UL <-> UR).',
            setup: "M2 U M2 U2 M2 U M2",
            algorithm: "M2 U M2 U2 M2 U M2",
          },
          {
            id: 'z-perm',
            name: 'Z-Perm',
            description: 'Swaps adjacent edge pairs (UF <-> UR, UB <-> UL).',
            setup: "M2 U M2 U M' U2 M2 U2 M'",
            algorithm: "M' U M2 U M2 U M' U2 M2",
          },
        ],
      },
      OLL: {
        id: 'oll',
        name: 'OLL (Orient Last Layer)',
        description: 'Orient all top face stickers yellow without disrupting F2L.',
        cases: [
          {
            id: 'oll-sune',
            name: 'Sune (OLL 27)',
            description: 'Fish shape with front-left yellow sticker.',
            setup: "R U R' U R U2 R'",
            algorithm: "R U R' U R U2 R'",
          },
          {
            id: 'oll-antisune',
            name: 'Anti-Sune (OLL 26)',
            description: 'Fish shape with front-right yellow sticker.',
            setup: "R U2 R' U' R U' R'",
            algorithm: "R U2 R' U' R U' R'",
          },
          {
            id: 'oll-h',
            name: 'H-Pattern (OLL 21)',
            description: 'Double headlights facing front and back.',
            setup: "R U2 R' U' R U R' U' R U' R'",
            algorithm: "R U2 R' U' R U R' U' R U' R'",
          },
          {
            id: 'oll-pi',
            name: 'Pi (OLL 22)',
            description: 'Cross with headlights on left and opposite headlights on right.',
            setup: "R U2 R2 U' R2 U' R2 U2 R",
            algorithm: "R U2 R2 U' R2 U' R2 U2 R",
          },
        ],
      },
      F2L: {
        id: 'f2l',
        name: 'F2L Insertions (First Two Layers)',
        description: 'Pair and insert corner-edge slots simultaneously.',
        cases: [
          {
            id: 'f2l-basic-right',
            name: 'Basic Insertion (Right Slot)',
            description: 'Paired corner-edge in top layer ready for 3-move right insert.',
            setup: "U R U' R'",
            algorithm: "R U R' U'",
          },
          {
            id: 'f2l-basic-left',
            name: 'Basic Insertion (Left Slot)',
            description: 'Paired corner-edge in top layer ready for 3-move left insert.',
            setup: "U' L' U L",
            algorithm: "L' U' L U",
          },
          {
            id: 'f2l-split-pair',
            name: 'Split & Re-insert',
            description: 'Corner and edge separated in the top layer.',
            setup: "R U' R' U R U2 R' U R U' R'",
            algorithm: "R U R' U' R U2 R' U' R U R'",
          },
        ],
      },
    },
  },
  Beginner: {
    id: 'beginner',
    name: 'Beginner Method (Layer by Layer)',
    description: 'Intuitive foundation method solving layer-by-layer.',
    phases: {
      'White Cross': {
        id: 'white-cross',
        name: 'Beginner Cross',
        description: 'Position and orient the four white edge pieces matching side centers.',
        cases: [
          {
            id: 'cross-bottom-ready',
            name: 'Target on Bottom Layer (Aligned)',
            description: 'White sticker on D face aligned with side center.',
            setup: "F2",
            algorithm: "F2",
          },
          {
            id: 'cross-flipped-edge',
            name: 'Flipped Edge in Front-Right',
            description: 'White edge in middle layer needing reorientation.',
            setup: "F' U' R U",
            algorithm: "U' R' U F",
          },
          {
            id: 'cross-top-flipped',
            name: 'Top Layer Flipped',
            description: 'White edge on top with white facing front instead of up.',
            setup: "F R' D' R F2",
            algorithm: "F' R U' R' F",
          },
        ],
      },
      'First Layer Corners': {
        id: 'first-layer-corners',
        name: 'First Layer Corners',
        description: 'Insert corners using the fundamental Sexy Move (R U R\' U\').',
        cases: [
          {
            id: 'corner-right-slot',
            name: 'Right Corner Insertion',
            description: 'White corner above target slot with white facing right.',
            setup: "R U R'",
            algorithm: "R U' R'",
          },
          {
            id: 'corner-front-slot',
            name: 'Front Corner Insertion',
            description: 'White corner above target slot with white facing front.',
            setup: "U R U' R'",
            algorithm: "R U R'",
          },
        ],
      },
      'Last Layer': {
        id: 'last-layer',
        name: 'Last Layer Algorithms',
        description: 'Standard 4-look last layer formulas.',
        cases: [
          {
            id: 'yellow-cross-bar',
            name: 'Yellow Cross (Horizontal Line)',
            description: 'Convert horizontal yellow line into the full yellow cross.',
            setup: "F R U R' U' F'",
            algorithm: "F R U R' U' F'",
          },
          {
            id: 'corner-cycle-headlights',
            name: 'Corner Permutation (Headlights)',
            description: 'Solve all 4 corners when two headlights are placed on the left.',
            setup: "R' F R' B2 R F' R' B2 R2",
            algorithm: "R' F R' B2 R F' R' B2 R2",
          },
        ],
      },
    },
  },
};

export default ALGORITHM_LIBRARY;
