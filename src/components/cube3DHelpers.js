/**
 * Curated Aesthetic Palette for Rubik's Cube:
 * - White:  #EEEEEE
 * - Red:    #D32F2F (Ruby Red)
 * - Green:  #388E3C (Emerald Green)
 * - Yellow: #FBC02D (Gold Yellow)
 * - Orange: #F57C00 (Terracotta Orange)
 * - Blue:   #1976D2 (Sapphire Blue)
 * - Inner:  #222222 (Consistent Dark Grey/Black for inner unexposed faces)
 */
export const COLOR_PALETTE = {
  U: '#EEEEEE',
  R: '#D32F2F',
  F: '#388E3C',
  D: '#FBC02D',
  L: '#F57C00',
  B: '#1976D2',
  X: '#333333', // Blank / unpainted tile
  INNER: '#222222',
};

/**
 * Standard Face Definitions:
 * U (Up):    0 - 8
 * R (Right): 9 - 17
 * F (Front): 18 - 26
 * D (Down):  27 - 35
 * L (Left):  36 - 44
 * B (Back):  45 - 53
 */
export const FACE_OFFSETS = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45,
};

/**
 * Helper function that returns the 6 material colors for a cubie at (x, y, z)
 * in standard Three.js box normal order:
 * [0: +X (Right), 1: -X (Left), 2: +Y (Up), 3: -Y (Down), 4: +Z (Front), 5: -Z (Back)].
 * Inner unexposed faces return #222222.
 *
 * @param {number} x (-1, 0, 1)
 * @param {number} y (-1, 0, 1)
 * @param {number} z (-1, 0, 1)
 * @param {string} cubeState 54-character state string
 * @returns {string[]} Array of 6 hex colors
 */
export function getCubieFaceColors(x, y, z, cubeState) {
  const colors = [
    COLOR_PALETTE.INNER,
    COLOR_PALETTE.INNER,
    COLOR_PALETTE.INNER,
    COLOR_PALETTE.INNER,
    COLOR_PALETTE.INNER,
    COLOR_PALETTE.INNER,
  ];

  if (!cubeState || cubeState.length < 54) {
    return colors;
  }

  // 0: +X (Right) -> x = 1. row = 1 - y, col = 1 - z (col 0: z = 1 [Front], col 2: z = -1 [Back])
  if (x === 1) {
    const indexInFace = (1 - y) * 3 + (1 - z);
    const idx = FACE_OFFSETS.R + indexInFace;
    colors[0] = COLOR_PALETTE[cubeState[idx]] || COLOR_PALETTE.R;
  }

  // 1: -X (Left) -> x = -1. row = 1 - y, col = z + 1 (col 0: z = -1 [Back], col 2: z = 1 [Front])
  if (x === -1) {
    const indexInFace = (1 - y) * 3 + (z + 1);
    const idx = FACE_OFFSETS.L + indexInFace;
    colors[1] = COLOR_PALETTE[cubeState[idx]] || COLOR_PALETTE.L;
  }

  // 2: +Y (Up) -> y = 1. row = z + 1 (row 0: z = -1 [Back], row 2: z = 1 [Front]), col = x + 1
  if (y === 1) {
    const indexInFace = (z + 1) * 3 + (x + 1);
    const idx = FACE_OFFSETS.U + indexInFace;
    colors[2] = COLOR_PALETTE[cubeState[idx]] || COLOR_PALETTE.U;
  }

  // 3: -Y (Down) -> y = -1. row = 1 - z (row 0: z = 1 [Front], row 2: z = -1 [Back]), col = x + 1
  if (y === -1) {
    const indexInFace = (1 - z) * 3 + (x + 1);
    const idx = FACE_OFFSETS.D + indexInFace;
    colors[3] = COLOR_PALETTE[cubeState[idx]] || COLOR_PALETTE.D;
  }

  // 4: +Z (Front) -> z = 1. row = 1 - y (row 0: y = 1 [Up], row 2: y = -1 [Down]), col = x + 1
  if (z === 1) {
    const indexInFace = (1 - y) * 3 + (x + 1);
    const idx = FACE_OFFSETS.F + indexInFace;
    colors[4] = COLOR_PALETTE[cubeState[idx]] || COLOR_PALETTE.F;
  }

  // 5: -Z (Back) -> z = -1. row = 1 - y, col = 1 - x (col 0: x = 1 [Right], col 2: x = -1 [Left])
  if (z === -1) {
    const indexInFace = (1 - y) * 3 + (1 - x);
    const idx = FACE_OFFSETS.B + indexInFace;
    colors[5] = COLOR_PALETTE[cubeState[idx]] || COLOR_PALETTE.B;
  }

  return colors;
}

