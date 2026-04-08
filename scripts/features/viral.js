/* ══════════════════════════════════════════════════════
   STAGE 11 — VIRAL SYSTEM
   Share Links · Clone · Public Gallery · QR Code
══════════════════════════════════════════════════════ */
const ViralSystem = (() => {
  const GALLERY_KEY = 'pc_gallery_v1'
  let _shareOpen = false

  // ── localStorage gallery ──────────────────────────────────────────────────
  function _galleryLoad() { try { return JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]') } catch { return [] } }
  function _gallerySave(d) { localStorage.setItem(GALLERY_KEY, JSON.stringify(d)) }

  // ── Share panel ───────────────────────────────────────────────────────────
  function toggleShare() {
    _shareOpen = !_shareOpen
    const panel = document.getElementById('viral-share-panel')
    if (panel) panel.style.display = _shareOpen ? 'block' : 'none'
  }

  function closeShare() {
    _shareOpen = false
    const panel = document.getElementById('viral-share-panel')
    if (panel) panel.style.display = 'none'
  }

  // ── Generate shareable link (encodes project as base64 URL param) ─────────
  function generateLink() {
    if (!S.sections.length) { toast('Add sections first', '⚠️'); return }
    try {
      const payload = {
        v: 1,
        title: document.getElementById('page-title')?.value || 'My Page',
        sections: S.sections,
      }
      const json     = JSON.stringify(payload)
      const encoded  = btoa(new TextEncoder().encode(json).reduce((s,b) => s + String.fromCharCode(b), ''))
      const url      = `${location.origin}${location.pathname}?clone=${encoded}`
      const input    = document.getElementById('viral-share-url')
      const tip      = document.getElementById('viral-share-tip')
      if (input) input.value = url.length > 2000 ? url.slice(0, 1997) + '…' : url
      if (tip)   tip.textContent = `✅ Link ready — ${S.sections.length} sections encoded. Anyone with this link can clone your design.`
      toast('Share link generated', '🔗')
    } catch(e) { toast('Failed to generate link', '❌') }
  }

  function copyLink() {
    const val = document.getElementById('viral-share-url')?.value
    if (!val || !val.startsWith('http')) { generateLink(); return }
    navigator.clipboard?.writeText(val).then(() => toast('Copied to clipboard!', '📋'))
  }

  // ── Check URL for clone param on load ────────────────────────────────────
  function checkCloneParam() {
    const params  = new URLSearchParams(location.search)
    const encoded = params.get('clone')
    if (!encoded) return
    try {
      const bytes   = Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
      const payload = JSON.parse(new TextDecoder().decode(bytes))
      if (!payload?.sections?.length) return
      _showCloneLanding(payload)
    } catch(e) { console.warn('[ViralSystem] invalid clone param') }
  }

  function _showCloneLanding(payload) {
    const modal = document.getElementById('clone-landing-modal')
    if (!modal) return
    document.getElementById('cln-title').textContent = payload.title || 'Shared Design'
    document.getElementById('cln-meta').textContent  = `${payload.sections.length} sections`
    // Mini section list preview
    const prev = document.getElementById('cln-preview')
    if (prev) {
      prev.innerHTML = payload.sections.slice(0, 6).map(s =>
        `<span class="cln-sec-chip">${s.type}</span>`
      ).join('') + (payload.sections.length > 6 ? `<span class="cln-sec-chip more">+${payload.sections.length - 6}</span>` : '')
    }
    const useBtn = document.getElementById('cln-btn-use')
    if (useBtn) useBtn.onclick = () => _applyClone(payload)
    modal.classList.remove('hidden')
  }

  function _applyClone(payload) {
    document.getElementById('clone-landing-modal')?.classList.add('hidden')
    pushH('Clone from link')
    S.sections = payload.sections.map(s => ({ ...s, id: uid() }))
    S.selected = null
    const t = document.getElementById('page-title')
    if (t && payload.title) t.value = payload.title
    renderAll()
    toast(`"${payload.title}" cloned!`, '⧉')
    history.replaceState({}, '', location.pathname)
    _pendingClone = null
  }

  // ── Clone current page (duplicate into a new in-memory session) ───────────
  function clonePage() {
    if (!S.sections.length) { toast('Add sections first', '⚠️'); return }
    const cloned = S.sections.map(s => ({ ...s, id: uid(), props: { ...s.props } }))
    // Save clone as a project
    const title = (document.getElementById('page-title')?.value || 'My Page') + ' (Clone)'
    const db    = loadAllProjects ? loadAllProjects() : {}
    const pid   = 'proj_' + Date.now()
    db[pid]     = { id: pid, title, sections: cloned, pages: [], createdAt: new Date().toISOString() }
    if (typeof saveAllProjects === 'function') saveAllProjects(db)
    toast(`Cloned as "${title}"`, '⧉')
  }

  // ── Save to local gallery ─────────────────────────────────────────────────
  function saveToGallery() {
    if (!S.sections.length) { toast('Add sections first', '⚠️'); return }
    const name = prompt('Gallery entry name:', document.getElementById('page-title')?.value || 'My Design')
    if (!name) return
    const all   = _galleryLoad()
    const entry = {
      id:        'gal_' + Date.now(),
      name,
      thumb:     _pickThumb(),
      thumbBg:   _pickGradient(),
      sections:  JSON.parse(JSON.stringify(S.sections)),
      pageTitle: document.getElementById('page-title')?.value || '',
      savedAt:   new Date().toISOString(),
      views:     0,
      clones:    0,
    }
    all.unshift(entry)
    _gallerySave(all.slice(0, 50))  // max 50 gallery entries
    toast(`"${name}" added to Gallery`, '⭐')
  }

  // ── Open gallery modal ────────────────────────────────────────────────────
  function openGallery() {
    document.getElementById('gallery-modal')?.classList.remove('hidden')
    _renderGallery()
  }

  function _renderGallery() {
    const grid = document.getElementById('gallery-grid')
    if (!grid) return
    const all = _galleryLoad()
    if (!all.length) {
      grid.innerHTML = `<div class="gallery-empty" style="grid-column:1/-1">
        <div style="font-size:48px;margin-bottom:12px">🌐</div>
        <div style="font-weight:700;margin-bottom:6px">Gallery is empty</div>
        <div>Share your pages to build your gallery</div>
        <button class="btn" style="margin-top:16px" onclick="ViralSystem.saveToGallery()">+ Share My Page</button>
      </div>`
      return
    }
    grid.innerHTML = all.map(entry => `
      <div class="gallery-card">
        <div class="gallery-card-thumb" style="background:${entry.thumbBg}">${entry.thumb}</div>
        <div class="gallery-card-info">
          <div class="gallery-card-name">${entry.name}</div>
          <div class="gallery-card-meta">${entry.sections.length} sections · ${_timeAgo(entry.savedAt)}</div>
        </div>
        <div class="gallery-card-actions">
          <button class="gallery-card-btn primary" onclick="ViralSystem.cloneFromGallery('${entry.id}')">⧉ Use This</button>
          <button class="gallery-card-btn" onclick="ViralSystem.deleteFromGallery('${entry.id}')">🗑 Delete</button>
        </div>
      </div>`).join('')
  }

  function cloneFromGallery(id) {
    const entry = _galleryLoad().find(e => e.id === id)
    if (!entry) return
    const ok = S.sections.length
      ? confirm(`Replace current canvas with "${entry.name}"?`)
      : true
    if (!ok) return
    pushH('Clone from gallery')
    S.sections = entry.sections.map(s => ({ ...s, id: uid() }))
    S.selected = null
    const t = document.getElementById('page-title')
    if (t && entry.pageTitle) t.value = entry.pageTitle
    renderAll()
    document.getElementById('gallery-modal')?.classList.add('hidden')
    toast(`"${entry.name}" loaded`, '⧉')
    // Increment clone count
    const all = _galleryLoad()
    const idx = all.findIndex(e => e.id === id)
    if (idx > -1) { all[idx].clones = (all[idx].clones || 0) + 1; _gallerySave(all) }
  }

  function deleteFromGallery(id) {
    _gallerySave(_galleryLoad().filter(e => e.id !== id))
    _renderGallery()
    toast('Removed from gallery', '🗑')
  }

  // ── QR Code (uses free API) ───────────────────────────────────────────────
  function exportQR() {
    const url = document.getElementById('viral-share-url')?.value
    if (!url || url === 'Generate a link…') { generateLink(); setTimeout(exportQR, 300); return }
    // Open QR in new tab using goqr.me free API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
    window.open(qrUrl, '_blank')
    toast('QR Code opened', '📱')
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _pickThumb() {
    const icons = ['🌟','🚀','💎','🎨','⚡','🔥','✨','🎯','💫','🌈']
    const types = S.sections.map(s => s.type)
    if (types.includes('hero'))        return '🦸'
    if (types.includes('product-grid')) return '🛍'
    if (types.includes('pricing'))     return '💰'
    if (types.includes('gallery'))     return '🖼'
    return icons[Math.floor(Math.random() * icons.length)]
  }

  function _pickGradient() {
    const grads = [
      'linear-gradient(135deg,#6c63ff,#a78bfa)',
      'linear-gradient(135deg,#0ea5e9,#6366f1)',
      'linear-gradient(135deg,#f59e0b,#ef4444)',
      'linear-gradient(135deg,#10b981,#0ea5e9)',
      'linear-gradient(135deg,#ec4899,#8b5cf6)',
    ]
    return grads[Math.floor(Math.random() * grads.length)]
  }

  function _timeAgo(iso) {
    const d = new Date(iso), now = Date.now()
    const diff = now - d.getTime()
    if (diff < 60000)   return 'just now'
    if (diff < 3600000) return Math.floor(diff/60000) + 'm ago'
    if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago'
    return Math.floor(diff/86400000) + 'd ago'
  }

  // ── Social share ──────────────────────────────────────────────────────────
  function shareToTwitter() {
    const url  = document.getElementById('viral-share-url')?.value
    const title = document.getElementById('page-title')?.value || 'My Page'
    if (!url || url.startsWith('Click')) { generateLink(); setTimeout(shareToTwitter, 500); return }
    const text = encodeURIComponent(`Check out "${title}" — built with PageCraft ⚡`)
    const link = encodeURIComponent(url)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${link}`, '_blank', 'width=600,height=400')
  }

  function shareToLinkedIn() {
    const url = document.getElementById('viral-share-url')?.value
    if (!url || url.startsWith('Click')) { generateLink(); setTimeout(shareToLinkedIn, 500); return }
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500')
  }

  // ── Init: check for clone param ───────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', checkCloneParam, { once: true })

  return { toggleShare, closeShare, generateLink, copyLink, clonePage, saveToGallery, openGallery, cloneFromGallery, deleteFromGallery, exportQR, shareToTwitter, shareToLinkedIn }
})()
window.PageCraft.ViralSystem = ViralSystem
