/* ══════════════════════════════════════════════════════
   STAGE 5 — CMS ENGINE
   Collections · Data Binding · Auto Page Generator · Scheduler
══════════════════════════════════════════════════════ */

// ── Collections Storage ───────────────────────────────────────────────────────
const COLL_KEY = 'pc_cms_collections_v1'
const BIND_KEY = 'pc_cms_bindings_v1'

function collKey()  { return COLL_KEY + (AUTH.user ? '_' + AUTH.user.id : '_guest') }
function bindKey()  { return BIND_KEY + (AUTH.user ? '_' + AUTH.user.id : '_guest') }
function collLoad() { try { return JSON.parse(localStorage.getItem(collKey()) || '{}') } catch { return {} } }
function collSave(d){ localStorage.setItem(collKey(), JSON.stringify(d)) }
function bindLoad() { try { return JSON.parse(localStorage.getItem(bindKey()) || '{}') } catch { return {} } }
function bindSave(d){ localStorage.setItem(bindKey(), JSON.stringify(d)) }

// ── Built-in Collection Presets ───────────────────────────────────────────────
const COLL_PRESETS = [
  { id:'team', icon:'👥', label:'Team Members',
    fields:[
      {key:'name',      label:'Full Name',    type:'text',     required:true},
      {key:'role',      label:'Role / Title', type:'text'},
      {key:'bio',       label:'Bio',          type:'textarea'},
      {key:'photo',     label:'Photo URL',    type:'image'},
      {key:'linkedin',  label:'LinkedIn URL', type:'text'},
      {key:'twitter',   label:'Twitter URL',  type:'text'},
    ]},
  { id:'testimonials', icon:'💬', label:'Testimonials',
    fields:[
      {key:'quote',     label:'Quote',        type:'textarea',  required:true},
      {key:'author',    label:'Author Name',  type:'text',      required:true},
      {key:'role',      label:'Role / Company',type:'text'},
      {key:'avatar',    label:'Avatar URL',   type:'image'},
      {key:'rating',    label:'Rating (1-5)', type:'select',    options:['5','4','3','2','1']},
      {key:'company',   label:'Company',      type:'text'},
    ]},
  { id:'faq', icon:'❓', label:'FAQ',
    fields:[
      {key:'question',  label:'Question',     type:'text',      required:true},
      {key:'answer',    label:'Answer',       type:'textarea',  required:true},
      {key:'category',  label:'Category',     type:'text'},
      {key:'order',     label:'Display Order',type:'text'},
    ]},
  { id:'portfolio', icon:'🖼', label:'Portfolio',
    fields:[
      {key:'title',     label:'Project Title',type:'text',      required:true},
      {key:'category',  label:'Category',     type:'text'},
      {key:'image',     label:'Image URL',    type:'image'},
      {key:'description',label:'Description', type:'textarea'},
      {key:'url',       label:'Project URL',  type:'text'},
      {key:'client',    label:'Client',       type:'text'},
      {key:'year',      label:'Year',         type:'text'},
    ]},
  { id:'events', icon:'📅', label:'Events',
    fields:[
      {key:'title',     label:'Event Title',  type:'text',      required:true},
      {key:'date',      label:'Date',         type:'date'},
      {key:'time',      label:'Time',         type:'text'},
      {key:'location',  label:'Location',     type:'text'},
      {key:'description',label:'Description', type:'textarea'},
      {key:'image',     label:'Banner Image', type:'image'},
      {key:'ticketUrl', label:'Ticket URL',   type:'text'},
    ]},
  { id:'products', icon:'🛍', label:'Products',
    fields:[
      {key:'name',      label:'Product Name', type:'text',      required:true},
      {key:'price',     label:'Price',        type:'text',      required:true},
      {key:'description',label:'Description', type:'textarea'},
      {key:'image',     label:'Image URL',    type:'image'},
      {key:'category',  label:'Category',     type:'text'},
      {key:'sku',       label:'SKU',          type:'text'},
      {key:'stock',     label:'In Stock',     type:'select',    options:['true','false']},
    ]},
]

