/* canvas.js Phase 6 */

/* SECTION CRUD
══════════════════════════════════════════════════════ */
function addSection(type, insertAtIdx=null) {
  if (!Security.limiters.addSection()) return toast('Adding sections too fast — slow down','⚠️')
  // Gate 3D sections behind Pro plan
  if (type.startsWith('scene-') && typeof requirePro === 'function' && !isPro()) {
    requirePro('3d', '3D scenes require the Pro plan'); return
  }
  // Free tier section limit
  if (typeof UsageLimits !== 'undefined' && !UsageLimits.checkSection()) return
  const def=DEFS[type]; if(!def)return
  // ── Hook: section:beforeAdd (cancellable) ──────────────────────────────────
  if (!PluginSDK._emit('section:beforeAdd', { type })) return
  pushH('Add '+def.label)
  const _sProps={...def.props}
  if(typeof SmartDefaults!=='undefined')SmartDefaults.applyTo(type,_sProps)
  const sec={id:uid(),type,props:_sProps}
  if(insertAtIdx!==null && insertAtIdx>=0 && insertAtIdx<=S.sections.length) {
    S.sections.splice(insertAtIdx,0,sec)
  } else {
    S.sections.push(sec)
  }
  S.selected=sec.id; renderAll('structure'); scrollToSection(sec.id)
  toast(`${def.label} added`,'✦')
  // ── Hook: section:afterAdd ─────────────────────────────────────────────────
  const _addedIdx = S.sections.findIndex(s => s.id === sec.id)
  PluginSDK._emit('section:afterAdd', { section: sec, index: _addedIdx })
  // Analytics: track section additions (guard with typeof — analytics loads later)
  if (typeof analyticsTrack === 'function') analyticsTrack('section_added', { props:{ type } })
  // Collab: broadcast to room
  if (typeof Collab !== 'undefined') Collab.emitSectionAdd(sec, _addedIdx)
  // Stage 3.1: AI Director Mode — suggest 3 variations after a short delay
  if (typeof AIDirector !== 'undefined') AIDirector.suggest(sec)
}
function removeSection(id,ev) {
  ev&&ev.stopPropagation()
  const section = S.sections.find(s => s.id === id)
  // ── Hook: section:beforeRemove (cancellable) ───────────────────────────────
  if (!PluginSDK._emit('section:beforeRemove', { id, section })) return
  pushH('Remove section')
  const idx=S.sections.findIndex(s=>s.id===id); if(idx===-1)return
  S.sections.splice(idx,1)
  if(S.selected===id)S.selected=S.sections[0]?.id||null
  // Clean up scoped style if it was a custom-html section
  if (section?.type === 'custom-html') {
    const st = document.getElementById(`ch-style-${id}`)
    if (st) st.remove()
    _chScriptCache.delete(id)
  }
  renderAll('structure'); toast('Removed','🗑')
  // ── Hook: section:afterRemove ──────────────────────────────────────────────
  PluginSDK._emit('section:afterRemove', { id })
  if(typeof Collab!=='undefined')Collab.emitSectionRemove(id)
}
function dupSection(id,ev) { ev&&ev.stopPropagation(); pushH('Duplicate section'); const src=S.sections.find(s=>s.id===id); if(!src)return; const cl={id:uid(),type:src.type,props:{...src.props}}; const idx=S.sections.findIndex(s=>s.id===id); S.sections.splice(idx+1,0,cl); S.selected=cl.id; renderAll('structure'); toast('Duplicated','⧉'); if(typeof Collab!=='undefined')Collab.emitSectionDup(id,cl,idx+1) }
function moveSection(id,dir,ev) { ev&&ev.stopPropagation(); const idx=S.sections.findIndex(s=>s.id===id),ni=idx+dir; if(ni<0||ni>=S.sections.length)return; pushH('Move section'); [S.sections[idx],S.sections[ni]]=[S.sections[ni],S.sections[idx]]; renderAll('structure'); if(typeof Collab!=='undefined')Collab.emitSectionMove(idx,ni) }
function selectSection(id) {
  S.selected = id
  renderAll('selection')
  const sec = S.sections.find(s => s.id === id)
  if (typeof BottomBar !== 'undefined') BottomBar.updatePanelHeader(sec)
  if (S.panelTab === 'layout') renderLayoutPanel()
  if (typeof VisualInspector !== 'undefined') {
    id ? VisualInspector.show(id) : VisualInspector.hide()
  }
}

