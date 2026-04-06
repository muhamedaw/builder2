#!/usr/bin/env node
/**
 * PageCraft CLI — Command-line interface for the PageCraft builder.
 *
 * Usage:
 *   node pagecraft-cli.js <command> [options]
 *
 * Commands:
 *   open                      Open the builder in your default browser
 *   status                    Show server status + active rooms
 *   rooms                     List all active rooms
 *   room <roomId>             Show a room's sections and title
 *   new <name>                Create a new named room/project
 *   export <roomId> [file]    Export a room's content as HTML
 *   title <roomId> <title>    Update a room's page title
 *   deploy <roomId>           Simulate deployment (prints build info)
 *   keys                      List all API keys (requires admin key)
 *   help                      Show this help message
 *
 * Options:
 *   --host <url>     Server base URL (default: http://localhost:3000)
 *   --key  <apikey>  API key for authenticated requests
 *                    (falls back to PAGECRAFT_API_KEY env var)
 *
 * Examples:
 *   node pagecraft-cli.js open
 *   node pagecraft-cli.js status
 *   node pagecraft-cli.js new "My Landing Page" --key pc_dev_key_1
 *   node pagecraft-cli.js export myroom123 ./output.html --key pc_dev_key_1
 *   node pagecraft-cli.js title myroom123 "Awesome Page" --key pc_dev_key_1
 */

'use strict'

const http   = require('http')
const https  = require('https')
const fs     = require('fs')
const path   = require('path')
const os     = require('os')

// ── ANSI colours ──────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
}
const c = (color, str) => `${C[color]}${str}${C.reset}`
const ok    = str => console.log(`  ${c('green','✓')} ${str}`)
const warn  = str => console.log(`  ${c('yellow','⚠')} ${str}`)
const err   = str => console.error(`  ${c('red','✕')} ${str}`)
const info  = str => console.log(`  ${c('cyan','ℹ')} ${str}`)
const head  = str => console.log(`\n${c('bold',c('white', str))}`)
const dim   = str => console.log(c('dim', `  ${str}`))
const hr    = ()  => console.log(c('dim','  ' + '─'.repeat(52)))

// ── Arg parsing ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args    = argv.slice(2)
  const opts    = { host: 'http://localhost:3000', key: process.env.PAGECRAFT_API_KEY || '' }
  const cmds    = []

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--host') { opts.host = args[++i] }
    else if (args[i] === '--key') { opts.key = args[++i] }
    else cmds.push(args[i])
  }

  // Remove trailing slash
  opts.host = opts.host.replace(/\/$/, '')
  return { cmds, opts }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function request(method, url, body, apiKey) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url)
    const lib     = parsed.protocol === 'https:' ? https : http
    const payload = body ? JSON.stringify(body) : null

    const headers = { 'Content-Type': 'application/json' }
    if (apiKey) headers['x-api-key'] = apiKey
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload)

    const req = lib.request({
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method,
      headers,
    }, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })

    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

const get  = (url, key) => request('GET',    url, null, key)
const post = (url, body, key) => request('POST',   url, body, key)
const put  = (url, body, key) => request('PUT',    url, body, key)

