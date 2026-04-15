/* design-studio.js — PageCraft Unified Design Studio v5.5
   Merges: FabricEngine + CompositionEngine + ImageEditor + ElementPicker
   CLAUDE.md: modular controller, < 300 lines, dispose() on close. */

const DesignStudio = (() => {
  'use strict'

  let _modal   = null
  let _fc      = null
  let _imgEl   = null
  let _filters = {}
  let _guides  = { h: null, v: null }

  const DEFAULTS = { brightness:0, contrast:0, saturation:0, blur:0, invert:0, sepia:0, noise:0, hue:0 }
  const SNAP = 8

  // ── Modal ─────────────────────────────────────────────────────────────────
  function _ensureModal() {
    if (_modal) return
    _modal = document.createElement('div')
    _modal.id = 'ds-modal'
    _modal.innerHTML = `
      <div class="ds-topbar">
        <div class="ds-title"><span class="ds-logo">🎨</span><span>Design Studio</span><span class="ds-badge">v5.5</span></div>
        <div class="ds-mode-tabs">
          <button class="ds-mode active" data-p="edit"    onclick="DesignStudio._switchPanel('edit')">✏️ Edit</button>
          <button class="ds-mode"        data-p="compose" onclick="DesignStudio._switchPanel('compose')">🎭 Compose</button>
          <button class="ds-mode ds-ai"  data-p="ai"      onclick="DesignStudio._launchAI()">✨ AI</button>
        </div>
        <div class="ds-actions">
          <button class="ds-btn-ghost" onclick="DesignStudio.resetAll()" title="Reset">↺ Reset</button>
          <button class="ds-btn-ghost" onclick="DesignStudio.deleteSelected()" title="Delete selected">🗑</button>
          <button class="ds-btn-ghost" onclick="DesignStudio.download()">⬇ Save</button>
          <button class="ds-btn-primary" onclick="DesignStudio.save()">Apply ✓</button>
          <button class="ds-btn-close"  onclick="DesignStudio.close()">✕</button>
        </div>
      </div>
      <div class="ds-body">
        <div class="ds-sidebar" id="ds-sidebar">
          <div class="ds-panel active" id="ds-panel-edit"></div>
          <div class="ds-panel"        id="ds-panel-compose"></div>
        </div>
        <div class="ds-canvas-area" id="ds-canvas-area">
          <canvas id="ds-canvas"></canvas>
          <div id="ds-obj-inspector"></div>
        </div>
        <div class="ds-layers-panel">
          <div class="ds-layers-title">Layers</div>
          <div id="ds-layers-list"></div>
        </div>
      </div>`
    document.body.appendChild(_modal)
  }

  // ── Launch ────────────────────────────────────────────────────────────────
  function launch(imgEl) {
    if (typeof fabric === 'undefined') { toast('Fabric.js not loaded', '⚠️'); return }
    _imgEl   = imgEl
    _filters = { ...DEFAULTS }
    _ensureModal()
    _modal.style.display = 'flex'
    if (_fc) { _fc.dispose(); _fc = null }
    requestAnimationFrame(_initFabric)
    DesignSidebar.mountEdit('ds-panel-edit')
    DesignSidebar.mountCompose('ds-panel-compose')
  }

  // ── Canvas init ───────────────────────────────────────────────────────────
  function _initFabric() {
    const area = document.getElementById('ds-canvas-area')
    if (!area) return
    const W = area.clientWidth || 900, H = area.clientHeight || 560

    _fc = new fabric.Canvas('ds-canvas', { width: W, height: H, backgroundColor: '#111', selection: true })

    const src = _imgEl?.currentSrc || _imgEl?.src || ''
    if (!src) { toast('No image source', '⚠️'); return }

    fabric.Image.fromURL(src, img => {
      if (!img) return
      const scale = Math.min((W * 0.9) / img.width, (H * 0.9) / img.height, 1)
      img.set({ left: W/2, top: H/2, originX:'center', originY:'center',
                scaleX: scale, scaleY: scale,
                cornerSize: 10, cornerColor:'#0096ff', cornerStrokeColor:'#fff',
                borderColor:'#0096ff', transparentCorners: false, hasRotatingPoint: true,
                name: '__base__' })
      _fc.add(img); _fc.setActiveObject(img); _fc.renderAll()
      _setupSnap()
      _fc.on('selection:created', () => { _updateLayers(); ObjectInspector.show(_fc.getActiveObject(), _fc) })
      _fc.on('selection:updated', () => { _updateLayers(); ObjectInspector.show(_fc.getActiveObject(), _fc) })
      _fc.on('selection:cleared', () => { _updateLayers(); ObjectInspector.hide() })
      _fc.on('object:added',   _updateLayers)
      _fc.on('object:removed', _updateLayers)
      _fc.on('object:modified',_updateLayers)
    }, { crossOrigin: 'anonymous' })
  }

  // ── Snap guides ───────────────────────────────────────────────────────────
  function _setupSnap() {
    const W = _fc.width, H = _fc.height
    _fc.on('object:moving', e => {
      const o = e.target; if (o.name === '__base__') return
      const cx = o.getCenterPoint().x, cy = o.getCenterPoint().y
      Math.abs(cx - W/2) < SNAP ? (o.setCenterX(W/2), _showGuide('v', W/2)) : _hideGuide('v')
      Math.abs(cy - H/2) < SNAP ? (o.setCenterY(H/2), _showGuide('h', H/2)) : _hideGuide('h')
    })
    _fc.on('object:moved', () => { _hideGuide('h'); _hideGuide('v') })
  }

  function _showGuide(dir, pos) {
    if (_guides[dir]) _fc.remove(_guides[dir])
    const W = _fc.width, H = _fc.height
    _guides[dir] = new fabric.Line(dir === 'h' ? [0,pos,W,pos] : [pos,0,pos,H], {
      stroke:'#0096ff', strokeWidth:1, strokeDashArray:[5,5],
      selectable:false, evented:false, name:'__guide__' })
    _fc.add(_guides[dir]); _fc.bringToFront(_guides[dir])
  }
  function _hideGuide(dir) { if (_guides[dir]) { _fc.remove(_guides[dir]); _guides[dir]=null } }

  // ── Filters ───────────────────────────────────────────────────────────────
  const _ff = {
    brightness: v => new fabric.Image.filters.Brightness({ brightness: v }),
    contrast:   v => new fabric.Image.filters.Contrast({ contrast: v }),
    saturation: v => new fabric.Image.filters.Saturation({ saturation: v }),
    hue:        v => v !== 0 ? new fabric.Image.filters.HueRotation({ rotation: v }) : null,
    blur:       v => v > 0 ? new fabric.Image.filters.Blur({ blur: v }) : null,
    noise:      v => v > 0 ? new fabric.Image.filters.Noise({ noise: v * 100 }) : null,
    invert:     v => v > 0 ? new fabric.Image.filters.Invert() : null,
    sepia:      v => v > 0 ? new fabric.Image.filters.Sepia() : null,
  }

  function applyFilter(key, value) {
    const base = _base(); if (!base) return
    if (key === 'opacity') { base.set('opacity', value); _fc?.renderAll(); return }
    _filters[key] = value
    base.filters = Object.entries(_filters).map(([k,v]) => _ff[k]?.(v)).filter(Boolean)
    base.applyFilters(); _fc?.renderAll()
  }

  function applyPreset(preset) {
    const presets = {
      vivid:     { brightness:.08, contrast:.2,  saturation:.4, hue:0,   blur:0, noise:0, invert:0, sepia:0 },
      matte:     { brightness:.05, contrast:-.1, saturation:-.2,hue:0,   blur:0, noise:.1,invert:0, sepia:0 },
      bw:        { brightness:0,   contrast:.1,  saturation:-1, hue:0,   blur:0, noise:0, invert:0, sepia:0 },
      cinematic: { brightness:-.05,contrast:.25, saturation:.1, hue:.02, blur:0, noise:0, invert:0, sepia:0 },
      cool:      { brightness:0,   contrast:.05, saturation:.1, hue:.15, blur:0, noise:0, invert:0, sepia:0 },
      warm:      { brightness:.05, contrast:.05, saturation:.15,hue:-.05,blur:0, noise:0, invert:0, sepia:0 },
      faded:     { brightness:.1,  contrast:-.2, saturation:-.3,hue:0,   blur:0, noise:.15,invert:0,sepia:0 },
      sepia:     { brightness:0,   contrast:0,   saturation:0,  hue:0,   blur:0, noise:0, invert:0, sepia:1 },
    }
    if (!presets[preset]) return
    _filters = { ...presets[preset] }
    const base = _base(); if (!base) return
    base.filters = Object.entries(_filters).map(([k,v]) => _ff[k]?.(v)).filter(Boolean)
    base.applyFilters(); _fc?.renderAll()
    DesignSidebar.syncSliders(_filters)
  }

  function rotate(deg) { const b=_base(); if(b){b.set('angle',(b.angle+deg)%360);_fc?.renderAll()} }
  function flip(axis)  { const b=_base(); if(b){const k=axis==='H'?'flipX':'flipY';b.set(k,!b[k]);_fc?.renderAll()} }

  function clipTo(shape) {
    const b=_base(); if(!b||!_fc) return
    const w=b.getScaledWidth(), h=b.getScaledHeight()
    const clips={
      circle:  ()=>new fabric.Circle({radius:Math.min(w,h)/2,originX:'center',originY:'center',left:0,top:0}),
      rounded: ()=>new fabric.Rect({width:w,height:h,rx:w*.08,ry:h*.08,originX:'center',originY:'center',left:0,top:0}),
      square:  ()=>{const s=Math.min(w,h);return new fabric.Rect({width:s,height:s,originX:'center',originY:'center',left:0,top:0})},
    }
    b.clipPath = clips[shape]?.() || null; _fc.renderAll()
  }

  function resetAll() {
    _filters = { ...DEFAULTS }
    const b = _base()
    if (b) { b.filters=[]; b.applyFilters(); b.set({angle:0,flipX:false,flipY:false,clipPath:null,opacity:1}); _fc?.renderAll() }
    DesignSidebar.resetEdit()
  }

  // ── Compose: add elements ─────────────────────────────────────────────────
  function addText(text='Text', opts={}) {
    if (!_fc) return
    const obj = new fabric.IText(text, {
      left:_fc.width/2, top:_fc.height/2, originX:'center', originY:'center',
      fontFamily:opts.font||'Arial', fontSize:opts.size||36,
      fill:opts.color||'#ffffff', stroke:opts.stroke||null, strokeWidth:opts.strokeWidth||0,
      fontWeight:opts.bold?'bold':'normal', fontStyle:opts.italic?'italic':'normal',
      shadow:opts.shadow?new fabric.Shadow({color:'rgba(0,0,0,.6)',blur:10,offsetX:3,offsetY:3}):null,
      textBackgroundColor:opts.bgColor||'',
      cornerSize:10, cornerColor:'#0096ff', borderColor:'#0096ff',
      cornerStrokeColor:'#fff', transparentCorners:false, name:'text_'+Date.now()
    })
    _fc.add(obj); _fc.setActiveObject(obj); _fc.renderAll()
  }

  function addShape(type, opts={}) {
    if (!_fc) return
    const cx=_fc.width/2, cy=_fc.height/2, fill=opts.fill||'#6c63ff'
    const base={left:cx,top:cy,originX:'center',originY:'center',fill,
                stroke:opts.stroke||null,strokeWidth:opts.strokeWidth||0,
                cornerSize:10,cornerColor:'#0096ff',borderColor:'#0096ff',
                cornerStrokeColor:'#fff',transparentCorners:false,name:type+'_'+Date.now()}
    const shapes={
      circle:   ()=>new fabric.Circle({...base,radius:50}),
      rect:     ()=>new fabric.Rect({...base,width:100,height:100,rx:opts.rounded?12:0,ry:opts.rounded?12:0}),
      triangle: ()=>new fabric.Triangle({...base,width:100,height:86}),
      line:     ()=>new fabric.Line([cx-80,cy,cx+80,cy],{...base,stroke:fill,strokeWidth:opts.sw||4}),
      star:     ()=>_poly(cx,cy,5,50,22,base),
      heart:    ()=>new fabric.Path('M0,-30C0,-58-46,-58-46,-28C-46,4 0,40 0,58C0,40 46,4 46,-28C46,-58 0,-58 0,-30Z',{...base}),
      diamond:  ()=>_poly(cx,cy,4,55,55,base),
      hexagon:  ()=>_poly(cx,cy,6,50,50,base),
    }
    const obj=shapes[type]?.(); if(!obj)return
    _fc.add(obj); _fc.setActiveObject(obj); _fc.renderAll()
  }

  function _poly(cx,cy,n,outer,inner,base){
    const same=outer===inner
    const pts=[]
    for(let i=0;i<n*(same?1:2);i++){
      const r=(!same&&i%2)?inner:outer
      const a=(Math.PI/n)*i-Math.PI/2
      pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)})
    }
    return new fabric.Polygon(pts,{...base})
  }

  function addSticker(svgStr) {
    if (!_fc) return
    fabric.loadSVGFromString(svgStr,(objects,options)=>{
      const obj=fabric.util.groupSVGElements(objects,options)
      const sc=80/Math.max(obj.width||80,obj.height||80)
      obj.set({left:_fc.width/2,top:_fc.height/2,originX:'center',originY:'center',
               scaleX:sc,scaleY:sc,cornerSize:10,cornerColor:'#0096ff',borderColor:'#0096ff',
               cornerStrokeColor:'#fff',transparentCorners:false,name:'sticker_'+Date.now()})
      _fc.add(obj); _fc.setActiveObject(obj); _fc.renderAll()
    })
  }

  // ── Layers ────────────────────────────────────────────────────────────────
  function _base()    { return _fc?.getObjects().find(o=>o.name==='__base__')||null }
  function _getObjs() { return _fc?.getObjects().filter(o=>!['__base__','__guide__'].includes(o.name))||[] }

  function _updateLayers() {
    const list=document.getElementById('ds-layers-list'); if(!list||!_fc)return
    const active=_fc.getActiveObject(), objs=_getObjs()
    list.innerHTML=[...objs].reverse().map((o,i)=>{
      const ri=objs.length-1-i
      const icon=o.type?.includes('text')?'📝':o.type==='image'?'🖼':'🔷'
      const label=(o.name||o.type).replace(/_\d+$/,'')
      return`<div class="ds-layer-item${o===active?' active':''}" onclick="DesignStudio._sel(${ri})">
        <span>${icon}</span><span class="ds-lname">${label}</span>
        <div class="ds-lbtns">
          <button onclick="DesignStudio._up(${ri});event.stopPropagation()">↑</button>
          <button onclick="DesignStudio._dn(${ri});event.stopPropagation()">↓</button>
          <button onclick="DesignStudio._del(${ri});event.stopPropagation()">✕</button>
        </div></div>`
    }).join('')
  }

  function _sel(i){const o=_getObjs()[i];if(o&&_fc){_fc.setActiveObject(o);_fc.renderAll();_updateLayers()}}
  function _up(i) {const o=_getObjs()[i];if(o&&_fc){_fc.bringForward(o);_fc.renderAll();_updateLayers()}}
  function _dn(i) {const o=_getObjs()[i];if(o&&_fc){_fc.sendBackwards(o);_fc.renderAll();_updateLayers()}}
  function _del(i){const o=_getObjs()[i];if(o&&_fc){_fc.remove(o);_fc.renderAll();_updateLayers()}}

  function deleteSelected(){const a=_fc?.getActiveObject();if(a&&a.name!=='__base__'){_fc.remove(a);_fc.renderAll();_updateLayers();ObjectInspector.hide()}}

  // ── Panel switch ──────────────────────────────────────────────────────────
  function _switchPanel(id){
    _modal?.querySelectorAll('.ds-panel,.ds-mode').forEach(el=>{
      el.classList.toggle('active', el.dataset.p===id || el.id==='ds-panel-'+id)
    })
  }
  function _launchAI(){if(typeof AIStudio!=='undefined')AIStudio.open(_imgEl);else toast('AI Studio not loaded','⚠️')}

  // ── Save / Download ───────────────────────────────────────────────────────
  function download(){
    if(!_fc)return; _hideGuide('h'); _hideGuide('v')
    const a=document.createElement('a')
    a.download='pagecraft-design.png'; a.href=_fc.toDataURL({format:'png',quality:1,multiplier:2}); a.click(); toast('Downloaded ✓','⬇')
  }

  function save(){
    if(!_fc||!_imgEl){close();return}; _hideGuide('h'); _hideGuide('v')
    const dataURL=_fc.toDataURL({format:'jpeg',quality:0.93,multiplier:2}), oldSrc=_imgEl.getAttribute('src')
    _imgEl.src=dataURL
    const secId=_imgEl.closest('.section-wrapper')?.dataset?.id, propKey=_imgEl.dataset?.pcProp
    if(secId&&typeof S!=='undefined'){
      const sec=S.sections?.find(s=>s.id===secId)
      if(sec?.props?._customHtml&&oldSrc){sec.props._customHtml=sec.props._customHtml.split(oldSrc).join(dataURL);typeof scheduleAutoSave==='function'&&scheduleAutoSave()}
      else if(propKey&&typeof PropertyBridge!=='undefined')PropertyBridge.update(secId,propKey,dataURL)
      else typeof scheduleAutoSave==='function'&&scheduleAutoSave()
    }
    try{const lib=JSON.parse(localStorage.getItem('pc_media_v1')||'[]');lib.unshift({id:'ds_'+Date.now(),src:dataURL,name:'Design '+new Date().toLocaleTimeString(),source:'DesignStudio'});localStorage.setItem('pc_media_v1',JSON.stringify(lib.slice(0,50)))}catch(e){}
    if(typeof pushH==='function')pushH('Design: '+(_imgEl.alt||'image')); toast('Design applied ✓','🎨'); close()
  }

  function close(){
    if(_fc){_fc.dispose();_fc=null}; if(_modal)_modal.style.display='none'
    _imgEl=null; _guides={h:null,v:null}; ObjectInspector.hide()
  }

  return{launch,close,save,download,applyFilter,applyPreset,rotate,flip,clipTo,resetAll,
         addText,addShape,addSticker,deleteSelected,
         _switchPanel,_launchAI,_sel,_up,_dn,_del,_updateLayers,
         getCanvas:()=>_fc, getBase:()=>_base()}
})()
window.PageCraft=window.PageCraft||{}
window.PageCraft.DesignStudio=DesignStudio
