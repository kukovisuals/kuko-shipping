"use client";

import { Canvas } from "@react-three/fiber";

// M1 test cube: proves the Canvas renders behind the DOM.
// Kuko replaces this with the map in M7 (3D_MODE: PAIR).
export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <mesh rotation={[0.5, 0.6, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshBasicMaterial color="#c0392b" />
      </mesh>
    </Canvas>
  );
}
