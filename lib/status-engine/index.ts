// Status Engine (wiki 07). A pure function: same input, same output.
// No database calls, no clock, no env reads in here. The caller passes `now` and the late rule.

import { regionForState, type Region } from '../regions'

export type Stage = 'ORDERED' | 'BACKORDER' | 'PACKED' | 'IN_TRANSIT' | 'DELIVERED'
export type Timing = 'ON_TIME' | 'AT_RISK' | 'LATE'
export type LateRule = 'A' | 'B'

export type StatusInput = {
  order: {
    createdAt: Date
    displayFulfillmentStatus: string
    holdReason: string | null
    destinationState: string
  }
  shipments: {
    inTransitAt: Date | null
    estimatedDeliveryAt: Date | null
    deliveredAt: Date | null
    latestEventStatus: string | null
  }[]
  now: Date
}

export type StatusOutput = {
  region: Region
  stage: Stage
  timing: Timing
  daysLate: number
}

export const LATE_AFTER_DAYS_RULE_B = 7
const DAY_MS = 24 * 60 * 60 * 1000

const IN_TRANSIT_EVENTS = ['CARRIER_PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']
const PACKED_EVENTS = ['LABEL_PURCHASED', 'LABEL_PRINTED']

type Shipment = StatusInput['shipments'][number]

function hasEvent(shipments: Shipment[], events: string[]): boolean {
  return shipments.some((s) => s.latestEventStatus !== null && events.includes(s.latestEventStatus))
}

// First match wins, top to bottom.
export function computeStage({ order, shipments }: StatusInput): Stage {
  if (shipments.some((s) => s.deliveredAt !== null || s.latestEventStatus === 'DELIVERED')) {
    return 'DELIVERED'
  }
  if (hasEvent(shipments, IN_TRANSIT_EVENTS)) return 'IN_TRANSIT'
  if (hasEvent(shipments, PACKED_EVENTS)) return 'PACKED'
  if (order.holdReason === 'INVENTORY_OUT_OF_STOCK') return 'BACKORDER'
  return 'ORDERED'
}

// The moment after which the order counts as late, or null if the rule cannot say.
// Rule A: the carrier estimate (earliest one if several shipments are open).
// Rule B: 7 days after the order was created.
function lateThreshold({ order, shipments }: StatusInput, rule: LateRule): Date | null {
  if (rule === 'B') {
    return new Date(order.createdAt.getTime() + LATE_AFTER_DAYS_RULE_B * DAY_MS)
  }
  const estimates = shipments.flatMap((s) => (s.estimatedDeliveryAt ? [s.estimatedDeliveryAt.getTime()] : []))
  return estimates.length > 0 ? new Date(Math.min(...estimates)) : null
}

// At-risk is not built (OPEN-02): timing is only ON_TIME or LATE.
function computeTiming(input: StatusInput, stage: Stage, rule: LateRule): { timing: Timing; daysLate: number } {
  const onTime = { timing: 'ON_TIME' as const, daysLate: 0 }
  if (stage === 'DELIVERED') return onTime

  const threshold = lateThreshold(input, rule)
  if (threshold === null) return onTime // rule A with no estimate: cannot call it late

  const overBy = input.now.getTime() - threshold.getTime()
  if (overBy <= 0) return onTime

  // Late means at least 1 day late, so the "+Nd" label is never "+0d".
  return { timing: 'LATE', daysLate: Math.ceil(overBy / DAY_MS) }
}

export function computeStatus(input: StatusInput, lateRule: LateRule = 'B'): StatusOutput {
  const stage = computeStage(input)
  return {
    region: regionForState(input.order.destinationState),
    stage,
    ...computeTiming(input, stage, lateRule),
  }
}

// Reads LATE_RULE (OPEN-04). Lives outside computeStatus so the engine stays pure.
export function lateRuleFromEnv(value: string | undefined = process.env.LATE_RULE): LateRule {
  return value === 'A' ? 'A' : 'B'
}
