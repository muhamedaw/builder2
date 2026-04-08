/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   ANIMATION SYSTEM — Framer Motion architecture
   Scroll-triggered via IntersectionObserver
   Per-section: preset, duration, delay, easing, stagger
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

// ── Animation State ───────────────────────────────────────────────────────────
const ANIM = {
  enabled: true,        // global on/off
  global:  'none',      // global preset applied to all
  // Per-section overrides: { [sectionId]: AnimConfig }
  sections: {},
}

// ── Config structure per section ─────────────────────────────────────────────
const ANIM_DEFAULTS = {
  preset:   'none',    // animation name
  duration: 0.6,       // seconds
  delay:    0,         // seconds
  easing:   'ease-out',
  stagger:  false,     // stagger children
  staggerDelay: 0.08,  // seconds between children
  threshold: 0.15,     // IntersectionObserver threshold
  once:     true,      // only animate once
}

// ── Available presets ─────────────────────────────────────────────────────────
const PRESETS = [
  { id:'none',       label:'None',      icon:'○' },
  { id:'fade-up',    label:'Fade Up',   icon:'↑' },
  { id:'fade-down',  label:'Fade Down', icon:'↓' },
  { id:'fade-left',  label:'Fade ←',   icon:'←' },
  { id:'fade-right', label:'Fade →',   icon:'→' },
  { id:'zoom-in',    label:'Zoom In',   icon:'⊕' },
  { id:'zoom-out',   label:'Zoom Out',  icon:'⊖' },
  { id:'flip-x',     label:'Flip X',    icon:'⟲' },
  { id:'flip-y',     label:'Flip Y',    icon:'⟳' },
  { id:'blur-in',    label:'Blur In',   icon:'◎' },
]

const EASINGS = [
  { id:'ease-out',              label:'Ease Out (natural)' },
  { id:'ease-in-out',           label:'Ease In-Out (smooth)' },
  { id:'cubic-bezier(.34,1.56,.64,1)', label:'Spring (bouncy)' },
  { id:'cubic-bezier(.22,.61,.36,1)',  label:'Smooth (polished)' },
  { id:'linear',                label:'Linear' },
  { id:'ease-in',               label:'Ease In (dramatic)' },
]

// ── CSS keyframe map (matches @keyframes pc-* in CSS) ─────────────────────────
const KEYFRAME_MAP = {
  'none':       null,
  'fade-up':    'pc-fade-up',
  'fade-down':  'pc-fade-down',
  'fade-left':  'pc-fade-left',
  'fade-right': 'pc-fade-right',
  'zoom-in':    'pc-zoom-in',
  'zoom-out':   'pc-zoom-out',
  'flip-x':     'pc-flip-x',
  'flip-y':     'pc-flip-y',
  'blur-in':    'pc-blur-in',
}

// ── Get effective config for a section ───────────────────────────────────────
function getAnimConfig(sectionId) {
  const override = ANIM.sections[sectionId] || {}
  return { ...ANIM_DEFAULTS, ...override }
}

// ── Set animation prop for one section ───────────────────────────────────────
function setAnimProp(sectionId, key, value) {
  if (!ANIM.sections[sectionId]) ANIM.sections[sectionId] = {}
  ANIM.sections[sectionId][key] = value
  updateSectionAnimBadge(sectionId)
  renderAnimSectionsList()
}

// ── Update the badge on the canvas wrapper ────────────────────────────────────
function updateSectionAnimBadge(sectionId) {
  const wrapper = document.querySelector(`.section-wrapper[data-id="${sectionId}"]`)
  if (!wrapper) return
  const cfg    = getAnimConfig(sectionId)
  const preset = ANIM.enabled ? cfg.preset : 'none'
  wrapper.setAttribute('data-anim', preset)
  const badge  = wrapper.querySelector('.anim-badge')
  if (badge) {
    const name = PRESETS.find(p => p.id === preset)?.label || 'None'
    badge.querySelector('.anim-badge-name').textContent = preset === 'none' ? 'No animation' : name
  }
}

function updateAllAnimBadges() {
  S.sections.forEach(sec => updateSectionAnimBadge(sec.id))
}

// ── Panel open / close ────────────────────────────────────────────────────────
function openAnimPanel() {
  if (typeof requirePro === 'function' && !isPro()) {
    requirePro('animate', 'Animations require the Pro plan'); return
  }
  document.getElementById('anim-panel').classList.add('open')
  renderAnimPanel()
}
function closeAnimPanel() {
  document.getElementById('anim-panel').classList.remove('open')
}

