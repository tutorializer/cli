/* Copyright 2026 Tutorializer LLC */
const localStorage = require('./localStorage.js')

module.exports = function getAccessToken() {
  return localStorage.getItem('accessToken')
}
