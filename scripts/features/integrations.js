/* ══════════════════════════════════════════════════════
   INTEGRATIONS SYSTEM
══════════════════════════════════════════════════════ */

const INT_STORE_KEY   = 'pc_integrations_v1'
const INT_LOG_KEY     = 'pc_int_logs_v1'
const INT_BINDING_KEY = 'pc_int_bindings_v1'

function intLoad()    { try { return JSON.parse(localStorage.getItem(INT_STORE_KEY   + (AUTH.user?'_'+AUTH.user.id:'')) || '{}') } catch { return {} } }
function intSave(db)  { localStorage.setItem(INT_STORE_KEY   + (AUTH.user?'_'+AUTH.user.id:''), JSON.stringify(db)) }
function intLoadLogs()     { try { return JSON.parse(localStorage.getItem(INT_LOG_KEY     + (AUTH.user?'_'+AUTH.user.id:'')) || '[]') } catch { return [] } }
function intSaveLogs(l)    { localStorage.setItem(INT_LOG_KEY     + (AUTH.user?'_'+AUTH.user.id:''), JSON.stringify(l.slice(0,200))) }
function intLoadBindings() { try { return JSON.parse(localStorage.getItem(INT_BINDING_KEY + (AUTH.user?'_'+AUTH.user.id:'')) || '{}') } catch { return {} } }
function intSaveBindings(b){ localStorage.setItem(INT_BINDING_KEY + (AUTH.user?'_'+AUTH.user.id:''), JSON.stringify(b)) }

const CONNECTORS = [
  { id:'rest-api',    name:'Custom REST API', icon:'⚡', color:'#6366f1', desc:'Connect any REST API with custom headers and auth', fields:[
      {key:'baseUrl', label:'Base URL',    type:'text',     ph:'https://api.example.com',  required:true},
      {key:'authType',label:'Auth Type',   type:'select',   options:['None','Bearer Token','API Key','Basic Auth']},
      {key:'token',   label:'Token / Key', type:'password', ph:'your-api-key-or-token'},
      {key:'header',  label:'Custom Header',type:'text',    ph:'X-Custom-Header: value'},
  ]},
  { id:'openai',      name:'OpenAI',      icon:'🤖', color:'#10a37f', desc:'GPT-4, DALL-E, Whisper and Embeddings APIs', fields:[
      {key:'baseUrl', label:'Base URL',      type:'text',     ph:'https://api.openai.com/v1',    required:true, default:'https://api.openai.com/v1'},
      {key:'token',   label:'API Key',       type:'password', ph:'sk-...',  required:true},
      {key:'model',   label:'Default Model', type:'select',   options:['gpt-4o','gpt-4-turbo','gpt-3.5-turbo','dall-e-3']},
  ]},
  { id:'stripe-api',  name:'Stripe',      icon:'💳', color:'#635bff', desc:'Payments, subscriptions and customer data', fields:[
      {key:'baseUrl', label:'Base URL',   type:'text',     ph:'https://api.stripe.com/v1',  default:'https://api.stripe.com/v1'},
      {key:'token',   label:'Secret Key', type:'password', ph:'sk_live_...'},
  ]},
  { id:'supabase',    name:'Supabase',    icon:'🗄', color:'#3ecf8e', desc:'PostgreSQL database, auth and storage', fields:[
      {key:'baseUrl', label:'Project URL', type:'text',     ph:'https://xyz.supabase.co', required:true},
      {key:'token',   label:'Anon Key',    type:'password', ph:'eyJ...',                  required:true},
  ]},
  { id:'airtable',    name:'Airtable',    icon:'📊', color:'#f02d65', desc:'Spreadsheet-database for dynamic content', fields:[
      {key:'baseUrl', label:'Base URL', type:'text',     ph:'https://api.airtable.com/v0/appXXXX', required:true},
      {key:'token',   label:'API Key',  type:'password', ph:'keyXXXX', required:true},
  ]},
  { id:'ghost',       name:'Ghost CMS',   icon:'👻', color:'#738a94', desc:'Blog posts and pages from Ghost', fields:[
      {key:'baseUrl', label:'Ghost URL',       type:'text',     ph:'https://yourblog.ghost.io', required:true},
      {key:'token',   label:'Content API Key', type:'password', ph:'xxxxx', required:true},
  ]},
  { id:'wordpress',   name:'WordPress',   icon:'📝', color:'#21759b', desc:'Posts, pages and CPTs via WP REST API', fields:[
      {key:'baseUrl',  label:'Site URL', type:'text',   ph:'https://yoursite.com', required:true},
      {key:'authType', label:'Auth',     type:'select', options:['None','App Password']},
      {key:'token',    label:'App Password', type:'password', ph:'user:xxxx xxxx xxxx'},
  ]},
  { id:'github',      name:'GitHub',      icon:'🐙', color:'#333', desc:'Repos, issues, commits and releases', fields:[
      {key:'baseUrl', label:'Base URL',  type:'text',     ph:'https://api.github.com', default:'https://api.github.com'},
      {key:'token',   label:'PAT Token', type:'password', ph:'ghp_...'},
  ]},
  { id:'weather',     name:'OpenWeather', icon:'🌤', color:'#eb6e4b', desc:'Current weather and forecasts', fields:[
      {key:'baseUrl', label:'Base URL', type:'text',     ph:'https://api.openweathermap.org/data/2.5', default:'https://api.openweathermap.org/data/2.5'},
      {key:'token',   label:'API Key',  type:'password', ph:'your-api-key'},
  ]},
  { id:'notion',      name:'Notion',      icon:'📔', color:'#000', desc:'Pages, databases and blocks', fields:[
      {key:'baseUrl', label:'Base URL',           type:'text',     ph:'https://api.notion.com/v1', default:'https://api.notion.com/v1'},
      {key:'token',   label:'Integration Token',  type:'password', ph:'secret_...'},
  ]},
  { id:'slack',       name:'Slack',       icon:'💬', color:'#4a154b', desc:'Send messages and read channel data', fields:[
      {key:'baseUrl', label:'Base URL',  type:'text',     ph:'https://slack.com/api', default:'https://slack.com/api'},
      {key:'token',   label:'Bot Token', type:'password', ph:'xoxb-...'},
  ]},
  { id:'shopify',     name:'Shopify',     icon:'🛒', color:'#96bf48', desc:'Products, orders and customers', fields:[
      {key:'baseUrl', label:'Store URL',       type:'text',     ph:'https://store.myshopify.com/admin/api/2024-01', required:true},
      {key:'token',   label:'Admin API Token', type:'password', ph:'shpat_...'},
  ]},
]

