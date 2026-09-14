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

export class Cube {
  /**
   * Initializes the cube state.
   * @param {string} [initialState=SOLVED_STATE]
   */
  constructor(initialState = SOLVED_STATE) {
    this.state = initialState;
  }

  /**
   * Resets the cube to the solved state.
   * @returns {string}
   */
  reset() {
    this.state = SOLVED_STATE;
    return this.state;
  }

  /**
   * Turns the Up (U) face clockwise.
   * - Primary face: U (0-8) rotated clockwise.
   * - Adjacent edges: F top, R top, B top, L top shifted clockwise (F -> L -> B -> R -> F).
   * @returns {string} The updated 54-character state string.
   */
  turnU() {
    const arr = this.state.split('');
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

    this.state = arr.join('');
    return this.state;
  }

  /**
   * Turns the Down (D) face clockwise.
   * - Primary face: D (27-35) rotated clockwise.
   * - Adjacent edges: F bottom, R bottom, B bottom, L bottom shifted clockwise (F -> R -> B -> L -> F).
   * @returns {string} The updated 54-character state string.
   */
  turnD() {
    const arr = this.state.split('');
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

    this.state = arr.join('');
    return this.state;
  }

  /**
   * Turns the Front (F) face clockwise.
   * - Primary face: F (18-26) rotated clockwise.
   * - Adjacent edges: U bottom, R left col, D top, L right col shifted clockwise.
   * @returns {string} The updated 54-character state string.
   */
  turnF() {
    const arr = this.state.split('');
    rotateFaceClockwise(arr, 18);

    const temp = [arr[6], arr[7], arr[8]]; // U bottom row
    // U bottom <- L right col (reversed)
    arr[6] = arr[44];
    arr[7] = arr[41];
    arr[8] = arr[38];

    // L right col <- D top row
    arr[38] = arr[27];
    arr[41] = arr[28];
    arr[44] = arr[29];

    // D top row <- R left col (reversed)
    arr[27] = arr[15];
    arr[28] = arr[12];
    arr[29] = arr[9];

    // R left col <- U bottom row (temp)
    arr[9] = temp[0];
    arr[12] = temp[1];
    arr[15] = temp[2];

    this.state = arr.join('');
    return this.state;
  }

  /**
   * Turns the Back (B) face clockwise.
   * - Primary face: B (45-53) rotated clockwise.
   * - Adjacent edges: U top row, L left col, D bottom row, R right col shifted clockwise.
   * @returns {string} The updated 54-character state string.
   */
  turnB() {
    const arr = this.state.split('');
    rotateFaceClockwise(arr, 45);

    const temp = [arr[0], arr[1], arr[2]]; // U top row
    // U top row <- R right col
    arr[0] = arr[11];
    arr[1] = arr[14];
    arr[2] = arr[17];

    // R right col <- D bottom row (reversed)
    arr[11] = arr[35];
    arr[14] = arr[34];
    arr[17] = arr[33];

    // D bottom row <- L left col
    arr[33] = arr[36];
    arr[34] = arr[39];
    arr[35] = arr[42];

    // L left col <- U top row (temp reversed)
    arr[36] = temp[2];
    arr[39] = temp[1];
    arr[42] = temp[0];

    this.state = arr.join('');
    return this.state;
  }

  /**
   * Turns the Left (L) face clockwise.
   * - Primary face: L (36-44) rotated clockwise.
   * - Adjacent edges: U left col, F left col, D left col, B right col shifted clockwise.
   * @returns {string} The updated 54-character state string.
   */
  turnL() {
    const arr = this.state.split('');
    rotateFaceClockwise(arr, 36);

    const temp = [arr[0], arr[3], arr[6]]; // U left col
    // U left col <- B right col (reversed)
    arr[0] = arr[53];
    arr[3] = arr[50];
    arr[6] = arr[47];

    // B right col <- D left col (reversed)
    arr[47] = arr[33];
    arr[50] = arr[30];
    arr[53] = arr[27];

    // D left col <- F left col
    arr[27] = arr[18];
    arr[30] = arr[21];
    arr[33] = arr[24];

    // F left col <- U left col (temp)
    arr[18] = temp[0];
    arr[21] = temp[1];
    arr[24] = temp[2];

    this.state = arr.join('');
    return this.state;
  }

  /**
   * Turns the Right (R) face clockwise.
   * - Primary face: R (9-17) rotated clockwise.
   * - Adjacent edges: U right col, B left col, D right col, F right col shifted clockwise.
   * @returns {string} The updated 54-character state string.
   */
  turnR() {
    const arr = this.state.split('');
    rotateFaceClockwise(arr, 9);

    const temp = [arr[2], arr[5], arr[8]]; // U right col
    // U right col <- F right col
    arr[2] = arr[20];
    arr[5] = arr[23];
    arr[8] = arr[26];

    // F right col <- D right col
    arr[20] = arr[29];
    arr[23] = arr[32];
    arr[26] = arr[35];

    // D right col <- B left col (reversed)
    arr[29] = arr[51];
    arr[32] = arr[48];
    arr[35] = arr[45];

    // B left col <- U right col (temp reversed)
    arr[45] = temp[2];
    arr[48] = temp[1];
    arr[51] = temp[0];

    this.state = arr.join('');
    return this.state;
  }

  /**
   * Turns the Up (U) face counter-clockwise (U').
   * Executed by performing 3 clockwise U turns.
   * @returns {string} The updated 54-character state string.
   */
  turnUPrime() {
    this.turnU();
    this.turnU();
    return this.turnU();
  }

  /**
   * Turns the Right (R) face counter-clockwise (R').
   * Executed by performing 3 clockwise R turns.
   * @returns {string} The updated 54-character state string.
   */
  turnRPrime() {
    this.turnR();
    this.turnR();
    return this.turnR();
  }

  /**
   * Turns the Front (F) face counter-clockwise (F').
   * Executed by performing 3 clockwise F turns.
   * @returns {string} The updated 54-character state string.
   */
  turnFPrime() {
    this.turnF();
    this.turnF();
    return this.turnF();
  }

  /**
   * Turns the Down (D) face counter-clockwise (D').
   * Executed by performing 3 clockwise D turns.
   * @returns {string} The updated 54-character state string.
   */
  turnDPrime() {
    this.turnD();
    this.turnD();
    return this.turnD();
  }

  /**
   * Turns the Left (L) face counter-clockwise (L').
   * Executed by performing 3 clockwise L turns.
   * @returns {string} The updated 54-character state string.
   */
  turnLPrime() {
    this.turnL();
    this.turnL();
    return this.turnL();
  }

  /**
   * Turns the Back (B) face counter-clockwise (B').
   * Executed by performing 3 clockwise B turns.
   * @returns {string} The updated 54-character state string.
   */
  turnBPrime() {
    this.turnB();
    this.turnB();
    return this.turnB();
  }
}

export default Cube;
