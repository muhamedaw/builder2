# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sections.spec.js >> section — gallery
- Location: tests\visual\sections.spec.js:42:3

# Error details

```
Error: expect(locator).toHaveScreenshot(expected) failed

Locator: locator('#canvas, .canvas').first()
Timeout: 5000ms
  Timeout 5000ms exceeded.

  Snapshot: section-gallery.png

Call log:
  - Expect "toHaveScreenshot(section-gallery.png)" with timeout 5000ms
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
            - generic: 🖼 Gallery
            - generic:
              - button "⠿"
              - button "⧉"
              - button "★"
              - button "✕"
            - generic [ref=e101]:
              - generic [ref=e102]:
                - heading "Our Work" [level=2] [ref=e103]
                - paragraph [ref=e104]: A showcase of projects we're proud of.
              - generic [ref=e105]:
                - generic [ref=e106]:
                  - generic [ref=e107]:
                    - img "Team Collaboration" [ref=e108]
                    - generic [ref=e109]:
                      - generic: 🖼 Replace
                  - generic [ref=e110]: Team Collaboration
                - generic [ref=e111]:
                  - generic [ref=e112]:
                    - img "Modern Office Space" [ref=e113]
                    - generic [ref=e114]:
                      - generic: 🖼 Replace
                  - generic [ref=e115]: Modern Office Space
                - generic [ref=e116]:
                  - generic [ref=e117]:
                    - img "Strategy Session" [ref=e118]
                    - generic [ref=e119]:
                      - generic: 🖼 Replace
                  - generic [ref=e120]: Strategy Session
                - generic [ref=e121]:
                  - generic [ref=e122]:
                    - img "Data & Analytics" [ref=e123]
                    - generic [ref=e124]:
                      - generic: 🖼 Replace
                  - generic [ref=e125]: Data & Analytics
                - generic [ref=e126]:
                  - generic [ref=e127]:
                    - img "Product Workshop" [ref=e128]
                    - generic [ref=e129]:
                      - generic: 🖼 Replace
                  - generic [ref=e130]: Product Workshop
                - generic [ref=e131]:
                  - generic [ref=e132]:
                    - img "Client Presentation" [ref=e133]
                    - generic [ref=e134]:
                      - generic: 🖼 Replace
                  - generic [ref=e135]: Client Presentation
            - generic:
              - generic: No animation
      - complementary [ref=e136]:
        - generic [ref=e137]:
          - generic [ref=e138] [cursor=pointer]: Edit
          - generic [ref=e139] [cursor=pointer]: Style
          - generic [ref=e140] [cursor=pointer]: Live
        - generic [ref=e141]:
          - generic [ref=e142]:
            - generic [ref=e143]: Header
            - generic [ref=e144]:
              - generic [ref=e145]: Heading
              - textbox "Heading" [ref=e146]: Our Work
            - generic [ref=e147]:
              - generic [ref=e148]: Sub-heading
              - textbox [ref=e149]: A showcase of projects we're proud of.
          - generic [ref=e150]:
            - generic [ref=e151]: Layout
            - generic [ref=e152]:
              - generic [ref=e153]: Layout Style
              - combobox [ref=e154]:
                - option "grid" [selected]
                - option "masonry"
                - option "featured"
            - generic [ref=e155]:
              - generic [ref=e156]: Columns
              - combobox [ref=e157]:
                - option "2"
                - option "3" [selected]
                - option "4"
          - generic [ref=e158]:
            - generic [ref=e159]: Image 1
            - generic [ref=e160]:
              - generic [ref=e161]: Image
              - generic [ref=e162]:
                - img [ref=e163]
                - button "📂 Upload / Replace" [ref=e164] [cursor=pointer]
              - textbox "Or paste URL…" [ref=e165]: https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80
            - generic [ref=e166]:
              - generic [ref=e167]: Caption
              - textbox "Caption" [ref=e168]: Team Collaboration
          - generic [ref=e169]:
            - generic [ref=e170]: Image 2
            - generic [ref=e171]:
              - generic [ref=e172]: Image
              - generic [ref=e173]:
                - img [ref=e174]
                - button "📂 Upload / Replace" [ref=e175] [cursor=pointer]
              - textbox "Or paste URL…" [ref=e176]: https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80
            - generic [ref=e177]:
              - generic [ref=e178]: Caption
              - textbox "Caption" [ref=e179]: Modern Office Space
          - generic [ref=e180]:
            - generic [ref=e181]: Image 3
            - generic [ref=e182]:
              - generic [ref=e183]: Image
              - generic [ref=e184]:
                - img [ref=e185]
                - button "📂 Upload / Replace" [ref=e186] [cursor=pointer]
              - textbox "Or paste URL…" [ref=e187]: https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80
            - generic [ref=e188]:
              - generic [ref=e189]: Caption
              - textbox "Caption" [ref=e190]: Strategy Session
          - generic [ref=e191]:
            - generic [ref=e192]: Image 4
            - generic [ref=e193]:
              - generic [ref=e194]: Image
              - generic [ref=e195]:
                - img [ref=e196]
                - button "📂 Upload / Replace" [ref=e197] [cursor=pointer]
              - textbox "Or paste URL…" [ref=e198]: https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80
            - generic [ref=e199]:
              - generic [ref=e200]: Caption
              - textbox "Caption" [ref=e201]: Data & Analytics
          - generic [ref=e202]:
            - generic [ref=e203]: Image 5
            - generic [ref=e204]:
              - generic [ref=e205]: Image
              - generic [ref=e206]:
                - img [ref=e207]
                - button "📂 Upload / Replace" [ref=e208] [cursor=pointer]
              - textbox "Or paste URL…" [ref=e209]: https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80
            - generic [ref=e210]:
              - generic [ref=e211]: Caption
              - textbox "Caption" [ref=e212]: Product Workshop
          - generic [ref=e213]:
            - generic [ref=e214]: Image 6
            - generic [ref=e215]:
              - generic [ref=e216]: Image
              - generic [ref=e217]:
                - img [ref=e218]
                - button "📂 Upload / Replace" [ref=e219] [cursor=pointer]
              - textbox "Or paste URL…" [ref=e220]: https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80
            - generic [ref=e221]:
              - generic [ref=e222]: Caption
              - textbox "Caption" [ref=e223]: Client Presentation
  - generic [ref=e224]:
    - generic [ref=e225]:
      - generic [ref=e226]: ⏱
      - generic [ref=e227]: History
      - button "✕" [ref=e228] [cursor=pointer]
    - generic [ref=e229]:
      - button "⭐ Save Checkpoint" [ref=e230] [cursor=pointer]
      - generic [ref=e232]:
        - generic [ref=e233]: ↩
        - generic [ref=e234]:
          - generic [ref=e235]: Add Gallery
          - generic [ref=e236]: 0 sections · 0s ago
        - generic [ref=e237]: Current
  - generic [ref=e238]:
    - generic [ref=e239]:
      - generic [ref=e240]: ✨
      - generic [ref=e241]: Animations
      - button "✕" [ref=e242] [cursor=pointer]
    - generic [ref=e243]:
      - generic [ref=e244]:
        - generic [ref=e245]:
          - generic [ref=e246]: Enable Animations
          - generic [ref=e247]: Scroll-triggered on published page
        - button [ref=e248] [cursor=pointer]
      - generic [ref=e250]: Apply to all sections
      - generic [ref=e251]: Per-section settings
      - button "▶ Preview All Animations" [ref=e252] [cursor=pointer]
      - button "↺ Reset All" [ref=e253] [cursor=pointer]
  - generic [ref=e254]:
    - generic [ref=e255]:
      - generic [ref=e256]: 📱
      - generic [ref=e257]: Responsive Design
      - button "✕" [ref=e258] [cursor=pointer]
    - generic [ref=e259]:
      - generic [ref=e260]:
        - button "🖥 Desktop 920px" [ref=e261] [cursor=pointer]:
          - generic [ref=e262]: 🖥
          - generic [ref=e263]: Desktop
          - generic [ref=e264]: 920px
        - button "📱 Tablet 768px" [ref=e265] [cursor=pointer]:
          - generic [ref=e266]: 📱
          - generic [ref=e267]: Tablet
          - generic [ref=e268]: 768px
        - button "📲 Mobile 375px" [ref=e269] [cursor=pointer]:
          - generic [ref=e270]: 📲
          - generic [ref=e271]: Mobile
          - generic [ref=e272]: 375px
      - generic [ref=e273]:
        - spinbutton [ref=e274]: "920"
        - button "→" [ref=e275] [cursor=pointer]
      - generic [ref=e276]: Breakpoints
      - generic [ref=e277]: Global overrides
      - generic [ref=e278]: Per-section overrides
      - button "✓ Apply & Regenerate CSS" [ref=e279] [cursor=pointer]
  - generic:
    - generic: ✦
    - text: Gallery added
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