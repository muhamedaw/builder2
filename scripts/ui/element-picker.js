/* element-picker.js — Composition Element Sidebar
   Role: Text / Shapes / Stickers picker for CompositionEngine.
   CLAUDE.md: modular, < 300 lines. */

const ElementPicker = (() => {
  'use strict'

  let _stickerColor = '#ffffff'

  // ── SVG Sticker Library ───────────────────────────────────────────────────
  const STICKERS = [
    { name: 'Star',      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="C"/></svg>` },
    { name: 'Heart',     svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,30 C50,8 18,4 10,26 C2,48 30,70 50,90 C70,70 98,48 90,26 C82,4 50,8 50,30Z" fill="C"/></svg>` },
    { name: 'Crown',     svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,70 25,30 50,55 75,30 90,70" fill="C"/><rect x="10" y="72" width="80" height="12" rx="3" fill="C"/></svg>` },
    { name: 'Fire',      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,8 C28,32 18,52 35,67 C24,56 42,44 50,60 C44,44 62,34 50,8Z M50,60 C56,76 66,82 54,92 C72,86 76,68 64,58 C58,74 50,60 50,60Z" fill="C"/></svg>` },
    { name: 'Lightning', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="62,4 24,54 52,54 38,96 76,46 48,46" fill="C"/></svg>` },
    { name: 'Diamond',   svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 95,42 50,95 5,42" fill="C"/></svg>` },
    { name: 'Smile',     svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="C"/><circle cx="35" cy="40" r="5" fill="white"/><circle cx="65" cy="40" r="5" fill="white"/><path d="M30,62 Q50,82 70,62" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/></svg>` },
    { name: 'Arrow Up',  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 95,50 70,50 70,95 30,95 30,50 5,50" fill="C"/></svg>` },
    { name: 'Music',     svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="28" cy="80" rx="18" ry="12" fill="C"/><ellipse cx="74" cy="70" rx="18" ry="12" fill="C"/><rect x="44" y="14" width="6" height="66" rx="3" fill="C"/><rect x="89" y="9" width="6" height="61" rx="3" fill="C"/><rect x="44" y="14" width="51" height="6" rx="3" fill="C"/></svg>` },
    { name: 'Location',  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,8 C32,8 18,22 18,40 C18,62 50,92 50,92 C50,92 82,62 82,40 C82,22 68,8 50,8Z" fill="C"/><circle cx="50" cy="40" r="12" fill="white"/></svg>` },
    { name: 'Sun',       svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="18" fill="C"/><g stroke="C" stroke-width="5" stroke-linecap="round"><line x1="50" y1="6" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="94"/><line x1="6" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="94" y2="50"/><line x1="18" y1="18" x2="28" y2="28"/><line x1="72" y1="72" x2="82" y2="82"/><line x1="82" y1="18" x2="72" y2="28"/><line x1="28" y1="72" x2="18" y2="82"/></g></svg>` },
    { name: 'Flower',    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="12" fill="C"/><ellipse cx="50" cy="20" rx="10" ry="18" fill="C"/><ellipse cx="50" cy="80" rx="10" ry="18" fill="C"/><ellipse cx="20" cy="50" rx="18" ry="10" fill="C"/><ellipse cx="80" cy="50" rx="18" ry="10" fill="C"/></svg>` },
    { name: 'Check',     svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="C"/><polyline points="25,50 42,68 75,32" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
    { name: 'Sparkle',   svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,4 53,47 96,50 53,53 50,96 47,53 4,50 47,47" fill="C"/></svg>` },
    { name: 'Ribbon',    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="36" r="26" fill="none" stroke="C" stroke-width="8"/><line x1="34" y1="58" x2="18" y2="90" stroke="C" stroke-width="6" stroke-linecap="round"/><line x1="66" y1="58" x2="82" y2="90" stroke="C" stroke-width="6" stroke-linecap="round"/></svg>` },
    { name: 'Wave',      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M5,50 Q17,30 30,50 Q42,70 55,50 Q67,30 80,50 Q92,70 95,50" fill="none" stroke="C" stroke-width="8" stroke-linecap="round"/></svg>` },
  ]

  const FONTS = ['Arial', 'Georgia', 'Verdana', 'Impact', 'Trebuchet MS',
                 'Times New Roman', 'Courier New', 'Comic Sans MS', 'Palatino', 'Garamond']

  // ── Mount ─────────────────────────────────────────────────────────────────
  function mount(containerId) {
    const el = document.getElementById(containerId)
    if (!el) return
    el.innerHTML = _buildHTML()
    _bindTabs(el)
  }

  function _buildHTML() {
    return `<div class="ep-panel">
      <div class="ep-tabs">
        <button class="ep-tab active" data-tab="text">✏️ Text</button>
        <button class="ep-tab" data-tab="shapes">⬡ Shapes</button>
        <button class="ep-tab" data-tab="stickers">⭐ Stickers</button>
      </div>

      <!-- TEXT -->
      <div class="ep-content active" id="ep-text">
        <input id="ep-text-input" class="ep-input" type="text" value="Text" placeholder="Your text…"/>
        <div class="ep-row">
          <select id="ep-font" class="ep-select">
            ${FONTS.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
          <input id="ep-font-size" class="ep-input-sm" type="number" value="36" min="8" max="200"/>
        </div>
        <div class="ep-row">
          <label class="ep-label">Fill</label>
          <input id="ep-text-color" class="ep-color" type="color" value="#ffffff"/>
          <label class="ep-label">Stroke</label>
          <input id="ep-text-stroke-color" class="ep-color" type="color" value="#000000"/>
          <input id="ep-text-stroke-on" type="checkbox" title="Enable stroke"/>
        </div>
        <div class="ep-row ep-toggles">
          <button class="ep-toggle" id="ep-bold"   title="Bold"><b>B</b></button>
          <button class="ep-toggle" id="ep-italic" title="Italic"><i>I</i></button>
          <button class="ep-toggle" id="ep-shadow" title="Shadow">💧</button>
        </div>
        <button class="ep-add-btn" onclick="ElementPicker.addText()">+ Add Text</button>
      </div>

      <!-- SHAPES -->
      <div class="ep-content" id="ep-shapes">
        <div class="ep-row">
          <label class="ep-label">Fill</label>
          <input id="ep-shape-fill" class="ep-color" type="color" value="#6c63ff"/>
          <label class="ep-label">Outline</label>
          <input id="ep-shape-stroke-color" class="ep-color" type="color" value="#ffffff"/>
          <input id="ep-shape-stroke-on" type="checkbox" title="Enable outline"/>
        </div>
        <div class="ep-shapes-grid">
          <button class="ep-shape-btn" onclick="ElementPicker.addShape('circle')"   title="Circle">●</button>
          <button class="ep-shape-btn" onclick="ElementPicker.addShape('rect')"     title="Rectangle">■</button>
          <button class="ep-shape-btn" onclick="ElementPicker.addShape('rect',1)"   title="Rounded">▢</button>
          <button class="ep-shape-btn" onclick="ElementPicker.addShape('triangle')" title="Triangle">▲</button>
          <button class="ep-shape-btn" onclick="ElementPicker.addShape('star')"     title="Star">★</button>
          <button class="ep-shape-btn" onclick="ElementPicker.addShape('heart')"    title="Heart">♥</button>
          <button class="ep-shape-btn" onclick="ElementPicker.addShape('line')"     title="Line">—</button>
        </div>
      </div>

      <!-- STICKERS -->
      <div class="ep-content" id="ep-stickers">
        <div class="ep-row">
          <label class="ep-label">Color</label>
          <input id="ep-sticker-color" class="ep-color" type="color" value="#ffffff"
                 oninput="ElementPicker._setColor(this.value)"/>
        </div>
        <div class="ep-stickers-grid">
          ${STICKERS.map((s, i) => `
            <button class="ep-sticker-btn" onclick="ElementPicker.addSticker(${i})" title="${s.name}">
              ${s.svg.replace(/C/g, '#6c63ff')}
            </button>`).join('')}
        </div>
      </div>
    </div>`
  }

  function _bindTabs(el) {
    el.querySelectorAll('.ep-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.ep-tab, .ep-content').forEach(x => x.classList.remove('active'))
        btn.classList.add('active')
        el.querySelector('#ep-' + btn.dataset.tab)?.classList.add('active')
      })
    })
    el.querySelectorAll('#ep-bold, #ep-italic, #ep-shadow').forEach(btn =>
      btn.addEventListener('click', () => btn.classList.toggle('on'))
    )
  }

  // ── Public add methods ────────────────────────────────────────────────────
  function addText() {
    const text        = document.getElementById('ep-text-input')?.value || 'Text'
    const font        = document.getElementById('ep-font')?.value || 'Arial'
    const size        = parseInt(document.getElementById('ep-font-size')?.value) || 36
    const color       = document.getElementById('ep-text-color')?.value || '#ffffff'
    const strokeOn    = document.getElementById('ep-text-stroke-on')?.checked
    const stroke      = strokeOn ? (document.getElementById('ep-text-stroke-color')?.value || '#000') : null
    const bold        = document.getElementById('ep-bold')?.classList.contains('on')
    const italic      = document.getElementById('ep-italic')?.classList.contains('on')
    const shadow      = document.getElementById('ep-shadow')?.classList.contains('on')
    CompositionEngine.addText(text, { font, size, color, stroke, strokeWidth: stroke ? 2 : 0, bold, italic, shadow })
  }

  function addShape(type, rounded = 0) {
    const fill     = document.getElementById('ep-shape-fill')?.value || '#6c63ff'
    const strokeOn = document.getElementById('ep-shape-stroke-on')?.checked
    const stroke   = strokeOn ? (document.getElementById('ep-shape-stroke-color')?.value || '#fff') : null
    CompositionEngine.addShape(type, { fill, stroke, strokeWidth: stroke ? 3 : 0, rounded: !!rounded })
  }

  function addSticker(idx) {
    const s = STICKERS[idx]
    if (!s) return
    CompositionEngine.addSticker(s.svg.replace(/\bC\b/g, _stickerColor))
  }

  function _setColor(val) { _stickerColor = val }

  return { mount, addText, addShape, addSticker, _setColor }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.ElementPicker = ElementPicker
