/* Copyright 2026 Tutorializer LLC */
const localStorage = require('./localStorage.js')

module.exports = function getRefreshToken() {
  return localStorage.getItem('refreshToken')
}
