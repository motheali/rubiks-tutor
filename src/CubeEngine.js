/**
 * 54-character string representing a solved Rubik's Cube state.
 * Index Mapping:
 * - Up (U):    0 - 8
 * - Right (R): 9 - 17
 * - Front (F): 18 - 26
 * - Down (D):  27 - 35
 * - Left (L):  36 - 44
 * - Back (B):  45 - 53
 *
 * Each 3x3 face is read left-to-right, top-to-bottom.
 */
export const SOLVED_STATE =
  'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

/**
 * Rotates the 9 stickers of a 3x3 face clockwise in place within the array.
 * Matrix transformation: (r, c) -> (c, 2 - r)
 * [0, 1, 2]       [6, 3, 0]
 * [3, 4, 5]  -->  [7, 4, 1]
 * [6, 7, 8]       [8, 5, 2]
 *
 * @param {string[]} arr
 * @param {number} startIndex
 */
function rotateFaceClockwise(arr, startIndex) {
  const [s0, s1, s2, s3, s4, s5, s6, s7, s8] = arr.slice(
    startIndex,
    startIndex + 9
  );
  arr[startIndex + 0] = s6;
  arr[startIndex + 1] = s3;
  arr[startIndex + 2] = s0;
  arr[startIndex + 3] = s7;
  arr[startIndex + 4] = s4;
  arr[startIndex + 5] = s1;
  arr[startIndex + 6] = s8;
  arr[startIndex + 7] = s5;
  arr[startIndex + 8] = s2;
}

