# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: builder.spec.js >> Builder Shell >> topbar — full layout
- Location: tests\visual\builder.spec.js:32:3

# Error details

```
Error: A snapshot doesn't exist at C:\Users\Muhammed\Desktop\github\bulider\tests\visual\baselines\builder.spec.js-snapshots\topbar-desktop-win32.png, writing actual.
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
        - generic [ref=e50]:
          - paragraph [ref=e51]: Drag to canvas or click to add
          - generic [ref=e52]:
            - generic "Drag or click to add" [ref=e53]:
              - generic [ref=e54]: 🦸
              - generic [ref=e55]:
                - generic [ref=e56]: Hero
                - generic [ref=e57]: Full-width hero banner
              - generic [ref=e58]: ⠿
            - generic "Drag or click to add" [ref=e59]:
              - generic [ref=e60]: 👤
              - generic [ref=e61]:
                - generic [ref=e62]: About
                - generic [ref=e63]: Two-column intro section
              - generic [ref=e64]: ⠿
            - generic "Drag or click to add" [ref=e65]:
              - generic [ref=e66]: ✉️
              - generic [ref=e67]:
                - generic [ref=e68]: Contact
                - generic [ref=e69]: Form + contact info
              - generic [ref=e70]: ⠿
            - generic "Drag or click to add" [ref=e71]:
              - generic [ref=e72]: ✨
              - generic [ref=e73]:
                - generic [ref=e74]: Features
                - generic [ref=e75]: 3-column highlights
              - generic [ref=e76]: ⠿
            - generic "Drag or click to add" [ref=e77]:
              - generic [ref=e78]: 💬
              - generic [ref=e79]:
                - generic [ref=e80]: Testimonial
                - generic [ref=e81]: Quote + attribution
              - generic [ref=e82]: ⠿
            - generic "Drag or click to add" [ref=e83]:
              - generic [ref=e84]: 🔻
              - generic [ref=e85]:
                - generic [ref=e86]: Footer
                - generic [ref=e87]: Footer with links
              - generic [ref=e88]: ⠿
      - main [ref=e89]:
        - generic [ref=e90]:
          - generic: Desktop — 920px
          - generic [ref=e91]:
            - generic:
              - generic: ✦
              - heading "Drop a block here" [level=3]
              - paragraph: Drag from the left panel, or click any block
      - complementary [ref=e92]:
        - generic [ref=e93]:
          - generic [ref=e94] [cursor=pointer]: Edit
          - generic [ref=e95] [cursor=pointer]: Style
          - generic [ref=e96] [cursor=pointer]: Live
        - generic [ref=e98]:
          - generic [ref=e99]: 🎛
          - paragraph [ref=e100]: Select a section to edit
  - generic [ref=e101]:
    - generic [ref=e102]:
      - generic [ref=e103]: ⏱
      - generic [ref=e104]: History
      - button "✕" [ref=e105] [cursor=pointer]
    - generic [ref=e106]:
      - button "⭐ Save Checkpoint" [ref=e107] [cursor=pointer]
      - paragraph [ref=e109]: No history yet
  - generic [ref=e110]:
    - generic [ref=e111]:
      - generic [ref=e112]: ✨
      - generic [ref=e113]: Animations
      - button "✕" [ref=e114] [cursor=pointer]
    - generic [ref=e115]:
      - generic [ref=e116]:
        - generic [ref=e117]:
          - generic [ref=e118]: Enable Animations
          - generic [ref=e119]: Scroll-triggered on published page
        - button [ref=e120] [cursor=pointer]
      - generic [ref=e122]: Apply to all sections
      - generic [ref=e123]: Per-section settings
      - button "▶ Preview All Animations" [ref=e124] [cursor=pointer]
      - button "↺ Reset All" [ref=e125] [cursor=pointer]
  - generic [ref=e126]:
    - generic [ref=e127]:
      - generic [ref=e128]: 📱
      - generic [ref=e129]: Responsive Design
      - button "✕" [ref=e130] [cursor=pointer]
    - generic [ref=e131]:
      - generic [ref=e132]:
        - button "🖥 Desktop 920px" [ref=e133] [cursor=pointer]:
          - generic [ref=e134]: 🖥
          - generic [ref=e135]: Desktop
          - generic [ref=e136]: 920px
        - button "📱 Tablet 768px" [ref=e137] [cursor=pointer]:
          - generic [ref=e138]: 📱
          - generic [ref=e139]: Tablet
          - generic [ref=e140]: 768px
        - button "📲 Mobile 375px" [ref=e141] [cursor=pointer]:
          - generic [ref=e142]: 📲
          - generic [ref=e143]: Mobile
          - generic [ref=e144]: 375px
      - generic [ref=e145]:
        - spinbutton [ref=e146]: "920"
        - button "→" [ref=e147] [cursor=pointer]
      - generic [ref=e148]: Breakpoints
      - generic [ref=e149]: Global overrides
      - generic [ref=e150]: Per-section overrides
      - button "✓ Apply & Regenerate CSS" [ref=e151] [cursor=pointer]
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
> 35  |     await expect(topbar).toHaveScreenshot('topbar.png')
      |     ^ Error: A snapshot doesn't exist at C:\Users\Muhammed\Desktop\github\bulider\tests\visual\baselines\builder.spec.js-snapshots\topbar-desktop-win32.png, writing actual.
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
  62  |     await expect(sidebar).toHaveScreenshot('sidebar-layers-empty.png')
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
```