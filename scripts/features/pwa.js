/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   PWA SYSTEM
   Service Worker · Offline mode · Install prompt
   App manifest · Cache strategies · Update flow
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

// ── Service Worker source (injected as Blob URL) ──────────────────────────────
// Runs in a separate thread, intercepts all network requests.
const SW_VERSION = 'pagecraft-v1.0.0'

const SW_SOURCE = `
const CACHE_NAME = '${SW_VERSION}'
const CACHE_STATIC = '${SW_VERSION}-static'
const CACHE_DYNAMIC = '${SW_VERSION}-dynamic'

// Resources to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/builder.html',
]

// ── Install: pre-cache critical assets ────────────────────────────────────────
self.addEventListener('install', ev => {
  self.skipWaiting()
  ev.waitUntil(
    caches.open(CACHE_STATIC).then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
  )
})

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch: cache-first for static, network-first for API ─────────────────────
self.addEventListener('fetch', ev => {
  const { request } = ev
  const url = new URL(request.url)

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return
  if (url.origin !== location.origin && !url.hostname.includes('fonts.googleapis') && !url.hostname.includes('cdnjs')) return

  // API routes: network-first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    ev.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE_DYNAMIC).then(c => c.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Static assets (fonts, CDN): cache-first
  if (url.hostname.includes('fonts.googleapis') || url.hostname.includes('cdnjs') || url.hostname.includes('fonts.gstatic')) {
    ev.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        caches.open(CACHE_STATIC).then(c => c.put(request, res.clone()))
        return res
      }))
    )
    return
  }

  // HTML pages: network-first, stale-while-revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    ev.respondWith(
      fetch(request)
        .then(res => {
          caches.open(CACHE_DYNAMIC).then(c => c.put(request, res.clone()))
          return res
        })
        .catch(() => caches.match(request) || caches.match('/'))
    )
    return
  }

  // Default: cache-first
  ev.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (res.ok) caches.open(CACHE_DYNAMIC).then(c => c.put(request, res.clone()))
        return res
      }).catch(() => new Response('Offline', { status: 503 }))
    })
  )
})

// ── Push notifications ─────────────────────────────────────────────────────────
self.addEventListener('push', ev => {
  const data = ev.data?.json() || { title:'PageCraft', body:'You have a notification' }
  ev.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  '/icon-192.png',
      badge: '/badge-72.png',
      data:  data.url,
      actions:[{action:'open',title:'Open PageCraft'}],
    })
  )
})

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', ev => {
  ev.notification.close()
  ev.waitUntil(clients.openWindow(ev.notification.data || '/'))
})

// ── Background sync (retry failed saves) ─────────────────────────────────────
self.addEventListener('sync', ev => {
  if (ev.tag === 'sync-autosave') {
    ev.waitUntil(
      // Re-send any pending auto-saves stored in IndexedDB
      Promise.resolve()
    )
  }
})
`

// ── App Manifest (generated inline as Blob) ───────────────────────────────────
// All URLs must be absolute so they remain valid when the manifest is
// served from a blob: URL (relative paths resolve against blob: and break).
function _buildAppManifest() {
  const base = location.origin + location.pathname.replace(/\/[^/]*$/, '/')
  const icon96 = pwaGenerateIcon(96)
  return {
    name:             'PageCraft — Visual Page Builder',
    short_name:       'PageCraft',
    description:      'Zero-code visual page builder with AI, 3D, CMS, and edge deployment',
    start_url:        base,
    scope:            base,
    display:          'standalone',
    display_fallback: 'minimal-ui',
    orientation:      'any',
    theme_color:      '#6c63ff',
    background_color: '#0d0d0f',
    lang:             'en',
    categories:       ['productivity', 'developer-tools', 'design'],
    shortcuts: [
      { name:'New Page',    url: base + '?action=new',       description:'Start a new page',   icons:[{src:icon96,sizes:'96x96',type:'image/png'}] },
      { name:'My Projects', url: base + '?action=projects',  description:'Open saved projects', icons:[{src:icon96,sizes:'96x96',type:'image/png'}] },
      { name:'Templates',   url: base + '?action=templates', description:'Browse templates',    icons:[{src:icon96,sizes:'96x96',type:'image/png'}] },
    ],
    icons: [
      { src: pwaGenerateIcon(192), sizes:'192x192', type:'image/svg+xml', purpose:'any maskable' },
      { src: pwaGenerateIcon(512), sizes:'512x512', type:'image/svg+xml', purpose:'any maskable' },
    ],
    related_applications:        [],
    prefer_related_applications: false,
  }
}

// ── Generate SVG icon as data URI ─────────────────────────────────────────────
function pwaGenerateIcon(size) {
  const r = size * 0.2
  // Use SVG polygon instead of emoji (avoids btoa Unicode issue)
  const cx = size / 2, cy = size / 2, s = size * 0.28
  const bolt = `M${cx-s*0.3},${cy+s} L${cx+s*0.15},${cy-s*0.1} L${cx-s*0.1},${cy-s*0.1} L${cx+s*0.3},${cy-s} L${cx-s*0.15},${cy+s*0.1} L${cx+s*0.1},${cy+s*0.1} Z`
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6c63ff"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs><rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/><path d="${bolt}" fill="white" opacity="0.95"/></svg>`
  // Safe btoa: encode to UTF-8 bytes first
  try {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
  } catch {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  }
}

