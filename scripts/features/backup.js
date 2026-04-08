/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   BACKUP SYSTEM
   • Manual backups   — snapshot on demand
   • Scheduled backups — auto every 5/15/30/60 min
   • Restore anytime  — pick any snapshot, confirm, apply
   • Export / Import  — download/upload as JSON file
   • Storage          — localStorage pc_backups_v1
   • Max snapshots    — 30 (auto-purge oldest auto backups)
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */
const BackupSystem = (() => {
  const KEY      = 'pc_backups_v1'
  const CFG_KEY  = 'pc_backups_cfg_v1'
  const MAX_AUTO = 25
  const MAX_MAN  = 10

  let _timer = null

  // ── Storage ──────────────────────────────────────────────────────────────
  function _load()    { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
  function _save(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr)) } catch { toast('Backup storage full','⚠️') } }
  function _cfg()     { try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}') } catch { return {} } }
  function _saveCfg(c){ try { localStorage.setItem(CFG_KEY, JSON.stringify(c)) } catch {} }

  // ── Snapshot helpers ─────────────────────────────────────────────────────
  function _snap(label, type) {
    const state = projectStore.getState()
    return {
      id:        'bk_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
      type,                          // 'manual' | 'auto'
      label,
      sections:  JSON.parse(JSON.stringify(state.sections)),
      pageTitle: state.pageTitle,
      ts:        new Date().toISOString(),
      size:      0,
    }
  }

  function _sizeOf(snap) {
    try { return JSON.stringify(snap).length } catch { return 0 }
  }

  function _fmt(bytes) {
    if (bytes < 1024)       return bytes + ' B'
    if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB'
    return (bytes/1024/1024).toFixed(2) + ' MB'
  }

  function _timeAgo(iso) {
    const s = Math.floor((Date.now() - new Date(iso)) / 1000)
    if (s < 60)   return 'just now'
    if (s < 3600) return Math.floor(s/60) + 'm ago'
    if (s < 86400)return Math.floor(s/3600) + 'h ago'
    return Math.floor(s/86400) + 'd ago'
  }

  // ── Create backup ─────────────────────────────────────────────────────────
  function _create(label, type) {
    const snap = _snap(label, type)
    snap.size = _sizeOf(snap)
    const backups = _load()

    // Purge oldest auto-backups beyond MAX_AUTO
    const autos = backups.filter(b => b.type === 'auto')
    if (type === 'auto' && autos.length >= MAX_AUTO) {
      const oldest = autos[autos.length - 1].id
      const idx = backups.findIndex(b => b.id === oldest)
      if (idx !== -1) backups.splice(idx, 1)
    }
    // Purge oldest manual backups beyond MAX_MAN
    const mans = backups.filter(b => b.type === 'manual')
    if (type === 'manual' && mans.length >= MAX_MAN) {
      const oldest = mans[mans.length - 1].id
      const idx = backups.findIndex(b => b.id === oldest)
      if (idx !== -1) backups.splice(idx, 1)
    }

    backups.unshift(snap)
    _save(backups)
    return snap
  }

  // ── Public: createManual ──────────────────────────────────────────────────
  function createManual() {
    const title = projectStore.getState().pageTitle || 'Untitled'
    const snap  = _create(`Manual — ${title}`, 'manual')
    toast(`Backup saved (${_fmt(snap.size)})`,'🗄️')
    renderBody()
  }

  // ── Public: createAuto ────────────────────────────────────────────────────
  function createAuto() {
    const title = projectStore.getState().pageTitle || 'Untitled'
    _create(`Auto — ${title}`, 'auto')
  }

  // ── Schedule ──────────────────────────────────────────────────────────────
  function setSchedule(minutes) {
    clearInterval(_timer); _timer = null
    const mins = Number(minutes)
    const cfg  = _cfg(); cfg.schedule = mins; _saveCfg(cfg)

    const dot   = document.getElementById('bk-schedule-dot')
    const label = document.getElementById('bk-schedule-label')
    const sel   = document.getElementById('bk-schedule-sel')
    if (sel) sel.value = String(mins)

    if (mins > 0) {
      _timer = setInterval(createAuto, mins * 60 * 1000)
      if (dot)   dot.style.display = 'inline-block'
      if (label) label.textContent = `Auto-backup: every ${mins} min`
      toast(`Auto-backup every ${mins} min`,'⏱')
    } else {
      if (dot)   dot.style.display = 'none'
      if (label) label.textContent = 'Auto-backup: Off'
    }
    renderBody()
  }

  // ── Restore ───────────────────────────────────────────────────────────────
  function restore(id) {
    const backup = _load().find(b => b.id === id)
    if (!backup) return toast('Backup not found','⚠️')
    if (!confirm(`Restore "${backup.label}"?\n\nThis will replace the current canvas. Current state will be saved as a backup first.`)) return

    // Auto-save current state before restore
    createAuto()

    pushH('restore backup')
    editorStore.produce(draft => {
      draft.sections  = JSON.parse(JSON.stringify(backup.sections))
      draft.pageTitle = backup.pageTitle
    }, 'restore')

    const titleEl = document.getElementById('page-title')
    if (titleEl) titleEl.value = backup.pageTitle

    renderAll()
    toast(`Restored: ${backup.label}`, '✅')
    renderBody()
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  function deleteBackup(id) {
    const backups = _load().filter(b => b.id !== id)
    _save(backups); renderBody()
    toast('Backup deleted','🗑')
  }

  // ── Export single backup ──────────────────────────────────────────────────
  function exportBackup(id) {
    const backup = _load().find(b => b.id === id)
    if (!backup) return
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pagecraft-backup-${backup.ts.slice(0,10)}.json`
    a.click(); URL.revokeObjectURL(a.href)
    toast('Backup exported','📥')
  }

  // ── Export ALL backups ────────────────────────────────────────────────────
  function exportAll() {
    const backups = _load()
    if (!backups.length) return toast('No backups to export','⚠️')
    const blob = new Blob([JSON.stringify(backups, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pagecraft-backups-${new Date().toISOString().slice(0,10)}.json`
    a.click(); URL.revokeObjectURL(a.href)
    toast(`Exported ${backups.length} backups`,'📦')
  }

  // ── Import ────────────────────────────────────────────────────────────────
  function importBackup(inp) {
    const f = inp.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => {
      try {
        let data = JSON.parse(ev.target.result)
        if (!Array.isArray(data)) data = [data]
        const valid = data.filter(b => b.id && b.sections && b.ts)
        if (!valid.length) return toast('Invalid backup file','⚠️')
        const existing = _load()
        const merged   = [...valid, ...existing]
        _save(merged); renderBody()
        toast(`Imported ${valid.length} backup(s)`,'✅')
      } catch { toast('Failed to parse backup file','⚠️') }
    }
    r.readAsText(f); inp.value = ''
  }

  // ── Clear all ─────────────────────────────────────────────────────────────
  function clearAll() {
    if (!confirm('Delete ALL backups? This cannot be undone.')) return
    _save([]); renderBody()
    toast('All backups cleared','🗑')
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  function openUI() {
    renderBody()
    // Restore schedule selector
    const cfg = _cfg()
    const sel = document.getElementById('bk-schedule-sel')
    if (sel) sel.value = String(cfg.schedule || 0)
    const dot   = document.getElementById('bk-schedule-dot')
    const label = document.getElementById('bk-schedule-label')
    if (cfg.schedule > 0) {
      if (dot)   dot.style.display = 'inline-block'
      if (label) label.textContent = `Auto-backup: every ${cfg.schedule} min`
    }
    document.getElementById('bk-modal-bg').classList.remove('hidden')
  }
  function closeUI() { document.getElementById('bk-modal-bg').classList.add('hidden') }

  function renderBody() {
    const el = document.getElementById('bk-body'); if (!el) return
    const backups = _load()
    const totalSize = backups.reduce((s,b) => s + (b.size||0), 0)

    // Storage info
    const si = document.getElementById('bk-storage-info')
    if (si) si.textContent = `${backups.length} backups · ${_fmt(totalSize)} used`

    if (!backups.length) {
      el.innerHTML = `
        <div class="bk-stats">
          <div class="bk-stat"><div class="bk-stat-val">0</div><div class="bk-stat-lbl">Total</div></div>
          <div class="bk-stat"><div class="bk-stat-val">0</div><div class="bk-stat-lbl">Manual</div></div>
          <div class="bk-stat"><div class="bk-stat-val">0</div><div class="bk-stat-lbl">Auto</div></div>
        </div>
        <div class="bk-empty">🗄️<br/>No backups yet.<br/><span style="font-size:11px">Click <strong>+ Manual Backup</strong> or enable auto-backup above.</span></div>`
      return
    }

    const manuals = backups.filter(b => b.type === 'manual').length
    const autos   = backups.filter(b => b.type === 'auto').length
    const stats   = `
      <div class="bk-stats">
        <div class="bk-stat"><div class="bk-stat-val">${backups.length}</div><div class="bk-stat-lbl">Total</div></div>
        <div class="bk-stat"><div class="bk-stat-val" style="color:#34d399">${manuals}</div><div class="bk-stat-lbl">Manual</div></div>
        <div class="bk-stat"><div class="bk-stat-val" style="color:#0ea5e9">${autos}</div><div class="bk-stat-lbl">Auto</div></div>
      </div>`

    const rows = backups.map((b, i) => {
      const isCurrent = i === 0
      const badge = isCurrent
        ? `<span class="bk-label-badge current">latest</span>`
        : `<span class="bk-label-badge ${b.type}">${b.type}</span>`
      return `<div class="bk-row${isCurrent?' current':''}">
        <div class="bk-icon">${b.type==='manual'?'💾':'⏱'}</div>
        <div class="bk-info">
          <div class="bk-label">${b.label} ${badge}</div>
          <div class="bk-meta">${new Date(b.ts).toLocaleString()} · ${_timeAgo(b.ts)} · ${_fmt(b.size||0)} · ${b.sections?.length||0} sections</div>
        </div>
        <div class="bk-actions">
          <button class="bk-btn" onclick="BackupSystem.exportBackup('${b.id}')" title="Export">⬇</button>
          <button class="bk-btn danger" onclick="BackupSystem.deleteBackup('${b.id}')" title="Delete">✕</button>
          <button class="bk-btn restore" onclick="BackupSystem.restore('${b.id}')">Restore</button>
        </div>
      </div>`
    }).join('')

    el.innerHTML = stats + `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0">
        <span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">Snapshots</span>
        <button class="btn btn-ghost" style="font-size:10px;padding:2px 8px" onclick="BackupSystem.exportAll()">📦 Export all</button>
      </div>
      ${rows}`
  }

  // ── Boot: restore saved schedule ──────────────────────────────────────────
  function boot() {
    const cfg = _cfg()
    if (cfg.schedule > 0) {
      _timer = setInterval(createAuto, cfg.schedule * 60 * 1000)
    }
    // Auto-backup on page unload (before close)
    window.addEventListener('beforeunload', () => createAuto())
  }

  return {
    openUI, closeUI, renderBody,
    createManual, createAuto, setSchedule,
    restore, deleteBackup, exportBackup, exportAll, importBackup, clearAll,
    boot,
  }
})()

window.PageCraft.backupSystem = BackupSystem
