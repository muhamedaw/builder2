'use strict'
/**
 * PageCraft — Room Service
 * Stage 1: Foundation — room state management extracted as a pure service
 */
const cfg = require('../config')

const USER_COLORS = [
  '#6c63ff','#10b981','#f59e0b','#ec4899',
  '#0ea5e9','#8b5cf6','#ef4444','#14b8a6',
]
let _colorIdx = 0

// Map<roomId, { sections:[], title:string, users:Map<socketId,User> }>
const rooms = new Map()

function get(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { sections: [], title: 'My Page', users: new Map() })
  }
  return rooms.get(roomId)
}

function users(room) {
  return Array.from(room.users.values())
}

function addUser(roomId, socketId, userInfo = {}) {
  const room  = get(roomId)
  const color = USER_COLORS[_colorIdx++ % USER_COLORS.length]
  room.users.set(socketId, {
    socketId,
    name  : String(userInfo.name || `Guest-${socketId.slice(0, 4)}`).slice(0, 32),
    color,
    avatar: userInfo.avatar || null,
  })
  return room
}

function removeUser(roomId, socketId) {
  const room = rooms.get(roomId)
  if (!room) return null
  room.users.delete(socketId)
  return room
}

function scheduleCleanup(roomId, io) {
  setTimeout(() => {
    const r = rooms.get(roomId)
    if (r && r.users.size === 0) {
      rooms.delete(roomId)
      console.log(`[room:${roomId}] cleaned up (idle)`)
    }
  }, cfg.room.cleanupDelayMs)
}

function addSection(roomId, section, index) {
  const room = get(roomId)
  if (room.sections.length >= cfg.room.maxSections) return false
  if (typeof index === 'number' && index >= 0 && index <= room.sections.length) {
    room.sections.splice(index, 0, section)
  } else {
    room.sections.push(section)
  }
  return true
}

function removeSection(roomId, sectionId) {
  const room = rooms.get(roomId)
  if (!room) return false
  room.sections = room.sections.filter(s => s.id !== sectionId)
  return true
}

function updateSection(roomId, sectionId, key, value) {
  const room = rooms.get(roomId)
  if (!room) return false
  const sec = room.sections.find(s => s.id === sectionId)
  if (sec) sec.props[key] = value
  return !!sec
}

function moveSection(roomId, fromIdx, toIdx) {
  const room = rooms.get(roomId)
  if (!room) return false
  const len = room.sections.length
  if (fromIdx < 0 || toIdx < 0 || fromIdx >= len || toIdx >= len) return false
  const [sec] = room.sections.splice(fromIdx, 1)
  room.sections.splice(toIdx, 0, sec)
  return true
}

function dupSection(roomId, newSection, insertIdx) {
  const room = rooms.get(roomId)
  if (!room) return false
  if (typeof insertIdx === 'number') room.sections.splice(insertIdx, 0, newSection)
  else room.sections.push(newSection)
  return true
}

function setTitle(roomId, title) {
  const room = rooms.get(roomId)
  if (!room) return false
  room.title = String(title || '').slice(0, cfg.room.maxTitleLen)
  return true
}

function getState(roomId) {
  const room = rooms.get(roomId)
  if (!room) return null
  return { sections: room.sections, title: room.title, users: users(room) }
}

function listRooms() {
  return Array.from(rooms.entries()).map(([id, r]) => ({
    id,
    title   : r.title,
    users   : r.users.size,
    sections: r.sections.length,
  }))
}

function totalUsers() {
  return Array.from(rooms.values()).reduce((n, r) => n + r.users.size, 0)
}

module.exports = {
  get, users, addUser, removeUser, scheduleCleanup,
  addSection, removeSection, updateSection, moveSection, dupSection,
  setTitle, getState, listRooms, totalUsers,
  roomCount: () => rooms.size,
}
