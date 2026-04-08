/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   PROJECT SYSTEM
   Save / Load / Delete / Rename / Import / Export
   Storage: localStorage keyed per user
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

const PROJ_STORE_KEY = 'pc_projects_v1'
const PROJ_CURRENT   = 'pc_current_project_v1'

// ── Helpers ───────────────────────────────────────────────────────────────────
function projStorageKey() {
  // Namespace by user so multiple accounts on same browser don't mix
  return PROJ_STORE_KEY + (AUTH.user ? '_' + AUTH.user.id : '_guest')
}

function loadAllProjects() {
  try {
    return JSON.parse(localStorage.getItem(projStorageKey()) || '{}')
  } catch { return {} }
}

function saveAllProjects(db) {
  try {
    localStorage.setItem(projStorageKey(), JSON.stringify(db))
  } catch {
    toast('Storage full — delete some projects first', '⚠️')
  }
}

function projId() {
  return 'prj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
}

// ── Thumbnail gradient based on section types ─────────────────────────────────
function projThumbGradient(sections) {
  const colors = {
    hero:'#6c63ff', about:'#10b981', contact:'#f59e0b', features:'#8b5cf6',
    testimonial:'#ec4899', footer:'#64748b', pricing:'#0ea5e9', faq:'#f59e0b',
    gallery:'#ec4899', 'scene-particles':'#6366f1', 'scene-waves':'#0ea5e9',
    'scene-globe':'#10b981', 'scene-cards':'#f59e0b',
  }
  const types = [...new Set((sections||[]).map(s=>s.type))].slice(0,3)
  if (!types.length) return 'linear-gradient(135deg,#1e1e24,#2d2d36)'
  if (types.length === 1) {
    const c = colors[types[0]] || '#6c63ff'
    return `linear-gradient(135deg,${c}88,${c}33)`
  }
  const c1 = colors[types[0]] || '#6c63ff'
  const c2 = colors[types[1]] || '#a78bfa'
  return `linear-gradient(135deg,${c1},${c2}66)`
}

// ── Create / Save project ─────────────────────────────────────────────────────
function createProject({ name, description = '', tags = '' } = {}) {
  if (!AUTH.user) { showAuthGate(); return null }
  if (!S.sections.length) { toast('Add sections before saving','⚠️'); return null }

  _flushPageSections()
  const { pages, activePageId } = projectStore.getState()
  const id      = projId()
  const db      = loadAllProjects()
  const project = {
    id,
    name:         name || document.getElementById('page-title').value || 'Untitled Project',
    description,
    tags:         tags ? tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
    sections:     JSON.parse(JSON.stringify(S.sections)),
    sectionCount: S.sections.length,
    pages:        JSON.parse(JSON.stringify(pages)),
    activePageId: activePageId,
    createdAt:    new Date().toISOString(),
    updatedAt:    new Date().toISOString(),
    thumbnail:    projThumbGradient(S.sections),
    userId:       AUTH.user.id,
    version:      '2.0',
  }
  db[id] = project
  saveAllProjects(db)
  localStorage.setItem(PROJ_CURRENT, id)
  return project
}

