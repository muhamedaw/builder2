/* design-sidebar.js — Edit + Compose panels for DesignStudio
   CLAUDE.md: modular, < 300 lines */

const DesignSidebar = (() => {
  'use strict'

  const FONTS = ['Arial','Georgia','Verdana','Impact','Trebuchet MS','Times New Roman','Courier New','Comic Sans MS','Palatino','Garamond']

  const STICKERS = [
    {n:'Star',      s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="C"/></svg>`},
    {n:'Heart',     s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,30C50,8 18,4 10,26C2,48 30,70 50,90C70,70 98,48 90,26C82,4 50,8 50,30Z" fill="C"/></svg>`},
    {n:'Crown',     s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,70 25,30 50,55 75,30 90,70" fill="C"/><rect x="10" y="72" width="80" height="12" rx="3" fill="C"/></svg>`},
    {n:'Lightning', s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="62,4 24,54 52,54 38,96 76,46 48,46" fill="C"/></svg>`},
    {n:'Fire',      s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,8C28,32 18,52 35,67C24,56 42,44 50,60C44,44 62,34 50,8ZM50,60C56,76 66,82 54,92C72,86 76,68 64,58C58,74 50,60 50,60Z" fill="C"/></svg>`},
    {n:'Diamond',   s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 95,42 50,95 5,42" fill="C"/></svg>`},
    {n:'Smile',     s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="C"/><circle cx="35" cy="40" r="5" fill="white"/><circle cx="65" cy="40" r="5" fill="white"/><path d="M30,62Q50,82 70,62" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`},
    {n:'Arrow',     s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 95,50 70,50 70,95 30,95 30,50 5,50" fill="C"/></svg>`},
    {n:'Location',  s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,8C32,8 18,22 18,40C18,62 50,92 50,92C50,92 82,62 82,40C82,22 68,8 50,8Z" fill="C"/><circle cx="50" cy="40" r="12" fill="white"/></svg>`},
    {n:'Sun',       s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="18" fill="C"/><g stroke="C" stroke-width="5" stroke-linecap="round"><line x1="50" y1="6" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="94"/><line x1="6" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="94" y2="50"/><line x1="18" y1="18" x2="28" y2="28"/><line x1="72" y1="72" x2="82" y2="82"/><line x1="82" y1="18" x2="72" y2="28"/><line x1="28" y1="72" x2="18" y2="82"/></g></svg>`},
    {n:'Music',     s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="28" cy="80" rx="18" ry="12" fill="C"/><ellipse cx="74" cy="70" rx="18" ry="12" fill="C"/><rect x="44" y="14" width="6" height="66" rx="3" fill="C"/><rect x="89" y="9" width="6" height="61" rx="3" fill="C"/><rect x="44" y="14" width="51" height="6" rx="3" fill="C"/></svg>`},
    {n:'Flower',    s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="12" fill="C"/><ellipse cx="50" cy="20" rx="10" ry="18" fill="C"/><ellipse cx="50" cy="80" rx="10" ry="18" fill="C"/><ellipse cx="20" cy="50" rx="18" ry="10" fill="C"/><ellipse cx="80" cy="50" rx="18" ry="10" fill="C"/></svg>`},
    {n:'Sparkle',   s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,4 53,47 96,50 53,53 50,96 47,53 4,50 47,47" fill="C"/></svg>`},
    {n:'Check',     s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="C"/><polyline points="25,50 42,68 75,32" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`},
    {n:'Ribbon',    s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="36" r="26" fill="none" stroke="C" stroke-width="8"/><line x1="34" y1="58" x2="18" y2="90" stroke="C" stroke-width="6" stroke-linecap="round"/><line x1="66" y1="58" x2="82" y2="90" stroke="C" stroke-width="6" stroke-linecap="round"/></svg>`},
    {n:'Camera',    s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="5" y="25" width="90" height="65" rx="8" fill="C"/><circle cx="50" cy="57" r="18" fill="white" opacity=".3"/><circle cx="50" cy="57" r="12" fill="C" opacity=".8"/><rect x="30" y="15" width="40" height="15" rx="5" fill="C"/></svg>`},
    {n:'Wave',      s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M5,50Q17,30 30,50Q42,70 55,50Q67,30 80,50Q92,70 95,50" fill="none" stroke="C" stroke-width="8" stroke-linecap="round"/></svg>`},
    {n:'Moon',      s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M70,50A30,30 0 1 1 50,20A22,22 0 1 0 70,50Z" fill="C"/></svg>`},
    {n:'Tag',       s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10,10L10,55L50,95L90,55L50,10Z" fill="C"/><circle cx="30" cy="30" r="7" fill="white"/></svg>`},
    {n:'Thumbs',    s:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M20,45L20,90L40,90L40,45ZM40,45C40,45 45,20 60,15C65,13 70,16 70,22L70,40L85,40C90,40 92,45 90,50L82,85C81,89 77,90 74,90L40,90Z" fill="C"/></svg>`},
  ]

  let _stickerColor = '#ffffff'

  // ── Edit panel ────────────────────────────────────────────────────────────
  function mountEdit(id) {
    const el = document.getElementById(id); if (!el) return
    el.innerHTML = `
      <div class="dsb-scroll">
        <div class="dsb-section-title">Filters</div>
        ${_slider('brightness','Brightness',0,-1,1,.01)}
        ${_slider('contrast',  'Contrast',  0,-1,1,.01)}
        ${_slider('saturation','Saturation',0,-1,1,.01)}
        ${_slider('hue',       'Hue',        0,-1,1,.01)}
        ${_slider('blur',      'Blur',       0, 0,1,.01)}
        ${_slider('noise',     'Grain',      0, 0,1,.01)}
        ${_slider('opacity',   'Opacity',    1, 0,1,.01)}
        <div class="dsb-row">
          <button class="dsb-toggle-btn" id="dsb-invert" onclick="this.classList.toggle('on');DesignStudio.applyFilter('invert',this.classList.contains('on')?1:0)">Invert</button>
          <button class="dsb-toggle-btn" id="dsb-sepia"  onclick="this.classList.toggle('on');DesignStudio.applyFilter('sepia', this.classList.contains('on')?1:0)">Sepia</button>
        </div>
        <div class="dsb-section-title">Presets</div>
        <div class="dsb-presets-grid">
          ${['vivid','matte','bw','cinematic','cool','warm','faded','sepia'].map(p=>
            `<button class="dsb-preset" onclick="DesignStudio.applyPreset('${p}')">${p.charAt(0).toUpperCase()+p.slice(1)}</button>`
          ).join('')}
        </div>
        <div class="dsb-section-title">Transform</div>
        <div class="dsb-btn-row">
          <button class="dsb-icon-btn" onclick="DesignStudio.rotate(-90)" title="Rotate Left">↺</button>
          <button class="dsb-icon-btn" onclick="DesignStudio.rotate(90)"  title="Rotate Right">↻</button>
          <button class="dsb-icon-btn" onclick="DesignStudio.flip('H')"   title="Flip H">⟺</button>
          <button class="dsb-icon-btn" onclick="DesignStudio.flip('V')"   title="Flip V">↕</button>
        </div>
        <div class="dsb-section-title">Clip Shape</div>
        <div class="dsb-btn-row">
          <button class="dsb-clip-btn" onclick="DesignStudio.clipTo('circle')"  title="Circle">●</button>
          <button class="dsb-clip-btn" onclick="DesignStudio.clipTo('rounded')" title="Rounded">▢</button>
          <button class="dsb-clip-btn" onclick="DesignStudio.clipTo('square')"  title="Square">■</button>
          <button class="dsb-clip-btn" onclick="DesignStudio.clipTo('none')"    title="None">✕</button>
        </div>
        <button class="dsb-reset-btn" onclick="DesignStudio.resetAll()">↺ Reset All</button>
      </div>`
    _bindSliders(el)
  }

  function _slider(key, label, def, min, max, step) {
    return `<div class="dsb-slider-row">
      <div class="dsb-slider-top"><span class="dsb-label">${label}</span><span class="dsb-val" id="dsb-val-${key}">${def}</span></div>
      <input id="dsb-${key}" class="dsb-range" type="range" min="${min}" max="${max}" step="${step}" value="${def}"
        oninput="document.getElementById('dsb-val-${key}').textContent=parseFloat(this.value).toFixed(2);DesignStudio.applyFilter('${key}',parseFloat(this.value))"/>
    </div>`
  }

  function _bindSliders(el) {
    el.querySelectorAll('.dsb-range').forEach(s => {
      s.addEventListener('input', () => {})
    })
  }

  function syncSliders(filters) {
    Object.entries(filters).forEach(([k, v]) => {
      const el = document.getElementById('dsb-' + k); if (el) el.value = v
      const vEl = document.getElementById('dsb-val-' + k); if (vEl) vEl.textContent = parseFloat(v).toFixed(2)
    })
  }

  function resetEdit() {
    ['brightness','contrast','saturation','hue','blur','noise'].forEach(k => {
      const el = document.getElementById('dsb-' + k); if (el) el.value = 0
      const vEl = document.getElementById('dsb-val-' + k); if (vEl) vEl.textContent = '0'
    })
    const op = document.getElementById('dsb-opacity'); if (op) { op.value = 1; document.getElementById('dsb-val-opacity').textContent = '1' }
    document.getElementById('dsb-invert')?.classList.remove('on')
    document.getElementById('dsb-sepia')?.classList.remove('on')
  }

  // ── Compose panel ─────────────────────────────────────────────────────────
  function mountCompose(id) {
    const el = document.getElementById(id); if (!el) return
    el.innerHTML = `
      <div class="dsb-scroll">
        <div class="dsb-tabs2">
          <button class="dsb-tab2 active" data-t="text"     onclick="DesignSidebar._tab2(this,'text')">✏️ Text</button>
          <button class="dsb-tab2"        data-t="shapes"   onclick="DesignSidebar._tab2(this,'shapes')">⬡</button>
          <button class="dsb-tab2"        data-t="stickers" onclick="DesignSidebar._tab2(this,'stickers')">⭐</button>
        </div>
        <div class="dsb-sub active" id="dsb-sub-text">
          <input id="dsb-text-val" class="dsb-input" type="text" value="Text" placeholder="Your text…"/>
          <div class="dsb-row">
            <select id="dsb-font" class="dsb-select">${FONTS.map(f=>`<option value="${f}">${f}</option>`).join('')}</select>
            <input id="dsb-fsize" class="dsb-input-sm" type="number" value="36" min="8" max="200"/>
          </div>
          <div class="dsb-row">
            <span class="dsb-label">Fill</span><input id="dsb-tcolor" class="dsb-color" type="color" value="#ffffff"/>
            <span class="dsb-label">Stroke</span><input id="dsb-tstroke" class="dsb-color" type="color" value="#000000"/>
            <input id="dsb-stroke-on" type="checkbox" title="Stroke on"/>
          </div>
          <div class="dsb-row">
            <span class="dsb-label">Bg</span><input id="dsb-tbg" class="dsb-color" type="color" value="#000000"/>
            <input id="dsb-tbg-on" type="checkbox" title="Text bg"/>
          </div>
          <div class="dsb-row">
            <button class="dsb-toggle-btn" id="dsb-bold"   onclick="this.classList.toggle('on')"><b>B</b></button>
            <button class="dsb-toggle-btn" id="dsb-italic" onclick="this.classList.toggle('on')"><i>I</i></button>
            <button class="dsb-toggle-btn" id="dsb-shadow" onclick="this.classList.toggle('on')">💧</button>
          </div>
          <button class="dsb-add-btn" onclick="DesignSidebar.addText()">+ Add Text</button>
        </div>
        <div class="dsb-sub" id="dsb-sub-shapes">
          <div class="dsb-row">
            <span class="dsb-label">Fill</span><input id="dsb-sfill" class="dsb-color" type="color" value="#6c63ff"/>
            <span class="dsb-label">Stroke</span><input id="dsb-sstroke" class="dsb-color" type="color" value="#ffffff"/>
            <input id="dsb-sstroke-on" type="checkbox" title="Stroke"/>
          </div>
          <div class="dsb-shapes-grid">
            <button class="dsb-shape-btn" onclick="DesignSidebar.addShape('circle')"      title="Circle">●</button>
            <button class="dsb-shape-btn" onclick="DesignSidebar.addShape('rect')"        title="Rect">■</button>
            <button class="dsb-shape-btn" onclick="DesignSidebar.addShape('rect',1)"      title="Rounded">▢</button>
            <button class="dsb-shape-btn" onclick="DesignSidebar.addShape('triangle')"    title="Triangle">▲</button>
            <button class="dsb-shape-btn" onclick="DesignSidebar.addShape('star')"        title="Star">★</button>
            <button class="dsb-shape-btn" onclick="DesignSidebar.addShape('heart')"       title="Heart">♥</button>
            <button class="dsb-shape-btn" onclick="DesignSidebar.addShape('diamond')"     title="Diamond">◆</button>
            <button class="dsb-shape-btn" onclick="DesignSidebar.addShape('hexagon')"     title="Hexagon">⬡</button>
            <button class="dsb-shape-btn" onclick="DesignSidebar.addShape('line')"        title="Line">—</button>
          </div>
        </div>
        <div class="dsb-sub" id="dsb-sub-stickers">
          <div class="dsb-row"><span class="dsb-label">Color</span>
            <input id="dsb-scolor" class="dsb-color" type="color" value="#ffffff" oninput="DesignSidebar.setStickerColor(this.value)"/>
          </div>
          <div class="dsb-stickers-grid">
            ${STICKERS.map((s,i)=>`<button class="dsb-sticker-btn" onclick="DesignSidebar.addSticker(${i})" title="${s.n}">${s.s.replace(/\bC\b/g,'#6c63ff')}</button>`).join('')}
          </div>
        </div>
      </div>`
  }

  function _tab2(btn, id) {
    btn.closest('.dsb-scroll').querySelectorAll('.dsb-tab2').forEach(t => t.classList.remove('active'))
    btn.closest('.dsb-scroll').querySelectorAll('.dsb-sub').forEach(s => s.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById('dsb-sub-' + id)?.classList.add('active')
  }

  function addText() {
    const text   = document.getElementById('dsb-text-val')?.value || 'Text'
    const font   = document.getElementById('dsb-font')?.value || 'Arial'
    const size   = parseInt(document.getElementById('dsb-fsize')?.value) || 36
    const color  = document.getElementById('dsb-tcolor')?.value || '#ffffff'
    const stOn   = document.getElementById('dsb-stroke-on')?.checked
    const stroke = stOn ? document.getElementById('dsb-tstroke')?.value : null
    const bgOn   = document.getElementById('dsb-tbg-on')?.checked
    const bgColor= bgOn ? document.getElementById('dsb-tbg')?.value : ''
    const bold   = document.getElementById('dsb-bold')?.classList.contains('on')
    const italic = document.getElementById('dsb-italic')?.classList.contains('on')
    const shadow = document.getElementById('dsb-shadow')?.classList.contains('on')
    DesignStudio.addText(text, { font, size, color, stroke, strokeWidth: stroke ? 2 : 0, bgColor, bold, italic, shadow })
  }

  function addShape(type, rounded = 0) {
    const fill  = document.getElementById('dsb-sfill')?.value || '#6c63ff'
    const stOn  = document.getElementById('dsb-sstroke-on')?.checked
    const stroke= stOn ? document.getElementById('dsb-sstroke')?.value : null
    DesignStudio.addShape(type, { fill, stroke, strokeWidth: stroke ? 3 : 0, rounded: !!rounded })
  }

  let _stickerColor = '#ffffff'
  function setStickerColor(v) { _stickerColor = v }

  function addSticker(idx) {
    const s = STICKERS[idx]; if (!s) return
    DesignStudio.addSticker(s.s.replace(/\bC\b/g, _stickerColor))
  }

  return { mountEdit, mountCompose, syncSliders, resetEdit, addText, addShape, addSticker, _tab2, setStickerColor }
})()
window.PageCraft = window.PageCraft || {}
window.PageCraft.DesignSidebar = DesignSidebar
