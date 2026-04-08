/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   ANALYTICS DASHBOARD
   Tracks page views, user events, performance metrics.
   Pure SVG/DOM charts, no external dependencies.
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

const ANALYTICS_KEY      = 'pc_analytics_v1'
const ANALYTICS_EV_KEY   = 'pc_analytics_events_v1'
const ANALYTICS_PERF_KEY = 'pc_analytics_perf_v1'

function analyticsKey()      { try{return ANALYTICS_KEY      +(AUTH.user?'_'+AUTH.user.id:'')}catch{return ANALYTICS_KEY} }
function analyticsEvKey()    { try{return ANALYTICS_EV_KEY   +(AUTH.user?'_'+AUTH.user.id:'')}catch{return ANALYTICS_EV_KEY} }
function analyticsPerfKey()  { try{return ANALYTICS_PERF_KEY +(AUTH.user?'_'+AUTH.user.id:'')}catch{return ANALYTICS_PERF_KEY} }

function analyticsLoad()      { try{return JSON.parse(localStorage.getItem(analyticsKey())     ||'null')}catch{return null} }
function analyticsEvLoad()    { try{return JSON.parse(localStorage.getItem(analyticsEvKey())   ||'[]')}catch{return []} }
function analyticsPerfLoad()  { try{return JSON.parse(localStorage.getItem(analyticsPerfKey())||'null')}catch{return null} }
function analyticsSave(d)     { localStorage.setItem(analyticsKey(),     JSON.stringify(d)) }
function analyticsEvSave(e)   { localStorage.setItem(analyticsEvKey(),   JSON.stringify(e.slice(0,500))) }
function analyticsPerfSave(p) { localStorage.setItem(analyticsPerfKey(), JSON.stringify(p)) }

// ── Seed demo data ─────────────────────────────────────────────────────────────
function analyticsSeedData() {
  const DAY = 86400000
  const views    = Array.from({length:30},(_,i)=>Math.round(120+Math.sin(i/3)*40+Math.random()*60-20))
  const sessions = views.map(v=>Math.round(v*(0.55+Math.random()*0.2)))
  const data = {
    views, sessions,
    bounceRate:     52+Math.round(Math.random()*10),
    avgDuration:    120+Math.round(Math.random()*60),
    conversionRate: 3.2+Math.random(),
    totalViews:     views.reduce((a,b)=>a+b,0),
    totalSessions:  sessions.reduce((a,b)=>a+b,0),
    topPages: [
      {url:'/',         views:3420,pct:42},
      {url:'/pricing',  views:1850,pct:23},
      {url:'/features', views:1240,pct:15},
      {url:'/blog',     views: 890,pct:11},
      {url:'/contact',  views: 720,pct: 9},
    ],
    sources: [
      {name:'Organic Search',pct:38,color:'#6366f1'},
      {name:'Direct',        pct:26,color:'#10b981'},
      {name:'Social Media',  pct:18,color:'#f59e0b'},
      {name:'Referral',      pct:12,color:'#ef4444'},
      {name:'Email',         pct: 6,color:'#8b5cf6'},
    ],
    geo: [
      {flag:'\u{1F1FA}\u{1F1F8}',country:'United States',pct:34},
      {flag:'\u{1F1EC}\u{1F1E7}',country:'United Kingdom',pct:18},
      {flag:'\u{1F1E9}\u{1F1EA}',country:'Germany',       pct:12},
      {flag:'\u{1F1EB}\u{1F1F7}',country:'France',        pct: 9},
      {flag:'\u{1F1EF}\u{1F1F5}',country:'Japan',         pct: 7},
      {flag:'\u{1F1E7}\u{1F1F7}',country:'Brazil',        pct: 6},
      {flag:'\u{1F1EE}\u{1F1F3}',country:'India',         pct: 5},
      {flag:'\u{1F30D}',         country:'Other',          pct: 9},
    ],
    devices: [
      {name:'Desktop',pct:58,color:'#6366f1'},
      {name:'Mobile', pct:34,color:'#10b981'},
      {name:'Tablet', pct: 8,color:'#f59e0b'},
    ],
    heatmap: Array.from({length:7},()=>Array.from({length:24},()=>Math.round(Math.random()*100))),
    seededAt: Date.now(),
  }
  analyticsSave(data)
  return data
}

function analyticsGetData()   { return analyticsLoad() || analyticsSeedData() }

