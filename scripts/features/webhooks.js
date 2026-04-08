/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   WEBHOOK ENGINE — Outgoing Webhooks
   ──────────────────────────────────────────────────
   Fires HTTP POST requests to user-registered URLs
   when builder events occur.

   Events:
     project:saved      — auto-save or manual save
     project:exported   — HTML/JSON/React export
     section:added      — section added to canvas
     section:removed    — section removed
     auth:login         — user signed in
     auth:logout        — user signed out

   Storage: localStorage (pc_webhooks_v1)
   Delivery log: last 50 attempts (pc_wh_log_v1)
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

const WebhookEngine = (() => {
  const WH_KEY  = 'pc_webhooks_v1'
  const LOG_KEY = 'pc_wh_log_v1'
  const MAX_LOG = 50

  // ── All supported outgoing events ──────────────────
  const EVENTS = [
    { id:'project:saved',    label:'Project Saved',    icon:'💾', desc:'Fires on auto-save or manual save' },
    { id:'project:exported', label:'Project Exported', icon:'📦', desc:'Fires on HTML/JSON/React export' },
    { id:'section:added',    label:'Section Added',    icon:'➕', desc:'Fires when a section is added' },
    { id:'section:removed',  label:'Section Removed',  icon:'🗑', desc:'Fires when a section is deleted' },
    { id:'auth:login',       label:'User Login',       icon:'🔑', desc:'Fires when a user signs in' },
    { id:'auth:logout',      label:'User Logout',      icon:'🚪', desc:'Fires when a user signs out' },
  ]

  // ── Storage helpers ─────────────────────────────────
  function _load()    { try { return JSON.parse(localStorage.getItem(WH_KEY)  || '[]') } catch { return [] } }
  function _save(arr) { try { localStorage.setItem(WH_KEY, JSON.stringify(arr)) } catch {} }
  function _logLoad() { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]') } catch { return [] } }
  function _logSave(arr) { try { localStorage.setItem(LOG_KEY, JSON.stringify(arr.slice(0, MAX_LOG))) } catch {} }

  // ── Add delivery to log ─────────────────────────────
  function _logEntry(webhookId, event, url, status, ms, error) {
    const log = _logLoad()
    log.unshift({ id: 'whl_' + Date.now(), webhookId, event, url, status, ms, error: error || null, ts: new Date().toISOString() })
    _logSave(log)
  }

  // ── Fire a single webhook ───────────────────────────
  async function _fire(webhook, event, payload) {
    // Validate webhook URL — must be https and not a known non-API domain
    const _wUrl = (webhook.url || '').trim()
    if (!_wUrl.startsWith('https://') && !_wUrl.startsWith('http://localhost')) {
      return { ok: false, status: 0, ms: 0, error: 'Invalid webhook URL' }
    }
    const _blocked = ['youtube.com','youtu.be','vimeo.com','twitter.com','facebook.com','instagram.com','tiktok.com']
    if (_blocked.some(d => _wUrl.includes(d))) {
      return { ok: false, status: 0, ms: 0, error: 'Webhook URL points to a non-API domain' }
    }
    const t0  = Date.now()
    const body = JSON.stringify({
      event,
      payload,
      sentAt:    new Date().toISOString(),
      projectId: AUTH.user?.id || 'anonymous',
      pageTitle: projectStore.getState().pageTitle,
    })

    try {
      const res = await fetch(webhook.url, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PageCraft-Event':  event,
          'X-PageCraft-Secret': webhook.secret || '',
        },
        body,
        signal: AbortSignal.timeout(8000),
      })
      const ms = Date.now() - t0
      _logEntry(webhook.id, event, webhook.url, res.status, ms, null)
      return { ok: res.ok, status: res.status, ms }
    } catch(err) {
      const ms = Date.now() - t0
      _logEntry(webhook.id, event, webhook.url, 0, ms, err.message)
      return { ok: false, status: 0, ms, error: err.message }
    }
  }

  // ── Dispatch event to all matching webhooks ─────────
  function dispatch(event, payload = {}) {
    const hooks = _load().filter(wh => wh.enabled && wh.events.includes(event))
    if (!hooks.length) return
    hooks.forEach(wh => _fire(wh, event, payload))
  }

  // ── CRUD ────────────────────────────────────────────
  function add(url, events, secret = '', label = '') {
    if (!url.startsWith('http')) return null
    const wh = { id: 'wh_' + Date.now(), url, events, secret, label, enabled: true, createdAt: new Date().toISOString() }
    const arr = _load()
    arr.push(wh)
    _save(arr)
    return wh
  }

  function remove(id) { _save(_load().filter(wh => wh.id !== id)) }

  function toggle(id) {
    const arr = _load()
    const wh  = arr.find(w => w.id === id)
    if (wh) { wh.enabled = !wh.enabled; _save(arr) }
  }

  function update(id, patch) {
    const arr = _load()
    const idx = arr.findIndex(w => w.id === id)
    if (idx !== -1) { arr[idx] = { ...arr[idx], ...patch }; _save(arr) }
  }

  // ── Test delivery ────────────────────────────────────
  async function test(id) {
    const wh = _load().find(w => w.id === id)
    if (!wh) return
    toast('Sending test ping…', '📡')
    const res = await _fire(wh, 'webhook:test', { message: 'Test ping from PageCraft', ts: Date.now() })
    if (res.ok) toast(`Delivered ✓ — ${res.status} in ${res.ms}ms`, '✅')
    else        toast(`Failed — ${res.error || res.status}`, '❌')
    if (document.getElementById('wh-log-area')) renderWhLog()
  }

  return { dispatch, add, remove, toggle, update, test, EVENTS, _load, _logLoad }
})()

