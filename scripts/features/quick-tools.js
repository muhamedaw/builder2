/* ══════════════════════════════════════════════════════
   STAGE 4 — SPEED ENGINE
   QuickGen · SmartDefaults · SpeedDial
══════════════════════════════════════════════════════ */

// ── SmartDefaults — inherit color palette from canvas ────────────────────────
const SmartDefaults = (() => {
  // Detect dominant palette from existing sections
  function _detectPalette() {
    const secs = S.sections
    if (!secs.length) return null
    // Sample bgColors from last 3 sections
    const bgs = secs.slice(-3).map(s => s.props?.bgColor).filter(Boolean)
    if (!bgs.length) return null
    const last = bgs[bgs.length - 1]
    // Determine light vs dark
    const isDark = _isDark(last)
    return {
      bg1:    isDark ? last : '#ffffff',
      bg2:    isDark ? _lighten(last) : '#f8fafc',
      text:   isDark ? '#ffffff' : '#0f172a',
      accent: secs.slice(-3).map(s => s.props?.accentColor).filter(Boolean).pop() || '#6c63ff',
    }
  }

  function _isDark(hex) {
    try {
      const r = parseInt(hex.slice(1,3),16)
      const g = parseInt(hex.slice(3,5),16)
      const b = parseInt(hex.slice(5,7),16)
      return (0.299*r + 0.587*g + 0.114*b) < 128
    } catch { return true }
  }

  function _lighten(hex) {
    try {
      const r = Math.min(255, parseInt(hex.slice(1,3),16) + 20)
      const g = Math.min(255, parseInt(hex.slice(3,5),16) + 20)
      const b = Math.min(255, parseInt(hex.slice(5,7),16) + 20)
      return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')
    } catch { return hex }
  }

  // Alternate bg between dark/light sections for visual rhythm
  function _shouldAlternate() {
    const secs = S.sections
    if (!secs.length) return false
    const last = secs[secs.length - 1]
    return last?.props?.bgColor && _isDark(last.props.bgColor)
  }

  // Sections with internal sub-elements that have their own backgrounds
  // — textColor must NOT be forced on these or sub-element text becomes invisible
  // Only skip textColor for sections whose internal card/item backgrounds are always white
  const _NO_TEXT_OVERRIDE = new Set(['pricing','product-grid'])

  // Apply smart defaults to new section props
  function applyTo(type, props) {
    const pal = _detectPalette()
    if (!pal) return props   // no existing sections — use DEFS defaults

    const alt = _shouldAlternate()
    const bg  = alt ? pal.bg2 : pal.bg1
    const txt = _isDark(bg) ? '#ffffff' : '#0f172a'

    // Only apply if props still has the DEFS default colors (not customised)
    const def = DEFS[type]?.props || {}
    if (props.bgColor    === def.bgColor)    props.bgColor    = bg
    if (props.accentColor=== def.accentColor)props.accentColor= pal.accent
    // Skip textColor for sections with internal white-background sub-elements
    if (!_NO_TEXT_OVERRIDE.has(type) && props.textColor === def.textColor)
      props.textColor = txt
    return props
  }

  return { applyTo, detectPalette: _detectPalette }
})()

// SmartDefaults hook is wired directly inside addSection (see below near SECTION CRUD)

