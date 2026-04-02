# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sections.spec.js >> section — footer
- Location: tests\visual\sections.spec.js:42:3

# Error details

```
Error: expect(locator).toHaveScreenshot(expected) failed

Locator: locator('#canvas, .canvas').first()
Timeout: 5000ms
  Timeout 5000ms exceeded.

  Snapshot: section-footer.png

Call log:
  - Expect "toHaveScreenshot(section-footer.png)" with timeout 5000ms
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
        - button "🇺🇸 EN" [ref=e22] [cursor=pointer]:
          - generic [ref=e23]: 🇺🇸
          - generic [ref=e24]: EN
        - button "Clear" [ref=e25] [cursor=pointer]
        - button "📐 Templates" [ref=e26] [cursor=pointer]
        - button "📁 Projects" [ref=e27] [cursor=pointer]
        - button "✏️ CMS" [ref=e28] [cursor=pointer]
        - button "🧩 Plugins" [ref=e29] [cursor=pointer]
        - button "🔌 Integrations" [ref=e30] [cursor=pointer]
        - button "📊 Analytics" [ref=e31] [cursor=pointer]
        - button "✨ Animate" [ref=e32] [cursor=pointer]
        - button "📱 Responsive" [ref=e33] [cursor=pointer]
        - button "⬇ Export" [ref=e34] [cursor=pointer]
        - button "🚀 Deploy" [ref=e35] [cursor=pointer]
        - button "🧪" [ref=e36] [cursor=pointer]
        - button "💾" [ref=e37] [cursor=pointer]
        - button "📂" [ref=e38] [cursor=pointer]
        - button "🚀 Preview" [ref=e39] [cursor=pointer]
        - generic [ref=e41] [cursor=pointer]:
          - generic [ref=e42]: T
          - generic [ref=e43]:
            - generic [ref=e44]: Tester
            - generic [ref=e45]: pro
          - generic [ref=e46]: ▾
    - generic [ref=e47]:
      - complementary [ref=e48]:
        - generic [ref=e49]:
          - generic [ref=e50] [cursor=pointer]: Blocks
          - generic [ref=e51] [cursor=pointer]: Components
          - generic [ref=e52] [cursor=pointer]: Layers1
          - generic [ref=e53] [cursor=pointer]: 💡
        - generic [ref=e55]:
          - paragraph [ref=e56]: Drag to canvas or click to add
          - generic [ref=e57]:
            - generic "Drag or click to add" [ref=e58]:
              - generic [ref=e59]: 🦸
              - generic [ref=e60]:
                - generic [ref=e61]: Hero
                - generic [ref=e62]: Full-width hero banner
              - generic [ref=e63]: ⠿
            - generic "Drag or click to add" [ref=e64]:
              - generic [ref=e65]: 👤
              - generic [ref=e66]:
                - generic [ref=e67]: About
                - generic [ref=e68]: Two-column intro section
              - generic [ref=e69]: ⠿
            - generic "Drag or click to add" [ref=e70]:
              - generic [ref=e71]: ✉️
              - generic [ref=e72]:
                - generic [ref=e73]: Contact
                - generic [ref=e74]: Form + contact info
              - generic [ref=e75]: ⠿
            - generic "Drag or click to add" [ref=e76]:
              - generic [ref=e77]: ✨
              - generic [ref=e78]:
                - generic [ref=e79]: Features
                - generic [ref=e80]: 3-column highlights
              - generic [ref=e81]: ⠿
            - generic "Drag or click to add" [ref=e82]:
              - generic [ref=e83]: 💬
              - generic [ref=e84]:
                - generic [ref=e85]: Testimonial
                - generic [ref=e86]: Quote + attribution
              - generic [ref=e87]: ⠿
            - generic "Drag or click to add" [ref=e88]:
              - generic [ref=e89]: 🔻
              - generic [ref=e90]:
                - generic [ref=e91]: Footer
                - generic [ref=e92]: Footer with links
              - generic [ref=e93]: ⠿
      - main [ref=e94]:
        - generic [ref=e95]:
          - generic:
            - generic:
              - generic:
                - generic: Desktop 1280px
              - generic:
                - generic: Tablet 768px
              - generic:
                - generic: Mobile 480px
          - generic: Desktop — 920px
          - generic [ref=e98] [cursor=pointer]:
            - generic: 🔻 Footer
            - generic:
              - button "⠿"
              - button "⧉"
              - button "★"
              - button "✕"
            - generic [ref=e101]:
              - generic [ref=e102]:
                - generic [ref=e103]:
                  - generic [ref=e104]: YourBrand
                  - generic [ref=e105]: Building the future.
                - navigation [ref=e106]:
                  - link "Privacy" [ref=e107]:
                    - /url: "#"
                  - link "Terms" [ref=e108]:
                    - /url: "#"
                  - link "Contact" [ref=e109]:
                    - /url: "#"
              - generic [ref=e110]: © 2026 YourBrand.
            - generic:
              - generic: No animation
      - complementary [ref=e111]:
        - generic [ref=e112]:
          - generic [ref=e113] [cursor=pointer]: Edit
          - generic [ref=e114] [cursor=pointer]: Style
          - generic [ref=e115] [cursor=pointer]: Live
        - generic [ref=e116]:
          - generic [ref=e117]:
            - generic [ref=e118]: Brand
            - generic [ref=e119]:
              - generic [ref=e120]: Brand
              - textbox "Brand" [ref=e121]: YourBrand
            - generic [ref=e122]:
              - generic [ref=e123]: Tagline
              - textbox "Tagline" [ref=e124]: Building the future.
            - generic [ref=e125]:
              - generic [ref=e126]: Copyright
              - textbox "Copyright" [ref=e127]: © 2026 YourBrand.
          - generic [ref=e128]:
            - generic [ref=e129]: Links
            - generic [ref=e130]:
              - generic [ref=e131]: Link 1
              - textbox "Link 1" [ref=e132]: Privacy
            - generic [ref=e133]:
              - generic [ref=e134]: URL 1
              - textbox "URL 1" [ref=e135]: "#"
            - generic [ref=e136]:
              - generic [ref=e137]: Link 2
              - textbox "Link 2" [ref=e138]: Terms
            - generic [ref=e139]:
              - generic [ref=e140]: URL 2
              - textbox "URL 2" [ref=e141]: "#"
            - generic [ref=e142]:
              - generic [ref=e143]: Link 3
              - textbox "Link 3" [ref=e144]: Contact
            - generic [ref=e145]:
              - generic [ref=e146]: URL 3
              - textbox "URL 3" [ref=e147]: "#"
  - generic [ref=e148]:
    - generic [ref=e149]:
      - generic [ref=e150]: ⏱
      - generic [ref=e151]: History
      - button "✕" [ref=e152] [cursor=pointer]
    - generic [ref=e153]:
      - button "⭐ Save Checkpoint" [ref=e154] [cursor=pointer]
      - generic [ref=e156]:
        - generic [ref=e157]: ↩
        - generic [ref=e158]:
          - generic [ref=e159]: Add Footer
          - generic [ref=e160]: 0 sections · 0s ago
        - generic [ref=e161]: Current
  - generic [ref=e162]:
    - generic [ref=e163]:
      - generic [ref=e164]: ✨
      - generic [ref=e165]: Animations
      - button "✕" [ref=e166] [cursor=pointer]
    - generic [ref=e167]:
      - generic [ref=e168]:
        - generic [ref=e169]:
          - generic [ref=e170]: Enable Animations
          - generic [ref=e171]: Scroll-triggered on published page
        - button [ref=e172] [cursor=pointer]
      - generic [ref=e174]: Apply to all sections
      - generic [ref=e175]: Per-section settings
      - button "▶ Preview All Animations" [ref=e176] [cursor=pointer]
      - button "↺ Reset All" [ref=e177] [cursor=pointer]
  - generic [ref=e178]:
    - generic [ref=e179]:
      - generic [ref=e180]: 📱
      - generic [ref=e181]: Responsive Design
      - button "✕" [ref=e182] [cursor=pointer]
    - generic [ref=e183]:
      - generic [ref=e184]:
        - button "🖥 Desktop 920px" [ref=e185] [cursor=pointer]:
          - generic [ref=e186]: 🖥
          - generic [ref=e187]: Desktop
          - generic [ref=e188]: 920px
        - button "📱 Tablet 768px" [ref=e189] [cursor=pointer]:
          - generic [ref=e190]: 📱
          - generic [ref=e191]: Tablet
          - generic [ref=e192]: 768px
        - button "📲 Mobile 375px" [ref=e193] [cursor=pointer]:
          - generic [ref=e194]: 📲
          - generic [ref=e195]: Mobile
          - generic [ref=e196]: 375px
      - generic [ref=e197]:
        - spinbutton [ref=e198]: "920"
        - button "→" [ref=e199] [cursor=pointer]
      - generic [ref=e200]: Breakpoints
      - generic [ref=e201]: Global overrides
      - generic [ref=e202]: Per-section overrides
      - button "✓ Apply & Regenerate CSS" [ref=e203] [cursor=pointer]
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
  5   |  * PageCraft — Section Rendering Visual Tests
  6   |  * ─────────────────────────────────────────────────────────────────────────────
  7   |  * Takes a screenshot of every built-in section type in isolation.
  8   |  * Detects visual regressions when section renderers change.
  9   |  *
  10  |  * Flow per section:
  11  |  *   1. Clear canvas
  12  |  *   2. Add the section
  13  |  *   3. Switch to preview mode (no editor chrome)
  14  |  *   4. Screenshot the canvas
  15  |  *   5. Compare with baseline
  16  |  */
  17  | 
  18  | const { test, expect } = require('@playwright/test')
  19  | const { openBuilder, addSection, clearCanvas, setMode, freezeAnimations } = require('./helpers')
  20  | 
  21  | // All built-in section types
  22  | const SECTIONS = [
  23  |   'hero',
  24  |   'about',
  25  |   'contact',
  26  |   'features',
  27  |   'testimonial',
  28  |   'footer',
  29  |   'pricing',
  30  |   'faq',
  31  |   'gallery',
  32  | ]
  33  | 
  34  | // Shared page setup
  35  | test.beforeEach(async ({ page }) => {
  36  |   await openBuilder(page)
  37  |   await freezeAnimations(page)
  38  | })
  39  | 
  40  | // ── Generate one test per section ────────────────────────────────────────────
  41  | for (const sectionType of SECTIONS) {
  42  |   test(`section — ${sectionType}`, async ({ page }) => {
  43  |     await clearCanvas(page)
  44  |     await addSection(page, sectionType)
  45  |     await setMode(page, 'preview')
  46  | 
  47  |     const canvas = page.locator('#canvas, .canvas').first()
> 48  |     await expect(canvas).toHaveScreenshot(`section-${sectionType}.png`, {
      |                          ^ Error: expect(locator).toHaveScreenshot(expected) failed
  49  |       // Give sections extra tolerance for font rendering differences
  50  |       maxDiffPixelRatio: 0.03,
  51  |     })
  52  |   })
  53  | }
  54  | 
  55  | // ── Design system token smoke tests ──────────────────────────────────────────
  56  | test.describe('Design System — CSS tokens applied', () => {
  57  | 
  58  |   test('--accent color is used in topbar logo', async ({ page }) => {
  59  |     await openBuilder(page)
  60  |     await freezeAnimations(page)
  61  | 
  62  |     // Check the logo mark uses the accent gradient
  63  |     const logoMark = page.locator('.logo-mark')
  64  |     await expect(logoMark).toBeVisible()
  65  |     await expect(logoMark).toHaveScreenshot('ds-logo-mark.png')
  66  |   })
  67  | 
  68  |   test('--surface variables render correctly in sidebar', async ({ page }) => {
  69  |     await openBuilder(page)
  70  |     await freezeAnimations(page)
  71  | 
  72  |     const sidebar = page.locator('.sidebar')
  73  |     await expect(sidebar).toHaveScreenshot('ds-sidebar-surface.png')
  74  |   })
  75  | 
  76  |   test('btn-primary uses --accent color', async ({ page }) => {
  77  |     await openBuilder(page)
  78  |     await freezeAnimations(page)
  79  | 
  80  |     // Find first primary button visible in topbar area
  81  |     const btn = page.locator('.btn-primary').first()
  82  |     if (await btn.isVisible()) {
  83  |       await expect(btn).toHaveScreenshot('ds-btn-primary.png')
  84  |     }
  85  |   })
  86  | })
  87  | 
  88  | // ── Regression: UI changes detection ─────────────────────────────────────────
  89  | test.describe('Regression — detect unintended UI changes', () => {
  90  | 
  91  |   test('topbar height is 50px', async ({ page }) => {
  92  |     await openBuilder(page)
  93  |     const topbar = page.locator('.topbar')
  94  |     const box    = await topbar.boundingBox()
  95  |     expect(box?.height).toBe(50)
  96  |   })
  97  | 
  98  |   test('sidebar width is 252px', async ({ page }) => {
  99  |     await openBuilder(page)
  100 |     const sidebar = page.locator('.sidebar')
  101 |     const box     = await sidebar.boundingBox()
  102 |     expect(box?.width).toBe(252)
  103 |   })
  104 | 
  105 |   test('design system: --accent token resolves to #6c63ff', async ({ page }) => {
  106 |     await openBuilder(page)
  107 |     const accent = await page.evaluate(() =>
  108 |       getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
  109 |     )
  110 |     expect(accent).toBe('#6c63ff')
  111 |   })
  112 | 
  113 |   test('design system: --sp-4 token resolves to 16px', async ({ page }) => {
  114 |     await openBuilder(page)
  115 |     const sp4 = await page.evaluate(() =>
  116 |       getComputedStyle(document.documentElement).getPropertyValue('--sp-4').trim()
  117 |     )
  118 |     expect(sp4).toBe('16px')
  119 |   })
  120 | 
  121 |   test('design system: --text-base token resolves to 13px', async ({ page }) => {
  122 |     await openBuilder(page)
  123 |     const textBase = await page.evaluate(() =>
  124 |       getComputedStyle(document.documentElement).getPropertyValue('--text-base').trim()
  125 |     )
  126 |     expect(textBase).toBe('13px')
  127 |   })
  128 | })
  129 | 
```