// ── Collection CRUD ───────────────────────────────────────────────────────────
function collCreate(schema) {
  const db = collLoad()
  const id = 'coll_' + Date.now() + '_' + Math.random().toString(36).slice(2,5)
  db[id] = { id, ...schema, entries: {}, createdAt: new Date().toISOString() }
  collSave(db)
  return db[id]
}

function collGetAll()    { return Object.values(collLoad()) }
function collGet(id)     { return collLoad()[id] || null }

function collAddEntry(collId, data) {
  const db = collLoad()
  if (!db[collId]) return null
  const eid = 'e_' + Date.now() + '_' + Math.random().toString(36).slice(2,5)
  db[collId].entries[eid] = {
    id: eid, ...data,
    status: data.status || 'published',
    publishAt: data.publishAt || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  collSave(db)
  return db[collId].entries[eid]
}

function collUpdateEntry(collId, eid, data) {
  const db = collLoad()
  if (!db[collId]?.entries[eid]) return false
  db[collId].entries[eid] = { ...db[collId].entries[eid], ...data, updatedAt: new Date().toISOString() }
  collSave(db)
  return true
}

function collDeleteEntry(collId, eid) {
  const db = collLoad()
  if (!db[collId]?.entries[eid]) return false
  delete db[collId].entries[eid]
  collSave(db)
  return true
}

function collDelete(id) {
  const db = collLoad()
  delete db[id]
  collSave(db)
}

function collGetEntries(collId) {
  return Object.values(collLoad()[collId]?.entries || {})
}

// ── CMS Navigation: register new views ───────────────────────────────────────
// Extend existing renderCMSView router
;(function() {
  const _origRenderCMSView = window.renderCMSView
  window.renderCMSView = function renderCMSViewExtended() {
    const area = document.getElementById('cms-main-area')
    if (!area) return

    const bc = document.getElementById('cms-bar-breadcrumb')
    const labels = { dashboard:'Dashboard', posts:'Blog Posts', pages:'Pages', media:'Media Library',
      models:'Content Models', settings:'Settings', editor:'Editor',
      collections:'Collections', scheduled:'Scheduled' }
    if (bc) bc.textContent = labels[CMS_UI.view] || ''

    if (CMS_UI.editingId !== null && CMS_UI.view !== 'collections') {
      if (typeof _origRenderCMSView === 'function') _origRenderCMSView(); return
    }

    if (CMS_UI.view === 'collections') { renderCMSCollections(area); return }
    if (CMS_UI.view === 'scheduled')   { renderCMSScheduled(area);   return }
    if (typeof _origRenderCMSView === 'function') _origRenderCMSView()
  }
})()

// Update nav counts to include collections + scheduled
// Use window assignment (not function declaration) to avoid hoisting infinite recursion
;(function() {
  const _origNav = window.updateCMSNavCounts
  window.updateCMSNavCounts = function updateCMSNavCountsExtended() {
    if (typeof _origNav === 'function') _origNav()
    const colls = (typeof collGetAll === 'function') ? collGetAll() : []
    const collEl = document.getElementById('cnav-collections-count')
    if (collEl) collEl.textContent = colls.length

    const now = new Date()
    let schedCount = 0
    colls.forEach(c => {
      Object.values(c.entries || {}).forEach(e => {
        if (e.publishAt && new Date(e.publishAt) > now && e.status !== 'published') schedCount++
      })
    })
    const schedEl = document.getElementById('cnav-scheduled-count')
    if (schedEl) schedEl.textContent = schedCount || ''
  }
})()

// ── Collections View ──────────────────────────────────────────────────────────
let _collViewState = { mode: 'list', collId: null, editEntryId: null }

function renderCMSCollections(area) {
  if (_collViewState.mode === 'entries' && _collViewState.collId) {
    renderCollEntries(area, _collViewState.collId)
    return
  }
  if (_collViewState.mode === 'entry-edit') {
    renderCollEntryEditor(area)
    return
  }
  renderCollList(area)
}

function renderCollList(area) {
  const colls = collGetAll()
  area.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px 0">
      <div>
        <div style="font-size:15px;font-weight:700;color:var(--text)">Collections</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">Custom content types for your site</div>
      </div>
      <button class="cms-new-btn" onclick="openNewCollectionModal()">+ New Collection</button>
    </div>

    ${colls.length ? `<div class="coll-grid">
      ${colls.map(c => {
        const count = Object.keys(c.entries||{}).length
        return `<div class="coll-card" onclick="openCollEntries('${c.id}')">
          <div class="coll-card-actions" onclick="event.stopPropagation()">
            <button class="coll-card-btn danger" onclick="deleteCollection('${c.id}')">🗑</button>
          </div>
          <div class="coll-card-icon">${c.icon||'📦'}</div>
          <div class="coll-card-name">${e(c.label)}</div>
          <div class="coll-card-count">${count} entr${count===1?'y':'ies'}</div>
        </div>`
      }).join('')}
    </div>` : `
    <div class="cms-empty" style="padding:60px 20px">
      <div class="cms-empty-icon">🗃</div>
      <h3>No collections yet</h3>
      <p>Create a collection to store structured content like Team, FAQs, or Portfolio items.</p>
      <div class="coll-preset-grid" style="max-width:500px;margin:16px auto 0">
        ${COLL_PRESETS.map(p=>`<div class="coll-preset-card" onclick="createCollFromPreset('${p.id}')">
          <div style="font-size:20px;margin-bottom:4px">${p.icon}</div>
          <div style="font-size:11px;font-weight:700;color:var(--text)">${p.label}</div>
        </div>`).join('')}
      </div>
    </div>`}

    <!-- Quick Presets strip when collections exist -->
    ${colls.length ? `<div style="padding:0 20px 20px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Quick Add Preset</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${COLL_PRESETS.filter(p=>!colls.find(c=>c.presetId===p.id)).map(p=>`
          <button onclick="createCollFromPreset('${p.id}')" style="padding:5px 12px;border:1px solid var(--border);border-radius:20px;background:var(--surface2);color:var(--text);font-size:11px;cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">${p.icon} ${p.label}</button>
        `).join('')}
      </div>
    </div>` : ''}
  `
}

function openCollEntries(collId) {
  _collViewState = { mode:'entries', collId, editEntryId:null }
  renderCMSCollections(document.getElementById('cms-main-area'))
}

function renderCollEntries(area, collId) {
  const coll    = collGet(collId)
  if (!coll) { _collViewState.mode='list'; renderCollList(area); return }
  const entries = collGetEntries(collId)

  area.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:18px 20px;border-bottom:1px solid var(--border)">
      <button onclick="_collViewState={mode:'list',collId:null,editEntryId:null};renderCMSCollections(document.getElementById('cms-main-area'))"
        style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:0 4px">←</button>
      <span style="font-size:20px">${coll.icon||'📦'}</span>
      <div>
        <div style="font-size:14px;font-weight:700;color:var(--text)">${e(coll.label)}</div>
        <div style="font-size:11px;color:var(--muted)">${entries.length} entr${entries.length===1?'y':'ies'}</div>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="cms-btn-secondary" onclick="autoGeneratePages('${collId}')" title="Generate builder pages from entries">⚡ Generate Pages</button>
        <button class="cms-new-btn" onclick="openCollEntryEditor('${collId}',null)">+ Add Entry</button>
      </div>
    </div>

    ${entries.length ? `
    <div style="overflow-x:auto">
      <table class="coll-entries-table">
        <thead><tr>
          ${coll.fields.slice(0,4).map(f=>`<th>${e(f.label)}</th>`).join('')}
          <th>Status</th><th>Updated</th><th></th>
        </tr></thead>
        <tbody>
          ${entries.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(entry=>`<tr>
            ${coll.fields.slice(0,4).map(f=>`<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e(String(entry[f.key]||'—'))}</td>`).join('')}
            <td><span class="coll-entry-status ${entry.status}">${entry.status}</span></td>
            <td style="color:var(--muted)">${formatTimeAgo(entry.updatedAt)}</td>
            <td style="white-space:nowrap">
              <button class="coll-card-btn" onclick="openCollEntryEditor('${collId}','${entry.id}')">✏</button>
              <button class="coll-card-btn danger" onclick="deleteCollEntry('${collId}','${entry.id}')">🗑</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : `
    <div class="cms-empty" style="padding:50px">
      <div class="cms-empty-icon">${coll.icon||'📦'}</div>
      <h3>No entries yet</h3>
      <p>Add your first entry to this collection.</p>
      <button class="cms-new-btn" style="margin-top:12px" onclick="openCollEntryEditor('${collId}',null)">+ Add First Entry</button>
    </div>`}
  `
}

function openCollEntryEditor(collId, entryId) {
  _collViewState = { mode:'entry-edit', collId, editEntryId: entryId }
  renderCMSCollections(document.getElementById('cms-main-area'))
}

function renderCollEntryEditor(area) {
  const { collId, editEntryId } = _collViewState
  const coll  = collGet(collId)
  if (!coll) return
  const entry = editEntryId ? (collLoad()[collId]?.entries[editEntryId] || {}) : {}
  const isNew = !editEntryId

  area.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--border)">
      <button onclick="openCollEntries('${collId}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:0 4px">←</button>
      <div style="font-size:14px;font-weight:700;color:var(--text)">${isNew?'New':'Edit'} ${coll.label.replace(/s$/,'')} Entry</div>
    </div>
    <div style="max-width:640px;padding:20px;margin:0 auto">
      <form id="coll-entry-form">
        ${coll.fields.map(f => _renderCollField(f, entry[f.key]||'')).join('')}
        <div style="margin-top:8px">
          <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Status</label>
          <select id="cef-status" style="padding:8px 10px;border:1px solid var(--border);border-radius:7px;background:var(--surface2);color:var(--text);font-size:12px">
            <option value="published" ${entry.status==='published'?'selected':''}>Published</option>
            <option value="draft" ${entry.status==='draft'||!entry.status?'selected':''}>Draft</option>
            <option value="scheduled" ${entry.status==='scheduled'?'selected':''}>Scheduled</option>
          </select>
        </div>
        <div id="cef-schedule-row" style="margin-top:8px;display:${entry.status==='scheduled'?'block':'none'}">
          <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Publish At</label>
          <input type="datetime-local" id="cef-publish-at" value="${entry.publishAt ? entry.publishAt.slice(0,16) : ''}"
            style="padding:8px 10px;border:1px solid var(--border);border-radius:7px;background:var(--surface2);color:var(--text);font-size:12px"/>
        </div>
      </form>
      <div style="display:flex;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
        <button onclick="openCollEntries('${collId}')" style="padding:9px 18px;border:1px solid var(--border);border-radius:7px;background:none;color:var(--muted);cursor:pointer;font-size:12px">Cancel</button>
        <button onclick="saveCollEntry('${collId}','${editEntryId||''}')" style="padding:9px 22px;border:none;border-radius:7px;background:var(--accent);color:#fff;font-weight:700;cursor:pointer;font-size:12px">Save Entry</button>
      </div>
    </div>
  `
  // Wire status → schedule row
  document.getElementById('cef-status')?.addEventListener('change', ev => {
    document.getElementById('cef-schedule-row').style.display = ev.target.value === 'scheduled' ? 'block' : 'none'
  })
}

function _renderCollField(field, value) {
  const id = 'cef-' + field.key
  const label = `<label for="${id}" style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">${e(field.label)}${field.required?' <span style="color:var(--danger)">*</span>':''}</label>`
  const base  = `padding:8px 10px;border:1px solid var(--border);border-radius:7px;background:var(--surface2);color:var(--text);font-size:12px;width:100%;box-sizing:border-box;outline:none`
  let input = ''
  if (field.type === 'textarea' || field.type === 'richtext') {
    input = `<textarea id="${id}" rows="4" style="${base}">${e(value)}</textarea>`
  } else if (field.type === 'select') {
    input = `<select id="${id}" style="${base}">${(field.options||[]).map(o=>`<option value="${o}" ${value===o?'selected':''}>${o}</option>`).join('')}</select>`
  } else if (field.type === 'image') {
    input = `<input id="${id}" type="text" value="${e(value)}" placeholder="https://… or paste image URL" style="${base}"/>`
  } else if (field.type === 'date') {
    input = `<input id="${id}" type="date" value="${e(value)}" style="${base}"/>`
  } else {
    input = `<input id="${id}" type="text" value="${e(value)}" style="${base}"/>`
  }
  return `<div style="margin-bottom:12px">${label}${input}</div>`
}

function saveCollEntry(collId, entryId) {
  const coll = collGet(collId); if (!coll) return
  const data = {}
  coll.fields.forEach(f => {
    const el = document.getElementById('cef-' + f.key)
    if (el) data[f.key] = el.value
  })
  data.status    = document.getElementById('cef-status')?.value || 'published'
  data.publishAt = data.status === 'scheduled' ? (document.getElementById('cef-publish-at')?.value || null) : null

  if (entryId) {
    collUpdateEntry(collId, entryId, data)
    toast('Entry updated', '✅')
  } else {
    collAddEntry(collId, data)
    toast('Entry saved', '✅')
  }
  openCollEntries(collId)
  updateCMSNavCounts()
}

function deleteCollEntry(collId, eid) {
  if (!confirm('Delete this entry?')) return
  collDeleteEntry(collId, eid)
  openCollEntries(collId)
  toast('Entry deleted', '🗑')
}

function deleteCollection(id) {
  const c = collGet(id); if (!c) return
  if (!confirm(`Delete "${c.label}" and all its entries? This cannot be undone.`)) return
  collDelete(id)
  _collViewState.mode = 'list'
  renderCollList(document.getElementById('cms-main-area'))
  updateCMSNavCounts()
  toast('Collection deleted', '🗑')
}

// ── Create Collection from Preset ─────────────────────────────────────────────
function createCollFromPreset(presetId) {
  const preset = COLL_PRESETS.find(p=>p.id===presetId)
  if (!preset) return
  const coll = collCreate({ icon:preset.icon, label:preset.label, presetId:preset.id, fields:preset.fields })
  toast(`"${preset.label}" collection created`, '🗃')
  openCollEntries(coll.id)
  updateCMSNavCounts()
}

// ── New Collection Modal (custom) ─────────────────────────────────────────────
function openNewCollectionModal() {
  const name = prompt('Collection name (e.g. Team Members, FAQs, Events):')
  if (!name?.trim()) return
  const icon = prompt('Icon emoji (e.g. 👥, 📅, 🎯):', '📦') || '📦'
  const coll = collCreate({
    icon: icon.trim(),
    label: name.trim(),
    fields: [
      {key:'title', label:'Title', type:'text', required:true},
      {key:'description', label:'Description', type:'textarea'},
      {key:'image', label:'Image URL', type:'image'},
      {key:'status', label:'Status', type:'select', options:['published','draft']},
    ],
  })
  toast(`"${name}" collection created`, '🗃')
  openCollEntries(coll.id)
  updateCMSNavCounts()
}

// ── Auto Page Generator ───────────────────────────────────────────────────────
function autoGeneratePages(collId) {
  const coll    = collGet(collId); if (!coll) return
  const entries = collGetEntries(collId).filter(e => e.status === 'published')
  if (!entries.length) { toast('No published entries to generate pages from', '⚠️'); return }

  const { pages, activePageId } = projectStore.getState()
  const newPages = [...pages]
  let created = 0

  entries.forEach(entry => {
    const titleKey = coll.fields.find(f=>f.key==='title'||f.key==='name')?.key || coll.fields[0]?.key
    const title    = entry[titleKey] || 'Untitled'
    const slug     = title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,40)
    // Skip if page with same slug already exists
    if (newPages.find(p=>p.slug===slug)) return

    const pageId = uid_page()
    // Build sections based on collection type
    const sections = _buildPageFromEntry(coll, entry)
    newPages.push({ id:pageId, name:title, slug, sections, cmsCollId:collId, cmsEntryId:entry.id })
    created++
  })

  if (!created) { toast('All pages already generated (no new published entries)', 'ℹ️'); return }
  projectStore.setState({ pages:newPages, activePageId }, 'cms-generate-pages')
  renderPagesPanel()
  renderPagesNavStrip()
  toast(`${created} page${created>1?'s':''} generated from "${coll.label}"`, '⚡')
}

