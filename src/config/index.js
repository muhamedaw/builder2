'use strict'
/**
 * PageCraft — Centralized Configuration
 * Stage 1: Foundation — all config in one place, env-driven
 */
const path = require('path')

module.exports = {
  // ── Server ──
  port      : parseInt(process.env.PORT || '3000', 10),
  env       : process.env.NODE_ENV || 'development',
  isDev     : (process.env.NODE_ENV || 'development') === 'development',

  // ── CORS ──
  cors: {
    origin : process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },

  // ── Socket.io ──
  socket: {
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '10000', 10),
    pingTimeout : parseInt(process.env.SOCKET_PING_TIMEOUT  || '5000',  10),
  },

  // ── Rooms ──
  room: {
    cleanupDelayMs: parseInt(process.env.ROOM_CLEANUP_DELAY_MS || String(30 * 60 * 1000), 10),
    maxSections   : parseInt(process.env.ROOM_MAX_SECTIONS     || '500', 10),
    maxTitleLen   : 120,
  },

  // ── API Keys ──
  keys: {
    file: path.resolve(process.env.KEYS_FILE || path.join(__dirname, '../../.api-keys.json')),
  },

  // ── Static files ──
  static: {
    root: path.resolve(process.env.STATIC_ROOT || path.join(__dirname, '../..')),
  },

  // ── Rate Limiting (future) ──
  rateLimit: {
    windowMs: 60_000,
    maxReq  : parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
  },

  // ── Version ──
  version: require('../../package.json').version || '1.0.0',
}
