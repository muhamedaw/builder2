/* ai-chat.js — AI Builder Chat
   Local command engine + Groq API fallback.
   Floating chat interface wired to builder actions. */

const AIChat = (() => {
  'use strict'

  const MODEL = 'llama-3.3-70b-versatile'

  let _open    = false
  let _loading = false
  let _msgs    = []   // { role:'user'|'assistant', text, ts }

  // ── Section type aliases ────────────────────────────────────────────────────
  const TYPE_ALIASES = {
    hero: ['hero','header','banner','top','landing'],
    features: ['features','feature','benefits','benefit','why','services','service'],
    about: ['about','story','team','us','company','mission'],
    testimonial: ['testimonial','testimonials','reviews','review','social proof','feedback'],
    pricing: ['pricing','price','plans','plan','packages'],
    faq: ['faq','faqs','questions','question','qa'],
    gallery: ['gallery','photos','images','portfolio','work','showcase'],
    contact: ['contact','form','reach','email','get in touch'],
    footer: ['footer','bottom','links','navigation'],
    'product-grid': ['products','product','shop','store','ecommerce','e-commerce'],
    'form-builder': ['form','survey','signup','sign up','waitlist'],
    'video-hero': ['video','video hero'],
  }

  function _resolveType(text) {
    const t = text.toLowerCase().trim()
    for (const [type, aliases] of Object.entries(TYPE_ALIASES)) {
      if (aliases.some(a => t.includes(a))) return type
    }
    return null
  }

  // ── Local command parser ─────────────────────────────────────────────────────
  function _tryLocal(input) {
    const t = input.toLowerCase().trim()

    // add section
    if (/^(add|insert|create|put|include|append)\s+.+/.test(t)) {
      const rest = t.replace(/^(add|insert|create|put|include|append)\s+/, '')
      const type = _resolveType(rest)
      if (type) {
        addSection(type)
        return `Added **${DEFS[type]?.label || type}** section ✓`
      }
    }

    // remove section
    if (/^(remove|delete|kill|drop)\s+.+/.test(t)) {
      const rest = t.replace(/^(remove|delete|kill|drop)\s+/, '')
      const type = _resolveType(rest)
      if (type) {
        const sec = S.sections.find(s => s.type === type)
        if (sec) { removeSection(sec.id); return `Removed **${DEFS[type]?.label || type}** ✓` }
        return `No **${type}** section found on canvas.`
      }
    }

    // dark / light theme
    if (/dark.*(theme|mode|style)|make.*(it\s)?dark|dark.*(look|design)/.test(t)) {
      _applyTheme('dark')
      return 'Applied **dark theme** to all sections ✓'
    }
    if (/light.*(theme|mode|style)|make.*(it\s)?light|light.*(look|design)/.test(t)) {
      _applyTheme('light')
      return 'Applied **light theme** to all sections ✓'
    }

    // fix design
    if (/fix.*(design|layout|page)|improve.*(design|layout)|clean.*(up|design)/.test(t)) {
      return _fixDesign()
    }

    // undo
    if (/^(undo|revert|go back)/.test(t)) {
      if (typeof undo === 'function') { undo(); return 'Undone ✓' }
    }

    // clear
    if (/^(clear|reset|empty|wipe)\s*(page|canvas|all|everything)?$/.test(t)) {
      if (S.sections.length && confirm('Clear all sections?')) {
        if (typeof clearAll === 'function') clearAll()
        return 'Canvas cleared ✓'
      }
      return 'Cancelled.'
    }

    // move hero to top
    if (/hero.*(top|first|up)|move.*(hero)/.test(t)) {
      const idx = S.sections.findIndex(s => s.type === 'hero')
      if (idx > 0) {
        pushH('Move hero to top')
        const [h] = S.sections.splice(idx, 1)
        S.sections.unshift(h)
        renderAll('structure')
        return 'Moved **Hero** to the top ✓'
      }
      return 'Hero is already at the top.'
    }

    // move footer to bottom
    if (/footer.*(bottom|last|end)|move.*(footer)/.test(t)) {
      const idx = S.sections.findIndex(s => s.type === 'footer')
      if (idx !== -1 && idx !== S.sections.length - 1) {
        pushH('Move footer to bottom')
        const [f] = S.sections.splice(idx, 1)
        S.sections.push(f)
        renderAll('structure')
        return 'Moved **Footer** to the bottom ✓'
      }
      return 'Footer is already at the bottom.'
    }

    // list sections
    if (/^(list|show|what).*(section|page|canvas)/.test(t)) {
      if (!S.sections.length) return 'Canvas is empty — no sections yet.'
      return 'Current sections:\n' + S.sections.map((s, i) =>
        `${i + 1}. ${DEFS[s.type]?.icon || ''} ${DEFS[s.type]?.label || s.type}`
      ).join('\n')
    }

    // help
    if (/^(help|what can you do|commands|\?)/.test(t)) {
      return `I can help you build your page. Try:\n• **"add hero"** — add a section\n• **"remove footer"** — remove a section\n• **"dark theme"** — apply dark colors\n• **"fix design"** — auto-fix layout issues\n• **"build a SaaS landing page"** — generate full site\n• **"undo"** — undo last action\n• Or describe anything in plain English!`
    }

    return null  // no local match → try API
  }

  // ── Theme applier ────────────────────────────────────────────────────────────
  function _applyTheme(mode) {
    const dark  = { bg: '#0f172a', bg2: '#1e293b', text: '#ffffff', accent: '#6c63ff' }
    const light = { bg: '#ffffff', bg2: '#f8fafc', text: '#0f172a', accent: '#6c63ff' }
    const pal   = mode === 'dark' ? dark : light

    pushH(`Apply ${mode} theme`)
    S.sections.forEach((sec, i) => {
      if (sec.props.bgColor    !== undefined) sec.props.bgColor    = i % 2 === 0 ? pal.bg  : pal.bg2
      if (sec.props.textColor  !== undefined) sec.props.textColor  = pal.text
      if (sec.props.accentColor!== undefined) sec.props.accentColor= pal.accent
    })
    RenderEngine.invalidateAll()
    renderAll()
  }

  // ── Fix Design ───────────────────────────────────────────────────────────────
  function _fixDesign() {
    if (!S.sections.length) return 'Canvas is empty — add some sections first!'

    const fixes = []
    const types = S.sections.map(s => s.type)

    pushH('AI Fix Design')

    // Fix 1: Hero should be first
    const heroIdx = types.indexOf('hero')
    if (heroIdx > 0) {
      const [h] = S.sections.splice(heroIdx, 1)
      S.sections.unshift(h)
      fixes.push('Moved Hero to the top')
    }

    // Fix 2: Footer should be last
    const footerIdx = S.sections.findIndex(s => s.type === 'footer')
    if (footerIdx !== -1 && footerIdx !== S.sections.length - 1) {
      const [f] = S.sections.splice(footerIdx, 1)
      S.sections.push(f)
      fixes.push('Moved Footer to the bottom')
    }

    // Fix 3: Add missing hero if none
    if (!types.includes('hero')) {
      const def = DEFS['hero']
      if (def) {
        S.sections.unshift({ id: uid(), type: 'hero', props: { ...def.props } })
        fixes.push('Added missing Hero section')
      }
    }

    // Fix 4: Add footer if missing
    if (!types.includes('footer')) {
      const def = DEFS['footer']
      if (def) {
        S.sections.push({ id: uid(), type: 'footer', props: { ...def.props } })
        fixes.push('Added missing Footer section')
      }
    }

    // Fix 5: Normalize colors — detect dominant palette and apply
    const hasHero = S.sections.find(s => s.type === 'hero')
    if (hasHero?.props?.bgColor) {
      const heroIsDark = _isDark(hasHero.props.bgColor)
      S.sections.forEach((sec, i) => {
        if (sec.type === 'hero' || sec.type === 'footer') return
        if (sec.props.bgColor !== undefined) {
          const alt = i % 2 === 0
          if (heroIsDark) {
            sec.props.bgColor   = alt ? '#0f172a' : '#1e293b'
            sec.props.textColor = '#ffffff'
          } else {
            sec.props.bgColor   = alt ? '#ffffff' : '#f8fafc'
            sec.props.textColor = '#0f172a'
          }
        }
      })
      fixes.push('Normalized section colors for consistency')
    }

    RenderEngine.invalidateAll()
    renderAll()

    if (!fixes.length) return '✅ Design looks good — no fixes needed!'
    return `Fixed ${fixes.length} issue${fixes.length > 1 ? 's' : ''}:\n` + fixes.map(f => `• ${f}`).join('\n')
  }

  function _isDark(hex) {
    try {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
      return (0.299*r + 0.587*g + 0.114*b) < 128
    } catch { return true }
  }

  // ── Groq API call ────────────────────────────────────────────────────────────
  async function _callAPI(input) {
    const key = localStorage.getItem('pc_ai_key_v1') || ''
    if (!key) {
      return `To use AI for complex requests, add your **Groq API key** in ⚙️ Settings → API Keys.\n\nFor basic commands, I can work without a key — try: *"add hero"*, *"dark theme"*, *"fix design"*.`
    }

    const availableTypes = Object.keys(DEFS || {}).slice(0, 20).join(', ')
    const currentSections = S.sections.map(s => `${s.type}(${s.props?.headline?.slice?.(0,20) || ''})`).join(', ') || 'empty'

    const systemPrompt = `You are an AI assistant for PageCraft website builder. Help the user build and modify their website.

Current page sections: ${currentSections}
Available section types: ${availableTypes}

When the user wants to build or modify a page, respond with a JSON action block:
\`\`\`json
{
  "action": "build_page" | "add_sections" | "update_section" | "message",
  "sections": [{ "type": "hero", "props": { "headline": "...", "subheadline": "...", "bgColor": "#0f172a", "textColor": "#fff", "accentColor": "#6c63ff" } }],
  "message": "What you did"
}
\`\`\`

For "build_page": replace entire canvas with new sections.
For "add_sections": add sections to canvas.
For "message": just respond with text (no sections).

Only include props that exist in the section type. Common props: headline, subheadline, body, heading, bgColor, textColor, accentColor, ctaText, ctaUrl.
Keep colors in hex. Dark theme: bgColor #0f172a, textColor #fff. Light theme: bgColor #fff, textColor #0f172a.`

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err?.error?.message || `API error ${resp.status}`)
    }

    const data = await resp.json()
    const raw  = data?.choices?.[0]?.message?.content || ''

    // Try to parse JSON action
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/)
    if (jsonMatch) {
      try {
        const action = JSON.parse(jsonMatch[1])
        return _executeAction(action)
      } catch {}
    }

    return raw.trim()
  }

  function _executeAction(action) {
    if (!action) return 'No action received.'

    if (action.action === 'build_page' && action.sections?.length) {
      pushH('AI: Build page')
      S.sections = action.sections.map(s => ({
        id: uid(),
        type: s.type,
        props: { ...(DEFS[s.type]?.props || {}), ...s.props }
      })).filter(s => DEFS[s.type])
      S.selected = S.sections[0]?.id || null
      RenderEngine.invalidateAll()
      renderAll()
      return (action.message || `Built page with ${S.sections.length} sections`) + ' ✓'
    }

    if (action.action === 'add_sections' && action.sections?.length) {
      pushH('AI: Add sections')
      action.sections.forEach(s => {
        if (!DEFS[s.type]) return
        S.sections.push({ id: uid(), type: s.type, props: { ...(DEFS[s.type]?.props || {}), ...s.props } })
      })
      renderAll('structure')
      return (action.message || `Added ${action.sections.length} section(s)`) + ' ✓'
    }

    return action.message || 'Done ✓'
  }

  // ── Message rendering ────────────────────────────────────────────────────────
  function _formatMsg(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
  }

  function _renderMessages() {
    const list = document.getElementById('aichat-messages')
    if (!list) return
    if (!_msgs.length) {
      list.innerHTML = `<div class="aichat-empty">
        <div style="font-size:32px;margin-bottom:8px">🤖</div>
        <div style="font-size:13px;font-weight:600;color:var(--text)">AI Builder</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">Ask me to build your page</div>
        <div class="aichat-suggestions">
          <button onclick="AIChat.send('Build a SaaS landing page, dark theme')">🚀 SaaS page</button>
          <button onclick="AIChat.send('Add a testimonials section')">💬 Add testimonials</button>
          <button onclick="AIChat.send('fix design')">🔧 Fix design</button>
          <button onclick="AIChat.send('dark theme')">🌙 Dark theme</button>
        </div>
      </div>`
      return
    }
    list.innerHTML = _msgs.map(m => `
      <div class="aichat-msg ${m.role}">
        <div class="aichat-bubble">${_formatMsg(e(m.text))}</div>
      </div>`).join('')
    list.scrollTop = list.scrollHeight
  }

  function _addMsg(role, text) {
    _msgs.push({ role, text, ts: Date.now() })
    _renderMessages()
  }

  function _showTyping() {
    const list = document.getElementById('aichat-messages')
    if (!list) return
    const el = document.createElement('div')
    el.className = 'aichat-msg assistant aichat-typing'
    el.id = 'aichat-typing'
    el.innerHTML = '<div class="aichat-bubble"><span class="aichat-dots"><span></span><span></span><span></span></span></div>'
    list.appendChild(el)
    list.scrollTop = list.scrollHeight
  }

  function _hideTyping() {
    document.getElementById('aichat-typing')?.remove()
  }

  // ── Public send ──────────────────────────────────────────────────────────────
  async function send(input) {
    input = (input || document.getElementById('aichat-input')?.value || '').trim()
    if (!input || _loading) return

    const inputEl = document.getElementById('aichat-input')
    if (inputEl) inputEl.value = ''

    _addMsg('user', input)
    _loading = true
    _showTyping()

    try {
      // Try local first (instant, no API)
      let reply = _tryLocal(input)

      // Fallback to API for complex requests
      if (reply === null) {
        reply = await _callAPI(input)
      }

      _hideTyping()
      _addMsg('assistant', reply)
    } catch (err) {
      _hideTyping()
      _addMsg('assistant', `⚠️ Error: ${err.message}`)
    } finally {
      _loading = false
    }
  }

  // ── Open / close ─────────────────────────────────────────────────────────────
  function open() {
    _open = true
    const panel = document.getElementById('aichat-panel')
    if (panel) { panel.classList.add('open'); _renderMessages() }
    document.getElementById('aichat-input')?.focus()
  }

  function close() {
    _open = false
    document.getElementById('aichat-panel')?.classList.remove('open')
  }

  function toggle() { _open ? close() : open() }

  function clear() {
    _msgs = []
    _renderMessages()
  }

  // ── Init: inject UI ──────────────────────────────────────────────────────────
  function _injectUI() {
    // FAB button
    const fab = document.createElement('button')
    fab.id        = 'aichat-fab'
    fab.className = 'aichat-fab'
    fab.title     = 'AI Builder'
    fab.innerHTML = '🤖'
    fab.onclick   = () => AIChat.toggle()
    document.body.appendChild(fab)

    // Chat panel
    const panel = document.createElement('div')
    panel.id        = 'aichat-panel'
    panel.className = 'aichat-panel'
    panel.innerHTML = `
      <div class="aichat-header">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">🤖</span>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--text)">AI Builder</div>
            <div style="font-size:10px;color:var(--muted)">Ask me anything</div>
          </div>
        </div>
        <div style="display:flex;gap:4px">
          <button class="aichat-hbtn" onclick="AIChat.clear()" title="Clear chat">🗑</button>
          <button class="aichat-hbtn" onclick="AIChat.close()" title="Close">✕</button>
        </div>
      </div>
      <div class="aichat-messages" id="aichat-messages"></div>
      <div class="aichat-input-row">
        <input id="aichat-input" class="aichat-input" placeholder="Add hero section, dark theme…"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();AIChat.send()}"/>
        <button class="aichat-send" onclick="AIChat.send()" title="Send">↑</button>
      </div>`
    document.body.appendChild(panel)
  }

  document.addEventListener('DOMContentLoaded', _injectUI)

  // Keyboard shortcut: Ctrl+/ opens AI chat
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault()
      toggle()
    }
  })

  return { open, close, toggle, send, clear }
})()

window.PageCraft = window.PageCraft || {}
window.PageCraft.AIChat = AIChat
