/* ══════════════════════════════════════════════════════
   STAGE 7 — PERFORMANCE ENGINE
   Score · Metrics · Tips · Auto-Fix · HUD
══════════════════════════════════════════════════════ */
const PerfEngine = (() => {
  let _open = false
  let _score = 100

  // ── Metrics definition ────────────────────────────────────────────────────
  // Each metric: id, label, icon, measure() → 0-100, tip if bad, fix()
  const METRICS = [
    {
      id: 'section-count',
      label: 'Page Length',
      icon: '📄',
      measure() {
        const n = S.sections.length
        if (n === 0) return 100
        if (n <= 6)  return 100
        if (n <= 10) return 75
        if (n <= 15) return 50
        return 25
      },
      tip: '<b>Too many sections</b> slow down page load. Aim for 6–10 sections per page.',
      fix: null,
    },
    {
      id: 'images',
      label: 'Image Optimisation',
      icon: '🖼',
      measure() {
        let total = 0, slow = 0
        S.sections.forEach(s => {
          const p = s.props || {}
          ;['bgImage','image','heroImage'].forEach(k => {
            if (p[k] && p[k].startsWith('http')) {
              total++
              // Non-CDN or non-webp images penalised
              if (!p[k].includes('webp') && !p[k].includes('cloudinary') &&
                  !p[k].includes('imgix') && !p[k].includes('unsplash')) slow++
            }
          })
        })
        if (total === 0) return 100
        const ratio = slow / total
        if (ratio === 0)   return 100
        if (ratio <= 0.25) return 80
        if (ratio <= 0.5)  return 55
        return 30
      },
      tip: '<b>Unoptimised images</b> are the #1 performance killer. Use WebP or Cloudinary URLs.',
      fix: null,
    },
    {
      id: 'animations',
      label: 'Animation Load',
      icon: '✨',
      measure() {
        if (!ANIM?.enabled) return 100
        const animated = S.sections.filter(s => {
          const cfg = ANIM.sections?.[s.id]
          return cfg && cfg.preset && cfg.preset !== 'none'
        }).length
        if (animated === 0)  return 100
        if (animated <= 3)   return 90
        if (animated <= 6)   return 70
        return 50
      },
      tip: '<b>Too many animations</b> can cause jank on low-end devices. Keep animated sections under 6.',
      fix() {
        let count = 0
        S.sections.forEach(s => {
          const cfg = ANIM.sections?.[s.id]
          if (cfg && cfg.preset && cfg.preset !== 'none') {
            count++
            if (count > 4) { if (!ANIM.sections[s.id]) ANIM.sections[s.id] = {}; ANIM.sections[s.id].preset = 'none' }
          }
        })
        renderAll(); toast('Excess animations removed', '✨')
      },
    },
    {
      id: 'custom-html',
      label: 'Custom Code Weight',
      icon: '{ }',
      measure() {
        const blocks = S.sections.filter(s => s.type === 'custom-html')
        if (!blocks.length) return 100
        const totalChars = blocks.reduce((acc, s) => acc + (s.props?.code?.length || 0), 0)
        if (totalChars < 500)  return 100
        if (totalChars < 2000) return 80
        if (totalChars < 5000) return 60
        return 35
      },
      tip: '<b>Heavy custom HTML/JS</b> blocks can block rendering. Keep code lean and defer scripts.',
      fix: null,
    },
    {
      id: 'fonts',
      label: 'Font Strategy',
      icon: '🔤',
      measure() {
        const cfg = (typeof GlobalStyles !== 'undefined') ? GlobalStyles.load() : {}
        const head = cfg.fontHeading || 'system-ui'
        const body = cfg.fontBody   || 'system-ui'
        // system-ui = free, one web font = small cost, two = warn
        const webFonts = [head, body].filter(f => f && f !== 'system-ui').length
        if (webFonts === 0) return 100
        if (webFonts === 1) return 85
        return 65
      },
      tip: '<b>Multiple web fonts</b> add network requests. Consider using system-ui for body text.',
      fix() {
        if (typeof GlobalStyles === 'undefined') return
        GlobalStyles.setProp('fontBody', 'system-ui')
        toast('Body font set to system-ui', '🔤')
      },
    },
    {
      id: 'seo-ready',
      label: 'SEO Readiness',
      icon: '🔍',
      measure() {
        const title = document.getElementById('page-title')?.value?.trim() || ''
        const hasHero = S.sections.some(s => s.type === 'hero')
        const hasFooter = S.sections.some(s => s.type === 'footer')
        let score = 100
        if (!title)     score -= 30
        if (!hasHero)   score -= 20
        if (!hasFooter) score -= 15
        return Math.max(0, score)
      },
      tip: '<b>Missing SEO basics</b>: set a page title, add a hero and a footer.',
      fix() {
        if (!S.sections.some(s => s.type === 'hero'))
          S.sections.unshift({id:uid(),type:'hero',props:{...DEFS.hero.props}})
        if (!S.sections.some(s => s.type === 'footer'))
          S.sections.push({id:uid(),type:'footer',props:{...DEFS.footer.props}})
        renderAll(); toast('Hero + Footer added', '🔍')
      },
    },
  ]

  // ── Compute overall score ─────────────────────────────────────────────────
  function _calcScore() {
    const scores = METRICS.map(m => { try { return m.measure() } catch { return 100 } })
    return Math.round(scores.reduce((a,b) => a+b, 0) / scores.length)
  }

  function _grade(s) { return s >= 80 ? 'good' : s >= 55 ? 'warn' : 'bad' }

  // ── Render panel ──────────────────────────────────────────────────────────
  function _renderPanel() {
    const metricsEl = document.getElementById('perf-metrics')
    const tipsEl    = document.getElementById('perf-tips')
    const ringEl    = document.getElementById('perf-score-ring')
    if (!metricsEl) return

    const results = METRICS.map(m => {
      let val = 100
      try { val = m.measure() } catch {}
      return { ...m, val }
    })

    _score = Math.round(results.reduce((a,r) => a + r.val, 0) / results.length)
    const g = _grade(_score)

    if (ringEl) { ringEl.textContent = _score; ringEl.className = `perf-score-ring ${g}` }

    metricsEl.innerHTML = results.map(r => {
      const rg = _grade(r.val)
      const pct = r.val
      return `<div class="perf-metric">
        <div class="perf-metric-icon">${r.icon}</div>
        <div class="perf-metric-info">
          <div class="perf-metric-label">${r.label}</div>
          <div class="perf-bar-wrap"><div class="perf-bar ${rg}" style="width:${pct}%"></div></div>
        </div>
        <div class="perf-metric-val" style="color:${rg==='good'?'#10b981':rg==='warn'?'#f59e0b':'#ef4444'}">${pct}</div>
      </div>`
    }).join('')

    // Tips: show worst metrics only
    const bad = results.filter(r => r.val < 80).sort((a,b) => a.val - b.val)
    tipsEl.innerHTML = bad.length
      ? bad.slice(0,2).map(r => `<div class="perf-tip">${r.tip}</div>`).join('')
      : `<div class="perf-tip" style="border-color:rgba(16,185,129,.2);background:rgba(16,185,129,.06)">✅ <b>Great performance!</b> Your page is lean and fast.</div>`

    // Update FAB state
    _updateFab()
  }

  function _updateFab() {
    const fab = document.getElementById('perf-fab')
    if (!fab) return
    const g = _grade(_score)
    fab.className = `perf-fab ${g === 'good' ? '' : g}`
    fab.title = `Performance: ${_score}/100`
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function scan() {
    _score = _calcScore()
    if (_open) _renderPanel()
    _updateFab()
  }

  function toggle() {
    _open = !_open
    const panel = document.getElementById('perf-panel')
    if (!panel) return
    if (_open) {
      // Close design audit if open
      if (typeof DesignIntel !== 'undefined') DesignIntel.closeAudit()
      panel.style.display = 'block'; _renderPanel()
    }
    else panel.style.display = 'none'
  }

  function close() {
    _open = false
    const panel = document.getElementById('perf-panel')
    if (panel) panel.style.display = 'none'
  }

  function autoFix() {
    const results = METRICS.map(m => {
      let val = 100; try { val = m.measure() } catch {}
      return { ...m, val }
    })
    const fixable = results.filter(r => r.val < 80 && r.fix)
    if (!fixable.length) { toast('Nothing to auto-fix', '✓'); return }
    fixable.forEach(r => { try { r.fix() } catch(e) {} })
    setTimeout(() => { scan(); toast(`${fixable.length} issue${fixable.length>1?'s':''} fixed`, '⚡') }, 400)
  }

  // Called from renderAll — lightweight scan, no DOM updates unless panel open
  function update() { scan() }

  return { scan, toggle, close, autoFix, update }
})()
window.PageCraft.PerfEngine = PerfEngine
