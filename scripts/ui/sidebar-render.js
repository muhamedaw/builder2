/* sidebar-render.js Phase 6 */

/* RENDER PIPELINE
══════════════════════════════════════════════════════ */
/* ── Render pipeline ─────────────────────────────────────────────────────────
   renderAll(hint?) — smart render with dirty tracking

   hint values:
     'props'     — a section's props changed (most common: panel editing)
     'selection' — selected section changed only
     'structure' — sections added / removed / reordered
     'mode'      — edit/preview mode toggled
     (none)      — full update (undo/redo, load, etc.)

   Rules:
     • renderBlocks()  — never re-render (block library is static)
     • renderLayers()  — skip on 'props' (list doesn't change)
     • renderPanel()   — skip on 'structure' with no selection change
     • heavy systems   — always debounced, never run on 'selection'
──────────────────────────────────────────────────────────────────────────── */

let _renderBatch  = null   // rAF handle for debounced heavy systems
let _heavyDirty   = false  // true = heavy systems need update

function _runHeavySystems() {
  _renderBatch = null
  if (!_heavyDirty) return
  _heavyDirty = false
  if (typeof DesignIntel      !== 'undefined') DesignIntel.update()
  if (typeof PerfEngine       !== 'undefined') PerfEngine.update()
  if (typeof DevMode          !== 'undefined') DevMode.update()
  if (typeof ValidationEngine !== 'undefined') ValidationEngine.scheduleValidate()
}

function _scheduleHeavy() {
  _heavyDirty = true
  if (_renderBatch) cancelAnimationFrame(_renderBatch)
  _renderBatch = requestAnimationFrame(_runHeavySystems)
}

function renderAll(hint) {
  // Canvas: always (RenderEngine handles diffing internally)
  renderCanvas()

  // Layers: skip if only props changed (section list unchanged)
  if (hint !== 'props') renderLayers()

  // Panel: skip if only structure changed with no selection change
  if (hint !== 'structure') renderPanel()

  // Live preview
  scheduleLive()

  // Pages strip: skip on selection/props changes
  if (!hint || hint === 'structure' || hint === 'mode') renderPagesNavStrip()

  // Lightweight UI updates (fast)
  if (typeof UXGuide      !== 'undefined') UXGuide.update()
  if (typeof SpeedDial    !== 'undefined') SpeedDial.update()
  if (typeof UsageLimits  !== 'undefined') UsageLimits.refresh()

  // Navigator: refresh tree when structure or content changes (skip selection-only)
  if (hint !== 'selection') {
    const navPanel = document.getElementById('tab-navigator')
    if (navPanel?.classList.contains('active') && typeof Navigator !== 'undefined') {
      Navigator.refresh()
    }
  }

  // Heavy systems: debounced — skip on pure selection changes
  if (hint !== 'selection') _scheduleHeavy()
}

const COMPONENT_TYPES = new Set(['pricing','faq','gallery','scene-particles','scene-waves','scene-globe','scene-cards','custom-html','form-builder','product-grid','video-hero'])
const BASE_TYPES      = new Set(['hero','about','contact','features','testimonial','footer'])

