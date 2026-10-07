import { defineConfig, devices } from '@playwright/test'

// Runs against a production build on its own port, so it never touches `npm run dev` (wiki 13).
// It needs the seeded database: `npm run db:seed` then `npm run engine` (docker start tracker-db).
const PORT = 3101

export default defineConfig({
  testDir: 'e2e',
  workers: 1, // every test reads the same local database
  reporter: 'list',
  // Inside the git-ignored .next folder, so no report folders land in the repo.
  outputDir: '.next/e2e-results',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 300_000,
  },
})
