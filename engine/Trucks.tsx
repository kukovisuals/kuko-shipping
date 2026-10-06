import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, Object3D, type BufferGeometry, type Color, type InstancedMesh } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Vec3 } from "@/domain/map/project";
import { THEME } from "@/ui/theme";

// A box truck, nose along +X: a cargo box in the status colour and a plain cab. No wheels, no logos.
export const TRUCK = { length: 0.8, width: 0.32, height: 0.34, cabLength: 0.24, clearance: 0.16 } as const;

function parts(): { cargo: BufferGeometry; cab: BufferGeometry } {
  const { length, width, height, cabLength, clearance } = TRUCK;
  const cargoLength = length - cabLength - 0.03;
  const cargo = new BoxGeometry(cargoLength, height, width).translate(-length / 2 + cargoLength / 2, clearance + height / 2, 0);
  const cabBody = new BoxGeometry(cabLength, height * 0.72, width * 0.92).translate(length / 2 - cabLength / 2, clearance + height * 0.36, 0);
  const chassis = new BoxGeometry(length, 0.06, width * 0.8).translate(0, clearance - 0.03, 0);
  const cab = mergeGeometries([cabBody, chassis]);
  cabBody.dispose();
  chassis.dispose();
  return { cargo, cab };
}

export type TruckInstance = { position: Vec3; heading: number; color: Color };

/** All trucks as two instanced meshes (cargo + cab). Hover and click report the truck's index. */
export function Trucks({
  trucks,
  onHover,
  onSelect,
}: {
  trucks: readonly TruckInstance[];
  onHover?: (index: number | null) => void;
  onSelect?: (index: number) => void;
}) {
  const cargoRef = useRef<InstancedMesh>(null);
  const cabRef = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => parts(), []);
  useEffect(() => () => {
    geometry.cargo.dispose();
    geometry.cab.dispose();
  }, [geometry]);

  useLayoutEffect(() => {
    const cargo = cargoRef.current;
    const cab = cabRef.current;
    if (!cargo || !cab) return;
    const o = new Object3D();
    trucks.forEach(({ position: p, heading, color }, i) => {
      o.position.set(p.x, p.y, p.z);
      o.rotation.set(0, heading, 0);
      o.updateMatrix();
      cargo.setMatrixAt(i, o.matrix);
      cab.setMatrixAt(i, o.matrix);
      cargo.setColorAt(i, color);
    });
    for (const mesh of [cargo, cab]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    if (cargo.instanceColor) cargo.instanceColor.needsUpdate = true;
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
    <group>
      <instancedMesh key={`cargo-${trucks.length}`} ref={cargoRef} args={[geometry.cargo, undefined, trucks.length]} {...handlers}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh key={`cab-${trucks.length}`} ref={cabRef} args={[geometry.cab, undefined, trucks.length]} {...handlers}>
        <meshStandardMaterial color={THEME.botBone} />
      </instancedMesh>
    </group>
  );
}
