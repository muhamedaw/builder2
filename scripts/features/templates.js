/* ══════════════════════════════════════════════════════
   TEMPLATES SYSTEM
══════════════════════════════════════════════════════ */

// ── Template data ────────────────────────────────────────────────────────────
// Each template defines: id, name, industry tag, thumbnail emoji, colour,
// description, and an array of section objects (type + full props override).
const TEMPLATES = [

  /* ── BUSINESS ─────────────────────────────────────────────── */
  {
    id: 'business-pro',
    name: 'Business Pro',
    category: 'Business',
    industry: 'Corporate',
    thumb: '🏢',
    thumbBg: 'linear-gradient(135deg,#1e3a5f,#2d6a9f)',
    desc: 'Professional corporate site with authority and trust signals.',
    sections: [
      { type:'hero', props:{
        headline:'Enterprise Solutions That Drive Growth',
        subheadline:'Trusted by 500+ companies worldwide. We deliver measurable results with proven strategies.',
        ctaText:'Get a Free Consultation',ctaLink:'#contact',
        ctaSecText:'View Case Studies',ctaSecLink:'#work',
        align:'left',minHeight:'560',
        bgColor:'#0f2744',textColor:'#ffffff',bgImage:'',
      }},
      { type:'features', props:{
        heading:'Why Leading Companies Choose Us',
        subheading:'We combine deep industry expertise with cutting-edge technology to deliver exceptional outcomes.',
        feat1Icon:'📊',feat1Title:'Data-Driven Strategy',feat1Desc:'Every decision backed by real-time analytics and market intelligence.',
        feat2Icon:'🔐',feat2Title:'Enterprise Security',feat2Desc:'SOC 2 Type II certified. Your data is protected at every layer.',
        feat3Icon:'⚡',feat3Title:'Rapid Deployment',feat3Desc:'Go live in weeks, not months. Our agile process delivers faster ROI.',
        bgColor:'#f8fafc',textColor:'#0f172a',accentColor:'#1e3a8a',
      }},
      { type:'about', props:{
        heading:'15 Years of Industry Excellence',
        subheading:'Our Story',
        body:'Founded in 2009, we have grown from a boutique consultancy into a full-service enterprise solutions provider. Our team of 200+ specialists has completed over 1,200 successful projects across 40 countries.',
        highlight:'★ Gartner Magic Quadrant Leader 2023 · 98% client retention rate',
        image:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
        imagePos:'right',bgColor:'#ffffff',textColor:'#0f172a',accentColor:'#1e3a8a',
      }},
      { type:'testimonial', props:{
        quote:'Partnering with them was the best decision we made this year. Revenue up 40% in just six months.',
        author:'James Whitfield',role:'CEO, Pinnacle Corp',
        avatar:'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80',
        rating:'5',bgColor:'#0f2744',textColor:'#ffffff',accentColor:'#60a5fa',
      }},
      { type:'contact', props:{
        heading:'Start Your Transformation',
        subheading:'Schedule a free 30-minute strategy call with one of our senior consultants.',
        email:'enterprise@company.com',phone:'+1 (800) 555-0100',address:'100 Business Ave, New York, NY 10001',
        showMap:'true',bgColor:'#f0f4f8',textColor:'#0f172a',accentColor:'#1e3a8a',
      }},
      { type:'footer', props:{
        brand:'Nexus Corp',tagline:'Enterprise solutions for the modern world.',
        copyright:'© 2024 Nexus Corp. All rights reserved.',
        link1Label:'Privacy Policy',link1Href:'#',link2Label:'Terms of Service',link2Href:'#',link3Label:'Security',link3Href:'#',
        bgColor:'#0a1628',textColor:'#94a3b8',
      }},
    ],
  },

  {
    id: 'business-agency',
    name: 'Creative Agency',
    category: 'Business',
    industry: 'Agency',
    thumb: '🎨',
    thumbBg: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
    desc: 'Bold agency identity with portfolio focus and strong CTA.',
    sections: [
      { type:'hero', props:{
        headline:'We Build Brands That Demand Attention',
        subheadline:'Strategy. Design. Digital. Full-service creative agency for ambitious brands.',
        ctaText:'Start a Project',ctaLink:'#contact',
        ctaSecText:'See Our Work',ctaSecLink:'#work',
        align:'center',minHeight:'600',
        bgColor:'#2d1b69',textColor:'#ffffff',bgImage:'',
      }},
      { type:'features', props:{
        heading:'Full-Service Creative',
        subheading:'From concept to launch, we own every pixel and every strategy.',
        feat1Icon:'🧠',feat1Title:'Brand Strategy',feat1Desc:'Identity systems and positioning that carve out real market territory.',
        feat2Icon:'✏️',feat2Title:'Visual Design',feat2Desc:'Award-winning design that converts visitors into loyal customers.',
        feat3Icon:'📱',feat3Title:'Digital Campaigns',feat3Desc:'Paid, organic, and social campaigns that deliver measurable growth.',
        bgColor:'#faf5ff',textColor:'#1e0040',accentColor:'#7c3aed',
      }},
      { type:'testimonial', props:{
        quote:'They completely reinvented our brand. Our conversion rate doubled within 90 days of launch.',
        author:'Mia Chen',role:'Founder, Luminary Cosmetics',
        avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
        rating:'5',bgColor:'#2d1b69',textColor:'#ffffff',accentColor:'#c4b5fd',
      }},
      { type:'contact', props:{
        heading:"Let's Create Something Iconic",
        subheading:"Tell us about your project. We'll get back within 24 hours.",
        email:'hello@agency.io',phone:'+1 (310) 555-0077',address:'Studio 12, Creative District, Los Angeles',
        showMap:'false',bgColor:'#ffffff',textColor:'#1e0040',accentColor:'#7c3aed',
      }},
      { type:'footer', props:{
        brand:'Arcane Studio',tagline:'Where bold ideas become reality.',
        copyright:'© 2024 Arcane Studio.',
        link1Label:'Work',link1Href:'#',link2Label:'About',link2Href:'#',link3Label:'Contact',link3Href:'#',
        bgColor:'#1a0938',textColor:'#a78bfa',
      }},
    ],
  },

  /* ── LANDING ───────────────────────────────────────────────── */
  {
    id: 'landing-saas',
    name: 'SaaS Product',
    category: 'Landing',
    industry: 'Software',
    thumb: '🚀',
    thumbBg: 'linear-gradient(135deg,#065f46,#059669)',
    desc: 'High-converting SaaS landing page with social proof and pricing.',
    sections: [
      { type:'hero', props:{
        headline:'Ship Faster. Break Less. Sleep Better.',
        subheadline:'The all-in-one DevOps platform for modern engineering teams. Auto-scaling, zero-downtime deploys, and AI-powered incident detection.',
        ctaText:'Start Free — No Credit Card',ctaLink:'#signup',
        ctaSecText:'Watch 2-min Demo',ctaSecLink:'#demo',
        align:'center',minHeight:'540',
        bgColor:'#022c22',textColor:'#ffffff',bgImage:'',
      }},
      { type:'features', props:{
        heading:'Built for Teams That Move Fast',
        subheading:'Stop fighting your tools. Start shipping.',
        feat1Icon:'🤖',feat1Title:'AI Incident Detection',feat1Desc:'Catch production issues before your users do. Avg. resolution time: 4 minutes.',
        feat2Icon:'🔄',feat2Title:'Zero-Downtime Deploy',feat2Desc:'Blue-green deployments with instant rollback. Ship with confidence.',
        feat3Icon:'📈',feat3Title:'Auto-Scale',feat3Desc:'Elastic infrastructure that grows with your traffic — automatically.',
        bgColor:'#f0fdf4',textColor:'#052e16',accentColor:'#059669',
      }},
      { type:'testimonial', props:{
        quote:"We went from 6-hour deploy cycles to 12 minutes. Our engineers are finally happy. That's priceless.",
        author:'Alex Torres',role:'VP Engineering, ScaleUp',
        avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
        rating:'5',bgColor:'#022c22',textColor:'#ffffff',accentColor:'#34d399',
      }},
      { type:'about', props:{
        heading:'Trusted by 4,000+ Engineering Teams',
        subheading:'The Numbers',
        body:'From early-stage startups to Series C companies, engineering teams choose our platform for its reliability, speed, and the peace of mind that comes with 99.99% uptime SLA.',
        highlight:'4,000+ teams · 12M+ deploys/month · 99.99% uptime SLA · SOC 2 certified',
        image:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
        imagePos:'left',bgColor:'#ffffff',textColor:'#052e16',accentColor:'#059669',
      }},
      { type:'pricing', props:{
        heading:'Simple Pricing, Serious Results',
        subheading:'Start free. Scale when you\'re ready.',
        t1Name:'Starter',t1Desc:'For small teams and side projects.',t1PriceMonthly:'0',t1PriceAnnual:'0',t1Cta:'Get Started Free',t1CtaLink:'#',t1f1:'5 services',t1f2:'100 deploys/month',t1f3:'Community support',t1f4:'',t1f5:'',t1f6:'',t1featured:'false',
        t2Name:'Pro',t2Desc:'For growing engineering teams.',t2PriceMonthly:'49',t2PriceAnnual:'39',t2Cta:'Start Free Trial',t2CtaLink:'#',t2f1:'Unlimited services',t2f2:'Unlimited deploys',t2f3:'AI incident detection',t2f4:'Priority support',t2f5:'Custom domains',t2f6:'Team dashboard',t2featured:'true',
        t3Name:'Enterprise',t3Desc:'For orgs that need SLA guarantees.',t3PriceMonthly:'199',t3PriceAnnual:'159',t3Cta:'Contact Sales',t3CtaLink:'#',t3f1:'Everything in Pro',t3f2:'Dedicated infra',t3f3:'99.99% SLA',t3f4:'SSO / SAML',t3f5:'Audit logs',t3f6:'Dedicated engineer',t3featured:'false',
        bgColor:'#f0fdf4',textColor:'#052e16',accentColor:'#059669',
        annualDiscount:'Save 20%',toggleMonthly:'Monthly',toggleAnnual:'Annual',
      }},
      { type:'faq', props:{
        heading:'Got Questions?',
        subheading:'Everything you need to know about DeployHQ.',
        q1:'How does the free trial work?',a1:'14 days, full Pro access, no credit card required. At the end of the trial you can upgrade or move to our free Starter tier.',
        q2:'What cloud providers do you support?',a2:'We support AWS, GCP, Azure, DigitalOcean, Linode, and any server with SSH access. Kubernetes clusters are supported on all major providers.',
        q3:'How fast is a typical deploy?',a3:'Average deploy time is 90 seconds for containerised services. Zero-downtime blue-green deploys add ~30 seconds for the cutover.',
        q4:'Is my code stored on your servers?',a4:'No. We connect directly to your Git provider (GitHub, GitLab, Bitbucket) via OAuth. Your code never passes through our infrastructure.',
        q5:'Do you offer an on-premise version?',a5:'Yes — our Enterprise tier includes a fully self-hosted option. Contact our sales team to discuss your requirements.',
        q6:'What\'s your uptime SLA?',a6:'We guarantee 99.9% uptime on Pro plans and 99.99% on Enterprise, with financial credits if we fall short.',
        bgColor:'#ffffff',textColor:'#052e16',accentColor:'#059669',
      }},
      { type:'contact', props:{
        heading:'Start Your Free Trial',
        subheading:'14 days free. Full access. Cancel anytime. Setup takes under 5 minutes.',
        email:'team@deployhq.io',phone:'',address:'',
        showMap:'false',bgColor:'#f0fdf4',textColor:'#052e16',accentColor:'#059669',
      }},
      { type:'footer', props:{
        brand:'DeployHQ',tagline:'Ship software, not stress.',
        copyright:'© 2024 DeployHQ, Inc.',
        link1Label:'Docs',link1Href:'#',link2Label:'Status',link2Href:'#',link3Label:'Blog',link3Href:'#',
        bgColor:'#011812',textColor:'#6ee7b7',
      }},
    ],
  },

  {
    id: 'landing-app',
    name: 'Mobile App',
    category: 'Landing',
    industry: 'App',
    thumb: '📱',
    thumbBg: 'linear-gradient(135deg,#7c2d12,#ea580c)',
    desc: 'App launch page with download CTAs and feature showcases.',
    sections: [
      { type:'hero', props:{
        headline:'Your Finances. Finally Under Control.',
        subheadline:'Vault tracks every dollar, forecasts your future, and tells you exactly where to cut back. Free for iOS and Android.',
        ctaText:'Download for iOS',ctaLink:'#',
        ctaSecText:'Get it on Android',ctaSecLink:'#',
        align:'center',minHeight:'560',
        bgColor:'#431407',textColor:'#ffffff',bgImage:'',
      }},
      { type:'features', props:{
        heading:'Everything in One App',
        subheading:'Stop juggling spreadsheets and bank statements.',
        feat1Icon:'💳',feat1Title:'All Accounts, One View',feat1Desc:'Connect 10,000+ banks and see your complete net worth instantly.',
        feat2Icon:'🔮',feat2Title:'AI Forecasting',feat2Desc:'Know your cash flow 90 days out. No surprises, ever again.',
        feat3Icon:'🔔',feat3Title:'Smart Alerts',feat3Desc:'Get notified before you overspend — not after. Customisable budgets.',
        bgColor:'#fff7ed',textColor:'#431407',accentColor:'#ea580c',
      }},
      { type:'testimonial', props:{
        quote:'Vault saved me $400/month I didn\'t even know I was wasting. Absolute game-changer.',
        author:'Priya Sharma',role:'Marketing Manager, London',
        avatar:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
        rating:'5',bgColor:'#431407',textColor:'#ffffff',accentColor:'#fb923c',
      }},
      { type:'contact', props:{
        heading:'Get Early Access',
        subheading:'Join 50,000 people on the waitlist. We\'re rolling out invites weekly.',
        email:'hello@vaultapp.io',phone:'',address:'',
        showMap:'false',bgColor:'#fff7ed',textColor:'#431407',accentColor:'#ea580c',
      }},
      { type:'footer', props:{
        brand:'Vault',tagline:'Smarter money, simpler life.',
        copyright:'© 2024 Vault Financial, Inc.',
        link1Label:'Privacy',link1Href:'#',link2Label:'Terms',link2Href:'#',link3Label:'Support',link3Href:'#',
        bgColor:'#1c0a02',textColor:'#fed7aa',
      }},
    ],
  },

  /* ── MARKETPLACE ──────────────────────────────────────────── */
  {
    id: 'marketplace-ecom',
    name: 'E-Commerce Store',
    category: 'Marketplace',
    industry: 'Retail',
    thumb: '🛍',
    thumbBg: 'linear-gradient(135deg,#831843,#db2777)',
    desc: 'Stylish product-first layout for online stores and DTC brands.',
    sections: [
      { type:'hero', props:{
        headline:'Handcrafted With Love. Delivered to You.',
        subheadline:'Artisan goods sourced from independent makers around the world. Every purchase supports a small business.',
        ctaText:'Shop New Arrivals',ctaLink:'#shop',
        ctaSecText:'Our Story',ctaSecLink:'#about',
        align:'center',minHeight:'520',
        bgColor:'#500724',textColor:'#ffffff',bgImage:'',
      }},
      { type:'features', props:{
        heading:'Why Shop With Us',
        subheading:'More than a store — a community of makers and conscious consumers.',
        feat1Icon:'🌿',feat1Title:'Sustainably Sourced',feat1Desc:'100% of our makers follow ethical and eco-friendly production practices.',
        feat2Icon:'🚚',feat2Title:'Free Shipping',feat2Desc:'Free shipping on all orders over $50. Fast 2–3 day delivery worldwide.',
        feat3Icon:'↩',feat3Title:'Easy Returns',feat3Desc:'Not in love? Free returns within 30 days, no questions asked.',
        bgColor:'#fff1f2',textColor:'#4c0519',accentColor:'#db2777',
      }},
      { type:'about', props:{
        heading:'Meet the Makers Behind the Magic',
        subheading:'Our Community',
        body:'We partner with over 2,000 independent artisans across 60 countries. Each product is made by hand, with love and intention. When you buy from us, you\'re directly supporting the maker who crafted it.',
        highlight:'2,000+ independent makers · 60 countries · Carbon-neutral shipping',
        image:'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
        imagePos:'right',bgColor:'#ffffff',textColor:'#4c0519',accentColor:'#db2777',
      }},
      { type:'gallery', props:{
        heading:'Featured Pieces',
        subheading:'Hand-selected by our curatorial team this season.',
        layout:'masonry',cols:'3',
        img1:'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',cap1:'Ceramic Collection',
        img2:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',cap2:'Textile Studio',
        img3:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',cap3:'Glass Works',
        img4:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',cap4:'Woodcraft',
        img5:'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',cap5:'Jewellery',
        img6:'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',cap6:'Paper Art',
        bgColor:'#ffffff',textColor:'#4c0519',accentColor:'#db2777',
      }},
      { type:'faq', props:{
        heading:'Common Questions',
        subheading:'Need help? We\'re here for you.',
        q1:'How long does shipping take?',a1:'Standard shipping is 3–5 business days. Express 1–2 day shipping is available at checkout. International orders typically arrive within 7–14 days.',
        q2:'What is your return policy?',a2:'We accept returns within 30 days of delivery. Items must be unused and in original packaging. Return shipping is free on all orders.',
        q3:'Are all products handmade?',a3:'Yes — every product is handcrafted by its maker. We do not sell mass-produced goods. Each item may have slight natural variations, which is part of its beauty.',
        q4:'How do I track my order?',a4:'Once shipped, you\'ll receive an email with a tracking number. You can also track your order from your account dashboard.',
        q5:'Can I buy as a gift?',a5:'Absolutely! At checkout, select "This is a gift" and we\'ll include a handwritten card. Gift wrapping is available for $5.',
        q6:'Do you offer wholesale?',a6:'Yes, we work with select retailers. Please contact our wholesale team at wholesale@artisanmarket.com for our catalogue and terms.',
        bgColor:'#fff1f2',textColor:'#4c0519',accentColor:'#db2777',
      }},
      { type:'testimonial', props:{
        quote:'The quality blew me away. And knowing my money goes directly to an artist made it even better.',
        author:'Sophie Laurent',role:'Loyal customer since 2021',
        avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
        rating:'5',bgColor:'#500724',textColor:'#ffffff',accentColor:'#f9a8d4',
      }},
      { type:'contact', props:{
        heading:'Customer Love',
        subheading:'Questions about an order? Our team responds within 2 hours.',
        email:'hello@artisanmarket.com',phone:'+1 (888) 555-0199',address:'',
        showMap:'false',bgColor:'#fff1f2',textColor:'#4c0519',accentColor:'#db2777',
      }},
      { type:'footer', props:{
        brand:'Artisan Market',tagline:'Handcrafted goods, worldwide delivery.',
        copyright:'© 2024 Artisan Market Co.',
        link1Label:'Shop',link1Href:'#',link2Label:'Makers',link2Href:'#',link3Label:'Blog',link3Href:'#',
        bgColor:'#2d0415',textColor:'#fda4af',
      }},
    ],
  },

  {
    id: 'marketplace-freelance',
    name: 'Freelancer Portfolio',
    category: 'Marketplace',
    industry: 'Freelance',
    thumb: '💼',
    thumbBg: 'linear-gradient(135deg,#0c4a6e,#0284c7)',
    desc: 'Clean portfolio + hire-me page for freelancers and consultants.',
    sections: [
      { type:'hero', props:{
        headline:"Hi, I'm Jordan — UX Designer & Strategist",
        subheadline:'I design digital products that are intuitive, accessible, and beautiful. Available for freelance projects from March 2024.',
        ctaText:"Let's Work Together",ctaLink:'#contact',
        ctaSecText:'View My Work',ctaSecLink:'#work',
        align:'left',minHeight:'520',
        bgColor:'#082f49',textColor:'#ffffff',bgImage:'',
      }},
      { type:'features', props:{
        heading:'What I Do Best',
        subheading:'A decade of craft across product, brand, and digital experience.',
        feat1Icon:'🖋',feat1Title:'UX Research',feat1Desc:'User interviews, usability testing, and journey mapping to find what really matters.',
        feat2Icon:'🎨',feat2Title:'UI Design',feat2Desc:'Pixel-perfect interfaces in Figma. Design systems that scale with your product.',
        feat3Icon:'⚙️',feat3Title:'Prototyping',feat3Desc:'Interactive, high-fidelity prototypes that communicate exactly how it will feel.',
        bgColor:'#f0f9ff',textColor:'#0c4a6e',accentColor:'#0284c7',
      }},
      { type:'about', props:{
        heading:'10 Years, 80+ Projects, 0 Missed Deadlines',
        subheading:'About Me',
        body:'I\'ve worked with startups, agencies, and Fortune 500s to ship products used by millions. My process is research-led, collaboration-first, and detail-obsessed. I work best with founders and product teams who care deeply about their users.',
        highlight:'80+ shipped projects · Previously: Google, Spotify, Airbnb · Currently: open to new clients',
        image:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
        imagePos:'left',bgColor:'#ffffff',textColor:'#0c4a6e',accentColor:'#0284c7',
      }},
      { type:'testimonial', props:{
        quote:'Jordan redesigned our onboarding flow and our activation rate went from 22% to 61%. Extraordinary work.',
        author:'Chris Park',role:'CPO, Relay App',
        avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
        rating:'5',bgColor:'#082f49',textColor:'#ffffff',accentColor:'#38bdf8',
      }},
      { type:'contact', props:{
        heading:"Let's Build Something Together",
        subheading:'Currently booking projects from Q2 2024. Drop me a message and I\'ll reply within 24 hours.',
        email:'jordan@design.studio',phone:'',address:'Remote — based in Amsterdam 🇳🇱',
        showMap:'false',bgColor:'#f0f9ff',textColor:'#0c4a6e',accentColor:'#0284c7',
      }},
      { type:'footer', props:{
        brand:'Jordan Lee Design',tagline:'Design with purpose.',
        copyright:'© 2024 Jordan Lee. All rights reserved.',
        link1Label:'Work',link1Href:'#',link2Label:'Process',link2Href:'#',link3Label:'Hire Me',link3Href:'#',
        bgColor:'#041724',textColor:'#7dd3fc',
      }},
    ],
  },

  {
    id: 'marketplace-service',
    name: 'Service Marketplace',
    category: 'Marketplace',
    industry: 'Platform',
    thumb: '🔗',
    thumbBg: 'linear-gradient(135deg,#1e3a8a,#6366f1)',
    desc: 'Two-sided marketplace page for connecting buyers and providers.',
    sections: [
      { type:'hero', props:{
        headline:'Find Expert Talent in Minutes, Not Months',
        subheadline:'Skilora connects you with vetted professionals across 200+ skill categories. Post a job for free. Get proposals in 24 hours.',
        ctaText:'Post a Job Free',ctaLink:'#post',
        ctaSecText:'Browse Talent',ctaSecLink:'#browse',
        align:'center',minHeight:'540',
        bgColor:'#0f172a',textColor:'#ffffff',bgImage:'',
      }},
      { type:'features', props:{
        heading:'Why 50,000+ Businesses Use Skilora',
        subheading:'The smarter way to hire — and get hired.',
        feat1Icon:'✅',feat1Title:'Vetted Professionals',feat1Desc:'Every freelancer passes skill tests and identity verification before joining.',
        feat2Icon:'💰',feat2Title:'Pay Only for Results',feat2Desc:'Milestone-based payments held in escrow. Release when you\'re satisfied.',
        feat3Icon:'🛡',feat3Title:'100% Money-Back',feat3Desc:'If you\'re not happy with the work, we\'ll refund your full payment.',
        bgColor:'#f8fafc',textColor:'#0f172a',accentColor:'#6366f1',
      }},
      { type:'about', props:{
        heading:'The Platform Built for Both Sides',
        subheading:'For Clients & Freelancers',
        body:'Skilora was built because the old way of hiring freelancers was broken. Too slow, too opaque, too risky. We rebuilt it from scratch — with instant matching, escrow protection, and a reputation system that actually works.',
        highlight:'50,000+ active projects · $220M+ paid to freelancers · 4.9★ average rating',
        image:'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
        imagePos:'right',bgColor:'#ffffff',textColor:'#0f172a',accentColor:'#6366f1',
      }},
      { type:'testimonial', props:{
        quote:'I found a world-class developer in 6 hours. We shipped the entire MVP in 3 weeks. This platform is magic.',
        author:'Rachel Wong',role:'Co-founder, Launchfast',
        avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
        rating:'5',bgColor:'#0f172a',textColor:'#ffffff',accentColor:'#818cf8',
      }},
      { type:'contact', props:{
        heading:'Start Hiring or Get Hired Today',
        subheading:'It\'s free to post a job or create a freelancer profile. Join 200,000+ users.',
        email:'support@skilora.com',phone:'+1 (800) 555-0123',address:'',
        showMap:'false',bgColor:'#f0f4ff',textColor:'#0f172a',accentColor:'#6366f1',
      }},
      { type:'footer', props:{
        brand:'Skilora',tagline:'Where great work gets done.',
        copyright:'© 2024 Skilora, Inc.',
        link1Label:'How it Works',link1Href:'#',link2Label:'Enterprise',link2Href:'#',link3Label:'Blog',link3Href:'#',
        bgColor:'#050d1a',textColor:'#818cf8',
      }},
    ],
  },
]