/**
 * Returns detailed metadata for all exposed stickers on a cubie at (x, y, z).
 *
 * @param {number} x (-1, 0, 1)
 * @param {number} y (-1, 0, 1)
 * @param {number} z (-1, 0, 1)
 * @param {string} cubeState 54-character state string
 * @returns {Array<Object>} List of exposed sticker descriptors
 */
export function getExposedStickers(x, y, z, cubeState) {
  const stickers = [];
  if (!cubeState || cubeState.length < 54) return stickers;

  // +X (Right)
  if (x === 1) {
    const indexInFace = (1 - y) * 3 + (1 - z);
    const stateIndex = FACE_OFFSETS.R + indexInFace;
    const char = cubeState[stateIndex];
    stickers.push({
      face: 'R',
      indexInFace,
      stateIndex,
      char,
      color: COLOR_PALETTE[char] || COLOR_PALETTE.R,
      normal: '+X',
      offset: [0.495, 0, 0],
      rotation: [0, Math.PI / 2, 0],
    });
  }

  // -X (Left)
  if (x === -1) {
    const indexInFace = (1 - y) * 3 + (z + 1);
    const stateIndex = FACE_OFFSETS.L + indexInFace;
    const char = cubeState[stateIndex];
    stickers.push({
      face: 'L',
      indexInFace,
      stateIndex,
      char,
      color: COLOR_PALETTE[char] || COLOR_PALETTE.L,
      normal: '-X',
      offset: [-0.495, 0, 0],
      rotation: [0, -Math.PI / 2, 0],
    });
  }

  // +Y (Up)
  if (y === 1) {
    const indexInFace = (z + 1) * 3 + (x + 1);
    const stateIndex = FACE_OFFSETS.U + indexInFace;
    const char = cubeState[stateIndex];
    stickers.push({
      face: 'U',
      indexInFace,
      stateIndex,
      char,
      color: COLOR_PALETTE[char] || COLOR_PALETTE.U,
      normal: '+Y',
      offset: [0, 0.495, 0],
      rotation: [-Math.PI / 2, 0, 0],
    });
  }

  // -Y (Down)
  if (y === -1) {
    const indexInFace = (1 - z) * 3 + (x + 1);
    const stateIndex = FACE_OFFSETS.D + indexInFace;
    const char = cubeState[stateIndex];
    stickers.push({
      face: 'D',
      indexInFace,
      stateIndex,
      char,
      color: COLOR_PALETTE[char] || COLOR_PALETTE.D,
      normal: '-Y',
      offset: [0, -0.495, 0],
      rotation: [Math.PI / 2, 0, 0],
    });
  }

  // +Z (Front)
  if (z === 1) {
    const indexInFace = (1 - y) * 3 + (x + 1);
    const stateIndex = FACE_OFFSETS.F + indexInFace;
    const char = cubeState[stateIndex];
    stickers.push({
      face: 'F',
      indexInFace,
      stateIndex,
      char,
      color: COLOR_PALETTE[char] || COLOR_PALETTE.F,
      normal: '+Z',
      offset: [0, 0, 0.495],
      rotation: [0, 0, 0],
    });
  }

  // -Z (Back)
  if (z === -1) {
    const indexInFace = (1 - y) * 3 + (1 - x);
    const stateIndex = FACE_OFFSETS.B + indexInFace;
    const char = cubeState[stateIndex];
    stickers.push({
      face: 'B',
      indexInFace,
      stateIndex,
      char,
      color: COLOR_PALETTE[char] || COLOR_PALETTE.B,
      normal: '-Z',
      offset: [0, 0, -0.495],
      rotation: [0, Math.PI, 0],
    });
  }

  return stickers;
}

