/* micro-target.js — Stage 2.1: Micro-Targeting API
   Element picker: hover to highlight any element inside the canvas.
   Word-level styling: wraps selected / matched text in <span> with inline style.
   Exposed as window.MicroTarget for use by VisualInspector + AI chat. */

const MicroTarget = (() => {
  'use strict'

  let _active    = false   // picker mode on/off
  let _hovered   = null    // currently highlighted el
  let _picked    = null    // last confirmed pick
  let _overlay   = null    // highlight overlay div
  let _onPick    = null    // callback(el, sectionId, path)
  let _rafId     = null

  // ── Overlay ───────────────────────────────────────────────────────────────
  function _ensureOverlay() {
    if (_overlay) return
    _overlay = document.createElement('div')
    _overlay.id = 'mt-overlay'
    _overlay.className = 'mt-overlay'
    document.body.appendChild(_overlay)
  }

  function _positionOverlay(el) {
    if (!_overlay || !el) { _hideOverlay(); return }
    const r = el.getBoundingClientRect()
    _overlay.style.cssText =
      `top:${r.top + window.scrollY}px;left:${r.left + window.scrollX}px;` +
      `width:${r.width}px;height:${r.height}px;display:block`
    // Label: tag + text preview
    const preview = (el.innerText || el.tagName.toLowerCase()).slice(0, 28)
    _overlay.setAttribute('data-label', `<${el.tagName.toLowerCase()}> ${preview}`)
  }

  function _hideOverlay() {
    if (_overlay) _overlay.style.display = 'none'
  }

  // ── Pointer tracking ──────────────────────────────────────────────────────
  function _onPointerMove(ev) {
    if (!_active) return
    // Find deepest element inside .canvas-frame that is not the overlay itself
    const frame = document.getElementById('canvas-frame')
    if (!frame) return

    // Temporarily hide overlay so elementFromPoint sees through it
    if (_overlay) _overlay.style.pointerEvents = 'none'
    const target = document.elementFromPoint(ev.clientX, ev.clientY)
    if (_overlay) _overlay.style.pointerEvents = ''

    if (!target || !frame.contains(target)) { _hideOverlay(); _hovered = null; return }

    // Walk up to nearest meaningful element (not wrapper/container noise)
    const el = _closest(target)
    if (el === _hovered) return
    _hovered = el
    _positionOverlay(el)
  }

  function _onClick(ev) {
    if (!_active) return
    if (!_hovered) return
    ev.stopPropagation()
    ev.preventDefault()

    _picked = _hovered
    const sectionWrapper = _picked.closest('.section-wrapper')
    const sectionId = sectionWrapper?.dataset?.id || null
    const path = _buildPath(_picked)

    if (typeof _onPick === 'function') _onPick(_picked, sectionId, path)

    deactivate()
  }

  // Walk up to the nearest element that has semantic meaning
  // (stop at section-wrapper boundary)
  function _closest(el) {
    if (!el) return null
    const stop = el.closest('.section-wrapper')
    let cur = el
    while (cur && cur !== stop) {
      const tag = cur.tagName.toLowerCase()
      if (['h1','h2','h3','h4','h5','h6','p','span','a','img','button','li','div'].includes(tag)) {
        return cur
      }
      cur = cur.parentElement
    }
    return stop || el
  }

  function _buildPath(el) {
    const parts = []
    let cur = el
    const root = cur.closest('.section-wrapper') || document.body
    while (cur && cur !== root) {
      const tag = cur.tagName.toLowerCase()
      const id  = cur.id ? `#${cur.id}` : ''
      const cls = cur.className && typeof cur.className === 'string'
        ? '.' + cur.className.trim().split(/\s+/)[0]
        : ''
      parts.unshift(`${tag}${id || cls}`)
      cur = cur.parentElement
    }
    return parts.join(' > ')
  }

  // ── Word-level span injection ─────────────────────────────────────────────
  // Finds all text nodes inside `el` matching `word` and wraps them in <span style="...">
  function wrapWord(el, word, style) {
    if (!el || !word) return 0
    let count = 0
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const toWrap = []
    let node
    while ((node = walker.nextNode())) {
      if (node.textContent.includes(word)) toWrap.push(node)
    }
    toWrap.forEach(textNode => {
      const parts = textNode.textContent.split(word)
      const frag = document.createDocumentFragment()
      parts.forEach((part, i) => {
        if (part) frag.appendChild(document.createTextNode(part))
        if (i < parts.length - 1) {
          const span = document.createElement('span')
          span.style.cssText = style
          span.textContent = word
          frag.appendChild(span)
          count++
        }
      })
      textNode.parentNode.replaceChild(frag, textNode)
    })
    return count
  }

  // Wraps the browser's current text selection in a <span> with inline style.
  // Returns true if applied.
  function wrapSelection(style) {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false
    const range = sel.getRangeAt(0)
    const span  = document.createElement('span')
    span.style.cssText = style
    try {
      range.surroundContents(span)
    } catch {
      // surroundContents fails on cross-element ranges — use extractContents
      span.appendChild(range.extractContents())
      range.insertNode(span)
    }
    sel.removeAllRanges()
    return true
  }

  // Apply a style string to the picked / provided element
  function applyToEl(el, style) {
    const target = el || _picked
    if (!target) return false
    // Merge into existing inline style
    const existing = target.style.cssText
    target.style.cssText = existing ? `${existing};${style}` : style
    return true
  }

  // ── Public: parse micro-target commands ──────────────────────────────────
  // Called by VisualInspector._applyLocalCmd for word-level commands.
  // Returns true if handled.
  const WORD_CMDS = [
    // make "word" bold / italic / underline
    [/make\s+"([^"]+)"\s+bold/i,        (sec, m) => _wordStyleInSection(sec, m[1], 'font-weight:700')],
    [/make\s+"([^"]+)"\s+italic/i,      (sec, m) => _wordStyleInSection(sec, m[1], 'font-style:italic')],
    [/make\s+"([^"]+)"\s+underline/i,   (sec, m) => _wordStyleInSection(sec, m[1], 'text-decoration:underline')],
    [/make\s+"([^"]+)"\s+(?:color\s+)?(#[0-9a-f]{3,8}|\w+)/i, (sec, m) => _wordStyleInSection(sec, m[1], `color:${m[2]}`)],
    // color "word" red
    [/colou?r\s+"([^"]+)"\s+(#[0-9a-f]{3,8}|\w+)/i, (sec, m) => _wordStyleInSection(sec, m[1], `color:${m[2]}`)],
    // size "word" 24px
    [/size\s+"([^"]+)"\s+(\d+(?:px|em|rem)?)/i,      (sec, m) => _wordStyleInSection(sec, m[1], `font-size:${m[2]}`)],
    // highlight "word" yellow
    [/highlight\s+"([^"]+)"\s*(#[0-9a-f]{3,8}|\w+)?/i, (sec, m) => _wordStyleInSection(sec, m[1], `background:${m[2]||'#fef08a'};padding:0 2px;border-radius:2px`)],
  ]

  function _wordStyleInSection(sec, word, style) {
    const wrapper = document.querySelector(`.section-wrapper[data-id="${sec.id}"]`)
    if (!wrapper) return false
    const count = wrapWord(wrapper, word, style)
    return count > 0
  }

  function parseCmd(input, sec) {
    const lower = input.trim()
    for (const [re, fn] of WORD_CMDS) {
      const m = lower.match(re)
      if (m) {
        const result = fn(sec, m)
        return result !== false
      }
    }
    return false
  }

  // ── Activate / deactivate picker ──────────────────────────────────────────
  function activate(onPickCallback) {
    if (_active) return
    _ensureOverlay()
    _onPick   = onPickCallback || null
    _active   = true
    document.body.classList.add('mt-picking')
    document.addEventListener('pointermove', _onPointerMove, { passive: true })
    document.addEventListener('click', _onClick, true)
    document.addEventListener('keydown', _escCancel)
  }

  function deactivate() {
    if (!_active) return
    _active = false
    document.body.classList.remove('mt-picking')
    _hideOverlay()
    _hovered = null
    document.removeEventListener('pointermove', _onPointerMove)
    document.removeEventListener('click', _onClick, true)
    document.removeEventListener('keydown', _escCancel)
  }

  function _escCancel(ev) {
    if (ev.key === 'Escape') { ev.preventDefault(); deactivate() }
  }

  function getPicked()   { return _picked }
  function isActive()    { return _active }

  return { activate, deactivate, isActive, getPicked, wrapWord, wrapSelection, applyToEl, parseCmd }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.MicroTarget = MicroTarget
