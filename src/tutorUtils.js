import solverModule from 'rubiks-cube-solver';
import { Cube as CubeEngine } from './CubeEngine.js';

const solveCube = solverModule.default || solverModule;
const RubiksCube = solveCube.RubiksCube || solverModule.RubiksCube;

/**
 * Converts our URFDLB uppercase cube state into rubiks-cube-solver FRUDLB lowercase format.
 * rubiks-cube-solver expects: Front, Right, Up, Down, Left, Back
 * @param {string} state
 * @returns {string}
 */
export function toSolverFormat(state) {
  if (!state || state.length !== 54) return state;
  const U = state.substring(0, 9);
  const R = state.substring(9, 18);
  const F = state.substring(18, 27);
  const D = state.substring(27, 36);
  const L = state.substring(36, 45);
  const B = state.substring(45, 54);
  return `${F}${R}${U}${D}${L}${B}`.toLowerCase();
}

/**
 * Converts rubiks-cube-solver FRUDLB lowercase format back to our URFDLB uppercase state.
 * @param {string} solverState
 * @returns {string}
 */
export function fromSolverFormat(solverState) {
  const f = solverState.slice(0, 9);
  const r = solverState.slice(9, 18);
  const u = solverState.slice(18, 27);
  const d = solverState.slice(27, 36);
  const l = solverState.slice(36, 45);
  const b = solverState.slice(45, 54);
  return (u + r + f + d + l + b).toUpperCase();
}

/**
 * Inverses a standard move notation:
 * 'R' -> "R'"
 * "R'" -> 'R'
 * 'R2' -> 'R2' (180-degree turn is its own inverse)
 * @param {string} move
 * @returns {string}
 */
export function getInverseMove(move) {
  if (!move) return '';
  const trimmed = move.trim();
  if (trimmed.includes('2')) {
    return trimmed;
  }
  if (trimmed.includes("'")) {
    return trimmed.replace("'", '');
  }
  if (trimmed.toLowerCase().includes('prime')) {
    return trimmed.replace(/prime/i, '');
  }
  return `${trimmed}'`;
}

/**
 * Purely maps a standard move notation (e.g. "U", "R'", "F2") to the corresponding CubeEngine methods.
 * Returns a NEW CubeEngine instance without mutating the incoming instance.
 * For wide moves (e.g. "r", "d", "b") or slice moves, uses RubiksCube to accurately update state.
 * @param {CubeEngine} currentCube
 * @param {string} move
 * @returns {CubeEngine}
 */
export function applyMove(currentCube, move) {
  if (!move) return currentCube;
  const isPrime = move.includes("'") || move.toLowerCase().includes('prime');
  const isDouble = move.includes('2');
  const baseLetter = move[0]?.toUpperCase();
  const isStandardFace = ['U', 'R', 'F', 'D', 'L', 'B'].includes(baseLetter);

  if (isStandardFace) {
    const methodName = isPrime ? `turn${baseLetter}Prime` : `turn${baseLetter}`;
    let next = typeof currentCube[methodName] === 'function' ? currentCube[methodName]() : currentCube;
    if (!(next instanceof CubeEngine)) {
      next = new CubeEngine(next?.state || next);
    }
    if (isDouble) {
      next = typeof next[methodName] === 'function' ? next[methodName]() : next;
      if (!(next instanceof CubeEngine)) {
        next = new CubeEngine(next?.state || next);
      }
    }
    return next;
  } else {
    try {
      const solverStr = toSolverFormat(currentCube.state);
      const rc = new RubiksCube(solverStr);
      rc.move(move);
      return new CubeEngine(fromSolverFormat(rc.toString()));
    } catch {
      return currentCube;
    }
  }
}
