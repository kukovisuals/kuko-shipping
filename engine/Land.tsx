import { useEffect, useMemo } from "react";
import { ExtrudeGeometry, MeshStandardMaterial, Shape, Vector2 } from "three";
import { MAP } from "@/domain/map/project";
import { usePalette } from "@/engine/palette";

type Bounds = { west: number; east: number; south: number; north: number };
type Ring = readonly (readonly [number, number])[];

/** Sea floor plus the land as one solid slab: every state outline extruded `MAP.landHeight` up.
 * Neighbouring states share a flat top, so the map reads as one clean surface; borders are lines. */
export function Land({ outlines, bounds }: { outlines: readonly Ring[]; bounds: Bounds }) {
  const { colors } = usePalette();
  const geometry = useMemo(() => {
    const shapes = outlines.map((ring) => new Shape(ring.map(([lng, lat]) => new Vector2(lng, lat))));
    // Shapes live in (lng, lat); turning −90° about X puts lat on −Z and the extrusion on +Y.
    return new ExtrudeGeometry(shapes, { depth: MAP.landHeight, bevelEnabled: false }).rotateX(-Math.PI / 2);
  }, [outlines]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  // ExtrudeGeometry's groups: 0 = top and bottom caps, 1 = side walls. The walls take the shade
  // colour so the slab's edge reads in both looks without shadows.
  const materials = useMemo(
    () => [new MeshStandardMaterial({ color: colors.land }), new MeshStandardMaterial({ color: colors.solidShade })],
    [colors],
  );
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  const sea = 160; // floor reaches past the fog in every direction
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[(bounds.west + bounds.east) / 2, -0.02, -(bounds.south + bounds.north) / 2]}>
        <planeGeometry args={[bounds.east - bounds.west + sea, bounds.north - bounds.south + sea]} />
        <meshStandardMaterial color={colors.ground} />
      </mesh>
      <mesh geometry={geometry} material={materials} />
    </group>
  );
}
