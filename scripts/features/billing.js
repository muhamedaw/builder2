/* ══════════════════════════════════════════════════════
   ██████████████████████████████████████████████████
   STRIPE BILLING SYSTEM
   Plans · Checkout · Feature gates · Subscription log
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

const STRIPE_PK = 'pk_test_pagecraft_demo_key'

const PLANS = [
  { id:'free', name:'Free', desc:'Perfect for exploring.', monthlyPrice:0, annualPrice:0,
    color:'#6c63ff', stripePriceId_monthly:null, stripePriceId_annual:null,
    features:[
      {text:'3 saved projects',included:true},{text:'Base blocks',included:true},
      {text:'HTML export',included:true},{text:'Community support',included:true},
      {text:'Premium templates',included:false},{text:'Component library',included:false},
      {text:'3D scenes',included:false},{text:'Animations',included:false},
      {text:'Priority support',included:false},
    ]},
  { id:'pro', name:'Pro', desc:'For professionals who build seriously.', monthlyPrice:29, annualPrice:19,
    color:'#6c63ff', featured:true, stripePriceId_monthly:'price_pro_monthly', stripePriceId_annual:'price_pro_annual',
    features:[
      {text:'Unlimited projects',included:true},{text:'All section blocks',included:true},
      {text:'HTML + JSON + React export',included:true},{text:'Full component library',included:true},
      {text:'7 premium templates',included:true},{text:'3D background scenes',included:true},
      {text:'Animation system',included:true},{text:'Priority support',included:true},
      {text:'Custom domain export',included:true},
    ]},
  { id:'team', name:'Team', desc:'Scale across your organisation.', monthlyPrice:79, annualPrice:52,
    color:'#a78bfa', stripePriceId_monthly:'price_team_monthly', stripePriceId_annual:'price_team_annual',
    features:[
      {text:'Everything in Pro',included:true},{text:'Up to 10 seats',included:true},
      {text:'Shared project library',included:true},{text:'Custom brand kit',included:true},
      {text:'SSO / SAML',included:true},{text:'Audit logs',included:true},
      {text:'Dedicated account manager',included:true},{text:'SLA 99.9%',included:true},
      {text:'White-label export',included:true},
    ]},
]

const PREMIUM_FEATURES = new Set(['scene-particles','scene-waves','scene-globe','scene-cards','animate','responsive','export-react','export-json'])
const FREE_PROJECT_LIMIT = 3
const BILLING_KEY = 'pc_billing_v1'
const BILLING_LOG_KEY = 'pc_billing_log_v1'

function loadBillingState(){try{return JSON.parse(localStorage.getItem(BILLING_KEY)||'null')}catch{return null}}
function saveBillingState(s){localStorage.setItem(BILLING_KEY,JSON.stringify(s))}
function loadBillingLog(){try{return JSON.parse(localStorage.getItem(BILLING_LOG_KEY)||'[]')}catch{return[]}}
function saveBillingLog(l){localStorage.setItem(BILLING_LOG_KEY,JSON.stringify(l))}

function currentPlan(){
  if(!AUTH.user)return'free'
  const b=loadBillingState()
  if(b&&b.userId===AUTH.user.id&&b.status==='active')return b.planId||'free'
  return AUTH.user.plan?.toLowerCase()||'free'
}
function isPro(){const p=currentPlan();return p==='pro'||p==='team'}
function isTeam(){return currentPlan()==='team'}
function canUseFeature(f){return !PREMIUM_FEATURES.has(f)||isPro()}

function requirePro(f,msg='Upgrade to Pro to use this feature'){
  if(canUseFeature(f))return true
  openBilling();toast(msg,'⭐');return false
}

function checkProjectLimit(){
  if(isPro())return true
  const db=loadAllProjects()
  const n=Object.values(db).filter(p=>p.userId===AUTH.user?.id).length
  if(n>=FREE_PROJECT_LIMIT){openBilling();toast(`Free plan: ${FREE_PROJECT_LIMIT} projects max. Upgrade for unlimited.`,'⭐');return false}
  return true
}

// Billing UI state
const BILLING_UI={period:'monthly',selectedPlan:null}

function openBilling(){
  if(!AUTH.user){showAuthGate();return}
  BILLING_UI.selectedPlan=null
  document.getElementById('billing-modal').classList.remove('hidden')
  renderBillingPlans()
  renderCurrentPlanBanner()
  document.getElementById('stripe-form-section').classList.remove('show')
  document.getElementById('billing-log-section').style.display='none'
}
function closeBilling(){document.getElementById('billing-modal').classList.add('hidden')}

function toggleBillingPeriod(){
  BILLING_UI.period=BILLING_UI.period==='monthly'?'annual':'monthly'
  const sw=document.getElementById('billing-period-toggle')
  const badge=document.getElementById('billing-save-badge')
  sw.classList.toggle('annual',BILLING_UI.period==='annual')
  badge.style.display=BILLING_UI.period==='annual'?'inline-flex':'none'
  renderBillingPlans()
}

function renderCurrentPlanBanner(){
  const plan=currentPlan(),billing=loadBillingState()
  const planDef=PLANS.find(p=>p.id===plan)||PLANS[0]
  const banner=document.getElementById('current-plan-banner')
  const dot=document.getElementById('cpb-dot')
  if(!banner||!dot)return
  banner.className='current-plan-banner'+(plan==='free'?' free':'')
  dot.style.background=planDef.color
  document.getElementById('cpb-name').textContent=planDef.name+' Plan'
  const det=document.getElementById('cpb-detail')
  const manBtn=document.getElementById('cpb-manage-btn')
  if(plan==='free'){det.textContent=`${FREE_PROJECT_LIMIT} projects · Basic blocks · Community support`;if(manBtn)manBtn.style.display='none'}
  else{const rd=billing?.currentPeriodEnd?new Date(billing.currentPeriodEnd).toLocaleDateString():'—';det.textContent=`${BILLING_UI.period==='annual'?'Annual':'Monthly'} · Renews ${rd}`;if(manBtn)manBtn.style.display='block'}
}

function renderBillingPlans(){
  const el=document.getElementById('billing-plans')
  if(!el)return
  const cur=currentPlan()
  el.innerHTML=PLANS.map(plan=>{
    const price=BILLING_UI.period==='annual'?plan.annualPrice:plan.monthlyPrice
    const isCur=plan.id===cur,isFree=plan.id==='free'
    let ctaLabel,ctaClass
    if(isCur){ctaLabel='✓ Current Plan';ctaClass='success'}
    else if(isFree){ctaLabel='Downgrade';ctaClass='outline'}
    else{ctaLabel=`Upgrade to ${plan.name}`;ctaClass='primary'}
    const annNote=BILLING_UI.period==='annual'&&!isFree&&plan.monthlyPrice>0
      ?`<div class="plan-annual-note">$${plan.annualPrice*12}/yr — save $${(plan.monthlyPrice-plan.annualPrice)*12}</div>`:''
    const featsHtml=plan.features.map(f=>`
      <div class="plan-feat${f.included?'':' locked'}">
        <div class="plan-feat-icon ${f.included?'yes':'no'}">${f.included?'✓':'−'}</div>
        <span>${f.text}</span>
      </div>`).join('')
    return`<div class="plan-card${plan.featured?' featured':''}${isCur?' current':''}">
      ${plan.featured?'<div class="plan-popular">MOST POPULAR</div>':''}
      <div class="plan-name">${plan.name}</div>
      <div class="plan-desc">${plan.desc}</div>
      <div class="plan-price">
        <span class="plan-currency">$</span><span class="plan-amount">${price}</span>
        <span class="plan-period">${isFree?'forever':'/ mo'}</span>${annNote}
      </div>
      <button class="plan-cta ${ctaClass}" ${isCur||isFree?'disabled':''}
        onclick="${isCur||isFree?'void 0':`selectPlan('${plan.id}')`}">
        <span class="btn-spin" style="display:none;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite"></span>
        <span>${ctaLabel}</span>
      </button>
      <div class="plan-features">${featsHtml}</div>
    </div>`
  }).join('')
}

function selectPlan(planId){
  BILLING_UI.selectedPlan=planId
  const plan=PLANS.find(p=>p.id===planId);if(!plan)return
  const price=BILLING_UI.period==='annual'?plan.annualPrice:plan.monthlyPrice
  document.getElementById('stripe-submit-label').textContent=`Subscribe — $${price}/${BILLING_UI.period==='annual'?'mo billed annually':'month'}`
  document.getElementById('stripe-email').value=AUTH.user?.email||''
  document.getElementById('stripe-name').value=AUTH.user?.name||''
  document.getElementById('stripe-card-error').textContent=''
  const s=document.getElementById('stripe-form-section')
  s.classList.add('show')
  s.scrollIntoView({behavior:'smooth',block:'nearest'})
}

function formatCardNum(inp){let v=inp.value.replace(/\D/g,'').slice(0,16);inp.value=v.match(/.{1,4}/g)?.join(' ')||v}
function formatExpiry(inp){let v=inp.value.replace(/\D/g,'').slice(0,4);if(v.length>=2)v=v.slice(0,2)+'/'+v.slice(2);inp.value=v}

async function processPayment(){
  const plan=PLANS.find(p=>p.id===BILLING_UI.selectedPlan);if(!plan)return
  const name=document.getElementById('stripe-name').value.trim()
  const email=document.getElementById('stripe-email').value.trim()
  const errEl=document.getElementById('stripe-card-error')
  const btn=document.getElementById('stripe-submit-btn')
  const spin=document.getElementById('stripe-spinner')
  if(!name){errEl.textContent='Please enter cardholder name';return}
  if(!email){errEl.textContent='Please enter billing email';return}
  const cardNum=document.getElementById('demo-card-number')?.value.replace(/\s/g,'')
  const expiry=document.getElementById('demo-card-exp')?.value
  const cvc=document.getElementById('demo-card-cvc')?.value
  if(!cardNum||cardNum.length<16){errEl.textContent='Please enter a valid card number';return}
  if(!expiry||expiry.length<5){errEl.textContent='Please enter card expiry';return}
  if(!cvc||cvc.length<3){errEl.textContent='Please enter CVC';return}
  errEl.textContent='';btn.disabled=true;spin.style.display='block'
  document.getElementById('stripe-submit-label').textContent='Processing…'

  // Simulate Stripe API (replace with real call in production)
  await new Promise(r=>setTimeout(r,1200))

  if(cardNum==='4000000000000002'){
    errEl.textContent='Your card was declined. Please try a different card.'
    btn.disabled=false;spin.style.display='none'
    document.getElementById('stripe-submit-label').textContent=`Subscribe — $${BILLING_UI.period==='annual'?plan.annualPrice:plan.monthlyPrice}/month`
    return
  }

  const now=new Date(),periodEnd=new Date(now)
  periodEnd.setMonth(periodEnd.getMonth()+(BILLING_UI.period==='annual'?12:1))
  const sub={id:'sub_'+Math.random().toString(36).slice(2,12),userId:AUTH.user.id,planId:plan.id,planName:plan.name,period:BILLING_UI.period,amount:BILLING_UI.period==='annual'?plan.annualPrice*12:plan.monthlyPrice,currency:'USD',status:'active',currentPeriodStart:now.toISOString(),currentPeriodEnd:periodEnd.toISOString(),cancelAtPeriodEnd:false,stripeSubscriptionId:'sub_demo_'+Date.now(),createdAt:now.toISOString()}
  saveBillingState(sub)
  addBillingLogEntry({date:now.toISOString(),description:`${plan.name} Plan — ${BILLING_UI.period==='annual'?'Annual':'Monthly'} subscription`,amount:sub.amount,currency:'USD',status:'paid',invoiceId:'inv_'+Math.random().toString(36).slice(2,10).toUpperCase()})
  AUTH.user.plan=plan.name
  const db=loadUserDB();if(db[AUTH.user.email]){db[AUTH.user.email].plan=plan.name;saveUserDB(db)}
  spin.style.display='none';btn.disabled=false
  renderUserChip();updateUpgradeButton();closeBilling()
  toast(`🎉 Welcome to ${plan.name}! All premium features are now unlocked.`,'⭐')
  renderBlocks()
}

function cancelSubscription(){
  const b=loadBillingState();if(!b||b.status!=='active')return toast('No active subscription','⚠️')
  const endDate=new Date(b.currentPeriodEnd).toLocaleDateString()
  if(!confirm(`Cancel subscription?\nYou'll keep ${b.planName} access until ${endDate}.`))return
  b.status='canceled';b.cancelAtPeriodEnd=true;saveBillingState(b)
  addBillingLogEntry({date:new Date().toISOString(),description:`${b.planName} Plan — Cancelled`,amount:0,currency:'USD',status:'refunded',invoiceId:'canc_'+Math.random().toString(36).slice(2,10).toUpperCase()})
  AUTH.user.plan='Free';renderUserChip();updateUpgradeButton();renderCurrentPlanBanner()
  toast('Subscription cancelled. Access continues until '+endDate,'📅')
}

function addBillingLogEntry(entry){const log=loadBillingLog();log.unshift(entry);saveBillingLog(log.slice(0,100))}

function showBillingLog(){
  const section=document.getElementById('billing-log-section')
  const tbody=document.getElementById('billing-log-body')
  const log=loadBillingLog()
  if(!log.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">No billing history yet</td></tr>'}
  else{tbody.innerHTML=log.map(e=>{
    const date=new Date(e.date).toLocaleDateString()
    const amount=e.amount>0?`$${Number(e.amount).toFixed(2)}`:'—'
    const badge=`<span class="log-badge ${e.status}">${e.status}</span>`
    const inv=e.invoiceId?`<span style="font-family:monospace;font-size:10px;color:var(--muted)">${e.invoiceId}</span>`:'—'
    return`<tr><td>${date}</td><td>${e.description}</td><td style="font-family:monospace">${amount}</td><td>${badge}</td><td>${inv}</td></tr>`
  }).join('')}
  section.style.display=section.style.display==='none'?'block':'none'
}

function exportBillingLog(){
  const log=loadBillingLog();if(!log.length){toast('No billing history','⚠️');return}
  const csv='Date,Description,Amount,Currency,Status,Invoice\n'+log.map(e=>[new Date(e.date).toLocaleDateString(),`"${e.description}"`,e.amount||0,e.currency||'USD',e.status,e.invoiceId||''].join(',')).join('\n')
  const blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a')
  a.href=url;a.download='pagecraft-billing.csv';a.click();URL.revokeObjectURL(url);toast('Exported','⬇')
}

function updateUpgradeButton(){
  const btn=document.getElementById('btn-upgrade');if(!btn)return
  if(!AUTH.user){btn.style.display='none';return}
  btn.style.display=currentPlan()==='free'?'flex':'none'
}

function upgradeAccount(){openBilling()}

document.addEventListener('click',ev=>{
  if(ev.target===document.getElementById('billing-modal'))closeBilling()
})
