/* renderers.js Phase 4/5 */

const R={
  hero(p,id){
    const al=p.align||'center',ctr=al==='center'?'text-align:center;margin:0 auto;':''
    const videoOn = p.videoEnabled === 'true'
    // ── Video bg helpers ────────────────────────────────────────────────────
    let heroBg = '', heroMedia = '', heroOverlay = ''
    if (videoOn && p.videoUrl) {
      const ytM = (p.videoUrl||'').match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      const vmM = (p.videoUrl||'').match(/vimeo\.com\/(?:video\/)?(\d+)/)
      const ov  = p.overlayColor || '#000000'
      const op  = parseFloat(p.overlayOpacity)||0.4
      heroOverlay = `<div style="position:absolute;inset:0;background:${ov};opacity:${op};z-index:1"></div>`
      if (ytM) {
        const params=`autoplay=1&mute=1&loop=1&playlist=${ytM[1]}&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playsinline=1`
        heroMedia=`<div style="position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;z-index:0"><iframe src="https://www.youtube.com/embed/${ytM[1]}?${params}" allow="autoplay;encrypted-media" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(1.2);width:177.78vh;height:56.25vw;min-width:100%;min-height:100%;border:none;" loading="lazy"></iframe></div>`
        heroBg = `background:${ec(p.bgColor)};`
      } else if (vmM) {
        const params=`autoplay=1&muted=1&loop=1&background=1&title=0&byline=0`
        heroMedia=`<div style="position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;z-index:0"><iframe src="https://player.vimeo.com/video/${vmM[1]}?${params}" allow="autoplay;fullscreen" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(1.2);width:177.78vh;height:56.25vw;min-width:100%;min-height:100%;border:none;" loading="lazy"></iframe></div>`
        heroBg = `background:${ec(p.bgColor)};`
      }
    } else {
      heroBg=p.bgImage?`background:url('${eu(p.bgImage)}') center/cover no-repeat;background-color:${ec(p.bgColor)};`:`background:${ec(p.bgColor)};`
      heroOverlay=p.bgImage?'<div style="position:absolute;inset:0;background:rgba(0,0,0,.45);z-index:1"></div>':''
    }
    return`<section style="${heroBg}color:${p.textColor};min-height:${p.minHeight||520}px;display:flex;align-items:center;justify-content:${al==='center'?'center':'flex-start'};padding:80px clamp(24px,8vw,96px);position:relative;overflow:hidden;">
${heroMedia}${heroOverlay}
<div style="position:relative;z-index:2;max-width:680px;${ctr}">
<h1 contenteditable="true" data-id="${id}" data-key="headline" style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;line-height:1.1;margin:0 0 20px;letter-spacing:-.02em;">${e(p.headline)}</h1>
<p contenteditable="true" data-id="${id}" data-key="subheadline" style="font-size:clamp(1rem,2.5vw,1.25rem);opacity:.8;margin:0 0 36px;line-height:1.7;max-width:560px;${ctr}">${e(p.subheadline)}</p>
<div style="display:flex;gap:12px;flex-wrap:wrap;${al==='center'?'justify-content:center;':''}">
<a href="${eu(p.ctaLink||'#')}" style="display:inline-flex;align-items:center;background:#fff;color:#0f172a;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;"><span contenteditable="true" data-id="${id}" data-key="ctaText">${e(p.ctaText||'Get Started')}</span></a>
${p.ctaSecText?`<a href="${eu(p.ctaSecLink||'#')}" style="display:inline-flex;align-items:center;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;border:2px solid rgba(255,255,255,.4);color:inherit;"><span contenteditable="true" data-id="${id}" data-key="ctaSecText">${e(p.ctaSecText)}</span></a>`:''}
</div></div></section>`},

  about(p,id){const il=p.imagePos==='left'
    return`<section style="background:${p.bgColor};color:${p.textColor};padding:80px clamp(24px,8vw,80px);">
<div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:${S.device==='mobile'?'1fr':'1fr 1fr'};gap:${S.device==='mobile'?'32px':'64px'};align-items:center;${il&&S.device!=='mobile'?'':'direction:rtl;'}">
<div style="direction:ltr;">
<p contenteditable="true" data-id="${id}" data-key="subheading" style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${p.accentColor};margin:0 0 12px;">${e(p.subheading)}</p>
<h2 contenteditable="true" data-id="${id}" data-key="heading" style="font-size:clamp(1.6rem,3.5vw,2.5rem);font-weight:800;line-height:1.15;margin:0 0 20px;">${e(p.heading)}</h2>
<p contenteditable="true" data-id="${id}" data-key="body" style="font-size:15px;line-height:1.8;opacity:.75;margin:0 0 24px;">${e(p.body)}</p>
<div style="background:${p.accentColor}18;border-left:3px solid ${p.accentColor};padding:14px 18px;border-radius:0 8px 8px 0;font-size:14px;font-weight:500;line-height:1.6;"><span contenteditable="true" data-id="${id}" data-key="highlight">${e(p.highlight)}</span></div>
</div>
<div style="direction:ltr;"><div class="img-editable">
<img src="${eu(p.image)}" alt="About" style="width:100%;border-radius:16px;display:block;box-shadow:0 20px 60px rgba(0,0,0,.12);" onerror="this.src='https://placehold.co/520x360/e2e8f0/94a3b8?text=Image'"/>
<div class="img-overlay" onclick="var _i=this.closest('.img-editable').querySelector('img');if(_i&&typeof ImageEditor!='undefined'){ImageEditor.launch(_i)}else{openModal('${id}','image')}">
  <div class="img-edit-btn">🖼 Edit in Studio</div>
  <div class="img-edit-btn" style="font-size:10px;padding:3px 8px;margin-top:4px;opacity:.8"
    onclick="event.stopPropagation();openModal('${id}','image')">Replace</div>
</div>
</div></div></div></section>`},

  contact(p,id){
    return`<section style="background:${p.bgColor};color:${p.textColor};padding:80px clamp(24px,8vw,80px);">
<div style="max-width:960px;margin:0 auto;">
<div style="text-align:center;margin-bottom:56px;">
<h2 contenteditable="true" data-id="${id}" data-key="heading" style="font-size:clamp(1.6rem,3.5vw,2.5rem);font-weight:800;margin:0 0 14px;">${e(p.heading)}</h2>
<p contenteditable="true" data-id="${id}" data-key="subheading" style="font-size:15px;opacity:.65;max-width:520px;margin:0 auto;line-height:1.7;">${e(p.subheading)}</p>
</div>
<div style="display:grid;grid-template-columns:${S.device==='mobile'?'1fr':'1fr 1fr'};gap:${S.device==='mobile'?'24px':'48px'};align-items:start;">
<div style="background:#fff;border-radius:16px;padding:36px;box-shadow:0 4px 24px rgba(0,0,0,.07);">
<div style="display:flex;flex-direction:column;gap:14px;">
${['Your Name','Email Address','Subject'].map(ph=>`<input placeholder="${ph}" style="width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:12px 16px;font-size:14px;outline:none;color:#1e293b;font-family:inherit;" readonly/>`).join('')}
<textarea placeholder="Your Message" rows="4" style="width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:12px 16px;font-size:14px;outline:none;resize:none;color:#1e293b;font-family:inherit;" readonly></textarea>
<button style="background:${p.accentColor};color:#fff;border:none;border-radius:9px;padding:14px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;">Send Message →</button>
</div></div>
<div style="display:flex;flex-direction:column;gap:24px;padding-top:8px;">
${[['📧','Email',p.email,'email'],['📞','Phone',p.phone,'phone'],['📍','Address',p.address,'address']].map(([ic,lb,vl,ky])=>`
<div style="display:flex;align-items:flex-start;gap:16px;">
<div style="width:44px;height:44px;background:${p.accentColor}18;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${ic}</div>
<div><p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.5;margin:0 0 4px;">${lb}</p>
<p contenteditable="true" data-id="${id}" data-key="${ky}" style="font-size:14px;font-weight:500;margin:0;">${e(vl)}</p></div></div>`).join('')}
${p.showMap==='true'?`<div style="background:#e2e8f0;border-radius:14px;height:180px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:14px;margin-top:8px;">🗺 Map placeholder</div>`:''}
</div></div></div></section>`},

  features(p,id){
    const fs=[{ic:'feat1Icon',tl:'feat1Title',ds:'feat1Desc'},{ic:'feat2Icon',tl:'feat2Title',ds:'feat2Desc'},{ic:'feat3Icon',tl:'feat3Title',ds:'feat3Desc'}]
    return`<section style="background:${p.bgColor};color:${p.textColor};padding:80px clamp(24px,8vw,80px);">
<div style="max-width:960px;margin:0 auto;">
<div style="text-align:center;margin-bottom:56px;">
<h2 contenteditable="true" data-id="${id}" data-key="heading" style="font-size:clamp(1.6rem,3.5vw,2.5rem);font-weight:800;margin:0 0 14px;">${e(p.heading)}</h2>
<p contenteditable="true" data-id="${id}" data-key="subheading" style="font-size:15px;opacity:.65;max-width:480px;margin:0 auto;line-height:1.7;">${e(p.subheading)}</p>
</div>
<div style="display:grid;grid-template-columns:${S.device==='mobile'?'1fr':S.device==='tablet'?'repeat(2,1fr)':'repeat(3,1fr)'};gap:28px;">
${fs.map(f=>`<div style="background:${p.accentColor}0d;border:1px solid ${p.accentColor}22;border-radius:16px;padding:32px 24px;text-align:center;">
<div contenteditable="true" data-id="${id}" data-key="${f.ic}" style="font-size:2.2rem;margin-bottom:16px;">${e(p[f.ic]||'✦')}</div>
<h3 contenteditable="true" data-id="${id}" data-key="${f.tl}" style="font-size:17px;font-weight:700;margin:0 0 10px;">${e(p[f.tl])}</h3>
<p contenteditable="true" data-id="${id}" data-key="${f.ds}" style="font-size:13px;opacity:.65;line-height:1.7;margin:0;">${e(p[f.ds])}</p>
</div>`).join('')}
</div></div></section>`},

  testimonial(p,id){
    const st='★'.repeat(Math.min(5,parseInt(p.rating)||5))
    return`<section style="background:${p.bgColor};color:${p.textColor};padding:80px clamp(24px,8vw,80px);">
<div style="max-width:720px;margin:0 auto;text-align:center;">
<div style="font-size:2rem;color:${p.accentColor};margin-bottom:8px;">${st}</div>
<blockquote contenteditable="true" data-id="${id}" data-key="quote" style="font-size:clamp(1.1rem,2.5vw,1.4rem);font-weight:500;line-height:1.7;font-style:italic;margin:0 0 36px;opacity:.9;">"${e(p.quote)}"</blockquote>
<div style="display:flex;align-items:center;justify-content:center;gap:14px;">
<div class="img-editable" style="width:52px;height:52px;flex-shrink:0;border-radius:50%;overflow:hidden;">
${p.avatar?`<img src="${eu(p.avatar)}" style="width:52px;height:52px;object-fit:cover;display:block;"/>`:`<div style="width:52px;height:52px;background:${ec(p.accentColor)}33;display:flex;align-items:center;justify-content:center;font-size:22px;">${e(p.author).charAt(0)}</div>`}
<div class="img-overlay" style="border-radius:50%;" onclick="var _i=this.closest('.img-editable').querySelector('img');if(_i&&typeof ImageEditor!='undefined'){ImageEditor.launch(_i)}else{openModal('${id}','avatar')}">
  <div class="img-edit-btn" style="font-size:10px;padding:4px 8px;">Edit</div>
</div>
</div>
<div style="text-align:left;">
<p contenteditable="true" data-id="${id}" data-key="author" style="font-weight:700;font-size:15px;margin:0;">${e(p.author)}</p>
<p contenteditable="true" data-id="${id}" data-key="role" style="font-size:12px;opacity:.55;margin:2px 0 0;">${e(p.role)}</p>
</div></div></div></section>`},

  footer(p,id){
    const lnks=[{l:p.link1Label,h:p.link1Href},{l:p.link2Label,h:p.link2Href},{l:p.link3Label,h:p.link3Href}].filter(x=>x.l)
    return`<footer style="background:${p.bgColor};color:${p.textColor};padding:48px clamp(24px,8vw,80px) 32px;">
<div style="max-width:960px;margin:0 auto;">
<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px;padding-bottom:28px;border-bottom:1px solid rgba(255,255,255,.1);">
<div>
<div contenteditable="true" data-id="${id}" data-key="brand" style="font-size:18px;font-weight:800;margin-bottom:4px;">${e(p.brand)}</div>
<div contenteditable="true" data-id="${id}" data-key="tagline" style="font-size:13px;opacity:.5;">${e(p.tagline)}</div>
</div>
<nav style="display:flex;gap:24px;flex-wrap:wrap;">${lnks.map(l=>`<a href="${eu(l.h)}" style="color:inherit;text-decoration:none;font-size:13px;opacity:.6;">${e(l.l)}</a>`).join('')}</nav>
</div>
<div contenteditable="true" data-id="${id}" data-key="copyright" style="padding-top:24px;font-size:12px;opacity:.4;">${e(p.copyright)}</div>
</div></footer>`},

  /* ════════════════════════════════════════════════════════════
     PRICING RENDERER
     Interactive monthly/annual toggle — pure CSS checkbox trick
  ════════════════════════════════════════════════════════════ */
  pricing(p,id){
    const uid_toggle = 'tog_' + id
    const plans = [
      { n:p.t1Name, d:p.t1Desc, pm:p.t1PriceMonthly, pa:p.t1PriceAnnual, cur:p.t1Currency||'$', per:p.t1Period||'/month', cta:p.t1Cta, link:p.t1CtaLink, feat:[p.t1f1,p.t1f2,p.t1f3,p.t1f4,p.t1f5,p.t1f6].filter(Boolean), featured:p.t1featured==='true', nk:'t1Name', dk:'t1Desc', ctaK:'t1Cta' },
      { n:p.t2Name, d:p.t2Desc, pm:p.t2PriceMonthly, pa:p.t2PriceAnnual, cur:p.t2Currency||'$', per:p.t2Period||'/month', cta:p.t2Cta, link:p.t2CtaLink, feat:[p.t2f1,p.t2f2,p.t2f3,p.t2f4,p.t2f5,p.t2f6].filter(Boolean), featured:p.t2featured==='true', nk:'t2Name', dk:'t2Desc', ctaK:'t2Cta' },
      { n:p.t3Name, d:p.t3Desc, pm:p.t3PriceMonthly, pa:p.t3PriceAnnual, cur:p.t3Currency||'$', per:p.t3Period||'/month', cta:p.t3Cta, link:p.t3CtaLink, feat:[p.t3f1,p.t3f2,p.t3f3,p.t3f4,p.t3f5,p.t3f6].filter(Boolean), featured:p.t3featured==='true', nk:'t3Name', dk:'t3Desc', ctaK:'t3Cta' },
    ]
    const accent = p.accentColor || '#0ea5e9'

    const cardStyle = (featured) => featured
      ? `background:${accent};border:2px solid ${accent};border-radius:20px;padding:36px 28px;color:#fff;position:relative;box-shadow:0 24px 64px ${accent}44;`
      : `background:#fff;border:1.5px solid #e2e8f0;border-radius:20px;padding:36px 28px;color:#0f172a;`

    return `<section style="background:${p.bgColor};color:${p.textColor};padding:80px clamp(24px,8vw,80px);">
<style>
  #${uid_toggle}{display:none}
  .ptog-${id} label{display:flex;align-items:center;gap:12px;cursor:pointer;user-select:none;font-size:14px;font-weight:500}
  .ptog-${id} .toggle-track{width:44px;height:24px;background:#e2e8f0;border-radius:12px;position:relative;transition:background .2s;flex-shrink:0}
  .ptog-${id} .toggle-thumb{width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:3px;left:3px;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
  #${uid_toggle}:checked ~ * .toggle-track{background:${accent}}
  #${uid_toggle}:checked ~ * .toggle-thumb{transform:translateX(20px)}
  .price-monthly-${id}{display:block}
  .price-annual-${id}{display:none}
  #${uid_toggle}:checked ~ * .price-monthly-${id}{display:none}
  #${uid_toggle}:checked ~ * .price-annual-${id}{display:block}
  .badge-annual-${id}{display:none}
  #${uid_toggle}:checked ~ * .badge-annual-${id}{display:inline-flex}
</style>
<input type="checkbox" id="${uid_toggle}"/>
<div style="max-width:1040px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:48px;">
    <h2 contenteditable="true" data-id="${id}" data-key="heading" style="font-size:clamp(1.6rem,3.5vw,2.4rem);font-weight:800;margin:0 0 14px;">${e(p.heading)}</h2>
    <p contenteditable="true" data-id="${id}" data-key="subheading" style="font-size:15px;opacity:.65;max-width:480px;margin:0 auto 28px;line-height:1.7;">${e(p.subheading)}</p>
    <!-- Monthly / Annual toggle -->
    <div class="ptog-${id}" style="display:inline-flex;align-items:center;gap:10px;">
      <label for="${uid_toggle}">
        <span contenteditable="true" data-id="${id}" data-key="toggleMonthly" style="opacity:.7;">${e(p.toggleMonthly||'Monthly')}</span>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <span contenteditable="true" data-id="${id}" data-key="toggleAnnual" style="opacity:.7;">${e(p.toggleAnnual||'Annual')}</span>
      </label>
      <span class="badge-annual-${id}" style="background:${accent}22;color:${accent};font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:.04em;">
        ${e(p.annualDiscount||'Save 20%')}
      </span>
    </div>
  </div>

  <!-- Cards grid -->
  <div style="display:grid;grid-template-columns:${S.device==='mobile'?'1fr':S.device==='tablet'?'repeat(2,1fr)':'repeat(3,1fr)'};gap:20px;align-items:start;${S.device==='mobile'?'max-width:400px;margin:0 auto':''}">
    ${plans.map((plan,i) => `
      <div style="${cardStyle(plan.featured)}">
        ${plan.featured ? `<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#fff;color:${accent};font-size:11px;font-weight:800;padding:4px 14px;border-radius:20px;letter-spacing:.06em;white-space:nowrap;">MOST POPULAR</div>` : ''}
        <div contenteditable="true" data-id="${id}" data-key="${plan.nk}" style="font-size:18px;font-weight:800;margin-bottom:6px;">${e(plan.n)}</div>
        <div contenteditable="true" data-id="${id}" data-key="${plan.dk}" style="font-size:13px;opacity:.65;margin-bottom:24px;line-height:1.5;">${e(plan.d)}</div>
        <!-- Monthly price -->
        <div class="price-monthly-${id}" style="margin-bottom:28px;">
          <span style="font-size:3rem;font-weight:800;line-height:1;">${e(plan.cur)}${e(plan.pm)}</span>
          <span style="font-size:14px;opacity:.6;">${e(plan.per)}</span>
        </div>
        <!-- Annual price -->
        <div class="price-annual-${id}" style="margin-bottom:28px;">
          <span style="font-size:3rem;font-weight:800;line-height:1;">${e(plan.cur)}${e(plan.pa)}</span>
          <span style="font-size:14px;opacity:.6;">${e(plan.per)}</span>
        </div>
        <a href="${eu(plan.link||'#')}" style="display:block;text-align:center;padding:13px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;margin-bottom:28px;${plan.featured?`background:#fff;color:${ec(accent)};`:`background:${ec(accent)};color:#fff;`}">
          <span contenteditable="true" data-id="${id}" data-key="${plan.ctaK}">${e(plan.cta)}</span>
        </a>
        <div style="border-top:1px solid ${plan.featured?'rgba(255,255,255,.2)':'#e2e8f0'};padding-top:20px;display:flex;flex-direction:column;gap:10px;">
          ${plan.feat.map(f=>`
            <div style="display:flex;align-items:center;gap:10px;font-size:14px;">
              <span style="width:18px;height:18px;border-radius:50%;background:${plan.featured?'rgba(255,255,255,.25)':accent+'22'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:${plan.featured?'#fff':accent};">✓</span>
              ${e(f)}
            </div>`).join('')}
        </div>
      </div>`).join('')}
  </div>
</div></section>`},

  /* ════════════════════════════════════════════════════════════
     FAQ RENDERER
     Pure CSS accordion — no JS needed in the output
  ════════════════════════════════════════════════════════════ */
  faq(p,id){
    const pairs = [
      {q:p.q1,a:p.a1,qk:'q1',ak:'a1'},{q:p.q2,a:p.a2,qk:'q2',ak:'a2'},
      {q:p.q3,a:p.a3,qk:'q3',ak:'a3'},{q:p.q4,a:p.a4,qk:'q4',ak:'a4'},
      {q:p.q5,a:p.a5,qk:'q5',ak:'a5'},{q:p.q6,a:p.a6,qk:'q6',ak:'a6'},
    ].filter(pair => pair.q)
    const accent = p.accentColor || '#f59e0b'
    const uid_faq = 'faq_' + id

    return `<section style="background:${p.bgColor};color:${p.textColor};padding:80px clamp(24px,8vw,80px);">
<style>
  .${uid_faq} details{border-bottom:1px solid #e2e8f0;overflow:hidden}
  .${uid_faq} details:first-of-type{border-top:1px solid #e2e8f0}
  .${uid_faq} summary{display:flex;align-items:center;justify-content:space-between;gap:16px;
    padding:20px 0;cursor:pointer;list-style:none;font-weight:600;font-size:15px;
    color:${p.textColor};transition:color .15s}
  .${uid_faq} summary::-webkit-details-marker{display:none}
  .${uid_faq} summary:hover{color:${accent}}
  .${uid_faq} .faq-icon{width:28px;height:28px;border-radius:50%;border:1.5px solid #e2e8f0;
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
    font-size:16px;color:${p.textColor};transition:all .2s;font-style:normal}
  .${uid_faq} details[open] summary .faq-icon{background:${accent};border-color:${accent};color:#fff;transform:rotate(45deg)}
  .${uid_faq} details[open] summary{color:${accent}}
  .${uid_faq} .faq-body{padding:0 0 20px;font-size:15px;line-height:1.8;opacity:.75}
</style>
<div style="max-width:720px;margin:0 auto;" class="${uid_faq}">
  <div style="text-align:center;margin-bottom:56px;">
    <h2 contenteditable="true" data-id="${id}" data-key="heading" style="font-size:clamp(1.6rem,3.5vw,2.4rem);font-weight:800;margin:0 0 14px;">${e(p.heading)}</h2>
    <p contenteditable="true" data-id="${id}" data-key="subheading" style="font-size:15px;opacity:.65;line-height:1.7;">${e(p.subheading)}</p>
  </div>
  ${pairs.map((pair,i) => `
    <details${i===0?' open':''}>
      <summary>
        <span contenteditable="true" data-id="${id}" data-key="${pair.qk}">${e(pair.q)}</span>
        <i class="faq-icon">+</i>
      </summary>
      <div class="faq-body">
        <p contenteditable="true" data-id="${id}" data-key="${pair.ak}">${e(pair.a)}</p>
      </div>
    </details>`).join('')}
</div></section>`},

  /* ════════════════════════════════════════════════════════════
     GALLERY RENDERER
     3 layout modes: grid | masonry | featured
     Image click-to-replace via img-editable overlay
  ════════════════════════════════════════════════════════════ */
  gallery(p,id){
    const accent = p.accentColor || '#ec4899'
    const imgs = [
      {src:p.img1,cap:p.cap1,sk:'img1',ck:'cap1'},
      {src:p.img2,cap:p.cap2,sk:'img2',ck:'cap2'},
      {src:p.img3,cap:p.cap3,sk:'img3',ck:'cap3'},
      {src:p.img4,cap:p.cap4,sk:'img4',ck:'cap4'},
      {src:p.img5,cap:p.cap5,sk:'img5',ck:'cap5'},
      {src:p.img6,cap:p.cap6,sk:'img6',ck:'cap6'},
    ]
    const layout = p.layout || 'grid'
    const cols   = parseInt(p.cols) || 3

    // Helper: single image cell
    const imgCell = (img, extraStyle='', showCap=true) => `
      <div style="position:relative;overflow:hidden;border-radius:12px;background:#e2e8f0;${extraStyle}" class="gal-cell-${id}">
        <div class="img-editable" style="display:block;width:100%;height:100%;">
          <img src="${img.src||'https://placehold.co/600x400/e2e8f0/94a3b8?text=Image'}"
            alt="${e(img.cap)}"
            style="width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s;"
            onerror="this.src='https://placehold.co/600x400/e2e8f0/94a3b8?text=Image'"/>
          <div class="img-overlay" style="background:rgba(0,0,0,.4);"
            onclick="var _i=this.closest('.img-editable').querySelector('img');if(_i&&typeof ImageEditor!='undefined'){ImageEditor.launch(_i)}else{openModal('${id}','${img.sk}')}">
            <div class="img-edit-btn">🖼 Edit in Studio</div>
            <div class="img-edit-btn" style="font-size:10px;padding:3px 8px;margin-top:4px;opacity:.8"
              onclick="event.stopPropagation();openModal('${id}','${img.sk}')">Replace</div>
          </div>
        </div>
        ${showCap && img.cap ? `
          <div style="position:absolute;bottom:0;left:0;right:0;padding:12px 16px;
            background:linear-gradient(transparent,rgba(0,0,0,.65));color:#fff;">
            <span contenteditable="true" data-id="${id}" data-key="${img.ck}"
              style="font-size:13px;font-weight:600;">${e(img.cap)}</span>
          </div>` : ''}
      </div>`

    let gridHTML = ''

    if (layout === 'featured') {
      // Featured: first image large (2 cols span), rest in 2-col grid
      gridHTML = `
<style>
  .gal-featured-${id}{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:320px 220px 220px;gap:12px}
  .gal-featured-${id} .gal-cell-${id}:first-child{grid-row:1/3}
  .gal-cell-${id}{cursor:pointer}
  .gal-cell-${id}:hover img{transform:scale(1.05)}
</style>
<div class="gal-featured-${id}">
  ${imgCell(imgs[0],'height:100%;',true)}
  ${imgCell(imgs[1],'height:100%;',true)}
  ${imgCell(imgs[2],'height:100%;',true)}
  ${imgCell(imgs[3],'height:100%;',true)}
  ${imgCell(imgs[4],'height:100%;',true)}
</div>`

    } else if (layout === 'masonry') {
      // Masonry: 3 columns with varying heights
      const heights = ['260px','200px','300px','220px','280px','200px']
      gridHTML = `
<style>
  .gal-masonry-${id}{columns:${cols};column-gap:12px}
  .gal-masonry-${id} .gal-cell-${id}{break-inside:avoid;margin-bottom:12px;cursor:pointer}
  .gal-cell-${id}:hover img{transform:scale(1.05)}
</style>
<div class="gal-masonry-${id}">
  ${imgs.map((img,i)=>imgCell(img,`height:${heights[i]};`,true)).join('')}
</div>`

    } else {
      // Grid (default)
      gridHTML = `
<style>
  .gal-grid-${id}{display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px}
  .gal-cell-${id}{height:240px;cursor:pointer}
  .gal-cell-${id}:hover img{transform:scale(1.05)}
</style>
<div class="gal-grid-${id}">
  ${imgs.map(img=>imgCell(img,'',true)).join('')}
</div>`
    }

    return `<section style="background:${p.bgColor};color:${p.textColor};padding:80px clamp(24px,8vw,80px);">
<div style="max-width:1040px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:48px;">
    <h2 contenteditable="true" data-id="${id}" data-key="heading" style="font-size:clamp(1.6rem,3.5vw,2.4rem);font-weight:800;margin:0 0 14px;">${e(p.heading)}</h2>
    <p contenteditable="true" data-id="${id}" data-key="subheading" style="font-size:15px;opacity:.65;max-width:480px;margin:0 auto;line-height:1.7;">${e(p.subheading)}</p>
  </div>
  ${gridHTML}
</div></section>`},

  /* ══════════════════════════════════════════════════════
     3D RENDERERS — Three.js r128 via CDN
     Each returns a section with an embedded <canvas> that
     boots its own Three.js scene on DOMContentLoaded.
     The canvases use data-3d-id for isolation.
  ══════════════════════════════════════════════════════ */

  'scene-particles'(p, id) {
    const cid = 'c3d_' + id
    const color = p.particleColor || '#818cf8'
    const count = Math.min(parseInt(p.particleCount) || 3000, 5000)
    const speed = parseFloat(p.speed) || 0.4
    const size  = parseFloat(p.particleSize) || 0.8
    return `<section style="position:relative;background:${p.bgColor};color:${p.textColor};min-height:${p.minHeight||600}px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
  <canvas id="${cid}" style="position:absolute;inset:0;width:100%;height:100%;display:block;"></canvas>
  <div style="position:relative;z-index:2;text-align:center;padding:80px clamp(24px,8vw,96px);max-width:720px;">
    <h1 contenteditable="true" data-id="${id}" data-key="headline" style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;line-height:1.1;margin:0 0 20px;letter-spacing:-.02em;">${e(p.headline)}</h1>
    <p contenteditable="true" data-id="${id}" data-key="subheadline" style="font-size:clamp(1rem,2vw,1.2rem);opacity:.75;margin:0 0 36px;line-height:1.7;">${e(p.subheadline)}</p>
    <a href="${eu(p.ctaLink||'#')}" style="display:inline-flex;align-items:center;background:${ec(p.accentColor)};color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
      <span contenteditable="true" data-id="${id}" data-key="ctaText">${e(p.ctaText)}</span>
    </a>
  </div>
  <script>
  (function(){
    var el=document.getElementById('${cid}');if(!el)return;
    function init(){
      if(typeof THREE==='undefined')return setTimeout(init,200);
      var W=el.parentElement.offsetWidth,H=el.parentElement.offsetHeight;
      var scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,W/H,0.1,1000);
      var renderer=new THREE.WebGLRenderer({canvas:el,antialias:true,alpha:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio,2));
      renderer.setSize(W,H);camera.position.z=30;
      var geo=new THREE.BufferGeometry();
      var pos=new Float32Array(${count}*3);
      for(var i=0;i<${count}*3;i++)pos[i]=(Math.random()-0.5)*80;
      geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
      var mat=new THREE.PointsMaterial({color:'${color}',size:${size},sizeAttenuation:true,transparent:true,opacity:0.85});
      var pts=new THREE.Points(geo,mat);scene.add(pts);
      var t=0,mx=0,my=0;
      el.parentElement.addEventListener('mousemove',function(e){
        var r=el.getBoundingClientRect();
        mx=(e.clientX-r.left)/W-0.5;my=(e.clientY-r.top)/H-0.5;
      });
      function resize(){W=el.parentElement.offsetWidth;H=el.parentElement.offsetHeight;camera.aspect=W/H;camera.updateProjectionMatrix();renderer.setSize(W,H);}
      window.addEventListener('resize',resize);
      var raf;function loop(){raf=requestAnimationFrame(loop);t+=${speed}*0.005;
        pts.rotation.y=t;pts.rotation.x=t*0.4;
        camera.position.x+=(mx*8-camera.position.x)*0.05;
        camera.position.y+=(-my*8-camera.position.y)*0.05;
        camera.lookAt(scene.position);renderer.render(scene,camera);}
      loop();
      var obs=new IntersectionObserver(function(en){if(!en[0].isIntersecting)cancelAnimationFrame(raf);else loop();},{threshold:0});
      obs.observe(el.parentElement);
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  })();
  <\/script>
</section>`},

  'scene-waves'(p, id) {
    const cid   = 'c3d_' + id
    const c1    = p.waveColor1 || '#0ea5e9'
    const c2    = p.waveColor2 || '#6366f1'
    const spd   = parseFloat(p.waveSpeed) || 1.2
    const amp   = parseFloat(p.waveAmplitude) || 1.5
    const wire  = p.wireframe === 'true'
    return `<section style="position:relative;background:${p.bgColor};color:${p.textColor};min-height:${p.minHeight||560}px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
  <canvas id="${cid}" style="position:absolute;inset:0;width:100%;height:100%;display:block;"></canvas>
  <div style="position:relative;z-index:2;text-align:center;padding:80px clamp(24px,8vw,96px);max-width:680px;">
    <h2 contenteditable="true" data-id="${id}" data-key="heading" style="font-size:clamp(1.8rem,4vw,3rem);font-weight:800;line-height:1.1;margin:0 0 20px;letter-spacing:-.02em;">${e(p.heading)}</h2>
    <p contenteditable="true" data-id="${id}" data-key="subheading" style="font-size:clamp(1rem,2vw,1.2rem);opacity:.75;line-height:1.7;margin:0;">${e(p.subheading)}</p>
  </div>
  <script>
  (function(){
    var el=document.getElementById('${cid}');if(!el)return;
    function init(){
      if(typeof THREE==='undefined')return setTimeout(init,200);
      var W=el.parentElement.offsetWidth,H=el.parentElement.offsetHeight;
      var scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,W/H,0.1,1000);
      var renderer=new THREE.WebGLRenderer({canvas:el,antialias:true,alpha:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio,2));
      renderer.setSize(W,H);camera.position.set(0,12,28);camera.lookAt(0,0,0);
      var segs=80,geo=new THREE.PlaneGeometry(60,60,segs,segs);
      geo.rotateX(-Math.PI/2.5);
      var mat=new THREE.MeshBasicMaterial({color:'${c1}',wireframe:${wire},transparent:true,opacity:${wire?0.45:0.7},side:THREE.DoubleSide});
      var mesh=new THREE.Mesh(geo,mat);scene.add(mesh);
      var pos2=geo.attributes.position;
      var orig=new Float32Array(pos2.count*3);
      for(var i=0;i<pos2.count;i++){orig[i*3]=pos2.getX(i);orig[i*3+1]=pos2.getY(i);orig[i*3+2]=pos2.getZ(i);}
      var t=0;
      function resize(){W=el.parentElement.offsetWidth;H=el.parentElement.offsetHeight;camera.aspect=W/H;camera.updateProjectionMatrix();renderer.setSize(W,H);}
      window.addEventListener('resize',resize);
      var raf;function loop(){raf=requestAnimationFrame(loop);t+=${spd}*0.012;
        for(var i=0;i<pos2.count;i++){
          var ox=orig[i*3],oy=orig[i*3+1],oz=orig[i*3+2];
          var wave=Math.sin(ox*0.18+t)*${amp}+Math.sin(oz*0.22+t*0.9)*${amp}*0.7;
          pos2.setXYZ(i,ox,oy+wave,oz);
        }
        pos2.needsUpdate=true;renderer.render(scene,camera);}
      loop();
      var obs=new IntersectionObserver(function(en){if(!en[0].isIntersecting)cancelAnimationFrame(raf);else loop();},{threshold:0});
      obs.observe(el.parentElement);
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  })();
  <\/script>
</section>`},

  'scene-globe'(p, id) {
    const cid  = 'c3d_' + id
    const gc   = p.globeColor    || '#34d399'
    const gw   = p.globeWireColor|| '#6ee7b7'
    const dc   = p.dotColor      || '#a7f3d0'
    const spd  = parseFloat(p.rotateSpeed) || 0.3
    const left = p.layout === 'left'
    return `<section style="position:relative;background:${p.bgColor};color:${p.textColor};min-height:${p.minHeight||560}px;overflow:hidden;display:flex;align-items:center;">
  <canvas id="${cid}" style="position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;"></canvas>
  <div style="position:relative;z-index:2;display:grid;grid-template-columns:${S.device==='mobile'?'1fr':'1fr 1fr'};gap:${S.device==='mobile'?'32px':'64px'};align-items:center;max-width:1000px;margin:0 auto;padding:80px clamp(24px,8vw,80px);width:100%;${left&&S.device!=='mobile'?'direction:rtl;':''}">
    <div style="direction:ltr;">
      <h2 contenteditable="true" data-id="${id}" data-key="heading" style="font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;line-height:1.15;margin:0 0 20px;">${e(p.heading)}</h2>
      <p contenteditable="true" data-id="${id}" data-key="subheading" style="font-size:15px;opacity:.75;line-height:1.8;margin:0;">${e(p.subheading)}</p>
    </div>
    <div style="direction:ltr;height:320px;"></div>
  </div>
  <script>
  (function(){
    var el=document.getElementById('${cid}');if(!el)return;
    function init(){
      if(typeof THREE==='undefined')return setTimeout(init,200);
      var W=el.parentElement.offsetWidth,H=el.parentElement.offsetHeight;
      var scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,W/H,0.1,1000);
      var renderer=new THREE.WebGLRenderer({canvas:el,antialias:true,alpha:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio,2));
      renderer.setSize(W,H);
      var side=${left?'-1':'1'};
      camera.position.set(side*W*0.006,0,9);camera.lookAt(side*1.5,0,0);
      var r=3.2;
      var wGeo=new THREE.SphereGeometry(r,32,32);
      var wMat=new THREE.MeshBasicMaterial({color:'${gw}',wireframe:true,transparent:true,opacity:0.18});
      var wire=new THREE.Mesh(wGeo,wMat);wire.position.x=side*1.5;scene.add(wire);
      var sGeo=new THREE.SphereGeometry(r-0.05,32,32);
      var sMat=new THREE.MeshBasicMaterial({color:'${gc}',transparent:true,opacity:0.06});
      var sphere=new THREE.Mesh(sGeo,sMat);sphere.position.x=side*1.5;scene.add(sphere);
      var dotGeo=new THREE.BufferGeometry();var dpos=[];
      for(var i=0;i<800;i++){
        var phi=Math.acos(-1+Math.random()*2),theta=Math.random()*Math.PI*2;
        var x=r*Math.sin(phi)*Math.cos(theta);var y=r*Math.sin(phi)*Math.sin(theta);var z=r*Math.cos(phi);
        dpos.push(x+side*1.5,y,z);
      }
      dotGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(dpos),3));
      var dMat=new THREE.PointsMaterial({color:'${dc}',size:0.06,transparent:true,opacity:0.9});
      scene.add(new THREE.Points(dotGeo,dMat));
      function resize(){W=el.parentElement.offsetWidth;H=el.parentElement.offsetHeight;camera.aspect=W/H;camera.updateProjectionMatrix();renderer.setSize(W,H);}
      window.addEventListener('resize',resize);
      var t=0,raf;
      function loop(){raf=requestAnimationFrame(loop);t+=${spd}*0.005;
        wire.rotation.y=t;sphere.rotation.y=t;dotGeo.attributes.position.needsUpdate=false;
        renderer.render(scene,camera);}
      loop();
      var obs=new IntersectionObserver(function(en){if(!en[0].isIntersecting)cancelAnimationFrame(raf);else loop();},{threshold:0});
      obs.observe(el.parentElement);
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  })();
  <\/script>
</section>`},

  'scene-cards'(p, id) {
    const cid = 'c3d_' + id
    const cc  = p.cardColor   || '#1e1b4b'
    const acc = p.accentColor || '#6366f1'
    const cards = [
      {t:p.card1Title,i:p.card1Icon,d:p.card1Desc},
      {t:p.card2Title,i:p.card2Icon,d:p.card2Desc},
      {t:p.card3Title,i:p.card3Icon,d:p.card3Desc},
    ]
    return `<section style="position:relative;background:${p.bgColor};color:${p.textColor};min-height:${p.minHeight||580}px;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:80px clamp(24px,8vw,80px);">
  <canvas id="${cid}" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;"></canvas>
  <div style="position:relative;z-index:2;text-align:center;max-width:960px;width:100%;">
    <h2 contenteditable="true" data-id="${id}" data-key="heading" style="font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;line-height:1.1;margin:0 0 14px;">${e(p.heading)}</h2>
    <p contenteditable="true" data-id="${id}" data-key="subheading" style="font-size:15px;opacity:.65;margin:0 0 56px;line-height:1.7;">${e(p.subheading)}</p>
    <div style="display:grid;grid-template-columns:${S.device==='mobile'?'1fr':S.device==='tablet'?'repeat(2,1fr)':'repeat(3,1fr)'};gap:20px;">
      ${cards.map((c,i)=>`
      <div class="card3d-${id}" data-idx="${i}" style="background:${cc};border:1px solid ${acc}33;border-radius:16px;padding:32px 24px;text-align:center;transition:transform .25s,box-shadow .25s;cursor:default;position:relative;overflow:hidden;"
        onmouseover="this.style.transform='translateY(-8px) rotateX(4deg) rotateY(${i===0?'-3':i===2?'3':'0'}deg)';this.style.boxShadow='0 24px 48px ${acc}44'"
        onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:${acc}18;"></div>
        <div style="font-size:2.4rem;margin-bottom:16px;" contenteditable="true" data-id="${id}" data-key="card${i+1}Icon">${e(c.i||'✦')}</div>
        <h3 contenteditable="true" data-id="${id}" data-key="card${i+1}Title" style="font-size:18px;font-weight:700;margin:0 0 10px;color:#fff;">${e(c.t)}</h3>
        <p contenteditable="true" data-id="${id}" data-key="card${i+1}Desc" style="font-size:13px;opacity:.6;margin:0;line-height:1.6;color:#fff;">${e(c.d)}</p>
      </div>`).join('')}
    </div>
  </div>
  <script>
  (function(){
    var el=document.getElementById('${cid}');if(!el)return;
    function init(){
      if(typeof THREE==='undefined')return setTimeout(init,200);
      var W=el.parentElement.offsetWidth,H=el.parentElement.offsetHeight;
      var scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,W/H,0.1,1000);
      var renderer=new THREE.WebGLRenderer({canvas:el,antialias:true,alpha:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio,2));
      renderer.setSize(W,H);camera.position.z=20;
      var particles=[],geo=new THREE.BufferGeometry();
      var pos=new Float32Array(120*3);
      for(var i=0;i<120;i++){pos[i*3]=(Math.random()-0.5)*40;pos[i*3+1]=(Math.random()-0.5)*20;pos[i*3+2]=(Math.random()-0.5)*10-5;}
      geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
      var mat=new THREE.PointsMaterial({color:'${acc}',size:0.12,transparent:true,opacity:0.6});
      scene.add(new THREE.Points(geo,mat));
      var ringGeo=new THREE.TorusGeometry(8,0.03,8,64);
      var ringMat=new THREE.MeshBasicMaterial({color:'${acc}',transparent:true,opacity:0.15});
      var ring=new THREE.Mesh(ringGeo,ringMat);ring.rotation.x=Math.PI/3;scene.add(ring);
      function resize(){W=el.parentElement.offsetWidth;H=el.parentElement.offsetHeight;camera.aspect=W/H;camera.updateProjectionMatrix();renderer.setSize(W,H);}
      window.addEventListener('resize',resize);
      var t=0,raf;
      function loop(){raf=requestAnimationFrame(loop);t+=0.004;
        ring.rotation.z=t;geo.attributes.position.array.forEach(function(_,i){if(i%3===1)geo.attributes.position.array[i]+=Math.sin(t*0.5+i)*0.002;});
        geo.attributes.position.needsUpdate=true;renderer.render(scene,camera);}
      loop();
      var obs=new IntersectionObserver(function(en){if(!en[0].isIntersecting)cancelAnimationFrame(raf);else loop();},{threshold:0});
      obs.observe(el.parentElement);
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  })();
  <\/script>
</section>`},

  'video-hero'(p,id){
    const al       = p.align || 'center'
    const ctr      = al === 'center' ? 'text-align:center;margin:0 auto;' : ''
    const jc       = al === 'center' ? 'center' : 'flex-start'
    const tc       = p.textColor || '#ffffff'
    const ac       = p.accentColor || '#6c63ff'
    const mh       = parseInt(p.minHeight) || 600
    const ovColor  = p.overlayColor || '#000000'
    const ovOp     = parseFloat(p.overlayOpacity) || 0.5
    const autoplay = p.autoplay !== 'false'
    const loop     = p.loop !== 'false'
    const muted    = p.muted !== 'false'
    const poster   = p.posterImage || ''
    const vtype    = p.videoType || 'youtube'
    const vurl     = (p.videoUrl || '').trim()
    const vlocal   = (p.videoLocal || '').trim()

    // ── Extract YouTube / Vimeo ID ─────────────────────────────────────────
    function _ytId(u) {
      const m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      return m ? m[1] : ''
    }
    function _vmId(u) {
      const m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
      return m ? m[1] : ''
    }

    // ── Inline styles (work in both builder canvas and exported HTML) ────────
    const S_WRAP    = `position:relative;overflow:hidden;display:flex;align-items:center;justify-content:${jc};min-height:${mh}px;color:${tc};`
    const S_MEDIA   = `position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;overflow:hidden;pointer-events:none;`
    const S_IFRAME  = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:177.78vh;height:56.25vw;min-width:100%;min-height:100%;border:none;`
    const S_OVERLAY = `position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;background:${ovColor};opacity:${ovOp};`
    const S_CONTENT = `position:relative;z-index:2;width:100%;padding:80px clamp(24px,8vw,96px);`
    const S_FALLBACK= poster ? `position:absolute;top:0;left:0;width:100%;height:100%;background:url('${eu(poster)}') center/cover no-repeat;z-index:0;` : `position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#0f172a,#1e1b4b);z-index:0;`

    // ── Build media element ────────────────────────────────────────────────
    let mediaHTML = ''
    if (vtype === 'youtube' && vurl) {
      const ytId = _ytId(vurl)
      if (ytId) {
        const params = `autoplay=${autoplay?1:0}&mute=${muted?1:0}&loop=${loop?1:0}&playlist=${ytId}&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playsinline=1`
        mediaHTML = `<div style="${S_MEDIA}"><iframe src="https://www.youtube.com/embed/${ytId}?${params}" allow="autoplay;encrypted-media" allowfullscreen style="${S_IFRAME}" loading="lazy" title="Video background"></iframe></div>`
      }
    } else if (vtype === 'vimeo' && vurl) {
      const vmId = _vmId(vurl)
      if (vmId) {
        const params = `autoplay=${autoplay?1:0}&muted=${muted?1:0}&loop=${loop?1:0}&background=1&title=0&byline=0&portrait=0`
        mediaHTML = `<div style="${S_MEDIA}"><iframe src="https://player.vimeo.com/video/${vmId}?${params}" allow="autoplay;fullscreen" allowfullscreen style="${S_IFRAME}" loading="lazy" title="Video background"></iframe></div>`
      }
    } else if (vtype === 'local' && vlocal) {
      const attrs = `${autoplay?'autoplay':''} ${loop?'loop':''} ${muted?'muted':''} playsinline`
      mediaHTML = `<div style="${S_MEDIA}"><video ${attrs} poster="${e(poster)}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;"><source src="${e(vlocal)}" type="video/mp4"/>Your browser does not support video.</video></div>`
    }

    const bgLayer = mediaHTML ? mediaHTML : `<div style="${S_FALLBACK}"></div>`

    return `<section style="${S_WRAP}">
${bgLayer}
<div style="${S_OVERLAY}"></div>
<div style="${S_CONTENT}">
  <div style="max-width:700px;${ctr}">
    <h1 contenteditable="true" data-id="${id}" data-key="headline" style="font-size:clamp(2rem,5vw,3.8rem);font-weight:800;line-height:1.1;margin:0 0 20px;letter-spacing:-.02em;text-shadow:0 2px 20px rgba(0,0,0,.3)">${e(p.headline)}</h1>
    <p contenteditable="true" data-id="${id}" data-key="subheadline" style="font-size:clamp(1rem,2.5vw,1.25rem);opacity:.85;margin:0 0 40px;line-height:1.7;max-width:560px;${ctr}text-shadow:0 1px 10px rgba(0,0,0,.3)">${e(p.subheadline)}</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap;${al==='center'?'justify-content:center;':''}">
      <a href="${eu(p.ctaLink||'#')}" style="display:inline-flex;align-items:center;background:${ac};color:#fff;padding:15px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 20px rgba(0,0,0,.25)"><span contenteditable="true" data-id="${id}" data-key="ctaText">${e(p.ctaText||'Watch Demo')}</span></a>
      ${p.ctaSecText?`<a href="${eu(p.ctaSecLink||'#')}" style="display:inline-flex;align-items:center;padding:15px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;border:2px solid rgba(255,255,255,.5);color:#fff;backdrop-filter:blur(4px)"><span contenteditable="true" data-id="${id}" data-key="ctaSecText">${e(p.ctaSecText)}</span></a>`:''}
    </div>
  </div>
</div>
</section>`
  },

  'product-grid'(p,id){
    const cols = parseInt(p.cols)||3
    const currency = e(p.currency||'$')
    const showDesc = p.showDesc !== 'false'
    const showPrice = p.showPrice !== 'false'
    const showBadge = p.showBadge !== 'false'
    const bg = p.bgColor||'#ffffff'
    const tc = p.textColor||'#0f172a'
    const ac = p.accentColor||'#6c63ff'
    const cardBg = p.cardBg||'#f8fafc'
    let products = []
    try { products = JSON.parse(localStorage.getItem('pc_products_v1')||'[]') } catch{}
    const colsCSS = `repeat(${cols},1fr)`
    const cardStyle = `background:${cardBg};border-radius:14px;overflow:hidden;border:1.5px solid rgba(0,0,0,.07);transition:transform .2s,box-shadow .2s;cursor:pointer`
    const imgStyle = `width:100%;height:200px;object-fit:cover;display:block;background:#e2e8f0`
    const prodCards = products.length ? products.map(pr => {
      const badge = (showBadge && pr.badge) ? `<span style="position:absolute;top:10px;left:10px;background:${ac};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">${e(pr.badge)}</span>` : ''
      const img = pr.image ? `<img src="${e(pr.image)}" alt="${e(pr.name)}" style="${imgStyle}" loading="lazy"/>` : `<div style="${imgStyle};display:flex;align-items:center;justify-content:center;font-size:48px">${pr.icon||'🛍'}</div>`
      const priceHTML = showPrice ? `<div style="font-size:20px;font-weight:800;color:${ac};margin-bottom:6px">${currency}${(+pr.price||0).toFixed(2)}</div>` : ''
      const descHTML = showDesc && pr.description ? `<p style="font-size:13px;color:${tc};opacity:.65;line-height:1.55;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${e(pr.description)}</p>` : ''
      return `<div style="${cardStyle}" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,.1)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
  <div style="position:relative">${img}${badge}</div>
  <div style="padding:16px">
    <h3 style="font-size:15px;font-weight:700;color:${tc};margin-bottom:6px;line-height:1.3">${e(pr.name)}</h3>
    ${descHTML}${priceHTML}
    <button onclick="if(typeof Cart!=='undefined')Cart.add('${pr.id}');else alert('Add to cart not available')" style="width:100%;background:${ac};color:#fff;border:none;padding:10px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .2s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
      🛒 Add to Cart
    </button>
  </div>
</div>`
    }).join('\n') : `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;opacity:.5">
  <div style="font-size:48px;margin-bottom:12px">🛍</div>
  <p style="font-size:16px;font-weight:600">No products yet — add some in the Shop panel</p>
</div>`
    return `<section style="background:${bg};color:${tc};padding:72px clamp(24px,8vw,80px)">
<div style="max-width:1200px;margin:0 auto">
${p.heading?`<h2 style="font-size:clamp(1.6rem,3.5vw,2.6rem);font-weight:800;text-align:center;margin-bottom:${p.subheading?'12px':'48px'};color:${tc}">${e(p.heading)}</h2>`:''}
${p.subheading?`<p style="font-size:16px;text-align:center;opacity:.65;margin-bottom:48px">${e(p.subheading)}</p>`:''}
<div style="display:grid;grid-template-columns:${colsCSS};gap:24px">
${prodCards}
</div>
</div>
</section>`
  },

  'custom-html'(p,id){
    // If parsed params exist, render from template + params
    let rawCode = p.code || ''
    if (p._template && p._params) {
      try { rawCode = HTMLParamEngine.render(p._template, p._params) } catch {}
    }
    // Scope any <style> tags so they only affect this block — not the whole page
    const code = (rawCode).replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_, attrs, css) => {
      const scoped = css.replace(/([^{}]+)\{/g, (m, sel) => {
        if (/^\s*@/.test(sel.trim())) return m   // keep @keyframes, @media etc untouched
        const parts = sel.split(',').map(s => {
          const t = s.trim(); if (!t) return ''
          // body/html/:root → replace with wrapper id (not nest, because body can't be inside a div)
          if (t==='body'||t==='html'||t===':root') return `#ch_${id}`
          return `#ch_${id} ${t}`
        }).filter(Boolean)
        return parts.join(',') + '{'
      })
      return `<style${attrs}>${scoped}</style>`
    })
    return `<div id="ch_${id}" style="min-height:${p.minHeight||120}px;width:100%">${code}</div>`
  },

  'form-builder'(p,id){
    let fields=[]
    try { fields=JSON.parse(p.fields||'[]') } catch{}
    const ac = p.accentColor||'#6c63ff'
    const tc = p.textColor||'#0f172a'
    const bg = p.bgColor||'#f8fafc'
    const fieldHTML = fields.map(f => {
      const req = f.required ? ' required' : ''
      const lbl = `<label style="display:block;font-size:13px;font-weight:600;margin-bottom:5px;color:${tc}">${e(f.label)}${f.required?`<span style="color:${ac};margin-left:2px">*</span>`:''}</label>`
      const base = `width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;transition:border-color .2s;background:#fff;color:${tc}`
      let inp = ''
      if(f.type==='textarea')
        inp=`<textarea name="${e(f.id)}" placeholder="${e(f.placeholder||'')}" style="${base};resize:vertical;min-height:90px;"${req}></textarea>`
      else if(f.type==='select')
        inp=`<select name="${e(f.id)}" style="${base}"${req}>${(f.options||'').split('\n').filter(Boolean).map(o=>`<option>${e(o.trim())}</option>`).join('')}</select>`
      else if(f.type==='checkbox')
        inp=`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:400"><input type="checkbox" name="${e(f.id)}"${req} style="accent-color:${ac};width:16px;height:16px"> ${e(f.placeholder||f.label)}</label>`
      else if(f.type==='radio')
        inp=(f.options||'').split('\n').filter(Boolean).map(o=>`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:400;margin-bottom:4px"><input type="radio" name="${e(f.id)}" value="${e(o.trim())}"${req} style="accent-color:${ac};width:16px;height:16px"> ${e(o.trim())}</label>`).join('')
      else if(f.type==='file')
        inp=`<input type="file" name="${e(f.id)}"${req} style="font-size:13px;color:${tc}"/>`
      else
        inp=`<input type="${f.type==='email'?'email':f.type==='number'?'number':'text'}" name="${e(f.id)}" placeholder="${e(f.placeholder||'')}" style="${base}"${req} data-validate="${e(f.validation||'')}"/>`
      return `<div style="margin-bottom:16px">${f.type!=='checkbox'&&f.type!=='radio'?lbl:''}${inp}${f.type==='radio'?`<div style="margin-top:4px">${lbl}</div>`+inp:''}</div>`
    }).join('')
    const sc = 'scr'+'ipt'
    return`<section style="background:${bg};color:${tc};padding:72px clamp(24px,8vw,80px);">
<div style="max-width:640px;margin:0 auto;">
${p.heading?`<h2 style="font-size:clamp(1.6rem,3.5vw,2.5rem);font-weight:800;line-height:1.15;margin:0 0 12px;">${e(p.heading)}</h2>`:''}
${p.subheading?`<p style="font-size:15px;opacity:.7;margin:0 0 36px;line-height:1.7;">${e(p.subheading)}</p>`:''}
<form id="fbf_${id}" onsubmit="return _fbSubmit(event,'${id}','${e(p.webhook||'')}','${e(p.successMsg||'✅ Thank you!')}')">
${fieldHTML}
<button type="submit" style="display:inline-flex;align-items:center;gap:8px;background:${ac};color:#fff;padding:12px 28px;border-radius:10px;border:none;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .2s;margin-top:8px" onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
  <span>${e(p.submitText||'Submit')}</span>
</button>
</form>
<div id="fbsuc_${id}" style="display:none;margin-top:20px;padding:16px 20px;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.3);border-radius:10px;font-size:14px;font-weight:600;color:#059669">${e(p.successMsg||'✅ Thank you!')}</div>
</div>
<${sc}>
function _fbSubmit(ev,secId,webhook,msg){
  ev.preventDefault();
  var frm=ev.target,data={},inputs=frm.querySelectorAll('[name]');
  inputs.forEach(function(el){data[el.name]=el.type==='checkbox'?el.checked:el.value});
  data._submittedAt=new Date().toISOString(); data._sectionId=secId;
  try{var subs=JSON.parse(localStorage.getItem('pc_form_subs_v1')||'[]');subs.unshift(data);localStorage.setItem('pc_form_subs_v1',JSON.stringify(subs.slice(0,500)));}catch(e){}
  if(webhook){fetch(webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(function(){});}
  frm.style.display='none';
  var suc=document.getElementById('fbsuc_'+secId);if(suc){suc.textContent=msg||'✅ Thank you!';suc.style.display='block';}
  return false;
}
<\/${sc}>
</section>`},
}

