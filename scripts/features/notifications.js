/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   NOTIFICATION SYSTEM
   In-app notification centre + email preference engine.
   Types: info | success | warning | error | collab |
          billing | system
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

const NotifSystem = (() => {
  const KEY      = 'pc_notifs_v1'
  const PREF_KEY = 'pc_notif_prefs_v1'
  const MAX      = 60

  // ── Type metadata ─────────────────────────────────────────────────────────
  const TYPES = {
    info:    { icon:'ℹ️',  label:'Info'        },
    success: { icon:'✅',  label:'Success'      },
    warning: { icon:'⚠️',  label:'Warning'      },
    error:   { icon:'🔴',  label:'Error'        },
    collab:  { icon:'👥',  label:'Collaboration' },
    billing: { icon:'💳',  label:'Billing'      },
    system:  { icon:'⚙️',  label:'System'       },
  }

  // ── Storage ───────────────────────────────────────────────────────────────
  function _key() {
    return KEY + '_' + (AUTH?.user?.id || 'guest')
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(_key()) || '[]') } catch { return [] }
  }
  function save(list) {
    localStorage.setItem(_key(), JSON.stringify(list.slice(0, MAX)))
  }

  // ── Email prefs ───────────────────────────────────────────────────────────
  const DEFAULT_PREFS = {
    project_saved:    false,
    member_invited:   true,
    billing_event:    true,
    collab_joined:    true,
    system_update:    true,
    weekly_digest:    true,
  }
  function loadPrefs() {
    try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') } }
    catch { return { ...DEFAULT_PREFS } }
  }
  function savePrefs(p) { localStorage.setItem(PREF_KEY, JSON.stringify(p)) }

  // ── Core API ──────────────────────────────────────────────────────────────
  /**
   * Push a new notification.
   * @param {string} type  - info | success | warning | error | collab | billing | system
   * @param {string} title
   * @param {string} body
   * @param {object} [opts] - { action, actionLabel, emailKey }
   */
  function push(type, title, body, opts = {}) {
    const list = load()
    const notif = {
      id:          'n_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      type:        TYPES[type] ? type : 'info',
      title,
      body,
      read:        false,
      ts:          new Date().toISOString(),
      action:      opts.action      || null,
      actionLabel: opts.actionLabel || null,
    }
    list.unshift(notif)
    save(list)

    // Simulate email if pref enabled
    if (opts.emailKey) _simulateEmail(opts.emailKey, notif)

    _updateBadge()
    renderNotifPanel()
    return notif
  }

  function markRead(id) {
    save(load().map(n => n.id === id ? { ...n, read: true } : n))
    _updateBadge()
    renderNotifPanel()
  }

  function markAllRead() {
    save(load().map(n => ({ ...n, read: true })))
    _updateBadge()
  }

  function remove(id) {
    save(load().filter(n => n.id !== id))
    _updateBadge()
    renderNotifPanel()
  }

  function clearAll() {
    save([])
    _updateBadge()
  }

  function unreadCount() {
    return load().filter(n => !n.read).length
  }

  // ── Badge ─────────────────────────────────────────────────────────────────
  function _updateBadge() {
    const cnt   = unreadCount()
    const badge = document.getElementById('notif-badge')
    if (!badge) return
    badge.textContent = cnt > 9 ? '9+' : String(cnt)
    badge.classList.toggle('hidden', cnt === 0)
  }

  // ── Email simulation ──────────────────────────────────────────────────────
  // In production this would POST to your email service (SendGrid, Resend, etc.)
  // Here we log and push a system notification confirming the "send".
  function _simulateEmail(key, notif) {
    const prefs = loadPrefs()
    if (!prefs[key]) return           // user opted out
    if (!AUTH?.user?.email) return
    console.debug(`[Notif] Email queued → ${AUTH.user.email}: "${notif.title}"`)
    // Show a tiny confirmation after 1.5 s (simulates server round-trip)
    setTimeout(() => {
      const el = document.getElementById('notif-email-sent')
      if (el) { el.textContent = `📧 Email sent to ${AUTH.user.email}`; el.style.opacity='1'; setTimeout(()=>el.style.opacity='0',3000) }
    }, 1500)
  }

  return { push, markRead, markAllRead, remove, clearAll, unreadCount,
           load, loadPrefs, savePrefs, TYPES, _updateBadge }
})()

// ── Render the notification panel ─────────────────────────────────────────────
function renderNotifPanel() {
  const list = document.getElementById('notif-list')
  if (!list) return
  const notifs = NotifSystem.load()

  if (!notifs.length) {
    list.innerHTML = `<div class="notif-empty">
      <div class="notif-empty-icon">🔔</div>
      <div class="notif-empty-txt">You're all caught up!</div>
      <div style="font-size:11px;margin-top:4px">Notifications appear here</div>
    </div>`
    return
  }

  list.innerHTML = notifs.map(n => {
    const meta = NotifSystem.TYPES[n.type] || NotifSystem.TYPES.info
    const ago  = _notifTimeAgo(n.ts)
    return `<div class="notif-item${n.read ? '' : ' unread'}" onclick="NotifSystem.markRead('${n.id}')${n.action ? ';' + n.action : ''}">
      <div class="notif-icon ${n.type}">${meta.icon}</div>
      <div class="notif-content">
        <div class="notif-title">${e(n.title)}</div>
        <div class="notif-body">${e(n.body)}</div>
        <div class="notif-time">${ago}${n.actionLabel ? ` · <span style="color:var(--accent);font-weight:600">${e(n.actionLabel)}</span>` : ''}</div>
      </div>
      <button onclick="event.stopPropagation();NotifSystem.remove('${n.id}')" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:2px 4px;font-size:12px;border-radius:4px;align-self:flex-start" title="Dismiss">✕</button>
    </div>`
  }).join('')
}