// ── Toggle global enable ──────────────────────────────────────────────────────
function toggleAnimGlobal() {
  ANIM.enabled = !ANIM.enabled
  const sw = document.getElementById('anim-global-switch')
  sw.classList.toggle('on', ANIM.enabled)
  updateAllAnimBadges()
  renderAnimSectionsList()
  toast(ANIM.enabled ? 'Animations enabled' : 'Animations disabled',
        ANIM.enabled ? '✨' : '○')
}

// ── Apply preset to ALL sections ──────────────────────────────────────────────
function applyPresetToAll(presetId) {
  ANIM.global = presetId
  S.sections.forEach(sec => {
    if (!ANIM.sections[sec.id]) ANIM.sections[sec.id] = {}
    ANIM.sections[sec.id].preset = presetId
    // Add staggered delays for natural feel
    const idx = S.sections.indexOf(sec)
    ANIM.sections[sec.id].delay = parseFloat((idx * 0.1).toFixed(2))
  })
  updateAllAnimBadges()
  renderAnimSectionsList()
  document.querySelectorAll('.anim-global-presets .anim-preset').forEach(b =>
    b.classList.toggle('active', b.dataset.preset === presetId)
  )
  if (presetId !== 'none') {
    previewAllAnimations()
    toast(`"${PRESETS.find(p=>p.id===presetId)?.label}" applied to all sections`, '✨')
  } else {
    toast('Animations cleared', '○')
  }
}

// ── Preview: run animation on canvas sections ─────────────────────────────────
function previewAllAnimations() {
  if (!ANIM.enabled) return toast('Enable animations first','⚠️')
  document.querySelectorAll('.section-wrapper').forEach((wrapper, idx) => {
    const secId = wrapper.dataset.id
    const cfg   = getAnimConfig(secId)
    if (cfg.preset === 'none') return
    const kf = KEYFRAME_MAP[cfg.preset]
    if (!kf) return

    const content = wrapper.querySelector('.sec-content')
    if (!content) return

    const totalDelay = (cfg.delay + (idx * (cfg.stagger ? cfg.staggerDelay : 0))) * 1000

    content.style.opacity = '0'
    setTimeout(() => {
      content.style.animation = 'none'
      content.offsetHeight // force reflow
      content.style.animation = `${kf} ${cfg.duration}s ${cfg.easing} both`
      content.style.opacity   = ''
    }, totalDelay)
  })
  toast('Playing preview…', '▶')
}

// ── Preview a single section ──────────────────────────────────────────────────
function previewSectionAnim(sectionId) {
  const wrapper = document.querySelector(`.section-wrapper[data-id="${sectionId}"]`)
  if (!wrapper) return
  const cfg = getAnimConfig(sectionId)
  if (cfg.preset === 'none') return toast('No animation set','○')
  const kf = KEYFRAME_MAP[cfg.preset]
  if (!kf) return

  const content = wrapper.querySelector('.sec-content')
  if (!content) return
  content.style.animation = 'none'
  content.offsetHeight
  content.style.animation = `${kf} ${cfg.duration}s ${cfg.easing} both`
  setTimeout(() => { content.style.animation = '' }, cfg.duration * 1000 + 200)
}

// ── Reset all ─────────────────────────────────────────────────────────────────
function resetAllAnimations() {
  ANIM.sections = {}
  ANIM.global   = 'none'
  updateAllAnimBadges()
  renderAnimPanel()
  toast('All animations reset', '↺')
}

// ── Render the full panel ─────────────────────────────────────────────────────
function renderAnimPanel() {
  // Sync global switch
  document.getElementById('anim-global-switch').classList.toggle('on', ANIM.enabled)

  // Global preset grid
  const gpEl = document.getElementById('anim-global-presets')
  gpEl.innerHTML = PRESETS.map(p => `
    <button class="anim-preset${p.id==='none'?' none-preset':''}${ANIM.global===p.id?' active':''}"
      data-preset="${p.id}" onclick="applyPresetToAll('${p.id}')">
      <span class="anim-preset-icon">${p.icon}</span>
      ${p.label}
    </button>`).join('')

  renderAnimSectionsList()
}

