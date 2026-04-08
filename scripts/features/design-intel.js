/* ══════════════════════════════════════════════════════
   STAGE 6 — DESIGN INTELLIGENCE
   Design Audit · Guardrails · Grid Overlay · Smart Apply
══════════════════════════════════════════════════════ */
const DesignIntel = (() => {
  let _auditOpen  = false
  let _gridActive = false
  let _issues     = []

  // ── Contrast checker ───────────────────────────────────────────────────────
  function _hexToRgb(hex) {
    try {
      const h = hex.replace('#','')
      if (h.length < 6) return null
      return { r:parseInt(h.slice(0,2),16), g:parseInt(h.slice(2,4),16), b:parseInt(h.slice(4,6),16) }
    } catch { return null }
  }
  function _luminance({r,g,b}) {
    const s = [r,g,b].map(v => { v/=255; return v<=.03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4) })
    return .2126*s[0] + .7152*s[1] + .0722*s[2]
  }
  function _contrast(hex1, hex2) {
    const c1 = _hexToRgb(hex1), c2 = _hexToRgb(hex2)
    if (!c1||!c2) return 21
    const l1 = _luminance(c1), l2 = _luminance(c2)
    const bright = Math.max(l1,l2), dark = Math.min(l1,l2)
    return (bright+.05)/(dark+.05)
  }

  // ── Audit Rules ────────────────────────────────────────────────────────────
  const RULES = [
    {
      id:'empty-page',
      sev:'error',
      title:'Page is empty',
      desc:'Your canvas has no sections. Add a hero to start building.',
      check: () => S.sections.length === 0,
      fix:   () => { addSection('hero'); toast('Hero added','🦸') },
      fixLabel:'Add Hero',
    },
    {
      id:'no-hero',
      sev:'error',
      title:'No hero section',
      desc:'Every page needs a hero. It\'s the first thing visitors see.',
      check: () => S.sections.length > 0 && !S.sections.find(s=>s.type==='hero'),
      fix:   () => { S.sections.unshift({id:uid(),type:'hero',props:{...DEFS.hero.props}}); renderAll(); toast('Hero added','🦸') },
      fixLabel:'Add Hero',
    },
    {
      id:'no-footer',
      sev:'error',
      title:'No footer section',
      desc:'Missing footer — visitors need navigation and legal links.',
      check: () => S.sections.length>0 && !S.sections.find(s=>s.type==='footer'),
      fix:   () => { S.sections.push({id:uid(),type:'footer',props:{...DEFS.footer.props}}); renderAll(); toast('Footer added','🔻') },
      fixLabel:'Add Footer',
    },
    {
      id:'low-contrast',
      sev:'error',
      title:'Low contrast detected',
      desc:'Some sections have text that\'s hard to read on their background.',
      check: () => S.sections.some(s => {
        const bg = s.props?.bgColor, txt = s.props?.textColor
        return bg && txt && _contrast(bg,txt) < 3.0
      }),
      fix: () => {
        pushH('Fix contrast')
        S.sections.forEach(s => {
          const bg = s.props?.bgColor, txt = s.props?.textColor
          if (bg && txt && _contrast(bg,txt) < 3.0) {
            const rgb = _hexToRgb(bg)
            if (!rgb) return
            const lum = _luminance(rgb)
            s.props.textColor = lum > 0.4 ? '#0f172a' : '#ffffff'
          }
        })
        renderAll(); toast('Contrast fixed on all sections','✅')
      },
      fixLabel:'Fix Contrast',
    },
    {
      id:'same-bg',
      sev:'warn',
      title:'All sections same background',
      desc:'Using the same color for every section makes the page flat. Alternate colors for visual rhythm.',
      check: () => {
        if (S.sections.length < 3) return false
        const bgs = S.sections.map(s=>s.props?.bgColor).filter(Boolean)
        return bgs.length > 2 && new Set(bgs).size === 1
      },
      fix: () => {
        pushH('Alternate backgrounds')
        S.sections.forEach((s,i) => {
          if (!s.props?.bgColor) return
          const isDark = _contrast(s.props.bgColor,'#000000') > _contrast(s.props.bgColor,'#ffffff')
          if (i%2===1) {
            s.props.bgColor  = isDark ? '#1e293b' : '#f8fafc'
            if (s.props.textColor !== undefined) s.props.textColor = isDark ? '#e2e8f0' : '#0f172a'
          }
        })
        renderAll(); toast('Background rhythm applied','🎨')
      },
      fixLabel:'Alternate BGs',
    },
    {
      id:'too-few-sections',
      sev:'warn',
      title:'Very few sections',
      desc:'Your page only has 1–2 sections. Visitors need more content to stay engaged.',
      check: () => S.sections.length > 0 && S.sections.length < 3,
      fix:   () => { addSection('features'); addSection('contact') },
      fixLabel:'Add Sections',
    },
    {
      id:'missing-cta',
      sev:'warn',
      title:'No call-to-action section',
      desc:'Add a pricing, contact, or CTA section to drive conversions.',
      check: () => S.sections.length >= 3 && !S.sections.find(s=>['pricing','contact','form-builder'].includes(s.type)),
      fix:   () => { addSection('contact'); toast('Contact section added','✉️') },
      fixLabel:'Add Contact',
    },
    {
      id:'missing-social-proof',
      sev:'info',
      title:'No social proof',
      desc:'A testimonial or gallery builds trust. Consider adding one.',
      check: () => S.sections.length >= 4 && !S.sections.find(s=>['testimonial','gallery'].includes(s.type)),
      fix:   () => { addSection('testimonial'); toast('Testimonial added','💬') },
      fixLabel:'Add Testimonial',
    },
    {
      id:'same-bg-text',
      sev:'error',
      title:'Text invisible on background',
      desc:'One or more sections have text and background set to the same color.',
      check: () => S.sections.some(s => s.props?.bgColor && s.props?.textColor && s.props.bgColor === s.props.textColor),
      fix: () => {
        S.sections.forEach(s => {
          if (s.props?.bgColor && s.props?.textColor && s.props.bgColor === s.props.textColor) {
            s.props.textColor = _contrast(s.props.bgColor,'#ffffff') > _contrast(s.props.bgColor,'#000000') ? '#ffffff' : '#0f172a'
          }
        })
        renderAll(); toast('Text colors fixed','✅')
      },
      fixLabel:'Fix Colors',
    },
  ]

  // ── Run audit ──────────────────────────────────────────────────────────────
  function runAudit() {
    _issues = RULES.filter(r => r.check())
    _updateUI()
    // Add guardrail badges to canvas
    _applyGuardrailBadges()
    return _issues
  }

  function _applyGuardrailBadges() {
    // Remove existing badges
    document.querySelectorAll('.guardrail-warn').forEach(b=>b.remove())
    // Low contrast badges on individual sections
    S.sections.forEach(s => {
      const bg = s.props?.bgColor, txt = s.props?.textColor
      if (bg && txt && _contrast(bg,txt) < 3.0) {
        const el = document.querySelector(`.section-wrapper[data-id="${s.id}"]`)
        if (el) {
          const badge = document.createElement('div')
          badge.className = 'guardrail-warn'
          badge.textContent = '⚠ Low contrast'
          el.appendChild(badge)
        }
      }
    })
  }

  function _updateUI() {
    const errors = _issues.filter(i=>i.sev==='error').length
    const warns  = _issues.filter(i=>i.sev==='warn').length

    // FAB badge
    const fab   = document.getElementById('da-fab')
    const badge = document.getElementById('da-badge')
    if (fab) {
      fab.style.display = ''
      if (badge) {
        const total = errors + warns
        badge.textContent = total || ''
        badge.style.display = total ? '' : 'none'
        badge.style.background = errors ? '#ef4444' : '#f59e0b'
      }
    }

    if (!_auditOpen) return

    // Score badge
    const scoreBadge = document.getElementById('da-score-badge')
    if (scoreBadge) {
      if (errors > 0)      { scoreBadge.className='da-score bad';  scoreBadge.textContent=errors }
      else if (warns > 0)  { scoreBadge.className='da-score warn'; scoreBadge.textContent=warns }
      else                 { scoreBadge.className='da-score good'; scoreBadge.textContent='✓' }
    }

    // Issues list
    const list = document.getElementById('da-issues')
    if (!list) return
    if (!_issues.length) {
      list.innerHTML = `<div class="da-empty">✅ No design issues found!<br>Your site looks great.</div>`
      return
    }
    list.innerHTML = _issues.map(issue => `
      <div class="da-issue">
        <div class="da-issue-sev ${issue.sev}"></div>
        <div class="da-issue-body">
          <div class="da-issue-title">${issue.title}</div>
          <div class="da-issue-desc">${issue.desc}</div>
        </div>
        ${issue.fix ? `<button class="da-fix-btn" onclick="DesignIntel.fixIssue('${issue.id}')">${issue.fixLabel}</button>` : ''}
      </div>`).join('')
  }

  // ── Fix single issue ───────────────────────────────────────────────────────
  function fixIssue(id) {
    const rule = RULES.find(r=>r.id===id)
    if (rule?.fix) { rule.fix(); setTimeout(runAudit, 300) }
  }

  // ── Fix all ────────────────────────────────────────────────────────────────
  function fixAll() {
    const fixable = _issues.filter(i=>i.fix)
    if (!fixable.length) { toast('Nothing to fix','✓'); return }
    fixable.forEach(i => { try { i.fix() } catch(e){} })
    setTimeout(() => { runAudit(); toast(`${fixable.length} issue${fixable.length>1?'s':''} fixed`,'⚡') }, 400)
  }

  // ── Toggle panel ───────────────────────────────────────────────────────────
  function toggleAudit() {
    _auditOpen = !_auditOpen
    const panel = document.getElementById('da-panel')
    if (!panel) return
    if (_auditOpen) {
      // Close perf panel if open
      if (typeof PerfEngine !== 'undefined') PerfEngine.close()
      panel.style.display=''; runAudit()
    }
    else panel.style.display='none'
  }

  function closeAudit() {
    _auditOpen = false
    const panel = document.getElementById('da-panel')
    if (panel) panel.style.display='none'
  }

  // ── Grid overlay ──────────────────────────────────────────────────────────
  function toggleGrid() {
    _gridActive = !_gridActive
    document.getElementById('grid-overlay')?.classList.toggle('active', _gridActive)
    const btn = document.getElementById('grid-toggle-btn')
    if (btn) btn.classList.toggle('active', _gridActive)
  }

  // ── Smart Apply — alternating palette with contrast check ──────────────────
  function smartApply() {
    if (!S.sections.length) return toast('No sections on canvas','⚠️')
    const gs  = GlobalStyles.load()
    const bg1 = gs.colorBackground
    const bg2 = gs.colorBackground === '#ffffff' ? '#f8fafc' : _lightenHex(gs.colorBackground)
    const bgD = gs.colorText === '#0f172a' ? '#0f172a' : gs.colorBackground
    pushH('Smart Apply styles')
    S.sections.forEach((sec, i) => {
      if (!sec.props?.bgColor) return
      // Footer & testimonial → always dark
      if (['footer','testimonial'].includes(sec.type)) {
        sec.props.bgColor   = bgD
        sec.props.textColor = '#ffffff'
        if (sec.props.accentColor) sec.props.accentColor = gs.colorSecondary
        return
      }
      // Alternate bg1/bg2
      const bg  = i%2===0 ? bg1 : bg2
      sec.props.bgColor   = bg
      // Auto-pick text color for contrast
      sec.props.textColor = _contrast(bg,'#ffffff') > _contrast(bg,'#0f172a') ? '#ffffff' : '#0f172a'
      if (sec.props.accentColor) sec.props.accentColor = gs.colorPrimary
    })
    renderAll()
    runAudit()
    toast('Smart styles applied with contrast check','🎨')
  }

  function _lightenHex(hex) {
    const rgb = _hexToRgb(hex); if (!rgb) return hex
    const lum = _luminance(rgb)
    if (lum > 0.5) return '#f8fafc'  // light bg → use subtle gray
    const r = Math.min(255,rgb.r+25), g = Math.min(255,rgb.g+25), b = Math.min(255,rgb.b+25)
    return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')
  }

  // ── Hook into renderAll ───────────────────────────────────────────────────
  function update() {
    runAudit()
  }

  function _getIssues() { return _issues.filter(i => i.fix) }
  return { runAudit, fixIssue, fixAll, toggleAudit, closeAudit, toggleGrid, smartApply, update, _getIssues }
})()
window.PageCraft.DesignIntel = DesignIntel

// DesignIntel.update() is wired directly into renderAll above
