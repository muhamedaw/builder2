# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sections.spec.js >> section — faq
- Location: tests\visual\sections.spec.js:42:3

# Error details

```
Error: expect(locator).toHaveScreenshot(expected) failed

Locator: locator('#canvas, .canvas').first()
Timeout: 5000ms
  Timeout 5000ms exceeded.

  Snapshot: section-faq.png

Call log:
  - Expect "toHaveScreenshot(section-faq.png)" with timeout 5000ms
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
            - generic: ❓ FAQ
            - generic:
              - button "⠿"
              - button "⧉"
              - button "★"
              - button "✕"
            - generic [ref=e101]:
              - generic [ref=e102]:
                - heading "Frequently Asked Questions" [level=2] [ref=e103]
                - paragraph [ref=e104]: Everything you need to know. Can't find the answer? Contact our team.
              - group [ref=e105]:
                - generic "How does the free trial work? +" [ref=e106]:
                  - generic [ref=e107]: How does the free trial work?
                  - generic [ref=e108]: +
                - paragraph [ref=e110]: Your 14-day free trial gives you full access to all Pro features — no credit card required. At the end of the trial, you can upgrade to a paid plan or downgrade to our free tier.
              - group [ref=e111]:
                - generic "Can I cancel my subscription at any time? +" [ref=e112]:
                  - generic [ref=e113]: Can I cancel my subscription at any time?
                  - generic [ref=e114]: +
              - group [ref=e115]:
                - generic "What payment methods do you accept? +" [ref=e116]:
                  - generic [ref=e117]: What payment methods do you accept?
                  - generic [ref=e118]: +
              - group [ref=e119]:
                - generic "Is my data secure? +" [ref=e120]:
                  - generic [ref=e121]: Is my data secure?
                  - generic [ref=e122]: +
              - group [ref=e123]:
                - generic "Do you offer discounts for non-profits or education? +" [ref=e124]:
                  - generic [ref=e125]: Do you offer discounts for non-profits or education?
                  - generic [ref=e126]: +
              - group [ref=e127]:
                - generic "Can I switch between plans? +" [ref=e128]:
                  - generic [ref=e129]: Can I switch between plans?
                  - generic [ref=e130]: +
            - generic:
              - generic: No animation
      - complementary [ref=e131]:
        - generic [ref=e132]:
          - generic [ref=e133] [cursor=pointer]: Edit
          - generic [ref=e134] [cursor=pointer]: Style
          - generic [ref=e135] [cursor=pointer]: Live
        - generic [ref=e136]:
          - generic [ref=e137]:
            - generic [ref=e138]: Header
            - generic [ref=e139]:
              - generic [ref=e140]: Heading
              - textbox "Heading" [ref=e141]: Frequently Asked Questions
            - generic [ref=e142]:
              - generic [ref=e143]: Sub-heading
              - textbox [ref=e144]: Everything you need to know. Can't find the answer? Contact our team.
          - generic [ref=e145]:
            - generic [ref=e146]: Question 1
            - generic [ref=e147]:
              - generic [ref=e148]: Question
              - textbox "Question" [ref=e149]: How does the free trial work?
            - generic [ref=e150]:
              - generic [ref=e151]: Answer
              - textbox [ref=e152]: Your 14-day free trial gives you full access to all Pro features — no credit card required. At the end of the trial, you can upgrade to a paid plan or downgrade to our free tier.
          - generic [ref=e153]:
            - generic [ref=e154]: Question 2
            - generic [ref=e155]:
              - generic [ref=e156]: Question
              - textbox "Question" [ref=e157]: Can I cancel my subscription at any time?
            - generic [ref=e158]:
              - generic [ref=e159]: Answer
              - textbox [ref=e160]: Yes, absolutely. You can cancel your subscription at any time from your account settings. Your access continues until the end of your current billing period.
          - generic [ref=e161]:
            - generic [ref=e162]: Question 3
            - generic [ref=e163]:
              - generic [ref=e164]: Question
              - textbox "Question" [ref=e165]: What payment methods do you accept?
            - generic [ref=e166]:
              - generic [ref=e167]: Answer
              - textbox [ref=e168]: We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely via Stripe.
          - generic [ref=e169]:
            - generic [ref=e170]: Question 4
            - generic [ref=e171]:
              - generic [ref=e172]: Question
              - textbox "Question" [ref=e173]: Is my data secure?
            - generic [ref=e174]:
              - generic [ref=e175]: Answer
              - textbox [ref=e176]: Security is our top priority. We use AES-256 encryption, SOC 2 Type II certification, and daily backups. Your data is never shared with third parties.
          - generic [ref=e177]:
            - generic [ref=e178]: Question 5
            - generic [ref=e179]:
              - generic [ref=e180]: Question
              - textbox "Question" [ref=e181]: Do you offer discounts for non-profits or education?
            - generic [ref=e182]:
              - generic [ref=e183]: Answer
              - textbox [ref=e184]: Yes! We offer 50% off for verified non-profit organisations and educational institutions. Contact our team with proof of your status to get started.
          - generic [ref=e185]:
            - generic [ref=e186]: Question 6
            - generic [ref=e187]:
              - generic [ref=e188]: Question
              - textbox "Question" [ref=e189]: Can I switch between plans?
            - generic [ref=e190]:
              - generic [ref=e191]: Answer
              - textbox [ref=e192]: You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, and we'll prorate your billing. Downgrades take effect at the end of your billing cycle.
  - generic [ref=e193]:
    - generic [ref=e194]:
      - generic [ref=e195]: ⏱
      - generic [ref=e196]: History
      - button "✕" [ref=e197] [cursor=pointer]
    - generic [ref=e198]:
      - button "⭐ Save Checkpoint" [ref=e199] [cursor=pointer]
      - generic [ref=e201]:
        - generic [ref=e202]: ↩
        - generic [ref=e203]:
          - generic [ref=e204]: Add FAQ
          - generic [ref=e205]: 0 sections · 0s ago
        - generic [ref=e206]: Current
  - generic [ref=e207]:
    - generic [ref=e208]:
      - generic [ref=e209]: ✨
      - generic [ref=e210]: Animations
      - button "✕" [ref=e211] [cursor=pointer]
    - generic [ref=e212]:
      - generic [ref=e213]:
        - generic [ref=e214]:
          - generic [ref=e215]: Enable Animations
          - generic [ref=e216]: Scroll-triggered on published page
        - button [ref=e217] [cursor=pointer]
      - generic [ref=e219]: Apply to all sections
      - generic [ref=e220]: Per-section settings
      - button "▶ Preview All Animations" [ref=e221] [cursor=pointer]
      - button "↺ Reset All" [ref=e222] [cursor=pointer]
  - generic [ref=e223]:
    - generic [ref=e224]:
      - generic [ref=e225]: 📱
      - generic [ref=e226]: Responsive Design
      - button "✕" [ref=e227] [cursor=pointer]
    - generic [ref=e228]:
      - generic [ref=e229]:
        - button "🖥 Desktop 920px" [ref=e230] [cursor=pointer]:
          - generic [ref=e231]: 🖥
          - generic [ref=e232]: Desktop
          - generic [ref=e233]: 920px
        - button "📱 Tablet 768px" [ref=e234] [cursor=pointer]:
          - generic [ref=e235]: 📱
          - generic [ref=e236]: Tablet
          - generic [ref=e237]: 768px
        - button "📲 Mobile 375px" [ref=e238] [cursor=pointer]:
          - generic [ref=e239]: 📲
          - generic [ref=e240]: Mobile
          - generic [ref=e241]: 375px
      - generic [ref=e242]:
        - spinbutton [ref=e243]: "920"
        - button "→" [ref=e244] [cursor=pointer]
      - generic [ref=e245]: Breakpoints
      - generic [ref=e246]: Global overrides
      - generic [ref=e247]: Per-section overrides
      - button "✓ Apply & Regenerate CSS" [ref=e248] [cursor=pointer]
  - generic:
    - generic: ✦
    - text: FAQ added
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