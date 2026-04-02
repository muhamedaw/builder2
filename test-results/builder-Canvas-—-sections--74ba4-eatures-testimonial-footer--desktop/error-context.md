# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: builder.spec.js >> Canvas — sections rendered >> canvas — full page (hero + features + testimonial + footer)
- Location: tests\visual\builder.spec.js:94:3

# Error details

```
Error: expect(locator).toHaveScreenshot(expected) failed

Locator: locator('#canvas, .canvas').first()
Timeout: 5000ms
  Timeout 5000ms exceeded.

  Snapshot: canvas-full-page.png

Call log:
  - Expect "toHaveScreenshot(canvas-full-page.png)" with timeout 5000ms
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
          - generic [ref=e48] [cursor=pointer]: Layers4
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
          - generic [ref=e93]:
            - generic [ref=e94] [cursor=pointer]:
              - generic: 🦸 Hero
              - generic [ref=e95]:
                - button "⠿" [ref=e96]
                - button "↓" [ref=e97]
                - button "⧉" [ref=e98]
                - button "★" [ref=e99]
                - button "✕" [ref=e100]
              - generic [ref=e103]:
                - heading "Build Something People Love" [level=1] [ref=e104]
                - paragraph [ref=e105]: Fast, flexible, and beautiful.
                - generic [ref=e106]:
                  - link "Get Started" [ref=e107]:
                    - /url: "#"
                    - generic [ref=e108]: Get Started
                  - link "Learn More" [ref=e109]:
                    - /url: "#"
                    - generic [ref=e110]: Learn More
              - generic:
                - generic: No animation
            - generic [ref=e111] [cursor=pointer]:
              - generic: ✨ Features
              - generic [ref=e112]:
                - button "⠿" [ref=e113]
                - button "↑" [ref=e114]
                - button "↓" [ref=e115]
                - button "⧉" [ref=e116]
                - button "★" [ref=e117]
                - button "✕" [ref=e118]
              - generic [ref=e121]:
                - generic [ref=e122]:
                  - heading "Everything You Need" [level=2] [ref=e123]
                  - paragraph [ref=e124]: Packed with powerful features.
                - generic [ref=e125]:
                  - generic [ref=e126]:
                    - generic [ref=e127]: ⚡
                    - heading "Blazing Fast" [level=3] [ref=e128]
                    - paragraph [ref=e129]: Optimised for speed.
                  - generic [ref=e130]:
                    - generic [ref=e131]: 🔒
                    - heading "Secure" [level=3] [ref=e132]
                    - paragraph [ref=e133]: Enterprise security.
                  - generic [ref=e134]:
                    - generic [ref=e135]: 📱
                    - heading "Responsive" [level=3] [ref=e136]
                    - paragraph [ref=e137]: All devices.
              - generic:
                - generic: No animation
            - generic [ref=e138] [cursor=pointer]:
              - generic: 💬 Testimonial
              - generic [ref=e139]:
                - button "⠿" [ref=e140]
                - button "↑" [ref=e141]
                - button "↓" [ref=e142]
                - button "⧉" [ref=e143]
                - button "★" [ref=e144]
                - button "✕" [ref=e145]
              - generic [ref=e148]:
                - generic [ref=e149]: ★★★★★
                - blockquote [ref=e150]: "\"This product transformed how we work.\""
                - generic [ref=e151]:
                  - generic [ref=e152]:
                    - img [ref=e153]
                    - generic [ref=e154]:
                      - generic: Edit
                  - generic [ref=e155]:
                    - paragraph [ref=e156]: Sarah Kim
                    - paragraph [ref=e157]: CTO, Acme Inc.
              - generic:
                - generic: No animation
            - generic [ref=e158] [cursor=pointer]:
              - generic: 🔻 Footer
              - generic [ref=e159]:
                - button "⠿" [ref=e160]
                - button "↑" [ref=e161]
                - button "⧉" [ref=e162]
                - button "★" [ref=e163]
                - button "✕" [ref=e164]
              - generic [ref=e167]:
                - generic [ref=e168]:
                  - generic [ref=e169]:
                    - generic [ref=e170]: YourBrand
                    - generic [ref=e171]: Building the future.
                  - navigation [ref=e172]:
                    - link "Privacy" [ref=e173]:
                      - /url: "#"
                    - link "Terms" [ref=e174]:
                      - /url: "#"
                    - link "Contact" [ref=e175]:
                      - /url: "#"
                - generic [ref=e176]: © 2026 YourBrand.
              - generic:
                - generic: No animation
          - generic:
            - generic:
              - text: ✏️ Click text to edit · 🖼 Click image to replace · ⠿ Drag to reorder ·
              - generic: Esc
              - text: deselect
      - complementary [ref=e177]:
        - generic [ref=e178]:
          - generic [ref=e179] [cursor=pointer]: Edit
          - generic [ref=e180] [cursor=pointer]: Style
          - generic [ref=e181] [cursor=pointer]: Live
        - generic [ref=e182]:
          - generic [ref=e183]:
            - generic [ref=e184]: Brand
            - generic [ref=e185]:
              - generic [ref=e186]: Brand
              - textbox "Brand" [ref=e187]: YourBrand
            - generic [ref=e188]:
              - generic [ref=e189]: Tagline
              - textbox "Tagline" [ref=e190]: Building the future.
            - generic [ref=e191]:
              - generic [ref=e192]: Copyright
              - textbox "Copyright" [ref=e193]: © 2026 YourBrand.
          - generic [ref=e194]:
            - generic [ref=e195]: Links
            - generic [ref=e196]:
              - generic [ref=e197]: Link 1
              - textbox "Link 1" [ref=e198]: Privacy
            - generic [ref=e199]:
              - generic [ref=e200]: URL 1
              - textbox "URL 1" [ref=e201]: "#"
            - generic [ref=e202]:
              - generic [ref=e203]: Link 2
              - textbox "Link 2" [ref=e204]: Terms
            - generic [ref=e205]:
              - generic [ref=e206]: URL 2
              - textbox "URL 2" [ref=e207]: "#"
            - generic [ref=e208]:
              - generic [ref=e209]: Link 3
              - textbox "Link 3" [ref=e210]: Contact
            - generic [ref=e211]:
              - generic [ref=e212]: URL 3
              - textbox "URL 3" [ref=e213]: "#"
  - generic [ref=e214]:
    - generic [ref=e215]:
      - generic [ref=e216]: ⏱
      - generic [ref=e217]: History
      - button "✕" [ref=e218] [cursor=pointer]
    - generic [ref=e219]:
      - button "⭐ Save Checkpoint" [ref=e220] [cursor=pointer]
      - generic [ref=e221]:
        - generic [ref=e222]:
          - generic [ref=e223]: ↩
          - generic [ref=e224]:
            - generic [ref=e225]: Add Footer
            - generic [ref=e226]: 3 sections · 0s ago
          - generic [ref=e227]: Current
        - generic [ref=e228] [cursor=pointer]:
          - generic [ref=e229]: ↩
          - generic [ref=e230]:
            - generic [ref=e231]: Add Testimonial
            - generic [ref=e232]: 2 sections · 0s ago
        - generic [ref=e233] [cursor=pointer]:
          - generic [ref=e234]: ↩
          - generic [ref=e235]:
            - generic [ref=e236]: Add Features
            - generic [ref=e237]: 1 sections · 0s ago
        - generic [ref=e238] [cursor=pointer]:
          - generic [ref=e239]: ↩
          - generic [ref=e240]:
            - generic [ref=e241]: Add Hero
            - generic [ref=e242]: 0 sections · 1s ago
  - generic [ref=e243]:
    - generic [ref=e244]:
      - generic [ref=e245]: ✨
      - generic [ref=e246]: Animations
      - button "✕" [ref=e247] [cursor=pointer]
    - generic [ref=e248]:
      - generic [ref=e249]:
        - generic [ref=e250]:
          - generic [ref=e251]: Enable Animations
          - generic [ref=e252]: Scroll-triggered on published page
        - button [ref=e253] [cursor=pointer]
      - generic [ref=e255]: Apply to all sections
      - generic [ref=e256]: Per-section settings
      - button "▶ Preview All Animations" [ref=e257] [cursor=pointer]
      - button "↺ Reset All" [ref=e258] [cursor=pointer]
  - generic [ref=e259]:
    - generic [ref=e260]:
      - generic [ref=e261]: 📱
      - generic [ref=e262]: Responsive Design
      - button "✕" [ref=e263] [cursor=pointer]
    - generic [ref=e264]:
      - generic [ref=e265]:
        - button "🖥 Desktop 920px" [ref=e266] [cursor=pointer]:
          - generic [ref=e267]: 🖥
          - generic [ref=e268]: Desktop
          - generic [ref=e269]: 920px
        - button "📱 Tablet 768px" [ref=e270] [cursor=pointer]:
          - generic [ref=e271]: 📱
          - generic [ref=e272]: Tablet
          - generic [ref=e273]: 768px
        - button "📲 Mobile 375px" [ref=e274] [cursor=pointer]:
          - generic [ref=e275]: 📲
          - generic [ref=e276]: Mobile
          - generic [ref=e277]: 375px
      - generic [ref=e278]:
        - spinbutton [ref=e279]: "920"
        - button "→" [ref=e280] [cursor=pointer]
      - generic [ref=e281]: Breakpoints
      - generic [ref=e282]: Global overrides
      - generic [ref=e283]: Per-section overrides
      - button "✓ Apply & Regenerate CSS" [ref=e284] [cursor=pointer]
  - generic:
    - generic: ✦
    - text: Footer added
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
> 99  |     await expect(canvas).toHaveScreenshot('canvas-full-page.png', { fullPage: true })
      |                          ^ Error: expect(locator).toHaveScreenshot(expected) failed
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