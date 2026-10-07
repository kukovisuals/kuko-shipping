// Entry point for `npm run engine`.
import { db } from '../db'
import { lateRuleFromEnv } from './index'
import { runEngine } from './run'

async function main() {
  const lateRule = lateRuleFromEnv()
  const { updated } = await runEngine(db, { lateRule })
  console.log(`Engine: updated ${updated} orders (late rule ${lateRule}).`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