/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████

   DND SYSTEM  — dnd-kit style, native HTML5 + Pointer
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

const DND = {
  active:     false,
  type:       null,     // 'library' | 'canvas'
  blockType:  null,     // section type from library
  sectionId:  null,     // id when dragging canvas section
  startX:     0, startY: 0,
  ghostEl:    null,
  overIdx:    null,     // index the item would land at
  lineEls:    [],       // current visible drop-line elements
  // ── Performance cache (populated at drag start, cleared at drag end) ──
  _cachedRects:     null,   // Array of {top, mid, bottom} for each wrapper
  _cachedLines:     null,   // NodeList of .drop-line elements
  _rafId:           null,   // requestAnimationFrame handle
  _pendingMove:     null,   // pending pointermove event (rAF throttle)
}

// ── Ghost element ──────────────────────────────────────────────────────
function showGhost(x, y) {
  const g = document.getElementById('drag-ghost')
  g.style.left = x + 'px'
  g.style.top  = y + 'px'
  g.classList.add('show')
}
function hideGhost() {
  const g = document.getElementById('drag-ghost')
  g.classList.remove('show')
  g.className = 'drag-ghost'
  g.innerHTML = ''
}
function buildLibraryGhost(type) {
  const def = DEFS[type]
  const g = document.getElementById('drag-ghost')
  g.className = 'from-library show'
  g.innerHTML = `<span style="font-size:18px">${def.icon}</span><span>${def.label}</span>`
}
function buildCanvasGhost(sec) {
  const def = DEFS[sec.type]
  const g = document.getElementById('drag-ghost')
  g.className = 'from-canvas show'
  // Lightweight ghost — icon + label only (no full section render)
  g.innerHTML = `<span style="font-size:18px">${def.icon}</span><span>${def.label}</span>`
}

// ── Drop line management ───────────────────────────────────────────────
function clearDropLines() {
  const lines = DND._cachedLines || document.querySelectorAll('.drop-line')
  lines.forEach(el => el.classList.remove('show'))
}
function showDropLine(idx) {
  const lines = DND._cachedLines || document.querySelectorAll('.drop-line')
  lines.forEach((l, i) => l.classList.toggle('show', i === idx))
  DND.overIdx = idx
}

// ── Cache rects + lines at drag start (one reflow, not one per frame) ─
function _cacheDragLayout(excludeId) {
  const wrappers = excludeId
    ? [...document.querySelectorAll(`.section-wrapper:not([data-id="${excludeId}"])`)]
    : [...document.querySelectorAll('.section-wrapper')]
  // Read all rects in one batch (single reflow)
  DND._cachedRects = wrappers.map(el => {
    const r = el.getBoundingClientRect()
    return { mid: r.top + r.height / 2 }
  })
  DND._cachedLines = document.querySelectorAll('.drop-line')
}

function _clearDragCache() {
  DND._cachedRects = null
  DND._cachedLines = null
  if (DND._rafId) { cancelAnimationFrame(DND._rafId); DND._rafId = null }
  DND._pendingMove = null
}

// ── Compute drop index using cached rects (zero reflow) ───────────────
function computeDropIndex(clientY) {
  const rects = DND._cachedRects
  if (!rects || !rects.length) return 0
  for (let i = 0; i < rects.length; i++) {
    if (clientY < rects[i].mid) return i
  }
  return rects.length
}

// ── Canvas drop-zone for empty state ─────────────────────────────────
function showCanvasDropZone(show) {
  const dz = document.getElementById('canvas-drop-zone')
  const fr = document.getElementById('canvas-frame')
  dz.classList.toggle('show', show)
  fr.classList.toggle('canvas-drop-active', show)
}

