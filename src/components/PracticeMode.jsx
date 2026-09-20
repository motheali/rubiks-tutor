import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Cube as CubeEngine } from '../CubeEngine';
import Cube3D from './Cube3D';
import { generateWcaScramble, applyScramble, formatTime } from './practiceUtils';

/**
 * PracticeMode: Speed-cubing arena with a minimalist layout,
 * centered 3D Rubik's cube, WCA inspection countdown with penalties,
 * and a millisecond-precision digital timer state machine.
 */
export default function PracticeMode() {
  // 1. Scramble & 3D Cube State
  const [currentScramble, setCurrentScramble] = useState(() => generateWcaScramble(20));
  const [cube, setCube] = useState(() => applyScramble(currentScramble, new CubeEngine()));

  // 2. Timer State Machine
  // States: 'idle' | 'inspecting' | 'running' | 'stopped'
  const [timerState, setTimerState] = useState('idle');
  const [time, setTime] = useState(0); // Elapsed milliseconds
  const [inspectionTime, setInspectionTime] = useState(15); // Remaining inspection seconds
  const [penalty, setPenalty] = useState(null); // null | '+2' | 'DNF'
  const [isSpaceDown, setIsSpaceDown] = useState(false);

  // Refs for tracking mutable timing state and avoiding closure staleness
  const timerStateRef = useRef(timerState);
  const penaltyRef = useRef(penalty);
  const solveStartRef = useRef(0);
  const inspectionStartRef = useRef(0);
  const solveRafRef = useRef(null);
  const inspectionIntervalRef = useRef(null);

  // Synchronize refs with state
  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  useEffect(() => {
    penaltyRef.current = penalty;
  }, [penalty]);

  // CRITICAL GUARDRAIL: Helper to strictly clear all active timer loops
  const clearAllTimers = useCallback(() => {
    if (solveRafRef.current) {
      cancelAnimationFrame(solveRafRef.current);
      solveRafRef.current = null;
    }
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Generates a new 20-move scramble and applies it to the 3D cube
  const handleNewScramble = useCallback(() => {
    clearAllTimers();
    const nextScramble = generateWcaScramble(20);
    setCurrentScramble(nextScramble);
    const nextCube = applyScramble(nextScramble, new CubeEngine());
    setCube(nextCube);
    setTime(0);
    setInspectionTime(15);
    setPenalty(null);
    setTimerState('idle');
  }, [clearAllTimers]);

  // Transition: Start 15-second WCA Inspection
  const startInspection = useCallback(() => {
    clearAllTimers();
    setTimerState('inspecting');
    setInspectionTime(15);
    setPenalty(null);
    setTime(0);

    inspectionStartRef.current = performance.now();

    inspectionIntervalRef.current = setInterval(() => {
      const elapsedSeconds = (performance.now() - inspectionStartRef.current) / 1000;
      const remainingSeconds = Math.max(0, Math.ceil(15 - elapsedSeconds));
      setInspectionTime(remainingSeconds);

      // WCA Penalty Logic:
      // - 0s to 15s: regular inspection
      // - 15s to 17s: +2 penalty warning
      // - > 17s: DNF automatic timeout
      if (elapsedSeconds > 17) {
        // Exceeded 17s inspection limit -> automatic DNF
        clearAllTimers();
        setPenalty('DNF');
        setTimerState('stopped');
      } else if (elapsedSeconds > 15) {
        setPenalty('+2');
      }
    }, 50);
  }, [clearAllTimers]);

  // Transition: Start Solve Timer (running state)
  const startSolveTimer = useCallback(() => {
    clearAllTimers();
    setTimerState('running');

    solveStartRef.current = performance.now();

    const tick = () => {
      const now = performance.now();
      const elapsed = now - solveStartRef.current;
      setTime(elapsed);
      solveRafRef.current = requestAnimationFrame(tick);
    };

    solveRafRef.current = requestAnimationFrame(tick);
  }, [clearAllTimers]);

  // Transition: Stop Solve Timer (stopped state)
  const stopSolveTimer = useCallback(() => {
    clearAllTimers();
    if (solveStartRef.current > 0) {
      const finalTime = performance.now() - solveStartRef.current;
      setTime(finalTime);
    }
    setTimerState('stopped');
  }, [clearAllTimers]);

  // Reset timer to idle (Esc)
  const handleResetToIdle = useCallback(() => {
    handleNewScramble();
  }, [handleNewScramble]);

  // 3. Keyboard Event Listeners (Spacebar & Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Spacebar Keydown
      if (e.code === 'Space' || e.key === ' ') {
        // Prevent default browser page scrolling
        e.preventDefault();

        // Ignore auto-repeat key events from holding space
        if (e.repeat) return;

        setIsSpaceDown(true);

        // Running state: Pressing spacebar instantly stops the timer
        if (timerStateRef.current === 'running') {
          stopSolveTimer();
        }
        return;
      }

      // 2. Escape Keydown: Stopped state resets to idle with new scramble
      if (e.code === 'Escape' || e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        if (timerStateRef.current === 'stopped') {
          handleResetToIdle();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setIsSpaceDown(false);

        const currentState = timerStateRef.current;

        // Idle state: Pressing and releasing Spacebar transitions to inspecting
        if (currentState === 'idle') {
          startInspection();
        }
        // Inspecting state: Pressing and releasing Spacebar transitions to running
        else if (currentState === 'inspecting') {
          // If DNF was triggered by exceeding 17s, do not start
          if (penaltyRef.current !== 'DNF') {
            startSolveTimer();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startInspection, startSolveTimer, stopSolveTimer, handleResetToIdle]);

  // Visual status cue for timer display
  const getTimerDisplayContent = () => {
    if (timerState === 'inspecting') {
      if (penalty === 'DNF') return 'DNF';
      if (penalty === '+2') return '+2';
      return inspectionTime.toString();
    }
    if (timerState === 'stopped') {
      if (penalty === 'DNF') return 'DNF';
      return formatTime(time, penalty);
    }
    if (timerState === 'running') {
      return formatTime(time, null);
    }
    // Idle
    return '0.00';
  };

  const getStatusBadge = () => {
    switch (timerState) {
      case 'idle':
        return isSpaceDown
          ? { text: 'READY', className: 'status-ready' }
          : { text: 'PRESS SPACE TO INSPECT', className: 'status-idle' };
      case 'inspecting':
        if (penalty === '+2') {
          return { text: '+2 OVERTIME PENALTY', className: 'status-penalty' };
        }
        if (penalty === 'DNF') {
          return { text: 'INSPECTION TIMEOUT (DNF)', className: 'status-dnf' };
        }
        return { text: 'INSPECTION (15s)', className: 'status-inspecting' };
      case 'running':
        return { text: 'SOLVE IN PROGRESS', className: 'status-running' };
      case 'stopped':
        return { text: 'SOLVE COMPLETE', className: 'status-stopped' };
      default:
        return { text: '', className: '' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <main className="practice-mode-arena" aria-label="Speedcubing Practice Arena">
      {/* 1. Above Cube: Large, high-contrast Scramble Display */}
      <section className="practice-scramble-section" aria-label="Current Scramble">
        <div className="practice-scramble-card">
          <div className="scramble-card-header">
            <span className="scramble-label">WCA 20-Move Scramble</span>
            <button
              type="button"
              className="new-scramble-btn"
              onClick={handleNewScramble}
              title="Generate a new scramble sequence (Esc when stopped)"
            >
              🔄 New Scramble
            </button>
          </div>
          <div className="scramble-text" aria-live="polite">
            {currentScramble}
          </div>
        </div>
      </section>

      {/* 2. Center Viewport: Minimalist Centered 3D Cube */}
      <section className="practice-cube-viewport" aria-label="3D Rubik's Cube Viewer">
        <div className="practice-canvas-container">
          <Canvas
            camera={{ position: [4.5, 3.5, 5.5], fov: 45 }}
            style={{ width: '100%', height: '100%' }}
          >
            <Cube3D cubeState={cube.state} />
          </Canvas>
        </div>
        <div className="practice-orbit-hint">
          <span>Drag to orbit cube during inspection • Space to start/stop • Esc to reset</span>
        </div>
      </section>

      {/* 3. Below Cube: Massive, ultra-legible digital timer */}
      <section className="practice-timer-section" aria-label="Digital Solve Timer">
        <div className="practice-timer-card">
          <div className={`timer-status-badge ${statusBadge.className}`}>
            {statusBadge.text}
          </div>

          <div
            className={`massive-digital-timer timer-${timerState} ${
              isSpaceDown && timerState === 'idle' ? 'timer-primed' : ''
            }`}
            aria-live="assertive"
          >
            {getTimerDisplayContent()}
          </div>

          {/* Interactive controls & keyboard hints */}
          <div className="timer-controls-row">
            {timerState === 'idle' && (
              <button
                type="button"
                className="practice-action-btn btn-start"
                onClick={startInspection}
              >
                Start Inspection (Space)
              </button>
            )}

            {timerState === 'inspecting' && penalty !== 'DNF' && (
              <button
                type="button"
                className="practice-action-btn btn-solve"
                onClick={startSolveTimer}
              >
                Start Solve (Space)
              </button>
            )}

            {timerState === 'running' && (
              <button
                type="button"
                className="practice-action-btn btn-stop"
                onClick={stopSolveTimer}
              >
                Stop Timer (Space)
              </button>
            )}

            {timerState === 'stopped' && (
              <button
                type="button"
                className="practice-action-btn btn-reset"
                onClick={handleResetToIdle}
              >
                New Scramble &amp; Reset (Esc)
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

