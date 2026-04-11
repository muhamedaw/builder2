/* inspector-components.js — Webflow-Grade Style Inspector Modules
   Each module: { id, label, render(el, computed, ctx), bind(container, el, computed) }
   Registers itself with Inspector via Inspector.registerModule().
   Load AFTER inspector-main.js. */

;(function () {
  'use strict'

  if (typeof Inspector === 'undefined') return

  // ── Shared helpers ─────────────────────────────────────────────────────
  const UNITS = ['px', '%', 'em', 'rem', 'vh', 'vw']

  function _pv(v) { return Inspector.parseVal(v) }
  function _inh(prop) { return Inspector.isInherited(prop) }

  function _apply(prop, val) { Inspector.applyStyle(prop, val) }

  // Renders a label that turns orange when value is inherited
  function _label(text, prop) {
    const inherited = _inh(prop)
    return `<span class="ins-label${inherited ? ' ins-inherited' : ''}" title="${inherited ? 'Inherited' : ''}">${text}</span>`
  }

  // Numeric input + unit switcher
  function _numUnit(id, propName, value, unit, units) {
    const u = units || UNITS
    return `
      <div class="ins-num-wrap">
        <input class="ins-num" id="${id}" type="number" value="${value}"
          data-prop="${propName}" style="cursor:ns-resize" />
        <select class="ins-unit" id="${id}-unit" data-prop="${propName}">
          ${u.map(uu => `<option${uu === unit ? ' selected' : ''}>${uu}</option>`).join('')}
        </select>
      </div>`
  }

  // Toggle button group
  function _toggleGroup(name, options, current) {
    return `<div class="ins-toggle-group" data-group="${name}">
      ${options.map(([val, icon, title]) => `
        <button class="ins-toggle-btn${current === val ? ' active' : ''}"
          data-group="${name}" data-val="${val}" title="${title || val}">
          ${icon}
        </button>`).join('')}
    </div>`
  }

  // ══════════════════════════════════════════════════════
  // MODULE 1 — Layout Engine
  // ══════════════════════════════════════════════════════
  Inspector.registerModule({
    id:    'layout',
    label: '⬛ Layout',

    render(el, computed) {
      if (!el || !computed) return '<div class="ins-empty">Select an element</div>'
      const display   = computed.display || 'block'
      const flexDir   = computed.flexDirection || 'row'
      const alignI    = computed.alignItems || 'stretch'
      const justifyC  = computed.justifyContent || 'flex-start'
      const gap       = _pv(computed.gap || computed.columnGap || '0px')
      const isFlex    = display === 'flex' || display === 'inline-flex'
      const isGrid    = display === 'grid' || display === 'inline-grid'

      return `
        <div class="ins-row">
          ${_label('Display', 'display')}
          ${_toggleGroup('display', [
            ['block',        '▬', 'Block'],
            ['flex',         '⇔', 'Flex'],
            ['grid',         '⊞', 'Grid'],
            ['inline-block', 'ab', 'Inline Block'],
            ['none',         '✕', 'None'],
          ], display)}
        </div>

        <div id="ins-flex-controls" style="display:${isFlex ? '' : 'none'}">
          <div class="ins-row ins-sub">
            ${_label('Direction', 'flexDirection')}
            ${_toggleGroup('flex-direction', [
              ['row',            '→', 'Row'],
              ['row-reverse',    '←', 'Row Reverse'],
              ['column',         '↓', 'Column'],
              ['column-reverse', '↑', 'Column Reverse'],
            ], flexDir)}
          </div>
          <div class="ins-row ins-sub">
            ${_label('Align', 'alignItems')}
            ${_toggleGroup('align-items', [
              ['flex-start', '⬆', 'Start'],
              ['center',     '⬛', 'Center'],
              ['flex-end',   '⬇', 'End'],
              ['stretch',    '⬍', 'Stretch'],
            ], alignI)}
          </div>
          <div class="ins-row ins-sub">
            ${_label('Justify', 'justifyContent')}
            ${_toggleGroup('justify-content', [
              ['flex-start',    '|←', 'Start'],
              ['center',        '|⬛|','Center'],
              ['flex-end',      '→|', 'End'],
              ['space-between', '|·|', 'Between'],
              ['space-around',  '·|·', 'Around'],
            ], justifyC)}
          </div>
          <div class="ins-row ins-sub">
            ${_label('Gap', 'gap')}
            ${_numUnit('ins-gap', 'gap', gap.num, gap.unit, ['px', 'rem', 'em', '%'])}
          </div>
        </div>

        <div id="ins-grid-controls" style="display:${isGrid ? '' : 'none'}">
          <div class="ins-row ins-sub">
            ${_label('Columns', 'gridTemplateColumns')}
            <input class="ins-text" id="ins-grid-cols" data-prop="gridTemplateColumns"
              value="${computed.gridTemplateColumns === 'none' ? '' : computed.gridTemplateColumns}"
              placeholder="e.g. 1fr 1fr 1fr" />
          </div>
          <div class="ins-row ins-sub">
            ${_label('Rows', 'gridTemplateRows')}
            <input class="ins-text" id="ins-grid-rows" data-prop="gridTemplateRows"
              value="${computed.gridTemplateRows === 'none' ? '' : computed.gridTemplateRows}"
              placeholder="e.g. auto auto" />
          </div>
        </div>`
    },

    bind(container, el) {
      // Toggle group buttons
      container.querySelectorAll('.ins-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const group = btn.dataset.group
          const val   = btn.dataset.val
          container.querySelectorAll(`.ins-toggle-btn[data-group="${group}"]`)
            .forEach(b => b.classList.toggle('active', b === btn))
          const propMap = {
            'display':          'display',
            'flex-direction':   'flexDirection',
            'align-items':      'alignItems',
            'justify-content':  'justifyContent',
          }
          const prop = propMap[group]
          if (prop) _apply(prop, val)
          // Show/hide flex & grid sub-controls
          if (group === 'display') {
            const fc = document.getElementById('ins-flex-controls')
            const gc = document.getElementById('ins-grid-controls')
            if (fc) fc.style.display = (val === 'flex' || val === 'inline-flex') ? '' : 'none'
            if (gc) gc.style.display = (val === 'grid' || val === 'inline-grid') ? '' : 'none'
          }
        })
      })
      // Gap + grid text inputs
      _bindNumUnit(container, 'ins-gap', 'gap')
      _bindText(container, 'ins-grid-cols', 'gridTemplateColumns')
      _bindText(container, 'ins-grid-rows', 'gridTemplateRows')
    }
  })

  // ══════════════════════════════════════════════════════
  // MODULE 2 — Surgical Spacing Box
  // ══════════════════════════════════════════════════════
  Inspector.registerModule({
    id:    'spacing',
    label: '⬚ Spacing',

    render(el, computed) {
      if (!el || !computed) return ''
      const mt = _pv(computed.marginTop),  mr = _pv(computed.marginRight)
      const mb = _pv(computed.marginBottom), ml = _pv(computed.marginLeft)
      const pt = _pv(computed.paddingTop),  pr = _pv(computed.paddingRight)
      const pb = _pv(computed.paddingBottom), pl = _pv(computed.paddingLeft)
      const w  = Math.round(parseFloat(computed.width))  || '—'
      const h  = Math.round(parseFloat(computed.height)) || '—'

      const si = (id, val, unit, prop) =>
        `<input class="ins-sp-input" id="${id}" type="number" value="${val}"
          data-prop="${prop}" data-unit="${unit}" title="${prop}" />`

      return `
        <div class="ins-box-model">
          <div class="ibm-label ibm-margin-label">MARGIN</div>
          <!-- Margin Top -->
          <div class="ibm-row ibm-top">
            ${si('sp-mt', mt.num, mt.unit, 'marginTop')}
          </div>
          <div class="ibm-middle-row">
            <!-- Margin Left -->
            <div class="ibm-side ibm-left">
              ${si('sp-ml', ml.num, ml.unit, 'marginLeft')}
            </div>
            <!-- Padding box -->
            <div class="ibm-inner">
              <div class="ibm-label ibm-padding-label">PADDING</div>
              <div class="ibm-row ibm-top">
                ${si('sp-pt', pt.num, pt.unit, 'paddingTop')}
              </div>
              <div class="ibm-middle-row">
                <div class="ibm-side ibm-left">
                  ${si('sp-pl', pl.num, pl.unit, 'paddingLeft')}
                </div>
                <div class="ibm-dimensions">${w} × ${h}</div>
                <div class="ibm-side ibm-right">
                  ${si('sp-pr', pr.num, pr.unit, 'paddingRight')}
                </div>
              </div>
              <div class="ibm-row ibm-bottom">
                ${si('sp-pb', pb.num, pb.unit, 'paddingBottom')}
              </div>
            </div>
            <!-- Margin Right -->
            <div class="ibm-side ibm-right">
              ${si('sp-mr', mr.num, mr.unit, 'marginRight')}
            </div>
          </div>
          <!-- Margin Bottom -->
          <div class="ibm-row ibm-bottom">
            ${si('sp-mb', mb.num, mb.unit, 'marginBottom')}
          </div>
        </div>

        <div class="ins-row" style="margin-top:10px">
          <div class="ins-col">
            ${_label('Width', 'width')}
            ${_numUnit('ins-w', 'width', _pv(computed.width).num, _pv(computed.width).unit)}
          </div>
          <div class="ins-col">
            ${_label('Height', 'height')}
            ${_numUnit('ins-h', 'height', _pv(computed.height).num, _pv(computed.height).unit)}
          </div>
        </div>`
    },

    bind(container, el) {
      // Drag-to-increment + change → apply
      container.querySelectorAll('.ins-sp-input').forEach(input => {
        Inspector.makeDraggable(input, val => {
          const unit = input.dataset.unit || 'px'
          _apply(input.dataset.prop, val + unit)
        })
        input.addEventListener('change', () => {
          const unit = input.dataset.unit || 'px'
          _apply(input.dataset.prop, input.value + unit)
        })
      })
      _bindNumUnit(container, 'ins-w', 'width')
      _bindNumUnit(container, 'ins-h', 'height')
    }
  })

  // ══════════════════════════════════════════════════════
  // MODULE 3 — Typography Suite
  // ══════════════════════════════════════════════════════
  Inspector.registerModule({
    id:    'typography',
    label: '𝓣 Typography',

    render(el, computed) {
      if (!el || !computed) return ''
      const ff   = computed.fontFamily?.split(',')[0]?.replace(/['"]/g,'').trim() || 'inherit'
      const fw   = computed.fontWeight || '400'
      const fs   = _pv(computed.fontSize)
      const lh   = _pv(computed.lineHeight)
      const ls   = _pv(computed.letterSpacing)
      const ta   = computed.textAlign  || 'left'
      const td   = computed.textDecoration?.split(' ')[0] || 'none'
      const tt   = computed.textTransform || 'none'
      const col  = _rgbToHex(computed.color)

      const WEIGHTS = ['100','200','300','400','500','600','700','800','900']
      const FONTS = ['Inter','Roboto','Open Sans','Poppins','Lato','Montserrat','Raleway','Nunito','system-ui','Georgia','monospace']

      return `
        <div class="ins-row">
          ${_label('Font', 'fontFamily')}
          <div class="ins-font-wrap">
            <select class="ins-select" id="ins-ff">
              ${FONTS.map(f => `<option value="${f}"${f === ff ? ' selected' : ''}>${f}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="ins-row">
          <div class="ins-col">
            ${_label('Size', 'fontSize')}
            ${_numUnit('ins-fs', 'fontSize', fs.num, fs.unit)}
          </div>
          <div class="ins-col">
            ${_label('Weight', 'fontWeight')}
            <select class="ins-select" id="ins-fw">
              ${WEIGHTS.map(w => `<option value="${w}"${w === fw ? ' selected' : ''}>${w}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="ins-row">
          <div class="ins-col">
            ${_label('Line H.', 'lineHeight')}
            ${_numUnit('ins-lh', 'lineHeight', lh.num, lh.unit, ['px','','em','rem'])}
          </div>
          <div class="ins-col">
            ${_label('Spacing', 'letterSpacing')}
            ${_numUnit('ins-ls', 'letterSpacing', ls.num, ls.unit)}
          </div>
        </div>
        <div class="ins-row">
          ${_label('Color', 'color')}
          <div class="ins-color-row">
            <input type="color" class="ins-color-swatch" id="ins-color" value="${col}" />
            <input type="text"  class="ins-color-hex"   id="ins-color-hex" value="${col}" maxlength="9" />
          </div>
        </div>
        <div class="ins-row">
          ${_label('Align', 'textAlign')}
          ${_toggleGroup('text-align', [
            ['left','⬅','Left'],['center','≡','Center'],['right','➡','Right'],['justify','⬌','Justify']
          ], ta)}
        </div>
        <div class="ins-row">
          ${_label('Decor.', 'textDecoration')}
          ${_toggleGroup('text-decoration', [
            ['none','—','None'],['underline','U̲','Underline'],['line-through','S̶','Strikethrough']
          ], td)}
        </div>
        <div class="ins-row">
          ${_label('Transform', 'textTransform')}
          ${_toggleGroup('text-transform', [
            ['none','Aa','None'],['uppercase','AA','Uppercase'],['lowercase','aa','Lowercase'],['capitalize','Aa','Capitalize']
          ], tt)}
        </div>`
    },

    bind(container) {
      // Font family
      const ff = container.querySelector('#ins-ff')
      ff?.addEventListener('change', () => _apply('fontFamily', ff.value + ', sans-serif'))

      // Font weight
      const fw = container.querySelector('#ins-fw')
      fw?.addEventListener('change', () => _apply('fontWeight', fw.value))

      // Numeric + unit inputs
      _bindNumUnit(container, 'ins-fs', 'fontSize')
      _bindNumUnit(container, 'ins-lh', 'lineHeight')
      _bindNumUnit(container, 'ins-ls', 'letterSpacing')

      // Color swatch ↔ hex sync
      const swatch = container.querySelector('#ins-color')
      const hex    = container.querySelector('#ins-color-hex')
      swatch?.addEventListener('input', () => { if (hex) hex.value = swatch.value; _apply('color', swatch.value) })
      hex?.addEventListener('input', () => {
        const v = hex.value
        if (/^#[0-9a-f]{6}$/i.test(v)) { if (swatch) swatch.value = v; _apply('color', v) }
      })

      // Toggle groups
      _bindToggleGroups(container)
    }
  })

  // ══════════════════════════════════════════════════════
  // MODULE 4 — Positioning Logic
  // ══════════════════════════════════════════════════════
  Inspector.registerModule({
    id:    'position',
    label: '📌 Position',

    render(el, computed) {
      if (!el || !computed) return ''
      const pos = computed.position || 'static'
      const isAbs = pos === 'absolute' || pos === 'fixed'
      const t = _pv(computed.top),    r = _pv(computed.right)
      const b = _pv(computed.bottom), l = _pv(computed.left)
      const zi = computed.zIndex || 'auto'

      return `
        <div class="ins-row">
          ${_label('Position', 'position')}
          ${_toggleGroup('position', [
            ['static',   'S',  'Static'],
            ['relative', 'R',  'Relative'],
            ['absolute', 'A',  'Absolute'],
            ['fixed',    'F',  'Fixed'],
            ['sticky',   '📌', 'Sticky'],
          ], pos)}
        </div>
        <div id="ins-pin-grid" style="display:${isAbs ? '' : 'none'}">
          <div class="ins-pin-grid">
            <div></div>
            <div>${_numUnit('ins-top',    'top',    t.num, t.unit)}</div>
            <div></div>
            <div>${_numUnit('ins-left',   'left',   l.num, l.unit)}</div>
            <div class="ins-pin-center">📍</div>
            <div>${_numUnit('ins-right',  'right',  r.num, r.unit)}</div>
            <div></div>
            <div>${_numUnit('ins-bottom', 'bottom', b.num, b.unit)}</div>
            <div></div>
          </div>
        </div>
        <div class="ins-row">
          ${_label('Z-Index', 'zIndex')}
          <input class="ins-num" id="ins-zi" type="number"
            value="${zi === 'auto' ? '' : zi}" placeholder="auto" data-prop="zIndex" />
        </div>`
    },

    bind(container) {
      // Position toggle group
      container.querySelectorAll('.ins-toggle-btn[data-group="position"]').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.ins-toggle-btn[data-group="position"]')
            .forEach(b => b.classList.toggle('active', b === btn))
          const val = btn.dataset.val
          _apply('position', val)
          const pg = document.getElementById('ins-pin-grid')
          if (pg) pg.style.display = (val === 'absolute' || val === 'fixed') ? '' : 'none'
        })
      })
      // Pin grid inputs
      _bindNumUnit(container, 'ins-top',    'top')
      _bindNumUnit(container, 'ins-right',  'right')
      _bindNumUnit(container, 'ins-bottom', 'bottom')
      _bindNumUnit(container, 'ins-left',   'left')
      // Z-index
      const zi = container.querySelector('#ins-zi')
      zi?.addEventListener('change', () => _apply('zIndex', zi.value || 'auto'))
    }
  })

  // ══════════════════════════════════════════════════════
  // MODULE 5 — Effects & Transforms
  // ══════════════════════════════════════════════════════
  Inspector.registerModule({
    id:    'effects',
    label: '✨ Effects & Transforms',

    render(el, computed) {
      if (!el || !computed) return ''
      const opacity   = Math.round(parseFloat(computed.opacity || 1) * 100)
      const transform = computed.transform || 'none'
      const shadow    = computed.boxShadow || 'none'
      const radius    = _pv(computed.borderRadius)
      const filter    = computed.filter || 'none'

      // Parse transform values
      const _tVal = (fn) => {
        const m = transform.match(new RegExp(`${fn}\\(([^)]+)\\)`))
        return m ? m[1] : ''
      }

      return `
        <div class="ins-row">
          ${_label('Opacity', 'opacity')}
          <div class="ins-slider-wrap">
            <input type="range" class="ins-slider" id="ins-opacity"
              min="0" max="100" value="${opacity}" />
            <span class="ins-slider-val" id="ins-opacity-val">${opacity}%</span>
          </div>
        </div>

        <div class="ins-row">
          ${_label('Radius', 'borderRadius')}
          ${_numUnit('ins-radius', 'borderRadius', radius.num, radius.unit)}
        </div>

        <div class="ins-section-label">Transforms</div>
        <div class="ins-row">
          <div class="ins-col">
            ${_label('Rotate', 'transform')}
            <div class="ins-num-wrap">
              <input class="ins-num" id="ins-rotate" type="number"
                value="${_tVal('rotate')?.replace('deg','') || ''}" placeholder="0" />
              <span class="ins-unit-fixed">deg</span>
            </div>
          </div>
          <div class="ins-col">
            ${_label('Scale', 'transform')}
            <input class="ins-num" id="ins-scale" type="number" step="0.01"
              value="${_tVal('scale') || ''}" placeholder="1" style="width:100%" />
          </div>
        </div>
        <div class="ins-row">
          <div class="ins-col">
            ${_label('Skew X', 'transform')}
            <div class="ins-num-wrap">
              <input class="ins-num" id="ins-skewx" type="number"
                value="${_tVal('skewX')?.replace('deg','') || ''}" placeholder="0" />
              <span class="ins-unit-fixed">deg</span>
            </div>
          </div>
          <div class="ins-col">
            ${_label('Skew Y', 'transform')}
            <div class="ins-num-wrap">
              <input class="ins-num" id="ins-skewy" type="number"
                value="${_tVal('skewY')?.replace('deg','') || ''}" placeholder="0" />
              <span class="ins-unit-fixed">deg</span>
            </div>
          </div>
        </div>

        <div class="ins-section-label">Box Shadow</div>
        <div class="ins-row">
          <input class="ins-text" id="ins-shadow"
            value="${shadow === 'none' ? '' : shadow}"
            placeholder="e.g. 0 4px 24px rgba(0,0,0,.3)" />
        </div>

        <div class="ins-section-label">Filter</div>
        <div class="ins-row">
          <input class="ins-text" id="ins-filter"
            value="${filter === 'none' ? '' : filter}"
            placeholder="e.g. blur(4px) brightness(1.2)" />
        </div>`
    },

    bind(container) {
      // Opacity slider
      const slider  = container.querySelector('#ins-opacity')
      const slLabel = container.querySelector('#ins-opacity-val')
      slider?.addEventListener('input', () => {
        const v = slider.value
        if (slLabel) slLabel.textContent = `${v}%`
        _apply('opacity', v / 100)
      })

      // Border radius
      _bindNumUnit(container, 'ins-radius', 'borderRadius')

      // Transforms — collect all 4 then build transform string
      const _buildTransform = () => {
        const rot  = container.querySelector('#ins-rotate')?.value
        const sc   = container.querySelector('#ins-scale')?.value
        const skx  = container.querySelector('#ins-skewx')?.value
        const sky  = container.querySelector('#ins-skewy')?.value
        const parts = []
        if (rot  && rot  !== '0') parts.push(`rotate(${rot}deg)`)
        if (sc   && sc   !== '1') parts.push(`scale(${sc})`)
        if (skx  && skx  !== '0') parts.push(`skewX(${skx}deg)`)
        if (sky  && sky  !== '0') parts.push(`skewY(${sky}deg)`)
        return parts.join(' ') || 'none'
      }
      ;['#ins-rotate','#ins-scale','#ins-skewx','#ins-skewy'].forEach(sel => {
        container.querySelector(sel)?.addEventListener('input', () => _apply('transform', _buildTransform()))
      })

      // Shadow + Filter text inputs
      _bindText(container, 'ins-shadow', 'boxShadow', v => v || 'none')
      _bindText(container, 'ins-filter',  'filter',   v => v || 'none')
    }
  })

  // ══════════════════════════════════════════════════════
  // Shared bind helpers
  // ══════════════════════════════════════════════════════

  function _bindNumUnit(container, baseId, prop) {
    const num  = container.querySelector(`#${baseId}`)
    const unit = container.querySelector(`#${baseId}-unit`)
    const update = () => {
      const v = num?.value || '0'
      const u = unit?.value || 'px'
      _apply(prop, v + u)
    }
    if (num) {
      Inspector.makeDraggable(num, () => update())
      num.addEventListener('change', update)
    }
    unit?.addEventListener('change', update)
  }

  function _bindText(container, id, prop, transform) {
    const el = container.querySelector(`#${id}`)
    el?.addEventListener('change', () => {
      const v = typeof transform === 'function' ? transform(el.value) : el.value
      _apply(prop, v)
    })
  }

  function _bindToggleGroups(container) {
    const propMap = {
      'text-align':       'textAlign',
      'text-decoration':  'textDecoration',
      'text-transform':   'textTransform',
    }
    container.querySelectorAll('.ins-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.group
        const prop  = propMap[group]
        if (!prop) return
        container.querySelectorAll(`.ins-toggle-btn[data-group="${group}"]`)
          .forEach(b => b.classList.toggle('active', b === btn))
        _apply(prop, btn.dataset.val)
      })
    })
  }

  // ── RGB to Hex converter ───────────────────────────────────────────────
  function _rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return '#000000'
    if (rgb.startsWith('#')) return rgb
    const m = rgb.match(/\d+/g)
    if (!m || m.length < 3) return '#000000'
    return '#' + m.slice(0,3).map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
  }

})()
