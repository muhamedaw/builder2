/* ══════════════════════════════════════════════════════
   BILLING DASHBOARD
   Comprehensive view: current plan, usage, invoices,
   next charge, upgrade/downgrade, cancel flow.
══════════════════════════════════════════════════════ */

let _bdTab = 'overview'

function openBillingDashboard() {
  if (!AUTH.user) { showAuthGate(); return }
  let modal = document.getElementById('bd-modal-bg')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'bd-modal-bg'
    modal.className = 'modal-bg hidden'
    modal.style.cssText = 'z-index:5200'
    modal.innerHTML = `
      <div class="modal bd-modal">
        <div style="padding:16px 20px 0;border-bottom:1px solid var(--border);flex-shrink:0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--text)">💳 Billing Dashboard</div>
              <div style="font-size:11px;color:var(--muted)" id="bd-header-sub">Manage your subscription and invoices</div>
            </div>
            <button class="modal-x" onclick="closeBillingDashboard()">✕</button>
          </div>
          <div class="bd-tabs">
            <div class="bd-tab active" onclick="switchBdTab('overview')">Overview</div>
            <div class="bd-tab" onclick="switchBdTab('invoices')">Invoices</div>
            <div class="bd-tab" onclick="switchBdTab('usage')">Usage</div>
            <div class="bd-tab" onclick="switchBdTab('plans')">Change Plan</div>
          </div>
        </div>
        <div class="bd-body" id="bd-body"></div>
      </div>`
    modal.addEventListener('click', e => { if (e.target === modal) closeBillingDashboard() })
    document.body.appendChild(modal)
  }
  _bdTab = 'overview'
  document.querySelectorAll('#bd-modal-bg .bd-tab').forEach((t,i) =>
    t.classList.toggle('active', i === 0))
  _renderBdTab()
  modal.classList.remove('hidden')
}

function closeBillingDashboard() {
  document.getElementById('bd-modal-bg')?.classList.add('hidden')
}

function switchBdTab(tab) {
  _bdTab = tab
  const ORDER = ['overview','invoices','usage','plans']
  document.querySelectorAll('#bd-modal-bg .bd-tab').forEach((t,i) =>
    t.classList.toggle('active', ORDER[i] === tab))
  _renderBdTab()
}

function _renderBdTab() {
  const body = document.getElementById('bd-body'); if (!body) return
  if (_bdTab === 'overview') _bdOverview(body)
  else if (_bdTab === 'invoices') _bdInvoices(body)
  else if (_bdTab === 'usage')    _bdUsage(body)
  else if (_bdTab === 'plans')    _bdPlans(body)
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function _bdOverview(body) {
  const plan    = currentPlan()
  const planDef = PLANS.find(p => p.id === plan) || PLANS[0]
  const billing = loadBillingState()
  const log     = loadBillingLog()
  const isFree  = plan === 'free'

  const renewDate   = billing?.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
    : '—'
  const nextAmount  = billing?.amount ? `$${Number(billing.amount).toFixed(2)}` : '$0.00'
  const period      = billing?.period === 'annual' ? 'Annual' : 'Monthly'
  const daysLeft    = billing?.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(billing.currentPeriodEnd) - Date.now()) / 86400000))
    : 0

  const PLAN_COLORS = { free:'#64748b', pro:'#6c63ff', team:'#a78bfa' }
  const color = PLAN_COLORS[plan] || '#6c63ff'

  const latestInvoices = log.slice(0, 3).map(inv => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px">
      <div style="color:var(--text2)">${inv.description}</div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="log-badge ${inv.status}">${inv.status}</span>
        <span style="font-family:var(--mono,monospace);font-weight:700;color:var(--text)">${inv.amount > 0 ? '$'+Number(inv.amount).toFixed(2) : '—'}</span>
      </div>
    </div>`).join('')

  body.innerHTML = `
    <!-- Current plan card -->
    <div class="bd-card">
      <div class="bd-card-title">Current Plan</div>
      <div class="bd-plan-row">
        <div class="bd-plan-badge" style="background:${color}">${planDef.name}</div>
        <div class="bd-plan-info">
          <div class="bd-plan-name">${planDef.name} Plan ${billing?.cancelAtPeriodEnd ? '<span style="font-size:11px;color:#f87171;font-weight:600">(Cancels ${renewDate})</span>' : ''}</div>
          <div class="bd-plan-detail">${isFree ? 'Free forever · No credit card required' : `${period} · Renews ${renewDate} · ${daysLeft} days left`}</div>
        </div>
        ${!isFree ? `<div style="text-align:right">
          <div class="bd-next-amt">${nextAmount}</div>
          <div style="font-size:11px;color:var(--muted)">${period.toLowerCase()}</div>
        </div>` : ''}
      </div>
      <div class="bd-action-row">
        ${isFree
          ? `<button class="btn btn-primary" onclick="closeBillingDashboard();openBilling()">⭐ Upgrade Now</button>`
          : `<button class="btn btn-outline" onclick="switchBdTab('plans');_renderBdTab()">Change Plan</button>
             <button class="btn btn-ghost" style="color:var(--muted);font-size:11px" onclick="cancelSubscription();closeBillingDashboard()">Cancel Subscription</button>`
        }
      </div>
    </div>

    ${!isFree && billing ? `
    <!-- Next charge -->
    <div class="bd-card">
      <div class="bd-card-title">Next Charge</div>
      <div class="bd-next-charge">
        <div>
          <div class="bd-next-date">${renewDate}</div>
          <div style="font-size:11px;color:var(--muted)">${period} · ${billing.currency || 'USD'}</div>
        </div>
        <div class="bd-next-amt">${nextAmount}</div>
      </div>
      ${billing.cancelAtPeriodEnd ? `<div style="font-size:12px;color:#f87171;padding:8px 0;border-top:1px solid var(--border)">
        ⚠️ Subscription will cancel on ${renewDate}. You keep access until then.
      </div>` : ''}
    </div>` : ''}

    <!-- Recent invoices -->
    <div class="bd-card">
      <div class="bd-card-title" style="display:flex;align-items:center;justify-content:space-between">
        Recent Invoices
        <button class="btn btn-ghost" style="font-size:11px;padding:2px 8px" onclick="switchBdTab('invoices');_renderBdTab()">View all →</button>
      </div>
      ${log.length ? latestInvoices : '<div style="text-align:center;color:var(--muted);font-size:12px;padding:12px">No invoices yet</div>'}
    </div>

    <!-- Plan features quick view -->
    <div class="bd-card">
      <div class="bd-card-title">What's Included</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${(planDef.features || []).map(f => `
          <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:${f.included?'var(--text2)':'var(--muted)'}">
            <span style="color:${f.included?'#34d399':'var(--border2)'};">${f.included?'✓':'—'}</span>
            ${f.text}
          </div>`).join('')}
      </div>
    </div>
  `
}