function _buildPageFromEntry(coll, entry) {
  const def = DEFS['hero']
  const titleKey = coll.fields.find(f=>f.key==='title'||f.key==='name')?.key || coll.fields[0]?.key
  const descKey  = coll.fields.find(f=>f.type==='textarea')?.key
  const imgKey   = coll.fields.find(f=>f.type==='image')?.key

  const heroProps = {
    ...def.props,
    headline:    entry[titleKey] || 'Untitled',
    subheadline: entry[descKey]  || coll.label,
    bgImage:     entry[imgKey]   || '',
    overlayOpacity: '0.6',
  }
  const sections = [{ id:uid(), type:'hero', props:heroProps }]

  // Add about section if bio/description exists
  if (descKey && entry[descKey]) {
    sections.push({ id:uid(), type:'about', props:{
      ...DEFS['about'].props,
      heading:  entry[titleKey] || '',
      body:     entry[descKey] || '',
      image:    entry[imgKey] || DEFS['about'].props.image,
    }})
  }

  sections.push({ id:uid(), type:'contact', props:{ ...DEFS['contact'].props }})
  sections.push({ id:uid(), type:'footer',  props:{ ...DEFS['footer'].props }})
  return sections
}

// ── Scheduled View ────────────────────────────────────────────────────────────
function renderCMSScheduled(area) {
  const now    = new Date()
  const colls  = collGetAll()
  const items  = []

  colls.forEach(coll => {
    Object.values(coll.entries || {}).forEach(entry => {
      if (entry.publishAt) {
        items.push({ coll, entry, dt: new Date(entry.publishAt) })
      }
    })
  })

  // Auto-publish overdue items
  items.filter(i => i.dt <= now && i.entry.status === 'scheduled').forEach(({ coll, entry }) => {
    collUpdateEntry(coll.id, entry.id, { status:'published', publishAt:null })
    cmsLog('auto-publish', coll.label, entry[coll.fields[0]?.key] || 'Entry', entry.id)
  })

  items.sort((a,b) => a.dt - b.dt)
  const upcoming = items.filter(i => i.dt > now)
  const past     = items.filter(i => i.dt <= now)

  area.innerHTML = `
    <div style="padding:18px 20px 0">
      <div style="font-size:15px;font-weight:700;color:var(--text)">Scheduled Content</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px">Entries set to auto-publish at a future date</div>
    </div>
    ${upcoming.length ? `
    <div style="padding:16px 20px 0">
      <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Upcoming</div>
      ${upcoming.map(({coll,entry,dt})=>`
        <div class="sched-row">
          <div class="sched-time">📅 ${dt.toLocaleDateString()} ${dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
          <div>
            <div class="sched-title">${e(entry[coll.fields[0]?.key]||'Untitled')}</div>
            <div class="sched-type">${coll.icon} ${e(coll.label)}</div>
          </div>
          <div style="margin-left:auto">
            <button class="coll-card-btn" onclick="openCollEntryEditor('${coll.id}','${entry.id}');_collViewState.collId='${coll.id}';cmsNav('collections')">✏ Edit</button>
          </div>
        </div>`).join('')}
    </div>` : `<div class="cms-empty" style="padding:50px"><div class="cms-empty-icon">🕐</div><h3>No upcoming scheduled content</h3><p>Set a "Scheduled" status + publish date on any collection entry.</p></div>`}
    ${past.length ? `
    <div style="padding:16px 20px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Recently Published (auto)</div>
      ${past.slice(0,5).map(({coll,entry,dt})=>`
        <div class="sched-row" style="opacity:.6">
          <div class="sched-time" style="color:var(--muted)">✅ ${dt.toLocaleDateString()}</div>
          <div>
            <div class="sched-title">${e(entry[coll.fields[0]?.key]||'Untitled')}</div>
            <div class="sched-type">${coll.icon} ${e(coll.label)}</div>
          </div>
        </div>`).join('')}
    </div>` : ''}
  `
}

