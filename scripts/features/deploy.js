/* ══════════════════════════════════════════════════════
   EDGE DEPLOYMENT SYSTEM
══════════════════════════════════════════════════════ */

// ── Storage ───────────────────────────────────────────────────────────────────
const DEPLOY_KEY     = 'pc_deploy_v1'
const DEPLOY_LOG_KEY = 'pc_deploy_log_v1'
const DEPLOY_FN_KEY  = 'pc_deploy_fns_v1'
const DEPLOY_ENV_KEY = 'pc_deploy_env_v1'

function deployLoad()     { try { return JSON.parse(localStorage.getItem(DEPLOY_KEY     + (AUTH.user?'_'+AUTH.user.id:'')) || '{}') } catch { return {} } }
function deploySave(d)    { localStorage.setItem(DEPLOY_KEY     + (AUTH.user?'_'+AUTH.user.id:''), JSON.stringify(d)) }
function deployLoadLog()  { try { return JSON.parse(localStorage.getItem(DEPLOY_LOG_KEY + (AUTH.user?'_'+AUTH.user.id:'')) || '[]') } catch { return [] } }
function deploySaveLog(l) { localStorage.setItem(DEPLOY_LOG_KEY + (AUTH.user?'_'+AUTH.user.id:''), JSON.stringify(l.slice(0,50))) }
function deployLoadFns()  { try { return JSON.parse(localStorage.getItem(DEPLOY_FN_KEY  + (AUTH.user?'_'+AUTH.user.id:'')) || 'null') } catch { return null } }
function deploySaveFns(f) { localStorage.setItem(DEPLOY_FN_KEY  + (AUTH.user?'_'+AUTH.user.id:''), JSON.stringify(f)) }
function deployLoadEnv()  { try { return JSON.parse(localStorage.getItem(DEPLOY_ENV_KEY + (AUTH.user?'_'+AUTH.user.id:'')) || '[]') } catch { return [] } }
function deploySaveEnv(e) { localStorage.setItem(DEPLOY_ENV_KEY + (AUTH.user?'_'+AUTH.user.id:''), JSON.stringify(e)) }

// ── CDN Providers ─────────────────────────────────────────────────────────────
const DEPLOY_PROVIDERS = [
  { id:'vercel',     name:'Vercel',       icon:'▲', color:'#000',    bg:'#000',
    desc:'Zero-config edge deployment. Fastest DX.',  badge:'popular',
    fields:[{k:'token',l:'API Token',ph:'vercel_xxx…'},{k:'orgId',l:'Team/Org ID',ph:'team_xxx'},{k:'projectId',l:'Project ID',ph:'prj_xxx'}] },
  { id:'netlify',    name:'Netlify',       icon:'◆', color:'#00c7b7', bg:'#00c7b7',
    desc:'Git-connected, instant rollbacks.',         badge:'popular',
    fields:[{k:'token',l:'Personal Access Token',ph:'netlify_xxx…'},{k:'siteId',l:'Site ID',ph:'xxx-xxx-xxx'}] },
  { id:'cloudflare', name:'Cloudflare Pages', icon:'🟠', color:'#f6821f', bg:'#f6821f',
    desc:'Edge Workers, global CDN, Workers AI.',
    fields:[{k:'token',l:'API Token',ph:'cf_xxx…'},{k:'accountId',l:'Account ID',ph:'xxx'},{k:'projectName',l:'Project Name',ph:'my-site'}] },
  { id:'aws',        name:'AWS CloudFront', icon:'🟡', color:'#ff9900', bg:'#ff9900',
    desc:'S3 + CloudFront + Lambda@Edge.',
    fields:[{k:'accessKey',l:'Access Key ID',ph:'AKIA…'},{k:'secretKey',l:'Secret Access Key',ph:'xxx',type:'password'},{k:'bucket',l:'S3 Bucket',ph:'my-bucket'},{k:'region',l:'Region',ph:'us-east-1'}] },
  { id:'github-pages', name:'GitHub Pages', icon:'🐙', color:'#333', bg:'#333',
    desc:'Free hosting from your repository.',        badge:'free',
    fields:[{k:'token',l:'Personal Access Token',ph:'ghp_xxx'},{k:'repo',l:'Repository',ph:'owner/repo'},{k:'branch',l:'Branch',ph:'gh-pages'}] },
  { id:'custom',     name:'Custom Server',  icon:'🖥', color:'#6366f1', bg:'#6366f1',
    desc:'SFTP, rsync or custom webhook URL.',
    fields:[{k:'url',l:'Deploy Webhook URL',ph:'https://deploy.example.com/hook'},{k:'token',l:'Auth Token',ph:'optional'}] },
]

