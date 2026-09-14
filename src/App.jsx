import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Cube } from './CubeEngine';
import { validateCubeState } from './CubeValidator';
import Cube3D from './components/Cube3D';
import './App.css';

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
  { key: 'turnU', label: 'U', name: 'Up', color: TILE_COLORS.U },
  { key: 'turnR', label: 'R', name: 'Right', color: TILE_COLORS.R },
  { key: 'turnF', label: 'F', name: 'Front', color: TILE_COLORS.F },
  { key: 'turnD', label: 'D', name: 'Down', color: TILE_COLORS.D },
  { key: 'turnL', label: 'L', name: 'Left', color: TILE_COLORS.L },
  { key: 'turnB', label: 'B', name: 'Back', color: TILE_COLORS.B },
];

/**
 * Control Panel Configuration for 6 Counter-Clockwise (Prime) Turns
 */
const PRIME_MOVE_BUTTONS = [
  { key: 'turnUPrime', label: "U'", name: 'Up', color: TILE_COLORS.U },
  { key: 'turnRPrime', label: "R'", name: 'Right', color: TILE_COLORS.R },
  { key: 'turnFPrime', label: "F'", name: 'Front', color: TILE_COLORS.F },
  { key: 'turnDPrime', label: "D'", name: 'Down', color: TILE_COLORS.D },
  { key: 'turnLPrime', label: "L'", name: 'Left', color: TILE_COLORS.L },
  { key: 'turnBPrime', label: "B'", name: 'Back', color: TILE_COLORS.B },
];

/**
 * Fixed Center Indices for standard Rubik's Cube orientation:
 * U (4), R (13), F (22), D (31), L (40), B (49)
 */
const LOCKED_CENTER_INDICES = new Set([4, 13, 22, 31, 40, 49]);

export default function App() {
  // Initialize Cube engine in React useState hook
  const [cube, setCube] = useState(() => new Cube());
  const [moveCount, setMoveCount] = useState(0);
  const [activeBrush, setActiveBrush] = useState('U'); // Default 'U' (White)
  const [isEditMode, setIsEditMode] = useState(false);

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

  // Execute turn on Cube engine and update React state
  const handleTurn = (turnFunction) => {
    cube[turnFunction]();
    setCube(new Cube(cube.state));
    setMoveCount((count) => count + 1);
  };

  // Reset to solved state
  const handleReset = () => {
    cube.reset();
    setCube(new Cube(cube.state));
    setMoveCount(0);
  };

  // Set cube state to blank canvas, preserving locked physical centers
  const handleClearCube = () => {
    const blankArr = Array(54).fill('X');
    blankArr[4] = 'U';
    blankArr[13] = 'R';
    blankArr[22] = 'F';
    blankArr[31] = 'D';
    blankArr[40] = 'L';
    blankArr[49] = 'B';
    setCube(new Cube(blankArr.join('')));
    setMoveCount(0);
  };

  // Paint sticker at index with current activeBrush color (centers are locked)
  const handleTileClick = (tileIndex) => {
    if (LOCKED_CENTER_INDICES.has(tileIndex)) {
      return; // Center tiles are locked and cannot be overwritten
    }
    const chars = cube.state.split('');
    chars[tileIndex] = activeBrush;
    setCube(new Cube(chars.join('')));
  };

  // Random 20-move scramble including clockwise and prime turns
  const handleScramble = () => {
    const turns = [
      'turnU', 'turnR', 'turnF', 'turnD', 'turnL', 'turnB',
      'turnUPrime', 'turnRPrime', 'turnFPrime', 'turnDPrime', 'turnLPrime', 'turnBPrime',
    ];
    for (let i = 0; i < 20; i++) {
      const randomTurn = turns[Math.floor(Math.random() * turns.length)];
      cube[randomTurn]();
    }
    setCube(new Cube(cube.state));
    setMoveCount((count) => count + 20);
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

      {/* Mode Switcher Toggle */}
      <section className="mode-toggle-section">
        <button
          type="button"
          className={`mode-toggle-btn ${isEditMode ? 'mode-edit-active' : ''}`}
          onClick={() => setIsEditMode((prev) => !prev)}
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
        <span className="controls-heading">Clockwise Turns</span>
        <div className="buttons-group">
          {MOVE_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              type="button"
              className="control-btn"
              onClick={() => handleTurn(btn.key)}
              title={`Turn ${btn.name} Face Clockwise (${btn.label})`}
            >
              <span
                className="color-indicator"
                style={{ backgroundColor: btn.color }}
              />
              <span>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Counter-Clockwise Turns */}
        <span className="controls-heading">Counter-Clockwise Turns</span>
        <div className="buttons-group">
          {PRIME_MOVE_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              type="button"
              className="control-btn"
              onClick={() => handleTurn(btn.key)}
              title={`Turn ${btn.name} Face Counter-Clockwise (${btn.label})`}
            >
              <span
                className="color-indicator"
                style={{ backgroundColor: btn.color }}
              />
              <span>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Secondary Utility Controls */}
        <div className="secondary-actions">
          {isEditMode && (
            <button
              type="button"
              className="secondary-btn btn-danger"
              onClick={handleClearCube}
              title="Clear all 54 tiles to blank unpainted canvas"
            >
              Clear Cube
            </button>
          )}
          <button
            type="button"
            className="secondary-btn"
            onClick={handleScramble}
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