// ── Data Binding — bind section prop to CMS collection entry ─────────────────
function openDataBindModal(sectionId) {
  const sec = S.sections.find(s=>s.id===sectionId); if (!sec) return
  const colls   = collGetAll()
  const bindings= bindLoad()
  const current = bindings[sectionId] || {}

  if (!colls.length) {
    toast('Create a Collection first to bind data','⚠️')
    openCMS()
    return
  }

  // Build a simple inline picker in a confirm-style dialog
  // For simplicity: use a floating panel in the panel area
  const panelEl = document.getElementById('panel')
  if (!panelEl) return

  const extraHtml = `
    <div style="border-top:1px solid var(--border);padding:12px 14px;margin-top:8px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">CMS Data Binding</div>
      <select id="bind-coll-sel" style="width:100%;padding:7px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface2);color:var(--text);font-size:11px;margin-bottom:6px"
        onchange="renderBindEntrySelect('${sectionId}')">
        <option value="">— Select Collection —</option>
        ${colls.map(c=>`<option value="${c.id}" ${current.collId===c.id?'selected':''}>${c.icon} ${e(c.label)}</option>`).join('')}
      </select>
      <select id="bind-entry-sel" style="width:100%;padding:7px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface2);color:var(--text);font-size:11px;margin-bottom:8px">
        <option value="">— Select Entry —</option>
        ${current.collId ? collGetEntries(current.collId).map(en=>`<option value="${en.id}" ${current.entryId===en.id?'selected':''}>${e(en[collGet(current.collId)?.fields[0]?.key]||en.id)}</option>`).join('') : ''}
      </select>
      <div style="display:flex;gap:6px">
        <button onclick="applyDataBind('${sectionId}')" style="flex:1;padding:7px;border:none;border-radius:6px;background:var(--accent);color:#fff;font-size:11px;font-weight:700;cursor:pointer">Apply Bind</button>
        ${current.collId ? `<button onclick="clearDataBind('${sectionId}')" style="padding:7px 10px;border:1px solid var(--border);border-radius:6px;background:none;color:var(--muted);font-size:11px;cursor:pointer">Clear</button>` : ''}
      </div>
    </div>`

  // Append to panel
  const existing = document.getElementById('bind-panel-section')
  if (existing) existing.remove()
  const div = document.createElement('div')
  div.id = 'bind-panel-section'
  div.innerHTML = extraHtml
  panelEl.appendChild(div)
}