// ── QuickGen — One-Click Site Generator ──────────────────────────────────────
const QuickGen = (() => {
  let _step = 1
  let _name = ''
  let _industry = ''
  let _style = ''

  const INDUSTRIES = [
    { id:'saas',       icon:'💻', label:'SaaS / Tech',    desc:'Software & platforms',
      sections:['hero','features','about','testimonial','pricing','faq','footer'] },
    { id:'agency',     icon:'🎨', label:'Agency',          desc:'Creative & design',
      sections:['hero','about','features','gallery','testimonial','contact','footer'] },
    { id:'portfolio',  icon:'🖼', label:'Portfolio',        desc:'Showcase your work',
      sections:['hero','gallery','about','testimonial','contact','footer'] },
    { id:'store',      icon:'🛍', label:'E-commerce',       desc:'Products & shop',
      sections:['hero','features','product-grid','testimonial','pricing','footer'] },
    { id:'restaurant', icon:'🍽', label:'Restaurant',       desc:'Food & hospitality',
      sections:['hero','about','gallery','testimonial','contact','footer'] },
    { id:'blog',       icon:'✍', label:'Blog / Media',     desc:'Content & writing',
      sections:['hero','features','about','contact','footer'] },
    { id:'startup',    icon:'🚀', label:'Startup',          desc:'Launch & grow fast',
      sections:['hero','features','pricing','testimonial','faq','footer'] },
    { id:'health',     icon:'🏥', label:'Health / Wellness',desc:'Care & wellbeing',
      sections:['hero','about','features','gallery','testimonial','contact','footer'] },
    { id:'education',  icon:'🎓', label:'Education',        desc:'Courses & learning',
      sections:['hero','features','about','pricing','faq','contact','footer'] },
  ]

  const STYLES = [
    { id:'dark',  label:'Bold Dark',   sub:'Deep & dramatic',
      bars:['#0f172a','#6c63ff','#a78bfa'],
      pal:{ bg1:'#0f172a', bg2:'#1e293b', text:'#ffffff', accent:'#6c63ff', alt:'#1e293b' } },
    { id:'light', label:'Clean Light', sub:'Minimal & fresh',
      bars:['#ffffff','#f8fafc','#6c63ff'],
      pal:{ bg1:'#ffffff', bg2:'#f8fafc', text:'#0f172a', accent:'#6c63ff', alt:'#f8fafc' } },
    { id:'warm',  label:'Warm Bold',   sub:'Energetic & vibrant',
      bars:['#0d0d1a','#f97316','#fbbf24'],
      pal:{ bg1:'#0d0d1a', bg2:'#1a0a00', text:'#ffffff', accent:'#f97316', alt:'#1c1005' } },
    { id:'ocean', label:'Ocean',       sub:'Cool & trustworthy',
      bars:['#020617','#0284c7','#38bdf8'],
      pal:{ bg1:'#020617', bg2:'#0c1a2e', text:'#ffffff', accent:'#0ea5e9', alt:'#0c1a2e' } },
    { id:'forest',label:'Forest',      sub:'Natural & calm',
      bars:['#052e16','#16a34a','#86efac'],
      pal:{ bg1:'#052e16', bg2:'#14532d', text:'#ffffff', accent:'#22c55e', alt:'#14532d' } },
    { id:'rose',  label:'Rose',        sub:'Modern & feminine',
      bars:['#fff1f2','#fda4af','#e11d48'],
      pal:{ bg1:'#ffffff', bg2:'#fff1f2', text:'#0f172a', accent:'#e11d48', alt:'#fff1f2' } },
  ]

  // Industry-specific content templates ({name} = business name)
  const CONTENT = {
    saas: {
      hero:        { headline:'{name} — Build Faster, Ship Smarter', subheadline:'The all-in-one platform that replaces your entire stack. Go from idea to production in hours.' },
      features:    { heading:'Everything Your Team Needs', subheading:'Packed with powerful features. Zero complexity.', feat1Icon:'⚡', feat1Title:'10× Faster', feat1Desc:'Deploy in seconds, not hours.', feat2Icon:'🔒', feat2Title:'Enterprise Secure', feat2Desc:'SOC 2 certified. GDPR ready.', feat3Icon:'📈', feat3Title:'Built to Scale', feat3Desc:'From 1 user to 1 million.' },
      about:       { heading:'Built by Engineers, for Engineers', body:'{name} was created to solve the problem we all face: too many tools, not enough time.\n\nWe built one platform that does it all — beautifully.', highlight:'50,000+ developers trust {name} daily.' },
      testimonial: { quote:'{name} cut our deployment time by 80%. We shipped 3× more features last quarter.', author:'Alex Chen', role:'CTO, ScaleUp Labs' },
      pricing:     { heading:'Simple, Transparent Pricing', subheading:'Start free. Scale as you grow.' },
      faq:         { heading:'Frequently Asked Questions', subheading:'Everything you need to know about {name}.' },
      footer:      { brand:'{name}', tagline:'Build faster. Scale smarter.' },
      contact:     { heading:'Talk to Our Team', subheading:"We'd love to show you what {name} can do for your business." },
    },
    agency: {
      hero:        { headline:'{name} — We Design. We Build. We Launch.', subheadline:'Award-winning digital experiences that convert visitors into customers.' },
      features:    { heading:'Why Clients Choose {name}', subheading:'We go beyond design — we deliver results.', feat1Icon:'🎨', feat1Title:'Premium Design', feat1Desc:'Pixel-perfect, on-brand, always.', feat2Icon:'⚡', feat2Title:'Fast Delivery', feat2Desc:'Live in weeks, not months.', feat3Icon:'📊', feat3Title:'Measurable ROI', feat3Desc:'Results you can actually see.' },
      about:       { heading:'A Decade of Digital Excellence', body:'{name} was founded with a single belief: great design changes businesses.\n\nOver 200 brands have trusted us to build their digital presence — from startups to global enterprises.', highlight:'200+ brands. $40M+ in client revenue generated.' },
      testimonial: { quote:'{name} delivered beyond every expectation. Our new site increased leads by 140% in 60 days.', author:'Maria Santos', role:'Marketing Director, Nexus Group' },
      footer:      { brand:'{name}', tagline:'Creating experiences that matter.' },
      contact:     { heading:"Let's Build Something Great", subheading:'Tell us about your project and we\'ll get back within 24 hours.' },
    },
    portfolio: {
      hero:        { headline:'Hi, I\'m {name}', subheadline:'I design and build digital products that people love. Let\'s create something remarkable together.' },
      about:       { heading:'A Little About Me', body:"I'm a designer and creator who believes in the power of great craft.\n\nOver the past 7 years, I've worked with startups, agencies, and Fortune 500 companies to build products that are both beautiful and functional.", highlight:'7 years experience · 120+ projects delivered' },
      testimonial: { quote:"Working with {name} was a game-changer. Delivered incredible work, on time and on budget.", author:'Jordan Park', role:'Founder, Bloom Ventures' },
      footer:      { brand:'{name}', tagline:'Designed with purpose. Built with care.' },
      contact:     { heading:"Let's Work Together", subheading:"I'm currently accepting new projects. Drop me a message." },
    },
    store: {
      hero:        { headline:'Shop {name}', subheadline:'Premium products, curated for people who care about quality. Free shipping on orders over $50.' },
      features:    { heading:'The {name} Difference', subheading:'We obsess over every detail so you don\'t have to.', feat1Icon:'✨', feat1Title:'Premium Quality', feat1Desc:'Every product is hand-selected.', feat2Icon:'🚚', feat2Title:'Fast Shipping', feat2Desc:'Delivered in 2-3 business days.', feat3Icon:'↩', feat3Title:'Easy Returns', feat3Desc:'30-day no-questions-asked returns.' },
      testimonial: { quote:'{name} has the best quality I\'ve found anywhere. I\'ve been a customer for 3 years and will never shop anywhere else.', author:'Lisa Thompson', role:'Loyal Customer' },
      footer:      { brand:'{name}', tagline:'Quality you can feel.' },
      contact:     { heading:'Get in Touch', subheading:'Questions about an order? Our team replies within 2 hours.' },
    },
    restaurant: {
      hero:        { headline:'Welcome to {name}', subheadline:'Where every meal is a memory. Fresh ingredients. Bold flavours. Unforgettable dining.' },
      about:       { heading:'Our Story', body:'{name} was born from a simple passion: food that brings people together.\n\nUsing only locally sourced ingredients and time-honoured recipes, we\'ve been serving our community for over 15 years.', highlight:'Est. 2009 · Family owned · Locally sourced' },
      testimonial: { quote:'The best dining experience in the city. {name} has ruined me for any other restaurant.', author:'James Olivier', role:'Food critic, City Guide' },
      footer:      { brand:'{name}', tagline:'Good food. Good people. Good times.' },
      contact:     { heading:'Book a Table', subheading:'We\'d love to have you. Reserve your spot today.' },
    },
    blog: {
      hero:        { headline:'{name}', subheadline:'Insights, ideas, and stories for curious minds. Published weekly.' },
      about:       { heading:'About This Blog', body:'{name} is a space for honest thinking on topics that matter.\n\nEvery piece is written with care, backed by research, and edited for clarity. No noise — just ideas worth reading.', highlight:'50,000+ readers · Published since 2019' },
      testimonial: { quote:'{name} is the one newsletter I always open. Consistently excellent writing.', author:'Sam Rivera', role:'Subscriber' },
      footer:      { brand:'{name}', tagline:'Ideas worth reading.' },
      contact:     { heading:'Get in Touch', subheading:'Story tips, partnerships, or just to say hello.' },
    },
    startup: {
      hero:        { headline:'{name} — The Future Starts Here', subheadline:'We\'re solving a problem that\'s been ignored for too long. Join the waitlist and be first.' },
      features:    { heading:'Why {name} Is Different', subheading:'We didn\'t just build another product. We rethought the whole thing.', feat1Icon:'🧠', feat1Title:'Smarter', feat1Desc:'AI-powered decisions.', feat2Icon:'⚡', feat2Title:'Faster', feat2Desc:'10× the speed of alternatives.', feat3Icon:'💰', feat3Title:'Cheaper', feat3Desc:'Half the price of competitors.' },
      testimonial: { quote:'{name} is the startup I wish existed 5 years ago. It would have saved us $2M.', author:'David Park', role:'Serial Entrepreneur' },
      footer:      { brand:'{name}', tagline:'The future, faster.' },
    },
    health: {
      hero:        { headline:'Your Health Journey Starts at {name}', subheadline:'Evidence-based care, compassionate support, and a community that lifts you up.' },
      about:       { heading:'Our Approach to Care', body:'At {name}, we believe that health is more than the absence of illness — it\'s the presence of vitality, energy, and joy.\n\nOur team of 30+ certified practitioners work together to create personalised plans that actually work.', highlight:'30+ certified practitioners · 5,000+ lives improved' },
      testimonial: { quote:'{name} completely changed my relationship with my health. I\'ve lost 25kg and have more energy than I did at 25.', author:'Rachel Kim', role:'Patient & Community Member' },
      footer:      { brand:'{name}', tagline:'Your health. Our mission.' },
      contact:     { heading:'Book a Free Consultation', subheading:'Take the first step. Our team will guide you from there.' },
    },
    education: {
      hero:        { headline:'Learn at {name}', subheadline:'World-class courses taught by industry experts. Study at your own pace, earn recognised credentials.' },
      features:    { heading:'Why Students Choose {name}', subheading:'Learning that fits your life — and advances your career.', feat1Icon:'🎓', feat1Title:'Expert Instructors', feat1Desc:'Industry veterans, not just academics.', feat2Icon:'⏱', feat2Title:'Learn at Your Pace', feat2Desc:'Lifetime access. No deadlines.', feat3Icon:'📜', feat3Title:'Certified', feat3Desc:'Credentials employers recognise.' },
      testimonial: { quote:'{name} gave me the skills to land my dream job in 6 months. Best investment I\'ve ever made.', author:'Priya Sharma', role:'Graduate, Software Engineering Track' },
      footer:      { brand:'{name}', tagline:'Knowledge that moves you forward.' },
      contact:     { heading:'Talk to an Advisor', subheading:'Not sure which course is right for you? We\'ll help you decide.' },
    },
  }

  function open() {
    _step = 1; _name = ''; _industry = ''; _style = ''
    _renderIndustryGrid()
    _renderStyleGrid()
    _showStep(1)
    document.getElementById('qg-modal').classList.remove('hidden')
    setTimeout(() => document.getElementById('qg-name')?.focus(), 100)
  }

  function close() {
    document.getElementById('qg-modal').classList.add('hidden')
  }

  function _renderIndustryGrid() {
    document.getElementById('qg-industry-grid').innerHTML = INDUSTRIES.map(ind => `
      <div class="qg-industry-card ${_industry===ind.id?'selected':''}" onclick="QuickGen.selectIndustry('${ind.id}')">
        <div class="qg-industry-icon">${ind.icon}</div>
        <div class="qg-industry-label">${ind.label}</div>
        <div class="qg-industry-desc">${ind.desc}</div>
      </div>`).join('')
  }

  function _renderStyleGrid() {
    document.getElementById('qg-style-grid').innerHTML = STYLES.map(st => `
      <div class="qg-style-card ${_style===st.id?'selected':''}" onclick="QuickGen.selectStyle('${st.id}')">
        <div class="qg-style-preview" style="background:${st.bars[0]}">
          ${st.bars.map((b,i)=>`<div class="qg-style-bar" style="background:${b};height:${18+i*12}px"></div>`).join('')}
        </div>
        <div class="qg-style-label">${st.label}</div>
        <div class="qg-style-sub">${st.sub}</div>
      </div>`).join('')
  }

  function _showStep(n) {
    _step = n
    ;[1,2,3].forEach(i => {
      document.getElementById('qg-s'+i).style.display = i===n ? '' : 'none'
      const dot = document.getElementById('qg-dot-'+i)
      dot.classList.toggle('active', i===n)
      dot.classList.toggle('done',   i<n)
    })
    ;[1,2].forEach(i => {
      document.getElementById('qg-line-'+i)?.classList.toggle('done', n>i)
    })
    const backBtn = document.getElementById('qg-back-btn')
    const nextBtn = document.getElementById('qg-next-btn')
    const genBtn  = document.getElementById('qg-gen-btn')
    backBtn.style.display = n > 1 ? '' : 'none'
    nextBtn.style.display = n < 3 ? '' : 'none'
    genBtn.style.display  = n === 3 ? '' : 'none'
    if (n===2) nextBtn.onclick = () => QuickGen.toStep(3)
    if (n===1) nextBtn.onclick = () => QuickGen.toStep(2)
    document.getElementById('qg-generating').style.display = 'none'
    document.getElementById('qg-foot').style.display = ''
  }

  function selectIndustry(id) {
    _industry = id
    _renderIndustryGrid()
  }

  function selectStyle(id) {
    _style = id
    _renderStyleGrid()
  }

  function toStep(n) {
    if (n === 2) {
      _name = (document.getElementById('qg-name')?.value || '').trim()
      if (!_name) { document.getElementById('qg-name').focus(); toast('Enter your business name first','⚠️'); return }
    }
    if (n === 3 && !_industry) { toast('Pick an industry first','⚠️'); return }
    _showStep(n)
  }

  function back() {
    if (_step > 1) _showStep(_step - 1)
  }

  async function generate() {
    if (!_style) { toast('Pick a style first','⚠️'); return }

    // Show generating state
    ;[1,2,3].forEach(i => document.getElementById('qg-s'+i).style.display = 'none')
    document.getElementById('qg-foot').style.display = 'none'
    document.getElementById('qg-generating').style.display = ''

    const pal      = STYLES.find(s=>s.id===_style)?.pal || STYLES[0].pal
    const industry = INDUSTRIES.find(i=>i.id===_industry) || INDUSTRIES[0]
    const content  = CONTENT[_industry] || CONTENT.saas
    const name     = _name

    // Clear canvas
    if (S.sections.length) { pushH('QuickGen: '+name); S.sections = []; S.selected = null }

    const fill = (str) => str ? str.replace(/\{name\}/g, name) : str

    // Build sections progressively with status updates
    const statusEl = document.getElementById('qg-gen-status')
    let i = 0
    for (const type of industry.sections) {
      i++
      if (statusEl) statusEl.textContent = `Building ${type.replace(/-/g,' ')} (${i}/${industry.sections.length})…`
      await new Promise(r => setTimeout(r, 120))   // small delay for visual effect

      const def  = DEFS[type]; if (!def) continue
      const sec  = { id: uid(), type, props: { ...def.props } }

      // Apply industry content
      const ct = content[type]
      if (ct) Object.entries(ct).forEach(([k,v]) => { if (sec.props[k] !== undefined || ct[k]) sec.props[k] = fill(v) })

      // Apply palette — alternate bg for visual rhythm
      const useDark = ['#0f172a','#0d0d1a','#020617','#052e16','#0c1a2e','#1a0a00'].includes(pal.bg1)
      const isAlt   = i % 2 === 0
      if (sec.props.bgColor    !== undefined) sec.props.bgColor    = isAlt ? (pal.alt || pal.bg2) : pal.bg1
      if (sec.props.textColor  !== undefined) sec.props.textColor  = useDark ? (isAlt ? '#e2e8f0' : '#ffffff') : '#0f172a'
      if (sec.props.accentColor!== undefined) sec.props.accentColor= pal.accent
      // Footer/testimonial always dark
      if (type === 'footer')      { sec.props.bgColor = pal.bg1; sec.props.textColor = useDark ? '#64748b' : '#94a3b8' }
      if (type === 'testimonial') { sec.props.bgColor = pal.bg1; sec.props.textColor = '#ffffff' }

      S.sections.push(sec)
    }

    // Set page title
    const titleEl = document.getElementById('page-title')
    if (titleEl) titleEl.value = name

    renderAll()
    close()
    toast(`✦ "${name}" site generated — ${industry.sections.length} sections ready!`, '⚡')
    if (typeof UXGuide !== 'undefined') UXGuide.update()
  }

  return { open, close, toStep, back, selectIndustry, selectStyle, generate }
})()
window.PageCraft.QuickGen = QuickGen