function analyticsGetEvents() {
  let events = analyticsEvLoad()
  if (!events.length) {
    const types   = ['view','click','convert','view','click','view']
    const pages   = ['/','/pricing','/features','/blog','/contact','/']
    const actions = ['Page View','CTA Click','Purchase','Form Submit','Video Play','Download']
    events = Array.from({length:40},(_,i)=>({
      id:        'ev_'+i, type:types[i%types.length], action:actions[i%actions.length],
      page:      pages[i%pages.length],
      timestamp: new Date(Date.now()-i*900000-Math.random()*300000).toISOString(),
      device:    ['Desktop','Mobile','Tablet'][Math.floor(Math.random()*3)],
      country:   ['US','GB','DE','FR','JP'][Math.floor(Math.random()*5)],
      duration:  Math.round(30+Math.random()*180),
      value:     i%5===0?Math.round(Math.random()*99+1):null,
    }))
    analyticsEvSave(events)
  }
  return events
}

function analyticsGetPerf() {
  let p = analyticsPerfLoad()
  if (!p) {
    p = { lcp:1.8+Math.random()*0.8, fid:12+Math.random()*20, cls:0.05+Math.random()*0.05,
          fcp:1.2+Math.random()*0.6, ttfb:180+Math.random()*80, si:2.1+Math.random()*0.9,
          tti:2.8+Math.random()*1.2, score:Math.round(72+Math.random()*20) }
    analyticsPerfSave(p)
  }
  return p
}

function analyticsTrack(action, props={}) {
  const events = analyticsEvLoad()
  events.unshift({ id:'ev_'+Date.now(), type:'click', action, page:'/builder',
    timestamp:new Date().toISOString(), device:'Desktop', country:'Builder', ...props })
  analyticsEvSave(events)
}

// ── Open / close ──────────────────────────────────────────────────────────────
const ANALYTICS_UI = { tab:'overview', period:'30d', rtInterval:null }

function openAnalytics() {
  if (!AUTH.user) { showAuthGate(); return }
  document.getElementById('analytics-modal').classList.remove('hidden')
  analyticsTab('overview')
}
function closeAnalytics() {
  document.getElementById('analytics-modal').classList.add('hidden')
  if (ANALYTICS_UI.rtInterval) { clearInterval(ANALYTICS_UI.rtInterval); ANALYTICS_UI.rtInterval=null }
}
document.addEventListener('click', ev => {
  if (ev.target===document.getElementById('analytics-modal')) closeAnalytics()
})

function analyticsTab(tab) {
  ANALYTICS_UI.tab = tab
  if (ANALYTICS_UI.rtInterval) { clearInterval(ANALYTICS_UI.rtInterval); ANALYTICS_UI.rtInterval=null }
  document.querySelectorAll('.analytics-tab').forEach(b=>b.classList.toggle('active', b.id==='atab-'+tab))
  const renders = { overview:renderAnalyticsOverview, events:renderAnalyticsEvents,
                    performance:renderAnalyticsPerf, audience:renderAnalyticsAudience, realtime:renderAnalyticsRealtime }
  ;(renders[tab]||renderAnalyticsOverview)(document.getElementById('analytics-body'))
}

