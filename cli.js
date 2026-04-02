#!/usr/bin/env node
/**
 * PageCraft CLI
 * Usage: node cli.js <command> [options]
 *
 * Commands:
 *   init              Interactive project setup wizard
 *   serve             Start the dev server
 *   status            Show server + API health
 *   export [file]     Export builder.html → dist/
 *   deploy            Build + copy to dist/
 *   keys list         List all API keys
 *   keys create       Create a new API key
 *   keys revoke       Revoke an API key
 *   rooms             List active collaboration rooms
 *   room <id>         Get room state
 *   backup            Trigger a manual backup via API
 *   help              Show this help
 */

'use strict'

const fs       = require('fs')
const path     = require('path')
const http     = require('http')
const https    = require('https')
const readline = require('readline')
const { execSync, spawn } = require('child_process')

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
  bgBlue: '\x1b[44m',
}
const c  = (color, str) => `${C[color]}${str}${C.reset}`
const ok  = str => console.log(`  ${c('green','✔')}  ${str}`)
const err = str => console.log(`  ${c('red','✖')}  ${str}`)
const inf = str => console.log(`  ${c('cyan','ℹ')}  ${str}`)
const warn= str => console.log(`  ${c('yellow','⚠')}  ${str}`)
const hdr = str => console.log(`\n${c('bold', c('cyan', str))}\n`)
const sep = ()  => console.log(c('dim', '  ' + '─'.repeat(50)))

// ── Config ────────────────────────────────────────────────────────────────────
const ROOT     = __dirname
const PKG      = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const KEYS_FILE= path.join(ROOT, '.api-keys.json')
const CFG_FILE = path.join(ROOT, '.pagecraft.json')
const DEFAULT_PORT = process.env.PORT || 3000
const BASE_URL = `http://localhost:${DEFAULT_PORT}`

