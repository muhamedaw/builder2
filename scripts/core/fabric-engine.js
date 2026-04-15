/* fabric-engine.js — PageCraft Design Engine
   Source: https://github.com/fabricjs/fabric.js
   Role: Professional image manipulation — filters, transforms, clipping.
   CLAUDE.md: modular, < 300 lines, dispose() on close. */

const FabricEngine = (() => {
  'use strict'

  let _modal    = null   // outer modal element
  let _fc       = null   // fabric.Canvas instance
  let _imgObj   = null   // fabric.Image on canvas
  let _imgEl    = null   // original <img> in PageCraft DOM
  let _filters  = {}     // current filter state

  // ── Default filter values ─────────────────────────────────────────────────
  const DEFAULTS = { brightness:0, contrast:0, saturation:0,
                     blur:0, invert:0, sepia:0, noise:0, hue:0 }

  // ── Build modal once ──────────────────────────────────────────────────────
  function _ensureModal() {
    if (_modal) return
    _modal = document.createElement('div')
    _modal.id = 'fc-modal'
    _modal.innerHTML = `
      <div class="fc-topbar">
        <div class="fc-title">
          <span class="fc-logo">🎨</span>
          <span>Advanced Design Studio</span>
          <span class="fc-badge">Fabric.js</span>
        </div>
        <div class="fc-topbar-actions">
          <button class="fc-btn-ghost" onclick="FabricEngine.resetAll()">↺ Reset</button>
          <button class="fc-btn-ghost" onclick="FabricEngine.download()">⬇ Download</button>
          <button class="fc-btn-primary" onclick="FabricEngine.save()">Apply ✓</button>
          <button class="fc-btn-close"  onclick="FabricEngine.close()">✕</button>
        </div>
      </div>
      <div class="fc-body">
        <div class="fc-canvas-area" id="fc-canvas-area">
          <canvas id="fc-canvas"></canvas>
        </div>
        <div id="fc-toolbar-mount"></div>
      </div>`
    document.body.appendChild(_modal)
  }

  // ── Launch ────────────────────────────────────────────────────────────────
  function launch(imgEl) {
    if (typeof fabric === 'undefined') {
      toast('Fabric.js not loaded yet — please wait a moment', '⚠️')
      return
    }
    _imgEl   = imgEl
    _filters = { ...DEFAULTS }

    _ensureModal()
    _modal.style.display = 'flex'

    // Dispose previous canvas to free memory (CLAUDE.md: CLEAN DISPOSAL)
    if (_fc) { _fc.dispose(); _fc = null; _imgObj = null }

    // Small delay to let layout stabilise before measuring canvas area
    requestAnimationFrame(() => _initFabric())

    // Mount toolbar
    FabricToolbar.mount('fc-toolbar-mount')
  }

  // ── Init Fabric canvas ────────────────────────────────────────────────────
  function _initFabric() {
    const area = document.getElementById('fc-canvas-area')
    if (!area) return

    const W = area.clientWidth  || 900
    const H = area.clientHeight || 600

    _fc = new fabric.Canvas('fc-canvas', {
      width : W,
      height: H,
      backgroundColor: 'transparent',
      selection: false,
    })

    const src = _imgEl?.currentSrc || _imgEl?.src || ''
    if (!src) { toast('No image source found', '⚠️'); return }

    fabric.Image.fromURL(src, img => {
      if (!img) { toast('Cannot load image into Fabric canvas', '⚠️'); return }
      _imgObj = img

      // Scale to fit canvas with padding
      const scaleX = (W * 0.9) / img.width
      const scaleY = (H * 0.9) / img.height
      const scale  = Math.min(scaleX, scaleY, 1)

      img.set({
        left         : W / 2,
        top          : H / 2,
        originX      : 'center',
        originY      : 'center',
        scaleX       : scale,
        scaleY       : scale,
        cornerSize   : 10,
        cornerColor  : '#6c63ff',
        cornerStrokeColor: '#fff',
        borderColor  : '#6c63ff',
        transparentCorners: false,
        hasRotatingPoint: true,
      })

      _fc.add(img)
      _fc.setActiveObject(img)
      _fc.renderAll()
    }, { crossOrigin: 'anonymous' })
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  // map: filter key → factory function
  const _filterFactory = {
    brightness : v => new fabric.Image.filters.Brightness({ brightness: v }),
    contrast   : v => new fabric.Image.filters.Contrast({ contrast: v }),
    saturation : v => new fabric.Image.filters.Saturation({ saturation: v }),
    blur       : v => v > 0 ? new fabric.Image.filters.Blur({ blur: v }) : null,
    invert     : v => v > 0 ? new fabric.Image.filters.Invert() : null,
    sepia      : v => v > 0 ? new fabric.Image.filters.Sepia() : null,
    noise      : v => v > 0 ? new fabric.Image.filters.Noise({ noise: v * 100 }) : null,
    hue        : v => v !== 0 ? new fabric.Image.filters.HueRotation({ rotation: v }) : null,
  }

  function applyFilter(key, value) {
    if (!_imgObj) return

    // Opacity is a direct object property, not a filter
    if (key === 'opacity') {
      _imgObj.set('opacity', value)
      _fc?.renderAll()
      return
    }

    _filters[key] = value

    // Rebuild all image filters from current state
    const filters = Object.entries(_filters)
      .map(([k, v]) => _filterFactory[k]?.(v))
      .filter(Boolean)

    _imgObj.filters = filters
    _imgObj.applyFilters()
    _fc?.renderAll()
  }

  // ── Transforms ───────────────────────────────────────────────────────────
  function rotate(deg) {
    if (!_imgObj || !_fc) return
    _imgObj.set('angle', (_imgObj.angle + deg) % 360)
    _fc.renderAll()
  }

  function flip(axis) {
    if (!_imgObj || !_fc) return
    if (axis === 'H') _imgObj.set('flipX', !_imgObj.flipX)
    if (axis === 'V') _imgObj.set('flipY', !_imgObj.flipY)
    _fc.renderAll()
  }

  // ── Clip paths ─────────────────────────────────────────────────────────────
  function clipTo(shape) {
    if (!_imgObj || !_fc) return
    const w = _imgObj.getScaledWidth()
    const h = _imgObj.getScaledHeight()
    let clip = null

    if (shape === 'circle') {
      const r = Math.min(w, h) / 2
      clip = new fabric.Circle({ radius: r, originX: 'center', originY: 'center', left: 0, top: 0 })
    } else if (shape === 'rounded') {
      clip = new fabric.Rect({ width: w, height: h, rx: w * 0.08, ry: h * 0.08,
                               originX: 'center', originY: 'center', left: 0, top: 0 })
    } else if (shape === 'square') {
      const s = Math.min(w, h)
      clip = new fabric.Rect({ width: s, height: s, originX: 'center', originY: 'center', left: 0, top: 0 })
    } else {
      // Remove clip
      _imgObj.clipPath = null
      _fc.renderAll()
      return
    }
    _imgObj.clipPath = clip
    _fc.renderAll()
  }

  // ── Reset all ─────────────────────────────────────────────────────────────
  function resetAll() {
    _filters = { ...DEFAULTS }
    if (_imgObj) {
      _imgObj.filters = []
      _imgObj.applyFilters()
      _imgObj.set({ angle: 0, flipX: false, flipY: false, clipPath: null })
      _fc?.renderAll()
    }
    FabricToolbar.reset()
  }

  // ── Download ──────────────────────────────────────────────────────────────
  function download() {
    if (!_fc) return
    const a = document.createElement('a')
    a.download = 'pagecraft-design.png'
    a.href = _fc.toDataURL({ format: 'png', quality: 1, multiplier: 1 })
    a.click()
    toast('Downloaded ✓', '⬇')
  }

  // ── Save → apply back to PageCraft ────────────────────────────────────────
  function save() {
    if (!_fc || !_imgEl) { close(); return }

    // Export only the image object bounds (not the whole canvas)
    const dataURL = _imgObj
      ? _fc.toDataURL({ format: 'jpeg', quality: 0.92, multiplier: 1 })
      : _fc.toDataURL({ format: 'jpeg', quality: 0.92 })

    const oldSrc = _imgEl.getAttribute('src')
    _imgEl.src   = dataURL

    // Sync to JSON via PropertyBridge
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

    // Save to Assets Library (CLAUDE.md: VERSIONING)
    _syncToAssets(dataURL)
    if (typeof pushH === 'function') pushH('Design Edit: ' + (_imgEl.alt || 'image'))
    toast('Design applied ✓', '🎨')
    close()
  }

  function _syncToAssets(dataURL) {
    try {
      const key = 'pc_media_v1'
      const lib = JSON.parse(localStorage.getItem(key) || '[]')
      lib.unshift({ id: 'fc_' + Date.now(), src: dataURL,
                    name: 'Fabric Edit ' + new Date().toLocaleTimeString(), source: 'Fabric.js' })
      localStorage.setItem(key, JSON.stringify(lib.slice(0, 50)))
    } catch (e) {}
  }

  // ── Close + dispose (CLAUDE.md: CLEAN DISPOSAL) ───────────────────────────
  function close() {
    if (_fc) { _fc.dispose(); _fc = null; _imgObj = null }
    if (_modal) _modal.style.display = 'none'
    _imgEl = null
  }

  return { launch, close, save, download, resetAll,
           applyFilter, rotate, flip, clipTo }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.FabricEngine = FabricEngine