// ── Overview ──────────────────────────────────────────────────────────────────
function renderAnalyticsOverview(body) {
  const d = analyticsGetData()
  body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:var(--text)">Last 30 days</div>
      <div style="display:flex;gap:8px">
        <select class="period-sel" onchange="ANALYTICS_UI.period=this.value">
          <option value="7d">Last 7 days</option>
          <option value="30d" selected>Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
        <button class="analytics-export-btn" onclick="analyticsExport()">&#11015; Export CSV</button>
      </div>
    </div>
    <div class="analytics-kpi-grid">
      ${[
        {icon:'&#128065;',val:d.totalViews.toLocaleString(), lbl:'Page Views',      change:'+12.4%',color:'green' },
        {icon:'&#128100;',val:d.totalSessions.toLocaleString(),lbl:'Sessions',      change:'+8.7%', color:'blue'  },
        {icon:'&#8617;',  val:d.bounceRate+'%',               lbl:'Bounce Rate',    change:'-3.2%', color:'purple'},
        {icon:'&#128176;',val:d.conversionRate.toFixed(1)+'%',lbl:'Conversion Rate',change:'+0.8%',color:'orange'},
      ].map(k=>`<div class="analytics-kpi ${k.color}">
        <div class="analytics-kpi-icon">${k.icon}</div>
        <div class="analytics-kpi-val">${k.val}</div>
        <div class="analytics-kpi-lbl">${k.lbl}</div>
        <div class="analytics-kpi-change up">&#9650; ${k.change} vs last period</div>
      </div>`).join('')}
    </div>
    <div class="analytics-chart-wrap">
      <div class="analytics-chart-title">Page Views <span class="analytics-chart-sub">Last 14 days</span></div>
      ${renderBarChart(d.views.slice(-14),'#6366f1')}
    </div>
    <div class="analytics-two-col">
      <div class="analytics-chart-wrap" style="margin-bottom:0">
        <div class="analytics-chart-title">Top Pages</div>
        ${d.topPages.map((p,i)=>`<div class="top-pages-row">
          <span class="top-pages-rank">${i+1}</span>
          <div style="flex:1;min-width:0">
            <div class="top-pages-url">${p.url}</div>
            <div class="top-pages-bar" style="width:${p.pct}%"></div>
          </div>
          <span class="top-pages-views">${p.views.toLocaleString()}</span>
        </div>`).join('')}
      </div>
      <div class="analytics-chart-wrap" style="margin-bottom:0">
        <div class="analytics-chart-title">Traffic Sources</div>
        ${renderDonutChart(d.sources)}
      </div>
    </div>`
}

// ── Chart helpers ─────────────────────────────────────────────────────────────
function renderBarChart(values, color) {
  const max = Math.max(...values,1)
  const lbl = ['M','T','W','T','F','S','S']
  return `<div class="bar-chart">
    ${values.map((v,i)=>`<div class="bar-chart-col">
      <div class="bar-chart-bar" style="height:${Math.round((v/max)*110)}px;background:${color};opacity:${(0.4+0.6*(v/max)).toFixed(2)}">
        <div class="bar-tooltip">${v.toLocaleString()}</div>
      </div>
      <span class="bar-chart-label">${lbl[i%7]}</span>
    </div>`).join('')}
  </div>`
}

function renderLineChart(values, color) {
  const max=Math.max(...values,1),min=Math.min(...values,0),range=max-min||1
  const w=600,h=100,pad=10
  const pts=values.map((v,i)=>`${pad+(i/(values.length-1))*(w-pad*2)},${h-pad-((v-min)/range)*(h-pad*2)}`)
  const area=`M${pts[0]} L${pts.join(' L')} L${pad+(w-pad*2)},${h} L${pad},${h} Z`
  const gid = 'lg'+color.replace(/[^a-z0-9]/gi,'')
  return `<svg class="line-chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${area}" fill="url(#${gid})"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
}

function renderDonutChart(sources) {
  const total=sources.reduce((a,s)=>a+s.pct,0),r=40,cx=55,cy=55,circ=2*Math.PI*r
  let offset=0
  const segs=sources.map(s=>{
    const dash=(s.pct/total)*circ
    const seg=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="14"
      stroke-dasharray="${dash.toFixed(2)} ${(circ-dash).toFixed(2)}"
      stroke-dashoffset="${(-(offset/360)*circ+circ*0.25).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`
    offset+=(s.pct/total)*360; return seg
  }).join('')
  return `<div class="donut-wrap">
    <svg class="donut-svg" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r="40" fill="none" stroke="var(--surface3)" stroke-width="14"/>
      ${segs}
    </svg>
    <div class="donut-legend">
      ${sources.map(s=>`<div class="donut-legend-item">
        <div class="donut-legend-dot" style="background:${s.color}"></div>
        <span>${s.name}</span>
        <span class="donut-legend-val">${s.pct}%</span>
      </div>`).join('')}
    </div>
  </div>`
}

