import { useRef, useState, useEffect, useCallback } from 'react';
import {
  getReticleCenterPixels,
  getClosestColor,
  COLOR_NAME_TO_KEY,
  COLOR_KEY_TO_NAME,
  STANDARD_COLOR_HEX,
  SCAN_SEQUENCE,
  validateFullCubeScan,
} from './cameraScannerMath';

export default function CameraScanner({
  onClose,
  onScan,
  onApplyFace,
  onApplyFullCube,
}) {
  // 1. State & Refs Setup
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 6-Face Wizard State Machine
  const [currentScanStep, setCurrentScanStep] = useState(0); // 0 (U) to 5 (B)
  const [scannedFaces, setScannedFaces] = useState(() => Array(6).fill(null));
  const [lastScannedColors, setLastScannedColors] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [validationCounts, setValidationCounts] = useState(null);

  const currentFace = SCAN_SEQUENCE[currentScanStep] || SCAN_SEQUENCE[0];

  // 2. Camera Lifecycle & Permissions (useEffect)
  useEffect(() => {
    let isMounted = true;
    let localStream = null;
    const videoEl = videoRef.current;

    const startCamera = async () => {
      setErrorMessage('');
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error('Camera API (navigator.mediaDevices.getUserMedia) is not supported in this browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        localStream = stream;

        if (!isMounted) {
          // If unmounted while getUserMedia was resolving, immediately stop tracks
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoEl) {
          videoEl.srcObject = stream;
          try {
            await videoEl.play();
            if (isMounted) {
              setIsScanning(true);
            }
          } catch (playErr) {
            console.warn('Auto-play was blocked or failed:', playErr);
          }
        }

        if (isMounted) {
          setHasPermission(true);
        }
      } catch (err) {
        console.error('Camera access error:', err);
        if (isMounted) {
          setHasPermission(false);
          setErrorMessage(err.message || 'Unable to access camera.');
        }
      }
    };

    startCamera();

    // CRITICAL CLEANUP: Stop all tracks when unmounting so webcam light turns off
    return () => {
      isMounted = false;

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject;
        if (stream.getTracks) {
          stream.getTracks().forEach((track) => track.stop());
        }
        videoEl.srcObject = null;
      }
    };
  }, []);

  // 3. Capture Logic Update: 5x5 Pixel Averaging + Step Progression + Strict Validation
  const captureCurrentFace = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;

    if (!video || !canvas || !overlay) {
      console.error('CameraScanner: Missing video, canvas, or overlay ref.');
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) {
      console.warn('CameraScanner: Video stream dimensions are not available yet.');
      return;
    }

    // Set canvas dimensions to match intrinsic video resolution
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      console.error('CameraScanner: Failed to get canvas 2D rendering context.');
      return;
    }

    // Write the current video frame to the hidden canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Calculate center pixel of each of the 9 reticle squares relative to canvas resolution
    const videoRect = video.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();

    const centerPixels = getReticleCenterPixels({
      videoRect,
      overlayRect,
      videoWidth,
      videoHeight,
    });

    // Run loop 9 times using 5x5 pixel block averaging and calibrated HSL matching
    const extractedColors = [];
    for (let i = 0; i < centerPixels.length; i++) {
      const { x, y } = centerPixels[i];

      const startX = Math.max(0, Math.min(canvas.width - 5, x - 2));
      const startY = Math.max(0, Math.min(canvas.height - 5, y - 2));
      const blockData = context.getImageData(startX, startY, 5, 5).data;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      const count = blockData.length / 4; // 25

      for (let p = 0; p < blockData.length; p += 4) {
        sumR += blockData[p];
        sumG += blockData[p + 1];
        sumB += blockData[p + 2];
      }

      const r = Math.round(sumR / count);
      const g = Math.round(sumG / count);
      const b = Math.round(sumB / count);

      const matchedColor = getClosestColor(r, g, b);
      const matchedKey = COLOR_NAME_TO_KEY[matchedColor] || 'U';
      const hex = STANDARD_COLOR_HEX[matchedColor] || '#EEEEEE';

      extractedColors.push({
        index: i,
        r,
        g,
        b,
        rgb: [r, g, b],
        rgbString: `rgb(${r}, ${g}, ${b})`,
        matchedColor, // e.g. 'Green'
        matchedKey,   // e.g. 'F'
        hex,
      });
    }

    setLastScannedColors(extractedColors);
    const matchedNamesArray = extractedColors.map((c) => c.matchedColor);

    // Save to scannedFaces[currentScanStep]
    const nextScannedFaces = [...scannedFaces];
    nextScannedFaces[currentScanStep] = matchedNamesArray;
    setScannedFaces(nextScannedFaces);

    if (onScan) {
      onScan(extractedColors, currentFace.face);
    }

    // Step Progression or Final Validation
    if (currentScanStep < 5) {
      setCurrentScanStep((step) => step + 1);
      setValidationError(null);
      setValidationCounts(null);
    } else {
      // 4. Strict State Validation on 6th (Final) Face
      const validation = validateFullCubeScan(nextScannedFaces);

      if (!validation.isValid) {
        setValidationError(
          validation.error ||
            'Invalid cube state detected. The lighting may have skewed a color. Please review and rescan.'
        );
        setValidationCounts(validation.counts);
      } else {
        setValidationError(null);
        setValidationCounts(validation.counts);

        // Notify parent with full cube scan state
        if (onApplyFullCube) {
          onApplyFullCube(nextScannedFaces, validation.stateString);
        } else if (onApplyFace) {
          // Fallback if parent only provided single-face handler
          onApplyFace(matchedNamesArray, currentFace.face);
        }

        if (onClose) {
          onClose();
        }
      }
    }
  }, [
    scannedFaces,
    currentScanStep,
    currentFace,
    onScan,
    onApplyFullCube,
    onApplyFace,
    onClose,
  ]);

  // Step backward to previous face
  const handleUndo = useCallback(() => {
    if (currentScanStep > 0) {
      setCurrentScanStep((step) => step - 1);
      setValidationError(null);
      setValidationCounts(null);
    }
  }, [currentScanStep]);

  // Restart scan sequence from face 1 (Up)
  const handleResetScan = useCallback(() => {
    setCurrentScanStep(0);
    setScannedFaces(Array(6).fill(null));
    setLastScannedColors(null);
    setValidationError(null);
    setValidationCounts(null);
  }, []);

  return (
    <div className="camera-scanner-wrapper">
      {/* Header */}
      <div className="camera-scanner-header">
        <div className="camera-scanner-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 className="camera-scanner-title">📷 6-Face Cube Scanner</h3>
            {isScanning && <span className="scanner-live-badge">● LIVE</span>}
          </div>
          <span className="camera-scanner-subtitle">
            Follow the guided sequence to scan all 6 faces of your cube
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            className="camera-close-btn"
            onClick={onClose}
            title="Close scanner"
            aria-label="Close scanner"
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Wizard Progress Indicator & Scanned Faces Strip */}
      <div className="wizard-progress-bar">
        <div className="wizard-step-info">
          <span className="wizard-step-badge">
            Face {currentScanStep + 1} of 6: {currentFace.name}
          </span>
          <span className="wizard-step-color">
            Target Center: <strong>{currentFace.colorName}</strong>
          </span>
        </div>

        {/* 6 Step Progress Chips */}
        <div className="scanned-faces-strip" aria-label="Scan Sequence Progress">
          {SCAN_SEQUENCE.map((seq, idx) => {
            const isDone = scannedFaces[idx] !== null;
            const isCurrent = idx === currentScanStep;
            return (
              <div
                key={seq.face}
                className={`scanned-face-chip ${
                  isCurrent ? 'chip-active' : isDone ? 'chip-done' : 'chip-pending'
                }`}
                title={`Face ${idx + 1}: ${seq.name} (${seq.face})`}
              >
                <span className="chip-key">{seq.face}</span>
                {isDone && <span className="chip-check">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Prominent Orientation Instruction Banner */}
      <div className="orientation-instruction-banner" role="alert">
        <span className="instruction-icon" aria-hidden="true">💡</span>
        <div className="instruction-text-group">
          <span className="instruction-title">{currentFace.instruction}</span>
          <span className="instruction-cue">{currentFace.orientationCue}</span>
        </div>
      </div>

      {/* 3. Video & Reticle Overlay Container */}
      <div className="camera-scanner-container">
        <video
          ref={videoRef}
          className="scanner-video"
          playsInline
          muted
          autoPlay
          aria-label="Live Camera Stream"
        />

        {/* 3x3 Reticle Overlay (Position: absolute, centered over video) */}
        <div ref={overlayRef} className="scanner-reticle-overlay" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="reticle-cell">
              <span className="reticle-center-dot" />
            </div>
          ))}
        </div>

        {/* Permission / Status Overlays */}
        {hasPermission === null && (
          <div className="scanner-status-overlay">
            <span className="scanner-spinner" />
            <p>Requesting camera access...</p>
          </div>
        )}

        {hasPermission === false && (
          <div className="scanner-status-overlay scanner-error">
            <span className="scanner-error-icon">⚠️</span>
            <p className="scanner-error-text">
              {errorMessage || 'Camera access denied or unavailable.'}
            </p>
          </div>
        )}
      </div>

      {/* Hidden Canvas used for frame capture and pixel sampling */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Controls: Capture Face & Undo Previous Face */}
      <div className="scanner-wizard-actions">
        <button
          type="button"
          className="capture-face-btn"
          onClick={captureCurrentFace}
          disabled={hasPermission !== true}
          title={`Capture current ${currentFace.name} face`}
        >
          📸 Capture {currentFace.name} Face
        </button>

        {currentScanStep > 0 && (
          <button
            type="button"
            className="undo-face-btn"
            onClick={handleUndo}
            title="Step backward and re-scan previous face"
          >
            ↺ Undo Previous Face
          </button>
        )}
      </div>

      {/* 4. Strict State Validation Error Display */}
      {validationError && (
        <div className="validation-error-card" role="alert">
          <div className="validation-error-title-row">
            <span className="validation-error-icon">⚠️</span>
            <h4 className="validation-error-heading">Validation Error</h4>
          </div>
          <p className="validation-error-desc">{validationError}</p>

          {/* Color counts breakdown */}
          {validationCounts && (
            <div className="validation-counts-grid">
              {Object.entries(validationCounts).map(([key, count]) => {
                const name = COLOR_KEY_TO_NAME[key] || key;
                const isCorrect = count === 9;
                return (
                  <div
                    key={key}
                    className={`count-pill ${isCorrect ? 'count-ok' : 'count-skewed'}`}
                  >
                    <span>{name} ({key}):</span>
                    <strong>{count} / 9</strong>
                  </div>
                );
              })}
            </div>
          )}

          <div className="validation-error-actions">
            <button
              type="button"
              className="rescan-face-btn"
              onClick={captureCurrentFace}
            >
              Rescan Face 6 ({currentFace.name})
            </button>
            <button
              type="button"
              className="undo-face-btn"
              onClick={handleUndo}
            >
              Undo Face 5
            </button>
            <button
              type="button"
              className="reset-scan-btn"
              onClick={handleResetScan}
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Last Scanned Face Swatch Preview (Optional Visual Confirmation) */}
      {lastScannedColors && !validationError && (
        <div className="last-scan-preview">
          <div className="last-scan-header">
            <span className="last-scan-title">
              Last Scanned Face ({SCAN_SEQUENCE[Math.max(0, currentScanStep - 1)]?.name || 'Face'}):
            </span>
          </div>
          <div className="last-scan-grid">
            {lastScannedColors.map((color, idx) => {
              const isLight = color.matchedColor === 'White' || color.matchedColor === 'Yellow';
              return (
                <div
                  key={idx}
                  className="last-scan-swatch"
                  style={{
                    backgroundColor: color.hex,
                    color: isLight ? '#0f172a' : '#ffffff',
                  }}
                  title={`Position ${idx + 1}: ${color.matchedColor}`}
                >
                  <span>{color.matchedKey}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
