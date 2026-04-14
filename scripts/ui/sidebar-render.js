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

  // Also search loaded templates
  if (_tplState.loaded) {
    const tplCatEl = document.getElementById('acc-cat-templates')
    const tplItems = document.getElementById('acc-items-templates')
    if (tplCatEl && tplItems) {
      let tplVisible = 0
      tplItems.querySelectorAll('.block-card').forEach(card => {
        const match = card.textContent.toLowerCase().includes(q)
        card.classList.toggle('acc-hidden', !match)
        if (match) { tplVisible++; totalVisible++ }
      })
      if (tplVisible > 0) tplCatEl.classList.add('open')
      else tplCatEl.classList.remove('open')
    }
  }

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

/* ══ TEMPLATE GALLERY — showcase-components.pagecraft.json ══ */

const _tplState = { loaded: false, loading: false, open: false, data: [] }

// Category labels for templates
const _TPL_CATEGORY_LABELS = {
  hero:        { label: 'Hero', icon: '🦸', color: 'rgba(108,99,255,.15)' },
  features:    { label: 'Features', icon: '✨', color: 'rgba(139,92,246,.15)' },
  testimonial: { label: 'Trust & Proof', icon: '💬', color: 'rgba(16,185,129,.15)' },
  pricing:     { label: 'Conversion', icon: '💎', color: 'rgba(14,165,233,.15)' },
  about:       { label: 'Content', icon: '📝', color: 'rgba(245,158,11,.15)' },
  faq:         { label: 'Content', icon: '📝', color: 'rgba(245,158,11,.15)' },
  gallery:     { label: 'Media', icon: '🖼', color: 'rgba(236,72,153,.15)' },
  footer:      { label: 'Footer', icon: '🔻', color: 'rgba(100,116,139,.15)' },
}

function _tplCardHTML(comp) {
  const meta = _TPL_CATEGORY_LABELS[comp.sectionType] || { label: comp.sectionType, icon: '◻', color: 'rgba(100,116,139,.15)' }
  return `<div class="block-card tpl-card" onclick="addFromShowcase('${comp.id}')" title="${comp.desc || comp.name}">
    <div class="bci" style="background:${meta.color}">${meta.icon}</div>
    <div style="flex:1;min-width:0">
      <div class="bcl">${comp.name}</div>
      <div class="bcd" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${comp.desc || ''}</div>
    </div>
  </div>`
}

function _renderTemplatesByCategory(data) {
  // Group by `category` field if present, else fall back to sectionType
  const byGroup = {}
  data.forEach(c => {
    const key = c.category || _TPL_CATEGORY_LABELS[c.sectionType]?.label || c.sectionType || 'Other'
    if (!byGroup[key]) byGroup[key] = []
    byGroup[key].push(c)
  })

  // Sort: named categories first (alphabetical), then sectionType fallbacks
  const namedFirst = ['Technology & AI', 'Portfolio & Agency', 'Professional Services', 'Launch & Coming Soon']
  const sectionOrder = ['hero','features','testimonial','pricing','about','faq','gallery','footer']
  const allKeys = Object.keys(byGroup)
  const sorted = [
    ...namedFirst.filter(k => byGroup[k]),
    ...sectionOrder.map(t => _TPL_CATEGORY_LABELS[t]?.label).filter(k => k && byGroup[k] && !namedFirst.includes(k)),
    ...allKeys.filter(k => !namedFirst.includes(k) && !sectionOrder.map(t => _TPL_CATEGORY_LABELS[t]?.label).includes(k))
  ]

  // Deduplicate
  const seen = new Set()
  const deduped = sorted.filter(k => { if (seen.has(k)) return false; seen.add(k); return true })

  const _categoryIcons = {
    'Technology & AI': { icon: '🤖', color: 'rgba(99,102,241,.15)' },
    'Portfolio & Agency': { icon: '🎨', color: 'rgba(236,72,153,.15)' },
    'Professional Services': { icon: '💼', color: 'rgba(14,165,233,.15)' },
    'Launch & Coming Soon': { icon: '🚀', color: 'rgba(245,158,11,.15)' },
  }

  return deduped.map(groupKey => {
    const comps = byGroup[groupKey]
    const icon = _categoryIcons[groupKey]?.icon || '◻'
    return `<div style="padding:6px 8px 2px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);padding:4px 2px 6px;display:flex;align-items:center;gap:5px">
        <span>${icon}</span><span>${groupKey} (${comps.length})</span>
      </div>
      ${comps.map(c => _tplCardHTML(c)).join('')}
    </div>`
  }).join('')
}

function toggleTemplates() {
  const catEl = document.getElementById('acc-cat-templates')
  const items = document.getElementById('acc-items-templates')
  if (!catEl) return

  _tplState.open = !_tplState.open
  catEl.classList.toggle('open', _tplState.open)

  if (_tplState.open && !_tplState.loaded && !_tplState.loading) {
    _tplState.loading = true
    const msg = document.getElementById('tpl-empty-msg')
    if (msg) msg.textContent = 'Loading templates…'

    fetch('/showcase-components.pagecraft.json')
      .then(r => r.json())
      .then(json => {
        _tplState.data   = json.components || []
        _tplState.loaded = true
        _tplState.loading = false
        const count = _tplState.data.length
        const countEl = document.getElementById('tpl-count')
        if (countEl) countEl.textContent = count
        if (items) items.innerHTML = _renderTemplatesByCategory(_tplState.data)
      })
      .catch(() => {
        _tplState.loading = false
        if (items) items.innerHTML = '<p style="font-size:11px;color:var(--muted);text-align:center;padding:12px">Failed to load templates</p>'
      })
  }
}

function addFromShowcase(compId) {
  if (!_tplState.loaded) return
  const comp = _tplState.data.find(c => c.id === compId)
  if (!comp) return
  if (!DEFS[comp.sectionType]) { toast(`Section type "${comp.sectionType}" not available`, '⚠️'); return }

  pushH('Add template: ' + comp.name)

  // Remap _elAnims keys: replace template prefix with new section ID
  const newId = uid()
  let props = JSON.parse(JSON.stringify(comp.props))
  if (props._elAnims) {
    const remapped = {}
    Object.entries(props._elAnims).forEach(([key, val]) => {
      // key format: "templateId:tag:N" or "templateId:__section"
      const colonIdx = key.indexOf(':')
      if (colonIdx > -1) {
        remapped[newId + key.slice(colonIdx)] = val
      } else {
        remapped[key] = val
      }
    })
    props._elAnims = remapped
  }

  const sec = { id: newId, type: comp.sectionType, props }
  const insertIdx = S.selected
    ? S.sections.findIndex(s => s.id === S.selected) + 1
    : S.sections.length
  S.sections.splice(insertIdx, 0, sec)
  S.selected = sec.id

  renderAll('structure')
  scrollToSection(sec.id)
  // Restore animations on the newly added section
  if (typeof AnimationEngine !== 'undefined') AnimationEngine.restoreSection(sec.id)
  toast(`"${comp.name}" added`, '🎨')
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
