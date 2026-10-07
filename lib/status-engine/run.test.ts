// Needs the local database (docker start tracker-db). Creates its own rows and removes only those.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../db'
import { runEngine } from './run'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date('2026-10-07T14:00:00Z')
const TAG = 'engine-job-test'

let locationId: string

beforeAll(async () => {
  const loc = await db.location.create({
    data: { name: TAG, city: 'Newark', state: 'NJ', lat: 40.7, lng: -74.2 },
  })
  locationId = loc.id
})

afterAll(async () => {
  const orders = await db.order.findMany({ where: { assignedLocationId: locationId }, select: { id: true } })
  const orderIds = orders.map((o) => o.id)
  await db.shipmentEvent.deleteMany({ where: { shipment: { orderId: { in: orderIds } } } })
  await db.shipment.deleteMany({ where: { orderId: { in: orderIds } } })
  await db.order.deleteMany({ where: { id: { in: orderIds } } })
  await db.location.delete({ where: { id: locationId } })
  await db.$disconnect()
})

describe('engine job', () => {
  it('writes derived fields, using the latest event of each shipment', async () => {
    const base = { destinationCity: 'Portland', destinationState: 'OR', lat: 45.5, lng: -122.7, displayFulfillmentStatus: 'UNFULFILLED', assignedLocationId: locationId }
    const late = await db.order.create({
      data: { ...base, name: `${TAG}-late`, createdAt: new Date(NOW.getTime() - 10 * DAY) },
    })
    const shipped = await db.order.create({
      data: { ...base, name: `${TAG}-shipped`, destinationState: 'TX', createdAt: new Date(NOW.getTime() - 2 * DAY) },
    })
    const ship = await db.shipment.create({
      data: { orderId: shipped.id, locationId, createdAt: new Date(NOW.getTime() - DAY) },
    })
    await db.shipmentEvent.createMany({
      data: [
        { shipmentId: ship.id, status: 'LABEL_PRINTED', happenedAt: new Date(NOW.getTime() - DAY) },
        { shipmentId: ship.id, status: 'IN_TRANSIT', happenedAt: new Date(NOW.getTime() - DAY / 2) },
      ],
    })

    await runEngine(db, { now: NOW, lateRule: 'B', where: { assignedLocationId: locationId } })

    const a = await db.order.findUniqueOrThrow({ where: { id: late.id } })
    expect(a).toMatchObject({ region: 'WEST', stage: 'ORDERED', timing: 'LATE', daysLate: 3, computedAt: NOW })
    const b = await db.order.findUniqueOrThrow({ where: { id: shipped.id } })
    expect(b).toMatchObject({ region: 'SOUTH', stage: 'IN_TRANSIT', timing: 'ON_TIME', daysLate: 0 })

    // The scoped run touched only this test's orders, not any other data in the database.
    expect(await db.order.count({ where: { computedAt: NOW } })).toBe(2)
  })
})
