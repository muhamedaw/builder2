'use strict'
// @ts-check

/**
 * PageCraft — Builder UI Visual Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests the main builder shell:
 *   • Topbar layout
 *   • Empty canvas state
 *   • Sidebar (blocks, layers, style tabs)
 *   • Edit vs Preview mode
 *   • Device switcher (desktop / tablet / mobile)
 *   • Dark mode / design tokens rendered correctly
 *
 * Screenshots are saved to tests/visual/baselines/
 * On first run they become the baseline.
 * On subsequent runs any pixel diff > 2% fails the test.
 */

const { test, expect } = require('@playwright/test')
const { openBuilder, addSection, clearCanvas, setDevice, setMode, freezeAnimations } = require('./helpers')

test.describe('Builder Shell', () => {

  test.beforeEach(async ({ page }) => {
    await openBuilder(page)
    await freezeAnimations(page)
    await clearCanvas(page)
  })

  // ── Topbar ─────────────────────────────────────────────────────────────────
  test('topbar — full layout', async ({ page }) => {
    const topbar = page.locator('.topbar')
    await expect(topbar).toBeVisible()
    await expect(topbar).toHaveScreenshot('topbar.png')
  })

  test('topbar — undo/redo buttons disabled on empty canvas', async ({ page }) => {
    const undo = page.locator('#btn-undo')
    const redo = page.locator('#btn-redo')
    await expect(undo).toBeDisabled()
    await expect(redo).toBeDisabled()
    await expect(page.locator('.topbar')).toHaveScreenshot('topbar-empty-history.png')
  })

  // ── Empty canvas ───────────────────────────────────────────────────────────
  test('canvas — empty state', async ({ page }) => {
    const canvas = page.locator('#canvas, .canvas').first()
    await expect(canvas).toHaveScreenshot('canvas-empty.png')
  })

  // ── Sidebar tabs ───────────────────────────────────────────────────────────
  test('sidebar — blocks tab (default)', async ({ page }) => {
    const sidebar = page.locator('.sidebar')
    await expect(sidebar).toHaveScreenshot('sidebar-blocks.png')
  })

  test('sidebar — layers tab', async ({ page }) => {
    await page.click('.tab:has-text("Layers"), .tab[onclick*="layers"]')
    await page.waitForTimeout(100)
    const sidebar = page.locator('.sidebar')
    await expect(sidebar).toHaveScreenshot('sidebar-layers-empty.png')
  })

  // ── Full builder layout ────────────────────────────────────────────────────
  test('full builder — empty', async ({ page }) => {
    await expect(page).toHaveScreenshot('builder-empty.png', {
      fullPage: false,
    })
  })
})

test.describe('Canvas — sections rendered', () => {

  test.beforeEach(async ({ page }) => {
    await openBuilder(page)
    await freezeAnimations(page)
    await clearCanvas(page)
  })

  test('canvas — hero section', async ({ page }) => {
    await addSection(page, 'hero')
    const canvas = page.locator('#canvas, .canvas').first()
    await expect(canvas).toHaveScreenshot('canvas-hero.png')
  })

  test('canvas — hero + features', async ({ page }) => {
    await addSection(page, 'hero')
    await addSection(page, 'features')
    const canvas = page.locator('#canvas, .canvas').first()
    await expect(canvas).toHaveScreenshot('canvas-hero-features.png')
  })

  test('canvas — full page (hero + features + testimonial + footer)', async ({ page }) => {
    for (const type of ['hero', 'features', 'testimonial', 'footer']) {
      await addSection(page, type)
    }
    const canvas = page.locator('#canvas, .canvas').first()
    await expect(canvas).toHaveScreenshot('canvas-full-page.png', { fullPage: true })
  })
})

test.describe('Device preview', () => {

  test.beforeEach(async ({ page }) => {
    await openBuilder(page)
    await freezeAnimations(page)
    await clearCanvas(page)
    await addSection(page, 'hero')
    await addSection(page, 'features')
  })

  test('device — desktop (1280px)', async ({ page }) => {
    await setDevice(page, 'desktop')
    const canvas = page.locator('#canvas, .canvas').first()
    await expect(canvas).toHaveScreenshot('device-desktop.png')
  })

  test('device — tablet (768px)', async ({ page }) => {
    await setDevice(page, 'tablet')
    const canvas = page.locator('#canvas, .canvas').first()
    await expect(canvas).toHaveScreenshot('device-tablet.png')
  })

  test('device — mobile (375px)', async ({ page }) => {
    await setDevice(page, 'mobile')
    const canvas = page.locator('#canvas, .canvas').first()
    await expect(canvas).toHaveScreenshot('device-mobile.png')
  })
})

test.describe('Edit vs Preview mode', () => {

  test.beforeEach(async ({ page }) => {
    await openBuilder(page)
    await freezeAnimations(page)
    await clearCanvas(page)
    await addSection(page, 'hero')
  })

  test('edit mode — shows section controls', async ({ page }) => {
    await setMode(page, 'edit')
    const canvas = page.locator('#canvas, .canvas').first()
    await expect(canvas).toHaveScreenshot('mode-edit.png')
  })

  test('preview mode — clean output, no editor chrome', async ({ page }) => {
    await setMode(page, 'preview')
    const canvas = page.locator('#canvas, .canvas').first()
    await expect(canvas).toHaveScreenshot('mode-preview.png')
  })
})
