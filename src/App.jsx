import solverModule from 'rubiks-cube-solver';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Cube as CubeEngine, SOLVED_STATE } from './CubeEngine';
import { validateCubeState } from './CubeValidator';
import Cube3D from './components/Cube3D';
import './App.css';

const solveCube = solverModule.default || solverModule;
const RubiksCube = solveCube.RubiksCube || solverModule.RubiksCube;

/**
 * Converts our URFDLB uppercase cube state into rubiks-cube-solver FRUDLB lowercase format.
 * rubiks-cube-solver expects: Front, Right, Up, Down, Left, Back
 * @param {string} state
 * @returns {string}
 */
function toSolverFormat(state) {
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
function fromSolverFormat(solverState) {
  const f = solverState.slice(0, 9);
  const r = solverState.slice(9, 18);
  const u = solverState.slice(18, 27);
  const d = solverState.slice(27, 36);
  const l = solverState.slice(36, 45);
  const b = solverState.slice(45, 54);
  return (u + r + f + d + l + b).toUpperCase();
}

/**
 * Maps a standard move notation (e.g. "U", "R'", "Rprime", "F2") to the corresponding CubeEngine methods.
 * For wide moves (e.g. "r", "d", "b") or slice moves, uses RubiksCube to accurately update state.
 * @param {CubeEngine} cubeInstance
 * @param {string} move
 */
function executeMove(cubeInstance, move) {
  if (!move) return;
  const isPrime = move.includes("'") || move.toLowerCase().includes('prime');
  const isDouble = move.includes('2');
  const baseLetter = move[0];
  const isStandardFace = ['U', 'R', 'F', 'D', 'L', 'B'].includes(baseLetter);

  if (isStandardFace) {
    const methodName = isPrime ? `turn${baseLetter}Prime` : `turn${baseLetter}`;
    if (isDouble) {
      const r1 = cubeInstance[methodName]?.();
      const s1 = r1 instanceof CubeEngine ? r1.state : r1;
      const r2 = r1?.[methodName]?.() || new CubeEngine(s1)[methodName]?.();
      cubeInstance.state = r2 instanceof CubeEngine ? r2.state : r2;
    } else {
      const res = cubeInstance[methodName]?.();
      cubeInstance.state = res instanceof CubeEngine ? res.state : res;
    }
  } else {
    try {
      const solverStr = toSolverFormat(cubeInstance.state);
      const rc = new RubiksCube(solverStr);
      rc.move(move);
      cubeInstance.state = fromSolverFormat(rc.toString());
    } catch {
      // Fallback
    }
  }
}

/**
 * Curated Aesthetic Palette for Rubik's Cube Tiles:
 * White:  #EEEEEE
 * Red:    #D32F2F (Muted Ruby)
 * Green:  #388E3C (Emerald)
 * Yellow: #FBC02D (Gold)
 * Orange: #F57C00 (Terracotta)
 * Blue:   #1976D2 (Sapphire)
 */
const TILE_COLORS = {
  U: '#EEEEEE',
  R: '#D32F2F',
  F: '#388E3C',
  D: '#FBC02D',
  L: '#F57C00',
  B: '#1976D2',
  X: '#222226',
};

/**
 * Interactive Paint Brush Color Palette Definition
 */
const PALETTE_SWATCHES = [
  { key: 'U', name: 'White', color: TILE_COLORS.U },
  { key: 'R', name: 'Red', color: TILE_COLORS.R },
  { key: 'F', name: 'Green', color: TILE_COLORS.F },
  { key: 'D', name: 'Yellow', color: TILE_COLORS.D },
  { key: 'L', name: 'Orange', color: TILE_COLORS.L },
  { key: 'B', name: 'Blue', color: TILE_COLORS.B },
];

/**
 * 2D Flattened Cross Net Face Definitions:
 * CSS Grid layout:
 *   . U . .
 *   L F R B
 *   . D . .
 */
const CUBE_FACES = [
  { key: 'U', name: 'Up', area: 'U', startIndex: 0 },
  { key: 'L', name: 'Left', area: 'L', startIndex: 36 },
  { key: 'F', name: 'Front', area: 'F', startIndex: 18 },
  { key: 'R', name: 'Right', area: 'R', startIndex: 9 },
  { key: 'B', name: 'Back', area: 'B', startIndex: 45 },
  { key: 'D', name: 'Down', area: 'D', startIndex: 27 },
];

/**
 * Control Panel Configuration for 6 Clockwise Turns
 */
const MOVE_BUTTONS = [
  { key: 'turnU', label: 'U', name: 'Up', shortcut: 'U', color: TILE_COLORS.U },
  { key: 'turnR', label: 'R', name: 'Right', shortcut: 'R', color: TILE_COLORS.R },
  { key: 'turnF', label: 'F', name: 'Front', shortcut: 'F', color: TILE_COLORS.F },
  { key: 'turnD', label: 'D', name: 'Down', shortcut: 'D', color: TILE_COLORS.D },
  { key: 'turnL', label: 'L', name: 'Left', shortcut: 'L', color: TILE_COLORS.L },
  { key: 'turnB', label: 'B', name: 'Back', shortcut: 'B', color: TILE_COLORS.B },
];

/**
 * Control Panel Configuration for 6 Counter-Clockwise (Prime) Turns
 */
const PRIME_MOVE_BUTTONS = [
  { key: 'turnUPrime', label: "U'", name: 'Up', shortcut: 'Shift+U', color: TILE_COLORS.U },
  { key: 'turnRPrime', label: "R'", name: 'Right', shortcut: 'Shift+R', color: TILE_COLORS.R },
  { key: 'turnFPrime', label: "F'", name: 'Front', shortcut: 'Shift+F', color: TILE_COLORS.F },
  { key: 'turnDPrime', label: "D'", name: 'Down', shortcut: 'Shift+D', color: TILE_COLORS.D },
  { key: 'turnLPrime', label: "L'", name: 'Left', shortcut: 'Shift+L', color: TILE_COLORS.L },
  { key: 'turnBPrime', label: "B'", name: 'Back', shortcut: 'Shift+B', color: TILE_COLORS.B },
];

/**
 * Fixed Center Indices for standard Rubik's Cube orientation:
 * U (4), R (13), F (22), D (31), L (40), B (49)
 */
const LOCKED_CENTER_INDICES = new Set([4, 13, 22, 31, 40, 49]);

export default function App() {
  // Initialize Cube engine in React useState hook
  const [cube, setCube] = useState(() => new CubeEngine());
  const [moveCount, setMoveCount] = useState(0);
  const [activeBrush, setActiveBrush] = useState('U'); // Default 'U' (White)
  const [isEditMode, setIsEditMode] = useState(false);

  // Auto-playback solver states
  const [solutionMoves, setSolutionMoves] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isSolving, setIsSolving] = useState(false);
  const [solverStatus, setSolverStatus] = useState('');
  const [solverError, setSolverError] = useState('');
  const setUIError = setSolverError;
  const isCancelledRef = useRef(false);

  // Ref-based locks to synchronously block rapid speed-cubing inputs and prevent race conditions
  const isAnimatingRef = useRef(false);
  const isSolvingRef = useRef(false);
  const isEditModeRef = useRef(false);

  // Keep solver and edit mode refs synchronized with React state
  useEffect(() => {
    isSolvingRef.current = isSolving;
  }, [isSolving]);

  useEffect(() => {
    isEditModeRef.current = isEditMode;
  }, [isEditMode]);

  const stateString = cube.state;

  // Real-time cube physical state validation
  const validation = useMemo(() => validateCubeState(stateString), [stateString]);

  // Live count of each color in current state string
  const colorCounts = useMemo(() => {
    const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
    for (let i = 0; i < stateString.length; i++) {
      const char = stateString[i];
      if (counts[char] !== undefined) {
        counts[char]++;
      }
    }
    return counts;
  }, [stateString]);

  // Execute turn on Cube engine and update React state using functional update
  const handleTurn = useCallback((turnFunction) => {
    if (isSolvingRef.current || isAnimatingRef.current || isEditModeRef.current) return;
    setCube((prevCube) => {
      if (typeof prevCube[turnFunction] === 'function') {
        const next = prevCube[turnFunction]();
        return next instanceof CubeEngine ? next : new CubeEngine(next);
      }
      return prevCube;
    });
    setMoveCount((count) => count + 1);
  }, []);

  // Bulletproof Speed-Cubing Keyboard Controls
  // Functional updates, ref-based locks, empty dependency array [], strict cleanup
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 1. Command Key Trap: prevent Cmd+R / Ctrl+R page refreshes and OS shortcuts from turning the cube
      if (event.metaKey || event.ctrlKey) {
        return;
      }

      // 2. Input Focus Trap: do not execute moves if user is focused inside an input or textarea
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      // 3. Edit Mode Guardrail: do not execute moves while in 2D painting/editing mode (ref-based lock)
      if (isEditModeRef.current) {
        return;
      }

      // 4. Solver Lock Guardrail: do not execute moves while auto-solver playback animation is running (ref-based lock)
      if (isSolvingRef.current) {
        return;
      }

      // 5. Animation Lock Guardrail: do not execute moves while 3D rotation animation is in progress (ref-based lock)
      if (isAnimatingRef.current) {
        return;
      }

      // 6. Mapping: r, l, u, d, f, b (case-insensitive) to respective face rotation functions
      const key = event.key.toLowerCase();
      const KEY_TO_FACE = {
        r: 'R',
        l: 'L',
        u: 'U',
        d: 'D',
        f: 'F',
        b: 'B',
      };

      const face = KEY_TO_FACE[key];
      if (!face) {
        return;
      }

      // Valid speed-cubing move key pressed
      event.preventDefault();

      // Shift key triggers Prime (counter-clockwise) version of the move
      const turnFunction = event.shiftKey ? `turn${face}Prime` : `turn${face}`;

      // Functional state update ensures rapid speed-cubing moves never encounter stale state closures
      setCube((prevCube) => {
        if (typeof prevCube[turnFunction] === 'function') {
          const next = prevCube[turnFunction]();
          return next instanceof CubeEngine ? next : new CubeEngine(next);
        }
        return prevCube;
      });
      setMoveCount((count) => count + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Reset to solved state
  const handleReset = () => {
    isCancelledRef.current = true;
    isSolvingRef.current = false;
    isAnimatingRef.current = false;
    setIsSolving(false);
    setSolutionMoves([]);
    setCurrentMoveIndex(-1);
    setSolverStatus('');
    setSolverError('');
    cube.reset();
    setCube(new CubeEngine(cube.state));
    setMoveCount(0);
  };

  // Set cube state to blank canvas, preserving locked physical centers
  const handleClearCube = () => {
    isCancelledRef.current = true;
    isSolvingRef.current = false;
    isAnimatingRef.current = false;
    setIsSolving(false);
    setSolutionMoves([]);
    setCurrentMoveIndex(-1);
    setSolverStatus('');
    setSolverError('');
    const blankArr = Array(54).fill('X');
    blankArr[4] = 'U';
    blankArr[13] = 'R';
    blankArr[22] = 'F';
    blankArr[31] = 'D';
    blankArr[40] = 'L';
    blankArr[49] = 'B';
    setCube(new CubeEngine(blankArr.join('')));
    setMoveCount(0);
  };

  // Paint sticker at index with current activeBrush color (centers are locked)
  const handleTileClick = (tileIndex) => {
    if (isSolvingRef.current || isAnimatingRef.current) return;
    if (LOCKED_CENTER_INDICES.has(tileIndex)) {
      return; // Center tiles are locked and cannot be overwritten
    }
    const chars = cube.state.split('');
    chars[tileIndex] = activeBrush;
    setCube(new CubeEngine(chars.join('')));
  };

  // Random 20-move scramble including clockwise and prime turns
  const handleScramble = () => {
    if (isSolvingRef.current || isAnimatingRef.current || isEditModeRef.current) return;
    setSolutionMoves([]);
    setCurrentMoveIndex(-1);
    setSolverStatus('');
    setSolverError('');
    const turns = [
      'turnU', 'turnR', 'turnF', 'turnD', 'turnL', 'turnB',
      'turnUPrime', 'turnRPrime', 'turnFPrime', 'turnDPrime', 'turnLPrime', 'turnBPrime',
    ];
    let current = cube;
    for (let i = 0; i < 20; i++) {
      const randomTurn = turns[Math.floor(Math.random() * turns.length)];
      const next = current[randomTurn]?.();
      current = next instanceof CubeEngine ? next : new CubeEngine(next);
    }
    setCube(current);
    setMoveCount((count) => count + 20);
  };

  // Verify physical state, solve with rubiks-cube-solver, and auto-playback solution sequence (400ms per move)
  const handleVerifyAndSolve = async () => {
    if (isSolvingRef.current) return;

    setSolverError('');
    setSolverStatus('Verifying cube state...');

    // 1. Run physical validation first (Tier 1 & Tier 2)
    const validationResult = validateCubeState(cube.state);
    if (!validationResult.isValid) {
      setSolverError(validationResult.errors[0] || 'Invalid physical cube state.');
      setSolverStatus('');
      return;
    }

    // 2. Check if already solved
    if (cube.state === SOLVED_STATE) {
      setSolverStatus('Cube is already solved! 🎉');
      return;
    }

    setIsSolving(true);
    isSolvingRef.current = true;
    setSolverStatus('Calculating optimal solution...');
    isCancelledRef.current = false;

    // Small delay so UI paints the calculating status
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      // Extract faces from our URFDLB format
      const U = cube.state.substring(0, 9);
      const R = cube.state.substring(9, 18);
      const F = cube.state.substring(18, 27);
      const D = cube.state.substring(27, 36);
      const L = cube.state.substring(36, 45);
      const B = cube.state.substring(45, 54);

      // Reorder to library's FRUDLB format and make lowercase
      const solverFormat = `${F}${R}${U}${D}${L}${B}`.toLowerCase();

      // Pass adapter string to solver
      const solution = solveCube(solverFormat);
      const moves = typeof solution === 'string'
        ? solution.trim().split(/\s+/).filter(Boolean)
        : Array.isArray(solution)
        ? solution
        : [];

      if (moves.length === 0) {
        setSolverStatus('Cube is already solved! 🎉');
        setIsSolving(false);
        return;
      }

      setSolutionMoves(moves);
      setSolverStatus(`Solving (${moves.length} moves)...`);

      // 3. Auto-Playback Animation (400ms per move)
      for (let i = 0; i < moves.length; i++) {
        if (isCancelledRef.current) break;

        setCurrentMoveIndex(i);
        const move = moves[i];

        executeMove(cube, move);
        setCube(new CubeEngine(cube.state));
        setMoveCount((count) => count + (move.includes('2') ? 2 : 1));

        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      if (!isCancelledRef.current) {
        setCurrentMoveIndex(-1);
        setSolverStatus(`Solved in ${moves.length} moves! 🎉`);
      }
    } catch (error) {
      console.error("Solver Crash:", error);
      setUIError("Solver Crash: " + (error.message || "Unknown error"));
      setSolverStatus('');
    } finally {
      isSolvingRef.current = false;
      setIsSolving(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header-section">
        <h1 className="header-title">Rubik&apos;s Cube Solver</h1>
        <p className="header-subtitle">Interactive 3D Engine &amp; 2D Net Visualizer</p>
      </header>

      {/* 3D Interactive Rubik's Cube Canvas */}
      <section className="canvas-wrapper" aria-label="3D Rubik's Cube Viewer">
        <Canvas
          camera={{ position: [4.5, 3.5, 5.5], fov: 45 }}
          style={{ width: '100%', height: '100%' }}
        >
          <Cube3D cubeState={stateString} />
        </Canvas>
      </section>

      {/* Solution Sequence & Playback Display */}
      {(solutionMoves.length > 0 || solverStatus || solverError) && (
        <section className="solution-container" aria-label="Solution Playback">
          <div className="solution-header">
            <span>
              {solutionMoves.length > 0
                ? `Solution Sequence (${solutionMoves.length} moves)`
                : 'Solver Status'}
            </span>
            {solverStatus && <span className="solution-status">{solverStatus}</span>}
            {solverError && (
              <span className="solution-status" style={{ color: '#f87171' }}>
                {solverError}
              </span>
            )}
          </div>
          {solutionMoves.length > 0 && (
            <div className="solution-sequence">
              {solutionMoves.map((move, idx) => {
                const isCurrent = idx === currentMoveIndex;
                const isDone = currentMoveIndex !== -1 && idx < currentMoveIndex;
                return (
                  <span
                    key={idx}
                    className={`solution-move ${isCurrent ? 'active-move' : ''} ${
                      isDone ? 'completed-move' : ''
                    }`}
                    title={`Step ${idx + 1}: ${move}`}
                  >
                    {move}
                  </span>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Mode Switcher Toggle */}
      <section className="mode-toggle-section">
        <button
          type="button"
          className={`mode-toggle-btn ${isEditMode ? 'mode-edit-active' : ''}`}
          onClick={() => setIsEditMode((prev) => !prev)}
          disabled={isSolving}
          title="Toggle between Scramble/Play mode and Input/Edit mode"
        >
          {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        </button>
      </section>

      {/* Interactive Color Palette (Paint Brush) */}
      <section className="palette-section" aria-label="Color Palette">
        <span className="palette-heading">
          {isEditMode
            ? `Active Brush: ${PALETTE_SWATCHES.find((s) => s.key === activeBrush)?.name || activeBrush}`
            : 'Color Palette'}
        </span>
        <div className="palette-swatches">
          {PALETTE_SWATCHES.map((swatch) => {
            const isActive = activeBrush === swatch.key;
            const currentCount = colorCounts[swatch.key] || 0;
            return (
              <button
                key={swatch.key}
                type="button"
                className={`palette-swatch ${isActive ? 'active-brush' : ''}`}
                style={{ '--swatch-color': swatch.color }}
                onClick={() => setActiveBrush(swatch.key)}
                title={`Select ${swatch.name} (${swatch.key}) Brush`}
              >
                <span
                  className="swatch-indicator"
                  style={{ backgroundColor: swatch.color, color: swatch.color }}
                />
                <span>{swatch.name} ({swatch.key})</span>
                <span
                  className={`swatch-counter ${
                    currentCount === 9
                      ? 'count-complete'
                      : currentCount > 9
                      ? 'count-overflow'
                      : ''
                  }`}
                  title={`${currentCount} of 9 ${swatch.name} stickers placed`}
                >
                  ({currentCount} / 9)
                </span>
              </button>
            );
          })}
        </div>
        <p className="edit-instructions">
          {isEditMode
            ? 'Select a color swatch above, then click any tile on the 2D Net below to paint it.'
            : 'Toggle "Enter Edit Mode" to paint custom colors onto the 2D Net.'}
        </p>
      </section>

      {/* Centered 2D Cross Net */}
      <main className="grid-container">
        <div className="cube-cross-net" aria-label="Flattened Rubik's Cube Net">
          {CUBE_FACES.map((face) => {
            const stickers = stateString
              .slice(face.startIndex, face.startIndex + 9)
              .split('');

            return (
              <div
                key={face.key}
                className="face-wrapper"
                style={{ gridArea: face.area }}
              >
                <span className="face-name">{face.name} ({face.key})</span>
                <div className="face-grid">
                  {stickers.map((letter, idx) => {
                    const tileIndex = face.startIndex + idx;
                    const isCenter = LOCKED_CENTER_INDICES.has(tileIndex);
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`cube-tile ${
                          isCenter
                            ? 'tile-locked'
                            : isEditMode
                            ? 'cube-tile-paintable'
                            : ''
                        } ${letter === 'X' ? 'tile-blank' : ''}`}
                        style={{
                          backgroundColor: TILE_COLORS[letter] || '#222226',
                        }}
                        onClick={() => handleTileClick(tileIndex)}
                        title={
                          isCenter
                            ? `${face.name} Center [Locked]`
                            : `${face.name} [${idx}]: ${letter === 'X' ? 'Blank' : letter}${
                                isEditMode ? ` (Click to paint ${activeBrush})` : ''
                              }`
                        }
                        aria-label={`${face.name} tile ${idx + 1}, color ${letter}${isCenter ? ' (locked center)' : ''}`}
                        disabled={isCenter && isEditMode}
                      >
                        {letter === 'X' && <span className="tile-blank-label">?</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Dynamic Validation Status Badge */}
      <section className="validation-section" aria-label="Cube Physical State Validation">
        {validation.isValid ? (
          <div className="validation-badge badge-valid">
            <span className="badge-icon" aria-hidden="true">✓</span>
            <span>Valid Cube State</span>
          </div>
        ) : (
          <div
            className="validation-badge badge-invalid"
            title={validation.errors.join('\n')}
          >
            <span className="badge-icon" aria-hidden="true">✕</span>
            <span>{validation.errors[0]}</span>
            {validation.errors.length > 1 && (
              <span className="badge-extra">
                (+{validation.errors.length - 1} more)
              </span>
            )}
          </div>
        )}
      </section>

      {/* Controls: Clockwise & Counter-Clockwise Turns */}
      <section className="controls-container" aria-label="Controls">
        {/* Clockwise Turns */}
        <span className="controls-heading">
          Clockwise Turns <span className="keyboard-hint-tag">Keys: U, R, F, D, L, B</span>
        </span>
        <div className="buttons-group">
          {MOVE_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              type="button"
              className="control-btn"
              onClick={() => handleTurn(btn.key)}
              disabled={isSolving || isEditMode}
              title={`Turn ${btn.name} Face Clockwise (${btn.label}) [Key: ${btn.shortcut}]`}
            >
              <span
                className="color-indicator"
                style={{ backgroundColor: btn.color }}
              />
              <span>{btn.label}</span>
              <kbd className="key-hint">{btn.shortcut}</kbd>
            </button>
          ))}
        </div>

        {/* Counter-Clockwise Turns */}
        <span className="controls-heading">
          Counter-Clockwise Turns <span className="keyboard-hint-tag">Keys: Shift + Face</span>
        </span>
        <div className="buttons-group">
          {PRIME_MOVE_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              type="button"
              className="control-btn"
              onClick={() => handleTurn(btn.key)}
              disabled={isSolving || isEditMode}
              title={`Turn ${btn.name} Face Counter-Clockwise (${btn.label}) [Key: ${btn.shortcut}]`}
            >
              <span
                className="color-indicator"
                style={{ backgroundColor: btn.color }}
              />
              <span>{btn.label}</span>
              <kbd className="key-hint">{btn.shortcut}</kbd>
            </button>
          ))}
        </div>

        {/* Secondary Utility Controls */}
        <div className="secondary-actions">
          <button
            type="button"
            className="solve-btn"
            onClick={handleVerifyAndSolve}
            disabled={isSolving}
            title="Verify parity and solve the cube with auto-playback"
          >
            {isSolving ? 'Solving...' : '✨ Verify & Solve'}
          </button>
          {isEditMode && (
            <button
              type="button"
              className="secondary-btn btn-danger"
              onClick={handleClearCube}
              disabled={isSolving}
              title="Clear all 54 tiles to blank unpainted canvas"
            >
              Clear Cube
            </button>
          )}
          <button
            type="button"
            className="secondary-btn"
            onClick={handleScramble}
            disabled={isSolving}
          >
            Scramble (20 moves)
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </section>

      {/* State String Inspector */}
      <section className="state-container" aria-label="State String">
        <div className="state-meta">
          <span>54-Character Cube State</span>
          <span>Moves applied: {moveCount}</span>
        </div>
        <div className="state-code">{stateString}</div>
      </section>
    </div>
  );
}