/**
 * Returns rotation kinematics and cubie participation predicate for a given move notation.
 * Supports:
 * - Standard single-layer face turns: U, R, F, D, L, B
 * - Lowercase 2-layer wide turns: u, r, f, d, l, b
 * - Slice moves: M, E, S
 * - Primes (' or prime) and double turns (2)
 * - UI button format prefix: turnU, turnRPrime, etc.
 *
 * @param {string} move
 * @returns {{ axis: 'x'|'y'|'z', targetAngle: number, isCubieActive: (x: number, y: number, z: number) => boolean, base: string } | null}
 */
export function getMoveRotationInfo(move) {
  if (!move || typeof move !== 'string') return null;
  let str = move.trim();
  if (str.startsWith('turn')) {
    str = str.slice(4);
  }
  if (!str) return null;

  const isPrime = str.includes("'") || str.toLowerCase().includes('prime');
  const isDouble = str.includes('2');
  const base = str[0];

  let axis;
  let baseAngle;
  let isCubieActive;

  switch (base) {
    // Standard face turns (9 cubies)
    case 'R':
      axis = 'x';
      baseAngle = -Math.PI / 2;
      isCubieActive = (x) => x === 1;
      break;
    case 'L':
      axis = 'x';
      baseAngle = Math.PI / 2;
      isCubieActive = (x) => x === -1;
      break;
    case 'U':
      axis = 'y';
      baseAngle = -Math.PI / 2;
      isCubieActive = (_x, y) => y === 1;
      break;
    case 'D':
      axis = 'y';
      baseAngle = Math.PI / 2;
      isCubieActive = (_x, y) => y === -1;
      break;
    case 'F':
      axis = 'z';
      baseAngle = -Math.PI / 2;
      isCubieActive = (_x, _y, z) => z === 1;
      break;
    case 'B':
      axis = 'z';
      baseAngle = Math.PI / 2;
      isCubieActive = (_x, _y, z) => z === -1;
      break;

    // Slice turns (9 cubies)
    case 'M':
      axis = 'x';
      baseAngle = Math.PI / 2; // Follows L
      isCubieActive = (x) => x === 0;
      break;
    case 'E':
      axis = 'y';
      baseAngle = Math.PI / 2; // Follows D
      isCubieActive = (_x, y) => y === 0;
      break;
    case 'S':
      axis = 'z';
      baseAngle = -Math.PI / 2; // Follows F
      isCubieActive = (_x, _y, z) => z === 0;
      break;

    // 2-layer wide turns (18 cubies)
    case 'r':
      axis = 'x';
      baseAngle = -Math.PI / 2; // Follows R
      isCubieActive = (x) => x >= 0;
      break;
    case 'l':
      axis = 'x';
      baseAngle = Math.PI / 2; // Follows L
      isCubieActive = (x) => x <= 0;
      break;
    case 'u':
      axis = 'y';
      baseAngle = -Math.PI / 2; // Follows U
      isCubieActive = (_x, y) => y >= 0;
      break;
    case 'd':
      axis = 'y';
      baseAngle = Math.PI / 2; // Follows D
      isCubieActive = (_x, y) => y <= 0;
      break;
    case 'f':
      axis = 'z';
      baseAngle = -Math.PI / 2; // Follows F
      isCubieActive = (_x, _y, z) => z >= 0;
      break;
    case 'b':
      axis = 'z';
      baseAngle = Math.PI / 2; // Follows B
      isCubieActive = (_x, _y, z) => z <= 0;
      break;

    default:
      return null;
  }

  let targetAngle = baseAngle;
  if (isPrime) {
    targetAngle = -baseAngle;
  } else if (isDouble) {
    targetAngle = baseAngle * 2;
  }

  return {
    base,
    axis,
    targetAngle,
    isCubieActive,
  };
}
