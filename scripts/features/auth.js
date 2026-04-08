/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   AUTH SYSTEM — JWT-style, localStorage persistence
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

// ── JWT helpers (browser-side HMAC-SHA256 simulation) ────────────────────────
// Real JWT uses RSA/ECDSA on a server. Here we simulate the structure and
// base64url encoding to demonstrate the architecture; the "signature" is a
// deterministic hash stored in localStorage so offline re-validation works.

function b64url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
}
function b64urlDecode(str) {
  str = str.replace(/-/g,'+').replace(/_/g,'/')
  while (str.length % 4) str += '='
  try { return decodeURIComponent(escape(atob(str))) } catch { return null }
}

// Build a JWT-like token: header.payload.sig
function mintToken(user) {
  const header  = b64url(JSON.stringify({ alg:'HS256', typ:'JWT' }))
  const payload = b64url(JSON.stringify({
    sub:  user.id,
    name: user.name,
    email:user.email,
    plan: user.plan,
    iat:  Math.floor(Date.now()/1000),
    exp:  Math.floor(Date.now()/1000) + 60*60*8, // 8 hours
  }))
  // Deterministic "sig" — XOR of payload bytes encoded as hex
  const raw = user.id + '|' + user.email + '|pagecraft_secret_2024'
  let h = 0
  for (let i=0;i<raw.length;i++) h = (Math.imul(31,h) + raw.charCodeAt(i)) | 0
  const sig = b64url(Math.abs(h).toString(16).padStart(8,'0'))
  return `${header}.${payload}.${sig}`
}

function parseToken(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(b64urlDecode(parts[1]))
    if (!payload || payload.exp < Date.now()/1000) return null // expired
    return payload
  } catch { return null }
}

// ── User store (localStorage) ─────────────────────────────────────────────────
const USER_DB_KEY  = 'pc_users_v1'
const SESSION_KEY  = 'pc_session_v1'

