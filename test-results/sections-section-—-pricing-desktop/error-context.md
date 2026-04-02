# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sections.spec.js >> section — pricing
- Location: tests\visual\sections.spec.js:42:3

# Error details

```
Error: expect(locator).toHaveScreenshot(expected) failed

Locator: locator('#canvas, .canvas').first()
Timeout: 5000ms
  Timeout 5000ms exceeded.

  Snapshot: section-pricing.png

Call log:
  - Expect "toHaveScreenshot(section-pricing.png)" with timeout 5000ms
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
            - generic: 💎 Pricing
            - generic:
              - button "⠿"
              - button "⧉"
              - button "★"
              - button "✕"
            - generic [ref=e101]:
              - generic [ref=e102]:
                - heading "Simple, Transparent Pricing" [level=2] [ref=e103]
                - paragraph [ref=e104]: No hidden fees. No surprises. Cancel anytime.
                - generic [ref=e106]:
                  - generic [ref=e107]: Monthly
                  - generic [ref=e110]: Annual
              - generic [ref=e111]:
                - generic [ref=e112]:
                  - generic [ref=e113]: Starter
                  - generic [ref=e114]: Perfect for individuals and small projects.
                  - generic [ref=e115]: $0 /month
                  - link "Get Started Free" [ref=e116]:
                    - /url: "#"
                  - generic [ref=e117]:
                    - generic [ref=e118]:
                      - generic [ref=e119]: ✓
                      - text: 5 projects
                    - generic [ref=e120]:
                      - generic [ref=e121]: ✓
                      - text: 2 GB storage
                    - generic [ref=e122]:
                      - generic [ref=e123]: ✓
                      - text: Basic analytics
                    - generic [ref=e124]:
                      - generic [ref=e125]: ✓
                      - text: Community support
                - generic [ref=e126]:
                  - generic [ref=e127]: MOST POPULAR
                  - generic [ref=e128]: Pro
                  - generic [ref=e129]: For growing teams that need more power.
                  - generic [ref=e130]: $29 /month
                  - link "Start Free Trial" [ref=e131]:
                    - /url: "#"
                  - generic [ref=e132]:
                    - generic [ref=e133]:
                      - generic [ref=e134]: ✓
                      - text: Unlimited projects
                    - generic [ref=e135]:
                      - generic [ref=e136]: ✓
                      - text: 50 GB storage
                    - generic [ref=e137]:
                      - generic [ref=e138]: ✓
                      - text: Advanced analytics
                    - generic [ref=e139]:
                      - generic [ref=e140]: ✓
                      - text: Priority support
                    - generic [ref=e141]:
                      - generic [ref=e142]: ✓
                      - text: Custom domains
                    - generic [ref=e143]:
                      - generic [ref=e144]: ✓
                      - text: Team collaboration
                - generic [ref=e145]:
                  - generic [ref=e146]: Enterprise
                  - generic [ref=e147]: For large organizations with custom needs.
                  - generic [ref=e148]: $99 /month
                  - link "Contact Sales" [ref=e149]:
                    - /url: "#"
                  - generic [ref=e150]:
                    - generic [ref=e151]:
                      - generic [ref=e152]: ✓
                      - text: Everything in Pro
                    - generic [ref=e153]:
                      - generic [ref=e154]: ✓
                      - text: 500 GB storage
                    - generic [ref=e155]:
                      - generic [ref=e156]: ✓
                      - text: Custom analytics
                    - generic [ref=e157]:
                      - generic [ref=e158]: ✓
                      - text: Dedicated support
                    - generic [ref=e159]:
                      - generic [ref=e160]: ✓
                      - text: SLA guarantee
                    - generic [ref=e161]:
                      - generic [ref=e162]: ✓
                      - text: SSO & SAML
            - generic:
              - generic: No animation
      - complementary [ref=e163]:
        - generic [ref=e164]:
          - generic [ref=e165] [cursor=pointer]: Edit
          - generic [ref=e166] [cursor=pointer]: Style
          - generic [ref=e167] [cursor=pointer]: Live
        - generic [ref=e168]:
          - generic [ref=e169]:
            - generic [ref=e170]: Header
            - generic [ref=e171]:
              - generic [ref=e172]: Heading
              - textbox "Heading" [ref=e173]: Simple, Transparent Pricing
            - generic [ref=e174]:
              - generic [ref=e175]: Sub-heading
              - textbox [ref=e176]: No hidden fees. No surprises. Cancel anytime.
            - generic [ref=e177]:
              - generic [ref=e178]: Monthly Label
              - textbox "Monthly Label" [ref=e179]: Monthly
            - generic [ref=e180]:
              - generic [ref=e181]: Annual Label
              - textbox "Annual Label" [ref=e182]: Annual
            - generic [ref=e183]:
              - generic [ref=e184]: Discount Badge
              - textbox "Discount Badge" [ref=e185]: Save 20%
          - generic [ref=e186]:
            - generic [ref=e187]: Starter Plan
            - generic [ref=e188]:
              - generic [ref=e189]: Plan Name
              - textbox "Plan Name" [ref=e190]: Starter
            - generic [ref=e191]:
              - generic [ref=e192]: Description
              - textbox [ref=e193]: Perfect for individuals and small projects.
            - generic [ref=e194]:
              - generic [ref=e195]: Price (Monthly)
              - textbox "Price (Monthly)" [ref=e196]: "0"
            - generic [ref=e197]:
              - generic [ref=e198]: Price (Annual)
              - textbox "Price (Annual)" [ref=e199]: "0"
            - generic [ref=e200]:
              - generic [ref=e201]: Button Text
              - textbox "Button Text" [ref=e202]: Get Started Free
            - generic [ref=e203]:
              - generic [ref=e204]: Button URL
              - textbox "Button URL" [ref=e205]: "#"
            - generic [ref=e206]:
              - generic [ref=e207]: Feature 1
              - textbox "Feature 1" [ref=e208]: 5 projects
            - generic [ref=e209]:
              - generic [ref=e210]: Feature 2
              - textbox "Feature 2" [ref=e211]: 2 GB storage
            - generic [ref=e212]:
              - generic [ref=e213]: Feature 3
              - textbox "Feature 3" [ref=e214]: Basic analytics
            - generic [ref=e215]:
              - generic [ref=e216]: Feature 4
              - textbox "Feature 4" [ref=e217]: Community support
            - generic [ref=e218]:
              - generic [ref=e219]: Featured Card
              - combobox [ref=e220]:
                - option "false" [selected]
                - option "true"
          - generic [ref=e221]:
            - generic [ref=e222]: Pro Plan
            - generic [ref=e223]:
              - generic [ref=e224]: Plan Name
              - textbox "Plan Name" [ref=e225]: Pro
            - generic [ref=e226]:
              - generic [ref=e227]: Description
              - textbox [ref=e228]: For growing teams that need more power.
            - generic [ref=e229]:
              - generic [ref=e230]: Price (Monthly)
              - textbox "Price (Monthly)" [ref=e231]: "29"
            - generic [ref=e232]:
              - generic [ref=e233]: Price (Annual)
              - textbox "Price (Annual)" [ref=e234]: "23"
            - generic [ref=e235]:
              - generic [ref=e236]: Button Text
              - textbox "Button Text" [ref=e237]: Start Free Trial
            - generic [ref=e238]:
              - generic [ref=e239]: Button URL
              - textbox "Button URL" [ref=e240]: "#"
            - generic [ref=e241]:
              - generic [ref=e242]: Feature 1
              - textbox "Feature 1" [ref=e243]: Unlimited projects
            - generic [ref=e244]:
              - generic [ref=e245]: Feature 2
              - textbox "Feature 2" [ref=e246]: 50 GB storage
            - generic [ref=e247]:
              - generic [ref=e248]: Feature 3
              - textbox "Feature 3" [ref=e249]: Advanced analytics
            - generic [ref=e250]:
              - generic [ref=e251]: Feature 4
              - textbox "Feature 4" [ref=e252]: Priority support
            - generic [ref=e253]:
              - generic [ref=e254]: Feature 5
              - textbox "Feature 5" [ref=e255]: Custom domains
            - generic [ref=e256]:
              - generic [ref=e257]: Feature 6
              - textbox "Feature 6" [ref=e258]: Team collaboration
            - generic [ref=e259]:
              - generic [ref=e260]: Featured Card
              - combobox [ref=e261]:
                - option "true" [selected]
                - option "false"
          - generic [ref=e262]:
            - generic [ref=e263]: Enterprise Plan
            - generic [ref=e264]:
              - generic [ref=e265]: Plan Name
              - textbox "Plan Name" [ref=e266]: Enterprise
            - generic [ref=e267]:
              - generic [ref=e268]: Description
              - textbox [ref=e269]: For large organizations with custom needs.
            - generic [ref=e270]:
              - generic [ref=e271]: Price (Monthly)
              - textbox "Price (Monthly)" [ref=e272]: "99"
            - generic [ref=e273]:
              - generic [ref=e274]: Price (Annual)
              - textbox "Price (Annual)" [ref=e275]: "79"
            - generic [ref=e276]:
              - generic [ref=e277]: Button Text
              - textbox "Button Text" [ref=e278]: Contact Sales
            - generic [ref=e279]:
              - generic [ref=e280]: Button URL
              - textbox "Button URL" [ref=e281]: "#"
            - generic [ref=e282]:
              - generic [ref=e283]: Feature 1
              - textbox "Feature 1" [ref=e284]: Everything in Pro
            - generic [ref=e285]:
              - generic [ref=e286]: Feature 2
              - textbox "Feature 2" [ref=e287]: 500 GB storage
            - generic [ref=e288]:
              - generic [ref=e289]: Feature 3
              - textbox "Feature 3" [ref=e290]: Custom analytics
            - generic [ref=e291]:
              - generic [ref=e292]: Feature 4
              - textbox "Feature 4" [ref=e293]: Dedicated support
            - generic [ref=e294]:
              - generic [ref=e295]: Feature 5
              - textbox "Feature 5" [ref=e296]: SLA guarantee
            - generic [ref=e297]:
              - generic [ref=e298]: Feature 6
              - textbox "Feature 6" [ref=e299]: SSO & SAML
            - generic [ref=e300]:
              - generic [ref=e301]: Featured Card
              - combobox [ref=e302]:
                - option "false" [selected]
                - option "true"
  - generic [ref=e303]:
    - generic [ref=e304]:
      - generic [ref=e305]: ⏱
      - generic [ref=e306]: History
      - button "✕" [ref=e307] [cursor=pointer]
    - generic [ref=e308]:
      - button "⭐ Save Checkpoint" [ref=e309] [cursor=pointer]
      - generic [ref=e311]:
        - generic [ref=e312]: ↩
        - generic [ref=e313]:
          - generic [ref=e314]: Add Pricing
          - generic [ref=e315]: 0 sections · 0s ago
        - generic [ref=e316]: Current
  - generic [ref=e317]:
    - generic [ref=e318]:
      - generic [ref=e319]: ✨
      - generic [ref=e320]: Animations
      - button "✕" [ref=e321] [cursor=pointer]
    - generic [ref=e322]:
      - generic [ref=e323]:
        - generic [ref=e324]:
          - generic [ref=e325]: Enable Animations
          - generic [ref=e326]: Scroll-triggered on published page
        - button [ref=e327] [cursor=pointer]
      - generic [ref=e329]: Apply to all sections
      - generic [ref=e330]: Per-section settings
      - button "▶ Preview All Animations" [ref=e331] [cursor=pointer]
      - button "↺ Reset All" [ref=e332] [cursor=pointer]
  - generic [ref=e333]:
    - generic [ref=e334]:
      - generic [ref=e335]: 📱
      - generic [ref=e336]: Responsive Design
      - button "✕" [ref=e337] [cursor=pointer]
    - generic [ref=e338]:
      - generic [ref=e339]:
        - button "🖥 Desktop 920px" [ref=e340] [cursor=pointer]:
          - generic [ref=e341]: 🖥
          - generic [ref=e342]: Desktop
          - generic [ref=e343]: 920px
        - button "📱 Tablet 768px" [ref=e344] [cursor=pointer]:
          - generic [ref=e345]: 📱
          - generic [ref=e346]: Tablet
          - generic [ref=e347]: 768px
        - button "📲 Mobile 375px" [ref=e348] [cursor=pointer]:
          - generic [ref=e349]: 📲
          - generic [ref=e350]: Mobile
          - generic [ref=e351]: 375px
      - generic [ref=e352]:
        - spinbutton [ref=e353]: "920"
        - button "→" [ref=e354] [cursor=pointer]
      - generic [ref=e355]: Breakpoints
      - generic [ref=e356]: Global overrides
      - generic [ref=e357]: Per-section overrides
      - button "✓ Apply & Regenerate CSS" [ref=e358] [cursor=pointer]
  - generic:
    - generic: ✦
    - text: Pricing added
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