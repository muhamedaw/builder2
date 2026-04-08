/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   FEATURE FLAGS SYSTEM
   • Boolean flags  — on/off per user, with rollout %
   • A/B flags      — control / variant-a / variant-b
   • Per-user overrides (admin-level force on/off)
   • Deterministic assignment: hash(userId+flagId) % 100
   • Storage: localStorage pc_flags_v1
   • A/B analytics tracked in pc_flags_ab_v1
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */
const FeatureFlags = (() => {
  const KEY    = 'pc_flags_v1'
  const AB_KEY = 'pc_flags_ab_v1'

  // ── Built-in flag definitions ────────────────────────────────────────────
  const BUILT_IN = [
    { id:'3d_sections',       name:'3D Sections',           type:'boolean', desc:'Enable Three.js powered 3D hero & background sections.',          defaultOn:true,  rollout:100, tags:['ui','advanced'] },
    { id:'ai_suggestions',    name:'Smart Suggestions',     type:'boolean', desc:'Rule-based layout suggestion panel in the sidebar.',              defaultOn:true,  rollout:100, tags:['ui'] },
    { id:'collab_beta',       name:'Collaboration (Beta)',   type:'boolean', desc:'Real-time multi-user editing via Socket.io rooms.',               defaultOn:true,  rollout:80,  tags:['beta','collab'] },
    { id:'plugin_marketplace',name:'Plugin Marketplace',    type:'boolean', desc:'Browse, install and enable community plugins.',                   defaultOn:true,  rollout:100, tags:['marketplace'] },
    { id:'analytics_dash',    name:'Analytics Dashboard',   type:'boolean', desc:'Page views, click tracking, and heatmap overview panel.',         defaultOn:true,  rollout:100, tags:['analytics'] },
    { id:'webhook_system',    name:'Webhook Engine',        type:'boolean', desc:'Outgoing HTTP POST webhooks triggered by builder events.',         defaultOn:true,  rollout:100, tags:['integrations'] },
    { id:'premium_export',    name:'Premium Export',        type:'boolean', desc:'React/ZIP export (requires Pro plan).',                           defaultOn:false, rollout:0,   tags:['export','pro'] },
    { id:'cms_system',        name:'CMS System',            type:'boolean', desc:'Blog and dynamic content management dashboard.',                  defaultOn:true,  rollout:100, tags:['cms'] },
    { id:'new_topbar_v2',     name:'New Topbar Layout v2',  type:'ab',      desc:'A/B test: compact topbar (A) vs expanded topbar (B).',            defaultOn:true,  rollout:100, tags:['ui','ab'], variants:['control','a','b'] },
    { id:'onboarding_flow',   name:'Onboarding Flow',       type:'ab',      desc:'A/B test: modal wizard (A) vs inline tips (B) for new users.',    defaultOn:false, rollout:50,  tags:['ux','ab'], variants:['control','a','b'] },
    { id:'dark_mode_v2',      name:'Enhanced Dark Mode',    type:'ab',      desc:'A/B test: current dark theme (control) vs higher contrast (A).',  defaultOn:true,  rollout:60,  tags:['ui','ab'], variants:['control','a'] },
  ]

  let _state   = null  // loaded from localStorage
  let _abStats = null  // ab exposure counts
  let _tab     = 'flags'
  let _search  = ''

  // ── Storage ──────────────────────────────────────────────────────────────
  function _load() {
    if (_state) return _state
    try { _state = JSON.parse(localStorage.getItem(KEY) || 'null') } catch {}
    if (!_state) _state = { overrides:{}, rollouts:{}, variants:{} }
    _abStats = (() => { try { return JSON.parse(localStorage.getItem(AB_KEY) || 'null') } catch {} return {} })() || {}
    return _state
  }
  function _save() { try { localStorage.setItem(KEY, JSON.stringify(_state)); localStorage.setItem(AB_KEY, JSON.stringify(_abStats)) } catch {} }

  // ── Deterministic hash (userId + flagId → 0-99) ──────────────────────────
  function _hash(str) {
    let h = 0
    for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0 }
    return Math.abs(h) % 100
  }

  function _userId() { return AUTH.user?.id || AUTH.user?.email || 'anonymous' }

  // ── Effective rollout for a flag ─────────────────────────────────────────
  function _rollout(flag) {
    const s = _load()
    return s.rollouts[flag.id] !== undefined ? s.rollouts[flag.id] : flag.rollout
  }

  // ── Public: isEnabled(id) ────────────────────────────────────────────────
  function isEnabled(id) {
    const flag = BUILT_IN.find(f => f.id === id)
    if (!flag) return false
    const s = _load()
    if (s.overrides[id] !== undefined) return s.overrides[id]
    if (!flag.defaultOn) return false
    const pct = _rollout(flag)
    if (pct >= 100) return true
    if (pct <= 0)   return false
    return _hash(_userId() + id) < pct
  }

  // ── Public: getVariant(id) → 'control' | 'a' | 'b' ─────────────────────
  function getVariant(id) {
    const flag = BUILT_IN.find(f => f.id === id && f.type === 'ab')
    if (!flag) return 'control'
    if (!isEnabled(id)) return 'control'
    const s = _load()
    if (s.variants[id]) return s.variants[id]  // manual override
    const vs = flag.variants || ['control','a','b']
    const idx = _hash(_userId() + id) % vs.length
    const chosen = vs[idx]
    // Track exposure
    if (!_abStats) _abStats = {}
    if (!_abStats[id]) _abStats[id] = {}
    _abStats[id][chosen] = (_abStats[id][chosen] || 0) + 1
    _save()
    return chosen
  }

  // ── Public: setOverride / clearOverride ──────────────────────────────────
  function setOverride(id, value) { _load(); _state.overrides[id] = value; _save() }
  function clearOverride(id)      { _load(); delete _state.overrides[id];  _save() }
  function setRollout(id, pct)    { _load(); _state.rollouts[id] = Math.max(0, Math.min(100, pct)); _save() }
  function setVariantOverride(id, v) { _load(); _state.variants[id] = v; _save() }
  function clearVariantOverride(id)  { _load(); delete _state.variants[id]; _save() }

  function resetAll() {
    _state = { overrides:{}, rollouts:{}, variants:{} }; _save()
    toast('Feature flags reset to defaults', '🚩'); renderBody()
  }

  // ── Stats helpers ────────────────────────────────────────────────────────
  function _stats() {
    const total   = BUILT_IN.length
    const enabled = BUILT_IN.filter(f => isEnabled(f.id)).length
    const abFlags = BUILT_IN.filter(f => f.type === 'ab').length
    const over    = Object.keys((_load()).overrides).length
    return { total, enabled, disabled: total - enabled, abFlags, overrides: over }
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  function openUI()  { _load(); _tab = 'flags'; _search = ''; renderUI(); document.getElementById('ff-modal-bg').classList.remove('hidden') }
  function closeUI() { document.getElementById('ff-modal-bg').classList.add('hidden') }

  function switchTab(t) {
    _tab = t
    document.querySelectorAll('.ff-tab').forEach(el => el.classList.remove('active'))
    const tabEl = document.getElementById('ff-tab-' + t)
    if (tabEl) tabEl.classList.add('active')
    renderBody()
  }

  function renderUI() {
    document.querySelectorAll('.ff-tab').forEach(el => el.classList.remove('active'))
    const tabEl = document.getElementById('ff-tab-' + _tab)
    if (tabEl) tabEl.classList.add('active')
    renderBody()
  }

  function renderBody() {
    const el = document.getElementById('ff-body')
    if (!el) return
    if (_tab === 'flags')    el.innerHTML = _renderFlags()
    else if (_tab === 'ab')  el.innerHTML = _renderAB()
    else                     el.innerHTML = _renderOverview()
  }

  function _renderFlags() {
    const s = _load()
    const boolFlags = BUILT_IN.filter(f => f.type === 'boolean')
    const filtered  = _search
      ? boolFlags.filter(f => f.name.toLowerCase().includes(_search) || f.desc.toLowerCase().includes(_search))
      : boolFlags

    const rows = filtered.map(f => {
      const on    = isEnabled(f.id)
      const hasOv = s.overrides[f.id] !== undefined
      const roll  = _rollout(f)
      const tags  = [
        `<span class="ff-tag boolean">boolean</span>`,
        on ? `<span class="ff-tag enabled">enabled</span>` : `<span class="ff-tag disabled">disabled</span>`,
        hasOv ? `<span class="ff-tag override">override</span>` : '',
        roll < 100 ? `<span class="ff-tag rollout">${roll}% rollout</span>` : '',
        ...(f.tags||[]).filter(t=>t!=='boolean'&&t!=='ab').map(t=>`<span class="ff-tag rollout">${t}</span>`)
      ].join('')

      return `<div class="ff-row" id="ff-row-${f.id}">
        <div>
          <div class="ff-name">${f.name}</div>
          <div class="ff-desc">${f.desc}</div>
          <div class="ff-meta">${tags}</div>
        </div>
        <div class="ff-rollout">
          <div class="ff-rollout-lbl">Rollout</div>
          <div class="ff-rollout-val" id="ff-rv-${f.id}">${roll}%</div>
          <input type="range" min="0" max="100" value="${roll}" step="5"
            oninput="FeatureFlags._onRollout('${f.id}',this.value)"
            title="${roll}% of users see this flag"/>
        </div>
        <label class="ff-toggle" title="${on?'Disable':'Enable'} flag">
          <input type="checkbox" ${on?'checked':''} onchange="FeatureFlags._onToggle('${f.id}',this.checked)"/>
          <span class="ff-toggle-slider"></span>
        </label>
      </div>`
    }).join('')

    return `<input class="ff-search" placeholder="Search flags…" value="${_search}"
        oninput="FeatureFlags._onSearch(this.value)"/>
      ${filtered.length ? rows : '<div class="ff-empty">No flags match your search.</div>'}`
  }

  function _renderAB() {
    const s = _load()
    const abFlags = BUILT_IN.filter(f => f.type === 'ab')
    return abFlags.map(f => {
      const on       = isEnabled(f.id)
      const roll     = _rollout(f)
      const vs       = f.variants || ['control','a','b']
      const current  = getVariant(f.id)
      const hasOv    = s.variants[f.id] !== undefined
      const opts     = vs.map(v => `<option value="${v}" ${current===v?'selected':''}>${v}</option>`).join('')

      // A/B distribution bars (simulated from flag hash distribution)
      const dist = vs.reduce((acc,v) => {
        acc[v] = Math.round(100 / vs.length); return acc
      }, {})
      const barClasses = { control:'ctrl', a:'a', b:'b' }
      const bars = vs.map(v => `<div class="ff-ab-bar-row">
          <div class="ff-ab-bar-lbl">${v}</div>
          <div class="ff-ab-bar"><div class="ff-ab-bar-fill ${barClasses[v]||'a'}" style="width:${dist[v]}%"></div></div>
          <div class="ff-ab-bar-pct">${dist[v]}%</div>
        </div>`).join('')

      return `<div class="ff-ab-row">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div class="ff-ab-name">${f.name} ${!on?'<span class="ff-tag disabled" style="font-size:10px;margin-left:6px">off</span>':''}</div>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:11px;color:var(--muted)">${hasOv?'Manual override:':'Auto assign:'}</span>
            <select class="ff-variant-sel" onchange="FeatureFlags._onVariant('${f.id}',this.value)">
              <option value="">auto</option>${opts}
            </select>
            ${hasOv?`<button class="btn btn-ghost" style="font-size:10px;padding:2px 8px" onclick="FeatureFlags._clearVariant('${f.id}')">Clear</button>`:''}
          </div>
        </div>
        <div class="ff-desc" style="margin-bottom:10px">${f.desc}</div>
        <div class="ff-ab-bars">${bars}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
          <span style="font-size:11px;color:var(--muted)">Rollout</span>
          <input type="range" min="0" max="100" value="${roll}" step="5" style="flex:1;accent-color:var(--accent)"
            oninput="FeatureFlags._onRollout('${f.id}',this.value)"/>
          <span style="font-size:11px;font-weight:700;color:var(--accent)">${roll}%</span>
        </div>
      </div>`
    }).join('')
  }

  function _renderOverview() {
    const st = _stats()
    return `<div class="ff-stats-grid">
        <div class="ff-stat"><div class="ff-stat-val">${st.total}</div><div class="ff-stat-lbl">Total Flags</div></div>
        <div class="ff-stat"><div class="ff-stat-val" style="color:#34d399">${st.enabled}</div><div class="ff-stat-lbl">Enabled</div></div>
        <div class="ff-stat"><div class="ff-stat-val" style="color:#f87171">${st.disabled}</div><div class="ff-stat-lbl">Disabled</div></div>
        <div class="ff-stat"><div class="ff-stat-val" style="color:#fbbf24">${st.abFlags}</div><div class="ff-stat-lbl">A/B Tests</div></div>
      </div>
      <div class="ff-section-title">All Flags — Status</div>
      ${BUILT_IN.map(f => {
        const on = isEnabled(f.id)
        const s  = _load()
        const ov = s.overrides[f.id] !== undefined
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:12px;color:var(--text)">${f.name}</span>
          <div style="display:flex;gap:6px">
            <span class="ff-tag ${f.type}">${f.type}</span>
            <span class="ff-tag ${on?'enabled':'disabled'}">${on?'on':'off'}</span>
            ${ov?'<span class="ff-tag override">override</span>':''}
          </div>
        </div>`
      }).join('')}`
  }

  // ── Event handlers (called from inline HTML) ─────────────────────────────
  function _onToggle(id, val) { setOverride(id, val); renderBody(); toast((val?'Enabled':'Disabled')+': '+id,'🚩') }
  function _onRollout(id, val) {
    setRollout(id, Number(val))
    const rv = document.getElementById('ff-rv-'+id); if (rv) rv.textContent = val+'%'
  }
  function _onSearch(q) { _search = q.toLowerCase(); renderBody() }
  function _onVariant(id, v) { if (v) setVariantOverride(id, v); else clearVariantOverride(id); renderBody() }
  function _clearVariant(id) { clearVariantOverride(id); renderBody() }

  // ── Expose public surface ────────────────────────────────────────────────
  return {
    isEnabled, getVariant,
    setOverride, clearOverride, setRollout, setVariantOverride, clearVariantOverride,
    resetAll, openUI, closeUI, switchTab, renderBody,
    _onToggle, _onRollout, _onSearch, _onVariant, _clearVariant,
    get flags() { return BUILT_IN },
  }
})()

window.PageCraft.featureFlags = FeatureFlags
