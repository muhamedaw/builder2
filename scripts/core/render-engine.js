/* render-engine.js — Diff-based canvas renderer
   Eliminates full DOM rebuilds on every state change.
   Only updates what actually changed. */

const RenderEngine = (() => {
  'use strict'

  // ── Cache maps ────────────────────────────────────────────────────────────────
  const _propsHash = new Map()   // sectionId → hash of rendered props
  const _posHash   = new Map()   // sectionId → "first|last" position signature
  const _selHash   = new Map()   // sectionId → "sel|bulk" selection signature
  let   _orderSig  = ''          // comma-joined id sequence — skip reorder when unchanged

  // ── Fast FNV-1a hash ──────────────────────────────────────────────────────────
  function _hash(str) {
    let h = 2166136261
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i)
      h = Math.imul(h, 16777619) >>> 0
    }
    return h
  }

  function _propsFingerprint(sec) {
    return _hash(sec.type + JSON.stringify(sec.props))
  }

  // ── Build controls HTML ───────────────────────────────────────────────────────
  function _buildControls(id, first, last) {
    return (
      `<button class="sc-btn dh" onpointerdown="onSectionDragHandleDown(event,'${id}')" title="Drag to reorder">⠿</button>` +
      (!first ? `<button class="sc-btn mv" onclick="moveSection('${id}',-1,event)" title="Up">↑</button>` : '') +
      (!last  ? `<button class="sc-btn mv" onclick="moveSection('${id}',1,event)"  title="Down">↓</button>` : '') +
      `<button class="sc-btn dp" onclick="dupSection('${id}',event)" title="Duplicate">⧉</button>` +
      `<button class="sc-btn" onclick="saveAsComponent('${id}',event)" title="Save as component" style="background:rgba(108,99,255,.15);color:var(--accent)">★</button>` +
      `<button class="sc-btn dl" onclick="removeSection('${id}',event)" title="Delete">✕</button>`
    )
  }

  // ── 1.1 Intent-Based Indexing ─────────────────────────────────────────────────
  // Maps section type → semantic intent labels for AI context awareness
  const INTENT_MAP = {
    'hero':            'Hero Landing Conversion CTA',
    'about':           'Brand Story Trust About Mission',
    'features':        'Features Benefits Product Value',
    'testimonial':     'Social Proof Trust Reviews Credibility',
    'pricing':         'Pricing Conversion Monetization Plans',
    'contact':         'Contact Lead Generation Form',
    'footer':          'Navigation Footer Legal Brand Links',
    'faq':             'FAQ Support Trust Help',
    'gallery':         'Portfolio Gallery Showcase Visual',
    'form-builder':    'Form Lead Capture Data Collection',
    'product-grid':    'Ecommerce Products Shop Store',
    'video-hero':      'Video Media Engagement Hero',
    'scene-particles': '3D Interactive Immersive Particles',
    'scene-waves':     '3D Interactive Immersive Waves',
    'scene-globe':     '3D Interactive Global Geographic',
    'scene-cards':     '3D Interactive Cards Flip',
    'custom-html':     'Custom Code HTML Developer',
  }

  function _getIntent(type) {
    return INTENT_MAP[type] || 'Section Content'
  }

  // ── Build full wrapper HTML (first render) ────────────────────────────────────
  function _buildWrapper(sec, def, sel, bulk, first, last) {
    const intent = _getIntent(sec.type)
    return (
      `<div class="section-wrapper${sel ? ' selected' : ''}${bulk ? ' section-selected' : ''}" ` +
      `data-id="${sec.id}" data-section-id="${sec.id}" data-intent="${intent}" data-type="${sec.type}" ` +
      `onclick="onSecClick(event,'${sec.id}')">` +
      `<span class="section-label">${def.icon} ${def.label}</span>` +
      `<div class="section-controls">${_buildControls(sec.id, first, last)}</div>` +
      `<div class="sec-content">${R[sec.type](sec.props, sec.id)}</div>` +
      `</div>`
    )
  }

  // ── Drop-line factory ─────────────────────────────────────────────────────────
  function _dropLine(idx) {
    const dl = document.createElement('div')
    dl.className = 'drop-line'
    dl.dataset.dropIdx = idx
    return dl
  }

  // ── Main patch function ───────────────────────────────────────────────────────
  // Returns Set of sectionIds whose content was re-rendered (for post-processing)
  function patch(root, sections, selectedId) {
    const total   = sections.length
    const bulkSet = (typeof BulkActions !== 'undefined') ? BulkActions._selected : null

    // Build id→domNode map from current DOM
    const domMap = new Map()
    root.querySelectorAll(':scope > .section-wrapper').forEach(el => {
      domMap.set(el.dataset.id, el)
    })

    const rerendered = new Set()

    // ── Pass 1: update or create each section node ────────────────────────────
    sections.forEach((sec, idx) => {
      const def   = DEFS[sec.type]
      const sel   = selectedId === sec.id
      const bulk  = bulkSet?.has(sec.id) || false
      const first = idx === 0
      const last  = idx === total - 1

      const ph     = _propsFingerprint(sec)
      const posSig = `${first}|${last}`
      const selSig = `${sel}|${bulk}`

      let el = domMap.get(sec.id)

      if (!el) {
        // ── New section: create full DOM node ──────────────────────────────────
        const tmp = document.createElement('div')
        tmp.innerHTML = _buildWrapper(sec, def, sel, bulk, first, last)
        el = tmp.firstElementChild
        _propsHash.set(sec.id, ph)
        _posHash.set(sec.id, posSig)
        _selHash.set(sec.id, selSig)
        rerendered.add(sec.id)
      } else {
        // ── Existing section: patch only what changed ──────────────────────────

        // Selection class (cheapest — just toggle class)
        if (_selHash.get(sec.id) !== selSig) {
          el.classList.toggle('selected', sel)
          el.classList.toggle('section-selected', bulk)
          _selHash.set(sec.id, selSig)
        }

        // Controls (only when first/last position changed)
        if (_posHash.get(sec.id) !== posSig) {
          const ctrl = el.querySelector('.section-controls')
          if (ctrl) ctrl.innerHTML = _buildControls(sec.id, first, last)
          _posHash.set(sec.id, posSig)
        }

        // Content (only when props changed)
        if (_propsHash.get(sec.id) !== ph) {
          const content = el.querySelector('.sec-content')
          if (content) content.innerHTML = R[sec.type](sec.props, sec.id)
          _propsHash.set(sec.id, ph)
          rerendered.add(sec.id)
        }
      }

      // Store back (may be new node)
      domMap.set(sec.id, el)
    })

    // ── Pass 2: remove deleted sections ──────────────────────────────────────
    const newIds = new Set(sections.map(s => s.id))
    domMap.forEach((el, id) => {
      if (!newIds.has(id)) {
        el.remove()
        _propsHash.delete(id)
        _posHash.delete(id)
        _selHash.delete(id)
      }
    })

    // ── Pass 3: reorder DOM with drop-lines (skip when order unchanged) ──────
    const newOrderSig = sections.map(s => s.id).join(',')
    if (newOrderSig !== _orderSig) {
      _orderSig = newOrderSig

      // Remove stale drop-lines; wrappers stay in root until moved to frag
      root.querySelectorAll(':scope > .drop-line').forEach(dl => dl.remove())

      // Build ordered fragment: [drop, wrapper, drop, wrapper, ..., drop]
      const frag = document.createDocumentFragment()
      sections.forEach((sec, idx) => {
        frag.appendChild(_dropLine(idx))
        frag.appendChild(domMap.get(sec.id))  // moves node from root to frag
      })
      frag.appendChild(_dropLine(total))

      // root is now empty (all wrappers moved to frag, drop-lines removed)
      root.appendChild(frag)
    }

    // ── 1.2 Surgical ID Mirroring ─────────────────────────────────────────────
    // After each render pass, assign persistent data-pc-id to every
    // meaningful child element inside re-rendered sections so the AI can
    // address micro-elements by stable path-based IDs.
    if (rerendered.size > 0) {
      rerendered.forEach(secId => {
        const wrapper = domMap.get(secId)
        if (!wrapper) return
        _mirrorIds(wrapper, secId)
      })
    }

    return rerendered
  }

  // ── 1.2 Surgical ID Mirroring helper ─────────────────────────────────────────
  // Walk the rendered subtree and stamp data-pc-id="secId:tag:index" on
  // every leaf/interactive element that doesn't already have one.
  const _MIRROR_TAGS = new Set(['h1','h2','h3','h4','h5','h6','p','span','a','img','button','li','input','textarea','label','blockquote','strong','em'])

  function _mirrorIds(wrapper, secId) {
    const counters = {}
    wrapper.querySelectorAll(_MIRROR_TAGS_SEL).forEach(el => {
      if (el.dataset.pcId) return   // already stamped — preserve stability
      const tag = el.tagName.toLowerCase()
      counters[tag] = (counters[tag] || 0) + 1
      el.dataset.pcId = `${secId}:${tag}:${counters[tag]}`
    })
  }

  const _MIRROR_TAGS_SEL = [..._MIRROR_TAGS].join(',')

  // ── Cache invalidation ────────────────────────────────────────────────────────
  function invalidate(sectionId) {
    _propsHash.delete(sectionId)
    _posHash.delete(sectionId)
    _selHash.delete(sectionId)
  }

  function invalidateAll() {
    _propsHash.clear()
    _posHash.clear()
    _selHash.clear()
    _orderSig = ''
  }

  return { patch, invalidate, invalidateAll }
})()
