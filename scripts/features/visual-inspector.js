/* visual-inspector.js — Stage 3: Floating Section Toolbar
   Appears above the selected section in edit mode.
   Supports quick-action buttons + inline AI natural language commands. */

const VisualInspector = (() => {
  'use strict'

  let _bar     = null   // toolbar DOM node
  let _secId   = null   // currently pinned section id
  let _aiOpen  = false  // AI input expanded
  let _rafId   = null   // rAF for position tracking

  // ── Quick actions ─────────────────────────────────────────────────────────
  // Each action: { icon, label, run(sec) }
  const ACTIONS = [
    {
      icon: '🎨', label: 'Background color',
      run(sec) {
        const inp = document.createElement('input')
        inp.type  = 'color'
        inp.value = sec.props.bgColor || '#ffffff'
        inp.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
        document.body.appendChild(inp)
        inp.click()
        inp.addEventListener('input', () => {
          sec.props.bgColor = inp.value
          RenderEngine.invalidate(sec.id)
          renderAll('props')
        })
        inp.addEventListener('change', () => { pushH('BG color'); inp.remove() })
      }
    },
    {
      icon: '✏️', label: 'Text color',
      run(sec) {
        const inp = document.createElement('input')
        inp.type  = 'color'
        inp.value = sec.props.textColor || '#000000'
        inp.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
        document.body.appendChild(inp)
        inp.click()
        inp.addEventListener('input', () => {
          sec.props.textColor = inp.value
          RenderEngine.invalidate(sec.id)
          renderAll('props')
        })
        inp.addEventListener('change', () => { pushH('Text color'); inp.remove() })
      }
    },
    {
      icon: '📋', label: 'Duplicate',
      run(sec) { dupSection(sec.id) }
    },
    {
      icon: '⧉', label: 'Save as component',
      run(sec) { if (typeof saveAsComponent === 'function') saveAsComponent(sec.id) }
    },
    {
      icon: '🗑', label: 'Delete', danger: true,
      run(sec) { removeSection(sec.id) }
    },
    {
      icon: '🎯', label: 'Pick element',
      run(_sec) {
        if (typeof MicroTarget === 'undefined') return
        if (MicroTarget.isActive()) { MicroTarget.deactivate(); return }
        MicroTarget.activate((el, _sectionId, path, context) => {
          // Flash picked element outline and show path in AI status
          const status = document.getElementById('vi-ai-status')
          if (status) {
            status.textContent = `Picked: ${path.split(' > ').pop()}`
            setTimeout(() => { if (status) status.textContent = '' }, 3000)
          }
          // Open Style Inspector with full state hydration
          if (typeof Inspector !== 'undefined') Inspector.select(el, context)
          // Also open AI input focused on this element
          _toggleAI(true)
          const input = document.getElementById('vi-ai-input')
          if (input) input.placeholder = `Style this ${el.tagName.toLowerCase()}…`
        })
      }
    },
  ]

  // ── Local AI command interpreter (section-scoped) ─────────────────────────
  // Handles natural language targeting the *selected* section only.
  const SECTION_CMDS = [
    // colors
    [/dark(?:er)?(?:\s+bg)?|bg(?:ground)?\s+dark/i,      sec => { sec.props.bgColor = '#0f172a'; sec.props.textColor = '#ffffff' }],
    [/light(?:er)?(?:\s+bg)?|bg(?:ground)?\s+light/i,    sec => { sec.props.bgColor = '#ffffff'; sec.props.textColor = '#0f172a' }],
    [/bg(?:ground)?\s+(#[0-9a-f]{3,6}|\w+)/i,            (sec,m) => { sec.props.bgColor = m[1] }],
    [/text\s+(?:color\s+)?(#[0-9a-f]{3,6}|\w+)/i,        (sec,m) => { sec.props.textColor = m[1] }],
    [/accent\s+(#[0-9a-f]{3,6}|\w+)/i,                   (sec,m) => { sec.props.accentColor = m[1] }],
    // content
    [/headline[:\s]+(.+)/i,     (sec,m) => { sec.props.headline = m[1].trim() }],
    [/subheadline[:\s]+(.+)/i,  (sec,m) => { sec.props.subheadline = m[1].trim() }],
    [/heading[:\s]+(.+)/i,      (sec,m) => { sec.props.heading = m[1].trim() }],
    [/body[:\s]+(.+)/i,         (sec,m) => { sec.props.body = m[1].trim() }],
    [/cta[:\s]+(.+)/i,          (sec,m) => { sec.props.ctaText = m[1].trim() }],
    // padding / height
    [/(?:taller|more height|bigger)/i,  sec => { sec.props.minHeight = Math.min(900, (parseInt(sec.props.minHeight)||520) + 80) }],
    [/(?:shorter|less height|smaller)/i, sec => { sec.props.minHeight = Math.max(200, (parseInt(sec.props.minHeight)||520) - 80) }],
    [/padding\s+(\d+)/i,   (sec,m) => { sec.props.paddingY = `${m[1]}px` }],
    // align
    [/center(?:\s+text)?/i,  sec => { sec.props.align = 'center' }],
    [/left(?:\s+text)?/i,    sec => { sec.props.align = 'left' }],
    [/right(?:\s+text)?/i,   sec => { sec.props.align = 'right' }],
    // ── 3.3 Content Generation — suggest copy & images by section type ───
    [/suggest\s+(?:copy|content|text)/i, sec => { _suggestContent(sec); return '__async__' }],
    [/suggest\s+(?:image|photo|bg)/i,    sec => { _suggestImage(sec);   return '__async__' }],
    [/generate\s+(?:headline|heading)/i, sec => { _suggestContent(sec); return '__async__' }],
    // ── 2.2 Advanced Positioning ──────────────────────────────────────────
    // Stick element to corner / edge — writes a scoped CSS override via _injectScopedCSS
    [/stick\s+(?:to\s+)?(?:bottom[\s-]right|br)/i,  sec => { _injectScopedCSS(sec, 'position:relative;margin-left:auto') }],
    [/stick\s+(?:to\s+)?(?:bottom[\s-]left|bl)/i,   sec => { _injectScopedCSS(sec, 'position:relative;margin-right:auto') }],
    [/stick\s+(?:to\s+)?(?:top[\s-]right|tr)/i,     sec => { _injectScopedCSS(sec, 'position:sticky;top:0;z-index:100') }],
    [/sticky|fixed\s+top/i,                          sec => { _injectScopedCSS(sec, 'position:sticky;top:0;z-index:100') }],
    [/full\s*width/i,  sec => { _injectScopedCSS(sec, 'width:100vw;margin-left:calc(50% - 50vw)') }],
    [/full\s*screen/i, sec => { sec.props.minHeight = '100vh' }],
    // ── 2.3 Style Injection — scoped CSS variables ────────────────────────
    [/--(\w[\w-]*)\s*:\s*([^;]+)/i,  (sec,m) => { _setCSSVar(sec, `--${m[1]}`, m[2].trim()) }],
    [/radius\s+(\d+(?:px|%|rem)?)/i, (sec,m) => { _setCSSVar(sec, '--pc-radius', m[1]) }],
    [/gap\s+(\d+(?:px|rem)?)/i,      (sec,m) => { _setCSSVar(sec, '--pc-gap', m[1]) }],
    [/font\s+size\s+(\d+(?:px|rem)?)/i, (sec,m) => { _setCSSVar(sec, '--pc-font-size', m[1]) }],
  ]

  // ── 2.2 Scoped CSS injection ──────────────────────────────────────────────
  // Writes raw CSS into a <style> tag scoped to the section via data-id selector.
  function _injectScopedCSS(sec, cssText) {
    const styleId = `pc-scoped-${sec.id}`
    let tag = document.getElementById(styleId)
    if (!tag) {
      tag = document.createElement('style')
      tag.id = styleId
      document.head.appendChild(tag)
    }
    tag.textContent = `[data-id="${sec.id}"] .sec-content{${cssText}}`
    // Persist so export can include it
    sec.props._scopedCSS = (sec.props._scopedCSS || '') + cssText + ';'
  }

  // ── 2.3 Scoped CSS variables ──────────────────────────────────────────────
  // Sets a CSS custom property on the section wrapper element directly.
  function _setCSSVar(sec, name, value) {
    const wrapper = document.querySelector(`.section-wrapper[data-id="${sec.id}"]`)
    if (wrapper) wrapper.style.setProperty(name, value)
    // Persist
    if (!sec.props._cssVars) sec.props._cssVars = {}
    sec.props._cssVars[name] = value
  }

  // ── 3.3 Content Generation helpers ───────────────────────────────────────
  // Copy presets per section type — used when no Groq key is set
  const CONTENT_PRESETS = {
    hero:        { headline: 'Build Something Amazing', subheadline: 'The fastest way to launch your idea.', ctaText: 'Get Started Free' },
    about:       { heading: 'Our Story', body: 'We believe great products start with great people.' },
    features:    { heading: 'Why Choose Us', body: 'Powerful tools, zero complexity.' },
    testimonial: { heading: 'What Our Customers Say' },
    contact:     { heading: 'Get In Touch', body: 'We\'d love to hear from you.' },
    footer:      { body: '© 2025 · Built with PageCraft' },
  }

  // Unsplash-style keyword map for section types
  const IMAGE_KEYWORDS = {
    hero:     'modern technology abstract',
    about:    'team office collaboration',
    features: 'product design minimalist',
    gallery:  'portfolio creative',
    contact:  'communication network',
  }

  async function _suggestContent(sec) {
    const key = localStorage.getItem('pc_ai_key_v1') || ''
    if (!key) {
      // Fall back to local presets
      const preset = CONTENT_PRESETS[sec.type] || {}
      if (!Object.keys(preset).length) return
      Object.assign(sec.props, preset)
      RenderEngine.invalidate(sec.id)
      _mirrorProps(Object.keys(preset))
      renderAll('props')
      return
    }
    // Use Groq for tailored suggestions
    const prompt = `Generate compelling copy for a "${sec.type}" section.
Reply ONLY with a JSON object of prop values, e.g. {"headline":"...","subheadline":"...","ctaText":"..."}.
Be concise and punchy. No explanation.`
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 200, temperature: 0.7 })
      })
      if (!resp.ok) throw new Error(`API ${resp.status}`)
      const data = await resp.json()
      const raw  = data?.choices?.[0]?.message?.content || ''
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}')
      if (Object.keys(json).length) {
        pushH('AI: suggest content')
        Object.assign(sec.props, json)
        RenderEngine.invalidate(sec.id)
        _mirrorProps(Object.keys(json))
        renderAll('props')
      }
    } catch (_) { /* silent — presets already applied */ }
  }

  function _suggestImage(sec) {
    const kw = IMAGE_KEYWORDS[sec.type] || sec.type
    // Use Unsplash Source (no API key required, public CDN)
    const url = `https://source.unsplash.com/1600x900/?${encodeURIComponent(kw)}`
    sec.props.bgImage = url
    RenderEngine.invalidate(sec.id)
    _mirrorProps(['bgImage'])
    renderAll('props')
    pushH('AI: suggest image')
  }

  function _applyLocalCmd(input, sec) {
    // 1. Word-level micro-targeting (MicroTarget handles "make "X" bold", etc.)
    if (typeof MicroTarget !== 'undefined' && MicroTarget.parseCmd(input, sec)) return true

    // 2. Section-level property commands
    const lower = input.trim()
    for (const [re, fn] of SECTION_CMDS) {
      const m = lower.match(re)
      if (m) {
        const result = fn(sec, m)
        // '__async__' signals fire-and-forget async (suggestContent/Image)
        // still counts as handled — status will update via renderAll inside the async fn
        return result !== false
      }
    }
    return false
  }

  // ── 3.2 Property Mirroring — patch sidebar inputs without full re-render ──
  function _mirrorProps(changedKeys) {
    changedKeys.forEach(key => {
      const sec = _secId ? S.sections.find(s => s.id === _secId) : null
      if (!sec) return
      const val = sec.props[key]
      if (val === undefined) return
      // Update all [data-pk] inputs matching this key
      document.querySelectorAll(`[data-pk="${key}"]`).forEach(inp => {
        if (inp === document.activeElement) return  // never clobber user's active input
        if (inp.type === 'color' || inp.tagName === 'INPUT') inp.value = val
        else if (inp.tagName === 'TEXTAREA') inp.value = val
        else if (inp.tagName === 'SELECT') inp.value = val
      })
    })
  }

  async function _runAICmd(input, sec) {
    const applied = _applyLocalCmd(input, sec)
    if (applied) {
      pushH(`AI: ${input}`)
      RenderEngine.invalidate(sec.id)
      _mirrorProps(Object.keys(sec.props))
      renderAll('props')
      if (typeof Collab !== 'undefined') Collab.emitSectionPatch(sec.id, sec.props)
      return `Applied: "${input}" ✓`
    }

    // Fallback to Groq if key exists
    const key = localStorage.getItem('pc_ai_key_v1') || ''
    if (!key) return `No local match. Add a Groq API key in Settings → API Keys for advanced edits.`

    const prompt = `You are editing a "${sec.type}" section. Current props: ${JSON.stringify(sec.props, null, 0).slice(0, 400)}.
User command: "${input}"
Reply ONLY with a JSON object of prop changes, e.g. {"bgColor":"#000","headline":"New text"}. No explanation.`

    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 200, temperature: 0.3 })
      })
      if (!resp.ok) throw new Error(`API ${resp.status}`)
      const data = await resp.json()
      const raw  = data?.choices?.[0]?.message?.content || ''
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}')
      if (Object.keys(json).length) {
        pushH(`AI: ${input}`)
        Object.assign(sec.props, json)
        RenderEngine.invalidate(sec.id)
        _mirrorProps(Object.keys(json))   // 3.2: instant sidebar sync
        renderAll('props')
        if (typeof Collab !== 'undefined') Collab.emitSectionPatch(sec.id, json)
        return `Updated: ${Object.keys(json).join(', ')} ✓`
      }
      return 'No changes made.'
    } catch (err) {
      return `⚠️ ${err.message}`
    }
  }

  // ── Build toolbar HTML ────────────────────────────────────────────────────
  function _buildBar() {
    const bar = document.createElement('div')
    bar.id        = 'vi-bar'
    bar.className = 'vi-bar'
    bar.innerHTML = `
      <div class="vi-actions" id="vi-actions"></div>
      <div class="vi-sep"></div>
      <div class="vi-ai-wrap" id="vi-ai-wrap">
        <button class="vi-ai-btn" id="vi-ai-btn" onclick="VisualInspector._toggleAI()" title="AI edit (Ctrl+E)">
          🤖 <span class="vi-ai-label">AI Edit</span>
        </button>
        <div class="vi-ai-input-wrap" id="vi-ai-input-wrap" style="display:none">
          <input class="vi-ai-input" id="vi-ai-input" placeholder="e.g. dark bg, bigger, center text…"
            onkeydown="if(event.key==='Enter'){event.preventDefault();VisualInspector._submitAI()}
                       else if(event.key==='Escape')VisualInspector._toggleAI(false)"/>
          <button class="vi-ai-go" onclick="VisualInspector._submitAI()">↵</button>
          <span class="vi-ai-status" id="vi-ai-status"></span>
        </div>
      </div>`
    document.body.appendChild(bar)
    return bar
  }

  // ── Position bar above selected section ──────────────────────────────────
  function _positionBar() {
    if (!_bar || !_secId) return
    const wrapper = document.querySelector(`.section-wrapper[data-id="${_secId}"]`)
    if (!wrapper) { hide(); return }

    const rect   = wrapper.getBoundingClientRect()
    const barH   = _bar.offsetHeight || 40
    const top    = Math.max(8, rect.top - barH - 8)
    const left   = Math.max(8, Math.min(rect.left, window.innerWidth - _bar.offsetWidth - 8))

    _bar.style.top  = `${top}px`
    _bar.style.left = `${left}px`
  }

  function _startTracking() {
    _stopTracking()
    const tick = () => {
      _positionBar()
      _rafId = requestAnimationFrame(tick)
    }
    _rafId = requestAnimationFrame(tick)
  }

  function _stopTracking() {
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null }
  }

  // ── Render actions for current section ───────────────────────────────────
  function _renderActions(_sec) {
    const container = document.getElementById('vi-actions')
    if (!container) return
    container.innerHTML = ACTIONS.map(a => `
      <button class="vi-action-btn${a.danger ? ' danger' : ''}" title="${a.label}"
        onclick="VisualInspector._runAction('${a.label.replace(/'/g,"\\'")}')">
        ${a.icon}
      </button>`).join('')
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function show(secId) {
    if (!_bar) _bar = _buildBar()
    _secId = secId

    const sec = S.sections.find(s => s.id === secId)
    if (!sec || S.mode !== 'edit') { hide(); return }

    _renderActions(sec)
    _toggleAI(false)
    _bar.classList.remove('vi-hidden')
    _bar.style.display = ''
    _startTracking()
  }

  function hide() {
    _stopTracking()
    _secId = null
    if (_bar) {
      _bar.classList.add('vi-hidden')
      setTimeout(() => { if (_bar) _bar.style.display = 'none' }, 160)
    }
  }

  function _toggleAI(force) {
    _aiOpen = force !== undefined ? force : !_aiOpen
    const wrap = document.getElementById('vi-ai-input-wrap')
    const btn  = document.getElementById('vi-ai-btn')
    if (wrap) wrap.style.display = _aiOpen ? 'flex' : 'none'
    if (btn)  btn.classList.toggle('active', _aiOpen)
    if (_aiOpen) {
      setTimeout(() => document.getElementById('vi-ai-input')?.focus(), 50)
    }
  }

  async function _submitAI() {
    const input  = document.getElementById('vi-ai-input')?.value?.trim()
    const status = document.getElementById('vi-ai-status')
    if (!input || !_secId) return

    const sec = S.sections.find(s => s.id === _secId)
    if (!sec) return

    if (status) status.textContent = '⏳'
    const result = await _runAICmd(input, sec)
    if (status) {
      status.textContent = result
      setTimeout(() => { if (status) status.textContent = '' }, 3000)
    }
    const inp = document.getElementById('vi-ai-input')
    if (inp) inp.value = ''
  }

  function _runAction(label) {
    const sec = _secId ? S.sections.find(s => s.id === _secId) : null
    if (!sec) return
    const action = ACTIONS.find(a => a.label === label)
    if (action) action.run(sec)
  }

  // ── Keyboard shortcut: Ctrl+E = toggle AI input on selected section ───────
  document.addEventListener('keydown', ev => {
    if (ev.ctrlKey && ev.key === 'e' && S.selected && S.mode === 'edit') {
      ev.preventDefault()
      show(S.selected)
      _toggleAI(true)
    }
  })

  // ── Hide on preview mode ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    // Deselect / hide when clicking outside canvas
    document.addEventListener('click', ev => {
      if (_bar && !ev.target.closest('#vi-bar') && !ev.target.closest('.section-wrapper')) {
        _toggleAI(false)
      }
    })
  })

  // ── _execCmd: called by PropertyBridge.cmd() ─────────────────────────────
  // Runs a natural-language command against a given section object directly.
  async function _execCmd(input, sec) {
    const status = document.getElementById('vi-ai-status')
    if (status) status.textContent = '⏳'
    const result = await _runAICmd(input, sec)
    if (status) {
      status.textContent = result
      setTimeout(() => { if (status) status.textContent = '' }, 3000)
    }
    return result
  }

  return { show, hide, _toggleAI, _submitAI, _runAction, _execCmd }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.VisualInspector = VisualInspector
