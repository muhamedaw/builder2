/* ══════════════════════════════════════════════════════
   COLLAB — Real-time collaboration via Socket.io
   Auto-joins a room from ?room=XXXXX URL param.
   Opens share modal for manual room creation.
══════════════════════════════════════════════════════ */
const Collab = (() => {
  let _socket = null
  let _roomId  = null
  let _myId    = null
  let _users   = []
  let _applying = false          // true while applying a remote event — suppresses re-emit
  let _propDebounces = {}        // sectionId+key → timeout id

  // ── helpers ────────────────────────────────────────────
  function genRoomId() {
    return Math.random().toString(36).slice(2, 8).toUpperCase()
  }

  function roomURL(id) {
    const u = new URL(location.href)
    u.searchParams.set('room', id)
    return u.toString()
  }

  function setStatus(state) {           // 'off' | 'connecting' | 'on'
    const dot   = document.getElementById('collab-dot')
    const label = document.getElementById('collab-label')
    const wrap  = document.getElementById('collab-status')
    const btn   = document.getElementById('btn-share')
    if (!dot) return
    dot.className   = 'collab-dot' + (state === 'on' ? ' connected' : state === 'connecting' ? ' connecting' : '')
    label.textContent = state === 'on' ? `Room: ${_roomId}` : state === 'connecting' ? 'Connecting…' : 'Offline'
    wrap.style.display = state === 'off' ? 'none' : 'flex'
    if (btn) btn.style.display = state === 'on' ? '' : 'none'
  }

  function renderPresence() {
    const el = document.getElementById('collab-avatars')
    if (!el) return
    el.innerHTML = _users
      .filter(u => u.socketId !== _myId)
      .slice(0, 6)
      .map(u => {
        const initials = (u.name || '?').slice(0, 2).toUpperCase()
        return `<div class="collab-avatar" style="background:${u.color}" title="${u.name}">${initials}</div>`
      }).join('')
  }

  // ── connect / disconnect ────────────────────────────────
  function connect(roomId) {
    if (_socket) _socket.disconnect()
    _roomId = roomId

    // Socket.io may not be loaded yet (CDN is after the main script)
    if (typeof io === 'undefined') {
      console.warn('[Collab] socket.io not loaded yet — retrying in 500ms')
      setTimeout(() => connect(roomId), 500)
      return
    }

    setStatus('connecting')
    _socket = io({ transports: ['websocket', 'polling'] })

    _socket.on('connect', () => {
      const userName = (typeof S !== 'undefined' && S.user?.name) || `Guest-${_socket.id?.slice(0,4) || '??'}`
      _socket.emit('join', { roomId: _roomId, user: { name: userName } })
    })

    _socket.on('room:joined', ({ state, users, you }) => {
      _myId   = you
      _users  = users
      setStatus('on')
      renderPresence()
      // Apply full server state only if local canvas is empty
      if (state.sections.length > 0 && S.sections.length === 0) {
        _applying = true
        editorStore.produce(draft => {
          draft.sections = state.sections
          draft.pageTitle = state.title || draft.pageTitle
        }, 'collab:init')
        const titleEl = document.getElementById('page-title')
        if (titleEl && state.title) titleEl.value = state.title
        renderAll()
        _applying = false
      }
    })

    _socket.on('room:users', ({ users }) => {
      _users = users
      renderPresence()
      renderShareWhoList()
    })

    _socket.on('section:add', ({ section, index }) => {
      _applying = true
      editorStore.produce(draft => {
        if (typeof index === 'number' && index >= 0 && index <= draft.sections.length) {
          draft.sections.splice(index, 0, section)
        } else {
          draft.sections.push(section)
        }
      }, 'collab:section:add')
      renderAll()
      _applying = false
    })

    _socket.on('section:remove', ({ sectionId }) => {
      _applying = true
      editorStore.produce(draft => {
        draft.sections = draft.sections.filter(s => s.id !== sectionId)
      }, 'collab:section:remove')
      renderAll()
      _applying = false
    })

    _socket.on('section:update', ({ sectionId, key, value }) => {
      _applying = true
      editorStore.produce(draft => {
        const sec = draft.sections.find(s => s.id === sectionId)
        if (sec) sec.props[key] = value
      }, 'collab:section:update')
      const sec = editorStore.getState().sections.find(s => s.id === sectionId)
      if (sec) patchSection(sec)
      scheduleLive()
      _applying = false
    })

    _socket.on('section:move', ({ fromIdx, toIdx }) => {
      _applying = true
      editorStore.produce(draft => {
        const len = draft.sections.length
        if (fromIdx < 0 || toIdx < 0 || fromIdx >= len || toIdx >= len) return
        const [sec] = draft.sections.splice(fromIdx, 1)
        draft.sections.splice(toIdx, 0, sec)
      }, 'collab:section:move')
      renderAll()
      _applying = false
    })

    _socket.on('section:dup', ({ newSection, insertIdx }) => {
      _applying = true
      editorStore.produce(draft => {
        if (typeof insertIdx === 'number') draft.sections.splice(insertIdx, 0, newSection)
        else draft.sections.push(newSection)
      }, 'collab:section:dup')
      renderAll()
      _applying = false
    })

    // JSON Delta patch — batch prop update from AI edits
    _socket.on('section:patch', ({ sectionId, patch }) => {
      if (!patch || typeof patch !== 'object') return
      _applying = true
      editorStore.produce(draft => {
        const sec = draft.sections.find(s => s.id === sectionId)
        if (sec) Object.assign(sec.props, patch)
      }, 'collab:section:patch')
      const sec = editorStore.getState().sections.find(s => s.id === sectionId)
      if (sec) { RenderEngine.invalidate(sec.id); renderAll('props') }
      _applying = false
    })

    _socket.on('page:title', ({ title }) => {
      _applying = true
      const titleEl = document.getElementById('page-title')
      if (titleEl) titleEl.value = title
      _applying = false
    })

    _socket.on('cursor:move', () => {
      // future: render remote cursors
    })

    _socket.on('disconnect', () => {
      setStatus('off')
    })
  }

  function disconnect() {
    if (_socket) { _socket.disconnect(); _socket = null }
    _roomId = null; _myId = null; _users = []
    setStatus('off')
  }

  // ── emitters (only fire when NOT applying remote change) ─
  function emitSectionAdd(section, index) {
    if (_applying || !_socket || !_roomId) return
    _socket.emit('section:add', { roomId: _roomId, section, index })
  }

  function emitSectionRemove(sectionId) {
    if (_applying || !_socket || !_roomId) return
    _socket.emit('section:remove', { roomId: _roomId, sectionId })
  }

  function emitSectionUpdate(sectionId, key, value) {
    if (_applying || !_socket || !_roomId) return
    const dk = sectionId + '|' + key
    clearTimeout(_propDebounces[dk])
    _propDebounces[dk] = setTimeout(() => {
      if (_socket && _roomId) _socket.emit('section:update', { roomId: _roomId, sectionId, key, value })
    }, 80)
  }

  // Batch delta — used by AI edits that change multiple props at once
  function emitSectionPatch(sectionId, patch) {
    if (_applying || !_socket || !_roomId || !patch || !Object.keys(patch).length) return
    clearTimeout(_propDebounces[sectionId + '|__patch__'])
    _propDebounces[sectionId + '|__patch__'] = setTimeout(() => {
      if (_socket && _roomId) _socket.emit('section:patch', { roomId: _roomId, sectionId, patch })
    }, 80)
  }

  function emitSectionMove(fromIdx, toIdx) {
    if (_applying || !_socket || !_roomId) return
    _socket.emit('section:move', { roomId: _roomId, fromIdx, toIdx })
  }

  function emitSectionDup(sectionId, newSection, insertIdx) {
    if (_applying || !_socket || !_roomId) return
    _socket.emit('section:dup', { roomId: _roomId, sectionId, newSection, insertIdx })
  }

  function emitPageTitle(title) {
    if (_applying || !_socket || !_roomId) return
    _socket.emit('page:title', { roomId: _roomId, title })
  }

  // ── share modal helpers ─────────────────────────────────
  function renderShareWhoList() {
    const el = document.getElementById('share-who-list')
    if (!el) return
    el.innerHTML = _users.map(u => {
      const initials = (u.name || '?').slice(0, 2).toUpperCase()
      const isYou    = u.socketId === _myId
      return `<div class="share-who-item">
        <div class="share-who-avatar" style="background:${u.color}">${initials}</div>
        <span class="share-who-name">${u.name || 'Guest'}</span>
        ${isYou ? '<span class="share-who-you">You</span>' : ''}
      </div>`
    }).join('')
  }

  // ── auto-join from URL ──────────────────────────────────
  function init() {
    const params = new URLSearchParams(location.search)
    const roomParam = params.get('room')
    if (roomParam) connect(roomParam)

    // Page title sync
    const titleEl = document.getElementById('page-title')
    if (titleEl) {
      titleEl.addEventListener('input', () => emitPageTitle(titleEl.value))
    }
  }

  return {
    connect,
    disconnect,
    isApplying: () => _applying,
    getRoomId:  () => _roomId,
    getUsers:   () => _users,
    getMyId:    () => _myId,
    roomURL,
    genRoomId,
    renderShareWhoList,
    emitSectionAdd,
    emitSectionRemove,
    emitSectionUpdate,
    emitSectionPatch,
    emitSectionMove,
    emitSectionDup,
    emitPageTitle,
    init,
  }
})()

// ── Share modal public functions ────────────────────────
function openShareModal() {
  const roomId = Collab.getRoomId() || Collab.genRoomId()
  if (!Collab.getRoomId()) Collab.connect(roomId)
  const inp = document.getElementById('share-room-inp')
  if (inp) inp.value = Collab.roomURL(roomId)
  Collab.renderShareWhoList()
  document.getElementById('share-modal-bg').classList.add('open')
}
function closeShareModal() {
  document.getElementById('share-modal-bg').classList.remove('open')
}
function copyShareLink() {
  const inp = document.getElementById('share-room-inp')
  if (!inp) return
  navigator.clipboard.writeText(inp.value).then(() => toast('Link copied!','🔗')).catch(() => {
    try { inp.select(); document.execCommand('copy') } catch (_) {}; toast('Link copied!','🔗')
  })
}
function leaveRoom() {
  Collab.disconnect()
  closeShareModal()
  toast('Left room','👋')
}

// Boot collab after a tick (Socket.io CDN loads after this script)
setTimeout(() => Collab.init(), 0)
