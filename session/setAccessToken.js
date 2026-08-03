/* Copyright 2026 Tutorializer LLC */
const localStorage = require('./localStorage.js')

module.exports = function setAccessToken(accessToken) {
  return localStorage.setItem('accessToken', accessToken)
}
