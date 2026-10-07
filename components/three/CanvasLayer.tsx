"use client";

import dynamic from "next/dynamic";
import MapCards from "./MapCards";

// WebGL can't render on the server (wiki 04 step 6).
const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function CanvasLayer() {
  return (
    <>
      <Scene />
      <MapCards />
    </>
  );
}
