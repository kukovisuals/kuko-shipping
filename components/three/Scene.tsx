"use client";

import { Canvas } from "@react-three/fiber";
import UsMap from "./UsMap";

// Flat, top-down view (wiki 10): orthographic camera, transparent background
// (the page color comes from CSS), no tone mapping (so token colors show as written),
// and draw only when something changes.
export default function Scene() {
  return (
    <Canvas
      orthographic
      flat
      frameloop="demand"
      camera={{ position: [0, 0, 100], zoom: 1 }}
      gl={{ alpha: true }}
    >
      <UsMap />
    </Canvas>
  );
}
