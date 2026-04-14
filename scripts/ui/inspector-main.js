/* inspector-main.js — Webflow-Grade Style Inspector
   Floating element-level style panel with full state hydration.
   Appears when an element is picked via MicroTarget.
   Writes live inline styles → persists in sec.props._elStyles[pcId]. */

const Inspector = (() => {
  'use strict'

  let _el         = null   // selected DOM element
  let _computed   = null   // getComputedStyle snapshot
  let _ctx        = null   // PropertyBridge raycast context
  let _panel      = null   // panel DOM node
  let _modules    = []     // registered sub-modules (from inspector-components.js)
  let _activeTab  = 'style'  // 'style' | 'layout' | 'animations'

  // ── Utility: camelCase → kebab-case ─────────────────────────────────────
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

  function _updateScopedStyleTag(_sec) {
    // Consolidate ALL section element-styles into a single <style id="pc-dynamic-styles">
    let tag = document.getElementById('pc-dynamic-styles')
    if (!tag) {
      tag = document.createElement('style')
      tag.id = 'pc-dynamic-styles'
      document.head.appendChild(tag)
    }
    const allSections = typeof S !== 'undefined' ? S.sections : []
    const rules = allSections.flatMap(s => {
      if (!s.props._elStyles) return []
      return Object.entries(s.props._elStyles).map(([pcId, styles]) => {
        // Use !important so our rules beat inline styles injected by renderers
        const css = Object.entries(styles)
          .map(([p, v]) => `${_kebab(p)}:${v} !important`)
          .join(';')
        return `[data-pc-id="${pcId}"]{${css}}`
      })
    }).join('\n')
    tag.textContent = rules

    // Also stamp inline styles directly on any already-mounted elements
    // (covers the case where the style tag is loaded after elements are painted)
    allSections.forEach(s => {
      if (!s.props._elStyles) return
      Object.entries(s.props._elStyles).forEach(([pcId, styles]) => {
        const el = document.querySelector(`[data-pc-id="${pcId}"]`)
        if (!el) return
        Object.entries(styles).forEach(([p, v]) => el.style.setProperty(_kebab(p), v, 'important'))
      })
    })
  }

  // Re-apply persisted element styles + animations after a section re-renders
  function restoreSection(secId) {
    const sec = typeof S !== 'undefined' ? S.sections.find(s => s.id === secId) : null
    if (!sec) return
    if (sec.props._elStyles) _updateScopedStyleTag(sec)
    if (typeof AnimationEngine !== 'undefined') AnimationEngine.restoreSection(secId)
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
      <div class="ins-tabs">
        <div class="ins-tab ins-tab-active" data-tab="style"      onclick="Inspector._switchTab('style')">Style</div>
        <div class="ins-tab"                data-tab="layout"     onclick="Inspector._switchTab('layout')">Layout</div>
        <div class="ins-tab"                data-tab="animations" onclick="Inspector._switchTab('animations')">Animations</div>
      </div>
      <div class="ins-body" id="ins-body"></div>`
    document.body.appendChild(p)

    // Drag to reposition
    _makePanelDraggable(p)
    return p
  }

  // ── Switch Inspector tab ──────────────────────────────────────────────
  function _switchTab(tab) {
    _activeTab = tab
    const panel = document.getElementById('pc-inspector')
    if (!panel) return
    panel.querySelectorAll('.ins-tab').forEach(t =>
      t.classList.toggle('ins-tab-active', t.dataset.tab === tab)
    )
    _renderModules()
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

  // ── Render all modules into body (filtered by active tab) ─────────────
  function _renderModules() {
    const body = document.getElementById('ins-body')
    if (!body) return

    // Animations tab
    if (_activeTab === 'animations') {
      _renderAnimTab(body)
      return
    }

    // Style / Layout tabs: show registered modules for this tab
    const visible = _modules.filter(mod => mod.tab === _activeTab)
    body.innerHTML = visible.map(mod => `
      <div class="ins-module" id="ins-mod-${mod.id}">
        <div class="ins-mod-header" onclick="Inspector._toggleModule('${mod.id}')">
          <span class="ins-mod-label">${mod.label}</span>
          <span class="ins-mod-caret ins-open" id="ins-caret-${mod.id}">▾</span>
        </div>
        <div class="ins-mod-body" id="ins-body-${mod.id}">
          ${mod.render(_el, _computed, _ctx)}
        </div>
      </div>`).join('')

    visible.forEach(mod => {
      const container = document.getElementById(`ins-body-${mod.id}`)
      if (container && mod.bind) mod.bind(container, _el, _computed)
    })
  }

  // ── Animations tab — powered by AnimationEngine ──────────────────────
  function _getAE() { return typeof AnimationEngine !== 'undefined' ? AnimationEngine : null }

  // Determine whether current target is section-level or element-level
  function _isSecTarget() {
    if (!_el || !_ctx?.sectionId) return false
    const wrapper = document.querySelector(`.section-wrapper[data-id="${_ctx.sectionId}"]`)
    const content = wrapper?.querySelector('.sec-content')
    return _el === content || _el.classList?.contains('sec-content')
  }

  function _renderAnimTab(body) {
    if (!_el) { body.innerHTML = '<div class="ins-empty">Select an element to animate</div>'; return }
    const AE  = _getAE()
    if (!AE)  { body.innerHTML = '<div class="ins-empty">AnimationEngine not loaded</div>'; return }

    const isSec   = _isSecTarget()
    const st      = AE.getState(_el)
    const presets = AE.PRESETS
    const easings = AE.EASINGS

    // Target label for the header
    const targetLabel = isSec
      ? `<div class="ins-anim-target-badge ins-anim-target-sec">⬡ Section</div>`
      : `<div class="ins-anim-target-badge ins-anim-target-el">◈ Element</div>`

    // "Animate Section" shortcut (only when an element is selected, not section itself)
    const secBtn = !isSec && _ctx?.sectionId ? `
      <button class="ins-anim-sec-btn" onclick="Inspector._switchToSectionTarget()" title="Switch to animating the entire section">
        ⬡ Animate Whole Section
      </button>` : ''

    body.innerHTML = `
      <div class="ins-anim-wrap">
        <div class="ins-anim-target-row">${targetLabel}${secBtn}</div>
        <div class="ins-anim-section">
          <div class="ins-anim-label">Animation</div>
          <div class="ins-anim-grid">
            ${presets.map(p => `
              <div class="ins-anim-chip${st.preset===p.id?' ins-anim-chip-active':''}"
                   data-anim="${p.id}" onclick="Inspector._pickAnim('${p.id}')">
                ${p.label}
              </div>`).join('')}
          </div>
        </div>
        <div class="ins-anim-row">
          <div class="ins-anim-section">
            <div class="ins-anim-label">Duration (s)</div>
            <select class="ins-anim-sel" onchange="Inspector._setAnimProp('dur',parseFloat(this.value))">
              ${AE.DURATIONS.map(d=>`<option value="${d}"${st.dur===d?' selected':''}>${d}s</option>`).join('')}
            </select>
          </div>
          <div class="ins-anim-section">
            <div class="ins-anim-label">Delay (s)</div>
            <select class="ins-anim-sel" onchange="Inspector._setAnimProp('delay',parseFloat(this.value))">
              ${AE.DELAYS.map(d=>`<option value="${d}"${st.delay===d?' selected':''}>${d}s</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="ins-anim-section">
          <div class="ins-anim-label">Easing</div>
          <select class="ins-anim-sel" onchange="Inspector._setAnimProp('ease',this.value)">
            ${easings.map(e=>`<option value="${e.id}"${st.ease===e.id?' selected':''}>${e.label}</option>`).join('')}
          </select>
        </div>
        <div class="ins-anim-section">
          <div class="ins-anim-label">Repeat</div>
          <select class="ins-anim-sel" onchange="Inspector._setAnimProp('repeat',this.value)">
            ${['1','2','3','infinite'].map(r=>`<option${st.repeat===r?' selected':''}>${r}</option>`).join('')}
          </select>
        </div>
        <button class="ins-anim-preview-btn" onclick="Inspector._previewAnim()">▶ Preview Animation</button>
      </div>`
  }

  // Switch animation target to the full section's .sec-content
  function _switchToSectionTarget() {
    if (!_ctx?.sectionId) return
    const wrapper = document.querySelector(`.section-wrapper[data-id="${_ctx.sectionId}"]`)
    const content = wrapper?.querySelector('.sec-content')
    if (!content) return
    _el       = content
    _computed = window.getComputedStyle(content)
    // Update header info
    const tagEl = document.getElementById('ins-el-tag')
    const idEl  = document.getElementById('ins-el-id')
    if (tagEl) tagEl.textContent = '<section>'
    if (idEl)  idEl.textContent  = '#section'
    _renderModules()
  }

  function _pickAnim(presetId) {
    if (!_el) return
    const AE = _getAE(); if (!AE) return
    const st  = AE.getState(_el)
    const cfg = { preset: presetId, dur: st.dur, delay: st.delay, ease: st.ease, repeat: st.repeat }
    AE.apply(_el, cfg, _ctx?.sectionId)
    // Sync chip highlight
    document.querySelectorAll('.ins-anim-chip').forEach(ch =>
      ch.classList.toggle('ins-anim-chip-active', ch.dataset.anim === presetId)
    )
    if (typeof pushH === 'function') pushH('Animation: ' + presetId, false)
  }

  function _setAnimProp(key, value) {
    if (!_el) return
    const AE = _getAE(); if (!AE) return
    const st  = AE.getState(_el)
    const cfg = { ...st, [key]: value }
    AE.apply(_el, cfg, _ctx?.sectionId)
  }

  function _previewAnim() {
    const AE = _getAE(); if (!AE || !_el) return
    AE.previewOnce(_el)
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
    // Show/hide custom-layout banner
    _updateCustomBanner()
    // Re-render and re-bind all modules
    _renderModules()
  }

  function _updateCustomBanner() {
    let banner = _panel?.querySelector('#ins-custom-banner')
    const sec = _ctx?.sectionId && typeof S !== 'undefined'
      ? S.sections.find(s => s.id === _ctx.sectionId) : null
    const hasCustom = !!sec?.props?._customHtml
    if (!hasCustom) { if (banner) banner.remove(); return }
    if (!banner) {
      banner = document.createElement('div')
      banner.id = 'ins-custom-banner'
      banner.style.cssText = 'background:rgba(251,191,36,.12);border-bottom:1px solid rgba(251,191,36,.3);' +
        'padding:5px 10px;font-size:10px;color:#fbbf24;display:flex;justify-content:space-between;align-items:center'
      banner.innerHTML = '<span>⚡ Custom Layout</span>' +
        '<button onclick="Inspector._resetCustomLayout()" style="background:rgba(251,191,36,.2);' +
        'border:none;color:#fbbf24;cursor:pointer;padding:2px 6px;border-radius:3px;font-size:10px">Reset Template</button>'
      _panel.insertBefore(banner, _panel.querySelector('.ins-tabs'))
    }
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

  // ── Click-to-inspect: click any canvas element to open Inspector ───────
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('sections-root') || document.getElementById('canvas-frame')
    if (!root) return
    root.addEventListener('click', ev => {
      // Only in edit mode
      if (typeof S !== 'undefined' && S.mode !== 'edit') return
      // Skip builder UI overlays
      if (ev.target.closest('.section-controls, .section-label, .drop-line, .anim-badge, .cms-bind-badge, .vi-bar, .aid-panel, .mf-panel')) return
      // Must be inside .sec-content (the actual section content, not wrappers)
      const content = ev.target.closest('.sec-content')
      if (!content) return
      // Find best target: prefer element with data-pc-id, else use the clicked el
      const target = ev.target.closest('[data-pc-id]') || ev.target
      // If no data-pc-id child found, fall through to sec-content for section-level targeting
      const ctx = typeof PropertyBridge !== 'undefined' ? PropertyBridge.raycast(target) : null
      select(target, ctx)
    }, { capture: false })
  })

  function _resetCustomLayout() {
    const sec = _ctx?.sectionId && typeof S !== 'undefined'
      ? S.sections.find(s => s.id === _ctx.sectionId) : null
    if (!sec) return
    delete sec.props._customHtml
    if (typeof RenderEngine !== 'undefined') RenderEngine.invalidate(sec.id)
    if (typeof renderCanvas === 'function') renderCanvas()
    if (typeof scheduleAutoSave === 'function') scheduleAutoSave()
    _panel?.querySelector('#ins-custom-banner')?.remove()
    toast('Layout reset to template ✓', '🔄')
  }

  return {
    select, deselect, open, close, activatePicker,
    applyStyle, restoreSection,
    registerModule, getEl, getComputed, getCtx, isInherited, parseVal, makeDraggable,
    _toggleModule, _switchTab,
    _pickAnim, _setAnimProp, _previewAnim, _switchToSectionTarget,
    _resetCustomLayout,
  }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.Inspector = Inspector
