const FACE_NAMES = ['U', 'D', 'F', 'B', 'L', 'R']

/**
 * Turns the upper face clockwise, following standard Singmaster U notation.
 *
 * A cube state is an object with U, D, F, B, L, and R keys. Each value is a
 * 3 x 3 array of sticker values. The supplied state is updated in place and
 * returned so turns can be chained.
 *
 * @param {Record<string, unknown[][]>} state
 * @returns {Record<string, unknown[][]>}
 */
export function TurnU(state) {
  assertCubeState(state);
  const newState = JSON.parse(JSON.stringify(state));

  newState.U = rotateFaceClockwise(newState.U);

  const frontTop = [...newState.F[0]];

  newState.F[0] = [...newState.R[0]];
  newState.R[0] = [...newState.B[0]];
  newState.B[0] = [...newState.L[0]];
  newState.L[0] = frontTop;

  return newState;
}

function rotateFaceClockwise(face) {
  return face.map((_, row) => face.map((column) => column[row]).reverse())
}

function assertCubeState(state) {
  for (const faceName of FACE_NAMES) {
    const face = state?.[faceName]

    if (
      !Array.isArray(face) ||
      face.length !== 3 ||
      face.some((row) => !Array.isArray(row) || row.length !== 3)
    ) {
      throw new TypeError(
        `Expected state.${faceName} to be a 3 x 3 array of stickers.`,
      )
    }
  }
}