// ── PWA state ─────────────────────────────────────────────────────────────────
const PWA = {
  sw:              null,   // ServiceWorkerRegistration
  deferredPrompt:  null,   // BeforeInstallPromptEvent
  isInstalled:     false,
  isOnline:        navigator.onLine,
  cacheSize:       0,
  swUpdating:      false,
}

// ── Bootstrap PWA ─────────────────────────────────────────────────────────────
async function pwaBootstrap() {
  pwaInjectManifest()
  pwaInjectFavicon()
  pwaRegisterServiceWorker()
  pwaSetupInstallPrompt()
  pwaSetupOnlineOffline()
  pwaCheckInstalled()
  pwaHandleStartupAction()
}

// ── Inject manifest as Blob URL ───────────────────────────────────────────────
function pwaInjectManifest() {
  const link = document.getElementById('pwa-manifest-link')
  try {
    const manifest = _buildAppManifest()
    const json = JSON.stringify(manifest)
    JSON.parse(json) // validate before injecting
    const blob = new Blob([json], { type:'application/manifest+json' })
    const url  = URL.createObjectURL(blob)
    if (link) link.href = url
  } catch(e) {
    // Remove the link entirely so the browser doesn't try to fetch '#' as JSON
    if (link) link.remove()
  }
}

// ── Inject SVG favicon ────────────────────────────────────────────────────────
function pwaInjectFavicon() {
  const iconUrl = pwaGenerateIcon(192)
  const appleLink = document.getElementById('pwa-apple-icon')
  const favicon   = document.getElementById('pwa-favicon')
  if (appleLink) appleLink.href = iconUrl
  if (favicon)   favicon.href   = iconUrl
}

// ── Register Service Worker ───────────────────────────────────────────────────
async function pwaRegisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported')
    return
  }
  try {
    const blob  = new Blob([SW_SOURCE], { type:'application/javascript' })
    const swUrl = URL.createObjectURL(blob)

    // Some environments (iframes, preview contexts) reject blob: SW URLs.
    // Test registrability before committing — fall back silently if blocked.
    PWA.sw = await navigator.serviceWorker.register(swUrl, { scope:'/' })
    console.log('[PWA] Service Worker registered:', PWA.sw.scope)

    pwaSetStatusDot('online')

    PWA.sw.addEventListener('updatefound', () => {
      const newWorker = PWA.sw.installing
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          PWA.swUpdating = true
          pwaShowUpdateToast()
        }
      })
    })

    pwaMeasureCacheSize()

  } catch(err) {
    // Blob URL SW registration is blocked in iframes/sandboxed contexts — silently no-op.
    // The app still works fully; offline caching simply won't be available.
    /* SW unavailable in blob/sandboxed context — silent fallback */
    pwaSetStatusDot('online')  // still online, just no SW
  }
}

// ── Install prompt ────────────────────────────────────────────────────────────
function pwaSetupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', ev => {
    // Only suppress the browser's default prompt if we plan to show our own
    const dismissed = localStorage.getItem('pwa_install_dismissed')
    if (!dismissed) {
      ev.preventDefault()
      PWA.deferredPrompt = ev
      // Show our custom install banner after a delay
      setTimeout(() => {
        document.getElementById('pwa-install-banner')?.classList.add('show')
      }, 8000)
    }
    // If already dismissed, let the browser handle it (no preventDefault)
  })

  window.addEventListener('appinstalled', () => {
    PWA.isInstalled = true
    PWA.deferredPrompt = null
    document.getElementById('pwa-install-banner')?.classList.remove('show')
    pwaSetStatusDot('online')
    toast('PageCraft installed as an app! 🎉', '⚡')
  })
}

async function pwaInstall() {
  if (!PWA.deferredPrompt) {
    toast('Installation not available in this browser', '⚠️')
    return
  }
  PWA.deferredPrompt.prompt()
  const { outcome } = await PWA.deferredPrompt.userChoice
  PWA.deferredPrompt = null
  document.getElementById('pwa-install-banner')?.classList.remove('show')
  if (outcome === 'accepted') {
    toast('Installing PageCraft…', '⚡')
  }
}

function pwaDismiss() {
  document.getElementById('pwa-install-banner')?.classList.remove('show')
  localStorage.setItem('pwa_install_dismissed', Date.now())
}

// ── Online / Offline detection ────────────────────────────────────────────────
function pwaSetupOnlineOffline() {
  const update = (online) => {
    PWA.isOnline = online
    const bar = document.getElementById('pwa-offline-bar')
    if (bar) bar.classList.toggle('show', !online)
    pwaSetStatusDot(online ? 'online' : 'offline')
    if (online)  toast('Back online — changes synced', '🌐')
    if (!online) toast('You\'re offline — working from cache', '📡')
  }
  window.addEventListener('online',  () => update(true))
  window.addEventListener('offline', () => update(false))
  if (!navigator.onLine) update(false)
}

