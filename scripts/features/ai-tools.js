// ── C. AI LAYOUT REFINER ─────────────────────────────────────────────────────
const AILayoutRefiner = (() => {
  // Suggests layout improvements based on current sections
  function analyze() {
    const types   = S.sections.map(s => s.type)
    const tips    = []

    if (!types.includes('hero'))        tips.push({ icon:'🦸', msg:'Add a Hero section — it\'s the first thing visitors see.' })
    if (!types.includes('features'))    tips.push({ icon:'✨', msg:'Add a Features section to explain your value proposition.' })
    if (!types.includes('testimonial')) tips.push({ icon:'💬', msg:'Social proof: add a Testimonials section to build trust.' })
    if (!types.includes('pricing'))     tips.push({ icon:'💰', msg:'Add Pricing to convert visitors into customers.' })
    if (!types.includes('contact') && !types.includes('footer')) tips.push({ icon:'📬', msg:'Add a Contact or Footer section for navigation and trust.' })

    // Check section order
    const heroIdx = types.indexOf('hero')
    const footerIdx = types.indexOf('footer')
    if (heroIdx > 0)   tips.push({ icon:'⚠️', msg:'Hero should be the FIRST section — move it to the top.' })
    if (footerIdx !== -1 && footerIdx !== types.length - 1) tips.push({ icon:'⚠️', msg:'Footer should be the LAST section.' })

    // Content quality checks
    S.sections.forEach(s => {
      if (s.type === 'hero' && (s.props?.headline||'').length < 10) tips.push({ icon:'✏', msg:'Hero headline is too short — make it compelling (10+ chars).' })
    })

    return tips
  }

  function showTips() {
    const tips = analyze()
    if (!tips.length) { toast('Layout looks great! No improvements needed.', '✅'); return }
    const msg  = tips.slice(0,3).map(t => `${t.icon} ${t.msg}`).join('\n')
    alert(`AI Layout Refiner\n\n${msg}${tips.length>3?`\n\n...and ${tips.length-3} more suggestions`:''}`
    )
  }

  return { analyze, showTips }
})()
window.PageCraft.AILayoutRefiner = AILayoutRefiner

// ── Wire CRM to form submissions ──────────────────────────────────────────────
// When a form is submitted in preview, capture it to CRM
;(function() {
  const _origSubmitForm = window.submitForm
  if (typeof _origSubmitForm === 'function') {
    window.submitForm = function(id) {
      _origSubmitForm(id)
      // Try to get the last submission and capture to CRM
      setTimeout(() => {
        try {
          const subs = JSON.parse(localStorage.getItem('pc_form_subs_v1') || '[]')
          if (subs.length) {
            const last = subs[0]
            CRMSystem.captureSubmission(last)
            EmailAuto.triggerWelcome({ name: last.name||last.Name||'', email: last.email||last.Email||'' })
          }
        } catch(e) {}
      }, 500)
    }
  }
})()

// ── Boot Reliability on DOMContentLoaded ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Reliability !== 'undefined') Reliability.init()
}, { once: true })
