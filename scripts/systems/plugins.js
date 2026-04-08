/* plugins.js Phase 4/5 */

/* PLUGIN SDK  — PageCraft Developer SDK v1
   ──────────────────────────────────────────────────
   Lets external scripts register plugins that can:
     • React to lifecycle hooks (section:add, export…)
     • Read / mutate state through a safe API surface
     • Register custom block types & sidebar panels
     • Add toolbar buttons, inject CSS, run commands
     • Load from external <script> tags

   Usage:
     window.PageCraft.registerPlugin({ id, name, version, init(sdk){} })

   Available hooks (sdk.on / sdk.off):
     builder:init          — after full builder UI is ready
     section:beforeAdd     — { type }            — can cancel via return false
     section:afterAdd      — { section, index }
     section:beforeRemove  — { id, section }     — can cancel via return false
     section:afterRemove   — { id }
     section:afterUpdate   — { id, key, value }
     export:beforeHTML     — { html }            — can mutate html string
     export:afterHTML      — { html, filename }
     export:beforeJSON     — { data }
     export:afterJSON      — { data }
     auth:login            — { user }
     auth:logout           — {}
     plugin:install        — { pluginId }
     plugin:uninstall      — { pluginId }
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

const PluginSDK = (() => {
  // ── Hook bus ────────────────────────────────────────────────────────────────
  // Map<eventName, Array<{ handler, pluginId }>>
  const _hooks = new Map()

  /**
   * Subscribe to a lifecycle hook.
   * @param {string}   event
   * @param {Function} handler  — receives payload object; return false to cancel
   * @param {string}   [pluginId] — used for cleanup and error attribution
   */
  function on(event, handler, pluginId = 'unknown') {
    if (!_hooks.has(event)) _hooks.set(event, [])
    _hooks.get(event).push({ handler, pluginId })
  }

  /**
   * Unsubscribe a specific handler (or all handlers for a pluginId).
   * @param {string}   event
   * @param {Function|string} handlerOrPluginId
   */
  function off(event, handlerOrPluginId) {
    if (!_hooks.has(event)) return
    _hooks.set(event, _hooks.get(event).filter(entry => {
      if (typeof handlerOrPluginId === 'function') return entry.handler !== handlerOrPluginId
      return entry.pluginId !== handlerOrPluginId   // remove all entries for that pluginId
    }))
  }

  /**
   * Fire a hook. Returns false if any handler cancelled the event.
   * Handlers may mutate the payload object to transform data (e.g. export:beforeHTML).
   * @param {string} event
   * @param {object} [payload]
   * @returns {boolean} false = cancelled
   */
  function _emit(event, payload = {}) {
    const entries = _hooks.get(event)
    if (!entries || !entries.length) return true
    for (const { handler, pluginId } of entries) {
      try {
        const result = handler(payload)
        if (result === false) return false          // handler cancelled the event
        if (result && typeof result === 'object') Object.assign(payload, result)
      } catch(e) {
        console.error(`[PluginSDK] Hook "${event}" threw in plugin "${pluginId}":`, e)
      }
    }
    return true
  }

  // ── Registered plugins registry ─────────────────────────────────────────────
  const _registered = new Map()   // id → plugin descriptor

  // ── Custom block registry ───────────────────────────────────────────────────
  const _customBlocks = new Map()

  // ── Custom commands ─────────────────────────────────────────────────────────
  const _commands = new Map()

  // ── Public SDK object given to each plugin's init() ─────────────────────────
  function _makeSDK(pluginId) {
    return {
      /** Subscribe to a hook */
      on(event, handler)  { on(event, handler, pluginId) },
      /** Unsubscribe from a hook */
      off(event, handler) { off(event, handler) },

      /** Read-only access to the three stores */
      store: {
        get project() { return projectStore.getState() },
        get ui()      { return uiStore.getState() },
        get auth()    { return authStore.getState() },
      },

      /** Section CRUD */
      sections: {
        getAll()               { return [...projectStore.getState().sections] },
        get(id)                { return projectStore.getState().sections.find(s => s.id === id) || null },
        add(type, idx)         { addSection(type, idx ?? null) },
        remove(id)             { removeSection(id, null) },
        update(id, key, value) {
          editorStore.produce(draft => {
            const s = draft.sections.find(s => s.id === id)
            if (s) s.props[key] = value
          }, `plugin:${pluginId}:update`)
          renderAll()
        },
      },

      /** UI helpers */
      ui: {
        toast(msg, icon = '🔌') { toast(msg, icon) },
        selectSection(id)       { selectSection(id) },
        openPanel(tab)          { S.panelTab = tab; renderPanel() },
        refresh()               { renderAll() },
      },

      /**
       * Register a custom block type visible in the sidebar.
       * def: { type, label, icon, color, desc, props, schema?, styleSchema? }
       * renderer: (props, sectionId) => HTMLString
       */
      registerBlock(def, renderer) {
        if (!def?.type || typeof renderer !== 'function') {
          console.warn(`[PluginSDK:${pluginId}] registerBlock: missing type or renderer`)
          return
        }
        _customBlocks.set(def.type, { def, renderer, pluginId })
        DEFS[def.type] = {
          label: def.label || def.type,
          icon:  def.icon  || '🧩',
          color: def.color || '#6c63ff22',
          desc:  def.desc  || '',
          props: def.props || {},
        }
        R[def.type] = renderer
        if (def.schema)      ES[def.type] = def.schema
        if (def.styleSchema) SS[def.type] = def.styleSchema
        COMPONENT_TYPES.add(def.type)
        renderBlocks()
      },

      /** Remove a previously registered block type */
      unregisterBlock(type) {
        _customBlocks.delete(type)
        delete DEFS[type]; delete R[type]; delete ES[type]; delete SS[type]
        COMPONENT_TYPES.delete(type)
        S.sections = S.sections.filter(s => s.type !== type)
        renderAll(); renderBlocks()
      },

      /**
       * Inject a <style> tag scoped to this plugin.
       * Calling again replaces the previous CSS.
       */
      addCSS(css) {
        const id = `plugin-css-${pluginId}`
        let el = document.getElementById(id)
        if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el) }
        el.textContent = css
      },
      removeCSS() { document.getElementById(`plugin-css-${pluginId}`)?.remove() },

      /**
       * Add a button to the topbar (right side).
       * Only one button per plugin is allowed.
       */
      addToolbarButton(label, title, onClick) {
        const id = `plugin-btn-${pluginId}`
        if (document.getElementById(id)) return
        const btn = Object.assign(document.createElement('button'), {
          id, className: 'btn btn-outline', textContent: label, title, onclick: onClick,
        })
        btn.style.fontSize = '11px'
        document.querySelector('.topbar-r')?.prepend(btn)
      },
      removeToolbarButton() { document.getElementById(`plugin-btn-${pluginId}`)?.remove() },

      /** Register a named command callable by other plugins or the host */
      registerCommand(id, fn) {
        if (_commands.has(id)) console.warn(`[PluginSDK] overwriting command "${id}" from plugin "${pluginId}"`)
        _commands.set(id, { fn, pluginId })
      },
      /** Run a registered command */
      runCommand(id, ...args) {
        const entry = _commands.get(id)
        if (!entry) { console.warn('[PluginSDK] unknown command:', id); return }
        try { return entry.fn(...args) } catch(e) { console.error('[PluginSDK] command error:', id, e) }
      },

      /** Metadata */
      pluginId,
    }
  }

  // ── External plugin registration ─────────────────────────────────────────────
  /**
   * Register an external plugin.
   *
   * Plugin descriptor shape:
   * {
   *   id:          string   (required, unique)
   *   name:        string
   *   version:     string   e.g. '1.0.0'
   *   description: string
   *   author:      string
   *   init(sdk):   function (required) — called immediately with the SDK object
   *   destroy():   function (optional) — called on unregister for cleanup
   * }
   */
  function registerPlugin(plugin) {
    if (!plugin?.id)             { console.error('[PluginSDK] plugin must have an id'); return }
    if (typeof plugin.init !== 'function') { console.error(`[PluginSDK] plugin "${plugin.id}" must export init(sdk)`); return }
    if (_registered.has(plugin.id)) { console.warn('[PluginSDK] plugin already registered:', plugin.id); return }

    const sdk = _makeSDK(plugin.id)
    try {
      _registered.set(plugin.id, { ...plugin, _sdk: sdk, _registeredAt: Date.now() })
      plugin.init(sdk)
      /* registration silent in production */
    } catch(e) {
      console.error(`[PluginSDK] init failed for "${plugin.id}":`, e)
      _registered.delete(plugin.id)
    }
  }

  /** Cleanly unregister a plugin (calls destroy if present, removes hooks). */
  function unregisterPlugin(id) {
    const entry = _registered.get(id)
    if (!entry) return
    try { entry.destroy?.() } catch(e) { console.error('[PluginSDK] destroy error:', id, e) }
    // Remove all hooks registered by this plugin
    for (const [event, entries] of _hooks) {
      _hooks.set(event, entries.filter(e => e.pluginId !== id))
    }
    _registered.delete(id)
      console.debug('[PluginSDK] unregistered:', id)
  }

  // ── Simple event listener for external use ──────────────────────────────────
  const _external = new Map()
  function _on(event, fn) {
    if (!_external.has(event)) _external.set(event, [])
    _external.get(event).push(fn)
  }
  // Extend _emit to also notify external listeners
  const _emitOrig = _emit
  function _emitWithExternal(event, payload = {}) {
    const result = _emitOrig(event, payload)
    const ext = _external.get(event)
    if (ext) ext.forEach(fn => { try { fn(payload) } catch(e) {} })
    return result
  }

  // ── Public surface ───────────────────────────────────────────────────────────
  return {
    registerPlugin,
    unregisterPlugin,
    _emit: _emitWithExternal,
    _on,
    get plugins()   { return [..._registered.values()] },
    get commands()  { return [..._commands.keys()] },
  }
})()

// ── Expose on window so external <script> tags can call PageCraft.registerPlugin()
window.PageCraft = window.PageCraft || {}
window.PageCraft.registerPlugin    = PluginSDK.registerPlugin.bind(PluginSDK)
window.PageCraft.unregisterPlugin  = PluginSDK.unregisterPlugin.bind(PluginSDK)

