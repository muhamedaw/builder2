/* sidebar-pages.js Phase 6 */

/* MULTI-PAGE SYSTEM
══════════════════════════════════════════════════════ */

// ── Generate a unique page id ─────────────────────────────────────────────────
function uid_page() { return 'pg' + Date.now() + '_' + Math.random().toString(36).slice(2,6) }

// ── Flush current canvas sections back into the active page object ────────────
function _flushPageSections() {
  const { pages, activePageId, sections } = projectStore.getState()
  if (!activePageId || !pages.length) return
  const idx = pages.findIndex(p => p.id === activePageId)
  if (idx === -1) return
  const copy = [...pages]
  copy[idx] = { ...copy[idx], sections: JSON.parse(JSON.stringify(sections)) }
  projectStore.setState({ pages: copy })
}

// ── Switch active page ─────────────────────────────────────────────────────────
function switchPage(pageId) {
  const { pages, activePageId } = projectStore.getState()
  if (pageId === activePageId) return
  _flushPageSections()
  const newPage = pages.find(p => p.id === pageId)
  if (!newPage) return
  projectStore.setState({
    activePageId: pageId,
    sections:     JSON.parse(JSON.stringify(newPage.sections)),
    selected:     null,
    isDirty:      true,
  }, 'switch-page')
  const titleEl = document.getElementById('page-title')
  if (titleEl) titleEl.value = newPage.name
  renderAll()
  renderPagesPanel()
  renderPagesNavStrip()
  toast(`"${newPage.name}"`, '📄')
}

// ── Add a new blank page ──────────────────────────────────────────────────────
function addPage(name) {
  const { pages } = projectStore.getState()
  name = (name || 'Page ' + (pages.length + 1)).trim()
  _flushPageSections()
  const id = uid_page()
  const newPages = [...pages, { id, name, sections: [] }]
  projectStore.setState({
    pages:        newPages,
    activePageId: id,
    sections:     [],
    selected:     null,
    isDirty:      true,
  }, 'add-page')
  const titleEl = document.getElementById('page-title')
  if (titleEl) titleEl.value = name
  renderAll()
  renderPagesPanel()
  renderPagesNavStrip()
  toast(`"${name}" added`, '📄')
}

// ── Rename a page ─────────────────────────────────────────────────────────────
function renamePage(pageId, newName) {
  if (!newName?.trim()) return
  const { pages, activePageId } = projectStore.getState()
  const idx = pages.findIndex(p => p.id === pageId)
  if (idx === -1) return
  const copy = [...pages]
  copy[idx] = { ...copy[idx], name: newName.trim() }
  projectStore.setState({ pages: copy, isDirty: true }, 'rename-page')
  if (pageId === activePageId) {
    const titleEl = document.getElementById('page-title')
    if (titleEl) titleEl.value = newName.trim()
  }
  renderPagesPanel()
  renderPagesNavStrip()
}

// ── Delete a page ─────────────────────────────────────────────────────────────
function deletePage(pageId) {
  const { pages, activePageId } = projectStore.getState()
  if (pages.length <= 1) return toast('Cannot delete the only page', '⚠️')
  const pg = pages.find(p => p.id === pageId)
  if (!confirm(`Delete "${pg?.name || 'page'}"?`)) return
  const newPages = pages.filter(p => p.id !== pageId)
  if (pageId === activePageId) {
    const next = newPages[0]
    projectStore.setState({
      pages:        newPages,
      activePageId: next.id,
      sections:     JSON.parse(JSON.stringify(next.sections)),
      selected:     null,
      isDirty:      true,
    }, 'delete-page')
    const titleEl = document.getElementById('page-title')
    if (titleEl) titleEl.value = next.name
    renderAll()
  } else {
    projectStore.setState({ pages: newPages, isDirty: true }, 'delete-page')
  }
  renderPagesPanel()
  renderPagesNavStrip()
  toast(`"${pg?.name}" deleted`, '🗑')
}

