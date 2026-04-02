# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: builder.spec.js >> Canvas — sections rendered >> canvas — hero section
- Location: tests\visual\builder.spec.js:81:3

# Error details

```
Error: expect(locator).toHaveScreenshot(expected) failed

Locator: locator('#canvas, .canvas').first()
Timeout: 5000ms
  Timeout 5000ms exceeded.

  Snapshot: canvas-hero.png

Call log:
  - Expect "toHaveScreenshot(canvas-hero.png)" with timeout 5000ms
    - generating new stable screenshot expectation
  - waiting for locator('#canvas, .canvas').first()
  - Timeout 5000ms exceeded.

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
      - button "↩" [ref=e7] [cursor=pointer]
      - button "↪" [disabled] [ref=e8]
      - button "⏱" [ref=e9] [cursor=pointer]
      - generic [ref=e10]: Saved ✓
      - generic "Online — PWA active" [ref=e11]
      - generic [ref=e12]:
        - button "🖥" [ref=e13] [cursor=pointer]
        - button "📱" [ref=e14] [cursor=pointer]
        - button "📲" [ref=e15] [cursor=pointer]
      - generic [ref=e16]:
        - button "✏️ Edit" [ref=e17] [cursor=pointer]
        - button "👁 Preview" [ref=e18] [cursor=pointer]
      - generic [ref=e19]:
        - button "🔥" [ref=e20] [cursor=pointer]
        - button "Clear" [ref=e21] [cursor=pointer]
        - button "📐 Templates" [ref=e22] [cursor=pointer]
        - button "📁 Projects" [ref=e23] [cursor=pointer]
        - button "✏️ CMS" [ref=e24] [cursor=pointer]
        - button "🧩 Plugins" [ref=e25] [cursor=pointer]
        - button "🔌 Integrations" [ref=e26] [cursor=pointer]
        - button "📊 Analytics" [ref=e27] [cursor=pointer]
        - button "✨ Animate" [ref=e28] [cursor=pointer]
        - button "📱 Responsive" [ref=e29] [cursor=pointer]
        - button "⬇ Export" [ref=e30] [cursor=pointer]
        - button "🚀 Deploy" [ref=e31] [cursor=pointer]
        - button "🧪" [ref=e32] [cursor=pointer]
        - button "💾" [ref=e33] [cursor=pointer]
        - button "📂" [ref=e34] [cursor=pointer]
        - button "🚀 Preview" [ref=e35] [cursor=pointer]
        - generic [ref=e37] [cursor=pointer]:
          - generic [ref=e38]: T
          - generic [ref=e39]:
            - generic [ref=e40]: Tester
            - generic [ref=e41]: pro
          - generic [ref=e42]: ▾
    - generic [ref=e43]:
      - complementary [ref=e44]:
        - generic [ref=e45]:
          - generic [ref=e46] [cursor=pointer]: Blocks
          - generic [ref=e47] [cursor=pointer]: Components
          - generic [ref=e48] [cursor=pointer]: Layers1
          - generic [ref=e49] [cursor=pointer]: 💡
        - generic [ref=e51]:
          - paragraph [ref=e52]: Drag to canvas or click to add
          - generic [ref=e53]:
            - generic "Drag or click to add" [ref=e54]:
              - generic [ref=e55]: 🦸
              - generic [ref=e56]:
                - generic [ref=e57]: Hero
                - generic [ref=e58]: Full-width hero banner
              - generic [ref=e59]: ⠿
            - generic "Drag or click to add" [ref=e60]:
              - generic [ref=e61]: 👤
              - generic [ref=e62]:
                - generic [ref=e63]: About
                - generic [ref=e64]: Two-column intro section
              - generic [ref=e65]: ⠿
            - generic "Drag or click to add" [ref=e66]:
              - generic [ref=e67]: ✉️
              - generic [ref=e68]:
                - generic [ref=e69]: Contact
                - generic [ref=e70]: Form + contact info
              - generic [ref=e71]: ⠿
            - generic "Drag or click to add" [ref=e72]:
              - generic [ref=e73]: ✨
              - generic [ref=e74]:
                - generic [ref=e75]: Features
                - generic [ref=e76]: 3-column highlights
              - generic [ref=e77]: ⠿
            - generic "Drag or click to add" [ref=e78]:
              - generic [ref=e79]: 💬
              - generic [ref=e80]:
                - generic [ref=e81]: Testimonial
                - generic [ref=e82]: Quote + attribution
              - generic [ref=e83]: ⠿
            - generic "Drag or click to add" [ref=e84]:
              - generic [ref=e85]: 🔻
              - generic [ref=e86]:
                - generic [ref=e87]: Footer
                - generic [ref=e88]: Footer with links
              - generic [ref=e89]: ⠿
      - main [ref=e90]:
        - generic [ref=e91]:
          - generic:
            - generic:
              - generic:
                - generic: Desktop 1280px
              - generic:
                - generic: Tablet 768px
              - generic:
                - generic: Mobile 480px
          - generic: Desktop — 920px
          - generic [ref=e94] [cursor=pointer]:
            - generic: 🦸 Hero
            - generic [ref=e95]:
              - button "⠿" [ref=e96]
              - button "⧉" [ref=e97]
              - button "★" [ref=e98]
              - button "✕" [ref=e99]
            - generic [ref=e102]:
              - heading "Build Something People Love" [level=1] [ref=e103]
              - paragraph [ref=e104]: Fast, flexible, and beautiful.
              - generic [ref=e105]:
                - link "Get Started" [ref=e106]:
                  - /url: "#"
                  - generic [ref=e107]: Get Started
                - link "Learn More" [ref=e108]:
                  - /url: "#"
                  - generic [ref=e109]: Learn More
            - generic:
              - generic: No animation
          - generic:
            - generic:
              - text: ✏️ Click text to edit · 🖼 Click image to replace · ⠿ Drag to reorder ·
              - generic: Esc
              - text: deselect
      - complementary [ref=e110]:
        - generic [ref=e111]:
          - generic [ref=e112] [cursor=pointer]: Edit
          - generic [ref=e113] [cursor=pointer]: Style
          - generic [ref=e114] [cursor=pointer]: Live
        - generic [ref=e115]:
          - generic [ref=e116]:
            - generic [ref=e117]: Content
            - generic [ref=e118]:
              - generic [ref=e119]: Headline
              - textbox "Headline" [ref=e120]: Build Something People Love
            - generic [ref=e121]:
              - generic [ref=e122]: Sub-headline
              - textbox [ref=e123]: Fast, flexible, and beautiful.
            - generic [ref=e124]:
              - generic [ref=e125]: CTA Text
              - textbox "CTA Text" [ref=e126]: Get Started
            - generic [ref=e127]:
              - generic [ref=e128]: CTA URL
              - textbox "CTA URL" [ref=e129]: "#"
            - generic [ref=e130]:
              - generic [ref=e131]: 2nd CTA
              - textbox "2nd CTA" [ref=e132]: Learn More
            - generic [ref=e133]:
              - generic [ref=e134]: 2nd URL
              - textbox "2nd URL" [ref=e135]: "#"
          - generic [ref=e136]:
            - generic [ref=e137]: Layout
            - generic [ref=e138]:
              - generic [ref=e139]: Alignment
              - combobox [ref=e140]:
                - option "center" [selected]
                - option "left"
            - generic [ref=e141]:
              - generic [ref=e142]: Height (px)
              - textbox "Height (px)" [ref=e143]: "520"
          - generic [ref=e144]:
            - generic [ref=e145]: Background Image
            - generic [ref=e146]:
              - generic [ref=e147]: BG Image
              - generic [ref=e148]:
                - generic [ref=e149]:
                  - generic [ref=e150]: 🖼
                  - generic [ref=e151]: No image
                - button "📂 Upload / Replace" [ref=e152] [cursor=pointer]
              - textbox "Or paste URL…" [ref=e153]
  - generic [ref=e154]:
    - generic [ref=e155]:
      - generic [ref=e156]: ⏱
      - generic [ref=e157]: History
      - button "✕" [ref=e158] [cursor=pointer]
    - generic [ref=e159]:
      - button "⭐ Save Checkpoint" [ref=e160] [cursor=pointer]
      - generic [ref=e162]:
        - generic [ref=e163]: ↩
        - generic [ref=e164]:
          - generic [ref=e165]: Add Hero
          - generic [ref=e166]: 0 sections · 0s ago
        - generic [ref=e167]: Current
  - generic [ref=e168]:
    - generic [ref=e169]:
      - generic [ref=e170]: ✨
      - generic [ref=e171]: Animations
      - button "✕" [ref=e172] [cursor=pointer]
    - generic [ref=e173]:
      - generic [ref=e174]:
        - generic [ref=e175]:
          - generic [ref=e176]: Enable Animations
          - generic [ref=e177]: Scroll-triggered on published page
        - button [ref=e178] [cursor=pointer]
      - generic [ref=e180]: Apply to all sections
      - generic [ref=e181]: Per-section settings
      - button "▶ Preview All Animations" [ref=e182] [cursor=pointer]
      - button "↺ Reset All" [ref=e183] [cursor=pointer]
  - generic [ref=e184]:
    - generic [ref=e185]:
      - generic [ref=e186]: 📱
      - generic [ref=e187]: Responsive Design
      - button "✕" [ref=e188] [cursor=pointer]
    - generic [ref=e189]:
      - generic [ref=e190]:
        - button "🖥 Desktop 920px" [ref=e191] [cursor=pointer]:
          - generic [ref=e192]: 🖥
          - generic [ref=e193]: Desktop
          - generic [ref=e194]: 920px
        - button "📱 Tablet 768px" [ref=e195] [cursor=pointer]:
          - generic [ref=e196]: 📱
          - generic [ref=e197]: Tablet
          - generic [ref=e198]: 768px
        - button "📲 Mobile 375px" [ref=e199] [cursor=pointer]:
          - generic [ref=e200]: 📲
          - generic [ref=e201]: Mobile
          - generic [ref=e202]: 375px
      - generic [ref=e203]:
        - spinbutton [ref=e204]: "920"
        - button "→" [ref=e205] [cursor=pointer]
      - generic [ref=e206]: Breakpoints
      - generic [ref=e207]: Global overrides
      - generic [ref=e208]: Per-section overrides
      - button "✓ Apply & Regenerate CSS" [ref=e209] [cursor=pointer]
  - generic:
    - generic: ✦
    - text: Hero added
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
> 84  |     await expect(canvas).toHaveScreenshot('canvas-hero.png')
      |                          ^ Error: expect(locator).toHaveScreenshot(expected) failed
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