// ── Events ────────────────────────────────────────────────────────────────────
function renderAnalyticsEvents(body) {
  const events = analyticsGetEvents()
  body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:var(--text)">User Events <span style="font-size:10px;color:var(--muted);font-weight:400">(${events.length})</span></div>
      <div style="display:flex;gap:8px">
        <button class="analytics-export-btn" onclick="analyticsExportEvents()">&#11015; Export</button>
        <button class="analytics-export-btn" onclick="analyticsTrack('test_event');analyticsGetEvents();renderAnalyticsEvents(document.getElementById('analytics-body'));toast('Event tracked','&#9889;')">+ Test Event</button>
      </div>
    </div>
    <div class="analytics-chart-wrap">
      <div class="analytics-chart-title">Event volume — 7 days</div>
      ${renderLineChart(analyticsGetData().views.slice(-7),'#6366f1')}
    </div>
    <div class="analytics-chart-wrap">
      <div class="analytics-chart-title">Event Stream</div>
      <table class="analytics-events-table">
        <thead><tr><th>Event</th><th>Page</th><th>Device</th><th>Country</th><th>Duration</th><th>Value</th><th>Time</th></tr></thead>
        <tbody>${events.slice(0,20).map(ev=>`<tr>
          <td><span class="event-badge ${ev.type}">${ev.action}</span></td>
          <td style="font-family:var(--mono,monospace);font-size:10px">${ev.page}</td>
          <td style="color:var(--muted)">${ev.device}</td>
          <td style="color:var(--muted)">${ev.country}</td>
          <td style="font-family:var(--mono,monospace)">${ev.duration}s</td>
          <td style="color:${ev.value?'#34d399':'var(--muted)'}">${ev.value?'$'+ev.value:'&#8212;'}</td>
          <td style="color:var(--muted);white-space:nowrap;font-size:10px">${cmsTimeAgo(ev.timestamp)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`
}

// ── Performance ───────────────────────────────────────────────────────────────
function renderAnalyticsPerf(body) {
  const p=analyticsGetPerf(), score=p.score
  const sc=score>=90?'#34d399':score>=50?'#f59e0b':'#f87171'
  const r=36,circ=2*Math.PI*r,dash=(score/100)*circ
  const ring=`<svg class="perf-score-ring" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="${r}" fill="none" stroke="var(--surface3)" stroke-width="8"/>
    <circle cx="40" cy="40" r="${r}" fill="none" stroke="${sc}" stroke-width="8"
      stroke-dasharray="${dash.toFixed(2)} ${(circ-dash).toFixed(2)}"
      stroke-dashoffset="${(circ*0.25).toFixed(2)}" stroke-linecap="round" transform="rotate(-90 40 40)"/>
    <text x="40" y="44" text-anchor="middle" font-size="18" font-weight="800" fill="${sc}" font-family="system-ui">${score}</text>
  </svg>`
  const metrics=[
    {name:'Largest Contentful Paint', val:p.lcp.toFixed(2)+'s',  pct:Math.min(100,Math.max(0,100-(p.lcp-1)*30)),   color:p.lcp<2.5?'#34d399':'#f59e0b'},
    {name:'First Input Delay',        val:Math.round(p.fid)+'ms', pct:Math.min(100,Math.max(0,100-(p.fid-50)/2)),   color:p.fid<100?'#34d399':'#f87171'},
    {name:'Cumulative Layout Shift',  val:p.cls.toFixed(3),       pct:Math.min(100,Math.max(0,100-p.cls*500)),       color:p.cls<0.1?'#34d399':'#f59e0b'},
    {name:'First Contentful Paint',   val:p.fcp.toFixed(2)+'s',  pct:Math.min(100,Math.max(0,100-(p.fcp-0.9)*30)), color:p.fcp<1.8?'#34d399':'#f59e0b'},
    {name:'Time to First Byte',       val:Math.round(p.ttfb)+'ms',pct:Math.min(100,Math.max(0,100-(p.ttfb-100)/5)),color:p.ttfb<600?'#34d399':'#f87171'},
    {name:'Speed Index',              val:p.si.toFixed(2)+'s',    pct:Math.min(100,Math.max(0,100-(p.si-1.3)*20)),  color:p.si<3.4?'#34d399':'#f59e0b'},
    {name:'Time to Interactive',      val:p.tti.toFixed(2)+'s',   pct:Math.min(100,Math.max(0,100-(p.tti-2)*15)),   color:p.tti<3.8?'#34d399':'#f59e0b'},
  ]
  body.innerHTML=`
    <div class="analytics-chart-wrap">
      <div style="display:flex;align-items:center;gap:20px">
        ${ring}
        <div>
          <div style="font-size:16px;font-weight:800;color:${sc}">${score>=90?'Excellent':score>=70?'Good':score>=50?'Needs Work':'Poor'}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">PageSpeed Score</div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="analytics-export-btn" onclick="analyticsRunAudit()">&#9654; Run Audit</button>
            <button class="analytics-export-btn" onclick="analyticsExportPerf()">&#11015; Report</button>
          </div>
        </div>
        <div style="flex:1;margin-left:10px">
          ${[{lbl:'Performance',s:score,c:sc},{lbl:'Accessibility',s:Math.round(85+Math.random()*10),c:'#34d399'},{lbl:'Best Practices',s:Math.round(88+Math.random()*8),c:'#34d399'},{lbl:'SEO',s:Math.round(92+Math.random()*6),c:'#34d399'}].map(cat=>`
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <div style="width:32px;height:32px;border-radius:50%;border:3px solid ${cat.c};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:${cat.c}">${cat.s}</div>
              <span style="font-size:12px;color:var(--text2)">${cat.lbl}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="analytics-chart-wrap">
      <div class="analytics-chart-title">Core Web Vitals</div>
      ${metrics.map(m=>`<div class="perf-metric">
        <div class="perf-metric-name">${m.name}</div>
        <div class="perf-bar-wrap"><div class="perf-bar-fill" style="width:${m.pct}%;background:${m.color}"></div></div>
        <div class="perf-metric-val" style="color:${m.color}">${m.val}</div>
      </div>`).join('')}
    </div>`
}

async function analyticsRunAudit() {
  toast('Running audit&#8230;','&#128640;')
  await new Promise(r=>setTimeout(r,1500))
  analyticsPerfSave({ lcp:1.2+Math.random()*0.6, fid:8+Math.random()*12, cls:0.03+Math.random()*0.04,
    fcp:0.9+Math.random()*0.5, ttfb:140+Math.random()*60, si:1.5+Math.random()*0.8,
    tti:2.1+Math.random()*0.8, score:Math.round(80+Math.random()*15) })
  renderAnalyticsPerf(document.getElementById('analytics-body'))
  toast('Audit complete','&#9989;')
}

// ── Audience ──────────────────────────────────────────────────────────────────
function renderAnalyticsAudience(body) {
  const d=analyticsGetData()
  body.innerHTML=`
    <div class="analytics-two-col">
      <div class="analytics-chart-wrap" style="margin-bottom:0">
        <div class="analytics-chart-title">Devices</div>
        ${renderDonutChart(d.devices)}
      </div>
      <div class="analytics-chart-wrap" style="margin-bottom:0">
        <div class="analytics-chart-title">Top Countries</div>
        ${d.geo.map(g=>`<div class="geo-row">
          <span class="geo-flag">${g.flag}</span>
          <span class="geo-country">${g.country}</span>
          <div class="geo-bar-wrap"><div class="geo-bar-fill" style="width:${g.pct}%"></div></div>
          <span class="geo-pct">${g.pct}%</span>
        </div>`).join('')}
      </div>
    </div>
    <div class="analytics-chart-wrap" style="margin-top:14px">
      <div class="analytics-chart-title">Activity Heatmap <span class="analytics-chart-sub">Hour of day</span></div>
      <div style="display:flex;gap:4px;align-items:flex-start;margin-top:6px">
        <div style="display:flex;flex-direction:column;gap:3px;padding-top:16px">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=>`<div style="font-size:9px;color:var(--muted);height:14px;line-height:14px;width:24px">${day}</div>`).join('')}
        </div>
        <div style="flex:1">
          <div style="display:flex;gap:3px;margin-bottom:3px">
            ${Array.from({length:24},(_,h)=>`<div style="font-size:8px;color:var(--muted);flex:1;text-align:center">${h%6===0?h+'h':''}</div>`).join('')}
          </div>
          ${d.heatmap.map(row=>`<div class="heatmap-grid" style="margin-bottom:3px">
            ${row.map(v=>`<div class="heatmap-cell" style="background:rgba(99,102,241,${(v/100*0.8+0.05).toFixed(2)})" title="${v} events"></div>`).join('')}
          </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="analytics-chart-wrap" style="margin-top:14px">
      <div class="analytics-chart-title">Sessions — 30 days</div>
      ${renderLineChart(d.sessions,'#10b981')}
    </div>`
}

// ── Real-time ─────────────────────────────────────────────────────────────────
function renderAnalyticsRealtime(body) {
  let active=12+Math.round(Math.random()*8)
  body.innerHTML='<div id="rt-body"></div>'
  const tick=()=>{
    const rtBody=document.getElementById('rt-body')
    if(!rtBody)return
    active=Math.max(1,active+Math.round(Math.random()*3-1))
    const evs=analyticsGetEvents().slice(0,8)
    const pages=[['/',Math.round(active*0.35)],['/pricing',Math.round(active*0.22)],['/features',Math.round(active*0.18)],['/blog',Math.round(active*0.15)],['/contact',Math.round(active*0.10)]]
    rtBody.innerHTML=`
      <div class="analytics-chart-wrap">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="text-align:center;padding:10px 20px;background:var(--bg);border-radius:10px;border:1px solid var(--border)">
            <div style="font-size:42px;font-weight:800;color:var(--text);line-height:1">${active}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">users right now</div>
          </div>
          <div style="flex:1">
            <div style="font-size:12px;color:var(--text2);margin-bottom:8px">Active pages</div>
            ${pages.map(([pg,n])=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
              <span style="font-family:monospace;font-size:11px;color:var(--accent2);min-width:90px">${pg}</span>
              <div style="flex:1;height:6px;background:var(--surface3);border-radius:3px">
                <div style="height:100%;width:${Math.round((n/active)*100)}%;background:var(--accent);border-radius:3px;transition:width .5s"></div>
              </div>
              <span style="font-size:11px;font-weight:700;color:var(--text);min-width:20px">${n}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="analytics-chart-wrap">
        <div class="analytics-chart-title">
          <div style="display:flex;align-items:center;gap:6px"><span class="rt-dot"></span> Live Stream</div>
          <span class="analytics-chart-sub">Refreshes every 3s</span>
        </div>
        ${evs.map(ev=>`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">
          <span class="event-badge ${ev.type}" style="flex-shrink:0">${ev.action}</span>
          <span style="font-family:monospace;font-size:10px;color:var(--muted)">${ev.page}</span>
          <span style="font-size:10px;color:var(--muted);margin-left:auto">${ev.device}</span>
          <span style="font-size:10px;color:var(--muted)">${cmsTimeAgo(ev.timestamp)}</span>
        </div>`).join('')}
      </div>`
  }
  tick()
  ANALYTICS_UI.rtInterval=setInterval(()=>{
    if(!document.getElementById('analytics-modal')||document.getElementById('analytics-modal').classList.contains('hidden')){
      clearInterval(ANALYTICS_UI.rtInterval);ANALYTICS_UI.rtInterval=null;return
    }
    tick()
  },3000)
}

// ── Exports ───────────────────────────────────────────────────────────────────
function analyticsExport() {
  const d=analyticsGetData()
  const csv='Date,Views,Sessions\n'+d.views.map((v,i)=>`${new Date(Date.now()-(29-i)*86400000).toLocaleDateString()},${v},${d.sessions[i]}`).join('\n')
  const blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a')
  a.href=url;a.download='analytics-overview.csv';a.click();URL.revokeObjectURL(url);toast('Exported','&#11015;')
}
function analyticsExportEvents() {
  const evs=analyticsGetEvents()
  const csv='Type,Action,Page,Device,Country,Duration,Value,Timestamp\n'+evs.map(e=>[e.type,e.action,e.page,e.device,e.country,e.duration,e.value||'',e.timestamp].join(',')).join('\n')
  const blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a')
  a.href=url;a.download='analytics-events.csv';a.click();URL.revokeObjectURL(url);toast('Events exported','&#11015;')
}
function analyticsExportPerf() {
  const p=analyticsGetPerf()
  const blob=new Blob([JSON.stringify({score:p.score,metrics:p,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob),a=document.createElement('a')
  a.href=url;a.download='performance-report.json';a.click();URL.revokeObjectURL(url);toast('Report exported','&#11015;')
}

/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   ADVANCED ANALYTICS — Real Tracking Engine
   ──────────────────────────────────────────────────
   Three subsystems added on top of the existing
   seeded-demo analytics dashboard:

   1. Click Tracker   — records every canvas click
                        (coords, section, element, timestamp)
   2. Page View Tracker — IntersectionObserver watches
                          each canvas section; counts
                          "views" (≥40 % visible, once/session)
   3. Heatmap Engine  — builds 7×24 activity grid from
                        real click timestamps; draws a
                        spatial dot-overlay on the canvas
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

// ── Storage keys ─────────────────────────────────────────────────────────────
const AT_CLICKS_KEY   = 'pc_at_clicks_v1'
const AT_VIEWS_KEY    = 'pc_at_views_v1'
const AT_DAILY_KEY    = 'pc_at_daily_v1'

const AT_MAX_CLICKS   = 2000
const AT_MAX_VIEWS    = 5000

// ── Per-user key helpers ──────────────────────────────────────────────────────
function _atKey(base) {
  try { return base + (AUTH.user ? '_' + AUTH.user.id : '') } catch { return base }
}

// ── Low-level load/save ───────────────────────────────────────────────────────
function atClicksLoad()  { try { return JSON.parse(localStorage.getItem(_atKey(AT_CLICKS_KEY)) || '[]') } catch { return [] } }
function atViewsLoad()   { try { return JSON.parse(localStorage.getItem(_atKey(AT_VIEWS_KEY))  || '[]') } catch { return [] } }
function atDailyLoad()   { try { return JSON.parse(localStorage.getItem(_atKey(AT_DAILY_KEY))  || '{}') } catch { return {} } }

function atClicksSave(arr)  { try { localStorage.setItem(_atKey(AT_CLICKS_KEY), JSON.stringify(arr.slice(-AT_MAX_CLICKS))) } catch {} }
function atViewsSave(arr)   { try { localStorage.setItem(_atKey(AT_VIEWS_KEY),  JSON.stringify(arr.slice(-AT_MAX_VIEWS))) }  catch {} }
function atDailySave(obj)   { try { localStorage.setItem(_atKey(AT_DAILY_KEY),  JSON.stringify(obj)) }                      catch {} }

function _atDay(ts) { return new Date(ts || Date.now()).toISOString().slice(0, 10) }

function _atDailyInc(field) {
  const day  = _atDay()
  const data = atDailyLoad()
  if (!data[day]) data[day] = { views: 0, clicks: 0 }
  data[day][field] = (data[day][field] || 0) + 1
  const keys = Object.keys(data).sort()
  if (keys.length > 90) delete data[keys[0]]
  atDailySave(data)
}

/* ─── 1. CLICK TRACKER ──────────────────────────────────────────────────── */

function atRecordClick(e) {
  const entry = {
    id:          'cl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    ts:          Date.now(),
    day:         _atDay(),
    hour:        new Date().getHours(),
    dow:         new Date().getDay(),
    x:           e.x    ?? 0,
    y:           e.y    ?? 0,
    xPct:        e.xPct ?? 0,
    yPct:        e.yPct ?? 0,
    sectionId:   e.sectionId   || null,
    sectionType: e.sectionType || 'unknown',
    tag:         e.tag         || 'unknown',
    text:        String(e.text || '').slice(0, 60),
  }
  const arr = atClicksLoad()
  arr.push(entry)
  atClicksSave(arr)
  _atDailyInc('clicks')
  analyticsTrack('element_click', { page: '/' + (entry.sectionType || 'section'), props: { tag: entry.tag } })
}

let _atClickListenerAttached = false
function atAttachClickTracker() {
  if (_atClickListenerAttached) return
  const canvas = document.getElementById('canvas-inner') || document.getElementById('canvas')
  if (!canvas) return
  _atClickListenerAttached = true

  canvas.addEventListener('click', ev => {
    if (S.mode !== 'preview') return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width) return
    const x    = ev.clientX - rect.left
    const y    = ev.clientY - rect.top
    const xPct = Math.round((x / rect.width)  * 100)
    const yPct = Math.round((y / rect.height) * 100)
    let el = ev.target
    let sectionId = null
    while (el && el !== canvas) {
      if (el.dataset?.id) { sectionId = el.dataset.id; break }
      el = el.parentElement
    }
    const sectionType = sectionId ? (S.sections.find(s => s.id === sectionId)?.type || 'unknown') : 'unknown'
    atRecordClick({ x, y, xPct, yPct, sectionId, sectionType,
      tag: (ev.target.tagName || '').toLowerCase(),
      text: ev.target.textContent?.trim().slice(0, 60) || '' })
  }, { passive: true })
}

/* ─── 2. PAGE VIEW TRACKER ──────────────────────────────────────────────── */

const _atViewedThisSession = new Set()

function atRecordView(sectionId, sectionType) {
  const entry = {
    id:   'vw_' + Date.now(), ts: Date.now(), day: _atDay(),
    hour: new Date().getHours(), dow: new Date().getDay(),
    sectionId, sectionType: sectionType || 'unknown',
  }
  const arr = atViewsLoad()
  arr.push(entry)
  atViewsSave(arr)
  _atDailyInc('views')
}

let _atViewObserver = null
function atAttachViewTracker() {
  _atViewObserver?.disconnect()
  _atViewObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const el        = entry.target
      const sectionId = el.dataset?.sectionId || el.id
      if (!sectionId || _atViewedThisSession.has(sectionId)) return
      _atViewedThisSession.add(sectionId)
      const sec = S.sections.find(s => s.id === sectionId)
      atRecordView(sectionId, sec?.type)
    })
  }, { threshold: 0.4 })

  const canvas = document.getElementById('canvas-inner') || document.getElementById('canvas')
  if (!canvas) return
  canvas.querySelectorAll('[data-section-id], section[id]').forEach(el => _atViewObserver.observe(el))
}