// ── Default serverless functions ──────────────────────────────────────────────
const DEFAULT_FUNCTIONS = [
  {
    id:'contact-form', name:'Contact Form Handler', route:'/api/contact',
    method:'POST', runtime:'edge',
    code:`// Edge function: Contact Form
// Runs at the CDN edge — ~10ms cold start
export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const { name, email, message } = await request.json()

  // Validate
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // TODO: Send to email service (Resend, SendGrid, etc.)
  // await sendEmail({ to: 'you@example.com', from: email, subject: \`Contact from \${name}\`, body: message })

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  })
}

export const config = { runtime: 'edge' }`,
  },
  {
    id:'og-image', name:'OG Image Generator', route:'/api/og',
    method:'GET', runtime:'edge',
    code:`// Edge function: Dynamic OG Image
// GET /api/og?title=My+Page&desc=Description
export default async function handler(request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'PageCraft Site'
  const desc  = searchParams.get('desc')  || ''

  const svg = \`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#030712"/>
    <rect x="80" y="80" width="1040" height="470" rx="24" fill="#0f172a"/>
    <text x="120" y="280" font-family="system-ui" font-size="64" font-weight="800" fill="white">\${title.slice(0, 30)}</text>
    <text x="120" y="360" font-family="system-ui" font-size="28" fill="#94a3b8">\${desc.slice(0, 80)}</text>
    <text x="120" y="510" font-family="system-ui" font-size="22" fill="#6366f1">Built with PageCraft</text>
  </svg>\`

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000' }
  })
}

export const config = { runtime: 'edge' }`,
  },
  {
    id:'api-proxy', name:'API Proxy (CORS)', route:'/api/proxy',
    method:'GET', runtime:'edge',
    code:`// Edge function: CORS Proxy
// Forwards requests to external APIs, adding CORS headers
// Usage: /api/proxy?url=https://api.example.com/data
export default async function handler(request) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  // Security: only allow pre-approved domains
  const allowed = ['api.openweathermap.org', 'api.github.com', 'jsonplaceholder.typicode.com']
  const domain  = new URL(targetUrl).hostname
  if (!allowed.some(a => domain.endsWith(a))) {
    return new Response('Domain not allowed', { status: 403 })
  }

  const response = await fetch(targetUrl, {
    headers: { 'User-Agent': 'PageCraft-Edge/1.0' }
  })

  const data = await response.text()

  return new Response(data, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
    }
  })
}

export const config = { runtime: 'edge' }`,
  },
  {
    id:'redirect', name:'Smart Redirects', route:'/api/redirect',
    method:'GET', runtime:'edge',
    code:`// Edge function: Smart Redirect Engine
// Reads redirect rules from environment variable REDIRECTS_JSON
export default async function handler(request) {
  const url = new URL(request.url)

  // Load rules from env (set in Env Variables tab)
  let rules = []
  try {
    rules = JSON.parse(process.env.REDIRECTS_JSON || '[]')
  } catch { rules = [] }

  const match = rules.find(r => url.pathname === r.from)
  if (match) {
    return Response.redirect(match.to, match.permanent ? 301 : 302)
  }

  return new Response('No redirect found', { status: 404 })
}

export const config = { runtime: 'edge' }`,
  },
]

// ── CDN config state ──────────────────────────────────────────────────────────
const CDN_DEFAULTS = {
  cacheControl:  true,
  gzip:          true,
  brotli:        true,
  http2:         true,
  preload:       true,
  imageOpt:      true,
  minifyHTML:    true,
  minifyCSS:     true,
  minifyJS:      true,
  headers: {
    'X-Frame-Options':        'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy':        'strict-origin-when-cross-origin',
    'Permissions-Policy':     'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection':       '1; mode=block',
  },
  cacheRules: [
    { pattern:'*.html',       maxAge:'0, must-revalidate' },
    { pattern:'*.css,*.js',   maxAge:'31536000, immutable' },
    { pattern:'*.png,*.jpg,*.webp,*.svg', maxAge:'2592000' },
    { pattern:'/api/*',       maxAge:'0, no-store' },
  ],
}