function renderAnimSectionsList() {
  const listEl = document.getElementById('anim-sections-list')
  if (!listEl) return

  if (!S.sections.length) {
    listEl.innerHTML = '<p style="font-size:12px;color:var(--muted);text-align:center;padding:20px 0">Add sections to configure animations</p>'
    return
  }

  listEl.innerHTML = S.sections.map((sec) => {
    const def = DEFS[sec.type]
    const cfg = getAnimConfig(sec.id)
    const hasAnim = cfg.preset !== 'none'
    const isOpen  = ANIM._openSection === sec.id

    return `
      <div class="anim-section-item${isOpen?' open':''}${hasAnim?' active':''}" id="anim-item-${sec.id}">
        <div class="anim-section-head" onclick="toggleAnimSection('${sec.id}')">
          <span class="anim-section-icon">${def.icon}</span>
          <span class="anim-section-name">${def.label}</span>
          <span class="anim-section-badge${hasAnim?'':' none'}">${hasAnim ? PRESETS.find(p=>p.id===cfg.preset)?.label||cfg.preset : 'None'}</span>
          <span class="anim-section-chevron">›</span>
        </div>
        ${isOpen ? renderAnimSectionBody(sec, cfg) : ''}
      </div>`
  }).join('')
}

function renderAnimSectionBody(sec, cfg) {
  return `
    <div class="anim-section-body">

      <!-- Preset pick -->
      <div class="anim-ctrl-label">Animation preset</div>
      <div class="anim-preset-grid" style="grid-template-columns:repeat(3,1fr)">
        ${PRESETS.map(p => `
          <button class="anim-preset${p.id==='none'?' none-preset':''}${cfg.preset===p.id?' active':''}"
            onclick="setAnimProp('${sec.id}','preset','${p.id}')">
            <span class="anim-preset-icon">${p.icon}</span>${p.label}
          </button>`).join('')}
      </div>

      ${cfg.preset !== 'none' ? `
        <!-- Duration -->
        <div class="anim-ctrl-label" style="margin-top:12px">Duration</div>
        <div class="anim-slider-row">
          <input type="range" class="anim-slider" min="0.1" max="2" step="0.05"
            value="${cfg.duration}"
            oninput="setAnimProp('${sec.id}','duration',parseFloat(this.value));this.nextElementSibling.textContent=this.value+'s'"/>
          <span class="anim-slider-val">${cfg.duration}s</span>
        </div>

        <!-- Delay -->
        <div class="anim-ctrl-label">Delay</div>
        <div class="anim-slider-row">
          <input type="range" class="anim-slider" min="0" max="2" step="0.05"
            value="${cfg.delay}"
            oninput="setAnimProp('${sec.id}','delay',parseFloat(this.value));this.nextElementSibling.textContent=this.value+'s'"/>
          <span class="anim-slider-val">${cfg.delay}s</span>
        </div>

        <!-- Easing -->
        <div class="anim-ctrl-label">Easing curve</div>
        <select class="anim-select" onchange="setAnimProp('${sec.id}','easing',this.value)">
          ${EASINGS.map(e => `<option value="${e.id}"${cfg.easing===e.id?' selected':''}>${e.label}</option>`).join('')}
        </select>

        <!-- Stagger -->
        <div class="anim-ctrl-label" style="margin-top:12px">Stagger children</div>
        <div class="anim-stagger-row">
          <button class="anim-stagger-toggle${cfg.stagger?' on':''}"
            onclick="setAnimProp('${sec.id}','stagger',${!cfg.stagger})">
            ${cfg.stagger ? '✓ Stagger On' : '○ Stagger Off'}
          </button>
          ${cfg.stagger ? `
            <input type="range" class="anim-slider" min="0.02" max="0.3" step="0.01"
              value="${cfg.staggerDelay}" style="flex:1"
              oninput="setAnimProp('${sec.id}','staggerDelay',parseFloat(this.value));this.nextElementSibling.textContent=this.value+'s'"/>
            <span class="anim-slider-val" style="min-width:30px">${cfg.staggerDelay}s</span>
          ` : ''}
        </div>

        <!-- Trigger threshold -->
        <div class="anim-ctrl-label" style="margin-top:12px">Trigger point</div>
        <div class="anim-slider-row">
          <input type="range" class="anim-slider" min="0" max="0.5" step="0.05"
            value="${cfg.threshold}"
            oninput="setAnimProp('${sec.id}','threshold',parseFloat(this.value));this.nextElementSibling.textContent=Math.round(this.value*100)+'% visible'"/>
          <span class="anim-slider-val">${Math.round(cfg.threshold*100)}%</span>
        </div>

        <!-- Preview button -->
        <button onclick="previewSectionAnim('${sec.id}')"
          style="width:100%;padding:7px;background:rgba(108,99,255,.12);border:1px solid var(--accent);color:var(--accent2);border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;margin-top:10px;transition:all .15s"
          onmouseover="this.style.background='rgba(108,99,255,.2)'" onmouseout="this.style.background='rgba(108,99,255,.12)'">
          ▶ Preview this section
        </button>
      ` : ''}
    </div>`
}

