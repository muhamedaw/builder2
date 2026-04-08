/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   CMS SYSTEM
   Models: post | page
   CRUD: create / read / update / delete
   Features: rich text editor, featured image, tags,
             SEO fields, slug, status, activity log
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

// ── Storage keys ──────────────────────────────────────────────────────────────
const CMS_DB_KEY       = 'pc_cms_v1'
const CMS_ACTIVITY_KEY = 'pc_cms_activity_v1'
const CMS_SETTINGS_KEY = 'pc_cms_settings_v1'

// ── Content Models ────────────────────────────────────────────────────────────
const CMS_MODELS = {
  post: {
    label:  'Blog Post',
    icon:   '📝',
    fields: [
      { key:'title',       label:'Title',           type:'text',     required:true },
      { key:'slug',        label:'Slug',            type:'text' },
      { key:'excerpt',     label:'Excerpt',         type:'textarea' },
      { key:'body',        label:'Body',            type:'richtext' },
      { key:'featuredImg', label:'Featured Image',  type:'image' },
      { key:'category',    label:'Category',        type:'text' },
      { key:'tags',        label:'Tags',            type:'tags' },
      { key:'author',      label:'Author',          type:'text' },
      { key:'status',      label:'Status',          type:'select',   options:['draft','published','archived'] },
      { key:'seoTitle',    label:'SEO Title',       type:'text' },
      { key:'seoDesc',     label:'SEO Description', type:'textarea' },
      { key:'publishedAt', label:'Publish Date',    type:'date' },
    ],
  },
  page: {
    label:  'Page',
    icon:   '📄',
    fields: [
      { key:'title',    label:'Title',           type:'text', required:true },
      { key:'slug',     label:'Slug',            type:'text' },
      { key:'body',     label:'Body',            type:'richtext' },
      { key:'template', label:'Template',        type:'select', options:['default','landing','minimal','blog'] },
      { key:'status',   label:'Status',          type:'select', options:['draft','published','archived'] },
      { key:'seoTitle', label:'SEO Title',       type:'text' },
      { key:'seoDesc',  label:'SEO Description', type:'textarea' },
      { key:'noIndex',  label:'No-Index',        type:'select', options:['false','true'] },
    ],
  },
}

// Stock photos for featured images
const CMS_STOCK = [
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=70',
  'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=400&q=70',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=70',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=70',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=70',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=70',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&q=70',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=70',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=70',
]

// ── Storage helpers ───────────────────────────────────────────────────────────
function cmsKey() { return CMS_DB_KEY + (AUTH.user ? '_' + AUTH.user.id : '_guest') }
function cmsActivityKey() { return CMS_ACTIVITY_KEY + (AUTH.user ? '_' + AUTH.user.id : '_guest') }
function cmsSettingsKey() { return CMS_SETTINGS_KEY + (AUTH.user ? '_' + AUTH.user.id : '_guest') }

function cmsLoad()     { try { return JSON.parse(localStorage.getItem(cmsKey()) || '{}') } catch { return {} } }
function cmsSave(db)   { localStorage.setItem(cmsKey(), JSON.stringify(db)) }
function cmsLoadActivity() { try { return JSON.parse(localStorage.getItem(cmsActivityKey()) || '[]') } catch { return [] } }
function cmsSaveActivity(a){ localStorage.setItem(cmsActivityKey(), JSON.stringify(a.slice(0,100))) }
function cmsLoadSettings() { try { return JSON.parse(localStorage.getItem(cmsSettingsKey()) || '{}') } catch { return {} } }
function cmsSaveSettings(s){ localStorage.setItem(cmsSettingsKey(), JSON.stringify(s)) }

// ── CRUD ──────────────────────────────────────────────────────────────────────
function cmsCreate(model, data) {
  const db  = cmsLoad()
  const id  = 'cms_' + Date.now() + '_' + Math.random().toString(36).slice(2,6)
  const entry = {
    id,
    model,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: data.status || 'draft',
  }
  db[id] = entry
  cmsSave(db)
  cmsLog('create', model, data.title || 'Untitled', id)
  return entry
}

function cmsGetAll(model = null) {
  const db = cmsLoad()
  const all = Object.values(db)
  return model ? all.filter(e => e.model === model) : all
}

function cmsGet(id) {
  return cmsLoad()[id] || null
}

function cmsUpdate(id, data) {
  const db = cmsLoad()
  if (!db[id]) return false
  db[id] = { ...db[id], ...data, updatedAt: new Date().toISOString() }
  cmsSave(db)
  cmsLog('update', db[id].model, db[id].title || 'Untitled', id)
  return db[id]
}

function cmsDelete(id) {
  const db = cmsLoad()
  if (!db[id]) return false
  const entry = db[id]
  delete db[id]
  cmsSave(db)
  cmsLog('delete', entry.model, entry.title || 'Untitled', id)
  return true
}

function cmsToggleStatus(id) {
  const entry = cmsGet(id)
  if (!entry) return
  const next = entry.status === 'published' ? 'draft' : 'published'
  cmsUpdate(id, { status: next })
  renderCMSView()
  toast(`"${entry.title}" ${next}`, next === 'published' ? '✅' : '📝')
}

function cmsDuplicate(id) {
  const entry = cmsGet(id)
  if (!entry) return
  const copy = { ...entry, title: entry.title + ' (copy)', slug: (entry.slug||'') + '-copy', status: 'draft' }
  delete copy.id; delete copy.createdAt; delete copy.updatedAt
  cmsCreate(entry.model, copy)
  renderCMSView()
  toast('Duplicated', '⧉')
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'')
}

// ── Activity log ──────────────────────────────────────────────────────────────
function cmsLog(action, model, title, id = '') {
  const log = cmsLoadActivity()
  const icons = { create:'✨', update:'✏️', delete:'🗑', publish:'✅', draft:'📝' }
  log.unshift({
    action, model, title, id,
    icon: icons[action] || '•',
    timestamp: new Date().toISOString(),
  })
  cmsSaveActivity(log)
}

