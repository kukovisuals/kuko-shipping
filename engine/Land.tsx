import { useLayoutEffect, useRef } from "react";
import { Object3D, type InstancedMesh } from "three";
import { MAP, project, type LatLng } from "@/domain/map/project";
import { THEME } from "@/ui/theme";

type Bounds = { west: number; east: number; south: number; north: number };

/** Sea floor plus one instanced box per land cell. */
export function Land({ cells, cellDeg, bounds }: { cells: readonly LatLng[]; cellDeg: number; bounds: Bounds }) {
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

  const size = cellDeg * MAP.landCellFill;
  const sea = 160; // floor reaches past the fog in every direction
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[(bounds.west + bounds.east) / 2, -0.02, -(bounds.south + bounds.north) / 2]}>
        <planeGeometry args={[bounds.east - bounds.west + sea, bounds.north - bounds.south + sea]} />
        <meshStandardMaterial color={THEME.ground} />
      </mesh>
      <instancedMesh key={cells.length} ref={ref} args={[undefined, undefined, cells.length]}>
        <boxGeometry args={[size, MAP.landCellHeight, size]} />
        <meshStandardMaterial color={THEME.body} />
      </instancedMesh>
    </group>
  );
}