function updateProject(id, updates) {
  const db = loadAllProjects()
  if (!db[id]) return false
  db[id] = {
    ...db[id],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveAllProjects(db)
  return true
}

function deleteProject(id) {
  const db = loadAllProjects()
  const name = db[id]?.name || 'this project'
  if (!confirm(`Delete "${name}"?\n\nThis cannot be undone.`)) return false
  delete db[id]
  saveAllProjects(db)
  if (localStorage.getItem(PROJ_CURRENT) === id) localStorage.removeItem(PROJ_CURRENT)
  renderProjContent()
  toast(`"${name}" deleted`, '🗑')
  return true
}

function renameProject(id, newName) {
  if (!newName.trim()) return
  updateProject(id, { name: newName.trim() })
  renderProjContent()
  toast('Renamed', '✏️')
}

// ── Load project into canvas ──────────────────────────────────────────────────
function loadProject_fromStore(id) {
  const db  = loadAllProjects()
  const prj = db[id]
  if (!prj) return toast('Project not found', '⚠️')

  if (S.sections.length && !confirm(`Open "${prj.name}"?\nUnsaved changes will be lost.`)) return

  pushH('Open project: ' + prj.name)

  // ── Multi-page support ───────────────────────────────────────────────────────
  if (prj.pages && prj.pages.length > 0) {
    // Project has pages array — restore full multi-page structure
    const activeId = prj.activePageId || prj.pages[0].id
    const activePg = prj.pages.find(p => p.id === activeId) || prj.pages[0]
    // Re-generate IDs for sections to avoid conflicts
    const remappedPages = prj.pages.map(pg => ({
      ...pg,
      id:       uid_page(),
      sections: pg.sections.map(s => ({ ...s, id: uid() })),
    }))
    // Keep activePageId mapped to new id
    const origIdx    = prj.pages.findIndex(p => p.id === activeId)
    const newActiveId = remappedPages[origIdx]?.id || remappedPages[0].id
    const newActivePg = remappedPages.find(p => p.id === newActiveId) || remappedPages[0]
    editorStore.setState({
      sections:     JSON.parse(JSON.stringify(newActivePg.sections)),
      pages:        remappedPages,
      activePageId: newActiveId,
      selected:     null,
      isDirty:      false,
    }, 'load-project')
    const titleEl = document.getElementById('page-title')
    if (titleEl) titleEl.value = newActivePg.name
  } else {
    // Legacy project (no pages) — wrap in single page
    const sections = prj.sections.map(s => ({ ...s, id: uid() }))
    const newPageId = uid_page()
    editorStore.setState({
      sections,
      pages:        [{ id: newPageId, name: prj.name, sections }],
      activePageId: newPageId,
      selected:     null,
      isDirty:      false,
    }, 'load-project')
    const titleEl = document.getElementById('page-title')
    if (titleEl) titleEl.value = prj.name
  }

  // Mark as current
  localStorage.setItem(PROJ_CURRENT, id)

  closeProjects()
  renderAll()
  renderPagesPanel()
  renderPagesNavStrip()
  toast(`"${prj.name}" opened`, '📁')
}

// ── Duplicate project ─────────────────────────────────────────────────────────
function duplicateProject(id) {
  const db  = loadAllProjects()
  const src = db[id]
  if (!src) return
  const copy = {
    ...src,
    id:        projId(),
    name:      src.name + ' (copy)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db[copy.id] = copy
  saveAllProjects(db)
  renderProjContent()
  toast(`Duplicated as "${copy.name}"`, '⧉')
}

// ── Quick save (save current canvas into a new/updated project) ───────────────
function projQuickSave() {
  if (!AUTH.user) { showAuthGate(); return }
  if (!S.sections.length) { toast('Add sections first','⚠️'); return }

  // Check if there's a current project to update
  const currentId = localStorage.getItem(PROJ_CURRENT)
  const db        = loadAllProjects()

  if (currentId && db[currentId] && db[currentId].userId === AUTH.user.id) {
    _flushPageSections()
    const { pages, activePageId } = projectStore.getState()
    // Update existing project
    updateProject(currentId, {
      sections:     JSON.parse(JSON.stringify(S.sections)),
      sectionCount: S.sections.length,
      thumbnail:    projThumbGradient(S.sections),
      name:         document.getElementById('page-title')?.value || db[currentId].name,
      pages:        JSON.parse(JSON.stringify(pages)),
      activePageId: activePageId,
    })
    renderProjContent()
    toast(`"${db[currentId].name}" updated`, '💾')
  } else {
    // Create new
    projNav('save')
  }
}

// ── Import / Export ───────────────────────────────────────────────────────────
function projExportFile(id) {
  const db  = loadAllProjects()
  const prj = db[id]
  if (!prj) return
  const blob = new Blob([JSON.stringify(prj, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const slug = prj.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') || 'project'
  a.href = url; a.download = `${slug}.pagecraft.json`; a.click()
  URL.revokeObjectURL(url)
  toast(`Exported "${prj.name}"`, '⬇')
}

function projExportAll() {
  const db = loadAllProjects()
  const all = Object.values(db)
  if (!all.length) { toast('No projects to export','⚠️'); return }
  const blob = new Blob([JSON.stringify({ projects: all, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'pagecraft-all-projects.json'; a.click()
  URL.revokeObjectURL(url)
  toast(`Exported ${all.length} project(s)`, '⬇')
}

function projImportFile() {
  const inp = document.createElement('input')
  inp.type = 'file'; inp.accept = '.json'
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        const db   = loadAllProjects()
        let count  = 0

        // Accept single project or export-all bundle
        const projects = data.projects || (data.id ? [data] : null)
        if (!projects) throw new Error('Not a valid PageCraft project file')

        projects.forEach(prj => {
          if (!prj.sections || !prj.name) return
          const id = projId()
          db[id] = { ...prj, id, userId: AUTH.user.id, updatedAt: new Date().toISOString() }
          count++
        })

        saveAllProjects(db)
        renderProjContent()
        toast(`Imported ${count} project(s)`, '📂')
      } catch(err) {
        toast('Invalid file: ' + err.message, '⚠️')
      }
    }
    reader.readAsText(f)
  }
  inp.click()
}

// ── Panel UI ──────────────────────────────────────────────────────────────────
const PROJ_UI = { view: 'all', search: '', sort: 'updated' }

function openProjects() {
  if (!AUTH.user) { showAuthGate(); toast('Sign in to use Projects','🔒'); return }
  document.getElementById('proj-modal').classList.remove('hidden')
  projNav('all')
}

function closeProjects() {
  document.getElementById('proj-modal').classList.add('hidden')
}

// Close on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('proj-modal')?.addEventListener('click', ev => {
    if (ev.target === document.getElementById('proj-modal')) closeProjects()
  })
})

function projNav(view) {
  PROJ_UI.view = view
  ;['all','recent','save','import'].forEach(v => {
    const btn = document.getElementById('pnav-'+v)
    if (btn) btn.classList.toggle('active', v === view)
  })
  if (view === 'import') { closeProjects(); projImportFile(); return }
  renderProjContent()
}

function renderProjContent() {
  const el = document.getElementById('proj-content')
  if (!el) return

  const db       = loadAllProjects()
  const projects = Object.values(db).filter(p => p.userId === AUTH.user?.id)

  // Update badge
  const badge = document.getElementById('pnav-badge')
  if (badge) badge.textContent = projects.length

  if (PROJ_UI.view === 'save') {
    renderSaveForm(el, projects)
    return
  }

  // Filter + sort
  let list = [...projects]
  if (PROJ_UI.search) {
    const q = PROJ_UI.search.toLowerCase()
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description||'').toLowerCase().includes(q) ||
      (p.tags||[]).some(t => t.toLowerCase().includes(q))
    )
  }
  if (PROJ_UI.view === 'recent') list = list.slice().sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6)
  else {
    const sorts = { updated: (a,b) => b.updatedAt.localeCompare(a.updatedAt), name: (a,b) => a.name.localeCompare(b.name), created: (a,b) => b.createdAt.localeCompare(a.createdAt), sections: (a,b) => b.sectionCount - a.sectionCount }
    list.sort(sorts[PROJ_UI.sort] || sorts.updated)
  }

  renderProjectsList(el, list, projects.length)
}

