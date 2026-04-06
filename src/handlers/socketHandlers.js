'use strict'
/**
 * PageCraft — Socket.io Event Handlers
 * Stage 1: Foundation — all socket logic extracted into one module
 */
const rooms = require('../services/roomService')

/**
 * registerSocketHandlers(io)
 * Attaches all Socket.io event handlers to the io instance.
 */
function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentRoom = null

    // ── join ───────────────────────────────────────────────────────────────
    socket.on('join', ({ roomId, user = {} }) => {
      // Leave previous room
      if (currentRoom) {
        socket.leave(currentRoom)
        const prev = rooms.removeUser(currentRoom, socket.id)
        if (prev) {
          io.to(currentRoom).emit('room:users', { users: rooms.users(prev) })
          if (prev.users.size === 0) rooms.scheduleCleanup(currentRoom, io)
        }
      }

      currentRoom = roomId
      socket.join(roomId)

      const room = rooms.addUser(roomId, socket.id, user)

      socket.emit('room:joined', {
        state: { sections: room.sections, title: room.title },
        users: rooms.users(room),
        you  : socket.id,
      })

      socket.to(roomId).emit('room:users', { users: rooms.users(room) })
      console.log(`[room:${roomId}] +join  ${room.users.size} user(s)  socket=${socket.id}`)
    })

    // ── section:add ────────────────────────────────────────────────────────
    socket.on('section:add', ({ roomId, section, index }) => {
      rooms.addSection(roomId, section, index)
      socket.to(roomId).emit('section:add', { section, index, fromUser: socket.id })
    })

    // ── section:remove ─────────────────────────────────────────────────────
    socket.on('section:remove', ({ roomId, sectionId }) => {
      rooms.removeSection(roomId, sectionId)
      socket.to(roomId).emit('section:remove', { sectionId, fromUser: socket.id })
    })

    // ── section:update ─────────────────────────────────────────────────────
    socket.on('section:update', ({ roomId, sectionId, key, value }) => {
      rooms.updateSection(roomId, sectionId, key, value)
      socket.to(roomId).emit('section:update', { sectionId, key, value, fromUser: socket.id })
    })

    // ── section:move ───────────────────────────────────────────────────────
    socket.on('section:move', ({ roomId, fromIdx, toIdx }) => {
      rooms.moveSection(roomId, fromIdx, toIdx)
      socket.to(roomId).emit('section:move', { fromIdx, toIdx, fromUser: socket.id })
    })

    // ── section:dup ────────────────────────────────────────────────────────
    socket.on('section:dup', ({ roomId, sectionId, newSection, insertIdx }) => {
      rooms.dupSection(roomId, newSection, insertIdx)
      socket.to(roomId).emit('section:dup', { sectionId, newSection, insertIdx, fromUser: socket.id })
    })

    // ── page:title ─────────────────────────────────────────────────────────
    socket.on('page:title', ({ roomId, title }) => {
      rooms.setTitle(roomId, title)
      socket.to(roomId).emit('page:title', { title, fromUser: socket.id })
    })

    // ── cursor:move (lightweight presence) ────────────────────────────────
    socket.on('cursor:move', ({ roomId, x, y }) => {
      socket.to(roomId).emit('cursor:move', { socketId: socket.id, x, y })
    })

    // ── disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      if (!currentRoom) return
      const room = rooms.removeUser(currentRoom, socket.id)
      if (room) {
        io.to(currentRoom).emit('room:users', { users: rooms.users(room) })
        if (room.users.size === 0) rooms.scheduleCleanup(currentRoom, io)
      }
      console.log(`[room:${currentRoom}] -leave  socket=${socket.id}  reason=${reason}`)
    })
  })
}

module.exports = { registerSocketHandlers }
