/* object-inspector.js — Floating inspector for selected Fabric objects
   CLAUDE.md: modular, < 200 lines */

const ObjectInspector = (() => {
  'use strict'

  let _el  = null
  let _obj = null
  let _fc  = null

  function _ensureEl() {
    _el = document.getElementById('ds-obj-inspector')
    if (!_el) return false
    return true
  }

  function show(obj, fc) {
    if (!obj || obj.name === '__base__' || obj.name === '__guide__') { hide(); return }
    if (!_ensureEl()) return
    _obj = obj; _fc = fc

    const isText  = obj.type === 'i-text' || obj.type === 'text'
    const hasFill = obj.type !== 'line' && obj.type !== 'path'

    _el.innerHTML = `
      <div class="oi-bar">
        <span class="oi-label">${(obj.name||obj.type).replace(/_\d+$/,'')}</span>

        ${hasFill ? `<label class="oi-item" title="Fill color">
          <span>Fill</span>
          <input type="color" class="oi-color" value="${_toHex(obj.fill||'#6c63ff')}"
            oninput="ObjectInspector._setFill(this.value)"/>
        </label>` : ''}

        ${isText ? `<label class="oi-item" title="Text background">
          <span>Bg</span>
          <input type="color" class="oi-color" value="${_toHex(obj.textBackgroundColor||'#000000')}"
            oninput="ObjectInspector._setTextBg(this.value)"/>
          <input type="checkbox" ${obj.textBackgroundColor?'checked':''} oninput="ObjectInspector._toggleTextBg(this.checked)"/>
        </label>` : ''}

        <label class="oi-item" title="Opacity">
          <span>Opacity</span>
          <input type="range" class="oi-range" min="0" max="1" step="0.01" value="${obj.opacity??1}"
            oninput="ObjectInspector._setOpacity(parseFloat(this.value))"/>
          <span class="oi-val" id="oi-op-val">${Math.round((obj.opacity??1)*100)}%</span>
        </label>

        <div class="oi-sep"></div>

        <button class="oi-btn" onclick="ObjectInspector._bringFront()" title="Bring to Front">⬆ Front</button>
        <button class="oi-btn" onclick="ObjectInspector._sendBack()"   title="Send to Back">⬇ Back</button>
        <button class="oi-btn" onclick="ObjectInspector._duplicate()"  title="Duplicate">⧉ Dup</button>
        <button class="oi-btn oi-del" onclick="DesignStudio.deleteSelected()" title="Delete">🗑 Del</button>
      </div>`

    _el.style.display = 'flex'
  }

  function hide() {
    if (_el) _el.style.display = 'none'
    _obj = null
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function _setFill(hex) {
    if (!_obj || !_fc) return
    if (_obj.type?.includes('group')) {
      _obj.getObjects?.()?.forEach(o => { if (o.fill) o.set('fill', hex) })
    } else {
      _obj.set('fill', hex)
    }
    _fc.renderAll()
  }

  function _setTextBg(hex) {
    if (!_obj || !_fc) return
    if (_obj.textBackgroundColor) _obj.set('textBackgroundColor', hex)
    _fc.renderAll()
  }

  function _toggleTextBg(on) {
    if (!_obj || !_fc) return
    const color = document.querySelector('.oi-color[type=color]:last-of-type')?.value || '#000000'
    _obj.set('textBackgroundColor', on ? color : '')
    _fc.renderAll()
  }

  function _setOpacity(val) {
    if (!_obj || !_fc) return
    _obj.set('opacity', val)
    const vEl = document.getElementById('oi-op-val')
    if (vEl) vEl.textContent = Math.round(val * 100) + '%'
    _fc.renderAll()
  }

  function _bringFront() {
    if (!_obj || !_fc) return
    _fc.bringToFront(_obj); _fc.renderAll()
    DesignStudio._updateLayers()
  }

  function _sendBack() {
    if (!_obj || !_fc) return
    // Keep base image at bottom
    _fc.sendBackwards(_obj); _fc.renderAll()
    DesignStudio._updateLayers()
  }

  function _duplicate() {
    if (!_obj || !_fc) return
    _obj.clone(clone => {
      clone.set({ left: _obj.left + 20, top: _obj.top + 20, name: (_obj.name||'obj') + '_copy' })
      _fc.add(clone); _fc.setActiveObject(clone); _fc.renderAll()
      DesignStudio._updateLayers()
    })
  }

  // ── Helper ────────────────────────────────────────────────────────────────
  function _toHex(color) {
    if (!color || typeof color !== 'string') return '#6c63ff'
    if (color.startsWith('#') && (color.length === 4 || color.length === 7)) return color
    const ctx = document.createElement('canvas').getContext('2d')
    ctx.fillStyle = color
    const c = ctx.fillStyle
    return c.startsWith('#') ? c : '#6c63ff'
  }

  return { show, hide, _setFill, _setTextBg, _toggleTextBg, _setOpacity, _bringFront, _sendBack, _duplicate }
})()
window.PageCraft = window.PageCraft || {}
window.PageCraft.ObjectInspector = ObjectInspector
