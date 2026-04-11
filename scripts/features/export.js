/* EXPORT SYSTEM
══════════════════════════════════════════════════════ */

// ── Strip builder-only attributes ────────────────────────────────────────────
function strip(html) {
  return html
    .replace(/\s+contenteditable="true"/g, '')
    .replace(/\s+data-id="[^"]*"/g, '')
    .replace(/\s+data-key="[^"]*"/g, '')
    .replace(/class="img-editable[^"]*"/g, '')
    .replace(/<div class="img-overlay"[\s\S]*?<\/div>/g, '')
    .replace(/onclick="openModal\([^)]*\)"/g, '')
}

// ── Page stats ────────────────────────────────────────────────────────────────
function calcStats() {
  const secs   = S.sections.length
  const rawBody= S.sections.map(s => { try { return R[s.type](s.props, s.id) } catch { return '' } }).join('')
  const text   = rawBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const words  = text ? text.split(' ').filter(Boolean).length : 0
  const imgs   = (rawBody.match(/<img /g) || []).length
  const htmlStr= genHTML({ preview:true })
  const size   = Math.round(htmlStr.length / 1024)
  return { secs, words, imgs, size }
}

// ── Full HTML generator ───────────────────────────────────────────────────────
function genHTML(opts = {}) {
  // ── Merge SEO Manager data with export panel overrides ────────────────────
  const _seoD    = (typeof SEOManager !== 'undefined' && opts.pageId)
                   ? SEOManager.getMetaTags(opts.pageId) : {}
  const title     = opts.title     ?? _seoD.title     ?? document.getElementById('exp-seo-title')?.value   ?? document.getElementById('page-title').value ?? 'My Page'
  const desc      = opts.desc      ?? _seoD.description ?? document.getElementById('exp-seo-desc')?.value   ?? ''
  const ogImg     = opts.ogImg     ?? _seoD.ogImage   ?? document.getElementById('exp-og-img')?.value      ?? ''
  const canonical = opts.canonical ?? _seoD.canonical ?? document.getElementById('exp-canonical')?.value   ?? ''
  const author    = opts.author    ?? _seoD.author    ?? document.getElementById('exp-author')?.value      ?? ''
  const lang      = opts.lang      ?? document.getElementById('exp-lang')?.value        ?? 'en'
  const minify    = opts.preview ? false : (document.getElementById('opt-minify')?.checked ?? true)
  const responsive= opts.preview ? true  : (document.getElementById('opt-responsive')?.checked ?? true)
  const fonts     = opts.preview ? true  : (document.getElementById('opt-fonts')?.checked ?? true)
  const gaId      = (!opts.preview && document.getElementById('opt-analytics')?.checked)
                    ? (document.getElementById('opt-analytics-id')?.value.trim() || '') : ''

  const _srcSections = opts.sections || S.sections
  const _rawBody = _srcSections.map(s => {
    try {
      let html = R[s.type](s.props, s.id)
      // Inject animation targeting attr when animations active
      if (ANIM.enabled) html = stripForExport(html, s.id)
      // Inject semantic section-id marker for OutputEngine to convert to id="type"
      html = html.replace(/^(\s*<(?:section|header|footer|nav)(?:\s[^>]*)?)>/, `$1 data-pc-type="${s.type}">`)
      return html
    } catch { return '' }
  }).join('\n')

  // Run OutputEngine pipeline: strip → sectionIds → extractCSS → images → links → a11y
  const _processed   = (typeof OutputEngine !== 'undefined')
    ? OutputEngine.process(_rawBody, { minify, title, semantic: !opts.preview, preview: opts.preview })
    : { html: strip(_rawBody), extractedCSS: '' }
  const bodyHTML     = _processed.html
  const extractedCSS = _processed.extractedCSS

  const animRuntime = genAnimRuntime()

  // ── Global Styles (merged into allCSS — no extra <style> tag) ───────────
  const gsCSS = (typeof GlobalStyles !== 'undefined') ? GlobalStyles.genCSS() : ''

  // ── Base CSS ──────────────────────────────────────────────────────────────
  const _gsCfg = (typeof GlobalStyles !== 'undefined') ? GlobalStyles.load() : {}
  const _bodyFont = _gsCfg.fontBody && _gsCfg.fontBody !== 'system-ui' ? `'${_gsCfg.fontBody}',` : (fonts ? "'Inter'," : '')
  const baseCSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:${_bodyFont}system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{transition:opacity .15s}
details summary{cursor:pointer}
details summary::-webkit-details-marker{display:none}`.trim()

  // ── Responsive CSS — generated from RESP state ─────────────────────────────
  const responsiveCSS = responsive ? genResponsiveCSS() : ''

  const _cssMinRe = /\n\s*/g
  const allCSS = (baseCSS + (gsCSS ? '\n' + gsCSS : '') + responsiveCSS + (extractedCSS ? '\n' + extractedCSS : ''))
    .replace(_cssMinRe, minify ? '' : '\n  ')

  // ── SEO meta tags (merging SEOManager + export panel) ────────────────────
  const _robots   = _seoD.robots    || 'index,follow'
  const _ogTitle  = _seoD.ogTitle   || title
  const _ogDesc   = _seoD.ogDesc    || desc
  const _ogUrl    = _seoD.ogUrl     || canonical
  const _ogType   = _seoD.ogType    || 'website'
  const _ogSite   = _seoD.ogSiteName || ''
  const _twCard   = _seoD.twCard    || (ogImg ? 'summary_large_image' : 'summary')
  const _twTitle  = _seoD.twTitle   || _ogTitle
  const _twDesc   = _seoD.twDesc    || _ogDesc
  const _twImage  = _seoD.twImage   || ogImg
  const _twSite   = _seoD.twSite    || ''
  // JSON-LD
  const _schemaBlocks = []
  if (_seoD.schemaOrgName) _schemaBlocks.push(JSON.stringify({'@context':'https://schema.org','@type':'Organization',name:_seoD.schemaOrgName,url:_seoD.schemaOrgUrl||undefined,logo:_seoD.schemaOrgLogo?{'@type':'ImageObject',url:_seoD.schemaOrgLogo}:undefined,description:_seoD.schemaOrgDesc||undefined}))
  if (_seoD.schemaWpName)  _schemaBlocks.push(JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:_seoD.schemaWpName,url:_seoD.schemaWpUrl||undefined,description:_seoD.schemaWpDesc||undefined}))
  const sc2 = 'scr'+'ipt'
  const schemaTag = _schemaBlocks.length ? _schemaBlocks.map(b=>`<${sc2} type="application/ld+json">${b}</${sc2}>`).join('\n') : ''

  const nl  = minify ? '' : '\n'
  const ind = minify ? '' : '  '

  const metaTags = [
    `<meta charset="UTF-8"/>`,
    `<meta name="viewport" content="width=device-width,initial-scale=1.0"/>`,
    `<title>${e(title)}</title>`,
    desc      ? `<meta name="description" content="${e(desc)}"/>` : '',
    author    ? `<meta name="author" content="${e(author)}"/>` : '',
    `<meta name="robots" content="${e(_robots)}"/>`,
    canonical ? `<link rel="canonical" href="${e(canonical)}"/>` : '',
    // Open Graph
    `<meta property="og:title" content="${e(_ogTitle)}"/>`,
    _ogDesc   ? `<meta property="og:description" content="${e(_ogDesc)}"/>` : '',
    ogImg     ? `<meta property="og:image" content="${e(ogImg)}"/>` : '',
    _ogUrl    ? `<meta property="og:url" content="${e(_ogUrl)}"/>` : '',
    `<meta property="og:type" content="${e(_ogType)}"/>`,
    _ogSite   ? `<meta property="og:site_name" content="${e(_ogSite)}"/>` : '',
    // Twitter Card
    `<meta name="twitter:card" content="${e(_twCard)}"/>`,
    `<meta name="twitter:title" content="${e(_twTitle)}"/>`,
    _twDesc   ? `<meta name="twitter:description" content="${e(_twDesc)}"/>` : '',
    _twImage  ? `<meta name="twitter:image" content="${e(_twImage)}"/>` : '',
    _twSite   ? `<meta name="twitter:site" content="${e(_twSite)}"/>` : '',
    schemaTag,
  ].filter(Boolean).join(minify ? '' : '\n  ')

  // ── Font link ─────────────────────────────────────────────────────────────
  const _fontFamily = _gsCfg.fontBody && _gsCfg.fontBody !== 'system-ui'
    ? encodeURIComponent(_gsCfg.fontBody)
    : 'Inter'
  const fontLink = fonts
    ? [
        `<link rel="preconnect" href="https://fonts.googleapis.com"/>`,
        `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>`,
        `<link href="https://fonts.googleapis.com/css2?family=${_fontFamily}:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>`,
      ].join(`\n${ind}`)
    : ''

  // ── LCP preload — hero background image ──────────────────────────────────
  const _heroBg = _srcSections.find(s => s.type === 'hero')?.props?.bgImage || ''
  const heroPreload = _heroBg
    ? `<link rel="preload" href="${_heroBg}" as="image" fetchpriority="high"/>`
    : ''

  // ── Analytics ─────────────────────────────────────────────────────────────
  let analyticsScript = ''
  if (gaId) {
    const sc = 'scr'+'ipt'
    if (gaId.startsWith('G-') || gaId.startsWith('UA-')) {
      analyticsScript = `\n<${sc} async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></${sc}>\n<${sc}>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}')</${sc}>`
    } else {
      analyticsScript = `\n<${sc} defer data-domain="${gaId}" src="https://plausible.io/js/plausible.js"></${sc}>`
    }
  }

  // ── Custom CSS plugin ─────────────────────────────────────────────────────
  const _cssPl   = typeof PLUGIN_REGISTRY !== 'undefined' && PLUGIN_REGISTRY.find(p => p.id === 'custom-css')
  const customCSS = (_cssPl && PluginManager.isInstalled('custom-css') && PluginManager.isEnabled('custom-css'))
                    ? (_cssPl._css || '') : ''

  // Include Three.js in export if any 3D sections exist
  const has3D = _srcSections.some(s => s.type.startsWith('scene-'))
  const sc = 'scr'+'ipt'
  const threeJS = has3D
    ? `<${sc} src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></${sc}>`
    : ''

  // ── E-commerce cart system for export ────────────────────────────────────
  const hasShop = _srcSections.some(s => s.type === 'product-grid')
  let cartExportHTML = ''
  let cartExportJS = ''
  if (hasShop) {
    const _products = (() => { try { return JSON.parse(localStorage.getItem('pc_products_v1')||'[]') } catch { return [] } })()
    const _cur = e(_srcSections.find(s=>s.type==='product-grid')?.props?.currency || '$')
    const _ac  = _srcSections.find(s=>s.type==='product-grid')?.props?.accentColor || '#6c63ff'
    cartExportHTML = `
<!-- Cart Drawer -->
<div id="xcd" style="position:fixed;top:0;right:-400px;width:min(400px,100vw);height:100vh;background:#fff;box-shadow:-4px 0 32px rgba(0,0,0,.15);z-index:9999;display:flex;flex-direction:column;transition:right .3s ease;overflow:hidden">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #e2e8f0">
    <h3 style="font-size:18px;font-weight:700;color:#0f172a;margin:0">🛒 Your Cart</h3>
    <button onclick="document.getElementById('xcd').style.right='-400px';document.getElementById('xcbd').style.display='none'" style="background:none;border:none;font-size:22px;cursor:pointer;color:#64748b;padding:4px">×</button>
  </div>
  <div id="xci" style="flex:1;overflow-y:auto;padding:16px 24px"></div>
  <div style="padding:20px 24px;border-top:1px solid #e2e8f0">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <span style="font-weight:600;color:#0f172a">Total:</span>
      <span id="xct" style="font-size:20px;font-weight:800;color:${_ac}">${_cur}0.00</span>
    </div>
    <button onclick="xcCheckout()" style="width:100%;background:${_ac};color:#fff;border:none;padding:14px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">Checkout →</button>
  </div>
</div>
<div id="xcbd" onclick="document.getElementById('xcd').style.right='-400px';this.style.display='none'" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9998"></div>
<button onclick="document.getElementById('xcd').style.right='0';document.getElementById('xcbd').style.display='block'" style="position:fixed;bottom:24px;right:24px;background:${_ac};color:#fff;width:58px;height:58px;border-radius:50%;border:none;font-size:22px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.2);z-index:9997">
  🛒<span id="xcb" style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:none;align-items:center;justify-content:center;padding:0 4px">0</span>
</button>
<!-- Checkout Modal -->
<div id="xcm" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;align-items:center;justify-content:center;padding:20px">
  <div style="background:#fff;border-radius:16px;padding:32px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto">
    <h3 style="font-size:20px;font-weight:800;margin-bottom:24px;color:#0f172a">Checkout</h3>
    <div id="xcod" style="margin-bottom:20px;padding:16px;background:#f8fafc;border-radius:10px;font-size:13px"></div>
    <input id="xcname" placeholder="Full Name" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;margin-bottom:12px;outline:none"/>
    <input id="xcemail" placeholder="Email" type="email" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;margin-bottom:12px;outline:none"/>
    <input id="xcaddr" placeholder="Shipping Address" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;margin-bottom:20px;outline:none"/>
    <div id="xcerr" style="display:none;padding:10px 14px;background:#fee2e2;color:#b91c1c;border-radius:8px;font-size:13px;margin-bottom:12px"></div>
    <div style="display:flex;gap:10px">
      <button onclick="document.getElementById('xcm').style.display='none'" style="flex:1;padding:12px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-size:14px;cursor:pointer">Cancel</button>
      <button onclick="xcPlace()" style="flex:2;padding:12px;background:${_ac};color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">Place Order</button>
    </div>
  </div>
</div>`

    cartExportJS = `
<${sc}>
// ── Exported Cart System ──────────────────────────────────────────────────
var _xcProducts = ${JSON.stringify(_products)};
var _xcItems = [];
var _xcCur = '${_cur}';

function xcAdd(pid, qty) {
  qty = qty||1;
  var ex = _xcItems.find(function(i){return i.id===pid});
  if(ex) ex.qty += qty; else _xcItems.push({id:pid, qty:qty});
  xcUpdate();
}
function xcRemove(pid) {
  _xcItems = _xcItems.filter(function(i){return i.id!==pid});
  xcUpdate();
}
function xcSetQty(pid, qty) {
  qty = parseInt(qty)||0;
  if(qty<=0) xcRemove(pid); else { var ex=_xcItems.find(function(i){return i.id===pid}); if(ex) ex.qty=qty; }
  xcUpdate();
}
function xcTotal() {
  return _xcItems.reduce(function(s,i){
    var p=_xcProducts.find(function(x){return x.id===i.id});
    return s + (p ? (parseFloat(p.price)||0)*i.qty : 0);
  }, 0);
}
function xcUpdate() {
  var cnt = _xcItems.reduce(function(s,i){return s+i.qty},0);
  var badge = document.getElementById('xcb');
  if(badge){ badge.textContent=cnt; badge.style.display=cnt>0?'flex':'none'; }
  var tot = document.getElementById('xct');
  if(tot) tot.textContent = _xcCur + xcTotal().toFixed(2);
  xcRenderItems();
}
function xcRenderItems() {
  var el = document.getElementById('xci'); if(!el) return;
  if(_xcItems.length===0){ el.innerHTML='<p style="text-align:center;color:#94a3b8;padding:40px 0">Your cart is empty</p>'; return; }
  el.innerHTML = _xcItems.map(function(i){
    var p = _xcProducts.find(function(x){return x.id===i.id});
    if(!p) return '';
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f1f5f9">'+
      (p.image?'<img src="'+p.image+'" style="width:56px;height:56px;object-fit:cover;border-radius:8px"/>':'<div style="width:56px;height:56px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">'+(p.icon||'🛍')+'</div>')+
      '<div style="flex:1"><div style="font-weight:600;font-size:14px;color:#0f172a">'+p.name+'</div><div style="color:#64748b;font-size:13px">'+_xcCur+(parseFloat(p.price)||0).toFixed(2)+'</div></div>'+
      '<div style="display:flex;align-items:center;gap:6px">'+
      '<button onclick="xcSetQty(\''+i.id+'\',' +(i.qty-1)+')" style="width:26px;height:26px;border:1px solid #e2e8f0;border-radius:6px;background:#fff;cursor:pointer;font-size:14px">−</button>'+
      '<span style="font-weight:600;min-width:20px;text-align:center">'+i.qty+'</span>'+
      '<button onclick="xcSetQty(\''+i.id+'\',' +(i.qty+1)+')" style="width:26px;height:26px;border:1px solid #e2e8f0;border-radius:6px;background:#fff;cursor:pointer;font-size:14px">+</button>'+
      '</div>'+
      '<button onclick="xcRemove(\''+i.id+'\')" style="background:none;border:none;color:#f87171;cursor:pointer;font-size:16px;padding:4px">×</button>'+
      '</div>';
  }).join('');
}
function xcCheckout() {
  if(_xcItems.length===0) return alert('Your cart is empty');
  document.getElementById('xcd').style.right='-400px';
  document.getElementById('xcbd').style.display='none';
  var od = document.getElementById('xcod');
  if(od) od.innerHTML = _xcItems.map(function(i){
    var p=_xcProducts.find(function(x){return x.id===i.id});
    return '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>'+(p?p.name:'?')+' ×'+i.qty+'</span><span>'+_xcCur+(p?(parseFloat(p.price)||0)*i.qty:0).toFixed(2)+'</span></div>';
  }).join('')+'<div style="border-top:1px solid #e2e8f0;margin-top:8px;padding-top:8px;font-weight:700;display:flex;justify-content:space-between"><span>Total</span><span>'+_xcCur+xcTotal().toFixed(2)+'</span></div>';
  document.getElementById('xcm').style.display='flex';
}
function xcPlace() {
  var name=document.getElementById('xcname').value.trim();
  var email=document.getElementById('xcemail').value.trim();
  var addr=document.getElementById('xcaddr').value.trim();
  var errEl=document.getElementById('xcerr');
  if(!name||!email||!addr){ if(errEl){errEl.textContent='Please fill in all fields';errEl.style.display='block';} return; }
  if(errEl) errEl.style.display='none';
  var order = {id:'ord_'+Date.now(),items:JSON.parse(JSON.stringify(_xcItems)),total:xcTotal(),currency:_xcCur,name:name,email:email,address:addr,date:new Date().toISOString(),status:'pending'};
  try{var ords=JSON.parse(localStorage.getItem('pc_orders_v1')||'[]');ords.unshift(order);localStorage.setItem('pc_orders_v1',JSON.stringify(ords.slice(0,200)));}catch(e){}
  _xcItems=[];
  xcUpdate();
  document.getElementById('xcm').style.display='none';
  alert('🎉 Order placed! Thank you, '+name+'!');
}
// Wire "Add to Cart" buttons (Cart.add alias)
var Cart = { add: xcAdd, remove: xcRemove, setQty: xcSetQty };
</${sc}>`
  }

  const customCSSTag = customCSS ? `${nl}${ind}<style id="custom-css">${nl}${ind}${customCSS}${nl}${ind}</style>` : ''

  // White-label: custom CSS + powered-by badge
  const wlCfg = (() => { try { return JSON.parse(localStorage.getItem('pc_whitelabel_v1') || '{}') } catch { return {} } })()
  const wlCSS  = wlCfg.customCss ? `${nl}${ind}<style id="wl-css">${wlCfg.customCss}</style>` : ''
  const wlBadge = (wlCfg.poweredBy !== false)
    ? `${nl}<a href="${wlCfg.poweredByUrl||'https://pagecraft.dev'}" target="_blank" rel="noopener"
       style="position:fixed;bottom:12px;right:12px;background:rgba(0,0,0,.7);color:#fff;font-size:10px;
              padding:4px 10px;border-radius:20px;text-decoration:none;z-index:9999;backdrop-filter:blur(4px)">
       ${wlCfg.poweredByText||'Built with PageCraft'}</a>`
    : ''

  const _heroPreloadTag = heroPreload ? `${nl}${ind}${heroPreload}` : ''
  let _html = `<!DOCTYPE html>${nl}<html lang="${lang}">${nl}<head>${nl}${ind}${metaTags}${nl}${ind}${fontLink}${_heroPreloadTag}${nl}${ind}<style>${nl}${ind}${allCSS}${nl}${ind}</style>${customCSSTag}${wlCSS}${nl}</head>${nl}<body>${nl}${bodyHTML}${cartExportHTML}${wlBadge}${nl}${threeJS}${nl}${animRuntime}${cartExportJS}${nl}${analyticsScript}${nl}</body>${nl}</html>`
  // ── Hook: export:beforeHTML — plugins may mutate the html string ─────────────
  const _htmlPayload = { html: _html }
  PluginSDK._emit('export:beforeHTML', _htmlPayload)
  return _htmlPayload.html
}

