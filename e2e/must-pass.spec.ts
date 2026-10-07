// Must-pass checks 4 to 6 (wiki 13) plus the keyboard path of callout 2 (wiki 11).
// Checks 1 to 3 are in tests/must-pass.test.ts; check 7 (60 fps) is manual, see wiki 13.
// Expected numbers are read from the API the page itself uses, never typed here.
import { expect, test as base, type Page } from '@playwright/test'
import { fmt } from '../components/dom/format'
import { REGIONS } from '../lib/regions'

// Any uncaught error in the page fails the test (it would have caught a crashing Canvas).
const test = base.extend<{ errors: Error[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: Error[] = []
      page.on('pageerror', (e) => errors.push(e))
      await use(errors)
      expect(errors, 'uncaught page errors').toEqual([])
    },
    { auto: true },
  ],
})

const row = (page: Page, name: string) => page.locator('.region-row', { has: page.locator('.region-name', { hasText: new RegExp(`^${name}$`) }) })
const card = (page: Page, name: string) => page.locator('.region-card', { has: page.locator('.region-card-name', { hasText: new RegExp(`^${name}$`) }) })

async function open(page: Page) {
  await page.goto('/')
  // Ready when the sidebar shows real numbers and the cards are on the map.
  await expect(page.locator('.region-row .late-count').first()).not.toHaveText('–')
  await expect(page.locator('.region-card')).toHaveCount(REGIONS.length)
}

test.describe('must-pass 5: click West, the late list opens', () => {
  test('6 rows, and "+ N more" for the rest', async ({ page, request }) => {
    const west = await (await request.get('/api/regions/WEST/late')).json()
    expect(west.remaining, 'the seed has more than 6 late West orders').toBeGreaterThan(0)

    await open(page)
    await expect(page.locator('.late-list')).toHaveCount(0)
    await row(page, 'West').click()

    const list = page.locator('.late-list')
    await expect(list).toBeVisible()
    await expect(list.locator('li')).toHaveCount(6)
    await expect(list.locator('li').first()).toContainText(west.orders[0].name)
    await expect(list.locator('.more')).toHaveText(`+ ${fmt(west.remaining)} more`)
  })

  test('the other regions fade (callout 2) and come back when the list closes', async ({ page }) => {
    await open(page)
    await row(page, 'West').click()
    await expect(page.locator('.region-card[data-dimmed]')).toHaveCount(REGIONS.length - 1)
    await expect(card(page, 'West')).not.toHaveAttribute('data-dimmed', /.*/)

    await row(page, 'West').click() // clicking it again closes the list
    await expect(page.locator('.late-list')).toHaveCount(0)
    await expect(page.locator('.region-card[data-dimmed]')).toHaveCount(0)
  })

  test('keyboard: Tab to a row, Enter opens it, Escape closes it', async ({ page }) => {
    await open(page)
    await row(page, 'West').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.late-list')).toBeVisible()
    await expect(page.locator('.region-card[data-dimmed]')).toHaveCount(REGIONS.length - 1)

    await page.keyboard.press('Escape')
    await expect(page.locator('.late-list')).toHaveCount(0)
    await expect(page.locator('.region-card[data-dimmed]')).toHaveCount(0)
  })
})

// The pipeline column is hidden (SHOW_PIPELINE = false in app/page.tsx), so there is no Store to click.
// To run this: set it to true, then `E2E_PIPELINE=1 npm run test:e2e`.
test.describe('must-pass 4: click Store, the stacks collapse; click again, they expand', () => {
  test.skip(process.env.E2E_PIPELINE !== '1', 'pipeline column is hidden (SHOW_PIPELINE=false in app/page.tsx)')

  test('Store toggles the stacks into one count each and back', async ({ page, request }) => {
    const p = await (await request.get('/api/pipeline')).json()
    const total = (stage: 'ordered' | 'packed') => Object.values(p[stage] as Record<string, number>).reduce((a, b) => a + b, 0)

    await open(page)
    const store = page.locator('.pl-store')
    // A collapsed total is a label that fades in: its wrapper is aria-hidden while hidden, and its
    // container (two levels up) carries the opacity.
    const totals = page.locator('.pl-total')
    const hidden = async () => {
      await expect(totals.first().locator('xpath=..')).toHaveAttribute('aria-hidden', 'true')
      await expect(totals.first().locator('xpath=../..')).toHaveCSS('opacity', '0')
    }

    await expect(store).toHaveAttribute('aria-pressed', 'false')
    await hidden()

    await store.click()
    await expect(store).toHaveAttribute('aria-pressed', 'true')
    await expect(totals).toHaveText([fmt(total('ordered')), fmt(total('packed'))])
    await expect(totals.first().locator('xpath=..')).not.toHaveAttribute('aria-hidden', 'true')
    await expect(totals.first().locator('xpath=../..')).toHaveCSS('opacity', '1')
    // The per-stack counts are the ones that go away.
    await expect(page.locator('.pl-count').first().locator('xpath=..')).toHaveAttribute('aria-hidden', 'true')

    await store.click()
    await expect(store).toHaveAttribute('aria-pressed', 'false')
    await hidden()
    await expect(page.locator('.pl-count').first().locator('xpath=..')).not.toHaveAttribute('aria-hidden', 'true')
  })
})

test.describe('must-pass 6: reduced motion on, no animation runs', () => {
  const running = (page: Page) => page.evaluate(() => document.getAnimations().length)

  test.describe('reduced motion on', () => {
    test.use({ reducedMotion: 'reduce' })

    test('the fade jumps to its end state', async ({ page }) => {
      await open(page)
      await row(page, 'West').click()
      await expect(page.locator('.region-card[data-dimmed]')).toHaveCount(REGIONS.length - 1)
      // Right away: no transition, no running animation, and already at the end opacity.
      expect(await running(page)).toBe(0)
      await expect(card(page, 'Midwest')).toHaveCSS('transition-duration', '0s')
      await expect(card(page, 'Midwest')).toHaveCSS('opacity', '0.35')
    })
  })

  // The same steps with motion allowed must animate, so the check above can fail.
  test.describe('reduced motion off', () => {
    test.use({ reducedMotion: 'no-preference' })

    test('the fade is a 300 ms transition', async ({ page }) => {
      await open(page)
      await row(page, 'West').click()
      await expect(card(page, 'Midwest')).toHaveCSS('transition-duration', '0.3s')
      await expect.poll(() => running(page)).toBeGreaterThan(0)
    })
  })
})
