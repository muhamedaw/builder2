/**
 * PageCraft — Real-time Collaboration Server
 * Express + Socket.io
 *
 * Events (client → server):
 *   join            { roomId, user }
 *   section:add     { roomId, section, index }
 *   section:remove  { roomId, sectionId }
 *   section:update  { roomId, sectionId, key, value }
 *   section:move    { roomId, fromIdx, toIdx }
 *   section:dup     { roomId, sectionId, newSection, insertIdx }
 *   page:title      { roomId, title }
 *   cursor:move     { roomId, x, y }   (optional presence)
 *
 * Events (server → client):
 *   room:joined     { state, users, you }
 *   room:users      { users }
 *   section:add     { section, index, fromUser }
 *   section:remove  { sectionId, fromUser }
 *   section:update  { sectionId, key, value, fromUser }
 *   section:move    { fromIdx, toIdx, fromUser }
 *   section:dup     { sectionId, newSection, insertIdx, fromUser }
 *   page:title      { title, fromUser }
 *   cursor:move     { socketId, x, y }
 */

'use strict'

const express  = require('express')
const http     = require('http')
const { Server } = require('socket.io')
const path     = require('path')
const fs       = require('fs')

const app    = express()
const server = http.createServer(app)
const io     = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  // Reduce ping overhead on LAN / same-host setups
  pingInterval: 10_000,
  pingTimeout:  5_000,
})

// ── API Key store (file-backed for persistence) ───────────────────────────────
const KEYS_FILE = path.join(__dirname, '.api-keys.json')

function loadKeys() {
  try { return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')) } catch { return {} }
}
function saveKeys(keys) {
  try { fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2)) } catch {}
}

// Seed a default dev key on first run
let _keys = loadKeys()
if (!Object.keys(_keys).length) {
  const devKey = 'pc_dev_' + Math.random().toString(36).slice(2,18)
  _keys[devKey] = { name: 'Dev Key', permission: 'admin', created: new Date().toISOString(), requests: 0 }
  saveKeys(_keys)
  console.log('\n  🔑 Dev API key:', devKey, '\n')
}

// ── API key middleware ────────────────────────────────────────────────────────
function requireApiKey(minPerm = 'read') {
  const PERMS = { read: 0, write: 1, admin: 2 }
  return (req, res, next) => {
    const key = req.headers['x-api-key'] || req.query.api_key
    if (!key) return res.status(401).json({ error: 'Missing X-API-Key header' })
    _keys = loadKeys()
    const meta = _keys[key]
    if (!meta) return res.status(403).json({ error: 'Invalid API key' })
    if (meta.revoked) return res.status(403).json({ error: 'Key has been revoked' })
    if (meta.expiry && new Date(meta.expiry) < new Date())
      return res.status(403).json({ error: 'Key has expired' })
    if (PERMS[meta.permission] < PERMS[minPerm])
      return res.status(403).json({ error: `Requires '${minPerm}' permission` })
    // Track usage
    meta.requests = (meta.requests || 0) + 1
    meta.lastUsed = new Date().toISOString()
    saveKeys(_keys)
    req.apiKey = { key, ...meta }
    next()
  }
}

app.use(express.json())

// ── Public API v1 routes ──────────────────────────────────────────────────────
const api = express.Router()

// Validate key
api.get('/keys/validate', requireApiKey('read'), (req, res) => {
  const { key, ...meta } = req.apiKey
  res.json({ valid: true, ...meta })
})

// Register a key from the builder UI
api.post('/keys', (req, res) => {
  const { key, name, permission, expiry } = req.body || {}
  if (!key || !name) return res.status(400).json({ error: 'key and name required' })
  _keys = loadKeys()
  _keys[key] = { name, permission: permission || 'read', expiry: expiry || null,
                 created: new Date().toISOString(), requests: 0, revoked: false }
  saveKeys(_keys)
  res.json({ ok: true })
})

// Revoke a key
api.delete('/keys/:key', requireApiKey('admin'), (req, res) => {
  _keys = loadKeys()
  if (_keys[req.params.key]) { _keys[req.params.key].revoked = true; saveKeys(_keys) }
  res.json({ ok: true })
})

