# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sections.spec.js >> section — hero
- Location: tests\visual\sections.spec.js:42:3

# Error details

```
Error: expect(locator).toHaveScreenshot(expected) failed

Locator: locator('#canvas, .canvas').first()
Timeout: 5000ms
  Timeout 5000ms exceeded.

  Snapshot: section-hero.png

Call log:
  - Expect "toHaveScreenshot(section-hero.png)" with timeout 5000ms
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
            - generic:
              - button "⠿"
              - button "⧉"
              - button "★"
              - button "✕"
            - generic [ref=e97]:
              - heading "Build Something People Love" [level=1] [ref=e98]
              - paragraph [ref=e99]: Fast, flexible, and beautiful.
              - generic [ref=e100]:
                - link "Get Started" [ref=e101]:
                  - /url: "#"
                  - generic [ref=e102]: Get Started
                - link "Learn More" [ref=e103]:
                  - /url: "#"
                  - generic [ref=e104]: Learn More
            - generic:
              - generic: No animation
      - complementary [ref=e105]:
        - generic [ref=e106]:
          - generic [ref=e107] [cursor=pointer]: Edit
          - generic [ref=e108] [cursor=pointer]: Style
          - generic [ref=e109] [cursor=pointer]: Live
        - generic [ref=e110]:
          - generic [ref=e111]:
            - generic [ref=e112]: Content
            - generic [ref=e113]:
              - generic [ref=e114]: Headline
              - textbox "Headline" [ref=e115]: Build Something People Love
            - generic [ref=e116]:
              - generic [ref=e117]: Sub-headline
              - textbox [ref=e118]: Fast, flexible, and beautiful.
            - generic [ref=e119]:
              - generic [ref=e120]: CTA Text
              - textbox "CTA Text" [ref=e121]: Get Started
            - generic [ref=e122]:
              - generic [ref=e123]: CTA URL
              - textbox "CTA URL" [ref=e124]: "#"
            - generic [ref=e125]:
              - generic [ref=e126]: 2nd CTA
              - textbox "2nd CTA" [ref=e127]: Learn More
            - generic [ref=e128]:
              - generic [ref=e129]: 2nd URL
              - textbox "2nd URL" [ref=e130]: "#"
          - generic [ref=e131]:
            - generic [ref=e132]: Layout
            - generic [ref=e133]:
              - generic [ref=e134]: Alignment
              - combobox [ref=e135]:
                - option "center" [selected]
                - option "left"
            - generic [ref=e136]:
              - generic [ref=e137]: Height (px)
              - textbox "Height (px)" [ref=e138]: "520"
          - generic [ref=e139]:
            - generic [ref=e140]: Background Image
            - generic [ref=e141]:
              - generic [ref=e142]: BG Image
              - generic [ref=e143]:
                - generic [ref=e144]:
                  - generic [ref=e145]: 🖼
                  - generic [ref=e146]: No image
                - button "📂 Upload / Replace" [ref=e147] [cursor=pointer]
              - textbox "Or paste URL…" [ref=e148]
  - generic [ref=e149]:
    - generic [ref=e150]:
      - generic [ref=e151]: ⏱
      - generic [ref=e152]: History
      - button "✕" [ref=e153] [cursor=pointer]
    - generic [ref=e154]:
      - button "⭐ Save Checkpoint" [ref=e155] [cursor=pointer]
      - generic [ref=e157]:
        - generic [ref=e158]: ↩
        - generic [ref=e159]:
          - generic [ref=e160]: Add Hero
          - generic [ref=e161]: 0 sections · 0s ago
        - generic [ref=e162]: Current
  - generic [ref=e163]:
    - generic [ref=e164]:
      - generic [ref=e165]: ✨
      - generic [ref=e166]: Animations
      - button "✕" [ref=e167] [cursor=pointer]
    - generic [ref=e168]:
      - generic [ref=e169]:
        - generic [ref=e170]:
          - generic [ref=e171]: Enable Animations
          - generic [ref=e172]: Scroll-triggered on published page
        - button [ref=e173] [cursor=pointer]
      - generic [ref=e175]: Apply to all sections
      - generic [ref=e176]: Per-section settings
      - button "▶ Preview All Animations" [ref=e177] [cursor=pointer]
      - button "↺ Reset All" [ref=e178] [cursor=pointer]
  - generic [ref=e179]:
    - generic [ref=e180]:
      - generic [ref=e181]: 📱
      - generic [ref=e182]: Responsive Design
      - button "✕" [ref=e183] [cursor=pointer]
    - generic [ref=e184]:
      - generic [ref=e185]:
        - button "🖥 Desktop 920px" [ref=e186] [cursor=pointer]:
          - generic [ref=e187]: 🖥
          - generic [ref=e188]: Desktop
          - generic [ref=e189]: 920px
        - button "📱 Tablet 768px" [ref=e190] [cursor=pointer]:
          - generic [ref=e191]: 📱
          - generic [ref=e192]: Tablet
          - generic [ref=e193]: 768px
        - button "📲 Mobile 375px" [ref=e194] [cursor=pointer]:
          - generic [ref=e195]: 📲
          - generic [ref=e196]: Mobile
          - generic [ref=e197]: 375px
      - generic [ref=e198]:
        - spinbutton [ref=e199]: "920"
        - button "→" [ref=e200] [cursor=pointer]
      - generic [ref=e201]: Breakpoints
      - generic [ref=e202]: Global overrides
      - generic [ref=e203]: Per-section overrides
      - button "✓ Apply & Regenerate CSS" [ref=e204] [cursor=pointer]
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