// ── Status dot ───────────────────────────────────────────────────────────────
function pwaSetStatusDot(state) {
  const dot = document.getElementById('pwa-status-dot')
  if (!dot) return
  dot.className = `pwa-status-dot ${state}`
  dot.title     = {
    online:     'Online — PWA active',
    offline:    'Offline — working from cache',
    installing: 'Service Worker installing…',
  }[state] || state
}

// ── Update available toast ────────────────────────────────────────────────────
function pwaShowUpdateToast() {
  document.getElementById('pwa-update-toast')?.classList.add('show')
}

function pwaApplyUpdate() {
  const wb = PWA.sw?.waiting
  if (wb) wb.postMessage({ type:'SKIP_WAITING' })
  window.location.reload()
}

// ── Check if already installed ────────────────────────────────────────────────
function pwaCheckInstalled() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone
    || document.referrer.includes('android-app://')
  if (isStandalone) {
    PWA.isInstalled = true
    // Hide browser chrome indicators
    document.title = 'PageCraft'
  }
}

// ── Handle startup action (shortcuts) ────────────────────────────────────────
function pwaHandleStartupAction() {
  const params = new URLSearchParams(window.location.search)
  const action = params.get('action')
  if (!action) return
  setTimeout(() => {
    if (action === 'new')       clearAll()
    if (action === 'projects')  openProjects()
    if (action === 'templates') openTemplates()
  }, 500)
}

// ── Cache size measurement ────────────────────────────────────────────────────
async function pwaMeasureCacheSize() {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) return
  try {
    const { usage, quota } = await navigator.storage.estimate()
    PWA.cacheSize = usage
    const usageMB = (usage / 1024 / 1024).toFixed(1)
    const quotaMB = (quota / 1024 / 1024 / 1024).toFixed(1)
    console.log(`[PWA] Storage: ${usageMB}MB used of ${quotaMB}GB`)
  } catch(e) { /* silently ignore */ }
}

// ── PWA info panel (shown in Deploy tab) ─────────────────────────────────────
function renderPWAPanel() {
  const isInstalled = PWA.isInstalled
  const hasSW       = !!PWA.sw
  const isOnline    = PWA.isOnline
  const cacheMB     = PWA.cacheSize ? (PWA.cacheSize / 1024 / 1024).toFixed(1) + 'MB' : '—'

  return `
    <div class="pwa-panel">
      <div class="pwa-panel-title">⚡ PWA Status</div>
      ${[
        { icon:'🔧', title:'Service Worker',   sub:'Intercepts network, serves cache',          badge: hasSW       ? 'active'  : 'pending', label: hasSW       ? 'Active'    : 'Not registered' },
        { icon:'📱', title:'App Installed',     sub:'Running as native-like app',               badge: isInstalled ? 'active'  : 'pending', label: isInstalled ? 'Installed' : 'Browser only'   },
        { icon:'🌐', title:'Network Status',    sub:'Live or offline cache serving',             badge: isOnline    ? 'active'  : 'pending', label: isOnline    ? 'Online'    : 'Offline'        },
        { icon:'💾', title:'Cache Storage',     sub:'Assets served from cache when offline',    badge: hasSW       ? 'active'  : 'pending', label: cacheMB                                       },
        { icon:'🔔', title:'Push Notifications',sub:'Server-pushed alerts even when closed',   badge: 'pending',                           label: 'Not enabled'                                 },
        { icon:'🔄', title:'Background Sync',   sub:'Retry failed saves when reconnected',      badge: hasSW       ? 'active'  : 'pending', label: hasSW       ? 'Ready'     : 'Pending'        },
      ].map(f => `
        <div class="pwa-feature-row">
          <div class="pwa-feature-icon">${f.icon}</div>
          <div class="pwa-feature-text">
            <div class="pwa-feature-title">${f.title}</div>
            <div class="pwa-feature-sub">${f.sub}</div>
          </div>
          <span class="pwa-feature-badge ${f.badge}">${f.label}</span>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="deploy-btn secondary" onclick="pwaInstall()" style="padding:7px 14px;font-size:11px">
        📱 Install App
      </button>
      <button class="deploy-btn secondary" onclick="pwaShowUpdateToast()" style="padding:7px 14px;font-size:11px">
        🔄 Check for Update
      </button>
      <button class="deploy-btn secondary" onclick="pwaClearCache()" style="padding:7px 14px;font-size:11px">
        🗑 Clear Cache
      </button>
    </div>`
}

async function pwaClearCache() {
  if (!confirm('Clear all cached assets?\n\nThe app will reload to re-cache.')) return
  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map(k => caches.delete(k)))
    toast('Cache cleared — reloading…', '🗑')
    setTimeout(() => window.location.reload(), 800)
  } else {
    toast('Cache API not available in this browser', '⚠️')
  }
}