function _notifTimeAgo(ts) {
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (secs < 60)   return 'just now'
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`
  return new Date(ts).toLocaleDateString()
}

// ── Toggle panel ──────────────────────────────────────────────────────────────
function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel')
  if (!panel) return
  const isOpen = panel.classList.contains('open')
  if (isOpen) {
    panel.classList.remove('open')
  } else {
    renderNotifPanel()
    panel.classList.add('open')
  }
}

// Close panel on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('#notif-bell-wrap')) {
    document.getElementById('notif-panel')?.classList.remove('open')
  }
})

// ── Email preferences modal ───────────────────────────────────────────────────
function openNotifSettings() {
  document.getElementById('notif-panel')?.classList.remove('open')
  let modal = document.getElementById('notif-pref-modal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'notif-pref-modal'
    modal.className = 'modal-bg hidden'
    modal.style.cssText = 'z-index:5300'
    modal.innerHTML = `
      <div class="modal" style="width:420px">
        <div class="modal-head">
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text)">📧 Email Preferences</div>
            <div style="font-size:11px;color:var(--muted)" id="notif-email-sent" style="opacity:0;transition:opacity .3s"></div>
          </div>
          <button class="modal-x" onclick="closeNotifSettings()">✕</button>
        </div>
        <div class="modal-scroll" id="notif-pref-body"></div>
      </div>`
    modal.addEventListener('click', e => { if (e.target === modal) closeNotifSettings() })
    document.body.appendChild(modal)
  }
  _renderNotifPrefs()
  modal.classList.remove('hidden')
}
function closeNotifSettings() {
  document.getElementById('notif-pref-modal')?.classList.add('hidden')
}

function _renderNotifPrefs() {
  const body  = document.getElementById('notif-pref-body')
  if (!body) return
  const prefs = NotifSystem.loadPrefs()

  const PREF_LABELS = [
    { key:'project_saved',  label:'Project saved',           desc:'Receive email when a project is saved' },
    { key:'member_invited', label:'Team invite accepted',    desc:'When someone joins your workspace' },
    { key:'billing_event',  label:'Billing & invoices',      desc:'Payment receipts and subscription changes' },
    { key:'collab_joined',  label:'Collaborator joined',     desc:'When someone joins your live session' },
    { key:'system_update',  label:'Product updates',         desc:'New features and important announcements' },
    { key:'weekly_digest',  label:'Weekly digest',           desc:'Summary of your activity every Monday' },
  ]

  body.innerHTML = `
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px">
      Emails sent to <strong style="color:var(--text)">${e(AUTH.user?.email || '—')}</strong>
    </div>
    ${PREF_LABELS.map(p => `
      <div class="epref-row">
        <div>
          <div class="epref-label">${p.label}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:1px">${p.desc}</div>
        </div>
        <button class="epref-toggle ${prefs[p.key] ? 'on' : 'off'}"
          onclick="_toggleNotifPref('${p.key}', this)"></button>
      </div>`).join('')}
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);font-size:11px;color:var(--muted)">
      Unsubscribe from all emails by turning off every toggle above.
    </div>
  `
}

function _toggleNotifPref(key, btn) {
  const prefs   = NotifSystem.loadPrefs()
  prefs[key]    = !prefs[key]
  NotifSystem.savePrefs(prefs)
  btn.classList.toggle('on',  prefs[key])
  btn.classList.toggle('off', !prefs[key])
  toast(prefs[key] ? 'Email notifications on' : 'Email notifications off', '📧')
}

// ── Wire notifications into builder events ────────────────────────────────────
;(function() {
  // Show bell after auth
  const _prevGrant3 = window.authGrantAccess
  if (typeof _prevGrant3 === 'function') {
    window.authGrantAccess = function(...a) {
      const r = _prevGrant3(...a)
      const wrap = document.getElementById('notif-bell-wrap')
      if (wrap) wrap.style.display = ''
      NotifSystem._updateBadge()
      // Welcome notification
      if (NotifSystem.load().length === 0) {
        NotifSystem.push('success', 'Welcome to PageCraft! 🎉',
          'Your builder is ready. Explore templates, add sections, and build something great.',
          { emailKey: 'system_update' })
      }
      return r
    }
  }

  // Notify on project save
  const _prevSave = window.saveProject
  if (typeof _prevSave === 'function') {
    window.saveProject = function(...a) {
      const r = _prevSave(...a)
      NotifSystem.push('success', 'Project saved',
        `"${S?.pageTitle || 'Untitled'}" was saved successfully.`,
        { emailKey: 'project_saved' })
      return r
    }
  }

  // Notify on plan upgrade (billing)
  const _prevProcess = window.processPayment
  if (typeof _prevProcess === 'function') {
    window.processPayment = async function(...a) {
      const r = await _prevProcess(...a)
      const plan = typeof currentPlan === 'function' ? currentPlan() : ''
      if (plan && plan !== 'free') {
        NotifSystem.push('billing', `Upgraded to ${plan.charAt(0).toUpperCase()+plan.slice(1)}! ⭐`,
          'Your payment was processed. All premium features are now unlocked.',
          { emailKey: 'billing_event' })
      }
      return r
    }
  }

  // Notify when a collaborator joins via PluginSDK
  if (typeof PluginSDK !== 'undefined') {
    PluginSDK._on && PluginSDK._on('collab:join', ({ name }) => {
      NotifSystem.push('collab', `${name || 'Someone'} joined your session`,
        'A collaborator is now editing with you in real time.',
        { emailKey: 'collab_joined' })
    })
  }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.NotifSystem = NotifSystem
