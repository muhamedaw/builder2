
/* ══════════════════════════════════════════════════════
   SEO MANAGER — Per-page SEO
   • Meta: title, description, canonical, robots
   • Open Graph: og:title, og:description, og:image, og:type
   • Twitter Card tags
   • Structured Data: JSON-LD Organization / WebPage
   • SEO Score checker
   • XML Sitemap export
══════════════════════════════════════════════════════ */
const SEO_KEY = 'pc_seo_v1'

const SEOManager = (() => {
  let _activePage = null   // pageId currently being edited
  let _tab        = 'meta'

  // ── Storage ───────────────────────────────────────────────────────────────
  function _load() {
    try { return JSON.parse(localStorage.getItem(SEO_KEY) || '{}') } catch { return {} }
  }
  function _save(data) {
    try { localStorage.setItem(SEO_KEY, JSON.stringify(data)) } catch {}
  }
  function getPage(pageId) {
    return _load()[pageId] || {}
  }
  function setPageProp(pageId, key, val) {
    const all = _load()
    if (!all[pageId]) all[pageId] = {}
    all[pageId][key] = val
    _save(all)
    _updateScore()
    _updatePreview()
  }
  function getAll() { return _load() }

  // ── Open / Close ──────────────────────────────────────────────────────────
  function open() {
    const { pages, activePageId } = projectStore.getState()
    _activePage = activePageId || pages[0]?.id
    document.getElementById('seo-modal').classList.remove('hidden')
    _renderPills()
    renderBody()
  }
  function close() {
    document.getElementById('seo-modal').classList.add('hidden')
  }

  // ── Page pills ─────────────────────────────────────────────────────────────
  function _renderPills() {
    const { pages } = projectStore.getState()
    const el = document.getElementById('seo-page-pills')
    if (!el) return
    el.innerHTML = pages.map(p =>
      `<button class="seo-page-pill${p.id === _activePage ? ' active' : ''}" onclick="SEOManager.selectPage('${p.id}')">${e(p.name)}</button>`
    ).join('')
  }
  function selectPage(pageId) {
    _activePage = pageId
    _renderPills()
    renderBody()
  }

  // ── Tab switch ─────────────────────────────────────────────────────────────
  function switchTab(tab) {
    _tab = tab
    renderBody()
  }

  // ── Render body ────────────────────────────────────────────────────────────
  function renderBody() {
    const el = document.getElementById('seo-body')
    if (!el || !_activePage) return
    const d = getPage(_activePage)
    const { pages } = projectStore.getState()
    const pageName = pages.find(p => p.id === _activePage)?.name || 'Page'

    if (_tab === 'meta')    el.innerHTML = _renderMeta(d, pageName)
    else if (_tab === 'og') el.innerHTML = _renderOG(d, pageName)
    else if (_tab === 'twitter') el.innerHTML = _renderTwitter(d)
    else if (_tab === 'schema')  el.innerHTML = _renderSchema(d, pageName)
    else if (_tab === 'score')   el.innerHTML = _renderScore(d)

    // Wire inputs
    el.querySelectorAll('[data-seo-key]').forEach(inp => {
      inp.addEventListener('input',  () => setPageProp(_activePage, inp.dataset.seoKey, inp.value))
      inp.addEventListener('change', () => setPageProp(_activePage, inp.dataset.seoKey, inp.value))
    })
  }

  // ── Meta tab ──────────────────────────────────────────────────────────────
  function _renderMeta(d, pageName) {
    const title = d.title || pageName
    const desc  = d.description || ''
    return `
    <div class="seo-row">
      <div class="seo-label">
        Page Title <span class="seo-char ${_scoreTitle(title)}" id="seo-title-count">${title.length}/60</span>
      </div>
      <input class="seo-input" data-seo-key="title" value="${e(title)}" placeholder="My Page Title" maxlength="80"
        oninput="document.getElementById('seo-title-count').textContent=this.value.length+'/60';document.getElementById('seo-title-count').className='seo-char '+SEOManager._scoreTitle(this.value);SEOManager._updatePreview()"/>
      <span style="font-size:10px;color:var(--muted)">Ideal: 50–60 characters</span>
    </div>
    <div class="seo-row">
      <div class="seo-label">
        Meta Description <span class="seo-char ${_scoreDesc(desc)}" id="seo-desc-count">${desc.length}/160</span>
      </div>
      <textarea class="seo-textarea" data-seo-key="description" maxlength="300" placeholder="A compelling description of this page…"
        oninput="document.getElementById('seo-desc-count').textContent=this.value.length+'/160';document.getElementById('seo-desc-count').className='seo-char '+SEOManager._scoreDesc(this.value);SEOManager._updatePreview()">${e(desc)}</textarea>
      <span style="font-size:10px;color:var(--muted)">Ideal: 120–160 characters</span>
    </div>
    <div class="seo-row">
      <div class="seo-label">Canonical URL</div>
      <input class="seo-input" data-seo-key="canonical" value="${e(d.canonical||'')}" placeholder="https://example.com/page"/>
    </div>
    <div class="seo-row">
      <div class="seo-label">Robots</div>
      <select class="seo-input" data-seo-key="robots" style="cursor:pointer">
        <option value="index,follow" ${(d.robots||'index,follow')==='index,follow'?'selected':''}>index, follow (default)</option>
        <option value="noindex,follow" ${d.robots==='noindex,follow'?'selected':''}>noindex, follow</option>
        <option value="index,nofollow" ${d.robots==='index,nofollow'?'selected':''}>index, nofollow</option>
        <option value="noindex,nofollow" ${d.robots==='noindex,nofollow'?'selected':''}>noindex, nofollow</option>
      </select>
    </div>
    <div class="seo-row">
      <div class="seo-label">Author</div>
      <input class="seo-input" data-seo-key="author" value="${e(d.author||'')}" placeholder="Author name"/>
    </div>
    <div class="seo-row">
      <div class="seo-label" style="margin-bottom:8px">Google Preview</div>
      <div class="seo-preview" id="seo-preview">
        <div class="seo-preview-title">${e(title||'Page Title')}</div>
        <div class="seo-preview-url">${e(d.canonical||'https://yoursite.com/'+pageName.toLowerCase().replace(/\s+/g,'-'))}</div>
        <div class="seo-preview-desc">${e(desc||'Page description will appear here…')}</div>
      </div>
    </div>`
  }

  // ── OG tab ────────────────────────────────────────────────────────────────
  function _renderOG(d, pageName) {
    return `
    <p style="font-size:12px;color:var(--muted);margin-bottom:4px">Open Graph tags control how your page looks when shared on Facebook, LinkedIn, etc.</p>
    <div class="seo-row">
      <div class="seo-label">og:title</div>
      <input class="seo-input" data-seo-key="ogTitle" value="${e(d.ogTitle||d.title||pageName)}" placeholder="Page title for social sharing"/>
    </div>
    <div class="seo-row">
      <div class="seo-label">og:description</div>
      <textarea class="seo-textarea" data-seo-key="ogDesc" placeholder="Description for social sharing…">${e(d.ogDesc||d.description||'')}</textarea>
    </div>
    <div class="seo-row">
      <div class="seo-label">og:image URL</div>
      <input class="seo-input" data-seo-key="ogImage" value="${e(d.ogImage||'')}" placeholder="https://example.com/og-image.jpg"/>
      <span style="font-size:10px;color:var(--muted)">Recommended: 1200×630px</span>
    </div>
    <div class="seo-row">
      <div class="seo-label">og:type</div>
      <select class="seo-input" data-seo-key="ogType" style="cursor:pointer">
        <option value="website" ${(d.ogType||'website')==='website'?'selected':''}>website</option>
        <option value="article" ${d.ogType==='article'?'selected':''}>article</option>
        <option value="product" ${d.ogType==='product'?'selected':''}>product</option>
      </select>
    </div>
    <div class="seo-row">
      <div class="seo-label">og:url</div>
      <input class="seo-input" data-seo-key="ogUrl" value="${e(d.ogUrl||d.canonical||'')}" placeholder="https://example.com/page"/>
    </div>
    <div class="seo-row">
      <div class="seo-label">og:site_name</div>
      <input class="seo-input" data-seo-key="ogSiteName" value="${e(d.ogSiteName||'')}" placeholder="Your Site Name"/>
    </div>`
  }

  // ── Twitter tab ───────────────────────────────────────────────────────────
  function _renderTwitter(d) {
    return `
    <p style="font-size:12px;color:var(--muted);margin-bottom:4px">Twitter Card tags control how your page looks when shared on X (Twitter).</p>
    <div class="seo-row">
      <div class="seo-label">Card Type</div>
      <select class="seo-input" data-seo-key="twCard" style="cursor:pointer">
        <option value="summary_large_image" ${(d.twCard||'summary_large_image')==='summary_large_image'?'selected':''}>summary_large_image (recommended)</option>
        <option value="summary" ${d.twCard==='summary'?'selected':''}>summary</option>
      </select>
    </div>
    <div class="seo-row">
      <div class="seo-label">twitter:title</div>
      <input class="seo-input" data-seo-key="twTitle" value="${e(d.twTitle||d.ogTitle||d.title||'')}" placeholder="Page title for Twitter"/>
    </div>
    <div class="seo-row">
      <div class="seo-label">twitter:description</div>
      <textarea class="seo-textarea" data-seo-key="twDesc" placeholder="Description for Twitter…">${e(d.twDesc||d.ogDesc||d.description||'')}</textarea>
    </div>
    <div class="seo-row">
      <div class="seo-label">twitter:image URL</div>
      <input class="seo-input" data-seo-key="twImage" value="${e(d.twImage||d.ogImage||'')}" placeholder="https://example.com/twitter-image.jpg"/>
    </div>
    <div class="seo-row">
      <div class="seo-label">twitter:site (your @handle)</div>
      <input class="seo-input" data-seo-key="twSite" value="${e(d.twSite||'')}" placeholder="@youraccount"/>
    </div>`
  }

  // ── Schema tab ────────────────────────────────────────────────────────────
  function _renderSchema(d, pageName) {
    const orgName    = d.schemaOrgName    || ''
    const orgUrl     = d.schemaOrgUrl     || d.canonical || ''
    const orgLogo    = d.schemaOrgLogo    || ''
    const orgDesc    = d.schemaOrgDesc    || d.description || ''
    const wpName     = d.schemaWpName     || d.title || pageName
    const wpUrl      = d.schemaWpUrl      || d.canonical || ''
    const wpDesc     = d.schemaWpDesc     || d.description || ''
    return `
    <p style="font-size:12px;color:var(--muted);margin-bottom:4px">JSON-LD structured data helps Google understand your page content.</p>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:4px">
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">🏢 Organization</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="seo-row"><div class="seo-label">Name</div><input class="seo-input" data-seo-key="schemaOrgName" value="${e(orgName)}" placeholder="Your Company"/></div>
        <div class="seo-row"><div class="seo-label">URL</div><input class="seo-input" data-seo-key="schemaOrgUrl" value="${e(orgUrl)}" placeholder="https://example.com"/></div>
        <div class="seo-row"><div class="seo-label">Logo URL</div><input class="seo-input" data-seo-key="schemaOrgLogo" value="${e(orgLogo)}" placeholder="https://example.com/logo.png"/></div>
        <div class="seo-row"><div class="seo-label">Description</div><input class="seo-input" data-seo-key="schemaOrgDesc" value="${e(orgDesc)}" placeholder="What your org does"/></div>
      </div>
    </div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px">
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">📄 WebPage</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="seo-row"><div class="seo-label">Name</div><input class="seo-input" data-seo-key="schemaWpName" value="${e(wpName)}" placeholder="Page Title"/></div>
        <div class="seo-row"><div class="seo-label">URL</div><input class="seo-input" data-seo-key="schemaWpUrl" value="${e(wpUrl)}" placeholder="https://example.com/page"/></div>
        <div class="seo-row" style="grid-column:1/-1"><div class="seo-label">Description</div><input class="seo-input" data-seo-key="schemaWpDesc" value="${e(wpDesc)}" placeholder="Page description"/></div>
      </div>
    </div>
    <div style="margin-top:4px">
      <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">Preview JSON-LD output:</div>
      <pre style="background:var(--surface3);border-radius:8px;padding:12px;font-size:10px;color:var(--text2);overflow-x:auto;line-height:1.5">${e(_genSchemaPreview({schemaOrgName:orgName,schemaOrgUrl:orgUrl,schemaOrgLogo:orgLogo,schemaOrgDesc:orgDesc,schemaWpName:wpName,schemaWpUrl:wpUrl,schemaWpDesc:wpDesc}))}</pre>
    </div>`
  }

  function _genSchemaPreview(d) {
    const out = []
    if (d.schemaOrgName) out.push(JSON.stringify({ '@context':'https://schema.org','@type':'Organization',name:d.schemaOrgName,url:d.schemaOrgUrl||undefined,logo:d.schemaOrgLogo||undefined,description:d.schemaOrgDesc||undefined }, null, 2))
    if (d.schemaWpName)  out.push(JSON.stringify({ '@context':'https://schema.org','@type':'WebPage',name:d.schemaWpName,url:d.schemaWpUrl||undefined,description:d.schemaWpDesc||undefined }, null, 2))
    return out.join('\n\n') || '// Fill in fields above'
  }

  // ── Score tab ─────────────────────────────────────────────────────────────
  function _renderScore(d) {
    const { pages, sections } = projectStore.getState()
    const pg = pages.find(p => p.id === _activePage)
    const secs = pg ? pg.sections : sections
    const checks = _runChecks(d, secs)
    const score  = Math.round(checks.filter(c => c.pass).length / checks.length * 100)
    const color  = score >= 80 ? '#34d399' : score >= 50 ? '#f59e0b' : '#f87171'
    const emoji  = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴'
    return `
    <div class="seo-score-wrap">
      <div class="seo-score-circle" style="background:${color}22;border:3px solid ${color};color:${color}">${score}</div>
      <div>
        <div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:2px">${emoji} SEO Score: ${score}/100</div>
        <div style="font-size:11px;color:var(--muted)">${score>=80?'Great! Your page is well optimized.':score>=50?'Could be better — fix the issues below.':'Needs work — missing key SEO elements.'}</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${checks.map(c => `
        <div class="seo-check">
          <div class="seo-check-icon" style="background:${c.pass?'rgba(52,211,153,.2)':'rgba(248,113,113,.2)'};color:${c.pass?'#34d399':'#f87171'}">${c.pass?'✓':'✕'}</div>
          <span style="color:var(--text);font-weight:600">${c.label}</span>
          <span style="color:var(--muted);margin-left:4px">— ${c.detail}</span>
        </div>`).join('')}
    </div>`
  }

  function _runChecks(d, sections) {
    const title = d.title || ''
    const desc  = d.description || ''
    const h1s   = sections.filter(s => ['hero','scene-particles','scene-waves','scene-globe'].includes(s.type))
    const imgs  = sections.filter(s => s.props?.bgImage || s.props?.image || s.props?.img1)
    return [
      { label:'Page Title',       pass: title.length >= 10 && title.length <= 60,  detail: title.length ? `${title.length} chars (ideal 10–60)` : 'Missing title' },
      { label:'Meta Description', pass: desc.length >= 50 && desc.length <= 160,   detail: desc.length  ? `${desc.length} chars (ideal 50–160)` : 'Missing description' },
      { label:'Has Heading (H1)', pass: h1s.length > 0,                            detail: h1s.length   ? `Found ${h1s.length} hero/heading section` : 'No hero/heading section found' },
      { label:'OG Image',         pass: !!(d.ogImage||d.twImage),                  detail: (d.ogImage||d.twImage) ? 'Set ✓' : 'Missing — add in OG or Twitter tabs' },
      { label:'Canonical URL',    pass: !!d.canonical,                             detail: d.canonical  ? d.canonical : 'Not set' },
      { label:'Robots Tag',       pass: !d.robots || d.robots.startsWith('index'), detail: d.robots||'index,follow (default)' },
      { label:'Structured Data',  pass: !!(d.schemaOrgName || d.schemaWpName),     detail: (d.schemaOrgName||d.schemaWpName) ? 'JSON-LD configured ✓' : 'Not configured' },
      { label:'Twitter Card',     pass: !!(d.twTitle || d.twCard),                 detail: d.twCard ? `${d.twCard}` : 'Not configured' },
    ]
  }

  // ── Live preview update ────────────────────────────────────────────────────
  function _updatePreview() {
    const prev = document.getElementById('seo-preview')
    if (!prev || _tab !== 'meta') return
    const d    = getPage(_activePage)
    const { pages } = projectStore.getState()
    const pageName = pages.find(p => p.id === _activePage)?.name || 'Page'
    const title = d.title || pageName
    const desc  = d.description || ''
    const url   = d.canonical || 'https://yoursite.com/' + pageName.toLowerCase().replace(/\s+/g, '-')
    prev.innerHTML = `
      <div class="seo-preview-title">${e(title||'Page Title')}</div>
      <div class="seo-preview-url">${e(url)}</div>
      <div class="seo-preview-desc">${e(desc||'Page description will appear here…')}</div>`
  }

  function _updateScore() {
    if (_tab === 'score') renderBody()
  }

  // ── Score helpers ─────────────────────────────────────────────────────────
  function _scoreTitle(v) { const l=v.length; return l===0?'bad':l>=10&&l<=60?'ok':l<10?'warn':'warn' }
  function _scoreDesc(v)  { const l=v.length; return l===0?'bad':l>=50&&l<=160?'ok':'warn' }

  // ── XML Sitemap export ────────────────────────────────────────────────────
  function exportSitemap() {
    const { pages } = projectStore.getState()
    const all = _load()
    const baseUrl = (() => {
      const first = Object.values(all).find(d => d.canonical)
      if (first) return first.canonical.replace(/\/[^/]*$/, '')
      return 'https://yoursite.com'
    })()
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p, i) => {
  const d   = all[p.id] || {}
  const loc = d.canonical || `${baseUrl}/${i === 0 ? '' : p.name.toLowerCase().replace(/\s+/g, '-')}`
  return `  <url>
    <loc>${e(loc)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${i === 0 ? '1.0' : '0.8'}</priority>
  </url>`
}).join('\n')}
</urlset>`
    const blob = new Blob([xml], { type: 'application/xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'sitemap.xml'
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Sitemap exported', '🗺')
  }

  // ── genHTML integration ────────────────────────────────────────────────────
  function getMetaTags(pageId) {
    return _load()[pageId] || {}
  }

  return {
    open, close, selectPage, switchTab, exportSitemap,
    getPage, getMetaTags, getAll,
    _scoreTitle, _scoreDesc, _updatePreview, renderBody,
  }
})()

function openSEO()  { SEOManager.open() }
function closeSEO() { SEOManager.close() }
function switchSEOTab(tab, btn) {
  document.querySelectorAll('.seo-tab').forEach(t => t.classList.remove('active'))
  if (btn) btn.classList.add('active')
  SEOManager.switchTab(tab)
}

/* ══════════════════════════════════════════════════════
   AI CONTENT GENERATOR
   • Groq API — Llama 3.1 8B Instant (free tier, 14400 req/day)
   • Tone selector + content type chips
   • Per-field quick-generate from Edit panel
   • Generation history (last 20 prompts)
   • One-click apply to section prop
══════════════════════════════════════════════════════ */
const AIGen = (() => {
  const KEY_STORE  = 'pc_ai_key_v1'
  const HIST_STORE = 'pc_ai_history_v1'
  const MODEL      = 'llama-3.1-8b-instant'
  const MAX_HIST   = 20

  let _tone     = 'professional'
  let _type     = 'headline'
  let _targetSec = null   // { secId, propKey } when opened from a field
  let _loading   = false

  // ── Storage helpers ───────────────────────────────────────────────────────
  function loadKey()  { return localStorage.getItem(KEY_STORE)  || '' }
  function saveKey(k) { localStorage.setItem(KEY_STORE, k.trim()); renderKeyInput() }
  function loadHist() { try { return JSON.parse(localStorage.getItem(HIST_STORE)||'[]') } catch { return [] } }
  function saveHist(h){ try { localStorage.setItem(HIST_STORE, JSON.stringify(h.slice(0,MAX_HIST))) } catch {} }
  function clearHistory() {
    localStorage.removeItem(HIST_STORE)
    renderHistory()
    toast('History cleared','🗑')
  }

  // ── Tone & type setters ───────────────────────────────────────────────────
  function setTone(t, btn) {
    _tone = t
    document.querySelectorAll('.ai-tone-chip').forEach(c => c.classList.remove('active'))
    if (btn) btn.classList.add('active')
  }
  function setType(t, btn) {
    _type = t
    document.querySelectorAll('.ai-type-chip').forEach(c => c.classList.remove('active'))
    if (btn) btn.classList.add('active')
  }

  // ── Build prompt ──────────────────────────────────────────────────────────
  function _buildPrompt(userCtx) {
    const tones = {
      professional: 'professional and authoritative',
      casual:       'casual and conversational',
      friendly:     'warm and friendly',
      bold:         'bold and powerful',
      funny:        'witty and humorous',
      luxury:       'luxurious and sophisticated',
    }
    const types = {
      headline:     'a short punchy headline (max 10 words)',
      subheadline:  'a sub-headline or tagline (max 20 words)',
      description:  'a compelling description paragraph (2-3 sentences)',
      cta:          'a call-to-action button label (2-5 words)',
      tagline:      'a memorable brand tagline (max 8 words)',
      feature:      'a feature title (3-6 words) and a one-sentence description',
      testimonial:  'a realistic customer testimonial quote (2-3 sentences)',
      section:      'complete content for a website section: headline, sub-headline, and short description',
    }
    const ctx = userCtx ? `Context: ${userCtx}. ` : ''
    const count = parseInt(document.getElementById('ai-count')?.value) || 3
    return `${ctx}Generate ${count} distinct variations of ${types[_type]||'copy'} in a ${tones[_tone]||'professional'} tone for a website. Return ONLY the variations, one per line, numbered 1. 2. 3. etc. No explanations, no markdown, no extra text.`
  }

  // ── API call ──────────────────────────────────────────────────────────────
  async function generate() {
    if (_loading) return
    const key = loadKey()
    if (!key) {
      toast('Enter your Claude API key first','🔑')
      document.getElementById('ai-key-input')?.focus()
      return
    }
    const prompt = document.getElementById('ai-prompt-input')?.value.trim() || ''
    _loading = true
    _showLoading()

    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: _buildPrompt(prompt) }],
          max_tokens: 500,
          temperature: 0.9,
        }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err?.error?.message || `HTTP ${resp.status}`)
      }
      const data = await resp.json()
      const raw  = data?.choices?.[0]?.message?.content || ''
      const results = raw.split('\n')
        .filter(l => l.trim())
        .map(l => l.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean)

      _renderResults(results)

      // Save to history
      if (prompt) {
        const h = loadHist()
        h.unshift(prompt)
        saveHist([...new Set(h)])
        renderHistory()
      }
    } catch (err) {
      document.getElementById('ai-results').innerHTML = `
        <div style="padding:24px;text-align:center;color:var(--danger)">
          <div style="font-size:28px;margin-bottom:8px">⚠️</div>
          <div style="font-size:13px;font-weight:600">Generation failed</div>
          <div style="font-size:11px;opacity:.7;margin-top:4px">${e(err.message)}</div>
        </div>`
    } finally {
      _loading = false
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  function _showLoading() {
    document.getElementById('ai-results').innerHTML = `
      <div class="ai-loading">
        <div class="ai-spinner"></div>
        <span>Generating with Groq…</span>
      </div>`
  }

  function _renderResults(items) {
    const el = document.getElementById('ai-results')
    if (!items.length) {
      el.innerHTML = '<div class="ai-empty"><div class="ai-empty-icon">🤔</div><p>No results — try a different prompt</p></div>'
      return
    }
    el.innerHTML = items.map((txt, i) => {
      const applyBtn = _targetSec
        ? `<button class="ai-apply-btn" onclick="AIGen._applyToField('${_targetSec.secId}','${_targetSec.propKey}',${i})">✓ Apply to field</button>`
        : ''
      return `<div class="ai-result-card" id="ai-res-${i}">
        <div class="ai-result-text">${e(txt)}</div>
        <div class="ai-result-actions">
          ${applyBtn}
          <button class="ai-copy-btn" onclick="AIGen._copy(${i})">⎘ Copy</button>
          <button class="ai-copy-btn" onclick="AIGen._insertSection(${i})" style="border-color:rgba(16,185,129,.3);color:#34d399">+ Add Section</button>
        </div>
      </div>`
    }).join('')
    // Store results for later apply
    window._aiLastResults = items
  }

  function renderHistory() {
    const h = loadHist()
    const wrap = document.getElementById('ai-history')
    const chips = document.getElementById('ai-history-chips')
    if (!wrap || !chips) return
    wrap.style.display = h.length ? 'flex' : 'none'
    chips.innerHTML = h.slice(0,10).map(p =>
      `<button class="ai-hist-chip" title="${e(p)}" onclick="document.getElementById('ai-prompt-input').value='${e(p.replace(/'/g,"\\'")).slice(0,60)}'">
        ${e(p.slice(0,30))}${p.length>30?'…':''}
      </button>`
    ).join('')
  }

  function renderKeyInput() {
    const el = document.getElementById('ai-key-input')
    if (el && !el.value) el.value = loadKey()
  }

  // ── Apply to field ────────────────────────────────────────────────────────
  function _applyToField(secId, propKey, idx) {
    const txt = (window._aiLastResults || [])[idx]
    if (!txt) return
    setProp(secId, propKey, txt, true)
    // Update the input in the panel too
    const inp = document.querySelector(`[data-pk="${propKey}"]`)
    if (inp) { inp.value = txt; inp.dispatchEvent(new Event('change')) }
    toast('Applied to section','✓')
    closeAI()
  }

  // ── Copy to clipboard ─────────────────────────────────────────────────────
  function _copy(idx) {
    const txt = (window._aiLastResults || [])[idx]
    if (!txt) return
    navigator.clipboard?.writeText(txt).then(() => toast('Copied!','⎘')).catch(() => toast('Copy failed','⚠️'))
  }

  // ── Insert as text section ────────────────────────────────────────────────
  function _insertSection(idx) {
    const txt = (window._aiLastResults || [])[idx]
    if (!txt) return
    // Find selected section and update its headline or heading prop
    const sel = S.sections.find(s => s.id === S.selected)
    if (sel && sel.props) {
      const key = sel.props.headline !== undefined ? 'headline' : sel.props.heading !== undefined ? 'heading' : null
      if (key) { setProp(sel.id, key, txt, true); toast('Applied to selected section','✓'); return }
    }
    toast('Select a section first to apply content','ℹ️')
  }

  // ── Open from field button ────────────────────────────────────────────────
  function openForField(secId, propKey, label) {
    _targetSec = { secId, propKey }
    // Pre-set type based on label
    const lbl = label.toLowerCase()
    let type = 'headline'
    if (lbl.includes('sub') || lbl.includes('tagline')) type = 'subheadline'
    else if (lbl.includes('body') || lbl.includes('desc') || lbl.includes('content')) type = 'description'
    else if (lbl.includes('cta') || lbl.includes('button')) type = 'cta'
    else if (lbl.includes('quote') || lbl.includes('testimonial')) type = 'testimonial'
    document.querySelectorAll('.ai-type-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.aitype === type)
    })
    _type = type
    openAI()
  }

  // ── Open / Close ──────────────────────────────────────────────────────────
  function open() {
    document.getElementById('ai-modal').classList.remove('hidden')
    renderKeyInput()
    renderHistory()
    // If not opened from field, clear target
    if (!_targetSec) _targetSec = null
  }
  function close() {
    document.getElementById('ai-modal').classList.add('hidden')
    _targetSec = null
  }

  return { generate, setTone, setType, saveKey, loadKey, clearHistory, openForField, open, close, _applyToField, _copy, _insertSection, renderHistory }
})()

function openAI()  { AIGen.open() }
function closeAI() { AIGen.close() }

/* ══════════════════════════════════════════════════════
   E-COMMERCE — Products · Cart · Checkout · Orders
══════════════════════════════════════════════════════ */

// ── Storage keys ──────────────────────────────────────────────────────────────
const PROD_KEY   = 'pc_products_v1'
const ORDERS_KEY = 'pc_orders_v1'
const STRIPE_KEY = 'pc_stripe_key_v1'

// ── Currency helper ───────────────────────────────────────────────────────────
function _fmtPrice(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style:'currency', currency }).format(amount)
}
function _prodId() { return 'prod_' + Date.now() + '_' + Math.random().toString(36).slice(2,6) }
function _orderId() { return 'ORD-' + Date.now().toString(36).toUpperCase() }

// ── ProductStore ──────────────────────────────────────────────────────────────
const ProductStore = {
  load() { try { return JSON.parse(localStorage.getItem(PROD_KEY)||'[]') } catch { return [] } },
  save(products) { try { localStorage.setItem(PROD_KEY, JSON.stringify(products)) } catch { toast('Storage full','⚠️') } },
  add(p) {
    const products = this.load()
    const product = { id:_prodId(), name:p.name||'Product', price:parseFloat(p.price)||0, description:p.description||'', image:p.image||'', stock:parseInt(p.stock)||99, sku:p.sku||'', stripeId:p.stripeId||'', createdAt:new Date().toISOString() }
    products.unshift(product)
    this.save(products)
    return product
  },
  update(id, updates) {
    const products = this.load()
    const idx = products.findIndex(p => p.id === id)
    if (idx !== -1) { products[idx] = { ...products[idx], ...updates }; this.save(products) }
  },
  delete(id) { this.save(this.load().filter(p => p.id !== id)) },
  get(id) { return this.load().find(p => p.id === id) },
  search(q) { q = q.toLowerCase(); return this.load().filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) },
}

// ── Cart ──────────────────────────────────────────────────────────────────────
const Cart = {
  _items: [],   // [{ productId, quantity }]
  get items() { return this._items },

  add(productId, qty = 1) {
    const existing = this._items.find(i => i.productId === productId)
    if (existing) existing.quantity += qty
    else this._items.push({ productId, quantity: qty })
    this._update()
  },
  remove(productId) {
    this._items = this._items.filter(i => i.productId !== productId)
    this._update()
  },
  setQty(productId, qty) {
    if (qty <= 0) return this.remove(productId)
    const item = this._items.find(i => i.productId === productId)
    if (item) item.quantity = qty
    this._update()
  },
  clear() { this._items = []; this._update() },
  total() {
    return this._items.reduce((sum, i) => {
      const p = ProductStore.get(i.productId)
      return sum + (p ? p.price * i.quantity : 0)
    }, 0)
  },
  count() { return this._items.reduce((s, i) => s + i.quantity, 0) },

  _update() {
    const count = this.count()
    // Update drawer badge
    const badge = document.getElementById('cart-count-badge')
    if (badge) badge.textContent = count
    // Update float button
    const fb = document.getElementById('cart-float-btn')
    const fc = document.getElementById('cart-float-count')
    if (fb) fb.classList.toggle('visible', count > 0)
    if (fc) fc.textContent = count
    // Render items list (if drawer is open)
    renderCartItems()
    // Update totals
    const total = _fmtPrice(this.total())
    const st = document.getElementById('cart-subtotal')
    const tt = document.getElementById('cart-total')
    if (st) st.textContent = total
    if (tt) tt.textContent = total
  },
}

// ── Cart UI ───────────────────────────────────────────────────────────────────
function openCart() {
  document.getElementById('cart-drawer').classList.add('open')
  document.getElementById('cart-backdrop').classList.add('show')
  renderCartItems()
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open')
  document.getElementById('cart-backdrop').classList.remove('show')
}
function toggleCart() { document.getElementById('cart-drawer').classList.contains('open') ? closeCart() : openCart() }

function renderCartItems() {
  const el = document.getElementById('cart-items-list'); if (!el) return
  const items = Cart.items
  if (!items.length) {
    el.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p style="font-size:13px;font-weight:600;color:var(--text2)">Your cart is empty</p><p style="font-size:11px;margin-top:4px">Add products from the canvas</p></div>`
    const btn = document.getElementById('cart-checkout-btn')
    if (btn) btn.disabled = true
    return
  }
  const btn = document.getElementById('cart-checkout-btn')
  if (btn) btn.disabled = false
  el.innerHTML = items.map(item => {
    const p = ProductStore.get(item.productId)
    if (!p) return ''
    return `<div class="cart-item">
      <img class="cart-item-img" src="${e(p.image||'')}" onerror="this.src=''" alt="${e(p.name)}"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${e(p.name)}</div>
        <div class="cart-item-price">${_fmtPrice(p.price * item.quantity)}</div>
        <div class="cart-item-qty">
          <button onclick="Cart.setQty('${p.id}',${item.quantity-1})">−</button>
          <span class="cart-item-qty-val">${item.quantity}</span>
          <button onclick="Cart.setQty('${p.id}',${item.quantity+1})">＋</button>
        </div>
      </div>
      <button class="cart-item-del" onclick="Cart.remove('${p.id}')" title="Remove">✕</button>
    </div>`
  }).join('')
}

