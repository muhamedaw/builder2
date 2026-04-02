# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: builder.spec.js >> Builder Shell >> sidebar — layers tab
- Location: tests\visual\builder.spec.js:58:3

# Error details

```
Error: A snapshot doesn't exist at C:\Users\Muhammed\Desktop\github\bulider\tests\visual\baselines\builder.spec.js-snapshots\sidebar-layers-empty-desktop-win32.png, writing actual.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic:
    - generic: ⚡
    - generic:
      - generic: Install PageCraft
      - generic: Works offline · No browser UI · Native feel
    - generic:
      - button "Install"
      - button "✕"
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]: ⚡
        - text: PageCraft
      - textbox "Page name…" [ref=e6]: My Page
      - button "↩" [disabled] [ref=e7]
      - button "↪" [disabled] [ref=e8]
      - button "⏱" [ref=e9] [cursor=pointer]
      - generic "Online — PWA active" [ref=e10]
      - generic [ref=e11]:
        - button "🖥" [ref=e12] [cursor=pointer]
        - button "📱" [ref=e13] [cursor=pointer]
        - button "📲" [ref=e14] [cursor=pointer]
      - generic [ref=e15]:
        - button "✏️ Edit" [ref=e16] [cursor=pointer]
        - button "👁 Preview" [ref=e17] [cursor=pointer]
      - generic [ref=e18]:
        - button "🔥" [ref=e19] [cursor=pointer]
        - button "Clear" [ref=e20] [cursor=pointer]
        - button "📐 Templates" [ref=e21] [cursor=pointer]
        - button "📁 Projects" [ref=e22] [cursor=pointer]
        - button "✏️ CMS" [ref=e23] [cursor=pointer]
        - button "🧩 Plugins" [ref=e24] [cursor=pointer]
        - button "🔌 Integrations" [ref=e25] [cursor=pointer]
        - button "📊 Analytics" [ref=e26] [cursor=pointer]
        - button "✨ Animate" [ref=e27] [cursor=pointer]
        - button "📱 Responsive" [ref=e28] [cursor=pointer]
        - button "⬇ Export" [ref=e29] [cursor=pointer]
        - button "🚀 Deploy" [ref=e30] [cursor=pointer]
        - button "🧪" [ref=e31] [cursor=pointer]
        - button "💾" [ref=e32] [cursor=pointer]
        - button "📂" [ref=e33] [cursor=pointer]
        - button "🚀 Preview" [ref=e34] [cursor=pointer]
        - generic [ref=e36] [cursor=pointer]:
          - generic [ref=e37]: T
          - generic [ref=e38]:
            - generic [ref=e39]: Tester
            - generic [ref=e40]: pro
          - generic [ref=e41]: ▾
    - generic [ref=e42]:
      - complementary [ref=e43]:
        - generic [ref=e44]:
          - generic [ref=e45] [cursor=pointer]: Blocks
          - generic [ref=e46] [cursor=pointer]: Components
          - generic [ref=e47] [cursor=pointer]: Layers0
          - generic [ref=e48] [cursor=pointer]: 💡
        - paragraph [ref=e52]: No sections yet
      - main [ref=e53]:
        - generic [ref=e54]:
          - generic: Desktop — 920px
          - generic [ref=e55]:
            - generic:
              - generic: ✦
              - heading "Drop a block here" [level=3]
              - paragraph: Drag from the left panel, or click any block
      - complementary [ref=e56]:
        - generic [ref=e57]:
          - generic [ref=e58] [cursor=pointer]: Edit
          - generic [ref=e59] [cursor=pointer]: Style
          - generic [ref=e60] [cursor=pointer]: Live
        - generic [ref=e62]:
          - generic [ref=e63]: 🎛
          - paragraph [ref=e64]: Select a section to edit
  - generic [ref=e65]:
    - generic [ref=e66]:
      - generic [ref=e67]: ⏱
      - generic [ref=e68]: History
      - button "✕" [ref=e69] [cursor=pointer]
    - generic [ref=e70]:
      - button "⭐ Save Checkpoint" [ref=e71] [cursor=pointer]
      - paragraph [ref=e73]: No history yet
  - generic [ref=e74]:
    - generic [ref=e75]:
      - generic [ref=e76]: ✨
      - generic [ref=e77]: Animations
      - button "✕" [ref=e78] [cursor=pointer]
    - generic [ref=e79]:
      - generic [ref=e80]:
        - generic [ref=e81]:
          - generic [ref=e82]: Enable Animations
          - generic [ref=e83]: Scroll-triggered on published page
        - button [ref=e84] [cursor=pointer]
      - generic [ref=e86]: Apply to all sections
      - generic [ref=e87]: Per-section settings
      - button "▶ Preview All Animations" [ref=e88] [cursor=pointer]
      - button "↺ Reset All" [ref=e89] [cursor=pointer]
  - generic [ref=e90]:
    - generic [ref=e91]:
      - generic [ref=e92]: 📱
      - generic [ref=e93]: Responsive Design
      - button "✕" [ref=e94] [cursor=pointer]
    - generic [ref=e95]:
      - generic [ref=e96]:
        - button "🖥 Desktop 920px" [ref=e97] [cursor=pointer]:
          - generic [ref=e98]: 🖥
          - generic [ref=e99]: Desktop
          - generic [ref=e100]: 920px
        - button "📱 Tablet 768px" [ref=e101] [cursor=pointer]:
          - generic [ref=e102]: 📱
          - generic [ref=e103]: Tablet
          - generic [ref=e104]: 768px
        - button "📲 Mobile 375px" [ref=e105] [cursor=pointer]:
          - generic [ref=e106]: 📲
          - generic [ref=e107]: Mobile
          - generic [ref=e108]: 375px
      - generic [ref=e109]:
        - spinbutton [ref=e110]: "920"
        - button "→" [ref=e111] [cursor=pointer]
      - generic [ref=e112]: Breakpoints
      - generic [ref=e113]: Global overrides
      - generic [ref=e114]: Per-section overrides
      - button "✓ Apply & Regenerate CSS" [ref=e115] [cursor=pointer]
  - generic:
    - generic: ✦
    - text: Welcome, Tester! 👋
```

