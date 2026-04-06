'use strict'
/**
 * PageCraft — API Key Store Service
 * Stage 1: Foundation — file-backed key persistence as a proper service
 */
const fs   = require('fs')
const cfg  = require('../config')

const PERMS = { read: 0, write: 1, admin: 2 }

function load() {
  try { return JSON.parse(fs.readFileSync(cfg.keys.file, 'utf8')) }
  catch { return {} }
}

function save(keys) {
  try { fs.writeFileSync(cfg.keys.file, JSON.stringify(keys, null, 2)) }
  catch (e) { console.error('[keyStore] save failed:', e.message) }
}

function seed() {
  const keys = load()
  if (Object.keys(keys).length) return keys
  const devKey = 'pc_dev_' + Math.random().toString(36).slice(2, 18)
  keys[devKey] = {
    name      : 'Dev Key',
    permission: 'admin',
    created   : new Date().toISOString(),
    requests  : 0,
    revoked   : false,
  }
  save(keys)
  if (cfg.isDev) console.log('\n  🔑 Dev API key:', devKey, '\n')
  return keys
}

function validate(key, minPerm = 'read') {
  const keys = load()
  const meta = keys[key]
  if (!meta)                return { ok: false, reason: 'Invalid API key' }
  if (meta.revoked)         return { ok: false, reason: 'Key has been revoked' }
  if (meta.expiry && new Date(meta.expiry) < new Date())
                            return { ok: false, reason: 'Key has expired' }
  if (PERMS[meta.permission] < PERMS[minPerm])
                            return { ok: false, reason: `Requires '${minPerm}' permission` }
  // Track usage
  meta.requests = (meta.requests || 0) + 1
  meta.lastUsed = new Date().toISOString()
  save(keys)
  return { ok: true, meta: { key, ...meta } }
}

function register({ key, name, permission = 'read', expiry = null }) {
  if (!key || !name) throw new Error('key and name are required')
  const keys = load()
  keys[key] = {
    name, permission, expiry,
    created : new Date().toISOString(),
    requests: 0,
    revoked : false,
  }
  save(keys)
}

function revoke(key) {
  const keys = load()
  if (keys[key]) { keys[key].revoked = true; save(keys) }
}

function count() { return Object.keys(load()).length }

module.exports = { load, save, seed, validate, register, revoke, count }
