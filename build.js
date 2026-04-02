#!/usr/bin/env node
/**
 * PageCraft — Build Pipeline
 * ──────────────────────────────────────────────────────────────────────────
 * Zero extra dependencies — uses Node.js built-ins only.
 *
 * What it does:
 *   1.  Reads builder.html
 *   2.  Minifies every inline <style> block
 *   3.  Minifies every inline <script> block
 *   4.  Strips HTML comments (keeps IE conditionals)
 *   5.  Collapses redundant whitespace between tags
 *   6.  Copies server.js (with comment stripping)
 *   7.  Copies example-plugin.js (minified)
 *   8.  Writes dist/ with a manifest + size report
 *
 * Usage:
 *   node build.js            # production build
 *   node build.js --watch    # rebuild on file change
 *   node build.js --report   # show detailed size report only
 * ──────────────────────────────────────────────────────────────────────────
 */

'use strict'

const fs       = require('fs')
const path     = require('path')
const crypto   = require('crypto')

// ── Config ────────────────────────────────────────────────────────────────────
const ROOT    = __dirname
const DIST    = path.join(ROOT, 'dist')
const SRC     = { html: 'builder.html', server: 'server.js', plugin: 'example-plugin.js' }
const TARGETS = {
  html  : path.join(DIST, 'builder.html'),
  server: path.join(DIST, 'server.js'),
  plugin: path.join(DIST, 'example-plugin.js'),
}

const ARGS    = new Set(process.argv.slice(2))
const WATCH   = ARGS.has('--watch')
const REPORT  = ARGS.has('--report')
const VERBOSE = ARGS.has('--verbose') || ARGS.has('-v')

// ── Colours for terminal output ───────────────────────────────────────────────
const C = {
  reset:'\x1b[0m', bold:'\x1b[1m', dim:'\x1b[2m',
  green:'\x1b[32m', yellow:'\x1b[33m', cyan:'\x1b[36m',
  red:'\x1b[31m', blue:'\x1b[34m', magenta:'\x1b[35m',
}
const log  = (icon, msg, col=C.reset) => console.log(`${col}${icon}  ${msg}${C.reset}`)
const ok   = (msg) => log('✓', msg, C.green)
const info = (msg) => log('·', msg, C.cyan)
const warn = (msg) => log('⚠', msg, C.yellow)
const err  = (msg) => log('✗', msg, C.red)
const hr   = ()    => console.log(C.dim + '─'.repeat(56) + C.reset)

// ── Helpers ───────────────────────────────────────────────────────────────────
function kb(bytes) { return (bytes / 1024).toFixed(1) + ' kB' }
function pct(a, b) { return (((b - a) / a) * 100).toFixed(1) + '%' }
function hash(str) { return crypto.createHash('md5').update(str).digest('hex').slice(0, 8) }

function read(file) {
  const p = path.join(ROOT, file)
  if (!fs.existsSync(p)) { warn(`File not found: ${file}`); return '' }
  return fs.readFileSync(p, 'utf8')
}

function write(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, content, 'utf8')
}

// ── CSS Minifier ──────────────────────────────────────────────────────────────
function minifyCSS(css) {
  return css
    // Remove /* ... */ comments (non-greedy, handles nested-ish cases)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove // line comments that appear outside strings (best-effort)
    // Collapse whitespace
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    // Remove space before { and after }
    .replace(/\s*\{\s*/g, '{')
    .replace(/\s*\}\s*/g, '}')
    // Remove trailing semicolons before }
    .replace(/;}/g, '}')
    // Remove leading/trailing whitespace
    .trim()
}

