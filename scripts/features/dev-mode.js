/* ══════════════════════════════════════════════════════
   STAGE 10 — DEVELOPER MODE
   Code Editor · Code↔UI Sync · Debug Assistant
══════════════════════════════════════════════════════ */
const DevMode = (() => {
  let _open   = false
  let _tab    = 'html'   // 'html' | 'json' | 'debug'
  let _syncTimer = null

  // ── Open / close ──────────────────────────────────────────────────────────
  function toggle() {
    _open = !_open
    const panel = document.getElementById('devmode-panel')
    if (!panel) return
    if (_open) { panel.style.display = 'flex'; refresh() }
    else        panel.style.display = 'none'
  }

  function close() {
    _open = false
    const p = document.getElementById('devmode-panel')
    if (p) p.style.display = 'none'
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  function switchTab(t) {
    _tab = t
    document.querySelectorAll('.dm-tab').forEach(el =>
      el.classList.toggle('active', el.dataset.tab === t)
    )
    refresh()
  }

  // ── Refresh editor content ────────────────────────────────────────────────
  function refresh() {
    if (!_open) return
    const editor = document.getElementById('dm-editor')
    const output = document.getElementById('dm-debug-out')
    if (!editor) return

    if (_tab === 'html') {
      // Generate clean HTML for selected section or full page
      const sec = S.sections.find(s => s.id === S.selected)
      if (sec) {
        try {
          const raw = R[sec.type](sec.props, sec.id)
          editor.value = _format(raw)
        } catch(e) { editor.value = '/* Error rendering section: ' + e.message + ' */' }
      } else {
        editor.value = '/* Select a section on the canvas to see its HTML */'
      }
      editor.style.display = ''
      if (output) output.style.display = 'none'
    }

    else if (_tab === 'json') {
      const sec = S.sections.find(s => s.id === S.selected)
      editor.value = sec
        ? JSON.stringify({ type: sec.type, props: sec.props }, null, 2)
        : JSON.stringify({ sections: S.sections }, null, 2)
      editor.style.display = ''
      if (output) output.style.display = 'none'
    }

    else if (_tab === 'debug') {
      editor.style.display = 'none'
      if (output) { output.style.display = ''; _runDebug(output) }
    }
  }

  // ── Code → UI sync (apply JSON edits back to state) ──────────────────────
  function onEditorChange() {
    clearTimeout(_syncTimer)
    _syncTimer = setTimeout(_applyCode, 800)
    // Live indicator
    const indicator = document.getElementById('dm-sync-status')
    if (indicator) { indicator.textContent = '●  editing…'; indicator.style.color = '#f59e0b' }
  }

  function _applyCode() {
    const editor = document.getElementById('dm-editor')
    if (!editor || !editor.value.trim()) return
    const indicator = document.getElementById('dm-sync-status')

    if (_tab === 'json') {
      try {
        const data = JSON.parse(editor.value)
        const sec = S.sections.find(s => s.id === S.selected)
        if (sec && data.props) {
          // Validate & apply props
          sec.props = { ...sec.props, ...data.props }
          renderAll()
          if (indicator) { indicator.textContent = '✓  synced'; indicator.style.color = '#10b981' }
        } else if (data.sections && Array.isArray(data.sections)) {
          // Full page JSON replace
          pushH('Dev Mode JSON apply')
          S.sections = data.sections
          S.selected = null
          renderAll()
          if (indicator) { indicator.textContent = '✓  synced'; indicator.style.color = '#10b981' }
        }
      } catch(e) {
        if (indicator) { indicator.textContent = '✗  invalid JSON'; indicator.style.color = '#ef4444' }
      }
    }
    // HTML tab is read-only (generated code)
    else if (_tab === 'html') {
      if (indicator) { indicator.textContent = '⚠  HTML is read-only'; indicator.style.color = '#f59e0b' }
      setTimeout(() => { if (indicator) indicator.textContent = '' }, 2000)
    }
  }

  // ── Debug assistant ───────────────────────────────────────────────────────
  function _runDebug(out) {
    const checks = []

    // 1. Unknown section types
    const unknown = S.sections.filter(s => !DEFS[s.type])
    if (unknown.length) checks.push({ sev:'error', msg: `${unknown.length} unknown section type(s): ${unknown.map(s=>s.type).join(', ')}` })

    // 2. Sections with missing props
    S.sections.forEach(s => {
      const def = DEFS[s.type]; if (!def) return
      const missing = Object.keys(def.props||{}).filter(k => s.props[k] === undefined)
      if (missing.length > 3) checks.push({ sev:'warn', msg: `Section "${s.type}" (${s.id.slice(0,8)}) missing ${missing.length} props` })
    })

    // 3. Duplicate section IDs
    const ids = S.sections.map(s => s.id)
    const dupes = ids.filter((id,i) => ids.indexOf(id) !== i)
    if (dupes.length) checks.push({ sev:'error', msg: `Duplicate section IDs detected: ${dupes.join(', ')}` })

    // 4. Empty canvas
    if (!S.sections.length) checks.push({ sev:'info', msg: 'Canvas is empty — add sections to build your page' })

    // 5. Performance
    if (S.sections.length > 12) checks.push({ sev:'warn', msg: `${S.sections.length} sections — consider splitting into multiple pages` })

    // 6. LocalStorage usage
    try {
      let total = 0
      for (let k in localStorage) { if (localStorage.hasOwnProperty(k)) total += (localStorage[k].length * 2) }
      const kb = Math.round(total / 1024)
      if (kb > 3000) checks.push({ sev:'warn', msg: `localStorage usage: ${kb}KB — approaching browser limit (5MB)` })
      else checks.push({ sev:'info', msg: `localStorage: ${kb}KB used` })
    } catch(e) {}

    // 7. Page title
    const title = document.getElementById('page-title')?.value?.trim()
    if (!title) checks.push({ sev:'warn', msg: 'No page title set — bad for SEO' })

    // 8. 3D sections on mobile
    const has3D = S.sections.some(s => s.type.startsWith('scene-'))
    if (has3D) checks.push({ sev:'info', msg: '3D sections detected — Three.js adds ~600KB. Consider lazy-loading.' })

    const icons = { error:'🔴', warn:'🟡', info:'🔵' }
    out.innerHTML = checks.length
      ? checks.map(c => `<div class="dm-debug-item dm-debug-${c.sev}">${icons[c.sev]} ${c.msg}</div>`).join('')
      : `<div class="dm-debug-item dm-debug-info">✅ No issues found. Builder state looks healthy.</div>`
  }

  // ── Copy to clipboard ─────────────────────────────────────────────────────
  function copyCode() {
    const editor = document.getElementById('dm-editor')
    if (!editor) return
    navigator.clipboard?.writeText(editor.value).then(() => toast('Copied!','📋'))
  }

  // ── Simple HTML formatter ─────────────────────────────────────────────────
  function _format(html) {
    // Basic indent — just wrap long lines for readability
    return html.replace(/></g, '>\n<').replace(/^\s+|\s+$/g,'').slice(0, 20000)
  }

  // Called from renderAll to keep editor in sync if open
  function update() {
    if (_open) refresh()
  }

  return { toggle, close, switchTab, refresh, onEditorChange, copyCode, update }
})()
window.PageCraft.DevMode = DevMode