function cmsTimeAgo(iso) {
  if (!iso) return ''
  const s = Math.round((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s/60)}m ago`
  if (s < 86400) return `${Math.round(s/3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

// ── CMS UI State ──────────────────────────────────────────────────────────────
const CMS_UI = {
  view:       'dashboard',
  editingId:  null,
  editingModel: null,
  search:     '',
  filter:     'all',
  sort:       'updatedAt',
}

// ── Open / close CMS ──────────────────────────────────────────────────────────
function openCMS() {
  if (!AUTH.user) { showAuthGate(); return }
  _cmsCleanCorruptData()
  document.getElementById('cms-overlay').classList.add('open')
  cmsNav('dashboard')
}

function _cmsCleanCorruptData() {
  // Remove entries with template-literal placeholder values in image fields
  try {
    const key = 'pc_cms_entries_' + (AUTH.user?.id || 'guest')
    const raw = localStorage.getItem(key)
    if (!raw) return
    const entries = JSON.parse(raw)
    let changed = false
    Object.values(entries).forEach(entry => {
      if (entry.featuredImg && entry.featuredImg.includes('${')) {
        entry.featuredImg = ''
        changed = true
      }
    })
    if (changed) localStorage.setItem(key, JSON.stringify(entries))
  } catch {}
}

function closeCMS() {
  document.getElementById('cms-overlay').classList.remove('open')
}

// ── Navigation ────────────────────────────────────────────────────────────────
function cmsNav(view) {
  CMS_UI.view      = view
  CMS_UI.editingId = null
  document.querySelectorAll('.cms-nav-item').forEach(btn =>
    btn.classList.toggle('active', btn.id === 'cnav-' + view)
  )
  updateCMSNavCounts()
  renderCMSView()
}

function updateCMSNavCounts() {
  const posts = cmsGetAll('post')
  const pages = cmsGetAll('page')
  const postsEl = document.getElementById('cnav-posts-count')
  const pagesEl = document.getElementById('cnav-pages-count')
  if (postsEl) postsEl.textContent = posts.length
  if (pagesEl) pagesEl.textContent = pages.length
}

// ── Master render router ──────────────────────────────────────────────────────
function renderCMSView() {
  const area = document.getElementById('cms-main-area')
  if (!area) return

  // Update breadcrumb
  const bc = document.getElementById('cms-bar-breadcrumb')
  const labels = { dashboard:'Dashboard', posts:'Blog Posts', pages:'Pages', media:'Media Library', models:'Content Models', settings:'Settings', editor:'Editor' }
  if (bc) bc.textContent = labels[CMS_UI.view] || ''

  // Render editing state or list view
  if (CMS_UI.editingId !== null) {
    renderCMSEditor(area)
    return
  }

  const views = { dashboard:renderCMSDashboard, posts:()=>renderCMSList('post'), pages:()=>renderCMSList('page'), media:renderCMSMedia, models:renderCMSModels, settings:renderCMSSettings }
  const fn = views[CMS_UI.view]
  if (fn) fn(area)
  else area.innerHTML = '<div class="cms-empty"><div class="cms-empty-icon">🔧</div><h3>Coming soon</h3></div>'
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderCMSDashboard(area) {
  const posts    = cmsGetAll('post')
  const pages    = cmsGetAll('page')
  const published= [...posts, ...pages].filter(e => e.status === 'published')
  const drafts   = [...posts, ...pages].filter(e => e.status === 'draft')
  const activity = cmsLoadActivity()

  area.innerHTML = `
    <div class="cms-dash-grid">
      <div class="cms-stat-card">
        <div class="cms-stat-icon" style="background:rgba(99,102,241,.15)">📝</div>
        <div><div class="cms-stat-val">${posts.length}</div><div class="cms-stat-lbl">Blog Posts</div></div>
      </div>
      <div class="cms-stat-card">
        <div class="cms-stat-icon" style="background:rgba(16,185,129,.15)">📄</div>
        <div><div class="cms-stat-val">${pages.length}</div><div class="cms-stat-lbl">Pages</div></div>
      </div>
      <div class="cms-stat-card">
        <div class="cms-stat-icon" style="background:rgba(52,211,153,.15)">✅</div>
        <div><div class="cms-stat-val">${published.length}</div><div class="cms-stat-lbl">Published</div></div>
      </div>
      <div class="cms-stat-card">
        <div class="cms-stat-icon" style="background:rgba(251,191,36,.15)">📝</div>
        <div><div class="cms-stat-val">${drafts.length}</div><div class="cms-stat-lbl">Drafts</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;padding:0 20px 20px">
      <!-- Recent posts -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;margin-right:10px">
        <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:13px;font-weight:700;color:var(--text)">Recent Posts</span>
          <button class="cms-new-btn" style="font-size:11px;padding:5px 12px" onclick="cmsNewEntry('post')">+ New Post</button>
        </div>
        <div>
          ${posts.length ? posts.slice(0,5).map(p=>`
            <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="cmsEditEntry('${p.id}')">
              <div style="flex:1;overflow:hidden">
                <div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e(p.title||'Untitled')}</div>
                <div style="font-size:10px;color:var(--muted)">${cmsTimeAgo(p.updatedAt)}</div>
              </div>
              <span class="cms-status-badge ${p.status}">${p.status}</span>
            </div>`).join('')
          : '<div style="padding:20px;text-align:center;color:var(--muted);font-size:12px">No posts yet</div>'}
        </div>
      </div>

      <!-- Activity feed -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;margin-left:10px">
        <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
          <span style="font-size:13px;font-weight:700;color:var(--text)">Recent Activity</span>
        </div>
        <div class="cms-activity" style="padding:0 16px 12px">
          ${activity.length ? activity.slice(0,8).map(a=>`
            <div class="cms-activity-item">
              <div class="cms-activity-icon">${a.icon}</div>
              <div class="cms-activity-text">
                <strong style="color:var(--text)">${a.action}</strong> — ${e(a.title)}
                <div style="font-size:10px;color:var(--muted);margin-top:2px">${a.model} · ${cmsTimeAgo(a.timestamp)}</div>
              </div>
            </div>`).join('')
          : '<div style="padding:20px;text-align:center;color:var(--muted);font-size:12px">No activity yet</div>'}
        </div>
      </div>
    </div>`
}

// ── List view (posts & pages) ─────────────────────────────────────────────────
function renderCMSList(model, area) {
  area = area || document.getElementById('cms-main-area')
  const def  = CMS_MODELS[model]
  let entries = cmsGetAll(model)

  // Filter
  if (CMS_UI.search) {
    const q = CMS_UI.search.toLowerCase()
    entries = entries.filter(e => (e.title||'').toLowerCase().includes(q) || (e.excerpt||'').toLowerCase().includes(q))
  }
  if (CMS_UI.filter !== 'all') entries = entries.filter(e => e.status === CMS_UI.filter)

  // Sort
  entries.sort((a,b) => b[CMS_UI.sort]?.localeCompare(a[CMS_UI.sort] || '') || 0)

  area.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%">
      <div class="cms-section-head">
        <div>
          <div class="cms-section-title">${def.icon} ${def.label}s</div>
          <div class="cms-section-subtitle">${entries.length} ${entries.length === 1 ? def.label.toLowerCase() : def.label.toLowerCase()+'s'}</div>
        </div>
        <button class="cms-new-btn" onclick="cmsNewEntry('${model}')">+ New ${def.label}</button>
      </div>

      <div class="cms-filter-bar">
        <input class="cms-search" placeholder="🔍  Search ${def.label.toLowerCase()}s…"
          value="${e(CMS_UI.search)}"
          oninput="CMS_UI.search=this.value;renderCMSList('${model}')"/>
        <select class="cms-filter-sel" onchange="CMS_UI.filter=this.value;renderCMSList('${model}')">
          <option value="all"${CMS_UI.filter==='all'?' selected':''}>All statuses</option>
          <option value="published"${CMS_UI.filter==='published'?' selected':''}>Published</option>
          <option value="draft"${CMS_UI.filter==='draft'?' selected':''}>Drafts</option>
          <option value="archived"${CMS_UI.filter==='archived'?' selected':''}>Archived</option>
        </select>
        <select class="cms-filter-sel" onchange="CMS_UI.sort=this.value;renderCMSList('${model}')">
          <option value="updatedAt">Last updated</option>
          <option value="createdAt">Date created</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      <div class="cms-list" style="flex:1;overflow-y:auto">
        ${!entries.length ? `
          <div class="cms-empty">
            <div class="cms-empty-icon">${def.icon}</div>
            <h3>No ${def.label.toLowerCase()}s yet</h3>
            <p>Create your first ${def.label.toLowerCase()} to get started.</p>
            <button class="cms-new-btn" style="margin-top:6px" onclick="cmsNewEntry('${model}')">+ New ${def.label}</button>
          </div>` : `
          <table class="cms-table">
            <thead>
              <tr>
                <th>Title</th>
                ${model === 'post' ? '<th>Category</th>' : '<th>Template</th>'}
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(entry => `
                <tr>
                  <td>
                    <div class="cms-row-title" style="cursor:pointer" onclick="cmsEditEntry('${entry.id}')">
                      ${entry.featuredImg && !entry.featuredImg.includes('${') ? `<img src="${entry.featuredImg}" style="width:36px;height:28px;object-fit:cover;border-radius:4px;flex-shrink:0" onerror="this.style.display='none'"/>` : ''}
                      ${e(entry.title || 'Untitled')}
                    </div>
                    ${entry.excerpt ? `<div class="cms-row-excerpt">${e(entry.excerpt)}</div>` : ''}
                  </td>
                  <td style="color:var(--muted);font-size:11px">${e(model==='post' ? (entry.category||'—') : (entry.template||'default'))}</td>
                  <td><span class="cms-status-badge ${entry.status}">${entry.status}</span></td>
                  <td style="color:var(--muted);white-space:nowrap">${cmsTimeAgo(entry.updatedAt)}</td>
                  <td>
                    <div class="cms-row-actions">
                      <button class="cms-row-btn" onclick="cmsEditEntry('${entry.id}')">Edit</button>
                      <button class="cms-row-btn" onclick="cmsToggleStatus('${entry.id}')">${entry.status==='published'?'Unpublish':'Publish'}</button>
                      <button class="cms-row-btn" onclick="cmsDuplicate('${entry.id}')">⧉</button>
                      <button class="cms-row-btn danger" onclick="cmsDeleteEntry('${entry.id}')">Delete</button>
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>`}
      </div>
    </div>`
}

// ── New entry ─────────────────────────────────────────────────────────────────
function cmsNewEntry(model) {
  const def    = CMS_MODELS[model]
  const author = AUTH.user?.name || ''
  const blank  = { title:'', slug:'', body:'', status:'draft', author, model }
  if (model === 'post') { blank.category = ''; blank.tags = []; blank.excerpt = '' }
  const entry = cmsCreate(model, blank)
  CMS_UI.editingId    = entry.id
  CMS_UI.editingModel = model
  CMS_UI.view = 'editor'
  updateCMSNavCounts()
  renderCMSView()
}

// ── Edit entry ────────────────────────────────────────────────────────────────
function cmsEditEntry(id) {
  const entry = cmsGet(id)
  if (!entry) return
  CMS_UI.editingId    = id
  CMS_UI.editingModel = entry.model
  CMS_UI.view = 'editor'
  renderCMSView()
}

// ── Delete entry ──────────────────────────────────────────────────────────────
function cmsDeleteEntry(id) {
  const entry = cmsGet(id)
  if (!entry) return
  if (!confirm(`Delete "${entry.title || 'Untitled'}"?\n\nThis cannot be undone.`)) return
  cmsDelete(id)
  updateCMSNavCounts()
  renderCMSView()
  toast('Deleted', '🗑')
}

// ── Rich-text editor view ─────────────────────────────────────────────────────
function renderCMSEditor(area) {
  const entry = cmsGet(CMS_UI.editingId)
  if (!entry) { cmsNav(CMS_UI.view === 'editor' ? 'posts' : CMS_UI.view); return }
  const def   = CMS_MODELS[entry.model]
  const tags  = Array.isArray(entry.tags) ? entry.tags : []

  // Update breadcrumb
  const bc = document.getElementById('cms-bar-breadcrumb')
  if (bc) bc.textContent = `${def.label}s → ${entry.title || 'Untitled'}`

  area.innerHTML = `
    <div class="cms-editor open">

      <!-- Editor toolbar -->
      <div class="cms-editor-bar">
        <button onclick="cmsCancelEditor()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;padding:0">
          ← ${def.label}s
        </button>
        <div style="flex:1"></div>
        <select class="cms-editor-status-sel" id="cms-status-sel" onchange="cmsUpdateField('status',this.value)">
          <option value="draft"${entry.status==='draft'?' selected':''}>📝 Draft</option>
          <option value="published"${entry.status==='published'?' selected':''}>✅ Published</option>
          <option value="archived"${entry.status==='archived'?' selected':''}>📦 Archived</option>
        </select>
        <button class="cms-editor-save-btn" onclick="cmsSaveEditor()">
          💾 Save
        </button>
      </div>

      <!-- Editor body -->
      <div class="cms-editor-body">

        <!-- Rich text area -->
        <div class="cms-rte-wrap">
          <!-- RTE toolbar -->
          <div class="cms-rte-toolbar">
            <button class="rte-btn" onclick="rte('bold')" title="Bold"><b>B</b></button>
            <button class="rte-btn" onclick="rte('italic')" title="Italic"><i>I</i></button>
            <button class="rte-btn" onclick="rte('underline')" title="Underline"><u>U</u></button>
            <div class="rte-sep"></div>
            <button class="rte-btn" onclick="rte('formatBlock','H2')" title="Heading 2">H2</button>
            <button class="rte-btn" onclick="rte('formatBlock','H3')" title="Heading 3">H3</button>
            <button class="rte-btn" onclick="rte('formatBlock','BLOCKQUOTE')" title="Quote">❝</button>
            <div class="rte-sep"></div>
            <button class="rte-btn" onclick="rte('insertUnorderedList')" title="Bullet list">•—</button>
            <button class="rte-btn" onclick="rte('insertOrderedList')" title="Numbered list">1.</button>
            <div class="rte-sep"></div>
            <button class="rte-btn" onclick="rteLink()" title="Link">🔗</button>
            <button class="rte-btn" onclick="rte('formatBlock','PRE')" title="Code block">&lt;/&gt;</button>
            <div class="rte-sep"></div>
            <button class="rte-btn" onclick="rte('undo')" title="Undo">↩</button>
            <button class="rte-btn" onclick="rte('redo')" title="Redo">↪</button>
          </div>

          <!-- Title input -->
          <div style="padding:20px 32px 0">
            <input id="cms-title-inp" style="width:100%;background:none;border:none;font-size:24px;font-weight:800;color:var(--text);outline:none;font-family:inherit;line-height:1.2"
              placeholder="Enter title…" value="${e(entry.title||'')}"
              oninput="cmsUpdateField('title',this.value);cmsAutoSlug(this.value);updateWordCount()"/>
          </div>

          <!-- RTE content area -->
          <div id="cms-rte" class="cms-rte" contenteditable="true"
            data-placeholder="Start writing…"
            oninput="updateWordCount()"
            style="min-height:300px">${entry.body || ''}</div>
          <div class="cms-word-count" id="cms-word-count">0 words</div>
        </div>

        <!-- Meta sidebar -->
        <div class="cms-editor-sidebar">

          <!-- Publish info -->
          <div class="cms-meta-section">
            <div class="cms-meta-section-title">🗓 Publish</div>
            <div class="cms-meta-field">
              <div class="cms-meta-label">Slug</div>
              <input class="cms-meta-inp" id="cms-slug-inp" placeholder="url-slug"
                value="${e(entry.slug||'')}" oninput="cmsUpdateField('slug',this.value)"/>
            </div>
            ${entry.model === 'post' ? `
            <div class="cms-meta-field">
              <div class="cms-meta-label">Author</div>
              <input class="cms-meta-inp" placeholder="Author name" value="${e(entry.author||AUTH.user?.name||'')}"
                oninput="cmsUpdateField('author',this.value)"/>
            </div>
            <div class="cms-meta-field">
              <div class="cms-meta-label">Category</div>
              <input class="cms-meta-inp" placeholder="e.g. Technology" value="${e(entry.category||'')}"
                oninput="cmsUpdateField('category',this.value)"/>
            </div>` : `
            <div class="cms-meta-field">
              <div class="cms-meta-label">Template</div>
              <select class="cms-meta-inp" onchange="cmsUpdateField('template',this.value)">
                ${['default','landing','minimal','blog'].map(t=>`<option${(entry.template||'default')===t?' selected':''}>${t}</option>`).join('')}
              </select>
            </div>`}
          </div>

          <!-- Featured image -->
          <div class="cms-meta-section">
            <div class="cms-meta-section-title">🖼 Featured Image</div>
            <div class="cms-img-picker" onclick="toggleStockPhotos()" id="cms-feat-img">
              ${entry.featuredImg && !entry.featuredImg.includes('${') ? `<img src="${entry.featuredImg}" id="cms-feat-img-preview" onerror="this.style.display='none'"/>` : ''}
              <span class="cms-img-picker-label">${entry.featuredImg && !entry.featuredImg.includes('${') ? '' : '+ Add image'}</span>
              <div class="cms-img-picker-overlay"><span style="color:#fff;font-size:11px">Change image</span></div>
            </div>
            <div id="cms-stock-panel" style="display:none">
              <div class="cms-stock-grid" id="cms-stock-grid">
                ${CMS_STOCK.map(url=>`
                  <img class="cms-stock-img${entry.featuredImg===url?' selected':''}" src="${url}"
                    onclick="selectFeaturedImg('${url}')" loading="lazy"/>`).join('')}
              </div>
              <input class="cms-meta-inp" style="margin-top:8px" placeholder="Or paste image URL…"
                value="${e(entry.featuredImg||'')}" oninput="selectFeaturedImg(this.value)"/>
            </div>
          </div>

          <!-- Tags (posts only) -->
          ${entry.model === 'post' ? `
          <div class="cms-meta-section">
            <div class="cms-meta-section-title">🏷 Tags</div>
            <div class="cms-meta-field">
              <div class="cms-tag-wrap" id="cms-tags-wrap">
                ${tags.map(t=>`<span class="cms-tag">${e(t)}<span class="cms-tag-remove" onclick="cmsRemoveTag('${e(t)}')">×</span></span>`).join('')}
                <input class="cms-tag-input" id="cms-tag-input" placeholder="Add tag…"
                  onkeydown="cmsTagKeydown(event)"/>
              </div>
            </div>
          </div>` : ''}

          <!-- Excerpt -->
          ${entry.model === 'post' ? `
          <div class="cms-meta-section">
            <div class="cms-meta-section-title">📋 Excerpt</div>
            <div class="cms-meta-field">
              <textarea class="cms-meta-inp cms-meta-textarea" placeholder="Short summary…"
                oninput="cmsUpdateField('excerpt',this.value)">${e(entry.excerpt||'')}</textarea>
            </div>
          </div>` : ''}

          <!-- SEO -->
          <div class="cms-meta-section">
            <div class="cms-meta-section-title">🔍 SEO</div>
            <div class="cms-meta-field">
              <div class="cms-meta-label">SEO Title</div>
              <input class="cms-meta-inp" id="cms-seo-title" placeholder="Page title for search engines"
                value="${e(entry.seoTitle||'')}" oninput="cmsUpdateField('seoTitle',this.value);updateSeoPreview()"/>
            </div>
            <div class="cms-meta-field">
              <div class="cms-meta-label">Meta Description</div>
              <textarea class="cms-meta-inp cms-meta-textarea" id="cms-seo-desc" placeholder="Brief description for search engines" style="min-height:60px"
                oninput="cmsUpdateField('seoDesc',this.value);updateSeoPreview()">${e(entry.seoDesc||'')}</textarea>
            </div>
            <!-- Google preview -->
            <div class="cms-meta-label" style="margin-bottom:6px">Preview</div>
            <div class="seo-preview" id="cms-seo-preview">
              <div class="seo-preview-url" id="seo-prev-url">${cmsLoadSettings().siteUrl||'https://yoursite.com'}/${e(entry.slug||'')}</div>
              <div class="seo-preview-title" id="seo-prev-title">${e(entry.seoTitle||entry.title||'Page Title')}</div>
              <div class="seo-preview-desc" id="seo-prev-desc">${e(entry.seoDesc||entry.excerpt||'Meta description will appear here…')}</div>
            </div>
          </div>

        </div>
      </div>
    </div>`

  // Init word count
  updateWordCount()
}

// ── Editor helpers ────────────────────────────────────────────────────────────
function rte(cmd, val = null) {
  document.getElementById('cms-rte')?.focus()
  document.execCommand(cmd, false, val)
}
function rteLink() {
  const url = prompt('URL:', 'https://')
  if (url) rte('createLink', url)
}
function updateWordCount() {
  const rteEl = document.getElementById('cms-rte')
  const el    = document.getElementById('cms-word-count')
  if (!rteEl || !el) return
  const words = rteEl.innerText.trim().split(/\s+/).filter(Boolean).length
  el.textContent = `${words} word${words === 1 ? '' : 's'}`
}
function cmsAutoSlug(title) {
  const inp = document.getElementById('cms-slug-inp')
  if (inp && !inp.dataset.manual) inp.value = slugify(title)
  cmsUpdateField('slug', slugify(title))
}
function cmsUpdateField(key, val) {
  if (!CMS_UI.editingId) return
  const db = cmsLoad()
  if (db[CMS_UI.editingId]) {
    db[CMS_UI.editingId][key] = val
    db[CMS_UI.editingId].updatedAt = new Date().toISOString()
    cmsSave(db)
  }
}
function cmsSaveEditor() {
  const rteEl = document.getElementById('cms-rte')
  if (rteEl) cmsUpdateField('body', rteEl.innerHTML)
  cmsLog('update', CMS_UI.editingModel, cmsGet(CMS_UI.editingId)?.title || 'Untitled', CMS_UI.editingId)
  toast('Saved ✓', '💾')
}
function cmsCancelEditor() {
  CMS_UI.editingId = null
  CMS_UI.view = CMS_UI.editingModel === 'page' ? 'pages' : 'posts'
  renderCMSView()
}
function updateSeoPreview() {
  const entry = cmsGet(CMS_UI.editingId)
  if (!entry) return
  const settings = cmsLoadSettings()
  const url  = document.getElementById('seo-prev-url')
  const ttl  = document.getElementById('seo-prev-title')
  const desc = document.getElementById('seo-prev-desc')
  if (url)  url.textContent  = (settings.siteUrl||'https://yoursite.com') + '/' + (entry.slug||'')
  if (ttl)  ttl.textContent  = entry.seoTitle  || entry.title  || 'Page Title'
  if (desc) desc.textContent = entry.seoDesc   || entry.excerpt || 'Meta description…'
}
function toggleStockPhotos() {
  const panel = document.getElementById('cms-stock-panel')
  if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
}
function selectFeaturedImg(url) {
  cmsUpdateField('featuredImg', url)
  document.querySelectorAll('.cms-stock-img').forEach(img => img.classList.toggle('selected', img.src === url || img.getAttribute('src') === url))
  const preview = document.getElementById('cms-feat-img')
  if (preview) {
    const existing = preview.querySelector('img')
    if (existing) { existing.src = url }
    else {
      const img = document.createElement('img')
      img.id = 'cms-feat-img-preview'; img.src = url
      preview.prepend(img)
    }
    preview.querySelector('.cms-img-picker-label').textContent = ''
  }
}

// ── Tags ──────────────────────────────────────────────────────────────────────
function cmsTagKeydown(ev) {
  if (ev.key !== 'Enter' && ev.key !== ',') return
  ev.preventDefault()
  const val = ev.target.value.trim().replace(/,$/, '')
  if (!val) return
  const entry = cmsGet(CMS_UI.editingId)
  if (!entry) return
  const tags = Array.isArray(entry.tags) ? entry.tags : []
  if (!tags.includes(val)) {
    const newTags = [...tags, val]
    cmsUpdateField('tags', newTags)
    ev.target.value = ''
    renderTagsUI(newTags)
  }
}
function cmsRemoveTag(tag) {
  const entry = cmsGet(CMS_UI.editingId)
  if (!entry) return
  const tags = (Array.isArray(entry.tags) ? entry.tags : []).filter(t => t !== tag)
  cmsUpdateField('tags', tags)
  renderTagsUI(tags)
}
function renderTagsUI(tags) {
  const wrap = document.getElementById('cms-tags-wrap')
  if (!wrap) return
  const inp = wrap.querySelector('.cms-tag-input')
  wrap.innerHTML = tags.map(t=>`<span class="cms-tag">${e(t)}<span class="cms-tag-remove" onclick="cmsRemoveTag('${e(t)}')">×</span></span>`).join('')
  if (inp) { inp.value = ''; wrap.appendChild(inp) }
}

// ── Media library ─────────────────────────────────────────────────────────────
function renderCMSMedia(area) {
  area.innerHTML = `
    <div>
      <div class="cms-section-head">
        <div><div class="cms-section-title">🖼 Media Library</div>
        <div class="cms-section-subtitle">Stock photos available for use</div></div>
      </div>
      <div class="cms-media-grid">
        ${CMS_STOCK.map(url=>`
          <div class="cms-media-item" onclick="navigator.clipboard.writeText('${url}').then(()=>toast('URL copied','📋'))">
            <img src="${url}" loading="lazy"/>
            <div class="cms-media-copy">Copy URL</div>
          </div>`).join('')}
      </div>
    </div>`
}

// ── Content Models view ───────────────────────────────────────────────────────
function renderCMSModels(area) {
  area.innerHTML = `
    <div>
      <div class="cms-section-head">
        <div><div class="cms-section-title">🗂 Content Models</div>
        <div class="cms-section-subtitle">Field schemas for each content type</div></div>
      </div>
      <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${Object.entries(CMS_MODELS).map(([key, def])=>`
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">
            <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px">
              <span style="font-size:18px">${def.icon}</span>
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--text)">${def.label}</div>
                <div style="font-size:10px;color:var(--muted)">${def.fields.length} fields</div>
              </div>
            </div>
            <div style="padding:10px 16px">
              ${def.fields.map(f=>`
                <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:10px;background:var(--surface2);color:var(--muted);padding:1px 6px;border-radius:4px;font-family:monospace">${f.type}</span>
                  <span style="font-size:12px;color:var(--text2)">${f.label}</span>
                  ${f.required?'<span style="font-size:9px;color:var(--danger);margin-left:auto">required</span>':''}
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`
}

// ── Settings ──────────────────────────────────────────────────────────────────
function renderCMSSettings(area) {
  const s = cmsLoadSettings()
  area.innerHTML = `
    <div>
      <div class="cms-section-head">
        <div><div class="cms-section-title">⚙️ CMS Settings</div></div>
        <button class="cms-new-btn" onclick="cmsSaveSettings_ui()">Save Settings</button>
      </div>
      <div style="padding:20px;max-width:520px;display:flex;flex-direction:column;gap:14px">
        ${[
          {id:'siteUrl',  label:'Site URL',        ph:'https://yoursite.com',  val:s.siteUrl||''},
          {id:'siteName', label:'Site Name',       ph:'My Blog',               val:s.siteName||''},
          {id:'blogBase', label:'Blog URL prefix', ph:'blog',                  val:s.blogBase||'blog'},
        ].map(f=>`
          <div class="cms-meta-field">
            <div class="cms-meta-label" style="font-size:12px;margin-bottom:6px">${f.label}</div>
            <input class="cms-meta-inp" id="cms-set-${f.id}" placeholder="${f.ph}" value="${e(f.val)}"/>
          </div>`).join('')}

        <div style="border-top:1px solid var(--border);padding-top:14px">
          <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">Export / Import Content</div>
          <div style="display:flex;gap:8px">
            <button class="cms-new-btn" style="background:none;border:1px solid var(--accent);color:var(--accent)" onclick="cmsExportAll()">⬇ Export All Content</button>
            <button class="cms-new-btn" style="background:none;border:1px solid var(--border2);color:var(--text2)" onclick="cmsImportAll()">📂 Import Content</button>
          </div>
        </div>
      </div>
    </div>`
}

function cmsSaveSettings_ui() {
  const settings = {
    siteUrl:  document.getElementById('cms-set-siteUrl')?.value.trim(),
    siteName: document.getElementById('cms-set-siteName')?.value.trim(),
    blogBase: document.getElementById('cms-set-blogBase')?.value.trim(),
  }
  cmsSaveSettings(settings)
  toast('Settings saved', '✓')
}

function cmsExportAll() {
  const db  = cmsLoad()
  const all = Object.values(db)
  if (!all.length) { toast('No content to export','⚠️'); return }
  const blob = new Blob([JSON.stringify({ content: all, exportedAt: new Date().toISOString() }, null, 2)], { type:'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'cms-export.json'; a.click(); URL.revokeObjectURL(url)
  toast(`Exported ${all.length} item(s)`, '⬇')
}

function cmsImportAll() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        const items = data.content || (Array.isArray(data) ? data : null)
        if (!items) throw new Error('Invalid CMS export file')
        const db = cmsLoad(); let count = 0
        items.forEach(item => { if (item.id && item.model) { db[item.id] = item; count++ } })
        cmsSave(db); updateCMSNavCounts(); renderCMSView()
        toast(`Imported ${count} item(s)`, '📂')
      } catch(err) { toast('Import failed: ' + err.message, '⚠️') }
    }
    reader.readAsText(f)
  }
  inp.click()
}

/* @include scripts/features/templates.js */

/* @include scripts/features/auth.js */

/* ══════════════════════════════════════════════════════
   PLUGIN SYSTEM
   • PluginManager  — persists install/enable state in localStorage
   • createPluginAPI — sandboxed API injected into each plugin
   • PLUGIN_REGISTRY — 6 bundled plugins (sections + tools)
   • Marketplace UI  — browse / install / enable / disable
══════════════════════════════════════════════════════ */

// ── Persistent plugin state ───────────────────────────────────────────────────
const PLUGIN_STORE_KEY = 'pc_plugins_v1'

const PluginManager = (() => {
  function load() {
    try { return JSON.parse(localStorage.getItem(PLUGIN_STORE_KEY) || '{"installed":[],"enabled":[]}') }
    catch { return { installed: [], enabled: [] } }
  }
  function save(state) {
    try { localStorage.setItem(PLUGIN_STORE_KEY, JSON.stringify(state)) } catch {}
  }
  function isInstalled(id) { return load().installed.includes(id) }
  function isEnabled(id)   { return load().enabled.includes(id) }

  function install(id) {
    const s = load()
    if (!s.installed.includes(id)) s.installed.push(id)
    if (!s.enabled.includes(id))   s.enabled.push(id)
    save(s)
  }
  function uninstall(id) {
    const s = load()
    s.installed = s.installed.filter(x => x !== id)
    s.enabled   = s.enabled.filter(x => x !== id)
    save(s)
  }
  function setEnabled(id, enabled) {
    const s = load()
    if (enabled  && !s.enabled.includes(id)) s.enabled.push(id)
    if (!enabled) s.enabled = s.enabled.filter(x => x !== id)
    save(s)
  }
  return { load, isInstalled, isEnabled, install, uninstall, setEnabled }
})()

// ── Plugin API factory ────────────────────────────────────────────────────────
// Each plugin receives its own sandboxed API object so plugins cannot
// accidentally stomp each other's injected DOM nodes.
function createPluginAPI(pluginId) {
  return {
    // Register a new section type into the builder
    registerSection(type, def, renderer) {
      DEFS[type] = def
      R[type]    = renderer
      COMPONENT_TYPES.add(type)               // show in Components sidebar tab
      if (def.schema)      ES[type] = def.schema      // edit panel fields
      if (def.styleSchema) SS[type] = def.styleSchema // style panel color fields
      renderBlocks()
    },
    // Remove a section type and strip any existing canvas instances
    unregisterSection(type) {
      delete DEFS[type]
      delete R[type]
      COMPONENT_TYPES.delete(type)
      delete ES[type]
      delete SS[type]
      const had = S.sections.some(s => s.type === type)
      if (had) { S.sections = S.sections.filter(s => s.type !== type); renderAll() }
      renderBlocks()
    },
    // Inject a <style> tag scoped to this plugin
    addCSS(css) {
      let el = document.getElementById(`plugin-css-${pluginId}`)
      if (!el) { el = document.createElement('style'); el.id = `plugin-css-${pluginId}`; document.head.appendChild(el) }
      el.textContent = css
    },
    removeCSS() { document.getElementById(`plugin-css-${pluginId}`)?.remove() },
    // Add / remove a button in the topbar
    addToolbarButton(label, title, onClick) {
      if (document.getElementById(`plugin-btn-${pluginId}`)) return
      const btn = document.createElement('button')
      btn.id        = `plugin-btn-${pluginId}`
      btn.className = 'btn btn-outline'
      btn.textContent = label
      btn.title     = title
      btn.style.fontSize = '11px'
      btn.onclick   = onClick
      document.querySelector('.topbar-r').prepend(btn)
    },
    removeToolbarButton() { document.getElementById(`plugin-btn-${pluginId}`)?.remove() },
    toast(msg, icon) { toast(msg, icon) },
    getState() { return { sections: S.sections } },
  }
}

// ── Bundled plugin registry ───────────────────────────────────────────────────
const PLUGIN_REGISTRY = [

  /* 1 ─ Stats Section ─────────────────────────────────────────────────────── */
  {
    id: 'stats-section', name: 'Stats Section', version: '1.0.0',
    icon: '📊', color: '#0ea5e922', author: 'PageCraft',
    description: 'Animated number counters to showcase key metrics — users, revenue, satisfaction rates, and more.',
    tags: ['section', 'metrics', 'numbers'],
    install(api) {
      api.registerSection('stats', {
        label:'Stats', icon:'📊', color:'#0ea5e922', desc:'Animated metric counters',
        schema:[
          {g:'Header',    f:[{k:'heading',l:'Heading',t:'text'}]},
          {g:'Stat 1',    f:[{k:'stat1Val',l:'Value',t:'text'},{k:'stat1Label',l:'Label',t:'text'}]},
          {g:'Stat 2',    f:[{k:'stat2Val',l:'Value',t:'text'},{k:'stat2Label',l:'Label',t:'text'}]},
          {g:'Stat 3',    f:[{k:'stat3Val',l:'Value',t:'text'},{k:'stat3Label',l:'Label',t:'text'}]},
          {g:'Stat 4',    f:[{k:'stat4Val',l:'Value',t:'text'},{k:'stat4Label',l:'Label',t:'text'}]},
        ],
        styleSchema:[{k:'bgColor',l:'Background'},{k:'textColor',l:'Text'},{k:'accentColor',l:'Accent'}],
        props:{
          heading:'Numbers That Speak',
          stat1Val:'10K+', stat1Label:'Happy Customers',
          stat2Val:'98%',  stat2Label:'Satisfaction Rate',
          stat3Val:'$2M+', stat3Label:'Revenue Generated',
          stat4Val:'24/7', stat4Label:'Support Available',
          bgColor:'#0f172a', textColor:'#ffffff', accentColor:'#0ea5e9',
        },
      }, (p, id) => {
        const cells = [
          [p.stat1Val, p.stat1Label, 1], [p.stat2Val, p.stat2Label, 2],
          [p.stat3Val, p.stat3Label, 3], [p.stat4Val, p.stat4Label, 4],
        ]
        return `<section style="background:${ec(p.bgColor)};color:${ec(p.textColor)};padding:64px clamp(24px,8vw,80px);">
<div style="max-width:960px;margin:0 auto;text-align:center;">
<h2 contenteditable="true" data-id="${id}" data-key="heading" style="font-size:clamp(1.4rem,3vw,2rem);font-weight:800;margin:0 0 40px;">${e(p.heading)}</h2>
<div style="display:grid;grid-template-columns:${S.device==='mobile'?'repeat(2,1fr)':S.device==='tablet'?'repeat(2,1fr)':'repeat(4,1fr)'};gap:20px;">
${cells.map(([val,lbl,n]) => `<div style="background:${ec(p.accentColor)}1a;border:1px solid ${ec(p.accentColor)}33;border-radius:14px;padding:28px 16px;">
<div contenteditable="true" data-id="${id}" data-key="stat${n}Val" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:900;color:${ec(p.accentColor)};margin:0 0 6px;">${e(val)}</div>
<div contenteditable="true" data-id="${id}" data-key="stat${n}Label" style="font-size:13px;opacity:.65;">${e(lbl)}</div>
</div>`).join('')}
</div></div></section>`
      })
    },
    uninstall(api) { api.unregisterSection('stats') },
    enable(api)    { this.install(api) },
    disable(api)   { api.unregisterSection('stats') },
  },

  /* 2 ─ Announcement Bar ──────────────────────────────────────────────────── */
  {
    id: 'announcement-bar', name: 'Announcement Bar', version: '1.0.0',
    icon: '📣', color: '#f59e0b22', author: 'PageCraft',
    description: 'A slim top-of-page banner for promotions, launches, or time-sensitive messages.',
    tags: ['section', 'banner', 'marketing'],
    install(api) {
      api.registerSection('announcement', {
        label:'Announcement', icon:'📣', color:'#f59e0b22', desc:'Slim top-of-page banner',
        schema:[{g:'Content',f:[{k:'text',l:'Message',t:'textarea'},{k:'linkText',l:'Link Text',t:'text'},{k:'linkHref',l:'Link URL',t:'text'}]}],
        styleSchema:[{k:'bgColor',l:'Background'},{k:'textColor',l:'Text'},{k:'accentColor',l:'Link'}],
        props:{
          text:'🎉 New: PageCraft 2.0 is here — faster, smarter, better.',
          linkText:'Read more →', linkHref:'#',
          bgColor:'#fef3c7', textColor:'#92400e', accentColor:'#d97706',
        },
      }, (p, id) => `<div style="background:${ec(p.bgColor)};color:${ec(p.textColor)};padding:10px clamp(16px,4vw,48px);text-align:center;font-size:13px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;">
<span contenteditable="true" data-id="${id}" data-key="text">${e(p.text)}</span>
<a href="${eu(p.linkHref)}" style="color:${ec(p.accentColor)};font-weight:700;text-decoration:underline;text-underline-offset:2px;">
<span contenteditable="true" data-id="${id}" data-key="linkText">${e(p.linkText)}</span></a>
</div>`)
    },
    uninstall(api) { api.unregisterSection('announcement') },
    enable(api)    { this.install(api) },
    disable(api)   { api.unregisterSection('announcement') },
  },

  /* 3 ─ Cookie Banner ─────────────────────────────────────────────────────── */
  {
    id: 'cookie-banner', name: 'Cookie Banner', version: '1.0.0',
    icon: '🍪', color: '#10b98122', author: 'PageCraft',
    description: 'GDPR-compliant cookie consent section. Place at the bottom of your page.',
    tags: ['section', 'legal', 'gdpr'],
    install(api) {
      api.registerSection('cookie-consent', {
        label:'Cookie Banner', icon:'🍪', color:'#10b98122', desc:'GDPR cookie consent bar',
        schema:[{g:'Content',f:[{k:'text',l:'Text',t:'textarea'},{k:'acceptText',l:'Accept Button',t:'text'},{k:'declineText',l:'Decline Button',t:'text'},{k:'linkText',l:'Policy Link',t:'text'},{k:'linkHref',l:'Policy URL',t:'text'}]}],
        styleSchema:[{k:'bgColor',l:'Background'},{k:'textColor',l:'Text'},{k:'accentColor',l:'Accept Button'}],
        props:{
          text:'We use cookies to improve your experience and analyse site traffic.',
          acceptText:'Accept All', declineText:'Decline',
          linkText:'Privacy Policy', linkHref:'#',
          bgColor:'#1e293b', textColor:'#e2e8f0', accentColor:'#10b981',
        },
      }, (p, id) => `<div style="background:${ec(p.bgColor)};color:${ec(p.textColor)};padding:16px clamp(16px,4vw,48px);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:13px;">
<div style="flex:1;min-width:220px;">
  <span contenteditable="true" data-id="${id}" data-key="text">${e(p.text)}</span>
  <a href="${eu(p.linkHref)}" style="color:${ec(p.accentColor)};margin-left:6px;font-weight:600;text-decoration:underline;">
    <span contenteditable="true" data-id="${id}" data-key="linkText">${e(p.linkText)}</span></a>
</div>
<div style="display:flex;gap:8px;flex-shrink:0;">
  <button style="padding:8px 18px;border:1px solid ${ec(p.textColor)}44;background:none;color:${ec(p.textColor)};border-radius:7px;cursor:pointer;font-size:12px;font-family:inherit;">
    <span contenteditable="true" data-id="${id}" data-key="declineText">${e(p.declineText)}</span></button>
  <button style="padding:8px 18px;background:${ec(p.accentColor)};color:#fff;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;">
    <span contenteditable="true" data-id="${id}" data-key="acceptText">${e(p.acceptText)}</span></button>
</div></div>`)
    },
    uninstall(api) { api.unregisterSection('cookie-consent') },
    enable(api)    { this.install(api) },
    disable(api)   { api.unregisterSection('cookie-consent') },
  },

  /* 4 ─ Grid Overlay ──────────────────────────────────────────────────────── */
  {
    id: 'grid-overlay', name: 'Grid Overlay', version: '1.0.0',
    icon: '⊞', color: '#8b5cf622', author: 'PageCraft',
    description: 'Toggle a 12-column alignment grid over the canvas to help position elements precisely.',
    tags: ['tool', 'design', 'alignment'],
    _on: false,
    install(api) {
      api.addCSS(`
        .canvas-frame.grid-on::before {
          content:'';position:absolute;inset:0;pointer-events:none;z-index:9999;
          background-image:repeating-linear-gradient(
            90deg,rgba(108,99,255,.13) 0,rgba(108,99,255,.13) 1px,
            transparent 1px,transparent calc(100%/12));
        }`)
      const self = this
      api.addToolbarButton('⊞ Grid', 'Toggle 12-column grid overlay', () => {
        self._on = !self._on
        document.getElementById('canvas-frame')?.classList.toggle('grid-on', self._on)
        const btn = document.getElementById('plugin-btn-grid-overlay')
        if (btn) btn.style.color = self._on ? 'var(--accent2)' : ''
        toast(self._on ? 'Grid on' : 'Grid off', '⊞')
      })
    },
    uninstall(api) {
      document.getElementById('canvas-frame')?.classList.remove('grid-on')
      this._on = false
      api.removeCSS()
      api.removeToolbarButton()
    },
    enable(api)  { this.install(api) },
    disable(api) { this.uninstall(api) },
  },

  /* 5 ─ SEO Analyser ──────────────────────────────────────────────────────── */
  {
    id: 'seo-analyzer', name: 'SEO Analyser', version: '1.0.0',
    icon: '🔍', color: '#6c63ff22', author: 'PageCraft',
    description: 'Scores your page on key SEO factors — title, headings, images, alt text, word count, and CTAs.',
    tags: ['tool', 'seo', 'analysis'],
    install(api) {
      api.addToolbarButton('🔍 SEO', 'Analyse page SEO score', () => {
        const sections = api.getState().sections
        const title    = document.getElementById('page-title')?.value || ''
        const raw      = sections.map(s => { try { return R[s.type]?.(s.props, s.id)||'' } catch { return '' } }).join('')
        const text     = raw.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()
        const words    = text ? text.split(' ').filter(Boolean).length : 0
        const imgs     = (raw.match(/<img /g)||[]).length
        const alts     = (raw.match(/alt="[^"]+"/g)||[]).length
        const checks = [
          { label:'Page title is 10+ characters',   pass: title.length >= 10,           tip:`Current: "${title}" (${title.length} chars)` },
          { label:'Has an H1 heading',               pass: /<h1\b/i.test(raw),           tip:'Add a Hero section to get an H1' },
          { label:'Has H2 subheadings',              pass: /<h2\b/i.test(raw),           tip:'Section headings become H2s' },
          { label:'Word count ≥ 300',                pass: words >= 300,                 tip:`Current: ${words} words` },
          { label:'At least one image',              pass: imgs > 0,                     tip:'Add an About or Gallery section' },
          { label:'All images have alt text',        pass: imgs===0 || alts>=imgs,       tip:`${alts}/${imgs} images have alt text` },
          { label:'Has a call-to-action section',    pass: sections.some(s=>['hero','pricing','contact'].includes(s.type)), tip:'Add Hero, Pricing, or Contact' },
          { label:'Has a Footer or Contact section', pass: sections.some(s=>['footer','contact'].includes(s.type)), tip:'Add Footer or Contact' },
        ]
        const passed = checks.filter(c=>c.pass).length
        const score  = Math.round(passed/checks.length*100)
        const col    = score>=80?'#34d399':score>=50?'#f59e0b':'#f87171'
        let ov = document.getElementById('seo-overlay')
        if (!ov) {
          ov = document.createElement('div'); ov.id='seo-overlay'
          ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:2000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);'
          ov.onclick = () => ov.remove()
          document.body.appendChild(ov)
        }
        ov.innerHTML=`<div onclick="event.stopPropagation()" style="background:var(--surface);border:1px solid var(--border2);border-radius:14px;padding:22px;width:380px;max-height:80vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.5);">
<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
  <div style="width:56px;height:56px;border-radius:50%;background:${col}22;border:3px solid ${col};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:${col};flex-shrink:0;">${score}</div>
  <div><div style="font-size:15px;font-weight:700;color:var(--text)">SEO Score</div>
  <div style="font-size:12px;color:var(--muted)">${passed} of ${checks.length} checks passed</div></div>
</div>
${checks.map(c=>`<div style="display:flex;align-items:flex-start;gap:9px;padding:8px 0;border-bottom:1px solid var(--border);">
  <span style="font-size:13px;flex-shrink:0;margin-top:1px">${c.pass?'✅':'❌'}</span>
  <div><div style="font-size:12px;font-weight:600;color:var(--text)">${c.label}</div>
  ${!c.pass?`<div style="font-size:11px;color:var(--muted);margin-top:2px">${c.tip}</div>`:''}</div>
</div>`).join('')}
<button onclick="document.getElementById('seo-overlay').remove()" style="margin-top:14px;width:100%;padding:9px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">Close</button>
</div>`
      })
    },
    uninstall(api) { api.removeToolbarButton(); document.getElementById('seo-overlay')?.remove() },
    enable(api)    { this.install(api) },
    disable(api)   { this.uninstall(api) },
  },

  /* 6 ─ Custom CSS ────────────────────────────────────────────────────────── */
  {
    id: 'custom-css', name: 'Custom CSS', version: '1.0.0',
    icon: '🎨', color: '#ec489922', author: 'PageCraft',
    description: 'Inject custom CSS into the preview and exported HTML. Full control over styling.',
    tags: ['tool', 'styling', 'advanced'],
    _css: '',
    install(api) {
      const self = this
      if (self._css) api.addCSS(self._css)
      api.addToolbarButton('🎨 CSS', 'Edit custom CSS', () => {
        let ov = document.getElementById('custom-css-overlay')
        if (!ov) {
          ov = document.createElement('div'); ov.id='custom-css-overlay'
          ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:2000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);'
          ov.onclick = ev => { if(ev.target===ov) ov.remove() }
          document.body.appendChild(ov)
        }
        ov.innerHTML=`<div onclick="event.stopPropagation()" style="background:var(--surface);border:1px solid var(--border2);border-radius:16px;width:560px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.5);overflow:hidden;">
<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);">
  <span style="font-size:14px;font-weight:700">🎨 Custom CSS</span>
  <button onclick="document.getElementById('custom-css-overlay').remove()" style="background:var(--surface2);border:none;border-radius:6px;color:var(--muted);cursor:pointer;width:28px;height:28px;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>
</div>
<textarea id="custom-css-editor" spellcheck="false" style="flex:1;background:#1a1a1f;border:none;color:#e2e8f0;font-family:'Fira Code',monospace;font-size:13px;line-height:1.7;padding:16px;resize:none;outline:none;min-height:300px;" placeholder="/* Your custom CSS */&#10;.my-section { color: red; }">${e(self._css)}</textarea>
<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;">
  <button onclick="document.getElementById('custom-css-overlay').remove()" style="padding:7px 16px;background:none;border:1px solid var(--border2);color:var(--text2);border-radius:7px;cursor:pointer;font-size:12px;">Cancel</button>
  <button id="apply-css-btn" style="padding:7px 16px;background:var(--accent);color:#fff;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:700;">Apply</button>
</div></div>`
        document.getElementById('apply-css-btn').onclick = () => {
          self._css = document.getElementById('custom-css-editor')?.value || ''
          api.addCSS(self._css)
          document.getElementById('custom-css-overlay')?.remove()
          toast('Custom CSS applied', '🎨')
        }
      })
    },
    uninstall(api) {
      api.removeCSS(); api.removeToolbarButton()
      document.getElementById('custom-css-overlay')?.remove()
    },
    enable(api)  { this.install(api) },
    disable(api) { this.uninstall(api) },
  },
]

// ── Marketplace UI ────────────────────────────────────────────────────────────
let _pluginTab = 'browse'

function openPlugins() {
  document.getElementById('plugin-modal-bg').classList.remove('hidden')
  document.getElementById('plugin-search').value = ''
  _pluginTab = 'browse'
  document.getElementById('ptab-browse').classList.add('active')
  document.getElementById('ptab-installed').classList.remove('active')
  renderPluginList()
  _updatePluginBadge()
}
function closePlugins() { document.getElementById('plugin-modal-bg').classList.add('hidden') }
document.addEventListener('click', ev => { if(ev.target===document.getElementById('plugin-modal-bg')) closePlugins() })

function switchPluginTab(tab) {
  _pluginTab = tab
  document.getElementById('ptab-browse').classList.toggle('active', tab==='browse')
  document.getElementById('ptab-installed').classList.toggle('active', tab==='installed')
  renderPluginList()
}

function _updatePluginBadge() {
  const n = PluginManager.load().installed.length
  const b = document.getElementById('plugin-badge')
  if (b) b.innerHTML = n ? `<span style="background:var(--accent);color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:8px;margin-left:4px">${n}</span>` : ''
  const c = document.getElementById('plugin-installed-count')
  if (c) c.textContent = n ? `${n} installed` : ''
}

function renderPluginList() {
  const query   = (document.getElementById('plugin-search')?.value||'').toLowerCase()
  const state   = PluginManager.load()
  let   plugins = PLUGIN_REGISTRY
  if (_pluginTab==='installed') plugins = plugins.filter(p=>state.installed.includes(p.id))
  if (query) plugins = plugins.filter(p=>
    p.name.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query) ||
    p.tags.some(t=>t.includes(query)))

  const grid = document.getElementById('plugin-grid')
  if (!plugins.length) {
    grid.innerHTML = `<div class="plugin-empty">${_pluginTab==='installed'?'No plugins installed yet — browse and install some!':'No plugins match your search.'}</div>`
    return
  }
  grid.innerHTML = plugins.map(p => {
    const inst = state.installed.includes(p.id)
    const enbl = state.enabled.includes(p.id)
    return `<div class="plugin-card${inst?' installed':''}">
  <div class="plugin-card-head">
    <div class="plugin-icon" style="background:${p.color||'var(--surface3)'}">${p.icon}</div>
    <div class="plugin-info">
      <div class="plugin-name">${e(p.name)}</div>
      <div class="plugin-author">by ${e(p.author)} · v${e(p.version)}</div>
    </div>
  </div>
  <div class="plugin-desc">${e(p.description)}</div>
  <div class="plugin-tags">${p.tags.map(t=>`<span class="plugin-tag">${e(t)}</span>`).join('')}</div>
  <div class="plugin-actions">
    ${inst ? `
      <label class="plugin-toggle" title="${enbl?'Disable':'Enable'} plugin">
        <input type="checkbox" ${enbl?'checked':''} onchange="togglePlugin('${p.id}',this.checked)"/>
        <span class="plugin-toggle-track"></span>
      </label>
      <span class="plugin-status ${enbl?'enabled':'disabled'}" id="pstatus-${p.id}">${enbl?'Enabled':'Disabled'}</span>
      <span style="flex:1"></span>
      <button class="plugin-btn uninstall" onclick="uninstallPlugin('${p.id}')">Uninstall</button>
    ` : `
      <span style="flex:1"></span>
      <button class="plugin-btn install" onclick="installPlugin('${p.id}')">Install</button>
    `}
  </div>
</div>`
  }).join('')
}

function installPlugin(id) {
  const p = PLUGIN_REGISTRY.find(x=>x.id===id); if(!p) return
  PluginManager.install(id)
  try { p.enable(createPluginAPI(id)) } catch(err) { console.error(`Plugin ${id}:`, err) }
  renderPluginList(); _updatePluginBadge()
  toast(`"${p.name}" installed & enabled`, p.icon)
}

function uninstallPlugin(id) {
  const p = PLUGIN_REGISTRY.find(x=>x.id===id); if(!p) return
  if (!confirm(`Uninstall "${p.name}"?`)) return
  try { p.uninstall(createPluginAPI(id)) } catch(err) { console.error(`Plugin ${id}:`, err) }
  PluginManager.uninstall(id)
  renderPluginList(); _updatePluginBadge()
  toast(`"${p.name}" uninstalled`, '🗑')
}

function togglePlugin(id, enabled) {
  const p = PLUGIN_REGISTRY.find(x=>x.id===id); if(!p) return
  PluginManager.setEnabled(id, enabled)
  try { enabled ? p.enable(createPluginAPI(id)) : p.disable(createPluginAPI(id)) }
  catch(err) { console.error(`Plugin ${id}:`, err) }
  const s = document.getElementById(`pstatus-${id}`)
  if (s) { s.textContent = enabled?'Enabled':'Disabled'; s.className=`plugin-status ${enabled?'enabled':'disabled'}` }
  toast(`"${p.name}" ${enabled?'enabled':'disabled'}`, p.icon)
}

// ── Boot all installed + enabled plugins on startup ───────────────────────────
function bootPlugins() {
  const { installed, enabled } = PluginManager.load()
  installed.forEach(id => {
    const p = PLUGIN_REGISTRY.find(x=>x.id===id); if(!p) return
    const api = createPluginAPI(id)
    try { enabled.includes(id) ? p.enable(api) : p.install(api) }
    catch(err) { console.error(`Plugin ${id} boot failed:`, err) }
  })
}

/* ══════════════════════════════════════════════════════
   SUGGESTIONS SYSTEM
   Rule-based section & layout recommendations.
   No external AI — all logic is local heuristics.
══════════════════════════════════════════════════════ */
const Suggestions = (() => {

  // ── Page-type inference ───────────────────────────────────────────────────
  // Looks at the current section mix and returns the most likely intent.
  function inferPageType(sections) {
    const types = new Set(sections.map(s => s.type))
    if (types.has('pricing'))                               return 'saas'
    if (types.has('gallery') && !types.has('pricing'))      return 'portfolio'
    if (types.has('about') && types.has('contact')
        && !types.has('pricing'))                           return 'agency'
    if (types.has('hero') && sections.length <= 2)          return 'starter'
    return 'generic'
  }

  // ── Per-type metadata used in suggestion cards ────────────────────────────
  const META = {
    hero:             { why: 'Every page needs a strong opening',         priority: 'high' },
    features:         { why: 'Highlight what makes you different',        priority: 'high' },
    testimonial:      { why: 'Social proof converts visitors',            priority: 'high' },
    pricing:          { why: 'Show your plans clearly',                   priority: 'high' },
    about:            { why: 'Build trust with your story',               priority: 'medium' },
    contact:          { why: 'Let visitors reach you easily',             priority: 'medium' },
    footer:           { why: 'Required navigation & legal links',         priority: 'high' },
    faq:              { why: 'Answer common objections upfront',          priority: 'medium' },
    gallery:          { why: 'Show your work visually',                   priority: 'medium' },
    'scene-particles':{ why: 'Stand out with an immersive 3D hero',      priority: 'low' },
    'scene-waves':    { why: 'Smooth animated background effect',        priority: 'low' },
  }

  // ── Scoring rules ──────────────────────────────────────────────��──────────
  // Returns [{type, score, confidence (1-3), reason}] sorted high→low.
  // Only non-present types are scored; duplicate types score 0.
  function scoreSections(sections) {
    const present  = new Set(sections.map(s => s.type))
    const pageType = inferPageType(sections)
    const count    = sections.length
    const scores   = {}

    function bump(type, pts, reason) {
      if (present.has(type)) return
      scores[type] = scores[type] || { score: 0, reasons: [] }
      scores[type].score += pts
      scores[type].reasons.push(reason)
    }

    // ── Universal rules ───────────────────────────────────────────────────
    if (!present.has('hero'))    bump('hero',    100, 'Opening hero is missing')
    if (!present.has('footer'))  bump('footer',   90, 'Page has no footer yet')

    // ── Structural completeness ───────────────────────────────────────────
    if (present.has('hero') && !present.has('features'))
      bump('features',   80, 'Follows naturally after a Hero')
    if (present.has('features') && !present.has('testimonial'))
      bump('testimonial', 70, 'Reinforce features with social proof')
    if (present.has('testimonial') && !present.has('pricing'))
      bump('pricing',    60, 'Guide convinced visitors to a plan')
    if (present.has('pricing') && !present.has('faq'))
      bump('faq',        55, 'Address pricing objections')
    if (count >= 2 && !present.has('about'))
      bump('about',      50, 'Add credibility with your story')
    if (count >= 3 && !present.has('contact'))
      bump('contact',    45, 'Give visitors a way to reach you')

    // ── Page-type boosts ──────────────────────────────────────────────────
    if (pageType === 'saas') {
      bump('features',    20, 'SaaS pages need feature breakdowns')
      bump('faq',         20, 'SaaS visitors have many questions')
      bump('testimonial', 15, 'Customer quotes close SaaS deals')
    }
    if (pageType === 'portfolio') {
      bump('gallery',     40, 'Portfolios live and die by visuals')
      bump('about',       25, 'Let clients know who you are')
      bump('contact',     25, 'Make it easy to hire you')
    }
    if (pageType === 'agency') {
      bump('gallery',     30, 'Showcase your past work')
      bump('features',    25, 'Explain what services you offer')
      bump('pricing',     20, 'Agencies benefit from transparent pricing')
    }
    if (pageType === 'starter') {
      bump('features',   30, 'Expand beyond just a hero')
      bump('about',      25, 'Introduce yourself or your product')
    }

    // ── Diversity nudge — avoid a wall of the same type ───────────────────
    const dark  = sections.filter(s => ['hero','testimonial','footer'].includes(s.type)).length
    const light = sections.filter(s => ['features','pricing','faq','about'].includes(s.type)).length
    if (dark > light) {
      bump('features', 10, 'Balance light and dark sections')
      bump('pricing',  8,  'Balance light and dark sections')
    }

    // ── Convert to sorted array ───────────────────────────────────────────
    return Object.entries(scores)
      .filter(([, v]) => v.score > 0)
      .sort(([, a], [, b]) => b.score - a.score)
      .map(([type, { score, reasons }]) => {
        const meta = META[type] || {}
        // Confidence: 1-3 dots based on score magnitude
        const confidence = score >= 70 ? 3 : score >= 40 ? 2 : 1
        return { type, score, confidence, reason: reasons[0], priority: meta.priority || 'low', why: meta.why }
      })
  }

  // ── Layout presets ────────────────────────────────────────────────────────
  const LAYOUTS = [
    {
      id: 'saas',
      name: 'SaaS Landing',
      icon: '🚀',
      desc: 'Convert visitors into signups',
      types: ['hero', 'features', 'pricing', 'testimonial', 'faq', 'footer'],
      colors: ['#6c63ff','#10b981','#0ea5e9','#ec4899','#f59e0b','#64748b'],
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      icon: '🎨',
      desc: 'Showcase your work and get hired',
      types: ['hero', 'about', 'gallery', 'testimonial', 'contact', 'footer'],
      colors: ['#6c63ff','#10b981','#ec4899','#a78bfa','#f59e0b','#64748b'],
    },
    {
      id: 'agency',
      name: 'Agency / Service',
      icon: '🏢',
      desc: 'Full-service business page',
      types: ['hero', 'about', 'features', 'gallery', 'testimonial', 'contact', 'footer'],
      colors: ['#6c63ff','#10b981','#8b5cf6','#ec4899','#a78bfa','#f59e0b','#64748b'],
    },
    {
      id: 'product',
      name: 'Product Page',
      icon: '📦',
      desc: 'Drive product sales',
      types: ['hero', 'features', 'testimonial', 'pricing', 'footer'],
      colors: ['#6c63ff','#8b5cf6','#ec4899','#0ea5e9','#64748b'],
    },
    {
      id: 'minimal',
      name: 'Minimal',
      icon: '✦',
      desc: 'Clean, distraction-free page',
      types: ['hero', 'features', 'contact', 'footer'],
      colors: ['#6c63ff','#10b981','#f59e0b','#64748b'],
    },
    {
      id: 'showcase',
      name: '3D Showcase',
      icon: '✦',
      desc: 'Immersive visual experience',
      types: ['scene-particles', 'features', 'gallery', 'testimonial', 'footer'],
      colors: ['#6366f1','#8b5cf6','#ec4899','#a78bfa','#64748b'],
    },
  ]

  // How well does a layout match the current canvas? (0-100)
  function layoutScore(layout, sections) {
    if (!sections.length) return 50 // neutral for empty canvas
    const present = new Set(sections.map(s => s.type))
    const overlap = layout.types.filter(t => present.has(t)).length
    return Math.round((overlap / layout.types.length) * 100)
  }

  return { inferPageType, scoreSections, LAYOUTS, layoutScore }
})()

// ── Render the Suggest tab ────────────────────────────────────────────────────
function renderSuggestTab() {
  const el = document.getElementById('suggest-panel-content')
  if (!el) return
  const sections  = S.sections
  const pageType  = Suggestions.inferPageType(sections)
  const scored    = Suggestions.scoreSections(sections).slice(0, 5)
  const layouts   = Suggestions.LAYOUTS
    .map(l => ({ ...l, match: Suggestions.layoutScore(l, sections) }))
    .sort((a, b) => b.match - a.match)

  const PAGE_TYPE_LABELS = {
    saas: '🚀 SaaS / Product', portfolio: '🎨 Portfolio',
    agency: '🏢 Agency', starter: '✦ Getting started', generic: '📄 General page',
  }

  const dots = n => `<span class="suggest-confidence">${
    [1,2,3].map(i => `<span class="suggest-dot${i<=n?' on':''}"></span>`).join('')
  }</span>`

  const sectionCards = scored.length
    ? scored.map(({ type, confidence, reason }) => {
        const def = DEFS[type]
        if (!def) return ''
        return `
          <div class="suggest-card">
            <div class="suggest-card-icon" style="background:${def.color}">${def.icon}</div>
            <div class="suggest-card-body">
              <div class="suggest-card-name">${e(def.label)}${dots(confidence)}</div>
              <div class="suggest-card-why">${e(reason)}</div>
            </div>
            <button class="suggest-add-btn" onclick="addSection('${type}');renderSuggestTab()">+ Add</button>
          </div>`
      }).join('')
    : `<p class="suggest-empty">Your page looks complete! Check layouts for inspiration.</p>`

  const layoutCards = layouts.map(l => {
    const matchBadge = l.match >= 60
      ? `<span class="suggest-badge match">Matches</span>`
      : l.match === 0 && !sections.length
        ? `<span class="suggest-badge new">New</span>`
        : ''
    const strips = l.types.map((_, i) =>
      `<div class="layout-strip" style="background:${l.colors[i]||'var(--border2)'};opacity:.7;width:${55+Math.sin(i)*20}%"></div>`
    ).join('')
    return `
      <div class="layout-card">
        <div class="layout-card-head">
          <span class="layout-card-title">${l.icon} ${e(l.name)}${matchBadge}</span>
          <span class="layout-card-meta">${l.types.length} sections</span>
        </div>
        <div class="layout-preview">${strips}</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px">${e(l.desc)}</div>
        <button class="layout-apply-btn" onclick="applyLayout('${l.id}')">Apply Layout</button>
      </div>`
  }).join('')

  el.innerHTML = `
    <div class="page-type-chip">${e(PAGE_TYPE_LABELS[pageType] || pageType)}</div>
    <div class="suggest-section-label">Next Sections</div>
    ${sectionCards}
    <div class="suggest-section-label" style="margin-top:8px">Layouts</div>
    ${layoutCards}
  `
}

// ── Apply a full layout preset ────────────────────────────────────────────────
function applyLayout(layoutId) {
  const layout = Suggestions.LAYOUTS.find(l => l.id === layoutId)
  if (!layout) return
  const present = new Set(S.sections.map(s => s.type))
  // Only add section types not already present, in order
  const toAdd = layout.types.filter(t => !present.has(t) && DEFS[t])
  if (!toAdd.length) { toast('All sections in this layout are already present', 'ℹ️'); return }
  if (S.sections.length && !confirm(`Add ${toAdd.length} missing section(s) from the "${layout.name}" layout?`)) return
  pushH(`Apply layout: ${layout.name}`)
  toAdd.forEach(type => {
    const def = DEFS[type]
    if (!def) return
    const sec = { id: uid(), type, props: { ...def.props } }
    // Insert footer last
    if (type === 'footer') { S.sections.push(sec); return }
    // Insert before footer if one exists
    const fi = S.sections.findIndex(s => s.type === 'footer')
    fi === -1 ? S.sections.push(sec) : S.sections.splice(fi, 0, sec)
  })
  renderAll()
  renderSuggestTab()
  toast(`"${layout.name}" layout applied — ${toAdd.length} section(s) added`, layout.icon)
}

// Hook suggestions tab refresh into the main render cycle.
// Must use assignment (not a function declaration) so hoisting doesn't
// make _orig point at the wrapper instead of the original.
;(function() {
  const _orig = renderAll
  renderAll = function() {
    _orig()
    if (document.getElementById('tab-suggest')?.classList.contains('active')) renderSuggestTab()
  }
})()

/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   WHITE-LABEL SYSTEM
   • Custom brand name, logo emoji, favicon
   • Primary + accent color tokens (CSS vars override)
   • "Powered by" toggle
   • Custom domain config
   • Custom CSS injection (builder UI)
   • Preview tab — live branding preview
   • Storage: localStorage pc_whitelabel_v1
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */
const WhiteLabel = (() => {
  const KEY = 'pc_whitelabel_v1'
  let _tab = 'brand'

  const DEFAULTS = {
    brandName:     'PageCraft',
    brandEmoji:    '⚡',
    logoUrl:       '',
    primaryColor:  '#6366f1',
    accentColor:   '#10b981',
    accentColor2:  '#6c63ff',
    bgColor:       '#0f172a',
    poweredBy:     true,
    poweredByText: 'Built with PageCraft',
    poweredByUrl:  'https://pagecraft.dev',
    supportEmail:  '',
    helpUrl:       '',
    customDomain:  '',
    customCss:     '',
  }

  // Strip any template-literal expressions that were accidentally stored
  function _sanitize(cfg) {
    if (typeof cfg.logoUrl === 'string' && (cfg.logoUrl.includes('${') || cfg.logoUrl.includes('`'))) {
      cfg.logoUrl = ''
    }
    return cfg
  }
  function _load() {
    try { return _sanitize({ ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }) }
    catch { return { ...DEFAULTS } }
  }
  function _save(cfg) { localStorage.setItem(KEY, JSON.stringify(_sanitize({...cfg}))) }

  // ── Apply branding to the live builder UI ─────────────────────────────────
  function apply(cfg) {
    cfg = cfg || _load()

    // Brand name + logo in topbar
    const logoMark = document.querySelector('.logo-mark')
    const logoText = document.querySelector('.logo')
    const _safeLogoUrl = (u) => u && !u.includes('${') && !u.includes('`') && (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/')) ? u : ''
    const _logoUrl = _safeLogoUrl(cfg.logoUrl)
    if (logoMark) logoMark.textContent = _logoUrl ? '' : cfg.brandEmoji
    if (logoMark && _logoUrl) {
      logoMark.innerHTML = `<img src="${_logoUrl}" style="width:22px;height:22px;border-radius:5px;object-fit:cover"/>`
    }
    if (logoText) {
      logoText.childNodes[1] && (logoText.childNodes[1].textContent
        ? logoText.childNodes[1].textContent = cfg.brandName
        : null)
      // Fallback: rebuild logo text
      const span = logoText.querySelector('span') || logoText
      logoText.lastChild.textContent = cfg.brandName
    }

    // CSS token overrides
    const root = document.documentElement
    root.style.setProperty('--accent',  cfg.primaryColor)
    root.style.setProperty('--accent2', cfg.accentColor2)
    root.style.setProperty('--accent3', cfg.accentColor)

    // Custom CSS injection
    let styleEl = document.getElementById('wl-custom-css')
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'wl-custom-css'; document.head.appendChild(styleEl) }
    styleEl.textContent = cfg.customCss || ''

    // Page title
    document.title = cfg.brandName + ' — Website Builder'

    // Favicon (emoji favicon via SVG)
    let favicon = document.querySelector('link[rel="icon"]')
    if (!favicon) { favicon = document.createElement('link'); favicon.rel = 'icon'; document.head.appendChild(favicon) }
    const em = cfg.brandEmoji || '⚡'
    favicon.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${em}</text></svg>`
  }

  // ── Save from modal form ──────────────────────────────────────────────────
  function save() {
    const g = id => document.getElementById(id)?.value ?? ''
    const gb= id => document.getElementById(id)?.checked ?? true
    const cfg = {
      brandName:     g('wl-brand-name')     || DEFAULTS.brandName,
      brandEmoji:    g('wl-brand-emoji')    || DEFAULTS.brandEmoji,
      logoUrl:       g('wl-logo-url'),
      primaryColor:  g('wl-primary-color')  || DEFAULTS.primaryColor,
      accentColor:   g('wl-accent-color')   || DEFAULTS.accentColor,
      accentColor2:  g('wl-accent2-color')  || DEFAULTS.accentColor2,
      bgColor:       g('wl-bg-color')       || DEFAULTS.bgColor,
      poweredBy:     gb('wl-powered-toggle'),
      poweredByText: g('wl-powered-text')   || DEFAULTS.poweredByText,
      poweredByUrl:  g('wl-powered-url')    || DEFAULTS.poweredByUrl,
      supportEmail:  g('wl-support-email'),
      helpUrl:       g('wl-help-url'),
      customDomain:  g('wl-custom-domain'),
      customCss:     g('wl-custom-css-inp'),
    }
    _save(cfg)
    apply(cfg)
    toast(`Branding applied: ${cfg.brandName}`, '🏷️')
    if (_tab === 'prev') renderBody()
  }

  function reset() {
    if (!confirm('Reset all white-label settings to defaults?')) return
    localStorage.removeItem(KEY)
    apply(DEFAULTS)
    renderBody()
    toast('Branding reset to defaults', '🏷️')
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  function openUI()  { renderBody(); document.getElementById('wl-modal-bg').classList.remove('hidden') }
  function closeUI() { document.getElementById('wl-modal-bg').classList.add('hidden') }

  function switchTab(t) {
    _tab = t
    document.querySelectorAll('.wl-tab').forEach(el => el.classList.remove('active'))
    const tabEl = document.getElementById('wl-tab-' + t)
    if (tabEl) tabEl.classList.add('active')
    renderBody()
  }

  function renderBody() {
    const el = document.getElementById('wl-body'); if (!el) return
    const cfg = _load()
    if (_tab === 'brand')  el.innerHTML = _renderBrand(cfg)
    else if (_tab === 'domain') el.innerHTML = _renderDomain(cfg)
    else if (_tab === 'css')    el.innerHTML = _renderCss(cfg)
    else                        el.innerHTML = _renderPreview(cfg)
  }

  function _field(id, label, value, placeholder='') {
    return `<div class="wl-field">
      <label class="wl-label">${label}</label>
      <input class="wl-input" id="${id}" value="${value.replace(/"/g,'&quot;')}" placeholder="${placeholder}"/>
    </div>`
  }

  function _colorField(id, label, value) {
    return `<div class="wl-field">
      <label class="wl-label">${label}</label>
      <div class="wl-color-row">
        <input type="color" class="wl-swatch" value="${value}" oninput="document.getElementById('${id}').value=this.value"/>
        <input class="wl-input" id="${id}" value="${value}" oninput="this.previousElementSibling.value=this.value"/>
      </div>
    </div>`
  }

  function _toggle(id, label, sub, checked) {
    return `<div class="wl-toggle-row">
      <div><div class="wl-toggle-info">${label}</div><div class="wl-toggle-sub">${sub}</div></div>
      <label class="ff-toggle"><input type="checkbox" id="${id}" ${checked?'checked':''}/>
        <span class="ff-toggle-slider"></span></label>
    </div>`
  }

  function _renderBrand(cfg) {
    return `
      <div class="wl-group">
        <div class="wl-group-title">Brand Identity</div>
        <div class="wl-row">
          ${_field('wl-brand-name', 'Brand Name', cfg.brandName, 'MyBrand')}
          ${_field('wl-brand-emoji', 'Logo Emoji', cfg.brandEmoji, '⚡')}
        </div>
        ${_field('wl-logo-url', 'Logo Image URL (overrides emoji)', cfg.logoUrl, 'https://yoursite.com/logo.png')}
      </div>
      <div class="wl-group">
        <div class="wl-group-title">Color Scheme</div>
        <div class="wl-row">
          ${_colorField('wl-primary-color', 'Primary (--accent)', cfg.primaryColor)}
          ${_colorField('wl-accent2-color', 'Accent 2 (--accent2)', cfg.accentColor2)}
        </div>
        <div class="wl-row">
          ${_colorField('wl-accent-color',  'Accent 3 (--accent3)', cfg.accentColor)}
          ${_colorField('wl-bg-color',       'Auth BG', cfg.bgColor)}
        </div>
      </div>
      <div class="wl-group">
        <div class="wl-group-title">Attribution</div>
        ${_toggle('wl-powered-toggle', 'Show "Powered by" badge', 'Displayed in exported sites', cfg.poweredBy)}
        <div class="wl-row">
          ${_field('wl-powered-text', 'Badge text', cfg.poweredByText, 'Built with PageCraft')}
          ${_field('wl-powered-url',  'Badge URL',  cfg.poweredByUrl,  'https://pagecraft.dev')}
        </div>
      </div>
      <div class="wl-group">
        <div class="wl-group-title">Support</div>
        <div class="wl-row">
          ${_field('wl-support-email', 'Support Email', cfg.supportEmail, 'support@yourcompany.com')}
          ${_field('wl-help-url',      'Help URL',      cfg.helpUrl,      'https://yourcompany.com/help')}
        </div>
      </div>`
  }

  function _renderDomain(cfg) {
    const hasDomain = cfg.customDomain?.trim().length > 0
    return `
      <div class="wl-group">
        <div class="wl-group-title">Custom Domain</div>
        ${_field('wl-custom-domain', 'Your domain', cfg.customDomain, 'builder.yourcompany.com')}
        <div class="wl-domain-status">
          <div class="${hasDomain ? 'wl-dot-ok' : 'wl-dot-warn'}"></div>
          <span style="font-size:11px;color:var(--muted)">${hasDomain
            ? `Domain set: <strong>${cfg.customDomain}</strong>`
            : 'No custom domain — using localhost'}</span>
        </div>
      </div>
      <div class="wl-group">
        <div class="wl-group-title">DNS Setup Guide</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.7">
          <p style="margin:0 0 8px">Point your domain to this server by adding these DNS records:</p>
          <table style="width:100%;font-family:var(--mono,monospace);font-size:11px;border-collapse:collapse">
            <tr style="background:var(--surface);border-radius:6px">
              <td style="padding:6px 10px;color:var(--accent2);font-weight:700">A</td>
              <td style="padding:6px 10px">${hasDomain ? cfg.customDomain : 'builder.yourcompany.com'}</td>
              <td style="padding:6px 10px;color:var(--muted)">YOUR_SERVER_IP</td>
            </tr>
            <tr>
              <td style="padding:6px 10px;color:#34d399;font-weight:700">CNAME</td>
              <td style="padding:6px 10px">${hasDomain ? 'www.' + cfg.customDomain : 'www.builder.yourcompany.com'}</td>
              <td style="padding:6px 10px;color:var(--muted)">${hasDomain ? cfg.customDomain : 'builder.yourcompany.com'}</td>
            </tr>
          </table>
          <p style="margin:10px 0 0;font-size:11px">For SSL, use <strong>Let's Encrypt</strong> via Certbot or Caddy.</p>
        </div>
      </div>
      <div class="wl-group">
        <div class="wl-group-title">Nginx Config Snippet</div>
        <pre style="font-family:var(--mono,monospace);font-size:10px;color:var(--muted);background:var(--surface);padding:12px;border-radius:8px;overflow-x:auto;margin:0">server {
  listen 80;
  server_name ${hasDomain ? cfg.customDomain : 'builder.yourcompany.com'};
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}</pre>
      </div>`
  }

  function _renderCss(cfg) {
    return `
      <div class="wl-group">
        <div class="wl-group-title">Custom CSS — injected into the builder UI</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:6px">
          Override any builder style. Changes apply instantly after clicking <strong>Apply Branding</strong>.
        </div>
        <textarea class="wl-textarea" id="wl-custom-css-inp" rows="16"
          placeholder="/* Example: hide the PageCraft logo */&#10;.logo-mark { display: none }&#10;&#10;/* Change sidebar width */&#10;.sidebar { width: 280px }"
          style="min-height:240px;font-size:11px">${cfg.customCss || ''}</textarea>
      </div>
      <div class="wl-group">
        <div class="wl-group-title">Quick Snippets</div>
        ${[
          ['Hide logo text',     '.logo { gap: 0 } .logo::after { content: none }'],
          ['Wider sidebar',      '.sidebar { width: 300px }'],
          ['Rounded canvas',     '.canvas-frame { border-radius: 16px; overflow: hidden }'],
          ['Custom font',        '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap");\n:root { --font: "Inter", sans-serif }'],
        ].map(([name, css]) =>
          `<button class="bk-btn" style="margin-bottom:4px;text-align:left;width:100%"
            onclick="var t=document.getElementById('wl-custom-css-inp');t.value+=(t.value?'\\n\\n':'')+${JSON.stringify('/* ' + name + ' */\n' + css)}">
            + ${name}
          </button>`
        ).join('')}
      </div>`
  }

  function _renderPreview(cfg) {
    const _safeL = (u) => u && !u.includes('${') && !u.includes('`') && (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/')) ? u : ''
    const logoHtml = _safeL(cfg.logoUrl)
      ? `<img src="${_safeL(cfg.logoUrl)}" style="width:24px;height:24px;border-radius:5px;object-fit:cover"/>`
      : `<div class="wl-preview-logo" style="background:${cfg.primaryColor}">${cfg.brandEmoji}</div>`
    return `
      <div class="wl-preview">
        <div class="wl-preview-bar" style="background:var(--surface)">
          ${logoHtml}
          <span class="wl-preview-name" style="color:var(--text)">${cfg.brandName}</span>
          <span style="margin-left:auto;font-size:11px;color:var(--muted)">${cfg.customDomain || 'localhost:3000'}</span>
        </div>
        <div class="wl-preview-body" style="background:${cfg.bgColor};padding:32px">
          <div style="font-size:28px;margin-bottom:8px">${cfg.brandEmoji}</div>
          <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:6px">${cfg.brandName}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:16px">Website Builder Platform</div>
          <div class="wl-preview-btn" style="background:${cfg.primaryColor}">Get Started</div>
          ${cfg.poweredBy ? `<div style="margin-top:16px;font-size:10px;color:rgba(255,255,255,.3)">
            ${cfg.poweredByText}
          </div>` : ''}
        </div>
      </div>
      <div class="wl-group">
        <div class="wl-group-title">Active Config</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${[
            ['Brand', cfg.brandName],
            ['Primary', `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:${cfg.primaryColor};display:inline-block"></span>${cfg.primaryColor}</span>`],
            ['Domain', cfg.customDomain || 'Not set'],
            ['Powered by', cfg.poweredBy ? 'Shown' : 'Hidden'],
            ['Custom CSS', cfg.customCss ? `${cfg.customCss.split('\n').length} lines` : 'None'],
            ['Support', cfg.supportEmail || 'Not set'],
          ].map(([k,v]) => `
            <div style="padding:8px 10px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
              <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">${k}</div>
              <div style="font-size:12px;color:var(--text);font-weight:600;margin-top:2px">${v}</div>
            </div>`).join('')}
        </div>
      </div>`
  }

  // ── One-time migration: clear corrupted logoUrl values ───────────────────
  function _migrate() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.logoUrl && (parsed.logoUrl.includes('${') || parsed.logoUrl.includes('`'))) {
        parsed.logoUrl = ''
        localStorage.setItem(KEY, JSON.stringify(parsed))
        console.info('[WhiteLabel] Cleared corrupted logoUrl from storage.')
      }
    } catch {}
  }

  // ── Boot: apply saved branding on load ────────────────────────────────────
  function boot() {
    _migrate()
    const cfg = _load()
    if (cfg.brandName !== DEFAULTS.brandName || cfg.primaryColor !== DEFAULTS.primaryColor || cfg.customCss) {
      apply(cfg)
    }
  }

  return { openUI, closeUI, switchTab, renderBody, save, reset, apply, boot }
})()