// ── Checkout ──────────────────────────────────────────────────────────────────
function openCheckout() {
  closeCart()
  const stripeKey = localStorage.getItem(STRIPE_KEY) || ''
  const warn = document.getElementById('co-stripe-key-warn')
  if (warn) warn.style.display = stripeKey ? 'none' : 'block'
  // Render order summary
  const items = Cart.items
  const itemsEl = document.getElementById('co-order-items')
  if (itemsEl) {
    itemsEl.innerHTML = items.map(item => {
      const p = ProductStore.get(item.productId); if (!p) return ''
      return `<div class="checkout-order-item">
        <img class="checkout-order-item-img" src="${e(p.image||'')}" onerror="this.src=''" alt="${e(p.name)}"/>
        <div class="checkout-order-item-name">${e(p.name)} <span class="checkout-order-item-qty">×${item.quantity}</span></div>
        <div class="checkout-order-item-price">${_fmtPrice(p.price * item.quantity)}</div>
      </div>`
    }).join('')
  }
  const total = _fmtPrice(Cart.total())
  const st = document.getElementById('co-subtotal'); if (st) st.textContent = total
  const tt = document.getElementById('co-total');   if (tt) tt.textContent = total
  document.getElementById('checkout-modal').classList.remove('hidden')
}
function closeCheckout() { document.getElementById('checkout-modal').classList.add('hidden') }

