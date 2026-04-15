/* minipaint-bridge.js — PageCraft × miniPaint Integration
   Top-bar engine for professional pixel editing & layer management.
   Source: https://github.com/viliusle/miniPaint
   Bridge: load selected canvas image → miniPaint → apply result back. */

const MiniPaintBridge = (() => {
  'use strict'

  const MINIPAINT_URL = 'https://viliusle.github.io/miniPaint/'
  let _modal    = null
  let _iframe   = null
  let _targetEl = null   // selected <img> on canvas (if any)
  let _fileInput = null

  // ── Build modal DOM once ──────────────────────────────────────────────────
  function _buildModal() {
    const div = document.createElement('div')
    div.id = 'mp-modal'
    div.innerHTML = `
      <div class="mp-header">
        <div class="mp-title">
          <span class="mp-logo">🎨</span>
          <span>miniPaint — Professional Editor</span>
          <span class="mp-badge">Powered by viliusle/miniPaint</span>
        </div>
        <div class="mp-actions">
          <button class="mp-btn-load" id="mp-btn-load" onclick="MiniPaintBridge._loadFromCanvas()" title="Load selected image into miniPaint">
            ↓ Load Canvas Image
          </button>
          <button class="mp-btn-apply" id="mp-btn-apply" onclick="MiniPaintBridge._applyFromFile()">
            ✓ Apply to PageCraft
          </button>
          <button class="mp-btn-close" onclick="MiniPaintBridge.close()">✕</button>
        </div>
      </div>
      <div class="mp-status" id="mp-status"></div>
      <div class="mp-body">
        <iframe id="mp-iframe" src="${MINIPAINT_URL}" allowfullscreen></iframe>
      </div>
      <input type="file" id="mp-file-input" accept="image/*" style="display:none"
             onchange="MiniPaintBridge._onFileSelected(this)">
    `
    document.body.appendChild(div)
    _iframe    = div.querySelector('#mp-iframe')
    _fileInput = div.querySelector('#mp-file-input')

    // Listen for postMessage from miniPaint (same-page messages)
    window.addEventListener('message', _onMessage)
    return div
  }

  // ── Open ──────────────────────────────────────────────────────────────────
  function open(imgEl) {
    if (!_modal) _modal = _buildModal()
    _targetEl = imgEl || null
    _modal.style.display = 'flex'

    // Update load button state
    const loadBtn = document.getElementById('mp-btn-load')
    if (loadBtn) {
      if (_targetEl) {
        loadBtn.textContent = '↓ Load: ' + (_targetEl.alt || 'Image')
        loadBtn.style.opacity = '1'
        loadBtn.disabled = false
      } else {
        loadBtn.textContent = '↓ Load Canvas Image'
        loadBtn.style.opacity = '0.45'
        loadBtn.disabled = true
      }
    }

    _setStatus(_targetEl
      ? `Selected: ${_targetEl.alt || 'image'} — click "Load Canvas Image" to edit in miniPaint`
      : 'No image selected. Click an image on the canvas first, or open a file in miniPaint directly.')
  }

  // ── Close ─────────────────────────────────────────────────────────────────
  function close() {
    if (_modal) _modal.style.display = 'none'
  }

  // ── Load current canvas image into miniPaint ──────────────────────────────
  function _loadFromCanvas() {
    if (!_targetEl) { _setStatus('No image selected on canvas.', 'warn'); return }

    const src = _targetEl.currentSrc || _targetEl.src
    if (!src) { _setStatus('Image has no src.', 'warn'); return }

    // Convert to blob URL so miniPaint can load it cross-origin
    if (src.startsWith('data:')) {
      _loadDataURL(src)
    } else {
      // Fetch → blob → data URL
      _setStatus('Fetching image…')
      fetch(src)
        .then(r => r.blob())
        .then(blob => {
          const reader = new FileReader()
          reader.onload = e => _loadDataURL(e.target.result)
          reader.readAsDataURL(blob)
        })
        .catch(() => {
          // Cross-origin blocked — fall back to URL param approach
          _loadViaURLParam(src)
        })
    }
  }

  function _loadDataURL(dataURL) {
    // Write image to a temporary blob URL and reload miniPaint with it
    const blob = _dataURLToBlob(dataURL)
    const blobURL = URL.createObjectURL(blob)
    _reloadMiniPaint(blobURL)
    _setStatus('Image loaded into miniPaint. Edit freely, then click "Apply to PageCraft".', 'ok')
  }

  function _loadViaURLParam(src) {
    // Reload iframe with ?load_url= param (miniPaint reads this on init)
    _reloadMiniPaint(src)
    _setStatus('Image URL sent to miniPaint. Cross-origin images may need manual "Open File" in miniPaint.', 'warn')
  }

  function _reloadMiniPaint(imageURL) {
    if (!_iframe) return
    const url = `${MINIPAINT_URL}?load_url=${encodeURIComponent(imageURL)}`
    _iframe.src = url
  }

  // ── Apply edited result back to PageCraft ─────────────────────────────────
  // miniPaint doesn't expose a cross-origin save API, so we ask the user to
  // save/export from miniPaint (File → Save → PNG), then pick that file here.
  function _applyFromFile() {
    if (!_fileInput) return
    _fileInput.value = ''
    _fileInput.click()
  }

  function _onFileSelected(input) {
    const file = input?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => _applyDataURL(e.target.result, file.name)
    reader.readAsDataURL(file)
  }

  function _applyDataURL(dataURL, filename) {
    // Save to Assets Library
    _syncToAssets(dataURL, filename)

    // If a target img element is selected, update it + re-render section
    if (_targetEl) {
      const oldSrc  = _targetEl.getAttribute('src')
      _targetEl.src = dataURL

      const wrapper = _targetEl.closest('.section-wrapper')
      const secId   = wrapper?.dataset?.id
      const propKey = _targetEl.dataset?.pcProp

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

      if (typeof pushH === 'function') pushH('miniPaint Edit: ' + (_targetEl.alt || 'image'))
      _setStatus('✓ Applied to canvas! The edited image has been saved to your Assets Library.', 'ok')
      toast('miniPaint edit applied ✓', '🎨')
    } else {
      _setStatus('✓ Image saved to Assets Library. Select an image on the canvas and apply again to replace it.', 'ok')
      toast('Saved to Assets Library ✓', '🎨')
    }
  }

  // ── postMessage listener (for future miniPaint API support) ───────────────
  function _onMessage(ev) {
    if (!ev.data || typeof ev.data !== 'object') return
    if (ev.data.type === 'minipaint:save' && ev.data.dataURL) {
      _applyDataURL(ev.data.dataURL, 'minipaint-export.png')
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _dataURLToBlob(dataURL) {
    const [head, body] = dataURL.split(',')
    const mime = head.match(/:(.*?);/)[1]
    const binary = atob(body)
    const arr = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
    return new Blob([arr], { type: mime })
  }

  function _syncToAssets(dataURL, name) {
    try {
      const key = 'pc_media_v1'
      const lib = JSON.parse(localStorage.getItem(key) || '[]')
      lib.unshift({ id: 'mp_' + Date.now(), src: dataURL,
                    name: name || 'miniPaint ' + new Date().toLocaleTimeString(),
                    source: 'miniPaint' })
      localStorage.setItem(key, JSON.stringify(lib.slice(0, 50)))
    } catch (e) { /* storage full */ }
  }

  function _setStatus(msg, type) {
    const el = document.getElementById('mp-status')
    if (!el) return
    el.textContent = msg
    el.className = 'mp-status' + (type ? ' mp-status-' + type : '')
    el.style.display = msg ? '' : 'none'
  }

  // ── Auto-detect selected image on canvas ──────────────────────────────────
  // Called from topbar button — picks the last Inspector-selected img
  function openWithSelected() {
    // Try to find the currently selected image from Inspector
    let img = null
    if (typeof Inspector !== 'undefined' && Inspector._selectedEl) {
      const sel = Inspector._selectedEl
      img = sel.tagName === 'IMG' ? sel : sel.querySelector('img')
    }
    // Fallback: last img-overlay hovered
    if (!img) {
      const hovered = document.querySelector('.img-editable:hover img') ||
                      document.querySelector('[data-pc-id] img')
    }
    open(img)
  }

  return { open, openWithSelected, close, _loadFromCanvas, _applyFromFile, _onFileSelected }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.MiniPaintBridge = MiniPaintBridge
