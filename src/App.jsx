import { useState } from 'react';
import { Cube } from './CubeEngine';
import './App.css';

/**
 * Standard Rubik's Cube Face Colors:
 * U = White, R = Red, F = Green, D = Yellow, L = Orange, B = Blue
 */
const COLOR_MAP = {
  U: '#ffffff',
  R: '#dc2626',
  F: '#16a34a',
  D: '#facc15',
  L: '#ea580c',
  B: '#2563eb',
};

/**
 * 2D Flattened Cross Net configuration:
 * Grid layout:
 *   . U . .
 *   L F R B
 *   . D . .
 */
const FACES = [
  { key: 'U', name: 'Up', area: 'U', startIndex: 0, color: COLOR_MAP.U },
  { key: 'L', name: 'Left', area: 'L', startIndex: 36, color: COLOR_MAP.L },
  { key: 'F', name: 'Front', area: 'F', startIndex: 18, color: COLOR_MAP.F },
  { key: 'R', name: 'Right', area: 'R', startIndex: 9, color: COLOR_MAP.R },
  { key: 'B', name: 'Back', area: 'B', startIndex: 45, color: COLOR_MAP.B },
  { key: 'D', name: 'Down', area: 'D', startIndex: 27, color: COLOR_MAP.D },
];

/**
 * 6 Core Clockwise Turns specification
 */
const TURN_CONTROLS = [
  { key: 'turnU', label: 'U', name: 'Up', color: COLOR_MAP.U },
  { key: 'turnR', label: 'R', name: 'Right', color: COLOR_MAP.R },
  { key: 'turnF', label: 'F', name: 'Front', color: COLOR_MAP.F },
  { key: 'turnD', label: 'D', name: 'Down', color: COLOR_MAP.D },
  { key: 'turnL', label: 'L', name: 'Left', color: COLOR_MAP.L },
  { key: 'turnB', label: 'B', name: 'Back', color: COLOR_MAP.B },
];

export default function App() {
  // Initialize the Cube engine in a React useState hook
  const [cube, setCube] = useState(() => new Cube());
  const [moveCount, setMoveCount] = useState(0);

  // Trigger a clockwise turn function on the cube engine and update state
  const handleTurn = (turnFunction) => {
    cube[turnFunction]();
    setCube(new Cube(cube.state));
    setMoveCount((prev) => prev + 1);
  };

  // Reset the cube to the solved state
  const handleReset = () => {
    cube.reset();
    setCube(new Cube(cube.state));
    setMoveCount(0);
  };

  // Perform a 20-move random scramble
  const handleScramble = () => {
    const turns = ['turnU', 'turnR', 'turnF', 'turnD', 'turnL', 'turnB'];
    for (let i = 0; i < 20; i++) {
      const randomTurn = turns[Math.floor(Math.random() * turns.length)];
      cube[randomTurn]();
    }
    setCube(new Cube(cube.state));
    setMoveCount((prev) => prev + 20);
  };

  const currentState = cube.state;

  return (
    <div className="app-container">
      <header className="header">
        <h1>Rubik&apos;s Cube Solver</h1>
        <p>Core State Engine &amp; 2D Net Visualizer</p>
      </header>

      {/* Flattened 2D Rubik's Cube Cross Net */}
      <section className="cube-net-wrapper" aria-label="Rubik's Cube 2D Net">
        <div className="cube-net">
          {FACES.map((face) => {
            // Extract the 9 stickers for this face from the 54-character state string
            const stickers = currentState
              .slice(face.startIndex, face.startIndex + 9)
              .split('');

            return (
              <div
                key={face.key}
                className="cube-face"
                style={{ gridArea: face.area }}
              >
                <span className="face-label">{face.name} ({face.key})</span>
                <div className="face-grid">
                  {stickers.map((letter, idx) => (
                    <div
                      key={idx}
                      className="sticker"
                      style={{
                        backgroundColor: COLOR_MAP[letter] || '#333333',
                      }}
                      title={`${face.name} [${idx}]: ${letter}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Control Panel: 6 Clockwise Turn Buttons */}
      <section className="controls-section" aria-label="Cube Turn Controls">
        <span className="controls-label">Clockwise Moves</span>
        <div className="turn-buttons-grid">
          {TURN_CONTROLS.map((ctrl) => (
            <button
              key={ctrl.key}
              type="button"
              className="turn-button"
              onClick={() => handleTurn(ctrl.key)}
              title={`Turn ${ctrl.name} Face Clockwise`}
            >
              <span
                className="color-dot"
                style={{ backgroundColor: ctrl.color, color: ctrl.color }}
              />
              <span className="turn-symbol">{ctrl.label}</span>
              <span className="turn-name">{ctrl.name}</span>
            </button>
          ))}
        </div>

        {/* Utility Controls */}
        <div className="utility-buttons">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleScramble}
          >
            Scramble (20 moves)
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
          >
            Reset to Solved
          </button>
        </div>
      </section>

      {/* 54-Character State Inspector */}
      <section className="state-card" aria-label="Engine State String">
        <div className="state-header">
          <span>54-Character Cube State</span>
          <span>Moves applied: {moveCount}</span>
        </div>
        <div className="state-string">{currentState}</div>
      </section>
    </div>
  );
}
