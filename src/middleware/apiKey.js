'use strict'
/**
 * PageCraft — API Key Middleware
 * Stage 1: Foundation — extracted as reusable middleware
 */
const keyStore = require('../services/keyStore')

/**
 * requireApiKey(minPerm)
 * Express middleware — validates X-API-Key header or ?api_key query param.
 * Attaches req.apiKey = { key, ...meta } on success.
 */
function requireApiKey(minPerm = 'read') {
  return (req, res, next) => {
    const key = req.headers['x-api-key'] || req.query.api_key
    if (!key) {
      return res.status(401).json({ error: 'Missing X-API-Key header' })
    }
    const result = keyStore.validate(key, minPerm)
    if (!result.ok) {
      const status = result.reason === 'Invalid API key' ? 403 : 403
      return res.status(status).json({ error: result.reason })
    }
    req.apiKey = result.meta
    next()
  }
}

module.exports = { requireApiKey }
