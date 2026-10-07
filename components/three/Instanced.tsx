'use client'

import { useLayoutEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, Matrix4, type BufferGeometry, type InstancedMesh } from 'three'

export type Item = { x: number; y: number; sx?: number; sy?: number; color: string }

// Many copies of one shape in ONE draw call (wiki 10). Each item has a position,
// an optional stretch, and its own color.
export default function Instanced({ items, geometry, z }: { items: Item[]; geometry: BufferGeometry; z: number }) {
  const ref = useRef<InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new Matrix4()
    const color = new Color()
    items.forEach((it, i) => {
      mesh.setMatrixAt(i, matrix.makeScale(it.sx ?? 1, it.sy ?? 1, 1).setPosition(it.x, it.y, z))
      mesh.setColorAt(i, color.set(it.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    invalidate()
  }, [items, z, invalidate])

  if (items.length === 0) return null
  return (
    // Culling uses the single base shape's bounds, which would hide the copies.
    <instancedMesh key={items.length} ref={ref} args={[geometry, undefined, items.length]} frustumCulled={false}>
      <meshBasicMaterial />
    </instancedMesh>
  )
}
