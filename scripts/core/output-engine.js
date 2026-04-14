/* output-engine.js — Production HTML post-processor
   Cleans, optimizes, and compresses export output. */

const OutputEngine = (() => {
  'use strict'

  // ── 1. Deep strip — remove ALL builder artifacts ─────────────────────────────
  function deepStrip(html) {
    return html
      // Builder data attributes
      .replace(/\s+contenteditable="[^"]*"/g, '')
      .replace(/\s+data-id="[^"]*"/g, '')
      .replace(/\s+data-key="[^"]*"/g, '')
      .replace(/\s+data-pk="[^"]*"/g, '')
      .replace(/\s+data-section-id="[^"]*"/g, '')
      .replace(/\s+data-drop-idx="[^"]*"/g, '')
      .replace(/\s+data-pc-section="[^"]*"/g, '')  // animation targeting attr
      .replace(/\s+data-pc-type="[^"]*"/g, '')      // semantic-id passthrough attr
      .replace(/\s+data-pc-id="[^"]*"/g, '')         // builder micro-target IDs (keep data-pc-animation)
      .replace(/\s+data-bind="[^"]*"/g, '')
      // Builder class fragments — strip from class attribute strings
      .replace(/\b(img-editable|sec-content|section-wrapper|section-selected|drop-line|canvas-empty|anim-badge)\b\s*/g, '')
      // Builder UI elements (entire elements removed)
      .replace(/<div[^>]*class="[^"]*img-overlay[^"]*"[\s\S]*?<\/div>/g, '')
      .replace(/<div[^>]*class="[^"]*section-controls[^"]*"[\s\S]*?<\/div>/g, '')
      .replace(/<span[^>]*class="[^"]*section-label[^"]*"[\s\S]*?<\/span>/g, '')
      .replace(/<div[^>]*class="[^"]*cms-bind-badge[^"]*"[\s\S]*?<\/div>/g, '')
      .replace(/<span[^>]*class="[^"]*anim-badge[^"]*"[\s\S]*?<\/span>/g, '')
      // Builder event handlers
      .replace(/\s+onclick="openModal\([^)]*\)"/g, '')
      .replace(/\s+onclick="onSecClick\([^)]*\)"/g, '')
      .replace(/\s+onpointerdown="[^"]*"/g, '')
      // Empty class / style attributes left over after stripping
      .replace(/\s+class="\s*"/g, '')
      .replace(/\s+style="\s*"/g, '')
      // Normalize excess whitespace inside tags
      .replace(/[ \t]{2,}/g, ' ')
  }

  // ── 2. CSS class extractor ────────────────────────────────────────────────────
  // Promotes repeated inline style values to reusable .pcN utility classes.
  // Handles all attr orderings: standalone style, class+style, style+class.
  function extractCSS(html) {
    // Pass 1 — count occurrences of each style value
    const counts = new Map()
    const countRe = /\bstyle="([^"]*)"/g
    let m
    while ((m = countRe.exec(html)) !== null) {
      const val = m[1].trim()
      if (val) counts.set(val, (counts.get(val) || 0) + 1)
    }

    // Pass 2 — assign class names only to values appearing ≥ 2 times
    const styleMap = new Map()
    const classCSS = []
    let classIdx = 0
    counts.forEach((count, val) => {
      if (count >= 2) {
        const cls = `pc${++classIdx}`
        styleMap.set(val, cls)
        classCSS.push(`.${cls}{${val}}`)
      }
    })

    if (!styleMap.size) return { html, cssBlock: '' }

    // Pass 3 — replace all three orderings:
    //   (a) class="X" style="Y"  →  class="X pcN"
    //   (b) style="Y" class="X"  →  class="pcN X"
    //   (c) style="Y"            →  class="pcN"
    let cleaned = html

    // (a) class before style
    cleaned = cleaned.replace(/\bclass="([^"]*?)"\s+style="([^"]*)"/g, (_, cls, styleVal) => {
      const pcCls = styleMap.get(styleVal.trim())
      if (!pcCls) return _
      const combined = [cls, pcCls].filter(s => s.trim()).join(' ').trim()
      return `class="${combined}"`
    })

    // (b) style before class
    cleaned = cleaned.replace(/\bstyle="([^"]*)"\s+class="([^"]*?)"/g, (_, styleVal, cls) => {
      const pcCls = styleMap.get(styleVal.trim())
      if (!pcCls) return _
      const combined = [pcCls, cls].filter(s => s.trim()).join(' ').trim()
      return `class="${combined}"`
    })

    // (c) standalone style (no class attr on this element)
    cleaned = cleaned.replace(/\bstyle="([^"]*)"/g, (match, styleVal) => {
      const pcCls = styleMap.get(styleVal.trim())
      if (!pcCls) return match
      return `class="${pcCls}"`
    })

    return { html: cleaned, cssBlock: classCSS.join('\n') }
  }

  // ── 3. Image optimizer ────────────────────────────────────────────────────────
  function optimizeImages(html) {
    return html
      // Lazy-load all images (skip if already has loading attr)
      .replace(/<img(?![^>]*\bloading=)([^>]*?)>/g, '<img loading="lazy" decoding="async"$1>')
      // Promote first image to eager + LCP priority
      .replace(/(<img loading="lazy")/, '<img loading="eager" fetchpriority="high"')
  }

  // ── 4. External link safety ───────────────────────────────────────────────────
  // Adds rel="noopener noreferrer" to all target="_blank" links (security + SEO).
  function sanitizeLinks(html) {
    return html.replace(/<a([^>]*)\btarget="_blank"([^>]*)>/g, (match, before, after) => {
      // Skip if rel already present
      if (before.includes('rel=') || after.includes('rel=')) return match
      return `<a${before}target="_blank" rel="noopener noreferrer"${after}>`
    })
  }

  // ── 5. Semantic section IDs ───────────────────────────────────────────────────
  // Consumes data-pc-type="hero" markers injected by genHTML, converts to
  // id="hero" + aria-label="Hero section" for anchor navigation and a11y.
  function addSectionIds(html) {
    const seen = new Map()   // type → count, for deduplication
    return html.replace(
      /(<(?:section|header|footer|nav)[^>]*?)\s+data-pc-type="([^"]+)"([^>]*>)/g,
      (_, open, type, rest) => {
        const n = (seen.get(type) || 0) + 1
        seen.set(type, n)
        const id    = n === 1 ? type : `${type}-${n}`
        const label = type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
        // Only inject id if not already present
        if (open.includes('id=')) return `${open}${rest}`
        return `${open} id="${id}" aria-label="${label} section"${rest}`
      }
    )
  }

  // ── 6. Accessibility pass ─────────────────────────────────────────────────────
  function addA11y(html) {
    return html
      // role="img" on divs using background-image (decorative)
      .replace(/(<div[^>]*style="[^"]*background(?:-image)?:[^"]*url\([^)]*\)[^"]*"[^>]*)(>)/g,
        (m, open, close) => open.includes('aria-') ? m : `${open} role="img"${close}`)
      // aria-hidden on empty buttons
      .replace(/<button([^>]*)>\s*<\/button>/g, '<button$1 aria-hidden="true"></button>')
  }

  // ── 7. HTML minifier ─────────────────────────────────────────────────────────
  // Safer than a naive >\s+< collapse: preserves inline text whitespace.
  function minifyHTML(html) {
    return html
      // Strip HTML comments (keep IE conditionals + SSI markers)
      .replace(/<!--(?!\[if)(?!@)[\s\S]*?-->/g, '')
      // Collapse horizontal whitespace runs to single space
      .replace(/[ \t]{2,}/g, ' ')
      // Remove blank lines
      .replace(/\n\s*\n/g, '\n')
      // Collapse tag-to-tag newlines (safe — no text between > and <)
      .replace(/>\s*\n\s*</g, '><')
      // Strip leading indent
      .replace(/^\s+/gm, '')
      .trim()
  }

  // ── 8. Semantic wrapper ───────────────────────────────────────────────────────
  function semanticWrap(sectionsHTML, title) {
    return `<main id="content" aria-label="${title || 'Page content'}">\n${sectionsHTML}\n</main>`
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  // Full pipeline: strip → sectionIds → extractCSS → images → links → a11y → semantic → [minify]
  function process(bodyHTML, opts = {}) {
    let html = deepStrip(bodyHTML)

    // Semantic section IDs (consumes data-pc-type markers)
    html = addSectionIds(html)

    // CSS extraction — promotes repeated inline styles to utility classes
    const { html: dedupedHTML, cssBlock } = extractCSS(html)
    html = dedupedHTML

    // Image optimization
    html = optimizeImages(html)

    // External link safety
    html = sanitizeLinks(html)

    // Accessibility
    html = addA11y(html)

    // Semantic <main> wrapper
    if (opts.semantic !== false) {
      html = semanticWrap(html, opts.title)
    }

    // Attribution badge (viral loop — skip on preview / white-label)
    if (!opts.preview && !opts.noAttribution) {
      html += `\n<!-- Built with PageCraft https://pagecraft.io -->\n` +
        `<a href="https://pagecraft.io" target="_blank" rel="noopener noreferrer" ` +
        `style="position:fixed;bottom:14px;left:14px;z-index:9999;background:#0f172a;` +
        `color:#a78bfa;font-size:11px;font-weight:700;padding:5px 10px;border-radius:20px;` +
        `text-decoration:none;border:1px solid rgba(108,99,255,.35);font-family:system-ui,sans-serif;` +
        `opacity:.85;transition:opacity .15s" onmouseover="this.style.opacity=1" ` +
        `onmouseout="this.style.opacity=.85">⚡ PageCraft</a>`
    }

    // Minify last (all transformations done)
    if (opts.minify) {
      html = minifyHTML(html)
    }

    return { html, extractedCSS: cssBlock }
  }

  // Strip only (fast path for preview — skip extraction/optimization)
  function stripOnly(html) {
    return deepStrip(html)
  }

  return { process, stripOnly, deepStrip, extractCSS, optimizeImages, sanitizeLinks, addSectionIds, minifyHTML }
})()