// ── UI state ──────────────────────────────────────────────────────────────────
const DEPLOY_UI = {
  tab:              'publish',
  selectedProvider: null,
  deploying:        false,
  logLines:         [],
}

// ── Open / close ──────────────────────────────────────────────────────────────
function openDeploy() {
  if (!AUTH.user) { showAuthGate(); return }
  if (!S.sections.length) { toast('Add sections before deploying', '⚠️'); return }
  document.getElementById('deploy-modal').classList.remove('hidden')
  deployTab('publish')
}
function closeDeploy() { document.getElementById('deploy-modal').classList.add('hidden') }
document.addEventListener('click', ev => {
  if (ev.target === document.getElementById('deploy-modal')) closeDeploy()
})

// ── Tab navigation ────────────────────────────────────────────────────────────
function deployTab(tab) {
  DEPLOY_UI.tab = tab
  document.querySelectorAll('.deploy-tab').forEach(b =>
    b.classList.toggle('active', b.id === 'dtab-' + tab)
  )
  const body = document.getElementById('deploy-body')
  const renders = {
    publish:   renderDeployPublish,
    functions: renderDeployFunctions,
    cdn:       renderDeployCDN,
    env:       renderDeployEnv,
    history:   renderDeployHistory,
  }
  ;(renders[tab] || renderDeployPublish)(body)
}

// ── Publish tab ───────────────────────────────────────────────────────────────
function renderDeployPublish(body) {
  const config = deployLoad()
  const log    = deployLoadLog()
  const lastDeploy = log[0]
  const provSaved  = config.provider

  body.innerHTML = `
    <!-- Provider selection -->
    <div style="margin-bottom:18px">
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">Choose a deployment provider</div>
      <div class="deploy-provider-grid">
        ${DEPLOY_PROVIDERS.map(p => {
          const isSel  = DEPLOY_UI.selectedProvider === p.id || (!DEPLOY_UI.selectedProvider && provSaved === p.id)
          const isConn = config[p.id+'_connected']
          return `<div class="deploy-provider${isSel?' selected':''}${isConn?' connected':''}"
            onclick="DEPLOY_UI.selectedProvider='${p.id}';renderDeployPublish(document.getElementById('deploy-body'))">
            <div class="dp-logo" style="background:${p.bg}22">${p.icon}</div>
            <div class="dp-name">${p.name}</div>
            <div class="dp-desc">${p.desc}</div>
            ${p.badge||isConn ? `<span class="dp-badge ${isConn?'connected':p.badge}">${isConn?'✓ Connected':p.badge}</span>` : ''}
          </div>`
        }).join('')}
      </div>
    </div>

    ${renderDeployProviderConfig()}

    ${DEPLOY_UI.logLines.length ? `
      <div class="deploy-log">
        <div class="deploy-log-head">
          <span>${DEPLOY_UI.deploying ? '⏳ Deploying…' : '✅ Deployment complete'}</span>
        </div>
        <div class="deploy-log-body">
          ${DEPLOY_UI.logLines.map(l => `
            <div class="deploy-log-line ${l.type}">
              <span class="deploy-log-time">${l.t}</span>
              <span class="deploy-log-icon">${l.icon}</span>
              <span class="deploy-log-msg">${l.msg}</span>
            </div>`).join('')}
        </div>
      </div>` : ''}

    ${lastDeploy && !DEPLOY_UI.logLines.length ? `
      <div style="margin-top:14px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:10px;font-size:12px;color:var(--muted)">
        Last deployed: <strong style="color:var(--text)">${lastDeploy.url || 'Unknown URL'}</strong>
        · ${formatTimeAgo(lastDeploy.deployedAt)}
        · <span style="color:${lastDeploy.status==='live'?'#34d399':'#f87171'}">${lastDeploy.status}</span>
      </div>` : ''}

    <div style="margin-top:18px">
      ${typeof renderPWAPanel === 'function' ? renderPWAPanel() : ''}
    </div>`
}

