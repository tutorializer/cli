/* Copyright 2026 Tutorializer LLC */
const {
  isRefreshTokenExpired,
} = require('@tutorializer/client/refreshToken.js')
const clearSession = require('./clearSession.js')

module.exports = function isLoggedInSession() {
  let isLoggedIn = false

  if (!isRefreshTokenExpired()) {
    isLoggedIn = true
  }

  if (!isLoggedIn) {
    clearSession()
  }

  return isLoggedIn
}
