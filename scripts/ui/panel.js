/* panel.js Phase 6 */

function renderPanel() {
  const sec = S.sections.find(s=>s.id===S.selected)
  renderEditP(sec)
}
function renderEditP(sec) {
  const el=document.getElementById('ppanel-edit')
  if(!sec){el.innerHTML='<div class="p-empty"><div class="p-empty-icon">🎛</div><p>Select a section to edit</p></div>';return}
  // Custom edit panels
  if (sec.type === 'form-builder') { renderFormBuilderPanel(sec); return }
  // Stage 15: Smart HTML visual editor
  if (sec.type === 'custom-html') { _renderSmartHtmlPanel(sec, el); return }
  const schema=ES[sec.type]||[]
  el.innerHTML=schema.map(grp=>`<div class="prop-group"><div class="prop-group-label">${grp.g}</div>${grp.f.map(f=>renderPF(f,sec)).join('')}</div>`).join('')
  el.querySelectorAll('[data-pk]').forEach(inp=>{
    inp.addEventListener('input',()=>{ setProp(sec.id,inp.dataset.pk,inp.value); const ce=document.querySelector(`[contenteditable][data-id="${sec.id}"][data-key="${inp.dataset.pk}"]`); if(ce&&ce!==document.activeElement)ce.innerText=inp.value })
    inp.addEventListener('change',()=>setProp(sec.id,inp.dataset.pk,inp.value,true))
  })
  el.querySelectorAll('[data-open-img]').forEach(btn=>btn.addEventListener('click',()=>openModal(sec.id,btn.dataset.openImg)))
}

