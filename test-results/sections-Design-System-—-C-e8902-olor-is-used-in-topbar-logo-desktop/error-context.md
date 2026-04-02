# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sections.spec.js >> Design System — CSS tokens applied >> --accent color is used in topbar logo
- Location: tests\visual\sections.spec.js:58:3

# Error details

```
Error: A snapshot doesn't exist at C:\Users\Muhammed\Desktop\github\bulider\tests\visual\baselines\sections.spec.js-snapshots\ds-logo-mark-desktop-win32.png, writing actual.
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
        - button "🇺🇸 EN" [ref=e21] [cursor=pointer]:
          - generic [ref=e22]: 🇺🇸
          - generic [ref=e23]: EN
        - button "Clear" [ref=e24] [cursor=pointer]
        - button "📐 Templates" [ref=e25] [cursor=pointer]
        - button "📁 Projects" [ref=e26] [cursor=pointer]
        - button "✏️ CMS" [ref=e27] [cursor=pointer]
        - button "🧩 Plugins" [ref=e28] [cursor=pointer]
        - button "🔌 Integrations" [ref=e29] [cursor=pointer]
        - button "📊 Analytics" [ref=e30] [cursor=pointer]
        - button "✨ Animate" [ref=e31] [cursor=pointer]
        - button "📱 Responsive" [ref=e32] [cursor=pointer]
        - button "⬇ Export" [ref=e33] [cursor=pointer]
        - button "🚀 Deploy" [ref=e34] [cursor=pointer]
        - button "🧪" [ref=e35] [cursor=pointer]
        - button "💾" [ref=e36] [cursor=pointer]
        - button "📂" [ref=e37] [cursor=pointer]
        - button "🚀 Preview" [ref=e38] [cursor=pointer]
        - generic [ref=e40] [cursor=pointer]:
          - generic [ref=e41]: T
          - generic [ref=e42]:
            - generic [ref=e43]: Tester
            - generic [ref=e44]: pro
          - generic [ref=e45]: ▾
    - generic [ref=e46]:
      - complementary [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e49] [cursor=pointer]: Blocks
          - generic [ref=e50] [cursor=pointer]: Components
          - generic [ref=e51] [cursor=pointer]: Layers0
          - generic [ref=e52] [cursor=pointer]: 💡
        - generic [ref=e54]:
          - paragraph [ref=e55]: Drag to canvas or click to add
          - generic [ref=e56]:
            - generic "Drag or click to add" [ref=e57]:
              - generic [ref=e58]: 🦸
              - generic [ref=e59]:
                - generic [ref=e60]: Hero
                - generic [ref=e61]: Full-width hero banner
              - generic [ref=e62]: ⠿
            - generic "Drag or click to add" [ref=e63]:
              - generic [ref=e64]: 👤
              - generic [ref=e65]:
                - generic [ref=e66]: About
                - generic [ref=e67]: Two-column intro section
              - generic [ref=e68]: ⠿
            - generic "Drag or click to add" [ref=e69]:
              - generic [ref=e70]: ✉️
              - generic [ref=e71]:
                - generic [ref=e72]: Contact
                - generic [ref=e73]: Form + contact info
              - generic [ref=e74]: ⠿
            - generic "Drag or click to add" [ref=e75]:
              - generic [ref=e76]: ✨
              - generic [ref=e77]:
                - generic [ref=e78]: Features
                - generic [ref=e79]: 3-column highlights
              - generic [ref=e80]: ⠿
            - generic "Drag or click to add" [ref=e81]:
              - generic [ref=e82]: 💬
              - generic [ref=e83]:
                - generic [ref=e84]: Testimonial
                - generic [ref=e85]: Quote + attribution
              - generic [ref=e86]: ⠿
            - generic "Drag or click to add" [ref=e87]:
              - generic [ref=e88]: 🔻
              - generic [ref=e89]:
                - generic [ref=e90]: Footer
                - generic [ref=e91]: Footer with links
              - generic [ref=e92]: ⠿
      - main [ref=e93]:
        - generic [ref=e94]:
          - generic: Desktop — 920px
          - generic [ref=e95]:
            - generic:
              - generic: ✦
              - heading "Drop a block here" [level=3]
              - paragraph: Drag from the left panel, or click any block
      - complementary [ref=e96]:
        - generic [ref=e97]:
          - generic [ref=e98] [cursor=pointer]: Edit
          - generic [ref=e99] [cursor=pointer]: Style
          - generic [ref=e100] [cursor=pointer]: Live
        - generic [ref=e102]:
          - generic [ref=e103]: 🎛
          - paragraph [ref=e104]: Select a section to edit
  - generic [ref=e105]:
    - generic [ref=e106]:
      - generic [ref=e107]: ⏱
      - generic [ref=e108]: History
      - button "✕" [ref=e109] [cursor=pointer]
    - generic [ref=e110]:
      - button "⭐ Save Checkpoint" [ref=e111] [cursor=pointer]
      - paragraph [ref=e113]: No history yet
  - generic [ref=e114]:
    - generic [ref=e115]:
      - generic [ref=e116]: ✨
      - generic [ref=e117]: Animations
      - button "✕" [ref=e118] [cursor=pointer]
    - generic [ref=e119]:
      - generic [ref=e120]:
        - generic [ref=e121]:
          - generic [ref=e122]: Enable Animations
          - generic [ref=e123]: Scroll-triggered on published page
        - button [ref=e124] [cursor=pointer]
      - generic [ref=e126]: Apply to all sections
      - generic [ref=e127]: Per-section settings
      - button "▶ Preview All Animations" [ref=e128] [cursor=pointer]
      - button "↺ Reset All" [ref=e129] [cursor=pointer]
  - generic [ref=e130]:
    - generic [ref=e131]:
      - generic [ref=e132]: 📱
      - generic [ref=e133]: Responsive Design
      - button "✕" [ref=e134] [cursor=pointer]
    - generic [ref=e135]:
      - generic [ref=e136]:
        - button "🖥 Desktop 920px" [ref=e137] [cursor=pointer]:
          - generic [ref=e138]: 🖥
          - generic [ref=e139]: Desktop
          - generic [ref=e140]: 920px
        - button "📱 Tablet 768px" [ref=e141] [cursor=pointer]:
          - generic [ref=e142]: 📱
          - generic [ref=e143]: Tablet
          - generic [ref=e144]: 768px
        - button "📲 Mobile 375px" [ref=e145] [cursor=pointer]:
          - generic [ref=e146]: 📲
          - generic [ref=e147]: Mobile
          - generic [ref=e148]: 375px
      - generic [ref=e149]:
        - spinbutton [ref=e150]: "920"
        - button "→" [ref=e151] [cursor=pointer]
      - generic [ref=e152]: Breakpoints
      - generic [ref=e153]: Global overrides
      - generic [ref=e154]: Per-section overrides
      - button "✓ Apply & Regenerate CSS" [ref=e155] [cursor=pointer]
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
  48  |     await expect(canvas).toHaveScreenshot(`section-${sectionType}.png`, {
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
> 65  |     await expect(logoMark).toHaveScreenshot('ds-logo-mark.png')
      |     ^ Error: A snapshot doesn't exist at C:\Users\Muhammed\Desktop\github\bulider\tests\visual\baselines\sections.spec.js-snapshots\ds-logo-mark-desktop-win32.png, writing actual.
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