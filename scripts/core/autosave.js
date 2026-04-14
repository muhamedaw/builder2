/* autosave.js Phase 4/5 */

//  AUTO-SAVE MIDDLEWARE — debounced to localStorage
// ══════════════════════════════════════════════════════
const AUTO_SAVE_KEY  = 'pc_autosave_v1'
const AUTO_SAVE_META = 'pc_autosave_meta_v1'
let   autoSaveTimer  = null

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(doAutoSave, 800)
  // Stage 9: also trigger guest autosave (works without login)
  if (typeof Reliability !== 'undefined') Reliability.scheduleGuestSave()
}

// Save immediately before the page unloads — catches any unsaved changes
window.addEventListener('beforeunload', () => {
  clearTimeout(autoSaveTimer)
  doAutoSave()
})

function doAutoSave() {
  const st = editorStore.getState()
  if (!st.sections.length) return
  try {
    const payload = {
      sections:  st.sections,
      pageTitle: document.getElementById('page-title')?.value || 'My Page',
      savedAt:   new Date().toISOString(),
      userId:    AUTH?.user?.id || 'guest',
    }
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(payload))
    localStorage.setItem(AUTO_SAVE_META, JSON.stringify({
      savedAt:  payload.savedAt,
      sections: st.sections.length,
      pageTitle:payload.pageTitle,
    }))
    editorStore.setState({ isDirty: false, lastSaved: Date.now() }, 'autosave')
    updateAutoSaveBadge()
  } catch(e) {
    // localStorage quota exceeded — silently skip
  }
}

function restoreAutoSave() {
  try {
    const raw = localStorage.getItem(AUTO_SAVE_KEY)
    if (!raw) return false
    const payload = JSON.parse(raw)
    if (!payload?.sections?.length) return false
    if (payload.userId && payload.userId !== 'guest' && AUTH?.user && payload.userId !== AUTH.user.id) return false

    // Keep original section IDs — no uid() reassignment, avoids breaking _elStyles references
    editorStore.produce(draft => {
      draft.sections = payload.sections.map(s => ({ ...s }))
      draft.isDirty  = false
    }, 'restore-autosave')
    if (payload.pageTitle) {
      const t = document.getElementById('page-title')
      if (t) t.value = payload.pageTitle
    }
    renderAll()
    // Re-apply element-level CSS (_elStyles) after restore — style tag is rebuilt here
    // because pc:rendered fires during renderAll but Inspector may not be ready yet
    requestAnimationFrame(() => {
      const secs = editorStore.getState().sections
      secs.forEach(sec => {
        if (sec.props._elStyles && typeof Inspector !== 'undefined') {
          Inspector.restoreSection(sec.id)
        }
      })
    })
    const meta = JSON.parse(localStorage.getItem(AUTO_SAVE_META) || '{}')
    const savedAt = new Date(payload.savedAt).toLocaleString()
    toast(`Draft restored — ${meta.sections || payload.sections.length} sections (${savedAt})`, '↺')
    return true
  } catch { return false }
}

function updateAutoSaveBadge() {
  const st = editorStore.getState()
  const badge = document.getElementById('autosave-badge')
  if (!badge) return
  if (!st.lastSaved) { badge.textContent = ''; return }
  const secs = Math.round((Date.now() - st.lastSaved) / 1000)
  badge.textContent = secs < 5 ? 'Saved ✓' : `Saved ${secs}s ago`
}

// Refresh badge every 30s
setInterval(updateAutoSaveBadge, 30000)

// ══════════════════════════════════════════════════════
//  HISTORY PANEL — time-travel UI
// ══════════════════════════════════════════════════════
let historyPanelOpen = false

function openHistoryPanel() {
  historyPanelOpen = true
  renderHistoryPanel()
  document.getElementById('history-panel').classList.add('open')
}
function closeHistoryPanel() {
  historyPanelOpen = false
  document.getElementById('history-panel').classList.remove('open')
}
function toggleHistoryPanel() {
  historyPanelOpen ? closeHistoryPanel() : openHistoryPanel()
}

function renderHistoryPanel() {
  const el = document.getElementById('history-list')
  if (!el) return
  const { past, future } = editorStore.getState()

  if (!past.length && !future.length) {
    el.innerHTML = '<p style="color:var(--muted);font-size:12px;text-align:center;padding:28px 0">No history yet — start editing!</p>'
    return
  }

  // Show past (oldest→newest) then current, then future (newest→oldest)
  const items = [
    ...past.map((s, i) => ({ ...s, idx: i, type: 'past' })).reverse(),
    ...future.map((s, i) => ({ ...s, idx: i, type: 'future' })),
  ]

  el.innerHTML = items.map((item, i) => {
    const ago = formatAgo(item.timestamp)
    const isCurrent = i === 0 && item.type === 'past'
    const icon = item.type === 'future' ? '↪' : item.label?.startsWith('⭐') ? '⭐' : '↩'
    return `
      <div class="hist-item${isCurrent ? ' current' : ''}${item.type === 'future' ? ' future' : ''}"
        onclick="${item.type === 'past' ? `timeTravelTo(${item.idx})` : ''}">
        <span class="hist-icon">${icon}</span>
        <div class="hist-info">
          <div class="hist-label">${item.label || 'edit'}</div>
          <div class="hist-meta">${item.sections?.length ?? 0} sections · ${ago}</div>
        </div>
        ${isCurrent ? '<span class="hist-current-badge">Current</span>' : ''}
      </div>`
  }).join('')
}

function formatAgo(ts) {
  if (!ts) return ''
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60)  return `${s}s ago`
  if (s < 3600) return `${Math.round(s/60)}m ago`
  return `${Math.round(s/3600)}h ago`
}

// ── Logger middleware (dev tool) ──────────────────────────────────────────────
editorStore.use(({ action }) => {
  if (action === 'autosave' || action.startsWith('set:')) return // skip noisy ones
  // Uncomment for debugging:
  // console.log(`[Store] ${action}`, { sections: next.sections.length })
})

// ── Persist middleware (triggers auto-save on dirty state) ───────────────────
editorStore.subscribe((next, prev) => {
  if (next.sections !== prev.sections) scheduleAutoSave()
})

/* ── History (legacy aliases kept for compatibility) ── */
const syncHistoryBtns = syncH   // old name used in a few places

