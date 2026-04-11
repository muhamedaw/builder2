/* navigator.js — Webflow-Style DOM Navigator
   Recursive tree view of the canvas DOM.
   Bi-directional sync with Inspector + canvas elements.
   Drag & drop to reorder sibling elements. */

const Navigator = (() => {
  'use strict'

  // ── State ─────────────────────────────────────────────────────────────────
  let _activeEl   = null          // currently selected DOM element
  let _collapsed  = new Set()     // pathIds that are collapsed
  let _secCollapsed = new Set()   // section IDs that are collapsed
  let _elMap      = new Map()     // pathId → DOM element (rebuilt on scan)
  let _scanning   = false
  let _dragSrc    = null          // dragged element

  // ── Icon mapping ──────────────────────────────────────────────────────────
  const ICONS = {
    section:'⬛', header:'▭', footer:'▭', nav:'☰', main:'⊞', aside:'📌',
    article:'📄', figure:'🖼', div:'◻',
    h1:'H1', h2:'H2', h3:'H3', h4:'H4', h5:'H5', h6:'H6',
    p:'¶', span:'‹›', a:'⬡', strong:'𝐁', em:'𝐼', blockquote:'❝', small:'ₐ',
    img:'🖼', video:'▶', iframe:'⬚', canvas:'🎨',
    button:'◉', input:'▭', textarea:'▤', select:'▽', form:'📋', label:'🏷',
    ul:'≡', ol:'①', li:'•',
    table:'⊞', tr:'—', td:'□', th:'▣',
  }

  // Tags/classes to skip — builder UI noise
  const SKIP_TAGS   = new Set(['script','style','noscript','template','path','circle','g','defs','use','symbol','linearGradient'])
  const SKIP_CLASSES = ['section-controls','section-label','drop-line','img-overlay','anim-badge','cms-bind-badge','vi-bar','mt-overlay','aid-panel','mf-panel']
  const GENERIC_CLS  = new Set(['active','selected','hidden','show','flex','grid','row','col','wrap','inner','outer','container'])

  function _shouldSkip(el) {
    if (!el || el.nodeType !== 1) return true
    const tag = el.tagName.toLowerCase()
    if (SKIP_TAGS.has(tag)) return true
    if (SKIP_CLASSES.some(c => el.classList?.contains(c))) return true
    if (el.style?.display === 'none' && !el.dataset?.pcId) return true
    return false
  }

  // ── Label generator ───────────────────────────────────────────────────────
  function _getLabel(el) {
    // 1. data-pc-id → tag:N
    if (el.dataset.pcId) {
      const p = el.dataset.pcId.split(':')
      return `${p[1] || el.tagName.toLowerCase()} ${p[2] || ''}`
    }
    // 2. Meaningful class name
    const cls = [...(el.classList || [])].find(c =>
      !GENERIC_CLS.has(c) && c.length > 1 && c.length < 32 && !/^\d/.test(c)
    )
    if (cls) return cls.replace(/-/g, ' ')
    // 3. Text content preview
    const txt = el.innerText?.trim().replace(/\s+/g, ' ').slice(0, 28)
    if (txt) return txt
    return el.tagName.toLowerCase()
  }

  // ── Path ID — stable positional key ──────────────────────────────────────
  function _pathId(el) {
    const root = document.getElementById('canvas-frame')
    const parts = []
    let cur = el
    while (cur && cur !== root && cur !== document.body) {
      const parent = cur.parentElement
      if (!parent) break
      const idx = [...parent.children].indexOf(cur)
      parts.unshift(`${cur.tagName.toLowerCase()}${idx}`)
      cur = parent
    }
    return parts.join('.')
  }

  // ── Recursive tree HTML ───────────────────────────────────────────────────
  function _renderNode(el, depth) {
    if (_shouldSkip(el)) return ''
    const children = [...el.children].filter(c => !_shouldSkip(c))
    const hasKids   = children.length > 0
    const pid       = _pathId(el)
    const isActive  = el === _activeEl
    const isColl    = _collapsed.has(pid)
    const tag       = el.tagName.toLowerCase()
    const icon      = ICONS[tag] || '◻'
    const label     = _getLabel(el)
    const pcId      = el.dataset.pcId || ''
    const pid_esc   = _esc(pid)

    // Register in lookup map
    _elMap.set(pid, el)

    return `
      <div class="nav-node${isActive ? ' nav-active' : ''}"
           data-pid="${pid_esc}"
           data-depth="${depth}"
           draggable="true"
           ondragstart="Navigator._dragStart(event,'${pid_esc}')"
           ondragover="Navigator._dragOver(event,'${pid_esc}')"
           ondragleave="Navigator._dragLeave(event)"
           ondrop="Navigator._drop(event,'${pid_esc}')">
        <div class="nav-row"
             style="padding-left:${8 + depth * 14}px"
             onmouseenter="Navigator._hoverOn('${pid_esc}')"
             onmouseleave="Navigator._hoverOff('${pid_esc}')"
             onclick="Navigator._select('${pid_esc}')">
          ${hasKids
            ? `<button class="nav-arrow${isColl ? '' : ' open'}"
                 onclick="event.stopPropagation();Navigator._toggle('${pid_esc}')">▶</button>`
            : `<span class="nav-leaf"></span>`}
          <span class="nav-icon">${icon}</span>
          <span class="nav-label" title="${_esc(label)}">${_esc(label)}</span>
          <span class="nav-tag">&lt;${tag}&gt;</span>
        </div>
        ${hasKids && !isColl
          ? `<div class="nav-children">${children.map(c => _renderNode(c, depth + 1)).join('')}</div>`
          : ''}
      </div>`
  }

  // ── Build full tree ───────────────────────────────────────────────────────
  function _buildTree() {
    _elMap.clear()
    const frame = document.getElementById('canvas-frame')
    if (!frame) return '<div class="nav-empty">Canvas not ready</div>'

    const wrappers = [...frame.querySelectorAll(':scope > .section-wrapper')]
    if (!wrappers.length) return '<div class="nav-empty">No sections yet — add one to start</div>'

    return wrappers.map(wrapper => {
      const secId   = wrapper.dataset.id
      const secType = wrapper.dataset.type || secId?.slice(0,8) || '?'
      const content = wrapper.querySelector('.sec-content')
      if (!content) return ''

      const isColl = _secCollapsed.has(secId)
      const children = [...content.children].filter(c => !_shouldSkip(c))

      return `
        <div class="nav-section" data-sec-id="${secId}">
          <div class="nav-sec-header" onclick="Navigator._toggleSec('${secId}')">
            <span class="nav-sec-icon">⬛</span>
            <span class="nav-sec-label">${secType}</span>
            <span class="nav-sec-count">${children.length}</span>
            <span class="nav-sec-caret${isColl ? '' : ' open'}">▶</span>
          </div>
          ${!isColl
            ? `<div class="nav-sec-body">${children.map(c => _renderNode(c, 0)).join('')}</div>`
            : ''}
        </div>`
    }).join('')
  }

  // ── Render into panel ─────────────────────────────────────────────────────
  function refresh() {
    const panel = document.getElementById('nav-tree')
    if (!panel) return
    if (_scanning) return
    _scanning = true
    panel.innerHTML = _buildTree()
    _scanning = false
  }

  // ── Interactions ──────────────────────────────────────────────────────────

  function _select(pid) {
    const el = _elMap.get(pid)
    if (!el) return
    _activeEl = el
    // Highlight nav item
    document.querySelectorAll('.nav-node.nav-active').forEach(n => n.classList.remove('nav-active'))
    document.querySelector(`.nav-node[data-pid="${CSS.escape(pid)}"]`)?.classList.add('nav-active')
    // Open Inspector with raycast context
    if (typeof Inspector !== 'undefined') {
      const ctx = typeof PropertyBridge !== 'undefined' ? PropertyBridge.raycast(el) : null
      Inspector.select(el, ctx)
    }
    // Scroll element into view on canvas
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function _toggle(pid) {
    _collapsed.has(pid) ? _collapsed.delete(pid) : _collapsed.add(pid)
    refresh()
  }

  function _toggleSec(secId) {
    _secCollapsed.has(secId) ? _secCollapsed.delete(secId) : _secCollapsed.add(secId)
    refresh()
  }

  // ── Hover: blue outline on canvas element ─────────────────────────────────
  let _hoverTimeout = null

  function _hoverOn(pid) {
    clearTimeout(_hoverTimeout)
    const el = _elMap.get(pid)
    if (!el) return
    el.classList.add('nav-canvas-hover')
  }

  function _hoverOff(pid) {
    const el = _elMap.get(pid)
    if (el) el.classList.remove('nav-canvas-hover')
  }

  // ── Canvas → Navigator sync ───────────────────────────────────────────────
  // When user clicks an element in the canvas, find it in the tree
  function _syncFromCanvas(el) {
    if (!el) return
    const pid = _pathId(el)
    _activeEl = el

    // Expand parents
    let cur = el.parentElement
    const frame = document.getElementById('canvas-frame')
    while (cur && cur !== frame) {
      const parentPid = _pathId(cur)
      _collapsed.delete(parentPid)

      // Expand the section group too
      const wrapper = cur.closest('.section-wrapper')
      if (wrapper?.dataset?.id) _secCollapsed.delete(wrapper.dataset.id)

      cur = cur.parentElement
    }

    refresh()

    // Scroll nav item into view
    setTimeout(() => {
      const navItem = document.querySelector(`.nav-node[data-pid="${CSS.escape(pid)}"]`)
      navItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  function _dragStart(ev, pid) {
    _dragSrc = _elMap.get(pid)
    ev.dataTransfer.effectAllowed = 'move'
    ev.dataTransfer.setData('text/plain', pid)
    ev.currentTarget.classList.add('nav-dragging')
  }

  function _dragOver(ev, pid) {
    ev.preventDefault()
    ev.dataTransfer.dropEffect = 'move'
    document.querySelectorAll('.nav-drop-over').forEach(n => n.classList.remove('nav-drop-over'))
    const target = _elMap.get(pid)
    if (target && target !== _dragSrc) {
      ev.currentTarget.classList.add('nav-drop-over')
    }
  }

  function _dragLeave(ev) {
    ev.currentTarget.classList.remove('nav-drop-over')
  }

  function _drop(ev, pid) {
    ev.preventDefault()
    document.querySelectorAll('.nav-dragging, .nav-drop-over').forEach(n => {
      n.classList.remove('nav-dragging', 'nav-drop-over')
    })
    if (!_dragSrc) return
    const targetEl = _elMap.get(pid)
    if (!targetEl || targetEl === _dragSrc) return
    // Only reorder siblings
    if (_dragSrc.parentElement !== targetEl.parentElement) {
      toast('Can only reorder siblings', '⚠️')
      return
    }
    // Move before target
    targetEl.parentElement.insertBefore(_dragSrc, targetEl)
    refresh()
    if (typeof pushH === 'function') pushH('Navigator: reorder element')
    toast('Element moved ✓', '🌳')
    _dragSrc = null
  }

  // ── Expand path to a specific element ────────────────────────────────────
  function expandTo(el) {
    let cur = el?.parentElement
    const frame = document.getElementById('canvas-frame')
    while (cur && cur !== frame) {
      const pid = _pathId(cur)
      _collapsed.delete(pid)
      const wrapper = cur.closest('.section-wrapper')
      if (wrapper?.dataset?.id) _secCollapsed.delete(wrapper.dataset.id)
      cur = cur.parentElement
    }
  }

  // ── Escape helper ─────────────────────────────────────────────────────────
  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  // ── Init: attach canvas click listener ───────────────────────────────────
  function init() {
    // Canvas → Navigator: click on any element with data-pc-id
    const frame = document.getElementById('canvas-frame')
    if (frame) {
      frame.addEventListener('click', ev => {
        if (S?.mode !== 'edit') return
        const el = ev.target.closest('[data-pc-id]')
        if (!el) return
        // Only sync when Navigator tab is active
        const navPanel = document.getElementById('tab-navigator')
        if (!navPanel?.classList.contains('active')) return
        ev.stopPropagation()
        _syncFromCanvas(el)
      }, true)
    }
  }

  // ── Inject canvas hover CSS once ─────────────────────────────────────────
  const _hoverCSS = document.createElement('style')
  _hoverCSS.textContent = `.nav-canvas-hover{outline:2px solid #3b82f6 !important;outline-offset:2px !important;}`
  document.head.appendChild(_hoverCSS)

  return {
    refresh, init, expandTo,
    _select, _toggle, _toggleSec,
    _hoverOn, _hoverOff,
    _dragStart, _dragOver, _dragLeave, _drop,
  }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.Navigator = Navigator

// Init after DOM ready
document.addEventListener('DOMContentLoaded', () => Navigator.init())