function processCheckout() {
  const email = document.getElementById('co-email')?.value.trim()
  const name  = document.getElementById('co-name')?.value.trim()
  const addr  = document.getElementById('co-address')?.value.trim()
  const city  = document.getElementById('co-city')?.value.trim()
  const zip   = document.getElementById('co-zip')?.value.trim()
  const country= document.getElementById('co-country')?.value.trim()
  if (!email || !name || !addr || !city || !zip || !country)
    return toast('Please fill in all required fields','⚠️')

  const items = Cart.items.map(i => {
    const p = ProductStore.get(i.productId)
    return { productId:i.productId, name:p?.name||'', price:p?.price||0, quantity:i.quantity }
  })
  const order = {
    id:         _orderId(),
    items,
    total:      Cart.total(),
    currency:   'USD',
    customer:   { email, name, address:addr, city, zip, country },
    status:     'pending',
    createdAt:  new Date().toISOString(),
  }

  const stripeKey = localStorage.getItem(STRIPE_KEY) || ''
  if (stripeKey && typeof Stripe !== 'undefined') {
    // Real Stripe flow (simplified: just save order as paid for test mode)
    order.status = 'paid'
    order.paymentMethod = 'stripe_test'
  }

  // Save order
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]')
    orders.unshift(order)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0,500)))
  } catch {}

  Cart.clear()
  closeCheckout()
  toast(`✅ Order ${order.id} placed!`, '🛒')
}

