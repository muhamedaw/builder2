/* usage-limits.js — Usage tracking, limit enforcement, contextual upsells
   Works on top of billing.js (currentPlan, isPro, PLANS, FREE_PROJECT_LIMIT). */

const UsageLimits = (() => {
  'use strict'

  const TRIAL_KEY = 'pc_trial_v1'
  const UPSELL_COOLDOWN_KEY = 'pc_upsell_cd_v1'
  const UPSELL_COOLDOWN_MS  = 60 * 60 * 1000  // 1 hour between upsells

  // ── Free tier limits ──────────────────────────────────────────────────────
  const LIMITS = {
    free: {
      projects    : 3,
      sectionsPerPage: 8,
      exports     : 5,   // per day
    }
  }

  // ── Contextual upsell copy per trigger ───────────────────────────────────
  const UPSELL_COPY = {
    projects: {
      icon    : '📁',
      title   : 'You\'ve reached your project limit',
      desc    : 'Free plan includes 3 saved projects. Upgrade to Pro for unlimited projects, all section blocks, and premium templates.',
      benefit : 'Unlimited projects',
    },
    sections: {
      icon    : '⊞',
      title   : 'Section limit reached',
      desc    : `Free plan allows up to ${LIMITS.free.sectionsPerPage} sections per page. Upgrade to Pro for unlimited sections and advanced layouts.`,
      benefit : 'Unlimited sections',
    },
    export: {
      icon    : '⬇',
      title   : 'Daily export limit reached',
      desc    : 'Free plan allows 5 exports per day. Upgrade to Pro for unlimited exports, React/JSON export formats, and custom domains.',
      benefit : 'Unlimited exports',
    },
    feature: {
      icon    : '⭐',
      title   : 'Pro feature',
      desc    : 'This feature is included in the Pro plan. Upgrade to unlock animations, responsive editor, premium templates, and more.',
      benefit : 'All Pro features',
    },
  }

  // ── Trial system ──────────────────────────────────────────────────────────
  function getTrialState() {
    try { return JSON.parse(localStorage.getItem(TRIAL_KEY) || 'null') } catch { return null }
  }

  function isTrialActive() {
    const t = getTrialState()
    return t?.active && new Date(t.endsAt) > new Date()
  }

  function startTrial() {
    if (getTrialState()) { toast('Trial already used', '⚠️'); return }
    const endsAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    localStorage.setItem(TRIAL_KEY, JSON.stringify({ active: true, startedAt: new Date().toISOString(), endsAt }))
    // Treat as Pro for the trial duration
    if (typeof AUTH !== 'undefined' && AUTH.user) {
      AUTH.user.plan = 'Pro (Trial)'
    }
    document.getElementById('upsell-modal')?.classList.add('hidden')
    toast('🎉 7-day Pro trial activated! All features unlocked.', '⭐')
    if (typeof renderBlocks === 'function') renderBlocks()
    if (typeof updateUpgradeButton === 'function') updateUpgradeButton()
    _renderWidget()
  }

  function isProOrTrial() {
    return (typeof isPro === 'function' && isPro()) || isTrialActive()
  }

  // ── Usage counters ────────────────────────────────────────────────────────
  function getExportCount() {
    const key = 'pc_export_count_' + new Date().toDateString()
    return parseInt(localStorage.getItem(key) || '0', 10)
  }

  function incrementExportCount() {
    const key = 'pc_export_count_' + new Date().toDateString()
    localStorage.setItem(key, String(getExportCount() + 1))
  }

  function getProjectCount() {
    if (typeof loadAllProjects !== 'function') return 0
    const db = loadAllProjects()
    const uid = (typeof AUTH !== 'undefined' && AUTH.user?.id) || '_local'
    return Object.values(db).filter(p => !p.userId || p.userId === uid).length
  }

  // ── Limit checks ──────────────────────────────────────────────────────────
  function checkSection() {
    if (isProOrTrial()) return true
    const count = typeof S !== 'undefined' ? S.sections.length : 0
    if (count >= LIMITS.free.sectionsPerPage) {
      showUpsell('sections')
      return false
    }
    return true
  }

  function checkExport() {
    if (isProOrTrial()) { incrementExportCount(); return true }
    const count = getExportCount()
    if (count >= LIMITS.free.exports) {
      showUpsell('export')
      return false
    }
    incrementExportCount()
    return true
  }

  // ── Upsell modal ──────────────────────────────────────────────────────────
  function showUpsell(trigger = 'feature') {
    // Cooldown — don't spam
    const last = parseInt(localStorage.getItem(UPSELL_COOLDOWN_KEY) || '0', 10)
    if (Date.now() - last < UPSELL_COOLDOWN_MS) {
      // Still show for hard blocks (projects, sections, export) — skip for soft prompts
      if (trigger === 'feature') return
    }
    localStorage.setItem(UPSELL_COOLDOWN_KEY, String(Date.now()))

    const copy = UPSELL_COPY[trigger] || UPSELL_COPY.feature
    const modal = document.getElementById('upsell-modal')
    if (!modal) return

    document.getElementById('upsell-icon').textContent   = copy.icon
    document.getElementById('upsell-title').textContent  = copy.title
    document.getElementById('upsell-desc').textContent   = copy.desc
    document.getElementById('upsell-benefit').textContent = '✓ ' + copy.benefit

    // Show trial button only if trial not used
    const trialBtn = document.getElementById('upsell-trial-btn')
    if (trialBtn) trialBtn.style.display = getTrialState() ? 'none' : 'block'

    modal.classList.remove('hidden')
  }

  function closeUpsell() {
    document.getElementById('upsell-modal')?.classList.add('hidden')
  }

  // ── Usage widget (injected into sidebar bottom) ───────────────────────────
  function _renderWidget() {
    const host = document.getElementById('usage-widget')
    if (!host) return

    if (isProOrTrial()) {
      const trialInfo = isTrialActive()
        ? `<div class="uw-trial-badge">🎉 Pro Trial — ${_trialDaysLeft()} days left</div>`
        : ''
      host.innerHTML = trialInfo
        ? `<div class="usage-widget pro-trial">${trialInfo}</div>`
        : ''
      return
    }

    if (typeof AUTH === 'undefined' || !AUTH.user) {
      host.innerHTML = ''
      return
    }

    const projCount = getProjectCount()
    const projMax   = LIMITS.free.projects
    const projPct   = Math.min(100, (projCount / projMax) * 100)
    const secCount  = typeof S !== 'undefined' ? S.sections.length : 0
    const secMax    = LIMITS.free.sectionsPerPage
    const secPct    = Math.min(100, (secCount / secMax) * 100)
    const expCount  = getExportCount()
    const expMax    = LIMITS.free.exports

    const projWarn  = projCount >= projMax
    const secWarn   = secCount >= secMax
    const expWarn   = expCount >= expMax

    host.innerHTML = `
      <div class="usage-widget">
        <div class="uw-head">
          <span class="uw-plan-badge">Free</span>
          <button class="uw-upgrade-btn" onclick="openBilling()">Upgrade ↗</button>
        </div>
        <div class="uw-row ${projWarn ? 'warn' : ''}">
          <div class="uw-label"><span>Projects</span><span>${projCount}/${projMax}</span></div>
          <div class="uw-bar"><div class="uw-fill" style="width:${projPct}%"></div></div>
        </div>
        <div class="uw-row ${secWarn ? 'warn' : ''}">
          <div class="uw-label"><span>Sections</span><span>${secCount}/${secMax}</span></div>
          <div class="uw-bar"><div class="uw-fill" style="width:${secPct}%"></div></div>
        </div>
        <div class="uw-row ${expWarn ? 'warn' : ''}">
          <div class="uw-label"><span>Exports today</span><span>${expCount}/${expMax}</span></div>
          <div class="uw-bar"><div class="uw-fill" style="width:${Math.min(100,(expCount/expMax)*100)}%"></div></div>
        </div>
        ${!getTrialState() ? `<button class="uw-trial-btn" onclick="UsageLimits.startTrial()">Try Pro free — 7 days</button>` : ''}
      </div>`
  }

  function _trialDaysLeft() {
    const t = getTrialState()
    if (!t) return 0
    return Math.max(0, Math.ceil((new Date(t.endsAt) - Date.now()) / 86400000))
  }

  // ── Refresh widget on renderAll ───────────────────────────────────────────
  // Hooked into sidebar-render via a lightweight observer
  function refresh() { _renderWidget() }

  // ── Init ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    _renderWidget()
  })

  return { checkSection, checkExport, showUpsell, closeUpsell, startTrial, isProOrTrial, refresh, getExportCount, getProjectCount }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.UsageLimits = UsageLimits
