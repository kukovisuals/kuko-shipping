import { useEffect, useMemo } from "react";
import { EdgesGeometry, PlaneGeometry } from "three";
import { glow } from "@/engine/colors";
import { THEME } from "@/ui/theme";

/** A flat pad where loading trucks park, with a thin glowing edge. */
export function Dock({ box, y }: { box: { west: number; east: number; south: number; north: number }; y: number }) {
  const w = box.east - box.west;
  const d = box.north - box.south;
  const edge = useMemo(() => glow("flow", 0.9), []);
  const outline = useMemo(() => {
    const plane = new PlaneGeometry(w, d).rotateX(-Math.PI / 2);
    const edges = new EdgesGeometry(plane);
    plane.dispose();
    return edges;
  }, [w, d]);
  useEffect(() => () => outline.dispose(), [outline]);

  return (
    <group position={[(box.west + box.east) / 2, 0, -(box.south + box.north) / 2]}>
      <mesh position-y={y / 2}>
        <boxGeometry args={[w, y, d]} />
        <meshStandardMaterial color={THEME.road} />
      </mesh>
      <lineSegments geometry={outline} position-y={y + 0.005}>
        <lineBasicMaterial color={edge} toneMapped={false} transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}