// List rooms
api.get('/rooms', requireApiKey('read'), (req, res) => {
  const list = Array.from(rooms.entries()).map(([id, r]) => ({
    id, title: r.title, users: r.users.size, sections: r.sections.length,
  }))
  res.json({ rooms: list })
})

// Get room state
api.get('/rooms/:roomId', requireApiKey('read'), (req, res) => {
  const room = rooms.get(req.params.roomId)
  if (!room) return res.status(404).json({ error: 'Room not found' })
  res.json({ title: room.title, sections: room.sections, users: Array.from(room.users.values()) })
})

// Add section to room
api.post('/rooms/:roomId/sections', requireApiKey('write'), (req, res) => {
  const room = getRoom(req.params.roomId)
  const { type, props, index } = req.body || {}
  if (!type) return res.status(400).json({ error: 'type is required' })
  const section = { id: 's' + Date.now() + '_api', type, props: props || {} }
  if (typeof index === 'number') room.sections.splice(index, 0, section)
  else room.sections.push(section)
  io.to(req.params.roomId).emit('section:add', { section, index, fromUser: 'api' })
  res.json({ ok: true, section })
})

// Remove section from room
api.delete('/rooms/:roomId/sections/:sectionId', requireApiKey('write'), (req, res) => {
  const room = rooms.get(req.params.roomId)
  if (!room) return res.status(404).json({ error: 'Room not found' })
  room.sections = room.sections.filter(s => s.id !== req.params.sectionId)
  io.to(req.params.roomId).emit('section:remove', { sectionId: req.params.sectionId, fromUser: 'api' })
  res.json({ ok: true })
})

// Update room title
api.put('/rooms/:roomId/title', requireApiKey('write'), (req, res) => {
  const room = rooms.get(req.params.roomId)
  if (!room) return res.status(404).json({ error: 'Room not found' })
  room.title = String(req.body?.title || '').slice(0, 120)
  io.to(req.params.roomId).emit('page:title', { title: room.title, fromUser: 'api' })
  res.json({ ok: true, title: room.title })
})

app.use('/api/v1', api)

// ── Static file serving ───────────────────────────────────────────────────────
// Serves builder (1).html (or index.html if renamed) from the same directory
app.use(express.static(path.join(__dirname)))
app.get('/', (req, res) => {
  // Try index.html first, fall back to the original filename
  const idx   = path.join(__dirname, 'index.html')
  const orig  = path.join(__dirname, 'builder.html')
  const fs    = require('fs')
  res.sendFile(fs.existsSync(idx) ? idx : orig)
})

// ── Room state ────────────────────────────────────────────────────────────────
// Map<roomId, { sections: [], title: string, users: Map<socketId, User> }>
const rooms = new Map()

const USER_COLORS = [
  '#6c63ff','#10b981','#f59e0b','#ec4899',
  '#0ea5e9','#8b5cf6','#ef4444','#14b8a6',
]
let _colorIdx = 0

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { sections: [], title: 'My Page', users: new Map() })
  }
  return rooms.get(roomId)
}

function roomUsers(room) {
  return Array.from(room.users.values())
}

// Automatically delete rooms that have been empty for 30 minutes
function scheduleRoomCleanup(roomId) {
  setTimeout(() => {
    const r = rooms.get(roomId)
    if (r && r.users.size === 0) {
      rooms.delete(roomId)
      console.log(`[room:${roomId}] cleaned up (idle)`)
    }
  }, 30 * 60 * 1000)
}