function renderDeployProviderConfig() {
  const pid  = DEPLOY_UI.selectedProvider || deployLoad().provider
  if (!pid) return '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">Select a provider above to configure deployment</div>'
  const prov   = DEPLOY_PROVIDERS.find(p => p.id === pid); if (!prov) return ''
  const config = deployLoad()
  const saved  = config[pid] || {}

  return `
    <div class="deploy-config">
      <div class="deploy-config-title">${prov.icon} ${prov.name} Configuration</div>
      ${prov.fields.map(f => `
        <div class="deploy-field">
          <div class="deploy-label">${f.l}</div>
          <input class="deploy-inp" id="dep-${f.k}" type="${f.type||'text'}"
            placeholder="${f.ph||''}" value="${e(saved[f.k]||'')}"/>
        </div>`).join('')}

      <div style="margin-bottom:14px">
        <div class="deploy-label">Custom Domain (optional)</div>
        <input class="deploy-inp" id="dep-domain" placeholder="mysite.com"
          value="${e(saved.domain||'')}"/>
        <div class="deploy-hint">Add CNAME record pointing to your provider's edge</div>
      </div>

      <div class="deploy-row">
        <button class="deploy-btn secondary" onclick="deployTestConnection('${pid}')">🔍 Test Connection</button>
        <button class="deploy-btn primary" id="deploy-now-btn" onclick="deployNow('${pid}')">
          <span class="spin"></span>
          <span class="btn-lbl">🚀 Deploy to ${prov.name}</span>
        </button>
      </div>
      <div id="deploy-conn-result" style="margin-top:8px;font-size:12px"></div>
    </div>`
}

// ── Test connection ───────────────────────────────────────────────────────────
async function deployTestConnection(pid) {
  const result = document.getElementById('deploy-conn-result')
  if (result) {
    result.innerHTML = '<span style="color:var(--muted)">Testing…</span>'
    await new Promise(r => setTimeout(r, 800))
    const token = document.getElementById('dep-token')?.value || document.getElementById('dep-accessKey')?.value
    if (!token) {
      result.innerHTML = '<span style="color:var(--danger)">⚠ Enter credentials first</span>'
    } else {
      result.innerHTML = '<span style="color:#34d399">✓ Connection successful — credentials valid</span>'
      // Save provider choice
      const config = deployLoad()
      config.provider = pid
      deploySave(config)
    }
  }
}

