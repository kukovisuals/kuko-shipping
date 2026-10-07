// The engine job. The ONLY writer of derived fields (region, stage, timing, daysLate, computedAt).
// It reads orders, calls the pure computeStatus, and writes the result back.

import type { PrismaClient } from '../../app/generated/prisma/client'
import { computeStatus, type LateRule } from './index'

const CHUNK = 200

export async function runEngine(
  db: PrismaClient,
  { now = new Date(), lateRule }: { now?: Date; lateRule: LateRule },
): Promise<{ updated: number }> {
  const orders = await db.order.findMany({
    select: {
      id: true,
      createdAt: true,
      displayFulfillmentStatus: true,
      holdReason: true,
      destinationState: true,
      shipments: {
        select: {
          inTransitAt: true,
          estimatedDeliveryAt: true,
          deliveredAt: true,
          events: { select: { status: true }, orderBy: { happenedAt: 'desc' }, take: 1 },
        },
      },
    },
  })

  const updates = orders.map((o) => {
    const status = computeStatus(
      {
        order: o,
        shipments: o.shipments.map((s) => ({
          inTransitAt: s.inTransitAt,
          estimatedDeliveryAt: s.estimatedDeliveryAt,
          deliveredAt: s.deliveredAt,
          latestEventStatus: s.events[0]?.status ?? null,
        })),
        now,
      },
      lateRule,
    )
    return { id: o.id, status }
  })

  for (let i = 0; i < updates.length; i += CHUNK) {
    await db.$transaction(
      updates.slice(i, i + CHUNK).map(({ id, status }) =>
        db.order.update({ where: { id }, data: { ...status, computedAt: now } }),
      ),
    )
  }
  return { updated: updates.length }
}
