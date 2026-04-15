/* ai-studio.js — PageCraft AI Generative Studio
   Sidebar engine for Stable Diffusion in-painting, out-painting, and
   generative image editing. Replaces the standard image inspector panel.
   Based on: AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin logic.

   API: connects to a local SD WebUI (default http://127.0.0.1:7860)
        or any OpenAI-compatible image API with the configured endpoint. */

const AIStudio = (() => {
  'use strict'

  // ── Config (editable via Settings → API Keys) ─────────────────────────────
  let _cfg = {
    sdEndpoint : 'http://127.0.0.1:7860',  // local A1111 / Forge / ComfyUI
    openaiKey  : '',                        // OpenAI DALL-E 3 fallback
    steps      : 25,
    cfgScale   : 7,
    sampler    : 'DPM++ 2M Karras',
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let _imgEl       = null   // target <img> on canvas
  let _modal       = null
  let _canvas      = null   // source image canvas
  let _maskCanvas  = null   // in-paint mask
  let _ctx         = null
  let _mctx        = null
  let _brushDown   = false
  let _brushSize   = 30
  let _eraseMode   = false  // true = erase mask, false = paint mask
  let _versions    = []     // saved versions for undo/revert

  const $ = id => document.getElementById(id)

  // ── Build modal ───────────────────────────────────────────────────────────
  function _buildModal() {
    const div = document.createElement('div')
    div.id = 'ai-studio-modal'
    div.innerHTML = `
      <div class="ais-header">
        <div class="ais-title">
          <span class="ais-logo">✨</span>
          <span>AI Generative Studio</span>
          <span class="ais-badge">Stable Diffusion</span>
        </div>
        <div class="ais-header-actions">
          <button class="ais-btn-ghost" onclick="AIStudio.openSettings()">⚙ SD Settings</button>
          <button class="ais-btn-close" onclick="AIStudio.close()">✕</button>
        </div>
      </div>

      <div class="ais-body">
        <!-- Left: Canvas + mask tools -->
        <div class="ais-canvas-col">
          <div class="ais-canvas-toolbar">
            <button class="ais-tool-btn active" id="ais-tool-brush"
              onclick="AIStudio._setTool('brush')" title="Paint mask">🖌 Brush</button>
            <button class="ais-tool-btn" id="ais-tool-erase"
              onclick="AIStudio._setTool('erase')" title="Erase mask">⭕ Erase</button>
            <button class="ais-tool-btn" id="ais-tool-clear"
              onclick="AIStudio._clearMask()" title="Clear mask">🗑 Clear</button>
            <div class="ais-brush-size-wrap">
              <label>Size</label>
              <input type="range" min="5" max="100" value="30" id="ais-brush-range"
                oninput="AIStudio._setBrushSize(+this.value)">
              <span id="ais-brush-val">30</span>px
            </div>
          </div>
          <div class="ais-canvas-wrap" id="ais-canvas-wrap">
            <canvas id="ais-canvas"></canvas>
            <canvas id="ais-mask-canvas"></canvas>
            <div class="ais-canvas-hint" id="ais-canvas-hint">
              Paint red over the area to regenerate with AI
            </div>
          </div>
          <div class="ais-canvas-footer">
            <span id="ais-dims">—</span>
            <button class="ais-btn-ghost" onclick="AIStudio._loadImage()">↺ Reload</button>
          </div>
        </div>

        <!-- Right: Controls -->
        <div class="ais-controls-col">

          <!-- Mode tabs -->
          <div class="ais-tabs">
            <button class="ais-tab active" id="ais-tab-inpaint"
              onclick="AIStudio._setMode('inpaint')">In-paint</button>
            <button class="ais-tab" id="ais-tab-outpaint"
              onclick="AIStudio._setMode('outpaint')">Out-paint</button>
            <button class="ais-tab" id="ais-tab-txt2img"
              onclick="AIStudio._setMode('txt2img')">Generate</button>
          </div>

          <!-- In-paint panel -->
          <div class="ais-panel" id="ais-panel-inpaint">
            <div class="ais-section-label">Positive Prompt</div>
            <textarea class="ais-prompt" id="ais-prompt-pos" rows="3"
              placeholder="Describe what should appear in the masked area…
e.g. blue sky with clouds, cinematic lighting"></textarea>
            <div class="ais-section-label">Negative Prompt</div>
            <textarea class="ais-prompt" id="ais-prompt-neg" rows="2"
              placeholder="What to avoid — e.g. blurry, low quality, watermark"></textarea>
            <div class="ais-quick-prompts">
              <div class="ais-section-label">Quick Presets</div>
              <div class="ais-preset-grid">
                ${['Remove object','Clear sky','Green grass','Wooden floor',
                   'Brick wall','Blur background','Add bokeh','Smooth skin',
                   'Ocean view','City skyline','Forest trees','Sunset glow']
                  .map(p => `<button class="ais-preset" onclick="document.getElementById('ais-prompt-pos').value='${p}'">${p}</button>`)
                  .join('')}
              </div>
            </div>
            <div class="ais-params-row">
              <label>Strength
                <input type="range" min="0.1" max="1" step="0.05" value="0.75" id="ais-strength"
                  oninput="document.getElementById('ais-v-strength').textContent=this.value">
                <span id="ais-v-strength">0.75</span>
              </label>
              <label>Steps
                <input type="range" min="10" max="50" value="25" id="ais-steps"
                  oninput="document.getElementById('ais-v-steps').textContent=this.value">
                <span id="ais-v-steps">25</span>
              </label>
            </div>
          </div>

          <!-- Out-paint panel -->
          <div class="ais-panel" id="ais-panel-outpaint" style="display:none">
            <div class="ais-section-label">Extend Image Boundaries</div>
            <div class="ais-direction-grid">
              <button class="ais-dir-btn" onclick="AIStudio._outpaint('top')"   >▲ Top</button>
              <button class="ais-dir-btn" onclick="AIStudio._outpaint('bottom')">▼ Bottom</button>
              <button class="ais-dir-btn" onclick="AIStudio._outpaint('left')"  >◀ Left</button>
              <button class="ais-dir-btn" onclick="AIStudio._outpaint('right')" >▶ Right</button>
              <button class="ais-dir-btn" onclick="AIStudio._outpaint('all')"   style="grid-column:span 2">⬛ All Sides</button>
            </div>
            <div class="ais-section-label" style="margin-top:10px">Extend Amount</div>
            <input type="range" class="ais-slider" min="10" max="50" value="25" id="ais-extend-pct"
              oninput="document.getElementById('ais-v-extend').textContent=this.value+'%'">
            <div style="text-align:center;font-size:11px;color:#888;margin:2px 0 8px" id="ais-v-extend">25%</div>
            <textarea class="ais-prompt" id="ais-outpaint-prompt" rows="2"
              placeholder="Scene description for extended area…"></textarea>
          </div>

          <!-- Text-to-image panel -->
          <div class="ais-panel" id="ais-panel-txt2img" style="display:none">
            <div class="ais-section-label">Generate New Image</div>
            <textarea class="ais-prompt" id="ais-txt2img-prompt" rows="4"
              placeholder="Describe the image you want to generate…
e.g. professional photo of a modern office, 4k, cinematic"></textarea>
            <div class="ais-section-label">Style</div>
            <select class="ais-prompt" id="ais-style-select"
              style="resize:none;height:auto;">
              <option>Photorealistic</option>
              <option>Cinematic</option>
              <option>Illustration</option>
              <option>Oil Painting</option>
              <option>Anime</option>
              <option>3D Render</option>
              <option>Watercolor</option>
            </select>
            <div class="ais-params-row" style="margin-top:8px">
              <label>Width
                <select class="ais-small-select" id="ais-w">
                  <option>512</option><option selected>768</option>
                  <option>1024</option><option>1280</option>
                </select>
              </label>
              <label>Height
                <select class="ais-small-select" id="ais-h">
                  <option>512</option><option selected>768</option>
                  <option>1024</option><option>1280</option>
                </select>
              </label>
            </div>
          </div>

          <!-- Magic Generate button -->
          <button class="ais-magic-btn" id="ais-generate-btn"
            onclick="AIStudio._generate()">
            <span id="ais-btn-icon">✨</span>
            <span id="ais-btn-text">Magic Generate</span>
          </button>

          <!-- SD endpoint status -->
          <div class="ais-endpoint-row">
            <span class="ais-endpoint-dot" id="ais-ep-dot"></span>
            <span class="ais-endpoint-label" id="ais-ep-label">Checking SD…</span>
            <button class="ais-btn-tiny" onclick="AIStudio._checkEndpoint()">↺</button>
          </div>

          <!-- Version history -->
          <div class="ais-section-label" style="margin-top:12px">
            Version History
            <button class="ais-btn-tiny" style="float:right"
              onclick="AIStudio._clearVersions()">Clear</button>
          </div>
          <div class="ais-versions" id="ais-versions">
            <div style="color:#555;font-size:11px;padding:8px 0">
              Generated versions will appear here for one-click revert.
            </div>
          </div>
        </div>
      </div>

      <!-- Loading overlay -->
      <div class="ais-loading" id="ais-loading" style="display:none">
        <div class="ais-spinner"></div>
        <div class="ais-loading-text" id="ais-loading-text">Generating…</div>
        <button class="ais-btn-ghost" style="margin-top:12px" onclick="AIStudio._cancelGenerate()">Cancel</button>
      </div>

      <!-- Settings panel -->
      <div class="ais-settings-panel" id="ais-settings-panel" style="display:none">
        <div class="ais-settings-header">
          <span>SD / API Settings</span>
          <button onclick="document.getElementById('ais-settings-panel').style.display='none'">✕</button>
        </div>
        <div class="ais-settings-body">
          <label class="ais-setting-row">
            <span>Stable Diffusion Endpoint</span>
            <input type="url" id="ais-cfg-endpoint" value="http://127.0.0.1:7860"
              placeholder="http://127.0.0.1:7860">
          </label>
          <label class="ais-setting-row">
            <span>OpenAI API Key (DALL-E 3 fallback)</span>
            <input type="password" id="ais-cfg-openai" placeholder="sk-…">
          </label>
          <label class="ais-setting-row">
            <span>Default Sampler</span>
            <select id="ais-cfg-sampler">
              <option>DPM++ 2M Karras</option>
              <option>Euler a</option>
              <option>DDIM</option>
              <option>UniPC</option>
              <option>Heun</option>
            </select>
          </label>
          <button class="ais-magic-btn" style="margin-top:12px"
            onclick="AIStudio._saveSettings()">Save Settings</button>
        </div>
      </div>
    `
    document.body.appendChild(div)
    _canvas     = $('ais-canvas')
    _maskCanvas = $('ais-mask-canvas')
    _ctx        = _canvas.getContext('2d')
    _mctx       = _maskCanvas.getContext('2d')
    _attachEvents()
    return div
  }

  // ── Open ──────────────────────────────────────────────────────────────────
  function open(imgEl) {
    _imgEl = imgEl || null
    if (!_modal) _modal = _buildModal()
    _modal.style.display = 'flex'
    _loadImage()
    _checkEndpoint()
    _renderVersions()
  }

  function close() {
    if (_modal) _modal.style.display = 'none'
  }

  // ── Load source image ─────────────────────────────────────────────────────
  function _loadImage() {
    if (!_imgEl || !_ctx) return
    const src = _imgEl.currentSrc || _imgEl.src
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const MAX = 1024
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
      if (h > MAX) { w = Math.round(w * MAX / h); h = MAX }
      _canvas.width     = w; _canvas.height     = h
      _maskCanvas.width = w; _maskCanvas.height = h
      _ctx.drawImage(img, 0, 0, w, h)
      _mctx.clearRect(0, 0, w, h)
      const hint = $('ais-canvas-hint')
      if (hint) hint.style.display = 'none'
      const dims = $('ais-dims')
      if (dims) dims.textContent = `${w} × ${h}px`
    }
    img.onerror = () => {
      const hint = $('ais-canvas-hint')
      if (hint) hint.textContent = 'Cannot load image (CORS). Try replacing with a local upload first.'
    }
    img.src = src
  }

  // ── Mode tabs ─────────────────────────────────────────────────────────────
  let _mode = 'inpaint'
  function _setMode(mode) {
    _mode = mode
    ;['inpaint','outpaint','txt2img'].forEach(m => {
      const tab = $(`ais-tab-${m}`)
      const pan = $(`ais-panel-${m}`)
      if (tab) tab.classList.toggle('active', m === mode)
      if (pan) pan.style.display = m === mode ? '' : 'none'
    })
    // Hide mask tools for txt2img
    const toolbar = document.querySelector('.ais-canvas-toolbar')
    if (toolbar) toolbar.style.opacity = mode === 'txt2img' ? '0.35' : '1'
  }

  // ── Brush tools ───────────────────────────────────────────────────────────
  function _setTool(tool) {
    _eraseMode = tool === 'erase'
    ;['brush','erase'].forEach(t => {
      $(`ais-tool-${t}`)?.classList.toggle('active', t === tool)
    })
  }

  function _clearMask() {
    if (_mctx && _maskCanvas) _mctx.clearRect(0, 0, _maskCanvas.width, _maskCanvas.height)
  }

  function _setBrushSize(sz) {
    _brushSize = sz
    const v = $('ais-brush-val')
    if (v) v.textContent = sz
  }

  // ── Canvas events ─────────────────────────────────────────────────────────
  function _attachEvents() {
    if (!_maskCanvas) return
    _maskCanvas.onmousedown = ev => { _brushDown = true; _paintAt(ev) }
    _maskCanvas.onmousemove = ev => { if (_brushDown) _paintAt(ev) }
    _maskCanvas.onmouseup   = () => { _brushDown = false }
    _maskCanvas.onmouseleave = () => { _brushDown = false }
    _maskCanvas.ontouchstart = ev => { _brushDown = true; _paintAt(ev.touches[0]); ev.preventDefault() }
    _maskCanvas.ontouchmove  = ev => { _paintAt(ev.touches[0]); ev.preventDefault() }
    _maskCanvas.ontouchend   = () => { _brushDown = false }
  }

  function _paintAt(ev) {
    if (!_mctx) return
    const r   = _maskCanvas.getBoundingClientRect()
    const scX = _maskCanvas.width  / r.width
    const scY = _maskCanvas.height / r.height
    const x   = (ev.clientX - r.left) * scX
    const y   = (ev.clientY - r.top)  * scY
    _mctx.globalCompositeOperation = _eraseMode ? 'destination-out' : 'source-over'
    _mctx.beginPath()
    _mctx.arc(x, y, _brushSize / 2, 0, Math.PI * 2)
    _mctx.fillStyle = 'rgba(255, 50, 50, 0.65)'
    _mctx.fill()
  }

  // ── Generate (main action) ─────────────────────────────────────────────────
  let _abortCtrl = null
  function _generate() {
    switch (_mode) {
      case 'inpaint':  _runInpaint();  break
      case 'outpaint': _outpaint('all'); break
      case 'txt2img':  _runTxt2img();  break
    }
  }

  // ── In-paint ──────────────────────────────────────────────────────────────
  async function _runInpaint() {
    const prompt  = $('ais-prompt-pos')?.value?.trim()
    const negProm = $('ais-prompt-neg')?.value?.trim() || 'blurry, low quality, watermark'
    if (!prompt) { toast('Enter a prompt first', '⚠️'); return }

    const maskData = _mctx.getImageData(0, 0, _maskCanvas.width, _maskCanvas.height)
    const hasMask  = maskData.data.some((v, i) => i % 4 === 3 && v > 10)
    if (!hasMask) { toast('Paint a mask over the area to change', '⚠️'); return }

    _showLoading('Generating in-paint…')

    // Try SD → fallback to OpenAI edit → fallback to OpenAI generate
    try {
      const initB64 = _canvas.toDataURL('image/png').split(',')[1]
      const maskB64 = _buildBinaryMask()
      const result  = await _callSD_inpaint({
        init_images: [initB64], mask: maskB64,
        prompt, negative_prompt: negProm, inpainting_fill: 1,
        denoising_strength: +($('ais-strength')?.value || 0.75),
        steps: +($('ais-steps')?.value || 25),
        cfg_scale: _cfg.cfgScale, sampler_name: _cfg.sampler,
        width: _canvas.width, height: _canvas.height,
      })
      _applyResult('data:image/png;base64,' + result)
    } catch (sdErr) {
      // SD failed — try OpenAI image edit (DALL-E 2 supports inpainting natively)
      if (_cfg.openaiKey) {
        try {
          _setLoadingText('SD offline — trying OpenAI…')
          const dataURL = await _callOpenAI_edit(prompt)
          _applyResult(dataURL)
        } catch (oaiErr) {
          _hideLoading()
          _showSetupGuide()
        }
      } else {
        _hideLoading()
        _showSetupGuide()
      }
    }
  }

  function _buildBinaryMask() {
    // Convert red overlay to white-on-black mask for SD
    const tmp = document.createElement('canvas')
    tmp.width = _maskCanvas.width; tmp.height = _maskCanvas.height
    const tx  = tmp.getContext('2d')
    const d   = _mctx.getImageData(0, 0, tmp.width, tmp.height)
    const out = tx.createImageData(tmp.width, tmp.height)
    for (let i = 0; i < d.data.length; i += 4) {
      const alpha = d.data[i + 3]
      const val   = alpha > 10 ? 255 : 0
      out.data[i] = out.data[i+1] = out.data[i+2] = val
      out.data[i+3] = 255
    }
    tx.putImageData(out, 0, 0)
    return tmp.toDataURL('image/png').split(',')[1]
  }

  // ── Out-paint ─────────────────────────────────────────────────────────────
  async function _outpaint(direction) {
    const pct    = +($('ais-extend-pct')?.value || 25) / 100
    const prompt = $('ais-outpaint-prompt')?.value?.trim() || 'seamless extension of the scene'
    _showLoading(`Extending ${direction}…`)

    try {
      const w = _canvas.width, h = _canvas.height
      let newW = w, newH = h, offsetX = 0, offsetY = 0
      if (direction === 'top'   || direction === 'all') { newH += Math.round(h * pct); offsetY = Math.round(h * pct) }
      if (direction === 'bottom'|| direction === 'all') { newH += Math.round(h * pct) }
      if (direction === 'left'  || direction === 'all') { newW += Math.round(w * pct); offsetX = Math.round(w * pct) }
      if (direction === 'right' || direction === 'all') { newW += Math.round(w * pct) }

      // Build padded image with white extension area
      const padded = document.createElement('canvas')
      padded.width = newW; padded.height = newH
      const pctx = padded.getContext('2d')
      pctx.fillStyle = '#ffffff'
      pctx.fillRect(0, 0, newW, newH)
      pctx.drawImage(_canvas, offsetX, offsetY)

      // Mask = the new white area
      const mask = document.createElement('canvas')
      mask.width = newW; mask.height = newH
      const mctx2 = mask.getContext('2d')
      mctx2.fillStyle = '#ffffff'
      mctx2.fillRect(0, 0, newW, newH)
      mctx2.clearRect(offsetX, offsetY, w, h)  // black = keep original

      const initB64 = padded.toDataURL('image/png').split(',')[1]
      const maskB64 = mask.toDataURL('image/png').split(',')[1]

      const result = await _callSD_inpaint({
        init_images: [initB64],
        mask: maskB64,
        prompt, negative_prompt: 'blurry, low quality, seam, artifact',
        inpainting_fill: 1,
        denoising_strength: 0.85,
        steps: +($('ais-steps')?.value || 25),
        cfg_scale: _cfg.cfgScale,
        sampler_name: _cfg.sampler,
        width: newW, height: newH,
      })

      _applyResult('data:image/png;base64,' + result, newW, newH)
    } catch (e) {
      _hideLoading()
      toast('SD not available for out-painting. Configure your endpoint in Settings.', '⚠️')
    }
  }

  // ── Txt2img ───────────────────────────────────────────────────────────────
  async function _runTxt2img() {
    const prompt  = $('ais-txt2img-prompt')?.value?.trim()
    const style   = $('ais-style-select')?.value || ''
    const w       = +($('ais-w')?.value || 768)
    const h       = +($('ais-h')?.value || 768)
    if (!prompt) { toast('Enter a prompt first', '⚠️'); return }

    _showLoading('Generating image…')
    const fullPrompt = style ? `${prompt}, ${style} style` : prompt

    try {
      const result = await _callSD_txt2img({
        prompt: fullPrompt,
        negative_prompt: 'blurry, low quality, watermark, text',
        steps: +($('ais-steps')?.value || 25),
        cfg_scale: _cfg.cfgScale, sampler_name: _cfg.sampler,
        width: w, height: h,
      })
      _applyResult('data:image/png;base64,' + result, w, h)
    } catch {
      if (_cfg.openaiKey) {
        try {
          _setLoadingText('SD offline — trying OpenAI DALL-E…')
          const dataURL = await _callOpenAI_generate(fullPrompt, w, h)
          _applyResult(dataURL, w, h)
        } catch {
          _hideLoading()
          _showSetupGuide()
        }
      } else {
        _hideLoading()
        _showSetupGuide()
      }
    }
  }

  // ── SD API calls ──────────────────────────────────────────────────────────
  async function _callSD_inpaint(payload) {
    _abortCtrl = new AbortController()
    const r = await fetch(`${_cfg.sdEndpoint}/sdapi/v1/img2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: _abortCtrl.signal,
    })
    if (!r.ok) throw new Error(`SD HTTP ${r.status}`)
    const data = await r.json()
    return data.images[0]
  }

  async function _callSD_txt2img(payload) {
    _abortCtrl = new AbortController()
    const r = await fetch(`${_cfg.sdEndpoint}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: _abortCtrl.signal,
    })
    if (!r.ok) throw new Error(`SD HTTP ${r.status}`)
    const data = await r.json()
    return data.images[0]
  }

  // ── OpenAI API calls (DALL-E fallback) ────────────────────────────────────
  // DALL-E 3 text-to-image
  async function _callOpenAI_generate(prompt, w, h) {
    // DALL-E 3 supports 1024×1024, 1792×1024, 1024×1792
    const size = (w > h) ? '1792x1024' : (h > w) ? '1024x1792' : '1024x1024'
    _abortCtrl = new AbortController()
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${_cfg.openaiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        response_format: 'b64_json',
      }),
      signal: _abortCtrl.signal,
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      throw new Error(err?.error?.message || `OpenAI HTTP ${r.status}`)
    }
    const data = await r.json()
    return 'data:image/png;base64,' + data.data[0].b64_json
  }

  // DALL-E 2 image edit (inpainting) — requires PNG ≤ 4MB with alpha mask
  async function _callOpenAI_edit(prompt) {
    const size = '1024x1024'
    // Resize canvas to 1024×1024 for DALL-E 2
    const tmpC = document.createElement('canvas')
    tmpC.width = 1024; tmpC.height = 1024
    const tmpX = tmpC.getContext('2d')
    tmpX.drawImage(_canvas, 0, 0, 1024, 1024)

    // Build RGBA mask: white where mask is painted, transparent elsewhere
    const maskC = document.createElement('canvas')
    maskC.width = 1024; maskC.height = 1024
    const mX = maskC.getContext('2d')
    const rawMask = _mctx.getImageData(0, 0, _maskCanvas.width, _maskCanvas.height)
    const scaledMask = mX.createImageData(1024, 1024)
    // Simple nearest-neighbour scale of mask
    const scX = _maskCanvas.width / 1024, scY = _maskCanvas.height / 1024
    for (let y = 0; y < 1024; y++) {
      for (let x = 0; x < 1024; x++) {
        const si = (Math.floor(y * scY) * _maskCanvas.width + Math.floor(x * scX)) * 4
        const di = (y * 1024 + x) * 4
        const isMasked = rawMask.data[si + 3] > 10
        scaledMask.data[di] = scaledMask.data[di+1] = scaledMask.data[di+2] = 0
        scaledMask.data[di+3] = isMasked ? 0 : 255  // transparent = edit here
      }
    }
    mX.putImageData(scaledMask, 0, 0)

    // Convert to Blobs for multipart form
    const [imgBlob, maskBlob] = await Promise.all([
      new Promise(res => tmpC.toBlob(res, 'image/png')),
      new Promise(res => maskC.toBlob(res, 'image/png')),
    ])

    const form = new FormData()
    form.append('model', 'dall-e-2')
    form.append('image', imgBlob, 'image.png')
    form.append('mask',  maskBlob, 'mask.png')
    form.append('prompt', prompt)
    form.append('n', '1')
    form.append('size', size)
    form.append('response_format', 'b64_json')

    _abortCtrl = new AbortController()
    const r = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${_cfg.openaiKey}` },
      body: form,
      signal: _abortCtrl.signal,
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      throw new Error(err?.error?.message || `OpenAI HTTP ${r.status}`)
    }
    const data = await r.json()
    return 'data:image/png;base64,' + data.data[0].b64_json
  }

  // ── Helper: loading text + setup guide ────────────────────────────────────
  function _setLoadingText(msg) {
    const t = $('ais-loading-text')
    if (t) t.textContent = msg
  }

  function _showSetupGuide() {
    const panel = $('ais-settings-panel')
    if (panel) panel.style.display = 'flex'
    toast('No AI backend connected. Add your OpenAI key in ⚙ Settings to use DALL-E.', '⚠️')
  }

  function _cancelGenerate() {
    if (_abortCtrl) { _abortCtrl.abort(); _abortCtrl = null }
    _hideLoading()
    toast('Cancelled', '⚠️')
  }

  // ── Apply result ──────────────────────────────────────────────────────────
  function _applyResult(dataURL, w, h) {
    // Show on canvas
    const img = new Image()
    img.onload = () => {
      if (w && h) {
        _canvas.width  = w; _canvas.height  = h
        _maskCanvas.width = w; _maskCanvas.height = h
      }
      _ctx.drawImage(img, 0, 0)
      _mctx.clearRect(0, 0, _maskCanvas.width, _maskCanvas.height)

      // Save version for history
      _saveVersion(dataURL)

      // Apply to canvas element
      _applyToElement(dataURL)
      _hideLoading()
      toast('AI generation applied ✓', '✨')
    }
    img.src = dataURL
  }

  function _applyToElement(dataURL) {
    if (!_imgEl) return
    const oldSrc = _imgEl.getAttribute('src')
    _imgEl.src   = dataURL

    const wrapper = _imgEl.closest('.section-wrapper')
    const secId   = wrapper?.dataset?.id
    const propKey = _imgEl.dataset?.pcProp

    if (secId && typeof S !== 'undefined') {
      const sec = S.sections?.find(s => s.id === secId)
      if (sec?.props?._customHtml && oldSrc) {
        sec.props._customHtml = sec.props._customHtml.split(oldSrc).join(dataURL)
        if (typeof scheduleAutoSave === 'function') scheduleAutoSave()
      } else if (propKey && typeof PropertyBridge !== 'undefined') {
        PropertyBridge.update(secId, propKey, dataURL)
      } else if (typeof scheduleAutoSave === 'function') {
        scheduleAutoSave()
      }
    }
    if (typeof pushH === 'function') pushH('AI Studio: ' + (_mode))
  }

  // ── Version history ───────────────────────────────────────────────────────
  function _saveVersion(dataURL) {
    _versions.unshift({ id: Date.now(), dataURL, mode: _mode, ts: new Date().toLocaleTimeString() })
    if (_versions.length > 10) _versions.pop()
    // Save to Assets Library
    try {
      const key = 'pc_media_v1'
      const lib = JSON.parse(localStorage.getItem(key) || '[]')
      lib.unshift({ id: 'ais_' + Date.now(), src: dataURL,
                    name: `AI ${_mode} ${new Date().toLocaleTimeString()}`, source: 'AI Studio' })
      localStorage.setItem(key, JSON.stringify(lib.slice(0, 50)))
    } catch (e) {}
    _renderVersions()
  }

  function _renderVersions() {
    const el = $('ais-versions')
    if (!el) return
    if (!_versions.length) {
      el.innerHTML = '<div style="color:#555;font-size:11px;padding:8px 0">Generated versions will appear here.</div>'
      return
    }
    el.innerHTML = _versions.map((v, i) => `
      <div class="ais-version-item">
        <img src="${v.dataURL}" class="ais-version-thumb" alt="">
        <div class="ais-version-info">
          <span class="ais-version-label">${v.mode} — ${v.ts}</span>
        </div>
        <button class="ais-btn-tiny" onclick="AIStudio._revertTo(${i})">Apply</button>
      </div>`).join('')
  }

  function _revertTo(idx) {
    const v = _versions[idx]
    if (!v) return
    _applyToElement(v.dataURL)
    const img = new Image()
    img.onload = () => { _ctx.drawImage(img, 0, 0) }
    img.src = v.dataURL
    toast('Reverted to version ' + (idx + 1) + ' ✓', '↺')
  }

  function _clearVersions() {
    _versions = []
    _renderVersions()
  }

  // ── Check SD endpoint ─────────────────────────────────────────────────────
  async function _checkEndpoint() {
    const dot   = $('ais-ep-dot')
    const label = $('ais-ep-label')
    if (!dot || !label) return
    dot.className = 'ais-endpoint-dot checking'
    label.textContent = 'Checking SD…'
    try {
      const r = await fetch(`${_cfg.sdEndpoint}/sdapi/v1/options`, {
        signal: AbortSignal.timeout(3000)
      })
      if (r.ok) {
        dot.className   = 'ais-endpoint-dot online'
        label.textContent = 'Stable Diffusion connected ✓'
      } else {
        throw new Error('not ok')
      }
    } catch {
      dot.className   = 'ais-endpoint-dot offline'
      label.textContent = 'SD offline — configure in ⚙ Settings'
    }
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  function openSettings() {
    const panel = $('ais-settings-panel')
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none'
      // Populate
      const ep = $('ais-cfg-endpoint')
      if (ep) ep.value = _cfg.sdEndpoint
      const ok = $('ais-cfg-openai')
      if (ok) ok.value = _cfg.openaiKey
    }
  }

  function _saveSettings() {
    _cfg.sdEndpoint = $('ais-cfg-endpoint')?.value?.trim() || _cfg.sdEndpoint
    _cfg.openaiKey  = $('ais-cfg-openai')?.value?.trim()  || ''
    _cfg.sampler    = $('ais-cfg-sampler')?.value         || _cfg.sampler
    $('ais-settings-panel').style.display = 'none'
    _checkEndpoint()
    toast('Settings saved ✓', '⚙')
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  function _showLoading(msg) {
    const el = $('ais-loading')
    if (el) { el.style.display = 'flex' }
    const t = $('ais-loading-text')
    if (t) t.textContent = msg || 'Generating…'
  }
  function _hideLoading() {
    const el = $('ais-loading')
    if (el) el.style.display = 'none'
  }

  return {
    open, close, openSettings,
    _setMode, _setTool, _clearMask, _setBrushSize,
    _generate, _outpaint, _cancelGenerate,
    _loadImage, _revertTo, _clearVersions,
    _saveSettings, _checkEndpoint,
  }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.AIStudio = AIStudio