// ── Templates state ───────────────────────────────────────────────────────────
const TPL = { selected: null }

// ── Group templates by category ───────────────────────────────────────────────
function groupByCategory() {
  return TEMPLATES.reduce((acc, t) => {
    ;(acc[t.category] = acc[t.category] || []).push(t)
    return acc
  }, {})
}

// ── Generate preview HTML for a template ─────────────────────────────────────
function templatePreviewHTML(tpl) {
  const fakeSections = tpl.sections
    .filter(s => DEFS[s.type] && R[s.type])  // skip unknown types
    .map((s, i) => ({
      id: 'prev_' + i,
      type: s.type,
      props: { ...DEFS[s.type].props, ...s.props },
    }))

  const body = fakeSections.map(s => {
    try {
      let html = R[s.type](s.props, s.id)
      // Strip builder-only attributes and inline scripts (3D scenes) from preview
      html = html
        .replace(/\s+contenteditable="true"/g, '')
        .replace(/\s+data-id="[^"]*"/g, '')
        .replace(/\s+data-key="[^"]*"/g, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<div class="img-overlay"[\s\S]*?<\/div>/g, '')
        .replace(/onclick="openModal\([^)]*\)"/g, '')
      return html
    } catch { return '' }
  }).join('\n')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{text-decoration:none}
[contenteditable]{pointer-events:none}
.img-editable .img-overlay{display:none}
canvas{background:#030712}
</style></head><body>${body}</body></html>`
}

// ── Open / close ──────────────────────────────────────────────────────────────
function openTemplates() {
  document.getElementById('tpl-modal').classList.remove('hidden')
  buildTemplateList()
  // Auto-select first template
  if (TEMPLATES.length) selectTemplate(TEMPLATES[0].id)
}

function closeTemplates() {
  document.getElementById('tpl-modal').classList.add('hidden')
  TPL.selected = null
}

// ── Build sidebar list ────────────────────────────────────────────────────────
function buildTemplateList() {
  const sidebar = document.getElementById('tpl-sidebar')
  const groups  = groupByCategory()

  sidebar.innerHTML = Object.entries(groups).map(([cat, items]) => `
    <div class="tpl-cat-label">${cat}</div>
    ${items.map(t => `
      <div class="tpl-item" id="tpl-item-${t.id}" onclick="selectTemplate('${t.id}')">
        <div class="tpl-item-thumb" style="background:${t.thumbBg}">${t.thumb}</div>
        <div class="tpl-item-info">
          <div class="tpl-item-name">${t.name}</div>
          <div class="tpl-item-secs">${t.sections.length} sections</div>
        </div>
      </div>`).join('')}
  `).join('')

  // ── Stage 8: Append community / user-saved templates ─────────────────────
  if (typeof TemplateMarket === 'undefined') return
  const community = TemplateMarket.getCommunityTemplates()
  if (!community.length) return
  // Inject into TEMPLATES array so selectTemplate() can find them
  community.forEach(t => { if (!TEMPLATES.find(x => x.id === t.id)) TEMPLATES.push(t) })
  // Render section in sidebar
  const html = `<div class="tpl-cat-label">⭐ My Templates</div>` +
    community.map(t => `
      <div class="tpl-item" id="tpl-item-${t.id}" onclick="selectTemplate('${t.id}')">
        <div class="tpl-item-thumb" style="background:${t.thumbBg||'linear-gradient(135deg,#6c63ff,#a78bfa)'}">${t.thumb||'🌟'}</div>
        <div class="tpl-item-info">
          <div class="tpl-item-name">${t.name}</div>
          <div class="tpl-item-secs">${t.sections.length} sections · Custom</div>
        </div>
        <button onclick="event.stopPropagation();TemplateMarket.deleteTemplate('${t.id}');TEMPLATES.splice(TEMPLATES.findIndex(x=>x.id==='${t.id}'),1);buildTemplateList()"
          style="background:none;border:none;color:var(--muted);cursor:pointer;padding:2px 6px;font-size:13px;flex-shrink:0" title="Delete">✕</button>
      </div>`).join('')
  sidebar.insertAdjacentHTML('beforeend', html)
}

// ── Select a template ─────────────────────────────────────────────────────────
function selectTemplate(id) {
  const tpl = TEMPLATES.find(t => t.id === id)
  if (!tpl) return
  TPL.selected = id

  // Update sidebar active state
  document.querySelectorAll('.tpl-item').forEach(el =>
    el.classList.toggle('active', el.id === 'tpl-item-' + id)
  )

  // Update header
  const nameEl = document.getElementById('tpl-preview-name')
  const metaEl = document.getElementById('tpl-preview-meta')
  if (nameEl) nameEl.textContent = tpl.name
  if (metaEl) metaEl.innerHTML = `
    <span class="tpl-tag industry">${tpl.industry}</span>
    <span class="tpl-tag sections">${tpl.sections.length} sections</span>`

  // Sections strip — guard against unknown types
  const stripEl = document.getElementById('tpl-sections-strip')
  if (stripEl) {
    stripEl.innerHTML = tpl.sections.map(s => {
      const def = DEFS[s.type]
      if (!def) return ''   // ← null guard: skip unknown types
      return `<div class="tpl-section-chip"><span>${def.icon}</span>${def.label}</div>`
    }).join('')
  }

  // Update iframe preview
  const frame = document.getElementById('tpl-iframe')
  if (frame) frame.srcdoc = templatePreviewHTML(tpl)

  // Update footer
  const footerEl = document.getElementById('tpl-footer-info')
  if (footerEl) footerEl.innerHTML = `<strong>${tpl.name}</strong> — ${tpl.desc}`

  // Enable load button — this is the critical one
  const btn = document.getElementById('tpl-load-btn')
  if (btn) btn.disabled = false
}

// ── Load the selected template into the canvas ────────────────────────────────
function loadSelectedTemplate() {
  const tpl = TEMPLATES.find(t => t.id === TPL.selected)
  if (!tpl) { toast('No template selected','⚠️'); return }

  // Confirm if canvas already has content
  if (S.sections.length > 0) {
    const ok = confirm(`Replace current page with the "${tpl.name}" template?\nThis will clear ${S.sections.length} existing section(s).`)
    if (!ok) return
  }

  pushH('Load template: ' + tpl.name)

  // Build new sections — skip any type not in DEFS
  const newSections = tpl.sections
    .filter(s => DEFS[s.type] && R[s.type])  // guard unknown types
    .map(s => ({
      id:   uid(),
      type: s.type,
      props: { ...DEFS[s.type].props, ...s.props },
    }))

  if (!newSections.length) { toast('Template has no valid sections','⚠️'); return }

  // Update state directly via the store (bypasses Proxy setter for atomic update)
  editorStore.setState({
    sections: newSections,
    selected: null,
    isDirty:  true,
  }, 'load-template')

  // Update page title
  const titleEl = document.getElementById('page-title')
  if (titleEl) titleEl.value = tpl.name

  closeTemplates()
  renderAll()

  // Staggered drop-in animation
  setTimeout(() => {
    document.querySelectorAll('.section-wrapper').forEach((el, i) => {
      el.style.animationDelay = (i * 80) + 'ms'
      el.classList.add('section-drop-in')
      el.addEventListener('animationend', () => {
        el.classList.remove('section-drop-in')
        el.style.animationDelay = ''
      }, { once: true })
    })
  }, 60)

  toast(`"${tpl.name}" loaded — ${newSections.length} sections`, '📐')
}

/* ══════════════════════════════════════════════════════
   TOAST + KEYBOARD
══════════════════════════════════════════════════════ */
let tT=null
function toast(msg,icon='✦'){const el=document.getElementById('toast');el.innerHTML=`<span>${icon}</span>${msg}`;el.classList.add('show');clearTimeout(tT);tT=setTimeout(()=>el.classList.remove('show'),2800)}

document.addEventListener('keydown',ev=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable)return
  if(ev.key==='Escape'){
    if(!document.getElementById('tpl-modal').classList.contains('hidden')){closeTemplates();return}
    S.selected=null;renderCanvas();renderLayers();renderPanel()
  }
  if((ev.ctrlKey||ev.metaKey)&&ev.key==='z'){ev.preventDefault();undo()}
  if((ev.ctrlKey||ev.metaKey)&&(ev.key==='y'||(ev.shiftKey&&ev.key==='z'))){ev.preventDefault();redo()}
  if((ev.ctrlKey||ev.metaKey)&&ev.key==='d'&&S.selected){ev.preventDefault();dupSection(S.selected)}
  if((ev.key==='Delete'||ev.key==='Backspace')&&S.selected)removeSection(S.selected)
})

// Close templates modal when clicking backdrop
document.getElementById('tpl-modal').addEventListener('click', function(ev) {
  if (ev.target === this) closeTemplates()
})