function _renderSmartHtmlPanel(sec, el) {
  const hasParams = sec.props._params && Object.keys(sec.props._params).length > 0
  if (!hasParams) {
    // No params yet — show parse button + raw code fallback
    el.innerHTML = `
      <div class="prop-group">
        <div class="prop-group-label">🪄 Smart Editor</div>
        <div style="background:rgba(108,99,255,.08);border:1px solid rgba(108,99,255,.2);border-radius:10px;padding:14px;margin-bottom:12px">
          <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px">Auto-detect editable fields</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:10px;line-height:1.6">Click below and PageCraft will read your HTML and show all texts, colors, images, and links as visual controls — no coding needed.</div>
          <button id="smart-parse-btn" style="width:100%;padding:9px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-size:12px;font-weight:700;cursor:pointer">🔍 Detect Editable Fields</button>
        </div>
      </div>
      <div class="prop-group">
        <div class="prop-group-label">Raw Code</div>
        <div class="prop-row"><label>HTML / CSS / JS</label><textarea class="prop-textarea" data-pk="code" rows="6">${e(sec.props.code||'')}</textarea></div>
        <div class="prop-row"><label>Min Height (px)</label><input class="prop-input" data-pk="minHeight" value="${e(sec.props.minHeight||'')}" /></div>
      </div>`
    el.querySelector('#smart-parse-btn')?.addEventListener('click', () => {
      _smartParseSec(sec)
    })
    el.querySelectorAll('[data-pk]').forEach(inp => {
      inp.addEventListener('input', () => setProp(sec.id, inp.dataset.pk, inp.value))
      inp.addEventListener('change', () => setProp(sec.id, inp.dataset.pk, inp.value, true))
    })
    return
  }

  // Has params — render visual editor grouped by type
  const params = sec.props._params
  const groups = { text: [], color: [], image: [], link: [], size: [] }
  Object.entries(params).forEach(([key, p]) => { if (groups[p.type]) groups[p.type].push([key, p]) })

  const groupHTML = (title, icon, items, renderFn) => {
    if (!items.length) return ''
    return `<div class="prop-group">
      <div class="prop-group-label">${icon} ${title}</div>
      ${items.map(([key, p]) => renderFn(key, p)).join('')}
    </div>`
  }

  el.innerHTML = `
    <div style="display:flex;gap:6px;padding:10px 12px;background:var(--surface2);border-bottom:1px solid var(--border);flex-wrap:wrap">
      <button id="smart-reparse-btn" style="flex:1;padding:6px 10px;border-radius:7px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:10px;font-weight:700;cursor:pointer" title="Re-scan HTML for fields">↻ Re-scan</button>
      <button id="smart-rawcode-btn" style="flex:1;padding:6px 10px;border-radius:7px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:10px;font-weight:700;cursor:pointer" title="Edit raw HTML">⟨/⟩ Code</button>
    </div>
    ${groupHTML('Texts', '✏️', groups.text, (key, p) => `
      <div class="prop-row">
        <label style="font-size:10px">${p.label}</label>
        <input class="prop-input" data-spk="${key}" value="${e(p.value)}" placeholder="${p.label}" />
      </div>`)}
    ${groupHTML('Colors', '🎨', groups.color, (key, p) => `
      <div class="prop-row">
        <label style="font-size:10px">${p.label}</label>
        <div class="color-row">
          <input type="color" class="color-swatch" data-spk="${key}" value="${_toHex(p.value)}" />
          <input type="text" class="prop-input" data-spk="${key}" value="${e(p.value)}" />
        </div>
      </div>`)}
    ${groupHTML('Images', '🖼', groups.image, (key, p) => `
      <div class="prop-row">
        <label style="font-size:10px">${p.label}</label>
        <div class="img-field">
          ${p.value ? `<img class="img-thumb" src="${e(p.value)}" onerror="this.style.display='none'" />` : `<div class="img-thumb-empty"><span style="font-size:22px">🖼</span></div>`}
          <button class="img-replace-btn" data-simg="${key}">📂 Replace</button>
        </div>
        <input class="prop-input" data-spk="${key}" value="${e(p.value)}" placeholder="Image URL…" style="font-size:11px;margin-top:4px" />
      </div>`)}
    ${groupHTML('Links', '🔗', groups.link, (key, p) => `
      <div class="prop-row">
        <label style="font-size:10px">${p.label}</label>
        <input class="prop-input" data-spk="${key}" value="${e(p.value)}" placeholder="https://…" />
      </div>`)}
    ${groupHTML('Font Sizes', '📏', groups.size, (key, p) => `
      <div class="prop-row">
        <label style="font-size:10px">${p.label}</label>
        <div style="display:flex;gap:6px;align-items:center">
          <input type="range" min="8" max="120" value="${p.value}" data-spk="${key}" style="flex:1;accent-color:var(--accent)" />
          <span style="font-size:11px;color:var(--text);min-width:36px">${p.value}${p.unit}</span>
        </div>
      </div>`)}`

  // Wire events
  el.querySelectorAll('[data-spk]').forEach(inp => {
    inp.addEventListener('input', () => {
      const key = inp.dataset.spk
      const newVal = inp.type === 'range' ? inp.value : inp.value
      // Sync sibling inputs with same key
      el.querySelectorAll(`[data-spk="${key}"]`).forEach(s => { if (s !== inp) s.value = newVal })
      // Update range label
      if (inp.type === 'range') {
        const next = inp.nextElementSibling
        if (next) {
          const unit = sec.props._params[key]?.unit || 'px'
          next.textContent = newVal + unit
        }
      }
      sec.props._params[key].value = newVal
      // Re-render section
      const canEl = document.querySelector(`.section-wrapper[data-id="${sec.id}"] .sec-content`)
      if (canEl) canEl.innerHTML = R['custom-html'](sec.props, sec.id).replace(/^<div[^>]*>|<\/div>$/,'')
      // Directly update the canvas wrapper
      _refreshCustomHtml(sec.id)
      scheduleAutoSave()
    })
  })
  el.querySelectorAll('[data-simg]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.simg
      openModal(sec.id, '_simg_' + key)
      // Override media lib callback temporarily
      window._smgCallback = (url) => {
        sec.props._params[key].value = url
        _refreshCustomHtml(sec.id)
        renderEditP(sec)
      }
    })
  })
  el.querySelector('#smart-reparse-btn')?.addEventListener('click', () => _smartParseSec(sec))
  el.querySelector('#smart-rawcode-btn')?.addEventListener('click', () => {
    // Show raw code modal
    const code = sec.props.code || ''
    const html = `<div style="padding:16px">
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px">Raw HTML Code</div>
      <textarea id="raw-code-ta" style="width:100%;height:300px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:monospace;font-size:12px;padding:10px;box-sizing:border-box;resize:vertical">${e(code)}</textarea>
      <div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end">
        <button onclick="document.getElementById('raw-edit-overlay').remove()" style="padding:7px 14px;border-radius:7px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;cursor:pointer">Cancel</button>
        <button id="raw-apply-btn" style="padding:7px 14px;border-radius:7px;border:none;background:var(--accent);color:#fff;font-size:12px;font-weight:700;cursor:pointer">Apply & Re-detect</button>
      </div>
    </div>`
    const ov = document.createElement('div')
    ov.id = 'raw-edit-overlay'
    ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);z-index:4000;display:flex;align-items:center;justify-content:center'
    ov.innerHTML = `<div style="background:var(--surface);border-radius:14px;width:580px;max-width:95vw;max-height:90vh;overflow:auto">${html}</div>`
    document.body.appendChild(ov)
    ov.querySelector('#raw-apply-btn')?.addEventListener('click', () => {
      const newCode = ov.querySelector('#raw-code-ta')?.value || ''
      sec.props.code = newCode
      ov.remove()
      _smartParseSec(sec)
    })
  })
}