// ── Wire dispatch into builder events ────────────────────────────────────────

// project:saved (fires on autosave)
editorStore.subscribe((next, prev) => {
  if (!prev.isDirty && next.isDirty === false && next.lastSaved !== prev.lastSaved) {
    WebhookEngine.dispatch('project:saved', {
      sections: next.sections.length,
      pageTitle: next.pageTitle,
    })
  }
})

// project:exported (patched into doExport after it's defined)
// section:added / removed are wired via PluginSDK hooks below
PluginSDK._emit   // guard reference
;(() => {
  // section events
  const _origAddSec = addSection
  // We wire via PluginSDK hooks (already emitted in addSection/removeSection)
  if (typeof PluginSDK !== 'undefined') {
    PluginSDK.registerPlugin({
      id: 'webhook-bridge', name: 'Webhook Bridge', version: '1.0.0',
      init(sdk) {
        sdk.on('section:afterAdd', ({ section }) => {
          WebhookEngine.dispatch('section:added', { type: section.type, id: section.id })
        })
        sdk.on('section:afterRemove', ({ id }) => {
          WebhookEngine.dispatch('section:removed', { id })
        })
        sdk.on('auth:login', ({ user }) => {
          WebhookEngine.dispatch('auth:login', { userId: user?.id, name: user?.name })
        })
      },
    })
  }
})()

