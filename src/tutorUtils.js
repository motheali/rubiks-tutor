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
 * Purely maps a move notation (e.g. "U", "R'", "F2", "d", "dprime", "r", "M") to the corresponding CubeEngine methods.
 * Returns a NEW CubeEngine instance without mutating the incoming instance.
 * Supports:
 * - Standard uppercase face turns: U, R, F, D, L, B
 * - Lowercase 2-layer wide turns: u, r, f, d, l, b
 * - Slice moves: M, E, S
 * - Primes (' or prime) and Double turns (2)
 *
 * @param {CubeEngine} currentCube
 * @param {string} move
 * @returns {CubeEngine}
 */
export function applyMove(currentCube, move) {
  if (!move || !currentCube) return currentCube;
  const trimmed = move.trim();
  if (!trimmed) return currentCube;

  const isPrime = trimmed.includes("'") || trimmed.toLowerCase().includes('prime');
  const isDouble = trimmed.includes('2');
  const firstChar = trimmed[0];

  // 1. Standard uppercase face turns: U, R, F, D, L, B
  if (['U', 'R', 'F', 'D', 'L', 'B'].includes(firstChar)) {
    const methodName = isPrime ? `turn${firstChar}Prime` : `turn${firstChar}`;
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
  }

  // 2. Lowercase 2-layer wide turns: u, r, f, d, l, b
  if (['u', 'r', 'f', 'd', 'l', 'b'].includes(firstChar)) {
    const methodName = isPrime ? `turn${firstChar}Prime` : `turn${firstChar}`;
    let next = typeof currentCube[methodName] === 'function' ? currentCube[methodName]() : null;
    if (next) {
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
    }
  }

  // 3. Slice moves: M, E, S
  const upperChar = firstChar.toUpperCase();
  if (['M', 'E', 'S'].includes(upperChar)) {
    const methodName = isPrime ? `turn${upperChar}Prime` : `turn${upperChar}`;
    let next = typeof currentCube[methodName] === 'function' ? currentCube[methodName]() : null;
    if (next) {
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
    }
  }

  // 4. Universal solver RubiksCube fallback
  try {
    const solverStr = toSolverFormat(currentCube.state);
    const rc = new RubiksCube(solverStr);
    rc.move(trimmed);
    const resState = fromSolverFormat(rc.toString());
    if (resState && resState.length === 54 && resState !== currentCube.state) {
      return new CubeEngine(resState);
    }
  } catch (err) {
    console.error(`applyMove: unrecognized move "${move}":`, err);
  }

  return currentCube;
}