// ── Orders UI ─────────────────────────────────────────────────────────────────
function openOrders() {
  document.getElementById('orders-modal').classList.remove('hidden')
  renderOrders()
}
function closeOrders() { document.getElementById('orders-modal').classList.add('hidden') }

function renderOrders() {
  const el = document.getElementById('orders-content'); if (!el) return
  let orders = []
  try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]') } catch {}
  const countEl = document.getElementById('orders-count')
  if (countEl) countEl.textContent = `${orders.length} order${orders.length!==1?'s':''}`
  if (!orders.length) {
    el.innerHTML = `<div class="subs-empty"><div style="font-size:28px">📭</div><div style="font-weight:600;margin-top:8px">No orders yet</div></div>`
    return
  }
  el.innerHTML = `<table class="subs-table">
    <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>${orders.map(o => `<tr>
      <td style="font-weight:700;color:var(--text)">${e(o.id)}</td>
      <td>${e(o.customer?.name||'—')}<br/><span style="font-size:10px;color:var(--muted)">${e(o.customer?.email||'')}</span></td>
      <td>${o.items?.length||0} item(s)</td>
      <td style="font-weight:700;color:var(--accent)">${_fmtPrice(o.total||0,o.currency||'USD')}</td>
      <td><span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:${o.status==='paid'?'rgba(52,211,153,.15)':'rgba(251,191,36,.15)'};color:${o.status==='paid'?'#10b981':'#d97706'}">${o.status||'pending'}</span></td>
      <td style="color:var(--muted);font-size:11px">${new Date(o.createdAt||0).toLocaleDateString()}</td>
    </tr>`).join('')}</tbody>
  </table>`
}

