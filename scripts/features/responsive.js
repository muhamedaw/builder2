/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   RESPONSIVE DESIGN SYSTEM
   Breakpoint editor, per-section overrides,
   CSS generation, canvas preview ruler
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

// ── Responsive State ──────────────────────────────────────────────────────────
const RESP = {
  // Named breakpoints (px, max-width)
  breakpoints: [
    { id:'xl',  label:'Desktop XL', px:1280, color:'#34d399', icon:'🖥' },
    { id:'md',  label:'Tablet',     px:768,  color:'#fbbf24', icon:'📱' },
    { id:'sm',  label:'Mobile',     px:480,  color:'#f87171', icon:'📲' },
  ],

  // Global CSS overrides per breakpoint: { [bpId]: { prop: value } }
  global: {
    xl: {},
    md: {
      columns2:  '1-col',
      columns3:  '1-col',
      padding:   '48px 20px',
      fontSize:  'clamp(1.6rem,6vw,2.4rem)',
      heroHeight:'420px',
    },
    sm: {
      columns2:  '1-col',
      columns3:  '1-col',
      padding:   '36px 16px',
      fontSize:  'clamp(1.4rem,7vw,2rem)',
      heroHeight:'360px',
    },
  },

  // Per-section overrides: { [sectionId]: { [bpId]: { prop: value } } }
  sections: {},

  // Current custom preview width (null = device preset)
  customWidth: null,
}

// ── Breakpoint system helpers ─────────────────────────────────────────────────
function getBpColor(bpId) {
  return RESP.breakpoints.find(b => b.id === bpId)?.color || '#888'
}
function getBpPx(bpId) {
  return RESP.breakpoints.find(b => b.id === bpId)?.px || 768
}
function activeBpForWidth(w) {
  // Which breakpoint is active for current canvas width?
  const sorted = [...RESP.breakpoints].sort((a,b) => a.px - b.px)
  for (const bp of sorted) {
    if (w <= bp.px) return bp.id
  }
  return 'xl'
}

// ── Open / close ──────────────────────────────────────────────────────────────
function openResponsive() {
  if (typeof requirePro === 'function' && !isPro()) {
    requirePro('responsive', 'Responsive tools require the Pro plan'); return
  }
  // Close animation panel if open
  document.getElementById('anim-panel').classList.remove('open')
  document.getElementById('resp-panel').classList.add('open')
  renderRespPanel()
}
function closeResponsive() {
  document.getElementById('resp-panel').classList.remove('open')
}

// ── Sync active device button in responsive panel ─────────────────────────────
function respSyncActive() {
  document.querySelectorAll('.dp-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.d === S.device)
  )
  updateCanvasBadge()
  updateRuler()
}

// ── Canvas badge with breakpoint colour ───────────────────────────────────────
function updateCanvasBadge() {
  const badge = document.getElementById('canvas-badge')
  if (!badge) return
  const widths  = { desktop: 920, tablet: 768, mobile: 375 }
  const classes = { desktop:'bp-desktop', tablet:'bp-tablet', mobile:'bp-mobile' }
  const labels  = { desktop:'Desktop — 920px', tablet:'Tablet — 768px', mobile:'Mobile — 375px' }

  badge.className = 'canvas-badge ' + (classes[S.device] || 'bp-desktop')

  if (RESP.customWidth) {
    const bpId = activeBpForWidth(RESP.customWidth)
    const bpColors = { xl:'bp-desktop', md:'bp-tablet', sm:'bp-mobile' }
    badge.className = 'canvas-badge ' + (bpColors[bpId] || 'bp-desktop')
    badge.textContent = `Custom — ${RESP.customWidth}px`
  } else {
    badge.textContent = labels[S.device] || 'Desktop — 920px'
  }
}