function _smartParseSec(sec) {
  const code = sec.props.code || ''
  if (!code.trim()) { toast('No HTML code in this section', '⚠️'); return }
  try {
    const { template, params } = HTMLParamEngine.parse(code)
    const count = Object.keys(params).length
    if (!count) { toast('No editable fields detected', 'ℹ️'); return }
    sec.props._template = template
    sec.props._params   = params
    _refreshCustomHtml(sec.id)
    renderEditP(sec)
    toast(`${count} editable fields detected!`, '🎉')
    scheduleAutoSave()
  } catch(err) {
    toast('Parse error: ' + err.message, '⚠️')
  }
}

function _refreshCustomHtml(id) {
  const sec = S.sections.find(s => s.id === id)
  if (!sec) return
  const wrapper = document.querySelector(`.section-wrapper[data-id="${id}"] .sec-content`)
  if (wrapper) {
    wrapper.innerHTML = R['custom-html'](sec.props, id)
    _runInlineScripts(wrapper, id)
  }
}

function _toHex(color) {
  if (!color) return '#000000'
  if (color.startsWith('#')) {
    // Normalize 3-char hex to 6-char
    if (color.length === 4) return '#' + color[1]+color[1]+color[2]+color[2]+color[3]+color[3]
    return color.slice(0,7)
  }
  // rgb → hex
  try {
    const m = color.match(/rgb[a]?\((\d+),\s*(\d+),\s*(\d+)/)
    if (m) return '#' + [m[1],m[2],m[3]].map(v => (+v).toString(16).padStart(2,'0')).join('')
  } catch {}
  return '#000000'
}
function renderPF(f,sec) {
  const val=sec.props[f.k]??''
  const _aib = (pk,lbl) => `<button class="ai-btn" onclick="AIGen.openForField('${sec.id}','${pk}','${e(lbl)}')" title="Generate with AI">✦ AI</button>`
  if(f.t==='img'){const th=val||'';return`<div class="prop-row"><label>${f.l}</label><div class="img-field">${th?`<img class="img-thumb" src="${e(th)}" onerror="this.style.display='none'"/>`:`<div class="img-thumb-empty"><span style="font-size:22px">🖼</span><span>No image</span></div>`}<button class="img-replace-btn" data-open-img="${f.k}">📂 Upload / Replace</button></div><input class="prop-input" data-pk="${f.k}" value="${e(th)}" placeholder="Or paste URL…" style="font-size:11px;margin-top:4px;"/></div>`}
  if(f.t==='textarea')return`<div class="prop-row"><label>${f.l}${_aib(f.k,f.l)}</label><textarea class="prop-textarea" data-pk="${f.k}" rows="3">${e(val)}</textarea></div>`
  if(f.t==='select')return`<div class="prop-row"><label>${f.l}</label><select class="prop-select" data-pk="${f.k}">${f.o.map(o=>`<option value="${o}"${val===o?' selected':''}>${o}</option>`).join('')}</select></div>`
  return`<div class="prop-row"><label>${f.l}${_aib(f.k,f.l)}</label><input class="prop-input" data-pk="${f.k}" value="${e(val)}" placeholder="${f.l}"/></div>`
}

/* ══════════════════════════════════════════════════════
   MEDIA LIBRARY
══════════════════════════════════════════════════════ */
const MediaLib = (() => {
  const KEY    = 'pc_media_v1'
  const MAX_MB = 8
  let _filter  = 'all'
  let _selected = null   // id of selected asset in standalone modal

  // ── Storage ───────────────────────────────────────────────────────────────
  function _load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
  }
  function _save(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)) } catch {
      toast('Storage full — delete some assets first','⚠️')
    }
  }

  // ── Add a File to the library ─────────────────────────────────────────────
  function addFile(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) return reject(new Error('Not an image'))
      if (file.size > MAX_MB * 1024 * 1024) return reject(new Error(`Max ${MAX_MB}MB`))
      const reader = new FileReader()
      reader.onload = ev => {
        const src  = ev.target.result
        const img  = new Image()
        img.onload = () => {
          const items = _load()
          const asset = {
            id:         'ml_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
            name:       file.name,
            size:       file.size,
            type:       file.type,
            src,
            width:      img.naturalWidth,
            height:     img.naturalHeight,
            uploadedAt: new Date().toISOString(),
          }
          items.unshift(asset)
          _save(items)
          resolve(asset)
        }
        img.src = src
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // ── Delete asset ──────────────────────────────────────────────────────────
  function deleteAsset(id) {
    _save(_load().filter(a => a.id !== id))
    if (_selected === id) _selected = null
    renderGrid()
    renderInlinePicker()
    _updateStats()
  }

  // ── Format file size ──────────────────────────────────────────────────────
  function _fmtSize(bytes) {
    if (bytes < 1024)       return bytes + 'B'
    if (bytes < 1024*1024)  return (bytes/1024).toFixed(0) + 'KB'
    return (bytes/1024/1024).toFixed(1) + 'MB'
  }

  // ── Filter helper ─────────────────────────────────────────────────────────
  function _filtered() {
    const q = (document.getElementById('ml-search')?.value || '').trim().toLowerCase()
    return _load().filter(a => {
      if (_filter !== 'all' && !a.type.startsWith(_filter)) return false
      if (q && !a.name.toLowerCase().includes(q)) return false
      return true
    })
  }

  // ── Render standalone modal grid ──────────────────────────────────────────
  function renderGrid() {
    const el = document.getElementById('ml-grid')
    if (!el) return
    const items = _filtered()
    if (!items.length) {
      el.innerHTML = `<div class="ml-empty" style="grid-column:1/-1">
        <div class="ml-empty-icon">🖼</div>
        <div class="ml-empty-text">No assets yet</div>
        <div class="ml-empty-sub">Upload images to reuse them across all sections</div>
      </div>`
      return
    }
    el.innerHTML = items.map(a => `
      <div class="ml-asset${_selected===a.id?' selected':''}" onclick="MediaLib.selectAsset('${a.id}')">
        <img src="${a.src}" alt="${e(a.name)}" loading="lazy"/>
        <div class="ml-asset-overlay">
          <div class="ml-asset-name">${e(a.name)}</div>
          <div class="ml-asset-meta">${a.width}×${a.height} · ${_fmtSize(a.size)}</div>
        </div>
        <button class="ml-asset-del" onclick="event.stopPropagation();MediaLib.deleteAsset('${a.id}')" title="Delete">✕</button>
      </div>`).join('')
    _updateStats()
  }

  // ── Render inline picker (inside image modal) ─────────────────────────────
  function renderInlinePicker() {
    const el = document.getElementById('iml-grid')
    if (!el) return
    const q = (document.getElementById('iml-search')?.value || '').trim().toLowerCase()
    const items = _load().filter(a => !q || a.name.toLowerCase().includes(q))
    if (!items.length) {
      el.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--muted);font-size:11px">
        No media yet — upload an image to save it here</div>`
      return
    }
    el.innerHTML = items.map(a => `
      <div class="iml-asset" onclick="MediaLib.pickAsset('${a.id}')" title="${e(a.name)}">
        <img src="${a.src}" alt="${e(a.name)}" loading="lazy"/>
      </div>`).join('')
  }

  // ── Select asset in standalone modal ──────────────────────────────────────
  function selectAsset(id) {
    _selected = id
    renderGrid()
    const btn = document.getElementById('ml-use-btn')
    if (btn) btn.classList.add('show')
  }

  // ── Use selected asset (from standalone modal into section) ───────────────
  function useSelected() {
    if (!_selected) return
    const asset = _load().find(a => a.id === _selected)
    if (!asset) return
    if (S.imgTarget) {
      prevImg(asset.src)
      closeMediaLib()
      document.getElementById('img-modal')?.classList.remove('hidden')
    } else {
      toast('Open an image picker first, then browse My Media', '💡')
    }
  }

  // ── Pick asset from inline picker (inside image modal) ───────────────────
  function pickAsset(id) {
    const asset = _load().find(a => a.id === id)
    if (!asset) return
    prevImg(asset.src)
  }

  // ── Upload multiple files ─────────────────────────────────────────────────
  async function uploadFiles(files) {
    let ok = 0
    for (const f of files) {
      try { await addFile(f); ok++ } catch(err) { toast(err.message, '⚠️') }
    }
    if (ok) {
      renderGrid()
      renderInlinePicker()
      toast(`${ok} image${ok>1?'s':''} uploaded`, '🖼')
    }
  }

  // ── Drop handler ──────────────────────────────────────────────────────────
  function onDrop(ev) {
    ev.preventDefault()
    document.getElementById('ml-drop-zone')?.classList.remove('dragover')
    const files = Array.from(ev.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (!files.length) return toast('Drop image files only', '⚠️')
    uploadFiles(files)
  }

  // ── Filter tab ────────────────────────────────────────────────────────────
  function setFilter(f, btn) {
    _filter = f
    document.querySelectorAll('.ml-filter-btn').forEach(b => b.classList.remove('active'))
    if (btn) btn.classList.add('active')
    renderGrid()
  }

  // ── Stats label ──────────────────────────────────────────────────────────
  function _updateStats() {
    const el = document.getElementById('ml-stats')
    if (!el) return
    const all = _load()
    const totalSize = all.reduce((s,a) => s+a.size, 0)
    el.textContent = `${all.length} asset${all.length!==1?'s':''} · ${_fmtSize(totalSize)} used`
  }

  return { addFile, deleteAsset, renderGrid, renderInlinePicker, selectAsset, useSelected, pickAsset, uploadFiles, onDrop, setFilter, _fmtSize }
})()

// ── Open / close standalone Media Library ─────────────────────────────────────
function openMediaLib(forPicker) {
  document.getElementById('ml-modal').classList.remove('hidden')
  MediaLib.renderGrid()
}
function closeMediaLib() {
  document.getElementById('ml-modal').classList.add('hidden')
}

// ── Tab switcher inside image picker modal ────────────────────────────────────
function switchImgTab(tab, btn) {
  document.querySelectorAll('.img-modal-tab').forEach(t => t.classList.remove('active'))
  document.querySelectorAll('.img-tab-pane').forEach(p => p.classList.remove('active'))
  if (btn) btn.classList.add('active')
  const pane = document.getElementById('img-pane-' + tab)
  if (pane) pane.classList.add('active')
  if (tab === 'stock') {
    document.getElementById('stock-grid').innerHTML = STOCK.map(u =>
      `<img class="stock-img" src="${u}" loading="lazy" onclick="prevImg('${u}')"/>`).join('')
  }
  if (tab === 'media') MediaLib.renderInlinePicker()
}

/* ══════════════════════════════════════════════════════
   IMAGE MODAL
══════════════════════════════════════════════════════ */
const STOCK=['https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=75','https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=75','https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=75','https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=75','https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=75','https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=75','https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=75','https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=75']
function openModal(sid,key){
  S.imgTarget={sid,key}; S.pendingImg=null
  document.getElementById('url-inp').value=''
  document.getElementById('modal-prev').classList.remove('show')
  // Reset to upload tab
  switchImgTab('upload', document.querySelector('.img-modal-tab'))
  document.getElementById('img-modal').classList.remove('hidden')
}
function closeModal(){document.getElementById('img-modal').classList.add('hidden');S.imgTarget=null;S.pendingImg=null}
function prevImg(url){S.pendingImg=url;document.getElementById('modal-prev-img').src=url;document.getElementById('modal-prev').classList.add('show')}
function applyURL(){
  const url=document.getElementById('url-inp').value.trim()
  if(!url)return
  if(!Security.limiters.applyURL())return toast('Too many URL requests — wait a moment','⚠️')
  const safe=Security.sanitizeURL(url)
  if(safe==='#')return toast('Blocked: unsafe or invalid URL','⚠️')
  prevImg(safe)
}
function cancelPrev(){document.getElementById('modal-prev').classList.remove('show');S.pendingImg=null}
function applyImg(){if(!S.pendingImg||!S.imgTarget)return;setProp(S.imgTarget.sid,S.imgTarget.key,S.pendingImg,true);renderPanel();closeModal();toast('Image updated','🖼')}
function onImgFileInput(inp) {
  const f = inp.files[0]; if(!f) return
  if(f.size > 10*1024*1024) return toast('Max 10MB','⚠️')
  // Auto-save to Media Library, then preview
  MediaLib.addFile(f)
    .then(asset => { prevImg(asset.src); MediaLib.renderInlinePicker() })
    .catch(() => {
      // Fallback: read directly without saving
      const r = new FileReader(); r.onload = ev => prevImg(ev.target.result); r.readAsDataURL(f)
    })
}
function onImgFileDrop(ev) {
  ev.preventDefault(); document.getElementById('drop-zone').classList.remove('da')
  const f = ev.dataTransfer.files[0]
  if(!f || !f.type.startsWith('image/')) return toast('Drop an image file','⚠️')
  MediaLib.addFile(f)
    .then(asset => { prevImg(asset.src); MediaLib.renderInlinePicker() })
    .catch(() => {
      const r = new FileReader(); r.onload = ev2 => prevImg(ev2.target.result); r.readAsDataURL(f)
    })
}

/* ══════════════════════════════════════════════════════
   DEVICE / MODE / TABS / MISC
══════════════════════════════════════════════════════ */
// Live preview removed — keep stub so callers don't throw
function scheduleLive() {}

function setDevice(d){
  RESP.customWidth = null
  const fr = document.getElementById('canvas-frame')
  if (fr) { fr.style.maxWidth = ''; fr.style.margin = '' }
  S.device = d
  fr.className = 'canvas-frame' + (d !== 'desktop' ? ' ' + d : '')
  document.querySelectorAll('.dev-btn').forEach(b => b.classList.toggle('active', b.dataset.d === d))
  // Responsive panel device buttons
  document.querySelectorAll('.dp-btn').forEach(b => b.classList.toggle('active', b.dataset.d === d))
  if (typeof updateCanvasBadge === 'function') updateCanvasBadge()
  else document.getElementById('canvas-badge').textContent = {desktop:'Desktop — 920px',tablet:'Tablet — 768px',mobile:'Mobile — 375px'}[d]
  if (typeof updateRuler === 'function') updateRuler()
  renderCanvas()
}
function setMode(m){
  S.mode=m
  document.getElementById('mode-edit').classList.toggle('active',m==='edit')
  document.getElementById('mode-preview').classList.toggle('active',m==='preview')

  // Toggle full-width preview: hide sidebar, panel, inspector
  document.body.classList.toggle('builder-preview', m === 'preview')

  // Force all sections to re-render so preview ↔ edit always match exactly
  if (typeof RenderEngine !== 'undefined') RenderEngine.invalidateAll()

  renderCanvas()

  if(m==='preview' && typeof UXGuide!=='undefined') UXGuide.markPreviewed()
  else if(typeof UXGuide!=='undefined') UXGuide.update()
  if (typeof VisualInspector !== 'undefined') {
    m === 'preview' ? VisualInspector.hide() : (S.selected ? VisualInspector.show(S.selected) : VisualInspector.hide())
  }
}
function switchSTab(id){
  // Normalise: 'components' → 'blocks' (merged into Add tab)
  if (id === 'components') id = 'blocks'
  const all = ['blocks','layers','pages','suggest','navigator']
  document.querySelectorAll('.tabs .tab').forEach((t,i) => t.classList.toggle('active', all[i] === id))
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + id))
  if (id === 'suggest')   renderSuggestTab()
  if (id === 'pages')     renderPagesPanel()
  if (id === 'navigator' && typeof Navigator !== 'undefined') Navigator.refresh()
  // Show search bar only on Add tab
  const sb = document.querySelector('.sidebar')
  if (sb) sb.classList.toggle('sst-active', id === 'blocks')
  document.getElementById('section-search-wrap').style.display = id === 'blocks' ? '' : 'none'
  // Reset search when switching away
  if (id !== 'blocks') {
    const inp = document.getElementById('section-search-input')
    if (inp && inp.value) { inp.value = ''; filterSections('') }
  }
}
function switchPTab(id) {
  // Legacy shim — panel now has only one pane (edit)
  S.panelTab = id
}
function onSecClick(ev,id){
  if(ev.target.isContentEditable)return
  // Stage 15: Shift+Click → Bulk select
  if(typeof BulkActions!=='undefined' && (ev.shiftKey || BulkActions.isActive())){
    BulkActions.toggleSection(id)
    renderCanvas()
    return
  }
  selectSection(id)
}
function scrollToSection(id){setTimeout(()=>document.querySelector(`.section-wrapper[data-id="${id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),80)}
function clearAll(){if(S.sections.length&&!confirm('Clear all sections?'))return;pushH('Clear all');S.sections=[];S.selected=null;localStorage.removeItem('pc_previewed_v1');localStorage.removeItem('pc_exported_v1');renderAll();if(typeof UXGuide!=='undefined')UXGuide.update();toast('Cleared','🗑')}