/* ══════════════════════════════════════════════════════
   PANEL SCHEMAS
══════════════════════════════════════════════════════ */
const ES={
  hero:[{g:'Content',f:[{k:'headline',l:'Headline',t:'text'},{k:'subheadline',l:'Sub-headline',t:'textarea'},{k:'ctaText',l:'CTA Text',t:'text'},{k:'ctaLink',l:'CTA URL',t:'text'},{k:'ctaSecText',l:'2nd CTA',t:'text'},{k:'ctaSecLink',l:'2nd URL',t:'text'}]},{g:'Layout',f:[{k:'align',l:'Alignment',t:'select',o:['center','left']},{k:'minHeight',l:'Height (px)',t:'text'}]},{g:'Background Image',f:[{k:'bgImage',l:'BG Image',t:'img'}]},{g:'Video Background (optional)',f:[{k:'videoEnabled',l:'Enable Video BG',t:'select',o:['false','true']},{k:'videoType',l:'Source',t:'select',o:['youtube','vimeo']},{k:'videoUrl',l:'YouTube / Vimeo URL',t:'text'},{k:'overlayOpacity',l:'Overlay Opacity (0–1)',t:'text'}]}],
  about:[{g:'Text',f:[{k:'subheading',l:'Eyebrow',t:'text'},{k:'heading',l:'Heading',t:'text'},{k:'body',l:'Body',t:'textarea'},{k:'highlight',l:'Highlight',t:'textarea'}]},{g:'Image',f:[{k:'image',l:'Section Image',t:'img'},{k:'imagePos',l:'Image Side',t:'select',o:['right','left']}]}],
  contact:[{g:'Text',f:[{k:'heading',l:'Heading',t:'text'},{k:'subheading',l:'Sub-heading',t:'textarea'}]},{g:'Info',f:[{k:'email',l:'Email',t:'text'},{k:'phone',l:'Phone',t:'text'},{k:'address',l:'Address',t:'textarea'},{k:'showMap',l:'Show Map',t:'select',o:['true','false']}]}],
  features:[{g:'Header',f:[{k:'heading',l:'Heading',t:'text'},{k:'subheading',l:'Sub-heading',t:'textarea'}]},{g:'Feature 1',f:[{k:'feat1Icon',l:'Icon',t:'text'},{k:'feat1Title',l:'Title',t:'text'},{k:'feat1Desc',l:'Desc',t:'textarea'}]},{g:'Feature 2',f:[{k:'feat2Icon',l:'Icon',t:'text'},{k:'feat2Title',l:'Title',t:'text'},{k:'feat2Desc',l:'Desc',t:'textarea'}]},{g:'Feature 3',f:[{k:'feat3Icon',l:'Icon',t:'text'},{k:'feat3Title',l:'Title',t:'text'},{k:'feat3Desc',l:'Desc',t:'textarea'}]}],
  testimonial:[{g:'Content',f:[{k:'quote',l:'Quote',t:'textarea'},{k:'author',l:'Author',t:'text'},{k:'role',l:'Role',t:'text'},{k:'rating',l:'Stars',t:'select',o:['5','4','3','2','1']}]},{g:'Avatar',f:[{k:'avatar',l:'Avatar Image',t:'img'}]}],
  footer:[{g:'Brand',f:[{k:'brand',l:'Brand',t:'text'},{k:'tagline',l:'Tagline',t:'text'},{k:'copyright',l:'Copyright',t:'text'}]},{g:'Links',f:[{k:'link1Label',l:'Link 1',t:'text'},{k:'link1Href',l:'URL 1',t:'text'},{k:'link2Label',l:'Link 2',t:'text'},{k:'link2Href',l:'URL 2',t:'text'},{k:'link3Label',l:'Link 3',t:'text'},{k:'link3Href',l:'URL 3',t:'text'}]}],

  pricing:[
    {g:'Header',f:[{k:'heading',l:'Heading',t:'text'},{k:'subheading',l:'Sub-heading',t:'textarea'},{k:'toggleMonthly',l:'Monthly Label',t:'text'},{k:'toggleAnnual',l:'Annual Label',t:'text'},{k:'annualDiscount',l:'Discount Badge',t:'text'}]},
    {g:'Starter Plan',f:[{k:'t1Name',l:'Plan Name',t:'text'},{k:'t1Desc',l:'Description',t:'textarea'},{k:'t1PriceMonthly',l:'Price (Monthly)',t:'text'},{k:'t1PriceAnnual',l:'Price (Annual)',t:'text'},{k:'t1Cta',l:'Button Text',t:'text'},{k:'t1CtaLink',l:'Button URL',t:'text'},{k:'t1f1',l:'Feature 1',t:'text'},{k:'t1f2',l:'Feature 2',t:'text'},{k:'t1f3',l:'Feature 3',t:'text'},{k:'t1f4',l:'Feature 4',t:'text'},{k:'t1featured',l:'Featured Card',t:'select',o:['false','true']}]},
    {g:'Pro Plan',f:[{k:'t2Name',l:'Plan Name',t:'text'},{k:'t2Desc',l:'Description',t:'textarea'},{k:'t2PriceMonthly',l:'Price (Monthly)',t:'text'},{k:'t2PriceAnnual',l:'Price (Annual)',t:'text'},{k:'t2Cta',l:'Button Text',t:'text'},{k:'t2CtaLink',l:'Button URL',t:'text'},{k:'t2f1',l:'Feature 1',t:'text'},{k:'t2f2',l:'Feature 2',t:'text'},{k:'t2f3',l:'Feature 3',t:'text'},{k:'t2f4',l:'Feature 4',t:'text'},{k:'t2f5',l:'Feature 5',t:'text'},{k:'t2f6',l:'Feature 6',t:'text'},{k:'t2featured',l:'Featured Card',t:'select',o:['true','false']}]},
    {g:'Enterprise Plan',f:[{k:'t3Name',l:'Plan Name',t:'text'},{k:'t3Desc',l:'Description',t:'textarea'},{k:'t3PriceMonthly',l:'Price (Monthly)',t:'text'},{k:'t3PriceAnnual',l:'Price (Annual)',t:'text'},{k:'t3Cta',l:'Button Text',t:'text'},{k:'t3CtaLink',l:'Button URL',t:'text'},{k:'t3f1',l:'Feature 1',t:'text'},{k:'t3f2',l:'Feature 2',t:'text'},{k:'t3f3',l:'Feature 3',t:'text'},{k:'t3f4',l:'Feature 4',t:'text'},{k:'t3f5',l:'Feature 5',t:'text'},{k:'t3f6',l:'Feature 6',t:'text'},{k:'t3featured',l:'Featured Card',t:'select',o:['false','true']}]},
  ],

  faq:[
    {g:'Header',f:[{k:'heading',l:'Heading',t:'text'},{k:'subheading',l:'Sub-heading',t:'textarea'}]},
    {g:'Question 1',f:[{k:'q1',l:'Question',t:'text'},{k:'a1',l:'Answer',t:'textarea'}]},
    {g:'Question 2',f:[{k:'q2',l:'Question',t:'text'},{k:'a2',l:'Answer',t:'textarea'}]},
    {g:'Question 3',f:[{k:'q3',l:'Question',t:'text'},{k:'a3',l:'Answer',t:'textarea'}]},
    {g:'Question 4',f:[{k:'q4',l:'Question',t:'text'},{k:'a4',l:'Answer',t:'textarea'}]},
    {g:'Question 5',f:[{k:'q5',l:'Question',t:'text'},{k:'a5',l:'Answer',t:'textarea'}]},
    {g:'Question 6',f:[{k:'q6',l:'Question',t:'text'},{k:'a6',l:'Answer',t:'textarea'}]},
  ],

  gallery:[
    {g:'Header',f:[{k:'heading',l:'Heading',t:'text'},{k:'subheading',l:'Sub-heading',t:'textarea'}]},
    {g:'Layout',f:[{k:'layout',l:'Layout Style',t:'select',o:['grid','masonry','featured']},{k:'cols',l:'Columns',t:'select',o:['2','3','4']}]},
    {g:'Image 1',f:[{k:'img1',l:'Image',t:'img'},{k:'cap1',l:'Caption',t:'text'}]},
    {g:'Image 2',f:[{k:'img2',l:'Image',t:'img'},{k:'cap2',l:'Caption',t:'text'}]},
    {g:'Image 3',f:[{k:'img3',l:'Image',t:'img'},{k:'cap3',l:'Caption',t:'text'}]},
    {g:'Image 4',f:[{k:'img4',l:'Image',t:'img'},{k:'cap4',l:'Caption',t:'text'}]},
    {g:'Image 5',f:[{k:'img5',l:'Image',t:'img'},{k:'cap5',l:'Caption',t:'text'}]},
    {g:'Image 6',f:[{k:'img6',l:'Image',t:'img'},{k:'cap6',l:'Caption',t:'text'}]},
  ],

  'scene-particles':[
    {g:'Content',f:[{k:'headline',l:'Headline',t:'text'},{k:'subheadline',l:'Sub-headline',t:'textarea'},{k:'ctaText',l:'CTA Text',t:'text'},{k:'ctaLink',l:'CTA URL',t:'text'}]},
    {g:'3D Settings',f:[{k:'particleCount',l:'Particle Count',t:'select',o:['1000','2000','3000','5000']},{k:'particleSize',l:'Particle Size',t:'select',o:['0.5','0.8','1.2','2.0']},{k:'speed',l:'Speed',t:'select',o:['0.2','0.4','0.8','1.5']}]},
    {g:'Height',f:[{k:'minHeight',l:'Min Height (px)',t:'text'}]},
  ],
  'scene-waves':[
    {g:'Content',f:[{k:'heading',l:'Heading',t:'text'},{k:'subheading',l:'Sub-heading',t:'textarea'}]},
    {g:'3D Settings',f:[{k:'waveSpeed',l:'Wave Speed',t:'select',o:['0.5','1.0','1.5','2.5']},{k:'waveAmplitude',l:'Amplitude',t:'select',o:['0.8','1.5','2.5','4.0']},{k:'wireframe',l:'Style',t:'select',o:['false','true']}]},
    {g:'Height',f:[{k:'minHeight',l:'Min Height (px)',t:'text'}]},
  ],
  'scene-globe':[
    {g:'Content',f:[{k:'heading',l:'Heading',t:'text'},{k:'subheading',l:'Sub-heading',t:'textarea'}]},
    {g:'3D Settings',f:[{k:'rotateSpeed',l:'Rotation Speed',t:'select',o:['0.1','0.3','0.6','1.0']},{k:'layout',l:'Globe Side',t:'select',o:['right','left']}]},
    {g:'Height',f:[{k:'minHeight',l:'Min Height (px)',t:'text'}]},
  ],
  'scene-cards':[
    {g:'Header',f:[{k:'heading',l:'Heading',t:'text'},{k:'subheading',l:'Sub-heading',t:'textarea'}]},
    {g:'Card 1',f:[{k:'card1Icon',l:'Icon',t:'text'},{k:'card1Title',l:'Title',t:'text'},{k:'card1Desc',l:'Description',t:'textarea'}]},
    {g:'Card 2',f:[{k:'card2Icon',l:'Icon',t:'text'},{k:'card2Title',l:'Title',t:'text'},{k:'card2Desc',l:'Description',t:'textarea'}]},
    {g:'Card 3',f:[{k:'card3Icon',l:'Icon',t:'text'},{k:'card3Title',l:'Title',t:'text'},{k:'card3Desc',l:'Description',t:'textarea'}]},
    {g:'Height',f:[{k:'minHeight',l:'Min Height (px)',t:'text'}]},
  ],

  'custom-html':[
    {g:'HTML / CSS / JS',f:[{k:'code',l:'Code',t:'textarea'}]},
    {g:'Layout',f:[{k:'minHeight',l:'Min Height (px)',t:'text'}]},
  ],

  'form-builder':[
    {g:'Form Settings',f:[
      {k:'heading',   l:'Heading',       t:'text'},
      {k:'subheading',l:'Sub-heading',   t:'textarea'},
      {k:'submitText',l:'Submit Button', t:'text'},
      {k:'successMsg',l:'Success Message',t:'textarea'},
      {k:'webhook',   l:'Webhook URL (POST)',t:'text'},
    ]},
  ],

  'video-hero':[
    {g:'Content',f:[
      {k:'headline',   l:'Headline',     t:'text'},
      {k:'subheadline',l:'Sub-headline', t:'textarea'},
      {k:'ctaText',    l:'CTA Button',   t:'text'},
      {k:'ctaLink',    l:'CTA URL',      t:'text'},
      {k:'ctaSecText', l:'2nd CTA',      t:'text'},
      {k:'ctaSecLink', l:'2nd URL',      t:'text'},
    ]},
    {g:'Video Source',f:[
      {k:'videoType', l:'Source Type',  t:'select', o:['youtube','vimeo','local','none']},
      {k:'videoUrl',  l:'YouTube / Vimeo URL', t:'text'},
      {k:'posterImage',l:'Poster / Fallback Image', t:'img'},
    ]},
    {g:'Playback',f:[
      {k:'autoplay', l:'Autoplay',  t:'select', o:['true','false']},
      {k:'loop',     l:'Loop',      t:'select', o:['true','false']},
      {k:'muted',    l:'Muted',     t:'select', o:['true','false']},
    ]},
    {g:'Overlay',f:[
      {k:'overlayOpacity', l:'Overlay Opacity (0–1)', t:'text'},
    ]},
    {g:'Layout',f:[
      {k:'align',    l:'Alignment', t:'select', o:['center','left']},
      {k:'minHeight',l:'Height (px)',t:'text'},
    ]},
  ],

  'product-grid':[
    {g:'Header',f:[
      {k:'heading',   l:'Heading',    t:'text'},
      {k:'subheading',l:'Sub-heading',t:'textarea'},
    ]},
    {g:'Layout',f:[
      {k:'cols',      l:'Columns',    t:'select',o:['3','2','4','1']},
      {k:'currency',  l:'Currency Symbol',t:'text'},
      {k:'showPrice', l:'Show Price', t:'select',o:['true','false']},
      {k:'showDesc',  l:'Show Description',t:'select',o:['true','false']},
      {k:'showBadge', l:'Show Badge', t:'select',o:['true','false']},
    ]},
  ],
}
const SS={
  hero:[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'}],
  about:[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'accentColor',l:'Accent',t:'color'}],
  contact:[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'accentColor',l:'Accent',t:'color'}],
  features:[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'accentColor',l:'Accent',t:'color'}],
  testimonial:[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'accentColor',l:'Accent',t:'color'}],
  footer:[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'}],
  pricing:[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'accentColor',l:'Accent / Card Color',t:'color'}],
  faq:[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'accentColor',l:'Accent Color',t:'color'}],
  gallery:[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'accentColor',l:'Accent Color',t:'color'}],
  'scene-particles':[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'particleColor',l:'Particle Color',t:'color'},{k:'accentColor',l:'CTA Color',t:'color'}],
  'scene-waves':[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'waveColor1',l:'Wave Color 1',t:'color'},{k:'waveColor2',l:'Wave Color 2',t:'color'}],
  'scene-globe':[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'globeColor',l:'Globe Fill',t:'color'},{k:'globeWireColor',l:'Globe Wire',t:'color'},{k:'dotColor',l:'Dot Color',t:'color'}],
  'scene-cards':[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'cardColor',l:'Card Color',t:'color'},{k:'accentColor',l:'Accent Color',t:'color'}],
  'form-builder':[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'accentColor',l:'Accent / Button Color',t:'color'}],
  'video-hero':[{k:'overlayColor',l:'Overlay Color',t:'color'},{k:'textColor',l:'Text Color',t:'color'},{k:'accentColor',l:'CTA Button Color',t:'color'}],
  'product-grid':[{k:'bgColor',l:'Background',t:'color'},{k:'textColor',l:'Text',t:'color'},{k:'accentColor',l:'Accent / Button Color',t:'color'},{k:'cardBg',l:'Card Background',t:'color'}],
}