// ── Ruler showing breakpoints against current canvas width ────────────────────
function updateRuler() {
  const pos = document.querySelector('.canvas-pos')
  if (!pos) return

  // Remove existing ruler
  pos.querySelector('.bp-ruler')?.remove()

  const maxW  = 920
  const ruler = document.createElement('div')
  ruler.className = 'bp-ruler'

  const track = document.createElement('div')
  track.className = 'bp-ruler-track'

  const currentW = RESP.customWidth || { desktop:920, tablet:768, mobile:375 }[S.device] || 920
  const fillPct  = Math.min(100, (currentW / maxW) * 100)

  const fill = document.createElement('div')
  fill.className = 'bp-ruler-fill'
  fill.style.width = fillPct + '%'
  track.appendChild(fill)

  // Tick marks at each breakpoint
  RESP.breakpoints.forEach(bp => {
    const pct  = Math.min(100, (bp.px / maxW) * 100)
    const tick = document.createElement('div')
    tick.className = 'bp-tick' + (currentW <= bp.px ? ' active' : '')
    tick.style.left = pct + '%'
    tick.innerHTML = `<span class="bp-tick-line"></span><span>${bp.label.split(' ')[0]} ${bp.px}px</span>`
    track.appendChild(tick)
  })

  ruler.appendChild(track)
  pos.insertBefore(ruler, pos.firstChild)
}

// ── Custom width preview ──────────────────────────────────────────────────────
function applyCustomWidth() {
  const val = parseInt(document.getElementById('custom-width-inp').value)
  if (!val || val < 280 || val > 2560) return toast('Width must be 280–2560px', '⚠️')

  RESP.customWidth = val
  const frame = document.getElementById('canvas-frame')
  frame.style.maxWidth = val + 'px'
  frame.style.margin = '0 auto'
  updateCanvasBadge()
  updateRuler()
  toast(`Preview at ${val}px`, '📐')
}

// ── Render responsive panel ───────────────────────────────────────────────────
function renderRespPanel() {
  renderRespBpList()
  renderRespGlobalOverrides()
  renderRespSectionsList()
  respSyncActive()
}

function renderRespBpList() {
  const el = document.getElementById('resp-bp-list')
  if (!el) return
  el.innerHTML = RESP.breakpoints.map(bp => `
    <div class="bp-item">
      <div class="bp-item-head">
        <div class="bp-item-dot" style="background:${bp.color}"></div>
        <div class="bp-item-name">${bp.icon} ${bp.label}</div>
        <div class="bp-item-px">≤ ${bp.px}px</div>
      </div>
      <div style="font-size:11px;color:var(--muted)">
        Triggers when viewport ≤ <strong style="color:${bp.color}">${bp.px}px</strong>
        — applies ${Object.keys(RESP.global[bp.id]||{}).length} global overrides
      </div>
    </div>`).join('')
}

// ── Global override controls ──────────────────────────────────────────────────
const GLOBAL_PROPS = [
  { id:'columns2',   label:'2-col grids',  options:[{v:'1-col',l:'Stack (1 col)'},{v:'2-col',l:'Keep 2 col'}] },
  { id:'columns3',   label:'3-col grids',  options:[{v:'1-col',l:'Stack (1 col)'},{v:'2-col',l:'2 cols'},{v:'3-col',l:'Keep 3 col'}] },
  { id:'padding',    label:'Section pad',  options:[{v:'80px 48px',l:'Default'},{v:'48px 20px',l:'Compact'},{v:'32px 16px',l:'Tight'},{v:'24px 12px',l:'Minimal'}] },
  { id:'fontSize',   label:'Heading size', options:[{v:'clamp(2rem,5vw,3.5rem)',l:'Default'},{v:'clamp(1.6rem,6vw,2.4rem)',l:'Medium'},{v:'clamp(1.4rem,7vw,2rem)',l:'Small'}] },
  { id:'heroHeight', label:'Hero height',  options:[{v:'520px',l:'Full (520px)'},{v:'420px',l:'Medium (420px)'},{v:'320px',l:'Compact (320px)'}] },
]

function renderRespGlobalOverrides() {
  const el = document.getElementById('resp-global-overrides')
  if (!el) return

  el.innerHTML = RESP.breakpoints.filter(bp => bp.id !== 'xl').map(bp => `
    <div class="bp-section-override">
      <div class="bp-so-head" onclick="toggleBpOverride('g_${bp.id}')">
        <div class="bp-so-dot" style="background:${bp.color}"></div>
        <div class="bp-so-name">${bp.icon} ${bp.label} (≤${bp.px}px)</div>
        <div class="bp-so-badge">${Object.keys(RESP.global[bp.id]||{}).length} rules</div>
      </div>
      <div class="bp-so-body" id="bpo_g_${bp.id}">
        <div class="bp-override-grid">
          ${GLOBAL_PROPS.map(prop => {
            const cur = RESP.global[bp.id]?.[prop.id] || prop.options[0].v
            return `<div class="bp-override-row">
              <label class="bp-override-label">${prop.label}</label>
              <select class="bp-override-sel"
                onchange="setGlobalOverride('${bp.id}','${prop.id}',this.value)">
                ${prop.options.map(o=>`<option value="${o.v}"${cur===o.v?' selected':''}>${o.l}</option>`).join('')}
              </select>
            </div>`
          }).join('')}
        </div>
      </div>
    </div>`).join('')
}

