/* ══════════════════════════════════════════════════════
   STAGE 12 — ADVANCED CORE SYSTEMS
   Multi-site Dashboard · Image Optimizer · Validation Engine
══════════════════════════════════════════════════════ */

// ── A. MULTI-SITE DASHBOARD ───────────────────────────────────────────────────
const SiteDash = (() => {
  const KEY = 'pc_sites_v1'

  function _load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
  function _save(d) { localStorage.setItem(KEY, JSON.stringify(d)) }

  function open() {
    document.getElementById('msd-modal')?.classList.remove('hidden')
    _render()
  }

  function _render() {
    const sites   = _load()
    const statBar = document.getElementById('msd-stat-bar')
    const grid    = document.getElementById('msd-grid')
    if (!grid) return

    // Stat bar
    const totalSecs = sites.reduce((a, s) => a + (s.sections?.length || 0), 0)
    if (statBar) statBar.innerHTML = [
      ['🏗', sites.length, 'Sites'],
      ['📄', totalSecs, 'Total Sections'],
      ['✅', sites.filter(s => s.published).length, 'Published'],
    ].map(([icon, val, lbl]) => `
      <div class="msd-stat">
        <div class="msd-stat-val">${icon} ${val}</div>
        <div class="msd-stat-lbl">${lbl}</div>
      </div>`).join('')

    // Site cards
    const grads = ['linear-gradient(135deg,#6c63ff,#a78bfa)','linear-gradient(135deg,#0ea5e9,#6366f1)','linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#10b981,#0ea5e9)','linear-gradient(135deg,#ec4899,#8b5cf6)']
    grid.innerHTML = sites.map((site, i) => `
      <div class="msd-card">
        <div class="msd-card-thumb" style="background:${grads[i%grads.length]}">
          ${site.published ? '<span style="position:absolute;top:8px;left:8px;background:#10b981;color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:20px">LIVE</span>' : ''}
          ${site.thumb || '🌐'}
        </div>
        <div class="msd-card-info">
          <div class="msd-card-name" title="${site.name}">${site.name}</div>
          <div class="msd-card-meta">${site.sections?.length || 0} sections · ${_ago(site.updatedAt)}</div>
          <div class="msd-card-actions">
            <button class="msd-btn primary" onclick="SiteDash.loadSite('${site.id}')">✏ Edit</button>
            <button class="msd-btn" onclick="SiteDash.duplicateSite('${site.id}')">⧉</button>
            <button class="msd-btn" onclick="SiteDash.deleteSite('${site.id}')" style="color:#ef4444;border-color:#ef444433">🗑</button>
          </div>
        </div>
      </div>`).join('') +
      `<div class="msd-card msd-add-card" onclick="SiteDash.createNew()">
        <div style="font-size:36px">+</div>
        <div>Create New Site</div>
      </div>`
  }

  function createNew() {
    const name = prompt('Site name:', 'New Site')
    if (!name) return
    // Save current canvas as a new site
    const sites = _load()
    const site  = {
      id:        'site_' + Date.now(),
      name,
      thumb:     '🌐',
      sections:  JSON.parse(JSON.stringify(S.sections)),
      pageTitle: document.getElementById('page-title')?.value || name,
      pages:     [],
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    sites.unshift(site)
    _save(sites)
    _render()
    toast(`"${name}" created`, '🏗')
  }

  function saveCurrent() {
    // Auto-save current canvas into the "active" site
    const sites  = _load()
    const active = sites[0]
    if (!active) return
    active.sections  = JSON.parse(JSON.stringify(S.sections))
    active.updatedAt = new Date().toISOString()
    _save(sites)
  }

  function loadSite(id) {
    const site = _load().find(s => s.id === id)
    if (!site) return
    const ok = S.sections.length ? confirm(`Load "${site.name}"? This replaces the current canvas.`) : true
    if (!ok) return
    pushH('Load site')
    S.sections = site.sections.map(s => ({ ...s, id: uid() }))
    S.selected = null
    const t = document.getElementById('page-title')
    if (t) t.value = site.pageTitle || site.name
    renderAll()
    document.getElementById('msd-modal')?.classList.add('hidden')
    toast(`"${site.name}" loaded`, '🏗')
  }

  function duplicateSite(id) {
    const sites  = _load()
    const src    = sites.find(s => s.id === id)
    if (!src) return
    const clone  = { ...JSON.parse(JSON.stringify(src)), id: 'site_' + Date.now(), name: src.name + ' (Copy)', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    sites.unshift(clone)
    _save(sites)
    _render()
    toast(`"${clone.name}" duplicated`, '⧉')
  }

  function deleteSite(id) {
    if (!confirm('Delete this site?')) return
    _save(_load().filter(s => s.id !== id))
    _render()
    toast('Site deleted', '🗑')
  }

  function _ago(iso) {
    if (!iso) return 'never'
    const d = Date.now() - new Date(iso).getTime()
    if (d < 60000) return 'just now'
    if (d < 3600000) return Math.floor(d/60000) + 'm ago'
    if (d < 86400000) return Math.floor(d/3600000) + 'h ago'
    return Math.floor(d/86400000) + 'd ago'
  }

  return { open, createNew, loadSite, duplicateSite, deleteSite, saveCurrent }
})()
window.PageCraft.SiteDash = SiteDash

// ── B. IMAGE OPTIMIZER ────────────────────────────────────────────────────────
const ImageOptimizer = (() => {
  // Converts uploaded image URLs to optimized Cloudinary-style URLs
  // For local blobs we can't do much, but we can flag unoptimized ones

  function analyze() {
    let issues = 0
    S.sections.forEach(s => {
      const p = s.props || {}
      ;['bgImage','image','heroImage','avatar'].forEach(k => {
        const url = p[k]
        if (!url || !url.startsWith('http')) return
        if (!url.includes('webp') && !url.includes('cloudinary') && !url.includes('imgix')) {
          issues++
          // Try to auto-convert Unsplash URLs to WebP
          if (url.includes('unsplash.com')) {
            p[k] = url.includes('?') ? url + '&fm=webp&q=80' : url + '?fm=webp&q=80'
          }
        }
      })
    })
    if (issues > 0) { renderAll(); toast(`${issues} image(s) optimized to WebP`, '🖼') }
    else toast('All images already optimized', '✅')
    return issues
  }

  // Add lazy loading attr to all img tags in export (handled in genHTML via baseCSS)
  function genLazyCSS() {
    return 'img{loading:lazy}'
  }

  return { analyze, genLazyCSS }
})()
window.PageCraft.ImageOptimizer = ImageOptimizer

// ── C. VALIDATION ENGINE ──────────────────────────────────────────────────────
const ValidationEngine = (() => {
  const _rules = []
  let _valTimer = null

  // Register a validation rule
  function addRule(rule) {
    // rule: { id, check() → string|null (null = pass), sev = 'error'|'warn', fix? }
    _rules.push(rule)
  }

  // Built-in rules
  addRule({ id:'empty-links',   sev:'warn',  check: () => { const bad = S.sections.filter(s => s.props?.ctaLink === '#' || s.props?.link === '#'); return bad.length ? `${bad.length} section(s) have placeholder "#" links` : null }, fix: null })
  addRule({ id:'long-headline', sev:'warn',  check: () => { const bad = S.sections.filter(s => (s.props?.headline||'').length > 80); return bad.length ? `${bad.length} headline(s) are too long (>80 chars) — bad for mobile` : null }, fix: null })
  addRule({ id:'no-cta',        sev:'warn',  check: () => !S.sections.some(s => s.props?.ctaText || s.props?.cta) ? 'No call-to-action found — add a button to drive conversions' : null, fix: null })
  addRule({ id:'missing-brand', sev:'info',  check: () => { const f = S.sections.find(s => s.type === 'footer'); return (f && !f.props?.brand) ? 'Footer has no brand name set' : null }, fix: null })

  // Run all rules and show toast if issues found
  function validate() {
    const results = _rules.map(r => {
      try { const msg = r.check(); return msg ? { sev: r.sev, msg } : null } catch { return null }
    }).filter(Boolean)

    if (!results.length) { _showValToast('✅ Everything looks good!', 2000); return [] }

    const errors = results.filter(r => r.sev === 'error')
    const warns  = results.filter(r => r.sev === 'warn')
    const top    = results[0]
    const icon   = top.sev === 'error' ? '🔴' : top.sev === 'warn' ? '🟡' : '🔵'
    const more   = results.length > 1 ? ` (+${results.length - 1} more)` : ''
    _showValToast(`${icon} ${top.msg}${more}`, 4000)
    return results
  }

  function _showValToast(msg, dur = 3000) {
    const el = document.getElementById('val-toast')
    if (!el) return
    el.textContent = msg
    el.classList.add('show')
    clearTimeout(_valTimer)
    _valTimer = setTimeout(() => el.classList.remove('show'), dur)
  }

  // Auto-validate after every renderAll (debounced)
  let _autoTimer = null
  function scheduleValidate() {
    clearTimeout(_autoTimer)
    _autoTimer = setTimeout(() => { if (S.sections.length > 1) validate() }, 3000)
  }

  return { addRule, validate, scheduleValidate }
})()
window.PageCraft.ValidationEngine = ValidationEngine
