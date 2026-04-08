/* security.js Phase 4/5 */

/* SECURITY MIDDLEWARE
   • Rate limiting   – throttles rapid destructive actions
   • Input validation – enforces max lengths on all props
   • XSS protection  – sanitizes URLs and CSS values
══════════════════════════════════════════════════════ */
const Security = (() => {
  // ── URL sanitizer ─────────────────────────────────────────────────────────
  // Blocks javascript:, vbscript:, and non-image data: URIs in href/src slots
  const UNSAFE_URL_RE      = /^[\s\u0000]*(?:javascript|vbscript)\s*:/i
  const DATA_NON_IMAGE_RE  = /^[\s\u0000]*data\s*:(?!image\/(?:png|jpe?g|gif|webp|svg\+xml|avif))/i
  function sanitizeURL(url) {
    if (!url) return '#'
    const s = String(url).trim()
    if (UNSAFE_URL_RE.test(s) || DATA_NON_IMAGE_RE.test(s)) return '#'
    return s
  }

  // ── CSS value sanitizer ───────────────────────────────────────────────────
  // Strips expression() and javascript: url() from inline style values,
  // and removes characters that break out of style="" attributes
  const UNSAFE_CSS_RE = /expression\s*\(|url\s*\(\s*['"]?\s*(?:javascript|vbscript)/i
  function sanitizeCSS(val) {
    if (val === undefined || val === null) return ''
    const s = String(val)
    if (UNSAFE_CSS_RE.test(s)) return ''
    return s.replace(/[<>"]/g, '')
  }

  // ── Text length validator ─────────────────────────────────────────────────
  function validateText(val, max = 2000) {
    return String(val ?? '').slice(0, max)
  }

  // ── Sliding-window rate limiter ───────────────────────────────────────────
  function createRateLimiter(limit, windowMs) {
    const ts = []
    return function check() {
      const now = Date.now()
      while (ts.length && ts[0] <= now - windowMs) ts.shift()
      if (ts.length >= limit) return false
      ts.push(now)
      return true
    }
  }

  const limiters = {
    addSection: createRateLimiter(30,  10_000),  // 30 sections per 10 s
    setProp:    createRateLimiter(200,  1_000),  // 200 edits per 1 s
    applyURL:   createRateLimiter(15,  60_000),  // 15 URL applies per minute
    pushH:      createRateLimiter(60,   5_000),  // 60 history pushes per 5 s
  }

  // Prop keys whose values are URLs (href / src / CSS url())
  const URL_KEYS = new Set([
    'ctaLink','ctaSecLink',
    'link1Href','link2Href','link3Href',
    'bgImage','image','avatar',
    'img1','img2','img3','img4','img5','img6',
  ])

  // Prop keys whose values are CSS colors / style values
  const CSS_KEYS = new Set([
    'bgColor','textColor','accentColor','cardBg',
    'gradStart','gradEnd','gradMid',
  ])

  return { sanitizeURL, sanitizeCSS, validateText, limiters, URL_KEYS, CSS_KEYS, createRateLimiter }
})()

// Short aliases for use inside renderer templates
function eu(url) { return Security.sanitizeURL(url) }
function ec(val) { return Security.sanitizeCSS(val) }
