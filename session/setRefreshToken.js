/* Copyright 2026 Tutorializer LLC */
const localStorage = require('./localStorage.js')

module.exports = function setRefreshToken(refreshToken) {
  return localStorage.setItem('refreshToken', refreshToken)
}