function exportOrdersCSV() {
  let orders = []
  try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]') } catch {}
  if (!orders.length) return toast('No orders to export','⚠️')
  const rows = orders.map(o => [o.id, o.customer?.name||'', o.customer?.email||'', o.items?.length||0, o.total||0, o.status||'', o.createdAt||''].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))
  const csv = ['Order ID,Name,Email,Items,Total,Status,Date', ...rows].join('\n')
  const blob = new Blob([csv], { type:'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download='orders.csv'; a.click()
  URL.revokeObjectURL(url)
  toast('Orders exported','⬇')
}

// ── Product Management Panel ──────────────────────────────────────────────────
let _pmEditId = null   // null = new product, else id = editing

function openPM() {
  document.getElementById('pm-modal').classList.remove('hidden')
  renderPMGrid()
}
function closePM() { document.getElementById('pm-modal').classList.add('hidden') }

function renderPMGrid() {
  const el = document.getElementById('pm-grid'); if (!el) return
  const q = document.getElementById('pm-search')?.value.trim() || ''
  const products = q ? ProductStore.search(q) : ProductStore.load()
  const statsEl = document.getElementById('pm-stats')
  if (statsEl) statsEl.textContent = `${products.length} product${products.length!==1?'s':''}`
  if (!products.length) {
    el.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)"><div style="font-size:28px;margin-bottom:8px">📦</div><div style="font-weight:600">No products yet</div><div style="font-size:11px;margin-top:4px">Click "+ Add Product" to create your first product</div></div>`
    return
  }
  el.innerHTML = products.map(p => `
    <div class="pm-product-card">
      <img class="pm-product-img" src="${e(p.image||'')}" onerror="this.style.display='none'" alt="${e(p.name)}"/>
      <div class="pm-product-body">
        <div class="pm-product-name">${e(p.name)}</div>
        <div class="pm-product-price">${_fmtPrice(p.price)}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">Stock: ${p.stock} · SKU: ${e(p.sku||'—')}</div>
        <div class="pm-product-actions">
          <button onclick="openPMEditor('${p.id}')">✏️ Edit</button>
          <button class="pm-del" onclick="pmDeleteProduct('${p.id}')">🗑 Delete</button>
        </div>
      </div>
    </div>`).join('')
}

function openPMEditor(id) {
  _pmEditId = id || null
  const editor = document.getElementById('pm-editor')
  const titleEl = document.getElementById('pm-editor-title')
  if (_pmEditId) {
    const p = ProductStore.get(_pmEditId)
    if (!p) return
    titleEl.textContent = 'Edit Product'
    document.getElementById('pme-name').value  = p.name || ''
    document.getElementById('pme-price').value = p.price || ''
    document.getElementById('pme-desc').value  = p.description || ''
    document.getElementById('pme-image').value = p.image || ''
    document.getElementById('pme-stock').value = p.stock || ''
    document.getElementById('pme-sku').value   = p.sku || ''
    document.getElementById('pme-stripe-id').value = p.stripeId || ''
    document.getElementById('pme-id').value    = p.id
    if (p.image) {
      const prev = document.getElementById('pme-img-preview')
      const prevEl = document.getElementById('pme-img-prev-el')
      if (prev) prev.style.display = 'block'
      if (prevEl) prevEl.src = p.image
    }
  } else {
    titleEl.textContent = 'New Product'
    ;['pme-name','pme-price','pme-desc','pme-image','pme-stock','pme-sku','pme-stripe-id','pme-id'].forEach(id => { const el = document.getElementById(id); if (el) el.value = '' })
    const prev = document.getElementById('pme-img-preview')
    if (prev) prev.style.display = 'none'
  }
  editor.classList.add('open')
}
function closePMEditor() { document.getElementById('pm-editor').classList.remove('open') }

function savePMProduct() {
  const name  = document.getElementById('pme-name')?.value.trim()
  const price = document.getElementById('pme-price')?.value.trim()
  if (!name || !price) return toast('Name and price are required','⚠️')
  const data = {
    name,
    price:       parseFloat(price),
    description: document.getElementById('pme-desc')?.value.trim() || '',
    image:       document.getElementById('pme-image')?.value.trim() || '',
    stock:       parseInt(document.getElementById('pme-stock')?.value||'99'),
    sku:         document.getElementById('pme-sku')?.value.trim() || '',
    stripeId:    document.getElementById('pme-stripe-id')?.value.trim() || '',
  }
  if (_pmEditId) {
    ProductStore.update(_pmEditId, data)
    toast(`"${name}" updated`,'✓')
  } else {
    ProductStore.add(data)
    toast(`"${name}" added`,'📦')
  }
  closePMEditor()
  renderPMGrid()
  // Refresh any product-grid sections on canvas
  S.sections.filter(s => s.type === 'product-grid').forEach(s => patchSection(s))
}

function pmDeleteProduct(id) {
  const p = ProductStore.get(id)
  if (!confirm(`Delete "${p?.name}"?`)) return
  ProductStore.delete(id)
  renderPMGrid()
  S.sections.filter(s => s.type === 'product-grid').forEach(s => patchSection(s))
  toast('Product deleted','🗑')
}

function pmUploadImg(input) {
  const f = input.files[0]; if (!f) return
  if (f.size > 5*1024*1024) return toast('Max 5MB','⚠️')
  const r = new FileReader()
  r.onload = ev => {
    const src = ev.target.result
    document.getElementById('pme-image').value = src
    const prev = document.getElementById('pme-img-preview')
    const prevEl = document.getElementById('pme-img-prev-el')
    if (prev) prev.style.display = 'block'
    if (prevEl) prevEl.src = src
  }
  r.readAsDataURL(f)
}

function pmDeleteProduct(id) {
  const p = ProductStore.get(id)
  if (!confirm(`Delete "${p?.name}"?`)) return
  ProductStore.delete(id)
  renderPMGrid()
  S.sections.filter(s => s.type === 'product-grid').forEach(s => patchSection(s))
  toast('Product deleted','🗑')
}

/* ══════════════════════════════════════════════════════
   GLOBAL STYLES — site-wide design system
══════════════════════════════════════════════════════ */

const GS_KEY = 'pc_global_styles_v1'

const GS_DEFAULTS = {
  // Colors
  colorPrimary:    '#6c63ff',
  colorSecondary:  '#a78bfa',
  colorBackground: '#ffffff',
  colorText:       '#0f172a',
  colorAccent:     '#10b981',
  colorMuted:      '#64748b',
  // Fonts
  fontHeading: 'Inter',
  fontBody:    'Inter',
  // Typography scale (px)
  h1Size: '48', h2Size: '38', h3Size: '30',
  h4Size: '24', h5Size: '20', h6Size: '16',
  bodySize: '16',
  lineHeightHeading: '1.15',
  lineHeightBody:    '1.7',
  // Spacing
  spacingBase:    '16',
  spacingSection: '80',
  borderRadius:   '8',
}

const GS_FONT_OPTIONS = [
  'Inter','Roboto','Open Sans','Lato','Poppins','Raleway','Montserrat',
  'Playfair Display','Merriweather','Georgia','system-ui',
]

const GS_PRESETS = [
  { id:'default',  name:'Default',    colorPrimary:'#6c63ff', colorSecondary:'#a78bfa', colorBackground:'#ffffff', colorText:'#0f172a', colorAccent:'#10b981', fontHeading:'Inter',            fontBody:'Inter' },
  { id:'midnight', name:'Midnight',   colorPrimary:'#818cf8', colorSecondary:'#c084fc', colorBackground:'#0f172a', colorText:'#f1f5f9', colorAccent:'#34d399', fontHeading:'Inter',            fontBody:'Inter' },
  { id:'forest',   name:'Forest',     colorPrimary:'#059669', colorSecondary:'#34d399', colorBackground:'#f0fdf4', colorText:'#14532d', colorAccent:'#f59e0b', fontHeading:'Poppins',          fontBody:'Open Sans' },
  { id:'ocean',    name:'Ocean',      colorPrimary:'#0ea5e9', colorSecondary:'#38bdf8', colorBackground:'#f0f9ff', colorText:'#0c4a6e', colorAccent:'#6c63ff', fontHeading:'Montserrat',       fontBody:'Roboto' },
  { id:'sunset',   name:'Sunset',     colorPrimary:'#f97316', colorSecondary:'#fb923c', colorBackground:'#fff7ed', colorText:'#431407', colorAccent:'#ec4899', fontHeading:'Raleway',          fontBody:'Lato' },
  { id:'luxury',   name:'Luxury',     colorPrimary:'#d4af37', colorSecondary:'#fbbf24', colorBackground:'#1c1917', colorText:'#fafaf9', colorAccent:'#a78bfa', fontHeading:'Playfair Display', fontBody:'Lato' },
  { id:'minimal',  name:'Minimal',    colorPrimary:'#18181b', colorSecondary:'#52525b', colorBackground:'#ffffff', colorText:'#18181b', colorAccent:'#3f3f46', fontHeading:'Inter',            fontBody:'Inter' },
  { id:'coral',    name:'Coral',      colorPrimary:'#f43f5e', colorSecondary:'#fb7185', colorBackground:'#fff1f2', colorText:'#881337', colorAccent:'#6c63ff', fontHeading:'Poppins',          fontBody:'Inter' },
]

let _gsTab = 'colors'

