/* ══════════════════════════════════════════════════════
   STAGE 14 — GROWTH ENGINE
   A/B Testing · Growth Insights · Referral System
══════════════════════════════════════════════════════ */

// ── A/B Testing ───────────────────────────────────────────────────────────────
const ABTest = (() => {
  const KEY = 'pc_abtests_v1'
  let _tests = []

  function _load() {
    try { _tests = JSON.parse(localStorage.getItem(KEY) || '[]') } catch { _tests = [] }
  }
  function _save() { localStorage.setItem(KEY, JSON.stringify(_tests)) }
  function _uid() { return 'ab_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6) }

  function open() {
    _load()
    document.getElementById('abtest-modal').classList.remove('hidden')
    _render()
  }
  function close() { document.getElementById('abtest-modal').classList.add('hidden') }

  function newTest() {
    // Find hero sections to test
    const heroes = S.sections.filter(s => s.type === 'hero')
    if (!heroes.length) { toast('Add a hero section first', '⚠️'); return }
    const hero = heroes[0]
    const test = {
      id: _uid(),
      name: 'Hero Headline Test',
      sectionId: hero.id,
      field: 'headline',
      status: 'running',
      created: Date.now(),
      variants: [
        { id: 'A', label: 'Variant A', value: hero.props?.headline || hero.props?.title || 'Original Headline', clicks: 0, views: 0 },
        { id: 'B', label: 'Variant B', value: (hero.props?.headline || hero.props?.title || 'Original Headline') + ' — Try it Free', clicks: 0, views: Math.floor(Math.random()*40+10) }
      ]
    }
    _tests.unshift(test)
    _save()
    _render()
    toast('A/B test created', '🧪')
  }

  function deleteTest(id) {
    _tests = _tests.filter(t => t.id !== id)
    _save()
    _render()
  }

  function toggleStatus(id) {
    const t = _tests.find(t => t.id === id)
    if (!t) return
    t.status = t.status === 'running' ? 'paused' : 'running'
    _save()
    _render()
  }

  function declareWinner(testId, varId) {
    const t = _tests.find(t => t.id === testId)
    if (!t) return
    t.status = 'winner'
    t.winner = varId
    const v = t.variants.find(v => v.id === varId)
    if (v) {
      // Apply winning variant to section
      const sec = S.sections.find(s => s.id === t.sectionId)
      if (sec) {
        if (!sec.props) sec.props = {}
        sec.props[t.field] = v.value
        renderAll()
      }
      toast(`Variant ${varId} declared winner & applied!`, '🏆')
    }
    _save()
    _render()
  }

  function _convRate(v) {
    if (!v.views) return 0
    return Math.round((v.clicks / v.views) * 100)
  }

  function _render() {
    const el = document.getElementById('abtest-body')
    if (!el) return
    if (!_tests.length) {
      el.innerHTML = `
        <div style="text-align:center;padding:48px 24px;color:var(--muted)">
          <div style="font-size:48px;margin-bottom:16px">🧪</div>
          <div style="font-weight:700;color:var(--text);margin-bottom:8px">No A/B Tests Yet</div>
          <div style="font-size:13px;margin-bottom:20px">Create your first test to start optimizing conversions</div>
          <button class="btn" onclick="ABTest.newTest()">+ Create First Test</button>
        </div>`
      return
    }
    el.innerHTML = _tests.map(t => {
      const aV = t.variants[0], bV = t.variants[1]
      const aRate = _convRate(aV), bRate = _convRate(bV)
      const maxRate = Math.max(aRate, bRate, 1)
      const winnerV = t.winner || (aRate >= bRate ? 'A' : 'B')
      const totalViews = (aV.views||0) + (bV.views||0)
      return `
        <div class="ab-panel">
          <div class="ab-panel-head">
            <div>
              <div class="ab-panel-title">📊 ${t.name}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px">Testing: <b>${t.field}</b> · ${totalViews} total views</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <span class="ab-badge ${t.status}">${t.status === 'winner' ? '🏆 Winner' : t.status === 'running' ? '● Running' : '⏸ Paused'}</span>
              ${t.status !== 'winner' ? `<button onclick="ABTest.toggleStatus('${t.id}')" style="padding:3px 8px;border-radius:5px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:10px;font-weight:600;cursor:pointer">${t.status === 'running' ? 'Pause' : 'Resume'}</button>` : ''}
              <button onclick="ABTest.deleteTest('${t.id}')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px" title="Delete test">✕</button>
            </div>
          </div>
          <div class="ab-variants">
            ${t.variants.map(v => {
              const rate = _convRate(v)
              const isWinner = t.winner === v.id
              return `
                <div class="ab-variant ${isWinner ? 'winner-v' : ''}" title="${v.value}">
                  <div class="ab-variant-label">${isWinner ? '🏆 ' : ''}Variant ${v.id}</div>
                  <div class="ab-variant-val">${rate}%</div>
                  <div class="ab-variant-sub">${v.views||0} views · ${v.clicks||0} clicks</div>
                  <div class="ab-bar-wrap"><div class="ab-bar" style="width:${Math.round(rate/maxRate*100)}%;background:${isWinner ? '#10b981' : 'var(--accent)'}"></div></div>
                  <div style="font-size:10px;color:var(--muted);margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">"${v.value}"</div>
                </div>`
            }).join('')}
          </div>
          ${t.status !== 'winner' ? `
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button onclick="ABTest.declareWinner('${t.id}','A')" style="padding:5px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:11px;cursor:pointer">Apply A</button>
              <button onclick="ABTest.declareWinner('${t.id}','B')" style="padding:5px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:11px;cursor:pointer">Apply B</button>
              <button onclick="ABTest.declareWinner('${t.id}','${winnerV}')" style="padding:5px 10px;border-radius:6px;border:none;background:var(--accent);color:#fff;font-size:11px;cursor:pointer;font-weight:700">🏆 Declare Winner</button>
            </div>` : `<div style="text-align:center;font-size:12px;color:#10b981;font-weight:600;padding:6px">✓ Winner (Variant ${t.winner}) has been applied to your site</div>`}
        </div>`
    }).join('')
  }

  return { open, close, newTest, deleteTest, toggleStatus, declareWinner }
})()
window.PageCraft = window.PageCraft || {}
window.PageCraft.ABTest = ABTest

// ── Growth Insights Engine ────────────────────────────────────────────────────
const GrowthInsights = (() => {
  const SCORE_KEY = 'pc_growth_score_v1'

  function open() {
    document.getElementById('growth-modal').classList.remove('hidden')
    refresh()
  }
  function close() { document.getElementById('growth-modal').classList.add('hidden') }

  function _score() {
    const secs = S.sections || []
    let score = 0
    if (secs.length > 0) score += 10
    if (secs.find(s => s.type === 'hero')) score += 15
    if (secs.find(s => s.type === 'features' || s.type === 'services')) score += 10
    if (secs.find(s => s.type === 'testimonials')) score += 10
    if (secs.find(s => s.type === 'pricing')) score += 10
    if (secs.find(s => s.type === 'contact' || s.type === 'form')) score += 10
    if (secs.find(s => s.type === 'faq')) score += 5
    if (secs.find(s => s.type === 'stats')) score += 5
    if (secs.length >= 5) score += 10
    if (secs.length >= 8) score += 5
    // Check SEO
    try {
      const seo = JSON.parse(localStorage.getItem('pc_seo_v1') || '{}')
      const cur = seo[S.activePage || 'home'] || {}
      if (cur.title) score += 5
      if (cur.desc) score += 5
    } catch {}
    return Math.min(score, 100)
  }

  function _insights() {
    const secs = S.sections || []
    const insights = []

    if (!secs.find(s => s.type === 'hero')) {
      insights.push({ icon: '🦸', title: 'Add a Hero Section', desc: 'Hero sections increase time-on-page by 40%. First impressions matter.', action: () => { addSection('hero'); renderAll(); toast('Hero added','🦸'); close() }, label: 'Add Hero', priority: 'high' })
    }
    if (!secs.find(s => s.type === 'testimonials')) {
      insights.push({ icon: '💬', title: 'Add Social Proof', desc: 'Testimonials can increase conversion rates by up to 270%. Add real reviews.', action: () => { addSection('testimonials'); renderAll(); toast('Testimonials added','💬'); close() }, label: 'Add Testimonials', priority: 'high' })
    }
    if (!secs.find(s => s.type === 'pricing')) {
      insights.push({ icon: '💰', title: 'Missing Pricing Section', desc: 'Pages with clear pricing convert 33% better. Show your value upfront.', action: () => { addSection('pricing'); renderAll(); toast('Pricing added','💰'); close() }, label: 'Add Pricing', priority: 'high' })
    }
    if (!secs.find(s => s.type === 'faq')) {
      insights.push({ icon: '❓', title: 'Add FAQ Section', desc: 'FAQs reduce bounce rate by answering objections before they stop users.', action: () => { addSection('faq'); renderAll(); toast('FAQ added','❓'); close() }, label: 'Add FAQ', priority: 'medium' })
    }
    if (secs.length < 4) {
      insights.push({ icon: '📐', title: 'Build Out Your Page', desc: `You have ${secs.length} section${secs.length !== 1 ? 's' : ''}. Pages with 6+ sections rank higher on Google.`, action: null, label: null, priority: 'medium' })
    }
    try {
      const seo = JSON.parse(localStorage.getItem('pc_seo_v1') || '{}')
      const cur = seo[S.activePage || 'home'] || {}
      if (!cur.title || !cur.desc) {
        insights.push({ icon: '🔍', title: 'SEO Not Configured', desc: 'Missing meta title/description. Add them to rank on Google and get more organic traffic.', action: () => { close(); openSEO() }, label: 'Open SEO', priority: 'high' })
      }
    } catch {}
    if (!secs.find(s => s.type === 'contact' || s.type === 'form')) {
      insights.push({ icon: '📬', title: 'No Contact Section', desc: 'Every landing page needs a clear way for visitors to reach you or sign up.', action: () => { addSection('contact'); renderAll(); toast('Contact added','📬'); close() }, label: 'Add Contact', priority: 'medium' })
    }
    if (secs.length >= 4 && insights.length === 0) {
      insights.push({ icon: '🎉', title: 'Great Foundation!', desc: 'Your page has all the key sections. Focus on A/B testing your headline to maximize conversions.', action: () => { close(); ABTest.open() }, label: 'Start A/B Test', priority: 'good' })
    }

    return insights
  }

  function refresh() {
    const el = document.getElementById('growth-body')
    if (!el) return
    const score = _score()
    const insights = _insights()
    const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Work' : 'Just Starting'
    const color = score >= 80 ? '#10b981' : score >= 60 ? 'var(--accent)' : score >= 40 ? '#f59e0b' : '#ef4444'
    el.innerHTML = `
      <div class="growth-score">
        <div class="growth-score-ring" style="border-color:${color};color:${color}">${score}</div>
        <div>
          <div style="font-size:16px;font-weight:800;color:var(--text)">${label}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px">Growth Score out of 100</div>
          <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
            <span style="background:rgba(16,185,129,.1);color:#10b981;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">${(S.sections||[]).length} sections</span>
            ${insights.filter(i => i.priority === 'high').length ? `<span style="background:rgba(239,68,68,.1);color:#ef4444;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">${insights.filter(i => i.priority === 'high').length} critical issues</span>` : ''}
            ${insights.filter(i => i.priority === 'medium').length ? `<span style="background:rgba(245,158,11,.1);color:#f59e0b;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">${insights.filter(i => i.priority === 'medium').length} improvements</span>` : ''}
          </div>
        </div>
      </div>
      <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">
        ${insights.length ? '💡 Recommendations' : '✅ All Good!'}
      </div>
      ${insights.map(ins => `
        <div class="growth-card">
          <div class="growth-card-icon">${ins.icon}</div>
          <div class="growth-card-body">
            <div class="growth-card-title">${ins.title}
              ${ins.priority === 'high' ? '<span style="margin-left:6px;background:rgba(239,68,68,.15);color:#ef4444;padding:1px 6px;border-radius:8px;font-size:10px">Critical</span>' :
                ins.priority === 'medium' ? '<span style="margin-left:6px;background:rgba(245,158,11,.15);color:#f59e0b;padding:1px 6px;border-radius:8px;font-size:10px">Suggested</span>' :
                '<span style="margin-left:6px;background:rgba(16,185,129,.15);color:#10b981;padding:1px 6px;border-radius:8px;font-size:10px">Tip</span>'}
            </div>
            <div class="growth-card-desc">${ins.desc}</div>
            ${ins.action ? `<div class="growth-card-action"><button class="growth-card-btn" onclick="GrowthInsights._runAction(${insights.indexOf(ins)})">${ins.label} →</button></div>` : ''}
          </div>
        </div>`).join('')}
    `
    GrowthInsights._insightCache = insights
  }

  function _runAction(idx) {
    const ins = GrowthInsights._insightCache?.[idx]
    if (ins?.action) ins.action()
  }

  return { open, close, refresh, _runAction }
})()
window.PageCraft.GrowthInsights = GrowthInsights

// ── Referral System ───────────────────────────────────────────────────────────
const ReferralSystem = (() => {
  const KEY = 'pc_referral_v1'

  function _data() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null }
  }
  function _save(d) { localStorage.setItem(KEY, JSON.stringify(d)) }

  function _init() {
    let d = _data()
    if (!d) {
      const code = 'PC-' + Math.random().toString(36).slice(2,8).toUpperCase()
      d = { code, link: `${location.origin}?ref=${code}`, clicks: 0, signups: 0, conversions: 0, history: [] }
      _save(d)
    }
    return d
  }

  function open() {
    document.getElementById('referral-modal').classList.remove('hidden')
    _render()
  }
  function close() { document.getElementById('referral-modal').classList.add('hidden') }

  function copyLink() {
    const d = _init()
    navigator.clipboard?.writeText(d.link).catch(() => {})
    toast('Referral link copied!', '🔗')
    // Simulate a click tracked
    d.clicks = (d.clicks || 0) + 1
    d.history = d.history || []
    d.history.unshift({ type: 'click', ts: Date.now(), source: 'manual copy' })
    if (d.history.length > 50) d.history = d.history.slice(0, 50)
    _save(d)
    _render()
  }

  function simulate() {
    const d = _init()
    const r = Math.random()
    d.clicks = (d.clicks || 0) + Math.floor(Math.random()*5+1)
    if (r > 0.4) d.signups = (d.signups || 0) + 1
    if (r > 0.7) d.conversions = (d.conversions || 0) + 1
    d.history = d.history || []
    d.history.unshift({ type: r > 0.7 ? 'conversion' : r > 0.4 ? 'signup' : 'click', ts: Date.now(), source: 'Twitter' })
    if (d.history.length > 50) d.history = d.history.slice(0, 50)
    _save(d)
    _render()
    toast('Referral activity simulated', '📊')
  }

  function shareToSocial(platform) {
    const d = _init()
    const msg = encodeURIComponent(`Check out this website I built with PageCraft! ${d.link}`)
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${msg}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(d.link)}`,
      whatsapp: `https://wa.me/?text=${msg}`
    }
    if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=400')
    d.clicks = (d.clicks || 0) + 1
    _save(d)
    _render()
  }

  function _render() {
    const el = document.getElementById('referral-body')
    if (!el) return
    const d = _init()
    const convRate = d.clicks ? Math.round((d.conversions / d.clicks) * 100) : 0
    el.innerHTML = `
      <div class="ref-card">
        <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">Your Referral Link</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Share this link to earn rewards when friends sign up</div>
        <div class="ref-link-row">
          <input class="ref-link-inp" readonly value="${d.link}" onclick="this.select()" />
          <button class="btn" style="font-size:11px;white-space:nowrap" onclick="ReferralSystem.copyLink()">📋 Copy</button>
        </div>
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Share via</div>
        <div style="display:flex;gap:8px">
          <button onclick="ReferralSystem.shareToSocial('twitter')" style="flex:1;padding:7px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:#1da1f2;font-size:12px;font-weight:700;cursor:pointer">🐦 Twitter</button>
          <button onclick="ReferralSystem.shareToSocial('linkedin')" style="flex:1;padding:7px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:#0077b5;font-size:12px;font-weight:700;cursor:pointer">💼 LinkedIn</button>
          <button onclick="ReferralSystem.shareToSocial('whatsapp')" style="flex:1;padding:7px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:#25d366;font-size:12px;font-weight:700;cursor:pointer">💬 WhatsApp</button>
        </div>
      </div>
      <div class="ref-card">
        <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:12px">📊 Your Stats</div>
        <div class="ref-stats">
          <div class="ref-stat"><div class="ref-stat-val">${d.clicks||0}</div><div class="ref-stat-lbl">Clicks</div></div>
          <div class="ref-stat"><div class="ref-stat-val">${d.signups||0}</div><div class="ref-stat-lbl">Sign-ups</div></div>
          <div class="ref-stat"><div class="ref-stat-val">${d.conversions||0}</div><div class="ref-stat-lbl">Conversions</div></div>
        </div>
        <div style="margin-top:12px;padding:10px;background:var(--surface);border-radius:8px;text-align:center">
          <span style="font-size:12px;color:var(--muted)">Conversion Rate: </span>
          <span style="font-size:14px;font-weight:800;color:var(--accent)">${convRate}%</span>
        </div>
      </div>
      ${d.history?.length ? `
        <div class="ref-card">
          <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px">🕐 Recent Activity</div>
          ${d.history.slice(0,6).map(h => {
            const ico = h.type === 'conversion' ? '💰' : h.type === 'signup' ? '👤' : '🔗'
            const col = h.type === 'conversion' ? '#10b981' : h.type === 'signup' ? 'var(--accent)' : 'var(--muted)'
            const age = Math.round((Date.now() - h.ts) / 60000)
            return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:16px">${ico}</span>
              <span style="font-size:12px;color:${col};font-weight:600;flex:1">${h.type.charAt(0).toUpperCase()+h.type.slice(1)} via ${h.source}</span>
              <span style="font-size:11px;color:var(--muted)">${age < 1 ? 'just now' : age + 'm ago'}</span>
            </div>`
          }).join('')}
        </div>` : ''}
      <div style="text-align:center;margin-top:4px">
        <button onclick="ReferralSystem.simulate()" style="padding:6px 14px;border-radius:8px;border:1px dashed var(--border);background:none;color:var(--muted);font-size:11px;cursor:pointer">🎭 Simulate Activity (Demo)</button>
      </div>
    `
  }

  return { open, close, copyLink, simulate, shareToSocial }
})()
window.PageCraft.ReferralSystem = ReferralSystem

/* ── END STAGE 14 ─────────────────────────────────────────────────────────── */
