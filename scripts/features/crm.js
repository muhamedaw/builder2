/* ══════════════════════════════════════════════════════
   STAGE 13 — BUSINESS + AI
   CRM System · Email Automation · AI Layout Refiner
══════════════════════════════════════════════════════ */

// ── A. CRM SYSTEM ─────────────────────────────────────────────────────────────
const CRMSystem = (() => {
  const KEY = 'pc_crm_v1'
  let _tab = 'contacts'

  function _load() { try { return JSON.parse(localStorage.getItem(KEY) || '{"contacts":[],"leads":[]}') } catch { return { contacts:[], leads:[] } } }
  function _save(d) { localStorage.setItem(KEY, JSON.stringify(d)) }

  function open() {
    document.getElementById('crm-modal')?.classList.remove('hidden')
    _render()
  }
  function close() { document.getElementById('crm-modal')?.classList.add('hidden') }

  function switchTab(tab, btn) {
    _tab = tab
    document.querySelectorAll('.crm-tab').forEach(t => t.classList.remove('active'))
    btn?.classList.add('active')
    _render()
  }

  function _render() {
    const db   = _load()
    const body = document.getElementById('crm-body')
    if (!body) return

    // Stats
    const orders = (() => { try { return JSON.parse(localStorage.getItem('pc_orders_v1') || '[]') } catch { return [] } })()
    const statsHTML = `<div class="crm-stat-row">
      ${[
        ['👥', db.contacts.length, 'Contacts'],
        ['🎯', db.leads.length,    'Leads'],
        ['🛒', orders.length,       'Orders'],
        ['💰', '$' + orders.reduce((a,o)=>a+(o.total||0),0).toFixed(2), 'Revenue'],
      ].map(([icon,val,lbl]) => `<div class="crm-stat"><div class="crm-stat-val">${icon} ${val}</div><div class="crm-stat-lbl">${lbl}</div></div>`).join('')}
    </div>`

    if (_tab === 'contacts' || _tab === 'leads') {
      const list = _tab === 'contacts' ? db.contacts : db.leads
      const addFormHTML = `<div class="crm-add-form" id="crm-add-form" style="display:none">
        <input class="crm-input" id="crm-name" placeholder="Full Name"/>
        <input class="crm-input" id="crm-email" placeholder="Email"/>
        <input class="crm-input" id="crm-phone" placeholder="Phone (optional)"/>
        <select class="crm-input" id="crm-status">
          <option value="lead">Lead</option><option value="customer">Customer</option><option value="cold">Cold</option>
        </select>
        <div style="grid-column:1/-1;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost" onclick="document.getElementById('crm-add-form').style.display='none'">Cancel</button>
          <button class="btn" onclick="CRMSystem.saveContact()">Save</button>
        </div>
      </div>`

      body.innerHTML = statsHTML + addFormHTML + (list.length
        ? `<table class="crm-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Added</th><th></th></tr></thead>
            <tbody>${list.map((c,i) => `<tr>
              <td style="font-weight:600">${c.name}</td>
              <td><a href="mailto:${c.email}" style="color:var(--accent)">${c.email}</a></td>
              <td>${c.phone||'—'}</td>
              <td><span class="crm-badge ${c.status}">${c.status}</span></td>
              <td>${_ago(c.createdAt)}</td>
              <td><button onclick="CRMSystem.deleteContact('${_tab}',${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px">✕</button></td>
            </tr>`).join('')}</tbody>
          </table>`
        : `<div style="text-align:center;padding:40px;color:var(--muted)">No ${_tab} yet — add your first one above</div>`)
    }

    else if (_tab === 'orders') {
      const orders = (() => { try { return JSON.parse(localStorage.getItem('pc_orders_v1') || '[]') } catch { return [] } })()
      body.innerHTML = statsHTML + (orders.length
        ? `<table class="crm-table">
            <thead><tr><th>Order ID</th><th>Name</th><th>Email</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>${orders.map(o => `<tr>
              <td style="font-family:monospace;font-size:11px">${o.id}</td>
              <td style="font-weight:600">${o.name}</td>
              <td>${o.email}</td>
              <td style="font-weight:700;color:var(--accent)">$${(o.total||0).toFixed(2)}</td>
              <td>${_ago(o.date)}</td>
              <td><span class="crm-badge customer">${o.status||'pending'}</span></td>
            </tr>`).join('')}</tbody>
          </table>`
        : `<div style="text-align:center;padding:40px;color:var(--muted)">No orders yet — add a product-grid section to enable e-commerce</div>`)
    }
  }

  function showAddForm() {
    const f = document.getElementById('crm-add-form')
    if (f) { f.style.display = f.style.display === 'none' ? 'grid' : 'none' }
  }

  function saveContact() {
    const name  = document.getElementById('crm-name')?.value.trim()
    const email = document.getElementById('crm-email')?.value.trim()
    if (!name || !email) { toast('Name and email required','⚠️'); return }
    const db = _load()
    const list = _tab === 'leads' ? db.leads : db.contacts
    list.unshift({ id:'c_'+Date.now(), name, email, phone: document.getElementById('crm-phone')?.value.trim(), status: document.getElementById('crm-status')?.value || 'lead', createdAt: new Date().toISOString() })
    _save(db)
    document.getElementById('crm-add-form').style.display = 'none'
    _render()
    toast(`${name} added`, '👥')
  }

  function deleteContact(tab, idx) {
    const db = _load()
    const list = tab === 'leads' ? db.leads : db.contacts
    list.splice(idx, 1)
    _save(db)
    _render()
  }

  function exportCSV() {
    const db   = _load()
    const list = _tab === 'orders'
      ? (() => { try { return JSON.parse(localStorage.getItem('pc_orders_v1')||'[]') } catch { return [] } })()
      : (_tab === 'leads' ? db.leads : db.contacts)
    if (!list.length) { toast('Nothing to export','⚠️'); return }
    const headers = Object.keys(list[0]).join(',')
    const rows    = list.map(r => Object.values(r).map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob    = new Blob([headers + '\n' + rows], { type:'text/csv' })
    const a       = document.createElement('a')
    a.href        = URL.createObjectURL(blob)
    a.download    = `pagecraft-${_tab}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast(`${_tab} exported`, '⬇')
  }

  // Auto-capture form submissions into CRM
  function captureSubmission(data) {
    const db = _load()
    db.leads.unshift({ id:'c_'+Date.now(), name: data.name||data.Name||'Unknown', email: data.email||data.Email||'', phone: data.phone||data.Phone||'', status:'lead', source:'form', createdAt: new Date().toISOString() })
    _save(db)
  }

  function _ago(iso) {
    if (!iso) return '—'
    const d = Date.now() - new Date(iso).getTime()
    if (d < 3600000)  return Math.floor(d/60000) + 'm ago'
    if (d < 86400000) return Math.floor(d/3600000) + 'h ago'
    return Math.floor(d/86400000) + 'd ago'
  }

  return { open, close, switchTab, showAddForm, saveContact, deleteContact, exportCSV, captureSubmission }
})()
window.PageCraft.CRMSystem = CRMSystem

// ── B. EMAIL AUTOMATION ───────────────────────────────────────────────────────
const EmailAuto = (() => {
  const KEY = 'pc_email_sequences_v1'

  const DEFAULTS = [
    { id:'e1', delay:'Immediately', subject:'Welcome! 👋', body:'Hi {{name}},\n\nThank you for signing up! We\'re thrilled to have you.\n\nGet started here: {{site_url}}\n\nBest,\nThe Team', active:true },
    { id:'e2', delay:'Day 3',      subject:'Quick tip for you 💡', body:'Hi {{name}},\n\nHere\'s one thing most people miss when getting started...\n\n[Your tip here]\n\nLet us know if you have questions!', active:true },
    { id:'e3', delay:'Day 7',      subject:'How\'s it going? 🚀', body:'Hi {{name}},\n\nIt\'s been a week — we\'d love to hear how things are going.\n\nReply to this email anytime.\n\nCheers,\nThe Team', active:false },
  ]

  function _load() { try { return JSON.parse(localStorage.getItem(KEY) || JSON.stringify(DEFAULTS)) } catch { return [...DEFAULTS] } }
  function _save(d) { localStorage.setItem(KEY, JSON.stringify(d)) }

  function open() {
    document.getElementById('email-modal')?.classList.remove('hidden')
    _render()
  }
  function close() { document.getElementById('email-modal')?.classList.add('hidden') }

  function _render() {
    const steps = _load()
    const body  = document.getElementById('email-body')
    if (!body) return
    body.innerHTML = `
      <div style="margin-bottom:14px;padding:12px;background:rgba(108,99,255,.08);border:1px solid rgba(108,99,255,.2);border-radius:8px;font-size:12px;color:var(--muted)">
        ✉ <b style="color:var(--text)">Email sequences</b> auto-send to contacts added via forms. Variables: <code>{{name}}</code> <code>{{email}}</code> <code>{{site_url}}</code>
      </div>
      <div class="email-seq" id="email-seq">
        ${steps.map((step,i) => `
          <div class="email-step" style="opacity:${step.active?1:.5}">
            <div class="email-step-head">
              <div class="email-step-num">${i+1}</div>
              <div>
                <div class="email-step-subject">${step.subject}</div>
                <div class="email-step-preview">${step.body.slice(0,80).replace(/\n/g,' ')}…</div>
              </div>
              <div class="email-step-delay">${step.delay}</div>
            </div>
            <div class="email-step-actions">
              <button class="email-step-btn" onclick="EmailAuto.editStep('${step.id}')">${step.active?'✏ Edit':'✏ Edit'}</button>
              <button class="email-step-btn" onclick="EmailAuto.toggleStep('${step.id}')">${step.active?'⏸ Pause':'▶ Enable'}</button>
              <button class="email-step-btn" onclick="EmailAuto.deleteStep('${step.id}')" style="color:#ef4444">🗑 Delete</button>
            </div>
          </div>`).join('')}
      </div>
      <button class="email-add-btn" onclick="EmailAuto.addStep()">+ Add Email Step</button>
    `
  }

  function addStep() {
    const subject = prompt('Email subject:')
    if (!subject) return
    const delay = prompt('Send delay (e.g. Immediately, Day 3, Week 1):', 'Day 1')
    const steps = _load()
    steps.push({ id:'e_'+Date.now(), delay: delay||'Day 1', subject, body: 'Hi {{name}},\n\n[Your message here]\n\nBest,\nThe Team', active:true })
    _save(steps)
    _render()
    toast('Email step added','✉')
  }

  function editStep(id) {
    const steps = _load()
    const step  = steps.find(s => s.id === id)
    if (!step) return
    const subject = prompt('Subject:', step.subject)
    if (!subject) return
    const body = prompt('Email body:', step.body)
    step.subject = subject
    if (body) step.body = body
    _save(steps)
    _render()
    toast('Email updated','✉')
  }

  function toggleStep(id) {
    const steps = _load()
    const step  = steps.find(s => s.id === id)
    if (step) { step.active = !step.active; _save(steps); _render() }
  }

  function deleteStep(id) {
    if (!confirm('Delete this email step?')) return
    _save(_load().filter(s => s.id !== id))
    _render()
    toast('Email step removed','🗑')
  }

  // Simulate sending — in production would call email API
  function triggerWelcome(contact) {
    const steps = _load().filter(s => s.active && s.delay === 'Immediately')
    steps.forEach(s => {
      const body = s.body.replace(/\{\{name\}\}/g, contact.name||'there').replace(/\{\{email\}\}/g, contact.email||'').replace(/\{\{site_url\}\}/g, location.href)
      console.info(`[EmailAuto] Would send to ${contact.email}:\nSubject: ${s.subject}\n${body}`)
    })
    if (steps.length) toast(`Welcome email queued for ${contact.email||'contact'}`, '✉')
  }

  return { open, close, addStep, editStep, toggleStep, deleteStep, triggerWelcome }
})()
window.PageCraft.EmailAuto = EmailAuto