const GlobalStyles = (() => {

  function load() {
    try { return { ...GS_DEFAULTS, ...JSON.parse(localStorage.getItem(GS_KEY)||'{}') } } catch { return { ...GS_DEFAULTS } }
  }
  function save(cfg) {
    localStorage.setItem(GS_KEY, JSON.stringify(cfg))
  }
  function get() { return load() }

  // ── Generate the CSS string from the current config ───────────────────────
  function genCSS(cfg) {
    cfg = cfg || load()
    const gf = `${cfg.fontHeading!=='system-ui'?`'${cfg.fontHeading}',`:''}system-ui,sans-serif`
    const bf = `${cfg.fontBody!=='system-ui'?`'${cfg.fontBody}',`:''}system-ui,sans-serif`
    return `:root{
  --gs-primary:${cfg.colorPrimary};
  --gs-secondary:${cfg.colorSecondary};
  --gs-bg:${cfg.colorBackground};
  --gs-text:${cfg.colorText};
  --gs-accent:${cfg.colorAccent};
  --gs-muted:${cfg.colorMuted};
  --gs-radius:${cfg.borderRadius}px;
  --gs-space:${cfg.spacingBase}px;
  --gs-space-section:${cfg.spacingSection}px;
}
h1,h2,h3,h4,h5,h6{font-family:${gf};line-height:${cfg.lineHeightHeading};}
body,p,li,td,th{font-family:${bf};line-height:${cfg.lineHeightBody};}
h1{font-size:${cfg.h1Size}px} h2{font-size:${cfg.h2Size}px} h3{font-size:${cfg.h3Size}px}
h4{font-size:${cfg.h4Size}px} h5{font-size:${cfg.h5Size}px} h6{font-size:${cfg.h6Size}px}
body{font-size:${cfg.bodySize}px}`
  }

  // ── Inject into the canvas (builder preview) ──────────────────────────────
  function applyToCanvas() {
    let el = document.getElementById('gs-canvas-style')
    if (!el) { el = document.createElement('style'); el.id = 'gs-canvas-style'; document.head.appendChild(el) }
    el.textContent = genCSS()
    // Refresh live-frame too
    scheduleLive && scheduleLive()
  }

  // ── Apply global colors to ALL sections ───────────────────────────────────
  function applyToAllSections() {
    const cfg = load()
    if (!S.sections.length) return toast('No sections to apply to','⚠️')
    if (!confirm(`Apply global colors to all ${S.sections.length} sections?\nThis will update bgColor, textColor, and accentColor of every section.`)) return
    pushH('Apply global styles')
    editorStore.produce(draft => {
      draft.sections.forEach(sec => {
        if (sec.props.bgColor   !== undefined) sec.props.bgColor   = cfg.colorBackground
        if (sec.props.textColor !== undefined) sec.props.textColor = cfg.colorText
        if (sec.props.accentColor !== undefined) sec.props.accentColor = cfg.colorPrimary
      })
    }, 'global-styles-apply')
    renderAll()
    toast('Global colors applied to all sections ✓', '🎨')
  }

  // ── Apply a preset ────────────────────────────────────────────────────────
  function applyPreset(id) {
    const preset = GS_PRESETS.find(p => p.id === id)
    if (!preset) return
    const current = load()
    const next = { ...current, ...preset }
    delete next.id; delete next.name
    save(next)
    applyToCanvas()
    renderGSBody()
    toast(`"${preset.name}" preset applied`, '✦')
  }

  // ── Reset to defaults ─────────────────────────────────────────────────────
  function reset() {
    if (!confirm('Reset all global styles to defaults?')) return
    save({ ...GS_DEFAULTS })
    applyToCanvas()
    renderGSBody()
    toast('Reset to defaults ✓', '↺')
  }

  // ── Update a single property ──────────────────────────────────────────────
  function setProp(key, val) {
    const cfg = load()
    cfg[key] = val
    save(cfg)
    applyToCanvas()
    _livePreviewTypo(cfg)
  }

  function _livePreviewTypo(cfg) {
    // Update font preview spans without re-rendering the whole panel
    document.querySelectorAll('[data-gs-preview]').forEach(el => {
      const tag = el.dataset.gsPreview
      const cfg2 = cfg || load()
      if (tag === 'heading') {
        el.style.fontFamily = cfg2.fontHeading === 'system-ui' ? 'system-ui' : `'${cfg2.fontHeading}',system-ui`
      } else if (tag === 'body') {
        el.style.fontFamily = cfg2.fontBody === 'system-ui' ? 'system-ui' : `'${cfg2.fontBody}',system-ui`
      }
    })
  }

  return { load, save, get, genCSS, applyToCanvas, applyToAllSections, applyPreset, reset, setProp }
})()

// ── Open / close ──────────────────────────────────────────────────────────────
function openGlobalStyles() {
  document.getElementById('gs-modal').classList.remove('hidden')
  _gsTab = 'colors'
  document.querySelectorAll('.gs-tab').forEach((t,i) => t.classList.toggle('active', i===0))
  renderGSBody()
}
function closeGlobalStyles() { document.getElementById('gs-modal').classList.add('hidden') }

function switchGSTab(tab, btn) {
  _gsTab = tab
  document.querySelectorAll('.gs-tab').forEach(t => t.classList.remove('active'))
  if (btn) btn.classList.add('active')
  renderGSBody()
}