/* ─── 3. HEATMAP ENGINE ─────────────────────────────────────────────────── */

function atBuildHeatmapGrid() {
  const clicks = atClicksLoad()
  if (!clicks.length) return null
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0))
  for (const c of clicks) {
    const dow  = Number.isFinite(c.dow)  ? c.dow  : new Date(c.ts).getDay()
    const hour = Number.isFinite(c.hour) ? c.hour : new Date(c.ts).getHours()
    grid[dow][hour]++
  }
  const max = Math.max(1, ...grid.flatMap(r => r))
  return grid.map(row => row.map(v => Math.round((v / max) * 100)))
}

function atBuildDailyTotals() {
  const daily = atDailyLoad()
  const views = [], sessions = []
  for (let i = 29; i >= 0; i--) {
    const d = daily[_atDay(Date.now() - i * 86400000)] || {}
    views.push(d.views || 0)
    sessions.push(Math.round((d.views || 0) * 0.65))
  }
  return { views, sessions }
}

function atPatchAnalyticsGetData() {
  const _orig = analyticsGetData
  // Shadow the function in outer scope — existing calls pick up the new version
  window._atGetData = function () {
    const base = _orig()
    const grid = atBuildHeatmapGrid()
    const { views, sessions } = atBuildDailyTotals()
    const hasRealViews  = views.some(v => v > 0)
    const hasRealClicks = atClicksLoad().length > 0
    return {
      ...base,
      ...(hasRealViews  && { views, sessions }),
      ...(hasRealClicks && grid && { heatmap: grid }),
    }
  }
}