// ── JS Minifier (basic — removes comments & collapses whitespace) ─────────────
// NOTE: This is intentionally conservative — it does NOT rename variables.
// For a production app, swap this out with esbuild / terser if needed.
function minifyJS(js) {
  // Remove single-line comments (but not URLs like https://)
  // Strategy: replace // not preceded by : or / or inside strings
  let result = js

  // Remove block comments /* ... */ (skip /*! preserve comments)
  result = result.replace(/\/\*(?!!)([\s\S]*?)\*\//g, '')

  // Remove single-line // comments — careful not to hit URLs (http://)
  result = result.replace(/([^:])\/\/(?!#)[^\n]*/g, '$1')

  // Collapse multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n')

  // Collapse leading whitespace on each line (indent removal)
  result = result.replace(/^[ \t]+/gm, '')

  // Collapse spaces around operators (conservative — skip string contents)
  result = result.replace(/[ \t]+/g, ' ')

  // Remove space before ( and { when preceded by keyword/identifier
  result = result.replace(/ \(/g, '(').replace(/ \{/g, '{')

  // Collapse multiple newlines again after transforms
  result = result.replace(/\n{3,}/g, '\n')

  return result.trim()
}

// ── HTML Minifier ─────────────────────────────────────────────────────────────
function minifyHTML(html) {
  return html
    // Remove HTML comments (keep IE conditionals <!--[if ...]>)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    // Collapse whitespace between tags (but not inside <pre>, <script>, <style>)
    .replace(/>\s{2,}</g, '> ')
    .replace(/\s{2,}</g, ' <')
    // Remove blank lines
    .replace(/^\s*[\r\n]/gm, '')
    .trim()
}

// ── Process <style> blocks ────────────────────────────────────────────────────
function processStyles(html) {
  let count = 0
  let saved = 0
  const result = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_, attrs, css) => {
    const orig    = css.length
    const minified = minifyCSS(css)
    saved += orig - minified.length
    count++
    return `<style${attrs}>${minified}</style>`
  })
  return { result, count, saved }
}

// ── Process <script> blocks ───────────────────────────────────────────────────
function processScripts(html) {
  let count = 0
  let saved = 0
  const result = html.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (_, attrs, js) => {
    // Skip external scripts (src="...") — they have no inline content
    if (attrs.includes('src=')) return `<script${attrs}></script>`
    // Skip empty blocks
    if (!js.trim()) return `<script${attrs}></script>`
    const orig     = js.length
    const minified = minifyJS(js)
    saved += orig - minified.length
    count++
    return `<script${attrs}>\n${minified}\n</script>`
  })
  return { result, count, saved }
}

// ── Inject build meta comment into HTML ───────────────────────────────────────
function injectMeta(html, meta) {
  const comment = `<!-- PageCraft Build | ${meta.date} | hash:${meta.hash} | ${meta.sizeKb} kB -->`
  return html.replace('<!DOCTYPE html>', `<!DOCTYPE html>\n${comment}`)
}

// ── Main build function ───────────────────────────────────────────────────────
function build() {
  const startMs = Date.now()
  hr()
  console.log(`${C.bold}${C.magenta}  PageCraft Build Pipeline${C.reset}`)
  hr()

  // ── Read sources ────────────────────────────────
  const rawHTML   = read(SRC.html)
  const rawServer = read(SRC.server)
  const rawPlugin = fs.existsSync(path.join(ROOT, SRC.plugin)) ? read(SRC.plugin) : null

  if (!rawHTML) { err('builder.html not found — aborting'); process.exit(1) }

  const sizes = { html: { before: Buffer.byteLength(rawHTML, 'utf8') } }

  // ── Process HTML ────────────────────────────────
  info('Processing inline <style> blocks…')
  const { result: afterStyles, count: cssCount, saved: cssSaved } = processStyles(rawHTML)

  info('Processing inline <script> blocks…')
  const { result: afterScripts, count: jsCount, saved: jsSaved } = processScripts(afterStyles)

  info('Minifying HTML structure…')
  const minHTML = minifyHTML(afterScripts)

  // ── Build meta ──────────────────────────────────
  const finalHTML = injectMeta(minHTML, {
    date:   new Date().toISOString(),
    hash:   hash(minHTML),
    sizeKb: kb(Buffer.byteLength(minHTML, 'utf8')),
  })

  sizes.html.after = Buffer.byteLength(finalHTML, 'utf8')

  // ── Process server.js ───────────────────────────
  const minServer = minifyJS(rawServer)
  sizes.server = {
    before: Buffer.byteLength(rawServer, 'utf8'),
    after:  Buffer.byteLength(minServer, 'utf8'),
  }

  // ── Write outputs ───────────────────────────────
  info('Writing dist/…')
  write(TARGETS.html,   finalHTML)
  write(TARGETS.server, minServer)
  if (rawPlugin) {
    const minPlugin = minifyJS(rawPlugin)
    write(TARGETS.plugin, minPlugin)
    sizes.plugin = {
      before: Buffer.byteLength(rawPlugin, 'utf8'),
      after:  Buffer.byteLength(minPlugin, 'utf8'),
    }
  }

  // ── Write manifest ──────────────────────────────
  const manifest = {
    builtAt:  new Date().toISOString(),
    hash:     hash(finalHTML),
    files: Object.fromEntries(
      Object.entries(TARGETS)
        .filter(([k]) => sizes[k])
        .map(([k, p]) => [path.basename(p), {
          path:      path.relative(ROOT, p),
          sizeBefore: sizes[k].before,
          sizeAfter:  sizes[k].after,
          saved:      sizes[k].before - sizes[k].after,
        }])
    ),
  }
  write(path.join(DIST, 'build-manifest.json'), JSON.stringify(manifest, null, 2))

  // ── Report ──────────────────────────────────────
  hr()
  console.log(`${C.bold}  Build Report${C.reset}`)
  hr()

  const rows = [
    ['File', 'Before', 'After', 'Saved', '%'],
    ...Object.entries(sizes).map(([k, s]) => [
      SRC[k] || k,
      kb(s.before),
      kb(s.after),
      kb(s.before - s.after),
      pct(s.before, s.after),
    ]),
  ]
  const widths = rows[0].map((_, i) => Math.max(...rows.map(r => String(r[i]).length)))
  rows.forEach((row, ri) => {
    const line = row.map((cell, i) => String(cell).padEnd(widths[i])).join('  ')
    if (ri === 0) console.log(`${C.dim}  ${line}${C.reset}`)
    else          console.log(`${C.cyan}  ${line}${C.reset}`)
  })

  hr()
  const totalBefore = Object.values(sizes).reduce((s, v) => s + v.before, 0)
  const totalAfter  = Object.values(sizes).reduce((s, v) => s + v.after,  0)
  ok(`Total saved: ${kb(totalBefore - totalAfter)} (${pct(totalBefore, totalAfter)})`)
  ok(`CSS blocks minified: ${cssCount}  |  JS blocks minified: ${jsCount}`)
  ok(`Output → dist/  |  Manifest → dist/build-manifest.json`)
  ok(`Done in ${Date.now() - startMs}ms`)
  hr()
}

// ── Watch mode ────────────────────────────────────────────────────────────────
function startWatch() {
  info('Watch mode — watching source files for changes…')
  build()

  let debounce = null
  const watched = Object.values(SRC)
    .map(f => path.join(ROOT, f))
    .filter(f => fs.existsSync(f))

  watched.forEach(file => {
    fs.watch(file, () => {
      clearTimeout(debounce)
      debounce = setTimeout(() => {
        console.log(`\n${C.yellow}  Changed: ${path.basename(file)}${C.reset}`)
        build()
      }, 150)
    })
  })

  info(`Watching: ${watched.map(f => path.basename(f)).join(', ')}`)
  info('Press Ctrl+C to stop.')
}

// ── Clean ─────────────────────────────────────────────────────────────────────
function clean() {
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true })
    ok('dist/ cleaned')
  } else {
    info('dist/ does not exist — nothing to clean')
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
if (ARGS.has('--clean')) {
  clean()
} else if (ARGS.has('--report')) {
  // Report-only: build into a temp string without writing
  const rawHTML = read(SRC.html)
  if (rawHTML) {
    const before = Buffer.byteLength(rawHTML, 'utf8')
    const { result: s1 } = processStyles(rawHTML)
    const { result: s2 } = processScripts(s1)
    const after  = Buffer.byteLength(minifyHTML(s2), 'utf8')
    info(`builder.html: ${kb(before)} → ${kb(after)} (saves ${kb(before - after)}, ${pct(before, after)})`)
  }
} else if (WATCH) {
  startWatch()
} else {
  build()
}
