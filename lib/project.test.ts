import { describe, expect, it } from 'vitest'
import { MAP_H, MAP_W, project } from './project'

const inside = (p: [number, number] | null) => {
  expect(p).not.toBeNull()
  const [x, y] = p!
  expect(Math.abs(x)).toBeLessThanOrEqual(MAP_W / 2)
  expect(Math.abs(y)).toBeLessThanOrEqual(MAP_H / 2)
  return [x, y]
}

describe('project', () => {
  it('puts east on the right and north up', () => {
    const [nyX] = inside(project(40.71, -74.0))
    const [laX, laY] = inside(project(34.05, -118.24))
    const [, seaY] = inside(project(47.61, -122.33))
    expect(nyX).toBeGreaterThan(laX)
    expect(seaY).toBeGreaterThan(laY)
  })

  it('places Alaska and Hawaii in the insets, inside the canvas', () => {
    const [akX, akY] = inside(project(61.2, -149.9))
    const [hiX, hiY] = inside(project(21.3, -157.86))
    expect(akX).toBeLessThan(0)
    expect(akY).toBeLessThan(0)
    expect(hiX).toBeLessThan(0)
    expect(hiY).toBeLessThan(0)
  })

  it('returns null off the map', () => {
    expect(project(48.85, 2.35)).toBeNull()
  })
})
