/* animation-engine.js — Universal Animation Engine v3
   Bridges section-level ANIM system + element-level Inspector animations.
   Every element with data-pc-id can receive a scroll-triggered animation.
   Stores config in sec.props._elAnims  →  exported as clean CSS + JS runtime.

   LIFECYCLE MODES:
   ─ Edit mode  : Play once → animationend → reset to base CSS (visible, no transform)
   ─ Preview/Export: IntersectionObserver → play → keep final state (fill-mode: forwards)
   ─────────────────────────────────────────────────────────────────────────── */

const AnimationEngine = (() => {
  'use strict'

  // ── Unified preset library (matches existing @keyframes pc-* in animation.js) ─
  const PRESETS = [
    { id:'none',        label:'None',        kf:null },
    { id:'fade-up',     label:'Fade Up',     kf:'pc-fade-up'    },
    { id:'fade-down',   label:'Fade Down',   kf:'pc-fade-down'  },
    { id:'fade-left',   label:'Fade Left',   kf:'pc-fade-left'  },
    { id:'fade-right',  label:'Fade Right',  kf:'pc-fade-right' },
    { id:'zoom-in',     label:'Zoom In',     kf:'pc-zoom-in'    },
    { id:'zoom-out',    label:'Zoom Out',    kf:'pc-zoom-out'   },
    { id:'flip-x',      label:'Flip X',      kf:'pc-flip-x'     },
    { id:'flip-y',      label:'Flip Y',      kf:'pc-flip-y'     },
    { id:'blur-in',     label:'Blur In',     kf:'pc-blur-in'    },
    { id:'slide-up',    label:'Slide Up',    kf:'pc-slide-up'   },
    { id:'slide-down',  label:'Slide Down',  kf:'pc-slide-down' },
    { id:'bounce-in',   label:'Bounce In',   kf:'pc-bounce-in'  },
    { id:'rotate-in',   label:'Rotate In',   kf:'pc-rotate-in'  },
    { id:'pulse',       label:'Pulse',       kf:'pc-pulse'      },
  ]

  // ── ALL @keyframes needed in both editor and export ───────────────────────────
  const EXTRA_KEYFRAMES = `
@keyframes pc-fade-up    {from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)}}
@keyframes pc-fade-down  {from{opacity:0;transform:translateY(-32px)} to{opacity:1;transform:translateY(0)}}
@keyframes pc-fade-left  {from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)}}
@keyframes pc-fade-right {from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)}}
@keyframes pc-zoom-in    {from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)}}
@keyframes pc-zoom-out   {from{opacity:0;transform:scale(1.12)} to{opacity:1;transform:scale(1)}}
@keyframes pc-flip-x     {from{opacity:0;transform:perspective(600px) rotateX(14deg)} to{opacity:1;transform:perspective(600px) rotateX(0)}}
@keyframes pc-flip-y     {from{opacity:0;transform:perspective(600px) rotateY(-14deg)} to{opacity:1;transform:perspective(600px) rotateY(0)}}
@keyframes pc-blur-in    {from{opacity:0;filter:blur(12px)} to{opacity:1;filter:blur(0)}}
@keyframes pc-slide-up   {from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)}}
@keyframes pc-slide-down {from{opacity:0;transform:translateY(-60px)} to{opacity:1;transform:translateY(0)}}
@keyframes pc-bounce-in  {0%{opacity:0;transform:scale(.3)} 50%{opacity:1;transform:scale(1.05)} 70%{transform:scale(.9)} 100%{opacity:1;transform:scale(1)}}
@keyframes pc-rotate-in  {from{opacity:0;transform:rotate(-15deg) scale(.9)} to{opacity:1;transform:rotate(0) scale(1)}}
@keyframes pc-pulse      {0%,100%{transform:scale(1)} 50%{transform:scale(1.06)}}`

  const DURATIONS = [0.2, 0.3, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0]
  const DELAYS    = [0, 0.1, 0.2, 0.3, 0.5, 0.8, 1.0, 1.5, 2.0]
  const EASINGS   = [
    { id:'ease-out',     label:'Ease Out' },
    { id:'ease-in-out',  label:'Smooth' },
    { id:'ease-in',      label:'Ease In' },
    { id:'linear',       label:'Linear' },
    { id:'cubic-bezier(.34,1.56,.64,1)', label:'Spring' },
  ]

  // ── Inject engine CSS once into document.head (editor mode only) ─────────────
  function _ensureEngineCss() {
    if (document.getElementById('pc-anim-engine-css')) return
    const style = document.createElement('style')
    style.id = 'pc-anim-engine-css'
    // EDITOR RULES — two states:
    // 1. Not playing (.pca-playing absent): force visible — ghost prevention
    // 2. Playing (.pca-playing present): release control so INLINE animation style runs
    //    NOTE: Do NOT use !important on animation for .pca-playing — inline style must win
    style.textContent = EXTRA_KEYFRAMES + `
/* Editor: elements always visible unless actively playing */
[data-pc-animation]:not(.pca-playing) {
  opacity: 1 !important;
  transform: none !important;
  animation: none !important;
}
/* Editor: during playback — let inline animation style win (no !important) */
[data-pc-animation].pca-playing {
  opacity: unset;
  transform: unset;
}
@media(prefers-reduced-motion:reduce){[data-pc-animation]{opacity:1!important;animation:none!important}}`
    document.head.appendChild(style)
  }

  // ── Clear all ghost/remnant styles from an element ────────────────────────────
  function _clearGhostStyles(el) {
    el.style.animation  = ''
    el.style.opacity    = ''
    el.style.transform  = ''
    el.classList.remove('pca-playing', 'pca-done')
  }

  // ── Read/write config from data-pc-animation attribute ────────────────────────
  // Format: "preset|dur|delay|ease|repeat"
  function _writeAttr(el, cfg) {
    el.setAttribute('data-pc-animation',
      `${cfg.preset}|${cfg.dur}|${cfg.delay}|${cfg.ease}|${cfg.repeat}`)
  }

  function _readAttr(el) {
    const raw = el?.getAttribute('data-pc-animation')
    if (!raw) return null
    const [preset, dur, delay, ease, repeat] = raw.split('|')
    return { preset, dur: parseFloat(dur)||0.6, delay: parseFloat(delay)||0,
             ease: ease||'ease-out', repeat: repeat||'1' }
  }

  // ── EDIT MODE: Play once → animationend → reset to base state ────────────────
  // Elements must NEVER stay invisible or transformed in the canvas after playing.
  function _playEditMode(el, cfg) {
    const preset = PRESETS.find(p => p.id === cfg.preset)
    if (!preset?.kf) { _clearGhostStyles(el); return }

    // Remove any previous ghost state first
    _clearGhostStyles(el)
    void el.offsetHeight // force reflow before adding animation

    el.classList.add('pca-playing')
    el.style.animation = `${preset.kf} ${parseFloat(cfg.dur)}s ${cfg.ease} ${parseFloat(cfg.delay)}s 1 both`

    // Reset function — called by animationend OR safety timer
    let _reset = null
    _reset = () => {
      if (!_reset) return // already fired
      _reset = null
      el.classList.remove('pca-playing')
      el.classList.add('pca-done')
      // Hard reset: guarantee visibility regardless of keyframe fill state
      el.style.animation  = ''
      el.style.opacity    = ''
      el.style.transform  = ''
    }

    el.addEventListener('animationend', _reset, { once: true })
    // Safety fallback in case animationend doesn't fire (display:none, etc.)
    setTimeout(() => { if (_reset) _reset() },
      (parseFloat(cfg.dur) + parseFloat(cfg.delay)) * 1000 + 600)
  }

  // ── Persist to sec.props._elAnims ────────────────────────────────────────────
  function _persist(_el, pcId, sectionId, cfg) {
    if (!sectionId || !pcId) return
    const sec = typeof S !== 'undefined' ? S.sections.find(s => s.id === sectionId) : null
    if (!sec) return
    if (!sec.props._elAnims) sec.props._elAnims = {}
    if (cfg.preset === 'none') {
      delete sec.props._elAnims[pcId]
    } else {
      sec.props._elAnims[pcId] = { preset: cfg.preset, dur: cfg.dur, delay: cfg.delay, ease: cfg.ease, repeat: cfg.repeat }
    }
  }

  // ── Resolve target element: supports both micro-elements and full sections ────
  // For section-level targets (no data-pc-id), uses sectionId + ':__section' as key.
  // This special key is handled in export to inject attr on the section root tag.
  function _resolveTarget(el, sectionId) {
    if (!el) return { targetEl: null, pcId: null }

    // If element already has a data-pc-id — use it directly
    if (el.dataset?.pcId) {
      return { targetEl: el, pcId: el.dataset.pcId }
    }

    // No pcId (e.g. .sec-content) — use section-level virtual key
    if (sectionId) {
      // Find the .sec-content element to apply the attr in the DOM
      const wrapper = document.querySelector(`.section-wrapper[data-id="${sectionId}"]`)
      const content = wrapper?.querySelector('.sec-content')
      const targetEl = content || el
      return { targetEl, pcId: `${sectionId}:__section` }
    }

    return { targetEl: el, pcId: null }
  }

  // ══════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════

  /** Apply animation to a DOM element + persist.
      Works for both micro-elements (data-pc-id) and whole sections (.sec-content). */
  function apply(el, cfg, sectionId) {
    if (!el) return
    _ensureEngineCss()

    const { targetEl, pcId } = _resolveTarget(el, sectionId)
    if (!targetEl) return

    if (cfg.preset === 'none') {
      remove(targetEl)
      if (sectionId && pcId) _persist(targetEl, pcId, sectionId, cfg)
      return
    }

    // Clean any ghost from previous animation attempt
    _clearGhostStyles(targetEl)

    _writeAttr(targetEl, cfg)
    _persist(targetEl, pcId, sectionId, cfg)

    // Edit mode: Play & Reset (elements must remain visible/clickable)
    if (typeof S !== 'undefined' && S.mode === 'edit') {
      _playEditMode(targetEl, cfg)
    }
  }

  /** Remove animation from element — cleans all ghost styles */
  function remove(el) {
    if (!el) return
    el.removeAttribute('data-pc-animation')
    _clearGhostStyles(el)
    // Ensure element is fully visible after removal
    el.style.opacity   = ''
    el.style.transform = ''
    el.style.animation = ''
  }

  /** Get current animation state from element */
  function getState(el) {
    if (!el) return { preset:'none', dur:0.6, delay:0, ease:'ease-out', repeat:'1' }

    const wrapper   = el.closest?.('[data-id]')
    const sectionId = wrapper?.dataset?.id
    const { targetEl, pcId } = _resolveTarget(el, sectionId)
    const resolvedEl = targetEl || el

    // Check live attr first
    const attr = _readAttr(resolvedEl)
    if (attr) return attr

    // Fallback: check persisted _elAnims (works for both normal pcId and __section)
    if (pcId && sectionId) {
      const sec = typeof S !== 'undefined' ? S.sections.find(s => s.id === sectionId) : null
      const saved = sec?.props?._elAnims?.[pcId]
      if (saved) return saved
    }
    return { preset:'none', dur:0.6, delay:0, ease:'ease-out', repeat:'1' }
  }

  /** Preview animation once immediately — Play & Reset */
  function previewOnce(el) {
    if (!el) return
    const wrapper   = el.closest?.('[data-id]')
    const sectionId = wrapper?.dataset?.id
    const { targetEl } = _resolveTarget(el, sectionId)
    const resolvedEl = targetEl || el
    const cfg = getState(resolvedEl)
    if (cfg.preset === 'none') return
    _ensureEngineCss()
    _playEditMode(resolvedEl, cfg)
  }

  /** Re-apply animation attr markers after section re-renders.
      Does NOT pre-hide elements — editor safety rule in CSS handles visibility. */
  function restoreSection(secId) {
    const sec = typeof S !== 'undefined' ? S.sections.find(s => s.id === secId) : null
    if (!sec?.props?._elAnims) return
    _ensureEngineCss()
    const wrapper = document.querySelector(`.section-wrapper[data-id="${secId}"]`)
    Object.entries(sec.props._elAnims).forEach(([pcId, cfg]) => {
      let el
      if (pcId.endsWith(':__section')) {
        // Section-level: target the .sec-content element
        el = wrapper?.querySelector('.sec-content') || null
      } else {
        el = document.querySelector(`[data-pc-id="${pcId}"]`)
      }
      if (!el) return
      _writeAttr(el, cfg)
      _clearGhostStyles(el)
    })
  }

  /** Generate export runtime — returns { css, script } so CSS goes in <head>
      and script goes at end of <body>. Prevents FOUC (flash of invisible content).
      PREVIEW MODE: animations trigger on scroll, stay in final state (no reset). */
  function genExportRuntime(sections) {
    const hasAnims = sections.some(s => {
      const a = s.props?._elAnims
      return a && Object.values(a).some(c => c.preset !== 'none')
    })
    if (!hasAnims) return { css: '', script: '' }

    const sc = 'scr'+'ipt'

    const KF_MAP = {
      'fade-up':    'pc-fade-up',    'fade-down':  'pc-fade-down',
      'fade-left':  'pc-fade-left',  'fade-right': 'pc-fade-right',
      'zoom-in':    'pc-zoom-in',    'zoom-out':   'pc-zoom-out',
      'flip-x':     'pc-flip-x',     'flip-y':     'pc-flip-y',
      'blur-in':    'pc-blur-in',    'slide-up':   'pc-slide-up',
      'slide-down': 'pc-slide-down', 'bounce-in':  'pc-bounce-in',
      'rotate-in':  'pc-rotate-in',  'pulse':      'pc-pulse',
    }

    // CSS goes in <head> — this ensures opacity:0 is set BEFORE elements paint (no FOUC)
    const css = `
@keyframes pc-fade-up    {from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)}}
@keyframes pc-fade-down  {from{opacity:0;transform:translateY(-32px)} to{opacity:1;transform:translateY(0)}}
@keyframes pc-fade-left  {from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)}}
@keyframes pc-fade-right {from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)}}
@keyframes pc-zoom-in    {from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)}}
@keyframes pc-zoom-out   {from{opacity:0;transform:scale(1.12)} to{opacity:1;transform:scale(1)}}
@keyframes pc-flip-x     {from{opacity:0;transform:perspective(600px) rotateX(14deg)} to{opacity:1;transform:perspective(600px) rotateX(0)}}
@keyframes pc-flip-y     {from{opacity:0;transform:perspective(600px) rotateY(-14deg)} to{opacity:1;transform:perspective(600px) rotateY(0)}}
@keyframes pc-blur-in    {from{opacity:0;filter:blur(12px)} to{opacity:1;filter:blur(0)}}
@keyframes pc-slide-up   {from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)}}
@keyframes pc-slide-down {from{opacity:0;transform:translateY(-60px)} to{opacity:1;transform:translateY(0)}}
@keyframes pc-bounce-in  {0%{opacity:0;transform:scale(.3)} 50%{opacity:1;transform:scale(1.05)} 70%{transform:scale(.9)} 100%{opacity:1;transform:scale(1)}}
@keyframes pc-rotate-in  {from{opacity:0;transform:rotate(-15deg) scale(.9)} to{opacity:1;transform:rotate(0) scale(1)}}
@keyframes pc-pulse      {0%,100%{transform:scale(1)} 50%{transform:scale(1.06)}}
[data-pc-animation]:not([data-pc-animation^="none"]){opacity:0}
[data-pc-animation].pca-done{opacity:1!important}
@media(prefers-reduced-motion:reduce){[data-pc-animation]{opacity:1!important;animation:none!important}}`

    // Script goes at end of <body> — runs after all elements are rendered
    const script = `
<${sc}>
/* pc-runtime v3 — Preview & Export */
(function(){
'use strict';
var KF=${JSON.stringify(KF_MAP)};
var _played=new WeakSet();
function play(el,preset,dur,delay,ease,rep){
  if(_played.has(el))return;
  _played.add(el);
  var kf=KF[preset];
  // Force visible if no keyframe or preset=none
  if(!kf||preset==='none'){el.style.opacity='1';el.classList.add('pca-done');return;}
  var it=rep==='infinite'?'infinite':(parseInt(rep)||1);
  var totalMs=(parseFloat(dur)+parseFloat(delay))*1000+400;
  // Clear stale animation, force reflow, then start fresh
  el.style.animation='none';
  el.offsetHeight;
  // FIX: use 'both' not 'both forwards' — 'both forwards' parses as two animations
  el.style.animation=kf+' '+dur+'s '+ease+' '+delay+'s '+it+' both';
  // On animation end: lock to fully visible state via inline style (beats CSS rule)
  function finish(){
    el.style.animation='';
    el.style.opacity='1';
    el.style.transform='';
    el.classList.add('pca-done');
  }
  el.addEventListener('animationend',finish,{once:true});
  // Safety fallback: if animationend never fires, force visible
  setTimeout(finish,totalMs);
}
function trigger(el){
  var v=el.getAttribute('data-pc-animation');
  if(!v||v.startsWith('none')){el.style.opacity='1';return;}
  var p=v.split('|');
  play(el,p[0],parseFloat(p[1])||0.6,parseFloat(p[2])||0,p[3]||'ease-out',p[4]||'1');
}
// Observe below-fold elements
var obs=new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(!e.isIntersecting)return;
    obs.unobserve(e.target);
    trigger(e.target);
  });
},{threshold:0.01,rootMargin:'200px 0px 0px 0px'});
var animated=document.querySelectorAll('[data-pc-animation]');
animated.forEach(function(el){
  var v=el.getAttribute('data-pc-animation');
  if(!v||v.startsWith('none')){el.style.opacity='1';return;}
  obs.observe(el);
});
// SAFETY NET: after 300ms, force-trigger any above-fold elements still hidden
// Handles edge cases where IntersectionObserver callback is delayed
setTimeout(function(){
  animated.forEach(function(el){
    if(_played.has(el))return;
    var r=el.getBoundingClientRect();
    if(r.bottom>0&&r.top<window.innerHeight+300)trigger(el);
  });
},300);
})();
</${sc}>`

    return { css, script }
  }

  // ── Expose presets/easings to Inspector ───────────────────────────────────────
  return {
    PRESETS, DURATIONS, DELAYS, EASINGS,
    apply, remove, getState, previewOnce,
    restoreSection, genExportRuntime,
  }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.AnimationEngine = AnimationEngine
