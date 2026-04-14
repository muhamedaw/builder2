/* pc-runtime.js — PageCraft Preview & Export Animation Runtime v3
   data-pc-animation format: "preset|dur|delay|ease|repeat"
   ─────────────────────────────────────────────────────────────────── */
(function () {
  'use strict'

  var KF = {
    'fade-up':    'pc-fade-up',    'fade-down':  'pc-fade-down',
    'fade-left':  'pc-fade-left',  'fade-right': 'pc-fade-right',
    'zoom-in':    'pc-zoom-in',    'zoom-out':   'pc-zoom-out',
    'flip-x':     'pc-flip-x',     'flip-y':     'pc-flip-y',
    'blur-in':    'pc-blur-in',    'slide-up':   'pc-slide-up',
    'slide-down': 'pc-slide-down', 'bounce-in':  'pc-bounce-in',
    'rotate-in':  'pc-rotate-in',  'pulse':      'pc-pulse',
  }

  var _played = typeof WeakSet !== 'undefined' ? new WeakSet() : null

  function ensureCSS() {
    if (document.getElementById('pc-runtime-css')) return
    var s = document.createElement('style')
    s.id = 'pc-runtime-css'
    s.textContent = [
      '@keyframes pc-fade-up    {from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)}}',
      '@keyframes pc-fade-down  {from{opacity:0;transform:translateY(-32px)} to{opacity:1;transform:translateY(0)}}',
      '@keyframes pc-fade-left  {from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)}}',
      '@keyframes pc-fade-right {from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)}}',
      '@keyframes pc-zoom-in    {from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)}}',
      '@keyframes pc-zoom-out   {from{opacity:0;transform:scale(1.12)} to{opacity:1;transform:scale(1)}}',
      '@keyframes pc-flip-x     {from{opacity:0;transform:perspective(600px) rotateX(14deg)} to{opacity:1;transform:perspective(600px) rotateX(0)}}',
      '@keyframes pc-flip-y     {from{opacity:0;transform:perspective(600px) rotateY(-14deg)} to{opacity:1;transform:perspective(600px) rotateY(0)}}',
      '@keyframes pc-blur-in    {from{opacity:0;filter:blur(12px)} to{opacity:1;filter:blur(0)}}',
      '@keyframes pc-slide-up   {from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)}}',
      '@keyframes pc-slide-down {from{opacity:0;transform:translateY(-60px)} to{opacity:1;transform:translateY(0)}}',
      '@keyframes pc-bounce-in  {0%{opacity:0;transform:scale(.3)} 50%{opacity:1;transform:scale(1.05)} 70%{transform:scale(.9)} 100%{opacity:1;transform:scale(1)}}',
      '@keyframes pc-rotate-in  {from{opacity:0;transform:rotate(-15deg) scale(.9)} to{opacity:1;transform:rotate(0) scale(1)}}',
      '@keyframes pc-pulse      {0%,100%{transform:scale(1)} 50%{transform:scale(1.06)}}',
      '[data-pc-animation]:not([data-pc-animation^="none"]){opacity:0}',
      '[data-pc-animation].pca-done{opacity:1!important}',
      '@media(prefers-reduced-motion:reduce){[data-pc-animation]{opacity:1!important;animation:none!important}}',
    ].join('\n')
    document.head.appendChild(s)
  }

  function play(el, preset, dur, delay, ease, rep) {
    if (_played && _played.has(el)) return
    if (_played) _played.add(el)
    var kf = KF[preset]
    if (!kf || preset === 'none') { el.style.opacity = '1'; el.classList.add('pca-done'); return }
    var it = rep === 'infinite' ? 'infinite' : (parseInt(rep) || 1)
    var totalMs = (parseFloat(dur) + parseFloat(delay)) * 1000 + 400
    el.style.animation = 'none'
    el.offsetHeight
    el.style.animation = kf + ' ' + dur + 's ' + ease + ' ' + delay + 's ' + it + ' both'
    function finish() {
      el.style.animation = ''
      el.style.opacity = '1'
      el.style.transform = ''
      el.classList.add('pca-done')
    }
    el.addEventListener('animationend', finish, { once: true })
    setTimeout(finish, totalMs)
  }

  function trigger(el) {
    var v = el.getAttribute('data-pc-animation')
    if (!v || v.startsWith('none')) { el.style.opacity = '1'; return }
    var p = v.split('|')
    play(el, p[0], parseFloat(p[1]) || 0.6, parseFloat(p[2]) || 0, p[3] || 'ease-out', p[4] || '1')
  }

  function init() {
    ensureCSS()
    var animated = document.querySelectorAll('[data-pc-animation]')
    if (!animated.length) return

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return
        obs.unobserve(entry.target)
        trigger(entry.target)
      })
    }, { threshold: 0.01, rootMargin: '200px 0px 0px 0px' })

    animated.forEach(function (el) {
      var v = el.getAttribute('data-pc-animation')
      if (!v || v.startsWith('none')) { el.style.opacity = '1'; return }
      obs.observe(el)
    })

    // Safety net: after 300ms force-trigger above-fold elements not yet played
    setTimeout(function () {
      animated.forEach(function (el) {
        if (_played && _played.has(el)) return
        var r = el.getBoundingClientRect()
        if (r.bottom > 0 && r.top < window.innerHeight + 300) trigger(el)
      })
    }, 300)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
