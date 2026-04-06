'use strict'
/**
 * PageCraft — Collaboration Server (Entry Point)
 * Stage 1: Foundation — modular architecture
 *
 * Architecture:
 *   server.js              → entry point + wiring
 *   src/config/index.js    → all configuration (env-driven)
 *   src/services/keyStore  → API key persistence
 *   src/services/roomService → room + section state management
 *   src/middleware/apiKey  → API key auth middleware
 *   src/routes/api.js      → REST API v1 routes
 *   src/handlers/socketHandlers.js → Socket.io event handlers
 *
 * Socket Events (client → server):
 *   join            { roomId, user }
 *   section:add     { roomId, section, index }
 *   section:remove  { roomId, sectionId }
 *   section:update  { roomId, sectionId, key, value }
 *   section:move    { roomId, fromIdx, toIdx }
 *   section:dup     { roomId, sectionId, newSection, insertIdx }
 *   page:title      { roomId, title }
 *   cursor:move     { roomId, x, y }
 *
 * Socket Events (server → client):
 *   room:joined     { state, users, you }
 *   room:users      { users }
 *   section:*       { ...payload, fromUser }
 *   page:title      { title, fromUser }
 *   cursor:move     { socketId, x, y }
 */

// Load .env if present (optional — no hard dependency on dotenv)
try { require('fs').existsSync('.env') && require('child_process') } catch {}

const express  = require('express')
const http     = require('http')
const { Server } = require('socket.io')
const path     = require('path')
const fs       = require('fs')

// ── Load modules ─────────────────────────────────────────────────────────────
const cfg                    = require('./src/config')
const keyStore               = require('./src/services/keyStore')
const rooms                  = require('./src/services/roomService')
const { createApiRouter }    = require('./src/routes/api')
const { registerSocketHandlers } = require('./src/handlers/socketHandlers')

// ── Bootstrap ─────────────────────────────────────────────────────────────────
keyStore.seed()   // ensure at least one dev key exists on first run

// ── App setup ────────────────────────────────────────────────────────────────
const app    = express()
const server = http.createServer(app)
const io     = new Server(server, {
  cors        : cfg.cors,
  pingInterval: cfg.socket.pingInterval,
  pingTimeout : cfg.socket.pingTimeout,
})

app.use(express.json())

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', createApiRouter(io))

// ── Static file serving ───────────────────────────────────────────────────────
app.use(express.static(cfg.static.root))
app.get('/', (_req, res) => {
  const idx  = path.join(cfg.static.root, 'index.html')
  const orig = path.join(cfg.static.root, 'builder.html')
  res.sendFile(fs.existsSync(idx) ? idx : orig)
})

// ── Socket.io handlers ────────────────────────────────────────────────────────
registerSocketHandlers(io)

// ── Health endpoint ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status  : 'ok',
    version : cfg.version,
    env     : cfg.env,
    rooms   : rooms.roomCount(),
    users   : rooms.totalUsers(),
    apiKeys : keyStore.count(),
    uptime  : Math.round(process.uptime()),
  })
})

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(cfg.port, () => {
  console.log(`
  ┌────────────────────────────────────────────────┐
  │   PageCraft collaboration server               │
  │   http://localhost:${cfg.port}                    │
  │   Health: http://localhost:${cfg.port}/health     │
  │   Env: ${cfg.env.padEnd(38)}│
  └────────────────────────────────────────────────┘
  `)
})