window.PageCraft.whiteLabel = WhiteLabel

/* @include scripts/features/api-keys.js */

/* @include scripts/features/backup.js */

/* @include scripts/features/feature-flags.js */

/* @include scripts/features/onboarding.js */

/* @include scripts/features/ux-guide.js */

/* @include scripts/features/quick-tools.js */


/* @include scripts/features/design-intel.js */

/* @include scripts/features/perf-engine.js */

/* ══════════════════════════════════════════════════════
   STAGE 8 — ECOSYSTEM
   Templates Marketplace · Community Share · Developer API
══════════════════════════════════════════════════════ */
const TemplateMarket = (() => {
  const _KEY = 'pc_community_templates_v1'

  function _load() {
    try { return JSON.parse(localStorage.getItem(_KEY) || '[]') } catch { return [] }
  }
  function _save(arr) { localStorage.setItem(_KEY, JSON.stringify(arr)) }

  // ── Save current canvas as template ───────────────────────────────────────
  function saveCurrentAsTemplate() {
    if (!S.sections.length) { toast('Add sections first', '⚠️'); return }
    document.getElementById('stpl-name').value  = document.getElementById('page-title')?.value || ''
    document.getElementById('stpl-desc').value  = ''
    document.getElementById('stpl-thumb').value = '🌟'
    document.getElementById('save-tpl-modal').classList.remove('hidden')
  }

  function confirmSave() {
    const name  = document.getElementById('stpl-name').value.trim()
    const cat   = document.getElementById('stpl-cat').value
    const desc  = document.getElementById('stpl-desc').value.trim()
    const thumb = document.getElementById('stpl-thumb').value.trim() || '🌟'
    if (!name) { toast('Enter a template name', '⚠️'); return }

    const tpl = {
      id: 'community_' + Date.now(),
      name, category: cat, desc,
      thumb, thumbBg: 'linear-gradient(135deg,#6c63ff,#a78bfa)',
      industry: cat, community: true,
      createdAt: new Date().toISOString(),
      sections: JSON.parse(JSON.stringify(S.sections)),
    }
    const all = _load()
    all.unshift(tpl)
    _save(all)
    document.getElementById('save-tpl-modal').classList.add('hidden')
    toast(`"${name}" saved as template`, '💾')
    // Refresh sidebar immediately if Templates window is open
    if (!document.getElementById('tpl-modal').classList.contains('hidden')) buildTemplateList()
  }

  // ── Export template as JSON file ──────────────────────────────────────────
  function exportTemplate() {
    const name   = document.getElementById('stpl-name').value.trim() || 'my-template'
    const cat    = document.getElementById('stpl-cat').value
    const desc   = document.getElementById('stpl-desc').value.trim()
    const thumb  = document.getElementById('stpl-thumb').value.trim() || '🌟'
    const tpl    = {
      id: 'imported_' + Date.now(),
      name: name || 'My Template',
      category: cat, desc, thumb,
      thumbBg: 'linear-gradient(135deg,#6c63ff,#a78bfa)',
      industry: cat, community: true,
      exportedAt: new Date().toISOString(),
      sections: JSON.parse(JSON.stringify(S.sections)),
    }
    const blob = new Blob([JSON.stringify(tpl, null, 2)], { type: 'application/json' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = (name || 'template').replace(/\s+/g, '-').toLowerCase() + '.pagecraft-template.json'
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Template exported', '⬇')
  }

  // ── Import template from JSON file ────────────────────────────────────────
  function importTemplate(input) {
    const file = input.files[0]; if (!file) return
    input.value = ''
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const tpl = JSON.parse(ev.target.result)
        if (!tpl.sections || !Array.isArray(tpl.sections)) throw new Error('Invalid template file')
        tpl.id = 'imported_' + Date.now()
        tpl.community = true
        const all = _load()
        // Remove duplicate if same name exists
        const idx = all.findIndex(t => t.name === tpl.name)
        if (idx > -1) all.splice(idx, 1)
        all.unshift(tpl)
        _save(all)
        document.getElementById('save-tpl-modal').classList.add('hidden')
        // Refresh templates modal
        if (!document.getElementById('tpl-modal').classList.contains('hidden')) buildTemplateList()
        toast(`"${tpl.name}" imported`, '⬆')
      } catch(e) {
        toast('Invalid template file', '❌')
      }
    }
    reader.readAsText(file)
  }

  // ── Get community templates merged with built-in ──────────────────────────
  function getCommunityTemplates() { return _load() }

  // ── Delete a community template ───────────────────────────────────────────
  function deleteTemplate(id) {
    const all = _load().filter(t => t.id !== id)
    _save(all)
  }

  return { saveCurrentAsTemplate, confirmSave, exportTemplate, importTemplate, getCommunityTemplates, deleteTemplate }
})()
window.PageCraft.TemplateMarket = TemplateMarket

