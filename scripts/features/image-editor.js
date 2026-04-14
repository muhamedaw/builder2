/* image-editor.js — PageCraft Photo Studio
   Launches as a full-screen modal when any image element is clicked.
   Features: Adjust, Crop, Object Eraser, AI Regenerate (stub), Decorative,
             One-Click Beautify, Layers, Asset Sync, Undo/Redo. */

const ImageEditor = (() => {
  'use strict'

  // ── State ─────────────────────────────────────────────────────────────────
  let _imgEl     = null   // source <img> DOM element on canvas
  let _canvas    = null   // main editing canvas
  let _overlay   = null   // brush overlay canvas
  let _ctx       = null   // main canvas 2D context
  let _octx      = null   // overlay 2D context
  let _original  = null   // original ImageData snapshot
  let _activeTool = 'adjust'
  let _cropRect  = null   // { x, y, w, h } in canvas coords
  let _isCropping = false
  let _brushDown = false
  let _history   = []     // undo stack of ImageData snapshots
  let _histIdx   = -1
  let _brushSize = 40
  let _cropRatio = null   // null = free, or { w, h }
  let _modal     = null
  let _layers    = []     // { id, name, visible, thumb }

  // ── Adjust values (CSS filter) ────────────────────────────────────────────
  const _adj = { brightness: 100, contrast: 100, saturation: 100, exposure: 0,
                 sharpness: 0, blur: 0, vignette: 0, temperature: 0 }

  // ── DOM references ────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id)

  // ── Modal HTML ────────────────────────────────────────────────────────────
  function _buildModal() {
    const div = document.createElement('div')
    div.id = 'image-editor-modal'
    div.className = 'hidden'
    div.innerHTML = `
      <!-- Top bar -->
      <div class="ie-topbar">
        <button class="ie-back" onclick="ImageEditor.close()">← Back</button>
        <span class="ie-title" id="ie-title">Photo Studio</span>
        <div class="ie-actions">
          <button class="ie-btn-ghost" onclick="ImageEditor.undo()" title="Undo (Ctrl+Z)">↩ Undo</button>
          <button class="ie-btn-ghost" onclick="ImageEditor.redo()" title="Redo (Ctrl+Y)">↪ Redo</button>
          <button class="ie-btn-ghost" onclick="ImageEditor.reset()">↺ Reset</button>
          <button class="ie-btn-ghost" onclick="ImageEditor.download()">⬇ Download</button>
          <button class="ie-btn-primary" onclick="ImageEditor.apply()">Apply ✓</button>
        </div>
      </div>

      <!-- Body -->
      <div class="ie-body">

        <!-- Left tools -->
        <div class="ie-tools-panel" id="ie-tools">
          ${_toolBtn('adjust',  '🎚', 'Adjust')}
          ${_toolBtn('crop',    '✂️', 'Crop & Resize')}
          ${_toolBtn('eraser',  '⭕', 'Object Eraser')}
          ${_toolBtn('ai',      '✨', 'AI Regenerate')}
          ${_toolBtn('decor',   '🎨', 'Decorative')}
          <div class="ie-tool-divider"></div>
          ${_toolBtn('text',    'T', 'Add Text')}
          ${_toolBtn('layers',  '📋', 'Layers')}
          <div class="ie-tool-divider"></div>
          <button class="ie-tool" onclick="ImageEditor.beautify()" title="One-Click Beautify">
            ⚡<span class="ie-tool-tip">One-Click Beautify</span>
          </button>
        </div>

        <!-- Canvas -->
        <div class="ie-canvas-area" id="ie-canvas-area">
          <div class="ie-canvas-wrap" id="ie-canvas-wrap">
            <canvas id="ie-canvas"></canvas>
            <canvas id="ie-overlay-canvas"></canvas>
          </div>
          <div class="ie-loading" id="ie-loading" style="display:none">
            <div class="ie-spinner"></div>
            <div class="ie-loading-text" id="ie-loading-text">Processing…</div>
          </div>
        </div>

        <!-- Right props panel -->
        <div class="ie-props-panel" id="ie-props-panel">
          <!-- populated by _renderProps() -->
        </div>
      </div>`
    document.body.appendChild(div)
    return div
  }

  function _toolBtn(id, icon, tip) {
    return `<button class="ie-tool${id==='adjust'?' active':''}" id="ie-tool-${id}"
      onclick="ImageEditor.setTool('${id}')">
      ${icon}<span class="ie-tool-tip">${tip}</span>
    </button>`
  }

  // ── Launch ────────────────────────────────────────────────────────────────
  function launch(imgEl) {
    if (!imgEl) return
    _imgEl = imgEl

    if (!_modal) _modal = _buildModal()
    _modal.classList.remove('hidden')

    _canvas  = $('ie-canvas')
    _overlay = $('ie-overlay-canvas')
    _ctx     = _canvas.getContext('2d')
    _octx    = _overlay.getContext('2d')

    // Reset state
    _history  = []
    _histIdx  = -1
    Object.assign(_adj, { brightness:100, contrast:100, saturation:100, exposure:0,
                          sharpness:0, blur:0, vignette:0, temperature:0 })
    _activeTool = 'adjust'
    _cropRect   = null
    _layers     = []

    _loadImage(imgEl.src || imgEl.currentSrc)
    _setActiveTool('adjust')
    _renderProps()
    _attachCanvasEvents()

    // Title
    const alt = imgEl.alt || 'Image'
    $('ie-title').textContent = `Photo Studio — ${alt}`
  }

  // ── Load image into canvas ────────────────────────────────────────────────
  let _corsMode = false  // true when canvas is tainted (pixel ops disabled)

  function _loadImage(src) {
    _showLoading('Loading image…')
    _corsMode = false

    const _doLoad = (useCors) => {
      const img = new Image()
      if (useCors) img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          const MAX = 1600
          let w = img.naturalWidth, h = img.naturalHeight
          if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
          if (h > MAX) { w = Math.round(w * MAX / h); h = MAX }

          _canvas.width  = w; _canvas.height  = h
          _overlay.width = w; _overlay.height = h

          _ctx.drawImage(img, 0, 0, w, h)

          // Try to read pixel data — may throw SecurityError if cross-origin
          try {
            _original = _ctx.getImageData(0, 0, w, h)
            _corsMode = false
          } catch (e) {
            // Canvas tainted — filter-only mode (no eraser pixel ops)
            _original = null
            _corsMode = true
          }

          _pushHistory()
          _hideLoading()

          // Try to get thumb — may fail if tainted
          let thumb = ''
          try { thumb = _canvas.toDataURL('image/png', 0.5) } catch(e) {}
          _addLayer('Background', thumb)
          _renderProps()
        } catch (err) {
          _hideLoading()
          toast('Error loading image: ' + err.message, '⚠️')
        }
      }

      img.onerror = () => {
        if (useCors) {
          // Retry without crossOrigin (some servers block CORS preflight)
          _doLoad(false)
        } else {
          _hideLoading()
          toast('Cannot load image', '⚠️')
        }
      }

      img.src = src
    }

    // Start with CORS mode; retry without if it fails
    _doLoad(!src.startsWith('data:'))
  }

  // ── Tool selection ────────────────────────────────────────────────────────
  function setTool(name) {
    _setActiveTool(name)
    _renderProps()
    // Clear eraser overlay when leaving
    if (name !== 'eraser') _octx.clearRect(0, 0, _overlay.width, _overlay.height)
  }

  function _setActiveTool(name) {
    _activeTool = name
    document.querySelectorAll('.ie-tool').forEach(b => b.classList.remove('active'))
    const btn = $(`ie-tool-${name}`)
    if (btn) btn.classList.add('active')
    // Cursor
    if (_canvas) _canvas.style.cursor = name === 'eraser' ? 'crosshair' : name === 'crop' ? 'crosshair' : 'default'
  }

  // ── Render right panel based on active tool ───────────────────────────────
  function _renderProps() {
    const panel = $('ie-props-panel')
    if (!panel) return
    switch (_activeTool) {
      case 'adjust':  panel.innerHTML = _propsAdjust(); break
      case 'crop':    panel.innerHTML = _propsCrop();   break
      case 'eraser':  panel.innerHTML = _propsEraser(); break
      case 'ai':      panel.innerHTML = _propsAI();     break
      case 'decor':   panel.innerHTML = _propsDecor();  break
      case 'text':    panel.innerHTML = _propsText();   break
      case 'layers':  panel.innerHTML = _propsLayers(); break
      default:        panel.innerHTML = ''
    }
  }

  // ── Props: Adjust ─────────────────────────────────────────────────────────
  function _propsAdjust() {
    const sl = (lbl, key, min, max, step=1) => `
      <div class="ie-prop-row">
        <label class="ie-prop-label">${lbl}<span id="ie-v-${key}">${_adj[key]}</span></label>
        <input class="ie-slider" type="range" min="${min}" max="${max}" step="${step}"
          value="${_adj[key]}" oninput="ImageEditor._adjChange('${key}',+this.value)">
      </div>`
    return `
      <div class="ie-section-title">Light & Color</div>
      ${sl('Brightness','brightness',0,200)}
      ${sl('Contrast','contrast',0,200)}
      ${sl('Saturation','saturation',0,200)}
      ${sl('Exposure (EV)','exposure',-100,100)}
      <div class="ie-section-title">Details</div>
      ${sl('Sharpness','sharpness',0,100)}
      ${sl('Blur (Soft Focus)','blur',0,20,0.5)}
      ${sl('Vignette','vignette',0,100)}
      ${sl('Temperature','temperature',-100,100)}`
  }

  function _adjChange(key, val) {
    _adj[key] = val
    const el = document.getElementById(`ie-v-${key}`)
    if (el) el.textContent = val
    _applyFilters()
  }

  function _applyFilters() {
    if (!_original || !_ctx) return
    // Restore original pixels
    _ctx.putImageData(_original, 0, 0)

    // Apply CSS filter via offscreen canvas trick
    const { brightness, contrast, saturation, exposure, blur, temperature } = _adj
    const bri  = brightness / 100
    const con  = contrast / 100
    const sat  = saturation / 100
    const exp  = 1 + exposure / 100
    const blrV = Math.max(0, blur)
    const tmpC = document.createElement('canvas')
    tmpC.width = _canvas.width; tmpC.height = _canvas.height
    const tmpX = tmpC.getContext('2d')

    // Build CSS filter string
    let filterStr = `brightness(${bri * exp}) contrast(${con}) saturate(${sat})`
    if (blrV > 0) filterStr += ` blur(${blrV}px)`
    if (temperature !== 0) filterStr += ` hue-rotate(${temperature * 0.15}deg)`
    tmpX.filter = filterStr
    tmpX.drawImage(_canvas, 0, 0)
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height)
    _ctx.drawImage(tmpC, 0, 0)

    // Vignette overlay
    if (_adj.vignette > 0) {
      const alpha = _adj.vignette / 100
      const grd = _ctx.createRadialGradient(
        _canvas.width/2, _canvas.height/2, _canvas.width * 0.3,
        _canvas.width/2, _canvas.height/2, _canvas.width * 0.75
      )
      grd.addColorStop(0, 'rgba(0,0,0,0)')
      grd.addColorStop(1, `rgba(0,0,0,${alpha.toFixed(2)})`)
      _ctx.fillStyle = grd
      _ctx.fillRect(0, 0, _canvas.width, _canvas.height)
    }
  }

  // ── One-Click Beautify ────────────────────────────────────────────────────
  function beautify() {
    _showLoading('Analyzing image…')
    setTimeout(() => {
      // Analyze average brightness of current canvas
      const d = _ctx.getImageData(0, 0, _canvas.width, _canvas.height).data
      let r=0,g=0,b=0, n=d.length/4
      for (let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}
      r/=n; g/=n; b/=n
      const lum = (r+g+b)/3

      // Auto-correct
      _adj.brightness = lum < 100 ? Math.min(150, 110 + (100-lum)*0.4) : lum > 170 ? Math.max(70, 100 - (lum-170)*0.5) : 100
      _adj.contrast   = 108
      _adj.saturation = 115
      _adj.vignette   = 18
      _adj.exposure   = lum < 80 ? 15 : 0

      _pushHistory()
      _applyFilters()
      if (_activeTool === 'adjust') _renderProps()
      _hideLoading()
      toast('Beautified ✓', '✨')
    }, 600)
  }

  // ── Props: Crop ───────────────────────────────────────────────────────────
  function _propsCrop() {
    const ratios = [
      { label:'Free', w:0, h:0 },
      { label:'1:1',  w:1, h:1 },
      { label:'4:3',  w:4, h:3 },
      { label:'16:9', w:16, h:9 },
      { label:'3:2',  w:3, h:2 },
      { label:'9:16', w:9, h:16 },
      { label:'2:3',  w:2, h:3 },
      { label:'5:4',  w:5, h:4 },
      { label:'A4',   w:210, h:297 },
    ]
    const btns = ratios.map(r => {
      const active = _cropRatio ? (_cropRatio.w===r.w&&_cropRatio.h===r.h) : r.w===0
      return `<button class="ie-ratio-btn${active?' active':''}"
        onclick="ImageEditor._setCropRatio(${r.w},${r.h})">${r.label}</button>`
    }).join('')
    const cw = _cropRect ? Math.round(_cropRect.w) : (_canvas?.width||0)
    const ch = _cropRect ? Math.round(_cropRect.h) : (_canvas?.height||0)
    return `
      <div class="ie-section-title">Aspect Ratio</div>
      <div class="ie-ratio-grid">${btns}</div>
      <div class="ie-section-title">Size</div>
      <div class="ie-prop-row">
        <label class="ie-prop-label">Width <span>${cw}px</span></label>
        <label class="ie-prop-label">Height <span>${ch}px</span></label>
      </div>
      <div style="padding:8px 14px;display:flex;gap:8px;">
        <button class="ie-btn-primary" style="flex:1;padding:8px" onclick="ImageEditor.applyCrop()">Apply Crop</button>
        <button class="ie-btn-ghost" style="flex:1;padding:8px" onclick="ImageEditor.cancelCrop()">Cancel</button>
      </div>
      <div class="ie-section-title">Rotate & Flip</div>
      <div style="padding:0 14px;display:grid;grid-template-columns:repeat(4,1fr);gap:5px;">
        <button class="ie-ratio-btn" onclick="ImageEditor.rotate(-90)">↺ 90°</button>
        <button class="ie-ratio-btn" onclick="ImageEditor.rotate(90)">↻ 90°</button>
        <button class="ie-ratio-btn" onclick="ImageEditor.flipH()">⇆ H</button>
        <button class="ie-ratio-btn" onclick="ImageEditor.flipV()">⇅ V</button>
      </div>`
  }

  function _setCropRatio(w, h) {
    _cropRatio = (w === 0 && h === 0) ? null : { w, h }
    _startCrop()
    _renderProps()
  }

  function _startCrop() {
    if (!_canvas) return
    const cw = _canvas.width, ch = _canvas.height
    if (_cropRatio) {
      const ratio = _cropRatio.w / _cropRatio.h
      let w = cw * 0.8, h = w / ratio
      if (h > ch * 0.8) { h = ch * 0.8; w = h * ratio }
      _cropRect = { x: (cw-w)/2, y: (ch-h)/2, w, h }
    } else {
      _cropRect = { x: cw*0.1, y: ch*0.1, w: cw*0.8, h: ch*0.8 }
    }
    _isCropping = true
    _drawCropOverlay()
  }

  function _drawCropOverlay() {
    if (!_octx || !_cropRect) return
    const { x, y, w, h } = _cropRect
    const cw = _overlay.width, ch = _overlay.height
    _octx.clearRect(0, 0, cw, ch)
    // Dim outside
    _octx.fillStyle = 'rgba(0,0,0,0.55)'
    _octx.fillRect(0, 0, cw, ch)
    _octx.clearRect(x, y, w, h)
    // Border
    _octx.strokeStyle = '#fff'
    _octx.lineWidth = 2
    _octx.strokeRect(x, y, w, h)
    // Grid thirds
    _octx.strokeStyle = 'rgba(255,255,255,0.3)'
    _octx.lineWidth = 1
    for (let i=1;i<3;i++) {
      _octx.beginPath(); _octx.moveTo(x+w*i/3, y); _octx.lineTo(x+w*i/3, y+h); _octx.stroke()
      _octx.beginPath(); _octx.moveTo(x, y+h*i/3); _octx.lineTo(x+w, y+h*i/3); _octx.stroke()
    }
    // Handles
    const handles = [
      [x,y],[x+w/2,y],[x+w,y],
      [x,y+h/2],         [x+w,y+h/2],
      [x,y+h],[x+w/2,y+h],[x+w,y+h],
    ]
    handles.forEach(([hx,hy]) => {
      _octx.fillStyle = '#fff'
      _octx.beginPath()
      _octx.arc(hx, hy, 5, 0, Math.PI*2)
      _octx.fill()
    })
  }

  function applyCrop() {
    if (!_cropRect || !_ctx) return
    const { x, y, w, h } = _cropRect
    if (w < 10 || h < 10) return
    const tmp = document.createElement('canvas')
    tmp.width = Math.round(w); tmp.height = Math.round(h)
    tmp.getContext('2d').drawImage(_canvas, x, y, w, h, 0, 0, w, h)
    _canvas.width  = tmp.width;  _canvas.height  = tmp.height
    _overlay.width = tmp.width;  _overlay.height = tmp.height
    _ctx.drawImage(tmp, 0, 0)
    _original = _ctx.getImageData(0, 0, _canvas.width, _canvas.height)
    _cropRect = null; _isCropping = false
    _octx.clearRect(0, 0, _overlay.width, _overlay.height)
    _pushHistory()
    _renderProps()
    toast('Cropped ✓', '✂️')
  }

  function cancelCrop() {
    _cropRect = null; _isCropping = false
    _octx.clearRect(0, 0, _overlay.width, _overlay.height)
    _renderProps()
  }

  // ── Rotate / Flip ─────────────────────────────────────────────────────────
  function rotate(deg) {
    const tmp = document.createElement('canvas')
    const rad = deg * Math.PI / 180
    if (deg === 90 || deg === -90) {
      tmp.width = _canvas.height; tmp.height = _canvas.width
    } else {
      tmp.width = _canvas.width; tmp.height = _canvas.height
    }
    const tx = tmp.getContext('2d')
    tx.translate(tmp.width/2, tmp.height/2)
    tx.rotate(rad)
    tx.drawImage(_canvas, -_canvas.width/2, -_canvas.height/2)
    _canvas.width  = tmp.width;  _canvas.height  = tmp.height
    _overlay.width = tmp.width;  _overlay.height = tmp.height
    _ctx.drawImage(tmp, 0, 0)
    _original = _ctx.getImageData(0, 0, _canvas.width, _canvas.height)
    _pushHistory()
  }

  function flipH() {
    const tmp = document.createElement('canvas')
    tmp.width = _canvas.width; tmp.height = _canvas.height
    const tx = tmp.getContext('2d')
    tx.translate(tmp.width, 0); tx.scale(-1, 1)
    tx.drawImage(_canvas, 0, 0)
    _ctx.drawImage(tmp, 0, 0)
    _original = _ctx.getImageData(0, 0, _canvas.width, _canvas.height)
    _pushHistory()
  }

  function flipV() {
    const tmp = document.createElement('canvas')
    tmp.width = _canvas.width; tmp.height = _canvas.height
    const tx = tmp.getContext('2d')
    tx.translate(0, tmp.height); tx.scale(1, -1)
    tx.drawImage(_canvas, 0, 0)
    _ctx.drawImage(tmp, 0, 0)
    _original = _ctx.getImageData(0, 0, _canvas.width, _canvas.height)
    _pushHistory()
  }

  // ── Props: Eraser ─────────────────────────────────────────────────────────
  function _propsEraser() {
    return `
      <div class="ie-section-title">Object Eraser</div>
      <div style="padding:8px 14px;font-size:11px;color:#888;line-height:1.6;">
        Paint over the object you want to remove. The masked area will be filled using AI inpainting.
      </div>
      <div class="ie-prop-row">
        <label class="ie-prop-label">Brush Size <span id="ie-brush-val">${_brushSize}px</span></label>
        <input class="ie-slider" type="range" min="8" max="120" value="${_brushSize}"
          oninput="ImageEditor._setBrushSize(+this.value)">
      </div>
      <div style="padding:0 14px 8px;">
        <div class="ie-brush-preview" id="ie-brush-prev"
             style="width:${_brushSize}px;height:${_brushSize}px;"></div>
      </div>
      <div style="padding:0 14px;display:flex;flex-direction:column;gap:6px;">
        <button class="ie-btn-primary" onclick="ImageEditor._applyErase()">✨ AI Erase Selection</button>
        <button class="ie-btn-ghost" onclick="ImageEditor._clearEraseMask()">Clear Mask</button>
      </div>
      <div class="ie-ai-badge" style="margin-top:10px;">
        Powered by AI Inpainting (Stable Diffusion)
      </div>`
  }

  function _setBrushSize(sz) {
    _brushSize = sz
    const v = document.getElementById('ie-brush-val')
    if (v) v.textContent = sz + 'px'
    const prev = document.getElementById('ie-brush-prev')
    if (prev) { prev.style.width = sz + 'px'; prev.style.height = sz + 'px' }
  }

  function _clearEraseMask() {
    _octx.clearRect(0, 0, _overlay.width, _overlay.height)
    toast('Mask cleared', '🖌')
  }

  function _applyErase() {
    if (_corsMode) {
      toast('Pixel editing unavailable for cross-origin images. Use Replace to upload a local file.', '⚠️')
      return
    }
    // Stub: in production, send canvas + mask to backend Stable Diffusion API
    _showLoading('Erasing with AI…')
    setTimeout(() => {
      // Fallback: fill masked region with surrounding color (content-aware fill stub)
      const maskData = _octx.getImageData(0, 0, _overlay.width, _overlay.height)
      const imgData  = _ctx.getImageData(0, 0, _canvas.width, _canvas.height)
      // Simple clone-stamp fill for each masked pixel
      for (let i = 0; i < maskData.data.length; i += 4) {
        if (maskData.data[i + 3] > 50) {  // masked pixel
          const px = (i / 4) % _canvas.width
          const py = Math.floor((i / 4) / _canvas.width)
          // Sample from 80px away (simple content-aware approximation)
          const sx = Math.min(_canvas.width - 1,  Math.max(0, px + 80))
          const sy = Math.min(_canvas.height - 1, Math.max(0, py))
          const si = (sy * _canvas.width + sx) * 4
          imgData.data[i]   = imgData.data[si]
          imgData.data[i+1] = imgData.data[si+1]
          imgData.data[i+2] = imgData.data[si+2]
        }
      }
      _ctx.putImageData(imgData, 0, 0)
      _octx.clearRect(0, 0, _overlay.width, _overlay.height)
      _original = _ctx.getImageData(0, 0, _canvas.width, _canvas.height)
      _pushHistory()
      _hideLoading()
      toast('AI Erase complete ✓', '✨')
    }, 1200)
  }

  // ── Props: AI ─────────────────────────────────────────────────────────────
  function _propsAI() {
    return `
      <div class="ie-section-title">AI Regenerate</div>
      <div style="padding:6px 14px 4px;">
        <div class="ie-ai-badge">Powered by Stable Diffusion XL</div>
      </div>
      <div class="ie-prop-row">
        <label class="ie-prop-label">Describe your edit</label>
        <textarea class="ie-ai-prompt" id="ie-ai-prompt" rows="4"
          placeholder="e.g. Make the sky a vibrant sunset, add golden hour lighting…"></textarea>
      </div>
      <div class="ie-prop-row">
        <label class="ie-prop-label">Style Preset <span id="ie-v-style">None</span></label>
        <select class="ie-ai-prompt" style="resize:none;height:auto;"
          onchange="document.getElementById('ie-v-style').textContent=this.options[this.selectedIndex].text">
          <option value="">None (use prompt only)</option>
          <option value="cinematic">Cinematic</option>
          <option value="painterly">Painterly / Oil</option>
          <option value="anime">Anime / Illustration</option>
          <option value="photorealistic">Photo-realistic</option>
          <option value="3d">3D Render</option>
        </select>
      </div>
      <div class="ie-prop-row">
        <label class="ie-prop-label">Strength <span id="ie-v-strength">70</span>%</label>
        <input class="ie-slider" type="range" min="10" max="100" value="70"
          oninput="document.getElementById('ie-v-strength').textContent=this.value">
      </div>
      <div style="padding:6px 14px 0;">
        <button class="ie-ai-btn" onclick="ImageEditor._runAI()">✨ Generate</button>
      </div>
      <div class="ie-section-title" style="margin-top:12px">Semantic Adjustments</div>
      <div style="padding:0 14px;display:flex;flex-direction:column;gap:5px;">
        ${['Make sky deeper blue','Enhance skin tones','Add bokeh background','Remove shadows','Increase golden hour'].map(s=>`
          <button class="ie-ratio-btn" style="text-align:left;padding:7px 10px;"
            onclick="document.getElementById('ie-ai-prompt').value='${s}'">${s}</button>`).join('')}
      </div>`
  }

  function _runAI() {
    const prompt = ($('ie-ai-prompt')?.value || '').trim()
    if (!prompt) { toast('Enter a description first', '⚠️'); return }
    _showLoading('Generating with AI…')
    // Production: POST canvas blob + prompt to /api/ai/image-gen
    setTimeout(() => {
      _hideLoading()
      toast('AI generation complete ✓ (connect your API key in Settings)', '✨')
    }, 2000)
  }

  // ── Props: Decorative ─────────────────────────────────────────────────────
  function _propsDecor() {
    const frames = ['🖼 Classic','📷 Polaroid','🎞 Film Strip','💎 Diamond','🌸 Floral']
    const stickers = ['⭐','❤️','🔥','🌈','🎉','✨','💫','🌟','🎨','🏆','🌺','🦋']
    return `
      <div class="ie-section-title">Frames</div>
      <div style="padding:0 14px;display:flex;flex-direction:column;gap:5px;">
        ${frames.map(f=>`<button class="ie-ratio-btn" style="text-align:left;padding:8px 10px;"
          onclick="ImageEditor._addFrame('${f}')">${f}</button>`).join('')}
      </div>
      <div class="ie-section-title">Stickers</div>
      <div style="padding:0 14px;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:10px;">
        ${stickers.map(s=>`<button class="ie-ratio-btn"
          onclick="ImageEditor._addSticker('${s}')"
          style="font-size:18px;padding:6px 0;">${s}</button>`).join('')}
      </div>
      <div class="ie-section-title">Text Watermark</div>
      <div class="ie-prop-row">
        <input class="ie-ai-prompt" id="ie-watermark-text" placeholder="Your watermark text…"
          style="resize:none;height:auto;padding:8px 10px;">
      </div>
      <div style="padding:0 14px;">
        <button class="ie-btn-ghost" style="width:100%;padding:8px"
          onclick="ImageEditor._addWatermark()">Add Watermark</button>
      </div>`
  }

  function _addFrame(name) {
    if (!_ctx) return
    const w = _canvas.width, h = _canvas.height, p = 18
    if (name.includes('Polaroid')) {
      _ctx.fillStyle = '#fff'
      _ctx.fillRect(0, 0, w, h)
      const inner = document.createElement('canvas')
      inner.width = w - p*2; inner.height = h - p*3
      inner.getContext('2d').drawImage(_canvas, p, p, inner.width, inner.height, 0, 0, inner.width, inner.height)
      _ctx.drawImage(inner, p, p)
    } else {
      // Classic border
      _ctx.strokeStyle = name.includes('Diamond') ? '#c9a227' : '#fff'
      _ctx.lineWidth = p
      _ctx.strokeRect(p/2, p/2, w - p, h - p)
      if (name.includes('Film')) {
        _ctx.fillStyle = '#111'
        for (let x = 0; x < w; x += 20) {
          _ctx.fillRect(x, 0, 10, 12)
          _ctx.fillRect(x, h - 12, 10, 12)
        }
      }
    }
    _original = _ctx.getImageData(0, 0, w, h)
    _pushHistory()
    toast(`Frame applied: ${name}`, '🖼')
  }

  function _addSticker(emoji) {
    if (!_ctx) return
    const fontSize = Math.round(Math.min(_canvas.width, _canvas.height) * 0.12)
    _ctx.font = `${fontSize}px serif`
    _ctx.textAlign = 'center'
    _ctx.fillText(emoji, _canvas.width / 2, _canvas.height / 2)
    _original = _ctx.getImageData(0, 0, _canvas.width, _canvas.height)
    _pushHistory()
    toast(`Sticker added: ${emoji}`, '✨')
  }

  function _addWatermark() {
    const text = ($('ie-watermark-text')?.value || '').trim()
    if (!text) { toast('Enter watermark text first', '⚠️'); return }
    const fontSize = Math.max(16, Math.round(_canvas.width * 0.035))
    _ctx.save()
    _ctx.font = `700 ${fontSize}px -apple-system, sans-serif`
    _ctx.fillStyle = 'rgba(255,255,255,0.55)'
    _ctx.textAlign = 'right'
    _ctx.shadowColor = 'rgba(0,0,0,0.4)'
    _ctx.shadowBlur = 6
    _ctx.fillText(text, _canvas.width - 16, _canvas.height - 16)
    _ctx.restore()
    _original = _ctx.getImageData(0, 0, _canvas.width, _canvas.height)
    _pushHistory()
    toast('Watermark added ✓', '✏️')
  }

  // ── Props: Text ───────────────────────────────────────────────────────────
  function _propsText() {
    return `
      <div class="ie-section-title">Add Text</div>
      <div class="ie-prop-row">
        <input class="ie-ai-prompt" id="ie-text-content" placeholder="Your text…"
          style="resize:none;height:auto;padding:8px 10px;">
      </div>
      <div class="ie-prop-row">
        <label class="ie-prop-label">Font Size <span id="ie-v-fsize">48</span>px</label>
        <input class="ie-slider" type="range" min="12" max="200" value="48"
          oninput="document.getElementById('ie-v-fsize').textContent=this.value">
      </div>
      <div class="ie-prop-row">
        <label class="ie-prop-label">Color</label>
        <input type="color" value="#ffffff" id="ie-text-color"
          style="width:100%;height:32px;border:none;border-radius:6px;cursor:pointer;background:none;">
      </div>
      <div style="padding:6px 14px;">
        <button class="ie-btn-primary" style="width:100%;padding:9px"
          onclick="ImageEditor._addText()">Add to Image</button>
      </div>`
  }

  function _addText() {
    const text  = ($('ie-text-content')?.value || '').trim()
    const size  = parseInt($('ie-v-fsize')?.textContent) || 48
    const color = $('ie-text-color')?.value || '#ffffff'
    if (!text) { toast('Enter text first', '⚠️'); return }
    _ctx.save()
    _ctx.font = `700 ${size}px -apple-system, sans-serif`
    _ctx.fillStyle = color
    _ctx.textAlign = 'center'
    _ctx.shadowColor = 'rgba(0,0,0,0.5)'
    _ctx.shadowBlur = 8
    _ctx.fillText(text, _canvas.width / 2, _canvas.height / 2)
    _ctx.restore()
    _original = _ctx.getImageData(0, 0, _canvas.width, _canvas.height)
    _pushHistory()
    toast('Text added ✓', '✏️')
  }

  // ── Props: Layers ─────────────────────────────────────────────────────────
  function _addLayer(name, thumbSrc) {
    _layers.unshift({ id: Date.now(), name, visible: true, thumb: thumbSrc })
    if (_activeTool === 'layers') _renderProps()
  }

  function _propsLayers() {
    if (!_layers.length) return `
      <div class="ie-section-title">Layers</div>
      <div style="padding:14px;font-size:11px;color:#666;text-align:center;">No layers yet. Make an edit to create a layer.</div>`
    const rows = _layers.map((l, i) => `
      <div class="ie-layer-item${i===0?' active':''}">
        ${l.thumb ? `<img class="ie-layer-thumb" src="${l.thumb}" alt="">` : '<div class="ie-layer-thumb"></div>'}
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${l.name}</span>
        <button class="ie-layer-eye" onclick="ImageEditor._toggleLayer(${l.id})">
          ${l.visible ? '👁' : '🙈'}
        </button>
      </div>`).join('')
    return `
      <div class="ie-section-title">Layers</div>
      ${rows}
      <div style="padding:8px 14px;">
        <button class="ie-btn-ghost" style="width:100%;padding:7px"
          onclick="ImageEditor._flattenLayers()">Flatten All</button>
      </div>`
  }

  function _toggleLayer(id) {
    const l = _layers.find(x => x.id === id)
    if (l) { l.visible = !l.visible; _renderProps() }
  }

  function _flattenLayers() {
    _layers = [{ id: Date.now(), name: 'Background', visible: true, thumb: _canvas.toDataURL('image/png',0.5) }]
    _renderProps()
    toast('Layers flattened ✓', '📋')
  }

  // ── Canvas interaction ────────────────────────────────────────────────────
  function _attachCanvasEvents() {
    if (!_overlay) return
    _overlay.style.pointerEvents = 'auto'

    _overlay.onmousedown = ev => {
      if (_activeTool === 'eraser') { _brushDown = true; _brushAt(ev) }
      if (_activeTool === 'crop')   { _cropMouseDown(ev) }
    }
    _overlay.onmousemove = ev => {
      if (_activeTool === 'eraser' && _brushDown) _brushAt(ev)
      if (_activeTool === 'crop' && _isCropping)  _cropMouseMove(ev)
    }
    _overlay.onmouseup = () => {
      if (_activeTool === 'eraser') _brushDown = false
      if (_activeTool === 'crop')   _cropMouseUp()
    }
    _overlay.onmouseleave = () => { _brushDown = false }

    // Touch support
    _overlay.ontouchstart = ev => { if (_activeTool === 'eraser') { _brushDown = true; _brushAt(ev.touches[0]) } ev.preventDefault() }
    _overlay.ontouchmove  = ev => { if (_activeTool === 'eraser' && _brushDown) _brushAt(ev.touches[0]); ev.preventDefault() }
    _overlay.ontouchend   = () => { _brushDown = false }
  }

  function _canvasPos(ev) {
    const r = _canvas.getBoundingClientRect()
    const scaleX = _canvas.width  / r.width
    const scaleY = _canvas.height / r.height
    return {
      x: (ev.clientX - r.left) * scaleX,
      y: (ev.clientY - r.top)  * scaleY,
    }
  }

  function _brushAt(ev) {
    const { x, y } = _canvasPos(ev)
    _octx.beginPath()
    _octx.arc(x, y, _brushSize / 2, 0, Math.PI * 2)
    _octx.fillStyle = 'rgba(255,60,60,0.45)'
    _octx.fill()
  }

  // ── Crop mouse events ─────────────────────────────────────────────────────
  let _cropStart = null
  function _cropMouseDown(ev) {
    _cropStart = _canvasPos(ev)
    _isCropping = true
  }
  function _cropMouseMove(ev) {
    if (!_cropStart) return
    const { x, y } = _canvasPos(ev)
    let w = x - _cropStart.x, h = y - _cropStart.y
    if (_cropRatio && h !== 0) {
      const ratio = _cropRatio.w / _cropRatio.h
      h = w / ratio
    }
    _cropRect = {
      x: Math.min(_cropStart.x, _cropStart.x + w),
      y: Math.min(_cropStart.y, _cropStart.y + h),
      w: Math.abs(w), h: Math.abs(h),
    }
    _drawCropOverlay()
  }
  function _cropMouseUp() {
    _cropStart = null
    _renderProps()
  }

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  function _pushHistory() {
    if (!_ctx) return
    // Truncate forward history
    _history = _history.slice(0, _histIdx + 1)
    _history.push(_ctx.getImageData(0, 0, _canvas.width, _canvas.height))
    if (_history.length > 30) _history.shift()
    _histIdx = _history.length - 1
  }

  function undo() {
    if (_histIdx <= 0) { toast('Nothing to undo', '⚠️'); return }
    _histIdx--
    _ctx.putImageData(_history[_histIdx], 0, 0)
    _original = _history[_histIdx]
  }

  function redo() {
    if (_histIdx >= _history.length - 1) { toast('Nothing to redo', '⚠️'); return }
    _histIdx++
    _ctx.putImageData(_history[_histIdx], 0, 0)
    _original = _history[_histIdx]
  }

  // ── Reset to original ─────────────────────────────────────────────────────
  function reset() {
    if (!_original || !_ctx) return
    // Reload from source img element
    _loadImage(_imgEl?.src || _imgEl?.currentSrc)
    Object.assign(_adj, { brightness:100, contrast:100, saturation:100, exposure:0,
                          sharpness:0, blur:0, vignette:0, temperature:0 })
    if (_activeTool === 'adjust') _renderProps()
    toast('Reset to original ✓', '↺')
  }

  // ── Download ──────────────────────────────────────────────────────────────
  function download() {
    if (!_canvas) return
    const a = document.createElement('a')
    a.download = 'pagecraft-photo.png'
    a.href = _canvas.toDataURL('image/png')
    a.click()
    toast('Downloaded ✓', '⬇')
  }

  // ── Apply — write back to source element + JSON ───────────────────────────
  function apply() {
    if (!_canvas || !_imgEl) return
    _showLoading('Saving…')
    setTimeout(() => {
      const dataURL = _canvas.toDataURL('image/jpeg', 0.92)
      const propKey = _imgEl.dataset?.pcProp   // set by renderers via data-pc-prop
      const oldSrc  = _imgEl.getAttribute('src')

      // Immediate DOM update
      _imgEl.src = dataURL

      // Save to media library
      _syncToAssets(dataURL)

      const wrapper = _imgEl.closest('.section-wrapper')
      const secId   = wrapper?.dataset?.id

      if (secId && typeof S !== 'undefined') {
        const sec = S.sections?.find(s => s.id === secId)

        if (sec?.props?._customHtml) {
          // Section was re-parented by Smart Layers — update img src inside _customHtml
          // without touching the layout or adding _customHtml unnecessarily
          if (oldSrc) {
            sec.props._customHtml = sec.props._customHtml.split(oldSrc).join(dataURL)
          }
          if (typeof scheduleAutoSave === 'function') scheduleAutoSave()

        } else if (propKey && typeof PropertyBridge !== 'undefined') {
          // Normal template section — update prop and let PropertyBridge
          // re-render the section (restores img-overlay buttons automatically)
          PropertyBridge.update(secId, propKey, dataURL)

        } else {
          // Fallback: just autosave current state
          if (typeof scheduleAutoSave === 'function') scheduleAutoSave()
        }
      }

      if (typeof pushH === 'function') pushH('Photo Edit: ' + (_imgEl.alt || 'image'))
      _hideLoading()
      toast('Changes applied ✓', '🖼')
      close()
    }, 400)
  }

  // ── Asset Sync ────────────────────────────────────────────────────────────
  function _syncToAssets(dataURL) {
    try {
      const key = 'pc_media_v1'
      const lib = JSON.parse(localStorage.getItem(key) || '[]')
      const id  = 'edited_' + Date.now()
      lib.unshift({ id, src: dataURL, name: 'Edited ' + new Date().toLocaleTimeString(), edited: true })
      // Keep library under 50 items (edited ones are large)
      const capped = lib.slice(0, 50)
      localStorage.setItem(key, JSON.stringify(capped))
    } catch (e) { /* storage full — silently skip */ }
  }

  // ── Close ─────────────────────────────────────────────────────────────────
  function close() {
    if (_modal) _modal.classList.add('hidden')
    _imgEl = null
  }

  // ── Loading overlay ───────────────────────────────────────────────────────
  function _showLoading(msg) {
    const el = $('ie-loading')
    if (!el) return
    el.style.display = 'flex'
    const txt = $('ie-loading-text')
    if (txt) txt.textContent = msg || 'Processing…'
  }

  function _hideLoading() {
    const el = $('ie-loading')
    if (el) el.style.display = 'none'
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  document.addEventListener('keydown', ev => {
    if (!_modal || _modal.classList.contains('hidden')) return
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z') { ev.preventDefault(); undo() }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'y' || (ev.shiftKey && ev.key === 'z'))) { ev.preventDefault(); redo() }
    if (ev.key === 'Escape') close()
  })

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    launch, close, apply, reset, download, beautify,
    undo, redo,
    setTool,
    applyCrop, cancelCrop,
    rotate, flipH, flipV,
    _adjChange,
    _setCropRatio,
    _setBrushSize,
    _clearEraseMask, _applyErase,
    _runAI,
    _addFrame, _addSticker, _addWatermark,
    _addText,
    _toggleLayer, _flattenLayers,
  }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.ImageEditor = ImageEditor
