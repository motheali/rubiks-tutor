/**
 * Color names mapping for human-readable error descriptions.
 */
export const COLOR_NAMES = {
  U: 'White (Up)',
  R: 'Red (Right)',
  F: 'Green (Front)',
  D: 'Yellow (Down)',
  L: 'Orange (Left)',
  B: 'Blue (Back)',
};

/**
 * Expected center sticker colors for standard Rubik's Cube orientation:
 * - Up (U): index 4 -> 'U'
 * - Right (R): index 13 -> 'R'
 * - Front (F): index 22 -> 'F'
 * - Down (D): index 31 -> 'D'
 * - Left (L): index 40 -> 'L'
 * - Back (B): index 49 -> 'B'
 */
export const CENTER_INDICES = {
  4: { key: 'U', face: 'Up' },
  13: { key: 'R', face: 'Right' },
  22: { key: 'F', face: 'Front' },
  31: { key: 'D', face: 'Down' },
  40: { key: 'L', face: 'Left' },
  49: { key: 'B', face: 'Back' },
};

/**
 * Opposing color pairs on a standard Western Rubik's Cube:
 * - Up (White) <-> Down (Yellow)
 * - Front (Green) <-> Back (Blue)
 * - Right (Red) <-> Left (Orange)
 */
export const OPPOSING_PAIRS = new Set([
  'UD', 'DU',
  'FB', 'BF',
  'RL', 'LR',
]);

/**
 * 12 Edge Positions and their 2 constituent sticker indices:
 */
export const EDGES = [
  { name: 'UF (Up-Front)', indices: [7, 19] },
  { name: 'UR (Up-Right)', indices: [5, 10] },
  { name: 'UB (Up-Back)', indices: [1, 46] },
  { name: 'UL (Up-Left)', indices: [3, 37] },
  { name: 'DF (Down-Front)', indices: [28, 25] },
  { name: 'DR (Down-Right)', indices: [32, 16] },
  { name: 'DB (Down-Back)', indices: [34, 52] },
  { name: 'DL (Down-Left)', indices: [30, 43] },
  { name: 'FR (Front-Right)', indices: [23, 12] },
  { name: 'FL (Front-Left)', indices: [21, 41] },
  { name: 'BR (Back-Right)', indices: [48, 14] },
  { name: 'BL (Back-Left)', indices: [50, 39] },
];

/**
 * 8 Corner Positions and their 3 constituent sticker indices:
 */
export const CORNERS = [
  { name: 'UFR (Up-Front-Right)', indices: [8, 20, 9] },
  { name: 'UFL (Up-Front-Left)', indices: [6, 18, 38] },
  { name: 'UBR (Up-Back-Right)', indices: [2, 45, 11] },
  { name: 'UBL (Up-Back-Left)', indices: [0, 47, 36] },
  { name: 'DFR (Down-Front-Right)', indices: [29, 26, 15] },
  { name: 'DFL (Down-Front-Left)', indices: [27, 24, 44] },
  { name: 'DBR (Down-Back-Right)', indices: [35, 51, 17] },
  { name: 'DBL (Down-Back-Left)', indices: [33, 53, 42] },
];

/**
 * Validates whether a 54-character cube state string represents a physically possible cube.
 *
 * Checks:
 * 1. Length and Character Set
 * 2. Center Lock: Indices 4, 13, 22, 31, 40, 49 match expected center colors
 * 3. Color Counts: Each of the 6 colors appears exactly 9 times
 * 4. Edge Adjacency: No edge contains identical or opposing color pairs
 * 5. Corner Adjacency: No corner contains duplicate colors or opposing color pairs
 *
 * @param {string} cubeString 54-character state string
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateCubeState(cubeString) {
  const errors = [];

  if (!cubeString || typeof cubeString !== 'string') {
    return { isValid: false, errors: ['Cube state is empty or not a string.'] };
  }

  if (cubeString.length !== 54) {
    errors.push(`Cube state must be exactly 54 characters (found ${cubeString.length}).`);
    return { isValid: false, errors };
  }

  // 1. Center Lock Check
  for (const [indexStr, expected] of Object.entries(CENTER_INDICES)) {
    const idx = Number(indexStr);
    const char = cubeString[idx];
    if (char !== expected.key) {
      errors.push(
        `Center tile for ${expected.face} face (index ${idx}) must be '${expected.key}', but found '${char}'.`
      );
    }
  }

  // 2. Color Counts Check
  const VALID_COLORS = ['U', 'R', 'F', 'D', 'L', 'B'];
  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
  let invalidCharsCount = 0;

  for (let i = 0; i < 54; i++) {
    const char = cubeString[i];
    if (counts[char] !== undefined) {
      counts[char]++;
    } else {
      invalidCharsCount++;
    }
  }

  if (invalidCharsCount > 0) {
    errors.push(`Cube contains ${invalidCharsCount} unpainted/invalid sticker(s).`);
  }

  for (const color of VALID_COLORS) {
    if (counts[color] !== 9) {
      const colorLabel = COLOR_NAMES[color] || color;
      errors.push(`${colorLabel} has ${counts[color]} stickers (expected exactly 9).`);
    }
  }

  // Helper to test opposing pair
  const isOpposing = (c1, c2) => OPPOSING_PAIRS.has(c1 + c2);

  // 3. Edge Adjacency Check
  for (const edge of EDGES) {
    const [i1, i2] = edge.indices;
    const c1 = cubeString[i1];
    const c2 = cubeString[i2];

    if (VALID_COLORS.includes(c1) && VALID_COLORS.includes(c2)) {
      if (c1 === c2) {
        errors.push(`Edge ${edge.name} has identical colors (${COLOR_NAMES[c1] || c1}).`);
      } else if (isOpposing(c1, c2)) {
        errors.push(
          `Edge ${edge.name} has opposing colors (${COLOR_NAMES[c1] || c1} and ${COLOR_NAMES[c2] || c2}).`
        );
      }
    }
  }

  // 4. Corner Adjacency Check
  for (const corner of CORNERS) {
    const [i1, i2, i3] = corner.indices;
    const c1 = cubeString[i1];
    const c2 = cubeString[i2];
    const c3 = cubeString[i3];

    if (
      VALID_COLORS.includes(c1) &&
      VALID_COLORS.includes(c2) &&
      VALID_COLORS.includes(c3)
    ) {
      if (c1 === c2 || c1 === c3 || c2 === c3) {
        errors.push(`Corner ${corner.name} contains duplicate colors.`);
      } else if (isOpposing(c1, c2) || isOpposing(c1, c3) || isOpposing(c2, c3)) {
        errors.push(`Corner ${corner.name} contains mutually opposing colors.`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