/* ─────────────────────────────────────────────────────────────────────
   LIBRARY DRAG (block card → canvas)
───────────────────────────────────────────────────────────────────── */
function onBlockPointerDown(ev, type) {
  const _blockType = type  // capture in closure before DND state can be cleared
  DND.type = 'library'
  DND.blockType = type
  DND.startX = ev.clientX
  DND.startY = ev.clientY
  DND.active = false

  const card = ev.currentTarget

  const onMove = (me) => {
    const dx = Math.abs(me.clientX - DND.startX)
    const dy = Math.abs(me.clientY - DND.startY)

    if (!DND.active && (dx > 6 || dy > 6)) {
      DND.active = true
      card.classList.add('dragging-source')
      buildLibraryGhost(_blockType)
      document.body.style.cursor = 'copy'
      // Cache rects + lines ONCE at drag activation (single reflow)
      if (S.sections.length) _cacheDragLayout(null)
    }

    if (!DND.active) return

    // Throttle via rAF — process at most once per frame
    DND._pendingMove = me
    if (!DND._rafId) {
      DND._rafId = requestAnimationFrame(() => {
        DND._rafId = null
        const ev = DND._pendingMove
        if (!ev || !DND.active) return

        showGhost(ev.clientX, ev.clientY)

        if (S.sections.length) {
          showDropLine(computeDropIndex(ev.clientY))
          document.getElementById('canvas-frame').classList.remove('canvas-drop-active')
        } else {
          clearDropLines()
          const frame = document.getElementById('canvas-frame')
          const rect  = frame.getBoundingClientRect()
          frame.classList.toggle('canvas-drop-active',
            ev.clientX >= rect.left && ev.clientX <= rect.right &&
            ev.clientY >= rect.top  && ev.clientY <= rect.bottom)
        }
      })
    }
  }

  const cleanup = () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup',   onUp)
    document.removeEventListener('pointercancel', cleanup)
    card.classList.remove('dragging-source')
    document.body.style.cursor = ''
    hideGhost()
    clearDropLines()
    document.getElementById('canvas-frame').classList.remove('canvas-drop-active')
    _clearDragCache()
    DND.active    = false
    DND.type      = null
    DND.blockType = null
    DND.overIdx   = null
  }

  const onUp = (ue) => {
    const wasActive  = DND.active
    const savedIdx   = DND.overIdx
    const savedType  = _blockType   // safe — captured before cleanup clears DND
    cleanup()

    if (wasActive) {
      // Was a real drag — check if released over the canvas
      const frame = document.getElementById('canvas-frame')
      const rect  = frame.getBoundingClientRect()
      const over  = ue.clientX >= rect.left && ue.clientX <= rect.right &&
                    ue.clientY >= rect.top  && ue.clientY <= rect.bottom
      if (over) {
        const insertAt = S.sections.length ? (savedIdx ?? S.sections.length) : 0
        addSection(savedType, insertAt)
        toast(`${DEFS[savedType]?.label || savedType} added`, '🎯')
      }
    } else {
      // Was a click — just add at end
      addSection(savedType)
    }
  }

  document.addEventListener('pointermove', onMove, {passive: true})
  document.addEventListener('pointerup',   onUp)
  document.addEventListener('pointercancel', cleanup)
}

