import { useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import { COLOR_PALETTE, getExposedStickers } from './cube3DHelpers';

/**
 * 3D Rubik's Cube component rendering 27 individual cubies with realistic
 * beveled plastic bodies and authentic rounded stickers on all exposed faces.
 *
 * Designed to be rendered inside a <Canvas> container.
 *
 * @param {Object} props
 * @param {string} props.cubeState 54-character state string (e.g. solved or scrambled)
 */
export default function Cube3D({ cubeState }) {
  // Spacing between cubie centers (1.05 gives a 0.05 unit physical seam)
  const SPACING = 1.05;

  // Cached materials for the sticker colors and base plastic body
  const materials = useMemo(() => {
    const map = {};
    Object.entries(COLOR_PALETTE).forEach(([key, hex]) => {
      map[key] = new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.15,
        metalness: 0.08,
      });
    });

    // Dark base plastic body for the cubie core
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.45,
      metalness: 0.2,
    });

    return { map, bodyMaterial };
  }, []);

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
      <group>
        {coordinates.map(({ x, y, z, id }) => {
          const cubiePosX = x * SPACING;
          const cubiePosY = y * SPACING;
          const cubiePosZ = z * SPACING;

          // Retrieve exposed sticker metadata for this cubie
          const exposedStickers = getExposedStickers(x, y, z, cubeState);

          return (
            <group
              key={id}
              position={[cubiePosX, cubiePosY, cubiePosZ]}
            >
              {/* Dark plastic cubie body with rounded edges */}
              <RoundedBox
                args={[0.98, 0.98, 0.98]}
                radius={0.07}
                smoothness={4}
                material={materials.bodyMaterial}
              />

              {/* Polished stickers on all exterior faces */}
              {exposedStickers.map((sticker) => {
                const stickerMat =
                  materials.map[sticker.char] ||
                  materials.map.INNER ||
                  materials.map.X;

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
        })}
      </group>
    </>
  );
}
