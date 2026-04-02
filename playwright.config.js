// @ts-check
'use strict'

const { defineConfig, devices } = require('@playwright/test')

/**
 * PageCraft — Playwright Visual Testing Config
 * ─────────────────────────────────────────────
 * Runs visual regression (screenshot) tests against
 * the live builder served by server.js.
 *
 * Commands:
 *   npm run test:visual              # run all visual tests
 *   npm run test:visual:update       # update baseline screenshots
 *   npm run test:visual:report       # open HTML report
 */
module.exports = defineConfig({
  testDir:  './tests/visual',
  testMatch: '**/*.spec.js',

  // Stop after first failure in CI, keep going locally
  failOnFlakeySyntheticAnnotations: false,
  fullyParallel: false,   // screenshots must be sequential for consistency
  retries:       process.env.CI ? 1 : 0,
  workers:       1,       // 1 worker → stable pixel comparisons

  // ── Reporter ──────────────────────────────────────────────────────────────
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/visual/report', open: 'never' }],
    ['json', { outputFile: 'tests/visual/report/results.json' }],
  ],

  // ── Snapshot / screenshot settings ────────────────────────────────────────
  snapshotDir:    './tests/visual/baselines',
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === '1' ? 'all' : 'missing',

  expect: {
    // Pixel tolerance: 0 = exact, 0.2 = 20% threshold per pixel
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,   // allow 2% pixel difference
      threshold:         0.2,    // per-pixel colour threshold
      animations:        'disabled',
    },
  },

  use: {
    baseURL:           'http://localhost:3000',
    headless:          true,
    viewport:          { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    // Disable animations so screenshots are deterministic
    launchOptions: { args: ['--disable-web-animations'] },
    // Screenshot on failure
    screenshot: 'only-on-failure',
    video:      'off',
    trace:      'off',
  },

  // ── Device profiles for responsive tests ──────────────────────────────────
  projects: [
    {
      name: 'desktop',
      use:  { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'tablet',
      use:  { ...devices['iPad (gen 7)'] },
    },
    {
      name: 'mobile',
      use:  { ...devices['iPhone 13'] },
    },
  ],

  // ── Start server before tests ─────────────────────────────────────────────
  webServer: {
    command:           'node server.js',
    url:               'http://localhost:3000/health',
    reuseExistingServer: !process.env.CI,
    timeout:           10_000,
    stdout:            'ignore',
    stderr:            'pipe',
  },
})