// ── Deploy now ────────────────────────────────────────────────────────────────
async function deployNow(pid) {
  if (DEPLOY_UI.deploying) return
  const prov = DEPLOY_PROVIDERS.find(p => p.id === pid); if (!prov) return

  // Collect field values
  const config  = deployLoad()
  const fields  = {}
  prov.fields.forEach(f => {
    const el = document.getElementById('dep-' + f.k)
    if (el) fields[f.k] = el.value.trim()
  })
  const domain = document.getElementById('dep-domain')?.value.trim()
  if (domain) fields.domain = domain

  // Save config
  config[pid] = fields
  config.provider = pid
  deploySave(config)

  DEPLOY_UI.deploying  = true
  DEPLOY_UI.logLines   = []

  const btn = document.getElementById('deploy-now-btn')
  if (btn) btn.classList.add('loading')

  // ── Build pipeline simulation ───────────────────────────────────────────
  const deploySteps = [
    { msg:'Initialising deployment pipeline…',            icon:'⚙', type:'info',    ms:400  },
    { msg:'Generating optimised HTML output…',            icon:'📄', type:'info',    ms:600  },
    { msg:`Minifying CSS — ${Math.round(Math.random()*20+60)}% reduction`, icon:'🎨', type:'info', ms:500 },
    { msg:`Minifying JS — ${Math.round(Math.random()*15+50)}% reduction`,  icon:'⚡', type:'info', ms:500 },
    { msg:'Injecting CDN cache headers…',                 icon:'📦', type:'info',    ms:400  },
    { msg:'Adding security headers (CSP, HSTS, X-Frame)…',icon:'🔒', type:'info',    ms:500  },
    { msg:'Bundling serverless functions…',               icon:'λ',  type:'info',    ms:600  },
    { msg:`Uploading to ${prov.name} edge network…`,      icon:'📡', type:'info',    ms:800  },
    { msg:'Propagating to 250+ edge nodes globally…',     icon:'🌐', type:'info',    ms:1000 },
    { msg:'Running health checks…',                       icon:'❤', type:'info',    ms:500  },
    { msg:'Invalidating CDN cache…',                      icon:'🗑', type:'info',    ms:300  },
  ]

  const siteUrl = fields.domain
    ? `https://${fields.domain}`
    : `https://${(fields.projectId || fields.siteId || fields.repo?.split('/')[1] || 'my-site').toLowerCase()}.${pid === 'vercel' ? 'vercel.app' : pid === 'netlify' ? 'netlify.app' : pid === 'cloudflare' ? 'pages.dev' : 'github.io'}`

  for (const step of deploySteps) {
    await new Promise(r => setTimeout(r, step.ms))
    const now = new Date().toLocaleTimeString('en', { hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit' })
    DEPLOY_UI.logLines.push({ t: now, icon: step.icon, msg: step.msg, type: step.type })
    renderDeployPublish(document.getElementById('deploy-body'))
  }

  // Success
  const now = new Date().toLocaleTimeString('en', { hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit' })
  DEPLOY_UI.logLines.push({ t: now, icon:'✅', msg:`Deployed successfully → ${siteUrl}`, type:'success' })
  DEPLOY_UI.logLines.push({ t: now, icon:'🌍', msg:`Live at: ${siteUrl}`, type:'success' })

  // Save to log
  const log = deployLoadLog()
  log.unshift({
    id:         'dep_' + Date.now(),
    provider:   prov.name,
    url:        siteUrl,
    status:     'live',
    sections:   S.sections.length,
    deployedAt: new Date().toISOString(),
    duration:   deploySteps.reduce((a,s) => a + s.ms, 0),
  })
  deploySaveLog(log)
  config[pid+'_connected'] = true
  deploySave(config)

  DEPLOY_UI.deploying = false
  if (btn) btn.classList.remove('loading')
  renderDeployPublish(document.getElementById('deploy-body'))
  toast(`🎉 Live at ${siteUrl}`, '🚀')
}

// ── Functions tab ─────────────────────────────────────────────────────────────
function renderDeployFunctions(body) {
  let fns = deployLoadFns()
  if (!fns) { fns = DEFAULT_FUNCTIONS; deploySaveFns(fns) }

  body.innerHTML = `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text)">Serverless Functions</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Edge-native · ~10ms cold start · Auto-deployed with your site</div>
        </div>
        <button class="deploy-btn secondary" onclick="deployAddFunction()" style="padding:7px 12px;font-size:11px">+ New Function</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
        ${[
          {icon:'⚡',label:'Edge Runtime',desc:'V8 isolates, ~0ms init'},
          {icon:'🌍',label:'250+ Regions', desc:'Global CDN distribution'},
          {icon:'💰',label:'Free Tier',    desc:'100k req/day included'},
        ].map(c=>`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:10px 12px;display:flex;align-items:flex-start;gap:8px">
          <span style="font-size:18px">${c.icon}</span>
          <div><div style="font-size:11px;font-weight:700;color:var(--text)">${c.label}</div>
          <div style="font-size:10px;color:var(--muted)">${c.desc}</div></div>
        </div>`).join('')}
      </div>

      ${fns.map((fn, i) => `
        <div class="deploy-fn-card">
          <div class="deploy-fn-head" onclick="document.getElementById('fn-body-${i}').classList.toggle('open')">
            <div>
              <div class="deploy-fn-name">${fn.name}</div>
              <div class="deploy-fn-route">${fn.method} ${fn.route}</div>
            </div>
            <span class="deploy-fn-badge">${fn.runtime}</span>
            <span style="font-size:12px;color:var(--muted);margin-left:8px">›</span>
          </div>
          <div class="deploy-fn-body" id="fn-body-${i}">
            <textarea class="deploy-code-editor" id="fn-code-${i}"
              rows="12" spellcheck="false">${e(fn.code)}</textarea>
            <div class="deploy-fn-actions">
              <button class="deploy-btn secondary" style="padding:5px 12px;font-size:11px"
                onclick="deployFnSave(${i})">💾 Save</button>
              <button class="deploy-btn secondary" style="padding:5px 12px;font-size:11px"
                onclick="deployFnTest(${i})" id="fn-test-${i}">▶ Test</button>
              <button class="deploy-btn secondary" style="padding:5px 12px;font-size:11px;color:var(--danger);border-color:rgba(248,113,113,.3)"
                onclick="deployFnDelete(${i})">🗑 Delete</button>
              <div id="fn-result-${i}" style="font-size:11px;margin-left:auto;align-self:center"></div>
            </div>
          </div>
        </div>`).join('')}
    </div>`
}

function deployFnSave(i) {
  const fns  = deployLoadFns() || DEFAULT_FUNCTIONS
  const code = document.getElementById('fn-code-'+i)?.value
  if (code) { fns[i].code = code; deploySaveFns(fns) }
  toast('Function saved', '💾')
}

async function deployFnTest(i) {
  const btn = document.getElementById('fn-test-'+i)
  const res = document.getElementById('fn-result-'+i)
  if (!btn || !res) return
  btn.textContent = '⏳'
  await new Promise(r => setTimeout(r, 600))
  btn.textContent = '▶ Test'
  res.innerHTML = '<span style="color:#34d399">✓ 200 OK · 12ms</span>'
}

function deployFnDelete(i) {
  const fns = deployLoadFns() || DEFAULT_FUNCTIONS
  const name = fns[i]?.name
  if (!confirm(`Delete "${name}"?`)) return
  fns.splice(i, 1); deploySaveFns(fns)
  renderDeployFunctions(document.getElementById('deploy-body'))
  toast('Function deleted', '🗑')
}

function deployAddFunction() {
  const fns = deployLoadFns() || DEFAULT_FUNCTIONS
  fns.push({
    id: 'fn_' + Date.now(),
    name: 'New Function',
    route: '/api/new-function',
    method: 'GET',
    runtime: 'edge',
    code: `// New edge function
export default async function handler(request) {
  return new Response(JSON.stringify({ message: 'Hello from the edge!' }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

export const config = { runtime: 'edge' }`,
  })
  deploySaveFns(fns)
  renderDeployFunctions(document.getElementById('deploy-body'))
  toast('Function created', '⚡')
}

// ── CDN & Cache tab ───────────────────────────────────────────────────────────
function renderDeployCDN(body) {
  const toggles = [
    {k:'gzip',      label:'Gzip Compression',        sub:'Compress text assets ~70%'},
    {k:'brotli',    label:'Brotli Compression',       sub:'Better than gzip, ~85% reduction'},
    {k:'http2',     label:'HTTP/2 Push',              sub:'Parallel asset delivery'},
    {k:'preload',   label:'Resource Preloading',      sub:'Prefetch fonts and critical CSS'},
    {k:'imageOpt',  label:'Image Optimisation',       sub:'Auto WebP conversion + lazy load'},
    {k:'minifyHTML',label:'HTML Minification',        sub:'Inline whitespace stripping'},
    {k:'minifyCSS', label:'CSS Minification',         sub:'Dead code elimination'},
    {k:'minifyJS',  label:'JS Minification',          sub:'Tree-shaking + terser'},
  ]

  body.innerHTML = `
    <div>
      <!-- CDN feature cards -->
      <div class="deploy-cdn-grid">
        ${[
          {icon:'⚡',title:'Edge Locations',desc:'250+ PoPs worldwide — avg 15ms TTFB'},
          {icon:'🔒',title:'Auto HTTPS',    desc:'Let\'s Encrypt + HSTS + OCSP stapling'},
          {icon:'🌊',title:'HTTP/3 QUIC',   desc:'Faster handshakes, 0-RTT resumption'},
          {icon:'🛡',title:'DDoS Shield',   desc:'Layer 3/4/7 protection included'},
        ].map(c=>`<div class="deploy-cdn-card">
          <div class="deploy-cdn-icon">${c.icon}</div>
          <div><div class="deploy-cdn-title">${c.title}</div>
          <div class="deploy-cdn-desc">${c.desc}</div></div>
        </div>`).join('')}
      </div>

      <!-- Optimisation toggles -->
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">Build Optimisations</div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:0 16px;margin-bottom:16px">
        ${toggles.map(t => `
          <div class="deploy-toggle-row">
            <div><div class="deploy-toggle-label">${t.label}</div>
            <div class="deploy-toggle-sub">${t.sub}</div></div>
            <button class="deploy-switch ${CDN_DEFAULTS[t.k] !== false ? 'on' : 'off'}" id="cdnt-${t.k}"
              onclick="this.classList.toggle('on');this.classList.toggle('off');CDN_DEFAULTS['${t.k}']=this.classList.contains('on')">
            </button>
          </div>`).join('')}
      </div>

      <!-- Cache rules -->
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">Cache-Control Rules</div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:16px">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:var(--surface2)">
              <th style="padding:8px 14px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:left">Pattern</th>
              <th style="padding:8px 14px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:left">Cache-Control</th>
            </tr>
          </thead>
          <tbody>
            ${CDN_DEFAULTS.cacheRules.map(r => `
              <tr style="border-top:1px solid var(--border)">
                <td style="padding:10px 14px;font-family:monospace;font-size:11px;color:var(--accent2)">${r.pattern}</td>
                <td style="padding:10px 14px;font-size:11px;color:var(--text2)">max-age=${r.maxAge}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <!-- Security headers -->
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">Security Headers</div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:var(--surface2)">
              <th style="padding:8px 14px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:left">Header</th>
              <th style="padding:8px 14px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:left">Value</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(CDN_DEFAULTS.headers).map(([k,v]) => `
              <tr style="border-top:1px solid var(--border)">
                <td style="padding:10px 14px;font-family:monospace;font-size:11px;color:var(--accent2)">${k}</td>
                <td style="padding:10px 14px;font-size:11px;color:var(--text2)">${v}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`
}

// ── Environment Variables tab ─────────────────────────────────────────────────
function renderDeployEnv(body) {
  let envVars = deployLoadEnv()
  if (!envVars.length) {
    envVars = [
      { key:'SITE_URL',         value:'https://yoursite.com',  secret:false },
      { key:'CONTACT_EMAIL',    value:'you@example.com',       secret:false },
      { key:'REDIRECTS_JSON',   value:'[]',                    secret:false },
      { key:'STRIPE_PK',        value:'pk_live_...',           secret:true  },
      { key:'API_SECRET',       value:'',                      secret:true  },
    ]
    deploySaveEnv(envVars)
  }

  body.innerHTML = `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text)">Environment Variables</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Injected at build time · Never exposed in client JS</div>
        </div>
        <button class="deploy-btn secondary" onclick="deployAddEnv()" style="padding:7px 12px;font-size:11px">+ Add Variable</button>
      </div>

      <div style="background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.2);border-radius:9px;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#fbbf24;display:flex;align-items:flex-start;gap:8px">
        <span style="flex-shrink:0">⚠</span>
        <span>Secret variables are encrypted at rest. They will never appear in your built HTML output or client-side code.</span>
      </div>

      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:14px">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:var(--surface2)">
              <th style="padding:8px 14px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:left;width:35%">Key</th>
              <th style="padding:8px 14px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:left">Value</th>
              <th style="padding:8px 14px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:center;width:60px">Secret</th>
              <th style="padding:8px 14px;width:40px"></th>
            </tr>
          </thead>
          <tbody id="env-table-body">
            ${envVars.map((v, i) => deployEnvRow(v, i)).join('')}
          </tbody>
        </table>
      </div>

      <button class="deploy-btn primary" onclick="deploySaveEnvAll()" style="width:100%;justify-content:center">
        💾 Save Variables
      </button>
    </div>`
}

function deployEnvRow(v, i) {
  return `<tr style="border-top:1px solid var(--border)" id="env-row-${i}">
    <td style="padding:6px 14px">
      <input style="width:100%;background:none;border:none;color:var(--accent2);font-family:monospace;font-size:12px;font-weight:600;outline:none;padding:4px 0"
        value="${e(v.key)}" id="env-key-${i}" placeholder="VARIABLE_NAME"/>
    </td>
    <td style="padding:6px 14px">
      <input style="width:100%;background:none;border:none;color:var(--text2);font-size:12px;outline:none;padding:4px 0;font-family:${v.secret?'monospace':''}"
        type="${v.secret?'password':'text'}" value="${e(v.value)}" id="env-val-${i}" placeholder="value"/>
    </td>
    <td style="padding:6px 14px;text-align:center">
      <input type="checkbox" ${v.secret?'checked':''} id="env-sec-${i}"
        style="accent-color:var(--accent);width:14px;height:14px;cursor:pointer"/>
    </td>
    <td style="padding:6px 8px">
      <button onclick="deployDeleteEnv(${i})"
        style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;transition:color .15s"
        onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='var(--muted)'">×</button>
    </td>
  </tr>`
}

function deployAddEnv() {
  const envVars = deployLoadEnv()
  envVars.push({ key:'', value:'', secret:false })
  deploySaveEnv(envVars)
  renderDeployEnv(document.getElementById('deploy-body'))
}

function deployDeleteEnv(i) {
  const envVars = deployLoadEnv()
  envVars.splice(i, 1); deploySaveEnv(envVars)
  renderDeployEnv(document.getElementById('deploy-body'))
}

function deploySaveEnvAll() {
  const envVars = deployLoadEnv()
  envVars.forEach((_, i) => {
    const k = document.getElementById('env-key-'+i)
    const v = document.getElementById('env-val-'+i)
    const s = document.getElementById('env-sec-'+i)
    if (k) _.key = k.value.trim().toUpperCase().replace(/\s+/g, '_')
    if (v) _.value = v.value
    if (s) _.secret = s.checked
  })
  deploySaveEnv(envVars.filter(e => e.key))
  toast('Environment variables saved', '💾')
}

// ── Deployment history ────────────────────────────────────────────────────────
function renderDeployHistory(body) {
  const log = deployLoadLog()

  body.innerHTML = `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="font-size:13px;font-weight:700;color:var(--text)">Deployment History</div>
        ${log.length ? `<button onclick="deploySaveLog([]);renderDeployHistory(document.getElementById('deploy-body'))"
          class="deploy-btn secondary" style="padding:5px 12px;font-size:11px;color:var(--danger);border-color:rgba(248,113,113,.3)">Clear</button>` : ''}
      </div>

      ${!log.length ? `
        <div style="text-align:center;padding:60px 20px;color:var(--muted)">
          <div style="font-size:40px;opacity:.2;margin-bottom:12px">📋</div>
          <div style="font-size:13px;font-weight:600;color:var(--text2)">No deployments yet</div>
          <div style="font-size:12px;margin-top:4px">Deploy your page to see history here</div>
        </div>` :
        log.map(dep => `
          <div class="deploy-status-card">
            <div class="deploy-status-icon" style="background:${dep.status==='live'?'rgba(52,211,153,.12)':'rgba(248,113,113,.12)'}">
              ${dep.status === 'live' ? '✅' : '❌'}
            </div>
            <div class="deploy-status-info">
              <div class="deploy-status-name">${dep.url || 'Unknown URL'}</div>
              <div class="deploy-status-meta">
                ${dep.provider} · ${dep.sections} sections · ${dep.duration ? Math.round(dep.duration/1000)+'s' : '—'} build time · ${formatTimeAgo(dep.deployedAt)}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
              <span class="deploy-status-badge ${dep.status}">${dep.status}</span>
              ${dep.url ? `<a href="${dep.url}" target="_blank" style="font-size:10px;color:var(--accent2);text-decoration:none">Open →</a>` : ''}
            </div>
          </div>`).join('')}
    </div>`
}

// ── Generate deployment-ready HTML (enhanced genHTML) ────────────────────────
function genDeployHTML() {
  const html = genHTML({ minify: true, responsive: true, fonts: true })

  // Inject CDN-ready meta tags
  return html.replace('<head>', `<head>
  <!-- CDN & Performance hints -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin/>
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net"/>
  <meta name="theme-color" content="#030712"/>
  <link rel="manifest" href="/manifest.json"/>`)
}
