import { useMemo } from "react";
import { project, type LatLng } from "@/domain/map/project";
import type { StockFlag } from "@/domain/stock/lowStock";
import { STOCK_TOKEN, glow } from "@/engine/colors";
import { Label } from "@/engine/Label";
import { THEME } from "@/ui/theme";

const WIDTH = 1.6;

/** A box tower; the square ring at its base shows the worst stock flag there. */
export function Warehouse({ at, name, height, flag }: { at: LatLng; name: string; height: number; flag: StockFlag }) {
  const p = project(at);
  const ringColor = useMemo(() => glow(STOCK_TOKEN[flag], 2.2), [flag]);
  const capColor = useMemo(() => glow("accent", 2.4), []);

  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position-y={height / 2}>
        <boxGeometry args={[WIDTH, height, WIDTH]} />
        <meshStandardMaterial color={THEME.solidSide} />
      </mesh>
      <mesh position-y={height + 0.1}>
        <boxGeometry args={[WIDTH + 0.1, 0.2, WIDTH + 0.1]} />
        <meshBasicMaterial color={capColor} toneMapped={false} />
      </mesh>
      {/* A 4-segment ring turned 45° is a square outline. */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position-y={0.35}>
        <ringGeometry args={[WIDTH * 1.05, WIDTH * 1.25, 4]} />
        <meshBasicMaterial color={ringColor} toneMapped={false} />
      </mesh>
      <Label text={name} position={[0, height + 0.8, 0]} />
    </group>
  );
}
