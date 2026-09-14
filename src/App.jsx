import { useState } from 'react';
import { Cube } from './CubeEngine';
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
};

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

export default function App() {
  // Initialize Cube engine in React useState hook
  const [cube, setCube] = useState(() => new Cube());
  const [moveCount, setMoveCount] = useState(0);

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

  // Random 20-move scramble
  const handleScramble = () => {
    const turns = ['turnU', 'turnR', 'turnF', 'turnD', 'turnL', 'turnB'];
    for (let i = 0; i < 20; i++) {
      const randomTurn = turns[Math.floor(Math.random() * turns.length)];
      cube[randomTurn]();
    }
    setCube(new Cube(cube.state));
    setMoveCount((count) => count + 20);
  };

  const stateString = cube.state;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header-section">
        <h1 className="header-title">Rubik&apos;s Cube Solver</h1>
        <p className="header-subtitle">Interactive State Engine &amp; 2D Net Visualizer</p>
      </header>

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
                  {stickers.map((letter, idx) => (
                    <div
                      key={idx}
                      className="cube-tile"
                      style={{
                        backgroundColor: TILE_COLORS[letter] || '#333333',
                      }}
                      title={`${face.name} [${idx}]: ${letter}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Controls: 6 Clockwise Move Buttons */}
      <section className="controls-container" aria-label="Controls">
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

        {/* Secondary Utility Controls */}
        <div className="secondary-actions">
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
