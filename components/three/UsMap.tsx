'use client'

import { useThree } from '@react-three/fiber'
import { DoubleSide } from 'three'
import { MAP_H, MAP_W } from '@/lib/project'
import { usMap } from './usMapGeometry'
import { useMapZone } from './useMapZone'
import { useThemeColors } from './useThemeColors'

// Share of the map column the map may fill.
const FILL = 0.95

// 4 region meshes + 2 line sets = 6 draw calls.
export default function UsMap() {
  const colors = useThemeColors()
  const zone = useMapZone()
  const { width, height } = useThree((s) => s.size)
  if (!zone) return null

  const { regions, stateBorders, regionBorders } = usMap()
  const scale = Math.min((zone.w * FILL) / MAP_W, (zone.h * FILL) / MAP_H)
  // Orthographic camera at zoom 1: one world unit is one canvas pixel, origin at the center.
  const cx = zone.x + zone.w / 2 - width / 2
  const cy = height / 2 - (zone.y + zone.h / 2)

  return (
    <group position={[cx, cy, 0]} scale={scale}>
      {regions.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry} name={id}>
          <meshBasicMaterial color={colors.land} side={DoubleSide} />
        </mesh>
      ))}
      <lineSegments geometry={stateBorders} position-z={0.1}>
        <lineBasicMaterial color={colors.bg} />
      </lineSegments>
      <lineSegments geometry={regionBorders} position-z={0.2}>
        <lineBasicMaterial color={colors.muted} />
      </lineSegments>
    </group>
  )
}