ANIM._openSection = null
function toggleAnimSection(id) {
  ANIM._openSection = ANIM._openSection === id ? null : id
  renderAnimSectionsList()
}

// ── Generate the exported animation runtime script ────────────────────────────
function genAnimRuntime() {
  if (!ANIM.enabled) return ''

  // Collect sections that have animations
  const animated = S.sections
    .map(sec => ({ sec, cfg: getAnimConfig(sec.id) }))
    .filter(({ cfg }) => cfg.preset !== 'none')

  if (!animated.length) return ''

  // Build config array for runtime
  const runtimeCfg = animated.map(({ sec, cfg }) => ({
    sel: `[data-pc-section="${sec.id}"]`,
    kf:  KEYFRAME_MAP[cfg.preset],
    dur: cfg.duration,
    delay: cfg.delay,
    ease: cfg.easing,
    stagger: cfg.stagger,
    staggerDelay: cfg.staggerDelay,
    threshold: cfg.threshold,
    once: cfg.once,
  }))

  // CSS keyframes
  const keyframes = `
<style id="pc-anim-css">
@keyframes pc-fade-up    {from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)}}
@keyframes pc-fade-down  {from{opacity:0;transform:translateY(-32px)} to{opacity:1;transform:translateY(0)}}
@keyframes pc-fade-left  {from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)}}
@keyframes pc-fade-right {from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)}}
@keyframes pc-zoom-in    {from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)}}
@keyframes pc-zoom-out   {from{opacity:0;transform:scale(1.12)} to{opacity:1;transform:scale(1)}}
@keyframes pc-flip-x     {from{opacity:0;transform:perspective(600px) rotateX(14deg)} to{opacity:1;transform:perspective(600px) rotateX(0)}}
@keyframes pc-flip-y     {from{opacity:0;transform:perspective(600px) rotateY(-14deg)} to{opacity:1;transform:perspective(600px) rotateY(0)}}
@keyframes pc-blur-in    {from{opacity:0;filter:blur(12px)} to{opacity:1;filter:blur(0)}}
[data-pc-animate]{opacity:0}
[data-pc-animate].pc-done{opacity:1}
@media(prefers-reduced-motion:reduce){[data-pc-animate]{opacity:1!important;animation:none!important}}
</style>`

  // Runtime JS (self-contained, no dependencies)
  const runtimeJS = `
<script>
(function(){
var CFG=${JSON.stringify(runtimeCfg)};
function run(){
  CFG.forEach(function(c){
    var el=document.querySelector(c.sel);
    if(!el)return;
    el.setAttribute('data-pc-animate','');
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        var target=entry.target;
        function animate(node,extraDelay){
          setTimeout(function(){
            node.style.animation=c.kf+' '+c.dur+'s '+c.ease+' forwards';
            node.classList.add('pc-done');
          },Math.round((c.delay+extraDelay)*1000));
        }
        if(c.stagger){
          var children=Array.from(target.children);
          children.forEach(function(child,i){animate(child,i*c.staggerDelay)});
          target.classList.add('pc-done');
        } else {
          animate(target,0);
        }
        if(c.once)observer.unobserve(target);
      });
    },{threshold:c.threshold});
    observer.observe(el);
  });
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',run)}else{run()}
})();
<\/script>`

  return keyframes + runtimeJS
}

// ── Inject data-pc-section attrs into section HTML during export ──────────────
function stripForExport(html, sectionId) {
  // Add identifier attribute so runtime can find the section
  return html.replace(/^(\s*<(?:section|footer|div)[^>]*)/, `$1 data-pc-section="${sectionId}"`)
}

// ── Hook into canvas render to add animation badges ───────────────────────────
// Called after renderCanvas
// rerendered: optional Set of sectionIds — only process those wrappers
function attachAnimBadges(rerendered) {
  const wrappers = rerendered
    ? [...rerendered].map(id => document.querySelector(`.section-wrapper[data-id="${id}"]`)).filter(Boolean)
    : document.querySelectorAll('.section-wrapper[data-id]')

  wrappers.forEach(wrapper => {
    if (!wrapper.querySelector('.anim-badge')) {
      const badge = document.createElement('span')
      badge.className = 'anim-badge'
      badge.innerHTML = '<span class="anim-badge-dot"></span><span class="anim-badge-name">No animation</span>'
      wrapper.appendChild(badge)
    }
    updateSectionAnimBadge(wrapper.dataset.id)
  })
}