function renderSaveForm(el, projects) {
  const currentId = localStorage.getItem(PROJ_CURRENT)
  const current   = projects.find(p => p.id === currentId)

  el.innerHTML = `
    <div style="max-width:480px">
      <div class="proj-save-form">
        <div class="proj-save-title">💾 Save Current Page as Project</div>
        <div class="proj-form-row">
          <div class="proj-form-col">
            <label class="proj-form-label">Project Name *</label>
            <input class="proj-form-input" id="ps-name" placeholder="My Awesome Page"
              value="${e(document.getElementById('page-title')?.value || '')}"/>
          </div>
          <div class="proj-form-col">
            <label class="proj-form-label">Tags (comma separated)</label>
            <input class="proj-form-input" id="ps-tags" placeholder="landing, saas, dark"/>
          </div>
        </div>
        <div class="proj-form-col" style="margin-bottom:10px">
          <label class="proj-form-label">Description (optional)</label>
          <input class="proj-form-input" id="ps-desc" placeholder="Brief description of this project…"/>
        </div>
        ${!S.sections.length ? `<div style="font-size:12px;color:var(--danger);margin-bottom:10px">⚠ Canvas is empty — add sections before saving</div>` : `<div style="font-size:11px;color:var(--muted);margin-bottom:10px">Ready to save ${S.sections.length} section(s)</div>`}
        <button class="proj-save-btn" onclick="doSaveProject()" ${!S.sections.length?'disabled':''}>
          <span>💾</span> Save Project
        </button>
      </div>

      ${current ? `
        <div style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:8px;margin-bottom:14px">
          <span>Current project:</span>
          <strong style="color:var(--text)">${e(current.name)}</strong>
          <button onclick="projQuickSave();projNav('all')" style="background:none;border:1px solid var(--border2);border-radius:6px;color:var(--text2);font-size:11px;padding:2px 8px;cursor:pointer">Update it →</button>
        </div>` : ''}
    </div>`
}

function doSaveProject() {
  const name = document.getElementById('ps-name')?.value.trim()
  const desc = document.getElementById('ps-desc')?.value.trim()
  const tags = document.getElementById('ps-tags')?.value.trim()

  if (!name) { toast('Enter a project name','⚠️'); return }

  const prj = createProject({ name, description: desc, tags })
  if (!prj) return

  // Sync page title
  const titleEl = document.getElementById('page-title')
  if (titleEl) titleEl.value = prj.name

  projNav('all')
  toast(`"${prj.name}" saved!`, '💾')
}

