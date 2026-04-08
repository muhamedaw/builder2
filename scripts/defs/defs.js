/* defs.js Phase 4/5 */

/* SECTION DEFS & RENDERERS (compact)
══════════════════════════════════════════════════════ */
const DEFS={
  hero:{label:'Hero',icon:'🦸',color:'#6c63ff22',desc:'Full-width hero banner',
    props:{headline:'Build Something People Love',subheadline:'Fast, flexible, and beautiful.',ctaText:'Get Started',ctaLink:'#',ctaSecText:'Learn More',ctaSecLink:'#',align:'center',minHeight:'520',bgColor:'#0f172a',textColor:'#ffffff',bgImage:'',
      videoEnabled:'false', videoType:'youtube', videoUrl:'', overlayColor:'#000000', overlayOpacity:'0.4'}},
  about:{label:'About',icon:'👤',color:'#10b98122',desc:'Two-column intro section',
    props:{heading:'About Us',subheading:'Our story',body:'We are a passionate team building great products.',highlight:'Founded in 2020 — 10,000+ happy customers.',image:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',imagePos:'right',bgColor:'#ffffff',textColor:'#0f172a',accentColor:'#6c63ff'}},
  contact:{label:'Contact',icon:'✉️',color:'#f59e0b22',desc:'Form + contact info',
    props:{heading:'Get In Touch',subheading:"We'd love to hear from you.",email:'hello@yoursite.com',phone:'+1 (555) 000-0000',address:'123 Main Street, City',showMap:'true',bgColor:'#f8fafc',textColor:'#0f172a',accentColor:'#6c63ff'}},
  features:{label:'Features',icon:'✨',color:'#8b5cf622',desc:'3-column highlights',
    props:{heading:'Everything You Need',subheading:'Packed with powerful features.',feat1Icon:'⚡',feat1Title:'Blazing Fast',feat1Desc:'Optimised for speed.',feat2Icon:'🔒',feat2Title:'Secure',feat2Desc:'Enterprise security.',feat3Icon:'📱',feat3Title:'Responsive',feat3Desc:'All devices.',bgColor:'#ffffff',textColor:'#0f172a',accentColor:'#6c63ff'}},
  testimonial:{label:'Testimonial',icon:'💬',color:'#ec489922',desc:'Quote + attribution',
    props:{quote:'This product transformed how we work.',author:'Sarah Kim',role:'CTO, Acme Inc.',avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',rating:'5',bgColor:'#0f172a',textColor:'#ffffff',accentColor:'#a78bfa'}},
  footer:{label:'Footer',icon:'🔻',color:'#64748b22',desc:'Footer with links',
    props:{brand:'YourBrand',tagline:'Building the future.',copyright:`© ${new Date().getFullYear()} YourBrand.`,link1Label:'Privacy',link1Href:'#',link2Label:'Terms',link2Href:'#',link3Label:'Contact',link3Href:'#',bgColor:'#0f172a',textColor:'#94a3b8'}},

  /* ── COMPONENT LIBRARY ─────────────────────────────────────── */
  pricing:{label:'Pricing',icon:'💎',color:'#0ea5e922',desc:'3-tier pricing cards with toggle',
    props:{
      heading:'Simple, Transparent Pricing',
      subheading:'No hidden fees. No surprises. Cancel anytime.',
      // Toggle labels
      toggleMonthly:'Monthly', toggleAnnual:'Annual',
      annualDiscount:'Save 20%',
      // Tier 1 — Free
      t1Name:'Starter', t1Desc:'Perfect for individuals and small projects.',
      t1PriceMonthly:'0',  t1PriceAnnual:'0',
      t1Currency:'$', t1Period:'/month',
      t1Cta:'Get Started Free', t1CtaLink:'#',
      t1f1:'5 projects', t1f2:'2 GB storage', t1f3:'Basic analytics',
      t1f4:'Community support', t1f5:'', t1f6:'',
      t1featured:'false',
      // Tier 2 — Pro
      t2Name:'Pro', t2Desc:'For growing teams that need more power.',
      t2PriceMonthly:'29', t2PriceAnnual:'23',
      t2Currency:'$', t2Period:'/month',
      t2Cta:'Start Free Trial', t2CtaLink:'#',
      t2f1:'Unlimited projects', t2f2:'50 GB storage', t2f3:'Advanced analytics',
      t2f4:'Priority support', t2f5:'Custom domains', t2f6:'Team collaboration',
      t2featured:'true',
      // Tier 3 — Enterprise
      t3Name:'Enterprise', t3Desc:'For large organizations with custom needs.',
      t3PriceMonthly:'99', t3PriceAnnual:'79',
      t3Currency:'$', t3Period:'/month',
      t3Cta:'Contact Sales', t3CtaLink:'#',
      t3f1:'Everything in Pro', t3f2:'500 GB storage', t3f3:'Custom analytics',
      t3f4:'Dedicated support', t3f5:'SLA guarantee', t3f6:'SSO & SAML',
      t3featured:'false',
      bgColor:'#f8fafc', textColor:'#0f172a', accentColor:'#0ea5e9',
    }},

  faq:{label:'FAQ',icon:'❓',color:'#f59e0b22',desc:'Accordion FAQ section',
    props:{
      heading:'Frequently Asked Questions',
      subheading:'Everything you need to know. Can\'t find the answer? Contact our team.',
      q1:'How does the free trial work?',
      a1:'Your 14-day free trial gives you full access to all Pro features — no credit card required. At the end of the trial, you can upgrade to a paid plan or downgrade to our free tier.',
      q2:'Can I cancel my subscription at any time?',
      a2:'Yes, absolutely. You can cancel your subscription at any time from your account settings. Your access continues until the end of your current billing period.',
      q3:'What payment methods do you accept?',
      a3:'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely via Stripe.',
      q4:'Is my data secure?',
      a4:'Security is our top priority. We use AES-256 encryption, SOC 2 Type II certification, and daily backups. Your data is never shared with third parties.',
      q5:'Do you offer discounts for non-profits or education?',
      a5:'Yes! We offer 50% off for verified non-profit organisations and educational institutions. Contact our team with proof of your status to get started.',
      q6:'Can I switch between plans?',
      a6:'You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, and we\'ll prorate your billing. Downgrades take effect at the end of your billing cycle.',
      bgColor:'#ffffff', textColor:'#0f172a', accentColor:'#f59e0b',
    }},

  gallery:{label:'Gallery',icon:'🖼',color:'#ec489922',desc:'Responsive image gallery grid',
    props:{
      heading:'Our Work',
      subheading:'A showcase of projects we\'re proud of.',
      // Layout: 'masonry' | 'grid' | 'featured'
      layout:'grid',
      cols:'3',
      img1:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
      cap1:'Team Collaboration',
      img2:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      cap2:'Modern Office Space',
      img3:'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
      cap3:'Strategy Session',
      img4:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      cap4:'Data & Analytics',
      img5:'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
      cap5:'Product Workshop',
      img6:'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
      cap6:'Client Presentation',
      bgColor:'#ffffff', textColor:'#0f172a', accentColor:'#ec4899',
    }},

  /* ══════════════════════════════════════════════════════
     3D SECTION DEFS — Three.js powered
  ══════════════════════════════════════════════════════ */
  'scene-particles':{label:'3D Particles',icon:'✦',color:'#6366f122',desc:'Floating particle field hero',
    props:{
      headline:'Built for the Future',
      subheadline:'An immersive experience powered by real-time 3D rendering.',
      ctaText:'Explore Now', ctaLink:'#',
      particleCount:'3000',
      particleColor:'#818cf8',
      particleSize:'0.8',
      speed:'0.4',
      bgColor:'#030712',
      textColor:'#ffffff',
      accentColor:'#6366f1',
      minHeight:'600',
    }},

  'scene-waves':{label:'3D Waves',icon:'〜',color:'#0ea5e922',desc:'Animated wave mesh background',
    props:{
      heading:'Wave of Innovation',
      subheading:'Fluid, animated geometry that moves with your brand.',
      waveColor1:'#0ea5e9',
      waveColor2:'#6366f1',
      waveSpeed:'1.2',
      waveAmplitude:'1.5',
      wireframe:'false',
      bgColor:'#020617',
      textColor:'#ffffff',
      accentColor:'#38bdf8',
      minHeight:'560',
    }},

  'scene-globe':{label:'3D Globe',icon:'🌐',color:'#10b98122',desc:'Rotating wireframe globe',
    props:{
      heading:'Global Reach',
      subheading:'Connecting teams and customers across every continent.',
      globeColor:'#34d399',
      globeWireColor:'#6ee7b7',
      dotColor:'#a7f3d0',
      rotateSpeed:'0.3',
      bgColor:'#020617',
      textColor:'#ffffff',
      accentColor:'#34d399',
      layout:'right',
      minHeight:'560',
    }},

  'scene-cards':{label:'3D Cards',icon:'◈',color:'#f59e0b22',desc:'Floating 3D feature cards',
    props:{
      heading:'Three Dimensions of Value',
      subheading:'Features that stand out — literally.',
      card1Title:'Performance',  card1Icon:'⚡', card1Desc:'10× faster rendering',
      card2Title:'Security',     card2Icon:'🔒', card2Desc:'Zero-trust architecture',
      card3Title:'Scale',        card3Icon:'📈', card3Desc:'Millions of users, zero lag',
      cardColor:'#1e1b4b',
      accentColor:'#6366f1',
      bgColor:'#030712',
      textColor:'#ffffff',
      minHeight:'580',
    }},

  'form-builder':{label:'Form',icon:'📋',color:'#6c63ff22',desc:'Drag & drop form builder',
    props:{
      heading:'Contact Us',
      subheading:'Fill out the form and we\'ll get back to you shortly.',
      submitText:'Send Message',
      successMsg:'✅ Thank you! Your message has been sent.',
      webhook:'',
      bgColor:'#f8fafc',textColor:'#0f172a',accentColor:'#6c63ff',
      fields: JSON.stringify([
        {id:'fb_1',type:'text',    label:'Full Name',   placeholder:'Your name',        required:true,  validation:''},
        {id:'fb_2',type:'email',   label:'Email',       placeholder:'your@email.com',   required:true,  validation:''},
        {id:'fb_3',type:'textarea',label:'Message',     placeholder:'Your message...',  required:false, validation:''},
      ]),
    }},

  'video-hero':{label:'Video Hero',icon:'🎬',color:'#ef444422',desc:'Full-screen video background hero',
    props:{
      headline:'Welcome to the Future', subheadline:'Experience our product in action.',
      ctaText:'Watch Demo', ctaLink:'#', ctaSecText:'Learn More', ctaSecLink:'#',
      align:'center', minHeight:'600',
      videoType:'youtube',
      videoUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoLocal:'',
      autoplay:'true', loop:'true', muted:'true',
      overlayColor:'#000000', overlayOpacity:'0.5',
      posterImage:'',
      textColor:'#ffffff', accentColor:'#6c63ff',
    }},

  'product-grid':{label:'Product Grid',icon:'🛍',color:'#10b98122',desc:'E-commerce product grid with cart',
    props:{
      heading:'Our Products', subheading:'Shop our collection',
      cols:'3', currency:'$', showDesc:'true', showPrice:'true', showBadge:'true',
      bgColor:'#ffffff', textColor:'#0f172a', accentColor:'#6c63ff', cardBg:'#f8fafc',
    }},

  'custom-html':{label:'Custom HTML',icon:'</>',color:'#64748b22',desc:'Write any HTML + CSS + JS',
    props:{
      code:`<div style="padding:40px;text-align:center;background:#1e293b;color:#f1f5f9;border-radius:12px;font-family:sans-serif">
  <h2 style="margin:0 0 12px;font-size:1.8rem">Custom Block</h2>
  <p style="opacity:.6;margin:0">Edit this HTML in the panel →</p>
</div>`,
      minHeight:'120',
    }},
}

function uid(){ return 's'+(S.nextId++)+'_'+Math.random().toString(36).slice(2,6) }
function e(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

