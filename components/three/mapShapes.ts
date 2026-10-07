// Small shapes shared by the map objects. Sizes are in map units (1 unit = 1 projected pixel).
import { BufferGeometry, CircleGeometry, Float32BufferAttribute, RingGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const SEGMENTS = 20

export const dotGeometry = new CircleGeometry(1.8, 10)

// Destination: ring with a center dot.
export const destinationGeometry: BufferGeometry = mergeGeometries([
  new RingGeometry(3.6, 4.8, SEGMENTS),
  new CircleGeometry(1.5, 10),
])!

// Warehouse: concentric rings with a center dot.
export const warehouseGeometry: BufferGeometry = mergeGeometries([
  new RingGeometry(9, 10.2, SEGMENTS),
  new RingGeometry(5.5, 6.7, SEGMENTS),
  new CircleGeometry(2.4, 12),
])!

// Arrowhead at the east end of a horizontal lane: base on the lane's end, tip pointing west.
export const arrowGeometry = (() => {
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute([0, -3.4, 0, 0, 3.4, 0, -7, 0, 0], 3))
  return g
})()
