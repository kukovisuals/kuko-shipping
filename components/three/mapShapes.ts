// Small shapes shared by the map objects. Sizes are in map units (1 unit = 1 projected pixel).
import { CircleGeometry, RingGeometry, type BufferGeometry } from 'three'
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