// Community templates are appended inside buildTemplateList() directly (see original function)

/* ══════════════════════════════════════════════════════
   STAGE 8b — DEVELOPER EXTENSION API
   PageCraft.extend() — public API for external devs
══════════════════════════════════════════════════════ */
;(function() {
  // ── PageCraft.extend(config) ──────────────────────────────────────────────
  // Lets external scripts add custom section types, themes, commands
  window.PageCraft.extend = function(config = {}) {
    if (!config || typeof config !== 'object') return console.warn('[PageCraft.extend] expects an object')

    // Register custom section type
    if (config.sections && Array.isArray(config.sections)) {
      config.sections.forEach(sec => {
        if (!sec.type || !sec.label || typeof sec.render !== 'function') {
          return console.warn('[PageCraft.extend] section must have type, label, render()')
        }
        // Add to DEFS
        DEFS[sec.type] = {
          label: sec.label,
          icon:  sec.icon  || '⬛',
          color: sec.color || '#6c63ff22',
          desc:  sec.desc  || '',
          props: sec.defaultProps || {},
          fields: sec.fields || [],
        }
        // Add to renderers
        R[sec.type] = sec.render
        // Add to block list
        if (sec.group) {
          // Find group or add to end
          const grp = BLOCK_GROUPS?.find?.(g => g.label === sec.group)
          if (grp) grp.types.push(sec.type)
        }
        // Re-render blocks panel
        renderBlocks()
        console.info(`[PageCraft.extend] ✅ Section "${sec.type}" registered`)
      })
    }

    // Register custom theme/palette
    if (config.themes && Array.isArray(config.themes)) {
      config.themes.forEach(theme => {
        if (!theme.id || !theme.name) return
        // Push to SmartDefaults palette pool if available
        if (typeof SmartDefaults !== 'undefined' && SmartDefaults._addPalette) {
          SmartDefaults._addPalette(theme)
        }
        console.info(`[PageCraft.extend] ✅ Theme "${theme.name}" registered`)
      })
    }

    // Register custom command (callable via PageCraft.run(id))
    if (config.commands && Array.isArray(config.commands)) {
      config.commands.forEach(cmd => {
        if (!cmd.id || typeof cmd.fn !== 'function') return
        window.PageCraft._commands = window.PageCraft._commands || new Map()
        window.PageCraft._commands.set(cmd.id, cmd.fn)
        console.info(`[PageCraft.extend] ✅ Command "${cmd.id}" registered`)
      })
    }

    // Register a hook listener
    if (config.hooks && typeof config.hooks === 'object') {
      Object.entries(config.hooks).forEach(([event, fn]) => {
        if (typeof fn === 'function') PluginSDK._emit_listen?.(event, fn)
      })
    }
  }

  // ── PageCraft.run(commandId, ...args) ─────────────────────────────────────
  window.PageCraft.run = function(id, ...args) {
    const fn = window.PageCraft._commands?.get?.(id)
    if (!fn) return console.warn('[PageCraft.run] unknown command:', id)
    try { return fn(...args) } catch(e) { console.error('[PageCraft.run] error in', id, e) }
  }

  // ── PageCraft.getSections() ───────────────────────────────────────────────
  window.PageCraft.getSections = () => JSON.parse(JSON.stringify(S.sections))

  // ── PageCraft.addSection(type, propsOverride) ─────────────────────────────
  window.PageCraft.addSection = (type, props = {}) => {
    if (!DEFS[type]) return console.warn('[PageCraft] unknown section type:', type)
    const sec = { id: uid(), type, props: { ...DEFS[type].props, ...props } }
    S.sections.push(sec); renderAll()
    return sec.id
  }

  // ── PageCraft.getScore() — current performance score ─────────────────────
  window.PageCraft.getScore = () => typeof PerfEngine !== 'undefined' ? PerfEngine.scan() : null

  // ── PageCraft.on(event, fn) — hook into builder events ───────────────────
  window.PageCraft.on = (event, fn) => PluginSDK._on?.(event, fn)

  console.info('[PageCraft] Developer API ready. Use window.PageCraft.extend({...}) to add custom sections.')
})()

