import { useRef, useState, useEffect, useCallback } from 'react';
import {
  getReticleCenterPixels,
  getClosestColor,
  COLOR_NAME_TO_KEY,
  COLOR_KEY_TO_NAME,
  STANDARD_COLOR_HEX,
} from './cameraScannerMath';

export default function CameraScanner({ onClose, onScan, onApplyFace, defaultFace = 'F' }) {
  // 1. State & Refs Setup
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(null);
  const [scanResult, setScanResult] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFace, setSelectedFace] = useState(defaultFace);

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

  // 4. The Canvas Capture Math (captureFace function)
  const captureFace = useCallback(() => {
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

    // Run loop 9 times using a 5x5 pixel block (anti-glare averaging)
    // and map averaged RGB through calibrated HSL getClosestColor
    const extractedColors = [];
    for (let i = 0; i < centerPixels.length; i++) {
      const { x, y } = centerPixels[i];

      // Extract a 5x5 pixel block ctx.getImageData(canvasX - 2, canvasY - 2, 5, 5).data
      const startX = Math.max(0, Math.min(canvas.width - 5, x - 2));
      const startY = Math.max(0, Math.min(canvas.height - 5, y - 2));
      const blockData = context.getImageData(startX, startY, 5, 5).data;

      // Loop through the 25 pixels, average out R, G, and B values
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

    // Save these 9 RGB arrays and matched colors into state and log them
    setScanResult(extractedColors);
    console.log('CameraScanner: Captured & Matched 9 Standard Face Colors:', extractedColors);

    // Auto-detect target face from the scanned center tile (index 4)
    if (extractedColors[4]?.matchedKey) {
      setSelectedFace(extractedColors[4].matchedKey);
    }

    if (onScan) {
      onScan(extractedColors);
    }
  }, [onScan]);

  // Apply matched face colors to the 3D cube state and unmount scanner
  const handleApplyFace = useCallback(() => {
    if (!scanResult || scanResult.length !== 9) return;

    // Send array of 9 matched color names/keys to the parent handler
    const matchedColorsArray = scanResult.map((c) => c.matchedColor);

    if (onApplyFace) {
      onApplyFace(matchedColorsArray, selectedFace);
    }

    if (onClose) {
      onClose();
    }
  }, [scanResult, selectedFace, onApplyFace, onClose]);

  return (
    <div className="camera-scanner-wrapper">
      <div className="camera-scanner-header">
        <div className="camera-scanner-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 className="camera-scanner-title">📷 Face Scanner</h3>
            {isScanning && <span className="scanner-live-badge">● LIVE</span>}
          </div>
          <span className="camera-scanner-subtitle">
            Align the 3x3 grid over a Rubik&apos;s Cube face
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

      {/* Target Face Selector Row */}
      <div className="target-face-selector-row">
        <label htmlFor="target-face-select" className="target-face-label">
          Target Cube Face:
        </label>
        <select
          id="target-face-select"
          className="target-face-select"
          value={selectedFace}
          onChange={(e) => setSelectedFace(e.target.value)}
        >
          <option value="F">Front (F - Green)</option>
          <option value="R">Right (R - Red)</option>
          <option value="B">Back (B - Blue)</option>
          <option value="L">Left (L - Orange)</option>
          <option value="U">Up (U - White)</option>
          <option value="D">Down (D - Yellow)</option>
        </select>
      </div>

      {/* 3. UI & Reticle Overlay Container */}
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

      {/* Controls & Capture Button */}
      <div className="camera-scanner-actions">
        <button
          type="button"
          className="capture-face-btn"
          onClick={captureFace}
          disabled={hasPermission !== true}
        >
          📸 Capture Face
        </button>
      </div>

      {/* Matched Standard Colors 3x3 Grid Swatches Display */}
      {scanResult.length === 9 && (
        <div className="scan-result-container">
          <div className="scan-result-header">
            <span className="scan-result-heading">
              Matched Colors for {COLOR_KEY_TO_NAME[selectedFace] || selectedFace} Face:
            </span>
            <span className="scan-result-badge">
              Center: {scanResult[4]?.matchedColor}
            </span>
          </div>

          <div className="scan-result-grid" aria-label="3x3 Matched Standard Colors">
            {scanResult.map((item, idx) => {
              const isCenter = idx === 4;
              const isLightColor = item.matchedColor === 'White' || item.matchedColor === 'Yellow';
              return (
                <div
                  key={idx}
                  className={`matched-swatch-box ${isCenter ? 'center-swatch' : ''}`}
                  style={{
                    backgroundColor: item.hex,
                    color: isLightColor ? '#0f172a' : '#ffffff',
                  }}
                  title={`Position ${idx + 1}: ${item.matchedColor} (${item.matchedKey}) [rgb: ${item.r}, ${item.g}, ${item.b}]`}
                >
                  <span className="matched-swatch-name">{item.matchedColor}</span>
                  <span className="matched-swatch-key">({item.matchedKey})</span>
                  {isCenter && <span className="center-indicator-tag">Center</span>}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="apply-to-cube-btn"
            onClick={handleApplyFace}
            title={`Apply these 9 colors to the ${selectedFace} face of the 3D cube`}
          >
            🧩 Apply to {COLOR_KEY_TO_NAME[selectedFace] || selectedFace} Face
          </button>
        </div>
      )}
    </div>
  );
}