function loadUserDB() {
  try { return JSON.parse(localStorage.getItem(USER_DB_KEY) || '{}') } catch { return {} }
}
function saveUserDB(db) {
  localStorage.setItem(USER_DB_KEY, JSON.stringify(db))
}
function saveSession(token) {
  localStorage.setItem(SESSION_KEY, token)
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
function loadSession() {
  return localStorage.getItem(SESSION_KEY)
}

// ── Auth State — proxy over authStore for backward compatibility ──────────────
// All existing AUTH.user / AUTH.token reads and writes continue to work.
// authStore is the reactive source of truth; AUTH is just its public interface.
const AUTH = new Proxy({}, {
  get(_, key)        { return authStore.getState()[key] },
  set(_, key, value) { authStore.setState({ [key]: value }); return true },
})

// ── Bootstrap — check existing session ───────────────────────────────────────
function authBootstrap() {
  const token   = loadSession()
  const payload = parseToken(token)
  if (payload) {
    AUTH.token = token
    AUTH.user  = { id:payload.sub, name:payload.name, email:payload.email, plan:payload.plan }
    authGrantAccess()
  } else {
    clearSession()
    showAuthGate()
  }
}

// ── Show / hide gate ──────────────────────────────────────────────────────────
function showAuthGate() {
  document.getElementById('auth-gate').classList.remove('hidden')
}
function hideAuthGate() {
  const gate = document.getElementById('auth-gate')
  gate.style.animation = 'none'
  gate.style.opacity   = '0'
  gate.style.transition= 'opacity .25s'
  setTimeout(() => gate.classList.add('hidden'), 250)
}

function authGrantAccess() {
  hideAuthGate()
  renderUserChip()
  // Show CLI button
  const cliBtn = document.getElementById('btn-cli')
  if (cliBtn) cliBtn.style.display = ''
  // Boot PWA now that auth constants (SESSION_KEY etc.) are initialised
  if (typeof pwaBootstrap === 'function') pwaBootstrap()
  // Render the full builder UI
  renderBlocks()
  renderCanvas()
  renderLayers()
  renderPanel()
  // Populate saved components sidebar
  setTimeout(() => {
    if (typeof renderSavedComponentList === 'function') renderSavedComponentList()
  }, 100)
  // Restore auto-saved draft first; open templates picker if none found.
  // Split into two ticks so the builder UI paints before heavy template render.
  setTimeout(() => {
    const restored = restoreAutoSave()
    toast(`Welcome, ${AUTH.user.name.split(' ')[0]}! 👋`, '✦')
    // Defer template picker and plugin hooks to next idle slot
    const defer = window.requestIdleCallback || (fn => setTimeout(fn, 120))
    defer(() => {
      if (!restored) openTemplates()
      PluginSDK._emit('auth:login',   { user: AUTH.user })
      PluginSDK._emit('builder:init', { user: AUTH.user })
    })
  }, 280)
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function authTab(tab) {
  const isLogin = tab === 'login'
  document.getElementById('tab-login').classList.toggle('active', isLogin)
  document.getElementById('tab-register').classList.toggle('active', !isLogin)
  document.getElementById('form-login').style.display    = isLogin ? 'flex' : 'none'
  document.getElementById('form-register').style.display = isLogin ? 'none' : 'flex'
  document.getElementById('auth-switch-hint').innerHTML  = isLogin
    ? `Don't have an account? <span onclick="authTab('register')">Create one free</span>`
    : `Already have an account? <span onclick="authTab('login')">Sign in</span>`
  clearAuthError()
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function showAuthError(msg) {
  const el = document.getElementById('auth-error')
  document.getElementById('auth-error-msg').textContent = msg
  el.classList.add('show')
}
function clearAuthError() {
  document.getElementById('auth-error').classList.remove('show')
}
function setLoading(btnId, on) {
  const btn = document.getElementById(btnId)
  btn.classList.toggle('loading', on)
  btn.disabled = on
}
function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId)
  const show = inp.type === 'password'
  inp.type = show ? 'text' : 'password'
  btn.textContent = show ? '🙈' : '👁'
}

// ── Password strength ─────────────────────────────────────────────────────────
function updateStrength(pw) {
  const fill  = document.getElementById('strength-fill')
  const label = document.getElementById('strength-label')
  const checks = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ]
  const score = checks.filter(Boolean).length
  const configs = [
    { w:'0%',   bg:'transparent',    txt:'Enter a password' },
    { w:'25%',  bg:'var(--danger)',   txt:'Weak' },
    { w:'50%',  bg:'var(--warn)',     txt:'Fair' },
    { w:'75%',  bg:'#60a5fa',        txt:'Good' },
    { w:'100%', bg:'var(--success)', txt:'Strong ✓' },
  ]
  const c = configs[score]
  fill.style.width      = c.w
  fill.style.background = c.bg
  label.textContent     = c.txt
  label.style.color     = c.bg === 'transparent' ? 'var(--muted)' : c.bg
}

// ── Validate helpers ──────────────────────────────────────────────────────────
function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }
function hashPw(pw) {
  // Simple deterministic hash — NOT for production. Use bcrypt on a real server.
  let h = 5381
  for (let i = 0; i < pw.length; i++) h = (h * 33) ^ pw.charCodeAt(i)
  return (h >>> 0).toString(16)
}

// ── Register ──────────────────────────────────────────────────────────────────
function doRegister() {
  clearAuthError()
  const name  = document.getElementById('reg-name').value.trim()
  const email = document.getElementById('reg-email').value.trim().toLowerCase()
  const pw    = document.getElementById('reg-pw').value
  const pw2   = document.getElementById('reg-pw2').value

  // Validation
  if (!name)                          return showAuthError('Please enter your name')
  if (!validateEmail(email))          return showAuthError('Please enter a valid email address')
  if (pw.length < 8)                  return showAuthError('Password must be at least 8 characters')
  if (pw !== pw2)                     return showAuthError('Passwords do not match')

  const db = loadUserDB()
  if (db[email])                      return showAuthError('An account with this email already exists')

  setLoading('btn-register', true)

  // Simulate network latency
  setTimeout(() => {
    const user = {
      id:        'usr_' + Math.random().toString(36).slice(2,10),
      name,
      email,
      pwHash:    hashPw(pw),
      plan:      'Free',
      createdAt: new Date().toISOString(),
    }
    db[email] = user
    saveUserDB(db)

    // Auto-login after registration
    const token = mintToken(user)
    saveSession(token)
    AUTH.token = token
    AUTH.user  = { id:user.id, name:user.name, email:user.email, plan:user.plan }

    setLoading('btn-register', false)
    authGrantAccess()
    toast('Account created successfully!', '🎉')
  }, 900)
}

