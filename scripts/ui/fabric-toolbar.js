/* fabric-toolbar.js — Floating toolbar UI for FabricEngine
   CLAUDE.md: modular, < 300 lines, communicates via FabricEngine API. */

const FabricToolbar = (() => {
  'use strict'

  let _root = null

  // ── Slider definition list ────────────────────────────────────────────────
  const SLIDERS = [
    { key:'brightness', label:'Brightness', min:-1,   max:1,   step:0.02, def:0 },
    { key:'contrast',   label:'Contrast',   min:-1,   max:1,   step:0.02, def:0 },
    { key:'saturation', label:'Saturation', min:-1,   max:1,   step:0.02, def:0 },
    { key:'hue',        label:'Hue Rotate', min:-1,   max:1,   step:0.02, def:0 },
    { key:'blur',       label:'Blur',       min:0,    max:1,   step:0.01, def:0 },
    { key:'noise',      label:'Noise / Grain',min:0,  max:1,   step:0.01, def:0 },
  ]

  const CLIPS = [
    { shape:'circle',  icon:'⭕', label:'Circle'  },
    { shape:'rounded', icon:'▢',  label:'Rounded' },
    { shape:'square',  icon:'◼',  label:'Square'  },
    { shape:'none',    icon:'✕',  label:'No Clip' },
  ]

  const PRESETS = [
    { name:'Vivid',    f:{ brightness:0.05, contrast:0.15, saturation:0.25 } },
    { name:'Matte',    f:{ brightness:0.05, contrast:-0.1, saturation:-0.15 } },
    { name:'B&W',      f:{ saturation:-1 } },
    { name:'Sepia',    f:{ sepia:1, saturation:-0.4 } },
    { name:'Cinematic',f:{ contrast:0.2, saturation:-0.1, brightness:-0.05 } },
    { name:'Faded',    f:{ contrast:-0.15, brightness:0.08, saturation:-0.2 } },
    { name:'Punchy',   f:{ contrast:0.25, saturation:0.35 } },
    { name:'Cool',     f:{ hue:-0.1, saturation:0.1 } },
  ]

  // ── Mount into a container div ────────────────────────────────────────────
  function mount(containerId) {
    const cont = document.getElementById(containerId)
    if (!cont) return

    _root = document.createElement('div')
    _root.className = 'fc-toolbar'
    _root.innerHTML = `
      <!-- ─ Filters ─ -->
      <div class="fc-tb-section">Filters & Adjustments</div>
      <div class="fc-sliders" id="fc-sliders">
        ${SLIDERS.map(s => `
          <div class="fc-slider-row">
            <label class="fc-slider-label">
              <span>${s.label}</span>
              <span class="fc-slider-val" id="fcv-${s.key}">0</span>
            </label>
            <input type="range"
              class="fc-slider"
              id="fcs-${s.key}"
              min="${s.min}" max="${s.max}" step="${s.step}"
              value="${s.def}"
              oninput="FabricToolbar._onSlider('${s.key}', +this.value)">
          </div>`).join('')}
        <!-- Invert toggle -->
        <div class="fc-slider-row">
          <label class="fc-slider-label">
            <span>Invert</span>
          </label>
          <button class="fc-toggle" id="fc-toggle-invert"
            onclick="FabricToolbar._toggleInvert()">Off</button>
        </div>
        <!-- Sepia toggle -->
        <div class="fc-slider-row">
          <label class="fc-slider-label"><span>Sepia</span></label>
          <button class="fc-toggle" id="fc-toggle-sepia"
            onclick="FabricToolbar._toggleSepia()">Off</button>
        </div>
      </div>

      <!-- ─ Presets ─ -->
      <div class="fc-tb-section">Style Presets</div>
      <div class="fc-preset-grid">
        ${PRESETS.map(p => `
          <button class="fc-preset-btn"
            onclick="FabricToolbar._applyPreset(${JSON.stringify(p.f)})">${p.name}</button>`
        ).join('')}
      </div>

      <!-- ─ Transform ─ -->
      <div class="fc-tb-section">Transform</div>
      <div class="fc-transform-grid">
        <button class="fc-tool-btn" onclick="FabricEngine.rotate(-90)" title="Rotate CCW">↺ −90°</button>
        <button class="fc-tool-btn" onclick="FabricEngine.rotate(90)"  title="Rotate CW">↻ +90°</button>
        <button class="fc-tool-btn" onclick="FabricEngine.flip('H')"  title="Flip Horizontal">⇆ Flip H</button>
        <button class="fc-tool-btn" onclick="FabricEngine.flip('V')"  title="Flip Vertical">⇅ Flip V</button>
      </div>

      <!-- ─ Clip / Mask ─ -->
      <div class="fc-tb-section">Clip & Mask</div>
      <div class="fc-clip-grid">
        ${CLIPS.map(c => `
          <button class="fc-clip-btn" id="fc-clip-${c.shape}"
            onclick="FabricToolbar._applyClip('${c.shape}')"
            title="${c.label}">${c.icon}<span>${c.label}</span></button>`
        ).join('')}
      </div>

      <!-- ─ Opacity ─ -->
      <div class="fc-tb-section">Opacity</div>
      <div class="fc-slider-row">
        <label class="fc-slider-label">
          <span>Opacity</span>
          <span class="fc-slider-val" id="fcv-opacity">100%</span>
        </label>
        <input type="range" class="fc-slider" id="fcs-opacity"
          min="0" max="1" step="0.01" value="1"
          oninput="FabricToolbar._onOpacity(+this.value)">
      </div>
    `
    cont.innerHTML = ''
    cont.appendChild(_root)
  }

  // ── Slider handler ────────────────────────────────────────────────────────
  function _onSlider(key, value) {
    const valEl = document.getElementById(`fcv-${key}`)
    if (valEl) valEl.textContent = value.toFixed(2)
    FabricEngine.applyFilter(key, value)
  }

  // ── Toggle filters ────────────────────────────────────────────────────────
  let _invertOn = false, _sepiaOn = false

  function _toggleInvert() {
    _invertOn = !_invertOn
    const btn = document.getElementById('fc-toggle-invert')
    if (btn) { btn.textContent = _invertOn ? 'On' : 'Off'; btn.classList.toggle('active', _invertOn) }
    FabricEngine.applyFilter('invert', _invertOn ? 1 : 0)
  }

  function _toggleSepia() {
    _sepiaOn = !_sepiaOn
    const btn = document.getElementById('fc-toggle-sepia')
    if (btn) { btn.textContent = _sepiaOn ? 'On' : 'Off'; btn.classList.toggle('active', _sepiaOn) }
    FabricEngine.applyFilter('sepia', _sepiaOn ? 1 : 0)
  }

  // ── Presets ───────────────────────────────────────────────────────────────
  function _applyPreset(filters) {
    // Reset first, then apply preset values
    reset()
    Object.entries(filters).forEach(([key, value]) => {
      const slider = document.getElementById(`fcs-${key}`)
      if (slider) { slider.value = value }
      const valEl = document.getElementById(`fcv-${key}`)
      if (valEl) valEl.textContent = value.toFixed(2)
      FabricEngine.applyFilter(key, value)
    })
  }

  // ── Clip ──────────────────────────────────────────────────────────────────
  function _applyClip(shape) {
    document.querySelectorAll('.fc-clip-btn').forEach(b => b.classList.remove('active'))
    document.getElementById(`fc-clip-${shape}`)?.classList.add('active')
    FabricEngine.clipTo(shape)
  }

  // ── Opacity ───────────────────────────────────────────────────────────────
  function _onOpacity(value) {
    const valEl = document.getElementById('fcv-opacity')
    if (valEl) valEl.textContent = Math.round(value * 100) + '%'
    // Apply via Fabric directly
    if (window.PageCraft?.FabricEngine) {
      const fc = window._fabricInstance   // accessed via global if needed
    }
    // Use the public applyFilter channel
    FabricEngine.applyFilter('opacity', value)
  }

  // ── Reset all sliders to zero ─────────────────────────────────────────────
  function reset() {
    SLIDERS.forEach(s => {
      const slider = document.getElementById(`fcs-${s.key}`)
      if (slider) slider.value = s.def
      const valEl = document.getElementById(`fcv-${s.key}`)
      if (valEl) valEl.textContent = '0'
    })
    _invertOn = false; _sepiaOn = false
    const ib = document.getElementById('fc-toggle-invert')
    const sb = document.getElementById('fc-toggle-sepia')
    if (ib) { ib.textContent = 'Off'; ib.classList.remove('active') }
    if (sb) { sb.textContent = 'Off'; sb.classList.remove('active') }
    const op = document.getElementById('fcs-opacity')
    if (op) op.value = 1
    const opv = document.getElementById('fcv-opacity')
    if (opv) opv.textContent = '100%'
    document.querySelectorAll('.fc-clip-btn').forEach(b => b.classList.remove('active'))
  }

  return { mount, reset, _onSlider, _onOpacity,
           _toggleInvert, _toggleSepia, _applyPreset, _applyClip }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.FabricToolbar = FabricToolbar
