import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D, type InstancedMesh } from "three";
import { project, type LatLng } from "@/domain/map/project";
import { pinHeight } from "@/domain/map/scale";
import { glow } from "@/engine/colors";

/** A small glowing post per destination; taller for more shipments. */
export function Pins({ pins }: { pins: readonly (LatLng & { count: number })[] }) {
  const ref = useRef<InstancedMesh>(null);
  const color = useMemo(() => glow("neon", 1.6), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    pins.forEach((pin, i) => {
      const h = pinHeight(pin.count);
      const p = project(pin, h / 2);
      o.position.set(p.x, p.y, p.z);
      o.scale.set(1, h, 1);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [pins]);

  if (pins.length === 0) return null;
  return (
    <instancedMesh key={pins.length} ref={ref} args={[undefined, undefined, pins.length]}>
      <boxGeometry args={[0.28, 1, 0.28]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}