// ── Invoices tab ──────────────────────────────────────────────────────────────
function _bdInvoices(body) {
  const log = loadBillingLog()

  const rows = log.length ? log.map((inv, i) => {
    const date   = new Date(inv.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    const amount = inv.amount > 0 ? `$${Number(inv.amount).toFixed(2)}` : '—'
    return `<div class="bd-invoice-row">
      <div style="color:var(--muted)">${date}</div>
      <div style="color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e(inv.description)}</div>
      <div style="font-family:var(--mono,monospace);font-weight:700;color:var(--text)">${amount}</div>
      <div><span class="log-badge ${inv.status}">${inv.status}</span></div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="bd-invoice-id">${inv.invoiceId || '—'}</span>
        ${inv.amount > 0 ? `<button class="bd-invoice-dl" onclick="_bdDownloadInvoice(${i})" title="Download PDF">⬇</button>` : ''}
      </div>
    </div>`
  }).join('')
  : `<div style="text-align:center;padding:40px;color:var(--muted)">
      <div style="font-size:36px;opacity:.2;margin-bottom:10px">🧾</div>
      <div style="font-size:13px;font-weight:600;color:var(--text2)">No invoices yet</div>
      <div style="font-size:12px;margin-top:4px">Invoices appear here after each payment</div>
    </div>`

  body.innerHTML = `
    <div class="bd-card" style="padding:0 18px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0 10px;border-bottom:1px solid var(--border)">
        <div class="bd-card-title" style="margin:0">Invoice History (${log.length})</div>
        ${log.length ? `<button class="btn btn-ghost" style="font-size:11px" onclick="exportBillingLog()">⬇ Export CSV</button>` : ''}
      </div>
      ${log.length ? `<div class="bd-invoice-row head">
        <div>Date</div><div>Description</div><div>Amount</div><div>Status</div><div>Invoice #</div>
      </div>` : ''}
      ${rows}
    </div>
  `
}

function _bdDownloadInvoice(idx) {
  const inv = loadBillingLog()[idx]; if (!inv) return
  const date    = new Date(inv.date).toLocaleDateString()
  const amount  = inv.amount > 0 ? `$${Number(inv.amount).toFixed(2)}` : '$0.00'
  const content = [
    'PageCraft Invoice',
    '==================',
    `Invoice #: ${inv.invoiceId || 'N/A'}`,
    `Date:      ${date}`,
    `Customer:  ${AUTH.user?.name || ''} <${AUTH.user?.email || ''}>`,
    '',
    `Description: ${inv.description}`,
    `Amount:      ${amount} ${inv.currency || 'USD'}`,
    `Status:      ${inv.status}`,
    '',
    'Thank you for using PageCraft!',
  ].join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `${inv.invoiceId || 'invoice'}.txt`
  a.click(); URL.revokeObjectURL(url)
  toast('Invoice downloaded', '🧾')
}

// ── Usage tab ─────────────────────────────────────────────────────────────────
function _bdUsage(body) {
  const plan   = currentPlan()
  const limits = TenantManager.getLimits()
  const usage  = TenantManager.getUsage()

  function bar(used, limit, label, icon) {
    const pct   = limit === Infinity ? 0 : Math.min(100, Math.round(used / limit * 100))
    const cls   = pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : ''
    const limitTxt = limit === Infinity ? '∞' : limit
    return `<div class="bd-stat-card">
      <div style="font-size:20px;margin-bottom:4px">${icon}</div>
      <div class="bd-stat-val">${used}</div>
      <div class="bd-stat-lbl">${label}</div>
      <div class="bd-stat-bar"><div class="bd-stat-fill ${cls}" style="width:${pct}%"></div></div>
      <div style="font-size:10px;color:var(--muted);margin-top:4px">${used} / ${limitTxt}</div>
    </div>`
  }

  const PLAN_COLORS = { free:'#64748b', pro:'#6c63ff', team:'#a78bfa' }
  const color = PLAN_COLORS[plan] || '#6c63ff'

  body.innerHTML = `
    <div class="bd-card">
      <div class="bd-card-title">Plan: <span style="color:${color};font-weight:800">${plan.toUpperCase()}</span></div>
      <div class="bd-stats-grid">
        ${bar(usage.projects, limits.projects, 'Projects', '📁')}
        ${bar(usage.sections, limits.sections, 'Sections', '📄')}
        ${bar(usage.members,  limits.members,  'Members',  '👥')}
      </div>
    </div>
    <div class="bd-card">
      <div class="bd-card-title">Feature Access</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${[
          { label:'3D Scenes',        ok: plan !== 'free' },
          { label:'Animation System', ok: plan !== 'free' },
          { label:'React Export',     ok: plan !== 'free' },
          { label:'JSON Export',      ok: plan !== 'free' },
          { label:'Priority Support', ok: plan !== 'free' },
          { label:'White-label Export', ok: plan === 'team' },
          { label:'SSO / SAML',       ok: plan === 'team' },
          { label:'Audit Logs',       ok: plan === 'team' },
        ].map(f => `<div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--border)">
          <span style="color:var(--text2)">${f.label}</span>
          <span style="${f.ok ? 'color:#34d399' : 'color:var(--muted)'}">${f.ok ? '✓ Included' : '— Upgrade'}</span>
        </div>`).join('')}
      </div>
      ${plan === 'free' ? `<button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="closeBillingDashboard();openBilling()">⭐ Unlock All Features</button>` : ''}
    </div>
  `
}

