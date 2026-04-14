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
          data-prop="${propName}" placeholder="0" />
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
    tab:   'layout',
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

    bind(container) {
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
    tab:   'style',
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

    bind(container) {
      container.querySelectorAll('.ins-sp-input').forEach(input => {
        const applyInput = () => {
          const unit = input.dataset.unit || 'px'
          const v = input.value !== '' ? input.value : '0'
          _apply(input.dataset.prop, v + unit)
        }
        input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyInput() } })
        input.addEventListener('blur', applyInput)
        input.addEventListener('change', applyInput)
        Inspector.makeDraggable(input, () => applyInput())
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
    tab:   'style',
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
    tab:   'layout',
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
    tab:   'style',
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
        ${_renderShadowUI(shadow)}

        <div class="ins-section-label" style="margin-top:6px">✨ Magic Smooth Shadow</div>
        <div class="ins-row" style="align-items:center;gap:8px">
          <label class="ins-shadow-toggle">
            <input type="checkbox" id="ins-magic-sh-on" />
            <span class="ins-shadow-track"></span>
          </label>
          <span style="font-size:11px;color:var(--muted)">5-layer organic depth</span>
        </div>
        <div id="ins-magic-sh-fields" style="opacity:.45;pointer-events:none">
          <div class="ins-row" style="gap:8px;align-items:center;margin-top:4px">
            <input type="color" class="ins-color-sm" id="ins-msh-color" value="#000000" />
            <input type="range" class="ins-slider" id="ins-msh-intensity" min="1" max="100" value="40" style="flex:1" />
            <span class="ins-slider-val" id="ins-msh-val">40%</span>
          </div>
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

      // Box Shadow visual controls
      _bindShadowUI(container)

      // Magic Smooth Shadow
      const _buildMagicShadow = () => {
        const color = container.querySelector('#ins-msh-color')?.value || '#000000'
        const level = (parseFloat(container.querySelector('#ins-msh-intensity')?.value) || 40) / 100
        const r = parseInt(color.slice(1,3),16)||0, g = parseInt(color.slice(3,5),16)||0, b = parseInt(color.slice(5,7),16)||0
        const shadow = [
          [0, 1,  2,  0, 0.08],[0, 2,  4,  0, 0.07],
          [0, 4,  8,  0, 0.06],[0, 8, 16,  0, 0.05],[0,16, 32,  0, 0.04],
        ].map(([x,y,bl,sp,a]) => `${x}px ${y}px ${bl}px ${sp}px rgba(${r},${g},${b},${+(a*level*2.5).toFixed(3)})`).join(', ')
        _apply('boxShadow', shadow)
      }
      container.querySelector('#ins-magic-sh-on')?.addEventListener('change', function() {
        const f = container.querySelector('#ins-magic-sh-fields')
        if (f) { f.style.opacity = this.checked ? '' : '.45'; f.style.pointerEvents = this.checked ? '' : 'none' }
        this.checked ? _buildMagicShadow() : _apply('boxShadow', 'none')
      })
      container.querySelector('#ins-msh-color')?.addEventListener('input', _buildMagicShadow)
      const mshSlider = container.querySelector('#ins-msh-intensity')
      const mshLabel  = container.querySelector('#ins-msh-val')
      mshSlider?.addEventListener('input', () => {
        if (mshLabel) mshLabel.textContent = mshSlider.value + '%'
        _buildMagicShadow()
      })

      // Filter text input
      _bindText(container, 'ins-filter', 'filter', v => v || 'none')
    }
  })

  // ══════════════════════════════════════════════════════
  // Shared bind helpers
  // ══════════════════════════════════════════════════════
  // Box Shadow helpers
  // ══════════════════════════════════════════════════════

  function _parseShadow(str) {
    const def = { enabled: false, x: 0, y: 4, blur: 12, spread: 0, color: '#000000', alpha: 0.25, inset: false }
    if (!str || str === 'none') return def
    const inset = /\binset\b/.test(str)
    const s = str.replace(/\binset\b/, '').trim()
    let color = '#000000', alpha = 0.25
    const rgba = s.match(/rgba?\s*\([^)]+\)/)
    if (rgba) {
      const parts = rgba[0].match(/[\d.]+/g) || []
      if (parts.length >= 3) {
        const r = Math.round(parseFloat(parts[0]))
        const g = Math.round(parseFloat(parts[1]))
        const b = Math.round(parseFloat(parts[2]))
        alpha = parts[3] !== undefined ? Math.min(1, parseFloat(parts[3])) : 1
        color = '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
      }
    } else {
      const hex = s.match(/#[0-9a-fA-F]{3,8}/)
      if (hex) color = hex[0].slice(0, 7)
    }
    const noColor = s.replace(/rgba?\s*\([^)]+\)/, '').replace(/#[0-9a-fA-F]{3,8}/, '').trim()
    const nums = noColor.match(/-?[\d.]+/g) || []
    const px = i => parseFloat(nums[i]) || 0
    return { enabled: true, x: px(0), y: px(1), blur: Math.max(0, px(2)), spread: px(3), color, alpha, inset }
  }

  function _buildShadowStr(sh) {
    if (!sh.enabled) return 'none'
    const r = parseInt(sh.color.slice(1, 3), 16) || 0
    const g = parseInt(sh.color.slice(3, 5), 16) || 0
    const b = parseInt(sh.color.slice(5, 7), 16) || 0
    const a = Math.round(Math.min(1, Math.max(0, sh.alpha)) * 100) / 100
    return `${sh.inset ? 'inset ' : ''}${sh.x}px ${sh.y}px ${sh.blur}px ${sh.spread}px rgba(${r},${g},${b},${a})`
  }

  function _renderShadowUI(shadow) {
    const sh = _parseShadow(shadow)
    const dis = sh.enabled ? '' : 'opacity:.45;pointer-events:none'
    return `
      <div class="ins-row" style="align-items:center;gap:8px">
        <label class="ins-shadow-toggle">
          <input type="checkbox" id="ins-sh-on" ${sh.enabled ? 'checked' : ''} />
          <span class="ins-shadow-track"></span>
        </label>
        <span style="font-size:11px;color:var(--muted)">Shadow</span>
        ${sh.enabled ? `<span style="font-size:10px;color:#64748b;margin-left:auto;font-variant-numeric:tabular-nums">${sh.x}px ${sh.y}px ${sh.blur}px</span>` : ''}
      </div>
      <div id="ins-sh-fields" style="${dis}">
        <div class="ins-row" style="gap:6px">
          <div class="ins-col">
            ${_label('X', 'boxShadow')}
            <div class="ins-num-wrap">
              <input class="ins-num" id="ins-sh-x" type="number" value="${sh.x}" placeholder="0" />
              <span class="ins-unit-fixed">px</span>
            </div>
          </div>
          <div class="ins-col">
            ${_label('Y', 'boxShadow')}
            <div class="ins-num-wrap">
              <input class="ins-num" id="ins-sh-y" type="number" value="${sh.y}" placeholder="0" />
              <span class="ins-unit-fixed">px</span>
            </div>
          </div>
        </div>
        <div class="ins-row" style="gap:6px">
          <div class="ins-col">
            ${_label('Blur', 'boxShadow')}
            <div class="ins-num-wrap">
              <input class="ins-num" id="ins-sh-blur" type="number" min="0" value="${sh.blur}" placeholder="0" />
              <span class="ins-unit-fixed">px</span>
            </div>
          </div>
          <div class="ins-col">
            ${_label('Spread', 'boxShadow')}
            <div class="ins-num-wrap">
              <input class="ins-num" id="ins-sh-spread" type="number" value="${sh.spread}" placeholder="0" />
              <span class="ins-unit-fixed">px</span>
            </div>
          </div>
        </div>
        <div class="ins-row" style="gap:8px;align-items:center">
          <input type="color" class="ins-color-sm" id="ins-sh-color" value="${sh.color}" title="Shadow color" />
          <input type="range" class="ins-slider" id="ins-sh-alpha" min="0" max="100" value="${Math.round(sh.alpha * 100)}" style="flex:1" />
          <span class="ins-slider-val" id="ins-sh-alpha-val" style="min-width:32px">${Math.round(sh.alpha * 100)}%</span>
        </div>
        <div class="ins-row">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);cursor:pointer;user-select:none">
            <input type="checkbox" id="ins-sh-inset" ${sh.inset ? 'checked' : ''} style="cursor:pointer" />
            Inset
          </label>
        </div>
      </div>`
  }

  function _bindShadowUI(container) {
    const _get = () => ({
      enabled: !!container.querySelector('#ins-sh-on')?.checked,
      x:       parseFloat(container.querySelector('#ins-sh-x')?.value)      || 0,
      y:       parseFloat(container.querySelector('#ins-sh-y')?.value)      || 0,
      blur:    Math.max(0, parseFloat(container.querySelector('#ins-sh-blur')?.value)   || 0),
      spread:  parseFloat(container.querySelector('#ins-sh-spread')?.value) || 0,
      color:   container.querySelector('#ins-sh-color')?.value  || '#000000',
      alpha:   (parseFloat(container.querySelector('#ins-sh-alpha')?.value) || 25) / 100,
      inset:   !!container.querySelector('#ins-sh-inset')?.checked,
    })
    const _apply_ = () => _apply('boxShadow', _buildShadowStr(_get()))

    // Enable toggle
    container.querySelector('#ins-sh-on')?.addEventListener('change', function() {
      const fields = container.querySelector('#ins-sh-fields')
      if (fields) { fields.style.opacity = this.checked ? '' : '.45'; fields.style.pointerEvents = this.checked ? '' : 'none' }
      _apply_()
    })

    // Number inputs — Enter or blur
    ;['#ins-sh-x','#ins-sh-y','#ins-sh-blur','#ins-sh-spread'].forEach(sel => {
      const inp = container.querySelector(sel)
      if (!inp) return
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); _apply_() } })
      inp.addEventListener('blur',   _apply_)
      inp.addEventListener('change', _apply_)
    })

    // Color picker
    container.querySelector('#ins-sh-color')?.addEventListener('input', _apply_)

    // Alpha slider
    const alphaSlider = container.querySelector('#ins-sh-alpha')
    const alphaLabel  = container.querySelector('#ins-sh-alpha-val')
    alphaSlider?.addEventListener('input', () => {
      if (alphaLabel) alphaLabel.textContent = alphaSlider.value + '%'
      _apply_()
    })

    // Inset
    container.querySelector('#ins-sh-inset')?.addEventListener('change', _apply_)
  }

  // ══════════════════════════════════════════════════════

  function _bindNumUnit(container, baseId, prop) {
    const num  = container.querySelector(`#${baseId}`)
    const unit = container.querySelector(`#${baseId}-unit`)
    const update = () => {
      const v = num?.value !== '' ? num.value : '0'
      const u = unit?.value || 'px'
      _apply(prop, v + u)
    }
    if (num) {
      // Type and press Enter → instant apply
      num.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); update() } })
      // Lose focus → apply
      num.addEventListener('blur', update)
      // Arrow keys still work via 'change'
      num.addEventListener('change', update)
      // Drag-scrub as secondary bonus (still works if user prefers it)
      Inspector.makeDraggable(num, () => update())
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

  // ══════════════════════════════════════════════════════
  // MODULE 6 — Backgrounds
  // ══════════════════════════════════════════════════════
  Inspector.registerModule({
    id:    'background',
    tab:   'style',
    label: '🎨 Background',

    render(el, computed) {
      if (!el || !computed) return ''
      const bg      = computed.backgroundColor || 'transparent'
      const bgImg   = computed.backgroundImage || 'none'
      const bgSize  = computed.backgroundSize  || 'auto'
      const bgPos   = computed.backgroundPosition || '0% 0%'
      const bgRep   = computed.backgroundRepeat   || 'repeat'
      const blend   = computed.mixBlendMode        || 'normal'
      const bgClip  = computed.backgroundClip      || 'border-box'
      const opacity = computed.opacity             || '1'

      const solidColor = _rgbToHex(bg)
      const hasGrad  = bgImg.startsWith('linear-gradient') || bgImg.startsWith('radial-gradient')
      const hasImg   = bgImg.startsWith('url(')

      // Parse gradient if present
      const gradFrom = hasGrad ? (_rgbToHex(bgImg.match(/rgba?\([^)]+\)|#[0-9a-f]+/gi)?.[0] || '#6c63ff')) : '#6c63ff'
      const gradTo   = hasGrad ? (_rgbToHex(bgImg.match(/rgba?\([^)]+\)|#[0-9a-f]+/gi)?.[1] || '#a78bfa')) : '#a78bfa'
      const gradAngle = hasGrad ? (bgImg.match(/(\d+)deg/) || ['','135'])[1] : '135'
      const isRadial  = bgImg.startsWith('radial')

      const blendModes = ['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity']
      const bgSizes = ['auto','cover','contain','100% 100%']
      const bgReps  = ['no-repeat','repeat','repeat-x','repeat-y']

      return `
        <div class="ins-bg-tabs">
          <button class="ins-bg-tab${!hasGrad && !hasImg ? ' active' : ''}" data-bg="solid">Solid</button>
          <button class="ins-bg-tab${hasGrad ? ' active' : ''}" data-bg="gradient">Gradient</button>
          <button class="ins-bg-tab${hasImg  ? ' active' : ''}" data-bg="image">Image</button>
        </div>

        <!-- Solid -->
        <div class="ins-bg-panel" id="ins-bg-solid" style="display:${!hasGrad && !hasImg ? '' : 'none'}">
          <div class="ins-row" style="gap:8px;align-items:center">
            ${_label('Color', 'backgroundColor')}
            <input type="color" class="ins-color-sm" id="ins-bg-color" value="${solidColor}" />
            <button class="ins-btn-ghost" id="ins-bg-clear" title="Remove background">✕</button>
          </div>
        </div>

        <!-- Gradient -->
        <div class="ins-bg-panel" id="ins-bg-gradient" style="display:${hasGrad ? '' : 'none'}">
          <div class="ins-row" style="gap:8px;align-items:center">
            ${_label('From', 'backgroundImage')}
            <input type="color" class="ins-color-sm" id="ins-grad-from" value="${gradFrom}" />
            ${_label('To', 'backgroundImage')}
            <input type="color" class="ins-color-sm" id="ins-grad-to" value="${gradTo}" />
          </div>
          <div class="ins-row" style="gap:8px;align-items:center;margin-top:6px">
            <label class="ins-radial-lbl">
              <input type="checkbox" id="ins-grad-radial" ${isRadial ? 'checked' : ''} /> Radial
            </label>
            <span style="font-size:11px;color:var(--muted)">Angle</span>
            <div class="ins-num-wrap" style="flex:1">
              <input class="ins-num" id="ins-grad-angle" type="number" min="0" max="360" value="${gradAngle}" />
              <span class="ins-unit-fixed">°</span>
            </div>
          </div>
        </div>

        <!-- Image -->
        <div class="ins-bg-panel" id="ins-bg-image" style="display:${hasImg ? '' : 'none'}">
          <div class="ins-row">
            <input class="ins-text" id="ins-bg-url"
              value="${hasImg ? bgImg.replace(/^url\(['"]?/,'').replace(/['"]?\)$/,'') : ''}"
              placeholder="https://… or paste URL" />
          </div>
          <div class="ins-row ins-bg-picker-btns" style="gap:6px;margin-top:6px">
            <button class="ins-btn-ghost" id="ins-bg-upload-btn" style="flex:1">📁 Upload</button>
            <button class="ins-btn-ghost" id="ins-bg-gallery-btn" style="flex:1">🖼 Gallery</button>
            <input type="file" id="ins-bg-file-inp" accept="image/*" style="display:none" />
          </div>
          <div id="ins-bg-gallery" style="display:none;margin-top:8px;max-height:180px;overflow-y:auto;border-radius:8px;border:1px solid rgba(255,255,255,.08);padding:6px">
            <div id="ins-bg-gallery-inner" style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px"></div>
          </div>
          <div class="ins-row" style="gap:6px;margin-top:4px">
            <div class="ins-col">
              ${_label('Size', 'backgroundSize')}
              <select class="ins-select" id="ins-bg-size">
                ${bgSizes.map(s => `<option${bgSize===s?' selected':''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="ins-col">
              ${_label('Repeat', 'backgroundRepeat')}
              <select class="ins-select" id="ins-bg-repeat">
                ${bgReps.map(r => `<option${bgRep===r?' selected':''}>${r}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="ins-row" style="margin-top:4px">
            ${_label('Position', 'backgroundPosition')}
            <input class="ins-text" id="ins-bg-pos" value="${bgPos}" placeholder="center center" style="flex:1;margin-left:8px" />
          </div>
        </div>

        <div class="ins-section-label" style="margin-top:10px">Blend & Clip</div>
        <div class="ins-row" style="gap:6px">
          <div class="ins-col">
            ${_label('Blend Mode', 'mixBlendMode')}
            <select class="ins-select" id="ins-blend">
              ${blendModes.map(b => `<option${blend===b?' selected':''}>${b}</option>`).join('')}
            </select>
          </div>
          <div class="ins-col">
            ${_label('Clip', 'backgroundClip')}
            <select class="ins-select" id="ins-bg-clip">
              ${['border-box','padding-box','content-box','text'].map(c => `<option${bgClip===c?' selected':''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>`
    },

    bind(container) {
      // Tab switching
      container.querySelectorAll('.ins-bg-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.ins-bg-tab').forEach(b => b.classList.remove('active'))
          btn.classList.add('active')
          ;['solid','gradient','image'].forEach(t => {
            const p = container.querySelector(`#ins-bg-${t}`)
            if (p) p.style.display = btn.dataset.bg === t ? '' : 'none'
          })
        })
      })

      // Solid color
      container.querySelector('#ins-bg-color')?.addEventListener('input', e => {
        _apply('backgroundColor', e.target.value)
        _apply('backgroundImage', 'none')
      })
      container.querySelector('#ins-bg-clear')?.addEventListener('click', () => {
        _apply('backgroundColor', 'transparent')
        _apply('backgroundImage', 'none')
      })

      // Gradient
      const _buildGrad = () => {
        const from  = container.querySelector('#ins-grad-from')?.value  || '#6c63ff'
        const to    = container.querySelector('#ins-grad-to')?.value    || '#a78bfa'
        const angle = container.querySelector('#ins-grad-angle')?.value || '135'
        const radial = container.querySelector('#ins-grad-radial')?.checked
        _apply('backgroundImage', radial
          ? `radial-gradient(circle, ${from}, ${to})`
          : `linear-gradient(${angle}deg, ${from}, ${to})`)
        _apply('backgroundColor', 'transparent')
      }
      ;['#ins-grad-from','#ins-grad-to'].forEach(s => container.querySelector(s)?.addEventListener('input', _buildGrad))
      container.querySelector('#ins-grad-angle')?.addEventListener('input', _buildGrad)
      container.querySelector('#ins-grad-radial')?.addEventListener('change', _buildGrad)

      // Image URL
      const bgUrl = container.querySelector('#ins-bg-url')
      const applyBgUrl = () => {
        const v = bgUrl?.value.trim()
        if (v) { _apply('backgroundImage', `url("${v}")`); _apply('backgroundColor', 'transparent') }
      }
      bgUrl?.addEventListener('keydown', e => { if (e.key === 'Enter') applyBgUrl() })
      bgUrl?.addEventListener('blur', applyBgUrl)

      // ── Upload from PC ───────────────────────────────────────────
      const fileInp = container.querySelector('#ins-bg-file-inp')
      container.querySelector('#ins-bg-upload-btn')?.addEventListener('click', () => fileInp?.click())
      fileInp?.addEventListener('change', () => {
        const f = fileInp.files[0]
        if (!f) return
        // Try to save to MediaLib first; fallback to raw DataURL
        if (typeof MediaLib !== 'undefined') {
          MediaLib.addFile(f)
            .then(asset => {
              _applyBgSrc(asset.src)
              _refreshGallery(container)
            })
            .catch(() => _readAndApply(f))
        } else {
          _readAndApply(f)
        }
        fileInp.value = ''
      })

      // ── Gallery toggle ───────────────────────────────────────────
      const galleryWrap = container.querySelector('#ins-bg-gallery')
      container.querySelector('#ins-bg-gallery-btn')?.addEventListener('click', () => {
        const open = galleryWrap.style.display === 'none'
        galleryWrap.style.display = open ? '' : 'none'
        if (open) _refreshGallery(container)
      })

      function _applyBgSrc(src) {
        _apply('backgroundImage', `url("${src}")`)
        _apply('backgroundColor', 'transparent')
        if (bgUrl) bgUrl.value = src
      }

      function _readAndApply(f) {
        const r = new FileReader()
        r.onload = ev => _applyBgSrc(ev.target.result)
        r.readAsDataURL(f)
      }

      function _refreshGallery(cont) {
        const inner = cont.querySelector('#ins-bg-gallery-inner')
        if (!inner) return
        let items = []
        // Stock photos
        if (typeof STOCK !== 'undefined') {
          items = items.concat(STOCK.map(u => ({ src: u, label: 'Stock' })))
        }
        // MediaLib assets
        try {
          const raw = JSON.parse(localStorage.getItem('pc_media_v1') || '[]')
          raw.forEach(a => items.push({ src: a.src, label: a.name || 'Upload' }))
        } catch(e) {}

        inner.innerHTML = items.map((item, i) => [
          '<img class="ins-bg-gallery-img"',
          ' src="' + item.src + '"',
          ' title="' + item.label + '"',
          ' data-idx="' + i + '"',
          ' loading="lazy"',
          ' style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:5px;cursor:pointer;border:2px solid transparent;transition:border-color .15s" />'
        ].join('')).join('')

        // Store items for click lookup
        inner._bgItems = items

        // Event delegation — no inline onclick
        inner.onclick = ev => {
          const img = ev.target.closest('img[data-idx]')
          if (!img) return
          const src = inner._bgItems[+img.dataset.idx]?.src
          if (!src) return
          _applyBgSrc(src)
          inner.querySelectorAll('img').forEach(i => i.style.borderColor = 'transparent')
          img.style.borderColor = '#6c63ff'
        }
      }

      container.querySelector('#ins-bg-size')?.addEventListener('change', e => _apply('backgroundSize', e.target.value))
      container.querySelector('#ins-bg-repeat')?.addEventListener('change', e => _apply('backgroundRepeat', e.target.value))
      const bgPos = container.querySelector('#ins-bg-pos')
      bgPos?.addEventListener('keydown', e => { if (e.key === 'Enter') _apply('backgroundPosition', bgPos.value) })
      bgPos?.addEventListener('blur', () => _apply('backgroundPosition', bgPos.value))

      // Blend + Clip
      container.querySelector('#ins-blend')?.addEventListener('change', e => _apply('mixBlendMode', e.target.value))
      container.querySelector('#ins-bg-clip')?.addEventListener('change', e => _apply('backgroundClip', e.target.value))
    }
  })

  // ══════════════════════════════════════════════════════
  // MODULE 7 — Borders & Radius
  // ══════════════════════════════════════════════════════
  Inspector.registerModule({
    id:    'borders',
    tab:   'style',
    label: '⬜ Borders',

    render(el, computed) {
      if (!el || !computed) return ''
      const bc  = _rgbToHex(computed.borderColor   || 'transparent')
      const bw  = _pv(computed.borderWidth          || '0px')
      const bs  = computed.borderStyle              || 'none'
      const tl  = _pv(computed.borderTopLeftRadius     || '0px')
      const tr  = _pv(computed.borderTopRightRadius    || '0px')
      const br  = _pv(computed.borderBottomRightRadius || '0px')
      const bl  = _pv(computed.borderBottomLeftRadius  || '0px')
      // Squircle smoothness (stored as custom CSS var)
      const smooth = parseFloat(el.dataset.squircle || '0')

      const styles = ['none','solid','dashed','dotted','double','groove','ridge']

      return `
        <div class="ins-section-label">Border</div>
        <div class="ins-row" style="gap:8px;align-items:center">
          <input type="color" class="ins-color-sm" id="ins-bdr-color" value="${bc}" />
          <div class="ins-num-wrap" style="flex:1">
            <input class="ins-num" id="ins-bdr-width" type="number" min="0" value="${bw.num}" placeholder="0" />
            <span class="ins-unit-fixed">px</span>
          </div>
          <select class="ins-select" id="ins-bdr-style" style="flex:1">
            ${styles.map(s => `<option${bs===s?' selected':''}>${s}</option>`).join('')}
          </select>
        </div>

        <div class="ins-section-label" style="margin-top:8px">Corner Radius</div>
        <div class="ins-corners">
          <div class="ins-corner ins-corner-tl">
            <input class="ins-num" id="ins-r-tl" type="number" min="0" value="${tl.num}" placeholder="0" title="Top Left" />
          </div>
          <div class="ins-corner ins-corner-tr">
            <input class="ins-num" id="ins-r-tr" type="number" min="0" value="${tr.num}" placeholder="0" title="Top Right" />
          </div>
          <div class="ins-corners-preview" id="ins-corners-preview"
            style="border-radius:${tl.num}px ${tr.num}px ${br.num}px ${bl.num}px"></div>
          <div class="ins-corner ins-corner-br">
            <input class="ins-num" id="ins-r-br" type="number" min="0" value="${br.num}" placeholder="0" title="Bottom Right" />
          </div>
          <div class="ins-corner ins-corner-bl">
            <input class="ins-num" id="ins-r-bl" type="number" min="0" value="${bl.num}" placeholder="0" title="Bottom Left" />
          </div>
        </div>

        <div class="ins-section-label" style="margin-top:10px">🍎 Squircle Smoothness</div>
        <div class="ins-row" style="gap:8px;align-items:center">
          <input type="range" class="ins-slider" id="ins-squircle" min="0" max="100" value="${smooth}" style="flex:1" />
          <span class="ins-slider-val" id="ins-squircle-val" style="min-width:30px">${smooth}%</span>
        </div>
        <div style="font-size:10px;color:#555;margin-top:2px;line-height:1.4">
          0% = CSS radius · 100% = Apple clip-path squircle
        </div>`
    },

    bind(container) {
      // Border color + width + style
      const applyBorder = () => {
        const c = container.querySelector('#ins-bdr-color')?.value || '#000'
        const w = container.querySelector('#ins-bdr-width')?.value || '0'
        const s = container.querySelector('#ins-bdr-style')?.value || 'solid'
        if (s === 'none' || w === '0') {
          _apply('border', 'none')
        } else {
          _apply('borderColor', c)
          _apply('borderWidth', w + 'px')
          _apply('borderStyle', s)
        }
      }
      container.querySelector('#ins-bdr-color')?.addEventListener('input', applyBorder)
      container.querySelector('#ins-bdr-style')?.addEventListener('change', applyBorder)
      const bdrW = container.querySelector('#ins-bdr-width')
      bdrW?.addEventListener('keydown', e => { if (e.key === 'Enter') applyBorder() })
      bdrW?.addEventListener('blur', applyBorder)

      // Corners — live preview + apply
      const cornerIds = ['ins-r-tl','ins-r-tr','ins-r-br','ins-r-bl']
      const applyCorners = () => {
        const [tl, tr, br, bl] = cornerIds.map(id => parseFloat(container.querySelector(`#${id}`)?.value) || 0)
        const preview = container.querySelector('#ins-corners-preview')
        if (preview) preview.style.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`
        _apply('borderRadius', `${tl}px ${tr}px ${br}px ${bl}px`)
      }
      cornerIds.forEach(id => {
        const inp = container.querySelector(`#${id}`)
        if (!inp) return
        inp.addEventListener('input', applyCorners)
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') applyCorners() })
      })

      // Squircle smoothness
      const sqSlider = container.querySelector('#ins-squircle')
      const sqLabel  = container.querySelector('#ins-squircle-val')
      sqSlider?.addEventListener('input', () => {
        const v = parseFloat(sqSlider.value)
        if (sqLabel) sqLabel.textContent = v + '%'
        const el = Inspector.getEl()
        if (!el) return
        el.dataset.squircle = v
        if (v < 5) {
          // Pure CSS border-radius
          el.style.clipPath = ''
          return
        }
        // Build squircle clip-path from corner inputs
        const [tl, tr, br, bl] = cornerIds.map(id => parseFloat(container.querySelector(`#${id}`)?.value) || 0)
        const maxR = Math.max(tl, tr, br, bl, 8)
        const sm = v / 100
        const bw = el.offsetWidth  || 100
        const bh = el.offsetHeight || 100
        // Simplified squircle: cubic bezier-approximation using % coords
        const r = maxR / Math.min(bw, bh) * 100
        const c = r * (1 - sm * 0.55) // control point pull
        const path = [
          `M ${r}% 0%`,
          `C ${c}% 0%, 0% ${c}%, 0% ${r}%`,
          `L 0% ${100 - r}%`,
          `C 0% ${100 - c}%, ${c}% 100%, ${r}% 100%`,
          `L ${100 - r}% 100%`,
          `C ${100 - c}% 100%, 100% ${100 - c}%, 100% ${100 - r}%`,
          `L 100% ${r}%`,
          `C 100% ${c}%, ${100 - c}% 0%, ${100 - r}% 0%`,
          `Z`
        ].join(' ')
        _apply('clipPath', `path('${path.replace(/%/g, '% ').trim()}')`)
      })
    }
  })


})()
