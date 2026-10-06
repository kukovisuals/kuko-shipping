import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, Object3D, type BufferGeometry, type Color, type InstancedMesh } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Vec3 } from "@/domain/map/project";

const LIFT = 0.5;

/** A box-built drone: body, four rotors and a hanging cargo crate. */
function droneGeometry(): BufferGeometry {
  const part = (w: number, h: number, d: number, x: number, y: number, z: number) =>
    new BoxGeometry(w, h, d).translate(x, y, z);
  const parts = [
    part(0.9, 0.28, 0.9, 0, 0, 0),
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => part(0.38, 0.08, 0.38, sx * 0.6, 0.2, sz * 0.6))),
    part(0.5, 0.42, 0.5, 0, -0.42, 0),
  ];
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

export type Drone = { position: Vec3; color: Color };

/** All drones in one instanced mesh. Hover and click report the drone's index. */
export function CargoDrones({
  drones,
  onHover,
  onSelect,
}: {
  drones: readonly Drone[];
  onHover?: (index: number | null) => void;
  onSelect?: (index: number) => void;
}) {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => droneGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    drones.forEach(({ position: p, color }, i) => {
      o.position.set(p.x, p.y + LIFT, p.z);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [drones]);

  if (drones.length === 0) return null;
  return (
    <instancedMesh
      key={drones.length}
      ref={ref}
      args={[geometry, undefined, drones.length]}
      onPointerMove={(e) => {
        e.stopPropagation();
        onHover?.(e.instanceId ?? null);
      }}
      onPointerOut={() => onHover?.(null)}
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined) onSelect?.(e.instanceId);
      }}
    >
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