/* ══════════════════════════════════════════════════════
   STAGE 9 — RELIABILITY
   Autosave (guests) · Crash Recovery · Stable State Engine
══════════════════════════════════════════════════════ */
const Reliability = (() => {
  const CRASH_KEY    = 'pc_crash_snapshot_v1'
  const GUEST_KEY    = 'pc_guest_autosave_v1'
  const HEALTH_KEY   = 'pc_last_clean_exit_v1'
  let _crashTimer    = null
  let _guestTimer    = null

  // ── 1. AUTOSAVE FOR GUESTS ───────────────────────────────────────────────
  // The existing doAutoSave() requires AUTH.user — we add a parallel guest save
  function scheduleGuestSave() {
    clearTimeout(_guestTimer)
    _guestTimer = setTimeout(_doGuestSave, 2000)
  }

  function _doGuestSave() {
    if (!S.sections.length) return
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify({
        sections:  JSON.parse(JSON.stringify(S.sections)),
        pageTitle: document.getElementById('page-title')?.value || 'My Page',
        savedAt:   new Date().toISOString(),
      }))
      // Update badge for guest users
      if (!AUTH?.user) {
        const badge = document.getElementById('autosave-badge')
        if (badge) { badge.textContent = 'Saved ✓'; badge.className = 'autosave-badge guest' }
      }
    } catch(e) {}
  }

  function restoreGuestSave() {
    try {
      const raw = localStorage.getItem(GUEST_KEY)
      if (!raw) return false
      const data = JSON.parse(raw)
      if (!data?.sections?.length) return false
      // Only offer restore if it was saved recently (< 24h)
      const age = Date.now() - new Date(data.savedAt).getTime()
      if (age > 86400000) return false
      return data
    } catch { return false }
  }

  // ── 2. CRASH RECOVERY ────────────────────────────────────────────────────
  // Emergency snapshot — written every 10s while user is active
  function _startCrashGuard() {
    _crashTimer = setInterval(() => {
      if (!S.sections.length) return
      try {
        localStorage.setItem(CRASH_KEY, JSON.stringify({
          sections:  JSON.parse(JSON.stringify(S.sections)),
          pageTitle: document.getElementById('page-title')?.value || '',
          ts:        Date.now(),
        }))
      } catch(e) {}
    }, 10000)

    // Mark clean exit on page unload
    window.addEventListener('pagehide', () => {
      localStorage.setItem(HEALTH_KEY, '1')
    })
    window.addEventListener('beforeunload', () => {
      localStorage.setItem(HEALTH_KEY, '1')
    })

    // Global error catcher — snapshot on uncaught error
    window.addEventListener('error', ev => {
      if (!S.sections.length) return
      try {
        localStorage.setItem(CRASH_KEY, JSON.stringify({
          sections:  JSON.parse(JSON.stringify(S.sections)),
          pageTitle: document.getElementById('page-title')?.value || '',
          ts:        Date.now(),
          error:     ev.message,
        }))
        localStorage.removeItem(HEALTH_KEY) // mark as dirty exit
      } catch(e) {}
    })

    window.addEventListener('unhandledrejection', () => {
      localStorage.removeItem(HEALTH_KEY) // mark dirty exit on promise rejection
    })
  }

  function _checkForCrash() {
    const cleanExit  = localStorage.getItem(HEALTH_KEY)
    const snapshot   = localStorage.getItem(CRASH_KEY)
    if (cleanExit || !snapshot) {
      // Clean exit — clear crash snapshot so it doesn't nag next time
      localStorage.removeItem(CRASH_KEY)
      return
    }
    // Dirty exit + snapshot exists → show banner
    try {
      const data = JSON.parse(snapshot)
      if (!data?.sections?.length) return
      const age = Date.now() - (data.ts || 0)
      if (age > 3600000) return // ignore if > 1 hour old
      const min  = Math.round(age / 60000)
      const msg  = document.getElementById('crash-banner-msg')
      if (msg) msg.textContent = `Unsaved work detected from ${min < 1 ? 'just now' : min + ' min ago'}. Restore your session?`
      document.getElementById('crash-banner')?.classList.add('show')
    } catch(e) {}
  }

  function restoreCrash() {
    try {
      const data = JSON.parse(localStorage.getItem(CRASH_KEY) || '{}')
      if (!data?.sections?.length) { dismissCrash(); return }
      pushH('Crash restore')
      S.sections = data.sections.map(s => ({ ...s, id: uid() }))
      S.selected = null
      if (data.pageTitle) {
        const t = document.getElementById('page-title')
        if (t) t.value = data.pageTitle
      }
      renderAll()
      toast('Session restored ✓', '↺')
      dismissCrash()
    } catch(e) { toast('Could not restore session', '❌'); dismissCrash() }
  }

  function dismissCrash() {
    document.getElementById('crash-banner')?.classList.remove('show')
    localStorage.removeItem(CRASH_KEY)
    localStorage.setItem(HEALTH_KEY, '1')
  }

  // ── 3. STABLE STATE ENGINE ───────────────────────────────────────────────
  // Validates sections before they're rendered — strips broken/unknown types
  function sanitizeSections(sections) {
    if (!Array.isArray(sections)) return []
    return sections.filter(s => {
      if (!s || typeof s !== 'object') return false
      if (!s.type || !DEFS[s.type])   return false   // unknown type → drop
      if (!s.id)                        return false   // missing id → drop
      if (typeof s.props !== 'object')  s.props = {}  // missing props → empty obj
      return true
    })
  }

  // Sanitize via editorStore middleware (runs after each setState)
  function _installStateGuard() {
    editorStore.use(({ next }) => {
      if (!Array.isArray(next.sections)) return
      const clean = sanitizeSections(next.sections)
      // Silently correct corrupted sections in-place
      if (clean.length !== next.sections.length) {
        next.sections = clean
        console.warn('[Reliability] Dropped', next.sections.length - clean.length, 'invalid section(s)')
      }
    })
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    _startCrashGuard()
    _checkForCrash()
    _installStateGuard()

    // Restore guest draft on first load if canvas is empty
    setTimeout(() => {
      if (S.sections.length === 0 && !AUTH?.user) {
        const draft = restoreGuestSave()
        if (draft) {
          const ok = confirm(
            `Restore your last session?\n"${draft.pageTitle}" — ${draft.sections.length} sections\nSaved: ${new Date(draft.savedAt).toLocaleTimeString()}`
          )
          if (ok) {
            S.sections = draft.sections
            const t = document.getElementById('page-title')
            if (t && draft.pageTitle) t.value = draft.pageTitle
            renderAll()
            toast('Draft restored ✓', '↺')
          }
        }
      }
    }, 800)
  }

  return { init, restoreCrash, dismissCrash, sanitizeSections, scheduleGuestSave }
})()
window.PageCraft.Reliability = Reliability

// Guest save is triggered inside scheduleAutoSave() directly (see original function)

/* @include scripts/features/dev-mode.js */

/* @include scripts/features/viral.js */

/* @include scripts/features/site-tools.js */