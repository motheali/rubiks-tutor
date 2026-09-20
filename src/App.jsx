import solverModule from 'rubiks-cube-solver';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Cube as CubeEngine, SOLVED_STATE } from './CubeEngine';
import { validateCubeState } from './CubeValidator';
import Cube3D from './components/Cube3D';
import CameraScanner from './components/CameraScanner';
import { COLOR_NAME_TO_KEY } from './components/cameraScannerMath';
import { getInverseMove, applyMove, toSolverFormat } from './tutorUtils';
import './App.css';

const solveCube = solverModule.default || solverModule;

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
  { key: 'U', name: 'White', color: TILE_COLORS.U, shortcut: '1' },
  { key: 'R', name: 'Red', color: TILE_COLORS.R, shortcut: '2' },
  { key: 'F', name: 'Green', color: TILE_COLORS.F, shortcut: '3' },
  { key: 'D', name: 'Yellow', color: TILE_COLORS.D, shortcut: '4' },
  { key: 'L', name: 'Orange', color: TILE_COLORS.L, shortcut: '5' },
  { key: 'B', name: 'Blue', color: TILE_COLORS.B, shortcut: '6' },
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

  // Application Mode: 'learn' (default) or 'practice'
  const [appMode, setAppMode] = useState('learn');
  // Selected Training Case for Learn Mode
  const [selectedCase, setSelectedCase] = useState('');
  // Camera Scanner modal display state
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Speed slider state (Animation Speed in ms)
  const [animationSpeed, setAnimationSpeed] = useState(400);

  // Tutor mode & auto-playback solver states
  const [solveSequence, setSolveSequence] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [solverStatus, setSolverStatus] = useState('');
  const [solverError, setSolverError] = useState('');
  const setUIError = setSolverError;
  const isCancelledRef = useRef(false);

  // Smooth rotation animation states & refs
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingMove, setAnimatingMove] = useState(null);
  const pendingAnimationResolveRef = useRef(null);
  const autoSolveTimeoutRef = useRef(null);

  // Ref-based locks and values to synchronously prevent stale closures and race conditions
  const isAnimatingRef = useRef(false);
  const isSolvingRef = useRef(false);
  const isEditModeRef = useRef(false);
  const animationSpeedRef = useRef(400);
  const solveSequenceRef = useRef([]);
  const currentStepIndexRef = useRef(0);
  const cubeRef = useRef(cube);

  // Keep refs synchronized with React state
  useEffect(() => {
    cubeRef.current = cube;
  }, [cube]);

  useEffect(() => {
    isSolvingRef.current = isSolving;
  }, [isSolving]);

  useEffect(() => {
    isEditModeRef.current = isEditMode;
  }, [isEditMode]);

  useEffect(() => {
    animationSpeedRef.current = animationSpeed;
  }, [animationSpeed]);

  useEffect(() => {
    solveSequenceRef.current = solveSequence;
  }, [solveSequence]);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

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

  // Callback invoked by Cube3D when smooth rotation interpolation completes
  const handleAnimationComplete = useCallback(() => {
    if (pendingAnimationResolveRef.current) {
      const resolve = pendingAnimationResolveRef.current;
      pendingAnimationResolveRef.current = null;
      resolve();
    }
  }, []);

  // Triggers smooth 3D rotation animation in Cube3D and returns a Promise that resolves on completion
  const animateSingleMove = useCallback((move) => {
    return new Promise((resolve) => {
      isAnimatingRef.current = true;
      setIsAnimating(true);
      pendingAnimationResolveRef.current = resolve;
      setAnimatingMove({
        move,
        duration: animationSpeedRef.current,
        id: Date.now() + Math.random(),
      });
    });
  }, []);

  // Force-cancels any in-flight animation immediately
  const cancelInFlightAnimation = useCallback(() => {
    if (pendingAnimationResolveRef.current) {
      const resolve = pendingAnimationResolveRef.current;
      pendingAnimationResolveRef.current = null;
      resolve();
    }
    setAnimatingMove(null);
    isAnimatingRef.current = false;
    setIsAnimating(false);
  }, []);

  // Halt auto-solver playback immediately (Edge Case 3: fires clearTimeout to instantly kill loop)
  const haltAutoSolver = useCallback(() => {
    if (isSolvingRef.current) {
      isCancelledRef.current = true;
      isSolvingRef.current = false;
      setIsSolving(false);
      if (autoSolveTimeoutRef.current) {
        clearTimeout(autoSolveTimeoutRef.current);
        autoSolveTimeoutRef.current = null;
      }
      setSolverStatus('Auto-solve paused. Tutor mode active.');
    }
  }, []);

  // Helper to convert turnFunction (e.g. 'turnU', 'turnRPrime') to standard notation ('U', "R'")
  const turnFunctionToMove = (funcName) => {
    let m = funcName.replace(/^turn/, '');
    if (m.endsWith('Prime')) {
      m = m.replace(/Prime$/, "'");
    }
    return m;
  };

  // Execute turn on Cube engine with smooth 3D rotation animation and focus dimming
  const handleTurn = useCallback(async (turnFunction) => {
    if (isSolvingRef.current || isAnimatingRef.current || isEditModeRef.current) return;
    const prevCube = cubeRef.current;
    if (typeof prevCube[turnFunction] !== 'function') return;
    const nextRaw = prevCube[turnFunction]();
    const nextCube = nextRaw instanceof CubeEngine ? nextRaw : new CubeEngine(nextRaw);
    if (!nextCube || nextCube.state === prevCube.state) return;

    const moveNotation = turnFunctionToMove(turnFunction);

    try {
      await animateSingleMove(moveNotation);
      // Synchronous handoff: commit nextCube state and clear animatingMove
      cubeRef.current = nextCube;
      setCube(nextCube);
      setAnimatingMove(null);
      setMoveCount((count) => count + 1);
    } catch (e) {
      console.error('Turn animation error:', e);
      cubeRef.current = nextCube;
      setCube(nextCube);
      setAnimatingMove(null);
    } finally {
      isAnimatingRef.current = false;
      setIsAnimating(false);
    }
  }, [animateSingleMove]);

  // Tutor Mode: Execute the next move in solveSequence with smooth 3D rotation animation
  const handleNextStep = useCallback(async () => {
    // Edge Case 3: Instantly kill ongoing Auto-Solve loop if active
    if (isSolvingRef.current) {
      haltAutoSolver();
    }
    if (isEditModeRef.current || isAnimatingRef.current) return;

    const seq = solveSequenceRef.current;
    const idx = currentStepIndexRef.current;
    if (!seq || idx >= seq.length) return;

    const move = seq[idx];
    const prevCube = cubeRef.current;
    const nextCube = applyMove(prevCube, move);

    // Strict Guardrail: UI step counter ONLY increments when a valid move executes on the 3D model
    if (!nextCube || nextCube.state === prevCube.state) {
      console.warn(`handleNextStep: Unrecognized or non-executing move "${move}". Step counter will not advance.`);
      return;
    }

    try {
      await animateSingleMove(move);
      // Synchronous handoff: commit nextCube state and clear animatingMove in the same commit
      cubeRef.current = nextCube;
      setCube(nextCube);
      setAnimatingMove(null);
      setMoveCount((count) => count + (move.includes('2') ? 2 : 1));
      const nextIdx = idx + 1;
      currentStepIndexRef.current = nextIdx;
      setCurrentStepIndex(nextIdx);
      if (nextIdx === seq.length) {
        setSolverStatus(`Solved in ${seq.length} moves! 🎉`);
      } else {
        setSolverStatus(`Tutor Mode: Step ${nextIdx} of ${seq.length}`);
      }
    } catch (e) {
      console.error('Next step animation error:', e);
      cubeRef.current = nextCube;
      setCube(nextCube);
      setAnimatingMove(null);
    } finally {
      isAnimatingRef.current = false;
      setIsAnimating(false);
    }
  }, [haltAutoSolver, animateSingleMove]);

  // Tutor Mode: Execute the inverse (Prime) of previous move with smooth 3D rotation animation
  const handlePrevStep = useCallback(async () => {
    // Edge Case 3: Instantly kill ongoing Auto-Solve loop if active
    if (isSolvingRef.current) {
      haltAutoSolver();
    }
    if (isEditModeRef.current || isAnimatingRef.current) return;

    const seq = solveSequenceRef.current;
    const idx = currentStepIndexRef.current;
    if (!seq || idx <= 0) return;

    const prevMove = seq[idx - 1];
    const inverseMove = getInverseMove(prevMove);
    const prevCube = cubeRef.current;
    const nextCube = applyMove(prevCube, inverseMove);

    // Strict Guardrail: UI step counter ONLY decrements when a valid inverse move executes on the 3D model
    if (!nextCube || nextCube.state === prevCube.state) {
      console.warn(`handlePrevStep: Unrecognized or non-executing inverse move "${inverseMove}". Step counter will not retreat.`);
      return;
    }

    try {
      await animateSingleMove(inverseMove);
      // Synchronous handoff: commit nextCube state and clear animatingMove in the same commit
      cubeRef.current = nextCube;
      setCube(nextCube);
      setAnimatingMove(null);
      setMoveCount((count) => Math.max(0, count - (prevMove.includes('2') ? 2 : 1)));
      const nextIdx = idx - 1;
      currentStepIndexRef.current = nextIdx;
      setCurrentStepIndex(nextIdx);
      setSolverStatus(`Tutor Mode: Step ${nextIdx} of ${seq.length}`);
    } catch (e) {
      console.error('Prev step animation error:', e);
      cubeRef.current = nextCube;
      setCube(nextCube);
      setAnimatingMove(null);
    } finally {
      isAnimatingRef.current = false;
      setIsAnimating(false);
    }
  }, [haltAutoSolver, animateSingleMove]);

  const handleNextStepRef = useRef(handleNextStep);
  const handlePrevStepRef = useRef(handlePrevStep);
  const handleTurnRef = useRef(handleTurn);

  useEffect(() => {
    handleNextStepRef.current = handleNextStep;
    handlePrevStepRef.current = handlePrevStep;
    handleTurnRef.current = handleTurn;
  });

  // Bulletproof Speed-Cubing, Tutor Mode, and Palette Keyboard Controls
  // Functional updates, ref-based locks, empty dependency array [], strict cleanup
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 1. Command Key Trap: prevent Cmd+R / Ctrl+R page refreshes and OS shortcuts from turning the cube
      if (event.metaKey || event.ctrlKey) {
        return;
      }

      // 2. Input Focus Trap: do not execute moves or hotkeys if user is focused inside an input or textarea
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      // 3. Color Palette Keyboard Shortcuts (1-6) - active only in Edit Mode
      if (isEditModeRef.current) {
        const NUM_TO_KEY = {
          '1': 'U',
          '2': 'R',
          '3': 'F',
          '4': 'D',
          '5': 'L',
          '6': 'B',
        };
        const colorKey = NUM_TO_KEY[event.key];
        if (colorKey) {
          event.preventDefault();
          setActiveBrush(colorKey);
          return;
        }
        // In Edit Mode, do not execute cube rotation moves
        return;
      }

      // 4. Tutor Mode Keyboard Controls: ArrowRight -> Next Move, ArrowLeft -> Prev Move
      // Edge Case 3: If Auto-Solve playback is running, pressing Arrow keys cancels Auto-Solve instantly!
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNextStepRef.current?.();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevStepRef.current?.();
        return;
      }

      // 5. Solver Lock Guardrail: do not execute face moves while auto-solver playback animation is running
      if (isSolvingRef.current) {
        return;
      }

      // 6. Animation Lock Guardrail: do not execute face moves while 3D rotation animation is in progress
      if (isAnimatingRef.current) {
        return;
      }

      // 7. Mapping: r, l, u, d, f, b (case-insensitive) to respective face rotation functions
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

      // Smoothly animate the turn
      handleTurnRef.current?.(turnFunction);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Reset to solved state
  const handleReset = () => {
    haltAutoSolver();
    cancelInFlightAnimation();
    setSolveSequence([]);
    solveSequenceRef.current = [];
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    setSolverStatus('');
    setSolverError('');
    cube.reset();
    cubeRef.current = new CubeEngine(cube.state);
    setCube(new CubeEngine(cube.state));
    setMoveCount(0);
  };

  // Set cube state to blank canvas, preserving locked physical centers
  const handleClearCube = () => {
    haltAutoSolver();
    cancelInFlightAnimation();
    setSolveSequence([]);
    solveSequenceRef.current = [];
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    setSolverStatus('');
    setSolverError('');
    const blankArr = Array(54).fill('X');
    blankArr[4] = 'U';
    blankArr[13] = 'R';
    blankArr[22] = 'F';
    blankArr[31] = 'D';
    blankArr[40] = 'L';
    blankArr[49] = 'B';
    const newBlank = new CubeEngine(blankArr.join(''));
    cubeRef.current = newBlank;
    setCube(newBlank);
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

  // Apply scanned 9 colors to the specified cube face (mirroring Edit Mode paint logic)
  const handleApplyFace = useCallback((matchedColorsArray, targetFaceKey) => {
    if (!matchedColorsArray || matchedColorsArray.length !== 9) return;

    // Determine target face key (e.g. 'F', 'R', 'U', etc.)
    const faceKey = targetFaceKey || COLOR_NAME_TO_KEY[matchedColorsArray[4]] || 'F';
    const faceDef = CUBE_FACES.find((f) => f.key === faceKey) || CUBE_FACES.find((f) => f.key === 'F');
    const startIndex = faceDef.startIndex;

    const chars = cubeRef.current.state.split('');

    for (let i = 0; i < 9; i++) {
      const tileIndex = startIndex + i;
      // Mirror Edit Mode: locked physical center tile cannot be overwritten
      if (LOCKED_CENTER_INDICES.has(tileIndex)) {
        continue;
      }
      const rawColor = matchedColorsArray[i];
      const colorKey = COLOR_NAME_TO_KEY[rawColor] || rawColor;
      if (['U', 'R', 'F', 'D', 'L', 'B'].includes(colorKey)) {
        chars[tileIndex] = colorKey;
      }
    }

    const updatedCube = new CubeEngine(chars.join(''));
    cubeRef.current = updatedCube;
    setCube(updatedCube);

    // Reset solver sequence states since cube state changed
    setSolveSequence([]);
    solveSequenceRef.current = [];
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    setSolverStatus('');
    setSolverError('');

    // Unmount camera component
    setShowCameraScanner(false);
  }, []);

  // Random 20-move scramble including clockwise and prime turns
  const handleScramble = () => {
    if (isSolvingRef.current || isAnimatingRef.current || isEditModeRef.current) return;
    setSolveSequence([]);
    solveSequenceRef.current = [];
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
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

  // Verify physical state, solve with rubiks-cube-solver, and auto-playback solution sequence using dynamic animationSpeed
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
      // Translate our URFDLB format to rubiks-cube-solver FRUDLB lowercase format
      const solverFormat = toSolverFormat(cube.state);

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

      setSolveSequence(moves);
      solveSequenceRef.current = moves;
      setCurrentStepIndex(0);
      currentStepIndexRef.current = 0;
      setSolverStatus(`Solving (${moves.length} moves)...`);

      // 3. Auto-Playback Animation (using dynamic animationSpeedRef.current per move with smooth 3D rotation)
      for (let i = 0; i < moves.length; i++) {
        if (isCancelledRef.current) break;

        const move = moves[i];
        const prevCube = cubeRef.current;
        const nextCube = applyMove(prevCube, move);

        // Strict Guardrail: UI step counter ONLY increments when a valid, fully animated move successfully executes on the 3D model
        if (!nextCube || nextCube.state === prevCube.state) {
          console.warn(`handleVerifyAndSolve: Unrecognized or non-executing move "${move}". Step counter will not advance.`);
          continue;
        }

        try {
          await animateSingleMove(move);
        } catch {
          break;
        }

        if (isCancelledRef.current) {
          setAnimatingMove(null);
          break;
        }

        // Synchronous handoff: commit nextCube state and clear animatingMove in the same commit
        cubeRef.current = nextCube;
        setCube(nextCube);
        setAnimatingMove(null);
        setMoveCount((count) => count + (move.includes('2') ? 2 : 1));

        currentStepIndexRef.current = i + 1;
        setCurrentStepIndex(i + 1);

        // Allow instant cancellation between steps via autoSolveTimeoutRef (Edge Case 3)
        if (i < moves.length - 1 && !isCancelledRef.current) {
          await new Promise((resolve) => {
            autoSolveTimeoutRef.current = setTimeout(resolve, 20);
          });
          autoSolveTimeoutRef.current = null;
        }
      }

      if (!isCancelledRef.current) {
        setSolverStatus(`Solved in ${moves.length} moves! 🎉`);
      }
    } catch (error) {
      console.error("Solver Crash:", error);
      setUIError("Solver Crash: " + (error.message || "Unknown error"));
      setSolverStatus('');
    } finally {
      if (autoSolveTimeoutRef.current) {
        clearTimeout(autoSolveTimeoutRef.current);
        autoSolveTimeoutRef.current = null;
      }
      isSolvingRef.current = false;
      setIsSolving(false);
      isAnimatingRef.current = false;
      setIsAnimating(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar with Mode Selector */}
      <header className="top-nav-bar">
        <div className="nav-brand">
          <span className="nav-logo" aria-hidden="true">🧊</span>
          <div className="nav-title-group">
            <h1 className="nav-title">Rubik&apos;s Tutor</h1>
            <span className="nav-subtitle">Interactive 3D Engine &amp; Tutor</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="nav-camera-btn"
            onClick={() => setShowCameraScanner((prev) => !prev)}
            title="Toggle Rubik's Cube Camera Scanner"
          >
            📷 Test Camera
          </button>
          <nav className="nav-mode-selector" aria-label="Application Environment Mode">
            <button
              type="button"
              className={`nav-mode-btn ${appMode === 'learn' ? 'active' : ''}`}
              onClick={() => setAppMode('learn')}
            >
              📚 Learn Mode
            </button>
            <button
              type="button"
              className={`nav-mode-btn ${appMode === 'practice' ? 'active' : ''}`}
              onClick={() => setAppMode('practice')}
            >
              ⏱️ Practice Mode
            </button>
          </nav>
        </div>
      </header>

      {/* Conditionally Rendered Camera Scanner Modal (Testing Mounting/Unmounting) */}
      {showCameraScanner && (
        <div
          className="camera-modal-backdrop"
          onClick={() => setShowCameraScanner(false)}
          aria-modal="true"
          role="dialog"
        >
          <div className="camera-modal-content" onClick={(e) => e.stopPropagation()}>
            <CameraScanner
              onClose={() => setShowCameraScanner(false)}
              onApplyFace={handleApplyFace}
            />
          </div>
        </div>
      )}

      {/* Main Content Area: Learn Mode (Split-Screen) vs Practice Mode (Placeholder) */}
      {appMode === 'practice' ? (
        <main className="practice-placeholder-container">
          <div className="practice-placeholder-card">
            <div className="practice-icon" aria-hidden="true">⏱️</div>
            <h2 className="practice-title">Practice Mode Coming Soon</h2>
            <p className="practice-desc">
              Speedcubing timer, WCA inspection countdown, scramble generator, and session statistics will be available here.
            </p>
            <button
              type="button"
              className="primary-return-btn"
              onClick={() => setAppMode('learn')}
            >
              Return to Learn Mode
            </button>
          </div>
        </main>
      ) : (
        <main className="learn-split-layout">
          {/* Left Viewport (approx. 60-70% width): 3D Rubik's Cube Canvas */}
          <section className="learn-viewport-left" aria-label="3D Rubik's Cube Viewer">
            <div className="viewport-canvas-container">
              <Canvas
                camera={{ position: [4.5, 3.5, 5.5], fov: 45 }}
                style={{ width: '100%', height: '100%' }}
              >
                <Cube3D
                  cubeState={stateString}
                  animatingMove={animatingMove}
                  onAnimationComplete={handleAnimationComplete}
                />
              </Canvas>
            </div>
            <div className="viewport-hint-bar">
              <span>Drag to orbit • Scroll to zoom • Notation keys: U, R, F, D, L, B (Shift for Prime)</span>
            </div>
          </section>

          {/* Right Control Panel (approx. 30-40% width): Scrollable Sidebar Panel */}
          <aside className="learn-sidebar-right" aria-label="Tutor Control Panel">
            {/* 1. Training Case Selector */}
            <div className="sidebar-card training-case-card">
              <label htmlFor="training-case-select" className="sidebar-card-title">
                🎯 Select Training Case
              </label>
              <select
                id="training-case-select"
                className="training-case-dropdown"
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
              >
                <option value="">-- Choose an Algorithm Set --</option>
                <option value="beginner-cross">Beginner Cross</option>
                <option value="f2l">F2L Insertions (First Two Layers)</option>
                <option value="oll">OLL (Orient Last Layer)</option>
                <option value="pll">PLL (Permute Last Layer)</option>
              </select>
            </div>

            {/* 2. Solution Sequence & Step-by-Step Navigation Bar */}
            {(solveSequence.length > 0 || solverStatus || solverError) && (
              <div className="sidebar-card solution-container" aria-label="Solution Playback">
                <div className="solution-header">
                  <span>
                    {solveSequence.length > 0
                      ? `Solution Sequence (${solveSequence.length} moves)`
                      : 'Solver Status'}
                  </span>
                  {solverStatus && <span className="solution-status">{solverStatus}</span>}
                  {solverError && (
                    <span className="solution-status" style={{ color: '#f87171' }}>
                      {solverError}
                    </span>
                  )}
                </div>
                {solveSequence.length > 0 && (
                  <>
                    <div className="solution-sequence">
                      {solveSequence.map((move, idx) => {
                        const isCurrent = idx === currentStepIndex && currentStepIndex < solveSequence.length;
                        const isDone = idx < currentStepIndex;
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

                    {/* Tutor Mode Step-by-Step Navigation Bar */}
                    <div className="tutor-controls-bar">
                      <button
                        type="button"
                        className="tutor-btn"
                        onClick={handlePrevStep}
                        disabled={currentStepIndex <= 0 || (isAnimating && !isSolving)}
                        title="Execute reverse of previous move (Key: ArrowLeft ←)"
                      >
                        <span>◀ Prev Move</span>
                        <kbd className="key-hint">←</kbd>
                      </button>
                      <span className="tutor-step-info">
                        Step {currentStepIndex} of {solveSequence.length}
                      </span>
                      <button
                        type="button"
                        className="tutor-btn"
                        onClick={handleNextStep}
                        disabled={currentStepIndex >= solveSequence.length || (isAnimating && !isSolving)}
                        title="Execute next move (Key: ArrowRight →)"
                      >
                        <span>Next Move ▶</span>
                        <kbd className="key-hint">→</kbd>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 3. Speed Slider for Animation Playback */}
            <div className="sidebar-card speed-slider-group">
              <label htmlFor="speed-slider" className="speed-label">
                Animation Speed: <span className="speed-value">{animationSpeed}ms</span>
              </label>
              <input
                id="speed-slider"
                type="range"
                min="100"
                max="1000"
                step="50"
                value={animationSpeed}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAnimationSpeed(val);
                  animationSpeedRef.current = val;
                }}
                className="speed-slider"
                aria-label="Animation playback speed"
              />
            </div>

            {/* 4. Secondary & Utility Actions (Solve, Clear, Scramble, Reset) */}
            <div className="sidebar-card secondary-actions">
              <button
                type="button"
                className="solve-btn"
                onClick={handleVerifyAndSolve}
                disabled={isSolving || isAnimating}
                title="Verify parity and solve the cube with auto-playback"
              >
                {isSolving ? 'Solving...' : '✨ Verify & Solve'}
              </button>
              {isEditMode && (
                <button
                  type="button"
                  className="secondary-btn btn-danger"
                  onClick={handleClearCube}
                  disabled={isSolving || isAnimating}
                  title="Clear all 54 tiles to blank unpainted canvas"
                >
                  Clear Cube
                </button>
              )}
              <button
                type="button"
                className="secondary-btn"
                onClick={handleScramble}
                disabled={isSolving || isAnimating || isEditMode}
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

            {/* 5. 2D Painting & Net Visualizer (with Mode Switcher) */}
            <div className="sidebar-card net-and-palette-card">
              <div className="mode-toggle-section">
                <button
                  type="button"
                  className={`mode-toggle-btn ${isEditMode ? 'mode-edit-active' : ''}`}
                  onClick={() => setIsEditMode((prev) => !prev)}
                  disabled={isSolving || isAnimating}
                  title="Toggle between Scramble/Play mode and Input/Edit mode"
                >
                  {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
                </button>
              </div>

              {/* Interactive Color Palette (Paint Brush) */}
              <div className="palette-section" aria-label="Color Palette">
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
                        title={`Select ${swatch.name} (${swatch.key}) Brush [Key: ${swatch.shortcut}]`}
                      >
                        <span
                          className="swatch-indicator"
                          style={{ backgroundColor: swatch.color, color: swatch.color }}
                        />
                        <span>{swatch.name} ({swatch.key})</span>
                        {isEditMode && <kbd className="palette-key-hint">{swatch.shortcut}</kbd>}
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
                    ? 'Select a color swatch above (Keys: 1-6), then click any tile on the 2D Net below to paint it.'
                    : 'Toggle "Enter Edit Mode" to paint custom colors onto the 2D Net.'}
                </p>
              </div>

              {/* Centered 2D Cross Net */}
              <div className="grid-container">
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
              </div>
            </div>

            {/* 6. Controls: Clockwise & Counter-Clockwise Turns */}
            <div className="sidebar-card controls-container" aria-label="Manual Rotation Controls">
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
                    disabled={isSolving || isEditMode || isAnimating}
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
                    disabled={isSolving || isEditMode || isAnimating}
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
            </div>

            {/* 7. Dynamic Validation & State String Inspector */}
            <div className="sidebar-card validation-and-state-card">
              <div className="validation-section" aria-label="Cube Physical State Validation">
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
              </div>

              <div className="state-container" aria-label="State String">
                <div className="state-meta">
                  <span>54-Character Cube State</span>
                  <span>Moves applied: {moveCount}</span>
                </div>
                <div className="state-code">{stateString}</div>
              </div>
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