# Test source

```ts
  1   | 'use strict'
  2   | // @ts-check
  3   | 
  4   | /**
  5   |  * PageCraft — Builder UI Visual Tests
  6   |  * ─────────────────────────────────────────────────────────────────────────────
  7   |  * Tests the main builder shell:
  8   |  *   • Topbar layout
  9   |  *   • Empty canvas state
  10  |  *   • Sidebar (blocks, layers, style tabs)
  11  |  *   • Edit vs Preview mode
  12  |  *   • Device switcher (desktop / tablet / mobile)
  13  |  *   • Dark mode / design tokens rendered correctly
  14  |  *
  15  |  * Screenshots are saved to tests/visual/baselines/
  16  |  * On first run they become the baseline.
  17  |  * On subsequent runs any pixel diff > 2% fails the test.
  18  |  */
  19  | 
  20  | const { test, expect } = require('@playwright/test')
  21  | const { openBuilder, addSection, clearCanvas, setDevice, setMode, freezeAnimations } = require('./helpers')
  22  | 
  23  | test.describe('Builder Shell', () => {
  24  | 
  25  |   test.beforeEach(async ({ page }) => {
  26  |     await openBuilder(page)
  27  |     await freezeAnimations(page)
  28  |     await clearCanvas(page)
  29  |   })
  30  | 
  31  |   // ── Topbar ─────────────────────────────────────────────────────────────────
  32  |   test('topbar — full layout', async ({ page }) => {
  33  |     const topbar = page.locator('.topbar')
  34  |     await expect(topbar).toBeVisible()
  35  |     await expect(topbar).toHaveScreenshot('topbar.png')
  36  |   })
  37  | 
  38  |   test('topbar — undo/redo buttons disabled on empty canvas', async ({ page }) => {
  39  |     const undo = page.locator('#btn-undo')
  40  |     const redo = page.locator('#btn-redo')
  41  |     await expect(undo).toBeDisabled()
  42  |     await expect(redo).toBeDisabled()
  43  |     await expect(page.locator('.topbar')).toHaveScreenshot('topbar-empty-history.png')
  44  |   })
  45  | 
  46  |   // ── Empty canvas ───────────────────────────────────────────────────────────
  47  |   test('canvas — empty state', async ({ page }) => {
  48  |     const canvas = page.locator('#canvas, .canvas').first()
  49  |     await expect(canvas).toHaveScreenshot('canvas-empty.png')
  50  |   })
  51  | 
  52  |   // ── Sidebar tabs ───────────────────────────────────────────────────────────
  53  |   test('sidebar — blocks tab (default)', async ({ page }) => {
  54  |     const sidebar = page.locator('.sidebar')
  55  |     await expect(sidebar).toHaveScreenshot('sidebar-blocks.png')
  56  |   })
  57  | 
  58  |   test('sidebar — layers tab', async ({ page }) => {
  59  |     await page.click('.tab:has-text("Layers"), .tab[onclick*="layers"]')
  60  |     await page.waitForTimeout(100)
  61  |     const sidebar = page.locator('.sidebar')
> 62  |     await expect(sidebar).toHaveScreenshot('sidebar-layers-empty.png')
      |     ^ Error: A snapshot doesn't exist at C:\Users\Muhammed\Desktop\github\bulider\tests\visual\baselines\builder.spec.js-snapshots\sidebar-layers-empty-desktop-win32.png, writing actual.
  63  |   })
  64  | 
  65  |   // ── Full builder layout ────────────────────────────────────────────────────
  66  |   test('full builder — empty', async ({ page }) => {
  67  |     await expect(page).toHaveScreenshot('builder-empty.png', {
  68  |       fullPage: false,
  69  |     })
  70  |   })
  71  | })
  72  | 
  73  | test.describe('Canvas — sections rendered', () => {
  74  | 
  75  |   test.beforeEach(async ({ page }) => {
  76  |     await openBuilder(page)
  77  |     await freezeAnimations(page)
  78  |     await clearCanvas(page)
  79  |   })
  80  | 
  81  |   test('canvas — hero section', async ({ page }) => {
  82  |     await addSection(page, 'hero')
  83  |     const canvas = page.locator('#canvas, .canvas').first()
  84  |     await expect(canvas).toHaveScreenshot('canvas-hero.png')
  85  |   })
  86  | 
  87  |   test('canvas — hero + features', async ({ page }) => {
  88  |     await addSection(page, 'hero')
  89  |     await addSection(page, 'features')
  90  |     const canvas = page.locator('#canvas, .canvas').first()
  91  |     await expect(canvas).toHaveScreenshot('canvas-hero-features.png')
  92  |   })
  93  | 
  94  |   test('canvas — full page (hero + features + testimonial + footer)', async ({ page }) => {
  95  |     for (const type of ['hero', 'features', 'testimonial', 'footer']) {
  96  |       await addSection(page, type)
  97  |     }
  98  |     const canvas = page.locator('#canvas, .canvas').first()
  99  |     await expect(canvas).toHaveScreenshot('canvas-full-page.png', { fullPage: true })
  100 |   })
  101 | })
  102 | 
  103 | test.describe('Device preview', () => {
  104 | 
  105 |   test.beforeEach(async ({ page }) => {
  106 |     await openBuilder(page)
  107 |     await freezeAnimations(page)
  108 |     await clearCanvas(page)
  109 |     await addSection(page, 'hero')
  110 |     await addSection(page, 'features')
  111 |   })
  112 | 
  113 |   test('device — desktop (1280px)', async ({ page }) => {
  114 |     await setDevice(page, 'desktop')
  115 |     const canvas = page.locator('#canvas, .canvas').first()
  116 |     await expect(canvas).toHaveScreenshot('device-desktop.png')
  117 |   })
  118 | 
  119 |   test('device — tablet (768px)', async ({ page }) => {
  120 |     await setDevice(page, 'tablet')
  121 |     const canvas = page.locator('#canvas, .canvas').first()
  122 |     await expect(canvas).toHaveScreenshot('device-tablet.png')
  123 |   })
  124 | 
  125 |   test('device — mobile (375px)', async ({ page }) => {
  126 |     await setDevice(page, 'mobile')
  127 |     const canvas = page.locator('#canvas, .canvas').first()
  128 |     await expect(canvas).toHaveScreenshot('device-mobile.png')
  129 |   })
  130 | })
  131 | 
  132 | test.describe('Edit vs Preview mode', () => {
  133 | 
  134 |   test.beforeEach(async ({ page }) => {
  135 |     await openBuilder(page)
  136 |     await freezeAnimations(page)
  137 |     await clearCanvas(page)
  138 |     await addSection(page, 'hero')
  139 |   })
  140 | 
  141 |   test('edit mode — shows section controls', async ({ page }) => {
  142 |     await setMode(page, 'edit')
  143 |     const canvas = page.locator('#canvas, .canvas').first()
  144 |     await expect(canvas).toHaveScreenshot('mode-edit.png')
  145 |   })
  146 | 
  147 |   test('preview mode — clean output, no editor chrome', async ({ page }) => {
  148 |     await setMode(page, 'preview')
  149 |     const canvas = page.locator('#canvas, .canvas').first()
  150 |     await expect(canvas).toHaveScreenshot('mode-preview.png')
  151 |   })
  152 | })
  153 | 
```