// ── Plans tab (inline plan comparison + upgrade) ──────────────────────────────
function _bdPlans(body) {
  const cur = currentPlan()
  const PLAN_COLORS = { free:'#64748b', pro:'#6c63ff', team:'#a78bfa' }

  body.innerHTML = `
    <div class="bd-card" style="padding:12px 16px">
      <div class="bd-card-title">Choose a Plan</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${PLANS.map(plan => {
          const isCur = plan.id === cur
          const color = PLAN_COLORS[plan.id] || '#6c63ff'
          return `<div style="display:flex;align-items:center;gap:12px;padding:12px;border:1.5px solid ${isCur?'var(--accent)':'var(--border)'};border-radius:10px;background:${isCur?'rgba(108,99,255,.05)':'var(--surface)'}">
            <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:var(--text)">${plan.name}
                ${isCur ? '<span style="font-size:10px;color:var(--accent);margin-left:6px">✓ Current</span>' : ''}
              </div>
              <div style="font-size:11px;color:var(--muted)">${plan.desc}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:16px;font-weight:800;color:var(--text)">$${plan.monthlyPrice}<span style="font-size:11px;font-weight:400;color:var(--muted)">/mo</span></div>
              ${!isCur && plan.id !== 'free' ? `<button class="btn btn-primary" style="font-size:11px;padding:4px 12px;margin-top:4px" onclick="closeBillingDashboard();openBilling();setTimeout(()=>selectPlan('${plan.id}'),400)">Select</button>` : ''}
              ${!isCur && plan.id === 'free' ? `<button class="btn btn-ghost" style="font-size:11px;padding:4px 12px;margin-top:4px;color:var(--muted)" onclick="cancelSubscription();closeBillingDashboard()">Downgrade</button>` : ''}
            </div>
          </div>`
        }).join('')}
      </div>
    </div>
    <div style="text-align:center;font-size:11px;color:var(--muted);padding:4px">
      All plans include 30-day money-back guarantee · Cancel anytime
    </div>
  `
}

window.PageCraft = window.PageCraft || {}
window.PageCraft.openBillingDashboard = openBillingDashboard
