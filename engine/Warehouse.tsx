import { useMemo } from "react";
import { project, type LatLng } from "@/domain/map/project";
import type { StockFlag } from "@/domain/stock/lowStock";
import { STOCK_TOKEN } from "@/engine/colors";
import { usePalette } from "@/engine/palette";

const RADIUS = 0.35;

/** A small dot on the land where orders leave from; the ring around it shows the worst stock flag there. */
export function Warehouse({ at, y, flag }: { at: LatLng; y: number; flag: StockFlag }) {
  const p = project(at);
  const { glow } = usePalette();
  const ringColor = useMemo(() => glow(STOCK_TOKEN[flag], 2.2), [flag, glow]);
  const dotColor = useMemo(() => glow("accent", 2.4), [glow]);

  return (
    <group position={[p.x, y + 0.02, p.z]} rotation-x={-Math.PI / 2}>
      <mesh>
        <circleGeometry args={[RADIUS, 32]} />
        <meshBasicMaterial color={dotColor} toneMapped={false} />
      </mesh>
      <mesh position-z={0.005}>
        <ringGeometry args={[RADIUS * 1.35, RADIUS * 1.7, 32]} />
        <meshBasicMaterial color={ringColor} toneMapped={false} />
      </mesh>
    </group>
  );
}
