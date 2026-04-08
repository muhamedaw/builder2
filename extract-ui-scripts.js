'use strict'
/**
 * Phase 6 -- UI Scripts Extraction
 *
 * The builder.html currently has @include markers for core+defs (Phase 4/5).
 * After those, the main JS starts at line ~76 with SECTION CRUD.
 *
 * Current order in builder.html (after @includes):
 *   76-137   SECTION CRUD (addSection, removeSection, dupSection, moveSection...)
 *  138-421   DND SYSTEM
 *  422-617   MULTI-PAGE SYSTEM
 *  618-977   SEO MANAGER          <-- feature, NOT extracted here
 *  978-1222  AI CONTENT GENERATOR <-- feature, NOT extracted here
 * 1223-1589  E-COMMERCE           <-- feature, NOT extracted here
 * 1590-1742  RESPONSIVE SYSTEM    <-- feature, NOT extracted here
 * 1743-1950  GLOBAL STYLES        <-- feature, NOT extracted here
 * 1951-2187  FORM BUILDER         <-- feature, NOT extracted here
 * 2188-2191  RENDER PIPELINE (renderAll)
 * 2192-2345  Accordion categories + renderBlocks
 * 2346-2415  Section search (filterSections)
 * 2416-2448  Keyboard navigation
 * 2449-2618  renderCanvas + _runInlineScripts
 * 2619-2640  patchSection + bindInline
 * 2641-2656  renderLayers
 * 2657-3278  renderPanel, renderEditP, renderStyleP, renderLayoutPanel,
 *            switchPTab, onSecClick, scrollToSection, clearAll,
 *            Image Modal, Live Preview, setDevice, setMode, switchSTab
 * 3279-...   EXPORT SYSTEM (feature, NOT extracted here)
 *
 * STRATEGY: Use @include markers IN-PLACE -- the extracted chunks are
 * replaced with @include markers exactly where they sit in builder.html.
 * All feature code (SEO, AI, eCommerce, FormBuilder etc.) stays untouched.
 */

const fs   = require('fs')
const path = require('path')

const SRC = path.join(__dirname, 'builder.html')
const raw   = fs.readFileSync(SRC, 'utf8')
const lines = raw.split('\n')
console.log('Source: ' + lines.length + ' lines')