// ── Login ─────────────────────────────────────────────────────────────────────
function doLogin() {
  clearAuthError()
  const email = document.getElementById('login-email').value.trim().toLowerCase()
  const pw    = document.getElementById('login-pw').value

  if (!validateEmail(email)) return showAuthError('Please enter a valid email address')
  if (!pw)                   return showAuthError('Please enter your password')

  setLoading('btn-login', true)

  setTimeout(() => {
    const db   = loadUserDB()
    const user = db[email]

    if (!user || user.pwHash !== hashPw(pw)) {
      setLoading('btn-login', false)
      showAuthError('Incorrect email or password')
      document.getElementById('login-pw').classList.add('error')
      setTimeout(() => document.getElementById('login-pw').classList.remove('error'), 1500)
      return
    }

    const token = mintToken(user)
    saveSession(token)
    AUTH.token = token
    AUTH.user  = { id:user.id, name:user.name, email:user.email, plan:user.plan }

    setLoading('btn-login', false)
    authGrantAccess()
  }, 800)
}

// ── Demo login ────────────────────────────────────────────────────────────────
function doDemo() {
  clearAuthError()
  setLoading('btn-login', true)
  setLoading('btn-register', true)

  setTimeout(() => {
    const demoUser = {
      id:    'usr_demo',
      name:  'Demo User',
      email: 'demo@pagecraft.io',
      plan:  'Pro',
    }
    const token = mintToken(demoUser)
    saveSession(token)
    AUTH.token = token
    AUTH.user  = demoUser

    setLoading('btn-login', false)
    setLoading('btn-register', false)
    authGrantAccess()
    toast('Signed in as Demo — explore freely!', '⚡')
  }, 600)
}

// ── Logout ────────────────────────────────────────────────────────────────────
function doLogout() {
  clearSession()
  AUTH.user  = null
  AUTH.token = null

  // Reset builder state
  S.sections = []; S.selected = null; S.past = []; S.future = []
  syncH()

  // Re-show gate with fresh animation
  const gate = document.getElementById('auth-gate')
  gate.classList.remove('hidden')
  gate.style.opacity   = '1'
  gate.style.animation = 'authFadeIn .3s ease'

  // Reset forms
  document.getElementById('login-email').value = ''
  document.getElementById('login-pw').value    = ''
  clearAuthError()
  authTab('login')
  closeUserDropdown()
}