// ── Webhooks UI ───────────────────────────────────────────────────────────────
function renderIntWebhooks(area) {
  const hooks = WebhookEngine._load()
  area.innerHTML = `
  <div>
    <div class="int-section-head">
      <div>
        <div class="int-section-title">📡 Outgoing Webhooks</div>
        <div class="int-section-sub">POST to external URLs when builder events fire</div>
      </div>
      <button class="int-new-btn" onclick="whOpenAdd()">+ Add Webhook</button>
    </div>

    <!-- Add form (hidden by default) -->
    <div id="wh-add-form" style="display:none;padding:0 20px 16px">
      <div style="background:var(--surface);border:1px solid var(--border2);border-radius:12px;padding:16px">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:12px">New Webhook</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div>
            <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Label (optional)</label>
            <input id="wh-f-label" class="ds-input" placeholder="e.g. Notify Slack" style="width:100%"/>
          </div>
          <div>
            <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">URL *</label>
            <input id="wh-f-url" class="ds-input" placeholder="https://example.com/webhook" style="width:100%"/>
          </div>
          <div>
            <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Secret (sent as X-PageCraft-Secret header)</label>
            <input id="wh-f-secret" class="ds-input" placeholder="optional secret token" style="width:100%"/>
          </div>
          <div>
            <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:8px">Events to trigger</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
              ${WebhookEngine.EVENTS.map(ev => `
                <label style="display:flex;align-items:center;gap:7px;font-size:12px;cursor:pointer;
                  background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:7px 10px;">
                  <input type="checkbox" data-ev="${ev.id}" checked style="accent-color:var(--accent)"/>
                  ${ev.icon} ${ev.label}
                </label>`).join('')}
            </div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
            <button class="btn btn-ghost" onclick="whCloseAdd()">Cancel</button>
            <button class="btn btn-primary" onclick="whSaveAdd()">Save Webhook</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Registered webhooks list -->
    <div style="padding:0 20px">
      ${!hooks.length ? `
        <div style="text-align:center;padding:48px 20px;color:var(--muted)">
          <div style="font-size:36px;opacity:.3;margin-bottom:12px">📡</div>
          <div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:6px">No webhooks yet</div>
          <div style="font-size:12px">Add a webhook to get notified when project events fire</div>
        </div>` :
        hooks.map(wh => `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:11px;
          padding:14px 16px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;
                background:${wh.enabled ? 'rgba(52,211,153,.12)' : 'rgba(255,255,255,.06)'};
                color:${wh.enabled ? 'var(--success)' : 'var(--muted)'};border:1px solid ${wh.enabled ? 'rgba(52,211,153,.25)' : 'var(--border)'};
                white-space:nowrap">${wh.enabled ? '● Active' : '○ Paused'}</span>
              <span style="font-size:12px;font-weight:600;color:var(--text)">${e(wh.label || 'Webhook')}</span>
            </div>
            <div style="font-size:11px;color:var(--muted);font-family:var(--font-mono);margin-bottom:6px;
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e(wh.url)}</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap">
              ${wh.events.map(ev => {
                const def = WebhookEngine.EVENTS.find(x => x.id === ev)
                return `<span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:10px;
                  background:var(--surface2);border:1px solid var(--border);color:var(--text2)">
                  ${def?.icon || ''} ${ev}</span>`
              }).join('')}
            </div>
          </div>
          <div style="display:flex;gap:5px;flex-shrink:0">
            <button class="btn btn-ghost" style="font-size:11px;padding:4px 9px"
              onclick="WebhookEngine.test('${wh.id}');renderIntView()">Test</button>
            <button class="btn btn-ghost" style="font-size:11px;padding:4px 9px"
              onclick="WebhookEngine.toggle('${wh.id}');renderIntView()">${wh.enabled ? 'Pause' : 'Enable'}</button>
            <button class="btn btn-ghost" style="font-size:11px;padding:4px 9px;color:var(--danger)"
              onclick="if(confirm('Delete this webhook?')){WebhookEngine.remove('${wh.id}');renderIntView()}">✕</button>
          </div>
        </div>`).join('')}
    </div>

    <!-- Delivery log -->
    <div style="padding:0 20px 20px">
      <div style="font-size:12px;font-weight:700;color:var(--text2);margin:16px 0 8px;
        display:flex;align-items:center;justify-content:space-between">
        Recent Deliveries
        <button class="btn btn-ghost" style="font-size:11px" onclick="localStorage.removeItem('pc_wh_log_v1');renderIntView()">Clear</button>
      </div>
      <div id="wh-log-area"></div>
    </div>
  </div>`

  renderWhLog()
}

function renderWhLog() {
  const area = document.getElementById('wh-log-area')
  if (!area) return
  const log = WebhookEngine._logLoad()
  if (!log.length) {
    area.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:12px;text-align:center">No deliveries yet</div>`
    return
  }
  area.innerHTML = log.slice(0, 20).map(l => `
    <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;
      background:var(--surface);border:1px solid var(--border);border-radius:8px;
      margin-bottom:5px;font-size:11px">
      <span style="font-weight:700;padding:1px 7px;border-radius:8px;flex-shrink:0;
        background:${l.status >= 200 && l.status < 300 ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)'};
        color:${l.status >= 200 && l.status < 300 ? 'var(--success)' : l.status === 0 ? 'var(--muted)' : 'var(--danger)'};
        border:1px solid ${l.status >= 200 && l.status < 300 ? 'rgba(52,211,153,.25)' : 'rgba(248,113,113,.2)'}">
        ${l.status || 'ERR'}</span>
      <span style="color:var(--accent);font-family:var(--font-mono);flex-shrink:0">${l.event}</span>
      <span style="color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${e(l.url)}</span>
      <span style="color:var(--muted);flex-shrink:0">${l.ms}ms</span>
      <span style="color:var(--muted);flex-shrink:0">${new Date(l.ts).toLocaleTimeString()}</span>
    </div>`).join('')
}