// ── Accordion Category Definitions ────────────────────────────────────────────
const ACC_CATEGORIES = [
  {
    id: 'layout',
    name: 'Layout',
    icon: '🏠',
    color: '#6c63ff22',
    iconBg: 'rgba(108,99,255,.15)',
    desc: 'Page structure & navigation',
    types: ['hero','about','footer'],
    open: true,   // open by default
  },
  {
    id: 'content',
    name: 'Content',
    icon: '📝',
    color: '#10b98122',
    iconBg: 'rgba(16,185,129,.15)',
    desc: 'Text, features & social proof',
    types: ['features','testimonial','faq'],
    open: true,
  },
  {
    id: 'media',
    name: 'Media',
    icon: '🖼',
    color: '#ec489922',
    iconBg: 'rgba(236,72,153,.15)',
    desc: 'Images, video & galleries',
    types: ['gallery','video-hero'],
    open: false,
  },
  {
    id: 'interactive',
    name: 'Interactive',
    icon: '⚡',
    color: '#f59e0b22',
    iconBg: 'rgba(245,158,11,.15)',
    desc: 'Forms, inputs & actions',
    types: ['contact','form-builder'],
    open: false,
  },
  {
    id: 'business',
    name: 'Business',
    icon: '💰',
    color: '#0ea5e922',
    iconBg: 'rgba(14,165,233,.15)',
    desc: 'Pricing, products & e-commerce',
    types: ['pricing','product-grid'],
    open: false,
  },
  {
    id: 'effects',
    name: '3D Effects',
    icon: '✦',
    color: '#6366f122',
    iconBg: 'rgba(99,102,241,.15)',
    desc: 'Immersive 3D backgrounds',
    types: ['scene-particles','scene-waves','scene-globe','scene-cards'],
    open: false,
  },
  {
    id: 'advanced',
    name: 'Advanced',
    icon: '⚙️',
    color: '#64748b22',
    iconBg: 'rgba(100,116,139,.15)',
    desc: 'Custom code & raw HTML',
    types: ['custom-html'],
    open: false,
  },
]

// Track open state
const _accOpen = {}
ACC_CATEGORIES.forEach(c => { _accOpen[c.id] = c.open })

function blockCardHTML(type, def) {
  return `<div class="block-card" data-type="${type}" onpointerdown="onBlockPointerDown(event,'${type}')" title="Drag or click to add">
    <div class="bci" style="background:${def.color}">${def.icon}</div>
    <div style="flex:1;min-width:0"><div class="bcl">${def.label}</div><div class="bcd">${def.desc||''}</div></div>
    <div class="bc-drag">⠿</div>
  </div>`
}

function accCategoryHTML(cat) {
  const items = cat.types
    .filter(t => DEFS[t])
    .map(t => blockCardHTML(t, DEFS[t]))
    .join('')
  const count = cat.types.filter(t => DEFS[t]).length
  const isOpen = _accOpen[cat.id]
  // Preview pills (first 3 icons shown when collapsed)
  const pills = cat.types.slice(0,3).map(t => DEFS[t] ? `<span class="acc-pill">${DEFS[t].icon}</span>` : '').join('')

  return `<div class="acc-cat${isOpen?' open':''}" id="acc-cat-${cat.id}">
    <div class="acc-header" onclick="toggleAccordion('${cat.id}')">
      <div class="acc-cat-icon" style="background:${cat.iconBg}">${cat.icon}</div>
      <div class="acc-cat-info">
        <div class="acc-cat-name">${cat.name}</div>
        <div class="acc-cat-desc">${cat.desc}</div>
      </div>
      <div class="acc-cat-meta">
        <div class="acc-previews">${pills}</div>
        <span class="acc-count">${count}</span>
        <span class="acc-chevron">▼</span>
      </div>
    </div>
    <div class="acc-body">
      <div class="acc-items" id="acc-items-${cat.id}">${isOpen ? items : ''}</div>
    </div>
  </div>`
}

function toggleAccordion(catId) {
  const catEl  = document.getElementById('acc-cat-' + catId)
  const items  = document.getElementById('acc-items-' + catId)
  if (!catEl) return
  const isOpen = catEl.classList.contains('open')

  if (!isOpen) {
    // Lazy-render items on first open (skip 'saved' — has its own static content)
    if (items && !items.dataset.rendered && catId !== 'saved') {
      const cat = ACC_CATEGORIES.find(c => c.id === catId)
      if (cat) {
        items.innerHTML = cat.types.filter(t => DEFS[t]).map(t => blockCardHTML(t, DEFS[t])).join('')
        items.dataset.rendered = '1'
      }
    }
    catEl.classList.add('open')
    _accOpen[catId] = true
  } else {
    catEl.classList.remove('open')
    _accOpen[catId] = false
  }
}