const INT_UI = { view:'connectors', configTarget:null, fetchState:{ method:'GET', url:'', params:[], headers:[], body:'', response:null } }

function openIntegrations() {
  if (!AUTH.user) { showAuthGate(); return }
  document.getElementById('int-modal').classList.remove('hidden')
  intNav('connectors')
}
function closeIntegrations() { document.getElementById('int-modal').classList.add('hidden') }
document.addEventListener('click', ev => { if (ev.target === document.getElementById('int-modal')) closeIntegrations() })

function intNav(view) {
  INT_UI.view = view; INT_UI.configTarget = null
  document.querySelectorAll('.int-nav').forEach(b => b.classList.toggle('active', b.id === 'inav-' + view))
  updateIntActiveCount(); renderIntView()
}
function updateIntActiveCount() {
  const n = Object.keys(intLoad()).length, badge = document.getElementById('inav-active-count')
  if (badge) { badge.textContent = n; badge.style.display = n ? 'inline-block' : 'none' }
}
function renderIntView() {
  const area = document.getElementById('int-main-area'); if (!area) return
  if (INT_UI.configTarget) { renderIntConfig(area); return }
  const views = { connectors:renderIntConnectors, active:renderIntActive, fetch:renderIntFetch, bindings:renderIntBindings, webhooks:renderIntWebhooks, logs:renderIntLogs }
  ;(views[INT_UI.view] || renderIntConnectors)(area)
}

