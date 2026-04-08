/* design-system.js Phase 4/5 */

/* DESIGN SYSTEM — JavaScript Mirror
   ──────────────────────────────────────────────────
   Mirrors CSS tokens as a JS object so plugins,
   section renderers, and canvas logic can access
   them without parsing stylesheets.
   Usage:  DesignSystem.color.primary[600]
           DesignSystem.spacing[4]   // → '16px'
           DesignSystem.text.xl      // → '18px'
══════════════════════════════════════════════════════ */

const DesignSystem = Object.freeze({

  // ── Colors ──────────────────────────────────────
  color: Object.freeze({
    primary: Object.freeze({
      50:'#f5f3ff', 100:'#ede9fe', 200:'#ddd6fe', 300:'#c4b5fd',
      400:'#a78bfa', 500:'#8b5cf6', 600:'#6c63ff', 700:'#5a52e0',
      800:'#4338ca', 900:'#3730a3',
    }),
    gray: Object.freeze({
      0:'#ffffff', 50:'#f8fafc', 100:'#f1f5f9', 200:'#e2e8f0',
      300:'#cbd5e1', 400:'#94a3b8', 500:'#64748b', 600:'#475569',
      700:'#334155', 800:'#1e293b', 900:'#0f172a', 950:'#0d0d0f',
    }),
    semantic: Object.freeze({
      success:'#34d399',  successBg:'rgba(52,211,153,0.10)',
      danger :'#f87171',  dangerBg :'rgba(248,113,113,0.10)',
      warning:'#fbbf24',  warningBg:'rgba(251,191,36,0.10)',
      info   :'#38bdf8',  infoBg   :'rgba(56,189,248,0.10)',
    }),
    // Editor UI aliases
    ui: Object.freeze({
      bg:'#0d0d0f', surface:'#17171a', surface2:'#1f1f24', surface3:'#28282e',
      text:'#e8e8ed', text2:'#a0a0b0', muted:'#5e5e70',
      accent:'#6c63ff', accentH:'#5a52e0', accent2:'#a78bfa',
    }),
  }),

  // ── Typography ───────────────────────────────────
  font: Object.freeze({
    sans   :"'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono   :"'JetBrains Mono', 'Fira Code', monospace",
    display:"'Inter', system-ui, sans-serif",
  }),

  text: Object.freeze({
    '2xs':'10px', xs:'11px', sm:'12px', base:'13px', md:'14px',
    lg:'16px', xl:'18px', '2xl':'22px', '3xl':'28px',
    '4xl':'36px', '5xl':'48px', '6xl':'64px',
  }),

  fontWeight: Object.freeze({
    light:300, regular:400, medium:500,
    semibold:600, bold:700, extrabold:800, black:900,
  }),

  lineHeight: Object.freeze({
    none:1, tight:1.25, snug:1.375,
    normal:1.5, relaxed:1.625, loose:2,
  }),

  // ── Spacing (4px base) ───────────────────────────
  // spacing[N] = N × 4px  (N can be 0–32)
  spacing: new Proxy({}, {
    get(_, k) {
      const n = Number(k)
      if (k === 'px')  return '1px'
      if (k === '0h')  return '2px'
      return Number.isFinite(n) ? `${n * 4}px` : undefined
    },
  }),

  // Named aliases
  sp: Object.freeze({
    xs:'4px', sm:'8px', md:'16px', lg:'24px',
    xl:'32px', '2xl':'48px', '3xl':'64px',
  }),

  // ── Shadows ──────────────────────────────────────
  shadow: Object.freeze({
    xs  :'0 1px 2px rgba(0,0,0,.35)',
    sm  :'0 2px 4px rgba(0,0,0,.40)',
    md  :'0 4px 12px rgba(0,0,0,.45)',
    lg  :'0 8px 24px rgba(0,0,0,.50)',
    xl  :'0 16px 40px rgba(0,0,0,.55)',
    '2xl':'0 24px 64px rgba(0,0,0,.60)',
    glow:'0 0 0 3px rgba(108,99,255,0.25)',
  }),

  // ── Border radius ─────────────────────────────────
  radius: Object.freeze({
    none:'0', xs:'3px', sm:'5px', md:'8px',
    lg:'12px', xl:'16px', '2xl':'20px', full:'9999px',
  }),

  // ── Transitions ───────────────────────────────────
  duration: Object.freeze({
    fast:'100ms', base:'150ms', slow:'250ms', slower:'400ms',
  }),

  easing: Object.freeze({
    in     :'cubic-bezier(0.4,0,1,1)',
    out    :'cubic-bezier(0,0,0.2,1)',
    inOut  :'cubic-bezier(0.4,0,0.2,1)',
    spring :'cubic-bezier(0.34,1.56,0.64,1)',
    smooth :'cubic-bezier(0.22,0.61,0.36,1)',
  }),

  // ── Z-Index ───────────────────────────────────────
  z: Object.freeze({
    hide:-1, base:0, raised:10, dropdown:100,
    sticky:200, overlay:300, modal:400, toast:500, tooltip:600,
  }),

  /**
   * Read a CSS variable from :root at runtime.
   * Useful for reading tokens in canvas/animation code.
   * @param {string} name  e.g. '--accent' or '--sp-4'
   */
  get(name) {
    return getComputedStyle(document.documentElement)
           .getPropertyValue(name).trim()
  },

  /**
   * Override a CSS token at runtime (theme switching).
   * @param {string} name   e.g. '--accent'
   * @param {string} value  e.g. '#ff6b6b'
   */
  set(name, value) {
    document.documentElement.style.setProperty(name, value)
  },

  /**
   * Apply a full theme object (multiple tokens at once).
   * @param {Record<string,string>} theme  { '--accent': '#ff6b6b', … }
   */
  applyTheme(theme) {
    for (const [k, v] of Object.entries(theme)) {
      document.documentElement.style.setProperty(k, v)
    }
  },

  /**
   * Reset all runtime overrides back to stylesheet defaults.
   */
  resetTheme() {
    document.documentElement.removeAttribute('style')
  },
})

// Expose globally so plugins and console can access it
window.PageCraft = window.PageCraft || {}
window.PageCraft.DesignSystem = DesignSystem