function renderBindEntrySelect(sectionId) {
  const collId = document.getElementById('bind-coll-sel')?.value
  const sel    = document.getElementById('bind-entry-sel')
  if (!sel) return
  if (!collId) { sel.innerHTML = '<option value="">— Select Entry —</option>'; return }
  const entries = collGetEntries(collId)
  const coll    = collGet(collId)
  sel.innerHTML = `<option value="">— Select Entry —</option>` +
    entries.map(en=>`<option value="${en.id}">${e(en[coll?.fields[0]?.key]||en.id)}</option>`).join('')
}

function applyDataBind(sectionId) {
  const collId  = document.getElementById('bind-coll-sel')?.value
  const entryId = document.getElementById('bind-entry-sel')?.value
  if (!collId || !entryId) { toast('Select a collection and entry','⚠️'); return }

  const coll  = collGet(collId)
  const entry = collLoad()[collId]?.entries[entryId]
  const sec   = S.sections.find(s=>s.id===sectionId)
  if (!coll || !entry || !sec) return

  // Map entry fields → section props intelligently
  const fieldMap = {
    title:'headline', name:'headline', heading:'headline',
    description:'subheadline', bio:'body', excerpt:'subheadline',
    quote:'quote', author:'author', role:'role',
    image:'bgImage', photo:'bgImage', avatar:'avatar',
  }
  let mapped = 0
  coll.fields.forEach(f => {
    const propKey = fieldMap[f.key]
    if (propKey && sec.props[propKey] !== undefined && entry[f.key]) {
      sec.props[propKey] = entry[f.key]
      mapped++
    }
  })

  // Save binding record
  const bindings = bindLoad()
  bindings[sectionId] = { collId, entryId, collLabel:coll.label }
  bindSave(bindings)

  renderCanvas()
  document.getElementById('bind-panel-section')?.remove()
  toast(`Bound to "${coll.label}" — ${mapped} field${mapped!==1?'s':''} mapped`, '🔗')
}