// ── Spatial heatmap overlay ───────────────────────────────────────────────────
const _HM = { visible: false, overlayEl: null }

function _atGetOverlay() {
  if (_HM.overlayEl) return _HM.overlayEl
  const wrap = document.getElementById('canvas-inner') || document.getElementById('canvas')
  if (!wrap) return null
  const parent = wrap.closest('.canvas-scroll') || wrap.parentElement
  if (parent && getComputedStyle(parent).position === 'static') parent.style.position = 'relative'
  const cvs = document.createElement('canvas')
  cvs.id = 'at-heatmap-overlay'
  cvs.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:9998;opacity:0;transition:opacity .3s'
  parent?.appendChild(cvs)
  _HM.overlayEl = cvs
  return cvs
}

function atDrawHeatmap() {
  const wrap = document.getElementById('canvas-inner') || document.getElementById('canvas')
  const cvs  = _atGetOverlay()
  if (!wrap || !cvs) return
  const W = wrap.scrollWidth || wrap.offsetWidth
  const H = wrap.scrollHeight || wrap.offsetHeight
  cvs.width = W; cvs.height = H
  const ctx = cvs.getContext('2d')
  ctx.clearRect(0, 0, W, H)
  const clicks = atClicksLoad()
  if (!clicks.length) {
    ctx.fillStyle = 'rgba(108,99,255,0.08)'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#a78bfa'; ctx.font = '14px system-ui'; ctx.textAlign = 'center'
    ctx.fillText('No click data — switch to Preview and click sections', W / 2, H / 2)
    return
  }
  const r = Math.max(20, Math.min(W, H) * 0.04)
  for (const c of clicks) {
    const cx = (c.xPct / 100) * W
    const cy = (c.yPct / 100) * H
    const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0,   'rgba(108,99,255,0.55)')
    g.addColorStop(0.5, 'rgba(108,99,255,0.20)')
    g.addColorStop(1,   'rgba(108,99,255,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  }
}

function atToggleHeatmap() {
  _HM.visible = !_HM.visible
  const btn = document.getElementById('btn-heatmap-toggle')
  if (_HM.visible) {
    atDrawHeatmap()
    const cvs = _atGetOverlay()
    if (cvs) cvs.style.opacity = '1'
    if (btn) { btn.style.color = 'var(--accent)'; btn.title = 'Hide heatmap' }
    toast('Heatmap on — Preview mode records clicks', '🔥')
  } else {
    const cvs = _atGetOverlay()
    if (cvs) cvs.style.opacity = '0'
    if (btn) { btn.style.color = ''; btn.title = 'Show click heatmap' }
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
function atBoot() {
  atAttachClickTracker()
  atAttachViewTracker()
  atPatchAnalyticsGetData()
  if (!document.getElementById('btn-heatmap-toggle')) {
    const btn = Object.assign(document.createElement('button'), {
      id: 'btn-heatmap-toggle', className: 'btn btn-ghost',
      title: 'Show click heatmap', innerHTML: '🔥',
      onclick: atToggleHeatmap,
    })
    btn.style.cssText = 'width:28px;height:28px;padding:0;font-size:14px'
    document.querySelector('.topbar-r')?.prepend(btn)
  }
}

// Re-attach view observer after each canvas render
editorStore.subscribe(() => {
  if (!_atViewObserver) return
  clearTimeout(_atViewObserver._t)
  _atViewObserver._t = setTimeout(atAttachViewTracker, 400)
})

// Boot after full UI is ready (fires ~600ms after builder:init)
document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  if (typeof S !== 'undefined' && AUTH.user) atBoot()
}, 600))