function renderBlocks() {
  const list = document.getElementById('block-list')
  list.innerHTML = ACC_CATEGORIES.map(accCategoryHTML).join('')
  // Mark pre-opened categories as rendered
  ACC_CATEGORIES.forEach(cat => {
    if (cat.open) {
      const el = document.getElementById('acc-items-' + cat.id)
      if (el) el.dataset.rendered = '1'
    }
  })
}

/* ══ STAGE 2: SECTION SEARCH ══════════════════════════════ */
function filterSections(q) {
  q = (q || '').trim().toLowerCase()
  const clearBtn = document.getElementById('section-search-clear')
  if (clearBtn) clearBtn.style.display = q ? 'block' : 'none'

  // Switch to Add tab for search
  switchSTab('blocks')

  if (!q) {
    // Reset — restore accordion state
    ACC_CATEGORIES.forEach(cat => {
      const catEl = document.getElementById('acc-cat-' + cat.id)
      const items = document.getElementById('acc-items-' + cat.id)
      if (!catEl) return
      if (_accOpen[cat.id]) {
        catEl.classList.add('open')
      } else {
        catEl.classList.remove('open')
      }
      if (items) items.querySelectorAll('.block-card').forEach(c => c.classList.remove('acc-hidden'))
      // Remove empty state
      const empty = catEl.querySelector('.acc-empty')
      if (empty) empty.remove()
    })
    return
  }

  // For search: expand all categories, render their items, filter cards
  let totalVisible = 0
  ACC_CATEGORIES.forEach(cat => {
    const catEl = document.getElementById('acc-cat-' + cat.id)
    const items = document.getElementById('acc-items-' + cat.id)
    if (!catEl || !items) return

    // Ensure items rendered for search
    if (!items.dataset.rendered) {
      items.innerHTML = cat.types.filter(t => DEFS[t]).map(t => blockCardHTML(t, DEFS[t])).join('')
      items.dataset.rendered = '1'
    }

    // Filter cards
    let catVisible = 0
    items.querySelectorAll('.block-card').forEach(card => {
      const match = card.textContent.toLowerCase().includes(q)
      card.classList.toggle('acc-hidden', !match)
      if (match) { catVisible++; totalVisible++ }
    })

    // Expand if has results, collapse if not
    if (catVisible > 0) {
      catEl.classList.add('open')
      const empty = catEl.querySelector('.acc-empty')
      if (empty) empty.remove()
    } else {
      catEl.classList.remove('open')
    }
  })

  // Global empty state
  const list = document.getElementById('block-list')
  const existing = list.querySelector('.acc-empty')
  if (totalVisible === 0 && q) {
    if (!existing) list.insertAdjacentHTML('beforeend',
      `<div class="acc-empty">No sections match "<strong>${q}</strong>"</div>`)
  } else {
    if (existing) existing.remove()
  }
}

/* ══ STAGE 2: KEYBOARD NAVIGATION ══════════════════════════ */
document.addEventListener('keydown', (e) => {
  // Skip if user is typing in input/textarea/contenteditable
  const tag = (e.target.tagName || '').toLowerCase()
  const editable = tag === 'input' || tag === 'textarea' || tag === 'select' ||
                   e.target.isContentEditable || e.target.closest('.modal')
  if (editable) return

  const id = S.selected
  if (!id) return

  const idx   = S.sections.findIndex(s => s.id === id)
  if (idx < 0) return

  if (e.key === 'ArrowUp' && idx > 0) {
    e.preventDefault()
    moveSection(id, -1, e)
  } else if (e.key === 'ArrowDown' && idx < S.sections.length - 1) {
    e.preventDefault()
    moveSection(id, 1, e)
  } else if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.isContentEditable) {
    e.preventDefault()
    if (confirm('Delete this section?')) removeSection(id, e)
  } else if (e.key === 'Escape') {
    editorStore.produce(d => { d.selected = null }, 'deselect')
    renderPanel()
    document.querySelectorAll('.section-wrapper.selected').forEach(el => el.classList.remove('selected'))
  } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    dupSection(id, e)
  }
})