// ── Connectors ────────────────────────────────────────────────────────────────
function renderIntConnectors(area) {
  const db = intLoad()
  area.innerHTML = `<div>
    <div class="int-section-head" style="background:var(--bg);border:none;padding:14px 20px 10px">
      <div><div class="int-section-title">Available Connectors</div>
      <div class="int-section-sub">Click to configure and activate</div></div>
    </div>
    <div class="int-connector-grid">
      ${CONNECTORS.map((c,i) => {
        const isConn = !!db[c.id]
        return `<div class="int-connector-card${isConn?' connected':''}" style="animation-delay:${i*30}ms" onclick="intConfigure('${c.id}')">
          <div class="int-connector-logo" style="background:${c.color}22">${c.icon}</div>
          <div><div class="int-connector-name">${c.name}</div><div class="int-connector-desc">${c.desc}</div></div>
          <span class="int-connector-status ${isConn?'connected':'available'}">${isConn?'✓ Connected':'Configure'}</span>
        </div>`
      }).join('')}
    </div>
  </div>`
}

function intConfigure(connId) { INT_UI.configTarget = connId; renderIntView() }

function renderIntConfig(area) {
  const conn = CONNECTORS.find(c => c.id === INT_UI.configTarget); if (!conn) return
  const db = intLoad(), saved = db[conn.id] || {}, isConn = !!saved.connectedAt
  area.innerHTML = `<div class="int-config-panel">
    <button onclick="INT_UI.configTarget=null;renderIntView()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;padding:0;margin-bottom:16px">← All Connectors</button>
    ${isConn ? `<div class="int-status-row"><div class="int-status-dot" style="background:#34d399"></div>
      <span style="color:#34d399;font-weight:700;font-size:12px">Connected</span>
      <span style="color:var(--muted);font-size:11px">· ${new Date(saved.connectedAt).toLocaleDateString()}</span>
      <button onclick="intDisconnect('${conn.id}')" style="margin-left:auto;background:none;border:1px solid rgba(248,113,113,.3);border-radius:6px;color:#f87171;font-size:11px;cursor:pointer;padding:3px 10px">Disconnect</button>
    </div>` : ''}
    <div class="int-config-title"><span style="font-size:22px">${conn.icon}</span> ${conn.name}</div>
    <div class="int-config-sub">${conn.desc}</div>
    ${conn.fields.map(f => `<div class="int-field">
      <div class="int-field-label">${f.label}${f.required?'<span style="color:var(--danger)"> *</span>':''}</div>
      ${f.type==='select'
        ? `<select class="int-field-inp int-field-select" id="int-f-${f.key}">${f.options.map(o=>`<option${(saved[f.key]||f.options[0])===o?' selected':''}>${o}</option>`).join('')}</select>`
        : `<input class="int-field-inp" id="int-f-${f.key}" type="${f.type==='password'?'password':'text'}" placeholder="${f.ph||''}" value="${e(saved[f.key]||f.default||'')}"/>`}
    </div>`).join('')}
    <div style="display:flex;gap:8px;margin-top:18px">
      <button class="int-test-btn" onclick="intTestConnection('${conn.id}')">🔍 Test Connection</button>
      <button class="int-save-btn" onclick="intSaveConnection('${conn.id}')">💾 Save & Connect</button>
    </div>
    <div id="int-test-result" style="margin-top:10px;font-size:12px"></div>
    ${isConn ? `<div style="margin-top:24px;padding-top:18px;border-top:1px solid var(--border)">
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">Quick endpoints</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${getQuickEndpoints(conn).map(ep => `
          <button onclick="intLoadEndpoint('${ep.method}','${ep.path}')"
            style="display:flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid var(--border);border-radius:7px;padding:8px 12px;cursor:pointer;font-size:11px;text-align:left;font-family:inherit;color:var(--text2);transition:all .15s"
            onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
            <span style="font-weight:700;font-family:monospace;padding:1px 5px;border-radius:3px;font-size:10px;background:${ep.method==='GET'?'rgba(52,211,153,.12)':'rgba(99,102,241,.12)'};color:${ep.method==='GET'?'#34d399':'#818cf8'}">${ep.method}</span>
            <span style="font-family:monospace">${ep.path}</span>
            <span style="margin-left:auto;color:var(--muted)">${ep.desc}</span>
          </button>`).join('')}
      </div>
    </div>` : ''}
  </div>`
}

function getQuickEndpoints(conn) {
  const eps = {
    'rest-api':  [{method:'GET', path:'/endpoint',desc:'Custom endpoint'}],
    'openai':    [{method:'POST',path:'/chat/completions',desc:'Chat'},{method:'GET',path:'/models',desc:'Models'}],
    'stripe-api':[{method:'GET',path:'/customers',desc:'Customers'},{method:'GET',path:'/products',desc:'Products'}],
    'supabase':  [{method:'GET',path:'/rest/v1/table',desc:'Query table'},{method:'POST',path:'/rest/v1/table',desc:'Insert'}],
    'airtable':  [{method:'GET',path:'/',desc:'List records'}],
    'ghost':     [{method:'GET',path:'/ghost/api/content/posts/?key=KEY',desc:'Posts'}],
    'wordpress': [{method:'GET',path:'/wp-json/wp/v2/posts',desc:'Posts'},{method:'GET',path:'/wp-json/wp/v2/pages',desc:'Pages'}],
    'github':    [{method:'GET',path:'/repos/{owner}/{repo}',desc:'Repo info'}],
    'weather':   [{method:'GET',path:'/weather?q=London&appid=KEY',desc:'Current weather'}],
    'notion':    [{method:'POST',path:'/databases/{id}/query',desc:'Query DB'}],
    'shopify':   [{method:'GET',path:'/products.json',desc:'Products'}],
  }
  return eps[conn.id] || [{method:'GET',path:'/',desc:'Root'}]
}

function intLoadEndpoint(method, path) {
  INT_UI.configTarget = null; INT_UI.view = 'fetch'; intNav('fetch')
  setTimeout(() => {
    const db = intLoad(), first = Object.values(db)[0]
    const url = (first?.baseUrl || '') + path
    const mel = document.getElementById('int-method'), uel = document.getElementById('int-url')
    if (mel) mel.value = method; if (uel) uel.value = url
    INT_UI.fetchState.method = method; INT_UI.fetchState.url = url
  }, 100)
}

function intSaveConnection(connId) {
  const conn = CONNECTORS.find(c => c.id === connId); if (!conn) return
  const db = intLoad(), record = { id:connId, name:conn.name, icon:conn.icon, connectedAt:new Date().toISOString() }
  conn.fields.forEach(f => { const el = document.getElementById('int-f-'+f.key); if (el) record[f.key] = el.value })
  const req = conn.fields.find(f => f.required)
  if (req && !record[req.key]) { toast('Fill in all required fields','⚠️'); return }
  db[connId] = record; intSave(db); updateIntActiveCount()
  toast(`${conn.name} connected!`, '✅'); INT_UI.configTarget = null; renderIntView()
}

function intDisconnect(connId) {
  const conn = CONNECTORS.find(c => c.id === connId)
  if (!confirm(`Disconnect ${conn?.name}?`)) return
  const db = intLoad(); delete db[connId]; intSave(db); updateIntActiveCount()
  toast('Disconnected','🔌'); INT_UI.configTarget = null; renderIntView()
}

async function intTestConnection(connId) {
  const conn = CONNECTORS.find(c => c.id === connId); if (!conn) return
  const baseUrl = document.getElementById('int-f-baseUrl')?.value?.trim()
  const token   = document.getElementById('int-f-token')?.value?.trim()
  const result  = document.getElementById('int-test-result')
  if (!baseUrl) { result.innerHTML = '<span style="color:var(--danger)">⚠ Enter a Base URL first</span>'; return }
  result.textContent = 'Testing…'
  try {
    const headers = { 'Content-Type':'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const start = Date.now(), res = await fetch(baseUrl, { method:'GET', headers, signal:AbortSignal.timeout(8000) })
    const ms = Date.now() - start
    intAddLog({ method:'GET', url:baseUrl, status:res.status, ms })
    result.innerHTML = res.ok
      ? `<span style="color:#34d399">✓ Connected — ${res.status} · ${ms}ms</span>`
      : `<span style="color:#f87171">✗ ${res.status} ${res.statusText} · ${ms}ms</span>`
  } catch(err) {
    result.innerHTML = `<span style="color:#f87171">✗ ${err.name==='TimeoutError'?'Timeout':err.message}</span>`
  }
}

// ── Active connections ────────────────────────────────────────────────────────
function renderIntActive(area) {
  const conns = Object.values(intLoad())
  area.innerHTML = `<div>
    <div class="int-section-head">
      <div><div class="int-section-title">✅ Active Connections (${conns.length})</div>
      <div class="int-section-sub">All configured integrations</div></div>
      <button class="int-new-btn" onclick="intNav('connectors')">+ Add Connection</button>
    </div>
    <div class="int-conn-list">
      ${!conns.length ? `<div style="text-align:center;padding:48px 20px;color:var(--muted)"><div style="font-size:36px;opacity:.25;margin-bottom:12px">🔌</div><div style="font-size:13px;font-weight:600;color:var(--text2)">No active connections</div></div>` :
        conns.map(conn => `<div class="int-conn-item">
          <div class="int-conn-logo" style="background:${CONNECTORS.find(c=>c.id===conn.id)?.color||'#888'}22">${conn.icon}</div>
          <div class="int-conn-info"><div class="int-conn-name">${conn.name}</div>
          <div class="int-conn-meta">${conn.baseUrl||'No base URL'} · Connected ${new Date(conn.connectedAt).toLocaleDateString()}</div></div>
          <div class="int-conn-actions">
            <button class="int-conn-btn" onclick="intConfigure('${conn.id}')">Edit</button>
            <button class="int-conn-btn" onclick="intNav('fetch')">Test</button>
            <button class="int-conn-btn danger" onclick="intDisconnect('${conn.id}')">Remove</button>
          </div>
        </div>`).join('')}
    </div>
  </div>`
}

// ── API Tester ────────────────────────────────────────────────────────────────
function renderIntFetch(area) {
  const fs = INT_UI.fetchState, db = intLoad(), conns = Object.values(db)
  area.innerHTML = `<div>
    <div class="int-section-head">
      <div><div class="int-section-title">⚡ API Tester</div>
      <div class="int-section-sub">Build and send HTTP requests, inspect responses</div></div>
    </div>
    <div class="int-fetch-builder">
      ${conns.length ? `<div style="margin-bottom:10px">
        <div style="font-size:11px;color:var(--muted);margin-bottom:5px">Load from connection</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${conns.map(c=>`<button onclick="intPrefillConn('${c.id}')" style="display:flex;align-items:center;gap:5px;padding:4px 10px;border:1px solid var(--border2);border-radius:7px;background:none;color:var(--text2);font-size:11px;cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border2)'">${c.icon} ${c.name}</button>`).join('')}
        </div>
      </div>` : ''}
      <div class="int-fetch-row">
        <select class="int-method-sel" id="int-method" onchange="INT_UI.fetchState.method=this.value">
          ${['GET','POST','PUT','PATCH','DELETE','HEAD'].map(m=>`<option${fs.method===m?' selected':''}>${m}</option>`).join('')}
        </select>
        <input class="int-url-inp" id="int-url" placeholder="https://api.example.com/endpoint"
          value="${e(fs.url)}" oninput="INT_UI.fetchState.url=this.value"
          onkeydown="if(event.key==='Enter')intSendRequest()"/>
        <button class="int-fetch-send" id="int-send-btn" onclick="intSendRequest()">
          <span id="int-send-spin" style="display:none;width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite"></span>
          Send
        </button>
      </div>
      <div>
        <div style="display:flex;gap:0;margin-bottom:10px;border-bottom:1px solid var(--border)">
          ${['Params','Headers','Body'].map((t,i)=>`<button onclick="intFetchTab(${i})" id="ift-${i}" style="padding:7px 16px;background:none;border:none;border-bottom:2px solid ${i===0?'var(--accent)':'transparent'};color:${i===0?'var(--accent)':'var(--text2)'};font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit">${t}</button>`).join('')}
        </div>
        <div id="ift-panel-0">${renderIntParamsTable('params')}</div>
        <div id="ift-panel-1" style="display:none">${renderIntParamsTable('headers')}</div>
        <div id="ift-panel-2" style="display:none">
          <textarea id="int-body" rows="5" style="width:100%;background:var(--surface2);border:1.5px solid var(--border2);border-radius:8px;color:var(--text);font-size:12px;padding:10px 12px;outline:none;font-family:var(--mono,monospace);resize:vertical;transition:border-color .15s" placeholder='{"key":"value"}' oninput="INT_UI.fetchState.body=this.value">${e(fs.body)}</textarea>
        </div>
      </div>
      <div id="int-response-area">${fs.response ? renderIntResponse(fs.response) : ''}</div>
    </div>
  </div>`
}

function intFetchTab(idx) {
  ;[0,1,2].forEach(i => {
    const btn = document.getElementById('ift-'+i), panel = document.getElementById('ift-panel-'+i)
    if (btn)   { btn.style.borderBottomColor = i===idx?'var(--accent)':'transparent'; btn.style.color = i===idx?'var(--accent)':'var(--text2)' }
    if (panel) panel.style.display = i===idx?'block':'none'
  })
}

function renderIntParamsTable(type) {
  const rows = INT_UI.fetchState[type] || [], id = 'int-'+type+'-table'
  return `<table class="int-params-table" id="${id}">
    <thead><tr><th>Key</th><th>Value</th><th></th></tr></thead>
    <tbody>${rows.map((r,i)=>`<tr>
      <td><input class="int-param-inp" placeholder="key"   value="${e(r.key||'')}"   oninput="INT_UI.fetchState.${type}[${i}].key=this.value"/></td>
      <td><input class="int-param-inp" placeholder="value" value="${e(r.value||'')}" oninput="INT_UI.fetchState.${type}[${i}].value=this.value"/></td>
      <td><button onclick="INT_UI.fetchState.${type}.splice(${i},1);renderIntView()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px">×</button></td>
    </tr>`).join('')}</tbody>
  </table>
  <button class="int-add-param" onclick="INT_UI.fetchState.${type}.push({key:'',value:''});renderIntView()">+ Add ${type==='headers'?'header':'parameter'}</button>`
}

function renderIntResponse(resp) {
  const isOk = resp.status >= 200 && resp.status < 300
  const bodyStr = typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body, null, 2)
  const truncated = bodyStr.length > 4000
  return `<div class="int-response-box">
    <div class="int-response-head">
      <span class="int-response-status ${isOk?'ok':'err'}">${resp.status} ${resp.statusText||''}</span>
      <span class="int-response-time">${resp.ms}ms</span>
      <div class="int-response-actions">
        <button class="int-resp-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(bodyStr)}).then(()=>toast('Copied','📋'))">Copy</button>
        <button class="int-resp-btn" onclick="intBindToSection(${JSON.stringify(bodyStr)})">Bind to section →</button>
      </div>
    </div>
    <pre class="int-response-body">${e(truncated?bodyStr.slice(0,4000)+'\n…[truncated]':bodyStr)}</pre>
  </div>`
}

async function intSendRequest() {
  const fs = INT_UI.fetchState
  const url = document.getElementById('int-url')?.value.trim() || fs.url
  if (!url) { toast('Enter a URL first','⚠️'); return }
  const btn = document.getElementById('int-send-btn'), spin = document.getElementById('int-send-spin')
  btn.disabled = true; spin.style.display = 'inline-block'
  let fullUrl = url
  const params = (fs.params||[]).filter(p=>p.key)
  if (params.length) fullUrl += (fullUrl.includes('?')?'&':'?') + params.map(p=>encodeURIComponent(p.key)+'='+encodeURIComponent(p.value)).join('&')
  const headers = { 'Content-Type':'application/json' }
  ;(fs.headers||[]).filter(h=>h.key).forEach(h=>{ headers[h.key]=h.value })
  Object.values(intLoad()).forEach(conn => { if (fullUrl.startsWith(conn.baseUrl||'') && conn.token) headers['Authorization']='Bearer '+conn.token })
  const start = Date.now()
  try {
    const opts = { method:fs.method, headers, signal:AbortSignal.timeout(15000) }
    if (!['GET','HEAD'].includes(fs.method) && fs.body) opts.body = fs.body
    const res = await fetch(fullUrl, opts), ms = Date.now()-start
    const ct = res.headers.get('content-type')||''
    let body; try { body = ct.includes('json') ? await res.json() : await res.text() } catch { body = await res.text() }
    INT_UI.fetchState.response = { status:res.status, statusText:res.statusText, ms, body }
    intAddLog({ method:fs.method, url:fullUrl, status:res.status, ms })
  } catch(err) {
    const ms = Date.now()-start
    INT_UI.fetchState.response = { status:'ERR', statusText:err.name==='TimeoutError'?'Timeout':err.message, ms, body:err.message }
    intAddLog({ method:fs.method, url:fullUrl, status:'ERR', ms })
  }
  btn.disabled = false; spin.style.display = 'none'; renderIntView()
}

function intPrefillConn(connId) {
  const db = intLoad(), conn = db[connId]; if (!conn) return
  INT_UI.fetchState.url = conn.baseUrl||''
  if (conn.token) INT_UI.fetchState.headers = [{ key:'Authorization', value:'Bearer '+conn.token }]
  renderIntView()
  setTimeout(() => { const el = document.getElementById('int-url'); if (el) el.value = conn.baseUrl||'' }, 50)
}

// ── Data Bindings ─────────────────────────────────────────────────────────────
function intBindToSection(dataStr) {
  if (!S.sections.length) { toast('Add sections first','⚠️'); return }
  const sec = S.sections[0], bindings = intLoadBindings(), id = 'bind_'+Date.now()
  bindings[id] = { id, sectionId:sec.id, sectionType:sec.type, dataSource:INT_UI.fetchState.url, method:INT_UI.fetchState.method, rawData:dataStr.slice(0,2000), createdAt:new Date().toISOString(), active:true }
  intSaveBindings(bindings); toast('Data bound to section','🔗'); intNav('bindings')
}

function renderIntBindings(area) {
  const bindings = Object.values(intLoadBindings())
  area.innerHTML = `<div>
    <div class="int-section-head">
      <div><div class="int-section-title">🔗 Data Bindings</div>
      <div class="int-section-sub">Live API data connected to page sections</div></div>
      <button class="int-new-btn secondary" onclick="intNav('fetch')">+ New Binding</button>
    </div>
    <div style="padding:16px 20px">
      ${!bindings.length ? `<div style="text-align:center;padding:48px 20px;color:var(--muted)"><div style="font-size:36px;opacity:.25;margin-bottom:12px">🔗</div><div style="font-size:13px;font-weight:600;color:var(--text2)">No data bindings yet</div><div style="font-size:12px;margin-top:4px">Use the API Tester to fetch data and bind it to a section</div></div>` :
        bindings.map(b => {
          const sec = S.sections.find(s=>s.id===b.sectionId), def = sec?DEFS[sec.type]:null
          return `<div class="int-binding-card">
            <div class="int-binding-head" onclick="this.nextElementSibling.classList.toggle('open')">
              <span style="font-size:14px">${def?.icon||'📦'}</span>
              <div class="int-binding-label">${def?.label||'Unknown'} ← <span style="font-family:monospace;font-size:11px;color:var(--muted)">${b.dataSource}</span></div>
              <span class="int-binding-badge ${b.active?'active':'idle'}">${b.active?'Active':'Idle'}</span>
            </div>
            <div class="int-binding-body">
              <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Method: <strong>${b.method}</strong> · ${new Date(b.createdAt).toLocaleDateString()}</div>
              <pre style="font-size:10px;font-family:monospace;color:var(--text2);background:var(--bg);border-radius:6px;padding:8px;max-height:80px;overflow:auto">${e((b.rawData||'').slice(0,300))}</pre>
              <div style="display:flex;gap:6px;margin-top:8px">
                <button class="int-conn-btn" onclick="intRefreshBinding('${b.id}')">↻ Refresh</button>
                <button class="int-conn-btn danger" onclick="intDeleteBinding('${b.id}')">Delete</button>
              </div>
            </div>
          </div>`
        }).join('')}
    </div>
  </div>`
}

async function intRefreshBinding(id) {
  const bindings = intLoadBindings(), b = bindings[id]; if (!b) return
  toast('Refreshing…','↻')
  try {
    const headers = { 'Content-Type':'application/json' }
    Object.values(intLoad()).forEach(conn => { if (b.dataSource.startsWith(conn.baseUrl||'') && conn.token) headers['Authorization']='Bearer '+conn.token })
    const res = await fetch(b.dataSource, { method:b.method, headers, signal:AbortSignal.timeout(10000) })
    bindings[id].rawData = (await res.text()).slice(0,2000); bindings[id].lastSync = new Date().toISOString()
    intSaveBindings(bindings); renderIntView(); toast('Refreshed','✅')
  } catch(err) { toast('Refresh failed: '+err.message,'⚠️') }
}

function intDeleteBinding(id) {
  const b = intLoadBindings(); delete b[id]; intSaveBindings(b); renderIntView(); toast('Binding removed','🗑')
}