function whOpenAdd()  { document.getElementById('wh-add-form').style.display = 'block' }
function whCloseAdd() { document.getElementById('wh-add-form').style.display = 'none' }
function whSaveAdd() {
  const url    = document.getElementById('wh-f-url')?.value.trim()
  const label  = document.getElementById('wh-f-label')?.value.trim()
  const secret = document.getElementById('wh-f-secret')?.value.trim()
  if (!url || !url.startsWith('http')) { toast('Enter a valid URL','⚠️'); return }
  const events = [...document.querySelectorAll('#wh-add-form [data-ev]:checked')].map(el => el.dataset.ev)
  if (!events.length) { toast('Select at least one event','⚠️'); return }
  WebhookEngine.add(url, events, secret, label)
  toast('Webhook saved ✓', '📡')
  whCloseAdd()
  renderIntView()
}

// Wire project:exported into doExport (patch after definition)
const _origDoExport = typeof doExport === 'function' ? doExport : null
if (_origDoExport) {
  window._whDoExport = function() {
    _origDoExport()
    WebhookEngine.dispatch('project:exported', {
      format: typeof EXP !== 'undefined' ? EXP.fmt : 'html',
      sections: S.sections.length,
      pageTitle: S.pageTitle,
    })
  }
}

// ── Logs ──────────────────────────────────────────────────────────────────────
function intAddLog(entry) { const l = intLoadLogs(); l.unshift({...entry, timestamp:new Date().toISOString()}); intSaveLogs(l) }

function renderIntLogs(area) {
  const logs = intLoadLogs()
  area.innerHTML = `<div>
    <div class="int-section-head">
      <div><div class="int-section-title">📋 Request Logs (${logs.length})</div>
      <div class="int-section-sub">Last 200 API requests from PageCraft</div></div>
      <div style="display:flex;gap:6px">
        <button class="int-new-btn secondary" onclick="intExportLogs()">⬇ Export CSV</button>
        <button class="int-new-btn secondary" style="color:var(--danger);border-color:rgba(248,113,113,.3)" onclick="intClearLogs()">Clear</button>
      </div>
    </div>
    <div style="padding:0 20px 20px">
      ${!logs.length ? `<div style="text-align:center;padding:48px;color:var(--muted)"><div style="font-size:36px;opacity:.25;margin-bottom:12px">📋</div><div style="font-size:13px;font-weight:600;color:var(--text2)">No requests yet</div></div>` :
        logs.map(l=>`<div class="int-log-entry">
          <span class="int-log-method ${l.method}">${l.method}</span>
          <span class="int-log-url">${e(l.url)}</span>
          <span class="int-log-status ${l.status>=200&&l.status<300?'ok':'err'}">${l.status}</span>
          <span class="int-log-time">${l.ms}ms</span>
          <span class="int-log-time">${new Date(l.timestamp).toLocaleTimeString()}</span>
        </div>`).join('')}
    </div>
  </div>`
}

function intExportLogs() {
  const logs = intLoadLogs(); if (!logs.length) { toast('No logs','⚠️'); return }
  const csv = 'Timestamp,Method,URL,Status,Duration(ms)\n' + logs.map(l=>[new Date(l.timestamp).toISOString(),l.method,`"${l.url}"`,l.status,l.ms].join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv'}), url = URL.createObjectURL(blob), a = document.createElement('a')
  a.href=url; a.download='api-request-logs.csv'; a.click(); URL.revokeObjectURL(url); toast('Exported','⬇')
}

function intClearLogs() {
  if (!confirm('Clear all request logs?')) return
  intSaveLogs([]); renderIntView(); toast('Logs cleared','🗑')
}