// ── Connection handler ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  let currentRoom = null

  // ── join ──────────────────────────────────────────────────────────────────
  socket.on('join', ({ roomId, user = {} }) => {
    // Leave previous room if any
    if (currentRoom) {
      socket.leave(currentRoom)
      const prev = rooms.get(currentRoom)
      if (prev) {
        prev.users.delete(socket.id)
        io.to(currentRoom).emit('room:users', { users: roomUsers(prev) })
        if (prev.users.size === 0) scheduleRoomCleanup(currentRoom)
      }
    }

    currentRoom = roomId
    socket.join(roomId)

    const room  = getRoom(roomId)
    const color = USER_COLORS[_colorIdx++ % USER_COLORS.length]
    room.users.set(socket.id, {
      socketId: socket.id,
      name:     String(user.name  || `Guest-${socket.id.slice(0, 4)}`).slice(0, 32),
      color,
      avatar:   user.avatar || null,
    })

    // Send full state to the joining client
    socket.emit('room:joined', {
      state: { sections: room.sections, title: room.title },
      users: roomUsers(room),
      you:   socket.id,
    })

    // Tell everyone else who joined
    socket.to(roomId).emit('room:users', { users: roomUsers(room) })

    console.log(`[room:${roomId}] +join  ${room.users.size} user(s)  socket=${socket.id}`)
  })

  // ── section:add ───────────────────────────────────────────────────────────
  socket.on('section:add', ({ roomId, section, index }) => {
    const room = rooms.get(roomId); if (!room) return
    if (typeof index === 'number' && index >= 0 && index <= room.sections.length) {
      room.sections.splice(index, 0, section)
    } else {
      room.sections.push(section)
    }
    socket.to(roomId).emit('section:add', { section, index, fromUser: socket.id })
  })

  // ── section:remove ────────────────────────────────────────────────────────
  socket.on('section:remove', ({ roomId, sectionId }) => {
    const room = rooms.get(roomId); if (!room) return
    room.sections = room.sections.filter(s => s.id !== sectionId)
    socket.to(roomId).emit('section:remove', { sectionId, fromUser: socket.id })
  })

  // ── section:update ────────────────────────────────────────────────────────
  socket.on('section:update', ({ roomId, sectionId, key, value }) => {
    const room = rooms.get(roomId); if (!room) return
    const sec = room.sections.find(s => s.id === sectionId)
    if (sec) sec.props[key] = value
    socket.to(roomId).emit('section:update', { sectionId, key, value, fromUser: socket.id })
  })

  // ── section:move ──────────────────────────────────────────────────────────
  socket.on('section:move', ({ roomId, fromIdx, toIdx }) => {
    const room = rooms.get(roomId); if (!room) return
    const len = room.sections.length
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= len || toIdx >= len) return
    const [sec] = room.sections.splice(fromIdx, 1)
    room.sections.splice(toIdx, 0, sec)
    socket.to(roomId).emit('section:move', { fromIdx, toIdx, fromUser: socket.id })
  })

  // ── section:dup ───────────────────────────────────────────────────────────
  socket.on('section:dup', ({ roomId, sectionId, newSection, insertIdx }) => {
    const room = rooms.get(roomId); if (!room) return
    if (typeof insertIdx === 'number') room.sections.splice(insertIdx, 0, newSection)
    else room.sections.push(newSection)
    socket.to(roomId).emit('section:dup', { sectionId, newSection, insertIdx, fromUser: socket.id })
  })

  // ── page:title ────────────────────────────────────────────────────────────
  socket.on('page:title', ({ roomId, title }) => {
    const room = rooms.get(roomId); if (!room) return
    room.title = String(title || '').slice(0, 120)
    socket.to(roomId).emit('page:title', { title: room.title, fromUser: socket.id })
  })

  // ── cursor:move (lightweight presence) ───────────────────────────────────
  socket.on('cursor:move', ({ roomId, x, y }) => {
    socket.to(roomId).emit('cursor:move', { socketId: socket.id, x, y })
  })

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    if (!currentRoom) return
    const room = rooms.get(currentRoom)
    if (room) {
      room.users.delete(socket.id)
      io.to(currentRoom).emit('room:users', { users: roomUsers(room) })
      if (room.users.size === 0) scheduleRoomCleanup(currentRoom)
    }
    console.log(`[room:${currentRoom}] -leave  socket=${socket.id}  reason=${reason}`)
  })
})

// ── Health endpoint ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const ks = loadKeys()
  res.json({
    status:   'ok',
    rooms:    rooms.size,
    users:    Array.from(rooms.values()).reduce((n, r) => n + r.users.size, 0),
    apiKeys:  Object.keys(ks).length,
    uptime:   Math.round(process.uptime()),
    version:  '1.0.0',
  })
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`
  ┌────────────────────────────────────────────┐
  │   PageCraft collaboration server           │
  │   http://localhost:${PORT}                    │
  │   Health: http://localhost:${PORT}/health     │
  └────────────────────────────────────────────┘
  `)
})