/* ─────────────────────────────────────────────────────────────────────
   CANVAS REORDER DRAG (drag handle on section-wrapper)
───────────────────────────────────────────────────────────────────── */
function onSectionDragHandleDown(ev, id) {
  ev.stopPropagation()

  DND.type = 'canvas'
  DND.sectionId = id
  DND.startX = ev.clientX
  DND.startY = ev.clientY
  DND.active = false

  const sec     = S.sections.find(s => s.id === id)
  if (!sec) return
  const wrapper = document.querySelector(`.section-wrapper[data-id="${id}"]`)

  const onMove = (me) => {
    const dx = Math.abs(me.clientX - DND.startX)
    const dy = Math.abs(me.clientY - DND.startY)

    if (!DND.active && (dx > 4 || dy > 4)) {
      DND.active = true
      wrapper && wrapper.classList.add('sec-dragging')
      // Lightweight ghost — label only, no full section render
      buildCanvasGhost(sec)
      document.body.style.cursor = 'grabbing'
      // Cache rects ONCE at drag activation (exclude dragged section)
      _cacheDragLayout(id)
    }

    if (!DND.active) return

    // Throttle to one update per animation frame
    DND._pendingMove = me
    if (!DND._rafId) {
      DND._rafId = requestAnimationFrame(() => {
        DND._rafId = null
        const ev = DND._pendingMove
        if (!ev || !DND.active) return

        showGhost(ev.clientX, ev.clientY)

        const dropIdx = computeDropIndex(ev.clientY)  // uses cached rects
        const srcIdx  = S.sections.findIndex(s => s.id === id)
        DND.overIdx   = dropIdx > srcIdx ? dropIdx : dropIdx
        showDropLine(dropIdx)
      })
    }
  }

  const cleanupCanvas = () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup',   onUp)
    document.removeEventListener('pointercancel', cleanupCanvas)
    wrapper && wrapper.classList.remove('sec-dragging')
    document.body.style.cursor = ''
    hideGhost()
    clearDropLines()
    _clearDragCache()
    DND.active    = false
    DND.type      = null
    DND.sectionId = null
    DND.overIdx   = null
  }

  const onUp = () => {
    const wasActive    = DND.active
    const savedOverIdx = DND.overIdx
    cleanupCanvas()

    if (wasActive && savedOverIdx !== null) {
      const srcIdx = S.sections.findIndex(s => s.id === id)
      if (srcIdx !== -1) {
        let tgt = savedOverIdx
        if (tgt > srcIdx) tgt--
        if (tgt !== srcIdx) {
          pushH()
          const [moved] = S.sections.splice(srcIdx, 1)
          S.sections.splice(tgt, 0, moved)
          renderAll()
          toast('Section reordered', '↕')
        }
      }
    }
  }

  document.addEventListener('pointermove', onMove, {passive: true})
  document.addEventListener('pointerup',   onUp)
  document.addEventListener('pointercancel', cleanupCanvas)
}

/* ─────────────────────────────────────────────────────────────────────
   LAYER LIST REORDER (sidebar layers panel)
───────────────────────────────────────────────────────────────────── */
let lyrDragId = null

function lyrDS(ev, id) {
  lyrDragId = id
  ev.dataTransfer.effectAllowed = 'move'
  setTimeout(() => document.querySelector(`.layer-item[data-id="${id}"]`)?.classList.add('lyr-ghost'), 0)
}
function lyrDO(ev, id) {
  ev.preventDefault()
  document.querySelectorAll('.layer-item').forEach(el => el.classList.remove('lyr-above','lyr-below'))
  if (id !== lyrDragId) {
    const fi = S.sections.findIndex(s => s.id === lyrDragId)
    const ti = S.sections.findIndex(s => s.id === id)
    if (fi !== -1 && ti !== -1 && fi !== ti) {
      const el = document.querySelector(`.layer-item[data-id="${id}"]`)
      el && el.classList.add(fi > ti ? 'lyr-above' : 'lyr-below')
      // Live reorder
      const [moved] = S.sections.splice(fi, 1)
      S.sections.splice(ti, 0, moved)
      renderCanvas(); renderLayers()
    }
  }
}
function lyrDE() {
  document.querySelectorAll('.layer-item').forEach(el => el.classList.remove('lyr-ghost','lyr-above','lyr-below'))
  lyrDragId = null; pushH()
}

/* ══════════════════════════════════════════════════════ */

function renderCanvas() {
  const root = document.getElementById('sections-root')
  const emp  = document.getElementById('canvas-empty')
  const hint = document.getElementById('edit-hint')

  if (!S.sections.length) {
    emp.style.display = 'flex'
    root.innerHTML = ''
    hint.style.display = 'none'
    RenderEngine.invalidateAll()
    return
  }
  emp.style.display = 'none'
  hint.style.display = S.mode === 'edit' ? 'flex' : 'none'

  // Diff-patch: only update what changed
  const rerendered = RenderEngine.patch(root, S.sections, S.selected)

  // Run inline scripts only for (re)rendered custom-html sections
  S.sections.filter(s => s.type === 'custom-html' && rerendered.has(s.id)).forEach(s => {
    const c = root.querySelector(`.section-wrapper[data-id="${s.id}"] .sec-content`)
    if (c) _runInlineScripts(c, s.id)
  })

  document.getElementById('canvas-frame').classList.toggle('preview-mode', S.mode === 'preview')

  // Scope post-render work to only sections whose content changed
  if (rerendered.size > 0) {
    bindInline(rerendered)
    attachAnimBadges(rerendered)
  }
  if (typeof updateRuler === 'function') updateRuler()
  if (typeof updateCanvasBadge === 'function') updateCanvasBadge()

  // CMS bind badges — only add to wrappers that don't have them yet
  if (typeof bindLoad === 'function') {
    const bindings = bindLoad()
    Object.entries(bindings).forEach(([secId, bind]) => {
      const wrapper = root.querySelector(`.section-wrapper[data-id="${secId}"]`)
      if (wrapper && !wrapper.querySelector('.cms-bind-badge')) {
        const badge = document.createElement('div')
        badge.className = 'cms-bind-badge'
        badge.textContent = '🔗 ' + bind.collLabel
        wrapper.appendChild(badge)
      }
    })
  }
}

