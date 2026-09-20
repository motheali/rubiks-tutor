/**
 * Converts an RGB color value to HSL.
 *
 * @param {number} r - Red channel (0-255)
 * @param {number} g - Green channel (0-255)
 * @param {number} b - Blue channel (0-255)
 * @returns {{ h: number, s: number, l: number }} Hue in degrees (0-360), Saturation (0-100), Lightness (0-100)
 */
export function rgbToHsl(r, g, b) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / delta + 2) * 60;
    } else {
      h = ((rNorm - gNorm) / delta + 4) * 60;
    }
  }

  // Ensure h is in [0, 360)
  h = (h % 360 + 360) % 360;

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Ideal HSL color targets for the 6 standard Rubik's Cube colors.
 * Calibrated for webcam color-shifting.
 */
export const STANDARD_COLORS = {
  Red: { h: 0, s: 100, l: 50 },
  Orange: { h: 25, s: 100, l: 50 },
  Yellow: { h: 55, s: 100, l: 50 },
  Green: { h: 130, s: 100, l: 50 },
  Blue: { h: 215, s: 100, l: 50 },
  White: { h: 0, s: 0, l: 100 },
};

/**
 * Calibrated Hue anchors for circular distance matching
 */
export const HSL_HUE_ANCHORS = {
  Red: 0,
  Orange: 25,
  Yellow: 55,
  Green: 130,
  Blue: 215,
};

/**
 * Maps standard color names to single-character cube face notation keys
 */
export const COLOR_NAME_TO_KEY = {
  White: 'U',
  Red: 'R',
  Green: 'F',
  Yellow: 'D',
  Orange: 'L',
  Blue: 'B',
  U: 'U',
  R: 'R',
  F: 'F',
  D: 'D',
  L: 'L',
  B: 'B',
};

/**
 * Maps single-character cube face notation keys to standard color names
 */
export const COLOR_KEY_TO_NAME = {
  U: 'White',
  R: 'Red',
  F: 'Green',
  D: 'Yellow',
  L: 'Orange',
  B: 'Blue',
};

/**
 * Hex color values corresponding to standard colors for high-contrast UI display
 */
export const STANDARD_COLOR_HEX = {
  White: '#FFFFFF',
  Red: '#EF4444',
  Green: '#22C55E',
  Orange: '#F97316',
  Blue: '#3B82F6',
  Yellow: '#EAB308',
  U: '#FFFFFF',
  R: '#EF4444',
  F: '#22C55E',
  D: '#EAB308',
  L: '#F97316',
  B: '#3B82F6',
};

/**
 * Guided scan sequence for all 6 faces in standard Rubik's cube string order:
 * U (Up), R (Right), F (Front), D (Down), L (Left), B (Back)
 */
export const SCAN_SEQUENCE = [
  {
    step: 0,
    face: 'U',
    name: 'Up',
    colorName: 'White',
    centerIndex: 4,
    instruction: 'Scan the TOP face (usually White center).',
    orientationCue: 'Hold Green front facing you, White on top.',
  },
  {
    step: 1,
    face: 'R',
    name: 'Right',
    colorName: 'Red',
    centerIndex: 13,
    instruction: 'Scan the RIGHT face (usually Red center).',
    orientationCue: 'Keep White on top, turn cube to show Red.',
  },
  {
    step: 2,
    face: 'F',
    name: 'Front',
    colorName: 'Green',
    centerIndex: 22,
    instruction: 'Scan the FRONT face (usually Green center).',
    orientationCue: 'Keep White on top, turn cube to show Green.',
  },
  {
    step: 3,
    face: 'D',
    name: 'Down',
    colorName: 'Yellow',
    centerIndex: 31,
    instruction: 'Scan the BOTTOM face (usually Yellow center).',
    orientationCue: 'Turn cube upside down, Green facing you.',
  },
  {
    step: 4,
    face: 'L',
    name: 'Left',
    colorName: 'Orange',
    centerIndex: 40,
    instruction: 'Scan the LEFT face (usually Orange center).',
    orientationCue: 'Keep White on top, turn cube to show Orange.',
  },
  {
    step: 5,
    face: 'B',
    name: 'Back',
    colorName: 'Blue',
    centerIndex: 49,
    instruction: 'Scan the BACK face (usually Blue center).',
    orientationCue: 'Keep White on top, turn cube to show Blue.',
  },
];

