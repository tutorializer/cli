/* Copyright 2026 Tutorializer LLC */

const {
  setAccessTokenForTutorializerClient,
  setAccessTokenCallbackForTutorializerClient,
} = require('@tutorializer/client/accessToken.js')
const {
  setRefreshTokenForTutorializerClient,
} = require('@tutorializer/client/refreshToken.js')
const localStorage = require('./localStorage.js')

module.exports = function clearSession() {
  localStorage.clear()

  setAccessTokenCallbackForTutorializerClient(null)

  setAccessTokenForTutorializerClient(null)
  setRefreshTokenForTutorializerClient(null)
}
