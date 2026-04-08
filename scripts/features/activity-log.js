/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   ACTIVITY LOG SYSTEM
   Tracks every user action with category, actor, meta.
   Full-page history viewer: filter, search, export CSV.
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

const ActivityLog = (() => {
  const KEY = 'pc_activity_log_v1'
  const MAX = 500

  // ── Category metadata ─────────────────────────────────────────────────────
  const CATS = {
    project:  { icon:'📁', label:'Project',  cls:'al-cat-project'  },
    section:  { icon:'📄', label:'Section',  cls:'al-cat-section'  },
    auth:     { icon:'🔑', label:'Auth',     cls:'al-cat-auth'     },
    billing:  { icon:'💳', label:'Billing',  cls:'al-cat-billing'  },
    collab:   { icon:'👥', label:'Collab',   cls:'al-cat-collab'   },
    settings: { icon:'⚙️', label:'Settings', cls:'al-cat-settings' },
    export:   { icon:'⬇',  label:'Export',   cls:'al-cat-export'   },
    plugin:   { icon:'🧩', label:'Plugin',   cls:'al-cat-plugin'   },
  }

  // ── Action → category map ─────────────────────────────────────────────────
  const ACTION_CAT = {
    project_saved:      'project', project_loaded:     'project',
    project_created:    'project', project_deleted:    'project',
    project_renamed:    'project', project_shared:     'project',
    section_added:      'section', section_removed:    'section',
    section_moved:      'section', section_duplicated: 'section',
    layout_applied:     'section', template_applied:   'section',
    login:              'auth',    logout:             'auth',
    signup:             'auth',
    plan_upgraded:      'billing', plan_cancelled:     'billing',
    payment_processed:  'billing',
    collab_started:     'collab',  collab_ended:       'collab',
    member_invited:     'collab',  member_removed:     'collab',
    workspace_created:  'settings',workspace_updated:  'settings',
    settings_changed:   'settings',
    export_html:        'export',  export_json:        'export',
    export_react:       'export',  deployed:           'export',
    plugin_enabled:     'plugin',  plugin_disabled:    'plugin',
  }

  // ── Storage ───────────────────────────────────────────────────────────────
  function _key() { return KEY + '_' + (AUTH?.user?.id || 'guest') }
  function load()  { try { return JSON.parse(localStorage.getItem(_key()) || '[]') } catch { return [] } }
  function _save(list) { localStorage.setItem(_key(), JSON.stringify(list.slice(0, MAX))) }

  // ── Core: record an action ────────────────────────────────────────────────
  function record(action, meta = {}) {
    const cat = ACTION_CAT[action] || 'settings'
    const entry = {
      id:     'al_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      action,
      cat,
      actor:  AUTH?.user?.name  || 'You',
      meta,
      ts:     new Date().toISOString(),
    }
    const list = load()
    list.unshift(entry)
    _save(list)
    return entry
  }

  // ── Query helpers ─────────────────────────────────────────────────────────
  function filter({ cat, search, since, until } = {}) {
    let list = load()
    if (cat && cat !== 'all')   list = list.filter(e => e.cat === cat)
    if (since)                  list = list.filter(e => e.ts >= since)
    if (until)                  list = list.filter(e => e.ts <= until)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.action.includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        JSON.stringify(e.meta).toLowerCase().includes(q)
      )
    }
    return list
  }

  function stats() {
    const list = load()
    const today = new Date().toDateString()
    return {
      total:   list.length,
      today:   list.filter(e => new Date(e.ts).toDateString() === today).length,
      byCat:   Object.fromEntries(
        Object.keys(CATS).map(c => [c, list.filter(e => e.cat === c).length])
      ),
    }
  }

  function exportCSV() {
    const list = load()
    if (!list.length) { toast('No activity to export', '⚠️'); return }
    const header = 'Timestamp,Action,Category,Actor,Meta'
    const rows   = list.map(e =>
      [new Date(e.ts).toISOString(), e.action, e.cat, e.actor,
       `"${JSON.stringify(e.meta).replace(/"/g,"'")}"`].join(',')
    )
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'pagecraft-activity.csv'; a.click()
    URL.revokeObjectURL(url); toast('Activity log exported', '⬇')
  }

  function clear() { localStorage.removeItem(_key()) }

  return { record, filter, stats, exportCSV, clear, load, CATS, ACTION_CAT }
})()

