'use strict'
/**
 * PageCraft -- All Extraction Phases (2, 3, 4, 5, 6)
 * Runs once on the original 28k-line builder.html.
 */

const fs   = require('fs')
const path = require('path')
const SRC  = path.join(__dirname, 'builder.html')

const raw   = fs.readFileSync(SRC, 'utf8')
const lines = raw.split('\n')
console.log('Original: ' + lines.length + ' lines')

// ── Helpers ───────────────────────────────────────────────────────────────────
function find(search, from) {
  from = from || 1
  for (let i = from - 1; i < lines.length; i++) {
    if (lines[i].includes(search)) return i + 1
  }
  throw new Error('Not found: "' + search + '" from line ' + from)
}
function get(from, to) { return lines.slice(from - 1, to).join('\n') }

function save(relPath, content) {
  const fp = path.join(__dirname, relPath)
  fs.mkdirSync(path.dirname(fp), { recursive: true })
  fs.writeFileSync(fp, content, 'utf8')
  console.log('  ' + relPath + ' (' + content.split('\n').length + 'L)')
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 -- CSS
// ─────────────────────────────────────────────────────────────────────────────
const cssOpen  = find('<style>')
const cssClose = find('</style>', cssOpen + 1)
const cssLines = lines.slice(cssOpen, cssClose - 1)   // 0-based content lines

function cL(origLine) { return origLine - (cssOpen + 1) }  // orig -> cssLines idx

const cssSplits = [
  { f:'styles/vars.css',     from:0,          label:'Design tokens, utilities, RTL' },
  { f:'styles/topbar.css',   from:cL(425),    label:'App shell + topbar menu' },
  { f:'styles/sidebar.css',  from:cL(503),    label:'Sidebar' },
  { f:'styles/canvas.css',   from:cL(602),    label:'Canvas + drag ghost' },
  { f:'styles/panel.css',    from:cL(729),    label:'Right panel + bottom bar + prop fields' },
  { f:'styles/modals.css',   from:cL(809),    label:'Image modal + toast' },
  { f:'styles/blocks.css',   from:cL(840),    label:'Responsive + animations + export + importer' },
  { f:'styles/features.css', from:cL(1246),   label:'Feature modals' },
  { f:'styles/systems.css',  from:cL(2796),   label:'Systems' },
]

console.log('\nPhase 2: CSS')
const cssLinks = ['  <!-- Phase 2: Extracted CSS -->']
cssSplits.forEach((s, i) => {
  const start = s.from
  const end   = i + 1 < cssSplits.length ? cssSplits[i + 1].from : cssLines.length
  const body  = cssLines.slice(start, end).join('\n')
  save(s.f, '/* ' + s.f + ' -- ' + s.label + ' */\n\n' + body)
  cssLinks.push('  <link rel="stylesheet" href="' + s.f + '">')
})

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 -- HTML
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nPhase 3: HTML')

function findClosing(tag, startLine) {
  const open  = new RegExp('<' + tag + '[\\s>]', 'g')
  const close = new RegExp('</' + tag + '>', 'g')
  let depth = 0
  for (let i = startLine - 1; i < lines.length; i++) {
    const l = lines[i]
    depth += (l.match(open) || []).length - (l.match(close) || []).length
    if (i >= startLine - 1 && depth === 0) return i + 1
  }
  throw new Error('No closing </' + tag + '> from line ' + startLine)
}

const bodyLine    = find('<body>', cssClose)
const pwaOff      = find('<!-- PWA: Offline indicator -->', bodyLine)
const cmsStart    = find('<!-- CMS OVERLAY -->', bodyLine)
const authStart   = find('<!-- AUTH GATE', bodyLine)
const appStart    = find('<div class="app">', bodyLine)
const topbarCmt   = find('<!-- TOPBAR -->', appStart)
const hdrStart    = find('<header class="topbar"', topbarCmt)
const hdrEnd      = findClosing('header', hdrStart)
const bpStart     = find('<div class="build-progress"', hdrEnd)
const bpEnd       = findClosing('div', bpStart)
const wsStart     = find('<div class="workspace">', bpEnd)
const sbStart     = find('<aside class="sidebar">', wsStart)
const sbEnd       = findClosing('aside', sbStart)
const canvasCmt   = find('<!-- CANVAS -->', sbEnd)
const cvStart     = find('class="canvas-wrap"', canvasCmt)
const cvTag       = lines[cvStart - 1].match(/<(\w+)\s/)[1]
const cvEnd       = findClosing(cvTag, cvStart)
const panelCmt    = find('<!-- RIGHT PANEL -->', cvEnd)
const pnlStart    = find('class="panel"', panelCmt)
const pnlTag      = lines[pnlStart - 1].match(/<(\w+)\s/)[1]
const pnlEnd      = findClosing(pnlTag, pnlStart)
const bbCmt       = find('<!-- ── Bottom Status Bar', pnlEnd)
const bbStart     = find('<div class="bottom-bar"', bbCmt)
const bbEnd       = findClosing('div', bbStart)
const appClose    = find('</div>', bbEnd)
const ghostLine   = find('<!-- Custom drag ghost element', appClose)
const scriptTag   = find('<script>', ghostLine)
const modalBotEnd = scriptTag - 2

function uiHdr(file) {
  return '<!-- ' + file + ' Phase 3 -->\n'
}
save('ui/cms.html',        uiHdr('cms.html')        + get(cmsStart,  authStart - 2).trim() + '\n')
save('ui/auth.html',       uiHdr('auth.html')        + get(authStart, appStart   - 2).trim() + '\n')
save('ui/topbar.html',     uiHdr('topbar.html')      + get(hdrStart,  hdrEnd).trim()         + '\n')
save('ui/sidebar.html',    uiHdr('sidebar.html')     + get(sbStart,   sbEnd).trim()           + '\n')
save('ui/canvas.html',     uiHdr('canvas.html')      + get(cvStart,   cvEnd).trim()           + '\n')
save('ui/panel.html',      uiHdr('panel.html')       + get(pnlStart,  pnlEnd).trim()          + '\n')
save('ui/bottom-bar.html', uiHdr('bottom-bar.html')  + get(bbStart,   bbEnd).trim()           + '\n')
save('ui/modals.html',
  uiHdr('modals.html') +
  get(pwaOff, cmsStart - 2).trim() + '\n\n' +
  get(ghostLine, modalBotEnd).trim() + '\n')

const bpContent = get(bpStart, bpEnd)

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4+5 -- Core scripts + Defs
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nPhase 4+5: Core scripts + Defs')

const jsStart      = scriptTag + 1

const autoSave     = find('AUTO-SAVE MIDDLEWARE', jsStart)
const pluginSDK    = find('PLUGIN SDK', autoSave)
const designSys    = find('DESIGN SYSTEM', pluginSDK)
const i18nSys      = find('INTERNATIONALIZATION', designSys)
const defsSys      = find('SECTION DEFS & RENDERERS', i18nSys)
const securitySys  = find('SECURITY MIDDLEWARE', defsSys)
const renderers    = find('const R={', securitySys)
const sectionCRUD  = find('SECTION CRUD', renderers)

function jsFix(content) {
  // Restore comment blocks that were eaten by the extraction -- add /* back
  // Only needed if the very first non-whitespace chars after our header look like raw text
  return content
}

function saveJS(relPath, content) {
  const fp = path.join(__dirname, relPath)
  fs.mkdirSync(path.dirname(fp), { recursive: true })
  const hdr = '/* ' + path.basename(relPath) + ' Phase 4/5 */\n\n'
  fs.writeFileSync(fp, hdr + content.trim() + '\n', 'utf8')
  console.log('  ' + relPath + ' (' + content.split('\n').length + 'L)')
}

saveJS('scripts/core/store.js',            get(jsStart, autoSave - 1))
saveJS('scripts/core/autosave.js',         get(autoSave, pluginSDK - 1))
saveJS('scripts/systems/plugins.js',       get(pluginSDK, designSys - 1))
saveJS('scripts/systems/design-system.js', get(designSys, i18nSys - 1))
saveJS('scripts/systems/i18n.js',          get(i18nSys, defsSys - 1))
saveJS('scripts/defs/defs.js',             get(defsSys, securitySys - 1))
saveJS('scripts/core/security.js',         get(securitySys, renderers - 1))
saveJS('scripts/defs/renderers.js',        get(renderers, sectionCRUD - 1))

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 6 -- UI Scripts
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nPhase 6: UI Scripts')

// Boundaries (all after sectionCRUD)
const dndSys       = find('DND SYSTEM', sectionCRUD)
const multiPage    = find('MULTI-PAGE SYSTEM', dndSys)
const seoMgr       = find('SEO MANAGER', multiPage)     // First feature -- STOP here
const renderPipe   = find('RENDER PIPELINE', seoMgr)
const renderCvFn   = find('function renderCanvas', renderPipe)
const patchFn      = find('function patchSection', renderCvFn)
const renderLayers = find('function renderLayers', patchFn)
const renderPanel  = find('function renderPanel', renderLayers)
const exportSys    = find('EXPORT SYSTEM', renderPanel)  // Feature -- STOP here

// canvas.js: SECTION CRUD + DND + renderCanvas+patch+bindInline+layers
function saveUI(relPath, content) {
  const fp = path.join(__dirname, relPath)
  fs.mkdirSync(path.dirname(fp), { recursive: true })
  const hdr = '/* ' + path.basename(relPath) + ' Phase 6 */\n\n'
  fs.writeFileSync(fp, hdr + content.trim() + '\n', 'utf8')
  console.log('  ' + relPath + ' (' + content.split('\n').length + 'L)')
}

saveUI('scripts/ui/canvas.js', [
  get(sectionCRUD, dndSys - 1),
  get(dndSys, multiPage - 1),
  get(renderCvFn, renderPanel - 1),
].join('\n\n'))

// sidebar-pages.js: multi-page system
saveUI('scripts/ui/sidebar-pages.js', get(multiPage, seoMgr - 1))

// sidebar-render.js: accordion + renderBlocks + search + keyboard nav
saveUI('scripts/ui/sidebar-render.js', get(renderPipe, renderCvFn - 1))

// panel.js: renderPanel -> clearAll + image modal + live + setDevice/Mode + switchPTab + renderLayoutPanel
saveUI('scripts/ui/panel.js', get(renderPanel, exportSys - 1))

// stub files
saveUI('scripts/ui/topbar.js',     '// tbToggle, tbClose, BottomBar -- in store.js\n')
saveUI('scripts/ui/bottom-bar.js', '// BottomBar, bbZoom -- in store.js\n')

// ─────────────────────────────────────────────────────────────────────────────
// ASSEMBLE new builder.html
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nAssembling builder.html...')

const headLines  = lines.slice(0, cssOpen - 1)   // before <style>
const afterLines = lines.slice(exportSys - 1)     // from EXPORT SYSTEM onward (features stay)

const newParts = [
  headLines.join('\n'),
  cssLinks.join('\n'),
  '<body>',
  '<!-- @include ui/modals.html -->',
  '',
  '<!-- @include ui/cms.html -->',
  '',
  '<!-- @include ui/auth.html -->',
  '',
  '<div class="app">',
  '',
  '<!-- @include ui/topbar.html -->',
  '',
  bpContent,
  '',
  '<div class="workspace">',
  '',
  '<!-- @include ui/sidebar.html -->',
  '',
  '<!-- @include ui/canvas.html -->',
  '',
  '<!-- @include ui/panel.html -->',
  '',
  '</div>',
  '',
  '<!-- @include ui/bottom-bar.html -->',
  '',
  '</div>',
  '',
  '<script>',
  '/* @include scripts/core/store.js */',
  '/* @include scripts/core/autosave.js */',
  '/* @include scripts/systems/plugins.js */',
  '/* @include scripts/systems/design-system.js */',
  '/* @include scripts/systems/i18n.js */',
  '/* @include scripts/defs/defs.js */',
  '/* @include scripts/core/security.js */',
  '/* @include scripts/defs/renderers.js */',
  '/* @include scripts/ui/canvas.js */',
  '/* @include scripts/ui/sidebar-pages.js */',
  '/* @include scripts/ui/sidebar-render.js */',
  '/* @include scripts/ui/panel.js */',
  '',
  afterLines.join('\n'),
]

const newContent = newParts.join('\n')
fs.writeFileSync(SRC, newContent, 'utf8')
const newLineCount = newContent.split('\n').length
console.log('builder.html: ' + lines.length + ' --> ' + newLineCount + ' lines')
console.log('Saved: ' + (lines.length - newLineCount) + ' lines from main file')