/**
 * Validates the flattened 54-sticker cube state scanned from all 6 faces.
 * A physically valid Rubik's cube MUST have exactly 9 occurrences of each of the 6 colors.
 *
 * @param {Array<Array<string|Object>>} scannedFaces - Array of 6 faces, each containing 9 colors
 * @returns {{
 *   isValid: boolean,
 *   counts: Record<string, number>,
 *   stateString: string,
 *   error: string | null
 * }}
 */
export function validateFullCubeScan(scannedFaces) {
  if (!scannedFaces || scannedFaces.length !== 6) {
    return {
      isValid: false,
      counts: {},
      stateString: '',
      error: 'Incomplete scan: All 6 faces must be scanned before validation.',
    };
  }

  const flattenedKeys = [];

  for (let step = 0; step < 6; step++) {
    const face = scannedFaces[step];
    if (!face || face.length !== 9) {
      return {
        isValid: false,
        counts: {},
        stateString: '',
        error: `Face ${step + 1} (${SCAN_SEQUENCE[step]?.name || step}) is incomplete.`,
      };
    }

    for (let i = 0; i < 9; i++) {
      const item = face[i];
      const colorVal =
        typeof item === 'object' && item !== null
          ? item.matchedColor || item.key || item.matchedKey
          : item;
      const key = COLOR_NAME_TO_KEY[colorVal] || colorVal;
      flattenedKeys.push(key);
    }
  }

  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
  for (const key of flattenedKeys) {
    if (counts[key] !== undefined) {
      counts[key]++;
    }
  }

  const expectedFaces = ['U', 'R', 'F', 'D', 'L', 'B'];
  const isCountValid = expectedFaces.every((f) => counts[f] === 9);
  const stateString = flattenedKeys.join('');

  if (!isCountValid) {
    return {
      isValid: false,
      counts,
      stateString,
      error: 'Invalid cube state detected. The lighting may have skewed a color. Please review and rescan.',
    };
  }

  return {
    isValid: true,
    counts,
    stateString,
    error: null,
  };
}

/**
 * Calculates the closest standard Rubik's Cube color using calibrated HSL heuristics.
 *
 * 1. Broaden the White Net: If the averaged Saturation is < 35 OR the averaged Lightness is > 70,
 *    immediately return White (bypassing Hue calculation).
 * 2. For remaining colors, compares scanned Hue to the 5 calibrated Hue anchors using circular distance:
 *    Distance = min(|scannedH - targetH|, 360 - |scannedH - targetH|)
 *
 * @param {number} r - Scanned Red value (0-255)
 * @param {number} g - Scanned Green value (0-255)
 * @param {number} b - Scanned Blue value (0-255)
 * @returns {string} Name of the closest standard color ('White', 'Red', 'Green', 'Orange', 'Blue', 'Yellow')
 */
export function getClosestColor(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);

  // 1. Broaden the White Net:
  // If the averaged Saturation is < 35 OR the averaged Lightness is > 70, immediately return White.
  // (Do not check Hue at all for these pixels).
  if (s < 35 || l > 70) {
    return 'White';
  }

  // 2. Circular distance formula on the 5 colored anchors:
  // Red: 0, Orange: 25, Yellow: 55, Green: 130, Blue: 215
  let minDistance = Infinity;
  let closestColor = 'Red';

  for (const [colorName, targetHue] of Object.entries(HSL_HUE_ANCHORS)) {
    const diff = Math.abs(h - targetHue);
    const circularDistance = Math.min(diff, 360 - diff);

    if (circularDistance < minDistance) {
      minDistance = circularDistance;
      closestColor = colorName;
    }
  }

  return closestColor;
}

