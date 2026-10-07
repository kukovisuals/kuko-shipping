import { describe, expect, it } from 'vitest'
import { regionForState } from '../regions'
import {
  computeStage,
  computeStatus,
  lateRuleFromEnv,
  type LateRule,
  type Stage,
  type StatusInput,
} from './index'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date('2026-10-07T14:00:00Z')
const ago = (days: number) => new Date(NOW.getTime() - days * DAY)
const ahead = (days: number) => new Date(NOW.getTime() + days * DAY)

type Shipment = StatusInput['shipments'][number]
const shipment = (over: Partial<Shipment> = {}): Shipment => ({
  inTransitAt: null,
  estimatedDeliveryAt: null,
  deliveredAt: null,
  latestEventStatus: null,
  ...over,
})

function input(
  order: Partial<StatusInput['order']> = {},
  shipments: Shipment[] = [],
): StatusInput {
  return {
    order: {
      createdAt: ago(1),
      displayFulfillmentStatus: 'UNFULFILLED',
      holdReason: null,
      destinationState: 'OR',
      ...order,
    },
    shipments,
    now: NOW,
  }
}

describe('stage rules', () => {
  const rows: [string, StatusInput, Stage][] = [
    ['delivered: deliveredAt set', input({}, [shipment({ deliveredAt: ago(1) })]), 'DELIVERED'],
    ['delivered: latest event DELIVERED', input({}, [shipment({ latestEventStatus: 'DELIVERED' })]), 'DELIVERED'],
    ['in transit: CARRIER_PICKED_UP', input({}, [shipment({ latestEventStatus: 'CARRIER_PICKED_UP' })]), 'IN_TRANSIT'],
    ['in transit: IN_TRANSIT', input({}, [shipment({ latestEventStatus: 'IN_TRANSIT' })]), 'IN_TRANSIT'],
    ['in transit: OUT_FOR_DELIVERY', input({}, [shipment({ latestEventStatus: 'OUT_FOR_DELIVERY' })]), 'IN_TRANSIT'],
    ['packed: LABEL_PURCHASED', input({}, [shipment({ latestEventStatus: 'LABEL_PURCHASED' })]), 'PACKED'],
    ['packed: LABEL_PRINTED', input({}, [shipment({ latestEventStatus: 'LABEL_PRINTED' })]), 'PACKED'],
    ['backorder: out of stock hold', input({ holdReason: 'INVENTORY_OUT_OF_STOCK' }), 'BACKORDER'],
    ['ordered: plain unfulfilled', input(), 'ORDERED'],
    ['ordered: other hold reason', input({ holdReason: 'AWAITING_PAYMENT' }), 'ORDERED'],
    ['ordered: shipment with no events', input({}, [shipment()]), 'ORDERED'],
    ['ordered: a problem event is not a stage', input({}, [shipment({ latestEventStatus: 'DELAYED' })]), 'ORDERED'],
    // first match wins
    [
      'delivered beats in transit',
      input({}, [shipment({ latestEventStatus: 'IN_TRANSIT', deliveredAt: ago(1) })]),
      'DELIVERED',
    ],
    [
      'in transit beats backorder (restocked and shipped, hold not cleared)',
      input({ holdReason: 'INVENTORY_OUT_OF_STOCK' }, [shipment({ latestEventStatus: 'IN_TRANSIT' })]),
      'IN_TRANSIT',
    ],
    [
      'packed beats backorder',
      input({ holdReason: 'INVENTORY_OUT_OF_STOCK' }, [shipment({ latestEventStatus: 'LABEL_PRINTED' })]),
      'PACKED',
    ],
    ['backorder restocked: hold cleared goes back to ordered', input({ holdReason: null }), 'ORDERED'],
    // two shipments
    [
      'partial delivery: one shipment delivered counts as delivered (wiki 07)',
      input({}, [shipment({ deliveredAt: ago(1) }), shipment({ latestEventStatus: 'IN_TRANSIT' })]),
      'DELIVERED',
    ],
    [
      'two shipments, one in transit one packed: in transit wins',
      input({}, [shipment({ latestEventStatus: 'LABEL_PRINTED' }), shipment({ latestEventStatus: 'IN_TRANSIT' })]),
      'IN_TRANSIT',
    ],
  ]

  it.each(rows)('%s', (_name, i, stage) => {
    expect(computeStage(i)).toBe(stage)
    expect(computeStatus(i).stage).toBe(stage)
  })
})

describe('late rule B (7 days since createdAt)', () => {
  const rows: [string, StatusInput, 'ON_TIME' | 'LATE', number][] = [
    ['day 1', input({ createdAt: ago(1) }), 'ON_TIME', 0],
    ['exactly 7 days', input({ createdAt: ago(7) }), 'ON_TIME', 0],
    ['1 hour past 7 days', input({ createdAt: new Date(ago(7).getTime() - 3600_000) }), 'LATE', 1],
    ['8 days', input({ createdAt: ago(8) }), 'LATE', 1],
    ['11 days', input({ createdAt: ago(11) }), 'LATE', 4],
    ['late and still ordered', input({ createdAt: ago(10) }), 'LATE', 3],
    [
      'late and in transit',
      input({ createdAt: ago(10) }, [shipment({ latestEventStatus: 'IN_TRANSIT' })]),
      'LATE',
      3,
    ],
    [
      'late but delivered',
      input({ createdAt: ago(10) }, [shipment({ deliveredAt: ago(1) })]),
      'ON_TIME',
      0,
    ],
    [
      'carrier estimate is ignored',
      input({ createdAt: ago(2) }, [shipment({ latestEventStatus: 'IN_TRANSIT', estimatedDeliveryAt: ago(5) })]),
      'ON_TIME',
      0,
    ],
  ]

  it.each(rows)('%s', (_name, i, timing, daysLate) => {
    const out = computeStatus(i, 'B')
    expect(out.timing).toBe(timing)
    expect(out.daysLate).toBe(daysLate)
  })
})

