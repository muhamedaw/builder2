/* magic-fix.js — Stage 3.3: Magic-Fix Auditor
   One-click scan for alignment issues, low contrast, and mobile
   responsiveness. Shows an audit report then auto-fixes on confirm. */

const MagicFix = (() => {
  'use strict'

  // ── Contrast checker (WCAG 2.1 AA: ratio ≥ 4.5 for normal text) ──────────
  function _luminance(hex) {
    const c = hex.replace('#', '')
    const r = parseInt(c.slice(0,2)||'00',16) / 255
    const g = parseInt(c.slice(2,4)||'00',16) / 255
    const b = parseInt(c.slice(4,6)||'00',16) / 255
    const lin = v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  }

  function _contrastRatio(hex1, hex2) {
    const l1 = _luminance(hex1)
    const l2 = _luminance(hex2)
    const bright = Math.max(l1, l2)
    const dark   = Math.min(l1, l2)
    return (bright + 0.05) / (dark + 0.05)
  }

  function _isValidHex(h) { return /^#[0-9a-f]{3,6}$/i.test(h) }

  // ── Individual checks ─────────────────────────────────────────────────────

  function _checkContrast(sec) {
    const issues = []
    const bg   = sec.props.bgColor    || '#ffffff'
    const text = sec.props.textColor  || '#000000'
    if (!_isValidHex(bg) || !_isValidHex(text)) return issues
    const ratio = _contrastRatio(bg, text)
    if (ratio < 4.5) {
      issues.push({
        type: 'contrast',
        severity: ratio < 3 ? 'high' : 'medium',
        message: `Low contrast ratio ${ratio.toFixed(1)}:1 (WCAG requires 4.5:1)`,
        fix: () => {
          // Auto-fix: if dark bg → white text, else → near-black text
          const lum = _luminance(bg)
          const fixedText = lum < 0.4 ? '#f0eeff' : '#0f172a'
          PropertyBridge.update(sec.id, 'textColor', fixedText)
        }
      })
    }
    return issues
  }

  function _checkAlignment(sec) {
    const issues = []
    // Check for missing headline on hero/features
    if (['hero','features','about'].includes(sec.type)) {
      const headline = sec.props.headline || sec.props.heading || ''
      if (!headline.trim()) {
        issues.push({
          type: 'content',
          severity: 'medium',
          message: 'Missing headline — hurts conversion & SEO',
          fix: () => {
            const key = sec.type === 'features' || sec.type === 'about' ? 'heading' : 'headline'
            PropertyBridge.update(sec.id, key, 'Your Headline Here')
          }
        })
      }
    }
    // Check minHeight is reasonable
    const mh = parseInt(sec.props.minHeight) || 0
    if (mh > 0 && mh < 200) {
      issues.push({
        type: 'layout',
        severity: 'low',
        message: `Min-height ${mh}px is too small — content may be clipped on mobile`,
        fix: () => PropertyBridge.update(sec.id, 'minHeight', '320')
      })
    }
    return issues
  }

  function _checkMobile(sec) {
    const issues = []
    // Oversized minHeight on mobile → cap
    const mh = parseInt(sec.props.minHeight) || 0
    if (mh > 800) {
      issues.push({
        type: 'mobile',
        severity: 'medium',
        message: `Min-height ${mh}px will overflow on most phones (max 800px recommended)`,
        fix: () => PropertyBridge.update(sec.id, 'minHeight', '600')
      })
    }
    // Missing CTA link
    if (sec.props.ctaText && !sec.props.ctaLink) {
      issues.push({
        type: 'mobile',
        severity: 'low',
        message: 'CTA button has no link — tap does nothing',
        fix: () => PropertyBridge.update(sec.id, 'ctaLink', '#')
      })
    }
    return issues
  }

  // ── Full audit ────────────────────────────────────────────────────────────
  function audit() {
    if (typeof S === 'undefined') return []
    const results = []
    S.sections.forEach(sec => {
      const issues = [
        ..._checkContrast(sec),
        ..._checkAlignment(sec),
        ..._checkMobile(sec),
      ]
      if (issues.length) results.push({ sec, issues })
    })
    return results
  }

  // ── Auto-fix all ──────────────────────────────────────────────────────────
  function fixAll() {
    const results = audit()
    if (!results.length) { toast('No issues found — looking good!', '✅'); return }
    let total = 0
    results.forEach(({ issues }) => {
      issues.forEach(issue => { issue.fix(); total++ })
    })
    pushH('Magic Fix')
    toast(`Fixed ${total} issue${total !== 1 ? 's' : ''}`, '🔧')
    return total
  }

  // ── Audit panel UI ────────────────────────────────────────────────────────
  let _panelEl = null

  function showPanel() {
    const results = audit()

    if (!_panelEl) {
      _panelEl = document.createElement('div')
      _panelEl.id = 'magic-fix-panel'
      _panelEl.className = 'mf-panel'
      document.body.appendChild(_panelEl)
    }

    const ICON = { high: '🔴', medium: '🟡', low: '🔵', contrast: '👁', layout: '📐', mobile: '📱', content: '✍️' }

    _panelEl.style.display = ''
    _panelEl.classList.remove('mf-hidden')

    if (!results.length) {
      _panelEl.innerHTML = `
        <div class="mf-header"><span class="mf-title">🔧 Magic Fix Auditor</span><button class="mf-close" onclick="MagicFix.hidePanel()">✕</button></div>
        <div class="mf-empty">✅ No issues found — your page looks great!</div>`
      return
    }

    const totalIssues = results.reduce((n, r) => n + r.issues.length, 0)

    _panelEl.innerHTML = `
      <div class="mf-header">
        <span class="mf-title">🔧 Magic Fix — ${totalIssues} issue${totalIssues !== 1 ? 's' : ''} found</span>
        <button class="mf-close" onclick="MagicFix.hidePanel()">✕</button>
      </div>
      <div class="mf-list">
        ${results.map(({ sec, issues }) => `
          <div class="mf-section-group">
            <div class="mf-section-name">${sec.type} · <span class="mf-sec-id">${sec.id.slice(0,8)}</span></div>
            ${issues.map((issue, idx) => `
              <div class="mf-issue mf-${issue.severity}">
                <span class="mf-issue-icon">${ICON[issue.type] || '⚠️'}</span>
                <span class="mf-issue-text">${issue.message}</span>
                <button class="mf-fix-btn" onclick="MagicFix._fixOne('${sec.id}',${idx})">Fix</button>
              </div>`).join('')}
          </div>`).join('')}
      </div>
      <div class="mf-footer">
        <button class="mf-fix-all" onclick="MagicFix.fixAll();MagicFix.hidePanel()">⚡ Fix All ${totalIssues} Issues</button>
      </div>`

    // Store results for _fixOne
    _panelEl._results = results
  }

  function _fixOne(secId, issueIdx) {
    if (!_panelEl?._results) return
    const entry = _panelEl._results.find(r => r.sec.id === secId)
    const issue = entry?.issues[issueIdx]
    if (!issue) return
    issue.fix()
    pushH('Magic Fix: ' + issue.type)
    // Re-render panel
    showPanel()
    toast('Fixed ✓', '🔧')
  }

  function hidePanel() {
    if (_panelEl) {
      _panelEl.classList.add('mf-hidden')
      setTimeout(() => { if (_panelEl) _panelEl.style.display = 'none' }, 180)
    }
  }

  return { audit, fixAll, showPanel, hidePanel, _fixOne }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.MagicFix = MagicFix
