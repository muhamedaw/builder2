/* store.js Phase 4/5 */

/* ══════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   STATE MANAGEMENT — Zustand-inspired reactive store
   Features:
   • Immer-style immutable updates via produce()
   • 60-step undo/redo with named action labels
   • Time-travel (jump to any snapshot)
   • Auto-save to localStorage (debounced 1.5s)
   • Subscriptions / middleware pipeline
   • Slice-based organisation: ui | editor | history
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

// ── Minimal Immer-style producer ──────────────────────────────────────────────
// Deep-clones state, runs recipe, returns new state.
function produce(state, recipe) {
  const draft = JSON.parse(JSON.stringify(state))
  recipe(draft)
  return draft
}

// ── Store factory (Zustand pattern) ──────────────────────────────────────────
function createStore(initialState) {
  let _state    = JSON.parse(JSON.stringify(initialState))
  let _listeners= []
  let _middleware= []

  const store = {
    // Read state (returns frozen proxy-like reference)
    getState() { return _state },

    // Set state: accepts object patch or updater function
    setState(updater, actionLabel = 'update') {
      const prev = _state
      const patch = typeof updater === 'function' ? updater(_state) : updater
      _state = { ..._state, ...patch }

      // Run middleware (e.g. logger, persist)
      _middleware.forEach(mw => mw({ prev, next: _state, action: actionLabel }))

      // Notify subscribers
      _listeners.forEach(fn => fn(_state, prev))
    },

    // Immer-style update
    produce(recipe, actionLabel = 'produce') {
      const next = produce(_state, recipe)
      this.setState(() => next, actionLabel)
    },

    // Subscribe to state changes
    subscribe(fn) {
      _listeners.push(fn)
      return () => { _listeners = _listeners.filter(l => l !== fn) }
    },

    // Add middleware (runs on every setState)
    use(mw) { _middleware.push(mw); return store },
  }
  return store
}

// ══════════════════════════════════════════════════════
//  SPLIT STORES — project data separated from UI state
//
//  projectStore  — serializable page data (saved / exported / synced via WS)
//  uiStore       — ephemeral editor state  (never serialized)
//  authStore     — user session
//
//  editorStore   — facade that delegates to the two stores by key,
//                  so all existing editorStore.getState() / setState() /
//                  produce() / subscribe() call sites continue to work.
//
//  S             — Proxy shorthand (unchanged public API).
// ══════════════════════════════════════════════════════

// ── 1. Project Store ─────────────────────────────────────────────────────────
// Contains only data that is meaningful outside the editor session:
// the page structure, title, counter, dirty flag, and undo/redo stacks.
const projectStore = createStore({
  sections:     [],         // Section[] — active page's sections
  pageTitle:    'My Page',
  nextId:       1,          // monotonic section-id counter
  isDirty:      false,
  lastSaved:    null,       // timestamp | null
  past:         [],         // [{ label, sections, timestamp }]
  future:       [],         // [{ label, sections, timestamp }]
  pages:        [],         // [{ id, name, sections }]
  activePageId: '',         // id of the currently visible page
})

// ── 2. UI Store ───────────────────────────────────────────────────────────────
// Contains only transient editor UI state — never written to disk or the wire.
const uiStore = createStore({
  selected:   null,       // sectionId | null
  device:     'desktop',  // 'desktop' | 'tablet' | 'mobile'
  mode:       'edit',     // 'edit' | 'preview'
  panelTab:   'edit',     // 'edit' | 'style' | 'layers' | …
  imgTarget:  null,       // section awaiting image pick
  pendingImg: null,       // queued image blob/URL
})

// ── 3. Auth Store ─────────────────────────────────────────────────────────────
// Replaces the plain AUTH = { user, token } object with a reactive store.
const authStore = createStore({
  user:  null,   // { id, name, email, plan } | null
  token: null,   // JWT string | null
})

// ── Key routing tables ────────────────────────────────────────────────────────
const _PROJECT_KEYS = new Set([
  'sections','pageTitle','nextId','isDirty','lastSaved','past','future','pages','activePageId',
])
const _UI_KEYS = new Set([
  'selected','device','mode','panelTab','imgTarget','pendingImg',
])
const _AUTH_KEYS = new Set(['user','token'])

// ── 4. editorStore facade ─────────────────────────────────────────────────────
// Delegates reads/writes to the correct underlying store by key.
// All existing editorStore.X() call sites work without modification.
const editorStore = (() => {
  function getState() {
    // Merge view: UI state overlays project state.
    // Auth state is intentionally excluded from the merge — use authStore directly.
    return { ...projectStore.getState(), ...uiStore.getState() }
  }

  function setState(updater, label = 'update') {
    const merged = getState()
    const patch  = typeof updater === 'function' ? updater(merged) : updater
    const pp = {}, up = {}
    for (const [k, v] of Object.entries(patch)) {
      if (_PROJECT_KEYS.has(k)) pp[k] = v
      else if (_UI_KEYS.has(k)) up[k] = v
      // unknown keys are silently ignored (safe for future growth)
    }
    if (Object.keys(pp).length) projectStore.setState(pp, label)
    if (Object.keys(up).length) uiStore.setState(up, label)
  }

  function _produce(recipe, label = 'produce') {
    const next = produce(getState(), recipe)
    setState(() => next, label)
  }

  function subscribe(fn) {
    const u1 = projectStore.subscribe(fn)
    const u2 = uiStore.subscribe(fn)
    return () => { u1(); u2() }
  }

  function use(mw) {
    projectStore.use(mw)
    uiStore.use(mw)
    return facade
  }

  const facade = { getState, setState, produce: _produce, subscribe, use }
  return facade
})()

// ── 5. S proxy — unchanged public API ────────────────────────────────────────
// Shorthand for editorStore state; all S.xxx reads/writes continue to work.
const S = new Proxy({}, {
  get(_, key)        { return editorStore.getState()[key] },
  set(_, key, value) { editorStore.setState({ [key]: value }, `set:${key}`); return true },
})

// ── Named snapshot — clones only project data (never UI state) ───────────────
function snap(label = 'action') {
  return {
    label,
    sections:  JSON.parse(JSON.stringify(projectStore.getState().sections)),
    timestamp: Date.now(),
  }
}

// ── History helpers ───────────────────────────────────────────────────────────
const MAX_HISTORY = 60

function pushH(label = 'action') {
  const st = editorStore.getState()
  const entry = snap(label)
  const past  = [...st.past, entry].slice(-MAX_HISTORY)
  editorStore.setState({ past, future: [], isDirty: true }, 'pushHistory')
  syncH()
  scheduleAutoSave()
}

function syncH() {
  const { past, future } = editorStore.getState()
  const undoBtn = document.getElementById('btn-undo')
  const redoBtn = document.getElementById('btn-redo')
  if (undoBtn) {
    undoBtn.disabled = !past.length
    undoBtn.title    = past.length ? `Undo: ${past[past.length-1]?.label || 'action'} (Ctrl+Z)` : 'Nothing to undo'
  }
  if (redoBtn) {
    redoBtn.disabled = !future.length
    redoBtn.title    = future.length ? `Redo: ${future[0]?.label || 'action'} (Ctrl+Y)` : 'Nothing to redo'
  }
  renderHistoryPanel()
}

// ── Bottom Bar ────────────────────────────────────────────────────────────────
let _bbZoom = 100
const BottomBar = {
  update() {
    // Section count
    const cnt = document.getElementById('bb-sec-count')
    if (cnt) cnt.textContent = S?.sections?.length || 0

    // Save status
    const dot  = document.getElementById('bb-save-dot')
    const lbl  = document.getElementById('bb-save-label')
    const badge = document.getElementById('autosave-badge')
    if (dot && lbl) {
      const saving = badge?.textContent?.includes('Saving')
      dot.className  = 'bb-dot ' + (saving ? 'yellow' : 'green')
      lbl.textContent = saving ? 'Saving…' : 'Saved'
    }

    // Plan badge
    const planBadge = document.getElementById('bb-plan-badge')
    if (planBadge && typeof isPro === 'function') {
      planBadge.textContent = isPro() ? 'PRO' : 'FREE'
      planBadge.style.background = isPro()
        ? 'linear-gradient(135deg,rgba(108,99,255,.25),rgba(167,139,250,.2))'
        : 'rgba(100,116,139,.15)'
      planBadge.style.color = isPro() ? '#a78bfa' : 'var(--muted)'
    }

    // Performance score (simple estimate)
    const score = Math.max(50, 100 - (S?.sections?.length || 0) * 3)
    const perfEl = document.getElementById('bb-perf-score')
    if (perfEl) {
      perfEl.textContent = score
      perfEl.className = 'bb-perf-score ' + (score >= 80 ? 'good' : score >= 60 ? 'ok' : 'bad')
    }

    // SEO score (basic)
    const title = document.getElementById('page-title')?.value || ''
    const seoScore = title.length >= 10 && S?.sections?.length >= 2 ? 'Good' : title.length > 0 ? 'Fair' : '—'
    const seoEl = document.getElementById('bb-seo-score')
    if (seoEl) {
      seoEl.textContent = seoScore
      seoEl.style.color = seoScore === 'Good' ? '#34d399' : seoScore === 'Fair' ? '#fbbf24' : 'var(--muted)'
    }
  },

  updatePanelHeader(sec) {
    const label = document.getElementById('panel-section-label')
    if (!label) return
    if (!sec) {
      label.textContent = 'No section selected'
      label.style.color = 'var(--muted)'
      label.style.fontWeight = '400'
      return
    }
    const def = DEFS[sec.type]
    label.innerHTML = `<span style="font-size:14px">${def?.icon||'📦'}</span>
      <span style="color:var(--text);font-weight:600;font-size:12px">${def?.label||sec.type}</span>
      <span class="panel-section-tag">${sec.type}</span>`
  }
}

// Zoom controls
function bbZoom(delta) {
  _bbZoom = Math.max(25, Math.min(200, _bbZoom + delta))
  const el = document.getElementById('bb-zoom-val')
  if (el) el.textContent = _bbZoom + '%'
  const canvas = document.getElementById('sections-root')
  if (canvas) canvas.style.transform = `scale(${_bbZoom/100})`
}
function bbZoomReset() { _bbZoom = 100; bbZoom(0) }
function bbZoomFit() {
  const canvas = document.getElementById('canvas-area') || document.querySelector('.canvas')
  if (!canvas) return
  const ratio = canvas.clientWidth / 1280
  _bbZoom = Math.round(ratio * 100)
  bbZoom(0)
}

// Hook into renderAll to update bottom bar
const _origRenderAll = window.renderAll
// Defer hook to load event so renderAll is defined
window.addEventListener('load', () => {
  const _base = window.renderAll
  if (typeof _base === 'function') {
    window.renderAll = function(...a) {
      const r = _base(...a)
      BottomBar.update()
      return r
    }
  }
  // Initial update
  setTimeout(() => BottomBar.update(), 500)
  // Periodic save status update
  setInterval(() => {
    const dot = document.getElementById('bb-save-dot')
    const lbl = document.getElementById('bb-save-label')
    if (!dot || !lbl) return
    const badge = document.getElementById('autosave-badge')
    const saving = badge?.textContent?.includes('Saving')
    dot.className  = 'bb-dot ' + (saving ? 'yellow' : 'green')
    lbl.textContent = saving ? 'Saving…' : 'Saved'
  }, 2000)
})

// ── Topbar Menu System ────────────────────────────────────────────────────────
const _tbOpen = { current: null }

function tbToggle(id) {
  const wasOpen = _tbOpen.current === id
  tbClose()
  if (!wasOpen) {
    const menu = document.getElementById('tbm-' + id)
    if (menu) {
      menu.classList.add('open')
      _tbOpen.current = id
    }
  }
}

function tbClose() {
  if (_tbOpen.current) {
    const menu = document.getElementById('tbm-' + _tbOpen.current)
    if (menu) menu.classList.remove('open')
    _tbOpen.current = null
  }
}

// Close on outside click
document.addEventListener('click', (e) => {
  if (_tbOpen.current && !e.target.closest('.tb-menu')) tbClose()
}, true)

// Keyboard: Escape closes
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && _tbOpen.current) { tbClose(); e.stopPropagation() }
}, true)

// ── End Topbar Menu System ────────────────────────────────────────────────────

function undo() {
  const { past, future, sections } = editorStore.getState()
  if (!past.length) return
  const current = snap('undo')
  const prev    = past[past.length - 1]
  editorStore.setState({
    sections: JSON.parse(JSON.stringify(prev.sections)),
    selected: null,
    past:     past.slice(0, -1),
    future:   [current, ...future].slice(0, MAX_HISTORY),
    isDirty:  true,
  }, 'undo')
  syncH()
  renderAll()
  toast(`Undone: ${prev.label}`, '↩')
}

function redo() {
  const { past, future } = editorStore.getState()
  if (!future.length) return
  const current = snap('redo')
  const next    = future[0]
  editorStore.setState({
    sections: JSON.parse(JSON.stringify(next.sections)),
    selected: null,
    past:     [...past, current].slice(-MAX_HISTORY),
    future:   future.slice(1),
    isDirty:  true,
  }, 'redo')
  syncH()
  renderAll()
  toast(`Redone: ${next.label}`, '↪')
}

// ── Time-travel: jump to any snapshot in history ──────────────────────────────
function timeTravelTo(idx) {
  const { past, future } = editorStore.getState()
  const allHistory = [...past, ...future]
  const target = past[idx]
  if (!target) return
  const current = snap('time-travel')

  // Save current position in future so user can redo back
  editorStore.setState({
    sections: JSON.parse(JSON.stringify(target.sections)),
    selected: null,
    past:     past.slice(0, idx),
    future:   [current, ...past.slice(idx + 1), ...future].slice(0, MAX_HISTORY),
    isDirty:  true,
  }, 'time-travel')
  syncH()
  renderAll()
  toast(`Jumped to: ${target.label}`, '⏱')
  closeHistoryPanel()
}

// ── Named snapshot save (bookmark) ───────────────────────────────────────────
function saveNamedSnapshot() {
  const name = prompt('Name this checkpoint:', `Checkpoint ${new Date().toLocaleTimeString()}`)
  if (!name) return
  pushH('⭐ ' + name)
  toast(`Checkpoint saved: ${name}`, '⭐')
}

// ── setProp — now uses store ──────────────────────────────────────────────────
function setProp(id, key, val, hist = false) {
  if (!Security.limiters.setProp()) return  // rate limit
  // Sanitize the incoming value based on prop semantics
  let safeVal
  if (Security.URL_KEYS.has(key))      safeVal = Security.sanitizeURL(val)
  else if (Security.CSS_KEYS.has(key)) safeVal = Security.sanitizeCSS(val)
  else if (key === 'code')             safeVal = Security.validateText(val, 50000)
  else                                  safeVal = Security.validateText(val)
  if (hist) pushH(`edit ${key}`)
  editorStore.produce(draft => {
    const sec = draft.sections.find(s => s.id === id)
    if (sec) sec.props[key] = safeVal
  }, `setProp:${key}`)
  const sec = editorStore.getState().sections.find(s => s.id === id)
  if (sec) patchSection(sec)
  scheduleLive()
  // Collab: broadcast prop change (debounced per key in emitSectionUpdate)
  if (typeof Collab !== 'undefined') Collab.emitSectionUpdate(id, key, safeVal)
}

// ══════════════════════════════════════════════════════