/**
 * Turns the Up (U) face clockwise. Pure function.
 * Creates an independent deep copy of incoming state before swapping indexes.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnU(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  rotateFaceClockwise(arr, 0);

  const temp = [arr[18], arr[19], arr[20]]; // F top row
  arr[18] = arr[9];
  arr[19] = arr[10];
  arr[20] = arr[11];

  arr[9] = arr[45];
  arr[10] = arr[46];
  arr[11] = arr[47];

  arr[45] = arr[36];
  arr[46] = arr[37];
  arr[47] = arr[38];

  arr[36] = temp[0];
  arr[37] = temp[1];
  arr[38] = temp[2];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

/**
 * Turns the Down (D) face clockwise. Pure function.
 * Creates an independent deep copy of incoming state before swapping indexes.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnD(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  rotateFaceClockwise(arr, 27);

  const temp = [arr[24], arr[25], arr[26]]; // F bottom row
  arr[24] = arr[42];
  arr[25] = arr[43];
  arr[26] = arr[44];

  arr[42] = arr[51];
  arr[43] = arr[52];
  arr[44] = arr[53];

  arr[51] = arr[15];
  arr[52] = arr[16];
  arr[53] = arr[17];

  arr[15] = temp[0];
  arr[16] = temp[1];
  arr[17] = temp[2];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

/**
 * Turns the Front (F) face clockwise. Pure function.
 * Creates an independent deep copy of incoming state before swapping indexes.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnF(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  rotateFaceClockwise(arr, 18);

  const temp = [arr[6], arr[7], arr[8]]; // U bottom row
  arr[6] = arr[44];
  arr[7] = arr[41];
  arr[8] = arr[38];

  arr[38] = arr[27];
  arr[41] = arr[28];
  arr[44] = arr[29];

  arr[27] = arr[15];
  arr[28] = arr[12];
  arr[29] = arr[9];

  arr[9] = temp[0];
  arr[12] = temp[1];
  arr[15] = temp[2];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

/**
 * Turns the Back (B) face clockwise. Pure function.
 * Creates an independent deep copy of incoming state before swapping indexes.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnB(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  rotateFaceClockwise(arr, 45);

  const temp = [arr[0], arr[1], arr[2]]; // U top row
  arr[0] = arr[11];
  arr[1] = arr[14];
  arr[2] = arr[17];

  arr[11] = arr[35];
  arr[14] = arr[34];
  arr[17] = arr[33];

  arr[33] = arr[36];
  arr[34] = arr[39];
  arr[35] = arr[42];

  arr[36] = temp[2];
  arr[39] = temp[1];
  arr[42] = temp[0];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

/**
 * Turns the Left (L) face clockwise. Pure function.
 * Creates an independent deep copy of incoming state before swapping indexes.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnL(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  rotateFaceClockwise(arr, 36);

  const temp = [arr[0], arr[3], arr[6]]; // U left col
  arr[0] = arr[53];
  arr[3] = arr[50];
  arr[6] = arr[47];

  arr[47] = arr[33];
  arr[50] = arr[30];
  arr[53] = arr[27];

  arr[27] = arr[18];
  arr[30] = arr[21];
  arr[33] = arr[24];

  arr[18] = temp[0];
  arr[21] = temp[1];
  arr[24] = temp[2];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

/**
 * Turns the Right (R) face clockwise. Pure function.
 * Creates an independent deep copy of incoming state before swapping indexes.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnR(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  rotateFaceClockwise(arr, 9);

  const temp = [arr[2], arr[5], arr[8]]; // U right col
  arr[2] = arr[20];
  arr[5] = arr[23];
  arr[8] = arr[26];

  arr[20] = arr[29];
  arr[23] = arr[32];
  arr[26] = arr[35];

  arr[29] = arr[51];
  arr[32] = arr[48];
  arr[35] = arr[45];

  arr[45] = temp[2];
  arr[48] = temp[1];
  arr[51] = temp[0];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

/**
 * Turns the Up (U) face counter-clockwise (U'). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnUPrime(prevState) {
  return turnU(turnU(turnU(prevState)));
}

/**
 * Turns the Right (R) face counter-clockwise (R'). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnRPrime(prevState) {
  return turnR(turnR(turnR(prevState)));
}

/**
 * Turns the Front (F) face counter-clockwise (F'). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnFPrime(prevState) {
  return turnF(turnF(turnF(prevState)));
}

/**
 * Turns the Down (D) face counter-clockwise (D'). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnDPrime(prevState) {
  return turnD(turnD(turnD(prevState)));
}

/**
 * Turns the Left (L) face counter-clockwise (L'). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnLPrime(prevState) {
  return turnL(turnL(turnL(prevState)));
}

/**
 * Turns the Back (B) face counter-clockwise (B'). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnBPrime(prevState) {
  return turnB(turnB(turnB(prevState)));
}

/**
 * Turns the Equator (E) middle slice clockwise (follows D). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnE(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  const temp = [arr[21], arr[22], arr[23]];
  arr[21] = arr[39];
  arr[22] = arr[40];
  arr[23] = arr[41];

  arr[39] = arr[48];
  arr[40] = arr[49];
  arr[41] = arr[50];

  arr[48] = arr[12];
  arr[49] = arr[13];
  arr[50] = arr[14];

  arr[12] = temp[0];
  arr[13] = temp[1];
  arr[14] = temp[2];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

/**
 * Turns the Equator (E) middle slice counter-clockwise (E'). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnEPrime(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  const temp = [arr[21], arr[22], arr[23]];
  arr[21] = arr[12];
  arr[22] = arr[13];
  arr[23] = arr[14];

  arr[12] = arr[48];
  arr[13] = arr[49];
  arr[14] = arr[50];

  arr[48] = arr[39];
  arr[49] = arr[40];
  arr[50] = arr[41];

  arr[39] = temp[0];
  arr[40] = temp[1];
  arr[41] = temp[2];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

/**
 * Turns the Middle (M) slice downwards (follows L). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnM(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  const temp = [arr[1], arr[4], arr[7]];
  arr[1] = arr[52];
  arr[4] = arr[49];
  arr[7] = arr[46];

  arr[52] = arr[28];
  arr[49] = arr[31];
  arr[46] = arr[34];

  arr[28] = arr[19];
  arr[31] = arr[22];
  arr[34] = arr[25];

  arr[19] = temp[0];
  arr[22] = temp[1];
  arr[25] = temp[2];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

/**
 * Turns the Middle (M) slice upwards (M'). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnMPrime(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  const temp = [arr[1], arr[4], arr[7]];
  arr[1] = arr[19];
  arr[4] = arr[22];
  arr[7] = arr[25];

  arr[19] = arr[28];
  arr[22] = arr[31];
  arr[25] = arr[34];

  arr[28] = arr[52];
  arr[31] = arr[49];
  arr[34] = arr[46];

  arr[52] = temp[0];
  arr[49] = temp[1];
  arr[46] = temp[2];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

/**
 * Turns the Standing (S) slice clockwise (follows F). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnS(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  const temp = [arr[3], arr[4], arr[5]];
  arr[3] = arr[43];
  arr[4] = arr[40];
  arr[5] = arr[37];

  arr[43] = arr[32];
  arr[40] = arr[31];
  arr[37] = arr[30];

  arr[32] = arr[10];
  arr[31] = arr[13];
  arr[30] = arr[16];

  arr[10] = temp[0];
  arr[13] = temp[1];
  arr[16] = temp[2];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

/**
 * Turns the Standing (S) slice counter-clockwise (S'). Pure function.
 * @param {string|string[]|Cube} prevState
 * @returns {string|string[]|Cube}
 */