function loadCfg()   { try { return JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')) } catch { return {} } }
function saveCfg(c)  { fs.writeFileSync(CFG_FILE, JSON.stringify(c, null, 2)) }
function loadKeys()  { try { return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')) } catch { return {} } }

// ── HTTP helper ───────────────────────────────────────────────────────────────
function apiReq(method, endpoint, body, apiKey) {
  return new Promise((resolve, reject) => {
    const cfg = loadCfg()
    const key = apiKey || cfg.apiKey
    const url = new URL(BASE_URL + '/api/v1' + endpoint)
    const opts = {
      hostname: url.hostname,
      port:     url.port,
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type':  'application/json',
        'X-API-Key':     key || '',
      },
    }
    const req = http.request(opts, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

// ── Readline helper ───────────────────────────────────────────────────────────
function prompt(rl, question, defaultVal = '') {
  return new Promise(resolve => {
    const hint = defaultVal ? c('dim', ` (${defaultVal})`) : ''
    rl.question(`  ${c('cyan','?')} ${question}${hint}: `, ans => {
      resolve(ans.trim() || defaultVal)
    })
  })
}

function promptSelect(rl, question, options) {
  return new Promise(resolve => {
    console.log(`  ${c('cyan','?')} ${question}`)
    options.forEach((o, i) => console.log(`    ${c('dim', `${i+1}.`)} ${o}`))
    rl.question(`  ${c('cyan','>')} Choice (1-${options.length}): `, ans => {
      const idx = parseInt(ans) - 1
      resolve(options[Math.max(0, Math.min(options.length-1, isNaN(idx) ? 0 : idx))])
    })
  })
}

// ── Banner ────────────────────────────────────────────────────────────────────
function banner() {
  console.log()
  console.log(c('cyan', '  ██████╗  █████╗  ██████╗ ███████╗'))
  console.log(c('cyan', '  ██╔══██╗██╔══██╗██╔════╝ ██╔════╝'))
  console.log(c('cyan', '  ██████╔╝███████║██║  ███╗█████╗  '))
  console.log(c('cyan', '  ██╔═══╝ ██╔══██║██║   ██║██╔══╝  '))
  console.log(c('cyan', '  ██║     ██║  ██║╚██████╔╝███████╗'))
  console.log(c('cyan', '  ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝'))
  console.log()
  console.log(c('bold','  PageCraft CLI') + c('dim', `  v${PKG.version}`))
  console.log(c('dim','  The next-generation website builder'))
  console.log()
}

// ── Commands ──────────────────────────────────────────────────────────────────

// help
function cmdHelp() {
  banner()
  console.log(c('bold','  USAGE'))
  console.log(c('dim','  ─────────────────────────────────────────'))
  const cmds = [
    ['init',             'Interactive project setup wizard'],
    ['serve',            'Start the PageCraft dev server'],
    ['status',           'Show server health & active rooms'],
    ['export [output]',  'Export builder.html → dist/index.html'],
    ['deploy',           'Build & prepare production output'],
    ['keys list',        'List all API keys'],
    ['keys create',      'Interactive API key creation'],
    ['keys revoke <key>','Revoke an API key'],
    ['rooms',            'List active collaboration rooms'],
    ['room <id>',        'Get full state of a room'],
    ['help',             'Show this help message'],
  ]
  cmds.forEach(([cmd, desc]) => {
    console.log(`  ${c('cyan', ('node cli.js ' + cmd).padEnd(34))} ${c('dim', desc)}`)
  })
  console.log()
}

// init
async function cmdInit() {
  banner()
  hdr('  🚀 Project Setup Wizard')
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const name    = await prompt(rl, 'Project name', 'My PageCraft Site')
  const desc    = await prompt(rl, 'Description',  'A modern website built with PageCraft')
  const author  = await prompt(rl, 'Author',        process.env.USERNAME || 'Developer')
  const port    = await prompt(rl, 'Dev server port', '3000')
  const apiKey  = await prompt(rl, 'API key (leave blank to auto-detect)', '')

  sep()

  // Resolve API key
  let resolvedKey = apiKey
  if (!resolvedKey) {
    const keys = loadKeys()
    const firstKey = Object.keys(keys)[0]
    if (firstKey) { resolvedKey = firstKey; inf('Using existing API key from server') }
    else warn('No API key found — run `node cli.js keys create` after starting the server')
  }

  const cfg = { name, description: desc, author, port: Number(port), apiKey: resolvedKey,
                created: new Date().toISOString() }
  saveCfg(cfg)

  // Update package.json name
  PKG.description = desc
  fs.writeFileSync(path.join(ROOT, 'package.json'), JSON.stringify(PKG, null, 2))

  sep()
  ok(`Config saved → ${c('dim', CFG_FILE)}`)
  ok(`Project name: ${c('bold', name)}`)
  ok(`Author: ${c('bold', author)}`)
  ok(`Dev port: ${c('bold', String(port))}`)
  if (resolvedKey) ok(`API key: ${c('dim', resolvedKey.slice(0,12) + '…')}`)

  console.log()
  inf(`Next step: ${c('bold', 'node cli.js serve')} to start the dev server`)
  rl.close()
}

// serve
function cmdServe() {
  banner()
  hdr('  🌐 Starting Dev Server')
  const cfg  = loadCfg()
  const port = cfg.port || DEFAULT_PORT
  inf(`Starting server on port ${c('bold', String(port))}…`)
  inf(`Builder:  ${c('cyan', `http://localhost:${port}/builder.html`)}`)
  inf(`Health:   ${c('cyan', `http://localhost:${port}/health`)}`)
  inf(`API:      ${c('cyan', `http://localhost:${port}/api/v1`)}`)
  sep()
  const child = spawn('node', ['server.js'], {
    stdio: 'inherit', env: { ...process.env, PORT: String(port) }
  })
  child.on('error', e => err('Failed to start server: ' + e.message))
  child.on('exit', code => { if (code !== 0) err('Server exited with code ' + code) })
}

// status
async function cmdStatus() {
  banner()
  hdr('  📊 Server Status')
  try {
    const res = await apiReq('GET', '/../../health', null, '')
    // Fallback: direct health endpoint
    const r2 = await new Promise((resolve, reject) => {
      http.get(`${BASE_URL}/health`, res => {
        let d = ''; res.on('data', c => d += c)
        res.on('end', () => resolve(JSON.parse(d)))
      }).on('error', reject)
    })
    ok(`Status:   ${c('green', r2.status || 'ok')}`)
    ok(`Rooms:    ${c('bold', String(r2.rooms))} active`)
    ok(`Users:    ${c('bold', String(r2.users))} connected`)
    ok(`API Keys: ${c('bold', String(r2.apiKeys || '?'))}`)
    ok(`Uptime:   ${c('bold', Math.floor(r2.uptime/60) + 'm ' + (r2.uptime%60) + 's')}`)
  } catch {
    err(`Server not running at ${c('dim', BASE_URL)}`)
    inf(`Start it with: ${c('bold', 'node cli.js serve')}`)
  }
  console.log()
}

// export
function cmdExport(outputName) {
  banner()
  hdr('  📦 Export Project')
  const src  = path.join(ROOT, 'builder.html')
  const dist = path.join(ROOT, 'dist')
  const out  = outputName || 'index.html'
  const dest = path.join(dist, out)

  if (!fs.existsSync(src)) return err('builder.html not found')
  if (!fs.existsSync(dist)) fs.mkdirSync(dist, { recursive: true })

  fs.copyFileSync(src, dest)
  const size = (fs.statSync(dest).size / 1024).toFixed(1)

  ok(`Exported: ${c('cyan', dest)}`)
  ok(`Size:     ${c('bold', size + ' KB')}`)
  inf(`Open:     ${c('dim', 'file://' + dest)}`)
  console.log()
}

// deploy
function cmdDeploy() {
  banner()
  hdr('  🚀 Deploy to dist/')
  inf('Running build pipeline…')
  try {
    execSync('node build.js', { stdio: 'inherit', cwd: ROOT })
    ok('Build complete')
    cmdExport('index.html')
    sep()
    ok(c('green', c('bold', 'Deploy ready! Serve the dist/ folder.')))
    inf('Preview: npx serve dist')
  } catch (e) {
    err('Build failed: ' + e.message)
  }
}

// keys list
async function cmdKeysList() {
  banner()
  hdr('  🔑 API Keys')
  // Load from file directly (no server call needed)
  const keys = loadKeys()
  const entries = Object.entries(keys)
  if (!entries.length) { warn('No API keys found. Create one with: node cli.js keys create'); return }

  inf(`Found ${c('bold', String(entries.length))} key(s):\n`)
  entries.forEach(([k, meta]) => {
    const status = meta.revoked ? c('red','revoked') : c('green','active')
    const perm   = { read: c('cyan','read'), write: c('yellow','write'), admin: c('magenta','admin') }[meta.permission] || meta.permission
    console.log(`  ${c('bold', meta.name)}`)
    console.log(`  ${c('dim', k.slice(0,16) + '…' + k.slice(-4))}`)
    console.log(`  Status: ${status}  Permission: ${perm}  Requests: ${c('bold', String(meta.requests||0))}`)
    console.log(`  Created: ${c('dim', meta.created?.slice(0,10) || '?')}  Last used: ${c('dim', meta.lastUsed?.slice(0,10) || 'never')}`)
    sep()
  })
}

// keys create
async function cmdKeysCreate() {
  banner()
  hdr('  🔑 Create API Key')
  const rl   = readline.createInterface({ input: process.stdin, output: process.stdout })
  const name = await prompt(rl, 'Key name', 'My App')
  const perm = await promptSelect(rl, 'Permission level', ['read', 'write', 'admin'])
  const exp  = await promptSelect(rl, 'Expiry', ['Never', '7 days', '30 days', '90 days', '1 year'])

  const expDays = { 'Never':0,'7 days':7,'30 days':30,'90 days':90,'1 year':365 }[exp] || 0
  const expiry  = expDays > 0 ? new Date(Date.now() + expDays*86400000).toISOString() : null

  // Generate key
  const key = 'pc_' + [...Array(48)].map(() => Math.floor(Math.random()*16).toString(16)).join('')

  // Save to local keys file
  const keys = loadKeys()
  keys[key] = { name, permission: perm, expiry, created: new Date().toISOString(), requests: 0, revoked: false }
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2))

  // Try to register with server
  try {
    await apiReq('POST', '/keys', { key, name, permission: perm, expiry }, key)
  } catch { warn('Server not running — key saved locally only') }

  sep()
  ok(`Key created: ${c('bold', name)}`)
  ok(`Permission:  ${c('cyan', perm)}`)
  ok(`Expiry:      ${exp}`)
  console.log()
  console.log(`  ${c('bold', c('yellow', '  Your API Key (copy it now — not shown again):'))}`)
  console.log()
  console.log(`  ${c('bgBlue', c('white', c('bold', '  ' + key + '  ')))}`)
  console.log()
  inf('Add to requests: ' + c('dim', 'X-API-Key: ' + key))
  rl.close()
}

// keys revoke
async function cmdKeysRevoke(keyArg) {
  banner()
  hdr('  🚫 Revoke API Key')
  let key = keyArg
  if (!key) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    key = await prompt(rl, 'Enter key to revoke')
    rl.close()
  }
  const keys = loadKeys()
  if (!keys[key]) return err('Key not found')
  keys[key].revoked = true
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2))
  ok(`Key revoked: ${c('dim', key.slice(0,16) + '…')}`)

  try {
    const cfg = loadCfg()
    await apiReq('DELETE', `/keys/${key}`, null, cfg.apiKey)
    ok('Key also revoked on server')
  } catch { warn('Server not running — revoked locally only') }
  console.log()
}

// rooms
async function cmdRooms() {
  banner()
  hdr('  👥 Active Rooms')
  try {
    const r = await apiReq('GET', '/rooms')
    if (!r.body.rooms?.length) { inf('No active rooms'); return }
    r.body.rooms.forEach(room => {
      console.log(`  ${c('bold', room.id)}`)
      console.log(`  Title: ${room.title}  Users: ${c('cyan', String(room.users))}  Sections: ${c('bold', String(room.sections))}`)
      sep()
    })
  } catch { err('Server not running or API key missing') }
}

// room <id>
async function cmdRoom(roomId) {
  if (!roomId) return err('Usage: node cli.js room <roomId>')
  banner()
  hdr(`  🏠 Room: ${roomId}`)
  try {
    const r = await apiReq('GET', `/rooms/${roomId}`)
    if (r.status === 404) return err('Room not found')
    const { title, sections, users } = r.body
    ok(`Title:    ${c('bold', title)}`)
    ok(`Sections: ${c('bold', String(sections?.length || 0))}`)
    ok(`Users:    ${c('bold', String(users?.length || 0))}`)
    if (sections?.length) {
      sep()
      inf('Sections:')
      sections.forEach((s, i) => console.log(`  ${c('dim', String(i+1).padStart(2,'0'))}. ${c('cyan', s.type.padEnd(16))} ${c('dim', s.id)}`))
    }
  } catch { err('Server not running or API key missing') }
  console.log()
}

// ── Main dispatcher ───────────────────────────────────────────────────────────
async function main() {
  const [,, cmd, ...args] = process.argv

  switch (cmd) {
    case 'init':          await cmdInit();           break
    case 'serve':         cmdServe();                break
    case 'status':        await cmdStatus();         break
    case 'export':        cmdExport(args[0]);        break
    case 'deploy':        cmdDeploy();               break
    case 'rooms':         await cmdRooms();          break
    case 'room':          await cmdRoom(args[0]);    break
    case 'keys':
      if (args[0] === 'list')         await cmdKeysList()
      else if (args[0] === 'create')  await cmdKeysCreate()
      else if (args[0] === 'revoke')  await cmdKeysRevoke(args[1])
      else { warn('Unknown keys subcommand'); cmdHelp() }
      break
    case 'help':
    case '--help':
    case '-h':
    case undefined:       cmdHelp(); break
    default:
      err(`Unknown command: ${c('bold', cmd)}`)
      inf(`Run ${c('bold','node cli.js help')} for usage`)
      process.exit(1)
  }
}

main().catch(e => { err(e.message); process.exit(1) })