describe('late rule A (past carrier estimate)', () => {
  const inTransit = (over: Partial<Shipment>) => shipment({ latestEventStatus: 'IN_TRANSIT', ...over })
  const rows: [string, StatusInput, 'ON_TIME' | 'LATE', number][] = [
    ['estimate in the future', input({}, [inTransit({ estimatedDeliveryAt: ahead(2) })]), 'ON_TIME', 0],
    ['estimate is exactly now', input({}, [inTransit({ estimatedDeliveryAt: NOW })]), 'ON_TIME', 0],
    ['estimate 1 day ago', input({}, [inTransit({ estimatedDeliveryAt: ago(1) })]), 'LATE', 1],
    ['estimate 4 days ago', input({}, [inTransit({ estimatedDeliveryAt: ago(4) })]), 'LATE', 4],
    ['estimate missing', input({}, [inTransit({ estimatedDeliveryAt: null })]), 'ON_TIME', 0],
    ['no shipments yet', input({ createdAt: ago(20) }), 'ON_TIME', 0],
    ['past estimate but delivered', input({}, [inTransit({ estimatedDeliveryAt: ago(3), deliveredAt: ago(1) })]), 'ON_TIME', 0],
    [
      'two open shipments: the most overdue estimate counts',
      input({}, [inTransit({ estimatedDeliveryAt: ahead(1) }), inTransit({ estimatedDeliveryAt: ago(2) })]),
      'LATE',
      2,
    ],
    [
      'two shipments, one has no estimate: use the one that has',
      input({}, [inTransit({ estimatedDeliveryAt: null }), inTransit({ estimatedDeliveryAt: ago(2) })]),
      'LATE',
      2,
    ],
    ['order age is ignored', input({ createdAt: ago(30) }, [inTransit({ estimatedDeliveryAt: ahead(1) })]), 'ON_TIME', 0],
  ]

  it.each(rows)('%s', (_name, i, timing, daysLate) => {
    const out = computeStatus(i, 'A')
    expect(out.timing).toBe(timing)
    expect(out.daysLate).toBe(daysLate)
  })
})

describe('both rules disagree on the same order', () => {
  const i = input({ createdAt: ago(10) }, [
    shipment({ latestEventStatus: 'IN_TRANSIT', estimatedDeliveryAt: ahead(1) }),
  ])
  it('B says late, A says on time', () => {
    expect(computeStatus(i, 'B').timing).toBe('LATE')
    expect(computeStatus(i, 'A').timing).toBe('ON_TIME')
  })
})

describe('timing never returns AT_RISK in v1 (OPEN-02)', () => {
  it.each(['A', 'B'] as LateRule[])('rule %s', (rule) => {
    const i = input({}, [shipment({ latestEventStatus: 'DELAYED', estimatedDeliveryAt: ahead(1) })])
    expect(computeStatus(i, rule).timing).not.toBe('AT_RISK')
  })
})

describe('defaults and purity', () => {
  it('uses rule B when none is given', () => {
    const i = input({ createdAt: ago(9) })
    expect(computeStatus(i)).toEqual(computeStatus(i, 'B'))
  })

  it('same input gives the same output and does not change the input', () => {
    const i = input({ createdAt: ago(9) }, [shipment({ latestEventStatus: 'IN_TRANSIT' })])
    const snapshot = structuredClone(i)
    expect(computeStatus(i)).toEqual(computeStatus(i))
    expect(i).toEqual(snapshot)
  })

  it('reads LATE_RULE from a value, B unless it is exactly A', () => {
    expect(lateRuleFromEnv('A')).toBe('A')
    expect(lateRuleFromEnv('B')).toBe('B')
    expect(lateRuleFromEnv(undefined)).toBe('B')
    expect(lateRuleFromEnv('nonsense')).toBe('B')
  })
})

describe('region rule (US Census regions)', () => {
  const rows: [string, string][] = [
    ['MA', 'NE'], ['NJ', 'NE'], ['NY', 'NE'], ['PA', 'NE'],
    ['OH', 'MIDWEST'], ['IL', 'MIDWEST'], ['NE', 'MIDWEST'], ['ND', 'MIDWEST'],
    ['TX', 'SOUTH'], ['FL', 'SOUTH'], ['DC', 'SOUTH'], ['DE', 'SOUTH'],
    ['CA', 'WEST'], ['OR', 'WEST'], ['AK', 'WEST'], ['HI', 'WEST'],
  ]
  it.each(rows)('%s -> %s', (state, region) => {
    expect(regionForState(state)).toBe(region)
    expect(computeStatus(input({ destinationState: state })).region).toBe(region)
  })

  it('accepts lowercase codes', () => {
    expect(regionForState('tx')).toBe('SOUTH')
  })

  it('maps all 50 states plus DC, each to exactly one region', () => {
    const all =
      'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(
        ' ',
      )
    expect(all).toHaveLength(51)
    for (const state of all) expect(() => regionForState(state)).not.toThrow()
  })

  it('throws on an unknown state instead of guessing', () => {
    expect(() => regionForState('ZZ')).toThrow(/Unknown state/)
  })
})
