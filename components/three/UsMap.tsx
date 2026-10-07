'use client'

import { DoubleSide } from 'three'
import { MAP_H, MAP_W } from '@/lib/project'
import { usMap } from './usMapGeometry'
import MapObjects from './MapObjects'
import { useZoneFit } from './useZone'
import { useThemeColors } from './useThemeColors'

// 4 region meshes + 2 line sets (state borders, region outlines) = 6 draw calls, plus MapObjects.
export default function UsMap() {
  const colors = useThemeColors()
  // A little extra room: the regions are drawn apart and lanes run past the east coast.
  const fit = useZoneFit('.map', MAP_W + 90, MAP_H + 70)
  if (!fit) return null

  const { regions, stateBorders, regionOutlines } = usMap()

  return (
    <group position={fit.position} scale={fit.scale}>
      {regions.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry} name={id}>
          <meshBasicMaterial color={colors.land} side={DoubleSide} />
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
