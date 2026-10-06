import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry, type Color } from "three";
import { arcPoints, type Arc } from "@/domain/map/arc";

export type Route = { arc: Arc; color: Color };

/** Every route in one line-segments draw call, coloured per route. */
export function RouteArcs({ routes, segments }: { routes: readonly Route[]; segments: number }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(routes.length * segments * 6);
    const colors = new Float32Array(routes.length * segments * 6);
    let i = 0;
    for (const { arc, color } of routes) {
      const pts = arcPoints(arc, segments);
      for (let k = 0; k < segments; k++) {
        for (const p of [pts[k], pts[k + 1]]) {
          positions.set([p.x, p.y, p.z], i);
          colors.set([color.r, color.g, color.b], i);
          i += 3;
        }
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("color", new BufferAttribute(colors, 3));
    return g;
  }, [routes, segments]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors toneMapped={false} transparent opacity={0.9} />
    </lineSegments>
  );
}
