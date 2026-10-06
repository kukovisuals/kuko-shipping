import { useLayoutEffect, useMemo, useRef } from "react";
import { CircleGeometry, DoubleSide, Object3D, type InstancedMesh } from "three";
import { project, type LatLng } from "@/domain/map/project";
import { pinRadius } from "@/domain/map/scale";
import { usePalette } from "@/engine/palette";

/** Halo radius as a multiple of the disc's. */
const HALO = 1.9;

/** A flat grey disc with a soft halo at each destination, lying on the land; wider for more shipments. */
export function Pins({ pins, y }: { pins: readonly (LatLng & { count: number })[]; y: number }) {
  const disc = useRef<InstancedMesh>(null);
  const halo = useRef<InstancedMesh>(null);
  const { glow } = usePalette();
  const core = useMemo(() => glow("muted", 1), [glow]);
  const rim = useMemo(() => glow("neon", 1), [glow]);
  const flat = useMemo(() => new CircleGeometry(1, 40).rotateX(-Math.PI / 2), []);

  useLayoutEffect(() => {
    const o = new Object3D();
    pins.forEach((pin, i) => {
      const r = pinRadius(pin.count);
      const p = project(pin, y);
      o.position.set(p.x, p.y + 0.02, p.z);
      o.scale.set(r, 1, r);
      o.updateMatrix();
      disc.current?.setMatrixAt(i, o.matrix);
      o.position.y = p.y + 0.01;
      o.scale.set(r * HALO, 1, r * HALO);
      o.updateMatrix();
      halo.current?.setMatrixAt(i, o.matrix);
    });
    for (const mesh of [disc.current, halo.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [pins, y]);

  if (pins.length === 0) return null;
  return (
    <>
      <instancedMesh key={`h${pins.length}`} ref={halo} args={[flat, undefined, pins.length]}>
        <meshBasicMaterial color={rim} transparent opacity={0.55} depthWrite={false} side={DoubleSide} toneMapped={false} />
      </instancedMesh>
      <instancedMesh key={`d${pins.length}`} ref={disc} args={[undefined, undefined, pins.length]}>
        <cylinderGeometry args={[1, 1, 0.04, 40]} />
        <meshBasicMaterial color={core} toneMapped={false} />
      </instancedMesh>
    </>
  );
}
