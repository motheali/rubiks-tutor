import { Cube as CubeEngine } from '../CubeEngine.js';
import { applyMove } from '../tutorUtils.js';

/**
 * Axis mapping for the 6 faces to prevent redundant opposite-face scrambles.
 * Y axis: U (Up), D (Down)
 * X axis: R (Right), L (Left)
 * Z axis: F (Front), B (Back)
 */
const FACE_AXIS = {
  U: 'Y',
  D: 'Y',
  R: 'X',
  L: 'X',
  F: 'Z',
  B: 'Z',
};

const FACES = ['U', 'D', 'L', 'R', 'F', 'B'];
const MODIFIERS = ['', "'", '2'];

/**
 * Generates a random WCA-compliant 20-move scramble sequence.
 * Enforces two constraints:
 * 1. No two consecutive moves on the same face (e.g. no R followed by R').
 * 2. No three consecutive moves on the same axis (e.g. no R L R).
 *
 * @param {number} [moveCount=20] - Number of moves in the scramble
 * @returns {string} Space-separated scramble sequence (e.g. "R2 U B' R F2 D ...")
 */
export function generateWcaScramble(moveCount = 20) {
  const moves = [];
  let prevFace = null;
  let prevAxis = null;
  let secondPrevAxis = null;

  while (moves.length < moveCount) {
    const face = FACES[Math.floor(Math.random() * FACES.length)];
    const axis = FACE_AXIS[face];

    // Constraint 1: Face cannot be the same as immediate previous move
    if (face === prevFace) {
      continue;
    }

    // Constraint 2: Cannot have consecutive opposite moves on the same axis (e.g. R L R)
    if (axis === prevAxis && axis === secondPrevAxis) {
      continue;
    }

    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
    moves.push(`${face}${modifier}`);

    secondPrevAxis = prevAxis;
    prevAxis = axis;
    prevFace = face;
  }

  return moves.join(' ');
}

/**
 * Applies a space-separated scramble sequence to a Rubik's cube engine instance.
 *
 * @param {string} scrambleString - Scramble sequence
 * @param {CubeEngine} [initialCube=new CubeEngine()] - Base cube instance (solved by default)
 * @returns {CubeEngine} Scrambled CubeEngine instance
 */
export function applyScramble(scrambleString, initialCube = new CubeEngine()) {
  if (!scrambleString || typeof scrambleString !== 'string') {
    return initialCube;
  }

  const moves = scrambleString.trim().split(/\s+/).filter(Boolean);
  let currentCube = initialCube;

  for (const move of moves) {
    currentCube = applyMove(currentCube, move);
  }

  return currentCube;
}

/**
 * Formats milliseconds into high-legibility digital timer strings:
 * - Sub-minute: SS.cs (e.g. "9.42", "15.08")
 * - 1+ minutes: M:SS.cs (e.g. "1:05.42")
 * - Handles WCA penalties: "+2" (adds 2000ms with indicator) and "DNF"
 *
 * @param {number|null} ms - Elapsed time in milliseconds
 * @param {'+2'|'DNF'|null} [penalty=null] - WCA penalty flag
 * @returns {string} Formatted time string
 */
export function formatTime(ms, penalty = null) {
  if (penalty === 'DNF') {
    return 'DNF';
  }

  if (ms === null || ms === undefined || isNaN(ms)) {
    return '0.00';
  }

  const effectiveMs = penalty === '+2' ? Math.max(0, ms + 2000) : Math.max(0, ms);
  const totalSeconds = effectiveMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centis = Math.floor((effectiveMs % 1000) / 10);

  const formattedCentis = centis.toString().padStart(2, '0');
  const formattedSeconds =
    minutes > 0 ? seconds.toString().padStart(2, '0') : seconds.toString();

  const baseFormatted =
    minutes > 0
      ? `${minutes}:${formattedSeconds}.${formattedCentis}`
      : `${formattedSeconds}.${formattedCentis}`;

  return penalty === '+2' ? `${baseFormatted} (+2)` : baseFormatted;
}
