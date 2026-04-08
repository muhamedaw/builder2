/* i18n.js Phase 4/5 */

/* INTERNATIONALIZATION (i18n) SYSTEM
   ──────────────────────────────────────────────────
   Features:
   • t(key, params?)  — translate any key
   • setLanguage(lang) — switch language dynamically
   • RTL auto-detection + dir="rtl" injection
   • Language persisted in localStorage
   • URL param support: ?lang=ar
   • Plugin-friendly: plugins can add translations
   • 4 built-in languages: en, ar, fr, es
   ██████████████████████████████████████████████████
══════════════════════════════════════════════════════ */

const I18n = (() => {
  // ── Translation strings ──────────────────────────────────────────────────
  const _strings = {

    // ── English (default) ──────────────────────────────────────────────────
    en: {
      // Topbar
      'topbar.title':       'My Page',
      'topbar.undo':        'Undo',
      'topbar.redo':        'Redo',
      'topbar.preview':     'Preview',
      'topbar.export':      'Export',
      'topbar.save':        'Save',
      'topbar.publish':     'Publish',

      // Sidebar tabs
      'sidebar.blocks':     'Blocks',
      'sidebar.layers':     'Layers',
      'sidebar.style':      'Style',
      'sidebar.history':    'History',
      'sidebar.components': 'Components',

      // Section names
      'section.hero':        'Hero',
      'section.about':       'About',
      'section.contact':     'Contact',
      'section.features':    'Features',
      'section.testimonial': 'Testimonial',
      'section.footer':      'Footer',
      'section.pricing':     'Pricing',
      'section.faq':         'FAQ',
      'section.gallery':     'Gallery',

      // Buttons / actions
      'action.add':          'Add',
      'action.remove':       'Remove',
      'action.duplicate':    'Duplicate',
      'action.moveUp':       'Move up',
      'action.moveDown':     'Move down',
      'action.edit':         'Edit',
      'action.cancel':       'Cancel',
      'action.confirm':      'Confirm',
      'action.save':         'Save',
      'action.close':        'Close',
      'action.upload':       'Upload',
      'action.download':     'Download',
      'action.import':       'Import',

      // Canvas states
      'canvas.empty':        'Drag a block here or click to add',
      'canvas.empty.hint':   'Start with a Hero section',
      'canvas.drop':         'Drop here',

      // Modes
      'mode.edit':           'Edit',
      'mode.preview':        'Preview',

      // Devices
      'device.desktop':      'Desktop',
      'device.tablet':       'Tablet',
      'device.mobile':       'Mobile',

      // Toast messages
      'toast.saved':         'Saved ✓',
      'toast.removed':       'Removed',
      'toast.duplicated':    'Duplicated',
      'toast.copied':        'Copied',
      'toast.uploaded':      'Uploaded',
      'toast.error':         'Something went wrong',
      'toast.tooFast':       'Slow down!',

      // Auth
      'auth.login':          'Sign In',
      'auth.register':       'Create Account',
      'auth.logout':         'Sign Out',
      'auth.email':          'Email',
      'auth.password':       'Password',
      'auth.name':           'Full Name',
      'auth.welcome':        'Welcome back',

      // Export
      'export.title':        'Export Page',
      'export.html':         'Download HTML',
      'export.json':         'Save JSON',
      'export.react':        'Download JSX',

      // Generic
      'generic.loading':     'Loading…',
      'generic.noResults':   'No results',
      'generic.search':      'Search…',
      'generic.required':    'Required',
    },

    // ── Arabic ─────────────────────────────────────────────────────────────
    ar: {
      'topbar.title':       'صفحتي',
      'topbar.undo':        'تراجع',
      'topbar.redo':        'إعادة',
      'topbar.preview':     'معاينة',
      'topbar.export':      'تصدير',
      'topbar.save':        'حفظ',
      'topbar.publish':     'نشر',

      'sidebar.blocks':     'كتل',
      'sidebar.layers':     'طبقات',
      'sidebar.style':      'تصميم',
      'sidebar.history':    'السجل',
      'sidebar.components': 'مكونات',

      'section.hero':        'بانر رئيسي',
      'section.about':       'عن الموقع',
      'section.contact':     'تواصل',
      'section.features':    'مميزات',
      'section.testimonial': 'شهادات',
      'section.footer':      'تذييل',
      'section.pricing':     'الأسعار',
      'section.faq':         'الأسئلة الشائعة',
      'section.gallery':     'معرض الصور',

      'action.add':          'إضافة',
      'action.remove':       'حذف',
      'action.duplicate':    'نسخ',
      'action.moveUp':       'تحريك للأعلى',
      'action.moveDown':     'تحريك للأسفل',
      'action.edit':         'تعديل',
      'action.cancel':       'إلغاء',
      'action.confirm':      'تأكيد',
      'action.save':         'حفظ',
      'action.close':        'إغلاق',
      'action.upload':       'رفع',
      'action.download':     'تحميل',
      'action.import':       'استيراد',

      'canvas.empty':        'اسحب كتلة هنا أو انقر للإضافة',
      'canvas.empty.hint':   'ابدأ بقسم البانر الرئيسي',
      'canvas.drop':         'أفلت هنا',

      'mode.edit':           'تحرير',
      'mode.preview':        'معاينة',

      'device.desktop':      'سطح المكتب',
      'device.tablet':       'جهاز لوحي',
      'device.mobile':       'هاتف',

      'toast.saved':         'تم الحفظ ✓',
      'toast.removed':       'تم الحذف',
      'toast.duplicated':    'تم النسخ',
      'toast.copied':        'تم النسخ',
      'toast.uploaded':      'تم الرفع',
      'toast.error':         'حدث خطأ',
      'toast.tooFast':       'أبطئ قليلاً!',

      'auth.login':          'تسجيل الدخول',
      'auth.register':       'إنشاء حساب',
      'auth.logout':         'تسجيل الخروج',
      'auth.email':          'البريد الإلكتروني',
      'auth.password':       'كلمة المرور',
      'auth.name':           'الاسم الكامل',
      'auth.welcome':        'أهلاً بعودتك',

      'export.title':        'تصدير الصفحة',
      'export.html':         'تحميل HTML',
      'export.json':         'حفظ JSON',
      'export.react':        'تحميل JSX',

      'generic.loading':     'جاري التحميل…',
      'generic.noResults':   'لا توجد نتائج',
      'generic.search':      'بحث…',
      'generic.required':    'مطلوب',
    },

    // ── French ─────────────────────────────────────────────────────────────
    fr: {
      'topbar.title':       'Ma Page',
      'topbar.undo':        'Annuler',
      'topbar.redo':        'Rétablir',
      'topbar.preview':     'Aperçu',
      'topbar.export':      'Exporter',
      'topbar.save':        'Sauvegarder',
      'topbar.publish':     'Publier',

      'sidebar.blocks':     'Blocs',
      'sidebar.layers':     'Calques',
      'sidebar.style':      'Style',
      'sidebar.history':    'Historique',
      'sidebar.components': 'Composants',

      'section.hero':        'Héro',
      'section.about':       'À propos',
      'section.contact':     'Contact',
      'section.features':    'Fonctionnalités',
      'section.testimonial': 'Témoignage',
      'section.footer':      'Pied de page',
      'section.pricing':     'Tarifs',
      'section.faq':         'FAQ',
      'section.gallery':     'Galerie',

      'action.add':          'Ajouter',
      'action.remove':       'Supprimer',
      'action.duplicate':    'Dupliquer',
      'action.moveUp':       'Monter',
      'action.moveDown':     'Descendre',
      'action.edit':         'Modifier',
      'action.cancel':       'Annuler',
      'action.confirm':      'Confirmer',
      'action.save':         'Sauvegarder',
      'action.close':        'Fermer',
      'action.upload':       'Importer',
      'action.download':     'Télécharger',
      'action.import':       'Importer',

      'canvas.empty':        'Glissez un bloc ici ou cliquez pour ajouter',
      'canvas.empty.hint':   'Commencez avec une section Héro',
      'canvas.drop':         'Déposer ici',

      'mode.edit':           'Édition',
      'mode.preview':        'Aperçu',

      'device.desktop':      'Bureau',
      'device.tablet':       'Tablette',
      'device.mobile':       'Mobile',

      'toast.saved':         'Sauvegardé ✓',
      'toast.removed':       'Supprimé',
      'toast.duplicated':    'Dupliqué',
      'toast.copied':        'Copié',
      'toast.uploaded':      'Importé',
      'toast.error':         'Une erreur s\'est produite',
      'toast.tooFast':       'Doucement !',

      'auth.login':          'Connexion',
      'auth.register':       'Créer un compte',
      'auth.logout':         'Déconnexion',
      'auth.email':          'E-mail',
      'auth.password':       'Mot de passe',
      'auth.name':           'Nom complet',
      'auth.welcome':        'Bon retour',

      'export.title':        'Exporter la page',
      'export.html':         'Télécharger HTML',
      'export.json':         'Sauvegarder JSON',
      'export.react':        'Télécharger JSX',

      'generic.loading':     'Chargement…',
      'generic.noResults':   'Aucun résultat',
      'generic.search':      'Rechercher…',
      'generic.required':    'Requis',
    },

    // ── Spanish ────────────────────────────────────────────────────────────
    es: {
      'topbar.title':       'Mi Página',
      'topbar.undo':        'Deshacer',
      'topbar.redo':        'Rehacer',
      'topbar.preview':     'Vista previa',
      'topbar.export':      'Exportar',
      'topbar.save':        'Guardar',
      'topbar.publish':     'Publicar',

      'sidebar.blocks':     'Bloques',
      'sidebar.layers':     'Capas',
      'sidebar.style':      'Estilo',
      'sidebar.history':    'Historial',
      'sidebar.components': 'Componentes',

      'section.hero':        'Héroe',
      'section.about':       'Acerca de',
      'section.contact':     'Contacto',
      'section.features':    'Características',
      'section.testimonial': 'Testimonio',
      'section.footer':      'Pie de página',
      'section.pricing':     'Precios',
      'section.faq':         'Preguntas frecuentes',
      'section.gallery':     'Galería',

      'action.add':          'Agregar',
      'action.remove':       'Eliminar',
      'action.duplicate':    'Duplicar',
      'action.moveUp':       'Subir',
      'action.moveDown':     'Bajar',
      'action.edit':         'Editar',
      'action.cancel':       'Cancelar',
      'action.confirm':      'Confirmar',
      'action.save':         'Guardar',
      'action.close':        'Cerrar',
      'action.upload':       'Subir',
      'action.download':     'Descargar',
      'action.import':       'Importar',

      'canvas.empty':        'Arrastra un bloque aquí o haz clic para agregar',
      'canvas.empty.hint':   'Comienza con una sección Héroe',
      'canvas.drop':         'Soltar aquí',

      'mode.edit':           'Editar',
      'mode.preview':        'Vista previa',

      'device.desktop':      'Escritorio',
      'device.tablet':       'Tableta',
      'device.mobile':       'Móvil',

      'toast.saved':         'Guardado ✓',
      'toast.removed':       'Eliminado',
      'toast.duplicated':    'Duplicado',
      'toast.copied':        'Copiado',
      'toast.uploaded':      'Subido',
      'toast.error':         'Algo salió mal',
      'toast.tooFast':       '¡Más despacio!',

      'auth.login':          'Iniciar sesión',
      'auth.register':       'Crear cuenta',
      'auth.logout':         'Cerrar sesión',
      'auth.email':          'Correo electrónico',
      'auth.password':       'Contraseña',
      'auth.name':           'Nombre completo',
      'auth.welcome':        'Bienvenido de vuelta',

      'export.title':        'Exportar página',
      'export.html':         'Descargar HTML',
      'export.json':         'Guardar JSON',
      'export.react':        'Descargar JSX',

      'generic.loading':     'Cargando…',
      'generic.noResults':   'Sin resultados',
      'generic.search':      'Buscar…',
      'generic.required':    'Requerido',
    },
  }

  // RTL languages
  const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur'])

  // Current language state
  let _lang    = 'en'
  let _fallback= 'en'

  // Listeners for language change
  const _listeners = []

  // ── Language detection ──────────────────────────────────────────────────
  function _detect() {
    // 1. URL param:  ?lang=ar
    const url = new URLSearchParams(window.location.search).get('lang')
    if (url && _strings[url]) return url

    // 2. localStorage
    try {
      const stored = localStorage.getItem('pc_lang')
      if (stored && _strings[stored]) return stored
    } catch {}

    // 3. Browser language
    const browser = (navigator.language || 'en').split('-')[0]
    if (_strings[browser]) return browser

    return 'en'
  }

  // ── RTL handling ─────────────────────────────────────────────────────────
  function _applyDir(lang) {
    const dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', lang)
  }

  // ── Core translate function ──────────────────────────────────────────────
  /**
   * Translate a key in the current language.
   * Falls back to English if the key is missing.
   * Supports interpolation: t('hello', { name: 'Ahmed' }) → 'Hello Ahmed'
   * where the string contains {{name}}.
   *
   * @param {string} key
   * @param {Record<string,string>} [params]
   * @returns {string}
   */
  function t(key, params) {
    const dict = _strings[_lang] || _strings[_fallback]
    let str = dict?.[key] ?? _strings[_fallback]?.[key] ?? key

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v)
      }
    }
    return str
  }

  // ── Set language ─────────────────────────────────────────────────────────
  /**
   * Switch the active language and re-render all [data-i18n] elements.
   * @param {string} lang  e.g. 'ar', 'fr', 'es', 'en'
   */
  function setLanguage(lang) {
    if (!_strings[lang]) { console.warn('[I18n] unknown language:', lang); return }
    _lang = lang
    try { localStorage.setItem('pc_lang', lang) } catch {}
    _applyDir(lang)
    _renderAll()
    _listeners.forEach(fn => { try { fn(lang) } catch {} })
    PluginSDK._emit('i18n:change', { lang, rtl: RTL_LANGS.has(lang) })
  }

  // ── DOM auto-render ──────────────────────────────────────────────────────
  // Elements with data-i18n="key" are translated automatically.
  // Elements with data-i18n-placeholder="key" get their placeholder translated.
  function _renderAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n
      el.textContent = t(key)
    })
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder)
    })
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.dataset.i18nTitle)
    })
  }

  // ── Add translations (for plugins) ───────────────────────────────────────
  /**
   * Merge additional translation strings into a language.
   * Used by plugins to add their own translated strings.
   * @param {string} lang
   * @param {Record<string,string>} strings
   */
  function addStrings(lang, strings) {
    if (!_strings[lang]) _strings[lang] = {}
    Object.assign(_strings[lang], strings)
  }

  // ── Add language ─────────────────────────────────────────────────────────
  function addLanguage(lang, strings, isRTL = false) {
    _strings[lang] = strings
    if (isRTL) RTL_LANGS.add(lang)
  }

  // ── Subscribe to language changes ─────────────────────────────────────────
  function onChange(fn) { _listeners.push(fn) }

  // ── Language switcher UI ─────────────────────────────────────────────────
  function _injectSwitcher() {
    if (document.getElementById('i18n-switcher')) return

    const langs = Object.keys(_strings)
    const labels = { en:'EN', ar:'عر', fr:'FR', es:'ES' }
    const flags  = { en:'🇺🇸', ar:'🇸🇦', fr:'🇫🇷', es:'🇪🇸' }

    const wrap = document.createElement('div')
    wrap.id = 'i18n-switcher'
    wrap.style.cssText = [
      'position:relative', 'display:flex', 'align-items:center',
    ].join(';')

    const btn = document.createElement('button')
    btn.className = 'btn btn-ghost'
    btn.style.cssText = 'font-size:11px;gap:4px;padding:4px 8px;'
    btn.innerHTML = `<span id="i18n-flag">${flags[_lang] || '🌐'}</span><span id="i18n-label">${labels[_lang] || _lang.toUpperCase()}</span>`

    const menu = document.createElement('div')
    menu.id = 'i18n-menu'
    menu.style.cssText = [
      'position:absolute', 'top:calc(100% + 6px)', 'right:0',
      'background:var(--surface2)', 'border:1px solid var(--border2)',
      'border-radius:var(--r-lg)', 'padding:4px', 'min-width:120px',
      'box-shadow:var(--shadow-lg)', 'z-index:var(--z-dropdown)',
      'display:none', 'flex-direction:column', 'gap:2px',
    ].join(';')

    langs.forEach(l => {
      const item = document.createElement('button')
      item.className   = 'btn btn-ghost'
      item.dataset.lang = l
      item.style.cssText = 'justify-content:flex-start;font-size:12px;width:100%;gap:8px;'
      item.innerHTML = `${flags[l] || '🌐'} ${labels[l] || l.toUpperCase()}`
      item.onclick = () => {
        setLanguage(l)
        document.getElementById('i18n-flag').textContent  = flags[l]  || '🌐'
        document.getElementById('i18n-label').textContent = labels[l] || l.toUpperCase()
        menu.style.display = 'none'
      }
      menu.appendChild(item)
    })

    btn.onclick = (e) => {
      e.stopPropagation()
      menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex'
    }
    document.addEventListener('click', () => { menu.style.display = 'none' })

    wrap.appendChild(btn)
    wrap.appendChild(menu)

    // Inject before the right-side topbar group
    const topbarR = document.querySelector('.topbar-r')
    if (topbarR) topbarR.prepend(wrap)
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────
  function boot() {
    _lang = _detect()
    _applyDir(_lang)
    _renderAll()
    _injectSwitcher()
  }

  // Boot after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 400))
  } else {
    setTimeout(boot, 400)
  }

  // ── Public API ───────────────────────────────────────────────────────────
  return {
    t,
    setLanguage,
    addStrings,
    addLanguage,
    onChange,
    get lang()    { return _lang },
    get isRTL()   { return RTL_LANGS.has(_lang) },
    get languages(){ return Object.keys(_strings) },
  }
})()

// Expose globally
window.PageCraft = window.PageCraft || {}
window.PageCraft.i18n = I18n
// Shorthand
window.t = I18n.t.bind(I18n)

