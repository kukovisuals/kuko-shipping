import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry, type Color } from "three";
import type { Vec3 } from "@/domain/map/project";

/** Many straight segments in one draw call, all one colour: state borders, roads. */
export function Lines({ segments, color, opacity = 1 }: { segments: readonly (readonly [Vec3, Vec3])[]; color: Color; opacity?: number }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(segments.length * 6);
    segments.forEach(([p, q], i) => positions.set([p.x, p.y, p.z, q.x, q.y, q.z], i * 6));
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    return g;
  }, [segments]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} toneMapped={false} transparent={opacity < 1} opacity={opacity} />
    </lineSegments>
  );
}
