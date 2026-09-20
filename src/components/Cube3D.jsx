import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { COLOR_PALETTE, getExposedStickers, getMoveRotationInfo } from './cube3DHelpers';

/**
 * 3D Rubik's Cube component rendering 27 individual cubies with realistic
 * beveled plastic bodies and authentic rounded stickers on all exposed faces.
 *
 * Upgraded with:
 * 1. Focus Dimming: Inactive cubies have their unique materials dimmed to 0.25 opacity.
 * 2. Smooth Rotation: useFrame-interpolated pivot group rotation with cosine ease-in-out.
 * 3. 1-Frame Flicker Prevention: Holds target angle until React commits the new state.
 *
 * @param {Object} props
 * @param {string} props.cubeState 54-character state string
 * @param {Object|null} [props.animatingMove] Current in-flight move info { move, duration }
 * @param {Function} [props.onAnimationComplete] Callback when rotation interpolation completes
 */
export default function Cube3D({ cubeState, animatingMove, onAnimationComplete }) {
  // Spacing between cubie centers (1.05 gives a 0.05 unit physical seam)
  const SPACING = 1.05;

  const cubeGroupRef = useRef();
  const pivotGroupRef = useRef();
  const inactiveGroupRef = useRef();

  const startTimeRef = useRef(null);
  const hasCompletedRef = useRef(false);
  const onAnimationCompleteRef = useRef(onAnimationComplete);

  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  // Pre-generate grid coordinates for the 27 cubies: x, y, z in [-1, 0, 1]
  const coordinates = useMemo(() => {
    const coords = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          coords.push({ x, y, z, id: `${x},${y},${z}` });
        }
      }
    }
    return coords;
  }, []);

  // CRITICAL (Edge Case 1 - Material Sharing Bug):
  // Instance independent, unique materials for EACH of the 27 cubies with transparent: true.
  // This guarantees dropping opacity on inactive cubies never dims active cubies!
  const cubieMaterialsMap = useMemo(() => {
    const map = {};
    coordinates.forEach(({ id }) => {
      const stickerMap = {};
      Object.entries(COLOR_PALETTE).forEach(([key, hex]) => {
        stickerMap[key] = new THREE.MeshStandardMaterial({
          color: hex,
          roughness: 0.15,
          metalness: 0.08,
          transparent: true,
          opacity: 1.0,
        });
      });

      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        roughness: 0.45,
        metalness: 0.2,
        transparent: true,
        opacity: 1.0,
      });

      map[id] = { stickerMap, bodyMaterial };
    });
    return map;
  }, [coordinates]);

  // Dispose materials on unmount to prevent GPU memory leaks
  useEffect(() => {
    return () => {
      Object.values(cubieMaterialsMap).forEach(({ stickerMap, bodyMaterial }) => {
        bodyMaterial.dispose();
        Object.values(stickerMap).forEach((mat) => mat.dispose());
      });
    };
  }, [cubieMaterialsMap]);

  // Calculate rotation kinematics (axis, target angle, active cubie predicate) for current move
  const rotInfo = useMemo(() => {
    if (!animatingMove?.move) return null;
    return getMoveRotationInfo(animatingMove.move);
  }, [animatingMove]);

  // Partition cubies into active (rotating on pivot) and inactive (static and dimmed)
  const { activeCoords, inactiveCoords } = useMemo(() => {
    if (!rotInfo) {
      return { activeCoords: [], inactiveCoords: coordinates };
    }
    const active = [];
    const inactive = [];
    for (const coord of coordinates) {
      if (rotInfo.isCubieActive(coord.x, coord.y, coord.z)) {
        active.push(coord);
      } else {
        inactive.push(coord);
      }
    }
    return { activeCoords: active, inactiveCoords: inactive };
  }, [rotInfo, coordinates]);

  // Reset animation timer whenever animatingMove changes
  useEffect(() => {
    startTimeRef.current = null;
    hasCompletedRef.current = false;

    if (animatingMove && rotInfo) {
      // Focus Dimming: Traverse inactive pieces and drop opacity to 0.25
      if (inactiveGroupRef.current) {
        inactiveGroupRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = 0.25;
          }
        });
      }
      // Ensure active pivot pieces stay 1.0
      if (pivotGroupRef.current) {
        pivotGroupRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = 1.0;
          }
        });
      }
    } else {
      // Rest State: Restore all 27 pieces to full opacity 1.0
      if (cubeGroupRef.current) {
        cubeGroupRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.opacity = 1.0;
          }
        });
      }
      // Reset pivot rotation cleanly
      if (pivotGroupRef.current) {
        pivotGroupRef.current.rotation.set(0, 0, 0);
      }
    }
  }, [animatingMove, rotInfo]);

  // Smooth rotation animation loop using useFrame
  useFrame(() => {
    if (!animatingMove || !pivotGroupRef.current || !rotInfo) return;

    const now = performance.now();
    if (startTimeRef.current === null) {
      startTimeRef.current = now;
    }

    const duration = animatingMove.duration || 400;
    const elapsed = now - startTimeRef.current;
    const progress = Math.min(1, elapsed / duration);

    // Smooth Cosine Ease-in-Out Interpolation
    const ease = (1 - Math.cos(progress * Math.PI)) / 2;
    const currentAngle = rotInfo.targetAngle * ease;

    pivotGroupRef.current.rotation[rotInfo.axis] = currentAngle;

    if (progress >= 1 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      // CRITICAL (Edge Case 2 - 1-Frame Flicker Prevention):
      // Keep pivotGroup at rotInfo.targetAngle! Do NOT snap to 0 here.
      // Hold this final orientation until React commits nextCube state in the next render.
      pivotGroupRef.current.rotation[rotInfo.axis] = rotInfo.targetAngle;
      onAnimationCompleteRef.current?.();
    }
  });

  // Helper to render an individual cubie
  const renderCubie = (x, y, z, id) => {
    const cubiePosX = x * SPACING;
    const cubiePosY = y * SPACING;
    const cubiePosZ = z * SPACING;
    const exposedStickers = getExposedStickers(x, y, z, cubeState);
    const mats = cubieMaterialsMap[id];

    return (
      <group key={id} position={[cubiePosX, cubiePosY, cubiePosZ]}>
        {/* Dark plastic cubie body with rounded edges */}
        <RoundedBox
          args={[0.98, 0.98, 0.98]}
          radius={0.07}
          smoothness={4}
          material={mats.bodyMaterial}
        />

        {/* Polished stickers on all exterior faces */}
        {exposedStickers.map((sticker) => {
          const stickerMat =
            mats.stickerMap[sticker.char] ||
            mats.stickerMap.INNER ||
            mats.stickerMap.X;

          return (
            <group
              key={`${sticker.face}-${sticker.stateIndex}`}
              position={sticker.offset}
              rotation={sticker.rotation}
            >
              <RoundedBox
                args={[0.86, 0.86, 0.02]}
                radius={0.04}
                smoothness={3}
                material={stickerMat}
              />
            </group>
          );
        })}
      </group>
    );
  };

  return (
    <>
      {/* Studio Lighting */}
      <ambientLight intensity={1.1} />
      <directionalLight position={[10, 15, 12]} intensity={1.7} />
      <directionalLight position={[-12, -10, -10]} intensity={0.7} />
      <directionalLight position={[-10, 12, -8]} intensity={0.8} />
      <directionalLight position={[0, 0, 10]} intensity={0.4} />

      {/* Camera Controls */}
      <OrbitControls
        enablePan={false}
        minDistance={4.5}
        maxDistance={14}
        dampingFactor={0.06}
      />

      {/* 3D Rubik's Cube Model */}
      <group ref={cubeGroupRef}>
        {/* Rotating Pivot Group: contains active cubies during move animation */}
        <group ref={pivotGroupRef}>
          {activeCoords.map(({ x, y, z, id }) => renderCubie(x, y, z, id))}
        </group>

        {/* Inactive Group: contains static cubies during move animation (dimmed), or all cubies when idle */}
        <group ref={inactiveGroupRef}>
          {inactiveCoords.map(({ x, y, z, id }) => renderCubie(x, y, z, id))}
        </group>
      </group>
    </>
  );
}