// ── Duplicate a page ──────────────────────────────────────────────────────────
function duplicatePage(pageId) {
  _flushPageSections()
  const { pages } = projectStore.getState()
  const src = pages.find(p => p.id === pageId)
  if (!src) return
  const id   = uid_page()
  const copy = { id, name: src.name + ' (copy)', sections: JSON.parse(JSON.stringify(src.sections)) }
  const srcIdx = pages.findIndex(p => p.id === pageId)
  const newPages = [...pages]
  newPages.splice(srcIdx + 1, 0, copy)
  projectStore.setState({
    pages:        newPages,
    activePageId: id,
    sections:     JSON.parse(JSON.stringify(copy.sections)),
    selected:     null,
    isDirty:      true,
  }, 'dup-page')
  const titleEl = document.getElementById('page-title')
  if (titleEl) titleEl.value = copy.name
  renderAll()
  renderPagesPanel()
  renderPagesNavStrip()
  toast(`"${copy.name}" created`, '⧉')
}

// ── Prompt to rename page (double-click) ──────────────────────────────────────
function promptRenamePage(pageId) {
  const { pages } = projectStore.getState()
  const pg = pages.find(p => p.id === pageId)
  if (!pg) return
  const n = prompt('Rename page:', pg.name)
  if (n && n.trim()) renamePage(pageId, n.trim())
}

// ── Render pages list in sidebar ──────────────────────────────────────────────
function renderPagesPanel() {
  const el = document.getElementById('pages-list')
  if (!el) return
  const { pages, activePageId } = projectStore.getState()
  if (!pages.length) { el.innerHTML = '<p style="color:var(--muted);font-size:11px;text-align:center;padding:20px 8px">No pages yet</p>'; return }
  el.innerHTML = pages.map((p, i) => `
    <div class="page-item${p.id === activePageId ? ' active' : ''}" data-pid="${p.id}" onclick="switchPage('${p.id}')">
      <span class="page-item-icon">${i === 0 ? '🏠' : '📄'}</span>
      <span class="page-item-name" title="${e(p.name)}" ondblclick="event.stopPropagation();promptRenamePage('${p.id}')">${e(p.name)}</span>
      <div class="page-item-actions">
        <button onclick="event.stopPropagation();promptRenamePage('${p.id}')" title="Rename">✏️</button>
        <button onclick="event.stopPropagation();duplicatePage('${p.id}')" title="Duplicate">⧉</button>
        <button class="danger" onclick="event.stopPropagation();deletePage('${p.id}')" title="Delete">✕</button>
      </div>
    </div>`).join('')
}

// ── Render pages nav strip above canvas ──────────────────────────────────────
function renderPagesNavStrip() {
  if (typeof projectStore === 'undefined') return
  const el = document.getElementById('pages-nav-strip')
  if (!el) return
  const { pages, activePageId } = projectStore.getState()
  if (pages.length <= 1) { el.style.display = 'none'; return }
  el.style.display = 'flex'
  el.innerHTML = pages.map(p => `
    <button class="pages-nav-tab${p.id === activePageId ? ' active' : ''}" onclick="switchPage('${p.id}')">${e(p.name)}</button>
  `).join('')
}

// ── Init pages on first load (migrates single-page data) ─────────────────────
function initPages() {
  const { pages, activePageId, sections } = projectStore.getState()
  if (pages.length === 0) {
    // First time: wrap existing sections into "Home" page
    const titleEl = document.getElementById('page-title')
    const homeName = titleEl?.value?.trim() || 'Home'
    const id = uid_page()
    projectStore.setState({
      pages:        [{ id, name: homeName, sections: JSON.parse(JSON.stringify(sections)) }],
      activePageId: id,
    }, 'init-pages')
  } else {
    // Reload: restore sections of active page
    const active = pages.find(p => p.id === activePageId) || pages[0]
    projectStore.setState({
      activePageId: active.id,
      sections:     JSON.parse(JSON.stringify(active.sections)),
    }, 'restore-active-page')
    const titleEl = document.getElementById('page-title')
    if (titleEl) titleEl.value = active.name
  }
  renderPagesPanel()
  renderPagesNavStrip()
}

