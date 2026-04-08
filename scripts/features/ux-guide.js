/* ══════════════════════════════════════════════════════
   STAGE 3 — UX AUTO-GUIDANCE SYSTEM
══════════════════════════════════════════════════════ */
const UXGuide = (() => {
  // Progress state tracking
  const _progress = {
    hasContent : false,
    hasStyle   : false,
    hasPreviewed: false,
    hasSEO     : false,
    hasExported: false,
  }

  // Context messages based on state
  const MESSAGES = {
    empty     : '👈 Click any block on the left to add it · or press <kbd>Ctrl+/</kbd> for AI',
    hasContent: '👆 Click a section to select it · edit properties on the right',
    selected  : '✏️ Edit on the right · <kbd>↑</kbd><kbd>↓</kbd> move · <kbd>Ctrl+D</kbd> duplicate · <kbd>Del</kbd> delete',
    preview   : '👁 Preview mode — looking great! Switch back to Edit to make changes',
  }

  // Next action suggestions: [condition fn, label, action fn]
  const NEXT_ACTIONS = [
    [() => S.sections.length === 0,         '+ Add Hero',        () => { addSection('hero'); toast('Hero added!','🦸') }],
    [() => S.sections.length === 1,         '+ Add Features',    () => { addSection('features'); toast('Features added!','✨') }],
    [() => S.sections.length >= 2 && !_progress.hasStyle,
                                             '🎨 Style your site', () => openGlobalStyles()],
    [() => S.sections.length >= 2 && !_progress.hasPreviewed,
                                             '👁 Preview',         () => setMode('preview')],
    [() => _progress.hasPreviewed && !_progress.hasSEO,
                                             '🔍 Set up SEO',     () => openSEO()],
    [() => _progress.hasSEO && !_progress.hasExported,
                                             '⬇ Export site',    () => openExport()],
  ]

  function update() {
    _syncProgress()
    _updateContextPill()
    _updateNextAction()
    _updateProgressBar()
  }

  function _syncProgress() {
    _progress.hasContent   = S.sections.length > 0
    _progress.hasStyle     = !!localStorage.getItem('pc_global_styles_v1')
    _progress.hasSEO       = !!localStorage.getItem('pc_seo_v1')
    _progress.hasExported  = !!localStorage.getItem('pc_exported_v1')
    _progress.hasPreviewed = !!localStorage.getItem('pc_previewed_v1')
  }

  function _updateContextPill() {
    const pill = document.getElementById('ux-context-pill')
    if (!pill) return
    let msg
    if (S.mode === 'preview') msg = MESSAGES.preview
    else if (!S.sections.length) msg = MESSAGES.empty
    else if (S.selected) msg = MESSAGES.selected
    else msg = MESSAGES.hasContent
    pill.innerHTML = msg
  }

  function _updateNextAction() {
    const btn = document.getElementById('ux-next-action')
    if (!btn) return
    for (const [cond, label] of NEXT_ACTIONS) {
      if (cond()) { btn.textContent = label; btn.style.display = 'block'; return }
    }
    btn.style.display = 'none'
  }

  function _updateProgressBar() {
    const steps = [
      ['bp-1', _progress.hasContent],
      ['bp-2', _progress.hasStyle],
      ['bp-3', _progress.hasPreviewed],
      ['bp-4', _progress.hasSEO],
      ['bp-5', _progress.hasExported],
    ]
    let firstIncomplete = -1
    steps.forEach(([id, done], i) => {
      const el = document.getElementById(id)
      if (!el) return
      el.classList.toggle('done',   done)
      el.classList.toggle('active', !done && firstIncomplete < 0)
      if (!done && firstIncomplete < 0) firstIncomplete = i
    })
  }

  function doNextAction() {
    for (const [cond, , action] of NEXT_ACTIONS) {
      if (cond()) { action(); setTimeout(update, 300); return }
    }
  }

  // Mark milestones
  function markPreviewed()  { localStorage.setItem('pc_previewed_v1','1'); update() }
  function markExported()   { localStorage.setItem('pc_exported_v1','1');  update() }

  return { update, doNextAction, markPreviewed, markExported }
})()
window.PageCraft.UXGuide = UXGuide