function clearDataBind(sectionId) {
  const bindings = bindLoad()
  delete bindings[sectionId]
  bindSave(bindings)
  document.getElementById('bind-panel-section')?.remove()
  toast('Data binding cleared', '○')
}

// CMS bind badges are applied inside renderCanvas directly (Stage 5+6 integration)

// ── Scheduler: auto-publish check on boot ─────────────────────────────────────
function runScheduler() {
  const now   = new Date()
  const colls = collGetAll()
  let published = 0
  colls.forEach(coll => {
    Object.values(coll.entries || {}).forEach(entry => {
      if (entry.status === 'scheduled' && entry.publishAt && new Date(entry.publishAt) <= now) {
        collUpdateEntry(coll.id, entry.id, { status:'published', publishAt:null })
        published++
      }
    })
  })
  if (published) {
    updateCMSNavCounts()
    toast(`${published} scheduled item${published>1?'s':''} auto-published`, '🕐')
  }
}

// Run scheduler every 60 seconds
setTimeout(runScheduler, 2000)
setInterval(runScheduler, 60000)

// ── Boot Onboarding + UX Guide ────────────────────────────────────────────────
setTimeout(() => {
  UXGuide.update()
  Onboarding.boot()
}, 200)

// ── Multi-page: initialize after DOM is ready ─────────────────────────────────
// (called again after project loads; safe to call multiple times)
setTimeout(() => {
  GlobalStyles.applyToCanvas()   // apply saved global styles on boot
  initPages()
  // Wire page-title input → rename active page
  const _ptEl = document.getElementById('page-title')
  if (_ptEl && !_ptEl._pageWired) {
    _ptEl._pageWired = true
    _ptEl.addEventListener('change', () => {
      const { activePageId } = projectStore.getState()
      if (activePageId) renamePage(activePageId, _ptEl.value.trim() || 'Page')
    })
  }
}, 0)

// Canvas renders only after auth passes (authGrantAccess does it)
authBootstrap()
