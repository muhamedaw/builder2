/* composition-engine.js — PageCraft Free-Composition Engine
   Role: Wix-style multi-object layering on top of images.
   CLAUDE.md: modular, < 300 lines, dispose() on close. */

const CompositionEngine = (() => {
  'use strict'

  let _modal  = null
  let _fc     = null
  let _imgEl  = null
  let _guides = { h: null, v: null }

  const SNAP = 8

  // ── Modal ─────────────────────────────────────────────────────────────────
  function _ensureModal() {
    if (_modal) return
    _modal = document.createElement('div')
    _modal.id = 'comp-modal'
    _modal.innerHTML = `
      <div class="comp-topbar">
        <div class="comp-title">
          <span class="comp-logo">🎭</span>
          <span>Composition Studio</span>
          <span class="comp-badge">Fabric.js</span>
        </div>
        <div class="comp-actions">
          <button class="comp-btn-ghost" onclick="CompositionEngine.deleteSelected()">🗑 Delete</button>
          <button class="comp-btn-ghost" onclick="CompositionEngine.clearAll()">↺ Clear</button>
          <button class="comp-btn-ghost" onclick="CompositionEngine.download()">⬇ Download</button>
          <button class="comp-btn-primary" onclick="CompositionEngine.save()">Apply ✓</button>
          <button class="comp-btn-close"  onclick="CompositionEngine.close()">✕</button>
        </div>
      </div>
      <div class="comp-body">
        <div id="comp-picker-mount"></div>
        <div class="comp-canvas-area" id="comp-canvas-area">
          <canvas id="comp-canvas"></canvas>
        </div>
        <div class="comp-layers-panel">
          <div class="comp-layers-title">Layers</div>
          <div id="comp-layers-list"></div>
        </div>
      </div>`
    document.body.appendChild(_modal)
  }

  // ── Launch ────────────────────────────────────────────────────────────────
  function launch(imgEl) {
    if (typeof fabric === 'undefined') { toast('Fabric.js not loaded', '⚠️'); return }
    _imgEl = imgEl
    _ensureModal()
    _modal.style.display = 'flex'
    if (_fc) { _fc.dispose(); _fc = null }
    requestAnimationFrame(() => _initFabric())
    ElementPicker.mount('comp-picker-mount')
  }

  // ── Init Canvas ───────────────────────────────────────────────────────────
  function _initFabric() {
    const area = document.getElementById('comp-canvas-area')
    if (!area) return
    const W = area.clientWidth || 900
    const H = area.clientHeight || 600

    _fc = new fabric.Canvas('comp-canvas', { width: W, height: H, backgroundColor: '#111', selection: true })

    const src = _imgEl?.currentSrc || _imgEl?.src || ''
    if (!src) { toast('No image source', '⚠️'); return }

    fabric.Image.fromURL(src, img => {
      if (!img) return
      const scale = Math.min((W * 0.9) / img.width, (H * 0.9) / img.height, 1)
      img.set({ left: W/2, top: H/2, originX: 'center', originY: 'center',
                scaleX: scale, scaleY: scale, selectable: false, evented: false,
                name: '__base__' })
      _fc.add(img)
      _fc.sendToBack(img)
      _fc.renderAll()
      _setupSnap()
      _fc.on('object:added',    _updateLayers)
      _fc.on('object:removed',  _updateLayers)
      _fc.on('object:modified', _updateLayers)
      _fc.on('selection:created', _updateLayers)
      _fc.on('selection:cleared', _updateLayers)
    }, { crossOrigin: 'anonymous' })
  }

  // ── Snap guides ───────────────────────────────────────────────────────────
  function _setupSnap() {
    if (!_fc) return
    const W = _fc.width, H = _fc.height
    _fc.on('object:moving', e => {
      const obj = e.target
      const cx  = obj.getCenterPoint().x
      const cy  = obj.getCenterPoint().y
      if (Math.abs(cx - W/2) < SNAP) { obj.setCenterX(W/2); _showGuide('v', W/2) }
      else _hideGuide('v')
      if (Math.abs(cy - H/2) < SNAP) { obj.setCenterY(H/2); _showGuide('h', H/2) }
      else _hideGuide('h')
    })
    _fc.on('object:moved', () => { _hideGuide('h'); _hideGuide('v') })
  }

  function _showGuide(dir, pos) {
    if (_guides[dir]) _fc.remove(_guides[dir])
    const W = _fc.width, H = _fc.height
    const coords = dir === 'h' ? [0, pos, W, pos] : [pos, 0, pos, H]
    _guides[dir] = new fabric.Line(coords, {
      stroke: '#6c63ff', strokeWidth: 1, strokeDashArray: [5, 5],
      selectable: false, evented: false, name: '__guide__'
    })
    _fc.add(_guides[dir])
    _fc.bringToFront(_guides[dir])
  }

  function _hideGuide(dir) {
    if (_guides[dir]) { _fc.remove(_guides[dir]); _guides[dir] = null }
  }

  // ── Add elements ──────────────────────────────────────────────────────────
  function addText(text = 'Text', opts = {}) {
    if (!_fc) return
    const obj = new fabric.IText(text, {
      left: _fc.width/2, top: _fc.height/2, originX: 'center', originY: 'center',
      fontFamily: opts.font || 'Arial', fontSize: opts.size || 36,
      fill: opts.color || '#ffffff',
      stroke: opts.stroke || null, strokeWidth: opts.strokeWidth || 0,
      fontWeight: opts.bold ? 'bold' : 'normal',
      fontStyle: opts.italic ? 'italic' : 'normal',
      shadow: opts.shadow ? new fabric.Shadow({ color: 'rgba(0,0,0,0.6)', blur: 10, offsetX: 3, offsetY: 3 }) : null,
      cornerSize: 10, cornerColor: '#6c63ff', borderColor: '#6c63ff',
      cornerStrokeColor: '#fff', transparentCorners: false,
      name: 'text_' + Date.now()
    })
    _fc.add(obj); _fc.setActiveObject(obj); _fc.renderAll()
  }

  function addShape(type, opts = {}) {
    if (!_fc) return
    const cx = _fc.width/2, cy = _fc.height/2
    const fill = opts.fill || '#6c63ff'
    const base = { left: cx, top: cy, originX: 'center', originY: 'center',
                   fill, stroke: opts.stroke || null, strokeWidth: opts.strokeWidth || 0,
                   cornerSize: 10, cornerColor: '#6c63ff', borderColor: '#6c63ff',
                   cornerStrokeColor: '#fff', transparentCorners: false, name: type + '_' + Date.now() }
    const shapes = {
      circle:   () => new fabric.Circle({ ...base, radius: 50 }),
      rect:     () => new fabric.Rect({ ...base, width: 100, height: 100, rx: opts.rounded ? 12 : 0, ry: opts.rounded ? 12 : 0 }),
      triangle: () => new fabric.Triangle({ ...base, width: 100, height: 86 }),
      line:     () => new fabric.Line([cx-80, cy, cx+80, cy], { ...base, stroke: fill, strokeWidth: opts.strokeWidth || 4 }),
      star:     () => _makeStar(cx, cy, 5, 50, 22, fill, base),
      heart:    () => new fabric.Path('M 0,-30 C 0,-58 -46,-58 -46,-28 C -46,4 0,40 0,58 C 0,40 46,4 46,-28 C 46,-58 0,-58 0,-30 Z', { ...base }),
    }
    const obj = shapes[type]?.()
    if (!obj) return
    _fc.add(obj); _fc.setActiveObject(obj); _fc.renderAll()
  }

  function _makeStar(cx, cy, pts, outer, inner, fill, base) {
    const pts2 = []
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 === 0 ? outer : inner
      const a = (Math.PI / pts) * i - Math.PI / 2
      pts2.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
    }
    return new fabric.Polygon(pts2, { ...base })
  }

  function addSticker(svgStr) {
    if (!_fc) return
    fabric.loadSVGFromString(svgStr, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options)
      const scale = 80 / Math.max(obj.width || 80, obj.height || 80)
      obj.set({ left: _fc.width/2, top: _fc.height/2, originX: 'center', originY: 'center',
                scaleX: scale, scaleY: scale,
                cornerSize: 10, cornerColor: '#6c63ff', borderColor: '#6c63ff',
                cornerStrokeColor: '#fff', transparentCorners: false, name: 'sticker_' + Date.now() })
      _fc.add(obj); _fc.setActiveObject(obj); _fc.renderAll()
    })
  }

  // ── Layers panel ──────────────────────────────────────────────────────────
  function _updateLayers() {
    const list = document.getElementById('comp-layers-list')
    if (!list || !_fc) return
    const active = _fc.getActiveObject()
    const objs   = _fc.getObjects().filter(o => !['__base__', '__guide__'].includes(o.name))
    list.innerHTML = [...objs].reverse().map((obj, i) => {
      const ri    = objs.length - 1 - i
      const icon  = (obj.type === 'i-text' || obj.type === 'text') ? '📝' : obj.type === 'image' ? '🖼' : '🔷'
      const label = (obj.name || obj.type).replace(/_\d+$/, '')
      return `<div class="comp-layer-item ${obj === active ? 'active' : ''}" onclick="CompositionEngine._selectObj(${ri})">
        <span>${icon}</span><span class="comp-layer-name">${label}</span>
        <div class="comp-layer-btns">
          <button onclick="CompositionEngine._layerUp(${ri});event.stopPropagation()">↑</button>
          <button onclick="CompositionEngine._layerDown(${ri});event.stopPropagation()">↓</button>
          <button onclick="CompositionEngine._removeObj(${ri});event.stopPropagation()">✕</button>
        </div>
      </div>`
    }).join('')
  }

  function _getObjs() { return _fc?.getObjects().filter(o => !['__base__', '__guide__'].includes(o.name)) || [] }

  function _selectObj(i) { const o = _getObjs()[i]; if (o && _fc) { _fc.setActiveObject(o); _fc.renderAll(); _updateLayers() } }
  function _layerUp(i)   { const o = _getObjs()[i]; if (o && _fc) { _fc.bringForward(o);  _fc.renderAll(); _updateLayers() } }
  function _layerDown(i) { const o = _getObjs()[i]; if (o && _fc) { _fc.sendBackwards(o); _fc.renderAll(); _updateLayers() } }
  function _removeObj(i) { const o = _getObjs()[i]; if (o && _fc) { _fc.remove(o);        _fc.renderAll(); _updateLayers() } }

  function deleteSelected() {
    const a = _fc?.getActiveObject()
    if (a && a.name !== '__base__') { _fc.remove(a); _fc.renderAll(); _updateLayers() }
  }

  function clearAll() {
    _getObjs().forEach(o => _fc.remove(o)); _fc?.renderAll(); _updateLayers()
  }

  // ── Save / Download ───────────────────────────────────────────────────────
  function download() {
    if (!_fc) return
    _hideGuide('h'); _hideGuide('v')
    const a = document.createElement('a')
    a.download = 'pagecraft-composition.png'
    a.href = _fc.toDataURL({ format: 'png', quality: 1, multiplier: 2 })
    a.click()
    toast('Downloaded ✓', '⬇')
  }

  function save() {
    if (!_fc || !_imgEl) { close(); return }
    _hideGuide('h'); _hideGuide('v')
    const dataURL = _fc.toDataURL({ format: 'jpeg', quality: 0.93, multiplier: 2 })
    const oldSrc  = _imgEl.getAttribute('src')
    _imgEl.src    = dataURL

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

    try {
      const lib = JSON.parse(localStorage.getItem('pc_media_v1') || '[]')
      lib.unshift({ id: 'comp_' + Date.now(), src: dataURL, name: 'Composition ' + new Date().toLocaleTimeString(), source: 'Composition' })
      localStorage.setItem('pc_media_v1', JSON.stringify(lib.slice(0, 50)))
    } catch(e) {}

    if (typeof pushH === 'function') pushH('Composition: ' + (_imgEl.alt || 'image'))
    toast('Composition applied ✓', '🎭')
    close()
  }

  // ── Close + dispose ───────────────────────────────────────────────────────
  function close() {
    if (_fc) { _fc.dispose(); _fc = null }
    if (_modal) _modal.style.display = 'none'
    _imgEl = null; _guides = { h: null, v: null }
  }

  return { launch, close, save, download, addText, addShape, addSticker,
           deleteSelected, clearAll, _selectObj, _layerUp, _layerDown, _removeObj, _updateLayers }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.CompositionEngine = CompositionEngine
