import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The engine-job and API tests share one local database, so test files run one at a time.
    fileParallelism: false,
  },
})