function toggleBpOverride(id) {
  const body = document.getElementById('bpo_' + id)
  if (body) body.classList.toggle('open')
}

function setGlobalOverride(bpId, prop, val) {
  if (!RESP.global[bpId]) RESP.global[bpId] = {}
  RESP.global[bpId][prop] = val
  renderRespGlobalOverrides()
}

// ── Per-section overrides ─────────────────────────────────────────────────────
const SECTION_RESP_PROPS = [
  { id:'display',   label:'Display',    options:[{v:'block',l:'Show'},{v:'none',l:'Hide'}] },
  { id:'textAlign', label:'Text align', options:[{v:'left',l:'Left'},{v:'center',l:'Center'},{v:'right',l:'Right'}] },
  { id:'padding',   label:'Padding',    options:[{v:'default',l:'Default'},{v:'32px 16px',l:'Compact'},{v:'16px 12px',l:'Minimal'}] },
  { id:'fontSize',  label:'Font size',  options:[{v:'default',l:'Default'},{v:'90%',l:'Smaller'},{v:'80%',l:'Small'}] },
]

function renderRespSectionsList() {
  const el = document.getElementById('resp-sections-list')
  if (!el) return

  if (!S.sections.length) {
    el.innerHTML = '<p style="font-size:12px;color:var(--muted);text-align:center;padding:20px 0">Add sections to configure per-section responsive rules</p>'
    return
  }

  el.innerHTML = S.sections.map(sec => {
    const def      = DEFS[sec.type]
    const overrides= RESP.sections[sec.id] || {}
    const count    = Object.values(overrides).reduce((a,v)=>a+Object.keys(v).length,0)
    return `
      <div class="bp-section-override">
        <div class="bp-so-head" onclick="toggleBpOverride('sec_${sec.id}')">
          <span style="font-size:13px">${def.icon}</span>
          <div class="bp-so-name">${def.label}</div>
          <div class="bp-so-badge${count?'':' empty'}">${count || 'Default'}</div>
        </div>
        <div class="bp-so-body" id="bpo_sec_${sec.id}">
          ${RESP.breakpoints.filter(b=>b.id!=='xl').map(bp => `
            <div style="margin-bottom:12px">
              <div style="font-size:10px;font-weight:700;color:${bp.color};margin-bottom:6px;letter-spacing:.05em;text-transform:uppercase">${bp.icon} ${bp.label}</div>
              <div class="bp-override-grid">
                ${SECTION_RESP_PROPS.map(prop => {
                  const cur = overrides[bp.id]?.[prop.id] || prop.options[0].v
                  return `<div class="bp-override-row">
                    <label class="bp-override-label">${prop.label}</label>
                    <select class="bp-override-sel"
                      onchange="setSectionOverride('${sec.id}','${bp.id}','${prop.id}',this.value)">
                      ${prop.options.map(o=>`<option value="${o.v}"${cur===o.v?' selected':''}>${o.l}</option>`).join('')}
                    </select>
                  </div>`
                }).join('')}
              </div>
            </div>`).join('')}
        </div>
      </div>`
  }).join('')
}

function setSectionOverride(secId, bpId, prop, val) {
  if (!RESP.sections[secId]) RESP.sections[secId] = {}
  if (!RESP.sections[secId][bpId]) RESP.sections[secId][bpId] = {}
  RESP.sections[secId][bpId][prop] = val
  renderRespSectionsList()
}

function applyResponsiveAll() {
  closeResponsive()
  toast('Responsive rules updated — will apply on export', '✓')
}