// ── Render the panel body based on active tab ─────────────────────────────────
function renderGSBody() {
  const el = document.getElementById('gs-body'); if (!el) return
  const cfg = GlobalStyles.load()

  if (_gsTab === 'colors') {
    const colors = [
      { k:'colorPrimary',    l:'Primary',    hint:'Buttons, links, accents' },
      { k:'colorSecondary',  l:'Secondary',  hint:'Hover states, highlights' },
      { k:'colorBackground', l:'Background', hint:'Main page background' },
      { k:'colorText',       l:'Body Text',  hint:'Paragraphs, labels' },
      { k:'colorAccent',     l:'Accent',     hint:'Success, badges, tags' },
      { k:'colorMuted',      l:'Muted',      hint:'Placeholders, subtitles' },
    ]
    el.innerHTML = `<div class="gs-section">
      <div class="gs-section-title">Color Palette</div>
      ${colors.map(c => `
        <div class="gs-row">
          <label>${c.l}<br/><span style="font-size:10px;font-weight:400;color:var(--muted)">${c.hint}</span></label>
          <div class="gs-val">
            <div class="gs-color-row">
              <input type="color" class="gs-swatch" value="${cfg[c.k]||'#000000'}"
                oninput="GlobalStyles.setProp('${c.k}',this.value);document.getElementById('gs-txt-${c.k}').value=this.value"
                onchange="GlobalStyles.setProp('${c.k}',this.value)"/>
              <input type="text" class="gs-input" id="gs-txt-${c.k}" value="${cfg[c.k]||''}"
                oninput="GlobalStyles.setProp('${c.k}',this.value);this.previousElementSibling.value=this.value"/>
            </div>
          </div>
        </div>`).join('')}
    </div>
    <div class="gs-section">
      <div class="gs-section-title">Live Preview</div>
      <div style="padding:16px;background:${cfg.colorBackground};border-radius:8px;border:1px solid var(--border)">
        <h2 style="color:${cfg.colorText};font-size:22px;font-weight:800;margin-bottom:6px">Page Heading</h2>
        <p style="color:${cfg.colorText};opacity:.7;font-size:14px;margin-bottom:12px">Body text with the selected color palette applied.</p>
        <a href="#" style="display:inline-block;padding:8px 18px;background:${cfg.colorPrimary};color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700" onclick="return false">Primary Button</a>
        <a href="#" style="display:inline-block;padding:8px 18px;background:${cfg.colorAccent};color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;margin-left:8px" onclick="return false">Accent</a>
      </div>
    </div>`

  } else if (_gsTab === 'typography') {
    const loadGFonts = () => {
      GS_FONT_OPTIONS.filter(f => f !== 'system-ui' && f !== 'Georgia').forEach(f => {
        if (!document.querySelector(`link[data-gf="${f}"]`)) {
          const l = document.createElement('link')
          l.rel = 'stylesheet'; l.dataset.gf = f
          l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;700&display=swap`
          document.head.appendChild(l)
        }
      })
    }
    loadGFonts()
    const fontSelect = (key, label) => `
      <div class="gs-row">
        <label>${label}</label>
        <div class="gs-val">
          <select class="gs-input" onchange="GlobalStyles.setProp('${key}',this.value);document.querySelectorAll('[data-gs-preview=\\'${key==='fontHeading'?'heading':'body'}\\']').forEach(el=>el.style.fontFamily=this.value==='system-ui'?'system-ui':\"'\"+this.value+\"',system-ui\")">
            ${GS_FONT_OPTIONS.map(f=>`<option value="${f}"${cfg[key]===f?' selected':''}>${f}</option>`).join('')}
          </select>
        </div>
      </div>`

    el.innerHTML = `
      <div class="gs-section">
        <div class="gs-section-title">Font Families</div>
        ${fontSelect('fontHeading','Heading Font')}
        ${fontSelect('fontBody','Body Font')}
        <div class="gs-font-preview" data-gs-preview="heading" style="font-family:'${cfg.fontHeading}',system-ui;font-size:18px;font-weight:800;color:var(--text)">Heading: The quick brown fox</div>
        <div class="gs-font-preview" data-gs-preview="body"    style="font-family:'${cfg.fontBody}',system-ui;font-size:14px;color:var(--text2)">Body: The quick brown fox jumps over the lazy dog.</div>
      </div>
      <div class="gs-section">
        <div class="gs-section-title">Typography Scale</div>
        <div class="gs-typo-grid">
          ${['h1','h2','h3','h4','h5','h6'].map(h => `
            <div class="gs-typo-item">
              <div class="gs-typo-label">${h.toUpperCase()} — <span id="gs-typo-val-${h}">${cfg[h+'Size']}px</span></div>
              <input type="range" class="gs-range" min="10" max="96" value="${cfg[h+'Size']}"
                oninput="document.getElementById('gs-typo-val-${h}').textContent=this.value+'px';GlobalStyles.setProp('${h}Size',this.value)"
                onchange="GlobalStyles.setProp('${h}Size',this.value,true)"/>
              <div class="gs-typo-preview" style="font-size:${Math.min(Number(cfg[h+'Size']),32)}px;font-weight:700;font-family:'${cfg.fontHeading}',system-ui;color:var(--text)">Aa</div>
            </div>`).join('')}
          <div class="gs-typo-item">
            <div class="gs-typo-label">BODY — <span id="gs-typo-val-body">${cfg.bodySize}px</span></div>
            <input type="range" class="gs-range" min="10" max="22" value="${cfg.bodySize}"
              oninput="document.getElementById('gs-typo-val-body').textContent=this.value+'px';GlobalStyles.setProp('bodySize',this.value)"/>
          </div>
          <div class="gs-typo-item">
            <div class="gs-typo-label">LINE HEIGHT (BODY) — <span id="gs-typo-val-lhb">${cfg.lineHeightBody}</span></div>
            <input type="range" class="gs-range" min="1" max="2.5" step="0.05" value="${cfg.lineHeightBody}"
              oninput="document.getElementById('gs-typo-val-lhb').textContent=parseFloat(this.value).toFixed(2);GlobalStyles.setProp('lineHeightBody',this.value)"/>
          </div>
        </div>
      </div>`

  } else if (_gsTab === 'spacing') {
    const ranges = [
      { k:'spacingBase',    l:'Base Spacing',    min:4,  max:32, unit:'px', hint:'Used for padding and margins' },
      { k:'spacingSection', l:'Section Padding',  min:40, max:160, unit:'px', hint:'Top/bottom padding of sections' },
      { k:'borderRadius',   l:'Border Radius',    min:0,  max:32, unit:'px', hint:'Rounded corners on cards & buttons' },
    ]
    el.innerHTML = `<div class="gs-section">
      <div class="gs-section-title">Spacing & Shape</div>
      ${ranges.map(r => `
        <div class="gs-row" style="flex-direction:column;align-items:stretch;gap:6px">
          <div style="display:flex;justify-content:space-between">
            <label style="font-size:12px;font-weight:600;color:var(--text2)">${r.l} <span style="font-size:10px;font-weight:400;color:var(--muted)">${r.hint}</span></label>
            <span class="gs-range-val" id="gs-sp-${r.k}">${cfg[r.k]}${r.unit}</span>
          </div>
          <input type="range" class="gs-range" min="${r.min}" max="${r.max}" value="${cfg[r.k]}"
            oninput="document.getElementById('gs-sp-${r.k}').textContent=this.value+'${r.unit}';GlobalStyles.setProp('${r.k}',this.value)"
            onchange="GlobalStyles.setProp('${r.k}',this.value)"/>
        </div>`).join('')}
    </div>
    <div class="gs-section">
      <div class="gs-section-title">Spacing Preview</div>
      <div style="padding:${cfg.spacingBase}px;background:var(--surface2);border-radius:${cfg.borderRadius}px;display:flex;flex-direction:column;gap:${cfg.spacingBase}px;border:1px solid var(--border)">
        <div style="background:var(--accent);border-radius:${cfg.borderRadius}px;height:12px;opacity:.5"></div>
        <div style="background:var(--accent2);border-radius:${cfg.borderRadius}px;height:12px;width:70%;opacity:.4"></div>
        <div style="background:var(--accent);border-radius:${cfg.borderRadius}px;height:12px;width:50%;opacity:.3"></div>
      </div>
    </div>`

  } else if (_gsTab === 'presets') {
    el.innerHTML = `<div class="gs-section">
      <div class="gs-section-title">Design Presets</div>
      <div class="gs-presets-grid">
        ${GS_PRESETS.map(p => `
          <div class="gs-preset-card" onclick="GlobalStyles.applyPreset('${p.id}')">
            <div class="gs-preset-swatches">
              <div class="gs-preset-swatch" style="background:${p.colorPrimary}"></div>
              <div class="gs-preset-swatch" style="background:${p.colorSecondary}"></div>
              <div class="gs-preset-swatch" style="background:${p.colorBackground};border:1px solid var(--border)"></div>
              <div class="gs-preset-swatch" style="background:${p.colorText}"></div>
            </div>
            <div class="gs-preset-name">${p.name}</div>
            <div style="font-size:9px;color:var(--muted)">${p.fontHeading}</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="gs-section">
      <div class="gs-section-title">Save Current as Preset</div>
      <div style="display:flex;gap:8px">
        <input class="gs-input" id="gs-save-name" placeholder="Preset name…" style="flex:1"/>
        <button onclick="gsUserSavePreset()" style="padding:6px 14px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">Save</button>
      </div>
      <div id="gs-user-presets" style="margin-top:8px;display:flex;flex-direction:column;gap:4px"></div>
    </div>`
    gsRenderUserPresets()
  }
}

function gsUserSavePreset() {
  const name = document.getElementById('gs-save-name')?.value.trim()
  if (!name) return toast('Enter a preset name','⚠️')
  const cfg = GlobalStyles.load()
  const userPresets = (() => { try { return JSON.parse(localStorage.getItem('pc_gs_presets_v1')||'[]') } catch { return [] } })()
  userPresets.unshift({ id: 'usr_'+Date.now(), name, ...cfg })
  localStorage.setItem('pc_gs_presets_v1', JSON.stringify(userPresets.slice(0,20)))
  gsRenderUserPresets()
  toast(`"${name}" saved`, '✦')
}

function gsRenderUserPresets() {
  const el = document.getElementById('gs-user-presets'); if (!el) return
  const presets = (() => { try { return JSON.parse(localStorage.getItem('pc_gs_presets_v1')||'[]') } catch { return [] } })()
  if (!presets.length) { el.innerHTML = '<p style="font-size:11px;color:var(--muted)">No saved presets yet</p>'; return }
  el.innerHTML = presets.map(p => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--surface2);border-radius:5px;border:1px solid var(--border)">
      <div style="display:flex;gap:3px">${['colorPrimary','colorSecondary','colorBackground','colorText'].map(k=>`<div style="width:12px;height:12px;border-radius:50%;background:${p[k]||'#000'};border:1px solid var(--border)"></div>`).join('')}</div>
      <span style="flex:1;font-size:11px;font-weight:600;color:var(--text2)">${e(p.name)}</span>
      <button onclick="GlobalStyles.applyPreset_user('${p.id}')" style="padding:2px 8px;background:rgba(108,99,255,.12);border:1px solid rgba(108,99,255,.25);border-radius:4px;color:var(--accent);font-size:10px;font-weight:600;cursor:pointer">Apply</button>
      <button onclick="gsDeleteUserPreset('${p.id}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:11px">✕</button>
    </div>`).join('')
}

function gsDeleteUserPreset(id) {
  const presets = (() => { try { return JSON.parse(localStorage.getItem('pc_gs_presets_v1')||'[]') } catch { return [] } })()
  localStorage.setItem('pc_gs_presets_v1', JSON.stringify(presets.filter(p => p.id !== id)))
  gsRenderUserPresets()
}

// Extend GlobalStyles with user preset apply
GlobalStyles.applyPreset_user = function(id) {
  const presets = (() => { try { return JSON.parse(localStorage.getItem('pc_gs_presets_v1')||'[]') } catch { return [] } })()
  const p = presets.find(x => x.id === id)
  if (!p) return
  GlobalStyles.save(p)
  GlobalStyles.applyToCanvas()
  renderGSBody()
  toast(`"${p.name}" applied`, '✦')
}

/* ══════════════════════════════════════════════════════
   FORM BUILDER — edit panel + submissions
══════════════════════════════════════════════════════ */

const FB_FIELD_TYPES = ['text','email','number','textarea','select','checkbox','radio','file']
const FB_TYPE_ICONS  = {text:'T',email:'@',number:'#',textarea:'¶',select:'▾',checkbox:'☑',radio:'◉',file:'📎'}
let _fbEditingFieldId = null   // which field id is open in the editor
let _fbDragId = null

function _fbFields(sec) {
  try { return JSON.parse(sec.props.fields || '[]') } catch { return [] }
}
function _fbSaveFields(secId, fields) {
  setProp(secId, 'fields', JSON.stringify(fields), true)
}
function _fbUid() { return 'fb_' + Date.now() + '_' + Math.random().toString(36).slice(2,5) }

// ── Render the custom form-builder panel in the right sidebar ─────────────────
function renderFormBuilderPanel(sec) {
  const el = document.getElementById('ppanel-edit')
  const fields = _fbFields(sec)

  // Standard settings (heading, submit, etc)
  const schema = ES['form-builder'] || []
  const settingsHTML = schema.map(grp =>
    `<div class="prop-group fb-section">
      <div class="fb-section-title">${grp.g}</div>
      ${grp.f.map(f => renderPF(f, sec)).join('')}
    </div>`
  ).join('')

  // Fields list
  const fieldsListHTML = fields.length
    ? fields.map((f, i) => `
      <div class="fb-field-item${_fbEditingFieldId===f.id?' drag-over':''}" data-fbid="${f.id}"
           draggable="true"
           ondragstart="_fbDragId='${f.id}';this.classList.add('dragging')"
           ondragend="this.classList.remove('dragging')"
           ondragover="event.preventDefault();this.classList.add('drag-over')"
           ondragleave="this.classList.remove('drag-over')"
           ondrop="event.preventDefault();this.classList.remove('drag-over');fbDropField('${sec.id}','${f.id}')">
        <span class="fb-field-handle">⠿</span>
        <span class="fb-field-icon">${FB_TYPE_ICONS[f.type]||'?'}</span>
        <div class="fb-field-info">
          <div class="fb-field-label">${e(f.label||'Untitled')}</div>
          <div class="fb-field-type">${f.type}${f.required?' · required':''}</div>
        </div>
        <div class="fb-field-actions">
          <button onclick="fbEditField('${sec.id}','${f.id}')" title="Edit">✏️</button>
          <button class="fb-del" onclick="fbDeleteField('${sec.id}','${f.id}')" title="Delete">✕</button>
        </div>
      </div>`).join('')
    : `<div style="color:var(--muted);font-size:11px;text-align:center;padding:16px 0">No fields yet</div>`

  // Field editor (shown when editing a field)
  let fieldEditorHTML = ''
  if (_fbEditingFieldId) {
    const f = fields.find(x => x.id === _fbEditingFieldId)
    if (f) {
      const hasOptions = f.type === 'select' || f.type === 'radio'
      fieldEditorHTML = `
        <div class="fb-field-editor" id="fb-field-editor">
          <div class="fb-field-editor-title">Edit Field: ${e(f.label||f.type)}</div>
          <div class="fb-editor-row">
            <div class="fb-editor-label">Type</div>
            <select onchange="fbUpdateFieldProp('${sec.id}','${f.id}','type',this.value)">
              ${FB_FIELD_TYPES.map(t=>`<option value="${t}"${t===f.type?' selected':''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="fb-editor-row">
            <div class="fb-editor-label">Label</div>
            <input type="text" value="${e(f.label||'')}" oninput="fbUpdateFieldProp('${sec.id}','${f.id}','label',this.value)" placeholder="Field label"/>
          </div>
          <div class="fb-editor-row">
            <div class="fb-editor-label">Placeholder</div>
            <input type="text" value="${e(f.placeholder||'')}" oninput="fbUpdateFieldProp('${sec.id}','${f.id}','placeholder',this.value)" placeholder="Hint text"/>
          </div>
          ${hasOptions ? `<div class="fb-editor-row">
            <div class="fb-editor-label">Options (one per line)</div>
            <textarea rows="4" oninput="fbUpdateFieldProp('${sec.id}','${f.id}','options',this.value)">${e(f.options||'')}</textarea>
          </div>` : ''}
          <div class="fb-editor-row">
            <div class="fb-editor-label">Validation (regex or "email"/"url")</div>
            <input type="text" value="${e(f.validation||'')}" oninput="fbUpdateFieldProp('${sec.id}','${f.id}','validation',this.value)" placeholder="e.g. ^[0-9]+$"/>
          </div>
          <label class="fb-check-row">
            <input type="checkbox" ${f.required?'checked':''} onchange="fbUpdateFieldProp('${sec.id}','${f.id}','required',this.checked)">
            Required field
          </label>
          <button style="margin-top:4px;padding:4px 10px;background:rgba(108,99,255,.12);border:1px solid rgba(108,99,255,.3);border-radius:5px;color:var(--accent);font-size:11px;font-weight:600;cursor:pointer" onclick="_fbEditingFieldId=null;renderPanel()">✓ Done</button>
        </div>`
    }
  }

  // Add field chips
  const addChipsHTML = `
    <div class="fb-add-row">
      ${FB_FIELD_TYPES.map(t => `<span class="fb-add-chip" onclick="fbAddField('${sec.id}','${t}')" title="Add ${t}">${FB_TYPE_ICONS[t]} ${t}</span>`).join('')}
    </div>`

  el.innerHTML = `
    <div class="fb-panel">
      ${settingsHTML}
      <div class="prop-group fb-section">
        <div class="fb-section-title" style="display:flex;align-items:center;justify-content:space-between">
          <span>Form Fields (${fields.length})</span>
          <button style="padding:2px 8px;background:var(--accent);color:#fff;border:none;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer" onclick="fbAddField('${sec.id}','text')">+ Add</button>
        </div>
        <div class="fb-fields-list" id="fb-fields-list">${fieldsListHTML}</div>
        ${addChipsHTML}
        ${fieldEditorHTML}
      </div>
      <div class="prop-group fb-section" style="margin-top:8px">
        <button style="width:100%;padding:7px;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.3);border-radius:6px;color:#10b981;font-size:11px;font-weight:600;cursor:pointer" onclick="openFormSubmissions('${sec.id}')">
          📋 View Submissions
        </button>
      </div>
    </div>`

  // Wire standard settings inputs
  el.querySelectorAll('[data-pk]').forEach(inp => {
    inp.addEventListener('input',  () => setProp(sec.id, inp.dataset.pk, inp.value))
    inp.addEventListener('change', () => setProp(sec.id, inp.dataset.pk, inp.value, true))
  })
}

// ── CRUD helpers ──────────────────────────────────────────────────────────────
function fbAddField(secId, type) {
  const sec = S.sections.find(s => s.id === secId); if (!sec) return
  const fields = _fbFields(sec)
  const newField = { id: _fbUid(), type, label: type.charAt(0).toUpperCase()+type.slice(1), placeholder: '', required: false, validation: '', options: type==='select'||type==='radio'?'Option 1\nOption 2\nOption 3':'' }
  fields.push(newField)
  _fbEditingFieldId = newField.id
  _fbSaveFields(secId, fields)
}
function fbDeleteField(secId, fieldId) {
  const sec = S.sections.find(s => s.id === secId); if (!sec) return
  const fields = _fbFields(sec).filter(f => f.id !== fieldId)
  if (_fbEditingFieldId === fieldId) _fbEditingFieldId = null
  _fbSaveFields(secId, fields)
}
function fbEditField(secId, fieldId) {
  _fbEditingFieldId = _fbEditingFieldId === fieldId ? null : fieldId
  renderPanel()
}
function fbUpdateFieldProp(secId, fieldId, key, val) {
  const sec = S.sections.find(s => s.id === secId); if (!sec) return
  const fields = _fbFields(sec)
  const f = fields.find(x => x.id === fieldId); if (!f) return
  f[key] = val
  _fbSaveFields(secId, fields)
}
function fbDropField(secId, targetId) {
  if (!_fbDragId || _fbDragId === targetId) return
  const sec = S.sections.find(s => s.id === secId); if (!sec) return
  const fields = _fbFields(sec)
  const fromIdx = fields.findIndex(f => f.id === _fbDragId)
  const toIdx   = fields.findIndex(f => f.id === targetId)
  if (fromIdx === -1 || toIdx === -1) return
  const [moved] = fields.splice(fromIdx, 1)
  fields.splice(toIdx, 0, moved)
  _fbDragId = null
  _fbSaveFields(secId, fields)
}

// ── Form Submissions storage & UI ────────────────────────────────────────────
const SUBS_KEY = 'pc_form_subs_v1'

function _loadSubs(secId) {
  try {
    const all = JSON.parse(localStorage.getItem(SUBS_KEY) || '[]')
    return secId ? all.filter(s => s._sectionId === secId) : all
  } catch { return [] }
}

let _subsFilterId = null

function openFormSubmissions(secId) {
  _subsFilterId = secId || null
  document.getElementById('subs-modal').classList.remove('hidden')
  renderSubsContent()
}
function closeFormSubmissions() { document.getElementById('subs-modal').classList.add('hidden') }

function renderSubsContent() {
  const el   = document.getElementById('subs-content'); if (!el) return
  const subs = _loadSubs(_subsFilterId)
  document.getElementById('subs-count').textContent = `${subs.length} submission${subs.length!==1?'s':''}`
  if (!subs.length) {
    el.innerHTML = `<div class="subs-empty"><div style="font-size:28px;margin-bottom:8px">📭</div><div style="font-weight:600">No submissions yet</div><div style="font-size:11px;margin-top:4px">Submit the form to see entries here</div></div>`
    return
  }
  // Collect all field keys (except internals)
  const keys = [...new Set(subs.flatMap(s => Object.keys(s).filter(k => !k.startsWith('_'))))]
  el.innerHTML = `<table class="subs-table">
    <thead><tr>
      <th>#</th>
      ${keys.map(k=>`<th>${e(k)}</th>`).join('')}
      <th>Date</th>
    </tr></thead>
    <tbody>${subs.map((s,i) => `<tr>
      <td style="color:var(--muted)">${i+1}</td>
      ${keys.map(k=>`<td title="${e(String(s[k]||''))}">${e(String(s[k]||'—'))}</td>`).join('')}
      <td style="color:var(--muted);white-space:nowrap">${new Date(s._submittedAt||0).toLocaleString()}</td>
    </tr>`).join('')}</tbody>
  </table>`
}

function clearFormSubmissions() {
  if (!confirm('Delete all submissions?')) return
  try {
    if (_subsFilterId) {
      const all = JSON.parse(localStorage.getItem(SUBS_KEY) || '[]')
      localStorage.setItem(SUBS_KEY, JSON.stringify(all.filter(s => s._sectionId !== _subsFilterId)))
    } else {
      localStorage.removeItem(SUBS_KEY)
    }
  } catch {}
  renderSubsContent()
  toast('Submissions cleared', '🗑')
}

function exportSubmissionsCSV() {
  const subs = _loadSubs(_subsFilterId)
  if (!subs.length) return toast('No submissions to export', '⚠️')
  const keys = [...new Set(subs.flatMap(s => Object.keys(s).filter(k => !k.startsWith('_'))))]
  const header = [...keys, 'submittedAt'].join(',')
  const rows = subs.map(s => [...keys.map(k => `"${String(s[k]||'').replace(/"/g,'""')}"`), `"${s._submittedAt||''}"`].join(','))
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'form-submissions.csv'; a.click()
  URL.revokeObjectURL(url)
  toast('Exported CSV', '⬇')
}
