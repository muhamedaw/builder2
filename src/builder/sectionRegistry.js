'use strict'
/**
 * PageCraft — Section Registry
 * Stage 2: Builder Engine — external section plugin API
 *
 * Allows plugins/extensions to register custom section types.
 * Works alongside the built-in DEFS/R/ES/SS/COMPONENT_TYPES in builder.html.
 *
 * Usage (in a plugin or custom script):
 *
 *   const registry = window.PageCraft?.sectionRegistry
 *   if (registry) {
 *     registry.register({
 *       type       : 'my-cta',
 *       label      : 'CTA Banner',
 *       icon       : '🎯',
 *       color      : '#6c63ff22',
 *       desc       : 'High-conversion call-to-action banner',
 *       category   : 'component',          // 'block' | 'component'
 *       defaultProps: {
 *         heading    : 'Ready to get started?',
 *         btnText    : 'Start Free Trial',
 *         bgColor    : '#6c63ff',
 *         textColor  : '#ffffff',
 *       },
 *       render(props, id) {                // returns HTML string
 *         return `<div style="background:${props.bgColor};color:${props.textColor};padding:60px;text-align:center">
 *           <h2>${props.heading}</h2>
 *           <button>${props.btnText}</button>
 *         </div>`
 *       },
 *       editSchema: [                      // optional edit panel schema
 *         { g: 'Content', f: [
 *           { k: 'heading', l: 'Heading', t: 'text' },
 *           { k: 'btnText', l: 'Button Text', t: 'text' },
 *         ]},
 *       ],
 *       styleSchema: [                     // optional style panel schema
 *         { k: 'bgColor',   l: 'Background', t: 'color' },
 *         { k: 'textColor', l: 'Text',       t: 'color' },
 *       ],
 *     })
 *   }
 */

const SectionRegistry = (() => {
  const _sections = new Map()   // type → registration

  /**
   * register(definition) — register a new section type.
   * Called by plugins before builder.html has fully loaded.
   * builder.html picks up registered sections on init.
   */
  function register(def) {
    if (!def || !def.type || typeof def.render !== 'function') {
      console.error('[SectionRegistry] Invalid definition — requires type + render()', def)
      return false
    }
    if (_sections.has(def.type)) {
      console.warn(`[SectionRegistry] Overwriting existing section type: ${def.type}`)
    }

    _sections.set(def.type, {
      type        : def.type,
      label       : def.label       || def.type,
      icon        : def.icon        || '🧩',
      color       : def.color       || 'rgba(108,99,255,.15)',
      desc        : def.desc        || '',
      category    : def.category    || 'component',  // 'block' | 'component'
      defaultProps: def.defaultProps || {},
      render      : def.render,
      editSchema  : def.editSchema  || [],
      styleSchema : def.styleSchema || [],
    })

    // If builder is already initialized, inject into live registry
    _inject(def.type)
    return true
  }

  /**
   * _inject(type) — push into builder.html's runtime registries if available.
   * Safe to call before or after builder init.
   */
  function _inject(type) {
    const reg = _sections.get(type)
    if (!reg) return

    // Access builder globals (set by builder.html on init)
    const w = typeof window !== 'undefined' ? window : {}
    if (!w.DEFS || !w.R || !w.ES || !w.SS) return  // builder not ready yet

    // Register in DEFS
    w.DEFS[type] = {
      label: reg.label,
      icon : reg.icon,
      color: reg.color,
      desc : reg.desc,
      props: { ...reg.defaultProps },
    }

    // Register renderer
    w.R[type] = reg.render

    // Register edit schema
    if (reg.editSchema.length) w.ES[type] = reg.editSchema

    // Register style schema
    if (reg.styleSchema.length) w.SS[type] = reg.styleSchema

    // Add to the correct type set
    if (reg.category === 'block') {
      w.BASE_TYPES?.add(type)
    } else {
      w.COMPONENT_TYPES?.add(type)
    }

    // Re-render sidebar blocks if builder is live
    if (typeof w.renderBlocks === 'function') w.renderBlocks()
  }

  /**
   * injectAll() — called by builder.html after it initializes its registries.
   * Flushes all pending registrations.
   */
  function injectAll() {
    _sections.forEach((_, type) => _inject(type))
  }

  /** unregister(type) — remove a section type. */
  function unregister(type) {
    _sections.delete(type)
    const w = typeof window !== 'undefined' ? window : {}
    if (w.DEFS) delete w.DEFS[type]
    if (w.R)    delete w.R[type]
    if (w.ES)   delete w.ES[type]
    if (w.SS)   delete w.SS[type]
    w.BASE_TYPES?.delete(type)
    w.COMPONENT_TYPES?.delete(type)
    if (typeof w.renderBlocks === 'function') w.renderBlocks()
  }

  /** list() — get all registered custom section types. */
  function list() { return Array.from(_sections.values()) }

  /** has(type) — check if a type is registered. */
  function has(type) { return _sections.has(type) }

  return { register, unregister, injectAll, list, has }
})()

// Expose globally and on window.PageCraft namespace
if (typeof window !== 'undefined') {
  window.PageCraft = window.PageCraft || {}
  window.PageCraft.sectionRegistry = SectionRegistry
}

if (typeof module !== 'undefined') module.exports = SectionRegistry
