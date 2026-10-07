'use client'

import { DoubleSide } from 'three'
import { MAP_BOX, usMap } from './usMapGeometry'
import MapObjects from './MapObjects'
import { dimColor, useRegionDims } from './useRegionDims'
import { useZoneFit } from './useZone'
import { useThemeColors } from './useThemeColors'

// 4 region meshes + 2 line sets (state borders, region outlines) = 6 draw calls, plus MapObjects.
// The other regions fade when one is selected (callout 2).
export default function UsMap() {
  const colors = useThemeColors()
  const dims = useRegionDims()
  const fit = useZoneFit('.map', MAP_BOX.w, MAP_BOX.h)
  if (!fit) return null

  const { regions, stateBorders, regionOutlines } = usMap()

  return (
    <group position={fit.position} scale={fit.scale}>
      {regions.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry} name={id}>
          <meshBasicMaterial color={dimColor(colors.land, colors.bg, dims[id])} side={DoubleSide} />
        </mesh>
      ))}
      <lineSegments geometry={stateBorders} position-z={0.1}>
        <lineBasicMaterial color={colors.bg} />
      </lineSegments>
      <lineSegments geometry={regionOutlines} position-z={0.2}>
        <lineBasicMaterial color={colors.muted} />
      </lineSegments>
      <MapObjects />
    </group>
  )
}
