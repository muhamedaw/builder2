/* smart-layers.js — Webflow-grade element drag & cross-section move
   Activation: hover any element in edit mode → drag handle appears (top-left corner)
   Dragging the handle: moves element within or between sections using natural DOM flow.
   Flex/Grid aware — inserts in flow order, never uses position:absolute.
   Navigator syncs in real-time during drag. */

const SmartLayers = (() => {
  'use strict'

  // ── State ─────────────────────────────────────────────────────────────────
  let _dragEl     = null   // element being moved
  let _ghost      = null   // translucent clone following cursor
  let _line       = null   // blue insertion indicator
  let _handle     = null   // hover handle button
  let _hoverEl    = null   // element currently hovered
  let _dropInfo   = null   // { parent, before } resolved drop target
  let _dragging   = false
  let _startX     = 0
  let _startY     = 0
  let _navTick    = 0      // throttle for navigator refresh

  const THRESHOLD  = 6     // px movement before drag activates
  const NAV_MS     = 120   // ms between navigator refreshes during drag

  // Skip builder UI overlays
  const SKIP_CLS = [
    'section-controls','section-label','drop-line','img-overlay',
    'grid-overlay','anim-badge','cms-bind-badge','vi-bar',
    'sl-handle','sl-line','sl-ghost',
  ]

  function _skip(el) {
    if (!el || el.nodeType !== 1) return true
    return SKIP_CLS.some(c => el.classList?.contains(c))
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    const canvas = document.getElementById('sections-root') || document.getElementById('canvas-frame')
    if (!canvas) return
    canvas.addEventListener('mouseover', _onHover)
    canvas.addEventListener('mouseout',  _onHoverOut)
  }

  // ── Hover handle ─────────────────────────────────────────────────────────
  function _onHover(ev) {
    if (typeof S !== 'undefined' && S.mode !== 'edit') return
    if (_dragging) return
    const el = ev.target.closest('[data-pc-id]')
    if (!el || _skip(el)) return
    if (el === _hoverEl) return
    _hoverEl = el
    _showHandle(el)
  }

  function _onHoverOut(ev) {
    if (_dragging) return
    const rel = ev.relatedTarget
    if (rel && (rel === _handle || _handle?.contains(rel))) return
    _hideHandle()
    _hoverEl = null
  }

  function _showHandle(el) {
    if (!_handle) {
      _handle = document.createElement('div')
      _handle.className = 'sl-handle'
      _handle.title = 'Drag to move (Smart Layers)'
      _handle.innerHTML = '⠿'
      _handle.addEventListener('mousedown', _onHandleDown)
      _handle.addEventListener('mouseleave', ev => {
        if (!_dragging && ev.relatedTarget !== _hoverEl) {
          _hideHandle(); _hoverEl = null
        }
      })
      document.body.appendChild(_handle)
    }
    const rect = el.getBoundingClientRect()
    _handle.style.left = `${rect.left + window.scrollX}px`
    _handle.style.top  = `${rect.top  + window.scrollY}px`
    _handle.style.display = ''
    _handle._target = el
  }

  function _hideHandle() {
    if (_handle) _handle.style.display = 'none'
  }

  // ── Drag start (from handle) ──────────────────────────────────────────────
  function _onHandleDown(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    _dragEl  = _handle._target
    _startX  = ev.clientX
    _startY  = ev.clientY
    _hideHandle()
    document.addEventListener('mousemove', _onMove)
    document.addEventListener('mouseup',   _onUp, { once: true })
  }

  // ── Mouse move ────────────────────────────────────────────────────────────
  function _onMove(ev) {
    if (!_dragEl) return
    const dx = ev.clientX - _startX
    const dy = ev.clientY - _startY
    if (!_dragging && Math.hypot(dx, dy) < THRESHOLD) return
    if (!_dragging) _activateDrag(ev)
    _trackDrag(ev)
  }

  function _activateDrag(ev) {
    _dragging = true

    // Ghost clone
    _ghost = _dragEl.cloneNode(true)
    _ghost.className += ' sl-ghost'
    _ghost.removeAttribute('data-pc-id')
    _ghost.style.cssText = [
      'position:fixed',
      `width:${_dragEl.offsetWidth}px`,
      'opacity:.55',
      'pointer-events:none',
      'z-index:99999',
      'border-radius:6px',
      'box-shadow:0 8px 32px rgba(0,0,0,.45)',
      'transition:none',
    ].join(';')
    document.body.appendChild(_ghost)

    // Dim source
    _dragEl.style.opacity = '0.25'
    _dragEl.style.pointerEvents = 'none'

    // Insertion line
    _line = document.createElement('div')
    _line.className = 'sl-line'
    _line.style.cssText = [
      'position:fixed',
      'z-index:99998',
      'pointer-events:none',
      'background:#3b82f6',
      'border-radius:3px',
      'box-shadow:0 0 0 2px rgba(59,130,246,.3)',
      'display:none',
    ].join(';')
    document.body.appendChild(_line)
  }

  // ── Track drag position ───────────────────────────────────────────────────
  function _trackDrag(ev) {
    // Move ghost
    if (_ghost) {
      _ghost.style.left = `${ev.clientX - _dragEl.offsetWidth / 2}px`
      _ghost.style.top  = `${ev.clientY - 24}px`
    }

    // Temporarily hide source so elementFromPoint works underneath it
    _dragEl.style.display = 'none'
    const under = document.elementFromPoint(ev.clientX, ev.clientY)
    _dragEl.style.display = ''

    if (!under) { _hideLine(); _dropInfo = null; return }

    // Find the best drop parent: prefer direct sec-content child, then any container
    const secContent = under.closest('.sec-content')
    if (!secContent) { _hideLine(); _dropInfo = null; return }

    // Walk up from hovered element to find a suitable parent container
    let dropParent = under
    while (dropParent && dropParent !== secContent) {
      // A container is: a block/flex/grid parent that has multiple children
      const s = window.getComputedStyle(dropParent)
      const d = s.display
      if (d === 'block' || d === 'flex' || d === 'grid' || d === 'inline-block') {
        if (dropParent.children.length > 0) break
      }
      dropParent = dropParent.parentElement
    }
    if (!dropParent || dropParent === _dragEl) { _hideLine(); _dropInfo = null; return }

    // Siblings (excluding dragged element)
    const siblings = [...dropParent.children].filter(c => c !== _dragEl && !_skip(c))

    // Compute layout axis
    const ps = window.getComputedStyle(dropParent)
    const isFlexRow = ps.display === 'flex' && ps.flexDirection !== 'column' && ps.flexDirection !== 'column-reverse'

    let insertBefore = null

    if (isFlexRow) {
      // Vertical line between flex items
      let best = Infinity
      for (const sib of siblings) {
        const r = sib.getBoundingClientRect()
        const d = Math.abs(ev.clientX - r.left)
        if (d < best) { best = d; insertBefore = sib }
      }
      const refR = insertBefore
        ? insertBefore.getBoundingClientRect()
        : siblings.length ? siblings[siblings.length - 1].getBoundingClientRect() : null
      if (refR) {
        const lx = insertBefore ? refR.left - 2 : refR.right + 2
        _showLine(lx, refR.top - 4, 3, refR.height + 8)
      }
    } else {
      // Horizontal line between block/flex-col items
      let best = Infinity
      for (const sib of siblings) {
        const r = sib.getBoundingClientRect()
        const d = Math.abs(ev.clientY - r.top)
        if (d < best) { best = d; insertBefore = sib }
      }
      const refR = insertBefore
        ? insertBefore.getBoundingClientRect()
        : siblings.length ? siblings[siblings.length - 1].getBoundingClientRect() : null
      if (refR) {
        const ly = insertBefore ? refR.top - 2 : refR.bottom + 2
        _showLine(refR.left, ly, refR.width, 3)
      }
    }

    _dropInfo = { parent: dropParent, before: insertBefore }

    // Navigator real-time sync (throttled)
    const now = performance.now()
    if (now - _navTick > NAV_MS && typeof Navigator !== 'undefined') {
      _navTick = now
      Navigator.refresh()
    }
  }

  function _showLine(x, y, w, h) {
    if (!_line) return
    _line.style.left    = `${x}px`
    _line.style.top     = `${y}px`
    _line.style.width   = `${w}px`
    _line.style.height  = `${h}px`
    _line.style.display = ''
  }

  function _hideLine() {
    if (_line) _line.style.display = 'none'
  }

  // ── Drop ──────────────────────────────────────────────────────────────────
  function _onUp() {
    document.removeEventListener('mousemove', _onMove)

    if (!_dragging || !_dropInfo || !_dragEl) {
      _cleanup()
      return
    }

    const { parent, before } = _dropInfo

    // Record source section before DOM change
    const srcWrapper = _dragEl.closest('.section-wrapper')

    // DOM re-parent
    if (before) {
      parent.insertBefore(_dragEl, before)
    } else {
      parent.appendChild(_dragEl)
    }

    // Restore element visibility
    _dragEl.style.opacity = ''
    _dragEl.style.pointerEvents = ''

    // Save both affected sections
    const tgtWrapper = _dragEl.closest('.section-wrapper')
    _saveSection(srcWrapper?.dataset?.id)
    if (tgtWrapper && tgtWrapper !== srcWrapper) _saveSection(tgtWrapper.dataset.id)

    // State.reorder hook (extensible)
    State.reorder(
      _dragEl.dataset?.pcId || '',
      parent.dataset?.pcId  || '',
      before?.dataset?.pcId || ''
    )

    // Push undo history
    if (typeof pushH === 'function') {
      pushH('Smart Move: ' + _dragEl.tagName.toLowerCase())
    }

    // Navigator final sync
    if (typeof Navigator !== 'undefined') {
      setTimeout(() => Navigator.refresh(), 30)
    }

    toast('Element moved ✓', '🌀')
    _cleanup()
  }

  // ── Save section DOM as custom HTML override ───────────────────────────────
  function _saveSection(secId) {
    if (!secId) return
    const sec = (typeof S !== 'undefined') ? S.sections.find(s => s.id === secId) : null
    if (!sec) return
    const content = document.querySelector(`.section-wrapper[data-id="${secId}"] .sec-content`)
    if (!content) return
    sec.props._customHtml = _cleanHtml(content.innerHTML)
    if (typeof scheduleAutoSave === 'function') scheduleAutoSave()
  }

  // ── Strip builder-only markup before saving ────────────────────────────────
  function _cleanHtml(raw) {
    const tmp = document.createElement('div')
    tmp.innerHTML = raw
    // Remove builder UI overlays that don't belong in the output
    tmp.querySelectorAll('.img-overlay, .anim-badge, .cms-bind-badge, .vi-bar, .grid-overlay').forEach(n => n.remove())
    // Remove builder attributes but KEEP data-pc-id (needed for Inspector _elStyles)
    tmp.querySelectorAll('[contenteditable]').forEach(n => n.removeAttribute('contenteditable'))
    tmp.querySelectorAll('[data-id]').forEach(n => n.removeAttribute('data-id'))
    tmp.querySelectorAll('[data-key]').forEach(n => n.removeAttribute('data-key'))
    return tmp.innerHTML
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  function _cleanup() {
    if (_ghost)  { _ghost.remove();  _ghost  = null }
    if (_line)   { _line.remove();   _line   = null }
    if (_dragEl) {
      _dragEl.style.opacity       = ''
      _dragEl.style.pointerEvents = ''
      _dragEl.style.display       = ''
    }
    _dragEl   = null
    _dropInfo = null
    _dragging = false
    _hoverEl  = null
  }

  return { init }
})()

// ── State.reorder — JSON state hook ──────────────────────────────────────────
// Called after every Smart Move. Extend this to sync with a backend.
const State = {
  reorder(elementPcId, newParentPcId, beforePcId) {
    // DOM + sec.props._customHtml already updated by _saveSection().
    // This hook exists for future backend sync / analytics.
    if (typeof scheduleAutoSave === 'function') scheduleAutoSave()
  }
}

// ── Auto-init after DOM ready ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => SmartLayers.init())
