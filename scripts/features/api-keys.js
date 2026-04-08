/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   PUBLIC API — API KEYS SYSTEM
   • Generate API keys with name + permissions + expiry
   • Permissions: read | write | admin
   • Usage tracking: request count + last used
   • Revoke / delete keys
   • Docs tab: full endpoint reference
   • Storage: localStorage pc_api_keys_v1
   • Server: /api/v1/* routes in server.js (X-API-Key)
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */
const ApiKeys = (() => {
  const KEY = 'pc_api_keys_v1'
  let _tab = 'keys'

  // ── Storage ──────────────────────────────────────────────────────────────
  function _load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
  function _save(a){ try { localStorage.setItem(KEY, JSON.stringify(a)) } catch {} }

  // ── Key generation ────────────────────────────────────────────────────────
  function _genKey() {
    const arr = new Uint8Array(32)
    crypto.getRandomValues(arr)
    return 'pc_' + Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('')
  }

  // ── Create key ─────────────────────────────────────────────────────────────
  function createKey(name, permission, expireDays) {
    name = (name || '').trim()
    if (!name) return toast('Key name is required','⚠️')
    const keys = _load()
    if (keys.length >= 20) return toast('Max 20 API keys','⚠️')
    const expiry = expireDays > 0
      ? new Date(Date.now() + expireDays * 86400000).toISOString()
      : null
    const k = {
      id:         'kid_' + Date.now(),
      key:        _genKey(),
      name,
      permission, // 'read' | 'write' | 'admin'
      created:    new Date().toISOString(),
      lastUsed:   null,
      requests:   0,
      expiry,
      revoked:    false,
    }
    keys.unshift(k)
    _save(keys)
    toast(`API key created: ${name}`, '🔑')
    renderBody()
    return k
  }

  // ── Revoke key ─────────────────────────────────────────────────────────────
  function revokeKey(id) {
    const keys = _load()
    const k = keys.find(k => k.id === id)
    if (!k) return
    k.revoked = true
    _save(keys); renderBody()
    toast('Key revoked','🚫')
  }

  // ── Delete key ─────────────────────────────────────────────────────────────
  function deleteKey(id) {
    if (!confirm('Delete this API key? It will stop working immediately.')) return
    _save(_load().filter(k => k.id !== id)); renderBody()
    toast('Key deleted','🗑')
  }

  // ── Copy key ──────────────────────────────────────────────────────────────
  function copyKey(key) {
    navigator.clipboard.writeText(key)
      .then(() => toast('Key copied to clipboard','📋'))
      .catch(() => { prompt('Copy this key:', key) })
  }

  // ── Simulate usage (for demo — real usage tracked by server) ──────────────
  function _recordUsage(id) {
    const keys = _load()
    const k = keys.find(k => k.id === id); if (!k) return
    k.requests++; k.lastUsed = new Date().toISOString()
    _save(keys)
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  function openUI()  { _tab = 'keys'; renderBody(); document.getElementById('ak-modal-bg').classList.remove('hidden') }
  function closeUI() { document.getElementById('ak-modal-bg').classList.add('hidden') }

  function switchTab(t) {
    _tab = t
    document.querySelectorAll('.ak-tab').forEach(el => el.classList.remove('active'))
    const tabEl = document.getElementById('ak-tab-' + t)
    if (tabEl) tabEl.classList.add('active')
    renderBody()
  }

  function renderBody() {
    const el = document.getElementById('ak-body'); if (!el) return
    if (_tab === 'keys')  el.innerHTML = _renderKeys()
    else if (_tab === 'docs')  el.innerHTML = _renderDocs()
    else                       el.innerHTML = _renderUsage()
  }

  function _renderKeys() {
    const keys = _load()
    const createForm = `
      <div class="ak-create-form">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px">Generate New Key</div>
        <div class="ak-form-row">
          <div>
            <label class="ak-label">Key Name</label>
            <input class="ak-input" id="ak-name-inp" placeholder="e.g. My App" maxlength="40"/>
          </div>
          <div>
            <label class="ak-label">Permission</label>
            <select class="ak-select" id="ak-perm-sel">
              <option value="read">Read — GET only</option>
              <option value="write">Write — GET + POST + PUT</option>
              <option value="admin">Admin — Full access</option>
            </select>
          </div>
          <div>
            <label class="ak-label">Expiry</label>
            <select class="ak-select" id="ak-expiry-sel">
              <option value="0">Never</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary" style="align-self:flex-start" onclick="ApiKeys._submitCreate()">Generate Key</button>
      </div>`

    if (!keys.length) return createForm + '<div class="ak-empty">🔑<br/>No API keys yet. Generate one above.</div>'

    const rows = keys.map(k => {
      const isExpired = k.expiry && new Date(k.expiry) < new Date()
      const status = k.revoked ? 'revoked' : isExpired ? 'revoked' : k.permission
      const masked = k.key.slice(0,7) + '••••••••••••••••••••••••' + k.key.slice(-4)
      return `<div class="ak-key-row">
        <div class="ak-key-header">
          <span class="ak-key-name">${k.name}</span>
          <span class="ak-perm-badge ${status}">${k.revoked ? 'revoked' : isExpired ? 'expired' : k.permission}</span>
          <div class="ak-key-actions">
            ${!k.revoked && !isExpired ? `<button class="bk-btn" onclick="ApiKeys.revokeKey('${k.id}')">Revoke</button>` : ''}
            <button class="bk-btn danger" onclick="ApiKeys.deleteKey('${k.id}')">Delete</button>
          </div>
        </div>
        <div class="ak-key-val">
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${masked}</span>
          <button class="ak-key-copy" onclick="ApiKeys.copyKey('${k.key}')">Copy</button>
        </div>
        <div class="ak-key-meta">
          <span>Created: ${new Date(k.created).toLocaleDateString()}</span>
          <span>Last used: ${k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'Never'}</span>
          <span>Requests: ${k.requests.toLocaleString()}</span>
          ${k.expiry ? `<span>Expires: ${new Date(k.expiry).toLocaleDateString()}</span>` : '<span>No expiry</span>'}
        </div>
      </div>`
    }).join('')

    return createForm + rows
  }

  function _renderDocs() {
    const base = window.location.origin
    const endpoints = [
      { method:'GET',    path:'/api/v1/health',                    perm:'read',  desc:'Server health, uptime, room count',                    example:`curl ${base}/api/v1/health \\\n  -H "X-API-Key: pc_your_key_here"` },
      { method:'GET',    path:'/api/v1/rooms',                     perm:'read',  desc:'List all active collaboration rooms',                  example:`curl ${base}/api/v1/rooms \\\n  -H "X-API-Key: pc_your_key_here"` },
      { method:'GET',    path:'/api/v1/rooms/:roomId',             perm:'read',  desc:'Get room state: sections, title, users',               example:`curl ${base}/api/v1/rooms/my-room \\\n  -H "X-API-Key: pc_your_key_here"` },
      { method:'POST',   path:'/api/v1/rooms/:roomId/sections',    perm:'write', desc:'Add a section to a room (broadcasts to all users)',    example:`curl -X POST ${base}/api/v1/rooms/my-room/sections \\\n  -H "X-API-Key: pc_your_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"type":"hero","props":{"headline":"Hello!"}}'` },
      { method:'DELETE', path:'/api/v1/rooms/:roomId/sections/:id',perm:'write', desc:'Remove a section from a room',                         example:`curl -X DELETE ${base}/api/v1/rooms/my-room/sections/s1_abc \\\n  -H "X-API-Key: pc_your_key_here"` },
      { method:'PUT',    path:'/api/v1/rooms/:roomId/title',       perm:'write', desc:'Update room page title',                               example:`curl -X PUT ${base}/api/v1/rooms/my-room/title \\\n  -H "X-API-Key: pc_your_key_here" \\\n  -d '{"title":"My New Page"}'` },
      { method:'GET',    path:'/api/v1/keys/validate',             perm:'read',  desc:'Validate a key and return its permissions',            example:`curl ${base}/api/v1/keys/validate \\\n  -H "X-API-Key: pc_your_key_here"` },
    ]
    const mc = { GET:'get', POST:'post', PUT:'put', DELETE:'delete' }
    const pc = { read:'read', write:'write', admin:'admin' }
    return `
      <div style="font-size:11px;color:var(--muted);margin-bottom:12px">
        Send <code style="background:var(--surface2);padding:1px 5px;border-radius:3px">X-API-Key: your_key</code> header with every request.
        Base URL: <code style="background:var(--surface2);padding:1px 5px;border-radius:3px">${base}</code>
      </div>
      ${endpoints.map(ep => `
        <div class="ak-endpoint">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="ak-ep-method ${mc[ep.method]}">${ep.method}</span>
            <span class="ak-ep-path">${ep.path}</span>
            <span class="ak-perm-badge ${pc[ep.perm]}" style="margin-left:auto">${ep.perm}</span>
          </div>
          <div class="ak-ep-desc">${ep.desc}</div>
          <pre class="ak-ep-example">${ep.example}</pre>
        </div>`).join('')}`
  }

  function _renderUsage() {
    const keys = _load()
    if (!keys.length) return '<div class="ak-empty">🔑 No API keys yet.</div>'
    const total = keys.reduce((s,k) => s + k.requests, 0)
    const active = keys.filter(k => !k.revoked).length
    return `
      <div class="ff-stats-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="ff-stat"><div class="ff-stat-val">${keys.length}</div><div class="ff-stat-lbl">Total Keys</div></div>
        <div class="ff-stat"><div class="ff-stat-val" style="color:#34d399">${active}</div><div class="ff-stat-lbl">Active</div></div>
        <div class="ff-stat"><div class="ff-stat-val" style="color:var(--accent)">${total.toLocaleString()}</div><div class="ff-stat-lbl">Total Requests</div></div>
      </div>
      <div class="ff-section-title" style="padding:4px 0">Key Usage Breakdown</div>
      ${keys.map(k => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px">
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--text)">${k.name}</div>
            <div style="font-size:11px;color:var(--muted)">Last used: ${k.lastUsed ? new Date(k.lastUsed).toLocaleString() : 'Never'}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="ak-perm-badge ${k.revoked?'revoked':k.permission}">${k.revoked?'revoked':k.permission}</span>
            <span style="font-size:14px;font-weight:800;color:var(--text)">${k.requests.toLocaleString()}</span>
            <span style="font-size:10px;color:var(--muted)">req</span>
          </div>
        </div>`).join('')}`
  }

  function _submitCreate() {
    const name    = document.getElementById('ak-name-inp')?.value
    const perm    = document.getElementById('ak-perm-sel')?.value || 'read'
    const expiry  = Number(document.getElementById('ak-expiry-sel')?.value || 0)
    createKey(name, perm, expiry)
    const inp = document.getElementById('ak-name-inp')
    if (inp) inp.value = ''
  }

  return {
    openUI, closeUI, switchTab, renderBody,
    createKey, revokeKey, deleteKey, copyKey,
    _submitCreate,
  }
})()

window.PageCraft.apiKeys = ApiKeys
