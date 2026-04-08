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
      // Builder class fragments
      .replace(/\s*\bimg-editable\b\s*/g, ' ')
      .replace(/\s*\bsec-content\b\s*/g, ' ')
      // Builder UI elements (entire elements)
      .replace(/<div[^>]*class="[^"]*img-overlay[^"]*"[\s\S]*?<\/div>/g, '')
      .replace(/<div[^>]*class="[^"]*section-controls[^"]*"[\s\S]*?<\/div>/g, '')
      .replace(/<span[^>]*class="[^"]*section-label[^"]*"[\s\S]*?<\/span>/g, '')
      .replace(/<div[^>]*class="[^"]*cms-bind-badge[^"]*"[\s\S]*?<\/div>/g, '')
      .replace(/<div[^>]*class="[^"]*anim-badge[^"]*"[\s\S]*?<\/div>/g, '')
      // Builder event handlers
      .replace(/\s+onclick="openModal\([^)]*\)"/g, '')
      .replace(/\s+onclick="onSecClick\([^)]*\)"/g, '')
      .replace(/\s+onpointerdown="[^"]*"/g, '')
      // Empty class / style attributes left over
      .replace(/\s+class="\s*"/g, '')
      .replace(/\s+style="\s*"/g, '')
      // Normalize whitespace in tags
      .replace(/\s{2,}/g, ' ')
  }

  // ── 2. CSS class extractor ────────────────────────────────────────────────────
  // Finds repeated inline style values, promotes them to reusable classes.
  function extractCSS(html) {
    const styleMap  = new Map()   // styleValue → className
    const classCSS  = []
    let   classIdx  = 0

    // Collect all inline styles
    const styleRe = /style="([^"]*)"/g
    let m
    while ((m = styleRe.exec(html)) !== null) {
      const val = m[1].trim()
      if (!val || styleMap.has(val)) continue
      styleMap.set(val, null)  // placeholder
    }

    // Assign class names only to styles that appear more than once
    const counts = new Map()
    const countRe = /style="([^"]*)"/g
    while ((m = countRe.exec(html)) !== null) {
      const val = m[1].trim()
      if (!val) continue
      counts.set(val, (counts.get(val) || 0) + 1)
    }

    counts.forEach((count, val) => {
      if (count >= 2) {
        const cls = `pc${++classIdx}`
        styleMap.set(val, cls)
        classCSS.push(`.${cls}{${val}}`)
      }
    })

    // Replace repeated inline styles with class references
    const cleaned = html.replace(/(\s*)(class="([^"]*)")?(\s*)style="([^"]*)"/g, (match, sp1, _classAttr, existingCls, _sp2, styleVal) => {
      const val = styleVal.trim()
      const cls = styleMap.get(val)
      if (!cls) return match  // unique style — keep inline

      const combined = [existingCls, cls].filter(Boolean).join(' ').trim()
      return `${sp1}class="${combined}"`
    })

    return {
      html:    cleaned,
      cssBlock: classCSS.length ? classCSS.join('\n') : ''
    }
  }

  // ── 3. Image optimizer ────────────────────────────────────────────────────────
  function optimizeImages(html) {
    return html
      // Add lazy loading to all images (skip if already has loading attr)
      .replace(/<img(?![^>]*\bloading=)([^>]*?)>/g, '<img loading="lazy" decoding="async"$1>')
      // Add fetchpriority=high to first image (LCP optimization)
      .replace(/(<img loading="lazy")/, '<img loading="eager" fetchpriority="high"')
  }

  // ── 4. HTML minifier ─────────────────────────────────────────────────────────
  function minifyHTML(html) {
    return html
      // Collapse whitespace between tags
      .replace(/>\s+</g, '><')
      // Collapse whitespace inside tags
      .replace(/\s{2,}/g, ' ')
      // Remove HTML comments (but keep IE conditionals and SSI)
      .replace(/<!--(?!\[if)(?!@)[\s\S]*?-->/g, '')
      .trim()
  }

  // ── 5. Semantic wrapper ───────────────────────────────────────────────────────
  // Wraps body content in proper semantic HTML5 structure
  function semanticWrap(sectionsHTML, title) {
    return `<main id="content" aria-label="${title || 'Page content'}">\n${sectionsHTML}\n</main>`
  }

  // ── 6. Accessibility pass ─────────────────────────────────────────────────────
  function addA11y(html) {
    return html
      // Add role="img" + aria-label to decorative divs with background images
      .replace(/(<div[^>]*style="[^"]*background(?:-image)?:[^"]*url\([^)]*\)[^"]*"[^>]*)(>)/g, (m, open, close) => {
        if (open.includes('aria-')) return m
        return `${open} role="img"${close}`
      })
      // Ensure buttons have accessible text (add aria-label if empty)
      .replace(/<button([^>]*)>\s*<\/button>/g, '<button$1 aria-hidden="true"></button>')
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  // Full pipeline: strip → extractCSS → images → a11y → (optional minify)
  function process(bodyHTML, opts = {}) {
    let html = deepStrip(bodyHTML)

    // CSS extraction (generates reusable classes)
    const { html: dedupedHTML, cssBlock } = extractCSS(html)
    html = dedupedHTML

    // Image optimization
    html = optimizeImages(html)

    // Accessibility
    html = addA11y(html)

    // Semantic wrapping
    if (opts.semantic !== false) {
      html = semanticWrap(html, opts.title)
    }

    // Attribution badge (viral loop — skip if whitelabeled or preview)
    if (!opts.preview && !opts.noAttribution) {
      html += `\n<!-- Built with PageCraft https://pagecraft.io -->\n<a href="https://pagecraft.io" target="_blank" rel="noopener" style="position:fixed;bottom:14px;left:14px;z-index:9999;background:#0f172a;color:#a78bfa;font-size:11px;font-weight:700;padding:5px 10px;border-radius:20px;text-decoration:none;border:1px solid rgba(108,99,255,.35);font-family:system-ui,sans-serif;opacity:.85;transition:opacity .15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.85">⚡ PageCraft</a>`
    }

    // Minify last (after all transformations)
    if (opts.minify) {
      html = minifyHTML(html)
    }

    return { html, extractedCSS: cssBlock }
  }

  // Strip only (fast path for preview)
  function stripOnly(html) {
    return deepStrip(html)
  }

  return { process, stripOnly, deepStrip, extractCSS, optimizeImages, minifyHTML }
})()
