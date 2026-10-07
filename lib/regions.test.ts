import { describe, expect, it } from 'vitest'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import atlas from 'us-atlas/states-10m.json'
import { regionForFips, regionForState } from './regions'

const TERRITORIES = ['60', '66', '69', '72', '78']
const features = feature(
  atlas as unknown as Topology,
  (atlas as unknown as Topology).objects.states as GeometryCollection,
).features

describe('regionForFips', () => {
  it('maps every us-atlas state and DC to a region', () => {
    const states = features.filter((f) => !TERRITORIES.includes(String(f.id)))
    expect(states).toHaveLength(51)
    for (const f of states) expect(() => regionForFips(String(f.id))).not.toThrow()
  })

  it('agrees with regionForState', () => {
    expect(regionForFips('06')).toBe(regionForState('CA'))
    expect(regionForFips('34')).toBe(regionForState('NJ'))
    expect(regionForFips('11')).toBe(regionForState('DC'))
  })

  it('throws for territories and unknown ids', () => {
    for (const id of [...TERRITORIES, '99']) expect(() => regionForFips(id)).toThrow()
  })
})