// ── HTML export builder ───────────────────────────────────────────────────────
function buildExportHTML(room) {
  const sections = (room.sections || []).map(s => {
    const props = s.props || {}
    const tag   = s.type || 'div'
    const inner = props.headline
      ? `<h1>${props.headline}</h1>${props.subheadline ? `<p>${props.subheadline}</p>` : ''}`
      : props.title
        ? `<h2>${props.title}</h2>${props.body ? `<p>${props.body}</p>` : ''}`
        : `<div data-type="${s.type}"></div>`
    return `  <!-- Section: ${s.type} -->\n  <section class="pc-${s.type}">\n    ${inner}\n  </section>`
  }).join('\n\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${room.title || 'PageCraft Export'}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d0d0f;color:#f1f5f9}
    section{padding:80px 5%;max-width:1200px;margin:0 auto}
    h1{font-size:clamp(2rem,5vw,4rem);font-weight:800;margin-bottom:1rem}
    h2{font-size:clamp(1.5rem,3vw,2.5rem);font-weight:700;margin-bottom:1rem}
    p{font-size:1.1rem;color:#94a3b8;line-height:1.7}
  </style>
</head>
<body>
${sections}
  <!-- Exported by PageCraft CLI on ${new Date().toISOString()} -->
</body>
</html>`
}

// ── Commands ──────────────────────────────────────────────────────────────────
const COMMANDS = {

  async help() {
    console.log(`
${c('bold',c('magenta','⚡ PageCraft CLI'))} ${c('dim','— Visual Builder Command Line Interface')}

${c('bold','USAGE')}
  node pagecraft-cli.js <command> [options]

${c('bold','COMMANDS')}
  ${c('cyan','open')}                    Open builder in browser
  ${c('cyan','status')}                  Server health + stats
  ${c('cyan','rooms')}                   List active rooms
  ${c('cyan','room')} <id>               Show room details
  ${c('cyan','new')} <name>              Create a new room/project
  ${c('cyan','export')} <id> [file]      Export room as HTML file
  ${c('cyan','title')} <id> <title>      Update room page title
  ${c('cyan','deploy')} <id>             Build and deploy a room
  ${c('cyan','help')}                    Show this message

${c('bold','OPTIONS')}
  ${c('yellow','--host')} <url>           Server URL ${c('dim','(default: http://localhost:3000)')}
  ${c('yellow','--key')}  <apikey>        API key    ${c('dim','(or set PAGECRAFT_API_KEY env var)')}

${c('bold','EXAMPLES')}
  ${c('dim','node pagecraft-cli.js open')}
  ${c('dim','node pagecraft-cli.js new "My Landing Page" --key pc_dev_key_1')}
  ${c('dim','node pagecraft-cli.js export myroom ./dist/index.html --key pc_dev_key_1')}
  ${c('dim','node pagecraft-cli.js deploy myroom --key pc_dev_key_1')}
`)
  },

  async open(cmds, opts) {
    const url = opts.host
    info(`Opening ${c('cyan', url)} …`)
    const opener = process.platform === 'win32' ? 'start'
      : process.platform === 'darwin' ? 'open' : 'xdg-open'
    require('child_process').exec(`${opener} "${url}"`, e => {
      if (e) { err(`Could not open browser: ${e.message}`); process.exit(1) }
      ok(`Builder opened in browser`)
    })
  },

  async status(cmds, opts) {
    head('Server Status')
    try {
      const res = await get(`${opts.host}/health`)
      if (res.status !== 200) { err(`Server returned ${res.status}`); process.exit(1) }
      const b = res.body
      ok(`Server is ${c('green','online')}`)
      hr()
      info(`Version : ${b.version || '—'}`)
      info(`Env     : ${b.env     || '—'}`)
      info(`Uptime  : ${b.uptime  ? Math.round(b.uptime) + 's' : '—'}`)
      info(`Rooms   : ${b.rooms   ?? '—'}`)
      info(`URL     : ${c('cyan', opts.host)}`)
    } catch (e) {
      err(`Cannot reach server at ${opts.host}`)
      err(e.message)
      process.exit(1)
    }
  },

  async rooms(cmds, opts) {
    head('Active Rooms')
    _requireKey(opts)
    try {
      const res = await get(`${opts.host}/api/v1/rooms`, opts.key)
      if (res.status === 401) { err('Invalid API key'); process.exit(1) }
      const rooms = Array.isArray(res.body) ? res.body : (res.body.rooms || [])
      if (!rooms.length) { info('No active rooms'); return }
      hr()
      rooms.forEach(r => {
        info(`${c('cyan', r.id || r.roomId || '?')} — ${c('white', r.title || 'Untitled')} (${r.sections?.length || 0} sections, ${r.users?.length || 0} users)`)
      })
      hr()
      ok(`${rooms.length} room(s) found`)
    } catch (e) { err(e.message); process.exit(1) }
  },

  async room(cmds, opts) {
    const roomId = cmds[1]
    if (!roomId) { err('Usage: room <roomId>'); process.exit(1) }
    head(`Room: ${roomId}`)
    _requireKey(opts)
    try {
      const res = await get(`${opts.host}/api/v1/rooms/${roomId}`, opts.key)
      if (res.status === 404) { err(`Room "${roomId}" not found`); process.exit(1) }
      if (res.status === 401) { err('Invalid API key'); process.exit(1) }
      const room = res.body
      hr()
      info(`Title    : ${c('white', room.title || 'Untitled')}`)
      info(`Sections : ${room.sections?.length || 0}`)
      info(`Users    : ${room.users?.length || 0} online`)
      if (room.sections?.length) {
        console.log('')
        dim('Sections:')
        room.sections.forEach((s, i) => {
          dim(`  ${i + 1}. [${s.type}] ${s.props?.headline || s.props?.title || ''}`)
        })
      }
      hr()
    } catch (e) { err(e.message); process.exit(1) }
  },

  async new(cmds, opts) {
    const name   = cmds.slice(1).join(' ') || 'Untitled Project'
    const roomId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g,'-').slice(0,24) + '-' + Date.now().toString(36)
    head(`Creating: "${name}"`)
    _requireKey(opts)
    try {
      // Set a title for the new room
      const res = await put(`${opts.host}/api/v1/rooms/${roomId}/title`, { title: name }, opts.key)
      if (res.status === 401) { err('Invalid API key'); process.exit(1) }
      hr()
      ok(`Project created!`)
      info(`Room ID  : ${c('cyan', roomId)}`)
      info(`Title    : ${c('white', name)}`)
      info(`URL      : ${c('cyan', `${opts.host}/?room=${roomId}`)}`)
      hr()
      console.log(`  ${c('dim','Open in builder:')} node pagecraft-cli.js open --host ${opts.host}`)
      console.log(`  ${c('dim','Then add ?room=' + roomId + ' to the URL')}`)
    } catch (e) { err(e.message); process.exit(1) }
  },

  async export(cmds, opts) {
    const roomId = cmds[1]
    const outFile = cmds[2] || `pagecraft-${roomId || 'export'}.html`
    if (!roomId) { err('Usage: export <roomId> [output.html]'); process.exit(1) }
    head(`Exporting room: ${roomId}`)
    _requireKey(opts)
    try {
      const res = await get(`${opts.host}/api/v1/rooms/${roomId}`, opts.key)
      if (res.status === 404) { err(`Room "${roomId}" not found`); process.exit(1) }
      if (res.status === 401) { err('Invalid API key'); process.exit(1) }
      const room = res.body
      const html = buildExportHTML(room)
      const dest = path.resolve(process.cwd(), outFile)
      fs.writeFileSync(dest, html, 'utf8')
      hr()
      ok(`Exported successfully!`)
      info(`Room     : ${roomId}`)
      info(`Title    : ${room.title || 'Untitled'}`)
      info(`Sections : ${room.sections?.length || 0}`)
      info(`File     : ${c('cyan', dest)}`)
      info(`Size     : ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`)
      hr()
    } catch (e) { err(e.message); process.exit(1) }
  },

  async title(cmds, opts) {
    const roomId   = cmds[1]
    const newTitle = cmds.slice(2).join(' ')
    if (!roomId || !newTitle) { err('Usage: title <roomId> <new title>'); process.exit(1) }
    _requireKey(opts)
    try {
      const res = await put(`${opts.host}/api/v1/rooms/${roomId}/title`, { title: newTitle }, opts.key)
      if (res.status === 401) { err('Invalid API key'); process.exit(1) }
      ok(`Title updated: "${c('white', newTitle)}"`)
    } catch (e) { err(e.message); process.exit(1) }
  },

  async deploy(cmds, opts) {
    const roomId = cmds[1]
    if (!roomId) { err('Usage: deploy <roomId>'); process.exit(1) }
    head(`Deploying: ${roomId}`)
    _requireKey(opts)
    try {
      const res = await get(`${opts.host}/api/v1/rooms/${roomId}`, opts.key)
      if (res.status === 404) { err(`Room "${roomId}" not found`); process.exit(1) }
      if (res.status === 401) { err('Invalid API key'); process.exit(1) }
      const room = res.body
      const html = buildExportHTML(room)

      // Write to dist/
      const distDir = path.resolve(process.cwd(), 'dist')
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true })
      const outFile = path.join(distDir, `${roomId}.html`)
      fs.writeFileSync(outFile, html, 'utf8')

      hr()
      info(`${c('dim','Building …')}`)
      await _sleep(400)
      ok(`Build complete`)
      info(`${c('dim','Optimising …')}`)
      await _sleep(300)
      ok(`${(Buffer.byteLength(html) / 1024).toFixed(1)} KB output`)
      info(`${c('dim','Deploying …')}`)
      await _sleep(600)
      ok(`Deployed to ${c('cyan', outFile)}`)
      hr()
      info(`Title    : ${room.title || 'Untitled'}`)
      info(`Sections : ${room.sections?.length || 0}`)
      info(`Output   : ${c('cyan', outFile)}`)
      console.log(`\n  ${c('dim','In production, connect this step to Netlify/Vercel/Cloudflare Pages.')}`)
      hr()
    } catch (e) { err(e.message); process.exit(1) }
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _requireKey(opts) {
  if (!opts.key) {
    warn('No API key provided.')
    info('Pass --key <apikey>  OR  set the PAGECRAFT_API_KEY env variable.')
    info('Find your key in the builder: API Keys panel (🔑 button)')
    process.exit(1)
  }
}
function _sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Entry ─────────────────────────────────────────────────────────────────────
async function main() {
  const { cmds, opts } = parseArgs(process.argv)
  const cmd = cmds[0] || 'help'

  const handler = COMMANDS[cmd]
  if (!handler) {
    err(`Unknown command: "${cmd}"`)
    info('Run  node pagecraft-cli.js help  to see available commands.')
    process.exit(1)
  }

  try {
    await handler(cmds, opts)
  } catch (e) {
    err(`Unexpected error: ${e.message}`)
    process.exit(1)
  }
}

main()
