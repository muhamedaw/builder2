/* ai-director.js — Stage 3.1: AI Director Mode
   Every time a section is added, suggests 3 design variations
   (Color, Typography, Layout) based on the brand's design tokens.
   Shows a non-blocking chip panel above the new section. */

const AIDirector = (() => {
  'use strict'

  // ── Design token reader ───────────────────────────────────────────────────
  // Reads current global styles (set by SEO/GlobalStyles panel)
  function _tokens() {
    const gs = (typeof S !== 'undefined' && S.globalStyles) ? S.globalStyles : {}
    return {
      accent:   gs.accentColor  || '#6c63ff',
      bg:       gs.bgColor      || '#0f172a',
      text:     gs.textColor    || '#f0eeff',
      fontHead: gs.fontHead     || 'Inter',
      fontBody: gs.fontBody     || 'Inter',
    }
  }

  // ── Variation presets per section type ────────────────────────────────────
  // Each entry: [label, icon, props override]
  const VARIATIONS = {
    hero: [
      ['Dark SaaS',    '🌑', t => ({ bgColor: '#0d0d1a', textColor: '#f0eeff', overlayOpacity: '0.85' })],
      ['Light Clean',  '☀️', t => ({ bgColor: '#ffffff', textColor: '#0f172a', overlayOpacity: '0.0' })],
      ['Brand Accent', '🎨', t => ({ bgColor: t.accent,  textColor: '#ffffff', overlayOpacity: '0.6' })],
    ],
    features: [
      ['Dark Grid',    '🌑', t => ({ bgColor: '#0f172a', textColor: '#e2e8f0', accentColor: t.accent })],
      ['Light Cards',  '☀️', t => ({ bgColor: '#f8fafc', textColor: '#0f172a', accentColor: t.accent })],
      ['Gradient',     '🌈', t => ({ bgColor: '#1e1b4b', textColor: '#e0e7ff', accentColor: '#a78bfa' })],
    ],
    testimonial: [
      ['Dark Quote',   '🌑', t => ({ bgColor: '#0d0d1a', textColor: '#f0eeff', accentColor: t.accent })],
      ['Light Card',   '☀️', t => ({ bgColor: '#f1f5f9', textColor: '#0f172a', accentColor: t.accent })],
      ['Purple',       '💜', t => ({ bgColor: '#4c1d95', textColor: '#ede9fe', accentColor: '#c4b5fd' })],
    ],
    about: [
      ['Image Left',   '◀️', () => ({ imagePos: 'left',  bgColor: '#ffffff',  textColor: '#0f172a' })],
      ['Image Right',  '▶️', () => ({ imagePos: 'right', bgColor: '#f8fafc',  textColor: '#0f172a' })],
      ['Dark Story',   '🌑', () => ({ imagePos: 'left',  bgColor: '#0f172a',  textColor: '#e2e8f0' })],
    ],
    pricing: [
      ['Light Tiers',  '☀️', t => ({ bgColor: '#f8fafc', textColor: '#0f172a', accentColor: t.accent })],
      ['Dark Tiers',   '🌑', t => ({ bgColor: '#0f172a', textColor: '#e2e8f0', accentColor: t.accent })],
      ['Vibrant',      '🎨', t => ({ bgColor: '#1e1b4b', textColor: '#ede9fe', accentColor: '#a78bfa' })],
    ],
    faq: [
      ['Dark Accordion','🌑', t => ({ bgColor: '#0f172a', textColor: '#e2e8f0', accentColor: '#f59e0b' })],
      ['Light Clean',   '☀️', t => ({ bgColor: '#ffffff', textColor: '#0f172a', accentColor: t.accent })],
      ['Teal',          '🌊', () => ({ bgColor: '#0f766e', textColor: '#ccfbf1', accentColor: '#5eead4' })],
    ],
    footer: [
      ['Dark Pro',     '🌑', () => ({ bgColor: '#0d0d1a', textColor: '#64748b' })],
      ['Mid Gray',     '⬛', () => ({ bgColor: '#1e293b', textColor: '#94a3b8' })],
      ['Light',        '☀️', () => ({ bgColor: '#f8fafc', textColor: '#64748b' })],
    ],
    contact: [
      ['Dark Form',    '🌑', t => ({ bgColor: '#0f172a', textColor: '#e2e8f0', accentColor: t.accent })],
      ['Light Form',   '☀️', t => ({ bgColor: '#ffffff', textColor: '#0f172a', accentColor: t.accent })],
      ['Split Layout', '◧',  t => ({ bgColor: '#f1f5f9', textColor: '#0f172a', accentColor: t.accent })],
    ],
  }

  // Default fallback for unknown types
  const DEFAULT_VARIATIONS = [
    ['Dark',    '🌑', t => ({ bgColor: '#0f172a', textColor: '#e2e8f0', accentColor: t.accent })],
    ['Light',   '☀️', t => ({ bgColor: '#ffffff', textColor: '#0f172a', accentColor: t.accent })],
    ['Accent',  '🎨', t => ({ bgColor: t.accent,  textColor: '#ffffff' })],
  ]

  // ── Chip panel DOM ────────────────────────────────────────────────────────
  let _panel = null

  function _buildPanel() {
    const p = document.createElement('div')
    p.id        = 'ai-director-panel'
    p.className = 'aid-panel'
    document.body.appendChild(p)
    // Click outside → dismiss
    document.addEventListener('click', ev => {
      if (_panel && !ev.target.closest('#ai-director-panel')) _dismiss()
    }, { capture: true })
    return p
  }

  function _dismiss() {
    if (_panel) {
      _panel.classList.add('aid-hidden')
      setTimeout(() => { if (_panel) _panel.style.display = 'none' }, 180)
    }
  }

  function _position(secId) {
    const wrapper = document.querySelector(`.section-wrapper[data-id="${secId}"]`)
    if (!wrapper || !_panel) return
    const rect = wrapper.getBoundingClientRect()
    _panel.style.top  = `${rect.top + 12}px`
    _panel.style.left = `${rect.left + 12}px`
  }

  // ── Public: suggest variations for a newly added section ─────────────────
  function suggest(sec) {
    if (!sec || !S || S.mode !== 'edit') return

    const t    = _tokens()
    const vars = VARIATIONS[sec.type] || DEFAULT_VARIATIONS

    if (!_panel) _panel = _buildPanel()

    _panel.style.display = ''
    _panel.classList.remove('aid-hidden')
    _panel.innerHTML = `
      <div class="aid-header">
        <span class="aid-title">✦ 3 variations — pick one</span>
        <button class="aid-dismiss" onclick="AIDirector.dismiss()">✕</button>
      </div>
      <div class="aid-chips">
        ${vars.map(([label, icon, propsFn], i) => `
          <button class="aid-chip" onclick="AIDirector.apply('${sec.id}',${i})">
            <span class="aid-chip-icon">${icon}</span>
            <span class="aid-chip-label">${label}</span>
          </button>`).join('')}
      </div>
      <div class="aid-tip">ESC to dismiss · applies instantly · Ctrl+Z to undo</div>`

    // Attach variation data to panel for apply()
    _panel._sec  = sec
    _panel._vars = vars
    _panel._t    = t

    // Position near section
    requestAnimationFrame(() => _position(sec.id))
  }

  function apply(secId, varIdx) {
    if (!_panel?._sec || _panel._sec.id !== secId) return
    const propsFn = _panel._vars[varIdx]?.[2]
    if (!propsFn) return

    const patch = propsFn(_panel._t)
    if (typeof PropertyBridge !== 'undefined') {
      PropertyBridge.patch(secId, patch)
    } else {
      // Fallback: direct mutation
      const sec = S.sections.find(s => s.id === secId)
      if (sec) { Object.assign(sec.props, patch); RenderEngine.invalidate(secId); renderAll('props') }
    }
    _dismiss()
    toast(`Variation applied ✓`, '🎨')
  }

  function dismiss() { _dismiss() }

  // ESC key closes panel
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && _panel && _panel.style.display !== 'none') {
      ev.stopPropagation()
      _dismiss()
    }
  })

  return { suggest, apply, dismiss }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.AIDirector = AIDirector