// ── SpeedDial — Floating quick-add with smart suggestions ────────────────────
const SpeedDial = (() => {
  let _open = false

  // Determine best next sections to suggest
  const SUGGEST_CHAINS = {
    hero:        ['features','about','testimonial'],
    features:    ['about','testimonial','pricing'],
    about:       ['testimonial','gallery','contact'],
    testimonial: ['pricing','faq','gallery'],
    pricing:     ['faq','testimonial','footer'],
    faq:         ['contact','footer'],
    gallery:     ['testimonial','contact','footer'],
    contact:     ['footer'],
    footer:      ['hero'],
  }

  function _getSuggestions() {
    const secs   = S.sections
    if (!secs.length) return ['hero','features','about']
    const last   = secs[secs.length - 1]?.type
    const used   = new Set(secs.map(s=>s.type))
    const chain  = SUGGEST_CHAINS[last] || ['features','testimonial','footer']
    // Filter out already-used sections (except hero/testimonial/gallery which repeat ok)
    const repeatable = new Set(['testimonial','gallery','hero'])
    return chain.filter(t => !used.has(t) || repeatable.has(t)).slice(0,3)
  }

  function update() {
    const dial = document.getElementById('speed-dial')
    if (!dial) return
    // Show only in edit mode with sections
    const show = S.mode === 'edit'
    dial.style.display = show ? '' : 'none'
    if (!_open) return
    _renderMenu()
  }

  function toggle() {
    _open = !_open
    document.getElementById('speed-dial-fab')?.classList.toggle('open', _open)
    const menu = document.getElementById('speed-dial-menu')
    if (!menu) return
    if (_open) { menu.style.display = ''; _renderMenu() }
    else        menu.style.display = 'none'
  }

  function _renderMenu() {
    const menu = document.getElementById('speed-dial-menu')
    if (!menu) return
    const suggestions = _getSuggestions()
    menu.innerHTML = suggestions.map((type, i) => {
      const def = DEFS[type]; if (!def) return ''
      return `<div class="speed-dial-item" style="animation-delay:${i*50}ms" onclick="SpeedDial.add('${type}')">
        <div class="speed-dial-label">${def.label}</div>
        <div class="speed-dial-icon">${def.icon}</div>
      </div>`
    }).join('')
  }

  function add(type) {
    addSection(type)
    toggle() // close dial after adding
  }

  // Close on outside click
  document.addEventListener('click', ev => {
    if (_open && !ev.target.closest('#speed-dial')) {
      _open = false
      document.getElementById('speed-dial-fab')?.classList.remove('open')
      const menu = document.getElementById('speed-dial-menu')
      if (menu) menu.style.display = 'none'
    }
  })

  return { update, toggle, add }
})()
window.PageCraft.SpeedDial = SpeedDial