function findLine(search, from) {
  from = (from || 1)
  for (let i = from - 1; i < lines.length; i++) {
    if (lines[i].includes(search)) return i + 1
  }
  throw new Error('Not found: "' + search + '" (from line ' + from + ')')
}
function extract(from, to) {
  return lines.slice(from - 1, to).join('\n')
}
function writeScript(relPath, content) {
  const fullPath = path.join(__dirname, relPath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  const hdr = [
    '/* ======================================================',
    '   PageCraft Builder -- ' + path.basename(relPath),
    '   Phase 6: UI Scripts',
    '   Loaded via server-side @include -- single script scope',
    '====================================================== */',
    '',
    '',
  ].join('\n')
  fs.writeFileSync(fullPath, hdr + content.trim() + '\n', 'utf8')
  console.log('  ' + relPath + '  (' + content.split('\n').length + ' lines)')
}

// ── Locate boundaries ─────────────────────────────────────────────────────────
const crudStart      = findLine('SECTION CRUD')                    // 76
const dndStart       = findLine('DND SYSTEM', crudStart)           // 138
const multiStart     = findLine('MULTI-PAGE SYSTEM', dndStart)     // 422
const seoStart       = findLine('SEO MANAGER', multiStart)         // 618 (feature -- stop here)

const renderPipeLine  = findLine('RENDER PIPELINE', seoStart)      // 2188
const renderCanvasFn  = findLine('function renderCanvas', renderPipeLine)   // 2449
const patchFn         = findLine('function patchSection', renderCanvasFn)   // 2619
const renderLayersEnd = findLine('function renderPanel', patchFn) - 1       // 2657

const panelStart      = renderLayersEnd + 1                        // 2658
const exportStart     = findLine('EXPORT SYSTEM', panelStart)      // 3279 (feature -- stop)

console.log('')
console.log('-- Boundaries -------------------------------------------')
console.log('  canvas.js  block 1 (CRUD):   ' + crudStart + '-' + (dndStart - 1))
console.log('  canvas.js  block 2 (DND):    ' + dndStart + '-' + (multiStart - 1))
console.log('  sidebar.js (multi-page):     ' + multiStart + '-' + (seoStart - 1))
console.log('  [FEATURES untouched]:        ' + seoStart + '-' + (renderPipeLine - 1))
console.log('  sidebar.js (render+blocks):  ' + renderPipeLine + '-' + (renderCanvasFn - 1))
console.log('  canvas.js  (renderCanvas):   ' + renderCanvasFn + '-' + renderLayersEnd)
console.log('  panel.js   (panel+modal+..): ' + panelStart + '-' + (exportStart - 1))
console.log('  [EXPORT+rest untouched]:     ' + exportStart + '+')
console.log('')

// ── Build canvas.js (Section CRUD + DND + renderCanvas + patchSection + renderLayers) ──
const canvasContent = [
  extract(crudStart, dndStart - 1),
  extract(dndStart, multiStart - 1),
  extract(renderCanvasFn, renderLayersEnd),
].join('\n\n')

// ── Build sidebar.js (multi-page + accordion/renderBlocks/search/keyboard + switchSTab) ──
// Note: switchSTab is inside the panel block (lines 2658-3278 area) -- let's check
const switchSTabLine = findLine('function switchSTab', panelStart)
console.log('  switchSTab at: ' + switchSTabLine)

const sidebarContent = [
  extract(multiStart, seoStart - 1),
  extract(renderPipeLine, renderCanvasFn - 1),
].join('\n\n')

// ── Build panel.js (renderPanel...clearAll + image modal + live + device/mode/tabs) ──
const panelContent = extract(panelStart, exportStart - 1)

// ── Write files ───────────────────────────────────────────────────────────────
console.log('Writing files...')
writeScript('scripts/ui/canvas.js',      canvasContent)
writeScript('scripts/ui/sidebar.js',     sidebarContent)
writeScript('scripts/ui/panel.js',       panelContent)
writeScript('scripts/ui/topbar.js',
  '// Topbar menu: tbToggle, tbClose -- in scripts/core/store.js\n')
writeScript('scripts/ui/bottom-bar.js',
  '// BottomBar, bbZoom -- in scripts/core/store.js\n')

// ── Rewrite builder.html: replace each extracted block in-place ───────────────
// We replace only the extracted ranges with @include markers.
// Features (SEO, AI, eCommerce etc.) between multiEnd and renderPipeLine stay.

const part1 = lines.slice(0, crudStart - 1).join('\n')            // head (everything before CRUD)
const part2 = '/* @include scripts/ui/canvas.js -- CRUD + DND */'
const part3 = lines.slice(multiStart - 1, seoStart - 1).join('\n') // multi-page (goes to sidebar)
// Wait -- multi-page is also extracted, so replace it too:
// Let's build the new content segment-by-segment:

//  [head]
//  /* @include scripts/ui/canvas.js */ (replaces CRUD + DND: crudStart..multiStart-1)
//  /* @include scripts/ui/sidebar.js PART1 */ - NO, sidebar has two parts
//
// Simpler: inline multi-page into sidebar.js already done.
// Now in builder.html replace:
//   - lines crudStart..multiStart-1  --> @include canvas.js (part 1: CRUD+DND)
//   - lines multiStart..seoStart-1   --> @include sidebar.js (part 1: multi-page)
//   - lines seoStart..renderPipeLine-1 --> UNTOUCHED (features)
//   - lines renderPipeLine..renderCanvasFn-1 --> @include sidebar-render.js ... or inline in sidebar.js
//   - lines renderCanvasFn..renderLayersEnd --> already in canvas.js
//   - lines panelStart..exportStart-1 --> @include panel.js
//
// Since sidebar.js already merges both parts, we need TWO @include markers for sidebar
// (or combine -- but the features block sits between them in builder.html).
// Solution: keep sidebar in TWO @include files: sidebar-pages.js and sidebar-render.js
// OR: keep one sidebar.js and use two @include markers.

// We'll use two markers: sidebar.js contains both parts (already merged),
// but we place @include sidebar.js twice? No -- that would double the code.

// Better solution: split sidebar into two files:
//   sidebar-pages.js  = multi-page system (multiStart..seoStart-1)
//   sidebar-render.js = render pipeline + accordion + search + keyboard (renderPipeLine..renderCanvasFn-1)

const sidebarPagesContent = extract(multiStart, seoStart - 1)
const sidebarRenderContent = extract(renderPipeLine, renderCanvasFn - 1)

writeScript('scripts/ui/sidebar-pages.js',  sidebarPagesContent)
writeScript('scripts/ui/sidebar-render.js', sidebarRenderContent)

// Now rebuild builder.html properly
const newLines = [
  // Part A: everything before SECTION CRUD
  ...lines.slice(0, crudStart - 1),

  // Part B: canvas placeholder (replaces CRUD + DND)
  '/* @include scripts/ui/canvas.js */',
  '',

  // Part C: sidebar pages placeholder (replaces multi-page system)
  '/* @include scripts/ui/sidebar-pages.js */',
  '',

  // Part D: features untouched (SEO, AI, eCommerce, FormBuilder etc.)
  ...lines.slice(seoStart - 1, renderPipeLine - 1),

  // Part E: sidebar render placeholder (replaces accordion + renderCanvas prep)
  '/* @include scripts/ui/sidebar-render.js */',
  '',

  // Part F: panel placeholder (replaces renderPanel..clearAll)
  '/* @include scripts/ui/panel.js */',
  '',

  // Part G: everything from EXPORT SYSTEM onward (untouched)
  ...lines.slice(exportStart - 1),
]

fs.writeFileSync(SRC, newLines.join('\n'), 'utf8')
console.log('')
console.log('builder.html: ' + lines.length + ' --> ' + newLines.length + ' lines (saved ' + (lines.length - newLines.length) + ')')