const _chScriptCache = new Map() // sectionId → content hash
function _chHash(s) { let h=0; for(let i=0;i<s.length;i++) h=(Math.imul(31,h)+s.charCodeAt(i))|0; return h }

function _runInlineScripts(container, sectionId) {
  // ── Move <style> tags to <head> (already scoped by R['custom-html']) ─────
  // Styles inside innerHTML are valid but cleaner in <head>
  container.querySelectorAll('style').forEach(styleEl => {
    const styleId = `ch-style-${sectionId}`
    let injected = document.getElementById(styleId)
    if (!injected) {
      injected = document.createElement('style')
      injected.id = styleId
      document.head.appendChild(injected)
    }
    injected.textContent = styleEl.textContent
    styleEl.remove()
  })

  // ── Run <script> tags ─────────────────────────────────────────────────────
  const tags = [...container.querySelectorAll('script')]
  if (!tags.length) return

  // Separate by type
  const externalTags = tags.filter(s => s.getAttribute('src') && s.getAttribute('type') !== 'module')
  const moduleTags   = tags.filter(s => s.getAttribute('type') === 'module')
  const regularTags  = tags.filter(s => !s.getAttribute('src') && s.getAttribute('type') !== 'module')

  // External scripts (e.g. Tailwind CDN) — inject into head once
  externalTags.forEach(old => {
    const src = old.getAttribute('src')
    old.remove()
    if (!src || document.querySelector(`script[src="${src}"]`)) return
    const s = document.createElement('script')
    s.src = src
    // Copy other attributes (defer, async, etc.)
    ;[...old.attributes].forEach(a => { if (a.name !== 'src') s.setAttribute(a.name, a.value) })
    document.head.appendChild(s)
  })

  // Regular inline scripts — concat + eval
  if (regularTags.length) {
    // Filter out config scripts that depend on async-loaded globals (e.g. tailwind.config)
    const safeInline = regularTags.filter(s => {
      const code = s.textContent.trim()
      // Skip tailwind config — Tailwind processes on its own after CDN load
      if (/^\s*tailwind\.config\s*=/.test(code)) { s.remove(); return false }
      return true
    })
    if (safeInline.length) {
      const raw = safeInline.map(s => s.textContent.trim()).join('\n')
      const hash = _chHash(raw)
      if (_chScriptCache.get(sectionId) !== hash) {
        _chScriptCache.set(sectionId, hash)
        const safe = raw.replace(/\bconst\s+/g, 'var ').replace(/\blet\s+/g, 'var ')
        try { const n = document.createElement('script'); n.textContent = safe; document.head.appendChild(n) }
        catch(e) { console.warn('[PageCraft script]', e) }
      }
    }
  }

  // Module scripts — execute via blob URL so ESM import statements work
  moduleTags.forEach((old, idx) => {
    const code = old.textContent.trim()
    old.remove()
    if (!code) return
    const hash = _chHash(code)
    const cacheKey = sectionId + '_mod' + idx
    if (_chScriptCache.get(cacheKey) === hash) return
    _chScriptCache.set(cacheKey, hash)
    // Log first 400 chars for debugging
    console.log('[PageCraft module] blob preview:\n' + code.slice(0, 400))
    try {
      const blob    = new Blob([code], { type: 'text/javascript' })
      const blobUrl = URL.createObjectURL(blob)

      // Use import() wrapper to catch SyntaxErrors (which onerror can't message)
      // A SyntaxError inside the blob causes import() to reject, giving us the message
      const wrapCode = [
        `import(${JSON.stringify(blobUrl)})`,
        `.catch(function(e){`,
        `  console.error('[PageCraft module error]', e);`,
        `  var divs = document.querySelectorAll('div[id^=\"pc_react_\"]');`,
        `  if (divs.length) {`,
        `    var el = divs[divs.length - 1];`,
        `    if (!el.dataset.pcErr) {`,
        `      el.dataset.pcErr = '1';`,
        `      el.innerHTML = '<div style=\"color:#ef4444;padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font:12px/1.6 monospace;white-space:pre-wrap\">\\u26a0\\ufe0f ' + (e&&e.message?e.message:String(e)) + '</div>';`,
        `    }`,
        `  }`,
        `})`,
        `.finally(function(){ URL.revokeObjectURL(${JSON.stringify(blobUrl)}) });`,
      ].join('\n')

      const wrapBlob = new Blob([wrapCode], { type: 'text/javascript' })
      const wrapUrl  = URL.createObjectURL(wrapBlob)
      const s        = document.createElement('script')
      s.type = 'module'; s.src = wrapUrl
      s.onload  = () => URL.revokeObjectURL(wrapUrl)
      s.onerror = () => URL.revokeObjectURL(wrapUrl)
      document.body.appendChild(s)
    } catch(e) { console.warn('[PageCraft module blob]', e) }
  })
}

