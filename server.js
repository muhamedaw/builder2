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

// ── Server-Side Includes (Phase 3/4/5) ───────────────────────────────────────
// Resolves both HTML and JS @include markers before sending to browser:
//   <!-- @include ui/file.html -->   (HTML sections)
//   /* @include scripts/file.js */   (JS modules inside <script>)
function resolveIncludes(html, baseDir) {
  // Match ONLY: <!-- @include file --> and /* @include file */
  // The @include must follow immediately after <!-- or /* (with optional space)
  const INCLUDE_RE = /(?:<!--\s*@include\s+([\w/.\-]+)\s*-->|\/\*\s*@include\s+([\w/.\-]+)\s*\*\/)/g
  return html.replace(INCLUDE_RE, (_match, htmlPath, jsPath) => {
    const relPath  = htmlPath || jsPath
    const fullPath = path.join(baseDir, relPath)
    if (!fs.existsSync(fullPath)) {
      console.warn(`[SSI] Missing include: ${relPath}`)
      return `/* @include ${relPath} — FILE NOT FOUND */`
    }
    return fs.readFileSync(fullPath, 'utf8')
  })
}

// ── SSI handler — used for both / and /builder.html ──────────────────────────
function serveBuilder(_req, res) {
  const root = cfg.static.root
  const idx  = path.join(root, 'index.html')
  const orig = path.join(root, 'builder.html')
  const src  = fs.existsSync(idx) ? idx : orig
  try {
    const html = resolveIncludes(fs.readFileSync(src, 'utf8'), root)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (e) {
    console.error('[SSI] Error processing HTML:', e)
    res.sendFile(src)
  }
}

// ── Static file serving ───────────────────────────────────────────────────────
// builder.html route MUST come before express.static so @include markers
// are always resolved (express.static would serve the raw file otherwise)
app.get(['/', '/builder.html'], serveBuilder)
app.use(express.static(cfg.static.root))

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