// ── Wire ActivityLog into all key builder events ──────────────────────────────
;(function() {

  // Auth
  const _prevGrant4 = window.authGrantAccess
  if (typeof _prevGrant4 === 'function') {
    window.authGrantAccess = function(...a) {
      const r = _prevGrant4(...a)
      ActivityLog.record('login', { name: AUTH?.user?.name, plan: AUTH?.user?.plan })
      return r
    }
  }

  // Project save
  const _prevSave2 = window.saveProject
  if (typeof _prevSave2 === 'function') {
    window.saveProject = function(...a) {
      const r = _prevSave2(...a)
      ActivityLog.record('project_saved', { title: S?.pageTitle, sections: S?.sections?.length })
      return r
    }
  }

  // Section add/remove
  const _prevAdd2 = window.addSection
  if (typeof _prevAdd2 === 'function') {
    window.addSection = function(type, ...a) {
      const r = _prevAdd2(type, ...a)
      ActivityLog.record('section_added', { type })
      return r
    }
  }

  const _prevRemove = window.removeSection
  if (typeof _prevRemove === 'function') {
    window.removeSection = function(id, ...a) {
      const sec = S?.sections?.find(s => s.id === id)
      const r   = _prevRemove(id, ...a)
      ActivityLog.record('section_removed', { type: sec?.type, id })
      return r
    }
  }

  // Template applied
  const _prevApplyTpl = window.applyTemplate
  if (typeof _prevApplyTpl === 'function') {
    window.applyTemplate = function(tpl, ...a) {
      const r = _prevApplyTpl(tpl, ...a)
      ActivityLog.record('template_applied', { name: tpl?.name || tpl })
      return r
    }
  }

  // Layout applied
  const _prevApplyLayout = window.applyLayout
  if (typeof _prevApplyLayout === 'function') {
    window.applyLayout = function(id, ...a) {
      const r = _prevApplyLayout(id, ...a)
      ActivityLog.record('layout_applied', { layout: id })
      return r
    }
  }

  // Export — deferred so _whDoExport is defined by the time we wrap it
  window.addEventListener('load', () => {
    const _prevDoExport = window._whDoExport || window.doExport
    if (typeof _prevDoExport === 'function') {
      const key = window._whDoExport ? '_whDoExport' : 'doExport'
      window[key] = function(...a) {
        const r = _prevDoExport(...a)
        ActivityLog.record('export_html', { sections: S?.sections?.length, title: S?.pageTitle })
        return r
      }
    }
  })

  // Billing plan upgrade
  const _prevProcess2 = window.processPayment
  if (typeof _prevProcess2 === 'function') {
    window.processPayment = async function(...a) {
      const r = await _prevProcess2(...a)
      const plan = typeof currentPlan === 'function' ? currentPlan() : ''
      if (plan && plan !== 'free')
        ActivityLog.record('plan_upgraded', { plan })
      return r
    }
  }

  // Collab wiring deferred — Collab is declared later in the file
  window.addEventListener('load', () => {
    if (typeof Collab !== 'undefined' && typeof Collab.join === 'function') {
      const _origJoin = Collab.join
      Collab.join = function(...a) {
        ActivityLog.record('collab_started', { room: a[0] })
        return _origJoin(...a)
      }
    }
  })

})()

// ── Activity Log Modal ────────────────────────────────────────────────────────
let _alFilter = 'all', _alSearch = ''

