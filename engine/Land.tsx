import { useLayoutEffect, useRef } from "react";
import { Object3D, type InstancedMesh } from "three";
import { MAP, project, type LatLng } from "@/domain/map/project";
import { THEME } from "@/ui/theme";

/** Sea floor plus one instanced box per land cell. */
export function Land({ cells }: { cells: readonly LatLng[] }) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    cells.forEach((cell, i) => {
      const p = project(cell, MAP.landCellHeight / 2);
      o.position.set(p.x, p.y, p.z);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [cells]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02}>
        <planeGeometry args={[MAP.width, MAP.height]} />
        <meshStandardMaterial color={THEME.ground} />
      </mesh>
      <instancedMesh key={cells.length} ref={ref} args={[undefined, undefined, cells.length]}>
        <boxGeometry args={[MAP.landCellSize, MAP.landCellHeight, MAP.landCellSize]} />
        <meshStandardMaterial color={THEME.body} />
      </instancedMesh>
    </group>
  );
}