// ── React JSX generator ───────────────────────────────────────────────────────
function genReact() {
  const title = document.getElementById('exp-seo-title')?.value || document.getElementById('page-title').value || 'Page'
  const bodyHTML = S.sections.map(s => {
    try { return strip(R[s.type](s.props, s.id)) } catch { return '' }
  }).join('\n')

  // Escape for JSX template literal
  const escaped = bodyHTML
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${')

  return `// Generated by PageCraft — ${new Date().toLocaleDateString()}
// Paste this into your React project

import React from 'react'

export default function ${title.replace(/[^a-zA-Z0-9]/g,'').replace(/^\d/,'_$&') || 'Page'}() {
  return (
    <div dangerouslySetInnerHTML={{ __html: \`${escaped}\` }} />
  )
}

/*
 * Dependencies: None (pure HTML/CSS injected via dangerouslySetInnerHTML)
 * Tip: For production, extract the inline styles to a CSS file
 *      and add className props for better React integration.
 */
`
}

// ── TypeScript (React TSX) export ─────────────────────────────────────────────
function genTypeScript() {
  const rawTitle = document.getElementById('exp-seo-title')?.value || document.getElementById('page-title').value || 'Page'
  const compName = rawTitle.replace(/[^a-zA-Z0-9]/g,'').replace(/^\d/,'_$&') || 'Page'
  const bodyHTML = S.sections.map(s => {
    try { return strip(R[s.type](s.props, s.id)) } catch { return '' }
  }).join('\n')
  const escaped = bodyHTML.replace(/`/g,'\\`').replace(/\${/g,'\\${')

  // Build section prop interfaces
  const sectionTypes = [...new Set(S.sections.map(s => s.type))]
  const interfaces = sectionTypes.map(t => {
    const props = S.sections.find(s => s.type === t)?.props || {}
    const fields = Object.entries(props).map(([k,v]) => {
      const type = typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string'
      return `  ${k}?: ${type}`
    }).join('\n')
    return `interface ${t.charAt(0).toUpperCase()+t.slice(1)}Props {\n${fields}\n}`
  }).join('\n\n')

  return `// Generated by PageCraft — ${new Date().toLocaleDateString()}
// React + TypeScript component — paste into your TSX project

import React, { FC } from 'react'

${interfaces}

const ${compName}: FC = () => {
  const html = \`${escaped}\`
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

export default ${compName}

/*
 * Usage: import ${compName} from './${compName}'
 * Tip: Extract inline styles to a .module.css for better TypeScript integration.
 */
`
}

// ── Vue 3 SFC export ──────────────────────────────────────────────────────────
function genVue() {
  const rawTitle = document.getElementById('exp-seo-title')?.value || document.getElementById('page-title').value || 'Page'
  const compName = rawTitle.replace(/[^a-zA-Z0-9]/g,'').replace(/^\d/,'_$&') || 'Page'
  const bodyHTML = S.sections.map(s => {
    try { return strip(R[s.type](s.props, s.id)) } catch { return '' }
  }).join('\n')
  const escaped = bodyHTML.replace(/`/g,'\\`').replace(/\${/g,'\\${')
  const seoTitle = document.getElementById('exp-seo-title')?.value || rawTitle
  const seoDesc  = document.getElementById('exp-seo-desc')?.value  || ''
  // Split script tags to avoid breaking the HTML parser
  const SO = '<' + 'script'
  const SC = '</' + 'script>'

  return `<!-- Generated by PageCraft — ${new Date().toLocaleDateString()} -->
<!-- Vue 3 Single File Component — place in your components/ folder -->
<template>
  <div class="pagecraft-page" v-html="pageContent" />
</template>

${SO} setup lang="ts">
import { ref } from 'vue'

const pageTitle = ref(${JSON.stringify(seoTitle)})
const pageDescription = ref(${JSON.stringify(seoDesc)})
const pageContent = \`${escaped}\`
${SC}

<style scoped>
.pagecraft-page {
  font-family: system-ui, sans-serif;
}
</style>

<!--
  Usage: import ${compName} from './${compName}.vue'
  Note: v-html renders raw HTML — make sure content is trusted.
-->
`
}

// ── Svelte export ─────────────────────────────────────────────────────────────
function genSvelte() {
  const rawTitle = document.getElementById('exp-seo-title')?.value || document.getElementById('page-title').value || 'Page'
  const seoTitle = rawTitle
  const seoDesc  = document.getElementById('exp-seo-desc')?.value || ''
  const bodyHTML = S.sections.map(s => {
    try { return strip(R[s.type](s.props, s.id)) } catch { return '' }
  }).join('\n')
  const escaped = bodyHTML.replace(/`/g,'\\`').replace(/\${/g,'\\${')
  const SO = '<' + 'script'
  const SC = '</' + 'script>'

  return `<!-- Generated by PageCraft — ${new Date().toLocaleDateString()} -->
<!-- Svelte component — works with SvelteKit or plain Svelte -->
${SO} lang="ts">
  export let title = ${JSON.stringify(seoTitle)}
  export let description = ${JSON.stringify(seoDesc)}

  const html = \`${escaped}\`
${SC}

<svelte:head>
  <title>{title}</title>
  {#if description}
    <meta name="description" content={description} />
  {/if}
</svelte:head>

<div class="pagecraft-page">
  {@html html}
</div>

<style>
  .pagecraft-page {
    font-family: system-ui, sans-serif;
  }
</style>

<!--
  Usage in SvelteKit: place in src/routes/+page.svelte
  Note: {@html} renders raw HTML — ensure content is trusted.
-->
`
}

// ── ESM export ────────────────────────────────────────────────────────────────
function genESM() {
  const rawTitle = document.getElementById('exp-seo-title')?.value || document.getElementById('page-title').value || 'Page'
  const seoDesc  = document.getElementById('exp-seo-desc')?.value || ''
  const bodyHTML = S.sections.map(s => {
    try { return strip(R[s.type](s.props, s.id)) } catch { return '' }
  }).join('\n')
  const escaped = bodyHTML.replace(/`/g,'\\`').replace(/\${/g,'\\${')

  // Named section exports
  const sectionExports = S.sections.map((s, i) => {
    const varName = `section${i+1}_${s.type}`
    const sectionHTML = (() => { try { return strip(R[s.type](s.props, s.id)) } catch { return '' } })()
    const secEsc = sectionHTML.replace(/`/g,'\\`').replace(/\${/g,'\\${')
    return `export const ${varName} = \`${secEsc}\``
  }).join('\n\n')

  return `// Generated by PageCraft — ${new Date().toLocaleDateString()}
// ES Module — import anywhere (vanilla JS, Astro, Nuxt, etc.)

// ── Page metadata ─────────────────────────────────────────────────────────────
export const pageTitle = ${JSON.stringify(rawTitle)}
export const pageDescription = ${JSON.stringify(seoDesc)}
export const sectionCount = ${S.sections.length}
export const generatedAt = '${new Date().toISOString()}'

// ── Full page HTML ────────────────────────────────────────────────────────────
export const pageHTML = \`${escaped}\`

// ── Individual sections ───────────────────────────────────────────────────────
${sectionExports}

// ── Render helper ─────────────────────────────────────────────────────────────
/**
 * Mount the full page into a container element.
 * @param {HTMLElement|string} target - Element or CSS selector
 */
export function mount(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) throw new Error('PageCraft: target not found')
  el.innerHTML = pageHTML
}

export default { pageTitle, pageDescription, pageHTML, sectionCount, mount }

/*
 * Usage:
 *   import { mount, pageHTML } from './page.js'
 *   mount('#app')
 */
`
}

// ── JSON project save ─────────────────────────────────────────────────────────
function saveProject() {
  if (!AUTH.user) { showAuthGate(); toast('Sign in to save projects','🔒'); return }
  openProjects(); projNav('save')
}

// ── JSON project load (file import — keep for backward compat with old JSON files)
function loadProject(input) {
  const file = input.files[0]; if (!file) return
  input.value = ''
  const reader = new FileReader()
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result)
      const db   = loadAllProjects()

      // Accept pagecraft project bundle or old simple format
      const projects = data.projects || (data.id ? [data] : null)

      if (projects) {
        // Bundle import
        let count = 0
        projects.forEach(prj => {
          if (!prj.sections || !prj.name) return
          const id = projId()
          db[id] = { ...prj, id, userId: AUTH.user?.id || 'guest', updatedAt: new Date().toISOString(), thumbnail: projThumbGradient(prj.sections), sectionCount: prj.sections.length }
          count++
        })
        saveAllProjects(db)
        openProjects()
        toast(`Imported ${count} project(s)`, '📂')
      } else if (Array.isArray(data.sections)) {
        // Old simple format: load directly into canvas
        if (!data.sections.every(s => DEFS[s.type])) throw new Error('Unknown section types')
        if (S.sections.length && !confirm(`Load "${data.name}"?\nUnsaved changes will be lost.`)) return
        pushH('Import: ' + (data.name||'project'))
        const sections = data.sections.map(s=>({...s,id:uid()}))
        // Check if it has pages (v2.0 format)
        if (data.pages && data.pages.length > 0) {
          const activeId = data.activePageId || data.pages[0].id
          const remapped = data.pages.map(pg => ({
            ...pg, id: uid_page(),
            sections: pg.sections.map(s=>({...s,id:uid()})),
          }))
          const origIdx     = data.pages.findIndex(p => p.id === activeId)
          const newActiveId = remapped[origIdx]?.id || remapped[0].id
          const newActivePg = remapped.find(p => p.id === newActiveId) || remapped[0]
          editorStore.setState({
            sections: JSON.parse(JSON.stringify(newActivePg.sections)),
            pages: remapped, activePageId: newActiveId, selected: null,
          }, 'import')
          const t = document.getElementById('page-title'); if (t) t.value = newActivePg.name
        } else {
          const newPageId = uid_page()
          editorStore.setState({
            sections,
            pages: [{ id: newPageId, name: data.name||'Home', sections }],
            activePageId: newPageId, selected: null,
          }, 'import')
          const t = document.getElementById('page-title'); if (t && data.name) t.value = data.name
        }
        renderAll()
        renderPagesPanel()
        renderPagesNavStrip()
        toast(`"${data.name}" loaded`, '📂')
      } else {
        throw new Error('Not a valid PageCraft file')
      }
    } catch(err) { toast('Import failed: ' + err.message, '⚠️') }
  }
  reader.readAsText(file)
}

// ── Component Importer ────────────────────────────────────────────────────────
const ComponentImporter = (() => {
  let _fw = 'auto'
  let _convertedHTML = ''

  // ── Framework detection ──────────────────────────────────────────────────
  function detect(code) {
    if (/<template[\s>]/.test(code) || /v-bind|v-on|v-if|v-for|:class|@click/.test(code)) return 'vue'
    if (/<svelte:|{#if |{#each |{@html/.test(code)) return 'svelte'
    if (/import React|from ['"]react['"]|JSX|\.tsx?['"]|className=/.test(code)) return 'react'
    if (/export default function|export function|const \w+ = \(\) =>/.test(code) && /return\s*\(/.test(code)) return 'react'
    return 'react' // default
  }

  // ── JSX → HTML ───────────────────────────────────────────────────────────
  // ── Detect complex deps that can't convert to static HTML ───────────────
  function detectComplexDeps(code) {
    const complex = [
      { pkg: 'framer-motion',  reason: 'animations require React runtime' },
      { pkg: '@radix-ui',      reason: 'Radix UI needs React' },
      { pkg: 'react-spring',   reason: 'spring animations need React' },
      { pkg: 'react-query',    reason: 'data fetching needs React' },
      { pkg: 'zustand',        reason: 'state management needs React' },
      { pkg: 'use-gesture',    reason: 'gesture hooks need React' },
      { pkg: 'lottie-react',   reason: 'Lottie needs React runtime' },
    ]
    return complex.filter(d => code.includes(d.pkg))
  }

  function jsxToHTML(code) {
    // Check for complex deps first
    const complexDeps = detectComplexDeps(code)
    if (complexDeps.length > 0) {
      const reasons = complexDeps.map(d => `• ${d.pkg}: ${d.reason}`).join('\n')
      return `<!-- ⚠️ This component cannot be converted to static HTML.\n\nDependencies detected:\n${reasons}\n\nThis component needs to run inside a React project.\nSee the Export → React format to use it in a React app. -->`
    }

    let html = code

    // Remove Next.js / React directives
    html = html.replace(/^['"]use client['"];?\s*/gm, '')
    html = html.replace(/^['"]use server['"];?\s*/gm, '')

    // Remove imports
    html = html.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
    html = html.replace(/^import\s+['"][^'"]+['"]\s*;?\s*$/gm, '')

    // Remove TypeScript type declarations
    html = html.replace(/^(?:type|interface)\s+\w+[\s\S]*?^\}/gm, '')
    html = html.replace(/:\s*(?:string|number|boolean|React\.FC|FC|ReactNode|JSX\.Element)[^=\n,)>]*/g, '')

    // Remove export const X = (...) => { or export default function X(...) {
    html = html.replace(/export\s+(?:default\s+)?(?:const|function)\s+\w+\s*(?::\s*\w+)?\s*=?\s*(?:\([^)]*\)\s*(?::\s*\w+)?\s*=>|(?:\([^)]*\))\s*)\s*\{/, '')
    html = html.replace(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/, '')

    // Extract return ( ... ) — greedy from last return
    const retMatch = html.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*\}*\s*;?\s*$/)
    if (retMatch) {
      html = retMatch[1]
    } else {
      // Try return without parens
      const retMatch2 = html.match(/return\s*(<[\s\S]+>[\s\S]*<\/\w+>)\s*;?\s*$/)
      if (retMatch2) html = retMatch2[1]
      else {
        // Last resort: find first HTML tag
        const tagMatch = html.match(/(<(?:div|section|main|article|header|footer|nav|ul|ol|p|h[1-6]|span|form|table)[\s\S]*)/)
        if (tagMatch) html = tagMatch[1]
      }
    }

    // Remove trailing }; }); ); artifacts
    html = html.replace(/\s*\}?\s*\)?\s*;?\s*\}?\s*;?\s*$/, '')

    // JSX attribute → HTML attribute
    html = html.replace(/\bclassName=/g, 'class=')
    html = html.replace(/\bhtmlFor=/g, 'for=')
    html = html.replace(/\bdefaultValue=/g, 'value=')
    html = html.replace(/\bdefaultChecked=/g, 'checked')
    html = html.replace(/\btabIndex=/g, 'tabindex=')
    html = html.replace(/\bautoComplete=/g, 'autocomplete=')
    html = html.replace(/\bautoFocus=/g, 'autofocus')
    html = html.replace(/\breadOnly=/g, 'readonly')
    html = html.replace(/\bmaxLength=/g, 'maxlength=')
    html = html.replace(/\bminLength=/g, 'minlength=')
    html = html.replace(/\bcrossOrigin=/g, 'crossorigin=')
    html = html.replace(/\bencType=/g, 'enctype=')

    // Event handlers → remove (not needed for static HTML)
    html = html.replace(/\bon[A-Z]\w+=\{[^}]*\}/g, '')
    html = html.replace(/\bon[A-Z]\w+="[^"]*"/g, '')

    // style={{ key: value }} → style="key: value"
    html = html.replace(/style=\{\{([\s\S]*?)\}\}/g, (_, inner) => {
      const css = inner
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/,\s*$/, '')
        .replace(/(\w+):\s*'([^']*)'/g, (_, p, v) => camelToKebab(p) + ':' + v)
        .replace(/(\w+):\s*"([^"]*)"/g, (_, p, v) => camelToKebab(p) + ':' + v)
        .replace(/(\w+):\s*(\d+(?:\.\d+)?)/g, (_, p, v) => camelToKebab(p) + ':' + v + (p !== 'zIndex' && p !== 'opacity' && p !== 'order' && p !== 'flex' ? 'px' : ''))
        .replace(/,/g, ';')
      return `style="${css}"`
    })

    // {expression} → remove or replace with placeholder
    html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // JSX comments
    html = html.replace(/\{`([^`]*)`\}/g, '$1')        // {`template`}
    html = html.replace(/\{'([^']*)'\}/g, '$1')         // {'string'}
    html = html.replace(/\{"([^"]*)"\}/g, '$1')         // {"string"}
    html = html.replace(/\{([a-z_$][\w.]*)\}/g, '{{$1}}') // {variable} → {{variable}}

    // Self-closing → proper HTML
    html = html.replace(/<(img|input|br|hr|meta|link)([^>]*?)\/>/gi, '<$1$2>')
    html = html.replace(/<([A-Z]\w*)([^>]*?)\/>/g, '') // remove custom components
    html = html.replace(/<([A-Z]\w*)([^>]*)>([\s\S]*?)<\/\1>/g, '$3') // unwrap custom components

    // Clean up
    html = html.trim()
    if (!html.startsWith('<')) html = `<div>${html}</div>`
    return html
  }

  // ── Vue SFC → HTML ───────────────────────────────────────────────────────
  function vueToHTML(code) {
    // Extract <template> block
    const tplMatch = code.match(/<template>([\s\S]*?)<\/template>/)
    let html = tplMatch ? tplMatch[1].trim() : code

    // Remove Vue directives
    html = html.replace(/\bv-if="[^"]*"/g, '')
    html = html.replace(/\bv-else-if="[^"]*"/g, '')
    html = html.replace(/\bv-else\b/g, '')
    html = html.replace(/\bv-show="[^"]*"/g, '')
    html = html.replace(/\bv-for="[^"]*"/g, '')
    html = html.replace(/\bv-model="[^"]*"/g, '')
    html = html.replace(/\bv-html="([^"]*)"/g, '') // v-html stripped
    html = html.replace(/\bv-bind:[\w-]+="[^"]*"/g, '')
    html = html.replace(/\bv-on:[\w-]+="[^"]*"/g, '')
    html = html.replace(/:[\w-]+="\{[^}]*\}"/g, '')
    html = html.replace(/:[\w-]+="[^"]*"/g, '')
    html = html.replace(/@[\w-]+="[^"]*"/g, '')

    // {{ expression }} → placeholder
    html = html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, '{{$1}}')

    return html.trim()
  }

  // ── Svelte → HTML ────────────────────────────────────────────────────────
  function svelteToHTML(code) {
    // Remove script blocks
    let html = code.replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove style blocks
    html = html.replace(/<style[\s\S]*?<\/style>/gi, '')
    // Remove svelte:head
    html = html.replace(/<svelte:head[\s\S]*?<\/svelte:head>/gi, '')
    // Remove control flow
    html = html.replace(/\{#if\s[^}]*\}/g, '')
    html = html.replace(/\{:else if\s[^}]*\}/g, '')
    html = html.replace(/\{:else\}/g, '')
    html = html.replace(/\{\/if\}/g, '')
    html = html.replace(/\{#each\s[^}]*\}/g, '')
    html = html.replace(/\{\/each\}/g, '')
    html = html.replace(/\{#await\s[^}]*\}/g, '')
    html = html.replace(/\{\/await\}/g, '')
    html = html.replace(/\{@html\s([^}]*)\}/g, '') // {@html x} → removed (dynamic)
    html = html.replace(/\{@debug[^}]*\}/g, '')
    // Svelte event → remove
    html = html.replace(/on:\w+="[^"]*"/g, '')
    html = html.replace(/on:\w+=\{[^}]*\}/g, '')
    // Svelte bind → remove
    html = html.replace(/bind:\w+=\{[^}]*\}/g, '')
    // { expression } → placeholder
    html = html.replace(/\{([a-z_$][\w.]*)\}/g, '{{$1}}')

    return html.trim()
  }

  // ── camelCase → kebab-case ───────────────────────────────────────────────
  function camelToKebab(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase()
  }

  // ── Detect & convert ─────────────────────────────────────────────────────
  function convert(code) {
    if (!code.trim()) return { html: '', fw: '' }
    const fw = _fw === 'auto' ? detect(code) : _fw
    let html = ''
    try {
      if (fw === 'vue')    html = vueToHTML(code)
      else if (fw === 'svelte') html = svelteToHTML(code)
      else                 html = jsxToHTML(code)
    } catch(e) {
      html = `<!-- Conversion error: ${e.message} -->`
    }
    return { html: html.trim(), fw }
  }

  // ── Public API ───────────────────────────────────────────────────────────
  return {
    open() {
      document.getElementById('ci-modal').classList.remove('hidden')
      document.getElementById('ci-code-input').focus()
    },
    close() {
      document.getElementById('ci-modal').classList.add('hidden')
      _convertedHTML = ''
    },
    setFw(fw) {
      _fw = fw
      document.querySelectorAll('.ci-fw-pill').forEach(p => p.classList.remove('active'))
      document.getElementById('ci-fw-' + fw).classList.add('active')
      this.convert()
    },
    onInput() {
      // debounced auto-convert
      clearTimeout(ComponentImporter._t)
      ComponentImporter._t = setTimeout(() => ComponentImporter.convert(), 400)
    },
    convert() {
      const code = document.getElementById('ci-code-input').value
      const status = document.getElementById('ci-status')
      const preview = document.getElementById('ci-preview-area')
      const addBtn = document.getElementById('ci-add-btn')

      if (!code.trim()) {
        preview.innerHTML = `<div class="ci-preview-empty"><div class="ci-preview-empty-icon">🧩</div><div style="font-size:13px;font-weight:600;color:#666">Paste code to preview</div><div style="font-size:11px;color:#999">Supports React, Vue 3, Svelte</div></div>`
        status.textContent = 'Ready — paste any component'
        status.className = 'ci-status'
        addBtn.disabled = true; addBtn.style.opacity = '.4'
        return
      }

      const { html, fw } = convert(code)
      _convertedHTML = html

      const fwLabels = { react:'⚛️ React', vue:'💚 Vue 3', svelte:'🔥 Svelte' }
      const fwLabel = fwLabels[fw] || '🧩'

      const isWarning = html.startsWith('<!-- ⚠️')
      const isFail    = !html || (html.startsWith('<!--') && !isWarning)

      if (isWarning) {
        // Complex component with React dependencies
        const msg = html.replace(/<!--\s*/,'').replace(/\s*-->/,'').trim()
        preview.innerHTML = `<div style="padding:20px;font-family:system-ui,sans-serif">
          <div style="font-size:32px;margin-bottom:12px">⚠️</div>
          <div style="font-weight:700;font-size:15px;color:#f59e0b;margin-bottom:8px">Cannot convert to static HTML</div>
          <div style="font-size:13px;color:#666;line-height:1.7;white-space:pre-line">${msg.replace(/<!--.*?-->/gs,'')}</div>
          <div style="margin-top:16px;padding:12px;background:#fef3c7;border-radius:8px;font-size:12px;color:#92400e">
            💡 <strong>Solution:</strong> Use this component in a React project.<br>
            Export your page as <strong>⚛️ React</strong> then import this component there.
          </div>
        </div>`
        status.textContent = '⚠️ Complex component — needs React runtime'
        status.className = 'ci-status err'
        addBtn.disabled = true; addBtn.style.opacity = '.4'
      } else if (!isFail) {
        preview.innerHTML = html
        status.textContent = `${fwLabel} detected — converted to HTML (${html.length} chars)`
        status.className = 'ci-status ok'
        addBtn.disabled = false; addBtn.style.opacity = '1'
      } else {
        preview.innerHTML = `<div style="padding:20px;text-align:center;color:#f87171">Could not extract HTML structure.<br>Try selecting the correct framework manually.</div>`
        status.textContent = 'Conversion failed — check the code'
        status.className = 'ci-status err'
        addBtn.disabled = true; addBtn.style.opacity = '.4'
      }
    },
    addToCanvas() {
      if (!_convertedHTML) return
      const sec = {
        id:    uid(),
        type:  'custom-html',
        props: { code: _convertedHTML, label: 'Imported Component' }
      }
      pushH('Import component')
      editorStore.setState({ sections: [...S.sections, sec] })
      renderAll()
      toast('Component added to canvas ✓', '🧩')
      this.close()
    },
  }
})()

// ── Export Modal UI ───────────────────────────────────────────────────────────
const EXP = { fmt: 'html' }

function openExport() {
  if (!AUTH.user) { showAuthGate(); toast('Sign in to export pages','🔒'); return }
  if (!S.sections.length) return toast('Add sections first','⚠️')
  document.getElementById('exp-modal').classList.remove('hidden')

  // Pre-fill title from page-title
  const titleEl = document.getElementById('exp-seo-title')
  if (!titleEl.value) titleEl.value = document.getElementById('page-title').value || ''

  updateExpStats()
  updateExpPreview()
  updateCharCount('exp-seo-title','exp-title-count',60)
  updateCharCount('exp-seo-desc','exp-desc-count',160)

  // Analytics ID field toggle
  document.getElementById('opt-analytics').addEventListener('change', function() {
    document.getElementById('opt-analytics-id').style.display = this.checked ? 'block' : 'none'
  })

  // Live preview on option change
  ;['opt-minify','opt-responsive','opt-fonts','opt-analytics','exp-seo-title','exp-seo-desc']
    .forEach(id => document.getElementById(id)?.addEventListener('change', updateExpPreview))
  ;['exp-seo-title','exp-seo-desc']
    .forEach(id => document.getElementById(id)?.addEventListener('input', updateExpPreview))
}

function closeExport() { document.getElementById('exp-modal').classList.add('hidden') }

function selectFmt(fmt) {
  // Gate non-HTML formats behind Pro plan
  const proFmts = ['json','react','ts','vue','svelte','esm']
  if (proFmts.includes(fmt) && typeof requirePro === 'function' && !isPro()) {
    requirePro('export-' + fmt, fmt.toUpperCase() + ' export requires the Pro plan'); return
  }
  EXP.fmt = fmt
  ;['html','json','react','ts','vue','svelte','esm'].forEach(f => {
    const el = document.getElementById('fmt-'+f)
    if (el) el.classList.toggle('active', f === fmt)
  })
  const showSeo  = fmt !== 'json'
  const showOpts = fmt === 'html'
  document.getElementById('exp-seo-panel').style.display   = showSeo  ? 'block' : 'none'
  document.getElementById('exp-opts-panel').style.display  = showOpts ? 'block' : 'none'
  document.getElementById('exp-preview-pane').style.display = fmt === 'json' ? 'none' : 'block'

  const labels = {
    html:'Download HTML', json:'Save JSON', react:'Download JSX',
    ts:'Download TSX', vue:'Download .vue', svelte:'Download .svelte', esm:'Download ESM'
  }
  const icons = {
    html:'⬇', json:'💾', react:'⚛️', ts:'💙', vue:'💚', svelte:'🔥', esm:'📦'
  }
  document.getElementById('exp-go-label').textContent = labels[fmt] || 'Download'
  document.getElementById('exp-go-icon').textContent  = icons[fmt]  || '⬇'
  updateExpPreview()
}

function updateExpStats() {
  const st = calcStats()
  document.getElementById('exp-stat-sec').textContent   = st.secs
  document.getElementById('exp-stat-words').textContent = st.words.toLocaleString()
  document.getElementById('exp-stat-imgs').textContent  = st.imgs
  document.getElementById('exp-stat-size').textContent  = st.size + 'kb'
}

function updateExpPreview() {
  if (EXP.fmt === 'json') return
  updateExpStats()
  try {
    const genMap = {
      html:   () => genHTML({ preview: true }),
      react:  genReact,
      ts:     genTypeScript,
      vue:    genVue,
      svelte: genSvelte,
      esm:    genESM,
    }
    const gen  = genMap[EXP.fmt] || genMap.html
    const code = gen()
    const lines = code.split('\n').slice(0, 12).join('\n')
    document.getElementById('exp-preview-code').textContent = lines
    const size = Math.round(code.length / 1024)
    document.getElementById('exp-footer-hint').textContent =
      `${EXP.fmt.toUpperCase()} · ~${size}kb · ${S.sections.length} section${S.sections.length!==1?'s':''}`
  } catch {}
}

function updateCharCount(inputId, countId, max) {
  const inp = document.getElementById(inputId)
  const cnt = document.getElementById(countId)
  if (!inp || !cnt) return
  const len = inp.value.length
  cnt.textContent = `${len}/${max}`
  cnt.style.color = len > max * .9 ? '#f87171' : len > max * .7 ? '#fbbf24' : 'var(--muted)'
}

function doExport() {
  // Free tier export limit
  if (typeof UsageLimits !== 'undefined' && !UsageLimits.checkExport()) return

  let content, filename, mime

  if (EXP.fmt === 'html') {
    // ── Multi-page: flush + export all pages ─────────────────────────────────
    _flushPageSections()
    const { pages } = projectStore.getState()
    if (pages.length > 1) {
      _exportAllPages(pages)
      closeExport()
      return
    }
    // Single page export
    content  = genHTML()
    const slug = (document.getElementById('exp-seo-title')?.value || document.getElementById('page-title').value || 'page')
      .toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') || 'page'
    filename = `${slug}.html`
    mime     = 'text/html'

  } else if (EXP.fmt === 'json') {
    // Save pages array in JSON export
    _flushPageSections()
    const { pages, activePageId } = projectStore.getState()
    const project = {
      version:      '2.0',
      name:         document.getElementById('page-title').value || 'My Page',
      savedAt:      new Date().toISOString(),
      pages:        pages,
      activePageId: activePageId,
      // Legacy compat: also include active page sections
      sections:     S.sections,
    }
    content  = JSON.stringify(project, null, 2)
    filename = 'project.pagecraft.json'
    mime     = 'application/json'

  } else if (EXP.fmt === 'react') {
    content  = genReact()
    const comp = (document.getElementById('exp-seo-title')?.value || 'Page')
      .replace(/[^a-zA-Z0-9]/g,'') || 'Page'
    filename = `${comp}.jsx`
    mime     = 'text/javascript'

  } else if (EXP.fmt === 'ts') {
    content  = genTypeScript()
    const comp = (document.getElementById('exp-seo-title')?.value || 'Page')
      .replace(/[^a-zA-Z0-9]/g,'') || 'Page'
    filename = `${comp}.tsx`
    mime     = 'text/plain'

  } else if (EXP.fmt === 'vue') {
    content  = genVue()
    const comp = (document.getElementById('exp-seo-title')?.value || 'Page')
      .replace(/[^a-zA-Z0-9]/g,'') || 'Page'
    filename = `${comp}.vue`
    mime     = 'text/plain'

  } else if (EXP.fmt === 'svelte') {
    content  = genSvelte()
    const comp = (document.getElementById('exp-seo-title')?.value || 'Page')
      .replace(/[^a-zA-Z0-9]/g,'') || 'Page'
    filename = `${comp}.svelte`
    mime     = 'text/plain'

  } else if (EXP.fmt === 'esm') {
    content  = genESM()
    const slug = (document.getElementById('exp-seo-title')?.value || document.getElementById('page-title').value || 'page')
      .toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') || 'page'
    filename = `${slug}.js`
    mime     = 'text/javascript'
  }

  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
  closeExport()
  toast(`Downloaded ${filename}`, '⬇')
  if (typeof UXGuide !== 'undefined') UXGuide.markExported()
}

// ── Export each page as a separate HTML file (sequential downloads) ───────────
function _exportAllPages(pages) {
  // Build slug helper
  const slug = n => n.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') || 'page'
  // Build a nav link list for every page
  const navLinks = pages.map((p, i) => {
    const file = i === 0 ? 'index.html' : `${slug(p.name)}.html`
    return { name: p.name, file }
  })
  const navBar = `<nav style="position:fixed;top:0;left:0;right:0;z-index:9999;background:rgba(13,13,15,.95);backdrop-filter:blur(8px);display:flex;align-items:center;gap:6px;padding:8px 20px;border-bottom:1px solid rgba(255,255,255,.08)">
    ${navLinks.map(l => `<a href="${l.file}" style="color:#a0a0b0;text-decoration:none;font-size:13px;font-weight:500;padding:4px 12px;border-radius:20px;transition:all .15s" onmouseover="this.style.color='#6c63ff'" onmouseout="this.style.color='#a0a0b0'">${e(l.name)}</a>`).join('')}
  </nav><div style="height:44px"></div>`

  pages.forEach((p, i) => {
    const file = i === 0 ? 'index.html' : `${slug(p.name)}.html`
    const html = genHTML({ sections: p.sections, title: p.name, pageId: p.id })
      .replace('<body>', `<body>${navBar}`)
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = file
    setTimeout(() => { a.click(); URL.revokeObjectURL(url) }, i * 200)
  })
  toast(`Exporting ${pages.length} pages…`, '⬇')
}

// Keep old openPreview working
function openPreview(){
  if (!AUTH.user) { showAuthGate(); toast('Sign in to preview pages','🔒'); return }
  if(!S.sections.length)return toast('Add sections first','⚠️')
  const html=genHTML({preview:true})
  const blob=new Blob([html],{type:'text/html'})
  const url=URL.createObjectURL(blob)
  const w=window.open(url,'_blank')
  if(w) w.addEventListener('load',()=>URL.revokeObjectURL(url),{once:true})
  toast('Preview opened','👁')
}

// Close export modal on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('exp-modal')?.addEventListener('click', function(ev) {
    if (ev.target === this) closeExport()
  })
})
