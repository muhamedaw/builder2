'use strict'

/**
 * Shared helpers for PageCraft visual tests.
 *
 * All tests interact with the builder through a fake JWT session
 * so the auth gate is bypassed automatically.
 */

const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.' +
  btoa(JSON.stringify({ sub:'test-user', name:'Tester', email:'test@pagecraft.dev', plan:'pro', exp: 9999999999 })) +
  '.fake-sig'

/**
 * Opens the builder and bypasses the auth gate by injecting
 * a fake session token directly into localStorage.
 */
async function openBuilder(page) {
  // Seed localStorage before the page loads
  await page.addInitScript((token) => {
    localStorage.setItem('pc_session_v1', token)
  }, FAKE_TOKEN)

  await page.goto('/', { waitUntil: 'networkidle' })

  // Wait for the canvas to be visible (means auth passed)
  await page.waitForSelector('#canvas, .canvas', { timeout: 8000 }).catch(() => {})

  // Dismiss any modals/toasts that may appear (templates picker, welcome toast)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
}

/**
 * Add a section of the given type to the canvas via the sidebar.
 * @param {import('@playwright/test').Page} page
 * @param {string} type  e.g. 'hero', 'about', 'features'
 */
async function addSection(page, type) {
  await page.evaluate((t) => {
    if (typeof addSection === 'function') addSection(t)
  }, type)
  await page.waitForTimeout(150)
}

/**
 * Clear all sections from the canvas.
 */
async function clearCanvas(page) {
  await page.evaluate(() => {
    if (typeof S !== 'undefined') {
      S.sections = []
      S.selected = null
      if (typeof renderAll === 'function') renderAll()
    }
  })
  await page.waitForTimeout(150)
}

/**
 * Switch device preview mode.
 * @param {import('@playwright/test').Page} page
 * @param {'desktop'|'tablet'|'mobile'} device
 */
async function setDevice(page, device) {
  await page.evaluate((d) => {
    if (typeof S !== 'undefined') {
      S.device = d
      if (typeof renderCanvas === 'function') renderCanvas()
    }
  }, device)
  await page.waitForTimeout(200)
}

/**
 * Switch edit / preview mode.
 */
async function setMode(page, mode) {
  await page.evaluate((m) => {
    if (typeof S !== 'undefined') {
      S.mode = m
      if (typeof renderCanvas === 'function') renderCanvas()
    }
  }, mode)
  await page.waitForTimeout(200)
}

/**
 * Disable all animations on the page so screenshots are stable.
 */
async function freezeAnimations(page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay:    0s !important;
      transition-duration:0s !important;
      transition-delay:   0s !important;
    }
  `})
}

module.exports = { openBuilder, addSection, clearCanvas, setDevice, setMode, freezeAnimations }
