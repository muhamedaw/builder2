/* property-bridge.js — Stage 1.3: Property Bridge API
   Single authoritative entry-point for all prop mutations.
   Used by AI, keyboard shortcuts, VisualInspector, and external tools.
   Translates natural commands → JSON updates → DOM patches. */

const PropertyBridge = (() => {
  'use strict'

  const _listeners = []   // change subscribers

  // ── Core mutators ─────────────────────────────────────────────────────────

  // Update a single prop: updateProp('sc_001', 'headline', 'New Text')
  function update(sectionId, key, value, pushHistory = true) {
    const sec = _getSection(sectionId)
    if (!sec) return false

    const prev = sec.props[key]
    if (prev === value) return false

    sec.props[key] = value
    RenderEngine.invalidate(sectionId)
    renderAll('props')

    if (pushHistory) pushH(`Edit: ${key}`)
    if (typeof Collab !== 'undefined') Collab.emitSectionUpdate(sectionId, key, value)

    _notify({ sectionId, key, value, prev, type: 'update' })
    return true
  }

  // Patch multiple props at once: patch('sc_001', { bgColor: '#000', headline: 'Hi' })
  function patch(sectionId, props, pushHistory = true) {
    const sec = _getSection(sectionId)
    if (!sec || !props || !Object.keys(props).length) return false

    const prev = { ...sec.props }
    Object.assign(sec.props, props)
    RenderEngine.invalidate(sectionId)
    renderAll('props')

    if (pushHistory) pushH(`Patch: ${Object.keys(props).join(', ')}`)
    if (typeof Collab !== 'undefined') Collab.emitSectionPatch(sectionId, props)

    _notify({ sectionId, props, prev, type: 'patch' })
    return true
  }

  // Read a prop value
  function get(sectionId, key) {
    const sec = _getSection(sectionId)
    return sec ? (key ? sec.props[key] : { ...sec.props }) : null
  }

  // ── Natural language command dispatcher ───────────────────────────────────
  // Routes a text command to the appropriate section via VisualInspector
  function cmd(sectionId, nlText) {
    const sec = _getSection(sectionId)
    if (!sec) return Promise.resolve('Section not found')

    if (typeof VisualInspector === 'undefined') {
      return Promise.resolve('VisualInspector not loaded')
    }

    // Temporarily pin the inspector to this section and fire the command
    VisualInspector.show(sectionId)
    return VisualInspector._execCmd(nlText, sec)
  }

  // ── AI Raycasting context builder (Stage 2.1) ─────────────────────────────
  // Returns a rich context object about a DOM element for AI prompts.
  function raycast(el) {
    if (!el) return null

    const computed  = window.getComputedStyle(el)
    const rect      = el.getBoundingClientRect()
    const wrapper   = el.closest('.section-wrapper')
    const sectionId = wrapper?.dataset?.id || null
    const sec       = sectionId ? _getSection(sectionId) : null

    // Parent constraints
    const parent = el.parentElement
    const parentComputed = parent ? window.getComputedStyle(parent) : null

    return {
      // Identity
      tag:       el.tagName.toLowerCase(),
      pcId:      el.dataset?.pcId   || null,
      sectionId: sectionId,
      intent:    wrapper?.dataset?.intent || null,
      type:      sec?.type || null,

      // Geometry
      rect: { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) },

      // Key computed styles
      styles: {
        color:          computed.color,
        background:     computed.backgroundColor,
        fontSize:       computed.fontSize,
        fontWeight:     computed.fontWeight,
        fontFamily:     computed.fontFamily,
        textAlign:      computed.textAlign,
        display:        computed.display,
        flexDirection:  computed.flexDirection,
        padding:        computed.padding,
        margin:         computed.margin,
        borderRadius:   computed.borderRadius,
        opacity:        computed.opacity,
        position:       computed.position,
      },

      // Parent constraints
      parent: parentComputed ? {
        display:       parentComputed.display,
        flexDirection: parentComputed.flexDirection,
        gridTemplate:  parentComputed.gridTemplateColumns,
        width:         parentComputed.width,
        overflow:      parentComputed.overflow,
      } : null,

      // Content
      text:   el.innerText?.slice(0, 120) || null,
      src:    el.src  || el.style.backgroundImage || null,
      href:   el.href || null,

      // Section props snapshot
      props: sec ? { ...sec.props } : null,
    }
  }

  // ── Subscribe to prop changes ─────────────────────────────────────────────
  function subscribe(fn) {
    _listeners.push(fn)
    return () => { const i = _listeners.indexOf(fn); if (i > -1) _listeners.splice(i, 1) }
  }

  function _notify(event) {
    _listeners.forEach(fn => { try { fn(event) } catch (_) {} })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _getSection(id) {
    return (typeof S !== 'undefined') ? S.sections.find(s => s.id === id) : null
  }

  // ── Batch from showcase-components intent scan (Stage 1.1) ───────────────
  // Call once at startup to pre-index components by intent from JSON
  const _intentIndex = new Map()   // intent keyword → [component ids]

  function indexComponents(components) {
    if (!Array.isArray(components)) return
    components.forEach(c => {
      const intent = (c.sectionType || '').toLowerCase()
      if (!_intentIndex.has(intent)) _intentIndex.set(intent, [])
      _intentIndex.get(intent).push(c.id)
    })
  }

  function findByIntent(keyword) {
    const lower = keyword.toLowerCase()
    const results = []
    _intentIndex.forEach((ids, intent) => {
      if (intent.includes(lower)) ids.forEach(id => results.push(id))
    })
    return results
  }

  return { update, patch, get, cmd, raycast, subscribe, indexComponents, findByIntent }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.PropertyBridge = PropertyBridge