export function turnSPrime(prevState) {
  const arr = Array.isArray(prevState)
    ? JSON.parse(JSON.stringify(prevState))
    : (typeof prevState === 'object' && prevState !== null && 'state' in prevState ? prevState.state : prevState || SOLVED_STATE).split('');

  const temp = [arr[3], arr[4], arr[5]];
  arr[3] = arr[10];
  arr[4] = arr[13];
  arr[5] = arr[16];

  arr[10] = arr[32];
  arr[13] = arr[31];
  arr[16] = arr[30];

  arr[32] = arr[43];
  arr[31] = arr[40];
  arr[30] = arr[37];

  arr[43] = temp[0];
  arr[40] = temp[1];
  arr[37] = temp[2];

  if (Array.isArray(prevState)) return arr;
  const resultStr = arr.join('');
  return typeof prevState === 'object' && prevState !== null && 'state' in prevState
    ? new Cube(resultStr)
    : resultStr;
}

// 2-Layer Wide Turns
export function turnd(prevState) {
  return turnE(turnD(prevState));
}

export function turndPrime(prevState) {
  return turnEPrime(turnDPrime(prevState));
}

export function turnu(prevState) {
  return turnEPrime(turnU(prevState));
}

export function turnuPrime(prevState) {
  return turnE(turnUPrime(prevState));
}

export function turnr(prevState) {
  return turnMPrime(turnR(prevState));
}

export function turnrPrime(prevState) {
  return turnM(turnRPrime(prevState));
}

export function turnl(prevState) {
  return turnM(turnL(prevState));
}

export function turnlPrime(prevState) {
  return turnMPrime(turnLPrime(prevState));
}

export function turnf(prevState) {
  return turnS(turnF(prevState));
}

export function turnfPrime(prevState) {
  return turnSPrime(turnFPrime(prevState));
}

export function turnb(prevState) {
  return turnSPrime(turnB(prevState));
}

export function turnbPrime(prevState) {
  return turnS(turnBPrime(prevState));
}

export class Cube {
  /**
   * Initializes the cube state.
   * @param {string|Cube} [initialState=SOLVED_STATE]
   */
  constructor(initialState = SOLVED_STATE) {
    this.state =
      typeof initialState === 'object' && initialState !== null && 'state' in initialState
        ? initialState.state
        : initialState || SOLVED_STATE;
  }

  /**
   * Resets the cube to the solved state.
   * @returns {string}
   */
  reset() {
    this.state = SOLVED_STATE;
    return this.state;
  }

  turnU() {
    return turnU(this);
  }

  turnD() {
    return turnD(this);
  }

  turnF() {
    return turnF(this);
  }

  turnB() {
    return turnB(this);
  }

  turnL() {
    return turnL(this);
  }

  turnR() {
    return turnR(this);
  }

  turnUPrime() {
    return turnUPrime(this);
  }

  turnDPrime() {
    return turnDPrime(this);
  }

  turnFPrime() {
    return turnFPrime(this);
  }

  turnBPrime() {
    return turnBPrime(this);
  }

  turnLPrime() {
    return turnLPrime(this);
  }

  turnRPrime() {
    return turnRPrime(this);
  }

  turnd() {
    return turnd(this);
  }

  turndPrime() {
    return turndPrime(this);
  }

  turnu() {
    return turnu(this);
  }

  turnuPrime() {
    return turnuPrime(this);
  }

  turnr() {
    return turnr(this);
  }

  turnrPrime() {
    return turnrPrime(this);
  }

  turnl() {
    return turnl(this);
  }

  turnlPrime() {
    return turnlPrime(this);
  }

  turnf() {
    return turnf(this);
  }

  turnfPrime() {
    return turnfPrime(this);
  }

  turnb() {
    return turnb(this);
  }

  turnbPrime() {
    return turnbPrime(this);
  }

  turnM() {
    return turnM(this);
  }

  turnMPrime() {
    return turnMPrime(this);
  }

  turnE() {
    return turnE(this);
  }

  turnEPrime() {
    return turnEPrime(this);
  }

  turnS() {
    return turnS(this);
  }

  turnSPrime() {
    return turnSPrime(this);
  }
}

export default Cube;