/**
 * Averages RGB values across an array of RGBA pixel bytes (e.g. from a 5x5 block).
 *
 * @param {Uint8ClampedArray|number[]} data - RGBA pixel data
 * @returns {[number, number, number]} Averaged [r, g, b]
 */
export function averageRgbFromImageData(data) {
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  const count = data.length / 4;
  if (count === 0) return [0, 0, 0];

  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
  }

  return [
    Math.round(totalR / count),
    Math.round(totalG / count),
    Math.round(totalB / count),
  ];
}

/**
 * Calculates the exact pixel coordinates on the intrinsic video canvas
 * corresponding to a point (domX, domY) inside the CSS container when using `object-fit: cover`.
 *
 * @param {Object} params
 * @param {number} params.domX - X position relative to container
 * @param {number} params.domY - Y position relative to container
 * @param {number} params.displayWidth - CSS width of the video container
 * @param {number} params.displayHeight - CSS height of the video container
 * @param {number} params.videoWidth - Intrinsic width of video stream
 * @param {number} params.videoHeight - Intrinsic height of video stream
 * @returns {{ x: number, y: number }} Clamped integer coordinates on the canvas
 */
export function calculateReticleCenterInCanvas({
  domX,
  domY,
  displayWidth,
  displayHeight,
  videoWidth,
  videoHeight,
}) {
  if (!displayWidth || !displayHeight || !videoWidth || !videoHeight) {
    return { x: 0, y: 0 };
  }

  // object-fit: cover scales video to cover container while maintaining aspect ratio
  const scale = Math.max(displayWidth / videoWidth, displayHeight / videoHeight);
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;

  // By default, object-fit: cover centers the content (50% 50%)
  const offsetX = (renderedWidth - displayWidth) / 2;
  const offsetY = (renderedHeight - displayHeight) / 2;

  // Map DOM point to intrinsic canvas resolution
  const canvasX = Math.round((domX + offsetX) / scale);
  const canvasY = Math.round((domY + offsetY) / scale);

  // Clamp within canvas boundaries
  const clampedX = Math.max(0, Math.min(videoWidth - 1, canvasX));
  const clampedY = Math.max(0, Math.min(videoHeight - 1, canvasY));

  return { x: clampedX, y: clampedY };
}

/**
 * Calculates the 9 center pixel coordinates of a 3x3 reticle overlay
 * mapped to the intrinsic canvas resolution.
 *
 * @param {Object} params
 * @param {DOMRect|{left: number, top: number, width: number, height: number}} params.videoRect
 * @param {DOMRect|{left: number, top: number, width: number, height: number}} params.overlayRect
 * @param {number} params.videoWidth
 * @param {number} params.videoHeight
 * @returns {Array<{ index: number, row: number, col: number, x: number, y: number }>}
 */
export function getReticleCenterPixels({
  videoRect,
  overlayRect,
  videoWidth,
  videoHeight,
}) {
  const relOverlayLeft = overlayRect.left - videoRect.left;
  const relOverlayTop = overlayRect.top - videoRect.top;
  const cellWidth = overlayRect.width / 3;
  const cellHeight = overlayRect.height / 3;

  const centers = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const domX = relOverlayLeft + (col + 0.5) * cellWidth;
      const domY = relOverlayTop + (row + 0.5) * cellHeight;

      const pt = calculateReticleCenterInCanvas({
        domX,
        domY,
        displayWidth: videoRect.width,
        displayHeight: videoRect.height,
        videoWidth,
        videoHeight,
      });

      centers.push({ index: row * 3 + col, row, col, ...pt });
    }
  }

  return centers;
}
