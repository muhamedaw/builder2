'use strict'
/**
 * PageCraft — REST API Routes v1
 * Stage 1: Foundation — all API routes in one module
 */
const express  = require('express')
const keyStore = require('../services/keyStore')
const rooms    = require('../services/roomService')
const { requireApiKey } = require('../middleware/apiKey')

/**
 * createApiRouter(io)
 * Returns an express.Router with all /api/v1 routes.
 * `io` is the Socket.io Server instance for broadcasting.
 */
function createApiRouter(io) {
  const api = express.Router()

  // ── Key management ──────────────────────────────────────────────────────────

  // Validate key
  api.get('/keys/validate', requireApiKey('read'), (req, res) => {
    const { key, ...meta } = req.apiKey
    res.json({ valid: true, ...meta })
  })

  // Register a key from the builder UI
  api.post('/keys', (req, res) => {
    const { key, name, permission, expiry } = req.body || {}
    try {
      keyStore.register({ key, name, permission, expiry })
      res.json({ ok: true })
    } catch (e) {
      res.status(400).json({ error: e.message })
    }
  })

  // Revoke a key
  api.delete('/keys/:key', requireApiKey('admin'), (req, res) => {
    keyStore.revoke(req.params.key)
    res.json({ ok: true })
  })

  // ── Room management ─────────────────────────────────────────────────────────

  // List rooms
  api.get('/rooms', requireApiKey('read'), (_req, res) => {
    res.json({ rooms: rooms.listRooms() })
  })

  // Get room state
  api.get('/rooms/:roomId', requireApiKey('read'), (req, res) => {
    const state = rooms.getState(req.params.roomId)
    if (!state) return res.status(404).json({ error: 'Room not found' })
    res.json(state)
  })

  // Add section to room
  api.post('/rooms/:roomId/sections', requireApiKey('write'), (req, res) => {
    const { type, props, index } = req.body || {}
    if (!type) return res.status(400).json({ error: 'type is required' })
    const section = { id: 's' + Date.now() + '_api', type, props: props || {} }
    const ok = rooms.addSection(req.params.roomId, section, index)
    if (!ok) return res.status(409).json({ error: 'Room section limit reached' })
    io.to(req.params.roomId).emit('section:add', { section, index, fromUser: 'api' })
    res.json({ ok: true, section })
  })

  // Remove section from room
  api.delete('/rooms/:roomId/sections/:sectionId', requireApiKey('write'), (req, res) => {
    const ok = rooms.removeSection(req.params.roomId, req.params.sectionId)
    if (!ok) return res.status(404).json({ error: 'Room not found' })
    io.to(req.params.roomId).emit('section:remove', { sectionId: req.params.sectionId, fromUser: 'api' })
    res.json({ ok: true })
  })

  // Update room title
  api.put('/rooms/:roomId/title', requireApiKey('write'), (req, res) => {
    const ok = rooms.setTitle(req.params.roomId, req.body?.title)
    if (!ok) return res.status(404).json({ error: 'Room not found' })
    const state = rooms.getState(req.params.roomId)
    io.to(req.params.roomId).emit('page:title', { title: state.title, fromUser: 'api' })
    res.json({ ok: true, title: state.title })
  })

  return api
}

module.exports = { createApiRouter }
