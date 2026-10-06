import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, Object3D, type Color, type InstancedMesh } from "three";
import type { Vec3 } from "@/domain/map/project";

// A truck is one plain cube in its status colour, sitting on the ground. No cab, wheels or logos.
export const TRUCK = { size: 0.42 } as const;

export type TruckInstance = { position: Vec3; heading: number; color: Color };

/** All trucks as one instanced mesh of cubes. Hover and click report the truck's index. */
export function Trucks({
  trucks,
  onHover,
  onSelect,
}: {
  trucks: readonly TruckInstance[];
  onHover?: (index: number | null) => void;
  onSelect?: (index: number) => void;
}) {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new BoxGeometry(TRUCK.size, TRUCK.size, TRUCK.size).translate(0, TRUCK.size / 2, 0), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  // Room in steps of a power of two, so a replay's changing truck count doesn't rebuild the mesh.
  const capacity = Math.max(64, 2 ** Math.ceil(Math.log2(Math.max(1, trucks.length))));

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    trucks.forEach(({ position: p, heading, color }, i) => {
      o.position.set(p.x, p.y, p.z);
      o.rotation.set(0, heading, 0);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, color);
    });
    mesh.count = trucks.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [trucks]);

  if (trucks.length === 0) return null;
  const handlers = {
    onPointerMove: (e: { stopPropagation(): void; instanceId?: number }) => {
      e.stopPropagation();
      onHover?.(e.instanceId ?? null);
    },
    onPointerOut: () => onHover?.(null),
    onClick: (e: { stopPropagation(): void; instanceId?: number }) => {
      e.stopPropagation();
      if (e.instanceId !== undefined) onSelect?.(e.instanceId);
    },
  };
  return (
    <instancedMesh key={capacity} ref={ref} args={[geometry, undefined, capacity]} {...handlers}>
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
