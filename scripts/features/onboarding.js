/* ══════════════════════════════════════════════════════
   INIT — auth boots the builder
══════════════════════════════════════════════════════ */
renderBlocks()
bootPlugins()        // re-activate any plugins the user had installed
BackupSystem.boot()  // restore auto-backup schedule
WhiteLabel.boot()    // apply saved branding

// ── Stage 2: Section Registry — flush any externally registered sections ─────
if (window.PageCraft?.sectionRegistry) {
  window.PageCraft.sectionRegistry.injectAll()
}
// ── Stage 2: Init search bar visibility (blocks tab is default) ──────────────
document.querySelector('.sidebar')?.classList.add('sst-active')

/* ══════════════════════════════════════════════════════
   STAGE 3 — ONBOARDING SYSTEM
══════════════════════════════════════════════════════ */
const Onboarding = (() => {
  const KEY = 'pc_onboarded_v1'
  let _selectedType = null

  // Starter sections per site type
  const STARTER_SECTIONS = {
    business  : ['hero','features','about','testimonial','contact','footer'],
    portfolio : ['hero','gallery','about','contact','footer'],
    landing   : ['hero','features','pricing','testimonial','contact'],
    store     : ['hero','features','product-grid','testimonial','footer'],
    blog      : ['hero','about','features','footer'],
    blank     : [],
  }

  function boot() {
    if (localStorage.getItem(KEY)) return
    // Show after a short delay so the builder is visible first
    setTimeout(() => {
      document.getElementById('ob-overlay').style.display = 'flex'
    }, 600)
  }

  function selectType(type) {
    _selectedType = type
    document.querySelectorAll('.ob-type').forEach(el =>
      el.classList.toggle('selected', el.dataset.type === type))
    ;['ob-start-btn','ob-ai-btn'].forEach(id => {
      const btn = document.getElementById(id)
      if (!btn) return
      btn.disabled = false
      btn.style.opacity = '1'
      btn.style.cursor = 'pointer'
    })
    // Hide AI btn for blank (no prompt available)
    const aibtn = document.getElementById('ob-ai-btn')
    if (aibtn) aibtn.style.display = type === 'blank' ? 'none' : ''
  }

  // AI prompt per type
  const AI_PROMPTS = {
    business  : 'Build a professional business website with hero, services, about us, testimonials, and contact section. Use a clean, modern look.',
    portfolio : 'Build a creative portfolio website with a bold hero, gallery, about me, and contact section.',
    landing   : 'Build a high-converting SaaS landing page with hero, features, pricing, and a strong CTA.',
    store     : 'Build an online store homepage with hero, product grid, testimonials, and footer.',
    blog      : 'Build a blog homepage with a welcoming hero, recent posts, about section, and footer.',
    blank     : null,
  }

  function confirm() {
    if (!_selectedType) return
    dismiss()
    const sections = STARTER_SECTIONS[_selectedType] || []
    if (sections.length) {
      pushH('Onboarding starter')
      editorStore.produce(d => { d.sections = [] }, 'ob-clear')
      sections.forEach(type => addSection(type))
      toast(`${sections.length} sections added — customize them!`, '🚀')
      setMode('edit')
      if (S.sections.length) selectSection(S.sections[0].id)
    }
    UXGuide.update()
  }

  function buildWithAI() {
    if (!_selectedType) return
    dismiss()
    const prompt = AI_PROMPTS[_selectedType]
    if (!prompt) return
    setTimeout(() => {
      if (typeof AIChat !== 'undefined') {
        AIChat.open()
        setTimeout(() => AIChat.send(prompt), 300)
      }
    }, 400)
  }

  function dismiss() {
    localStorage.setItem(KEY, '1')
    const el = document.getElementById('ob-overlay')
    if (el) { el.style.opacity = '0'; setTimeout(() => el.style.display = 'none', 250) }
    UXGuide.update()
  }

  // Allow re-opening from help menu
  function reset() { localStorage.removeItem(KEY) }

  return { boot, selectType, confirm, buildWithAI, dismiss, reset }
})()

/* ══════════════════════════════════════════════════════
   UX STARTER — Empty-state quick-launch
   Powers the template cards in the canvas empty state.
══════════════════════════════════════════════════════ */
const UXStarter = (() => {
  const LAYOUTS = {
    saas      : ['hero','features','pricing','testimonial','contact','footer'],
    portfolio : ['hero','gallery','about','contact','footer'],
    business  : ['hero','features','about','testimonial','contact','footer'],
    blog      : ['hero','about','features','footer'],
    store     : ['hero','product-grid','testimonial','footer'],
  }

  function launch(type) {
    const sections = LAYOUTS[type]
    if (!sections?.length) return
    pushH(`Starter: ${type}`)
    S.sections = []
    S.selected = null
    sections.forEach(t => addSection(t))
    setMode('edit')
    if (S.sections.length) selectSection(S.sections[0].id)
    toast(`${type.charAt(0).toUpperCase() + type.slice(1)} template loaded!`, '🚀')
    UXGuide.update()
  }

  return { launch }
})()