function renderProjectsList(el, list, total) {
  const statsHtml = `
    <div class="proj-stats-bar">
      <div class="proj-stat"><div class="proj-stat-val">${total}</div><div class="proj-stat-lbl">Total</div></div>
      <div class="proj-stat"><div class="proj-stat-val">${list.length}</div><div class="proj-stat-lbl">Shown</div></div>
      <div class="proj-stat"><div class="proj-stat-val">${list.reduce((a,p)=>a+(p.sectionCount||0),0)}</div><div class="proj-stat-lbl">Sections</div></div>
    </div>`

  const searchHtml = `
    <div class="proj-search-bar">
      <input class="proj-search-inp" id="proj-search-inp" placeholder="🔍  Search projects…"
        value="${e(PROJ_UI.search)}" oninput="PROJ_UI.search=this.value;renderProjContent()"/>
      <select class="proj-sort-sel" onchange="PROJ_UI.sort=this.value;renderProjContent()">
        <option value="updated"  ${PROJ_UI.sort==='updated' ?'selected':''}>Last updated</option>
        <option value="name"     ${PROJ_UI.sort==='name'    ?'selected':''}>Name A–Z</option>
        <option value="created"  ${PROJ_UI.sort==='created' ?'selected':''}>Date created</option>
        <option value="sections" ${PROJ_UI.sort==='sections'?'selected':''}>Most sections</option>
      </select>
    </div>`

  if (!list.length) {
    el.innerHTML = statsHtml + searchHtml + `
      <div class="proj-empty">
        <div class="proj-empty-icon">📁</div>
        <h3>${PROJ_UI.search ? 'No matches found' : 'No projects yet'}</h3>
        <p>${PROJ_UI.search ? 'Try a different search term' : 'Save your current page as a project to get started'}</p>
        ${!PROJ_UI.search ? `<button class="proj-save-btn" style="width:auto;padding:9px 20px;margin-top:6px" onclick="projNav('save')"><span>💾</span> Save Current Page</button>` : ''}
      </div>`
    return
  }

  const currentId = localStorage.getItem(PROJ_CURRENT)

  const cards = list.map((p, i) => {
    const updatedAgo = formatTimeAgo(p.updatedAt)
    const isCurrent  = p.id === currentId
    const bars = Array.from({length: Math.min(p.sectionCount||1, 6)}, () =>
      `<div class="proj-thumb-bar"></div>`).join('')

    return `<div class="proj-card${isCurrent?' selected':''}" style="animation-delay:${i*40}ms"
      onclick="loadProject_fromStore('${p.id}')">
      <div class="proj-thumb">
        <div class="proj-thumb-gradient" style="background:${p.thumbnail}"></div>
        <div class="proj-thumb-count">${p.sectionCount||0} sections</div>
        <div class="proj-thumb-sections">${bars}</div>
      </div>
      <div class="proj-card-body">
        <div class="proj-card-name" title="${e(p.name)}">${isCurrent?'📌 ':''}${e(p.name)}</div>
        <div class="proj-card-meta">
          <span>${updatedAgo}</span>
          ${(p.tags||[]).length ? `<span class="proj-card-dot"></span><span>${p.tags.slice(0,2).join(', ')}</span>` : ''}
        </div>
        ${p.description ? `<div style="font-size:10px;color:var(--muted);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e(p.description)}</div>` : ''}
      </div>
      <div class="proj-card-actions" onclick="event.stopPropagation()">
        <button class="proj-card-btn primary" onclick="loadProject_fromStore('${p.id}')">Open</button>
        <button class="proj-card-btn" onclick="projRenamePrompt('${p.id}')">✏</button>
        <button class="proj-card-btn" onclick="duplicateProject('${p.id}')">⧉</button>
        <button class="proj-card-btn" onclick="projExportFile('${p.id}')">⬇</button>
        <button class="proj-card-btn danger" onclick="deleteProject('${p.id}')">🗑</button>
      </div>
    </div>`
  }).join('')

  el.innerHTML = statsHtml + searchHtml + `<div class="proj-grid">${cards}</div>`
}

function projRenamePrompt(id) {
  const db  = loadAllProjects()
  const prj = db[id]
  if (!prj) return
  const newName = prompt('Rename project:', prj.name)
  if (newName && newName.trim() !== prj.name) renameProject(id, newName)
}

function formatTimeAgo(iso) {
  if (!iso) return 'Unknown'
  const s = Math.round((Date.now() - new Date(iso)) / 1000)
  if (s < 60)   return 'Just now'
  if (s < 3600) return `${Math.round(s/60)}m ago`
  if (s < 86400)return `${Math.round(s/3600)}h ago`
  const d = Math.round(s/86400)
  return d === 1 ? 'Yesterday' : `${d} days ago`
}