function openActivityLog() {
  if (!AUTH.user) { showAuthGate(); return }
  let modal = document.getElementById('al-modal-bg')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'al-modal-bg'
    modal.className = 'modal-bg hidden'
    modal.style.cssText = 'z-index:5400'
    modal.innerHTML = `
      <div class="modal al-modal">
        <div style="padding:14px 18px 0;border-bottom:1px solid var(--border);flex-shrink:0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--text)">📋 Activity Logs</div>
              <div style="font-size:11px;color:var(--muted)" id="al-subtitle"></div>
            </div>
            <button class="modal-x" onclick="closeActivityLog()">✕</button>
          </div>
          <div class="al-toolbar" id="al-toolbar">
            <input class="al-search" id="al-search-inp" placeholder="Search actions…"
              oninput="_alSetSearch(this.value)"/>
            <button class="al-filter-btn active" data-cat="all"     onclick="_alSetCat('all',this)">All</button>
            <button class="al-filter-btn"         data-cat="project" onclick="_alSetCat('project',this)">📁</button>
            <button class="al-filter-btn"         data-cat="section" onclick="_alSetCat('section',this)">📄</button>
            <button class="al-filter-btn"         data-cat="auth"    onclick="_alSetCat('auth',this)">🔑</button>
            <button class="al-filter-btn"         data-cat="billing" onclick="_alSetCat('billing',this)">💳</button>
            <button class="al-filter-btn"         data-cat="export"  onclick="_alSetCat('export',this)">⬇</button>
            <button class="al-filter-btn"         data-cat="collab"  onclick="_alSetCat('collab',this)">👥</button>
          </div>
        </div>
        <div class="al-body" id="al-body"></div>
        <div class="al-footer">
          <span id="al-count-label"></span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost" style="font-size:11px" onclick="ActivityLog.exportCSV()">⬇ Export CSV</button>
            <button class="btn btn-ghost" style="font-size:11px;color:var(--muted)" onclick="if(confirm('Clear all activity logs?')){ActivityLog.clear();_alRender()}">🗑 Clear</button>
          </div>
        </div>
      </div>`
    modal.addEventListener('click', e => { if (e.target === modal) closeActivityLog() })
    document.body.appendChild(modal)
  }
  _alFilter = 'all'; _alSearch = ''
  document.querySelectorAll('#al-toolbar .al-filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === 'all'))
  _alRender()
  modal.classList.remove('hidden')
}
function closeActivityLog() { document.getElementById('al-modal-bg')?.classList.add('hidden') }

function _alSetCat(cat, btn) {
  _alFilter = cat
  document.querySelectorAll('#al-toolbar .al-filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === cat))
  _alRender()
}
function _alSetSearch(val) { _alSearch = val; _alRender() }

function _alRender() {
  const body = document.getElementById('al-body'); if (!body) return
  const st   = ActivityLog.stats()
  const sub  = document.getElementById('al-subtitle')
  if (sub) sub.textContent = `${st.total} actions · ${st.today} today`

  const entries = ActivityLog.filter({ cat: _alFilter !== 'all' ? _alFilter : undefined, search: _alSearch || undefined })
  const lbl = document.getElementById('al-count-label')
  if (lbl) lbl.textContent = `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`

  if (!entries.length) {
    body.innerHTML = `<div class="al-empty">
      <div style="font-size:36px;opacity:.2;margin-bottom:10px">📋</div>
      <div style="font-size:13px;font-weight:600;color:var(--text2)">No activity found</div>
      <div style="font-size:12px;margin-top:4px">${_alSearch ? 'Try a different search term' : 'Actions you perform will appear here'}</div>
    </div>`
    return
  }

  // Group by day
  const groups = {}
  entries.forEach(e => {
    const day = new Date(e.ts).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })
    ;(groups[day] = groups[day] || []).push(e)
  })

  body.innerHTML = Object.entries(groups).map(([day, items]) => {
    const rows = items.map(e => {
      const cat  = ActivityLog.CATS[e.cat] || ActivityLog.CATS.settings
      const meta = _alFormatMeta(e.action, e.meta)
      const time = new Date(e.ts).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
      return `<div class="al-entry">
        <div class="al-entry-icon" style="background:rgba(108,99,255,.1)">${cat.icon}</div>
        <div class="al-entry-info">
          <div class="al-entry-action">
            ${e.action.replace(/_/g,' ')}
            <span class="al-entry-tag ${cat.cls}">${cat.label}</span>
          </div>
          <div class="al-entry-meta">${e.actor}${meta ? ' · ' + meta : ''}</div>
        </div>
        <div class="al-entry-time">${time}</div>
      </div>`
    }).join('')
    return `<div class="al-day-group"><div class="al-day-label">${day}</div>${rows}</div>`
  }).join('')
}

function _alFormatMeta(action, meta) {
  if (!meta || !Object.keys(meta).length) return ''
  if (meta.title)   return `"${meta.title}"`
  if (meta.type)    return meta.type
  if (meta.name)    return meta.name
  if (meta.plan)    return meta.plan
  if (meta.email)   return meta.email
  if (meta.layout)  return meta.layout
  if (meta.room)    return `room: ${meta.room}`
  return ''
}

window.PageCraft = window.PageCraft || {}
window.PageCraft.ActivityLog = ActivityLog
