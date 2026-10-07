// `npm run db:seed`. Resets the data tables, writes fresh fake data, then checks the invariants.
// After this, run `npm run engine` to fill the derived fields.

import { db } from '../lib/db'
import { lateRuleFromEnv } from '../lib/status-engine'
import { SEED_CONFIG } from './seed.config'
import { generateSeed } from './seed.generate'
import { checkInvariants } from './seed.invariants'

const CHUNK = 500

async function insertAll<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += CHUNK) await insert(rows.slice(i, i + CHUNK))
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to reset data in production.')

  const now = new Date()
  const data = generateSeed(now)

  // Check before touching the database: a broken seed never replaces good data.
  for (const rule of ['A', 'B'] as const) {
    const failures = checkInvariants(data, SEED_CONFIG, now, rule)
    if (failures.length > 0) throw new Error(`Seed invariants failed (late rule ${rule}):\n${failures.join('\n')}`)
  }

  await db.$transaction([
    db.shipmentEvent.deleteMany(),
    db.shipment.deleteMany(),
    db.order.deleteMany(),
    db.location.deleteMany(),
  ])
  await db.location.createMany({ data: data.locations })
  await insertAll(data.orders, (chunk) => db.order.createMany({ data: chunk }))
  await insertAll(data.shipments, (chunk) => db.shipment.createMany({ data: chunk }))
  await insertAll(data.events, (chunk) => db.shipmentEvent.createMany({ data: chunk }))

  console.log(
    `Seed: ${data.locations.length} warehouse, ${data.orders.length} orders, ` +
      `${data.shipments.length} shipments, ${data.events.length} events. Invariants pass for both late rules.`,
  )
  console.log(`Next: npm run engine (late rule ${lateRuleFromEnv()})`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