// ── User chip ─────────────────────────────────────────────────────────────────
function renderUserChip() {
  const wrap = document.getElementById('user-chip-wrap')
  if (!wrap || !AUTH.user) return
  const initials = AUTH.user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const planColor = AUTH.user.plan === 'Pro' ? '#a78bfa' : 'var(--muted)'

  wrap.innerHTML = `
    <div class="user-chip" id="user-chip" onclick="toggleUserDropdown()">
      <div class="user-avatar">${initials}</div>
      <div>
        <div class="user-name">${AUTH.user.name.split(' ')[0]}</div>
        <div class="user-plan" style="color:${planColor}">${AUTH.user.plan}</div>
      </div>
      <span style="font-size:10px;color:var(--muted);margin-left:2px">▾</span>
      <div class="user-dropdown" id="user-dropdown">
        <div class="ud-item">
          <span class="ud-icon">👤</span>
          <div>
            <div style="font-weight:600;color:var(--text);font-size:12px">${AUTH.user.name}</div>
            <div style="font-size:10px;color:var(--muted)">${AUTH.user.email}</div>
          </div>
        </div>
        <div class="ud-sep"></div>
        <div class="ud-item" onclick="openBillingDashboard();closeUserDropdown()">
          <span class="ud-icon">💳</span> Billing &amp; Invoices
        </div>
        <div class="ud-item" onclick="openActivityLog();closeUserDropdown()">
          <span class="ud-icon">📋</span> Activity Logs
        </div>
        <div class="ud-item" onclick="openCLIPanel();closeUserDropdown()">
          <span class="ud-icon">⌨️</span> CLI Tool
        </div>
        <div class="ud-item" onclick="showJwtDebug()">
          <span class="ud-icon">🔑</span> View JWT Token
        </div>
        <div class="ud-item" onclick="upgradeAccount()">
          <span class="ud-icon">⭐</span> ${AUTH.user.plan === 'Pro' ? 'Pro Plan ✓' : 'Upgrade to Pro'}
        </div>
        <div class="ud-sep"></div>
        <div class="ud-item danger" onclick="doLogout()">
          <span class="ud-icon">→</span> Sign Out
        </div>
      </div>
    </div>`
  // Update the upgrade button visibility
  if (typeof updateUpgradeButton === 'function') updateUpgradeButton()
}

function toggleUserDropdown() {
  const dd = document.getElementById('user-dropdown')
  if (dd) dd.classList.toggle('open')
}
function closeUserDropdown() {
  document.getElementById('user-dropdown')?.classList.remove('open')
}
// Close on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('#user-chip')) closeUserDropdown()
})

// ── JWT debug viewer ──────────────────────────────────────────────────────────
function showJwtDebug() {
  closeUserDropdown()
  if (!AUTH.token) return
  const parts   = AUTH.token.split('.')
  const header  = JSON.parse(b64urlDecode(parts[0]))
  const payload = JSON.parse(b64urlDecode(parts[1]))
  const tokenShort = AUTH.token.slice(0,40)+'…'

  const msg = `
<div style="font-family:monospace;font-size:12px;line-height:1.8">
<b style="color:var(--accent2)">JWT Structure</b><br/>
<b>Header:</b> <span style="color:#34d399">${JSON.stringify(header)}</span><br/>
<b>Payload:</b> <span style="color:#60a5fa">${JSON.stringify(payload,null,0).slice(0,120)}…</span><br/>
<b>Signature:</b> <span style="color:#f9a8d4">${parts[2]}</span><br/>
<b>Expires:</b> ${new Date(payload.exp*1000).toLocaleString()}<br/>
<b>Token:</b> <span style="opacity:.6;font-size:10px">${tokenShort}</span>
</div>`
  // Show in a toast-style panel
  const div = document.createElement('div')
  div.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--border2);border-radius:14px;padding:16px 20px;z-index:9999;max-width:460px;box-shadow:0 8px 32px rgba(0,0,0,.5);animation:authFadeIn .2s ease'
  div.innerHTML = msg + '<div style="margin-top:10px;text-align:right"><button onclick="this.parentElement.parentElement.remove()" style="background:var(--accent);color:#fff;border:none;border-radius:7px;padding:5px 14px;font-size:12px;cursor:pointer">Close</button></div>'
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 8000)
}

// ── Upgrade (demo) ────────────────────────────────────────────────────────────
function upgradeAccount() {
  closeUserDropdown()
  if (AUTH.user.plan === 'Pro') return toast('You\'re already on Pro! 🎉', '⭐')
  toast('Upgrade flow would open here — connecting to payment gateway', '⭐')
}

// ── Protected route guard ─────────────────────────────────────────────────────
// Wraps any function to require auth before executing
function requireAuth(fn, msg = 'Sign in to use this feature') {
  return function(...args) {
    if (!AUTH.user) {
      showAuthGate()
      toast(msg, '🔒')
      return
    }
    return fn.apply(this, args)
  }
}