function patchSection(sec) {
  const w = document.querySelector(`.section-wrapper[data-id="${sec.id}"]`); if(!w)return
  const c = w.querySelector('.sec-content'); if(!c)return
  c.innerHTML = R[sec.type](sec.props, sec.id); bindInline()
  if (sec.type === 'custom-html') _runInlineScripts(c, sec.id)
}

// rerendered: Set of sectionIds whose content was just rebuilt — only rebind those.
// If omitted, rebind all (legacy call path).
function bindInline(rerendered) {
  const scope = rerendered
    ? [...rerendered].map(id => document.querySelector(`.section-wrapper[data-id="${id}"]`)).filter(Boolean)
    : [document]

  scope.forEach(container => {
    container.querySelectorAll('[contenteditable][data-id]').forEach(el => {
      const cl = el.cloneNode(true); el.parentNode.replaceChild(cl, el)
      cl.addEventListener('input', () => {
        const sec = S.sections.find(s => s.id === cl.dataset.id); if(!sec)return
        sec.props[cl.dataset.key] = cl.innerText; scheduleLive()
        const pi = document.querySelector(`[data-pk="${cl.dataset.key}"]`)
        if(pi && pi !== document.activeElement) pi.value = cl.innerText
        scheduleAutoSave()
      })
      cl.addEventListener('focus', () => { if(S.selected !== cl.dataset.id) selectSection(cl.dataset.id) })
      cl.addEventListener('keydown', ev => { if(ev.key === 'Enter' && cl.tagName !== 'P'){ev.preventDefault(); cl.blur()} })
      cl.addEventListener('blur', () => pushH())
    })
  })
}

function renderLayers() {
  const list  = document.getElementById('layers-list')
  const count = document.getElementById('layer-count')
  count.textContent = S.sections.length
  if(!S.sections.length){list.innerHTML='<p style="color:var(--muted);font-size:12px;text-align:center;padding:28px 0">No sections yet</p>';return}
  list.innerHTML = S.sections.map((sec,idx) => {
    const def=DEFS[sec.type], sel=S.selected===sec.id
    return`<div class="layer-item${sel?' selected':''}" data-id="${sec.id}" draggable="true"
      ondragstart="lyrDS(event,'${sec.id}')" ondragover="lyrDO(event,'${sec.id}')" ondragend="lyrDE()"
      onclick="selectSection('${sec.id}')">
      <span class="li-handle">⠿</span><span class="li-icon">${def.icon}</span>
      <span class="li-name">${def.label}</span><span class="li-num">#${idx+1}</span>
      <span class="li-del" onclick="removeSection('${sec.id}',event)">✕</span>
    </div>`
  }).join('')
}
