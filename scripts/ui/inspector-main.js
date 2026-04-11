/* inspector-main.js — Webflow-Grade Style Inspector
   Floating element-level style panel with full state hydration.
   Appears when an element is picked via MicroTarget.
   Writes live inline styles → persists in sec.props._elStyles[pcId]. */

const Inspector = (() => {
  'use strict'

  let _el       = null   // selected DOM element
  let _computed = null   // getComputedStyle snapshot
  let _ctx      = null   // PropertyBridge raycast context
  let _panel    = null   // panel DOM node
  let _modules  = []     // registered sub-modules (from inspector-components.js)

  // ── Utility: camelCase → kebab-case ─────────────────────────────────────
  function _camel(k)  { return k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) }
  function _kebab(k)  { return k.replace(/([A-Z])/g, '-$1').toLowerCase() }

  // ── Parse a CSS value into { num, unit } ────────────────────────────────
  function _parseVal(v) {
    if (!v || v === 'none' || v === 'auto' || v === 'normal') return { num: '', unit: 'px' }
    const m = String(v).match(/^(-?[\d.]+)(px|%|em|rem|vh|vw|deg|s|ms)?$/)
    return m ? { num: m[1], unit: m[2] || 'px' } : { num: '', unit: 'px' }
  }

  // ── Style inheritance detection ───────────────────────────────────────
  // Returns true if the property is NOT set on this element (inherited)
  function _isInherited(prop) {
    if (!_el) return false
    return !_el.style.getPropertyValue(_kebab(prop))
  }

  // ── Apply style to element + persist ─────────────────────────────────
  function applyStyle(prop, value) {
    if (!_el) return
    const kprop = _kebab(prop)
    _el.style.setProperty(kprop, value)
    _persistStyle(prop, value)
    // Notify PropertyBridge subscribers
    if (typeof PropertyBridge !== 'undefined' && _ctx?.sectionId) {
      PropertyBridge._notify?.({ sectionId: _ctx.sectionId, key: `_el_${prop}`, value, type: 'element-style' })
    }
  }

  function _persistStyle(prop, value) {
    if (!_ctx?.sectionId || !_el?.dataset?.pcId) return
    const sec  = typeof S !== 'undefined' ? S.sections.find(s => s.id === _ctx.sectionId) : null
    if (!sec) return
    if (!sec.props._elStyles)       sec.props._elStyles = {}
    if (!sec.props._elStyles[_el.dataset.pcId]) sec.props._elStyles[_el.dataset.pcId] = {}
    sec.props._elStyles[_el.dataset.pcId][prop] = value
    _updateScopedStyleTag(sec)
    if (typeof pushH === 'function') pushH('Style: ' + prop, false)
  }

  function _updateScopedStyleTag(sec) {
    const styleId = `pc-el-styles-${sec.id}`
    let tag = document.getElementById(styleId)
    if (!tag) {
      tag = document.createElement('style')
      tag.id = styleId
      document.head.appendChild(tag)
    }
    const rules = Object.entries(sec.props._elStyles || {}).map(([pcId, styles]) => {
      const css = Object.entries(styles)
        .map(([p, v]) => `${_kebab(p)}:${v}`)
        .join(';')
      return `[data-pc-id="${pcId}"]{${css}}`
    }).join('\n')
    tag.textContent = rules
  }

  // Re-apply persisted element styles after a section re-renders
  function restoreSection(secId) {
    const sec = typeof S !== 'undefined' ? S.sections.find(s => s.id === secId) : null
    if (!sec?.props._elStyles) return
    _updateScopedStyleTag(sec)
  }

  // ── Build panel DOM ───────────────────────────────────────────────────
  function _buildPanel() {
    const p = document.createElement('div')
    p.id        = 'pc-inspector'
    p.className = 'ins-panel ins-hidden'
    p.innerHTML = `
      <div class="ins-header">
        <div class="ins-el-info">
          <span class="ins-el-tag" id="ins-el-tag">—</span>
          <span class="ins-el-id"  id="ins-el-id"></span>
        </div>
        <div class="ins-header-actions">
          <button class="ins-deselect" onclick="Inspector.deselect()" title="Deselect">✕</button>
        </div>
      </div>
      <div class="ins-body" id="ins-body"></div>`
    document.body.appendChild(p)

    // Drag to reposition
    _makePanelDraggable(p)
    return p
  }

  function _makePanelDraggable(panel) {
    const header = panel.querySelector('.ins-header')
    if (!header) return
    let ox = 0, oy = 0, dragging = false
    header.style.cursor = 'move'
    header.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return
      dragging = true
      const r = panel.getBoundingClientRect()
      ox = e.clientX - r.left
      oy = e.clientY - r.top
      header.setPointerCapture(e.pointerId)
    })
    header.addEventListener('pointermove', e => {
      if (!dragging) return
      panel.style.left = `${e.clientX - ox}px`
      panel.style.top  = `${e.clientY - oy}px`
      panel.style.right = 'auto'
      panel.style.bottom = 'auto'
    })
    header.addEventListener('pointerup', () => { dragging = false })
  }

  // ── Register sub-modules ──────────────────────────────────────────────
  function registerModule(mod) {
    _modules.push(mod)
  }

  // ── Render all modules into body ──────────────────────────────────────
  function _renderModules() {
    const body = document.getElementById('ins-body')
    if (!body) return
    body.innerHTML = _modules.map(mod => `
      <div class="ins-module" id="ins-mod-${mod.id}">
        <div class="ins-mod-header" onclick="Inspector._toggleModule('${mod.id}')">
          <span class="ins-mod-label">${mod.label}</span>
          <span class="ins-mod-caret ins-open" id="ins-caret-${mod.id}">▾</span>
        </div>
        <div class="ins-mod-body" id="ins-body-${mod.id}">
          ${mod.render(_el, _computed, _ctx)}
        </div>
      </div>`).join('')

    // Bind events for each module
    _modules.forEach(mod => {
      const container = document.getElementById(`ins-body-${mod.id}`)
      if (container && mod.bind) mod.bind(container, _el, _computed)
    })
  }

  function _toggleModule(id) {
    const body  = document.getElementById(`ins-body-${id}`)
    const caret = document.getElementById(`ins-caret-${id}`)
    if (!body) return
    const open = body.style.display !== 'none'
    body.style.display  = open ? 'none' : ''
    caret?.classList.toggle('ins-open', !open)
  }

  // ── Full State Hydration ──────────────────────────────────────────────
  function _hydrate() {
    if (!_el || !_computed) return
    // Update header info
    const tagEl = document.getElementById('ins-el-tag')
    const idEl  = document.getElementById('ins-el-id')
    if (tagEl) tagEl.textContent = `<${_el.tagName.toLowerCase()}>`
    if (idEl)  idEl.textContent  = _el.dataset.pcId ? `#${_el.dataset.pcId.split(':').slice(-2).join(':')}` : ''
    // Re-render and re-bind all modules
    _renderModules()
  }

  // ── Public: select an element ─────────────────────────────────────────
  function select(el, context) {
    if (!el) return
    _el       = el
    _computed = window.getComputedStyle(el)
    _ctx      = context || (typeof PropertyBridge !== 'undefined' ? PropertyBridge.raycast(el) : null)

    if (!_panel) _panel = _buildPanel()
    _hydrate()

    _panel.classList.remove('ins-hidden')
    _panel.style.display = ''
  }

  function deselect() {
    _el = _computed = _ctx = null
    if (_panel) {
      _panel.classList.add('ins-hidden')
      setTimeout(() => { if (_panel) _panel.style.display = 'none' }, 200)
    }
    if (typeof MicroTarget !== 'undefined') MicroTarget.deactivate()
  }

  function open()  { if (_panel) { _panel.classList.remove('ins-hidden'); _panel.style.display = '' } }
  function close() { deselect() }

  // ── Expose helpers for modules ────────────────────────────────────────
  function getEl()       { return _el }
  function getComputed() { return _computed }
  function getCtx()      { return _ctx }
  function isInherited(prop) { return _isInherited(prop) }
  function parseVal(v)       { return _parseVal(v) }

  // ── Drag-to-increment utility (used by Spacing module) ───────────────
  function makeDraggable(input, onUpdate) {
    let startY, startVal
    input.addEventListener('mousedown', e => {
      if (e.button !== 0) return
      e.preventDefault()
      startY   = e.clientY
      startVal = parseFloat(input.value) || 0
      input.classList.add('ins-dragging')
      const move = ev => {
        const delta = Math.round((startY - ev.clientY) / 3)
        input.value = startVal + delta
        if (typeof onUpdate === 'function') onUpdate(input.value)
      }
      const up = () => {
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
        input.classList.remove('ins-dragging')
      }
      document.addEventListener('mousemove', move)
      document.addEventListener('mouseup', up)
    })
  }

  // ── Wire into MicroTarget picker ─────────────────────────────────────
  // Called from VisualInspector's 🎯 pick button
  function activatePicker() {
    if (typeof MicroTarget === 'undefined') return
    MicroTarget.activate((el, _secId, _path, context) => {
      select(el, context)
    })
  }

  // ── Re-apply persisted styles after render ────────────────────────────
  document.addEventListener('pc:rendered', e => {
    const secIds = e.detail?.rerendered
    if (secIds) secIds.forEach(id => restoreSection(id))
  })

  return {
    select, deselect, open, close, activatePicker,
    applyStyle, restoreSection,
    registerModule, getEl, getComputed, getCtx, isInherited, parseVal, makeDraggable,
    _toggleModule,
  }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.Inspector = Inspector
