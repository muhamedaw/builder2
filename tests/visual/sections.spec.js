'use strict'
// @ts-check

/**
 * PageCraft — Section Rendering Visual Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Takes a screenshot of every built-in section type in isolation.
 * Detects visual regressions when section renderers change.
 *
 * Flow per section:
 *   1. Clear canvas
 *   2. Add the section
 *   3. Switch to preview mode (no editor chrome)
 *   4. Screenshot the canvas
 *   5. Compare with baseline
 */

const { test, expect } = require('@playwright/test')
const { openBuilder, addSection, clearCanvas, setMode, freezeAnimations } = require('./helpers')

// All built-in section types
const SECTIONS = [
  'hero',
  'about',
  'contact',
  'features',
  'testimonial',
  'footer',
  'pricing',
  'faq',
  'gallery',
]

// Shared page setup
test.beforeEach(async ({ page }) => {
  await openBuilder(page)
  await freezeAnimations(page)
})

// ── Generate one test per section ────────────────────────────────────────────
for (const sectionType of SECTIONS) {
  test(`section — ${sectionType}`, async ({ page }) => {
    await clearCanvas(page)
    await addSection(page, sectionType)
    await setMode(page, 'preview')

    const canvas = page.locator('#canvas, .canvas').first()
    await expect(canvas).toHaveScreenshot(`section-${sectionType}.png`, {
      // Give sections extra tolerance for font rendering differences
      maxDiffPixelRatio: 0.03,
    })
  })
}

// ── Design system token smoke tests ──────────────────────────────────────────
test.describe('Design System — CSS tokens applied', () => {

  test('--accent color is used in topbar logo', async ({ page }) => {
    await openBuilder(page)
    await freezeAnimations(page)

    // Check the logo mark uses the accent gradient
    const logoMark = page.locator('.logo-mark')
    await expect(logoMark).toBeVisible()
    await expect(logoMark).toHaveScreenshot('ds-logo-mark.png')
  })

  test('--surface variables render correctly in sidebar', async ({ page }) => {
    await openBuilder(page)
    await freezeAnimations(page)

    const sidebar = page.locator('.sidebar')
    await expect(sidebar).toHaveScreenshot('ds-sidebar-surface.png')
  })

  test('btn-primary uses --accent color', async ({ page }) => {
    await openBuilder(page)
    await freezeAnimations(page)

    // Find first primary button visible in topbar area
    const btn = page.locator('.btn-primary').first()
    if (await btn.isVisible()) {
      await expect(btn).toHaveScreenshot('ds-btn-primary.png')
    }
  })
})

// ── Regression: UI changes detection ─────────────────────────────────────────
test.describe('Regression — detect unintended UI changes', () => {

  test('topbar height is 50px', async ({ page }) => {
    await openBuilder(page)
    const topbar = page.locator('.topbar')
    const box    = await topbar.boundingBox()
    expect(box?.height).toBe(50)
  })

  test('sidebar width is 252px', async ({ page }) => {
    await openBuilder(page)
    const sidebar = page.locator('.sidebar')
    const box     = await sidebar.boundingBox()
    expect(box?.width).toBe(252)
  })

  test('design system: --accent token resolves to #6c63ff', async ({ page }) => {
    await openBuilder(page)
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    )
    expect(accent).toBe('#6c63ff')
  })

  test('design system: --sp-4 token resolves to 16px', async ({ page }) => {
    await openBuilder(page)
    const sp4 = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--sp-4').trim()
    )
    expect(sp4).toBe('16px')
  })

  test('design system: --text-base token resolves to 13px', async ({ page }) => {
    await openBuilder(page)
    const textBase = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--text-base').trim()
    )
    expect(textBase).toBe('13px')
  })
})