// ── Generate advanced responsive CSS for export ───────────────────────────────
function genResponsiveCSS() {
  const lines = []

  // ── Tablet (≤768px) ──────────────────────────────────────────────────────
  const md = RESP.global.md || {}
  const mdRules = []

  if ((md.columns2 || '1-col') === '1-col') {
    mdRules.push('  [style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important;gap:24px!important}')
  }
  const col3 = md.columns3 || '1-col'
  if (col3 === '1-col') {
    mdRules.push('  [style*="grid-template-columns:repeat(3"]{grid-template-columns:1fr!important;gap:20px!important}')
  } else if (col3 === '2-col') {
    mdRules.push('  [style*="grid-template-columns:repeat(3"]{grid-template-columns:repeat(2,1fr)!important;gap:20px!important}')
  }

  const pad = md.padding || '48px 20px'
  mdRules.push(`  [style*="padding:80px"]{padding:${pad}!important}`)
  mdRules.push(`  [style*="padding:64px"]{padding:${pad}!important}`)

  const fs = md.fontSize || 'clamp(1.6rem,6vw,2.4rem)'
  mdRules.push(`  [style*="font-size:clamp(2rem"]{font-size:${fs}!important}`)
  mdRules.push(`  [style*="font-size:clamp(1.8rem"]{font-size:${fs}!important}`)

  const hh = md.heroHeight || '420px'
  mdRules.push(`  [style*="min-height:52"],[style*="min-height:56"],[style*="min-height:60"]{min-height:${hh}!important}`)

  // Masonry
  const masIds = S.sections.filter(s=>s.type==='gallery'&&s.props.layout==='masonry').map(s=>'.gal-masonry-'+s.id)
  if (masIds.length) mdRules.push(`  ${masIds.join(',')}{columns:1!important}`)

  // 3D scene height reduction
  mdRules.push('  canvas{max-height:400px}')
  mdRules.push('  [data-pc-section]{overflow:hidden}')

  // Per-section overrides at md
  S.sections.forEach(sec => {
    const ov = RESP.sections[sec.id]?.md
    if (!ov) return
    const sel = `[data-pc-section="${sec.id}"]`
    if (ov.display && ov.display !== 'block')   mdRules.push(`  ${sel}{display:${ov.display}!important}`)
    if (ov.textAlign && ov.textAlign !== 'left') mdRules.push(`  ${sel} *{text-align:${ov.textAlign}!important}`)
    if (ov.padding && ov.padding !== 'default')  mdRules.push(`  ${sel}{padding:${ov.padding}!important}`)
    if (ov.fontSize && ov.fontSize !== 'default')mdRules.push(`  ${sel}{font-size:${ov.fontSize}!important}`)
  })

  lines.push(`@media(max-width:768px){\n${mdRules.join('\n')}\n}`)

  // ── Mobile (≤480px) ──────────────────────────────────────────────────────
  const sm = RESP.global.sm || {}
  const smRules = []

  const smPad = sm.padding || '36px 16px'
  smRules.push(`  [style*="padding:80px"],[style*="padding:48px"]{padding:${smPad}!important}`)
  smRules.push('  [style*="padding:14px 28px"]{padding:12px 18px!important;font-size:14px!important}')
  smRules.push('  [style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}')
  smRules.push('  [style*="grid-template-columns:repeat"]{grid-template-columns:1fr!important}')
  smRules.push('  [style*="gap:64px"]{gap:28px!important}')

  const smFs = sm.fontSize || 'clamp(1.4rem,7vw,2rem)'
  smRules.push(`  [style*="font-size:clamp"]{font-size:${smFs}!important}`)

  // Per-section overrides at sm
  S.sections.forEach(sec => {
    const ov = RESP.sections[sec.id]?.sm
    if (!ov) return
    const sel = `[data-pc-section="${sec.id}"]`
    if (ov.display && ov.display !== 'block')   smRules.push(`  ${sel}{display:${ov.display}!important}`)
    if (ov.textAlign && ov.textAlign !== 'left') smRules.push(`  ${sel} *{text-align:${ov.textAlign}!important}`)
    if (ov.padding && ov.padding !== 'default')  smRules.push(`  ${sel}{padding:${ov.padding}!important}`)
    if (ov.fontSize && ov.fontSize !== 'default')smRules.push(`  ${sel}{font-size:${ov.fontSize}!important}`)
  })

  lines.push(`@media(max-width:480px){\n${smRules.join('\n')}\n}`)

  // ── XL adjustments (>1280px) ──────────────────────────────────────────────
  lines.push(`@media(min-width:1280px){
  [style*="max-width:960px"]{max-width:1100px!important}
  [style*="max-width:1000px"]{max-width:1100px!important}
}`)

  return lines.join('\n')
}

// ── Replace old responsive CSS in genHTML ─────────────────────────────────────
// (called by the updated genHTML below via genResponsiveCSS())
