/* ══════════════════════════════════════════════════════
   SAVED COMPONENTS SYSTEM
══════════════════════════════════════════════════════ */

// ── Storage ───────────────────────────────────────────────────────────────────
const SC_KEY = 'pc_saved_components_v1'

function scKey() {
  return SC_KEY + (AUTH.user ? '_' + AUTH.user.id : '_guest')
}
function scLoad() {
  try { return JSON.parse(localStorage.getItem(scKey()) || '{}') } catch { return {} }
}
function scSave(db) {
  try { localStorage.setItem(scKey(), JSON.stringify(db)) } catch {
    toast('Storage full — delete some components', '⚠️')
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
function scCreate(data) {
  const db = scLoad()
  const id = 'sc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
  const comp = {
    id,
    name:       data.name,
    desc:       data.desc || '',
    category:   data.category || 'Uncategorised',
    tags:       Array.isArray(data.tags) ? data.tags : [],
    sectionType:data.sectionType,
    props:      JSON.parse(JSON.stringify(data.props || {})),
    thumbnail:  data.thumbnail || '',
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString(),
    usageCount: 0,
    userId:     AUTH.user?.id || 'guest',
  }
  db[id] = comp
  scSave(db)
  return comp
}

function scGetAll() {
  const db = scLoad()
  return Object.values(db).filter(c => c.userId === (AUTH.user?.id || 'guest'))
}

function scDelete(id) {
  const db = scLoad()
  const name = db[id]?.name || 'component'
  if (!confirm(`Delete "${name}"?\n\nThis cannot be undone.`)) return false
  delete db[id]
  scSave(db)
  return true
}

function scRename(id, newName) {
  const db = scLoad()
  if (!db[id] || !newName.trim()) return
  db[id].name = newName.trim()
  db[id].updatedAt = new Date().toISOString()
  scSave(db)
}

function scDuplicate(id) {
  const db  = scLoad()
  const src = db[id]; if (!src) return
  const copy = { ...src, id: undefined, name: src.name + ' (copy)', createdAt: undefined }
  delete copy.id; delete copy.createdAt
  return scCreate(copy)
}

// ── Insert component into canvas ──────────────────────────────────────────────
function scInsert(id, ev) {
  ev?.stopPropagation()
  const db   = scLoad()
  const comp = db[id]; if (!comp) return

  if (!DEFS[comp.sectionType]) {
    toast(`Section type "${comp.sectionType}" no longer exists`, '⚠️'); return
  }

  pushH('Insert component: ' + comp.name)

  const sec = {
    id:    uid(),
    type:  comp.sectionType,
    props: JSON.parse(JSON.stringify(comp.props)),
  }

  // Insert after selected, or at end
  const insertIdx = S.selected
    ? S.sections.findIndex(s => s.id === S.selected) + 1
    : S.sections.length
  S.sections.splice(insertIdx, 0, sec)
  S.selected = sec.id

  // Increment usage counter
  db[id].usageCount = (db[id].usageCount || 0) + 1
  db[id].updatedAt  = new Date().toISOString()
  scSave(db)

  renderAll()
  scrollToSection(sec.id)
  toast(`"${comp.name}" inserted`, '★')
}

// ── Save-as-component flow ────────────────────────────────────────────────────
let _sacTargetId = null
let _sacTags     = []

function saveAsComponent(sectionId, ev) {
  ev?.stopPropagation()
  if (!AUTH.user) { showAuthGate(); return }

  const sec = S.sections.find(s => s.id === sectionId)
  if (!sec) return

  _sacTargetId = sectionId
  _sacTags     = []

  // Pre-fill modal fields
  const def = DEFS[sec.type]
  document.getElementById('sac-preview-type').textContent = def?.label || sec.type
  document.getElementById('sac-name').value    = (def?.label || 'Component') + ' ' + new Date().toLocaleDateString()
  document.getElementById('sac-desc').value    = ''
  document.getElementById('sac-category').value= def?.label ? guessCategoryFromType(sec.type) : ''

  renderSacTags()
  document.getElementById('sac-modal').classList.remove('hidden')
  setTimeout(() => document.getElementById('sac-name').focus(), 80)
}

function guessCategoryFromType(type) {
  if (type === 'hero')        return 'Hero'
  if (type === 'pricing')     return 'Pricing'
  if (type === 'faq')         return 'FAQ'
  if (type === 'gallery')     return 'Gallery'
  if (type === 'features')    return 'Features'
  if (type === 'testimonial') return 'Testimonial'
  if (type === 'contact')     return 'Contact'
  if (type === 'footer')      return 'Footer'
  if (type.startsWith('scene-')) return '3D Scenes'
  return 'General'
}

function closeSacModal() {
  document.getElementById('sac-modal').classList.add('hidden')
  _sacTargetId = null
  _sacTags     = []
}

function confirmSaveComponent() {
  const name     = document.getElementById('sac-name').value.trim()
  const desc     = document.getElementById('sac-desc').value.trim()
  const category = document.getElementById('sac-category').value.trim()

  if (!name) { toast('Enter a component name', '⚠️'); return }
  if (!_sacTargetId) return

  const sec  = S.sections.find(s => s.id === _sacTargetId)
  if (!sec) { closeSacModal(); return }

  const comp = scCreate({
    name,
    desc,
    category: category || guessCategoryFromType(sec.type),
    tags:        _sacTags,
    sectionType: sec.type,
    props:       sec.props,
    thumbnail:   DEFS[sec.type]?.color || '#6c63ff',
  })

  closeSacModal()
  renderSavedComponentList()   // refresh sidebar
  toast(`"${comp.name}" saved to My Components`, '★')
}

// ── Tag helpers in save modal ─────────────────────────────────────────────────
function sacTagKeydown(ev) {
  if (ev.key !== 'Enter' && ev.key !== ',') return
  ev.preventDefault()
  const val = ev.target.value.trim().replace(/,$/, '')
  if (val && !_sacTags.includes(val)) {
    _sacTags.push(val)
    renderSacTags()
  }
  ev.target.value = ''
}

function sacRemoveTag(tag) {
  _sacTags = _sacTags.filter(t => t !== tag)
  renderSacTags()
}

function renderSacTags() {
  const wrap = document.getElementById('sac-tags-wrap')
  if (!wrap) return
  const inp  = wrap.querySelector('.sac-tag-inp')
  wrap.innerHTML = _sacTags.map(t =>
    `<span class="sac-tag">${e(t)}<span class="sac-tag-x" onclick="sacRemoveTag('${e(t)}')">×</span></span>`
  ).join('')
  if (inp) wrap.appendChild(inp)
  else {
    const newInp = document.createElement('input')
    newInp.className   = 'sac-tag-inp'
    newInp.id          = 'sac-tag-inp'
    newInp.placeholder = 'Add tag…'
    newInp.setAttribute('onkeydown', 'sacTagKeydown(event)')
    wrap.appendChild(newInp)
  }
}

// ── Sidebar saved component list ──────────────────────────────────────────────
function renderSavedComponentList() {
  const el = document.getElementById('saved-component-list')
  if (!el) return

  const comps = scGetAll()
  if (!comps.length) {
    el.innerHTML = `<p style="font-size:11px;color:var(--muted);text-align:center;padding:10px 8px">
      Select a section → click <strong style="color:var(--accent)">★</strong> to save
    </p>`
    return
  }

  // Show max 8 in sidebar, sorted by usage + recency
  const sorted = [...comps].sort((a, b) =>
    (b.usageCount || 0) - (a.usageCount || 0) || b.updatedAt.localeCompare(a.updatedAt)
  ).slice(0, 8)

  el.innerHTML = sorted.map(comp => {
    const def   = DEFS[comp.sectionType]
    const icon  = def?.icon || '◈'
    const color = comp.thumbnail || def?.color || '#6c63ff22'
    return `
      <div class="saved-comp-card" onclick="scInsert('${comp.id}',event)" title="${e(comp.desc || comp.name)}">
        <div class="saved-comp-icon" style="background:${color}">${icon}</div>
        <div class="saved-comp-info">
          <div class="saved-comp-name">${e(comp.name)}</div>
          <div class="saved-comp-type">${e(comp.category)} · used ${comp.usageCount || 0}×</div>
        </div>
        <div class="saved-comp-actions" onclick="event.stopPropagation()">
          <button class="saved-comp-btn" onclick="scInsert('${comp.id}')" title="Insert">+</button>
          <button class="saved-comp-btn del" onclick="scDeleteAndRefresh('${comp.id}')" title="Delete">×</button>
        </div>
      </div>`
  }).join('')

  if (comps.length > 8) {
    el.innerHTML += `<p style="font-size:10px;color:var(--muted);text-align:center;margin:4px 0 2px">
      +${comps.length - 8} more — <span style="color:var(--accent);cursor:pointer" onclick="openSavedComponents()">View all</span>
    </p>`
  }
}

function scDeleteAndRefresh(id) {
  if (scDelete(id)) {
    renderSavedComponentList()
    renderSCMGrid()
    toast('Component deleted', '🗑')
  }
}

// ── Manager modal ─────────────────────────────────────────────────────────────
function openSavedComponents() {
  if (!AUTH.user) { showAuthGate(); return }
  document.getElementById('scm-modal').classList.remove('hidden')
  renderSCMGrid()
}

function closeSavedComponents() {
  document.getElementById('scm-modal').classList.add('hidden')
}

document.addEventListener('click', ev => {
  if (ev.target === document.getElementById('scm-modal')) closeSavedComponents()
  if (ev.target === document.getElementById('sac-modal')) closeSacModal()
})

function renderSCMGrid() {
  const grid    = document.getElementById('scm-grid')
  const search  = (document.getElementById('scm-search')?.value || '').toLowerCase()
  const catFilt = document.getElementById('scm-cat-filter')?.value || ''
  if (!grid) return

  let comps = scGetAll()

  // Populate category filter
  const cats = [...new Set(comps.map(c => c.category).filter(Boolean))].sort()
  const catSel = document.getElementById('scm-cat-filter')
  if (catSel && catSel.children.length <= 1) {
    cats.forEach(cat => {
      const opt = document.createElement('option')
      opt.value = cat; opt.textContent = cat
      catSel.appendChild(opt)
    })
  }

  // Filter
  if (search) comps = comps.filter(c =>
    c.name.toLowerCase().includes(search) ||
    (c.desc||'').toLowerCase().includes(search) ||
    (c.tags||[]).some(t => t.toLowerCase().includes(search))
  )
  if (catFilt) comps = comps.filter(c => c.category === catFilt)

  // Sort by usage then date
  comps.sort((a, b) => (b.usageCount||0) - (a.usageCount||0) || (b.createdAt||'').localeCompare(a.createdAt||''))

  if (!comps.length) {
    grid.innerHTML = `
      <div class="scm-empty" style="grid-column:1/-1">
        <div class="scm-empty-icon">★</div>
        <h3>${search || catFilt ? 'No matches found' : 'No saved components yet'}</h3>
        <p>${search || catFilt ? 'Try a different search or category' : 'Click the ★ button on any canvas section to save it as a reusable component'}</p>
      </div>`
    return
  }

  grid.innerHTML = comps.map((comp, i) => {
    const def  = DEFS[comp.sectionType]
    const icon = def?.icon || '◈'
    const bg   = comp.thumbnail || '#6c63ff22'
    const ago  = formatTimeAgo(comp.updatedAt)

    return `
      <div class="scm-card" style="animation-delay:${i * 30}ms">
        <div class="scm-card-thumb">
          <div class="scm-card-thumb-bg" style="background:${bg}"></div>
          <div class="scm-card-thumb-icon">${icon}</div>
          <div style="position:absolute;top:6px;right:6px;font-size:10px;background:rgba(0,0,0,.4);color:#fff;padding:2px 7px;border-radius:8px;backdrop-filter:blur(4px)">
            ${e(comp.category)}
          </div>
          ${comp.usageCount ? `<div style="position:absolute;bottom:6px;left:6px;font-size:9px;background:rgba(108,99,255,.5);color:#fff;padding:1px 6px;border-radius:8px">used ${comp.usageCount}×</div>` : ''}
        </div>
        <div class="scm-card-body">
          <div class="scm-card-name" title="${e(comp.name)}">${e(comp.name)}</div>
          <div class="scm-card-meta">${e(def?.label || comp.sectionType)} · ${ago}</div>
          ${comp.desc ? `<div style="font-size:10px;color:var(--muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e(comp.desc)}</div>` : ''}
          ${(comp.tags||[]).length ? `<div class="scm-card-tags">
            ${comp.tags.slice(0,3).map(t=>`<span class="scm-card-tag">${e(t)}</span>`).join('')}
          </div>` : ''}
        </div>
        <div class="scm-card-actions">
          <button class="scm-card-btn primary" onclick="scInsert('${comp.id}');closeSavedComponents()">+ Insert</button>
          <button class="scm-card-btn" onclick="scmRenamePrompt('${comp.id}')">✏</button>
          <button class="scm-card-btn" onclick="scDuplicate('${comp.id}');renderSCMGrid();renderSavedComponentList();toast('Duplicated','⧉')">⧉</button>
          <button class="scm-card-btn danger" onclick="scDeleteAndRefresh('${comp.id}');document.getElementById('scm-cat-filter').innerHTML='<option value=\\\"\\\">'+'All categories'+'</option>';renderSCMGrid()">🗑</button>
        </div>
      </div>`
  }).join('')
}

function scmRenamePrompt(id) {
  const db  = scLoad()
  const old = db[id]?.name
  if (!old) return
  const nw  = prompt('Rename component:', old)
  if (nw && nw.trim() !== old) {
    scRename(id, nw)
    renderSCMGrid()
    renderSavedComponentList()
    toast('Renamed', '✏️')
  }
}

// ── Export / Import ───────────────────────────────────────────────────────────
function scmExportAll() {
  const comps = scGetAll()
  if (!comps.length) { toast('No components to export', '⚠️'); return }

  const blob = new Blob([JSON.stringify({
    format:     'pagecraft-components-v1',
    exportedAt: new Date().toISOString(),
    count:      comps.length,
    components: comps,
  }, null, 2)], { type: 'application/json' })

  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url; a.download = 'my-components.pagecraft.json'; a.click()
  URL.revokeObjectURL(url)
  toast(`Exported ${comps.length} component(s)`, '⬇')
}

function scmImportAll() {
  const inp = document.createElement('input')
  inp.type  = 'file'; inp.accept = '.json'
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data  = JSON.parse(ev.target.result)
        const items = data.components || (Array.isArray(data) ? data : null)
        if (!items) throw new Error('Not a valid PageCraft components file')

        const db = scLoad()
        let count = 0
        items.forEach(comp => {
          if (!comp.name || !comp.sectionType) return
          const id  = 'sc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
          const now = new Date().toISOString()
          db[id] = { ...comp, id, userId: AUTH.user?.id || 'guest', createdAt: comp.createdAt || now, updatedAt: now }
          count++
        })
        scSave(db)
        renderSavedComponentList()
        renderSCMGrid()
        toast(`Imported ${count} component(s)`, '📂')
      } catch(err) { toast('Import failed: ' + err.message, '⚠️') }
    }
    reader.readAsText(f)
  }
  inp.click()
}

// ── Refresh saved list when sections change ───────────────────────────────────
editorStore.subscribe(() => {
  if (typeof renderSavedComponentList === 'function') renderSavedComponentList()
})
